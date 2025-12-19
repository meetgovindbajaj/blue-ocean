# Furniture E-Commerce Platform - Comprehensive Interview Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack Deep Dive](#2-tech-stack-deep-dive)
3. [Architecture & Design Patterns](#3-architecture--design-patterns)
4. [Database Design](#4-database-design)
5. [Authentication & Security](#5-authentication--security)
6. [API Design](#6-api-design)
7. [State Management](#7-state-management)
8. [Multi-Currency System](#8-multi-currency-system)
9. [Image & File Management](#9-image--file-management)
10. [Analytics & Tracking](#10-analytics--tracking)
11. [Performance Optimization](#11-performance-optimization)
12. [Error Handling](#12-error-handling)
13. [Testing Strategies](#13-testing-strategies)
14. [Deployment & DevOps](#14-deployment--devops)
15. [Common Interview Questions](#15-common-interview-questions)
16. [Scenario-Based Questions](#16-scenario-based-questions)
17. [Code Walkthroughs](#17-code-walkthroughs)

---

## 1. Project Overview

### What is this project?
A full-featured B2B/B2C furniture e-commerce platform built with modern web technologies. It enables:
- **Customers**: Browse products, submit inquiries, manage wishlists, view in multiple currencies
- **Admins**: Manage products, categories, users, banners, analytics, and site settings
- **Super Admins**: Full system control including user role management

### Key Business Features
| Feature | Description |
|---------|-------------|
| Product Catalog | Hierarchical categories, advanced filtering, search |
| Multi-Currency | 10 currencies with real-time conversion |
| Inquiry System | Product inquiries with status tracking |
| Analytics Dashboard | Views, clicks, trends, top performers |
| Hero Banners | Dynamic banners with auto-content (trending/new) |
| User Management | Roles, permissions, account security |
| Site Configuration | Centralized settings for all site content |

### Project Scale
- **14 Database Models**
- **62+ API Routes**
- **20+ Reusable UI Components**
- **4 React Contexts**
- **27 Permission Types**

---

## 2. Tech Stack Deep Dive

### Frontend Technologies

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND STACK                         │
├─────────────────────────────────────────────────────────────┤
│  Framework    │ Next.js 16.0.8 (App Router)                │
│  UI Library   │ React 19.2.1                               │
│  Styling      │ Tailwind CSS 4 + CSS Modules               │
│  Components   │ Shadcn/ui (Radix UI primitives)            │
│  Animations   │ Framer Motion 12.23.24                     │
│  Charts       │ Recharts 2.15.4                            │
│  Carousel     │ Embla Carousel 8.6.0                       │
│  Icons        │ Lucide React                               │
│  Forms        │ Native React + Controlled Components       │
│  Theme        │ next-themes 0.4.6                          │
│  Toasts       │ Sonner 2.0.7                               │
└─────────────────────────────────────────────────────────────┘
```

### Backend Technologies

```
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND STACK                          │
├─────────────────────────────────────────────────────────────┤
│  Runtime      │ Node.js (Next.js API Routes)               │
│  Database     │ MongoDB (Atlas) + Mongoose 9.0.0           │
│  Auth         │ JWT (jose 6.1.3) + Google OAuth            │
│  Email        │ Nodemailer 7.0.11 (Gmail SMTP)             │
│  File Storage │ Cloudinary v2.8.0                          │
│  Validation   │ Custom middleware + Mongoose schemas       │
│  Caching      │ MongoDB connection pooling + HTTP cache    │
└─────────────────────────────────────────────────────────────┘
```

### Why These Choices?

#### Next.js 16 with App Router
**Interview Answer:**
> "I chose Next.js App Router for several reasons:
> 1. **Server Components**: Reduce client-side JavaScript by rendering components on server
> 2. **Streaming**: Progressive page loading improves perceived performance
> 3. **Route Handlers**: Co-locate API routes with related code
> 4. **Built-in Caching**: Automatic request deduplication and caching
> 5. **SEO**: Server rendering ensures search engines can index content
> 6. **File-based Routing**: Intuitive project structure"

#### MongoDB with Mongoose
**Interview Answer:**
> "MongoDB was ideal for this e-commerce platform because:
> 1. **Flexible Schema**: Products have varying attributes (dimensions, images, categories)
> 2. **Embedded Documents**: Store related data together (product images, user preferences)
> 3. **Horizontal Scaling**: Easy to scale with increasing product catalog
> 4. **Aggregation Pipeline**: Powerful analytics queries
> 5. **Mongoose ODM**: Type safety, validation, middleware hooks, virtual fields"

#### Tailwind CSS
**Interview Answer:**
> "Tailwind provides rapid UI development with:
> 1. **Utility-First**: Build complex designs without leaving HTML
> 2. **Responsive Design**: Mobile-first with breakpoint utilities
> 3. **Dark Mode**: Built-in dark mode support
> 4. **Tree Shaking**: Only includes used styles in production
> 5. **Consistency**: Design system through configuration"

---

## 3. Architecture & Design Patterns

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Browser   │  │   Mobile    │  │    PWA      │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    App Router (RSC)                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │   Pages     │  │  Layouts    │  │   Components    │   │   │
│  │  │ (user/admin)│  │ (shared UI) │  │ (Server/Client) │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes (/api)                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │   │
│  │  │  Auth   │  │Products │  │  Admin  │  │   Upload    │  │   │
│  │  │ Routes  │  │ Routes  │  │ Routes  │  │   Routes    │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Mongoose   │  │ Cloudinary  │  │      Nodemailer         │  │
│  │    ODM      │  │    SDK      │  │        SMTP             │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    MongoDB      │ │   Cloudinary    │ │  Gmail SMTP     │
│    Atlas        │ │     Cloud       │ │    Server       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Design Patterns Used

#### 1. Repository Pattern (Implicit via Mongoose)
```typescript
// Models act as repositories
const products = await Product.find({ isActive: true })
  .populate('category')
  .sort({ score: -1 });
```

#### 2. Provider Pattern (React Context)
```typescript
// Contexts wrap the app providing global state
<AuthProvider>
  <SiteSettingsProvider>
    <CurrencyProvider>
      {children}
    </CurrencyProvider>
  </SiteSettingsProvider>
</AuthProvider>
```

#### 3. Higher-Order Function Pattern (API Middleware)
```typescript
// withAuth wraps route handlers
export const GET = withAuth(
  async (request, { user }) => {
    // Protected route logic
  },
  { requiredPermissions: ['view_products'] }
);
```

#### 4. Factory Pattern (Token Generation)
```typescript
// Token creation for different purposes
const token = await Token.create({
  userId: user._id,
  type: TokenType.EMAIL_VERIFICATION,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
});
```

#### 5. Observer Pattern (Mongoose Hooks)
```typescript
// Pre/post hooks for side effects
CategorySchema.post('findOneAndDelete', async function(doc) {
  // Update parent's children array
  // Set related products inactive
});
```

#### 6. Strategy Pattern (Sorting/Filtering)
```typescript
// Different sort strategies
const sortOptions: Record<string, any> = {
  'name': { name: 1 },
  'price-low': { 'prices.effectivePrice': 1 },
  'price-high': { 'prices.effectivePrice': -1 },
  'newest': { createdAt: -1 },
  'trending': { score: -1 }
};
```

### Folder Structure

```
/migrate/src/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin route group
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── products/
│   │       ├── categories/
│   │       ├── users/
│   │       ├── inquiries/
│   │       ├── banners/
│   │       ├── tags/
│   │       ├── analytics/
│   │       └── settings/
│   ├── (user)/                   # User route group
│   │   ├── (auth)/               # Auth pages (login, register, etc.)
│   │   ├── products/
│   │   ├── categories/
│   │   ├── about/
│   │   ├── contact/
│   │   └── settings/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── user/
│   │   └── upload/
│   ├── layout.tsx                # Root layout
│   ├── robots.ts                 # SEO robots.txt
│   └── sitemap.ts                # SEO sitemap
├── components/
│   ├── ui/                       # Shadcn/ui components
│   ├── Header/                   # Site header
│   ├── Footer/                   # Site footer
│   ├── Home/                     # Home page components
│   ├── shared/                   # Shared components
│   └── admin/                    # Admin-specific components
├── context/                      # React Contexts
│   ├── AuthContext.tsx
│   ├── CurrencyContext.tsx
│   ├── SiteSettingsContext.tsx
│   └── LandingDataContext.tsx
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities & configurations
│   ├── db.ts                     # MongoDB connection
│   ├── auth.ts                   # JWT & OAuth utilities
│   ├── apiAuth.ts                # API authentication middleware
│   ├── cloudinary.ts             # Image upload utilities
│   ├── email.ts                  # Email sending
│   ├── analytics.ts              # Analytics tracking
│   └── utils.ts                  # Helper functions
├── models/                       # Mongoose schemas
└── types/                        # TypeScript types
```

---

## 4. Database Design

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Profile     │
├─────────────────┤       ├─────────────────┤
│ _id             │───────│ _id (same)      │
│ email           │       │ name            │
│ passwordHash    │       │ phone           │
│ role            │       │ avatar          │
│ permissions     │       │ preferences     │
│ profile (ref)   │       │ wishlist[]      │
│ googleId        │       │ recentlyViewed[]│
└─────────────────┘       └─────────────────┘
         │
         │ creates
         ▼
┌─────────────────┐       ┌─────────────────┐
│    Inquiry      │───────│    Product      │
├─────────────────┤       ├─────────────────┤
│ _id             │       │ _id             │
│ userId (ref)    │       │ name            │
│ productId (ref) │       │ slug            │
│ message         │       │ prices          │
│ status          │       │ category (ref)  │
│ notes[]         │       │ images[]        │
│ userComments[]  │       │ tags[] (ref)    │
└─────────────────┘       └─────────────────┘
                                  │
                                  │ belongs to
                                  ▼
                          ┌─────────────────┐
                          │    Category     │
                          ├─────────────────┤
                          │ _id             │
                          │ name            │
                          │ slug            │
                          │ parent (ref)    │
                          │ children[]      │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   HeroBanner    │       │   SiteSettings  │
├─────────────────┤       ├─────────────────┤
│ _id             │       │ _id             │
│ name            │       │ siteName        │
│ type            │       │ about           │
│ content         │       │ contact         │
│ image           │       │ locale          │
│ order           │       │ faq[]           │
│ clicks          │       │ exchangeRates   │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│ AnalyticsEvent  │       │ DailyAnalytics  │
├─────────────────┤       ├─────────────────┤
│ _id             │       │ _id             │
│ eventType       │       │ date            │
│ entityType      │       │ entityType      │
│ entityId        │       │ entityId        │
│ sessionId       │       │ views           │
│ metadata        │       │ clicks          │
│ ip              │       │ uniqueSessions  │
└─────────────────┘       └─────────────────┘
```

### Schema Design Decisions

#### 1. User-Profile Separation
**Why?**
> "We separated User and Profile to:
> 1. Keep authentication data minimal and fast to query
> 2. Allow profile data to grow without affecting auth
> 3. Implement different access patterns (auth is frequent, profile is occasional)
> 4. Support privacy controls (profile can be deleted without losing account)"

```typescript
// User schema - lean for authentication
const UserSchema = new Schema({
  email: { type: String, unique: true },
  passwordHash: { type: String, select: false }, // Never returned by default
  role: { type: String, enum: ['customer', 'moderator', 'admin', 'super_admin'] },
  profile: { type: Schema.Types.ObjectId, ref: 'Profile' }
});

// Profile schema - rich user data
const ProfileSchema = new Schema({
  name: String,
  preferences: {
    currency: { type: String, enum: ['', 'INR', 'USD', ...] },
    newsletter: Boolean,
    notifications: { email: Boolean, push: Boolean }
  },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }]
});
```

#### 2. Hierarchical Categories
**Why?**
> "We used self-referencing for category hierarchy because:
> 1. Unlimited nesting depth
> 2. Easy breadcrumb generation
> 3. Efficient subtree queries with proper indexing"

```typescript
const CategorySchema = new Schema({
  name: String,
  slug: { type: String, unique: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  children: [{ type: Schema.Types.ObjectId, ref: 'Category' }]
});

// Middleware to maintain bidirectional relationship
CategorySchema.post('save', async function() {
  if (this.parent) {
    await Category.findByIdAndUpdate(this.parent, {
      $addToSet: { children: this._id }
    });
  }
});
```

#### 3. Embedded vs Referenced Data
| Data Type | Strategy | Reason |
|-----------|----------|--------|
| Product Images | Embedded | Always accessed together, no independent queries |
| Product Category | Referenced | Categories shared across products |
| User Wishlist | Referenced | Products updated independently |
| Inquiry Notes | Embedded | Always accessed with inquiry |
| Exchange Rates | Embedded in SiteSettings | Single source of truth |

#### 4. Indexing Strategy

```typescript
// Product indexes for search performance
ProductSchema.index({ name: 'text', description: 'text' }); // Full-text search
ProductSchema.index({ category: 1, isActive: 1 }); // Category filtering
ProductSchema.index({ 'prices.effectivePrice': 1 }); // Price sorting
ProductSchema.index({ score: -1 }); // Trending sort
ProductSchema.index({ tags: 1 }); // Tag filtering

// Analytics indexes for time-series queries
AnalyticsEventSchema.index({ createdAt: -1 }); // Recent events
AnalyticsEventSchema.index({ eventType: 1, entityId: 1, createdAt: -1 }); // Entity analytics
DailyAnalyticsSchema.index({ date: 1, entityType: 1, entityId: 1 }, { unique: true }); // Upserts
```

---

## 5. Authentication & Security

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User submits email + password                               │
│           │                                                      │
│           ▼                                                      │
│  2. Validate email format & password strength                   │
│           │                                                      │
│           ▼                                                      │
│  3. Check if email already exists                               │
│           │                                                      │
│           ▼                                                      │
│  4. Hash password (bcrypt, 12 rounds)                           │
│           │                                                      │
│           ▼                                                      │
│  5. Create User + Profile documents                             │
│           │                                                      │
│           ▼                                                      │
│  6. Generate verification token (24h expiry)                    │
│           │                                                      │
│           ▼                                                      │
│  7. Send verification email                                     │
│           │                                                      │
│           ▼                                                      │
│  8. User clicks link → Token validated → isVerified = true      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User submits email + password                               │
│           │                                                      │
│           ▼                                                      │
│  2. Find user by email (include passwordHash)                   │
│           │                                                      │
│           ▼                                                      │
│  3. Check account lock status                                   │
│           │ locked?                                              │
│           ├──────── YES ──────▶ Return "Account locked"         │
│           │                                                      │
│           ▼ NO                                                   │
│  4. Compare password with hash                                  │
│           │ invalid?                                             │
│           ├──────── YES ──────▶ Increment loginAttempts         │
│           │                     (lock after 5 attempts)          │
│           │                                                      │
│           ▼ VALID                                                │
│  5. Reset loginAttempts to 0                                    │
│           │                                                      │
│           ▼                                                      │
│  6. Generate JWT (7 day expiry)                                 │
│           │                                                      │
│           ▼                                                      │
│  7. Set HTTP-only cookie                                        │
│           │                                                      │
│           ▼                                                      │
│  8. Return user data (without sensitive fields)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### JWT Implementation

```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_EXPIRATION = '7d';

// Token payload structure
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  isVerified: boolean;
}

// Sign JWT
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);
}

// Verify JWT
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

// Cookie settings
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/'
};
```

### Password Security

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Password validation rules
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false
};
```

### Account Lockout Mechanism

```typescript
// User schema methods
UserSchema.methods.incrementLoginAttempts = async function() {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

  // If lock has expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // Lock account if max attempts reached
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.lockUntil) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};
```

### Role-Based Access Control (RBAC)

```typescript
// lib/apiAuth.ts
export enum Permission {
  // Products
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCT = 'create_product',
  EDIT_PRODUCT = 'edit_product',
  DELETE_PRODUCT = 'delete_product',

  // Users
  VIEW_USERS = 'view_users',
  MANAGE_ROLES = 'manage_roles',

  // ... 27 total permissions
}

// Role definitions
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: Object.values(Permission), // All permissions
  admin: [
    Permission.VIEW_PRODUCTS, Permission.CREATE_PRODUCT,
    Permission.EDIT_PRODUCT, Permission.DELETE_PRODUCT,
    Permission.VIEW_USERS, Permission.VIEW_ANALYTICS,
    // ... most permissions except MANAGE_ROLES
  ],
  moderator: [
    Permission.VIEW_PRODUCTS, Permission.VIEW_USERS,
    Permission.VIEW_INQUIRIES, Permission.RESPOND_INQUIRY
  ],
  customer: [] // No admin permissions
};

// Middleware to check permissions
export function withAuth(
  handler: AuthenticatedHandler,
  options?: { requiredPermissions?: Permission[] }
) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (options?.requiredPermissions) {
      const hasAllPermissions = options.requiredPermissions.every(
        perm => hasPermission(user, perm)
      );

      if (!hasAllPermissions) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return handler(request, { user });
  };
}
```

### Google OAuth Integration

```typescript
// OAuth flow
export function getGoogleOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Exchange code for tokens
export async function getGoogleOAuthTokens(code: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code'
    })
  });

  return response.json();
}

// Get user info from Google
export async function getGoogleUser(accessToken: string) {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response.json();
}
```

### Security Headers (next.config.ts)

```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)'
  }
];
```

---

## 6. API Design

### RESTful API Structure

```
/api
├── /auth
│   ├── POST /login              # Email/password authentication
│   ├── POST /register           # New user registration
│   ├── POST /logout             # Clear session
│   ├── GET  /me                 # Get current user
│   ├── POST /verify-email       # Verify email token
│   ├── POST /resend-verification
│   ├── POST /forgot-password
│   ├── POST /reset-password
│   ├── POST /google             # Initiate Google OAuth
│   └── POST /google/callback    # Handle OAuth callback
│
├── /products
│   ├── GET  /                   # List products (with filters)
│   ├── GET  /[slug]             # Get single product
│   ├── GET  /[slug]/view        # Record view
│   ├── GET  /[slug]/related     # Get related products
│   └── GET  /trending           # Get trending products
│
├── /categories
│   ├── GET  /                   # List categories
│   ├── GET  /[slug]             # Get category with products
│   └── GET  /[slug]/view        # Record view
│
├── /admin
│   ├── /dashboard
│   │   └── GET /                # Dashboard stats & analytics
│   ├── /products
│   │   ├── GET    /             # List (paginated, filtered)
│   │   ├── POST   /             # Create product
│   │   ├── GET    /[id]         # Get product
│   │   ├── PUT    /[id]         # Update product
│   │   └── DELETE /[id]         # Delete product
│   ├── /categories
│   │   └── ... (similar CRUD)
│   ├── /users
│   │   └── ... (similar CRUD + role management)
│   ├── /inquiries
│   │   └── ... (CRUD + status updates)
│   ├── /hero-banners
│   │   └── ... (CRUD)
│   ├── /tags
│   │   └── ... (CRUD)
│   ├── /analytics
│   │   └── GET /                # Analytics data
│   └── /settings
│       ├── GET   /              # Get site settings
│       ├── PUT   /              # Update all settings
│       └── PATCH /              # Update section
│
├── /user
│   ├── GET  /profile            # Get user profile
│   ├── PUT  /profile            # Update profile
│   ├── POST /change-password
│   ├── GET  /recently-viewed
│   ├── GET  /inquiries          # User's inquiries
│   └── POST /inquiries          # Submit inquiry
│
├── /upload
│   ├── POST /                   # Upload image
│   ├── POST /file               # Upload document
│   └── DELETE /delete           # Delete file
│
├── /contact
│   └── POST /                   # Submit contact form
│
├── /newsletter
│   └── POST /subscribe
│
└── /settings
    └── GET /                    # Public site settings
```

### API Response Format

```typescript
// Success response
{
  success: true,
  data: { ... },
  // Optional pagination
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}

// Error response
{
  success: false,
  error: "Human readable error message",
  code: "ERROR_CODE", // Optional
  details: { ... }    // Optional validation errors
}
```

### Product API Example

```typescript
// GET /api/products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract query parameters
  const categories = searchParams.get('categories')?.split(',') || [];
  const search = searchParams.get('search') || '';
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || Infinity;
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
  const currency = searchParams.get('currency') || 'USD';

  await connectDB();

  // Build query
  const query: any = { isActive: true };

  // Category filter (including children)
  if (categories.length > 0) {
    const allCategoryIds = await getAllCategoryIds(categories);
    query.category = { $in: allCategoryIds };
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Price filter with currency conversion
  if (minPrice > 0 || maxPrice < Infinity) {
    const rates = await getExchangeRates();
    const convertedMin = convertToBase(minPrice, currency, rates);
    const convertedMax = convertToBase(maxPrice, currency, rates);
    query['prices.effectivePrice'] = {
      $gte: convertedMin,
      $lte: convertedMax
    };
  }

  // Sort options
  const sortOptions: Record<string, any> = {
    'name': { name: 1 },
    'price-low': { 'prices.effectivePrice': 1 },
    'price-high': { 'prices.effectivePrice': -1 },
    'newest': { createdAt: -1 },
    'trending': { score: -1, totalViews: -1 }
  };

  // Execute query
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);

  return NextResponse.json({
    success: true,
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
    }
  });
}
```

### Error Handling Pattern

```typescript
// Consistent error handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    await connectDB();

    // Business logic...

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('API Error:', error);

    // Handle specific errors
    if (error instanceof MongooseError.ValidationError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Duplicate entry' },
        { status: 409 }
      );
    }

    // Generic error
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 7. State Management

### Context Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Root                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   AuthProvider                         │  │
│  │  • user state (userId, email, role, etc.)            │  │
│  │  • login(), logout(), refreshUser()                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │             SiteSettingsProvider                 │  │  │
│  │  │  • settings (site config)                       │  │  │
│  │  │  • formatPrice() (legacy)                       │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │           CurrencyProvider                 │  │  │  │
│  │  │  │  • currency, baseCurrency                 │  │  │  │
│  │  │  │  • exchangeRates                          │  │  │  │
│  │  │  │  • formatPrice(), convertPrice()          │  │  │  │
│  │  │  │  • setUserCurrency()                      │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │        Page Components              │  │  │  │  │
│  │  │  │  │                                     │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### AuthContext Implementation

```typescript
// context/AuthContext.tsx
interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  avatar?: string;
  phone?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load - check if user is logged in
  useEffect(() => {
    refreshUser();
  }, []);

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### CurrencyContext Implementation

```typescript
// context/CurrencyContext.tsx
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  // ... 10 total currencies
] as const;

