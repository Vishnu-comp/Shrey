const COLS = [
  [['Create', ['AI Video', 'AI Image', 'Edit Image', 'Inpaint', 'Upscale', 'Sora 2 Upscale', 'Mixed Media', 'AI Face Swap', 'AI Influencer', 'Apps']]],
  [['Video Models', ['Seedance 2.5', 'Seedance 2.0', 'Kling 3.0', 'Sora 2 Introduction', 'Veo 3.1 Introduction', 'WAN 2.6', 'Grok Imagine 1.5', 'Gemini Omni Flash']], ['Image Models', ['Nano Banana', 'Flux 2', 'Seedream 5', 'GPT Image 2']]],
  [['Studios', ['Cinema Studio', 'Marketing Studio', 'Lipsync Studio', 'Photodump Studio', 'Fashion Factory', 'Higgsfield Popcorn', 'Higgsfield Canvas']], ['Soul', ['Soul 2.0', 'Soul ID Character', 'Soul Cinema']]],
  [['Platform', ['Supercomputer', 'MCP/CLI', 'API', 'Collab', 'Games', 'Reference Extension']], ['Resources', ['Blog', 'Creator Hub', 'Help Center', 'Academy', 'Prompt Guide']]],
  [['Company', ['About', 'Trust', 'Enterprise', 'Team', 'Pricing', 'Careers', 'Contact']], ['Community', ['Community', 'Contests', 'Creative Partners']]],
]

export default function Footer() {
  return (
    <>
      <footer className="bg-lime text-[#131517]">
        <div className="mx-auto grid max-w-[1265px] gap-10 px-4 pb-16 pt-9 lg:grid-cols-[432px_1fr]">
          <h2 className="text-[40px] font-extrabold uppercase leading-[48px] tracking-tight">AI-native<br />creative suite</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {COLS.map((col, i) => (
              <div key={i} className="space-y-8">
                {col.map(([head, links]) => (
                  <div key={head}>
                    <h3 className="mb-2 text-base font-medium text-[#131517]/50">{head}</h3>
                    <ul className="space-y-0">
                      {links.map((l) => (
                        <li key={l}><a href="#" className="block py-[7px] text-base font-medium leading-[22px] hover:underline">{l}</a></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="lg:col-start-1">
            <p className="text-base font-medium">535 Mission St, 14th floor, San Francisco, CA, 94105</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-base font-semibold">
              {['X / Twitter', 'Youtube', 'LinkedIn', 'Tiktok', 'Discord'].map((s) => <a key={s} href="#" className="hover:underline">{s}</a>)}
            </div>
          </div>
        </div>
      </footer>
      <footer className="bg-surface">
        <div className="mx-auto flex max-w-[1265px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-white/90">
          <span>© 2026 Higgsfield, Inc. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-6">
            <span>English</span><a href="#">Help center</a><a href="#">Cookie Notice</a><a href="#">Cookie Settings</a><a href="#">Terms</a><a href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </>
  )
}
