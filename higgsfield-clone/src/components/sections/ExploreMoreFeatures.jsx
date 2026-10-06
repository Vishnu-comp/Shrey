import { motion } from 'framer-motion'

const features = [
  'Cinema Studio', 'Visual Effects', 'Higgsfield Soul', 'Camera Controls',
  'Viral', 'Action movements', 'Commercial', 'MiniMax Hailuo 02',
  'Seedance Pro', 'Community', 'Wan 2.2 Image', 'Seedream 4.0',
  'Nano Banana', 'Flux Kontext', 'GPT Image', 'Topaz',
  'Google Veo 3.1', 'Kling 2.5 Turbo', 'Kling Avatars 2.0', 'Claude MCP',
  'Wan 2.5', 'Sora 2', 'Sora 2 Presets', 'Banana Placement',
  'Edit Image', 'Multi Reference', 'Upscale', 'YouTube',
  'TikTok', 'Instagram Reels', 'YouTube Shorts', 'Nano Banana Pro',
  'Kling o1', 'Mixed Media Community', 'Soul Presets', 'Visual Effects Collection',
]

export default function ExploreMoreFeatures() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-white mb-8"
        >
          Explore more AI features
        </motion.h2>

        <div className="flex flex-wrap gap-3">
          {features.map((feature, i) => (
            <motion.a
              key={feature}
              href="#"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.01 }}
              className="card-hover px-5 py-3 rounded-full bg-dark-card border border-white/5 hover:border-gold-1/30 text-white text-sm font-medium hover:text-gold-2 transition-colors"
            >
              {feature}
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
