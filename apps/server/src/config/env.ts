import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const isProd = process.env.NODE_ENV === "production";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd,
  port: Number(process.env.PORT ?? 4000),
  webOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  // Public base URL of THIS API — used to build email verification links.
  publicApiUrl: process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  databaseUrl: required("DATABASE_URL", "postgresql://subshare:subshare@localhost:5432/subshare?schema=public"),
  jwtSecret: required(
    "JWT_SECRET",
    isProd ? undefined : "dev-only-insecure-jwt-secret-change-me",
  ),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  returnDevVerifyLink:
    !isProd && (process.env.RETURN_DEV_VERIFY_LINK ?? "true") === "true",
} as const;

export function assertPaymentConfigured(): boolean {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}
