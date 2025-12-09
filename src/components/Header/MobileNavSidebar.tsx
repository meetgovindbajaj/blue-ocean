"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Route } from "next";
import {
  Home,
  Package,
  Grid3X3,
  Info,
  Mail,
  User,
  Settings,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Menu,
  Store,
  TrendingUp,
  Sparkles,
  Tag,
  ArrowUpDown,
  Clock,
  DollarSign,
  Percent,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { cn } from "@/lib/utils";

// Navigation items
const mainNavItems = [
  { title: "Home", url: "/" as Route, icon: Home },
  { title: "Products", url: "/products" as Route, icon: Package },
  { title: "Categories", url: "/categories" as Route, icon: Grid3X3 },
];

const shopNavItems = [
  {
    title: "Best Sellers",
    url: "/products?sort=trending" as Route,
    icon: TrendingUp,
  },
  {
    title: "New Arrivals",
    url: "/products?sort=newest" as Route,
    icon: Sparkles,
  },
  { title: "On Sale", url: "/products?sort=discount" as Route, icon: Tag },
];

const sortOptions = [
  { title: "Newest First", url: "/products?sort=newest" as Route, icon: Clock },
  {
    title: "Price: Low to High",
    url: "/products?sort=price_asc" as Route,
    icon: DollarSign,
  },
  {
    title: "Price: High to Low",
    url: "/products?sort=price_desc" as Route,
    icon: DollarSign,
  },
  {
    title: "Best Discount",
    url: "/products?sort=discount" as Route,
    icon: Percent,
  },
  {
    title: "Trending",
    url: "/products?sort=trending" as Route,
    icon: TrendingUp,
  },
];

const supportNavItems = [
  { title: "About Us", url: "/about" as Route, icon: Info },
  { title: "Contact", url: "/contact" as Route, icon: Mail },
  { title: "FAQ", url: "/faq" as Route, icon: HelpCircle },
];

const accountNavItems = [
  { title: "My Profile", url: "/profile" as Route, icon: User },
  { title: "Settings", url: "/settings" as Route, icon: Settings },
  { title: "My Inquiries", url: "/inquiries" as Route, icon: MessageSquare },
];

interface NavItem {
  title: string;
  url: Route;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroupProps {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  onNavigate: () => void;
}

const NavGroup = ({
  label,
  items,
  defaultOpen = true,
  onNavigate,
}: NavGroupProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <span>{label}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 px-2">
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(item.url + "/");
            return (
              <Link
                key={item.title}
                href={item.url}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const MobileNavSidebar = () => {
  const [open, setOpen] = useState(false);
  const { settings } = useSiteSettings();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const siteName = settings?.siteName || "Blue Ocean";

  const isAdmin =
    user?.role && ["admin", "super_admin", "moderator"].includes(user.role);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleNavigate = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push("/");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-semibold">{siteName}</span>
              <span className="text-xs text-muted-foreground font-normal">
                Furniture Store
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="py-2">
            {/* Main Navigation */}
            <div className="space-y-1 px-2 py-2">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    onClick={handleNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>

            <Separator className="my-2" />

            {/* Shop Section */}
            {/* <NavGroup label="Shop" items={shopNavItems} onNavigate={handleNavigate} /> */}

            {/* Sort Options */}
            <NavGroup
              label="Shop"
              items={sortOptions}
              // defaultOpen={false}
              onNavigate={handleNavigate}
            />

            <Separator className="my-2" />

            {/* Support Section */}
            <NavGroup
              label="Support"
              items={supportNavItems}
              onNavigate={handleNavigate}
            />

            {/* Account Section - Only for logged-in users */}
            {user && (
              <>
                <Separator className="my-2" />
                <NavGroup
                  label="Account"
                  items={accountNavItems}
                  onNavigate={handleNavigate}
                />
              </>
            )}

            {/* Admin Link for admin users */}
            {isAdmin && (
              <>
                <Separator className="my-2" />
                <div className="px-2 py-2">
                  <Link
                    href="/admin"
                    onClick={handleNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      pathname.startsWith("/admin")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer - User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {user.email}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/login" onClick={handleNavigate}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/register" onClick={handleNavigate}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavSidebar;
