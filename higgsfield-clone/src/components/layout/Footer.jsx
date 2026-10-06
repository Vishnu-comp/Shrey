export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-16 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {['Video', 'Image', 'Upscale', 'Edit Image', 'Visual Effects'].map(item => (
                <li key={item}>
                  <a href="#" className="text-text-secondary text-sm hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Models */}
          <div>
            <h4 className="text-white font-semibold mb-4">Models</h4>
            <ul className="space-y-2">
              {['Seedance 2.5', 'Genjutsu', 'Soul', 'Cinema Studio', 'Supercomputer'].map(item => (
                <li key={item}>
                  <a href="#" className="text-text-secondary text-sm hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {['Community', 'Blog', 'Pricing', 'MCP', 'Canvas'].map(item => (
                <li key={item}>
                  <a href="#" className="text-text-secondary text-sm hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {['About', 'Careers', 'Terms', 'Privacy', 'Contact'].map(item => (
                <li key={item}>
                  <a href="#" className="text-text-secondary text-sm hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-1 to-gold-2 flex items-center justify-center">
              <span className="text-black font-bold text-sm">H</span>
            </div>
            <span className="text-white font-semibold">Higgsfield AI</span>
          </div>
          <p className="text-text-secondary text-sm">© 2025 Higgsfield AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
