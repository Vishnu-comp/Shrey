import SectionHead from '../SectionHead'
import Masonry from '../Masonry'
import { Arrow } from '../Icons'

// Heading + clipped masonry + "View all" button, shared by the community rows.
export default function CommunityGallery({ id, title, sub, items, cta }) {
  return (
    <section id={id} className="px-4 pt-10">
      <SectionHead title={title} sub={sub} />
      <div className="relative mt-4 max-h-[840px] overflow-hidden">
        <Masonry items={items} cols={4} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[220px] bg-gradient-to-t from-surface via-surface/80 to-transparent" />
        <a href="#" className="btn-ghost-lime strong absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap backdrop-blur">{cta}<Arrow /></a>
      </div>
    </section>
  )
}
