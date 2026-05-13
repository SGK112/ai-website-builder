// Three pre-baked sample sites the landing-page demo iframe cycles through.
// Each is a complete, self-contained HTML document so the iframe srcDoc can
// render it with no network calls. MOBILE-FIRST RESPONSIVE — every class is
// either base (mobile) or prefixed `sm:` / `md:` / `lg:` so the iframe
// actually reflows when the morphing card resizes to PC / Tablet / Mobile
// widths. Without this, the desktop layout would just get crammed into the
// mobile frame and look broken.

export interface DemoSite {
  id: string
  label: string
  prompt: string
  html: string
}

const baseHead = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body{font-family:'Inter',sans-serif}</style></head>`

export const DEMO_SITES: DemoSite[] = [
  {
    id: 'saas',
    label: 'SaaS landing',
    prompt: 'A modern SaaS landing page for an analytics product',
    html: `${baseHead}<body class="bg-slate-950 text-white">
<nav class="px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between border-b border-white/5">
  <div class="flex items-center gap-2"><div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500"></div><span class="font-bold text-sm sm:text-base">Aurora</span></div>
  <div class="hidden md:flex gap-6 text-sm text-slate-400"><span>Product</span><span>Pricing</span><span>Docs</span></div>
  <button class="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg bg-white text-slate-900 text-[11px] sm:text-sm font-semibold whitespace-nowrap">Start free</button>
</nav>
<section class="px-4 sm:px-8 py-6 sm:py-12 md:py-16 text-center">
  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] sm:text-xs mb-4 sm:mb-6">✦ v2.0 just shipped</div>
  <h1 class="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight leading-tight">Analytics that finally <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">make sense.</span></h1>
  <p class="text-xs sm:text-sm md:text-base text-slate-400 mb-5 sm:mb-8 max-w-xl mx-auto leading-relaxed">Ship faster with metrics your team will actually use.</p>
  <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-6 sm:mb-12 px-4 sm:px-0">
    <button class="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold text-xs sm:text-sm">Get started</button>
    <button class="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-xs sm:text-sm">Watch demo</button>
  </div>
  <div class="max-w-3xl mx-auto rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 p-1">
    <div class="rounded-lg sm:rounded-xl bg-slate-900 p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
      <div class="rounded-lg bg-violet-500/10 p-2 sm:p-3 text-left"><div class="text-[10px] sm:text-xs text-slate-400">MRR</div><div class="text-base sm:text-xl font-bold">$48.2k</div><div class="text-[10px] sm:text-xs text-emerald-400">↑ 12.4%</div></div>
      <div class="rounded-lg bg-fuchsia-500/10 p-2 sm:p-3 text-left"><div class="text-[10px] sm:text-xs text-slate-400">Active users</div><div class="text-base sm:text-xl font-bold">12,841</div><div class="text-[10px] sm:text-xs text-emerald-400">↑ 8.2%</div></div>
      <div class="rounded-lg bg-amber-500/10 p-2 sm:p-3 text-left"><div class="text-[10px] sm:text-xs text-slate-400">Churn</div><div class="text-base sm:text-xl font-bold">2.1%</div><div class="text-[10px] sm:text-xs text-rose-400">↓ 0.4%</div></div>
    </div>
  </div>
</section></body></html>`,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    prompt: 'A creative portfolio site for a designer',
    html: `${baseHead}<body class="bg-stone-50 text-stone-900">
<nav class="px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
  <span class="font-bold text-base sm:text-lg" style="font-family:'Times New Roman',serif;font-style:italic">Maya Reyes</span>
  <div class="hidden md:flex gap-6 text-sm">Work · About · Words · Contact</div>
  <button class="md:hidden text-stone-600 text-xl">≡</button>
