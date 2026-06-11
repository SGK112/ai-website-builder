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
  // A richer one-liner shown under the prompt while "building" — says what the
  // finished site actually contains, so the demo explains itself.
  description: string
  // Short build steps that cycle during the build beat ("what's happening").
  steps: string[]
  html: string
}

// Shared modal helpers — every demo loads them via baseHead, but only demos
// that mount a <div id="..."> modal use them. Functions live on window so
// inline onclick handlers in srcDoc'd iframes can reach them without
// needing a module loader.
//
// The .demo-hint class adds a soft pulsing halo + cursor-pointer on
// interactive elements so visitors browsing the morphing preview know the
// button actually does something. Pure CSS, no JS — won't fire timers in
// the iframe that survive a srcDoc swap.
const formScript = `<script>
window.openForm=function(id){var m=document.getElementById(id);if(m){m.classList.remove('hidden');m.classList.add('flex')}};
window.closeForm=function(id){var m=document.getElementById(id);if(m){m.classList.add('hidden');m.classList.remove('flex');var f=m.querySelector('[data-form]');var s=m.querySelector('[data-success]');if(f&&s){f.classList.remove('hidden');s.classList.add('hidden')}}};
window.submitForm=function(e,id){e.preventDefault();var m=document.getElementById(id);if(!m)return;var f=m.querySelector('[data-form]');var s=m.querySelector('[data-success]');if(f)f.classList.add('hidden');if(s)s.classList.remove('hidden');setTimeout(function(){window.closeForm(id)},2400)};
</script>
<style>
.demo-hint{position:relative;cursor:pointer;animation:demo-hint-pulse 2.4s ease-in-out infinite}
.demo-hint::after{content:'';position:absolute;inset:-4px;border-radius:inherit;box-shadow:0 0 0 0 rgba(139,92,246,0.55);animation:demo-hint-ring 2.4s ease-out infinite;pointer-events:none}
@keyframes demo-hint-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}
@keyframes demo-hint-ring{0%{box-shadow:0 0 0 0 rgba(139,92,246,0.55)}70%{box-shadow:0 0 0 12px rgba(139,92,246,0)}100%{box-shadow:0 0 0 0 rgba(139,92,246,0)}}
.demo-hint-amber::after{box-shadow:0 0 0 0 rgba(217,119,6,0.55);animation:demo-hint-ring-amber 2.4s ease-out infinite}
@keyframes demo-hint-ring-amber{0%{box-shadow:0 0 0 0 rgba(217,119,6,0.55)}70%{box-shadow:0 0 0 12px rgba(217,119,6,0)}100%{box-shadow:0 0 0 0 rgba(217,119,6,0)}}
</style>`

const baseHead = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet"><style>body{font-family:'Inter',sans-serif}.serif{font-family:'Playfair Display',Georgia,serif}</style>${formScript}</head>`

// Helpers — keep image URLs short + readable inside the HTML strings.
// PEXELS is the primary content-matched source: passes a keyword query
//   through our /api/media proxy which hits the Pexels API on first call
//   and caches the resolved CDN URL in Mongo. Photographer credit lives
//   in the cache row. Absolute URL is required because the demos render
//   inside iframe srcDoc — relative URLs there resolve against
//   about:srcdoc, not the parent's origin. /api/media falls back to a
//   deterministic Picsum URL on its own if Pexels is unavailable, so
//   this never breaks.
// PICSUM stays as the texture/random helper for non-topical imagery.
// Image helpers — ALL route through our /api/media proxy now. Direct
// third-party hits (images.unsplash.com photo IDs, i.pravatar.cc, picsum)
// were intermittently failing in iframe srcDoc renders (parallel image
// load + cross-origin rate limits). Pexels-backed proxy is stable + cached.
const MEDIA_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const PEXELS = (q: string, w: number, h: number) =>
  `${MEDIA_ORIGIN}/api/media?q=${encodeURIComponent(q)}&w=${w}&h=${h}`
const PICSUM = (seed: string, w: number, h: number) =>
  // Route picsum-style seed queries to the same proxy. Seed becomes the
  // search keyword so the resulting photo still tracks the demo's intent.
  `${MEDIA_ORIGIN}/api/media?q=${encodeURIComponent(seed)}&w=${w}&h=${h}`
