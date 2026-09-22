import type { Request, Response } from "express";
import { createSubscriptionSchema, putSessionSchema } from "@subshare/shared";
import { asyncHandler } from "../../lib/http";
import { requireAuth, requireVerified } from "../../middleware/auth";
import * as service from "./subscription.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = createSubscriptionSchema.parse(req.body);
  const subscription = await service.createSubscription(req.user!.id, input);
  res.status(201).json({ subscription });
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  const subscriptions = await service.listMine(req.user!.id);
  res.json({ subscriptions });
});

export const sessionKey = asyncHandler(async (req: Request, res: Response) => {
  const key = await service.ensureSessionKey(req.params.id!, req.user!.id);
  res.json({ session_key: key });
});

export const putSession = asyncHandler(async (req: Request, res: Response) => {
  const input = putSessionSchema.parse(req.body);
  await service.putSessionData(req.params.id!, req.user!.id, input);
  res.json({ ok: true });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteSubscription(req.params.id!, req.user!.id);
  res.json({ ok: true });
});

export { requireAuth, requireVerified };