</nav>
<section class="px-4 sm:px-8 py-6 sm:py-12">
  <h1 class="text-3xl sm:text-5xl md:text-6xl mb-3 tracking-tight font-bold leading-none">Designer.<br><span style="font-family:'Times New Roman',serif;font-style:italic;color:#9a3412">Storyteller.</span></h1>
  <p class="text-xs sm:text-sm md:text-base text-stone-600 max-w-md mb-6 sm:mb-10">Brand systems &amp; editorial design for studios who want to feel less like everyone else.</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
    <div class="aspect-[4/5] rounded-xl bg-gradient-to-br from-orange-200 to-rose-300 p-3 sm:p-4 flex flex-col justify-end"><div class="text-[10px] sm:text-xs text-orange-900/70 font-semibold">2025</div><div class="text-sm sm:text-base font-bold text-orange-900">Folio Magazine</div></div>
    <div class="aspect-[4/5] rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 p-3 sm:p-4 flex flex-col justify-end"><div class="text-[10px] sm:text-xs text-stone-400 font-semibold">2024</div><div class="text-sm sm:text-base font-bold text-white">Nightbar Identity</div></div>
    <div class="aspect-[4/5] rounded-xl bg-gradient-to-br from-emerald-200 to-teal-300 p-3 sm:p-4 flex flex-col justify-end"><div class="text-[10px] sm:text-xs text-emerald-900/70 font-semibold">2024</div><div class="text-sm sm:text-base font-bold text-emerald-900">Verdant Coffee</div></div>
  </div>
</section></body></html>`,
  },
  {
    id: 'mobile',
    label: 'Mobile app',
    prompt: 'A fitness tracker mobile app',
    html: `${baseHead}<body class="bg-gradient-to-br from-violet-950 via-slate-950 to-fuchsia-950 min-h-screen flex items-center justify-center p-4 sm:p-8">
