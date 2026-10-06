import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

const films = [
  { id: 1, title: 'The Tortoise and the Hare', creator: 'benhamin', avatar: '🎬' },
  { id: 2, title: 'BESA', creator: 'ollkorrect', avatar: '🎥' },
  { id: 3, title: 'Count of Three', creator: 'shotbyhzee', avatar: '📽️' },
  { id: 4, title: 'Detour', creator: 'aist', avatar: '🎞️' },
  { id: 5, title: 'BALLAST', creator: 'lejardinier', avatar: '🎬' },
  { id: 6, title: 'AZUL COBALTO', creator: 'seeyousoonx', avatar: '🎥' },
  { id: 7, title: 'Rest Face', creator: 'jamil_safari', avatar: '📽️' },
  { id: 8, title: 'Fallen Leaves', creator: 'jacob_everett', avatar: '🎞️' },
  { id: 9, title: 'VARMINTS', creator: 'outrealproduction', avatar: '🎬' },
  { id: 10, title: 'The Kiss', creator: 'seifhussam', avatar: '🎥' },
]

export default function FilmFestival() {
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
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Trophy icon */}
            <svg width="30" height="50" viewBox="0 0 30 50" fill="none">
              <path d="M30 46.4C28.5 45.5 24.4 38.4 11.3 45.2C12.9 48.8 19 54 30 46.4Z" fill="url(#gold1)" />
              <path d="M1.6 30.7C1.7 34.7 5.2 41.9 18.3 39.2C17.3 37.7 15.7 28.5 1.6 30.7Z" fill="url(#gold1)" />
              <path d="M0.2 15.8C-0.7 19.7 0.7 27.6 14.1 28.4C13.5 26.7 14.4 17.4 0.2 15.8Z" fill="url(#gold1)" />
              <path d="M9.7 0C6.9 2.8 4 10.3 15 18C15.4 16.2 21 8.7 9.7 0Z" fill="url(#gold1)" />
              <defs>
                <linearGradient id="gold1" x1="268" y1="-26" x2="1" y2="28">
                  <stop stopColor="#8E733A" />
                  <stop offset="0.577" stopColor="#EAD9A3" />
                  <stop offset="1" stopColor="#9F8754" />
                </linearGradient>
              </defs>
            </svg>
            <span className="gradient-text text-xl font-semibold">Global Film Festival</span>
            <svg width="30" height="50" viewBox="0 0 30 50" fill="none">
              <path d="M0 46.4C1.5 45.5 5.7 38.4 18.7 45.2C17.1 48.8 11 54 0 46.4Z" fill="url(#gold2)" />
              <path d="M28.5 30.7C28.4 34.7 24.9 41.9 11.7 39.2C12.8 37.7 14.4 28.5 28.5 30.7Z" fill="url(#gold2)" />
              <path d="M29.8 15.8C30.7 19.7 29.3 27.6 15.9 28.4C16.5 26.7 15.6 17.4 29.8 15.8Z" fill="url(#gold2)" />
              <path d="M20.3 0C23.1 2.8 26 10.3 15 18C14.6 16.2 9 8.7 20.3 0Z" fill="url(#gold2)" />
              <defs>
                <linearGradient id="gold2" x1="-230" y1="-36" x2="29" y2="28">
                  <stop stopColor="#9F8754" />
                  <stop offset="0.423" stopColor="#EAD9A3" />
                  <stop offset="1" stopColor="#8E733A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            All submissions are live <span className="gradient-text">The shortlist is next</span>
          </h2>
          <p className="text-text-secondary text-lg">Watch all films while the jury makes its picks</p>
        </motion.div>

        {/* Films Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {films.map((film, i) => (
            <motion.a
              key={film.id}
              href="#"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card-hover group rounded-xl overflow-hidden bg-dark-card border border-white/5 hover:border-gold-1/30"
            >
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  {film.avatar}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
              <div className="p-3">
                <h4 className="text-white text-sm font-semibold mb-1 truncate group-hover:text-gold-2 transition-colors">
                  {film.title}
                </h4>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">
                    {film.avatar}
                  </div>
                  <span className="text-text-secondary text-xs">{film.creator}</span>
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
            Explore all projects <ChevronRight size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}
