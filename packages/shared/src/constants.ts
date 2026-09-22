export const PLATFORM_FEE_PERCENT = 12;
export const OWNER_PAYOUT_PERCENT = 88;
export const BUYER_PREMIUM_PER_SLOT_INR = 199;
export const SLOT_DURATION_DAYS = 30;
export const SESSION_STALE_AFTER_DAYS = 7;
export const MAX_SLOTS_PER_SUBSCRIPTION = 3;

export const AUTH_COOKIE_NAME = "subs_token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const UNIVERSITY_EMAIL_SUFFIXES = [".ac.in", ".edu",".lpu.in","@lpu.in","lpu.in"] as const;

export function isUniversityEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return UNIVERSITY_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

export const PLATFORMS = [
  "Netflix",
  "Prime Video",
  "Disney+ Hotstar",
  "Spotify",
  "YouTube Premium",
  "Other",
] as const;

export type PlatformName = (typeof PLATFORMS)[number];

export function platformLaunchUrl(platform: string): string {
  switch (platform) {
    case "Netflix":
      return "https://www.netflix.com";
    case "Prime Video":
      return "https://www.primevideo.com";
    case "Disney+ Hotstar":
      return "https://www.hotstar.com";
    case "Spotify":
      return "https://open.spotify.com";
    case "YouTube Premium":
      return "https://www.youtube.com";
    default:
      return "about:blank";
  }
}

export function computeSplit(amountInr: number): {
  platformFee: number;
  ownerPayout: number;
} {
  const platformFee = Math.round(amountInr * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  return { platformFee, ownerPayout: Math.round((amountInr - platformFee) * 100) / 100 };
}
