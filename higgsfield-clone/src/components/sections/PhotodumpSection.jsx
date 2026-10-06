import { PHOTODUMP } from '../../constants/images'

export default function PhotodumpSection() {
  return (
    <section className="px-4 pt-10">
      <a href="#" className="relative block h-[280px] overflow-hidden rounded-3xl bg-gradient-to-b from-[#c9ccd2] to-[#2a2e35]">
        <img src={PHOTODUMP} alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="relative px-10 pt-10">
          <span className="inline-block rounded-lg bg-lime px-2 py-1 text-xs font-extrabold uppercase text-[#1a1a1a]">Photodump</span>
          <h2 className="mt-3 text-[40px] font-extrabold uppercase leading-[1.02] tracking-tight text-[#eef0f6]">Different scenes<br />same star</h2>
          <p className="mt-2 text-lg text-white/70">Build your character. One click does the rest</p>
          <span className="btn-white mt-5 !h-12">Try Photodump</span>
        </div>
      </a>
    </section>
  )
}
