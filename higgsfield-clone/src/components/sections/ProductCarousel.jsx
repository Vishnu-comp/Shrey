import { useRef } from 'react'
import { HERO_CARDS } from '../../constants/images'
import LazyVideo from '../LazyVideo'
import { Chevron } from '../Icons'

export default function ProductCarousel() {
  const ref = useRef(null)
  const next = () => ref.current?.scrollBy({ left: 532, behavior: 'smooth' })
  return (
    <section className="relative pt-3">
      <ul ref={ref} className="no-scrollbar flex gap-5 overflow-x-auto px-4 scroll-px-4 snap-x snap-mandatory">
        {HERO_CARDS.concat(HERO_CARDS).map((c, i) => (
          <li key={i} className="snap-start shrink-0 w-[calc(100vw-48px)] sm:w-[512px]">
            <a href="#" className="group block">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface-card">
                <LazyVideo src={c.video} poster={c.poster} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <h3 className="mt-4 text-base font-extrabold uppercase tracking-tight">{c.title}</h3>
              <p className="mt-0.5 text-base text-muted">{c.sub}</p>
            </a>
          </li>
        ))}
      </ul>
      <button onClick={next} aria-label="Next" className="absolute right-3 top-[148px] hidden sm:grid h-10 w-10 place-items-center rounded-xl bg-white/10 backdrop-blur hover:bg-white/20">
        <Chevron />
      </button>
    </section>
  )
}
