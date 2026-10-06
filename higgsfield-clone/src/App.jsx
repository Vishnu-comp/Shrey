import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProductCarousel from './components/sections/ProductCarousel'
import PromoBanner from './components/sections/PromoBanner'
import AIInfluencerCTA from './components/sections/AIInfluencerCTA'
import FilmFestival from './components/sections/FilmFestival'
import ChatGPTDots from './components/sections/ChatGPTDots'
import VisualEffects from './components/sections/VisualEffects'
import GenjutsuShowcase from './components/sections/GenjutsuShowcase'
import CommunityGallery from './components/sections/CommunityGallery'
import ExploreProjects from './components/sections/ExploreProjects'
import SupercomputerBanner from './components/sections/SupercomputerBanner'
import CanvasBanner from './components/sections/CanvasBanner'
import PhotodumpSection from './components/sections/PhotodumpSection'
import ExploreMoreFeatures from './components/sections/ExploreMoreFeatures'
import { SEEDANCE25, GPTIMAGE2, MARKETING, SEEDANCE2, SOULCINEMA, SOUL2 } from './constants/images'

function App() {
  return (
    <div className="min-h-screen bg-surface text-[#f7f7f8]">
      <Navbar />
      <main id="main">
        <ProductCarousel />
        <PromoBanner />
        <AIInfluencerCTA />
        <FilmFestival />
        <ChatGPTDots />
        <VisualEffects />
        <GenjutsuShowcase />
        <CommunityGallery id="seedance-2-5-community" title="Seedance 2.5" sub="The most advanced AI video model" items={SEEDANCE25} cta="View all of Seedance 2.5" />
        <ExploreProjects />
        <SupercomputerBanner />
        <CommunityGallery id="gpt-image-2-community" title="GPT Image 2" sub="4K images with near-perfect text rendering." items={GPTIMAGE2} cta="View all of GPT Image 2" />
        <CanvasBanner />
        <CommunityGallery id="marketing-studio-community" title="Marketing Studio" sub="See what creators and brands are making with Marketing Studio." items={MARKETING} cta="View all of Marketing Studio" />
        <CommunityGallery id="seedance-2-community" title="Seedance 2.0" sub="Browse premium AI video generations from the Higgsfield community." items={SEEDANCE2} cta="View all of Seedance 2.0" />
        <PhotodumpSection />
        <CommunityGallery id="soul-cinema-community" title="Higgsfield Soul Cinema" sub="Explore Higgsfield Community gallery for stunning Higgsfield Soul Cinema creations." items={SOULCINEMA} cta="View all of Higgsfield Soul Cinema" />
        <CommunityGallery id="soul-community" title="Higgsfield Soul 2.0" sub="A culture-native photo model built for fashion, aesthetics, and creative expression." items={SOUL2} cta="View all of Higgsfield Soul 2.0" />
        <ExploreMoreFeatures />
      </main>
      <Footer />
    </div>
  )
}

export default App
