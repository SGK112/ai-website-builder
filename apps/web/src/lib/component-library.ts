// Pre-built components users can add to their websites

export interface ComponentTemplate {
  id: string
  name: string
  category: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'contact' | 'footer' | 'navigation' | 'gallery' | 'stats' | 'team' | 'faq'
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
  { id: 'gallery', name: 'Gallery', icon: 'image' },
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

export function getComponentsByCategory(category: string): ComponentTemplate[] {
  return COMPONENTS.filter(c => c.category === category)
}

export function getComponentById(id: string): ComponentTemplate | undefined {
  return COMPONENTS.find(c => c.id === id)
}
