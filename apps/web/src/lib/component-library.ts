// Pre-built components users can add to their websites

export interface ComponentTemplate {
  id: string
  name: string
  category: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'contact' | 'footer' | 'navigation' | 'gallery' | 'stats' | 'team' | 'faq' | 'video' | 'audio' | 'media'
  description: string
  preview: string // Small preview description
  html: string
}

export const COMPONENT_CATEGORIES = [
  { id: 'hero', name: 'Hero Sections', icon: 'layout' },
  { id: 'features', name: 'Features', icon: 'grid' },
  { id: 'pricing', name: 'Pricing', icon: 'credit-card' },
  { id: 'testimonials', name: 'Testimonials', icon: 'message-circle' },
  { id: 'cta', name: 'Call to Action', icon: 'megaphone' },
  { id: 'contact', name: 'Contact', icon: 'mail' },
  { id: 'gallery', name: 'Image Gallery', icon: 'image' },
  { id: 'video', name: 'Video', icon: 'play' },
  { id: 'audio', name: 'Audio', icon: 'volume-2' },
  { id: 'media', name: 'Media Grid', icon: 'film' },
  { id: 'stats', name: 'Stats', icon: 'bar-chart' },
  { id: 'team', name: 'Team', icon: 'users' },
  { id: 'faq', name: 'FAQ', icon: 'help-circle' },
]

