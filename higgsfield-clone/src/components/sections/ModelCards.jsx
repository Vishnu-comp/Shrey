import { motion } from 'framer-motion'
import { IMAGES } from '../../constants/images'

const cards = [
  {
    id: 1,
    title: 'Seedance 2.5',
    badge: 'Top',
    description: 'The most advanced video model',
    image: IMAGES.modelCards.seedanceLogo,
    type: 'Video',
  },
  {
    id: 2,
    title: 'AI Influencer',
    badge: 'New',
    description: 'Build your next hype machine',
    image: null,
    type: null,
  },
  {
    id: 3,
    title: 'Higgsfield Genjutsu',
    badge: 'New',
    description: 'One video, many versions',
    image: null,
    type: null,
  },
  {
    id: 4,
    title: 'Higgsfield MCP for Claude',
    badge: null,
    description: 'Generate images and videos in Claude',
    image: null,
    type: null,
  },
  {
    id: 5,
    title: 'Cinema Studio 4.0',
    badge: null,
    description: 'Create cinematic scenes effortlessly',
    image: IMAGES.modelCards.cinemaStudio,
    type: null,
  },
  {
    id: 6,
    title: 'Supercomputer',
    badge: null,
    description: 'Agent powered by GPT-6 Astra',
    image: IMAGES.modelCards.supercomputerIcon,
    type: null,
  },
]

export default function ModelCards() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map((card, i) => (
            <motion.a
              key={card.id}
              href="#"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card-hover group relative bg-dark-card rounded-xl p-4 border border-white/5 hover:border-gold-1/30 transition-all overflow-hidden"
            >
              {card.image && (
                <div className="w-12 h-12 mb-3 rounded-lg overflow-hidden">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-gold-2 transition-colors">
                {card.title}
              </h3>
              <p className="text-text-secondary text-xs mb-2">{card.description}</p>
              {card.badge && (
                <span className={card.badge === 'Top' ? 'badge-top' : 'badge-new'}>
                  {card.badge}
                </span>
              )}
              {card.type && (
                <span className="absolute bottom-3 right-3 text-xs text-text-secondary">
                  {card.type}
                </span>
              )}
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
