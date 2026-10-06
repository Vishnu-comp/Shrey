import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { IMAGES } from '../../constants/images'

export default function PromoBanner() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gold-1/20 via-dark-card to-gold-3/20 border border-gold-1/20 p-8 md:p-12"
        >
          <div className="absolute inset-0 opacity-20">
            <img src={IMAGES.promo.seedancePoster} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Sign up and get your <span className="gradient-text">extra discount</span>
              </h2>
              <ul className="space-y-3">
                {[
                  'Get unlimited Nano Banana Pro',
                  'Unlock your extra discount',
                  'Access to Seedance 2.5',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-text-secondary">
                    <Check className="text-gold-2 flex-shrink-0" size={20} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0">
              <button className="glow-btn text-lg px-8 py-4">
                Get your discount
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
