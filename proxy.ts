import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  // In production, let the app handle authentication
  // The React app has its own auth check and login form
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - test-simple (our debug page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|test-simple).*)",
  ],
};
