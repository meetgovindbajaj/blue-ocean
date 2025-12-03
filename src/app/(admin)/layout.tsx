import { Suspense } from "react";
import AppSidebar from "@/components/AppSidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { Skeleton } from "@/components/ui/skeleton";

function SidebarFallback() {
  return (
    <div className="w-64 h-screen border-r bg-background p-4 space-y-4">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <SidebarProvider>
          <Suspense fallback={<SidebarFallback />}>
            <AppSidebar />
          </Suspense>
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <span className="text-sm font-medium text-muted-foreground">
                Admin Dashboard
              </span>
            </header>
            <main className="flex-1 overflow-auto">
              <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
                {children}
              </Suspense>
            </main>
          </SidebarInset>
          <Toaster position="top-right" />
        </SidebarProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
