import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { IMAGES } from '../../constants/images'

const dots = [
  { name: 'Character Creator', icon: IMAGES.dots.characterCreator },
  { name: 'Cinematic Director', icon: IMAGES.dots.cinematicDirector },
  { name: 'Content Lead', icon: IMAGES.dots.contentLead },
  { name: 'Motion Designer', icon: IMAGES.dots.motionDesigner },
]

export default function ChatGPTDots() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-dark-card border border-white/5 p-8 md:p-12"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Use ChatGPT{' '}
                <img
                  src={IMAGES.dots.dotWhite}
                  alt="Dots"
                  className="inline-block w-8 h-8 mx-1"
                />{' '}
                <span className="gradient-text">with Higgsfield MCP</span>
              </h2>
              <p className="text-text-secondary text-lg mb-6">
                Plan and make a creative project step by step with Higgsfield Dots in ChatGPT
              </p>
              <button className="glow-btn inline-flex items-center gap-2">
                <Zap size={18} />
                Connect Higgsfield
              </button>
            </div>

            {/* Dots Grid */}
            <div className="grid grid-cols-2 gap-4">
              {dots.map((dot, i) => (
                <motion.div
                  key={dot.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 bg-black/40 rounded-lg p-4 border border-white/5"
                >
                  <img src={dot.icon} alt={dot.name} className="w-10 h-10 rounded-full" />
                  <span className="text-white text-sm font-medium">{dot.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
