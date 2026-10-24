import { SPC } from '../../constants/images'

export default function SupercomputerBanner() {
  return (
    <section className="px-4 pt-8">
      <a href="#" className="relative block h-[376px] overflow-hidden rounded-3xl bg-black shadow-[0_0_60px_rgba(209,254,23,.25)]">
        <img src={SPC.bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="hidden lg:block">
          <img src={SPC.creative} alt="" className="absolute" style={{ left: 89, top: 72, width: 228 }} />
          <img src={SPC.visualizing} alt="" className="absolute" style={{ right: 195, top: 60, width: 101 }} />
          <img src={SPC.marketing} alt="" className="absolute" style={{ right: 73, top: 52, width: 192 }} />
          <img src={SPC.production} alt="" className="absolute" style={{ right: 188, bottom: 0, width: 195 }} />
        </div>
        <div className="relative flex h-full flex-col items-center justify-center text-center">
          <img src={SPC.logo} alt="" className="absolute left-1/2 top-[74px] w-[193px] -translate-x-1/2" />
          <h2 className="mt-24 text-[56px] font-extrabold uppercase leading-none tracking-tight text-lime">Supercomputer</h2>
          <p className="mt-4 text-lg text-[#d8e6b0]">One superagent for your entire creative stack</p>
          <span className="btn-white mt-8">Try Supercomputer</span>
        </div>
      </a>
    </section>
  )
}
