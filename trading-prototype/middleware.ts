import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/contract") ||
    pathname.startsWith("/markets");

  // not logged in -> block protected pages
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // logged in -> block login/register
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/wallet/:path*", "/contract/:path*", "/markets/:path*"],
};
