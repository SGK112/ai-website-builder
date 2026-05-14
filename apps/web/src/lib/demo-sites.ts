// Pre-baked sample sites the landing-page demo iframe cycles through.
// Each is a complete, self-contained HTML document so the iframe srcDoc
// can render it without network beyond image CDN fetches. MOBILE-FIRST
// RESPONSIVE — every class is either base (mobile) or prefixed sm:/md:/lg:
// so the iframe actually reflows when the morphing card resizes to PC /
// tablet / mobile widths.
//
// Images use picsum.photos with seeded keywords (food, coffee, model,
// gym, dashboard, etc.) so reloads are stable. Avatars use i.pravatar.cc
// keyed by ?img=N for consistent faces.

export interface DemoSite {
  id: string
  label: string
  prompt: string
  html: string
}

const baseHead = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet"><style>body{font-family:'Inter',sans-serif}.serif{font-family:'Playfair Display',Georgia,serif}</style></head>`

// Helpers — keep image URLs short + readable inside the HTML strings.
// PICSUM is kept for filler / texture imagery (random but stable per seed).
// UNSPLASH is preferred for HERO images that need to match topic (e.g.,
// "restaurant dining table") — we use stable Unsplash photo IDs that
// reliably exist on their CDN. Sizes are intentionally small (max ~800px
// wide) so a demo iframe loads in under a second over typical connections.
const PICSUM = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`
const UNSPLASH = (id: string, w: number, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}&fit=crop` : ''}&q=70&auto=format`
const AVATAR = (n: number) => `https://i.pravatar.cc/100?img=${n}`