interface CurrencyContextValue {
  currency: CurrencyCode;           // Active display currency
  baseCurrency: CurrencyCode;       // Storage currency
  exchangeRates: Record<string, number>;
  formatPrice: (price: number) => string;
  convertPrice: (price: number, from?: string, to?: string) => number;
  setUserCurrency: (currency: string) => Promise<void>;
  loading: boolean;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [userCurrency, setUserCurrencyState] = useState<string>('');
  const [exchangeRates, setExchangeRates] = useState(defaultRates);

  // Base currency from site settings
  const baseCurrency = settings?.locale?.currency || 'USD';

  // Active currency: user preference > site default
  const currency = (userCurrency || baseCurrency) as CurrencyCode;

  // Load user preference
  useEffect(() => {
    if (user) {
      // Fetch from profile
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.user?.profile?.preferences?.currency) {
            setUserCurrencyState(data.user.profile.preferences.currency);
          }
        });
    } else {
      // Load from localStorage
      const stored = localStorage.getItem('preferredCurrency');
      if (stored) setUserCurrencyState(stored);
    }
  }, [user]);

  // Load exchange rates
  useEffect(() => {
    const adminRates = settings?.locale?.exchangeRates;
    if (adminRates && Object.keys(adminRates).length > 0) {
      setExchangeRates({ ...defaultRates, ...adminRates });
    } else {
      // Fetch from external API
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(res => res.json())
        .then(data => setExchangeRates(data.rates));
    }
  }, [settings]);

  // Convert price between currencies
  const convertPrice = useCallback((
    price: number,
    from: CurrencyCode = baseCurrency,
    to: CurrencyCode = currency
  ) => {
    if (from === to) return price;

    const fromRate = exchangeRates[from] || 1;
    const toRate = exchangeRates[to] || 1;

    // Convert through USD as reference
    const priceInUSD = price / fromRate;
    return priceInUSD * toRate;
  }, [exchangeRates, baseCurrency, currency]);

  // Format price with locale
  const formatPrice = useCallback((price: number) => {
    const converted = convertPrice(price, baseCurrency, currency);
    const currencyInfo = CURRENCIES.find(c => c.code === currency);

    return new Intl.NumberFormat(currencyInfo?.locale || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2
    }).format(converted);
  }, [convertPrice, currency, baseCurrency]);

  // Save user preference
  const setUserCurrency = async (newCurrency: string) => {
    setUserCurrencyState(newCurrency);

    if (user) {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { currency: newCurrency } })
      });
    } else {
      localStorage.setItem('preferredCurrency', newCurrency);
    }
  };

  return (
    <CurrencyContext.Provider value={{
      currency, baseCurrency, exchangeRates,
      formatPrice, convertPrice, setUserCurrency, loading
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}
```

### Using Contexts in Components

```typescript
// ProductCard.tsx
function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  return (
    <Card>
      <CardContent>
        <h3>{product.name}</h3>
        <div className="price">
          {product.prices.discount > 0 && (
            <span className="original-price line-through">
              {formatPrice(product.prices.retail)}
            </span>
          )}
          <span className="current-price">
            {formatPrice(product.prices.effectivePrice)}
          </span>
        </div>
        {user && (
          <WishlistButton productId={product._id} />
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 8. Multi-Currency System

### Currency Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENCY FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STORAGE                    CONVERSION                 DISPLAY   │
│  ────────                   ──────────                 ───────   │
│                                                                  │
│  ┌─────────┐              ┌───────────────┐         ┌─────────┐ │
│  │ Product │              │   Exchange    │         │  User   │ │
│  │ Price   │ ──────────▶  │    Rates      │ ─────▶  │  View   │ │
│  │ (Base)  │              │  (USD ref)    │         │ (Pref)  │ │
│  └─────────┘              └───────────────┘         └─────────┘ │
│                                                                  │
│  Base Currency:            Rates Source:            Display:     │
│  - Set by admin           - Admin config OR        - User pref  │
│  - Stored in              - External API           - OR site    │
│    SiteSettings           - Fallback defaults        default    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Exchange Rate Calculation

```typescript
// All rates are relative to USD (1 USD = X currency)
const exchangeRates = {
  USD: 1,      // Reference
  INR: 83.5,   // 1 USD = 83.5 INR
  EUR: 0.92,   // 1 USD = 0.92 EUR
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.5,
  CNY: 7.24
};

// Conversion formula
function convertPrice(
  price: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return price;

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // Step 1: Convert to USD (common reference)
  const priceInUSD = price / fromRate;

  // Step 2: Convert from USD to target
  const convertedPrice = priceInUSD * toRate;

  return convertedPrice;
}

// Example: Convert 1000 INR to EUR
// Step 1: 1000 / 83.5 = 11.98 USD
// Step 2: 11.98 * 0.92 = 11.02 EUR
```

### Admin Currency Change Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              ADMIN CHANGES BASE CURRENCY                         │
│                   INR → USD                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Admin selects new base currency (USD)                       │
│           │                                                      │
│           ▼                                                      │
│  2. Frontend updates locale settings atomically:                │
│     - currency: "USD"                                           │
│     - currencySymbol: "$"                                       │
│     - locale: "en-US"                                           │
│           │                                                      │
│           ▼                                                      │
│  3. Save settings → API PUT /api/admin/settings                 │
│           │                                                      │
│           ▼                                                      │
│  4. API detects currency change (INR → USD)                     │
│           │                                                      │
│           ▼                                                      │
│  5. Load exchange rates from saved settings                     │
│           │                                                      │
│           ▼                                                      │
│  6. Bulk update ALL product prices:                             │
│     For each product:                                           │
│       - retail = convertPrice(retail, INR, USD)                 │
│       - wholesale = convertPrice(wholesale, INR, USD)           │
│       - effectivePrice = retail * (1 - discount/100)            │
│           │                                                      │
│           ▼                                                      │
│  7. Save all products via bulkWrite()                           │
│           │                                                      │
│           ▼                                                      │
│  8. Revalidate product pages                                    │
│           │                                                      │
│           ▼                                                      │
│  9. Return success with pricesUpdated: true                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Currency Selection

```typescript
// CurrencySelector.tsx
function CurrencySelector() {
  const { currency, setUserCurrency, loading } = useCurrency();

  return (
    <Select
      value={currency}
      onValueChange={setUserCurrency}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.symbol} {c.code} - {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 9. Image & File Management

### Cloudinary Integration

```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image with transformations
export async function uploadImage(
  file: Buffer | string,
  options: {
    folder?: string;
    publicId?: string;
    transformation?: object;
  } = {}
) {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/png;base64,${file.toString('base64')}`,
    {
      folder: options.folder || 'blue_ocean/products',
      public_id: options.publicId,
      resource_type: 'auto',
      transformation: options.transformation
    }
  );

  return {
    id: result.public_id,
    url: result.secure_url,
    thumbnailUrl: generateThumbnailUrl(result.public_id),
    width: result.width,
    height: result.height,
    size: result.bytes
  };
}

// Generate thumbnail URL
export function generateThumbnailUrl(publicId: string, size = 300): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: size, height: size, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
}

// Generate download URL
export function generateDownloadUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    flags: 'attachment'
  });
}

// Delete image
export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

// Batch upload
export async function uploadMultipleImages(files: Buffer[], folder: string) {
  return Promise.all(
    files.map((file, index) =>
      uploadImage(file, {
        folder,
        publicId: `${Date.now()}_${index}`
      })
    )
  );
}
```

### Image Schema in Products

```typescript
// Product image structure
interface ProductImage {
  id: string;           // Cloudinary public_id
  name: string;         // Original filename
  url: string;          // Full-size URL
  thumbnailUrl: string; // 300x300 thumbnail
  downloadUrl?: string; // Direct download link
  isThumbnail: boolean; // Is primary image
  width: number;
  height: number;
  size: number;         // Bytes
}

// In Product schema
const ProductSchema = new Schema({
  images: [{
    id: String,
    name: String,
    url: { type: String, required: true },
    thumbnailUrl: String,
    downloadUrl: String,
    isThumbnail: { type: Boolean, default: false },
    width: Number,
    height: Number,
    size: Number
  }]
});
```

### File Upload API

```typescript
// api/upload/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folder = formData.get('folder') as string || 'blue_ocean/products';

  if (!file) {
    return NextResponse.json(
      { success: false, error: 'No file provided' },
      { status: 400 }
    );
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Invalid file type' },
      { status: 400 }
    );
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { success: false, error: 'File too large (max 10MB)' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImage(buffer, { folder });

  return NextResponse.json({ success: true, image: result });
}
```

---

## 10. Analytics & Tracking

### Event Types

```typescript
enum EventType {
  PAGE_VIEW = 'page_view',
  PRODUCT_VIEW = 'product_view',
  PRODUCT_CLICK = 'product_click',
  CATEGORY_VIEW = 'category_view',
  CATEGORY_CLICK = 'category_click',
  BANNER_IMPRESSION = 'banner_impression',
  BANNER_CLICK = 'banner_click',
  TAG_IMPRESSION = 'tag_impression',
  TAG_CLICK = 'tag_click',
  SEARCH = 'search',
  ADD_TO_INQUIRY = 'add_to_inquiry',
  CONTACT_SUBMIT = 'contact_submit'
}
```

### Analytics Event Schema

```typescript
const AnalyticsEventSchema = new Schema({
  eventType: {
    type: String,
    enum: Object.values(EventType),
    required: true,
    index: true
  },
  entityType: String,     // 'product', 'category', 'banner', etc.
  entityId: Schema.Types.ObjectId,
  sessionId: String,
  userId: Schema.Types.ObjectId,
  ip: String,
  metadata: {
    searchQuery: String,
    referrer: String,
    userAgent: String,
    country: String,
    city: String,
    device: String,
    browser: String,
    os: String,
    source: String,       // UTM source
    medium: String,       // UTM medium
    campaign: String,     // UTM campaign
    position: Number      // Position in list
  }
}, { timestamps: true });

// Indexes for efficient queries
AnalyticsEventSchema.index({ createdAt: -1 });
AnalyticsEventSchema.index({ eventType: 1, entityId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ sessionId: 1 });
```

### Daily Aggregation

```typescript
const DailyAnalyticsSchema = new Schema({
  date: { type: Date, required: true },
  entityType: String,
  entityId: Schema.Types.ObjectId,
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  uniqueSessions: { type: Number, default: 0 },
  uniqueIps: { type: Number, default: 0 }
});

// Unique constraint for upserts
DailyAnalyticsSchema.index(
  { date: 1, entityType: 1, entityId: 1 },
  { unique: true }
);
```

### Tracking Implementation

```typescript
// lib/analytics.ts
export async function trackEvent(
  eventType: EventType,
  data: {
    entityType?: string;
    entityId?: string;
    sessionId: string;
    userId?: string;
    ip: string;
    metadata?: Record<string, any>;
  }
) {
  await connectDB();

  // Create event
  await AnalyticsEvent.create({
    eventType,
    ...data
  });

  // Update daily aggregation
  if (data.entityId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await DailyAnalytics.findOneAndUpdate(
      {
        date: today,
        entityType: data.entityType,
        entityId: data.entityId
      },
      {
        $inc: {
          [eventType.includes('view') ? 'views' : 'clicks']: 1
        },
        $addToSet: {
          uniqueSessions: data.sessionId,
          uniqueIps: data.ip
        }
      },
      { upsert: true }
    );
  }
}
```

### Dashboard Analytics Query

```typescript
// api/admin/dashboard/route.ts
export async function GET() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Get daily trends
  const dailyTrends = await AnalyticsEvent.aggregate([
    {
      $match: {
        createdAt: { $gte: fourteenDaysAgo },
        eventType: { $in: ['product_view', 'category_view', 'page_view'] }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        events: {
          $push: {
            type: '$_id.eventType',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get top products
  const topProducts = await DailyAnalytics.aggregate([
    {
      $match: {
        entityType: 'product',
        date: { $gte: fourteenDaysAgo }
      }
    },
    {
      $group: {
        _id: '$entityId',
        totalViews: { $sum: '$views' },
        totalClicks: { $sum: '$clicks' }
      }
    },
    { $sort: { totalViews: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    }
  ]);

  return NextResponse.json({
    success: true,
    analytics: { dailyTrends, topProducts }
  });
}
```

---

## 11. Performance Optimization

### Database Optimization

```typescript
// 1. Connection Pooling
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// 2. Lean Queries (skip Mongoose document overhead)
const products = await Product.find({ isActive: true }).lean();

// 3. Select Only Needed Fields
const user = await User.findById(id)
  .select('email name role')
  .lean();

// 4. Pagination
const page = 1;
const limit = 20;
const products = await Product.find()
  .skip((page - 1) * limit)
  .limit(limit);

// 5. Compound Indexes
ProductSchema.index({ category: 1, isActive: 1, 'prices.effectivePrice': 1 });
```

### Caching Strategy

```typescript
// 1. HTTP Cache Headers
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
  }
});

// 2. Next.js Revalidation
import { revalidatePath, revalidateTag } from 'next/cache';

// After product update
revalidatePath('/products');
revalidatePath(`/products/${product.slug}`);
revalidateTag('products');

// 3. Static Generation with ISR
export const revalidate = 60; // Revalidate every 60 seconds

// 4. React Query / SWR (client-side)
const { data, isLoading } = useSWR('/api/products', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 30000
});
```

### Image Optimization

```typescript
// 1. Cloudinary Transformations
const optimizedUrl = cloudinary.url(publicId, {
  transformation: [
    { width: 800, height: 600, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' }
  ]
});

// 2. Next.js Image Component
import Image from 'next/image';

<Image
  src={product.images[0].url}
  alt={product.name}
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL={product.images[0].thumbnailUrl}
  sizes="(max-width: 768px) 100vw, 400px"
/>

// 3. Lazy Loading
<Image loading="lazy" ... />
```

### Bundle Optimization

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons'
    ]
  },

  // Enable React Compiler
  reactCompiler: true,

  // Compression
  compress: true
};
```

---

## 12. Error Handling

### API Error Handling Pattern

```typescript
// lib/apiErrors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public details?: Record<string, string>) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

// Error handler wrapper
export function withErrorHandler(handler: Function) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: error.code
          },
          { status: error.statusCode }
        );
      }

      if (error instanceof mongoose.Error.ValidationError) {
        const details = Object.fromEntries(
          Object.entries(error.errors).map(([key, err]) => [key, err.message])
        );
        return NextResponse.json(
          { success: false, error: 'Validation failed', details },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
```

### Client-Side Error Handling

```typescript
// hooks/useApi.ts
export function useApi<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (
    url: string,
    options?: RequestInit
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
```

---

## 13. Testing Strategies

### Unit Testing (Jest)

```typescript
// __tests__/lib/auth.test.ts
describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('correctPassword');

      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });
});
```

### API Testing

```typescript
// __tests__/api/products.test.ts
describe('Products API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      const response = await fetch('/api/products?page=1&limit=10');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.products)).toBe(true);
      expect(data.pagination).toHaveProperty('total');
    });

    it('should filter by category', async () => {
      const response = await fetch('/api/products?categories=sofas');
      const data = await response.json();

      data.products.forEach((product: any) => {
        expect(product.category.slug).toBe('sofas');
      });
    });
  });
});
```

### E2E Testing (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });
});
```

