import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

const COOKIE_NAME = "auth_token";

// Routes that require authentication
const protectedRoutes = ["/profile", "/settings", "/orders", "/wishlist"];

// Routes that require admin access
const adminRoutes = ["/admin"];

// API routes that require authentication
const protectedApiRoutes = ["/api/user", "/api/orders", "/api/wishlist"];

// API routes that require admin access
const adminApiRoutes = ["/api/admin"];

// Public routes (no auth required, redirect if logged in)
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

function isAdminRole(role: string): boolean {
  return ["admin", "super_admin", "moderator"].includes(role);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Verify token if present
  const user = token ? await verifyToken(token) : null;

  // Check if route requires admin access
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAdminApiRoute = adminApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if it's an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Handle admin routes
  if (isAdminRoute || isAdminApiRoute) {
    if (!user) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdminRole(user.role)) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Handle protected routes
  if (isProtectedRoute || isProtectedApiRoute) {
    if (!user) {
      if (isProtectedApiRoute) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle auth routes (redirect to home if already logged in)
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Add user info to headers for API routes
  if (user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.userId);
    requestHeaders.set("x-user-email", user.email);
    requestHeaders.set("x-user-role", user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected pages
    "/profile/:path*",
    "/settings/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/admin/:path*",
    // Auth pages
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    // Protected API routes
    "/api/user/:path*",
    "/api/orders/:path*",
    "/api/wishlist/:path*",
    "/api/admin/:path*",
  ],
};
