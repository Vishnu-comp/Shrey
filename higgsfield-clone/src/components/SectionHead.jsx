export default function SectionHead({ title, sub, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <hgroup className="space-y-1">
        <h2 className="text-xl font-extrabold uppercase leading-8 tracking-tight text-lime">{title}</h2>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </hgroup>
      {action}
    </div>
  )
}