---

## 14. Deployment & DevOps

### Environment Variables

```env
# Database
NEXT_PUBLIC_MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your-64-byte-hex-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://yoursite.com/api/auth/google/callback

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email
GMAIL_ID=...
GMAIL_PASSWORD=... (App Password)

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_GTM_ID=GTM-...

# Site
NEXT_PUBLIC_SITE_URL=https://yoursite.com
NODE_ENV=production
```

### Vercel Deployment

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["bom1"], // Mumbai for India-focused site
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Docker Setup (Optional)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 15. Common Interview Questions

### Q1: "Walk me through the architecture of this application"

**Answer:**
> "This is a full-stack Next.js application using the App Router architecture. Let me break it down:
>
> **Frontend**: React 19 with Server Components for optimal performance. We use Tailwind CSS for styling and Shadcn/ui for consistent UI components. The app is organized into route groups - (user) for customer-facing pages and (admin) for the dashboard.
>
> **Backend**: Next.js API Routes handle all server logic. We have about 60 endpoints covering authentication, products, categories, admin operations, and more. Each endpoint follows RESTful conventions and uses consistent error handling.
>
> **Database**: MongoDB Atlas with Mongoose ODM. We have 14 models covering users, products, categories, analytics, and settings. The schema design uses a mix of embedded documents (product images) and references (user-profile separation).
>
> **Authentication**: JWT-based auth with HTTP-only cookies. We support both email/password and Google OAuth. There's a complete RBAC system with 27 permissions and 4 role levels.
>
> **State Management**: React Context for global state - AuthContext, CurrencyContext, and SiteSettingsContext. This avoids prop drilling while keeping the bundle size small compared to Redux.
>
> **External Services**: Cloudinary for image management, Gmail SMTP for transactional emails, and optional integration with exchange rate APIs for currency conversion."

