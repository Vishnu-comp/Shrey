import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { IMAGES } from '../../constants/images'

const effects = [
  { id: 1, name: 'Incline', image: IMAGES.vfx.incline },
  { id: 2, name: 'Act natural', image: IMAGES.vfx.actNatural },
  { id: 3, name: 'Lacewalker', image: IMAGES.vfx.lacewalker },
  { id: 4, name: 'Burning man', image: IMAGES.vfx.burningMan },
  { id: 5, name: 'Melting', image: IMAGES.vfx.melting },
  { id: 6, name: 'World morphing', image: IMAGES.vfx.worldMorphing },
  { id: 7, name: 'High flip', image: IMAGES.vfx.highFlip },
  { id: 8, name: 'Street colossus', image: IMAGES.vfx.streetColossus },
  { id: 9, name: 'Selfception', image: IMAGES.vfx.selfception },
  { id: 10, name: 'Cutout', image: IMAGES.vfx.cutout },
  { id: 11, name: 'Floating fall', image: IMAGES.vfx.floatingFall },
  { id: 12, name: 'Eyes in', image: IMAGES.vfx.eyesIn },
  { id: 13, name: 'Wild ride', image: IMAGES.vfx.wildRide },
  { id: 14, name: 'Smash and grab', image: IMAGES.vfx.smashAndGrab },
  { id: 15, name: 'Studio slide', image: IMAGES.vfx.studioSlide },
]

export default function VisualEffects() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Visual Effects</h2>
            <p className="text-text-secondary text-lg max-w-2xl">
              Big-budget visual effects, from explosions to surreal transformations.
            </p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button className="glow-btn text-sm px-6 py-2">Try for free</button>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-gold-2 hover:text-gold-2/80 font-semibold transition-colors"
            >
              View all presets <ChevronRight size={18} />
            </a>
          </div>
        </motion.div>

        {/* Horizontal Scroll Gallery */}
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
          <div className="flex gap-4 w-max">
            {effects.map((effect, i) => (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="card-hover group flex-shrink-0 w-72 rounded-xl overflow-hidden bg-dark-card border border-white/5 hover:border-gold-1/30"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={effect.image}
                    alt={effect.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <h4 className="text-white font-semibold group-hover:text-gold-2 transition-colors">
                    {effect.name}
                  </h4>
                  <button className="text-sm text-gold-2 hover:text-white transition-colors">
                    Recreate →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
