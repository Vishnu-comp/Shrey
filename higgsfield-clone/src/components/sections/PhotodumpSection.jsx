import { motion } from 'framer-motion'
import { IMAGES } from '../../constants/images'

export default function PhotodumpSection() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-pink-900/30 via-rose-900/20 to-pink-900/30 border border-white/5"
        >
          <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 lg:p-16">
            <div className="flex-1 mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Photodump
              </h2>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-4">
                Different Scenes. Same Star.
              </h3>
              <p className="text-text-secondary text-lg mb-6">
                Build your character. One click does the rest.
              </p>
              <button className="glow-btn text-base px-8 py-3">
                Try Photodump
              </button>
            </div>
            <div className="flex-shrink-0">
              <img
                src={IMAGES.photodump.desktop}
                alt="Photodump"
                className="w-full max-w-md rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
