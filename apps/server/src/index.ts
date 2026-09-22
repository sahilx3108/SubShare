import { createApp } from "./app";
import { env } from "./config/env";
import { expireStaleSlots } from "./modules/payments/payment.service";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[subshare] API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

// Housekeeping: flip expired slots to EXPIRED on boot and hourly after that.
void expireStaleSlots().then((n) => n && console.log(`[subshare] expired ${n} slots`));
const sweeper = setInterval(
  () => void expireStaleSlots().catch((e) => console.error("[sweeper]", e)),
  60 * 60 * 1000,
);
sweeper.unref();

function shutdown(signal: string) {
  console.log(`\n[subshare] ${signal} received, shutting down…`);
  clearInterval(sweeper);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
// Log stray async failures instead of letting Node's default crash take the API down.
process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));
