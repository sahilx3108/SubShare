import { AUTH_COOKIE_NAME, getSettings } from "./config";

export class ExtApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Auth: the web app sets the JWT as an HttpOnly cookie on its own origin.
 * chrome.cookies can read HttpOnly cookies, so the extension forwards it as
 * a Bearer token — the user never sees or copies it.
 */
export async function authToken(): Promise<string> {
  const { webOrigin } = await getSettings();
  const cookie = await chrome.cookies.get({ url: webOrigin, name: AUTH_COOKIE_NAME });
  if (!cookie) {
    throw new ExtApiError("Not logged in — open the subShare web app and log in first.", 401);
  }
  return cookie.value;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { apiBase } = await getSettings();
  let res: Response;
  try {
    const token = await authToken();
    res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  } catch (e) {
    if (e instanceof ExtApiError) throw e;
    throw new ExtApiError(
      "Cannot reach the subShare API. Is the server running and allowed in manifest host_permissions?",
      0,
    );
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ExtApiError(data.error ?? `Request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}
