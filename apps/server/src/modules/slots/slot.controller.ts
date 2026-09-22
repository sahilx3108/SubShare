import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/http";
import { requireAuth } from "../../middleware/auth";
import * as service from "./slot.service";

/** Public marketplace grid. */
export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ slots: await service.listMarketplace() });
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  res.json({ slots: await service.listMine(req.user!.id) });
});

export const requestLaunch = asyncHandler(async (req: Request, res: Response) => {
  await service.requestLaunch(req.params.id!, req.user!.id);
  res.json({ ok: true });
});

export const latestLaunchRequest = asyncHandler(async (req: Request, res: Response) => {
  res.json(await service.latestLaunchRequest(req.user!.id));
});

export const session = asyncHandler(async (req: Request, res: Response) => {
  res.json(await service.getSessionPayload(req.params.id!, req.user!.id));
});
