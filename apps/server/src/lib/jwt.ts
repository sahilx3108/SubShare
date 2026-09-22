import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
}

export function signAuthToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === "string") return null;
    if (!decoded.sub) return null;
    return decoded as AuthTokenPayload;
  } catch {
    return null;
  }
}
