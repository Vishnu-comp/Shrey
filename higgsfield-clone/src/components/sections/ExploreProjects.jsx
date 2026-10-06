import { PROJECTS } from '../../constants/images'
import SectionHead from '../SectionHead'
import { Arrow } from '../Icons'

export default function ExploreProjects() {
  return (
    <section className="px-4 pt-10">
      <SectionHead title="Explore the inside of every project" sub="See all prompts, assets, and how each project was created" />
      <div className="relative mt-4 max-h-[448px] overflow-hidden">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROJECTS.map((p) => (
            <a key={p.title} href="#" className="block rounded-2xl border border-white/5 bg-surface-card p-1">
              <img src={p.image} alt="" loading="lazy" className="aspect-[288/164] w-full rounded-xl object-cover" />
              <div className="flex items-center gap-2 px-2 py-3 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime text-[#1a1a1a] text-xs font-extrabold">H</span>
                <span className="min-w-0 truncate font-semibold">{p.title}<span className="font-normal text-muted"> by Higgsfield Studio</span></span>
                <span className="ml-auto shrink-0 rounded-lg bg-white/10 px-2 py-1 text-xs font-medium">Public</span>
              </div>
            </a>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />
        <a href="#" className="btn-ghost-lime strong absolute bottom-3 left-1/2 -translate-x-1/2 backdrop-blur">Explore community<Arrow /></a>
      </div>
    </section>
  )
}
