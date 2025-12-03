"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Route } from "next";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
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
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MobileSidebar = () => {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const siteName = settings?.siteName || "Blue Ocean";
  const isAdmin =
    user?.role && ["admin", "super_admin", "moderator"].includes(user.role);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Products", icon: Package },
    { href: "/categories", label: "Categories", icon: Grid3X3 },
    { href: "/about", label: "About Us", icon: Info },
    { href: "/contact", label: "Contact", icon: Mail },
    { href: "/faq", label: "FAQ", icon: HelpCircle },
  ];

  const userItems = [
    { href: "/profile", label: "My Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/inquiries", label: "My Inquiries", icon: MessageSquare },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl font-bold">{siteName}</SheetTitle>
        </SheetHeader>

        {/* User Section */}
        {user ? (
          <div className="flex items-center gap-3 p-4 bg-muted/50">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center overflow-hidden flex-shrink-0 border">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">
                {user.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 p-4 border-b">
            <SheetClose asChild>
              <Link
                href="/login"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/register"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                style={{ color: "white" }}
              >
                <UserPlus className="h-4 w-4" />
                <span>Sign Up</span>
              </Link>
            </SheetClose>
          </div>
        )}

        {/* Navigation - Scrollable Area */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Main Menu */}
            <div className="py-2">
              <span className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Menu
              </span>
              <nav className="mt-1 space-y-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href as Route}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground opacity-50"
                          )}
                        />
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
            </div>

            {/* Account Section */}
            {user && (
              <>
                <Separator className="my-2" />
                <div className="py-2">
                  <span className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Account
                  </span>
                  <nav className="mt-1 space-y-0.5">
                    {userItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href as Route}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-5 w-5",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                            <span className="flex-1">{item.label}</span>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground opacity-50"
                              )}
                            />
                          </Link>
                        </SheetClose>
                      );
                    })}

                    {isAdmin && (
                      <SheetClose asChild>
                        <Link
                          href="/admin"
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            pathname.startsWith("/admin")
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Shield
                            className={cn(
                              "h-5 w-5",
                              pathname.startsWith("/admin")
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                          <span className="flex-1">Admin Panel</span>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4",
                              pathname.startsWith("/admin")
                                ? "text-primary"
                                : "text-muted-foreground opacity-50"
                            )}
                          />
                        </Link>
                      </SheetClose>
                    )}
                  </nav>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer - Logout Button */}
        {user && (
          <SheetFooter className="p-4 border-t mt-auto">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