### Q2: "How do you handle authentication and authorization?"

**Answer:**
> "We use a two-layer security model:
>
> **Authentication** (Who are you?):
> - JWT tokens with jose library for signing/verification
> - 7-day token expiration stored in HTTP-only cookies
> - Password hashing with bcrypt (12 rounds)
> - Account lockout after 5 failed attempts
> - Google OAuth as alternative login method
>
> **Authorization** (What can you do?):
> - Role-based access control with 4 roles: customer, moderator, admin, super_admin
> - 27 granular permissions (view_products, edit_users, manage_roles, etc.)
> - Higher-order function middleware `withAuth()` that checks both authentication and permissions
> - Permissions can be customized per-user beyond their base role
>
> The flow: JWT is sent via cookie → extracted in middleware → verified → user fetched with permissions → permission check against required permissions → allow or deny request."

### Q3: "How does the multi-currency system work?"

**Answer:**
> "The currency system has three layers:
>
> **Storage Layer**: All product prices are stored in a single base currency (configured by admin, e.g., USD). This ensures data consistency and simplifies calculations.
>
> **Conversion Layer**: Exchange rates are stored relative to USD as a common reference. Rates can be either admin-configured or fetched from an external API. The conversion formula goes through USD: `price / fromRate * toRate`.
>
> **Display Layer**: Users can select their preferred currency. The CurrencyContext provides `formatPrice()` which:
> 1. Converts from base currency to user's preferred currency
> 2. Formats using `Intl.NumberFormat` with the appropriate locale
>
> When admin changes the base currency, we trigger a bulk update of all product prices - converting retail, wholesale, and recalculating effective prices. This happens atomically in the API to prevent data inconsistency."

