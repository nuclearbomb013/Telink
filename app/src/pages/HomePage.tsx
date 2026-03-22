import HeroSection from '@/sections/HeroSection';
import LatestArticles from '@/sections/LatestArticles';
import ArtCategory from '@/sections/ArtCategory';
import LifestyleSection from '@/sections/LifestyleSection';
import DesignSection from '@/sections/DesignSection';
import GreenTribe from '@/sections/GreenTribe';
import AuthorsSection from '@/sections/AuthorsSection';
import InstagramGallery from '@/sections/InstagramGallery';
import ForumSection from '@/sections/ForumSection';

/**
 * Home Page Component
 *
 * Renders all the main sections of the TechInk website.
 * This component is used as the main landing page.
 */
const HomePage = () => {
  return (
    <main id="main-content" tabIndex={-1}>
      {/* Hero Section - Split Screen Perspective Theater */}
      <HeroSection />

      {/* Latest Articles - Horizontal Dynamic Flow */}
      <LatestArticles />

      {/* Art Category - Fixed Sidebar with Reveal */}
      <ArtCategory />

      {/* Lifestyle - Scattered Polaroid Chaos */}
      <LifestyleSection />

      {/* Design - Mosaic Wall */}
      <DesignSection />

      {/* Green Tribe - Parallax Video Background */}
      <GreenTribe />

      {/* Forum Section - Community Forum Preview */}
      <ForumSection />

      {/* Authors - Orbital Avatar System */}
      <AuthorsSection />

      {/* Instagram Gallery - 3D Tunnel */}
      <InstagramGallery />
    </main>
  );
};

export default HomePage;