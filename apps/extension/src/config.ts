export interface Settings {
  apiBase: string;
  webOrigin: string;
}

const DEFAULTS: Settings = {
  apiBase: "http://localhost:4000/api/v1",
  webOrigin: "http://localhost:3000",
};

export const AUTH_COOKIE_NAME = "subs_token";

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return stored as Settings;
}

export interface PlatformConfig {
  /** Domain passed to chrome.cookies.getAll / set. */
  cookieDomain: string;
  launchUrl: string;
}

/** Per-platform cookie scope + post-injection landing page. */
export const PLATFORMS: Record<string, PlatformConfig> = {
  Netflix: { cookieDomain: "netflix.com", launchUrl: "https://www.netflix.com" },
  "Prime Video": { cookieDomain: "primevideo.com", launchUrl: "https://www.primevideo.com" },
  "Disney+ Hotstar": { cookieDomain: "hotstar.com", launchUrl: "https://www.hotstar.com" },
  Spotify: { cookieDomain: "spotify.com", launchUrl: "https://open.spotify.com" },
  "YouTube Premium": { cookieDomain: "youtube.com", launchUrl: "https://www.youtube.com" },
};

export function platformConfig(name: string): PlatformConfig {
  return (
    PLATFORMS[name] ?? { cookieDomain: "", launchUrl: "about:blank" }
  );
}
