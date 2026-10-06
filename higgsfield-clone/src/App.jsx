import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProductCarousel from './components/sections/ProductCarousel'
import PromoBanner from './components/sections/PromoBanner'
import ModelCards from './components/sections/ModelCards'
import AIInfluencerCTA from './components/sections/AIInfluencerCTA'
import FilmFestival from './components/sections/FilmFestival'
import ChatGPTDots from './components/sections/ChatGPTDots'
import VisualEffects from './components/sections/VisualEffects'
import GenjutsuShowcase from './components/sections/GenjutsuShowcase'
import ExploreProjects from './components/sections/ExploreProjects'
import SupercomputerBanner from './components/sections/SupercomputerBanner'
import CanvasBanner from './components/sections/CanvasBanner'
import PhotodumpSection from './components/sections/PhotodumpSection'
import ExploreMoreFeatures from './components/sections/ExploreMoreFeatures'

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="pb-16 md:pb-0">
        {/* Hero Carousel */}
        <ProductCarousel />
        
        {/* Promo Banner */}
        <PromoBanner />
        
        {/* Model/Tool Cards */}
        <ModelCards />
        
        {/* AI Influencer CTA */}
        <AIInfluencerCTA />
        
        {/* Film Festival */}
        <FilmFestival />
        
        {/* ChatGPT MCP Dots */}
        <ChatGPTDots />
        
        {/* Visual Effects Gallery */}
        <VisualEffects />
        
        {/* Genjutsu Showcase */}
        <GenjutsuShowcase />
        
        {/* Explore Projects */}
        <ExploreProjects />
        
        {/* Supercomputer Banner */}
        <SupercomputerBanner />
        
        {/* Canvas Feature Banner */}
        <CanvasBanner />
        
        {/* Photodump Section */}
        <PhotodumpSection />
        
        {/* Explore More Features */}
        <ExploreMoreFeatures />
      </main>

      <Footer />
    </div>
  )
}

export default App
