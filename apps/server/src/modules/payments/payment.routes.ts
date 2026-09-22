import { Router } from "express";
import * as controller from "./payment.controller";
import { requireAuth, requireVerified } from "../../middleware/auth";

export const paymentRouter = Router();

paymentRouter.post("/order", requireAuth, requireVerified, controller.createOrder);
// Raw body parser is attached in app.ts BEFORE the JSON parser.
paymentRouter.post("/webhook", controller.webhook);
