const TAGS = ['Cinema Studio', 'Visual Effects', 'Higgsfield Soul', 'Camera Controls', 'Viral', 'Action movements', 'Commercial', 'MiniMax Hailuo 02', 'Seedance Pro', 'Community', 'Wan 2.2 Image', 'Seedream 4.0', 'Nano Banana', 'Flux Kontext', 'GPT Image', 'Topaz', 'Google Veo 3.1', 'Kling 2.5 Turbo', 'Kling Avatars 2.0', 'Claude MCP', 'Wan 2.5', 'Sora 2', 'Sora 2 Presets', 'Banana Placement', 'Edit Image', 'Multi Reference', 'Upscale', 'YouTube', 'TikTok', 'Instagram Reels', 'YouTube Shorts', 'Nano Banana Pro', 'Kling o1', 'Mixed Media Community', 'Soul Presets', 'Visual Effects Collection']

export default function ExploreMoreFeatures() {
  return (
    <section className="mt-16 bg-surface px-4 py-20 text-center">
      <h2 className="text-[40px] font-extrabold uppercase leading-[56px] tracking-tight">Explore more AI features</h2>
      <div className="mx-auto mt-6 flex max-w-[1180px] flex-wrap justify-center gap-2">
        {TAGS.map((t) => (
          <a key={t} href="#" className="inline-flex h-8 items-center rounded-lg bg-surface-card px-3 text-sm font-medium text-muted transition-colors hover:text-white">{t}</a>
        ))}
      </div>
    </section>
  )
}