const UNSPLASH = (id: string, w: number, h?: number) => {
  // Keep the photo-id signature so call sites don't need to change. The
  // id-to-keyword map covers the demo HEROes we actually use; anything
  // not in the map falls back to a generic "modern interior" keyword
  // (visually compatible with a SaaS/portfolio/store hero).
  const ID_TO_KEYWORD: Record<string, string> = {
    '1551288049-bebda4e38f71': 'analytics dashboard purple',
  }
  const q = ID_TO_KEYWORD[id] || 'modern interior'
  return `${MEDIA_ORIGIN}/api/media?q=${encodeURIComponent(q)}&w=${w}${h ? `&h=${h}` : ''}`
}
const AVATAR = (n: number) =>
  // pravatar.cc was timing out in iframes ~10% of the time. Route through
  // /api/media with a "portrait" query seeded by index so the same idx
  // returns a consistent photo.
  `${MEDIA_ORIGIN}/api/media?q=portrait${n}&w=120&h=120`

// Webstew "title slide" — rendered before each real demo so the rotation
// feels like a presentation: visitor watches a prompt get typed, then the
// site that prompt would build appears. `typedPrompt` is the actual
// prompt string for the demo coming next; the opener types it
// character-by-character inside the iframe via inline JS so each cycle
// looks like a real user session. `phase` controls the visual state:
//   'typing'    — caret blinking, send button idle
//   'building'  — send pulsed, loading dots, "Building…" badge
// The HTML is self-contained (no external JS) so srcDoc renders cleanly.
export function makeWebstewOpener(typedPrompt: string, phase: 'typing' | 'building' = 'typing'): string {
  // Escape for embedding inside a JS string literal in the HTML below.
  const safePrompt = typedPrompt
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/</g, '\\u003c')
  const isBuilding = phase === 'building'
  return `${baseHead}<body class="bg-[#0a0612] text-white overflow-hidden">
<div class="relative min-h-screen flex flex-col">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full blur-[120px] bg-violet-600/30"></div>
    <div class="absolute top-1/3 -right-32 w-[36rem] h-[36rem] rounded-full blur-[120px] bg-fuchsia-500/25"></div>
    <div class="absolute bottom-0 left-1/4 w-[28rem] h-[28rem] rounded-full blur-[120px] bg-amber-400/15"></div>
  </div>
  <nav class="relative z-10 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-base sm:text-lg shadow-lg shadow-violet-900/40">🍲</div>
      <span class="font-bold text-base sm:text-lg tracking-tight">Webstew</span>
    </div>
    <div class="hidden md:flex gap-6 text-sm text-slate-300">
      <span>Templates</span><span>Community</span><span>Pricing</span>
    </div>
    <button class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-white text-slate-900 text-[11px] sm:text-sm font-semibold whitespace-nowrap">Start free</button>
  </nav>
  <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 sm:py-8 text-center">
    <h1 class="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95] mb-1 sm:mb-2">
      Build a
      <span class="block serif italic font-normal bg-gradient-to-br from-violet-200 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent" style="font-size:1.15em;line-height:0.95">website.</span>
    </h1>
    <div class="w-full max-w-xl mt-5 sm:mt-7 rounded-2xl border-2 ${isBuilding ? 'border-violet-500/60 ring-2 ring-violet-500/30' : 'border-violet-500/30 ring-2 ring-violet-500/20'} bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/40">
      <div class="px-4 sm:px-5 pt-4 pb-2 text-left">
        <div class="text-base sm:text-lg text-white leading-relaxed min-h-[3.5em] flex items-start">
          <span id="typed-prompt"></span><span id="caret" class="inline-block w-[2px] h-5 bg-violet-400 ml-0.5 align-middle"></span>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 px-3 sm:px-4 pb-3 sm:pb-4">
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
          🌐 <span class="font-medium">Website</span>
        </div>
        <div id="send-btn" class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/40 ${isBuilding ? 'scale-95 opacity-80' : ''}">
          ${isBuilding
            ? '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 018-8" /></svg>'
            : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>'}
        </div>
      </div>
    </div>
    <div class="mt-6 sm:mt-10 flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-8 gap-y-2 opacity-50">
      <span class="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-semibold mr-1">Built with</span>
      <span class="text-xs sm:text-sm font-bold">Next.js</span>
      <span class="text-xs sm:text-sm font-bold">React</span>
      <span class="text-xs sm:text-sm font-bold">Astro</span>
      <span class="text-xs sm:text-sm font-bold">Expo</span>
      <span class="text-xs sm:text-sm font-bold">Tailwind</span>
    </div>
  </main>
  <div class="relative z-10 px-4 sm:px-8 pb-4 sm:pb-6 flex justify-center">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-[11px] text-slate-400">
      <span class="relative flex h-1.5 w-1.5">
        <span class="absolute inline-flex h-full w-full rounded-full ${isBuilding ? 'bg-violet-400' : 'bg-emerald-400'} opacity-75 animate-ping"></span>
        <span class="relative inline-flex rounded-full h-1.5 w-1.5 ${isBuilding ? 'bg-violet-500' : 'bg-emerald-500'}"></span>
      </span>
      <span class="uppercase tracking-[0.18em] font-semibold">${isBuilding ? 'Building' : 'Live'}</span>
      <span class="opacity-40">·</span>
      <span id="status-text">${isBuilding ? 'Generating with AI…' : 'One prompt → real production code'}</span>
    </div>
  </div>
</div>
<script>
(function(){
  var p='${safePrompt}';
  var phase='${phase}';
  var el=document.getElementById('typed-prompt');
  var caret=document.getElementById('caret');
  if(phase==='building'){
    if(el)el.textContent=p;
    if(caret)caret.style.display='none';
    return;
  }
  // Typewriter — types over ~3.2s regardless of prompt length so the
  // timing matches the parent's stage timer.
  var i=0;
  // Type the whole prompt in ~2.4s — leaves ~0.4s of "done typing" pause
  // before the parent flips us into the building state.
  var stepMs=Math.max(15,Math.min(60,Math.round(2400/p.length)));
  function tick(){
    if(!el)return;
    i++;
    el.textContent=p.slice(0,i);
    if(i<p.length)setTimeout(tick,stepMs);
  }
  setTimeout(tick,200);
  // Blink caret.
  if(caret){
    setInterval(function(){caret.style.opacity=caret.style.opacity==='0'?'1':'0';},520);
  }
})();
</script>
</body></html>`
}

