import { useMemo } from 'react'
import LazyVideo from './LazyVideo'

// items: [type, src, poster, h/w]. Items are dealt into the shortest column.
export default function Masonry({ items, cols = 4, gap = 8, rounded = 'rounded-2xl' }) {
  const columns = useMemo(() => {
    const cs = Array.from({ length: cols }, () => ({ h: 0, list: [] }))
    items.forEach((it) => {
      const c = cs.reduce((a, b) => (b.h < a.h ? b : a))
      c.list.push(it)
      c.h += it[3] || 1
    })
    return cs
  }, [items, cols])
  return (
    <div className="flex" style={{ gap }}>
      {columns.map((c, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
          {c.list.map((it) => (
            <div key={it[1] || it[2]} className={`relative overflow-hidden bg-surface-card ${rounded}`} style={{ aspectRatio: `1 / ${it[3] || 1}` }}>
              {it[0] === 'v' ? (
                <LazyVideo src={it[1]} poster={it[2]} className="h-full w-full object-cover" />
              ) : (
                <img src={it[1]} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
