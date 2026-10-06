import { Home, Compass, Library, User } from 'lucide-react'

export default function Navbar() {
  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-1 to-gold-2 flex items-center justify-center">
              <span className="text-black font-bold text-sm">H</span>
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">Higgsfield</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-white text-sm font-medium hover:text-gold-2 transition-colors">Home</a>
            <a href="#" className="text-text-secondary text-sm font-medium hover:text-white transition-colors">Community</a>
            <a href="#" className="text-text-secondary text-sm font-medium hover:text-white transition-colors">Library</a>
            <a href="#" className="text-text-secondary text-sm font-medium hover:text-white transition-colors">Profile</a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button className="text-sm text-text-secondary hover:text-white transition-colors hidden sm:block">Log in</button>
            <button className="glow-btn text-sm px-5 py-2">Sign up</button>
          </div>
        </div>
      </nav>

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/5 md:hidden">
        <div className="flex items-center justify-around h-16">
          <a href="#" className="flex flex-col items-center gap-1 text-white">
            <Home size={20} />
            <span className="text-[10px]">Home</span>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 text-text-secondary">
            <Compass size={20} />
            <span className="text-[10px]">Community</span>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 text-text-secondary">
            <Library size={20} />
            <span className="text-[10px]">Library</span>
          </a>
          <a href="#" className="flex flex-col items-center gap-1 text-text-secondary">
            <User size={20} />
            <span className="text-[10px]">Profile</span>
          </a>
        </div>
      </nav>
    </>
  )
}
