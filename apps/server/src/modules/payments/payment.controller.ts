import type { Request, Response } from "express";
import { createOrderSchema } from "@subshare/shared";
import { ApiError, asyncHandler } from "../../lib/http";
import { requireAuth, requireVerified } from "../../middleware/auth";
import * as service from "./payment.service";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const input = createOrderSchema.parse(req.body);
  const order = await service.createOrder(input.slot_id, req.user!.id);
  res.status(201).json(order);
});

/**
 * Razorpay webhooks POST a JSON body signed with the webhook secret.
 * This route MUST receive the raw body — mounted before express.json().
 */
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const raw = (req.body as Buffer | undefined) ?? Buffer.alloc(0);
  const signature = req.headers["x-razorpay-signature"];

  if (!service.verifyWebhookSignature(raw, signature)) {
    throw ApiError.unauthorized("Invalid webhook signature");
  }

  const entity = service.extractCaptureEntity(JSON.parse(raw.toString("utf8")));
  if (entity) {
    const outcome = await service.processCaptureEvent(entity);
    console.info(`[webhook] processed capture: ${outcome}`);
  }
  // Always 200 once verified so Razorpay stops retrying; failures are logged.
  res.json({ ok: true });
});
