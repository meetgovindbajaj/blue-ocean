import { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalDocumentClient from "./LegalDocumentClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getLegalDocument(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/legal-documents/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.document : null;
  } catch (error) {
    console.error("Failed to fetch legal document:", error);
    return null;
  }
}

async function getSiteSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/settings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.settings : null;
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [document, settings] = await Promise.all([
    getLegalDocument(slug),
    getSiteSettings(),
  ]);

  if (!document) {
    return {
      title: "Document Not Found",
    };
  }

  const siteName = settings?.siteName || "Blue Ocean";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";
  const title = `${document.title} | ${siteName}`;
  const description = `Read our ${document.title.toLowerCase()} - Important legal information from ${siteName}.`;
  const ogImage = settings?.seo?.ogImage || settings?.logo?.url || `${siteUrl}/og-image.jpg`;

  return {
    title: document.title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/legal/${slug}`,
      siteName,
      locale: "en_US",
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: document.title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: siteName,
    },
    alternates: {
      canonical: `${siteUrl}/legal/${slug}`,
    },
  };
}

export default async function LegalDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const document = await getLegalDocument(slug);

  if (!document) {
    notFound();
  }

  return <LegalDocumentClient document={document} />;
}
