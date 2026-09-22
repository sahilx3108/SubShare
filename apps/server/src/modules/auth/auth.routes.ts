import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as controller from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

export const authRouter = Router();

authRouter.post("/signup", authLimiter, controller.signup);
authRouter.get("/verify", controller.verify);
authRouter.post("/login", authLimiter, controller.login);
authRouter.get("/me", requireAuth, controller.me);
authRouter.post("/logout", controller.logout);
