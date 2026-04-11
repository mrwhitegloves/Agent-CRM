import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper to decode JWT payload without verification (safe for middleware role checks)
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("crm_token")?.value;
  const { pathname } = request.nextUrl;

  // Handle root path
  if (pathname === "/") {
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        return NextResponse.redirect(
          new URL(payload.role === "admin" ? "/admin" : "/agent", request.url)
        );
      }
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 1. Protect /admin and /agent routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = decodeJwt(token);
    if (!payload) {
      // Invalid token format
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("crm_token");
      return response;
    }

    // 2. Role-based Access Control
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/agent", request.url));
    }
    if (pathname.startsWith("/agent") && payload.role !== "agent") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 3. Redirect logged-in users away from /login
  if (pathname === "/login" && token) {
    const payload = decodeJwt(token);
    if (payload) {
      if (payload.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/agent", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*", "/login", "/"],
};
