import { GENJUTSU } from '../../constants/images'
import Masonry from '../Masonry'
import { Layers } from 'lucide-react'

export default function GenjutsuShowcase() {
  return (
    <section className="px-4 pt-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black p-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/15 px-3 py-1.5 text-sm font-semibold text-lime"><Layers size={14} />New model</span>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[620px]">
            <h2 className="text-[34px] font-extrabold uppercase leading-none tracking-tight text-lime">Higgsfield Genjutsu</h2>
            <p className="mt-4 text-base leading-6 text-muted">Reality Manipulation — transfer motion into new scenes, or swap details while everything else stays as filmed.</p>
          </div>
          <div className="flex gap-3">
            <a href="#" className="btn-lime">Start generating</a>
            <a href="#" className="btn-white">Learn more</a>
          </div>
        </div>
        <div className="relative mt-8 max-h-[640px] overflow-hidden">
          <Masonry items={GENJUTSU} cols={5} gap={8} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] bg-gradient-to-t from-black via-black/85 to-transparent" />
          <a href="#" className="btn-ghost-lime absolute bottom-3 left-1/2 -translate-x-1/2">View all presets</a>
        </div>
      </div>
    </section>
  )
}
