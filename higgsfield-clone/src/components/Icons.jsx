export const Logo = ({ className = 'w-8 h-8' }) => (
  <span className={`${className} grid place-items-center rounded-lg bg-white text-black`}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M4 15c3-6 6-6 8-2s5 4 8-2" />
      <path d="M4 9c3-6 6-6 8-2s5 4 8-2" opacity=".0" />
      <path d="M4 20c3-6 6-6 8-2s5 4 8-2" />
    </svg>
  </span>
)
export const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
)
export const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M8 7h9v9" /></svg>
)
export const Chevron = ({ dir = 'right' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'left' ? 'rotate(180deg)' : 'none' }}><path d="m9 6 6 6-6 6" /></svg>
)
export const Globe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>
)
export const Gem = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M9 3l3 18M15 3l-3 18" opacity=".6" /></svg>
)
export const Sparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" /></svg>
)
export const Tag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5a1.5 1.5 0 1 0 0 .01z" /></svg>
)
export const Close = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
)
