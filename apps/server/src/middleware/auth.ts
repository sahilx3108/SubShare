import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME, type SafeUser } from "@subshare/shared";
import { prisma } from "../lib/prisma";
import { verifyAuthToken } from "../lib/jwt";
import { ApiError, asyncHandler } from "../lib/http";

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return null;
}

export function toSafeUser(user: {
  id: string;
  name: string;
  university_email: string;
  rating: number;
  email_verified: boolean;
  created_at: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    university_email: user.university_email,
    rating: user.rating,
    email_verified: user.email_verified,
    created_at: user.created_at.toISOString(),
  };
}

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  university_email: true,
  rating: true,
  email_verified: true,
  created_at: true,
} as const;

/** Requires a valid JWT (HttpOnly cookie or Authorization bearer for the extension). */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();

  const payload = verifyAuthToken(token);
  if (!payload) throw ApiError.unauthorized("Session expired or invalid", "TOKEN_INVALID");

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: SAFE_USER_SELECT,
  });
  if (!user) throw ApiError.unauthorized("Account no longer exists", "USER_GONE");

  req.user = toSafeUser(user);
  next();
});

export function requireVerified(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.email_verified) {
    return next(ApiError.forbidden("Verify your university email first", "EMAIL_UNVERIFIED"));
  }
  next();
}
