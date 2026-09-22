import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck, Zap, Lock } from "lucide-react";
import { AUTH_COOKIE_NAME, BUYER_PREMIUM_PER_SLOT_INR, PLATFORM_FEE_PERCENT } from "@subshare/shared";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Lock,
    step: "01",
    title: "Owner syncs once",
    body: "Log into your streaming account as usual. The subShare extension encrypts the session token and uploads it — your password never leaves your machine.",
  },
  {
    icon: Zap,
    step: "02",
    title: "Buyers rent a slot",
    body: `Verified students browse the marketplace and pay a flat ₹${BUYER_PREMIUM_PER_SLOT_INR}/month per screen through Razorpay. Instantly.`,
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Launch without passwords",
    body: "The buyer's extension decrypts the session locally and injects it into the browser. One click, logged in — no credentials shared.",
  },
];

const platforms = ["Netflix", "Prime", "Hotstar", "Spotify", "YouTube Premium"];

export default async function LandingPage() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (token) redirect("/marketplace");

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div
          className="orb h-[500px] w-[500px] animate-float"
          style={{
            background: "radial-gradient(circle, #e50914 0%, transparent 70%)",
            top: "-150px",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: 0.12,
          }}
        />
        <div
          className="orb h-[300px] w-[300px]"
          style={{
            background: "radial-gradient(circle, #ff6b35 0%, transparent 70%)",
            top: "100px",
            right: "5%",
            opacity: 0.08,
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 text-center">
          {/* Trust badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
            style={{
              background: "rgba(229,9,20,0.08)",
              color: "#ff6b6b",
              border: "1px solid rgba(229,9,20,0.2)",
            }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            For verified .ac.in &amp; .edu students only
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-in-up-1 mx-auto mt-8 max-w-4xl text-5xl font-extrabold tracking-tight leading-tight sm:text-6xl lg:text-7xl"
            style={{ color: "var(--text-primary)" }}
          >
            Share subscription slots.
            <br />
            <span className="gradient-text">Never share passwords.</span>
          </h1>

          {/* Subtext */}
          <p
            className="animate-fade-in-up-2 mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            subShare lets students split Netflix, Prime and more using{" "}
            <strong style={{ color: "var(--text-primary)" }}>AES-256-GCM encrypted</strong> session
            tokens delivered by our Chrome extension — not passwords.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up-3 mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="min-w-[140px]">Create account</Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="secondary" className="min-w-[160px]">
                Browse marketplace
              </Button>
            </Link>
          </div>

          {/* Platform strip */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 animate-fade-in-up-3">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            How it works
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
            Three steps, zero passwords exchanged
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className={`glass rounded-2xl p-6 transition-all duration-300 hover:shadow-glow-red animate-fade-in-up-${i + 1}`}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-glow-sm"
                    style={{ background: "linear-gradient(135deg,#e50914,#ff6b35)" }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-5xl font-black" style={{ color: "var(--surface-3)" }}>
                    {s.step}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {s.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Trust stats bar ── */}
      <section className="border-y" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {[
              { label: "Owner payout",    value: `${100 - PLATFORM_FEE_PERCENT}%` },
              { label: "Price per slot",  value: `₹${BUYER_PREMIUM_PER_SLOT_INR}/mo` },
              { label: "Encryption",      value: "AES-256-GCM" },
              { label: "Passwords shared", value: "Zero" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="gradient-text text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

