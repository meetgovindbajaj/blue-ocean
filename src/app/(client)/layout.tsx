import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignOutButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import "@/styles/rootStyles.scss";
import { getAllData } from "@/lib/api";
import Header from "@/components/header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.json",
  title: "Blue Ocean Export",
  description: "Quality Solid Wood Furniture",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/api/v1/image/favicon.ico?d=0",
        type: "image/x-icon",
        sizes: "48x48",
      },
      {
        url: "/api/v1/image/favicon-16x16.png?d=0&w=16&h=16&format=png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/api/v1/image/favicon-32x32.png?d=0&w=32&h=32&format=png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [
      {
        url: "/api/v1/image/apple-touch-icon.png?d=0&w=180&h=180&format=png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { categories } = await getAllData();

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${roboto.variable}`}>
          <header className="flex justify-end items-center p-4 gap-4 h-16 hidden">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
              <SignOutButton />
              {/* <UserProfile /> */}
            </SignedIn>
          </header>
          {/* <header
            style={{ height: "3rem", backgroundColor: "black", color: "white" }}
          >
            dummy navbar
          </header> */}
          <Header _categories={categories as ICategory[]} />
          <div className="main">{children}</div>
          <footer
            style={{
              height: "500px",
              backgroundColor: "black",
              color: "white",
            }}
          >
            dummy footer
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
