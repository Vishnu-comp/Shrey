import { VFX } from '../../constants/images'
import SectionHead from '../SectionHead'

export default function VisualEffects() {
  const cols = [0, 1, 2, 3, 4].map((c) => VFX.filter((_, i) => i % 5 === c))
  return (
    <section className="px-4 pt-10">
      <SectionHead
        title="Visual Effects"
        sub="Big-budget visual effects, from explosions to surreal transformations."
        action={<a href="#" className="btn-lime">Try for free</a>}
      />
      <div className="relative mt-4 max-h-[896px] overflow-hidden">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {cols.map((c, ci) => (
            <div key={ci} className={`flex flex-col gap-2 ${ci > 1 ? 'hidden md:flex' : ''}`}>
              {c.map((u) => (
                <img key={u} src={u} alt="" loading="lazy" className="w-full rounded-2xl bg-surface-card object-cover" />
              ))}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-surface to-transparent" />
        <a href="#" className="btn-ghost-lime absolute bottom-6 left-1/2 -translate-x-1/2">View all presets</a>
      </div>
    </section>
  )
}
