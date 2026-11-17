import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// A quick first check: no session cookie means go to the sign-in page.
// The real check happens in every API route, which verifies the cookie.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("mcr_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|login|.*\\.svg$).*)"],
};