### Q4: "How do you optimize performance?"

**Answer:**
> "Multiple optimization strategies at different layers:
>
> **Database**:
> - Connection pooling (maxPoolSize: 10)
> - Strategic indexing (text search, compound indexes for common queries)
> - Lean queries when we don't need Mongoose documents
> - Selective field projection
>
> **Caching**:
> - HTTP cache headers (s-maxage, stale-while-revalidate)
> - Next.js ISR for product pages
> - React Query/SWR for client-side caching
>
> **Images**:
> - Cloudinary auto-optimization (format, quality)
> - Responsive images with Next.js Image component
> - Lazy loading with blur placeholders
>
> **Bundle**:
> - Tree shaking with ES modules
> - Package import optimization for large libraries
> - React Compiler for automatic memoization
> - Dynamic imports for heavy components"

### Q5: "How do you handle errors?"

**Answer:**
> "We have a structured error handling approach:
>
> **API Level**:
> - Custom error classes (ApiError, ValidationError, etc.) with status codes
> - Higher-order function `withErrorHandler()` wrapping all routes
> - Mongoose validation errors transformed into user-friendly messages
> - Consistent response format: `{ success: boolean, error?: string, data?: any }`
>
> **Client Level**:
> - Custom `useApi` hook with loading and error states
> - Toast notifications for user feedback
> - Error boundaries for React component errors
> - Graceful fallbacks for failed data fetches
>
> **Logging**:
> - Server-side `console.error` for debugging
> - Error details logged without exposing sensitive info to clients
> - In production, this would integrate with error monitoring (Sentry, etc.)"

