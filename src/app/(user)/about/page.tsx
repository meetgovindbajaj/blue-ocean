import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";
import { SEOContainer } from "@/components/ui/skeletons";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blueocean.com";

// Fetch site settings for metadata and SEO
async function getSiteSettings() {
  try {
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings?.siteName || "Blue Ocean";
  const aboutTitle = settings?.about?.title || `About ${siteName}`;
  const title = `${aboutTitle} | ${siteName}`;
  const description =
    settings?.about?.description ||
    `Learn about ${siteName} - ${
      settings?.tagline ||
      "Premium quality solid wood furniture crafted with precision and care."
    }`;
  const ogImage =
    settings?.seo?.ogImage || settings?.logo?.url || `${siteUrl}/og-image.jpg`;

  return {
    title: aboutTitle,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/about`,
      siteName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `About ${siteName}`,
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
      canonical: `${siteUrl}/about`,
    },
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  };
}

interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  image?: string;
}

interface FactoryImage {
  url: string;
  alt?: string;
  order?: number;
}

interface FactoryVideo {
  url: string;
  title?: string;
  order?: number;
}

export default async function AboutPage() {
  // Fetch settings server-side for SEO
  const settings = await getSiteSettings();
  const about = settings?.about || {};
  const siteName = settings?.siteName || "Our Company";

  return (
    <>
      {/* SEO Container - Hidden visually but readable by search engines */}
      <SEOContainer>
        <h1>{about.title || `About ${siteName}`}</h1>
        {settings?.tagline && <p>{settings.tagline}</p>}

        {about.description && (
          <section aria-label="About Description">
            <p>{about.description}</p>
          </section>
        )}

        {about.mission && (
          <section aria-label="Our Mission">
            <h2>Our Mission</h2>
            <p>{about.mission}</p>
          </section>
        )}

        {about.vision && (
          <section aria-label="Our Vision">
            <h2>Our Vision</h2>
            <p>{about.vision}</p>
          </section>
        )}

        {about.history && (
          <section aria-label="Our Story">
            <h2>Our Story</h2>
            <p>{about.history}</p>
          </section>
        )}

        {about.team && about.team.length > 0 && (
          <section aria-label="Our Team">
            <h2>Meet Our Team</h2>
            <ul>
              {about.team.map((member: TeamMember, index: number) => (
                <li key={index}>
                  <h3>{member.name}</h3>
                  <p>Role: {member.role}</p>
                  {member.bio && <p>{member.bio}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {about.factory && (
          <section aria-label="Our Factory">
            <h2>{about.factory.title || "Our Factory"}</h2>
            {about.factory.description && <p>{about.factory.description}</p>}

            {about.factory.images && about.factory.images.length > 0 && (
              <div>
                <h3>Factory Gallery</h3>
                <ul>
                  {about.factory.images.map(
                    (image: FactoryImage, index: number) => (
                      <li key={index}>
                        <a href={image.url}>
                          {image.alt || `Factory image ${index + 1}`}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {about.factory.videos && about.factory.videos.length > 0 && (
              <div>
                <h3>Factory Videos</h3>
                <ul>
                  {about.factory.videos.map(
                    (video: FactoryVideo, index: number) => (
                      <li key={index}>
                        <a href={video.url}>
                          {video.title || `Factory video ${index + 1}`}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </section>
        )}

        <section aria-label="Our Services">
          <h2>What We Offer</h2>
          <ul>
            <li>
              <h3>Custom Design</h3>
              <p>
                {about.services?.customDesign?.description ||
                  "Tailored furniture built exactly to your vision with premium materials and professional AutoCAD support."}
              </p>
            </li>
            <li>
              <h3>Global Shipping</h3>
              <p>
                {about.services?.globalShipping?.description ||
                  "Reliable worldwide delivery with trusted logistics partners and seamless customs handling."}
              </p>
            </li>
            <li>
              <h3>Expert Support</h3>
              <p>
                {about.services?.expertSupport?.description ||
                  "End-to-end guidance with clear communication and order updates shared at every stage."}
              </p>
            </li>
            <li>
              <h3>Quality Control</h3>
              <p>
                {about.services?.qualityControl?.description ||
                  "Strict inspections ensure world-class craftsmanship with internationally aligned QC processes."}
              </p>
            </li>
          </ul>
        </section>
        <nav aria-label="Contact">
          <a href="/contact">Contact Us</a>
        </nav>
      </SEOContainer>

      {/* Client-side interactive component */}
      <AboutPageClient initialSettings={settings} />
    </>
  );
}
