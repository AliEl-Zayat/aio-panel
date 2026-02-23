import { type NextRequest, NextResponse } from "next/server";
import {
  hasSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

const protectedPrefix = "/dashboard";

// Locale is owned by layout: root/dashboard layout reads NEXT_LOCALE cookie in getLocaleAndMessages().

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith(protectedPrefix)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!hasSessionCookie(session)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
