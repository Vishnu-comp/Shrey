import { motion } from 'framer-motion'
import { ChevronRight, Globe } from 'lucide-react'
import { IMAGES } from '../../constants/images'

export default function ExploreProjects() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Explore the inside of every project
          </h2>
          <p className="text-text-secondary text-lg">
            See all prompts, assets, and how each project was created
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {IMAGES.projects.map((project, i) => (
            <motion.a
              key={i}
              href="#"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card-hover group rounded-xl overflow-hidden bg-dark-card border border-white/5 hover:border-gold-1/30"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
                  <Globe size={12} className="text-gold-2" />
                  <span className="text-white text-xs">Public</span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-white font-semibold mb-2 truncate group-hover:text-gold-2 transition-colors">
                  {project.title}
                </h4>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-1 to-gold-2 flex items-center justify-center">
                    <span className="text-black text-xs font-bold">H</span>
                  </div>
                  <span className="text-text-secondary text-sm">by {project.creator}</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-gold-2 hover:text-gold-2/80 font-semibold transition-colors"
          >
            Explore community <ChevronRight size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}
