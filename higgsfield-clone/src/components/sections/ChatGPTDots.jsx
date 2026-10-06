import { DOTS } from '../../constants/images'
import { Sparkles } from 'lucide-react'

const Tag = ({ children, className }) => (
  <span className={`absolute hidden md:block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur ${className}`}>{children}</span>
)
const Dot = ({ src, size, className }) => (
  <img src={src} alt="" width={size} height={size} className={`absolute hidden md:block floaty ${className}`} />
)
const Cursor = ({ className }) => (
  <svg className={`absolute hidden md:block ${className}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"><path d="M3 11 21 3l-8 18-2-8z" /></svg>
)

export default function ChatGPTDots() {
  return (
    <section className="px-4 pt-6">
      <a href="#" className="relative block h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,.08),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,.12),transparent_70%)]" />
        <div className="relative mx-auto flex h-full max-w-[760px] flex-col items-center justify-center px-4">
          <h2 className="whitespace-nowrap text-[34px] md:text-[48px] font-extrabold leading-[1.05] uppercase tracking-tight">
            Use ChatGPT <img src={DOTS.white} alt="" className="mx-1 inline-block h-[56px] w-[56px] align-middle" /> Dots<br />with Higgsfield MCP
          </h2>
          <p className="mt-4 max-w-[330px] text-[15px] leading-snug text-white/50">Plan and make a creative project step by step with Higgsfield Dots in ChatGPT</p>
          <span className="btn-lime mt-6 !h-11 !text-[15px]"><Sparkles size={16} />Connect Higgsfield</span>
        </div>
        <Dot src={DOTS.director} size={67} className="left-[200px] top-[85px]" />
        <Dot src={DOTS.character} size={60} className="left-[310px] top-[155px]" />
        <Dot src={DOTS.lead} size={67} className="right-[230px] top-[190px]" />
        <Dot src={DOTS.motion} size={80} className="right-[240px] top-[10px]" />
        <Tag className="left-[168px] top-[70px]">Cinematic Director</Tag>
        <Tag className="right-[240px] top-[90px]">Motion Designer</Tag>
        <Tag className="left-[283px] top-[275px]">Character Creator</Tag>
        <Tag className="right-[230px] top-[255px]">Content Lead</Tag>
        <Cursor className="left-[270px] top-[135px]" />
        <Cursor className="left-[350px] top-[190px]" />
        <Cursor className="right-[320px] top-[160px]" />
      </a>
    </section>
  )
}
