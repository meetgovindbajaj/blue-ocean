import Hero from "@/components/landing/Hero";
import FeaturedProducts from "@/components/landing/FeaturedProducts";
import AboutUs from "@/components/landing/AboutUs";
import Services from "@/components/landing/Services";
import ContactCTA from "@/components/landing/ContactCTA";
import "@/styles/landing.scss";

export default function HomePage() {
  return (
    <main className="homepage">
      <Hero />
      <FeaturedProducts />
      <AboutUs />
      <Services />
      <ContactCTA />
    </main>
  );
}