<div class="relative">
  <div class="w-full max-w-[240px] sm:w-[280px] aspect-[9/19] sm:h-[560px] sm:aspect-auto rounded-[36px] sm:rounded-[44px] bg-slate-950 border-[8px] sm:border-[10px] border-slate-800 shadow-2xl shadow-violet-500/20 overflow-hidden relative">
    <div class="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 bg-slate-900 rounded-full z-10"></div>
    <div class="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-transparent to-fuchsia-600/30"></div>
    <div class="relative px-4 sm:px-6 pt-10 sm:pt-14 pb-4 sm:pb-6 text-white">
      <div class="text-[10px] sm:text-xs text-white/60 mb-1">Tuesday, October 8</div>
      <div class="text-lg sm:text-2xl font-bold mb-3 sm:mb-5">Hey, Alex 👋</div>
      <div class="rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur p-3 sm:p-4 mb-2 sm:mb-3 border border-white/10">
        <div class="text-[10px] sm:text-xs text-white/60 mb-1">Daily steps</div>
        <div class="text-xl sm:text-3xl font-bold mb-2">8,421 <span class="text-[10px] sm:text-sm text-emerald-400 font-medium">/ 10,000</span></div>
        <div class="w-full h-1.5 sm:h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full w-[84%] bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full"></div></div>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div class="rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur p-3 sm:p-4 border border-white/10"><div class="text-[10px] sm:text-xs text-white/60">Calories</div><div class="text-sm sm:text-xl font-bold">412</div></div>
        <div class="rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur p-3 sm:p-4 border border-white/10"><div class="text-[10px] sm:text-xs text-white/60">Distance</div><div class="text-sm sm:text-xl font-bold">5.2 km</div></div>
      </div>
      <div class="rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur p-3 sm:p-4 border border-white/10">
        <div class="flex items-center justify-between mb-2 sm:mb-3"><div class="text-xs sm:text-base font-bold">Today's workout</div><div class="text-[10px] sm:text-xs text-white/60">45 min</div></div>
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm sm:text-base">🏃</div>
          <div class="flex-1 min-w-0"><div class="text-xs sm:text-sm font-semibold truncate">Morning Run</div><div class="text-[10px] sm:text-xs text-white/60">Zone 3 · 5.2 km</div></div>
        </div>
      </div>
    </div>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'ecommerce',
    label: 'E-commerce store',
    prompt: 'An online jewelry store with featured products',
    html: `${baseHead}<body class="bg-stone-50 text-stone-900">
<nav class="px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-stone-200">
  <div class="font-bold text-base sm:text-xl tracking-tight" style="font-family:'Times New Roman',serif;font-style:italic">Lumière</div>
  <div class="hidden md:flex gap-7 text-sm text-stone-600">Shop · Collections · Story · Journal</div>
  <div class="flex items-center gap-2 sm:gap-3 text-stone-600 text-sm sm:text-base"><span>🔍</span><span class="relative">🛍 <span class="absolute -top-1 -right-2 text-[9px] sm:text-[10px] bg-stone-900 text-white rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">3</span></span></div>
</nav>
<section class="px-4 sm:px-8 pt-6 sm:pt-10 pb-4 sm:pb-6 text-center">
  <p class="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-stone-500 mb-2 sm:mb-3">Featured · Fall '25</p>
  <h1 class="text-2xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 leading-tight font-bold">Heirloom pieces, <span style="font-family:'Times New Roman',serif;font-style:italic;font-weight:400">made by hand.</span></h1>
  <p class="text-xs sm:text-sm md:text-base text-stone-600 max-w-md mx-auto mb-5 sm:mb-8">Ethically sourced gold, hand-forged in Brooklyn.</p>
</section>
<section class="px-4 sm:px-8 pb-8 sm:pb-12">
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto">
    <div class="group"><div class="aspect-[4/5] rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-100 to-stone-200 mb-2 sm:mb-3 relative overflow-hidden"><div class="absolute inset-0 flex items-center justify-center text-3xl sm:text-5xl">💍</div></div><div class="text-xs sm:text-sm font-medium">Hammered band</div><div class="text-[11px] sm:text-sm text-stone-500">14k gold · $640</div></div>
    <div class="group"><div class="aspect-[4/5] rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 mb-2 sm:mb-3 relative overflow-hidden"><div class="absolute inset-0 flex items-center justify-center text-3xl sm:text-5xl">📿</div></div><div class="text-xs sm:text-sm font-medium">Pearl drops</div><div class="text-[11px] sm:text-sm text-stone-500">Freshwater · $295</div></div>
    <div class="group"><div class="aspect-[4/5] rounded-lg sm:rounded-xl bg-gradient-to-br from-stone-200 to-amber-50 mb-2 sm:mb-3 relative overflow-hidden"><div class="absolute inset-0 flex items-center justify-center text-3xl sm:text-5xl">⚜️</div></div><div class="text-xs sm:text-sm font-medium">Signet ring</div><div class="text-[11px] sm:text-sm text-stone-500">Carved · $980</div></div>
  </div>
</section>
</body></html>`,
  },
  {
    id: 'blog',
    label: 'Editorial blog',
    prompt: 'A magazine-style blog about food and culture',
    html: `${baseHead}<body class="bg-amber-50 text-stone-900">
<nav class="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-stone-300">
  <div class="text-lg sm:text-2xl font-bold tracking-tight" style="font-family:'Times New Roman',serif">The Bowl</div>
  <div class="hidden md:flex gap-7 text-sm text-stone-700">Recipes · Travel · Interviews · Subscribe</div>
  <button class="md:hidden text-stone-700 text-xl">≡</button>
</nav>
<section class="px-4 sm:px-8 py-6 sm:py-12">
  <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
    <div class="md:col-span-2">
      <p class="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-orange-700 mb-2 sm:mb-3 font-semibold">Issue 12 · Featured</p>
      <h1 class="text-2xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 leading-tight font-bold">The slow stew renaissance.</h1>
      <p class="text-xs sm:text-base md:text-lg text-stone-700 mb-4 sm:mb-6">How a generation of cooks rediscovered patience, gathering, and the radical act of one-pot dinners.</p>
      <div class="flex items-center gap-3 mb-4 sm:mb-6">
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-400"></div>
        <div><div class="text-xs sm:text-sm font-semibold">Marcus Hale</div><div class="text-[10px] sm:text-xs text-stone-500">Oct 8 · 12 min read</div></div>
      </div>
      <div class="aspect-[16/9] rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-300 via-amber-200 to-rose-200 flex items-center justify-center text-4xl sm:text-7xl">🍲</div>
    </div>
    <aside class="space-y-4 sm:space-y-5">
      <p class="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-stone-500 font-semibold">Latest</p>
      <div><div class="text-[10px] sm:text-xs text-stone-500 mb-1">Travel</div><div class="text-xs sm:text-base font-semibold leading-tight">Three days, three markets, one Sicily</div></div>
      <div><div class="text-[10px] sm:text-xs text-stone-500 mb-1">Recipes</div><div class="text-xs sm:text-base font-semibold leading-tight">A pot of beans, six ways</div></div>
      <div><div class="text-[10px] sm:text-xs text-stone-500 mb-1">Interviews</div><div class="text-xs sm:text-base font-semibold leading-tight">Lessons from a Brooklyn baker</div></div>
      <div><div class="text-[10px] sm:text-xs text-stone-500 mb-1">Notes</div><div class="text-xs sm:text-base font-semibold leading-tight">On cooking for one</div></div>
    </aside>
  </div>
</section>
</body></html>`,
  },
  {
    id: 'restaurant',
    label: 'Restaurant site',
    prompt: 'A modern restaurant landing page',
    html: `${baseHead}<body class="bg-stone-950 text-stone-100">
<nav class="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-white/5">
  <div class="text-base sm:text-xl font-bold tracking-[0.25em] sm:tracking-[0.3em]">VESPER</div>
  <div class="hidden md:flex gap-7 text-sm text-stone-400">Menu · Reservations · Story · Visit</div>
  <button class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-amber-400 text-stone-950 text-[11px] sm:text-sm font-bold whitespace-nowrap">Book table</button>
</nav>
<section class="px-4 sm:px-8 py-8 sm:py-16 text-center">
  <p class="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-amber-400 mb-3 sm:mb-4">Est. 2018 · West Village</p>
  <h1 class="text-3xl sm:text-5xl md:text-7xl mb-4 sm:mb-6 leading-[0.95] font-bold tracking-tight">Modern Italian,<br><span style="font-family:'Times New Roman',serif;font-style:italic;font-weight:400;color:#fbbf24">slow & seasonal.</span></h1>
  <p class="text-xs sm:text-sm md:text-base text-stone-400 max-w-md mx-auto mb-6 sm:mb-10">A 28-seat dining room. Wood-fired hearth. Hand-rolled pasta.</p>
  <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mb-6 sm:mb-12">
    <button class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-amber-400 text-stone-950 font-bold text-xs sm:text-base">Reserve a table</button>
    <button class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-white/20 text-white text-xs sm:text-base">See the menu</button>
  </div>
  <div class="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
    <div class="aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-900 to-stone-800 flex items-end p-3 sm:p-4"><div class="text-left"><div class="text-[10px] sm:text-xs text-amber-400/80 uppercase tracking-wider">Antipasti</div><div class="text-sm sm:text-base font-semibold">Burrata · Stone fruit</div></div></div>
    <div class="aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-900 to-stone-900 flex items-end p-3 sm:p-4"><div class="text-left"><div class="text-[10px] sm:text-xs text-rose-300/80 uppercase tracking-wider">Primi</div><div class="text-sm sm:text-base font-semibold">Cacio e pepe</div></div></div>
    <div class="aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br from-stone-700 to-stone-900 flex items-end p-3 sm:p-4"><div class="text-left"><div class="text-[10px] sm:text-xs text-stone-300/80 uppercase tracking-wider">Secondi</div><div class="text-sm sm:text-base font-semibold">Branzino · Capers</div></div></div>
  </div>
</section>
</body></html>`,
  },
  {
    id: 'agency',
    label: 'Creative agency',
    prompt: 'A bold creative agency landing page',
    html: `${baseHead}<body class="bg-black text-white">
<nav class="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
  <div class="text-base sm:text-xl font-bold">●● HALCYON</div>
  <div class="hidden md:flex gap-7 text-sm text-white/60">Work · Studio · Approach · Contact</div>
  <button class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/30 text-[11px] sm:text-sm whitespace-nowrap">Start a project</button>
</nav>
<section class="px-4 sm:px-8 py-8 sm:py-16">
  <p class="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-amber-400 mb-3 sm:mb-4">Brand · Web · Motion</p>
  <h1 class="text-3xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-5 sm:mb-8 font-bold tracking-tight max-w-4xl">
    Brands that feel
    <span class="block bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400">like home.</span>
  </h1>
  <p class="text-xs sm:text-base md:text-lg text-white/60 max-w-md mb-6 sm:mb-12">An independent design studio crafting identity systems for the next generation of consumer brands.</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-5xl">
    <div class="aspect-[4/3] rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 p-4 sm:p-6 flex flex-col justify-end"><div class="text-[10px] sm:text-xs uppercase tracking-wider text-white/70 mb-1">2025 · Rebrand</div><div class="text-lg sm:text-2xl font-bold">Maison Verre</div></div>
    <div class="aspect-[4/3] rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-700 via-fuchsia-500 to-pink-400 p-4 sm:p-6 flex flex-col justify-end"><div class="text-[10px] sm:text-xs uppercase tracking-wider text-white/70 mb-1">2025 · Identity</div><div class="text-lg sm:text-2xl font-bold">Ribbon Studio</div></div>
  </div>
</section>
</body></html>`,
  },
]
