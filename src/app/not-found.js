"use client";
import notFoundAnimation from "@/assets/error.json";
import Animation from "@/components/shared/animation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import Anchor from "@/components/shared/Anchor";

export default function NotFound() {
  const isMobile = useIsMobile();
  const goBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        {/* <Header /> */}
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
            }) - 10vh)`,
          }}
        />
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Anchor href="#" content="Go Back" onClick={goBack} />
          <Anchor href="/" content="Go to Home" />
        </div>
        {/* <Footer /> */}
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
