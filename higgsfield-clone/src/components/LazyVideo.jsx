import { useEffect, useRef } from 'react'

// Plays only while on screen, so the page stays light with dozens of clips.
export default function LazyVideo({ src, poster, className = '', style }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!el.src) el.src = src
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [src])
  return (
    <video
      ref={ref}
      poster={poster || undefined}
      muted
      loop
      playsInline
      preload="none"
      className={className}
      style={style}
    />
  )
}
