import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/v1/")) {
    const authToken = request.cookies.get("authToken");
    const requestHeaders = new Headers(request.headers);
    if (authToken) requestHeaders.set("cookie", `authToken=${authToken.value}`);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/v1/:path*"],
};
