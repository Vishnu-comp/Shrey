import { motion } from 'framer-motion'
import { IMAGES } from '../../constants/images'

export default function AIInfluencerCTA() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30 border border-white/5"
        >
          <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 lg:p-16">
            {/* Left Content */}
            <div className="flex-1 text-center md:text-left mb-8 md:mb-0">
              <span className="inline-block text-xs font-semibold text-gold-2 uppercase tracking-wider mb-3">
                Try Free
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                AI Influencer
              </h2>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-4">
                Build your next hype machine
              </h3>
              <p className="text-text-secondary text-lg mb-6">
                Pick the look. Add motion. Build hype.
              </p>
              <button className="glow-btn text-base px-8 py-3">
                Create your own AI Influencer
              </button>
            </div>

            {/* Right Images */}
            <div className="flex items-center gap-4">
              <motion.img
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                src={IMAGES.aiInfluencer.portraitLeft}
                alt="AI Influencer"
                className="w-32 md:w-40 h-48 md:h-64 rounded-xl object-cover"
              />
              <motion.img
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                src={IMAGES.aiInfluencer.portraitRight}
                alt="AI Influencer"
                className="w-32 md:w-40 h-48 md:h-64 rounded-xl object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
