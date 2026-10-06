import { motion } from 'framer-motion'
import { IMAGES } from '../../constants/images'

export default function CanvasBanner() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900/30 via-cyan-900/20 to-blue-900/30 border border-white/5"
        >
          <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 lg:p-16">
            <div className="flex-1 mb-8 md:mb-0">
              <span className="inline-block text-xs font-semibold text-gold-2 uppercase tracking-wider mb-3">
                New feature
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                ONE CANVAS. <span className="gradient-text">EVERY WORKFLOW.</span>
              </h2>
              <p className="text-text-secondary text-lg mb-6">
                Moodboard, chain workflows, and share with your team - all on one canvas
              </p>
              <button className="glow-btn text-base px-8 py-3">
                Try Canvas
              </button>
            </div>
            <div className="flex-shrink-0">
              <img
                src={IMAGES.canvas.desktop}
                alt="Canvas"
                className="w-full max-w-md rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
