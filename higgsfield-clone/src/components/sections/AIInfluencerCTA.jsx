import { INFLUENCER } from '../../constants/images'
import { Gift } from 'lucide-react'

export default function AIInfluencerCTA() {
  return (
    <section className="px-4 pt-6">
      <a href="#" className="relative block h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-black text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,.22),rgba(0,0,0,0)_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(60,60,60,.45),rgba(0,0,0,0)_70%)]" />
        <img src={INFLUENCER.left} alt="" className="absolute bottom-0 left-6 hidden h-[336px] w-auto md:block" />
        <img src={INFLUENCER.right} alt="" className="absolute bottom-0 right-0 hidden h-[316px] w-auto md:block" />
        <div className="relative mx-auto flex h-full max-w-[580px] flex-col items-center px-4 pt-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/20 px-3 py-1 text-sm font-semibold text-lime backdrop-blur"><Gift size={14} />Try Free</span>
          <p className="mt-9 text-base font-bold uppercase">AI Influencer</p>
          <h2 className="mt-1 text-[48px] md:text-[56px] leading-[1.02] font-extrabold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-[#8a8a8a]">
            Build your next<br />hype machine
          </h2>
          <p className="mt-3 text-lg text-white/50">Pick the look. Add motion. Build hype.</p>
          <span className="btn-lime mt-auto mb-8 !h-10 !text-[15px]">Create your own AI Influencer</span>
        </div>
      </a>
    </section>
  )
}
