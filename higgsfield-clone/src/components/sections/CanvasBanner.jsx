import { CANVAS } from '../../constants/images'

export default function CanvasBanner() {
  return (
    <section className="px-4 pt-10">
      <a href="#" className="relative flex h-[300px] items-center overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b0d0e] to-[#17191b]">
        <img src={CANVAS} alt="" className="absolute right-0 top-0 hidden h-full w-auto max-w-[70%] object-cover md:block" />
        <div className="relative z-10 max-w-[480px] px-10">
          <span className="inline-block rounded-full bg-lime/15 px-3 py-1 text-xs font-bold uppercase text-lime">New feature</span>
          <h2 className="mt-3 text-[40px] font-extrabold uppercase leading-[1.02] tracking-tight">One canvas.<br />Every workflow.</h2>
          <p className="mt-3 text-base text-white/60">Moodboard, chain workflows, and share with your team - all on one canvas</p>
          <span className="btn-lime mt-5 !h-11 !text-[15px]">Try Canvas</span>
        </div>
      </a>
    </section>
  )
}
