import ModelCards from './ModelCards'
import { PROMO } from '../../constants/images'
import LazyVideo from '../LazyVideo'
import { Check } from '../Icons'

export default function PromoBanner() {
  return (
    <section className="px-4 pt-8 grid gap-5 lg:grid-cols-[592px_1fr]">
      <button className="relative min-h-[272px] overflow-hidden rounded-3xl bg-surface-card text-left">
        <img src={PROMO.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <LazyVideo src={PROMO.video} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="relative p-6 pt-8 flex h-full flex-col justify-between">
          <div>
            <h2 className="text-[34px] leading-[1.05] font-extrabold uppercase tracking-tight text-white">Sign up and get your<br /><span className="text-lime">extra discount</span></h2>
            <ul className="mt-4 space-y-1.5 text-sm text-white/80">
              {['Get unlimited Nano Banana Pro', 'Unlock your extra discount', 'Access to Seedance 2.5'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check />{t}</li>
              ))}
            </ul>
          </div>
          <span className="mt-4 inline-flex w-fit h-12 items-center rounded-xl bg-lime px-6 text-base font-semibold text-[#1a1a1a] shadow-[0_4px_0_rgba(0,0,0,.3)]">Sign up and get your discount</span>
        </div>
      </button>
      <ModelCards />
    </section>
  )
}
