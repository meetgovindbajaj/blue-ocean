import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyToken, getAuthCookie } from "./auth";
import { UserRole } from "./properties";
import dbConnect from "./db";
import User from "@/models/User";

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

// Get user from request headers (set by middleware) or from cookie
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // First try to get from headers (set by middleware)
  const userId = request.headers.get("x-user-id");
  const email = request.headers.get("x-user-email");
  const role = request.headers.get("x-user-role");

  if (userId && email && role) {
    return { userId, email, role };
  }

  // Fallback to cookie verification
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

// Check if user has admin role
export function isAdmin(role: string): boolean {
  return [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR].includes(role as UserRole);
}

// Check if user has super admin role
export function isSuperAdmin(role: string): boolean {
  return role === UserRole.SUPER_ADMIN;
}

// Permission definitions
export const Permissions = {
  // Product permissions
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_EDIT: "products:edit",
  PRODUCTS_DELETE: "products:delete",

  // Category permissions
  CATEGORIES_VIEW: "categories:view",
  CATEGORIES_CREATE: "categories:create",
  CATEGORIES_EDIT: "categories:edit",
  CATEGORIES_DELETE: "categories:delete",

  // User permissions
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",
  USERS_MANAGE_ROLES: "users:manage_roles",

  // Order permissions
  ORDERS_VIEW: "orders:view",
  ORDERS_EDIT: "orders:edit",
  ORDERS_DELETE: "orders:delete",

  // Inquiry permissions
  INQUIRIES_VIEW: "inquiries:view",
  INQUIRIES_RESPOND: "inquiries:respond",
  INQUIRIES_DELETE: "inquiries:delete",

  // Settings permissions
  SETTINGS_VIEW: "settings:view",
  SETTINGS_EDIT: "settings:edit",

  // Analytics permissions
  ANALYTICS_VIEW: "analytics:view",

  // Hero banner permissions
  BANNERS_VIEW: "banners:view",
  BANNERS_CREATE: "banners:create",
  BANNERS_EDIT: "banners:edit",
  BANNERS_DELETE: "banners:delete",

  // Tag permissions
  TAGS_VIEW: "tags:view",
  TAGS_CREATE: "tags:create",
  TAGS_EDIT: "tags:edit",
  TAGS_DELETE: "tags:delete",
} as const;

// Role-based default permissions
export const RolePermissions: Record<string, string[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permissions), // All permissions
  [UserRole.ADMIN]: [
    Permissions.PRODUCTS_VIEW,
    Permissions.PRODUCTS_CREATE,
    Permissions.PRODUCTS_EDIT,
    Permissions.PRODUCTS_DELETE,
    Permissions.CATEGORIES_VIEW,
    Permissions.CATEGORIES_CREATE,
    Permissions.CATEGORIES_EDIT,
    Permissions.CATEGORIES_DELETE,
    Permissions.USERS_VIEW,
    Permissions.USERS_EDIT,
    Permissions.ORDERS_VIEW,
    Permissions.ORDERS_EDIT,
    Permissions.INQUIRIES_VIEW,
    Permissions.INQUIRIES_RESPOND,
    Permissions.SETTINGS_VIEW,
    Permissions.SETTINGS_EDIT,
    Permissions.ANALYTICS_VIEW,
    Permissions.BANNERS_VIEW,
    Permissions.BANNERS_CREATE,
    Permissions.BANNERS_EDIT,
    Permissions.BANNERS_DELETE,
    Permissions.TAGS_VIEW,
    Permissions.TAGS_CREATE,
    Permissions.TAGS_EDIT,
    Permissions.TAGS_DELETE,
  ],
  [UserRole.MODERATOR]: [
    Permissions.PRODUCTS_VIEW,
    Permissions.PRODUCTS_EDIT,
    Permissions.CATEGORIES_VIEW,
    Permissions.ORDERS_VIEW,
    Permissions.INQUIRIES_VIEW,
    Permissions.INQUIRIES_RESPOND,
    Permissions.ANALYTICS_VIEW,
    Permissions.BANNERS_VIEW,
    Permissions.TAGS_VIEW,
  ],
  [UserRole.CUSTOMER]: [],
};

// Check if user has specific permission
export async function hasPermission(
  request: NextRequest,
  permission: string
): Promise<boolean> {
  const user = await getAuthUser(request);
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;

  // Get role-based permissions
  const rolePermissions = RolePermissions[user.role] || [];
  if (rolePermissions.includes(permission)) return true;

  // Check user-specific permissions from database
  try {
    await dbConnect();
    const dbUser = await User.findById(user.userId).select("permissions").lean();
    if (dbUser?.permissions?.includes(permission)) return true;
  } catch (error) {
    console.error("Error checking permissions:", error);
  }

  return false;
}

// Higher-order function to protect API routes
export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>,
  options: { adminOnly?: boolean; permissions?: string[] } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin requirement
    if (options.adminOnly && !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check specific permissions
    if (options.permissions && options.permissions.length > 0) {
      const hasAllPermissions = await Promise.all(
        options.permissions.map((p) => hasPermission(request, p))
      );

      if (!hasAllPermissions.every(Boolean)) {
        return NextResponse.json(
          { success: false, error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    return handler(request, user);
  };
}

// Response helpers
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

export function successResponse(data: any, status = 200) {
  return NextResponse.json(
    { success: true, ...data },
    { status }
  );
}
