"use client";

import styles from "./page.module.css";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Target, Eye, Building2, PencilRuler, Globe2, Headset, ShieldCheck, History, Users, User, Factory, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import CarouselWrapper from "@/components/ui/CarouselWrapper";
import { useState, useCallback, useMemo } from "react";

// Default services data (fallback when no dynamic data exists)
const DEFAULT_SERVICES = {
  customDesign: {
    description: "Tailored furniture built exactly to your vision with premium materials and professional AutoCAD support.",
    features: [],
  },
  globalShipping: {
    description: "Reliable worldwide delivery with trusted logistics partners and seamless customs handling.",
    features: [],
  },
  expertSupport: {
    description: "End-to-end guidance with clear communication and order updates shared at every stage.",
    features: [],
  },
  qualityControl: {
    description: "Strict inspections ensure world-class craftsmanship with internationally aligned QC processes.",
    features: [],
  },
};

interface AboutPageClientProps {
  initialSettings?: any;
}

// Helper to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  // Handle embed URLs
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  // Handle watch URLs
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Handle short URLs
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
};

const AboutPageClient = ({ initialSettings }: AboutPageClientProps) => {
  const { settings: contextSettings, loading } = useSiteSettings();
  // Use initial settings from server if available, otherwise fall back to context
  const settings = initialSettings || contextSettings;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handleImageClick = useCallback((imageUrl: string | undefined) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
    }
  }, []);

  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Memoize sorted factory images to avoid re-sorting on every render
  const sortedFactoryImages = useMemo(() => {
    const images = settings?.about?.factory?.images;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return [];
    }
    return [...images]
      .filter((img) => img?.url)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [settings?.about?.factory?.images]);

  // Memoize sorted factory videos to avoid re-sorting on every render
  const sortedFactoryVideos = useMemo(() => {
    const videos = settings?.about?.factory?.videos;
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return [];
    }
    return [...videos]
      .filter((vid) => vid?.url)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [settings?.about?.factory?.videos]);

  // Skip loading state if we have initial settings from server
  if (loading && !initialSettings) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </section>
          <section className={styles.section}>
            <Skeleton className="h-24 w-full rounded-lg" />
          </section>
          <section className={styles.missionVision}>
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </section>
        </div>
      </div>
    );
  }

  const about = settings?.about || {};
  const siteName = settings?.siteName || "Our Company";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.title}>{about.title || `About ${siteName}`}</h1>
          {settings?.tagline && (
            <p className={styles.tagline}>{settings.tagline}</p>
          )}
        </section>

        {/* Description */}
        {about.description && (
          <section className={styles.section}>
            <p className={styles.description}>{about.description}</p>
          </section>
        )}

        {/* Mission & Vision */}
        {(about.mission || about.vision) && (
          <section className={styles.missionVision}>
            {about.mission && (
              <div className={styles.card}>
                <div className={styles.cardIcon}>
                  <Target size={32} />
                </div>
                <h2 className={styles.cardTitle}>Our Mission</h2>
                <p className={styles.cardText}>{about.mission}</p>
              </div>
            )}
            {about.vision && (
              <div className={styles.card}>
                <div className={styles.cardIcon}>
                  <Eye size={32} />
                </div>
                <h2 className={styles.cardTitle}>Our Vision</h2>
                <p className={styles.cardText}>{about.vision}</p>
              </div>
            )}
          </section>
        )}

        {/* History Section */}
        {about.history && (
          <section className={styles.historySection}>
            <h2 className={styles.sectionTitle}>
              <History size={24} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
              Our Story
            </h2>
            <div className={styles.historyContent}>
              <p className={styles.historyText}>{about.history}</p>
            </div>
          </section>
        )}

        {/* Team Section */}
        {about.team && about.team.length > 0 && (
          <section className={styles.teamSection}>
            <h2 className={styles.sectionTitle}>
              <Users size={24} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
              Meet Our Team
            </h2>
            {about.team.length > 3 ? (
              <div className={styles.teamCarouselWrapper}>
                <CarouselWrapper
                  variant="default"
                  data={about.team.map((member: any, index: number) => ({
                    id: `team-${index}`,
                    image: member.image || "",
                    alt: member.name,
                    content: (
                      <div className={styles.teamCard}>
                        <div className={styles.teamImageWrapper}>
                          {member.image ? (
                            <Image
                              src={member.image}
                              alt={member.name}
                              width={100}
                              height={100}
                              className={styles.teamImage}
                            />
                          ) : (
                            <User size={40} className={styles.teamPlaceholder} />
                          )}
                        </div>
                        <h3 className={styles.teamName}>{member.name}</h3>
                        <p className={styles.teamRole}>{member.role}</p>
                        {member.bio && <p className={styles.teamBio}>{member.bio}</p>}
                      </div>
                    ),
                  }))}
                  options={{
                    showControlBtns: true,
                    showControlDots: false,
                    autoPlay: true,
                    autoPlayInterval: 4000,
                    loop: true,
                    itemsPerView: {
                      mobile: 1,
                      tablet: 2,
                      desktop: 3,
                      xl: 4,
                    },
                  }}
                  renderItem={(item) => item.content}
                />
              </div>
            ) : (
              <div className={styles.teamGrid}>
                {about.team.map((member: any, index: number) => (
                  <div key={index} className={styles.teamCard}>
                    <div className={styles.teamImageWrapper}>
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={100}
                          height={100}
                          className={styles.teamImage}
                        />
                      ) : (
                        <User size={40} className={styles.teamPlaceholder} />
                      )}
                    </div>
                    <h3 className={styles.teamName}>{member.name}</h3>
                    <p className={styles.teamRole}>{member.role}</p>
                    {member.bio && <p className={styles.teamBio}>{member.bio}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Factory Section */}
        {about?.factory && (sortedFactoryImages.length > 0 || sortedFactoryVideos.length > 0 || about.factory.description) && (
          <section className={styles.factorySection}>
            <h2 className={styles.sectionTitle}>
              <Factory size={24} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
              {about.factory.title || "Our Factory"}
            </h2>

            {about.factory.description && (
              <p className={styles.factoryDescription}>{about.factory.description}</p>
            )}

            {/* Factory Images - Masonry Grid */}
            {sortedFactoryImages.length > 0 && (
              <div className={styles.factoryImagesSection}>
                <h3 className={styles.factorySubtitle}>Factory Gallery</h3>
                <div className={styles.masonryGrid}>
                  {sortedFactoryImages.map((image, index) => (
                    <div
                      key={`factory-img-${index}`}
                      className={styles.masonryItem}
                      onClick={() => handleImageClick(image.url)}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `Factory image ${index + 1}`}
                        width={400}
                        height={300}
                        className={styles.masonryImage}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Factory Videos */}
            {sortedFactoryVideos.length > 0 && (
              <div className={styles.factoryVideosSection}>
                <h3 className={styles.factorySubtitle}>Factory Videos</h3>
                <div className={styles.videosGrid}>
                  {sortedFactoryVideos.map((video, index) => {
                    const videoId = getYouTubeVideoId(video.url);
                    if (!videoId) return null;

                    return (
                      <div key={`factory-vid-${index}`} className={styles.videoCard}>
                        {video.title && (
                          <h4 className={styles.videoTitle}>{video.title}</h4>
                        )}
                        <div className={styles.videoWrapper}>
                          {playingVideo === videoId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                              title={video.title || `Factory video ${index + 1}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className={styles.videoIframe}
                            />
                          ) : (
                            <div
                              className={styles.videoThumbnail}
                              onClick={() => setPlayingVideo(videoId)}
                            >
                              <Image
                                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                alt={video.title || `Factory video ${index + 1}`}
                                fill
                                className={styles.thumbnailImage}
                              />
                              <div className={styles.playButton}>
                                <Play size={48} fill="white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Image Modal for zoom */}
        {selectedImage && (
          <div className={styles.imageModal} onClick={closeImageModal}>
            <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeModalButton} onClick={closeImageModal}>
                &times;
              </button>
              <Image
                src={selectedImage}
                alt="Full size view"
                width={1200}
                height={800}
                className={styles.modalImage}
              />
            </div>
          </div>
        )}

        {/* Services Section */}
        <section className={styles.servicesSection}>
          <h2 className={styles.sectionTitle}>What We Offer</h2>
          <p className={styles.sectionSubtitle}>
            Comprehensive solutions to bring your furniture dreams to life
          </p>
          <div className={styles.servicesGrid}>
            {/* Custom Design */}
            <div className={styles.serviceCard}>
              <div
                className={styles.serviceIcon}
                style={{ backgroundColor: "#3b82f615", color: "#3b82f6" }}
              >
                <PencilRuler size={28} />
              </div>
              <h3 className={styles.serviceTitle}>Custom Design</h3>
              <p className={styles.serviceDescription}>
                {about.services?.customDesign?.description || DEFAULT_SERVICES.customDesign.description}
              </p>
            </div>

            {/* Global Shipping */}
            <div className={styles.serviceCard}>
              <div
                className={styles.serviceIcon}
                style={{ backgroundColor: "#10b98115", color: "#10b981" }}
              >
                <Globe2 size={28} />
              </div>
              <h3 className={styles.serviceTitle}>Global Shipping</h3>
              <p className={styles.serviceDescription}>
                {about.services?.globalShipping?.description || DEFAULT_SERVICES.globalShipping.description}
              </p>
            </div>

            {/* Expert Support */}
            <div className={styles.serviceCard}>
              <div
                className={styles.serviceIcon}
                style={{ backgroundColor: "#8b5cf615", color: "#8b5cf6" }}
              >
                <Headset size={28} />
              </div>
              <h3 className={styles.serviceTitle}>Expert Support</h3>
              <p className={styles.serviceDescription}>
                {about.services?.expertSupport?.description || DEFAULT_SERVICES.expertSupport.description}
              </p>
            </div>

            {/* Quality Control */}
            <div className={styles.serviceCard}>
              <div
                className={styles.serviceIcon}
                style={{ backgroundColor: "#f59e0b15", color: "#f59e0b" }}
              >
                <ShieldCheck size={28} />
              </div>
              <h3 className={styles.serviceTitle}>Quality Control</h3>
              <p className={styles.serviceDescription}>
                {about.services?.qualityControl?.description || DEFAULT_SERVICES.qualityControl.description}
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className={styles.ctaSection}>
          <Building2 size={48} className={styles.ctaIcon} />
          <h2 className={styles.ctaTitle}>Get in Touch</h2>
          <p className={styles.ctaText}>
            Have questions? We&apos;d love to hear from you.
          </p>
          <a href="/contact" className={styles.ctaButton}>
            Contact Us
          </a>
        </section>
      </div>
    </div>
  );
};

export default AboutPageClient;
