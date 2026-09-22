import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "subs_token";

/**
 * Presence-check gate for authenticated pages. The JWT itself is verified
 * server-side on every API call — this only avoids rendering private shells
 * for anonymous visitors.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/owner/:path*"],
};
