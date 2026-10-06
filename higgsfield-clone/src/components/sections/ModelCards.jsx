import { PROMO } from '../../constants/images'
import { Video, Sparkles, Layers, Clapperboard, Film, Cpu } from 'lucide-react'

const CARDS = [
  { title: 'Seedance 2.5', badge: 'TOP', desc: 'The most advanced video model', tag: 'Video', icon: <img src={PROMO.seedanceLogo} alt="" className="h-5 w-5" /> },
  { title: 'AI Influencer', badge: 'NEW', desc: 'Build your next hype machine', icon: <Sparkles size={20} /> },
  { title: 'Higgsfield Genjutsu', badge: 'NEW', desc: 'One video, many versions', icon: <Layers size={20} /> },
  { title: 'Higgsfield MCP for Claude', desc: 'Generate images and videos in Claude', icon: <Cpu size={20} className="text-[#e8845a]" /> },
  { title: 'Cinema Studio 4.0', desc: 'Create cinematic scenes effortlessly', icon: <img src={PROMO.cinemaStudio} alt="" className="h-5 w-5" /> },
  { title: 'Supercomputer', desc: 'Agent powered by GPT-6 Astra', icon: <img src={PROMO.supercomputer} alt="" className="h-5 w-5" /> },
]

export default function ModelCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CARDS.map((c) => (
        <a key={c.title} href="#" className="group relative flex min-h-[130px] flex-col justify-end overflow-hidden rounded-2xl border border-white/5 bg-surface-card p-4 transition-colors hover:bg-[#232628]">
          <span className="absolute left-4 top-4 text-white">{c.icon}</span>
          {c.tag && (
            <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-medium text-white"><Video size={14} />{c.tag}</span>
          )}
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">{c.title}</h3>
            {c.badge && (
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-extrabold italic leading-none ${c.badge === 'TOP' ? 'bg-[#ff2d8f] text-white' : 'bg-lime text-[#1a1a1a]'}`}>{c.badge}</span>
            )}
          </div>
          <p className="mt-1 text-sm leading-snug text-muted line-clamp-2">{c.desc}</p>
        </a>
      ))}
    </div>
  )
}
