import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { IMAGES } from '../../constants/images'

export default function GenjutsuShowcase() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Higgsfield Genjutsu
          </h2>
          <p className="text-text-secondary text-lg max-w-3xl mb-6">
            Reality Manipulation — transfer motion into new scenes, or swap details while everything else stays as filmed.
          </p>
          <div className="flex gap-4">
            <button className="glow-btn text-sm px-6 py-2">Start generating</button>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-gold-2 hover:text-gold-2/80 font-semibold transition-colors"
            >
              Learn more <ChevronRight size={18} />
            </a>
          </div>
        </motion.div>

        {/* Dense Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-8">
          {IMAGES.genjutsu.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.02 }}
              className="aspect-square rounded-lg overflow-hidden cursor-pointer group"
            >
              <img
                src={img}
                alt={`Genjutsu ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </motion.div>
          ))}
        </div>

        {/* Second block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-text-secondary text-lg mb-4">
            Take the motion and recast it with your characters, locations, and products, or swap specific elements while keeping the rest untouched.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-gold-2 hover:text-gold-2/80 font-semibold transition-colors"
          >
            View all presets <ChevronRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
