import { Router } from "express";
import * as controller from "./slot.controller";
import { requireAuth } from "../../middleware/auth";

export const slotRouter = Router();

slotRouter.get("/", controller.list);
slotRouter.get("/mine", requireAuth, controller.mine);
slotRouter.get("/launch-request/latest", requireAuth, controller.latestLaunchRequest);
slotRouter.post("/:id/request-launch", requireAuth, controller.requestLaunch);
slotRouter.get("/:id/session", requireAuth, controller.session);
