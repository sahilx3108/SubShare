import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { subscriptionRouter } from "./modules/subscriptions/subscription.routes";
import { slotRouter } from "./modules/slots/slot.routes";
import { paymentRouter } from "./modules/payments/payment.routes";
import { errorHandler, notFoundHandler } from "./middleware/error";

export function createApp(): express.Express {
  const app = express();

  app.set("trust proxy", 1); // behind reverse proxies / tunnels
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || env.webOrigins.includes(origin)) return cb(null, true);
        cb(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());

  // Razorpay webhook needs the raw body for HMAC verification — mount first.
  app.use(
    "/api/v1/payments/webhook",
    express.raw({ type: "application/json", limit: "256kb" }),
  );
  app.use(express.json({ limit: "1mb" }));

  const api = express.Router();
  api.get("/health", (_req, res) => res.json({ ok: true, service: "subshare-api" }));
  api.use("/auth", authRouter);
  api.use("/subscriptions", subscriptionRouter);
  api.use("/slots", slotRouter);
  api.use("/payments", paymentRouter);
  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