export const COMPONENTS: ComponentTemplate[] = [
  // HERO SECTIONS
  {
    id: 'hero-gradient',
    name: 'Gradient Hero',
    category: 'hero',
    description: 'Bold gradient background with centered text',
    preview: 'Gradient bg, large headline, CTA buttons',
    html: `<section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
  <div class="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-pink-600/20"></div>
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl"></div>
  <div class="relative z-10 max-w-5xl mx-auto px-6 text-center">
    <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-8">
      <span class="relative flex h-2 w-2"><span class="animate-ping absolute h-full w-full rounded-full bg-violet-400 opacity-75"></span><span class="relative rounded-full h-2 w-2 bg-violet-500"></span></span>
      <span class="text-violet-400 text-sm font-medium">Now Available</span>
    </div>
    <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
      Build Something <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Incredible</span>
    </h1>
    <p class="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">The all-in-one platform that helps you create, launch, and grow your business faster than ever before.</p>
    <div class="flex flex-wrap gap-4 justify-center">
      <a href="#" class="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-violet-500/25">Get Started Free</a>
      <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition">Watch Demo</a>
    </div>
  </div>
</section>`,
  },
  {
    id: 'hero-split',
    name: 'Split Hero',
    category: 'hero',
    description: 'Text on left, image on right',
    preview: 'Split layout with image',
    html: `<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
    <div>
      <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">Welcome</span>
      <h1 class="text-5xl font-bold text-slate-900 mt-4 mb-6 leading-tight">Transform Your Business Today</h1>
      <p class="text-xl text-slate-600 mb-8">We help companies of all sizes achieve their goals with innovative solutions and dedicated support.</p>
      <div class="flex flex-wrap gap-4">
        <a href="#" class="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition">Get Started</a>
        <a href="#" class="px-6 py-3 text-slate-700 font-medium hover:text-violet-600 transition flex items-center gap-2">
          Learn More <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
    <div class="relative">
      <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800" alt="Team" class="rounded-2xl shadow-2xl" />
      <div class="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <p class="font-semibold text-slate-900">10,000+</p>
            <p class="text-sm text-slate-500">Happy Customers</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // FEATURES
  {
    id: 'features-grid',
    name: 'Features Grid',
    category: 'features',
    description: '3-column feature cards with icons',
    preview: 'Grid of feature cards',
    html: `<section class="py-24 bg-slate-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">Features</span>
      <h2 class="text-4xl font-bold text-slate-900 mt-4 mb-4">Everything You Need</h2>
      <p class="text-xl text-slate-600 max-w-2xl mx-auto">Powerful features to help you manage, grow, and scale your business.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition">
        <div class="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-3">Lightning Fast</h3>
        <p class="text-slate-600">Built for speed. Your pages load instantly, keeping visitors engaged.</p>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition">
        <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-3">Secure by Default</h3>
        <p class="text-slate-600">Enterprise-grade security to protect your data and customers.</p>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition">
        <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-3">Easy to Use</h3>
        <p class="text-slate-600">Intuitive interface that anyone can master in minutes.</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: 'features-bento',
    name: 'Bento Grid',
    category: 'features',
    description: 'Modern bento-style feature layout',
    preview: 'Bento grid layout',
    html: `<section class="py-24 bg-slate-950">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-white mb-4">Powerful Features</h2>
      <p class="text-xl text-slate-400">Everything you need to succeed</p>
    </div>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
        <h3 class="text-2xl font-bold text-white mb-3">AI-Powered Analytics</h3>
        <p class="text-white/80 mb-6">Get intelligent insights about your business with our advanced AI analytics engine.</p>
        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600" alt="Analytics" class="rounded-xl w-full h-48 object-cover" />
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <div class="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Revenue Tracking</h3>
        <p class="text-slate-400">Monitor your income streams in real-time.</p>
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Team Collaboration</h3>
        <p class="text-slate-400">Work together seamlessly.</p>
      </div>
      <div class="md:col-span-2 p-8 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-8">
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-white mb-3">Global Infrastructure</h3>
          <p class="text-slate-400">Deploy to 30+ regions worldwide for lightning-fast performance everywhere.</p>
        </div>
        <div class="text-6xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">30+</div>
      </div>
    </div>
  </div>
</section>`,
  },

  // PRICING
  {
    id: 'pricing-cards',
    name: 'Pricing Cards',
    category: 'pricing',
    description: 'Three-tier pricing table',
    preview: '3 pricing tiers',
    html: `<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">Pricing</span>
      <h2 class="text-4xl font-bold text-slate-900 mt-4 mb-4">Simple, Transparent Pricing</h2>
      <p class="text-xl text-slate-600">Choose the plan that's right for you</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div class="border border-slate-200 rounded-2xl p-8">
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Starter</h3>
        <p class="text-slate-500 mb-6">Perfect for individuals</p>
        <div class="mb-6"><span class="text-4xl font-bold text-slate-900">$9</span><span class="text-slate-500">/month</span></div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Up to 5 projects</li>
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Basic analytics</li>
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Email support</li>
        </ul>
        <a href="#" class="block w-full py-3 text-center border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Get Started</a>
      </div>
      <div class="border-2 border-violet-600 rounded-2xl p-8 relative">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-600 text-white text-sm font-medium rounded-full">Most Popular</div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Pro</h3>
        <p class="text-slate-500 mb-6">For growing teams</p>
        <div class="mb-6"><span class="text-4xl font-bold text-slate-900">$29</span><span class="text-slate-500">/month</span></div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Unlimited projects</li>
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Advanced analytics</li>
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Priority support</li>
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>API access</li>
        </ul>
        <a href="#" class="block w-full py-3 text-center bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition">Get Started</a>
      </div>
      <div class="border border-slate-200 rounded-2xl p-8">
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Enterprise</h3>
        <p class="text-slate-500 mb-6">For large organizations</p>
        <div class="mb-6"><span class="text-4xl font-bold text-slate-900">Custom</span></div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Everything in Pro</li>
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Dedicated support</li>
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Custom integrations</li>
          <li class="flex items-center gap-3 text-slate-600"><svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>SLA guarantee</li>
        </ul>
        <a href="#" class="block w-full py-3 text-center border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">Contact Sales</a>
      </div>
    </div>
  </div>
</section>`,
  },

  // TESTIMONIALS
  {
    id: 'testimonials-cards',
    name: 'Testimonial Cards',
    category: 'testimonials',
    description: 'Customer testimonials in a grid',
    preview: 'Customer reviews grid',
    html: `<section class="py-24 bg-slate-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
      <h2 class="text-4xl font-bold text-slate-900 mt-4">Loved by Thousands</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white p-8 rounded-2xl shadow-sm">
        <div class="flex gap-1 mb-4">
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-600 mb-6">"This product has completely transformed how we work. The interface is intuitive and the results speak for themselves."</p>
        <div class="flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Sarah" class="w-12 h-12 rounded-full object-cover" />
          <div>
            <p class="font-semibold text-slate-900">Sarah Johnson</p>
            <p class="text-sm text-slate-500">CEO at TechCorp</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm">
        <div class="flex gap-1 mb-4">
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-600 mb-6">"The best investment we've made this year. Our productivity has increased by 40% since we started using it."</p>
        <div class="flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="Michael" class="w-12 h-12 rounded-full object-cover" />
          <div>
            <p class="font-semibold text-slate-900">Michael Chen</p>
            <p class="text-sm text-slate-500">CTO at StartupXYZ</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm">
        <div class="flex gap-1 mb-4">
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-600 mb-6">"Outstanding customer support and an incredible product. I can't imagine running my business without it."</p>
        <div class="flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100" alt="Emily" class="w-12 h-12 rounded-full object-cover" />
          <div>
            <p class="font-semibold text-slate-900">Emily Rodriguez</p>
            <p class="text-sm text-slate-500">Founder at DesignCo</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // CTA
  {
    id: 'cta-gradient',
    name: 'Gradient CTA',
    category: 'cta',
    description: 'Bold gradient call-to-action section',
    preview: 'Gradient background CTA',
    html: `<section class="py-24 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 relative overflow-hidden">
  <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z\" fill=\"rgba(255,255,255,0.07)\"%3E%3C/path%3E%3C/svg%3E')] opacity-50"></div>
  <div class="max-w-4xl mx-auto px-6 text-center relative z-10">
    <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
    <p class="text-xl text-white/80 mb-10 max-w-2xl mx-auto">Join thousands of satisfied customers who have transformed their business with our platform.</p>
    <div class="flex flex-wrap gap-4 justify-center">
      <a href="#" class="px-8 py-4 bg-white text-violet-600 font-semibold rounded-xl hover:bg-slate-100 transition shadow-lg">Start Free Trial</a>
      <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition">Talk to Sales</a>
    </div>
    <p class="mt-6 text-white/60 text-sm">No credit card required. 14-day free trial.</p>
  </div>
</section>`,
  },

  // CONTACT
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'contact',
    description: 'Split layout with form',
    preview: 'Contact info + form',
    html: `<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16">
      <div>
        <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">Contact</span>
        <h2 class="text-4xl font-bold text-slate-900 mt-4 mb-6">Get in Touch</h2>
        <p class="text-lg text-slate-600 mb-8">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <p class="font-medium text-slate-900">Email</p>
              <p class="text-slate-600">hello@example.com</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <div>
              <p class="font-medium text-slate-900">Phone</p>
              <p class="text-slate-600">+1 (555) 123-4567</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <p class="font-medium text-slate-900">Office</p>
              <p class="text-slate-600">123 Main Street, City, ST 12345</p>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-slate-50 p-8 rounded-2xl">
        <form class="space-y-6">
          <div class="grid sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="John" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input type="email" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="john@example.com" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Message</label>
            <textarea rows="4" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="How can we help you?"></textarea>
          </div>
          <button type="submit" class="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition">Send Message</button>
        </form>
      </div>
    </div>
  </div>
</section>`,
  },

  // STATS
  {
    id: 'stats-bar',
    name: 'Stats Bar',
    category: 'stats',
    description: 'Horizontal stats display',
    preview: '4 key metrics',
    html: `<section class="py-16 bg-slate-900">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      <div>
        <p class="text-4xl md:text-5xl font-bold text-white mb-2">10M+</p>
        <p class="text-slate-400">Active Users</p>
      </div>
      <div>
        <p class="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</p>
        <p class="text-slate-400">Uptime</p>
      </div>
      <div>
        <p class="text-4xl md:text-5xl font-bold text-white mb-2">150+</p>
        <p class="text-slate-400">Countries</p>
      </div>
      <div>
        <p class="text-4xl md:text-5xl font-bold text-white mb-2">24/7</p>
        <p class="text-slate-400">Support</p>
      </div>
    </div>
  </div>
</section>`,
  },

  // FAQ
  {
    id: 'faq-accordion',
    name: 'FAQ Accordion',
    category: 'faq',
    description: 'Expandable FAQ section',
    preview: 'FAQ list with answers',
    html: `<section class="py-24 bg-white">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
      <h2 class="text-4xl font-bold text-slate-900 mt-4">Frequently Asked Questions</h2>
    </div>
    <div class="space-y-4">
      <details class="group border border-slate-200 rounded-lg">
        <summary class="flex items-center justify-between p-6 cursor-pointer">
          <span class="font-medium text-slate-900">How does the free trial work?</span>
          <svg class="w-5 h-5 text-slate-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-6 pb-6 text-slate-600">
          Our 14-day free trial gives you full access to all features. No credit card required. Cancel anytime.
        </div>
      </details>
      <details class="group border border-slate-200 rounded-lg">
        <summary class="flex items-center justify-between p-6 cursor-pointer">
          <span class="font-medium text-slate-900">Can I change my plan later?</span>
          <svg class="w-5 h-5 text-slate-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-6 pb-6 text-slate-600">
          Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
        </div>
      </details>
      <details class="group border border-slate-200 rounded-lg">
        <summary class="flex items-center justify-between p-6 cursor-pointer">
          <span class="font-medium text-slate-900">What payment methods do you accept?</span>
          <svg class="w-5 h-5 text-slate-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-6 pb-6 text-slate-600">
          We accept all major credit cards, PayPal, and bank transfers for annual plans.
        </div>
      </details>
      <details class="group border border-slate-200 rounded-lg">
        <summary class="flex items-center justify-between p-6 cursor-pointer">
          <span class="font-medium text-slate-900">Is there a money-back guarantee?</span>
          <svg class="w-5 h-5 text-slate-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-6 pb-6 text-slate-600">
          Absolutely! If you're not satisfied within the first 30 days, we'll give you a full refund.
        </div>
      </details>
    </div>
  </div>
</section>`,
  },

  // CONTACT FORMS
  {
    id: 'contact-split',
    name: 'Contact Split',
    category: 'contact',
    description: 'Contact form with info sidebar',
    preview: 'Form with contact details',
    html: `<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid lg:grid-cols-2 gap-16">
      <div>
        <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">Contact Us</span>
        <h2 class="text-4xl font-bold text-slate-900 mt-4 mb-6">Get in Touch</h2>
        <p class="text-lg text-slate-600 mb-8">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <p class="font-medium text-slate-900">Email</p>
              <p class="text-slate-600">hello@example.com</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <div>
              <p class="font-medium text-slate-900">Phone</p>
              <p class="text-slate-600">+1 (555) 123-4567</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <p class="font-medium text-slate-900">Address</p>
              <p class="text-slate-600">123 Business Ave, Suite 100</p>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-slate-50 p-8 rounded-2xl">
        <form class="space-y-6">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="John" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input type="email" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="john@example.com" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Message</label>
            <textarea rows="4" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" placeholder="How can we help you?"></textarea>
          </div>
          <button type="submit" class="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition">Send Message</button>
        </form>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: 'newsletter-simple',
    name: 'Newsletter Signup',
    category: 'cta',
    description: 'Email signup with inline form',
    preview: 'Newsletter subscription',
    html: `<section class="py-16 bg-slate-900">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h2 class="text-3xl font-bold text-white mb-4">Stay Updated</h2>
    <p class="text-slate-400 mb-8">Get the latest news and updates delivered to your inbox.</p>
    <form class="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
      <input type="email" placeholder="Enter your email" class="flex-1 px-5 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
      <button type="submit" class="px-8 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 transition whitespace-nowrap">Subscribe</button>
    </form>
    <p class="text-sm text-slate-500 mt-4">No spam, unsubscribe at any time.</p>
  </div>
</section>`,
  },
  {
    id: 'contact-centered',
    name: 'Contact Centered',
    category: 'contact',
    description: 'Centered contact form',
    preview: 'Simple centered form',
    html: `<section class="py-24 bg-slate-50">
  <div class="max-w-2xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">Contact</span>
      <h2 class="text-4xl font-bold text-slate-900 mt-4 mb-4">Send us a Message</h2>
      <p class="text-lg text-slate-600">We'll get back to you within 24 hours.</p>
    </div>
    <form class="bg-white p-8 rounded-2xl shadow-sm space-y-6">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
        <input type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="Your name" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
        <input type="email" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="you@example.com" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Subject</label>
        <select class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent">
          <option>General Inquiry</option>
          <option>Sales</option>
          <option>Support</option>
          <option>Partnership</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Message</label>
        <textarea rows="5" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" placeholder="Tell us how we can help..."></textarea>
      </div>
      <button type="submit" class="w-full py-4 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition">Send Message</button>
    </form>
  </div>
</section>`,
  },
]

