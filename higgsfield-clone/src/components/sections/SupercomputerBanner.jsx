import { motion } from 'framer-motion'
import { IMAGES } from '../../constants/images'

export default function SupercomputerBanner() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-indigo-900/30 border border-white/5"
        >
          <div className="absolute inset-0 opacity-20">
            <img src={IMAGES.supercomputer.bg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 lg:p-16">
            <div className="flex-1 mb-8 md:mb-0">
              <img src={IMAGES.supercomputer.logo} alt="Supercomputer" className="w-32 h-auto mb-6" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Supercomputer
              </h2>
              <p className="text-text-secondary text-lg md:text-xl max-w-2xl">
                One superagent for your entire creative stack
              </p>
            </div>
            <button className="glow-btn text-base px-8 py-3">
              Try Supercomputer
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
