import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

const COOKIE_NAME = "auth_token";

// ============================================
// Rate Limiting Configuration
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (per edge instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
const RATE_LIMITS = {
  api: { limit: 100, windowMs: 60000 }, // 100 req/min for general API
  auth: { limit: 10, windowMs: 60000 }, // 10 req/min for auth
  authStrict: { limit: 5, windowMs: 900000 }, // 5 req/15min for password reset
  admin: { limit: 200, windowMs: 60000 }, // 200 req/min for admin
  contact: { limit: 5, windowMs: 3600000 }, // 5 req/hour for contact
};

// Cleanup interval tracking
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000;

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  return "127.0.0.1";
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

function checkRateLimit(
  ip: string,
  identifier: string,
  config: { limit: number; windowMs: number }
): RateLimitResult {
  cleanupExpiredEntries();

  const key = `${identifier}:${ip}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.ceil((now + config.windowMs) / 1000),
    };
  }

  entry.count++;

  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil(entry.resetTime / 1000),
      retryAfter,
    };
  }

  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: Math.ceil(entry.resetTime / 1000),
  };
}

function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());
  if (result.retryAfter) {
    response.headers.set("Retry-After", result.retryAfter.toString());
  }
  return response;
}

function createRateLimitedResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    },
    { status: 429 }
  );
  return addRateLimitHeaders(response, result);
}

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
  const clientIp = getClientIp(request);

  // ============================================
  // Rate Limiting Check
  // ============================================

  // Determine which rate limit to apply based on the route
  let rateLimitConfig = RATE_LIMITS.api;
  let rateLimitIdentifier = "api";

  // Auth routes (login, register, forgot-password, etc.)
  if (pathname.startsWith("/api/auth")) {
    // Stricter limits for password reset
    if (pathname.includes("forgot-password") || pathname.includes("reset-password")) {
      rateLimitConfig = RATE_LIMITS.authStrict;
      rateLimitIdentifier = "auth-strict";
    } else {
      rateLimitConfig = RATE_LIMITS.auth;
      rateLimitIdentifier = "auth";
    }
  }
  // Admin routes
  else if (pathname.startsWith("/api/admin")) {
    rateLimitConfig = RATE_LIMITS.admin;
    rateLimitIdentifier = "admin";
  }
  // Contact/inquiry routes
  else if (pathname.startsWith("/api/contact") || pathname.startsWith("/api/inquiry")) {
    rateLimitConfig = RATE_LIMITS.contact;
    rateLimitIdentifier = "contact";
  }

  // Apply rate limiting for API routes
  let rateLimitResult: RateLimitResult | null = null;
  if (pathname.startsWith("/api/")) {
    rateLimitResult = checkRateLimit(clientIp, rateLimitIdentifier, rateLimitConfig);

    if (!rateLimitResult.allowed) {
      return createRateLimitedResponse(rateLimitResult);
    }
  }

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

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add rate limit headers to API responses
    if (rateLimitResult) {
      return addRateLimitHeaders(response, rateLimitResult);
    }
    return response;
  }

  const response = NextResponse.next();

  // Add rate limit headers to API responses
  if (rateLimitResult) {
    return addRateLimitHeaders(response, rateLimitResult);
  }
  return response;
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
    // All API routes (for rate limiting)
    "/api/:path*",
  ],
};
