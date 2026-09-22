# subShare

**Hyper-local subscription co-management marketplace for university students.**
Share streaming slots (Netflix, Prime, …) without ever sharing passwords — session
tokens are encrypted by a Chrome extension and injected on the buyer's side.

```
┌─────────────┐   JWT cookie    ┌──────────────────┐   Prisma   ┌────────────┐
│  apps/web   │ ──────────────► │   apps/server    │ ─────────► │ PostgreSQL │
│  Next.js 14 │                 │  Express + zod   │            │            │
└─────────────┘                 │  Razorpay webhook│            └────────────┘
                                └────────▲─────────┘
                                         │ HTTPS + Bearer
                        encrypt/decrypt  │  (AES-256-GCM in extension)
                                 ┌───────┴────────┐
                                 │ apps/extension │  Chrome MV3
                                 │ cookies in/out │
                                 └────────────────┘
        packages/shared → types, business constants, zod contracts (used by all)
```

## Monorepo layout (npm workspaces)

| Path                | What it is |
|---------------------|------------|
| `apps/web`          | Next.js 14 App Router + Tailwind. Landing, auth portal, marketplace grid, buyer + owner dashboards. |
| `apps/server`       | Express API. Auth (JWT HttpOnly cookies), subscriptions, slots, Razorpay orders + webhook. |
| `apps/extension`    | Chrome Manifest V3. Extracts platform cookies, encrypts locally (WebCrypto AES-GCM), injects for buyers. |
| `packages/shared`   | DTO types, pricing constants, zod schemas shared across all apps. |

## Quickstart

```bash
npm install

# 1. Database — either Docker...
docker compose up -d db           # postgres on :5432
# ...or point DATABASE_URL at your own Postgres.
# (This repo was developed against a local Postgres 18 on :5433 — see apps/server/.env)

# 2. Configure the API
cp apps/server/.env.example apps/server/.env      # then edit values
# Generate a real secret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Migrate + seed
npm run db:migrate --workspace apps/server # or: npx prisma migrate dev -w? see below
npm run db:seed                            # demo owner/buyer + Netflix listing

# 4. Run (two terminals)
npm run dev:server        # http://localhost:4000
npm run dev:web           # http://localhost:3000
```

### Chrome extension

```bash
npm run build:extension
```

1. Open `chrome://extensions`, enable **Developer mode**, **Load unpacked** →
   select `apps/extension/dist`.
2. Click the extension's **Settings** and confirm the API base / web origin
   (defaults: `http://localhost:4000/api/v1`, `http://localhost:3000`).
3. Log into the web app once — the extension reads the HttpOnly JWT via
   `chrome.cookies` and forwards it as a Bearer token.

**Owner flow:** log into the streaming site in Chrome → extension → pick listing →
*Encrypt & sync session*. Cookies are AES-256-GCM encrypted before upload;
the password is never read.

**Buyer flow:** buy a slot → *Launch via Extension* on My Slots → extension popup →
*Launch latest request*. The blob is decrypted locally, cookies are injected with
`chrome.cookies.set`, and a tab opens already logged in.

## Business rules

- Buyer premium is fixed at **₹199/slot/month** (`BUYER_PREMIUM_PER_SLOT_INR`).
- Owners keep **88%**, platform fee **12%** (`computeSplit` in shared).
- A slot becomes `ACTIVE` **only** when the signed Razorpay webhook
  (`payment.captured` / `order.paid`) arrives — never from the client callback.
- Slots auto-expire: an hourly sweeper flips `ACTIVE` slots past `expires_at`
  to `EXPIRED`.

## Security model & edge cases handled

| Edge case | Handling |
|-----------|----------|
| Password sharing | Never possible — only encrypted session tokens move. |
| DB leak | Session blobs are ciphertext; keys are separate columns, delivered only to the slot's active buyer over TLS. *(Upgrade path: per-buyer ECDH so the server never holds plaintext-equivalent material.)* |
| Two buyers pay simultaneously | Slot claim uses a conditional `updateMany` inside webhook processing; loser gets flagged `NEEDS_REFUND`. |
| Webhook replay | Idempotent — captured payments short-circuit. |
| Forged webhooks | HMAC-SHA256 over the raw body vs `x-razorpay-signature`, compared with `timingSafeEqual`. Raw body parsed before the JSON parser. |
| Razorpay outage at checkout | Order creation failures return a clean 409, not a 500. |
| Owner never syncs a session | Marketplace hides unsynced listings; buyer card shows "owner hasn't synced yet". Launch disabled. |
| Stale sessions | Listings/dashboards flag sessions older than 7 days. |
| Expired slots | Hourly sweeper + guard checks on every session fetch. |
| Non-university emails | Rejected at signup by suffix allow-list (`.ac.in`, `.edu`). |
| Unverified accounts | Login blocked (`EMAIL_UNVERIFIED`) until token verification. Dev mode surfaces the link; production should mail it. |
| Enumeration attacks | Signup/login return generic messages; owner names masked on the marketplace ("Aarav S."). |
| XSS / injection | No `dangerouslySetInnerHTML`; all input validated with zod; Prisma parameterizes everything. |
| Stray async crashes | `unhandledRejection` logger keeps the API alive; graceful SIGINT/SIGTERM shutdown. |

## Scripts

```bash
npm run typecheck         # tsc --noEmit in every workspace
npm run build:extension   # compile TS + copy manifest/popup.html to dist/
npm run build -w apps/web # next build
npm run db:migrate        # prisma migrate dev
npm run db:seed           # seed demo data
```

Demo accounts after seeding (password `Password123!`):
`aarav@iitb.ac.in` (owner) · `diya@iitd.ac.in` (buyer).

## Known MVP limitations / roadmap

- Verification email is console-logged in dev — wire Nodemailer/Resend for prod.
- Razorpay runs in test mode; add settlement/payout tracking for owners.
- Extension key exchange is server-brokered symmetric keys; move to ECDH for E2E.
- No ratings engine yet (`rating` field exists but isn't recomputed).