---

## 16. Scenario-Based Questions

### Scenario 1: "A user reports that prices are showing incorrectly after currency change"

**Debugging Steps:**
```
1. Check CurrencyContext state
   - Is the correct currency being used?
   - Are exchange rates loaded?

2. Check baseCurrency in SiteSettings
   - Is it matching what admin configured?

3. Check conversion calculation
   - Verify rates are relative to USD
   - Test: convertPrice(100, 'USD', 'INR') should give ~8350

4. Check formatPrice output
   - Is locale correct for the currency?
   - Are decimal places appropriate (0 for JPY, 2 for others)?

5. Check network requests
   - Is /api/settings returning correct locale data?
   - Is user profile returning correct currency preference?
```

### Scenario 2: "Admin changed base currency but product prices weren't updated"

**Debugging Steps:**
```
1. Check API response from PUT /api/admin/settings
   - Does it return pricesUpdated: true?
   - Does it return currencyChanged: { from, to }?

2. Check server logs for:
   - "Bulk updated X products from Y to Z"
   - Any errors in price conversion

3. Verify exchange rates were available
   - Were saved rates used or external API?
   - Did the API call fail?

4. Check database directly
   - Are product prices still in old currency values?
   - Is settings.locale.currency updated?

5. Potential fixes:
   - Manual price recalculation script
   - Verify Mongoose bulk write didn't fail silently
```

