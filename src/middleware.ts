import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Protected routes that require authentication
const protectedRoutes = ["/admin", "/profile"];

// Admin-only routes
const adminRoutes = ["/admin"];

// Define the expected JWT payload structure
interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and public routes
  if (pathname.startsWith("/api/v1/")) {
    const authToken = request.cookies.get("authToken");
    const requestHeaders = new Headers(request.headers);
    if (authToken) requestHeaders.set("cookie", `authToken=${authToken.value}`);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/uploads/") ||
    pathname.includes(".") ||
    pathname === "/" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/search") // Added search to public routes
  ) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get token from cookies or headers
  const token =
    request.cookies.get("authToken")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);

  if (!token) {
    console.log("no token found");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Get the JWT secret and encode it for the Web Crypto API
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    // Verify JWT token using 'jose'
    const { payload } = await jwtVerify<JwtPayload>(token, secret);
    const decoded = payload;
    console.log({ decoded });

    // Check admin routes
    const isAdminRoute = adminRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (
      isAdminRoute &&
      decoded.role !== "admin" &&
      decoded.role !== "super_admin"
    ) {
      console.log("not admin");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Add user info to headers for API routes
    const response = NextResponse.next();
    response.headers.set("x-user-id", decoded.userId);
    response.headers.set("x-user-role", decoded.role);
    response.headers.set("x-user-email", decoded.email);

    return response;
  } catch (error) {
    console.error("JWT verification failed:", error);
    // Redirect to login if token is invalid
    console.log("invalid token");
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