export const DEMO_SITES: DemoSite[] = [
  {
    id: 'saas',
    label: 'SaaS landing',
    prompt: 'A modern SaaS landing page for an analytics product',
    description: 'A conversion-focused SaaS landing page — hero, feature grid, social proof, and a pricing section built to drive sign-ups.',
    steps: ['Sketching the hero + headline', 'Writing benefit-driven copy', 'Building the feature grid', 'Adding pricing + a sign-up CTA', 'Polishing with Tailwind'],
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
    <button onclick="openForm('saas-form')" class="demo-hint px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold text-xs sm:text-sm shadow-lg shadow-violet-500/30">Get started — free</button>
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
</section>
<div id="saas-form" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm items-center justify-center p-4" onclick="if(event.target===this)closeForm('saas-form')">
  <div class="bg-white rounded-2xl p-5 sm:p-7 max-w-sm w-full text-slate-900 shadow-2xl relative">
    <button onclick="closeForm('saas-form')" class="absolute top-2 right-3 text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
    <div data-form>
      <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold uppercase tracking-wider mb-3">Early access</div>
      <h3 class="text-xl sm:text-2xl font-bold mb-1.5">Get on the list.</h3>
      <p class="text-sm text-slate-500 mb-4">We'll email you when Aurora opens up for your team.</p>
      <form onsubmit="submitForm(event,'saas-form')" class="space-y-2.5">
        <input required type="email" placeholder="you@company.com" class="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-violet-500 focus:outline-none"/>
        <input type="text" placeholder="Company (optional)" class="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-violet-500 focus:outline-none"/>
        <button type="submit" class="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/20">Get early access →</button>
      </form>
      <p class="text-[10px] text-slate-400 mt-3 text-center">No spam. Unsubscribe anytime.</p>
    </div>
    <div data-success class="hidden text-center py-4">
      <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-3xl mx-auto mb-3">✓</div>
      <div class="font-bold text-lg mb-1">You're on the list.</div>
      <div class="text-sm text-slate-500">Look for an email from us shortly.</div>
    </div>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    prompt: 'A creative portfolio site for a designer',
    description: 'A bold personal portfolio — oversized editorial type, a curated project gallery, and an about section that lands the hire.',
    steps: ['Setting an editorial type scale', 'Laying out the work gallery', 'Writing the about + bio', 'Wiring up contact', 'Adding hover motion'],
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
      <img src="${PEXELS('magazine editorial spread', 600, 750)}" class="w-full h-full object-cover" alt="Folio Magazine">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2025 · Editorial</div><div class="text-sm sm:text-base font-bold">Folio Magazine</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative">
      <img src="${PEXELS('cocktail bar neon night', 600, 750)}" class="w-full h-full object-cover" alt="Nightbar">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2024 · Brand</div><div class="text-sm sm:text-base font-bold">Nightbar Identity</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative">
      <img src="${PEXELS('coffee shop interior packaging', 600, 750)}" class="w-full h-full object-cover" alt="Verdant Coffee">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2024 · Packaging</div><div class="text-sm sm:text-base font-bold">Verdant Coffee</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative hidden md:block">
      <img src="${PEXELS('book cover minimal typography', 600, 750)}" class="w-full h-full object-cover" alt="Tide & Salt">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2024 · Book design</div><div class="text-sm sm:text-base font-bold">Tide & Salt</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative hidden md:block">
      <img src="${PEXELS('fashion model lookbook studio', 600, 750)}" class="w-full h-full object-cover" alt="Almer">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2023 · Fashion</div><div class="text-sm sm:text-base font-bold">Almer Lookbook</div></div>
    </div>
    <div class="aspect-[4/5] rounded-xl overflow-hidden relative hidden md:block">
      <img src="${PEXELS('architecture line print drawing', 600, 750)}" class="w-full h-full object-cover" alt="Linework">
      <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-white"><div class="text-[10px] sm:text-xs opacity-80">2023 · Print</div><div class="text-sm sm:text-base font-bold">Linework Series</div></div>
    </div>
  </div>
</section></body></html>`,
  },
  {
    id: 'mobile',
    label: 'Mobile app',
    prompt: 'A fitness tracker mobile app',
    description: 'A fitness tracker app screen — daily stats, an activity ring, and today\u2019s workout, framed like a real phone.',
    steps: ['Framing the phone shell', 'Building the stats dashboard', 'Adding the activity ring', 'Listing today\u2019s workout', 'Theming the UI'],
    html: `${baseHead}<body class="bg-gradient-to-br from-violet-950 via-slate-950 to-fuchsia-950 min-h-screen flex items-center justify-center p-4 sm:p-8">
<div class="relative">
  <div class="w-[240px] sm:w-[300px] h-[500px] sm:h-[600px] rounded-[36px] sm:rounded-[44px] bg-slate-950 border-[8px] sm:border-[10px] border-slate-800 shadow-2xl shadow-violet-500/30 overflow-hidden relative">
    <div class="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 bg-slate-900 rounded-full z-20"></div>
    <img src="${PEXELS('runner trail sunrise mountain', 600, 1200)}" class="absolute inset-0 w-full h-full object-cover opacity-40" alt="">
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
          <img src="${PEXELS('running track morning', 100, 100)}" class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover" alt="">
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
    description: 'An online jewelry storefront — a shoppable product grid, featured pieces, and a checkout-ready cart.',
    steps: ['Designing the storefront', 'Building the product grid', 'Featuring hero pieces', 'Wiring the cart', 'Styling the checkout CTA'],
    html: `${baseHead}<body class="bg-stone-50 text-stone-900">
<nav class="px-4 sm:px-10 py-3 sm:py-5 flex items-center justify-between border-b border-stone-200">
  <span class="serif font-bold text-base sm:text-xl tracking-[0.2em]">AURELIA</span>
  <div class="hidden md:flex gap-7 text-xs uppercase tracking-wider text-stone-600">Necklaces · Rings · Earrings · Stories</div>
  <div class="flex items-center gap-3 text-stone-700"><span class="text-base sm:text-lg">⌕</span><span class="text-base sm:text-lg relative">⌬<span class="absolute -top-1 -right-2 w-3.5 h-3.5 bg-stone-900 text-white text-[8px] rounded-full flex items-center justify-center">2</span></span></div>
</nav>
<section class="relative h-[200px] sm:h-[280px] md:h-[340px] overflow-hidden">
  <img src="${PEXELS('gold jewelry hand model', 1400, 600)}" class="w-full h-full object-cover" alt="">
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
      <div class="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 sm:mb-3"><img src="${PEXELS('pearl drop necklace', 400, 400)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-xs sm:text-sm font-medium">Pearl Drop Chain</div>
      <div class="text-[10px] sm:text-xs text-stone-500">$248</div>
    </div>
    <div>
      <div class="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 sm:mb-3"><img src="${PEXELS('solitaire diamond ring', 400, 400)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-xs sm:text-sm font-medium">Solitaire Ring</div>
      <div class="text-[10px] sm:text-xs text-stone-500">$1,420</div>
    </div>
    <div>
      <div class="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 sm:mb-3 relative"><img src="${PEXELS('gold hoop earrings', 400, 400)}" class="w-full h-full object-cover" alt=""><span class="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-700 text-white text-[8px] tracking-wider uppercase rounded">New</span></div>
      <div class="text-xs sm:text-sm font-medium">Sora Hoops</div>
      <div class="text-[10px] sm:text-xs text-stone-500">$184</div>
    </div>
    <div>
      <div class="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 sm:mb-3"><img src="${PEXELS('gold chain bracelet flat', 400, 400)}" class="w-full h-full object-cover" alt=""></div>
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
    description: 'A magazine-style editorial blog — a striking cover story, an article grid, and elegant serif typography.',
    steps: ['Setting the masthead', 'Composing the cover story', 'Laying out the article grid', 'Tuning serif typography', 'Adding a subscribe bar'],
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
    <img src="${PEXELS('handmade pasta flour dough', 800, 640)}" class="w-full h-full object-cover" alt="">
  </div>
</section>
<section class="px-4 sm:px-10 py-4 sm:py-8 border-t border-stone-200">
  <h2 class="serif text-lg sm:text-2xl mb-3 sm:mb-5">More from this issue</h2>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
    <article>
      <div class="aspect-[4/3] rounded-lg overflow-hidden mb-2 sm:mb-3"><img src="${PEXELS('banh mi saigon street food', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-amber-800 mb-1">Travel</div>
      <h3 class="serif text-sm sm:text-lg leading-snug mb-1">The bánh mì shop that never closes.</h3>
      <div class="text-[10px] sm:text-xs text-stone-500">Saigon, 4 a.m. · 6 min</div>
    </article>
    <article>
      <div class="aspect-[4/3] rounded-lg overflow-hidden mb-2 sm:mb-3"><img src="${PEXELS('lamb stew rustic kitchen', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-amber-800 mb-1">Recipe</div>
      <h3 class="serif text-sm sm:text-lg leading-snug mb-1">Lamb stew, three generations.</h3>
      <div class="text-[10px] sm:text-xs text-stone-500">Hours · 8 min</div>
    </article>
    <article>
      <div class="aspect-[4/3] rounded-lg overflow-hidden mb-2 sm:mb-3"><img src="${PEXELS('coffee roasting beans bag', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
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
    description: 'An elegant restaurant site — an inviting hero, the menu from the kitchen, hours, and a one-tap reservation.',
    steps: ['Plating the hero', 'Writing out the menu', 'Adding hours + location', 'Building the reservation form', 'Setting the mood + type'],
    html: `${baseHead}<body class="bg-stone-950 text-stone-100">
<nav class="absolute top-0 inset-x-0 z-20 px-4 sm:px-10 py-4 sm:py-6 flex items-center justify-between">
  <span class="serif italic text-base sm:text-2xl font-bold tracking-wide">Petra & Salt</span>
  <div class="hidden md:flex gap-6 text-xs uppercase tracking-[0.2em] text-white/80">Menu · Reservations · Story · Visit</div>
  <button onclick="openForm('restaurant-form')" class="demo-hint demo-hint-amber hidden md:inline-flex px-4 py-2 border border-white/40 text-xs tracking-wider uppercase hover:bg-white/10">Reserve</button>
</nav>
<section class="relative h-[220px] sm:h-[320px] md:h-[400px] overflow-hidden">
  <img src="${PEXELS('candlelit restaurant dining table moody', 1600, 700)}" class="absolute inset-0 w-full h-full object-cover" alt="">
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
      <div class="aspect-[4/3] rounded overflow-hidden mb-2 sm:mb-3"><img src="${PEXELS('grilled octopus plate gourmet', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="serif text-base sm:text-xl mb-1">Charred Octopus</div>
      <div class="text-[10px] sm:text-xs text-stone-400 mb-1">Smoked paprika, blistered lemon, fennel pollen</div>
      <div class="text-xs sm:text-sm text-amber-200">$28</div>
    </div>
    <div>
      <div class="aspect-[4/3] rounded overflow-hidden mb-2 sm:mb-3"><img src="${PEXELS('seared lamb rosemary plated', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
      <div class="serif text-base sm:text-xl mb-1">Slow-Braised Lamb</div>
      <div class="text-[10px] sm:text-xs text-stone-400 mb-1">Saffron jus, preserved lemon, mint-tahini</div>
      <div class="text-xs sm:text-sm text-amber-200">$42</div>
    </div>
    <div>
      <div class="aspect-[4/3] rounded overflow-hidden mb-2 sm:mb-3"><img src="${PEXELS('rustic sourdough bread olive oil', 500, 380)}" class="w-full h-full object-cover" alt=""></div>
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
  <button onclick="openForm('restaurant-form')" class="demo-hint demo-hint-amber px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-200 text-stone-900 text-xs sm:text-sm tracking-wider uppercase">Book now</button>
</section>
<div id="restaurant-form" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-center justify-center p-4" onclick="if(event.target===this)closeForm('restaurant-form')">
  <div class="bg-stone-50 rounded-lg p-5 sm:p-7 max-w-sm w-full text-stone-900 shadow-2xl relative">
    <button onclick="closeForm('restaurant-form')" class="absolute top-2 right-3 text-stone-400 hover:text-stone-700 text-2xl leading-none">×</button>
    <div data-form>
      <div class="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-700 mb-2">Petra &amp; Salt</div>
      <h3 class="serif text-2xl sm:text-3xl mb-4 leading-tight">Reserve your <span class="italic">table.</span></h3>
      <form onsubmit="submitForm(event,'restaurant-form')" class="space-y-2.5">
        <input required type="text" placeholder="Full name" class="w-full px-3 py-2.5 rounded border border-stone-300 text-sm focus:border-amber-700 focus:outline-none"/>
        <div class="grid grid-cols-2 gap-2">
          <input required type="date" class="px-3 py-2.5 rounded border border-stone-300 text-sm focus:border-amber-700 focus:outline-none"/>
          <select required class="px-3 py-2.5 rounded border border-stone-300 text-sm focus:border-amber-700 focus:outline-none bg-white">
            <option value="">Party size</option>
            <option>2</option><option>3</option><option>4</option><option>5</option><option>6+</option>
          </select>
        </div>
        <input type="tel" placeholder="Phone (optional)" class="w-full px-3 py-2.5 rounded border border-stone-300 text-sm focus:border-amber-700 focus:outline-none"/>
        <button type="submit" class="w-full px-4 py-2.5 bg-stone-900 text-amber-100 text-xs tracking-wider uppercase hover:bg-stone-800">Request reservation</button>
      </form>
      <p class="text-[10px] text-stone-500 mt-3 text-center">We'll confirm within the hour.</p>
    </div>
    <div data-success class="hidden text-center py-4">
      <div class="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-3xl mx-auto mb-3">✓</div>
      <div class="serif text-xl mb-1">Reservation requested.</div>
      <div class="text-sm text-stone-500">We'll text you a confirmation shortly.</div>
    </div>
  </div>
</div>
</body></html>`,
  },
]