// VIDEO COMPONENTS
const VIDEO_COMPONENTS: ComponentTemplate[] = [
  {
    id: 'video-hero',
    name: 'Video Hero',
    category: 'video',
    description: 'Full-width hero with background video',
    preview: 'Video background hero',
    html: `<section class="relative min-h-screen flex items-center justify-center overflow-hidden">
  <video autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover">
    <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connections-27610-large.mp4" type="video/mp4">
  </video>
  <div class="absolute inset-0 bg-slate-950/70"></div>
  <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
    <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">Captivating Video Content</h1>
    <p class="text-xl text-slate-300 mb-10">Engage your audience with stunning video backgrounds</p>
    <a href="#" class="px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition">Get Started</a>
  </div>
</section>`,
  },
  {
    id: 'video-embed',
    name: 'Video Embed',
    category: 'video',
    description: 'Embedded YouTube/Vimeo player',
    preview: 'Responsive video embed',
    html: `<section class="py-24 bg-slate-950">
  <div class="max-w-5xl mx-auto px-6">
    <div class="text-center mb-12">
      <h2 class="text-4xl font-bold text-white mb-4">Watch Our Story</h2>
      <p class="text-xl text-slate-400">See how we're changing the game</p>
    </div>
    <div class="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
      <iframe
        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="absolute inset-0 w-full h-full"
      ></iframe>
    </div>
  </div>
</section>`,
  },
  {
    id: 'video-gallery',
    name: 'Video Gallery',
    category: 'video',
    description: 'Grid of video thumbnails',
    preview: 'Multiple video cards',
    html: `<section class="py-24 bg-slate-900">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-white mb-4">Video Library</h2>
      <p class="text-xl text-slate-400">Browse our collection</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="group cursor-pointer">
        <div class="relative aspect-video rounded-xl overflow-hidden mb-4">
          <img src="https://picsum.photos/seed/video1/640/360" alt="Video thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition">
            <div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <span class="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded">3:45</span>
        </div>
        <h3 class="text-lg font-semibold text-white mb-1">Introduction Video</h3>
        <p class="text-slate-400 text-sm">Learn the basics in minutes</p>
      </div>
      <div class="group cursor-pointer">
        <div class="relative aspect-video rounded-xl overflow-hidden mb-4">
          <img src="https://picsum.photos/seed/video2/640/360" alt="Video thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition">
            <div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <span class="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded">5:20</span>
        </div>
        <h3 class="text-lg font-semibold text-white mb-1">Advanced Tutorial</h3>
        <p class="text-slate-400 text-sm">Deep dive into features</p>
      </div>
      <div class="group cursor-pointer">
        <div class="relative aspect-video rounded-xl overflow-hidden mb-4">
          <img src="https://picsum.photos/seed/video3/640/360" alt="Video thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition">
            <div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <span class="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded">8:15</span>
        </div>
        <h3 class="text-lg font-semibold text-white mb-1">Customer Stories</h3>
        <p class="text-slate-400 text-sm">Real success stories</p>
      </div>
    </div>
  </div>
</section>`,
  },
]