### Scenario 3: "The site is slow, especially the product listing page"

**Performance Analysis:**
```
1. Database queries
   - Are indexes being used? Check with explain()
   - Is category population causing N+1 queries?
   - Are we fetching more fields than needed?

2. API response time
   - Add timing logs to identify bottlenecks
   - Check MongoDB connection latency

3. Client-side rendering
   - Are we rendering too many products at once?
   - Is image loading optimized?
   - Check for unnecessary re-renders

4. Solutions:
   - Implement virtual scrolling for long lists
   - Add pagination if not present
   - Use React.memo for ProductCard
   - Enable streaming with Suspense
   - Add Redis caching for hot data
```

### Scenario 4: "User can't login, says 'Account locked'"

**Investigation:**
```
1. Check user document in database
   - loginAttempts count
   - lockUntil timestamp

2. Verify lock duration
   - Default is 2 hours, check if time has passed

3. Check for brute force attempts
   - Review login attempt logs
   - Check IP addresses

4. Resolution options:
   - Admin can manually reset: loginAttempts: 0, unset lockUntil
   - Wait for lockUntil to expire
   - Implement admin unlock feature if not exists
```

### Scenario 5: "Images aren't uploading for products"

**Debugging:**
```
1. Check Cloudinary credentials
   - Verify CLOUDINARY_API_KEY and SECRET
   - Test with Cloudinary dashboard

2. Check file validation
   - Is file type allowed? (jpeg, png, webp, gif)
   - Is file size under 10MB?

3. Check server memory
   - Large file uploads may exceed server limits
   - Check SERVER_MAX_BODY_SIZE in config

4. Check response from upload API
   - Is there a specific error message?
   - Check network tab for request details

5. Test upload directly
   - Use Cloudinary upload widget directly
   - Isolate if issue is frontend or backend
```

