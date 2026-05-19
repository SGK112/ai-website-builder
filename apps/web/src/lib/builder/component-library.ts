// Component Library - Pre-built sections to mix & match

export interface ComponentSection {
  id: string
  name: string
  category: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'footer' | 'navigation' | 'content' | 'gallery' | 'contact' | 'stats' | 'social-proof' | 'map' | 'faq' | 'newsletter' | 'team'
  description: string
  html: string
  thumbnail?: string
}

export const componentLibrary: ComponentSection[] = [
  // ============== NAVIGATION ==============
  {
    id: 'nav-glassmorphic',
    name: 'Glassmorphic Nav',
    category: 'navigation',
    description: 'Fixed nav with blur effect',
    html: `<nav class="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#features" class="text-sm text-zinc-400 hover:text-white transition">Features</a>
      <a href="#pricing" class="text-sm text-zinc-400 hover:text-white transition">Pricing</a>
      <a href="#about" class="text-sm text-zinc-400 hover:text-white transition">About</a>
      <a href="#contact" class="text-sm text-zinc-400 hover:text-white transition">Contact</a>
    </div>
    <a href="#" class="px-5 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition">Get Started</a>
  </div>
</nav>`,
  },
  {
    id: 'nav-minimal',
    name: 'Minimal Nav',
    category: 'navigation',
    description: 'Clean centered navigation',
    html: `<nav class="py-6 px-6 border-b border-zinc-200">
  <div class="max-w-7xl mx-auto flex items-center justify-between">
    <a href="#" class="text-lg font-semibold">Brand</a>
    <div class="flex items-center gap-6">
      <a href="#" class="text-sm text-zinc-600 hover:text-black transition">Work</a>
      <a href="#" class="text-sm text-zinc-600 hover:text-black transition">About</a>
      <a href="#" class="text-sm text-zinc-600 hover:text-black transition">Contact</a>
    </div>
  </div>
</nav>`,
  },

  // ============== HEROES ==============
  {
    id: 'hero-gradient',
    name: 'Gradient Hero',
    category: 'hero',
    description: 'Bold gradient with announcement badge',
    html: `<section class="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-950">
  <div class="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-fuchsia-600/20"></div>
  <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 40px 40px;"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
    <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-8">
      <span class="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
      <span class="text-violet-300 text-sm font-medium">Now in public beta</span>
    </div>
    <h1 class="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
      Build something<br><span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">amazing</span>
    </h1>
    <p class="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">The modern platform for creating stunning websites. No code required, just your imagination.</p>
    <div class="flex flex-wrap justify-center gap-4">
      <a href="#" class="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition shadow-lg">Start Free</a>
      <a href="#" class="px-8 py-4 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition">Watch Demo</a>
    </div>
  </div>
</section>`,
  },
  {
    id: 'hero-split',
    name: 'Split Hero',
    category: 'hero',
    description: 'Image on right, content on left',
    html: `<section class="min-h-screen flex items-center bg-white">
  <div class="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <span class="text-sm font-semibold text-blue-600 uppercase tracking-wide">Welcome</span>
      <h1 class="text-4xl md:text-6xl font-bold text-slate-900 mt-4 mb-6 leading-tight">Transform your ideas into reality</h1>
      <p class="text-lg text-slate-600 mb-8">We help businesses grow with modern solutions that drive results. Start your journey today.</p>
      <div class="flex gap-4">
        <a href="#" class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">Get Started</a>
        <a href="#" class="px-6 py-3 text-slate-700 font-medium hover:text-blue-600 transition flex items-center gap-2">
          Learn more <span>→</span>
        </a>
      </div>
    </div>
    <div class="relative">
      <img src="https://picsum.photos/seed/hero/600/500" alt="Hero" class="rounded-2xl shadow-2xl">
    </div>
  </div>
</section>`,
  },

  // ============== FEATURES ==============
  {
    id: 'features-grid',
    name: 'Features Grid',
    category: 'features',
    description: '6 features in 3x2 grid with icons',
    html: `<section class="py-24 bg-slate-950">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-bold text-white mb-4">Everything you need</h2>
      <p class="text-zinc-400 text-lg max-w-2xl mx-auto">Powerful features to help you build, launch, and grow.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/30 transition group">
        <div class="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition">
          <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
        <p class="text-zinc-400">Optimized for speed. Your sites load in milliseconds.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/30 transition group">
        <div class="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition">
          <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Secure by Default</h3>
        <p class="text-zinc-400">Enterprise-grade security for all your projects.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/30 transition group">
        <div class="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition">
          <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Flexible Layouts</h3>
        <p class="text-zinc-400">Drag and drop components to build any design.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/30 transition group">
        <div class="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition">
          <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Custom Themes</h3>
        <p class="text-zinc-400">Match your brand with customizable styles.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/30 transition group">
        <div class="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition">
          <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Analytics Built-in</h3>
        <p class="text-zinc-400">Track visitors and understand your audience.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/30 transition group">
        <div class="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition">
          <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Team Collaboration</h3>
        <p class="text-zinc-400">Work together with real-time editing.</p>
      </div>
    </div>
  </div>
</section>`,
  },

  // ============== PRICING ==============
  {
    id: 'pricing-3tier',
    name: '3-Tier Pricing',
    category: 'pricing',
    description: 'Standard pricing table with popular tag',
    html: `<section class="py-24 bg-slate-900">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-bold text-white mb-4">Simple pricing</h2>
      <p class="text-zinc-400 text-lg">No hidden fees. Cancel anytime.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <h3 class="text-lg font-semibold text-white mb-2">Starter</h3>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold text-white">$9</span>
          <span class="text-zinc-500">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-zinc-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>5 projects</li>
          <li class="flex items-center gap-3 text-zinc-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Basic analytics</li>
          <li class="flex items-center gap-3 text-zinc-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Email support</li>
        </ul>
        <a href="#" class="block w-full py-3 text-center bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition">Get Started</a>
      </div>
      <div class="p-8 bg-gradient-to-b from-violet-600 to-violet-700 rounded-2xl relative">
        <div class="absolute -top-3 right-6 px-3 py-1 bg-white text-violet-700 text-xs font-bold rounded-full">POPULAR</div>
        <h3 class="text-lg font-semibold text-white mb-2">Pro</h3>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold text-white">$29</span>
          <span class="text-violet-200">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-white"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited projects</li>
          <li class="flex items-center gap-3 text-white"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Advanced analytics</li>
          <li class="flex items-center gap-3 text-white"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Priority support</li>
          <li class="flex items-center gap-3 text-white"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Custom domain</li>
        </ul>
        <a href="#" class="block w-full py-3 text-center bg-white text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition">Get Started</a>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <h3 class="text-lg font-semibold text-white mb-2">Enterprise</h3>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold text-white">$99</span>
          <span class="text-zinc-500">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-zinc-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Everything in Pro</li>
          <li class="flex items-center gap-3 text-zinc-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>SSO & SAML</li>
          <li class="flex items-center gap-3 text-zinc-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Dedicated support</li>
          <li class="flex items-center gap-3 text-zinc-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Custom integrations</li>
        </ul>
        <a href="#" class="block w-full py-3 text-center bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition">Contact Sales</a>
      </div>
    </div>
  </div>
</section>`,
  },

  // ============== TESTIMONIALS ==============
  {
    id: 'testimonials-grid',
    name: 'Testimonials Grid',
    category: 'testimonials',
    description: '3 testimonial cards with avatars',
    html: `<section class="py-24 bg-slate-950">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-bold text-white mb-4">Loved by thousands</h2>
      <p class="text-zinc-400 text-lg">See what our customers have to say.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <div class="flex gap-1 mb-4 text-amber-400">★★★★★</div>
        <p class="text-zinc-300 mb-6 italic">"This platform completely transformed how we build websites. The AI is incredible."</p>
        <div class="flex items-center gap-4">
          <img src="https://i.pravatar.cc/48?img=1" alt="Avatar" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Sarah Chen</div>
            <div class="text-sm text-zinc-500">CEO, TechStart</div>
          </div>
        </div>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <div class="flex gap-1 mb-4 text-amber-400">★★★★★</div>
        <p class="text-zinc-300 mb-6 italic">"We shipped our new site in hours instead of weeks. Absolutely game-changing."</p>
        <div class="flex items-center gap-4">
          <img src="https://i.pravatar.cc/48?img=12" alt="Avatar" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Marcus Johnson</div>
            <div class="text-sm text-zinc-500">Founder, DesignLab</div>
          </div>
        </div>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <div class="flex gap-1 mb-4 text-amber-400">★★★★★</div>
        <p class="text-zinc-300 mb-6 italic">"The best investment we made this year. Our conversion rate doubled."</p>
        <div class="flex items-center gap-4">
          <img src="https://i.pravatar.cc/48?img=5" alt="Avatar" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Emily Rodriguez</div>
            <div class="text-sm text-zinc-500">Marketing Lead, GrowthCo</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ============== STATS ==============
  {
    id: 'stats-bar',
    name: 'Stats Bar',
    category: 'stats',
    description: '4 impressive numbers in a row',
    html: `<section class="py-16 bg-gradient-to-r from-violet-600 to-fuchsia-600">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      <div>
        <div class="text-4xl md:text-5xl font-bold text-white mb-2">10K+</div>
        <div class="text-violet-200">Active Users</div>
      </div>
      <div>
        <div class="text-4xl md:text-5xl font-bold text-white mb-2">50M+</div>
        <div class="text-violet-200">Sites Created</div>
      </div>
      <div>
        <div class="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
        <div class="text-violet-200">Uptime</div>
      </div>
      <div>
        <div class="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
        <div class="text-violet-200">Support</div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ============== CTA ==============
  {
    id: 'cta-gradient',
    name: 'Gradient CTA',
    category: 'cta',
    description: 'Bold call-to-action section',
    html: `<section class="py-24 bg-slate-950">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <div class="p-12 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-violet-600/20 rounded-3xl border border-violet-500/20">
      <h2 class="text-3xl md:text-5xl font-bold text-white mb-6">Ready to get started?</h2>
      <p class="text-xl text-zinc-400 mb-8">Join thousands of creators building amazing websites.</p>
      <div class="flex flex-wrap justify-center gap-4">
        <a href="#" class="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition">Start Free Trial</a>
        <a href="#" class="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/20 transition">Talk to Sales</a>
      </div>
    </div>
  </div>
</section>`,
  },

  // ============== CONTACT ==============
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'contact',
    description: 'Simple contact form with fields',
    html: `<section class="py-24 bg-slate-900">
  <div class="max-w-2xl mx-auto px-6">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Get in touch</h2>
      <p class="text-zinc-400">We'd love to hear from you.</p>
    </div>
    <form class="space-y-6">
      <div class="grid md:grid-cols-2 gap-6">
        <input type="text" placeholder="First name" class="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500">
        <input type="text" placeholder="Last name" class="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500">
      </div>
      <input type="email" placeholder="Email address" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500">
      <textarea placeholder="Your message" rows="5" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"></textarea>
      <button type="submit" class="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition">Send Message</button>
    </form>
  </div>
</section>`,
  },

  // ============== FOOTER ==============
  {
    id: 'footer-multi',
    name: 'Multi-Column Footer',
    category: 'footer',
    description: 'Footer with 4 link columns',
    html: `<footer class="py-16 bg-slate-950 border-t border-white/10">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-5 gap-12 mb-12">
      <div class="md:col-span-2">
        <a href="#" class="text-xl font-bold text-white">Brand</a>
        <p class="text-zinc-400 mt-4 max-w-xs">Building the future of web development, one site at a time.</p>
      </div>
      <div>
        <h4 class="font-semibold text-white mb-4">Product</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Features</a></li>
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Pricing</a></li>
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Templates</a></li>
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Integrations</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-white mb-4">Company</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-zinc-400 hover:text-white transition">About</a></li>
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Blog</a></li>
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Careers</a></li>
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-white mb-4">Legal</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Privacy</a></li>
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Terms</a></li>
          <li><a href="#" class="text-zinc-400 hover:text-white transition">Cookies</a></li>
        </ul>
      </div>
    </div>
    <div class="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-zinc-500 text-sm">© 2025 Brand. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-zinc-400 hover:text-white transition">Twitter</a>
        <a href="#" class="text-zinc-400 hover:text-white transition">GitHub</a>
        <a href="#" class="text-zinc-400 hover:text-white transition">LinkedIn</a>
      </div>
    </div>
  </div>
</footer>`,
  },

  // ============== SOCIAL PROOF — logo cloud ==============
  {
    id: 'logos-trusted-by',
    name: 'Trusted-by Logo Cloud',
    category: 'social-proof',
    description: 'Greyscale row of customer logos with a "trusted by" headline. Drop in any 5-8 brand names.',
    html: `<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <p class="text-center text-sm font-semibold uppercase tracking-wider text-slate-500 mb-10">Trusted by teams at</p>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60">
      <div class="text-center font-serif text-2xl text-slate-700">Acme</div>
      <div class="text-center font-mono text-2xl text-slate-700 tracking-tight">stripe</div>
      <div class="text-center font-bold text-2xl text-slate-700 italic">Northwind</div>
      <div class="text-center font-light text-2xl text-slate-700 tracking-widest">VERTEX</div>
      <div class="text-center font-semibold text-2xl text-slate-700">Lumen</div>
      <div class="text-center font-black text-2xl text-slate-700 uppercase">Forge</div>
    </div>
  </div>
</section>`,
  },

  // ============== MAP — embedded ==============
  {
    id: 'map-with-contact',
    name: 'Map + Address',
    category: 'map',
    description: 'Embedded map alongside contact info. Uses OpenStreetMap iframe so it works without a Google API key.',
    html: `<section class="py-20 bg-slate-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-4xl font-bold text-slate-900 mb-4">Come say hi</h2>
        <p class="text-lg text-slate-600 mb-8">Open 9–6 Mon–Fri, closed weekends. Walk-ins welcome.</p>
        <div class="space-y-4 text-slate-700">
          <div class="flex gap-3"><span class="text-indigo-600">📍</span><span>123 Main Street, Suite 400<br>Phoenix, AZ 85001</span></div>
          <div class="flex gap-3"><span class="text-indigo-600">📞</span><a href="tel:+15555550100" class="hover:text-indigo-600">(555) 555-0100</a></div>
          <div class="flex gap-3"><span class="text-indigo-600">✉️</span><a href="mailto:hello@example.com" class="hover:text-indigo-600">hello@example.com</a></div>
        </div>
      </div>
      <div class="rounded-2xl overflow-hidden shadow-xl aspect-square">
        <iframe
          width="100%" height="100%" frameborder="0" scrolling="no"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-112.1%2C33.4%2C-112.0%2C33.5&amp;layer=mapnik"
          title="Map"
          style="border:0"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  </div>
</section>`,
  },

  // ============== FAQ — accordion ==============
  {
    id: 'faq-accordion',
    name: 'FAQ Accordion',
    category: 'faq',
    description: 'Five-question FAQ with native <details> elements — no JS needed.',
    html: `<section class="py-24 bg-white">
  <div class="max-w-3xl mx-auto px-6">
    <h2 class="text-4xl font-bold text-slate-900 text-center mb-4">Frequently asked questions</h2>
    <p class="text-lg text-slate-600 text-center mb-12">Everything you need to know before getting started.</p>
    <div class="space-y-3">
      <details class="group rounded-xl border border-slate-200 bg-slate-50 p-5 open:bg-white open:shadow-sm">
        <summary class="cursor-pointer list-none flex items-center justify-between font-semibold text-slate-900">
          How does the free trial work?
          <span class="text-2xl text-slate-400 group-open:rotate-45 transition-transform">+</span>
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed">14 days, no credit card required. You'll get full access to every feature. Cancel anytime before the trial ends to avoid any charge.</p>
      </details>
      <details class="group rounded-xl border border-slate-200 bg-slate-50 p-5 open:bg-white open:shadow-sm">
        <summary class="cursor-pointer list-none flex items-center justify-between font-semibold text-slate-900">
          Can I change plans later?
          <span class="text-2xl text-slate-400 group-open:rotate-45 transition-transform">+</span>
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed">Yes. Upgrade or downgrade at any time from your account settings — we'll prorate the difference.</p>
      </details>
      <details class="group rounded-xl border border-slate-200 bg-slate-50 p-5 open:bg-white open:shadow-sm">
        <summary class="cursor-pointer list-none flex items-center justify-between font-semibold text-slate-900">
          Do you offer refunds?
          <span class="text-2xl text-slate-400 group-open:rotate-45 transition-transform">+</span>
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed">30-day money-back guarantee on all paid plans. Email us and we'll process it within 24 hours.</p>
      </details>
      <details class="group rounded-xl border border-slate-200 bg-slate-50 p-5 open:bg-white open:shadow-sm">
        <summary class="cursor-pointer list-none flex items-center justify-between font-semibold text-slate-900">
          Is my data secure?
          <span class="text-2xl text-slate-400 group-open:rotate-45 transition-transform">+</span>
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed">Everything is encrypted at rest and in transit. We're SOC 2 Type II certified and never share your data with third parties.</p>
      </details>
      <details class="group rounded-xl border border-slate-200 bg-slate-50 p-5 open:bg-white open:shadow-sm">
        <summary class="cursor-pointer list-none flex items-center justify-between font-semibold text-slate-900">
          How do I get support?
          <span class="text-2xl text-slate-400 group-open:rotate-45 transition-transform">+</span>
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed">Email support@example.com — we typically reply within 2 hours during business days.</p>
      </details>
    </div>
  </div>
</section>`,
  },

  // ============== NEWSLETTER — email capture ==============
  {
    id: 'newsletter-inline',
    name: 'Newsletter Signup',
    category: 'newsletter',
    description: 'Inline email capture form with action="/api/forms/submit" — pairs with the FormSubmission collection.',
    html: `<section class="py-20 bg-gradient-to-br from-indigo-600 to-violet-700">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="text-4xl font-bold text-white mb-4">Stay in the loop</h2>
    <p class="text-xl text-indigo-100 mb-8">Get product updates, design tips, and the occasional dad joke — once a month, no spam.</p>
    <form action="/api/forms/submit" method="POST" class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input type="hidden" name="_form" value="newsletter">
      <input
        type="email" name="email" required placeholder="you@company.com"
        class="flex-1 px-5 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-white/30"
      >
      <button
        type="submit"
        class="px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition shadow-lg"
      >
        Subscribe
      </button>
    </form>
    <p class="text-xs text-indigo-200 mt-4">Unsubscribe at any time. We'll never share your email.</p>
  </div>
</section>`,
  },

  // ============== TEAM grid ==============
  {
    id: 'team-grid',
    name: 'Team Grid',
    category: 'team',
    description: 'Four-person team grid with photos, roles, and social links.',
    html: `<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-slate-900 mb-4">Meet the team</h2>
      <p class="text-lg text-slate-600 max-w-2xl mx-auto">A small group of obsessives who care deeply about the details.</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="text-center">
        <img src="https://i.pravatar.cc/300?img=11" alt="Sarah Chen" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg">
        <h3 class="font-bold text-slate-900">Sarah Chen</h3>
        <p class="text-sm text-slate-500 mb-2">Founder &amp; CEO</p>
        <div class="flex justify-center gap-2 text-slate-400 text-sm">
          <a href="#" class="hover:text-indigo-600">Twitter</a>·<a href="#" class="hover:text-indigo-600">LinkedIn</a>
        </div>
      </div>
      <div class="text-center">
        <img src="https://i.pravatar.cc/300?img=12" alt="Marcus Rivera" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg">
        <h3 class="font-bold text-slate-900">Marcus Rivera</h3>
        <p class="text-sm text-slate-500 mb-2">Head of Engineering</p>
        <div class="flex justify-center gap-2 text-slate-400 text-sm">
          <a href="#" class="hover:text-indigo-600">Twitter</a>·<a href="#" class="hover:text-indigo-600">LinkedIn</a>
        </div>
      </div>
      <div class="text-center">
        <img src="https://i.pravatar.cc/300?img=13" alt="Priya Singh" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg">
        <h3 class="font-bold text-slate-900">Priya Singh</h3>
        <p class="text-sm text-slate-500 mb-2">Design Lead</p>
        <div class="flex justify-center gap-2 text-slate-400 text-sm">
          <a href="#" class="hover:text-indigo-600">Twitter</a>·<a href="#" class="hover:text-indigo-600">LinkedIn</a>
        </div>
      </div>
      <div class="text-center">
        <img src="https://i.pravatar.cc/300?img=14" alt="Jake Thompson" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg">
        <h3 class="font-bold text-slate-900">Jake Thompson</h3>
        <p class="text-sm text-slate-500 mb-2">Customer Success</p>
        <div class="flex justify-center gap-2 text-slate-400 text-sm">
          <a href="#" class="hover:text-indigo-600">Twitter</a>·<a href="#" class="hover:text-indigo-600">LinkedIn</a>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
]

// Get components by category
export function getComponentsByCategory(category: ComponentSection['category']): ComponentSection[] {
  return componentLibrary.filter(c => c.category === category)
}

// Get all categories
export function getCategories(): ComponentSection['category'][] {
  return [...new Set(componentLibrary.map(c => c.category))]
}

// Assemble a full page from sections
export function assemblePage(sections: string[], presetId?: string): string {
  const selectedSections = sections
    .map(id => componentLibrary.find(c => c.id === id))
    .filter(Boolean)
    .map(c => c!.html)
    .join('\n\n')

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Site</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
        }
      }
    }
  </script>
</head>
<body class="bg-slate-950 text-white font-sans antialiased">
${selectedSections}
<script>
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});
    });
  });
</script>
</body>
</html>`
}