// AUDIO COMPONENTS
const AUDIO_COMPONENTS: ComponentTemplate[] = [
  {
    id: 'audio-player',
    name: 'Audio Player',
    category: 'audio',
    description: 'Custom audio player with controls',
    preview: 'Styled audio player',
    html: `<section class="py-24 bg-slate-950">
  <div class="max-w-2xl mx-auto px-6">
    <div class="bg-slate-900 rounded-2xl p-8 border border-slate-800">
      <div class="flex items-center gap-6 mb-6">
        <img src="https://picsum.photos/seed/album/120/120" alt="Album art" class="w-24 h-24 rounded-xl object-cover">
        <div>
          <h3 class="text-xl font-bold text-white mb-1">Track Title</h3>
          <p class="text-slate-400">Artist Name</p>
        </div>
      </div>
      <audio controls class="w-full h-12 [&::-webkit-media-controls-panel]:bg-slate-800 [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white">
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg">
      </audio>
    </div>
  </div>
</section>`,
  },
  {
    id: 'audio-playlist',
    name: 'Audio Playlist',
    category: 'audio',
    description: 'List of audio tracks',
    preview: 'Music playlist',
    html: `<section class="py-24 bg-slate-900">
  <div class="max-w-3xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white mb-8">Playlist</h2>
    <div class="space-y-3">
      <div class="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition cursor-pointer group">
        <div class="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition">
          <svg class="w-5 h-5 text-violet-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="flex-1">
          <p class="font-medium text-white">Morning Vibes</p>
          <p class="text-sm text-slate-400">Chill Beats • 3:42</p>
        </div>
        <span class="text-slate-500">3:42</span>
      </div>
      <div class="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition cursor-pointer group">
        <div class="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition">
          <svg class="w-5 h-5 text-violet-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="flex-1">
          <p class="font-medium text-white">Focus Flow</p>
          <p class="text-sm text-slate-400">Study Music • 5:18</p>
        </div>
        <span class="text-slate-500">5:18</span>
      </div>
      <div class="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition cursor-pointer group">
        <div class="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition">
          <svg class="w-5 h-5 text-violet-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="flex-1">
          <p class="font-medium text-white">Night Drive</p>
          <p class="text-sm text-slate-400">Electronic • 4:55</p>
        </div>
        <span class="text-slate-500">4:55</span>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: 'podcast-player',
    name: 'Podcast Player',
    category: 'audio',
    description: 'Podcast episode player',
    preview: 'Podcast with transcript',
    html: `<section class="py-24 bg-white">
  <div class="max-w-4xl mx-auto px-6">
    <div class="grid md:grid-cols-3 gap-8">
      <div class="md:col-span-1">
        <img src="https://picsum.photos/seed/podcast/400/400" alt="Podcast cover" class="w-full rounded-2xl shadow-lg">
      </div>
      <div class="md:col-span-2">
        <span class="text-violet-600 font-semibold text-sm uppercase tracking-wider">Episode 42</span>
        <h2 class="text-3xl font-bold text-slate-900 mt-2 mb-4">The Future of Technology</h2>
        <p class="text-slate-600 mb-6">Join us as we discuss emerging trends in AI, blockchain, and more with industry experts.</p>
        <div class="flex items-center gap-4 mb-6">
          <button class="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-700 transition">
            <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <div class="flex-1">
            <div class="h-2 bg-slate-200 rounded-full">
              <div class="h-2 bg-violet-600 rounded-full w-1/3"></div>
            </div>
            <div class="flex justify-between text-sm text-slate-500 mt-1">
              <span>12:34</span>
              <span>45:20</span>
            </div>
          </div>
        </div>
        <div class="flex gap-4">
          <button class="px-4 py-2 text-slate-600 hover:text-slate-900 transition flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            Share
          </button>
          <button class="px-4 py-2 text-slate-600 hover:text-slate-900 transition flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
]

// NAVIGATION (Multi-page support)
const NAVIGATION_COMPONENTS: ComponentTemplate[] = [
  {
    id: 'nav-multipage',
    name: 'Multi-Page Navigation',
    category: 'navigation',
    description: 'Navigation bar with page links',
    preview: 'Multi-page nav with dropdown',
    html: `<nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-center justify-between h-16">
      <a href="index.html" class="text-xl font-bold text-slate-900">Brand</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="index.html" class="text-slate-600 hover:text-slate-900 transition">Home</a>
        <a href="about.html" class="text-slate-600 hover:text-slate-900 transition">About</a>
        <div class="relative group">
          <button class="text-slate-600 hover:text-slate-900 transition flex items-center gap-1">
            Services
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <div class="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <a href="services-web.html" class="block px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Web Design</a>
            <a href="services-mobile.html" class="block px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Mobile Apps</a>
            <a href="services-marketing.html" class="block px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Marketing</a>
          </div>
        </div>
        <a href="blog.html" class="text-slate-600 hover:text-slate-900 transition">Blog</a>
        <a href="contact.html" class="text-slate-600 hover:text-slate-900 transition">Contact</a>
      </div>
      <a href="contact.html" class="px-5 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition">Get Quote</a>
    </div>
  </div>
</nav>`,
  },
  {
    id: 'nav-dark-multipage',
    name: 'Dark Multi-Page Nav',
    category: 'navigation',
    description: 'Dark navigation for multi-page sites',
    preview: 'Dark nav with pages',
    html: `<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-b border-white/10">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-center justify-between h-16">
      <a href="index.html" class="text-xl font-bold text-white">Brand</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="index.html" class="text-slate-300 hover:text-white transition">Home</a>
        <a href="about.html" class="text-slate-300 hover:text-white transition">About</a>
        <a href="services.html" class="text-slate-300 hover:text-white transition">Services</a>
        <a href="portfolio.html" class="text-slate-300 hover:text-white transition">Portfolio</a>
        <a href="blog.html" class="text-slate-300 hover:text-white transition">Blog</a>
        <a href="contact.html" class="text-slate-300 hover:text-white transition">Contact</a>
      </div>
      <div class="flex items-center gap-4">
        <a href="login.html" class="text-slate-300 hover:text-white transition">Login</a>
        <a href="signup.html" class="px-5 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 transition">Sign Up</a>
      </div>
    </div>
  </div>
</nav>`,
  },
]

// MEDIA GRID COMPONENTS
const MEDIA_COMPONENTS: ComponentTemplate[] = [
  {
    id: 'media-gallery',
    name: 'Mixed Media Gallery',
    category: 'media',
    description: 'Gallery with images, videos, audio',
    preview: 'Multi-media grid',
    html: `<section class="py-24 bg-slate-950">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-white mb-4">Media Gallery</h2>
      <div class="flex justify-center gap-4 mt-8">
        <button class="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium">All</button>
        <button class="px-4 py-2 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition">Images</button>
        <button class="px-4 py-2 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition">Videos</button>
        <button class="px-4 py-2 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition">Audio</button>
      </div>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="group relative aspect-square rounded-2xl overflow-hidden">
        <img src="https://picsum.photos/seed/media1/600/600" alt="Media" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
          <div class="absolute bottom-4 left-4 right-4">
            <p class="text-white font-medium">Project Alpha</p>
            <p class="text-slate-300 text-sm">Photography</p>
          </div>
        </div>
      </div>
      <div class="group relative aspect-square rounded-2xl overflow-hidden">
        <img src="https://picsum.photos/seed/media2/600/600" alt="Media" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition">
            <svg class="w-6 h-6 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="absolute bottom-4 left-4">
          <span class="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">Video</span>
        </div>
      </div>
      <div class="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
          </div>
          <p class="text-white font-semibold">Ambient Mix</p>
          <p class="text-white/70 text-sm">Audio • 12:45</p>
        </div>
        <div class="absolute bottom-4 left-4">
          <span class="px-3 py-1 bg-violet-800 text-white text-xs font-medium rounded-full">Audio</span>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: 'image-lightbox',
    name: 'Image Lightbox Gallery',
    category: 'gallery',
    description: 'Clickable images with lightbox',
    preview: 'Gallery with zoom',
    html: `<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-slate-900 mb-4">Our Work</h2>
      <p class="text-xl text-slate-600">Click any image to enlarge</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <a href="#" class="group block aspect-square rounded-xl overflow-hidden">
        <img src="https://picsum.photos/seed/work1/400/400" alt="Work" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
      </a>
      <a href="#" class="group block aspect-square rounded-xl overflow-hidden">
        <img src="https://picsum.photos/seed/work2/400/400" alt="Work" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
      </a>
      <a href="#" class="group block aspect-square rounded-xl overflow-hidden">
        <img src="https://picsum.photos/seed/work3/400/400" alt="Work" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
      </a>
      <a href="#" class="group block aspect-square rounded-xl overflow-hidden">
        <img src="https://picsum.photos/seed/work4/400/400" alt="Work" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
      </a>
      <a href="#" class="group block aspect-square rounded-xl overflow-hidden md:col-span-2 md:row-span-2">
        <img src="https://picsum.photos/seed/work5/800/800" alt="Work" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
      </a>
      <a href="#" class="group block aspect-square rounded-xl overflow-hidden">
        <img src="https://picsum.photos/seed/work6/400/400" alt="Work" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
      </a>
      <a href="#" class="group block aspect-square rounded-xl overflow-hidden">
        <img src="https://picsum.photos/seed/work7/400/400" alt="Work" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
      </a>
    </div>
  </div>
</section>`,
  },
]

// FOOTER with multi-page links
const FOOTER_COMPONENTS: ComponentTemplate[] = [
  {
    id: 'footer-multipage',
    name: 'Multi-Page Footer',
    category: 'footer',
    description: 'Footer with site map links',
    preview: 'Full site navigation footer',
    html: `<footer class="bg-slate-900 pt-16 pb-8">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
      <div class="lg:col-span-2">
        <a href="index.html" class="text-2xl font-bold text-white">Brand</a>
        <p class="text-slate-400 mt-4 max-w-sm">Building amazing digital experiences since 2020. We help businesses grow with innovative solutions.</p>
        <div class="flex gap-4 mt-6">
          <a href="#" class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.26.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Pages</h4>
        <ul class="space-y-3">
          <li><a href="index.html" class="text-slate-400 hover:text-white transition">Home</a></li>
          <li><a href="about.html" class="text-slate-400 hover:text-white transition">About Us</a></li>
          <li><a href="services.html" class="text-slate-400 hover:text-white transition">Services</a></li>
          <li><a href="portfolio.html" class="text-slate-400 hover:text-white transition">Portfolio</a></li>
          <li><a href="blog.html" class="text-slate-400 hover:text-white transition">Blog</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Services</h4>
        <ul class="space-y-3">
          <li><a href="services-web.html" class="text-slate-400 hover:text-white transition">Web Design</a></li>
          <li><a href="services-mobile.html" class="text-slate-400 hover:text-white transition">Mobile Apps</a></li>
          <li><a href="services-branding.html" class="text-slate-400 hover:text-white transition">Branding</a></li>
          <li><a href="services-marketing.html" class="text-slate-400 hover:text-white transition">Marketing</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Support</h4>
        <ul class="space-y-3">
          <li><a href="contact.html" class="text-slate-400 hover:text-white transition">Contact</a></li>
          <li><a href="faq.html" class="text-slate-400 hover:text-white transition">FAQ</a></li>
          <li><a href="privacy.html" class="text-slate-400 hover:text-white transition">Privacy Policy</a></li>
          <li><a href="terms.html" class="text-slate-400 hover:text-white transition">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div class="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-slate-500">&copy; 2025 Brand. All rights reserved.</p>
      <div class="flex gap-6">
        <a href="privacy.html" class="text-slate-500 hover:text-white transition text-sm">Privacy</a>
        <a href="terms.html" class="text-slate-500 hover:text-white transition text-sm">Terms</a>
        <a href="cookies.html" class="text-slate-500 hover:text-white transition text-sm">Cookies</a>
      </div>
    </div>
  </div>
</footer>`,
  },
]

// Combine all components into final export
// Note: COMPONENTS is already defined above with base components,
// we extend it with new media/navigation components
COMPONENTS.push(
  ...VIDEO_COMPONENTS,
  ...AUDIO_COMPONENTS,
  ...NAVIGATION_COMPONENTS,
  ...MEDIA_COMPONENTS,
  ...FOOTER_COMPONENTS,
)

export function getComponentsByCategory(category: string): ComponentTemplate[] {
  return COMPONENTS.filter(c => c.category === category)
}

export function getComponentById(id: string): ComponentTemplate | undefined {
  return COMPONENTS.find(c => c.id === id)
}