---

## 17. Code Walkthroughs

### Walkthrough 1: Product Creation Flow

```typescript
// Admin creates a product - Full flow

// 1. Frontend (admin/products/page.tsx)
const handleSubmit = async (formData: ProductFormData) => {
  // Validate form
  if (!formData.name || !formData.category) {
    toast.error('Name and category are required');
    return;
  }

  // Upload images first
  const uploadedImages = await Promise.all(
    formData.images.map(file => uploadImage(file))
  );

  // Create product
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      images: uploadedImages
    })
  });

  const data = await response.json();
  if (data.success) {
    toast.success('Product created');
    router.push('/admin/products');
  }
};

// 2. API Route (api/admin/products/route.ts)
export const POST = withAuth(
  async (request, { user }) => {
    const body = await request.json();

    await connectDB();

    // Generate unique slug
    let slug = slugify(body.name, { lower: true });
    const existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Calculate effective price
    const retail = body.prices.retail || 0;
    const discount = body.prices.discount || 0;
    const effectivePrice = retail * (1 - discount / 100);

    // Create product
    const product = await Product.create({
      ...body,
      slug,
      prices: {
        ...body.prices,
        effectivePrice
      },
      createdBy: user.userId
    });

    // Revalidate pages
    revalidatePath('/products');
    revalidatePath(`/categories/${product.category}`);

    return NextResponse.json({ success: true, product });
  },
  { requiredPermissions: ['create_product'] }
);

// 3. Mongoose Schema Validation (models/Product.ts)
const ProductSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  prices: {
    retail: {
      type: Number,
      required: [true, 'Retail price is required'],
      min: [0, 'Price cannot be negative']
    },
    wholesale: Number,
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    effectivePrice: Number
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  images: [{
    url: { type: String, required: true },
    thumbnailUrl: String,
    isThumbnail: { type: Boolean, default: false }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

### Walkthrough 2: User Login Flow

```typescript
// 1. Frontend (login/page.tsx)
const LoginPage = () => {
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      login(data.user); // Update context
      router.push('/'); // Redirect
    } else {
      setError(data.error);
    }
  };
};

// 2. API Route (api/auth/login/route.ts)
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // Validation
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: 'Email and password required' },
      { status: 400 }
    );
  }

  await connectDB();

  // Find user (include passwordHash which is select: false by default)
  const user = await User.findOne({ email })
    .select('+passwordHash')
    .populate('profile');

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Check account lock
  if (user.lockUntil && user.lockUntil > Date.now()) {
    return NextResponse.json(
      { success: false, error: 'Account locked. Try again later.' },
      { status: 423 }
    );
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    await user.incrementLoginAttempts();
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Reset login attempts on success
  if (user.loginAttempts > 0) {
    await User.updateOne(
      { _id: user._id },
      { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } }
    );
  }

  // Generate JWT
  const token = await signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    isVerified: user.isVerified
  });

  // Set cookie
  const response = NextResponse.json({
    success: true,
    user: {
      userId: user._id,
      email: user.email,
      name: user.profile?.name || user.email.split('@')[0],
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.profile?.avatar
    }
  });

  response.cookies.set('auth_token', token, COOKIE_OPTIONS);

  return response;
}

// 3. Auth Context Update
// When login() is called, it updates the user state
// This triggers re-renders in components using useAuth()
// Protected routes check user existence to allow/redirect
```

### Walkthrough 3: Price Conversion Flow

```typescript
// User views product in different currency

// 1. User selects currency
const CurrencySelector = () => {
  const { currency, setUserCurrency } = useCurrency();

  return (
    <Select value={currency} onValueChange={setUserCurrency}>
      {CURRENCIES.map(c => (
        <SelectItem key={c.code} value={c.code}>
          {c.symbol} {c.name}
        </SelectItem>
      ))}
    </Select>
  );
};

// 2. setUserCurrency saves preference
const setUserCurrency = async (newCurrency: string) => {
  setUserCurrencyState(newCurrency); // Update local state

  if (user) {
    // Save to user profile
    await fetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ preferences: { currency: newCurrency } })
    });
  } else {
    // Save to localStorage for guests
    localStorage.setItem('preferredCurrency', newCurrency);
  }
};

// 3. ProductCard reads formatted price
const ProductCard = ({ product }) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="price">
      {formatPrice(product.prices.effectivePrice)}
    </div>
  );
};

// 4. formatPrice converts and formats
const formatPrice = (price: number) => {
  // price is in baseCurrency (e.g., USD)
  // currency is user's preference (e.g., INR)

  // Convert
  const converted = convertPrice(price, baseCurrency, currency);
  // convertPrice(100, 'USD', 'INR'):
  // Step 1: 100 / 1 = 100 USD
  // Step 2: 100 * 83.5 = 8350 INR

  // Format
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(8350);
  // Output: "₹8,350.00"
};
```

---

## Summary

This furniture e-commerce platform demonstrates proficiency in:

1. **Modern React & Next.js** - App Router, Server Components, API Routes
2. **Database Design** - MongoDB schema design, relationships, indexing
3. **Authentication** - JWT, OAuth, RBAC, account security
4. **API Design** - RESTful conventions, error handling, middleware
5. **State Management** - React Context, custom hooks
6. **Performance** - Caching, optimization, lazy loading
7. **Security** - Input validation, CSRF protection, secure headers
8. **DevOps** - Environment management, deployment strategies

The codebase follows industry best practices and is production-ready with proper error handling, security measures, and scalable architecture.

---

*Document prepared for interview preparation. Last updated: December 2024*
