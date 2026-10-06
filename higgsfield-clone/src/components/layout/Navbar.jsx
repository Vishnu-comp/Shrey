import { useState } from 'react'
import { Logo, Tag, Close, Gem, Sparkle, Globe } from '../Icons'

const LINKS = [
  { label: 'Explore', active: true },
  { label: 'Image' },
  { label: 'Video' },
  { label: 'Audio' },
  { label: 'MCP' },
  { label: 'API', badge: 'New' },
  { label: 'AI Influencer', badge: 'New' },
  { divider: true },
  { label: 'ChatGPT Plugin' },
  { label: 'Genjutsu', badge: 'Top' },
  { label: 'Ads Studio' },
]

export default function Navbar() {
  const [promo, setPromo] = useState(true)
  return (
    <>
      {promo && (
        <header className="relative h-11 bg-lime text-[#1a1a1a]">
          <div className="h-full flex items-center justify-center gap-3 px-12 text-[15px] font-semibold">
            <Tag />
            <span className="hidden sm:inline">Get an additional discount on premium plans after signing up</span>
            <span className="sm:hidden">Extra discount after signing up</span>
            <a href="#" className="h-6 px-3 grid place-items-center rounded-lg bg-white text-[13px] font-semibold">Get your discount</a>
          </div>
          <button aria-label="Dismiss" onClick={() => setPromo(false)} className="absolute right-4 top-1/2 -translate-y-1/2">
            <Close />
          </button>
        </header>
      )}
      <header className="sticky top-0 z-50 h-[52px] bg-surface">
        <div className="h-full flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <a href="/" aria-label="Higgsfield"><Logo /></a>
            <nav className="hidden lg:flex items-center gap-1 overflow-hidden whitespace-nowrap text-[15px] font-medium [mask-image:linear-gradient(90deg,#000_92%,transparent)]">
              {LINKS.map((l, i) =>
                l.divider ? (
                  <span key={i} className="mx-2 h-4 w-px bg-white/20" />
                ) : (
                  <a key={l.label} href="#" className={`px-2 py-1 flex items-center gap-1.5 ${l.active ? 'text-lime' : 'text-[#898a8b] hover:text-white'} ${l.label === 'ChatGPT Plugin' ? '!text-white/80' : ''}`}>
                    {l.label}
                    {l.badge && (
                      <span className={`text-[11px] font-bold leading-none px-1.5 py-1 rounded-full ${l.badge === 'Top' ? 'bg-lime/15 text-lime' : 'bg-lime/25 text-lime'}`}>{l.badge}</span>
                    )}
                  </a>
                ),
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-[15px] font-medium">
            <a href="#" className="relative hidden md:flex h-9 items-center gap-2 px-3.5 rounded-xl bg-white/5 text-white">
              <Gem /> Pricing
              <span className="absolute left-1/2 -translate-x-1/2 top-[30px] whitespace-nowrap rounded-full bg-[#ff2d8f] px-2 py-0.5 text-[10px] font-bold leading-none text-white">30% OFF</span>
            </a>
            <a href="#" className="hidden md:flex h-9 items-center gap-2 px-3.5 rounded-xl bg-white/5 text-white"><Sparkle /> Enterprise</a>
            <button aria-label="Language" className="hidden md:grid h-9 w-9 place-items-center rounded-xl bg-white/5"><Globe /></button>
            <span className="hidden md:block mx-2 h-4 w-px bg-white/20" />
            <button className="h-9 px-4 rounded-xl bg-lime/10 text-lime font-semibold">Login</button>
            <button className="h-9 px-4 rounded-xl bg-lime text-[#1a1a1a] font-semibold">Sign up</button>
          </div>
        </div>
      </header>
    </>
  )
}
