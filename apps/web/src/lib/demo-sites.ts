// Three pre-baked sample sites the landing-page demo iframe cycles through.
// Each is a complete, self-contained HTML document so the iframe srcDoc can
// render it with no network calls. Designed to look polished at small scale.

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
<nav class="px-8 py-5 flex items-center justify-between border-b border-white/5">
  <div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500"></div><span class="font-bold">Aurora</span></div>
  <div class="flex gap-6 text-sm text-slate-400"><span>Product</span><span>Pricing</span><span>Docs</span></div>
  <button class="px-4 py-1.5 rounded-lg bg-white text-slate-900 text-sm font-semibold">Start free</button>
</nav>
<section class="px-8 py-16 text-center">
  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs mb-6">✦ New · v2.0 just shipped</div>
  <h1 class="text-5xl font-bold mb-4 tracking-tight">Analytics that finally <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">make sense.</span></h1>
  <p class="text-slate-400 mb-8 max-w-xl mx-auto">Ship faster with metrics your team will actually use. No setup. No tracking sprawl. Just answers.</p>
  <div class="flex gap-3 justify-center mb-12">
    <button class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold text-sm">Get started</button>
    <button class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 font-semibold text-sm">Watch demo</button>
  </div>
  <div class="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 p-1">
    <div class="rounded-xl bg-slate-900 p-6 grid grid-cols-3 gap-3">
      <div class="rounded-lg bg-violet-500/10 p-3"><div class="text-xs text-slate-400">MRR</div><div class="text-xl font-bold">$48.2k</div><div class="text-xs text-emerald-400">↑ 12.4%</div></div>
      <div class="rounded-lg bg-fuchsia-500/10 p-3"><div class="text-xs text-slate-400">Active users</div><div class="text-xl font-bold">12,841</div><div class="text-xs text-emerald-400">↑ 8.2%</div></div>
      <div class="rounded-lg bg-amber-500/10 p-3"><div class="text-xs text-slate-400">Churn</div><div class="text-xl font-bold">2.1%</div><div class="text-xs text-rose-400">↓ 0.4%</div></div>
    </div>
  </div>
</section></body></html>`,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    prompt: 'A creative portfolio site for a designer',
    html: `${baseHead}<body class="bg-stone-50 text-stone-900">
<nav class="px-8 py-5 flex items-center justify-between">
  <span class="font-bold text-lg" style="font-family:'Times New Roman',serif;font-style:italic">Maya Reyes</span>
  <div class="flex gap-6 text-sm">Work · About · Words · Contact</div>
</nav>
<section class="px-8 py-12">
  <h1 class="text-6xl mb-3 tracking-tight font-bold leading-none">Designer.<br><span style="font-family:'Times New Roman',serif;font-style:italic;color:#9a3412">Storyteller.</span></h1>
  <p class="text-stone-600 max-w-md mb-10">Brand systems &amp; editorial design for studios who want to feel less like everyone else.</p>
  <div class="grid grid-cols-3 gap-3">
    <div class="aspect-[4/5] rounded-xl bg-gradient-to-br from-orange-200 to-rose-300 p-4 flex flex-col justify-end"><div class="text-xs text-orange-900/70 font-semibold">2025</div><div class="font-bold text-orange-900">Folio Magazine</div></div>
    <div class="aspect-[4/5] rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 p-4 flex flex-col justify-end"><div class="text-xs text-stone-400 font-semibold">2024</div><div class="font-bold text-white">Nightbar Identity</div></div>
    <div class="aspect-[4/5] rounded-xl bg-gradient-to-br from-emerald-200 to-teal-300 p-4 flex flex-col justify-end"><div class="text-xs text-emerald-900/70 font-semibold">2024</div><div class="font-bold text-emerald-900">Verdant Coffee</div></div>
  </div>
</section></body></html>`,
  },
  {
    id: 'mobile',
    label: 'Mobile app',
    prompt: 'A fitness tracker mobile app',
    html: `${baseHead}<body class="bg-gradient-to-br from-violet-950 via-slate-950 to-fuchsia-950 min-h-screen flex items-center justify-center p-8">
<div class="relative">
  <div class="w-[280px] h-[560px] rounded-[44px] bg-slate-950 border-[10px] border-slate-800 shadow-2xl shadow-violet-500/20 overflow-hidden relative">
    <div class="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full z-10"></div>
    <div class="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-transparent to-fuchsia-600/30"></div>
    <div class="relative px-6 pt-14 pb-6 text-white">
      <div class="text-xs text-white/60 mb-1">Tuesday, October 8</div>
      <div class="text-2xl font-bold mb-5">Hey, Alex 👋</div>
      <div class="rounded-2xl bg-white/10 backdrop-blur p-4 mb-3 border border-white/10">
        <div class="text-xs text-white/60 mb-1">Daily steps</div>
        <div class="text-3xl font-bold mb-2">8,421 <span class="text-sm text-emerald-400 font-medium">/ 10,000</span></div>
        <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full w-[84%] bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full"></div></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10"><div class="text-xs text-white/60">Calories</div><div class="text-xl font-bold">412</div></div>
        <div class="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10"><div class="text-xs text-white/60">Distance</div><div class="text-xl font-bold">5.2 km</div></div>
      </div>
      <div class="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
        <div class="flex items-center justify-between mb-3"><div class="font-bold">Today's workout</div><div class="text-xs text-white/60">45 min</div></div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">🏃</div>
          <div class="flex-1"><div class="text-sm font-semibold">Morning Run</div><div class="text-xs text-white/60">Zone 3 · 5.2 km</div></div>
        </div>
      </div>
    </div>
  </div>
</div>
</body></html>`,
  },
]
