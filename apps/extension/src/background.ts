import { platformConfig } from "./config";
import { apiFetch, authToken } from "./api";
import { encryptJson, decryptJson } from "./crypto";
import type { ExtensionMessage, LaunchRequestDto, SessionPayloadDto, WorkerResponse } from "./messages";

interface CookieBlob {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: chrome.cookies.SameSiteStatus;
  expirationDate?: number;
  hostOnly?: boolean;
}

async function pushSession(subscriptionId: string): Promise<void> {
  // 1. Server mints (once) and returns this listing's symmetric key.
  const { session_key: key } = await apiFetch<{ session_key: string }>(
    `/subscriptions/${subscriptionId}/session-key`,
  );

  // 2. Grab every cookie scoped to the platform domain.
  const cfg = await currentPlatformConfig(subscriptionId);
  const cookies = await chrome.cookies.getAll({ domain: cfg.cookieDomain });
  if (cookies.length === 0) {
    throw new Error(
      `No cookies found for ${cfg.cookieDomain}. Log into the platform in this browser first.`,
    );
  }

  const blobs: CookieBlob[] = cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
    expirationDate: c.expirationDate,
    hostOnly: c.hostOnly,
  }));

  // 3. Encrypt locally; the API only ever receives ciphertext.
  const encrypted = await encryptJson(key, { cookies: blobs });

  // 4. Upload.
  await apiFetch(`/subscriptions/${subscriptionId}/session`, {
    method: "PUT",
    body: JSON.stringify({ encrypted_session_data: encrypted }),
  });
}

/** Resolves which platform a subscription belongs to via /subscriptions/mine. */
let subsCache: { id: string; platform_name: string }[] | null = null;

async function currentPlatformConfig(subscriptionId: string) {
  if (!subsCache) {
    const res = await apiFetch<{
      subscriptions: { id: string; platform_name: string }[];
    }>("/subscriptions/mine");
    subsCache = res.subscriptions;
  }
  const sub = subsCache.find((s) => s.id === subscriptionId);
  return platformConfig(sub?.platform_name ?? "");
}

async function setCookie(cookie: CookieBlob, fallbackDomain: string): Promise<void> {
  const domain = cookie.domain || fallbackDomain;
  const bare = domain.replace(/^\./, "");
  const url = `https://${bare}${cookie.path || "/"}`;

  await chrome.cookies.set({
    url,
    name: cookie.name,
    value: cookie.value,
    ...(cookie.hostOnly ? {} : { domain }), // respect host-only cookies
    path: cookie.path || "/",
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    ...(cookie.sameSite ? { sameSite: cookie.sameSite } : {}),
    ...(cookie.expirationDate ? { expirationDate: cookie.expirationDate } : {}),
  });
}

async function launch(): Promise<string> {
  // 1. The web app's "Launch" button flagged a slot for us.
  const request = await apiFetch<LaunchRequestDto>("/slots/launch-request/latest");

  // 2. Pull the encrypted blob + key (server authorizes us as slot owner).
  const payload = await apiFetch<SessionPayloadDto>(`/slots/${request.slot_id}/session`);

  // 3. Decrypt locally and inject.
  const cfg = platformConfig(payload.platform_name);
  const data = await decryptJson<{ cookies: CookieBlob[] }>(
    payload.session_key,
    payload.encrypted_session_data,
  );
  if (!data.cookies?.length) throw new Error("Stored session is empty — ask the owner to re-sync.");

  for (const cookie of data.cookies) {
    await setCookie(cookie, cfg.cookieDomain);
  }

  // 4. Land on the platform, now logged in.
  await chrome.tabs.create({ url: cfg.launchUrl });
  return `${payload.platform_name}: injected ${data.cookies.length} cookies.`;
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse: (r: WorkerResponse) => void) => {
    void (async (): Promise<WorkerResponse> => {
      try {
        switch (message.type) {
          case "CHECK_AUTH":
            await authToken();
            return { ok: true };
          case "PUSH_SESSION":
            await pushSession(message.subscriptionId);
            return { ok: true, message: "Session synced securely." };
          case "LAUNCH": {
            const detail = await launch();
            return { ok: true, message: detail };
          }
        }
      } catch (e) {
        return {
          ok: false,
          message: e instanceof Error ? e.message : "Unknown extension error",
        };
      }
    })();
    return true; // keep the channel open for the async response
  },
);

export {};
