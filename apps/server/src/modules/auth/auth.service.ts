import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/http";
import { randomToken, sha256Hex } from "../../lib/tokens";
import type { LoginInput, SignupInput } from "@subshare/shared";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const BCRYPT_ROUNDS = 12;

export async function createUserWithVerification(input: SignupInput) {
  const existing = await prisma.user.findUnique({
    where: { university_email: input.university_email },
    select: { id: true },
  });
  if (existing) {
    // Generic message: don't leak which emails are registered.
    throw ApiError.conflict(
      "If this email is eligible and unregistered, a verification link has been sent.",
    );
  }

  const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      university_email: input.university_email,
      password_hash,
    },
    select: { id: true, name: true },
  });

  const verifyPath = await issueVerificationToken(user.id);
  return { user, verifyPath };
}

/** Issues a fresh token; returns the path so callers can mail/dev-link it. */
export async function issueVerificationToken(userId: string): Promise<string> {
  const token = randomToken(32);
  await prisma.verificationToken.create({
    data: {
      token_hash: sha256Hex(token),
      user_id: userId,
      expires_at: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });
  return `/api/v1/auth/verify?token=${token}`;
}

export async function verifyEmail(token: string): Promise<boolean> {
  const record = await prisma.verificationToken.findUnique({
    where: { token_hash: sha256Hex(token) },
    select: { id: true, user_id: true, expires_at: true },
  });
  if (!record || record.expires_at < new Date()) return false;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.user_id },
      data: { email_verified: true },
    }),
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);
  return true;
}

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "INVALID_CREDENTIALS" | "EMAIL_UNVERIFIED"; devVerifyPath?: string };

export async function authenticate(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { university_email: input.university_email },
  });
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }
  if (!user.email_verified) {
    const devVerifyPath = await issueVerificationToken(user.id);
    return { ok: false, reason: "EMAIL_UNVERIFIED", devVerifyPath };
  }
  return { ok: true, userId: user.id };
}
