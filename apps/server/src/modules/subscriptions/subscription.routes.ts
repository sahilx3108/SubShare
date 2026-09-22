import { Router } from "express";
import * as controller from "./subscription.controller";
import { requireAuth, requireVerified } from "../../middleware/auth";

export const subscriptionRouter = Router();

// All subscription routes are owner-only and need a verified email.
subscriptionRouter.use(requireAuth, requireVerified);

subscriptionRouter.post("/", controller.create);
subscriptionRouter.get("/mine", controller.mine);
subscriptionRouter.get("/:id/session-key", controller.sessionKey);
subscriptionRouter.put("/:id/session", controller.putSession);
subscriptionRouter.delete("/:id", controller.remove);
