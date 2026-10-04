import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";

// First line of defense: unauthenticated users never reach protected pages.
// Every page/action still re-checks the session and ownership on the server.
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const claims = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/checkout")) {
    if (!claims) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin") && claims.role !== "ADMIN") {
      return NextResponse.rewrite(new URL("/not-found-page", req.url));
    }
  }

  if (claims && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL(claims.role === "ADMIN" ? "/admin" : "/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/checkout/:path*", "/login", "/register"],
};
