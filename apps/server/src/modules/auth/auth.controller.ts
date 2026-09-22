import type { Request, Response } from "express";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  loginSchema,
  signupSchema,
} from "@subshare/shared";
import { env } from "../../config/env";
import { ApiError, asyncHandler } from "../../lib/http";
import { signAuthToken } from "../../lib/jwt";
import { requireAuth, toSafeUser } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import * as authService from "./auth.service";

function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS * 1000,
    path: "/",
  });
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const input = signupSchema.parse(req.body);
  const { user, verifyPath } = await authService.createUserWithVerification(input);
  // Verification links must hit THIS API (which then redirects to the web app).
  const verifyUrl = `${env.publicApiUrl}${verifyPath}`;

  // TODO(production): send via mailer. In dev we return the link so flows are testable.
  if (env.returnDevVerifyLink) {
    console.info(`[dev] verification link for ${input.university_email}: ${verifyUrl}`);
    res.status(201).json({ message: "Account created", dev_verify_url: verifyUrl });
    return;
  }
  res.status(201).json({ message: "Account created" });
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const ok = token.length > 0 && (await authService.verifyEmail(token));
  if (!ok) throw ApiError.badRequest("Invalid or expired verification link");
  res.redirect(`${env.webOrigins[0]}/login?verified=1`);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.authenticate(input);

  if (!result.ok) {
    if (result.reason === "EMAIL_UNVERIFIED") {
      if (env.returnDevVerifyLink && result.devVerifyPath) {
        res.status(403).json({
          error: "Verify your university email before logging in",
          code: "EMAIL_UNVERIFIED",
          dev_verify_url: `${env.publicApiUrl}${result.devVerifyPath}`,
        });
        return;
      }
      throw ApiError.forbidden("Verify your university email before logging in", "EMAIL_UNVERIFIED");
    }
    throw ApiError.unauthorized("Invalid email or password");
  }

  setAuthCookie(res, signAuthToken(result.userId));
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: result.userId },
  });
  res.json({ user: toSafeUser(user) });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  // requireAuth has already attached the user.
  res.json({ user: req.user });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax", secure: env.isProd });
  res.json({ ok: true });
});

export { requireAuth };
