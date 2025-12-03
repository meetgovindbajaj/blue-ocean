"use client";
import notFoundAnimation from "@/assets/error.json";
import Animation from "@/components/shared/animation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";

export default function NotFound() {
  const isMobile = useIsMobile();
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <Header />
        <div
          style={{ display: "none" }}
          aria-label="page not found"
          aria-readonly="true"
        >
          404 page not found
        </div>
        <Animation
          data={notFoundAnimation}
          style={{
            height: `calc(100dvh - var(${
              isMobile ? "--navbar-height-mobile" : "--navbar-height"
            }))`,
          }}
        />
        <Footer />
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
