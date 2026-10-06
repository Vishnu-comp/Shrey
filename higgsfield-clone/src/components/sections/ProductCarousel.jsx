import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IMAGES } from '../../constants/images'

const products = [
  {
    id: 1,
    title: 'Higgsfield Ads Studio',
    tagline: 'Get your next winning static ads with less work',
    image: IMAGES.carousel.adsStudio,
    cta: 'Open Higgsfield Ads Studio',
    type: 'image',
  },
  {
    id: 2,
    title: 'AI Influencer — Viral by Design',
    tagline: 'Your next viral creator starts now',
    image: IMAGES.aiInfluencer.portraitLeft,
    cta: 'Open AI Influencer',
    type: 'image',
  },
  {
    id: 3,
    title: 'Genjutsu Restyle',
    tagline: 'Keep the motion, change the world: restyle any video in one click',
    image: IMAGES.genjutsu[0],
    cta: 'Open Genjutsu Restyle',
    type: 'image',
  },
  {
    id: 4,
    title: 'Higgsfield Extension in ChatGPT',
    tagline: 'Your entire AI production studio, inside ChatGPT',
    image: IMAGES.dots.dotWhite,
    cta: 'Open Higgsfield Extension',
    type: 'image',
  },
]

export default function ProductCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const goTo = (index) => setCurrent(index)
  const prev = () => setCurrent((current - 1 + products.length) % products.length)
  const next = () => setCurrent((current + 1) % products.length)

  return (
    <section className="pt-20 pb-8 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="relative rounded-2xl overflow-hidden h-[400px] md:h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={products[current].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={products[current].image}
                alt={products[current].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold text-white mb-3"
                >
                  {products[current].title}
                </motion.h3>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-text-secondary mb-6"
                >
                  {products[current].tagline}
                </motion.p>
                <motion.a
                  href="#"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="glow-btn inline-block"
                >
                  {products[current].cta}
                </motion.a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="text-white" size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="text-white" size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? 'bg-gold-2 w-6' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
