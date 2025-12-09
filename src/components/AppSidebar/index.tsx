"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Route } from "next";
import {
  BadgePercent,
  ChartArea,
  ChartBarStacked,
  ChevronRight,
  ChevronsUpDown,
  FileSpreadsheet,
  Home,
  ImageIcon,
  LayoutList,
  LogOut,
  MessageSquare,
  Settings,
  Tags,
  Users,
  Store,
  User,
  ArrowLeft,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

// Navigation items organized by section
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/admin" as Route,
    icon: Home,
  },
];

const contentNavItems = [
  {
    title: "Products",
    url: "/admin/products" as Route,
    icon: LayoutList,
  },
  {
    title: "Categories",
    url: "/admin/categories" as Route,
    icon: ChartBarStacked,
  },
  {
    title: "Tags",
    url: "/admin/tags" as Route,
    icon: Tags,
  },
  {
    title: "Images",
    url: "/admin/images" as Route,
    icon: ImageIcon,
  },
];

const marketingNavItems = [
  {
    title: "Offers",
    url: "/admin/offers" as Route,
    icon: BadgePercent,
  },
];

const managementNavItems = [
  {
    title: "Users",
    url: "/admin/users" as Route,
    icon: Users,
  },
  {
    title: "Inquiries",
    url: "/admin/inquiries" as Route,
    icon: MessageSquare,
  },
];

const analyticsNavItems = [
  {
    title: "Analytics",
    url: "/admin/analytics" as Route,
    icon: ChartArea,
  },
  {
    title: "Reports",
    url: "/admin/reports" as Route,
    icon: FileSpreadsheet,
  },
];

const settingsNavItems = [
  {
    title: "Settings",
    url: "/admin/settings" as Route,
    icon: Settings,
  },
];

interface NavItem {
  title: string;
  url: Route;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { title: string; url: Route }[];
}

interface NavGroupProps {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  onNavigate?: () => void;
}

const NavGroup = ({ label, items, defaultOpen = true, onNavigate }: NavGroupProps) => {
  const pathname = usePathname();

  return (
    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover:bg-sidebar-accent rounded-md px-2 transition-colors">
            <span>{label}</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url} onClick={onNavigate}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.subItems && item.subItems.length > 0 && (
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url} onClick={onNavigate}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

const NavUser = () => {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const AppSidebar = () => {
  const { settings } = useSiteSettings();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const siteName = settings?.siteName || "Blue Ocean";

  // Close mobile sidebar on navigation
  const handleNavigate = () => {
    if (isMobile) {
      setTimeout(() => setOpenMobile(false), 100);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin" onClick={handleNavigate}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{siteName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin Panel
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} onClick={handleNavigate}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content Management */}
        <NavGroup label="Content" items={contentNavItems} onNavigate={handleNavigate} />

        {/* Marketing */}
        <NavGroup label="Marketing" items={marketingNavItems} onNavigate={handleNavigate} />

        {/* User Management */}
        <NavGroup label="Management" items={managementNavItems} onNavigate={handleNavigate} />

        {/* Analytics & Reports */}
        <NavGroup label="Analytics" items={analyticsNavItems} onNavigate={handleNavigate} />

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} onClick={handleNavigate}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
