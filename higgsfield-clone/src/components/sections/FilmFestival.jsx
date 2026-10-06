import { FEST_VIDEO, FEST_LOGO, FEST_TILES } from '../../constants/images'
import LazyVideo from '../LazyVideo'

export default function FilmFestival() {
  return (
    <section className="px-4 pt-6">
      <div className="relative grid overflow-hidden rounded-3xl border border-white/10 bg-black lg:grid-cols-[517px_1fr]">
        <div className="relative hidden h-[636px] lg:block">
          <LazyVideo src={FEST_VIDEO} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-black via-black/70 to-transparent" />
          <div className="relative flex flex-col items-center px-6 pt-12 text-center">
            <img src={FEST_LOGO} alt="Higgsfield" className="h-6" />
            <p className="mt-2 text-[32px] font-extrabold leading-[.95] uppercase bg-gradient-to-b from-gold-2 to-gold-3 bg-clip-text text-transparent">Global Film<br />Festival</p>
            <h2 className="mt-5 text-[30px] font-extrabold leading-[1.15] uppercase text-[#d5dae8]">All submissions are live<br />the shortlist is next</h2>
            <p className="mt-2 text-base text-white/40">Watch all films while the jury makes its picks</p>
          </div>
        </div>
        <div className="relative p-4 lg:p-5 lg:pr-4">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {FEST_TILES.map((u) => (
              <img key={u} src={u} alt="" loading="lazy" className="aspect-[220/124] w-full rounded-xl border border-white/10 object-cover" />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
          <a href="#" className="absolute bottom-7 left-1/2 -translate-x-1/2 inline-flex h-12 items-center rounded-xl bg-gradient-to-b from-gold-2 to-gold-3 px-6 text-base font-semibold text-[#2b2410] shadow-[0_4px_0_rgba(0,0,0,.35)]">Explore all projects</a>
        </div>
      </div>
    </section>
  )
}
