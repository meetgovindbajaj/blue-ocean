import { Suspense } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <Suspense fallback={<div className="h-16 border-b" />}>
          <Header />
        </Suspense>
        <Suspense>{children}</Suspense>
        <Footer />
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