export const DEMO_SITES: DemoSite[] = [
  {
    id: 'saas',
    label: 'SaaS landing',
    prompt: 'A modern SaaS landing page for an analytics product',
    html: `${baseHead}<body class="bg-slate-950 text-white">
<nav class="px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between border-b border-white/5">
  <div class="flex items-center gap-2"><div class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500"></div><span class="font-bold text-sm sm:text-base">Aurora</span></div>
  <div class="hidden md:flex gap-6 text-sm text-slate-400"><span>Product</span><span>Customers</span><span>Pricing</span><span>Docs</span></div>
  <button class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-white text-slate-900 text-[11px] sm:text-sm font-semibold whitespace-nowrap">Start free</button>
</nav>
<section class="px-4 sm:px-8 pt-6 sm:pt-12 pb-4 text-center">
  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] sm:text-xs mb-4 sm:mb-6">✦ v2.0 — Realtime cohort views</div>
  <h1 class="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 tracking-tight leading-[1.05]">Analytics that finally <span class="serif italic bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">make sense.</span></h1>
  <p class="text-xs sm:text-base text-slate-400 mb-5 sm:mb-8 max-w-xl mx-auto leading-relaxed">Real-time metrics your team will actually use. Stop spelunking SQL — ship faster.</p>
  <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-6 sm:mb-10 px-4 sm:px-0">
    <button class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold text-xs sm:text-sm shadow-lg shadow-violet-500/30">Get started — free</button>
    <button class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 font-semibold text-xs sm:text-sm">Watch 90s demo →</button>
  </div>
</section>
<section class="px-4 sm:px-8 pb-6 sm:pb-12">
  <div class="max-w-5xl mx-auto rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/10">
    <img src="${UNSPLASH('1551288049-bebda4e38f71', 1200, 700)}" alt="Aurora dashboard" loading="eager" decoding="async" class="w-full block aspect-[12/7] object-cover">
  </div>
</section>
<section class="px-4 sm:px-8 py-6 sm:py-10 border-t border-white/5">
  <div class="max-w-5xl mx-auto">
    <p class="text-center text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-500 mb-4 sm:mb-6">Trusted by teams at</p>
    <div class="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-3 opacity-60">
      <span class="text-sm sm:text-lg font-bold">linear</span>
      <span class="text-sm sm:text-lg font-bold tracking-wider">RAYCAST</span>
      <span class="text-sm sm:text-lg font-bold serif italic">Stripe</span>
      <span class="text-sm sm:text-lg font-bold">Vercel</span>
      <span class="text-sm sm:text-lg font-bold tracking-tight">Notion</span>
    </div>
  </div>
</section>
<section class="px-4 sm:px-8 py-6 sm:py-12 border-t border-white/5">
  <div class="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center">
    <div><div class="text-xl sm:text-3xl font-bold mb-1">$48.2k</div><div class="text-[10px] sm:text-xs text-slate-400">MRR · ↑ 12%</div></div>
    <div><div class="text-xl sm:text-3xl font-bold mb-1">12,841</div><div class="text-[10px] sm:text-xs text-slate-400">Active users</div></div>
    <div><div class="text-xl sm:text-3xl font-bold mb-1">2.1%</div><div class="text-[10px] sm:text-xs text-slate-400">Churn · ↓ 0.4</div></div>
    <div><div class="text-xl sm:text-3xl font-bold mb-1">99.9%</div><div class="text-[10px] sm:text-xs text-slate-400">Uptime</div></div>
  </div>
</section></body></html>`,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    prompt: 'A creative portfolio site for a designer',
    html: `${baseHead}<body class="bg-stone-50 text-stone-900">
<nav class="px-4 sm:px-10 py-4 sm:py-6 flex items-center justify-between">
  <span class="serif italic font-bold text-base sm:text-xl">Maya Reyes</span>
  <div class="hidden md:flex gap-6 text-sm text-stone-600">Work · About · Words · Contact</div>
  <button class="md:hidden text-stone-600 text-xl">≡</button>
</nav>
<section class="px-4 sm:px-10 pt-4 sm:pt-8 pb-6 sm:pb-12">
  <h1 class="text-4xl sm:text-6xl md:text-7xl mb-2 sm:mb-3 tracking-tight font-black leading-[0.95]">Designer.<br><span class="serif italic font-normal text-orange-800">Storyteller.</span></h1>
  <p class="text-xs sm:text-base text-stone-600 max-w-lg mb-6 sm:mb-10">Brand systems & editorial design for studios who want to feel less like everyone else. Selected work below.</p>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative group">
      <img src="${PICSUM('magazine-spread', 600, 750)}" class="w-full h-full object-cover" alt="Folio Magazine">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2025 · Editorial</div><div class="text-sm sm:text-base font-bold">Folio Magazine</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative">
      <img src="${PICSUM('cocktail-bar', 600, 750)}" class="w-full h-full object-cover" alt="Nightbar">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2024 · Brand</div><div class="text-sm sm:text-base font-bold">Nightbar Identity</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative">
      <img src="${PICSUM('coffee-shop', 600, 750)}" class="w-full h-full object-cover" alt="Verdant Coffee">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2024 · Packaging</div><div class="text-sm sm:text-base font-bold">Verdant Coffee</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative hidden md:block">
      <img src="${PICSUM('book-cover-art', 600, 750)}" class="w-full h-full object-cover" alt="Tide & Salt">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2024 · Book design</div><div class="text-sm sm:text-base font-bold">Tide & Salt</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative hidden md:block">
      <img src="${PICSUM('fashion-lookbook', 600, 750)}" class="w-full h-full object-cover" alt="Almer">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2023 · Fashion</div><div class="text-sm sm:text-base font-bold">Almer Lookbook</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative hidden md:block">
      <img src="${PICSUM('architecture-print', 600, 750)}" class="w-full h-full object-cover" alt="Linework">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2023 · Print</div><div class="text-sm sm:text-base font-bold">Linework Series</div></div>
    </div>
  </div>
</section></body></html>`,
  },
  {
    id: 'mobile',
    label: 'Mobile app',
    prompt: 'A fitness tracker mobile app',
    html: `${baseHead}<body class="bg-gradient-to-br from-violet-950 via-slate-950 to-fuchsia-950 min-h-screen flex items-center justify-center p-4 sm:p-8">
<div class="relative">
  <div class="w-[240px] sm:w-[300px] h-[500px] sm:h-[600px] rounded-[36px] sm:rounded-[44px] bg-slate-950 border-[8px] sm:border-[10px] border-slate-800 shadow-2xl shadow-violet-500/30 overflow-hidden relative">
    <div class="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 bg-slate-900 rounded-full z-20"></div>
    <img src="${PICSUM('runner-trail', 600, 1200)}" class="absolute inset-0 w-full h-full object-cover opacity-40" alt="">
    <div class="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950"></div>
    <div class="relative px-4 sm:px-6 pt-10 sm:pt-14 pb-4 sm:pb-6 text-white h-full overflow-hidden">
      <div class="flex items-center justify-between mb-3 sm:mb-5">
        <div>
          <div class="text-[10px] sm:text-xs text-white/60">Tuesday, October 8</div>
          <div class="text-lg sm:text-2xl font-bold">Hey, Alex 👋</div>
        </div>
        <img src="${AVATAR(12)}" class="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-white/20" alt="">
      </div>
      <div class="rounded-2xl bg-white/10 backdrop-blur p-3 sm:p-4 mb-2 sm:mb-3 border border-white/15">
        <div class="flex items-center justify-between mb-2">
          <div class="text-[10px] sm:text-xs text-white/60">Daily steps</div>
          <div class="text-[10px] sm:text-xs text-emerald-300">↑ 84%</div>
        </div>
        <div class="text-2xl sm:text-3xl font-bold mb-2">8,421<span class="text-xs sm:text-sm text-white/40 font-normal"> / 10,000</span></div>
        <div class="w-full h-1.5 rounded-full bg-white/10"><div class="h-full w-[84%] bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full"></div></div>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div class="rounded-2xl bg-white/10 backdrop-blur p-3 border border-white/15"><div class="text-[10px] sm:text-xs text-white/60 mb-1">Calories</div><div class="text-base sm:text-xl font-bold">412</div><div class="text-[10px] text-amber-300 mt-0.5">kcal</div></div>
        <div class="rounded-2xl bg-white/10 backdrop-blur p-3 border border-white/15"><div class="text-[10px] sm:text-xs text-white/60 mb-1">Distance</div><div class="text-base sm:text-xl font-bold">5.2</div><div class="text-[10px] text-cyan-300 mt-0.5">km</div></div>
      </div>
      <div class="rounded-2xl bg-white/10 backdrop-blur p-3 sm:p-4 border border-white/15">
        <div class="flex items-center justify-between mb-2 sm:mb-3"><div class="text-xs sm:text-sm font-bold">Today's workout</div><div class="text-[10px] sm:text-xs text-white/60">45 min</div></div>
        <div class="flex items-center gap-2 sm:gap-3">
          <img src="${PICSUM('treadmill', 100, 100)}" class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover" alt="">
          <div class="flex-1 min-w-0">
            <div class="text-xs sm:text-sm font-semibold">Morning Run</div>
            <div class="text-[10px] sm:text-xs text-white/60">Zone 3 · 5.2 km · 6:18 pace</div>
          </div>
          <button class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-500 flex items-center justify-center text-xs">▶</button>
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
<nav class="px-4 sm:px-10 py-3 sm:py-5 flex items-center justify-between border-b border-stone-200">
  <span class="serif font-bold text-base sm:text-xl tracking-[0.2em]">AURELIA</span>
  <div class="hidden md:flex gap-7 text-xs uppercase tracking-wider text-stone-600">Necklaces · Rings · Earrings · Stories</div>
  <div class="flex items-center gap-3 text-stone-700"><span class="text-base sm:text-lg">⌕</span><span class="text-base sm:text-lg relative">⌬<span class="absolute -top-1 -right-2 w-3.5 h-3.5 bg-stone-900 text-white text-[8px] rounded-full flex items-center justify-center">2</span></span></div>
</nav>
<section class="relative h-[200px] sm:h-[280px] md:h-[340px] overflow-hidden">
  <img src="${PICSUM('jewelry-hand-model', 1400, 600)}" class="w-full h-full object-cover" alt="">
  <div class="absolute inset-0 bg-gradient-to-r from-stone-50/90 via-stone-50/30 to-transparent"></div>
  <div class="absolute inset-y-0 left-0 flex items-center px-4 sm:px-10 max-w-md">
    <div>
      <div class="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-stone-600 mb-2">Spring 2025</div>
      <h1 class="serif text-3xl sm:text-4xl md:text-5xl leading-[1.05] mb-3 sm:mb-4">Heirlooms in <span class="italic text-amber-700">14k gold.</span></h1>
      <button class="px-4 sm:px-5 py-2 sm:py-2.5 bg-stone-900 text-white text-xs sm:text-sm tracking-wider uppercase">Shop the collection</button>
    </div>
  </div>
</section>
<section class="px-4 sm:px-10 py-6 sm:py-10">
  <div class="flex items-end justify-between mb-4 sm:mb-6">
    <h2 class="serif text-xl sm:text-2xl md:text-3xl">Featured</h2>
    <a class="text-[10px] sm:text-xs uppercase tracking-wider text-stone-500 underline">View all →</a>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
    <div>
      <div class="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 sm:mb-3"><img src="${PICSUM('gold-necklace-pearl', 400, 400)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-xs sm:text-sm font-medium">Pearl Drop Chain</div>
      <div class="text-[10px] sm:text-xs text-stone-500">$248</div>
    </div>
    <div>
      <div class="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 sm:mb-3"><img src="${PICSUM('gold-ring-diamond', 400, 400)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-xs sm:text-sm font-medium">Solitaire Ring</div>
      <div class="text-[10px] sm:text-xs text-stone-500">$1,420</div>
    </div>
    <div>
      <div class="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 sm:mb-3 relative"><img src="${PICSUM('gold-earrings-hoop', 400, 400)}" class="w-full h-full object-cover" alt=""><span class="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-700 text-white text-[8px] tracking-wider uppercase rounded">New</span></div>
      <div class="text-xs sm:text-sm font-medium">Sora Hoops</div>
      <div class="text-[10px] sm:text-xs text-stone-500">$184</div>
    </div>
    <div>
      <div class="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 sm:mb-3"><img src="${PICSUM('gold-bracelet-flat', 400, 400)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-xs sm:text-sm font-medium">Flat Curb Bracelet</div>
      <div class="text-[10px] sm:text-xs text-stone-500">$312</div>
    </div>
  </div>
</section></body></html>`,
  },
  {
    id: 'blog',
    label: 'Editorial blog',
    prompt: 'A magazine-style blog about food and culture',
    html: `${baseHead}<body class="bg-amber-50 text-stone-900">
<nav class="px-4 sm:px-10 py-4 sm:py-6 flex items-center justify-between border-b border-stone-300">
  <span class="serif italic text-base sm:text-2xl font-bold">The Saffron Notebook</span>
  <div class="hidden md:flex gap-6 text-xs uppercase tracking-wider text-stone-600">Recipes · Travel · Long-reads · Subscribe</div>
  <button class="md:hidden text-stone-600 text-xl">≡</button>
</nav>
<section class="px-4 sm:px-10 pt-4 sm:pt-8 pb-3 sm:pb-6 grid md:grid-cols-2 gap-4 sm:gap-8 items-center">
  <div>
    <div class="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-amber-800 mb-2 sm:mb-3">Long-read · 12 min</div>
    <h1 class="serif text-2xl sm:text-4xl md:text-5xl leading-[1.1] mb-3 sm:mb-4">The slow return of <span class="italic">handmade pasta</span> to Brooklyn.</h1>
    <p class="text-xs sm:text-base text-stone-700 leading-relaxed mb-3 sm:mb-4">Three chefs, two grandmothers, and a flour mill in upstate New York are rewriting what neighborhood Italian food can be.</p>
    <div class="flex items-center gap-2 sm:gap-3">
      <img src="${AVATAR(33)}" class="w-7 h-7 sm:w-9 sm:h-9 rounded-full" alt="">
      <div>
        <div class="text-xs sm:text-sm font-medium">Lila Marconi</div>
        <div class="text-[10px] sm:text-xs text-stone-500">May 8, 2025</div>
      </div>
    </div>
  </div>
  <div class="aspect-[5/4] rounded-xl overflow-hidden">
    <img src="${PICSUM('handmade-pasta-flour', 800, 640)}" class="w-full h-full object-cover" alt="">
  </div>
</section>
<section class="px-4 sm:px-10 py-4 sm:py-8 border-t border-stone-200">
  <h2 class="serif text-lg sm:text-2xl mb-3 sm:mb-5">More from this issue</h2>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
    <article>
      <div class="aspect-[4/3] rounded-lg overflow-hidden mb-2 sm:mb-3"><img src="${PICSUM('saigon-street-food', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-amber-800 mb-1">Travel</div>
      <h3 class="serif text-sm sm:text-lg leading-snug mb-1">The bánh mì shop that never closes.</h3>
      <div class="text-[10px] sm:text-xs text-stone-500">Saigon, 4 a.m. · 6 min</div>
    </article>
    <article>
      <div class="aspect-[4/3] rounded-lg overflow-hidden mb-2 sm:mb-3"><img src="${PICSUM('grandmas-kitchen-stew', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-amber-800 mb-1">Recipe</div>
      <h3 class="serif text-sm sm:text-lg leading-snug mb-1">Lamb stew, three generations.</h3>
      <div class="text-[10px] sm:text-xs text-stone-500">Hours · 8 min</div>
    </article>
    <article>
      <div class="aspect-[4/3] rounded-lg overflow-hidden mb-2 sm:mb-3"><img src="${PICSUM('coffee-roasting-mill', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-amber-800 mb-1">Long-read</div>
      <h3 class="serif text-sm sm:text-lg leading-snug mb-1">The coffee roaster who quit.</h3>
      <div class="text-[10px] sm:text-xs text-stone-500">Portland, OR · 14 min</div>
    </article>
  </div>
</section></body></html>`,
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    prompt: 'An elegant restaurant website',
    html: `${baseHead}<body class="bg-stone-950 text-stone-100">
<nav class="absolute top-0 inset-x-0 z-20 px-4 sm:px-10 py-4 sm:py-6 flex items-center justify-between">
  <span class="serif italic text-base sm:text-2xl font-bold tracking-wide">Petra & Salt</span>
  <div class="hidden md:flex gap-6 text-xs uppercase tracking-[0.2em] text-white/80">Menu · Reservations · Story · Visit</div>
  <button class="hidden md:inline-flex px-4 py-2 border border-white/40 text-xs tracking-wider uppercase hover:bg-white/10">Reserve</button>
</nav>
<section class="relative h-[220px] sm:h-[320px] md:h-[400px] overflow-hidden">
  <img src="${PICSUM('candlelit-restaurant-table', 1600, 700)}" class="absolute inset-0 w-full h-full object-cover" alt="">
  <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
  <div class="absolute inset-x-0 bottom-0 px-4 sm:px-10 pb-6 sm:pb-10">
    <div class="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-200 mb-2 sm:mb-3">Open · Tuesday – Sunday</div>
    <h1 class="serif text-3xl sm:text-5xl md:text-6xl leading-[1.05] max-w-2xl">Coastal Mediterranean,<br><span class="italic text-amber-100">unhurried.</span></h1>
  </div>
</section>
<section class="px-4 sm:px-10 py-6 sm:py-10 border-b border-white/10">
  <h2 class="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-300 mb-4 sm:mb-6">From the kitchen</h2>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
    <div>
      <div class="aspect-[4/3] rounded overflow-hidden mb-2 sm:mb-3"><img src="${PICSUM('grilled-octopus-plate', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="serif text-base sm:text-xl mb-1">Charred Octopus</div>
      <div class="text-[10px] sm:text-xs text-stone-400 mb-1">Smoked paprika, blistered lemon, fennel pollen</div>
      <div class="text-xs sm:text-sm text-amber-200">$28</div>
    </div>
    <div>
      <div class="aspect-[4/3] rounded overflow-hidden mb-2 sm:mb-3"><img src="${PICSUM('seared-lamb-rosemary', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="serif text-base sm:text-xl mb-1">Slow-Braised Lamb</div>
      <div class="text-[10px] sm:text-xs text-stone-400 mb-1">Saffron jus, preserved lemon, mint-tahini</div>
      <div class="text-xs sm:text-sm text-amber-200">$42</div>
    </div>
    <div>
      <div class="aspect-[4/3] rounded overflow-hidden mb-2 sm:mb-3"><img src="${PICSUM('rustic-bread-olive-oil', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="serif text-base sm:text-xl mb-1">House Bread Service</div>
      <div class="text-[10px] sm:text-xs text-stone-400 mb-1">Wood-fired sourdough, cultured butter, sea salt</div>
      <div class="text-xs sm:text-sm text-amber-200">$9</div>
    </div>
  </div>
</section>
<section class="px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
  <div>
    <div class="serif italic text-base sm:text-lg">Reserve your table.</div>
    <div class="text-[10px] sm:text-xs text-stone-400">Tue–Sun · 5:30 PM – 11:00 PM · 47 Ash Lane</div>
  </div>
  <button class="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-200 text-stone-900 text-xs sm:text-sm tracking-wider uppercase">Book now</button>
</section></body></html>`,
  },
]
