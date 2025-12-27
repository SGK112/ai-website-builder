// Starter Templates - Industry-specific full page templates
// Built from registered components for easy customization

export interface StarterTemplate {
  id: string
  name: string
  category: 'saas' | 'agency' | 'restaurant' | 'ecommerce' | 'portfolio' | 'realestate' | 'fitness' | 'medical' | 'legal' | 'construction'
  description: string
  thumbnail: string
  tags: string[]
  sections: string[] // Component names to include
  defaultValues: Record<string, Record<string, any>> // Component name -> input values
  html: string // Full page HTML
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // =============================================================================
  // SAAS / TECH STARTUP
  // =============================================================================
  {
    id: 'saas-modern',
    name: 'Modern SaaS',
    category: 'saas',
    description: 'Clean, modern landing page for software products',
    thumbnail: '/templates/saas-modern.png',
    tags: ['tech', 'startup', 'software', 'app'],
    sections: ['navbar-simple', 'hero-gradient', 'logo-cloud', 'features-grid', 'features-alternating', 'pricing-cards', 'testimonials-cards', 'faq-accordion', 'cta-centered', 'footer-columns'],
    defaultValues: {
      'hero-gradient': {
        headline: 'Ship Products Faster',
        subheadline: 'The all-in-one platform for modern development teams. Build, deploy, and scale with confidence.',
        gradientFrom: '#6366f1',
        gradientTo: '#8b5cf6',
      },
    },
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Modern SaaS Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-white">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="text-xl font-bold text-slate-900">{{projectName}}</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-slate-600 hover:text-slate-900 transition">Features</a>
        <a href="#pricing" class="text-slate-600 hover:text-slate-900 transition">Pricing</a>
        <a href="#testimonials" class="text-slate-600 hover:text-slate-900 transition">Testimonials</a>
        <a href="#faq" class="text-slate-600 hover:text-slate-900 transition">FAQ</a>
      </div>
      <div class="flex items-center gap-4">
        <a href="#" class="text-slate-600 hover:text-slate-900">Sign In</a>
        <a href="#" class="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">Get Started</a>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950 pt-20">
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
    <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 40px 40px;"></div>
    <div class="relative z-10 max-w-5xl mx-auto px-6 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
        <span class="text-indigo-400 text-sm font-medium">New: AI-Powered Features</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
        Ship Products <br><span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">10x Faster</span>
      </h1>
      <p class="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">
        The all-in-one platform for modern development teams. Build, deploy, and scale with confidence.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#" class="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-indigo-500/25">
          Start Free Trial
        </a>
        <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
          Watch Demo
        </a>
      </div>
      <p class="mt-6 text-sm text-slate-500">No credit card required. 14-day free trial.</p>
    </div>
  </section>

  <!-- Logo Cloud -->
  <section class="py-16 bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-6">
      <p class="text-center text-slate-500 mb-10">Trusted by innovative companies worldwide</p>
      <div class="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        <span class="text-2xl font-bold text-slate-300">Stripe</span>
        <span class="text-2xl font-bold text-slate-300">Vercel</span>
        <span class="text-2xl font-bold text-slate-300">Linear</span>
        <span class="text-2xl font-bold text-slate-300">Notion</span>
        <span class="text-2xl font-bold text-slate-300">Figma</span>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section id="features" class="py-24 bg-slate-50">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-slate-900 mb-4">Everything you need to scale</h2>
        <p class="text-xl text-slate-600 max-w-2xl mx-auto">Powerful features to help you build, launch, and grow your product faster than ever.</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 class="text-xl font-semibold text-slate-900 mb-3">Lightning Fast</h3>
          <p class="text-slate-600">Optimized for speed with edge computing and smart caching. Your users get instant responses.</p>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <h3 class="text-xl font-semibold text-slate-900 mb-3">Enterprise Security</h3>
          <p class="text-slate-600">SOC 2 compliant with end-to-end encryption. Your data is always safe and secure.</p>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"/></svg>
          </div>
          <h3 class="text-xl font-semibold text-slate-900 mb-3">Easy Integration</h3>
          <p class="text-slate-600">Connect with your favorite tools in minutes. REST API, webhooks, and native integrations.</p>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <h3 class="text-xl font-semibold text-slate-900 mb-3">AI-Powered</h3>
          <p class="text-slate-600">Smart suggestions and automation powered by cutting-edge AI to boost your productivity.</p>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <h3 class="text-xl font-semibold text-slate-900 mb-3">Team Collaboration</h3>
          <p class="text-slate-600">Real-time collaboration with your team. Comments, mentions, and activity tracking.</p>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <h3 class="text-xl font-semibold text-slate-900 mb-3">Advanced Analytics</h3>
          <p class="text-slate-600">Deep insights into your business with customizable dashboards and reports.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing" class="py-24 bg-white">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
        <p class="text-xl text-slate-600">Choose the plan that works for you</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div class="p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <h3 class="text-lg font-semibold text-slate-600 mb-2">Starter</h3>
          <div class="flex items-baseline gap-1 mb-6"><span class="text-4xl font-bold text-slate-900">$19</span><span class="text-slate-500">/month</span></div>
          <ul class="space-y-3 mb-8 text-slate-600">
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Up to 5 team members</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>10 GB storage</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Basic analytics</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Email support</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center font-semibold rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition">Get Started</a>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-xl border-2 border-indigo-600 relative">
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full">Most Popular</div>
          <h3 class="text-lg font-semibold text-slate-600 mb-2">Professional</h3>
          <div class="flex items-baseline gap-1 mb-6"><span class="text-4xl font-bold text-slate-900">$49</span><span class="text-slate-500">/month</span></div>
          <ul class="space-y-3 mb-8 text-slate-600">
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Up to 20 team members</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>100 GB storage</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Advanced analytics</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Priority support</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Custom integrations</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition">Get Started</a>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <h3 class="text-lg font-semibold text-slate-600 mb-2">Enterprise</h3>
          <div class="flex items-baseline gap-1 mb-6"><span class="text-4xl font-bold text-slate-900">$99</span><span class="text-slate-500">/month</span></div>
          <ul class="space-y-3 mb-8 text-slate-600">
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited team members</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited storage</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Custom analytics</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>24/7 phone support</li>
            <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Dedicated account manager</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center font-semibold rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition">Contact Sales</a>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="py-24 bg-slate-50">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-slate-900 mb-4">Loved by thousands</h2>
        <p class="text-xl text-slate-600">See what our customers have to say</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 bg-white rounded-2xl shadow-sm">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-700 mb-6">"This platform has completely transformed how we work. The results speak for themselves."</p>
          <div class="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Sarah Johnson" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <p class="font-semibold text-slate-900">Sarah Johnson</p>
              <p class="text-sm text-slate-500">CEO, TechCorp</p>
            </div>
          </div>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-sm">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-700 mb-6">"The best investment we made this year. Our productivity has increased by 40%."</p>
          <div class="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" alt="Michael Chen" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <p class="font-semibold text-slate-900">Michael Chen</p>
              <p class="text-sm text-slate-500">CTO, StartupXYZ</p>
            </div>
          </div>
        </div>
        <div class="p-8 bg-white rounded-2xl shadow-sm">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-700 mb-6">"Incredible support team and a product that actually delivers on its promises."</p>
          <div class="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" alt="Emily Davis" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <p class="font-semibold text-slate-900">Emily Davis</p>
              <p class="text-sm text-slate-500">VP Marketing, GrowthCo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" class="py-24 bg-white">
    <div class="max-w-3xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
        <p class="text-xl text-slate-600">Find answers to common questions</p>
      </div>
      <div class="space-y-4">
        <details class="group bg-slate-50 rounded-xl" open>
          <summary class="flex items-center justify-between p-6 cursor-pointer font-semibold text-slate-900">How do I get started?<svg class="w-5 h-5 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></summary>
          <p class="px-6 pb-6 text-slate-600">Getting started is easy! Simply sign up for a free account and follow our quick setup wizard. You'll be up and running in minutes.</p>
        </details>
        <details class="group bg-slate-50 rounded-xl">
          <summary class="flex items-center justify-between p-6 cursor-pointer font-semibold text-slate-900">What payment methods do you accept?<svg class="w-5 h-5 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></summary>
          <p class="px-6 pb-6 text-slate-600">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
        </details>
        <details class="group bg-slate-50 rounded-xl">
          <summary class="flex items-center justify-between p-6 cursor-pointer font-semibold text-slate-900">Can I cancel anytime?<svg class="w-5 h-5 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></summary>
          <p class="px-6 pb-6 text-slate-600">Yes, you can cancel your subscription at any time. No questions asked, no hidden fees.</p>
        </details>
        <details class="group bg-slate-50 rounded-xl">
          <summary class="flex items-center justify-between p-6 cursor-pointer font-semibold text-slate-900">Do you offer refunds?<svg class="w-5 h-5 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></summary>
          <p class="px-6 pb-6 text-slate-600">We offer a 30-day money-back guarantee on all plans. If you're not satisfied, just let us know.</p>
        </details>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-24 bg-indigo-600">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
      <p class="text-xl text-indigo-100 mb-10">Join thousands of satisfied customers today.</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#" class="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition">Start Free Trial</a>
        <a href="#" class="px-8 py-4 bg-indigo-500 text-white font-semibold rounded-xl border border-indigo-400 hover:bg-indigo-400 transition">Contact Sales</a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-slate-900 text-white pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <h3 class="text-xl font-bold mb-4">{{projectName}}</h3>
          <p class="text-slate-400">Building the future of development.</p>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Product</h4>
          <ul class="space-y-2 text-slate-400">
            <li><a href="#" class="hover:text-white transition">Features</a></li>
            <li><a href="#" class="hover:text-white transition">Pricing</a></li>
            <li><a href="#" class="hover:text-white transition">Integrations</a></li>
            <li><a href="#" class="hover:text-white transition">Changelog</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Company</h4>
          <ul class="space-y-2 text-slate-400">
            <li><a href="#" class="hover:text-white transition">About</a></li>
            <li><a href="#" class="hover:text-white transition">Blog</a></li>
            <li><a href="#" class="hover:text-white transition">Careers</a></li>
            <li><a href="#" class="hover:text-white transition">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Legal</h4>
          <ul class="space-y-2 text-slate-400">
            <li><a href="#" class="hover:text-white transition">Privacy</a></li>
            <li><a href="#" class="hover:text-white transition">Terms</a></li>
            <li><a href="#" class="hover:text-white transition">Security</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
        <p>&copy; 2024 {{projectName}}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },

  // =============================================================================
  // RESTAURANT
  // =============================================================================
  {
    id: 'restaurant-elegant',
    name: 'Elegant Restaurant',
    category: 'restaurant',
    description: 'Sophisticated restaurant website with menu and reservations',
    thumbnail: '/templates/restaurant.png',
    tags: ['food', 'dining', 'cafe', 'bistro'],
    sections: ['navbar-simple', 'hero-split', 'stats-bar', 'gallery-masonry', 'testimonials-cards', 'contact-form', 'footer-columns'],
    defaultValues: {},
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Fine Dining Restaurant</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    .font-serif { font-family: 'Playfair Display', serif; }
    .font-sans { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-stone-50 font-sans">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="text-2xl font-serif text-amber-400">{{projectName}}</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#about" class="text-stone-300 hover:text-white transition">About</a>
        <a href="#menu" class="text-stone-300 hover:text-white transition">Menu</a>
        <a href="#gallery" class="text-stone-300 hover:text-white transition">Gallery</a>
        <a href="#contact" class="text-stone-300 hover:text-white transition">Contact</a>
      </div>
      <a href="#reservations" class="px-6 py-2 bg-amber-600 text-white font-medium rounded hover:bg-amber-700 transition">Reserve a Table</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="relative min-h-screen flex items-center bg-stone-900">
    <div class="absolute inset-0">
      <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920" alt="Restaurant" class="w-full h-full object-cover opacity-40" />
    </div>
    <div class="relative z-10 max-w-7xl mx-auto px-6 py-32">
      <div class="max-w-2xl">
        <p class="text-amber-400 font-medium tracking-widest uppercase mb-4">Welcome to</p>
        <h1 class="text-6xl md:text-8xl font-serif text-white mb-6">{{projectName}}</h1>
        <p class="text-xl text-stone-300 mb-10">Experience exquisite cuisine crafted with passion, using the finest locally-sourced ingredients.</p>
        <div class="flex flex-wrap gap-4">
          <a href="#menu" class="px-8 py-4 bg-amber-600 text-white font-medium rounded hover:bg-amber-700 transition">View Menu</a>
          <a href="#reservations" class="px-8 py-4 border border-white/30 text-white font-medium rounded hover:bg-white/10 transition">Make Reservation</a>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section class="py-16 bg-stone-900 border-y border-stone-800">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <p class="text-4xl font-serif text-amber-400 mb-2">25+</p>
          <p class="text-stone-400">Years of Excellence</p>
        </div>
        <div>
          <p class="text-4xl font-serif text-amber-400 mb-2">50+</p>
          <p class="text-stone-400">Signature Dishes</p>
        </div>
        <div>
          <p class="text-4xl font-serif text-amber-400 mb-2">15</p>
          <p class="text-stone-400">Expert Chefs</p>
        </div>
        <div>
          <p class="text-4xl font-serif text-amber-400 mb-2">4.9</p>
          <p class="text-stone-400">Star Rating</p>
        </div>
      </div>
    </div>
  </section>

  <!-- About -->
  <section id="about" class="py-24">
    <div class="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <p class="text-amber-600 font-medium tracking-widest uppercase mb-4">Our Story</p>
        <h2 class="text-4xl font-serif text-stone-900 mb-6">A Legacy of Culinary Excellence</h2>
        <p class="text-lg text-stone-600 mb-6">Since 1998, we have been dedicated to creating unforgettable dining experiences. Our kitchen combines time-honored techniques with innovative approaches to deliver dishes that delight and inspire.</p>
        <p class="text-lg text-stone-600 mb-8">Every ingredient is carefully selected from local farms and sustainable sources, ensuring the freshest flavors in every bite.</p>
        <div class="flex items-center gap-4">
          <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100" alt="Chef" class="w-16 h-16 rounded-full object-cover" />
          <div>
            <p class="font-semibold text-stone-900">Chef Marcus Williams</p>
            <p class="text-stone-600">Executive Chef & Founder</p>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400" alt="Dish 1" class="rounded-lg object-cover h-64 w-full" />
        <img src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400" alt="Dish 2" class="rounded-lg object-cover h-64 w-full mt-8" />
        <img src="https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400" alt="Dish 3" class="rounded-lg object-cover h-64 w-full" />
        <img src="https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400" alt="Dish 4" class="rounded-lg object-cover h-64 w-full mt-8" />
      </div>
    </div>
  </section>

  <!-- Menu Preview -->
  <section id="menu" class="py-24 bg-stone-900">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-amber-400 font-medium tracking-widest uppercase mb-4">Our Menu</p>
        <h2 class="text-4xl font-serif text-white mb-4">Culinary Creations</h2>
        <p class="text-xl text-stone-400 max-w-2xl mx-auto">Discover our carefully curated selection of dishes</p>
      </div>
      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div class="border-b border-stone-700 pb-6">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl text-white">Pan-Seared Salmon</h3>
            <span class="text-amber-400 font-medium">$38</span>
          </div>
          <p class="text-stone-400">Atlantic salmon with lemon butter, asparagus, and roasted potatoes</p>
        </div>
        <div class="border-b border-stone-700 pb-6">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl text-white">Filet Mignon</h3>
            <span class="text-amber-400 font-medium">$52</span>
          </div>
          <p class="text-stone-400">8oz grass-fed beef, truffle mash, seasonal vegetables</p>
        </div>
        <div class="border-b border-stone-700 pb-6">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl text-white">Lobster Risotto</h3>
            <span class="text-amber-400 font-medium">$45</span>
          </div>
          <p class="text-stone-400">Maine lobster, arborio rice, parmesan, white wine reduction</p>
        </div>
        <div class="border-b border-stone-700 pb-6">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl text-white">Duck Confit</h3>
            <span class="text-amber-400 font-medium">$42</span>
          </div>
          <p class="text-stone-400">Slow-cooked duck leg, cherry gastrique, roasted root vegetables</p>
        </div>
      </div>
      <div class="text-center mt-12">
        <a href="#" class="inline-flex px-8 py-4 bg-amber-600 text-white font-medium rounded hover:bg-amber-700 transition">View Full Menu</a>
      </div>
    </div>
  </section>

  <!-- Gallery -->
  <section id="gallery" class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-amber-600 font-medium tracking-widest uppercase mb-4">Gallery</p>
        <h2 class="text-4xl font-serif text-stone-900 mb-4">A Feast for the Eyes</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400" alt="Gallery" class="rounded-lg object-cover aspect-square" />
        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400" alt="Gallery" class="rounded-lg object-cover aspect-square" />
        <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400" alt="Gallery" class="rounded-lg object-cover aspect-square" />
        <img src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400" alt="Gallery" class="rounded-lg object-cover aspect-square" />
        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=400" alt="Gallery" class="rounded-lg object-cover aspect-square" />
        <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400" alt="Gallery" class="rounded-lg object-cover aspect-square" />
        <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400" alt="Gallery" class="rounded-lg object-cover aspect-square" />
        <img src="https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400" alt="Gallery" class="rounded-lg object-cover aspect-square" />
      </div>
    </div>
  </section>

  <!-- Reservations -->
  <section id="reservations" class="py-24 bg-stone-100">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid lg:grid-cols-2 gap-16">
        <div>
          <p class="text-amber-600 font-medium tracking-widest uppercase mb-4">Reservations</p>
          <h2 class="text-4xl font-serif text-stone-900 mb-6">Book Your Table</h2>
          <p class="text-lg text-stone-600 mb-8">For special occasions and large parties, please call us directly or use the form to request a reservation.</p>
          <div class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p class="font-medium text-stone-900">Opening Hours</p>
                <p class="text-stone-600">Tue-Sun: 5:00 PM - 11:00 PM</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </div>
              <div>
                <p class="font-medium text-stone-900">Phone</p>
                <p class="text-stone-600">+1 (555) 123-4567</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div>
                <p class="font-medium text-stone-900">Location</p>
                <p class="text-stone-600">123 Gourmet Avenue, Fine City</p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-sm">
          <form class="space-y-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-stone-700 mb-2">Name</label>
                <input type="text" class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition" placeholder="Your name" />
              </div>
              <div>
                <label class="block text-sm font-medium text-stone-700 mb-2">Phone</label>
                <input type="tel" class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition" placeholder="Your phone" />
              </div>
            </div>
            <div class="grid sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-stone-700 mb-2">Date</label>
                <input type="date" class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-stone-700 mb-2">Time</label>
                <select class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition">
                  <option>5:00 PM</option>
                  <option>6:00 PM</option>
                  <option>7:00 PM</option>
                  <option>8:00 PM</option>
                  <option>9:00 PM</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">Number of Guests</label>
              <select class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition">
                <option>2 guests</option>
                <option>3 guests</option>
                <option>4 guests</option>
                <option>5 guests</option>
                <option>6+ guests</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">Special Requests</label>
              <textarea rows="3" class="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none" placeholder="Any dietary requirements or special occasions?"></textarea>
            </div>
            <button type="submit" class="w-full py-4 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition">Request Reservation</button>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-stone-900 text-white py-12">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-center md:text-left">
          <h3 class="text-2xl font-serif text-amber-400 mb-2">{{projectName}}</h3>
          <p class="text-stone-400">Fine Dining Since 1998</p>
        </div>
        <div class="flex gap-6 text-stone-400">
          <a href="#" class="hover:text-white transition">Instagram</a>
          <a href="#" class="hover:text-white transition">Facebook</a>
          <a href="#" class="hover:text-white transition">TripAdvisor</a>
        </div>
      </div>
      <div class="border-t border-stone-800 mt-8 pt-8 text-center text-stone-500 text-sm">
        <p>&copy; 2024 {{projectName}}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },

  // =============================================================================
  // AGENCY / PORTFOLIO
  // =============================================================================
  {
    id: 'agency-creative',
    name: 'Creative Agency',
    category: 'agency',
    description: 'Bold, creative agency portfolio',
    thumbnail: '/templates/agency.png',
    tags: ['creative', 'design', 'marketing', 'studio'],
    sections: ['hero-gradient', 'features-alternating', 'gallery-masonry', 'testimonials-cards', 'team-grid', 'cta-centered', 'footer-columns'],
    defaultValues: {},
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Creative Agency</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Space Grotesk', sans-serif; }</style>
</head>
<body class="bg-black text-white">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg">
    <div class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="#" class="text-2xl font-bold">{{projectName}}</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#work" class="text-gray-400 hover:text-white transition">Work</a>
        <a href="#about" class="text-gray-400 hover:text-white transition">About</a>
        <a href="#services" class="text-gray-400 hover:text-white transition">Services</a>
        <a href="#contact" class="text-gray-400 hover:text-white transition">Contact</a>
      </div>
      <a href="#contact" class="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition">Let's Talk</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="min-h-screen flex items-center pt-24">
    <div class="max-w-7xl mx-auto px-6 py-20">
      <h1 class="text-6xl md:text-8xl lg:text-9xl font-bold leading-none mb-8">
        We create<br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500">digital</span><br />
        experiences
      </h1>
      <p class="text-xl md:text-2xl text-gray-400 max-w-2xl mb-12">
        A creative agency specializing in brand strategy, digital design, and development for forward-thinking companies.
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="#work" class="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition">View Our Work</a>
        <a href="#contact" class="px-8 py-4 border border-white/30 font-semibold rounded-full hover:bg-white/10 transition">Start a Project</a>
      </div>
    </div>
  </section>

  <!-- Work -->
  <section id="work" class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex items-end justify-between mb-16">
        <div>
          <p class="text-pink-500 font-medium mb-4">Selected Work</p>
          <h2 class="text-4xl md:text-5xl font-bold">Our Latest Projects</h2>
        </div>
        <a href="#" class="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition">
          View All <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>
      <div class="grid md:grid-cols-2 gap-8">
        <a href="#" class="group relative overflow-hidden rounded-2xl">
          <img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800" alt="Project 1" class="w-full aspect-[4/3] object-cover group-hover:scale-105 transition duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
            <div>
              <p class="text-pink-400 text-sm mb-2">Brand Identity</p>
              <h3 class="text-2xl font-bold">Luxe Fashion</h3>
            </div>
          </div>
        </a>
        <a href="#" class="group relative overflow-hidden rounded-2xl">
          <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800" alt="Project 2" class="w-full aspect-[4/3] object-cover group-hover:scale-105 transition duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
            <div>
              <p class="text-purple-400 text-sm mb-2">Web Design</p>
              <h3 class="text-2xl font-bold">TechFlow App</h3>
            </div>
          </div>
        </a>
        <a href="#" class="group relative overflow-hidden rounded-2xl">
          <img src="https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800" alt="Project 3" class="w-full aspect-[4/3] object-cover group-hover:scale-105 transition duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
            <div>
              <p class="text-orange-400 text-sm mb-2">Digital Campaign</p>
              <h3 class="text-2xl font-bold">Sunset Records</h3>
            </div>
          </div>
        </a>
        <a href="#" class="group relative overflow-hidden rounded-2xl">
          <img src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800" alt="Project 4" class="w-full aspect-[4/3] object-cover group-hover:scale-105 transition duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
            <div>
              <p class="text-cyan-400 text-sm mb-2">Product Design</p>
              <h3 class="text-2xl font-bold">Minimal Home</h3>
            </div>
          </div>
        </a>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section id="services" class="py-24 bg-gradient-to-b from-black to-gray-900">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-pink-500 font-medium mb-4">What We Do</p>
        <h2 class="text-4xl md:text-5xl font-bold mb-6">Our Services</h2>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">We offer a full range of creative services to help your brand stand out in the digital landscape.</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 border border-gray-800 rounded-2xl hover:border-pink-500/50 transition group">
          <div class="text-5xl mb-6">01</div>
          <h3 class="text-2xl font-bold mb-4">Brand Strategy</h3>
          <p class="text-gray-400">We develop comprehensive brand strategies that define your unique position in the market and connect with your audience.</p>
        </div>
        <div class="p-8 border border-gray-800 rounded-2xl hover:border-purple-500/50 transition group">
          <div class="text-5xl mb-6">02</div>
          <h3 class="text-2xl font-bold mb-4">Digital Design</h3>
          <p class="text-gray-400">From websites to apps, we create stunning digital experiences that engage users and drive results.</p>
        </div>
        <div class="p-8 border border-gray-800 rounded-2xl hover:border-orange-500/50 transition group">
          <div class="text-5xl mb-6">03</div>
          <h3 class="text-2xl font-bold mb-4">Development</h3>
          <p class="text-gray-400">We build fast, scalable, and secure digital products using the latest technologies and best practices.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Team -->
  <section id="about" class="py-24 bg-gray-900">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-pink-500 font-medium mb-4">Our Team</p>
        <h2 class="text-4xl md:text-5xl font-bold">Meet the Creators</h2>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="group">
          <div class="relative overflow-hidden rounded-2xl mb-4">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" alt="Team" class="w-full aspect-square object-cover group-hover:scale-105 transition duration-500" />
          </div>
          <h3 class="text-xl font-bold">James Wilson</h3>
          <p class="text-gray-400">Creative Director</p>
        </div>
        <div class="group">
          <div class="relative overflow-hidden rounded-2xl mb-4">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" alt="Team" class="w-full aspect-square object-cover group-hover:scale-105 transition duration-500" />
          </div>
          <h3 class="text-xl font-bold">Sarah Chen</h3>
          <p class="text-gray-400">Lead Designer</p>
        </div>
        <div class="group">
          <div class="relative overflow-hidden rounded-2xl mb-4">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" alt="Team" class="w-full aspect-square object-cover group-hover:scale-105 transition duration-500" />
          </div>
          <h3 class="text-xl font-bold">Michael Park</h3>
          <p class="text-gray-400">Tech Lead</p>
        </div>
        <div class="group">
          <div class="relative overflow-hidden rounded-2xl mb-4">
            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400" alt="Team" class="w-full aspect-square object-cover group-hover:scale-105 transition duration-500" />
          </div>
          <h3 class="text-xl font-bold">Emma Davis</h3>
          <p class="text-gray-400">Strategy Director</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="py-24 bg-gradient-to-r from-purple-900 via-pink-900 to-orange-900">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-4xl md:text-6xl font-bold mb-6">Have a project in mind?</h2>
      <p class="text-xl text-gray-300 mb-12">Let's work together to create something amazing.</p>
      <a href="mailto:hello@agency.com" class="inline-flex px-12 py-5 bg-white text-black text-xl font-bold rounded-full hover:bg-gray-100 transition">Get in Touch</a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-black py-12 border-t border-gray-800">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <p class="text-2xl font-bold">{{projectName}}</p>
        <div class="flex gap-6">
          <a href="#" class="text-gray-400 hover:text-white transition">Instagram</a>
          <a href="#" class="text-gray-400 hover:text-white transition">Behance</a>
          <a href="#" class="text-gray-400 hover:text-white transition">Dribbble</a>
          <a href="#" class="text-gray-400 hover:text-white transition">LinkedIn</a>
        </div>
      </div>
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 {{projectName}}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },

  // =============================================================================
  // PREMIUM ECOMMERCE - Based on Luxe Coach Boutique
  // =============================================================================
  {
    id: 'ecommerce-luxury',
    name: 'Luxury E-Commerce',
    category: 'ecommerce',
    description: 'Premium fashion boutique with elegant product showcases',
    thumbnail: '/templates/ecommerce-luxury.png',
    tags: ['fashion', 'boutique', 'luxury', 'store', 'shop', 'products'],
    sections: ['announcement-bar', 'navbar-ecommerce', 'hero-carousel', 'featured-products', 'categories-grid', 'testimonials', 'newsletter', 'footer-full'],
    defaultValues: {},
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Luxury Boutique</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    .font-serif { font-family: 'Cormorant Garamond', serif; }
    .font-sans { font-family: 'Inter', sans-serif; }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes kenBurns { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
    .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); background-size: 200% 100%; animation: shimmer 3s infinite; }
    .ken-burns { animation: kenBurns 8s ease-out forwards; }
  </style>
</head>
<body class="bg-white font-sans text-gray-900">
  <!-- Announcement Bar -->
  <div class="bg-gray-900 text-white py-2.5 text-center text-sm relative overflow-hidden">
    <div class="absolute inset-0 shimmer"></div>
    <p class="relative z-10">Free Shipping on Orders Over $150 | <a href="#" class="underline hover:no-underline">Shop Now</a></p>
  </div>

  <!-- Navigation -->
  <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex items-center justify-between h-20">
        <!-- Left Nav -->
        <div class="hidden lg:flex items-center gap-8">
          <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition">New Arrivals</a>
          <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Collections</a>
          <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Handbags</a>
        </div>

        <!-- Logo -->
        <a href="#" class="text-3xl font-serif font-semibold tracking-wide">{{projectName}}</a>

        <!-- Right Nav -->
        <div class="flex items-center gap-6">
          <button class="hidden md:block text-gray-600 hover:text-gray-900 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </button>
          <button class="text-gray-600 hover:text-gray-900 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </button>
          <button class="text-gray-600 hover:text-gray-900 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </button>
          <button class="relative text-gray-600 hover:text-gray-900 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            <span class="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center">2</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Carousel -->
  <section class="relative h-[85vh] overflow-hidden bg-gray-100">
    <div class="absolute inset-0">
      <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920" alt="Luxury Collection" class="w-full h-full object-cover ken-burns" />
      <div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
    </div>

    <!-- Decorative Circles -->
    <div class="absolute top-20 right-20 w-64 h-64 border border-white/20 rounded-full hidden lg:block"></div>
    <div class="absolute top-32 right-32 w-48 h-48 border border-white/10 rounded-full hidden lg:block"></div>

    <!-- Content -->
    <div class="relative z-10 h-full flex items-center">
      <div class="max-w-7xl mx-auto px-6 w-full">
        <div class="max-w-xl">
          <p class="text-white/80 text-sm tracking-[0.3em] uppercase mb-4">New Collection 2024</p>
          <h1 class="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">Timeless Elegance</h1>
          <p class="text-lg text-white/80 mb-8 leading-relaxed">Discover our curated selection of luxury handbags and accessories, crafted for the modern sophisticate.</p>
          <div class="flex flex-wrap gap-4">
            <a href="#" class="px-8 py-4 bg-white text-gray-900 font-medium hover:bg-gray-100 transition">Shop Collection</a>
            <a href="#" class="px-8 py-4 border border-white/50 text-white font-medium hover:bg-white/10 transition">View Lookbook</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide Indicator -->
    <div class="absolute bottom-8 left-6 z-10 flex items-center gap-4 text-white">
      <span class="text-2xl font-serif">01</span>
      <div class="w-16 h-0.5 bg-white/30"><div class="w-1/3 h-full bg-white"></div></div>
      <span class="text-white/50">03</span>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 right-6 z-10 text-white/60 text-sm tracking-wider flex items-center gap-3">
      <span>Scroll</span>
      <svg class="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
    </div>
  </section>

  <!-- Featured Products -->
  <section class="py-20">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex items-end justify-between mb-12">
        <div>
          <p class="text-sm tracking-[0.2em] uppercase text-gray-500 mb-2">Curated Selection</p>
          <h2 class="text-4xl font-serif">Featured Products</h2>
        </div>
        <a href="#" class="hidden md:flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">
          View All <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Product 1 -->
        <div class="group">
          <div class="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
            <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600" alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
            <button class="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            <button class="absolute bottom-4 left-4 right-4 py-3 bg-white text-sm font-medium opacity-0 group-hover:opacity-100 transition hover:bg-gray-100">Quick View</button>
          </div>
          <div class="flex gap-2 mb-2">
            <span class="w-3 h-3 rounded-full bg-amber-900"></span>
            <span class="w-3 h-3 rounded-full bg-gray-900"></span>
            <span class="w-3 h-3 rounded-full bg-gray-300"></span>
          </div>
          <h3 class="font-medium mb-1">Classic Leather Tote</h3>
          <p class="text-gray-600">$385</p>
        </div>

        <!-- Product 2 -->
        <div class="group">
          <div class="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
            <img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600" alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
            <span class="absolute top-4 left-4 px-3 py-1 bg-gray-900 text-white text-xs">New</span>
            <button class="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            <button class="absolute bottom-4 left-4 right-4 py-3 bg-white text-sm font-medium opacity-0 group-hover:opacity-100 transition hover:bg-gray-100">Quick View</button>
          </div>
          <div class="flex gap-2 mb-2">
            <span class="w-3 h-3 rounded-full bg-amber-700"></span>
            <span class="w-3 h-3 rounded-full bg-rose-900"></span>
          </div>
          <h3 class="font-medium mb-1">Structured Crossbody</h3>
          <p class="text-gray-600">$295</p>
        </div>

        <!-- Product 3 -->
        <div class="group">
          <div class="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
            <img src="https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600" alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
            <button class="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            <button class="absolute bottom-4 left-4 right-4 py-3 bg-white text-sm font-medium opacity-0 group-hover:opacity-100 transition hover:bg-gray-100">Quick View</button>
          </div>
          <h3 class="font-medium mb-1">Mini Bucket Bag</h3>
          <p class="text-gray-600"><span class="line-through text-gray-400 mr-2">$250</span>$175</p>
        </div>

        <!-- Product 4 -->
        <div class="group">
          <div class="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
            <img src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600" alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
            <span class="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white text-xs">Sale</span>
            <button class="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </button>
            <button class="absolute bottom-4 left-4 right-4 py-3 bg-white text-sm font-medium opacity-0 group-hover:opacity-100 transition hover:bg-gray-100">Quick View</button>
          </div>
          <h3 class="font-medium mb-1">Evening Clutch</h3>
          <p class="text-gray-600">$185</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Categories -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-12">
        <p class="text-sm tracking-[0.2em] uppercase text-gray-500 mb-2">Browse By</p>
        <h2 class="text-4xl font-serif">Categories</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <a href="#" class="group relative h-[400px] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600" alt="Handbags" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
          <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h3 class="text-2xl font-serif mb-2">Handbags</h3>
            <span class="text-sm opacity-0 group-hover:opacity-100 transition">Shop Now →</span>
          </div>
        </a>
        <a href="#" class="group relative h-[400px] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600" alt="Accessories" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
          <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h3 class="text-2xl font-serif mb-2">Accessories</h3>
            <span class="text-sm opacity-0 group-hover:opacity-100 transition">Shop Now →</span>
          </div>
        </a>
        <a href="#" class="group relative h-[400px] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600" alt="New Arrivals" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
          <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h3 class="text-2xl font-serif mb-2">New Arrivals</h3>
            <span class="text-sm opacity-0 group-hover:opacity-100 transition">Shop Now →</span>
          </div>
        </a>
      </div>
    </div>
  </section>

  <!-- Newsletter -->
  <section class="py-20 bg-gray-900 text-white">
    <div class="max-w-2xl mx-auto px-6 text-center">
      <h2 class="text-3xl font-serif mb-4">Join Our World</h2>
      <p class="text-gray-400 mb-8">Subscribe to receive exclusive offers, early access to new collections, and styling tips.</p>
      <form class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
        <input type="email" placeholder="Enter your email" class="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-white transition" />
        <button type="submit" class="px-8 py-3 bg-white text-gray-900 font-medium hover:bg-gray-100 transition">Subscribe</button>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-950 text-white pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid md:grid-cols-4 gap-12 mb-12">
        <div>
          <h3 class="text-2xl font-serif mb-6">{{projectName}}</h3>
          <p class="text-gray-400 text-sm leading-relaxed">Curating luxury for the modern woman since 2015. Every piece tells a story of craftsmanship and timeless design.</p>
        </div>
        <div>
          <h4 class="font-medium mb-4">Shop</h4>
          <ul class="space-y-2 text-gray-400 text-sm">
            <li><a href="#" class="hover:text-white transition">New Arrivals</a></li>
            <li><a href="#" class="hover:text-white transition">Handbags</a></li>
            <li><a href="#" class="hover:text-white transition">Accessories</a></li>
            <li><a href="#" class="hover:text-white transition">Sale</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium mb-4">Customer Care</h4>
          <ul class="space-y-2 text-gray-400 text-sm">
            <li><a href="#" class="hover:text-white transition">Contact Us</a></li>
            <li><a href="#" class="hover:text-white transition">Shipping</a></li>
            <li><a href="#" class="hover:text-white transition">Returns</a></li>
            <li><a href="#" class="hover:text-white transition">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium mb-4">Follow Us</h4>
          <div class="flex gap-4">
            <a href="#" class="text-gray-400 hover:text-white transition">Instagram</a>
            <a href="#" class="text-gray-400 hover:text-white transition">Pinterest</a>
          </div>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 {{projectName}}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },

  // =============================================================================
  // SERVICE BUSINESS - Based on REMODELY-PRO
  // =============================================================================
  {
    id: 'service-professional',
    name: 'Professional Services',
    category: 'construction',
    description: 'Service marketplace with trust signals and booking',
    thumbnail: '/templates/service-professional.png',
    tags: ['contractor', 'home services', 'professional', 'booking', 'remodeling', 'plumber', 'electrician'],
    sections: ['navbar-dark', 'hero-image', 'trust-signals', 'services-grid', 'how-it-works', 'testimonials', 'cta', 'footer'],
    defaultValues: {},
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Professional Services</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-950 text-white">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-lg border-b border-gray-800">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{{projectName}}</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#services" class="text-gray-400 hover:text-white transition">Services</a>
        <a href="#how-it-works" class="text-gray-400 hover:text-white transition">How It Works</a>
        <a href="#testimonials" class="text-gray-400 hover:text-white transition">Reviews</a>
        <a href="#contact" class="text-gray-400 hover:text-white transition">Contact</a>
      </div>
      <div class="flex items-center gap-4">
        <a href="#" class="text-gray-400 hover:text-white transition">Login</a>
        <a href="#" class="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition">Get Quote</a>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="relative min-h-screen flex items-center pt-20 overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0">
      <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920" alt="Professional Service" class="w-full h-full object-cover opacity-30" />
      <div class="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/95 to-gray-950/80"></div>
    </div>

    <!-- Gradient Orbs -->
    <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/3 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span class="text-emerald-400 text-sm font-medium">Trusted by 10,000+ Homeowners</span>
        </div>

        <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Quality Home Services<br />
          <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Made Simple</span>
        </h1>

        <p class="text-xl text-gray-400 mb-10 max-w-2xl">
          Connect with verified professionals for all your home improvement needs. From repairs to renovations, we've got you covered.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 mb-12">
          <a href="#" class="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-emerald-500/25 text-center">
            Get Free Quote
          </a>
          <a href="#services" class="px-8 py-4 bg-white/5 backdrop-blur text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition text-center">
            Browse Services
          </a>
        </div>

        <!-- Trust Stats -->
        <div class="flex flex-wrap gap-8">
          <div>
            <p class="text-3xl font-bold text-white">4.9/5</p>
            <p class="text-gray-500">Customer Rating</p>
          </div>
          <div>
            <p class="text-3xl font-bold text-white">50K+</p>
            <p class="text-gray-500">Projects Done</p>
          </div>
          <div>
            <p class="text-3xl font-bold text-white">500+</p>
            <p class="text-gray-500">Pro Partners</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Trust Signals -->
  <section class="py-12 bg-gray-900/50 border-y border-gray-800">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-gray-500">
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span>Licensed & Insured</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Same Day Service</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
          <span>Transparent Pricing</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span>Satisfaction Guaranteed</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section id="services" class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-emerald-400 font-medium mb-4">Our Services</p>
        <h2 class="text-4xl font-bold mb-4">What We Offer</h2>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">Comprehensive home improvement services delivered by vetted professionals</p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="group p-8 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-emerald-500/50 transition-all duration-300">
          <div class="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition">
            <svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Kitchen Remodeling</h3>
          <p class="text-gray-400 mb-4">Transform your kitchen with modern designs, custom cabinets, and premium finishes.</p>
          <a href="#" class="text-emerald-400 font-medium hover:text-emerald-300 transition inline-flex items-center gap-2">
            Learn More <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>

        <div class="group p-8 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
          <div class="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition">
            <svg class="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Bathroom Renovation</h3>
          <p class="text-gray-400 mb-4">Create your dream bathroom with expert plumbing, tiling, and fixture installation.</p>
          <a href="#" class="text-cyan-400 font-medium hover:text-cyan-300 transition inline-flex items-center gap-2">
            Learn More <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>

        <div class="group p-8 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-orange-500/50 transition-all duration-300">
          <div class="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition">
            <svg class="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Electrical Services</h3>
          <p class="text-gray-400 mb-4">Safe and reliable electrical work from licensed electricians for any project size.</p>
          <a href="#" class="text-orange-400 font-medium hover:text-orange-300 transition inline-flex items-center gap-2">
            Learn More <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>

        <div class="group p-8 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all duration-300">
          <div class="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition">
            <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Plumbing</h3>
          <p class="text-gray-400 mb-4">Expert plumbing services for repairs, installations, and emergency fixes 24/7.</p>
          <a href="#" class="text-blue-400 font-medium hover:text-blue-300 transition inline-flex items-center gap-2">
            Learn More <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>

        <div class="group p-8 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-purple-500/50 transition-all duration-300">
          <div class="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition">
            <svg class="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Painting</h3>
          <p class="text-gray-400 mb-4">Professional interior and exterior painting with premium paints and finishes.</p>
          <a href="#" class="text-purple-400 font-medium hover:text-purple-300 transition inline-flex items-center gap-2">
            Learn More <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>

        <div class="group p-8 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-pink-500/50 transition-all duration-300">
          <div class="w-14 h-14 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-500/20 transition">
            <svg class="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Flooring</h3>
          <p class="text-gray-400 mb-4">Hardwood, tile, laminate, and carpet installation by flooring experts.</p>
          <a href="#" class="text-pink-400 font-medium hover:text-pink-300 transition inline-flex items-center gap-2">
            Learn More <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section id="how-it-works" class="py-24 bg-gray-900/30">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-emerald-400 font-medium mb-4">Simple Process</p>
        <h2 class="text-4xl font-bold mb-4">How It Works</h2>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">Get your project done in three easy steps</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <span class="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">1</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">Describe Your Project</h3>
          <p class="text-gray-400">Tell us what you need done. Upload photos, describe the scope, and set your timeline.</p>
        </div>

        <div class="text-center">
          <div class="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
            <span class="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">2</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">Get Matched</h3>
          <p class="text-gray-400">We connect you with vetted, top-rated professionals who specialize in your project type.</p>
        </div>

        <div class="text-center">
          <div class="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
            <span class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">3</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">Enjoy Results</h3>
          <p class="text-gray-400">Sit back as professionals complete your project to the highest standards with our guarantee.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-emerald-400 font-medium mb-4">Testimonials</p>
        <h2 class="text-4xl font-bold mb-4">What Customers Say</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 bg-gray-900/50 border border-gray-800 rounded-2xl">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-gray-300 mb-6">"Absolutely fantastic experience! The team was professional, on time, and the quality of work exceeded our expectations. Our kitchen looks amazing."</p>
          <div class="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Customer" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <p class="font-semibold">Sarah Johnson</p>
              <p class="text-sm text-gray-500">Kitchen Remodel</p>
            </div>
          </div>
        </div>

        <div class="p-8 bg-gray-900/50 border border-gray-800 rounded-2xl">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-gray-300 mb-6">"Quick response time and fair pricing. They fixed our electrical issues same day. Highly recommend for any electrical work!"</p>
          <div class="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" alt="Customer" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <p class="font-semibold">Michael Chen</p>
              <p class="text-sm text-gray-500">Electrical Repair</p>
            </div>
          </div>
        </div>

        <div class="p-8 bg-gray-900/50 border border-gray-800 rounded-2xl">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-gray-300 mb-6">"Complete bathroom renovation done beautifully. The team was respectful of our home and cleaned up every day. Worth every penny!"</p>
          <div class="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" alt="Customer" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <p class="font-semibold">Emily Rodriguez</p>
              <p class="text-sm text-gray-500">Bathroom Renovation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section id="contact" class="py-24 bg-gradient-to-r from-emerald-600 to-cyan-600">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Start Your Project?</h2>
      <p class="text-xl text-emerald-100 mb-10">Get a free quote today and transform your home with the best pros in your area.</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#" class="px-10 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition shadow-lg">Get Free Quote</a>
        <a href="#" class="px-10 py-4 bg-emerald-700/50 text-white font-semibold rounded-xl border border-white/20 hover:bg-emerald-700/70 transition">Call (555) 123-4567</a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-950 pt-16 pb-8 border-t border-gray-800">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid md:grid-cols-4 gap-12 mb-12">
        <div>
          <h3 class="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">{{projectName}}</h3>
          <p class="text-gray-400">Your trusted partner for all home improvement needs. Quality work, guaranteed.</p>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Services</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition">Kitchen Remodeling</a></li>
            <li><a href="#" class="hover:text-white transition">Bathroom Renovation</a></li>
            <li><a href="#" class="hover:text-white transition">Electrical</a></li>
            <li><a href="#" class="hover:text-white transition">Plumbing</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Company</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition">About Us</a></li>
            <li><a href="#" class="hover:text-white transition">Our Team</a></li>
            <li><a href="#" class="hover:text-white transition">Careers</a></li>
            <li><a href="#" class="hover:text-white transition">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Contact</h4>
          <ul class="space-y-2 text-gray-400">
            <li>(555) 123-4567</li>
            <li>hello@company.com</li>
            <li>123 Main Street</li>
            <li>Your City, ST 12345</li>
          </ul>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 {{projectName}}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },

  // =============================================================================
  // SAAS PREMIUM - Linear/Vercel Style
  // =============================================================================
  {
    id: 'saas-premium',
    name: 'SaaS Premium',
    category: 'saas',
    description: 'Ultra-modern SaaS landing page inspired by Linear and Vercel',
    thumbnail: '/templates/saas-premium.png',
    tags: ['tech', 'startup', 'software', 'premium', 'dark', 'modern'],
    sections: ['hero-premium', 'logo-cloud', 'bento-features', 'testimonials', 'pricing', 'cta', 'footer'],
    defaultValues: {},
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - The Platform for Modern Teams</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
      50% { box-shadow: 0 0 60px rgba(139, 92, 246, 0.6); }
    }
    @keyframes gradient-x {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
    .animate-gradient { animation: gradient-x 15s ease infinite; background-size: 200% 200%; }
  </style>
</head>
<body class="bg-[#0a0a0f] text-white antialiased">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.05]">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <span class="text-xl font-bold">{{projectName}}</span>
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-sm text-slate-400 hover:text-white transition">Features</a>
        <a href="#pricing" class="text-sm text-slate-400 hover:text-white transition">Pricing</a>
        <a href="#" class="text-sm text-slate-400 hover:text-white transition">Docs</a>
        <a href="#" class="text-sm text-slate-400 hover:text-white transition">Blog</a>
      </div>
      <div class="flex items-center gap-4">
        <a href="#" class="text-sm text-slate-400 hover:text-white transition">Sign In</a>
        <a href="#" class="px-4 py-2 bg-white text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-100 transition">Get Started</a>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
    <!-- Background Effects -->
    <div class="absolute inset-0">
      <div class="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[100px] animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]"></div>
    </div>

    <!-- Grid Pattern -->
    <div class="absolute inset-0 opacity-20" style="background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 60px 60px;"></div>

    <div class="relative z-10 max-w-5xl mx-auto px-6 text-center">
      <!-- Announcement Badge -->
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
        </span>
        <span class="text-violet-300 text-sm font-medium">Announcing our $50M Series B</span>
        <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>

      <!-- Headline -->
      <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
        Build products<br>
        <span class="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent animate-gradient">10x faster</span>
      </h1>

      <!-- Subheadline -->
      <p class="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        The all-in-one platform that helps modern teams ship better products faster. From idea to production in minutes, not months.
      </p>

      <!-- CTAs -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <a href="#" class="group px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all shadow-lg shadow-white/10 flex items-center gap-2">
          Get Started Free
          <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
        <a href="#" class="px-8 py-4 border border-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800/50 transition-all flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
          Watch Demo
        </a>
      </div>

      <!-- Social Proof -->
      <div class="flex items-center justify-center gap-6 text-sm text-slate-500">
        <div class="flex -space-x-2">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop" class="w-8 h-8 rounded-full border-2 border-slate-900" alt="">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop" class="w-8 h-8 rounded-full border-2 border-slate-900" alt="">
          <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop" class="w-8 h-8 rounded-full border-2 border-slate-900" alt="">
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop" class="w-8 h-8 rounded-full border-2 border-slate-900" alt="">
        </div>
        <span>Trusted by 50,000+ developers</span>
      </div>
    </div>
  </section>

  <!-- Logo Cloud -->
  <section class="py-20 border-y border-white/[0.05]">
    <div class="max-w-7xl mx-auto px-6">
      <p class="text-center text-slate-500 text-sm mb-12">Powering the world's best product teams</p>
      <div class="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
        <span class="text-2xl font-bold text-slate-600 hover:text-slate-400 transition">Stripe</span>
        <span class="text-2xl font-bold text-slate-600 hover:text-slate-400 transition">Vercel</span>
        <span class="text-2xl font-bold text-slate-600 hover:text-slate-400 transition">Linear</span>
        <span class="text-2xl font-bold text-slate-600 hover:text-slate-400 transition">Notion</span>
        <span class="text-2xl font-bold text-slate-600 hover:text-slate-400 transition">Figma</span>
        <span class="text-2xl font-bold text-slate-600 hover:text-slate-400 transition">GitHub</span>
      </div>
    </div>
  </section>

  <!-- Bento Grid Features -->
  <section id="features" class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-violet-400 font-medium mb-4">Features</p>
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Everything you need to ship</h2>
        <p class="text-xl text-slate-400 max-w-2xl mx-auto">Powerful features that help you move fast and build better products.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Large Feature Card -->
        <div class="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 hover:border-slate-700 transition-all group">
          <div class="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition">
            <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 class="text-2xl font-bold mb-3">Lightning Fast Performance</h3>
          <p class="text-slate-400 text-lg leading-relaxed">Built on modern infrastructure, our platform delivers sub-50ms response times globally. Your users get instant feedback, every time.</p>
        </div>

        <!-- Regular Card -->
        <div class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group">
          <div class="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-6 group-hover:bg-fuchsia-500/20 transition">
            <svg class="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-2">Enterprise Security</h3>
          <p class="text-slate-400">SOC 2 Type II certified. Your data is encrypted at rest and in transit.</p>
        </div>

        <!-- Regular Card -->
        <div class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group">
          <div class="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition">
            <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-2">Real-time Collaboration</h3>
          <p class="text-slate-400">Work together seamlessly with your entire team, no matter where they are.</p>
        </div>

        <!-- Regular Card -->
        <div class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-2">Advanced Analytics</h3>
          <p class="text-slate-400">Deep insights into your product performance with beautiful dashboards.</p>
        </div>

        <!-- Large Card -->
        <div class="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-violet-950/50 to-fuchsia-950/50 border border-violet-500/20 hover:border-violet-500/40 transition-all group">
          <div class="flex items-start gap-6">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold mb-3">Powerful API & Integrations</h3>
              <p class="text-slate-400 text-lg leading-relaxed">Connect with 500+ tools your team already uses. Build custom integrations with our developer-first API. Full SDK support for all major languages.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="py-20 border-y border-white/[0.05]">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div class="text-center">
          <div class="text-5xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">50K+</div>
          <div class="text-slate-500">Active Users</div>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent mb-2">99.9%</div>
          <div class="text-slate-500">Uptime SLA</div>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-2">500+</div>
          <div class="text-slate-500">Integrations</div>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent mb-2">24/7</div>
          <div class="text-slate-500">Support</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-violet-400 font-medium mb-4">Testimonials</p>
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Loved by teams everywhere</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-300 mb-6 leading-relaxed">"This platform has completely transformed how we build products. We shipped our new feature in 2 weeks instead of 2 months. Absolutely game-changing."</p>
          <div class="flex items-center gap-4">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" class="w-12 h-12 rounded-full" alt="Sarah Chen">
            <div>
              <p class="font-semibold">Sarah Chen</p>
              <p class="text-sm text-slate-500">CTO at TechCorp</p>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-300 mb-6 leading-relaxed">"The best developer experience I've ever encountered. The API is intuitive, the docs are excellent, and the support team is incredibly responsive."</p>
          <div class="flex items-center gap-4">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" class="w-12 h-12 rounded-full" alt="Marcus Johnson">
            <div>
              <p class="font-semibold">Marcus Johnson</p>
              <p class="text-sm text-slate-500">Lead Engineer at StartupX</p>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
          <div class="flex gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-300 mb-6 leading-relaxed">"We evaluated 10 different platforms. Nothing else comes close. The ROI was clear within the first month. Our team velocity increased by 300%."</p>
          <div class="flex items-center gap-4">
            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" class="w-12 h-12 rounded-full" alt="Emily Rodriguez">
            <div>
              <p class="font-semibold">Emily Rodriguez</p>
              <p class="text-sm text-slate-500">VP Product at ScaleUp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing" class="py-24 bg-slate-900/30">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-violet-400 font-medium mb-4">Pricing</p>
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
        <p class="text-xl text-slate-400">Start free, scale as you grow. No hidden fees.</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Free Tier -->
        <div class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
          <h3 class="text-xl font-bold mb-2">Starter</h3>
          <p class="text-slate-400 mb-6">Perfect for trying things out</p>
          <div class="mb-6">
            <span class="text-5xl font-bold">$0</span>
            <span class="text-slate-500">/month</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Up to 3 projects</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Basic analytics</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Community support</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center border border-slate-700 rounded-xl font-medium hover:bg-slate-800 transition">Get Started</a>
        </div>

        <!-- Pro Tier -->
        <div class="p-8 rounded-3xl bg-gradient-to-b from-violet-950/50 to-slate-900 border-2 border-violet-500/50 hover:border-violet-500 transition-all relative">
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full text-sm font-medium">Most Popular</div>
          <h3 class="text-xl font-bold mb-2">Pro</h3>
          <p class="text-slate-400 mb-6">For growing teams</p>
          <div class="mb-6">
            <span class="text-5xl font-bold">$49</span>
            <span class="text-slate-500">/month</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited projects</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Advanced analytics</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Priority support</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>API access</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Team collaboration</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium hover:opacity-90 transition">Get Started</a>
        </div>

        <!-- Enterprise Tier -->
        <div class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
          <h3 class="text-xl font-bold mb-2">Enterprise</h3>
          <p class="text-slate-400 mb-6">For large organizations</p>
          <div class="mb-6">
            <span class="text-5xl font-bold">Custom</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Everything in Pro</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Custom integrations</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Dedicated support</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>SLA guarantee</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center border border-slate-700 rounded-xl font-medium hover:bg-slate-800 transition">Contact Sales</a>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-24 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20"></div>
    <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 40px 40px;"></div>
    <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-4xl md:text-5xl font-bold mb-6">Ready to ship faster?</h2>
      <p class="text-xl text-slate-400 mb-10">Join 50,000+ developers building the future. Start free, no credit card required.</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#" class="px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition shadow-lg shadow-white/10">Get Started Free</a>
        <a href="#" class="px-8 py-4 border border-slate-600 font-semibold rounded-xl hover:bg-slate-800 transition">Talk to Sales</a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-16 border-t border-white/[0.05]">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        <div class="col-span-2">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span class="text-xl font-bold">{{projectName}}</span>
          </div>
          <p class="text-slate-400 mb-4 max-w-xs">Building the future of product development. Ship faster, build better.</p>
          <div class="flex gap-4">
            <a href="#" class="text-slate-400 hover:text-white transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
            <a href="#" class="text-slate-400 hover:text-white transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
            <a href="#" class="text-slate-400 hover:text-white transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>
          </div>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Product</h4>
          <ul class="space-y-2">
            <li><a href="#" class="text-slate-400 hover:text-white transition">Features</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Pricing</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Changelog</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Roadmap</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Company</h4>
          <ul class="space-y-2">
            <li><a href="#" class="text-slate-400 hover:text-white transition">About</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Blog</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Careers</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Press</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Resources</h4>
          <ul class="space-y-2">
            <li><a href="#" class="text-slate-400 hover:text-white transition">Documentation</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Help Center</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Community</a></li>
            <li><a href="#" class="text-slate-400 hover:text-white transition">Status</a></li>
          </ul>
        </div>
      </div>
      <div class="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-slate-500 text-sm">&copy; 2024 {{projectName}}. All rights reserved.</p>
        <div class="flex gap-6 text-sm">
          <a href="#" class="text-slate-400 hover:text-white transition">Privacy</a>
          <a href="#" class="text-slate-400 hover:text-white transition">Terms</a>
          <a href="#" class="text-slate-400 hover:text-white transition">Cookies</a>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },

  // =============================================================================
  // PORTFOLIO MINIMAL
  // =============================================================================
  {
    id: 'portfolio-minimal',
    name: 'Portfolio Minimal',
    category: 'portfolio',
    description: 'Clean, minimal portfolio for designers and developers',
    thumbnail: '/templates/portfolio-minimal.png',
    tags: ['portfolio', 'designer', 'developer', 'minimal', 'creative'],
    sections: ['hero', 'work', 'about', 'contact'],
    defaultValues: {},
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .work-item:hover .work-overlay { opacity: 1; }
    .work-item:hover img { transform: scale(1.05); }
  </style>
</head>
<body class="bg-black text-white antialiased">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl">
    <div class="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
      <a href="#" class="text-xl font-bold">{{projectName}}</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#work" class="text-sm text-neutral-400 hover:text-white transition">Work</a>
        <a href="#about" class="text-sm text-neutral-400 hover:text-white transition">About</a>
        <a href="#contact" class="text-sm text-neutral-400 hover:text-white transition">Contact</a>
      </div>
      <a href="#contact" class="px-4 py-2 border border-neutral-700 text-sm rounded-full hover:bg-white hover:text-black transition">Get in touch</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="min-h-screen flex items-center justify-center pt-20 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <p class="text-neutral-500 mb-6 tracking-wider uppercase text-sm">Designer & Developer</p>
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8">
        I craft digital<br>experiences that<br><span class="text-neutral-500">matter</span>
      </h1>
      <p class="text-xl text-neutral-400 max-w-xl mx-auto mb-12">
        Award-winning designer specializing in brand identity, web design, and creative direction.
      </p>
      <div class="flex items-center justify-center gap-6">
        <a href="#work" class="px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition">View Work</a>
        <a href="#contact" class="px-8 py-4 border border-neutral-700 font-medium rounded-full hover:bg-neutral-900 transition">Get in touch</a>
      </div>
    </div>
  </section>

  <!-- Work Grid -->
  <section id="work" class="py-32 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="mb-16">
        <p class="text-neutral-500 mb-2 tracking-wider uppercase text-sm">Selected Work</p>
        <h2 class="text-4xl md:text-5xl font-bold">Featured Projects</h2>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Work Item 1 -->
        <div class="work-item group relative overflow-hidden rounded-2xl cursor-pointer">
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop" class="w-full aspect-[4/3] object-cover transition-transform duration-700" alt="Project 1">
          <div class="work-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 flex items-end p-8">
            <div>
              <p class="text-neutral-400 text-sm mb-1">Brand Identity</p>
              <h3 class="text-2xl font-bold">Nebula Studios</h3>
            </div>
          </div>
        </div>

        <!-- Work Item 2 -->
        <div class="work-item group relative overflow-hidden rounded-2xl cursor-pointer">
          <img src="https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop" class="w-full aspect-[4/3] object-cover transition-transform duration-700" alt="Project 2">
          <div class="work-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 flex items-end p-8">
            <div>
              <p class="text-neutral-400 text-sm mb-1">Web Design</p>
              <h3 class="text-2xl font-bold">Gradient Labs</h3>
            </div>
          </div>
        </div>

        <!-- Work Item 3 -->
        <div class="work-item group relative overflow-hidden rounded-2xl cursor-pointer">
          <img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=600&fit=crop" class="w-full aspect-[4/3] object-cover transition-transform duration-700" alt="Project 3">
          <div class="work-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 flex items-end p-8">
            <div>
              <p class="text-neutral-400 text-sm mb-1">Product Design</p>
              <h3 class="text-2xl font-bold">Aurora App</h3>
            </div>
          </div>
        </div>

        <!-- Work Item 4 -->
        <div class="work-item group relative overflow-hidden rounded-2xl cursor-pointer">
          <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop" class="w-full aspect-[4/3] object-cover transition-transform duration-700" alt="Project 4">
          <div class="work-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 flex items-end p-8">
            <div>
              <p class="text-neutral-400 text-sm mb-1">Dashboard</p>
              <h3 class="text-2xl font-bold">Analytics Pro</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- About -->
  <section id="about" class="py-32 px-6 bg-neutral-950">
    <div class="max-w-6xl mx-auto">
      <div class="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop" class="rounded-2xl w-full" alt="Portrait">
        </div>
        <div>
          <p class="text-neutral-500 mb-4 tracking-wider uppercase text-sm">About Me</p>
          <h2 class="text-4xl md:text-5xl font-bold mb-6">Creating impactful digital experiences</h2>
          <p class="text-neutral-400 text-lg leading-relaxed mb-6">
            With over 10 years of experience in design and development, I help brands tell their stories through thoughtful, impactful design. I believe in the power of simplicity and craft every project with intention and purpose.
          </p>
          <p class="text-neutral-400 text-lg leading-relaxed mb-8">
            When I'm not designing, you'll find me exploring new technologies, contributing to open source, or sharing knowledge with the design community.
          </p>
          <div class="grid grid-cols-3 gap-8 mb-8">
            <div>
              <div class="text-4xl font-bold mb-1">10+</div>
              <div class="text-neutral-500 text-sm">Years Experience</div>
            </div>
            <div>
              <div class="text-4xl font-bold mb-1">150+</div>
              <div class="text-neutral-500 text-sm">Projects Done</div>
            </div>
            <div>
              <div class="text-4xl font-bold mb-1">50+</div>
              <div class="text-neutral-500 text-sm">Happy Clients</div>
            </div>
          </div>
          <a href="#contact" class="inline-flex items-center gap-2 text-white font-medium hover:gap-4 transition-all">
            Let's work together <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="py-32 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <p class="text-neutral-500 mb-4 tracking-wider uppercase text-sm">Get in Touch</p>
      <h2 class="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">Let's create something great together</h2>
      <p class="text-xl text-neutral-400 mb-12 max-w-xl mx-auto">
        Have a project in mind? I'd love to hear about it. Let's discuss how we can work together.
      </p>
      <a href="mailto:hello@example.com" class="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition text-lg">
        hello@example.com <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 px-6 border-t border-neutral-900">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <p class="text-neutral-500 text-sm">&copy; 2024 {{projectName}}. All rights reserved.</p>
      <div class="flex gap-6">
        <a href="#" class="text-neutral-400 hover:text-white transition">Twitter</a>
        <a href="#" class="text-neutral-400 hover:text-white transition">Dribbble</a>
        <a href="#" class="text-neutral-400 hover:text-white transition">LinkedIn</a>
        <a href="#" class="text-neutral-400 hover:text-white transition">GitHub</a>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },

  // =============================================================================
  // STARTUP BOLD
  // =============================================================================
  {
    id: 'startup-bold',
    name: 'Startup Bold',
    category: 'saas',
    description: 'Bold, disruptive startup landing page with strong messaging',
    thumbnail: '/templates/startup-bold.png',
    tags: ['startup', 'bold', 'tech', 'disruptive', 'modern'],
    sections: ['hero', 'problem', 'solution', 'features', 'team', 'cta'],
    defaultValues: {},
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - The Future is Now</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
    .animate-float { animation: float 5s ease-in-out infinite; }
  </style>
</head>
<body class="bg-zinc-950 text-white antialiased">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-black text-zinc-950">{{projectName}}</div>
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#solution" class="text-sm text-zinc-400 hover:text-white transition">Solution</a>
        <a href="#features" class="text-sm text-zinc-400 hover:text-white transition">Features</a>
        <a href="#team" class="text-sm text-zinc-400 hover:text-white transition">Team</a>
      </div>
      <a href="#" class="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 font-semibold rounded-lg hover:opacity-90 transition">Join Waitlist</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
    <!-- Background -->
    <div class="absolute inset-0">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-emerald-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10 max-w-5xl mx-auto px-6 text-center">
      <!-- Badge -->
      <div class="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 mb-8">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-sm text-zinc-400">Backed by YC & a]6z</span>
      </div>

      <!-- Headline -->
      <h1 class="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8">
        The future of<br>
        <span class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">work is here</span>
      </h1>

      <!-- Subheadline -->
      <p class="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
        We're building the infrastructure that will power the next generation of companies. Join the revolution.
      </p>

      <!-- CTAs -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <a href="#" class="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 font-bold rounded-xl hover:shadow-2xl hover:shadow-emerald-500/25 transition-all flex items-center gap-2">
          Get Early Access
          <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
        <a href="#" class="px-8 py-4 border border-zinc-700 font-semibold rounded-xl hover:bg-zinc-900 transition flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
          See How It Works
        </a>
      </div>

      <!-- Backed By -->
      <div class="flex flex-wrap items-center justify-center gap-8 text-zinc-600">
        <span class="text-2xl font-bold">YC</span>
        <span class="text-2xl font-bold">a16z</span>
        <span class="text-2xl font-bold">Sequoia</span>
        <span class="text-2xl font-bold">Accel</span>
      </div>
    </div>
  </section>

  <!-- Problem Section -->
  <section class="py-32 px-6">
    <div class="max-w-5xl mx-auto">
      <div class="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p class="text-emerald-400 font-semibold mb-4 tracking-wider uppercase text-sm">The Problem</p>
          <h2 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">The old way is broken</h2>
          <p class="text-xl text-zinc-400 leading-relaxed mb-8">
            Companies waste millions on outdated systems that slow teams down. Fragmented tools, endless meetings, and information silos kill productivity and innovation.
          </p>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
              <p class="text-zinc-300">Average employee uses 9 different apps daily</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
              <p class="text-zinc-300">40% of time wasted on context switching</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
              <p class="text-zinc-300">$15,000 per employee lost annually</p>
            </div>
          </div>
        </div>
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/10 rounded-3xl blur-2xl"></div>
          <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=500&fit=crop" class="relative rounded-3xl border border-zinc-800" alt="Problem">
        </div>
      </div>
    </div>
  </section>

  <!-- Solution Section -->
  <section id="solution" class="py-32 px-6 bg-gradient-to-b from-zinc-950 to-zinc-900">
    <div class="max-w-5xl mx-auto">
      <div class="grid md:grid-cols-2 gap-16 items-center">
        <div class="relative order-2 md:order-1">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-3xl blur-2xl"></div>
          <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=500&fit=crop" class="relative rounded-3xl border border-zinc-800" alt="Solution">
        </div>
        <div class="order-1 md:order-2">
          <p class="text-emerald-400 font-semibold mb-4 tracking-wider uppercase text-sm">The Solution</p>
          <h2 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">One platform to rule them all</h2>
          <p class="text-xl text-zinc-400 leading-relaxed mb-8">
            We've reimagined how teams work. Our AI-powered platform unifies your entire workflow, eliminates context switching, and amplifies what your team can achieve.
          </p>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <p class="text-zinc-300">All your tools in one unified workspace</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <p class="text-zinc-300">AI that learns your workflow patterns</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <p class="text-zinc-300">10x productivity increase in 30 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section id="features" class="py-32 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-20">
        <p class="text-emerald-400 font-semibold mb-4 tracking-wider uppercase text-sm">Features</p>
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Built for the future</h2>
        <p class="text-xl text-zinc-400 max-w-2xl mx-auto">Everything you need to transform how your team works.</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="group p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 transition-all">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg class="w-7 h-7 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-3">Lightning Fast</h3>
          <p class="text-zinc-400 leading-relaxed">Sub-millisecond response times. Your tools should never slow you down.</p>
        </div>

        <div class="group p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-cyan-500/50 transition-all">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg class="w-7 h-7 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-3">AI-Powered</h3>
          <p class="text-zinc-400 leading-relaxed">Intelligent automation that learns and adapts to how you work.</p>
        </div>

        <div class="group p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 transition-all">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg class="w-7 h-7 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-3">Enterprise Security</h3>
          <p class="text-zinc-400 leading-relaxed">Bank-level encryption and compliance. Your data is always protected.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Team -->
  <section id="team" class="py-32 px-6 bg-zinc-900/30">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-20">
        <p class="text-emerald-400 font-semibold mb-4 tracking-wider uppercase text-sm">Our Team</p>
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Built by the best</h2>
        <p class="text-xl text-zinc-400 max-w-2xl mx-auto">Our team has built products used by billions at Google, Meta, and Stripe.</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div class="text-center">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" class="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-zinc-800" alt="CEO">
          <h3 class="text-xl font-bold">Alex Thompson</h3>
          <p class="text-zinc-500">CEO & Co-founder</p>
          <p class="text-sm text-zinc-600 mt-2">Ex-Google, Stanford</p>
        </div>
        <div class="text-center">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop" class="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-zinc-800" alt="CTO">
          <h3 class="text-xl font-bold">Sarah Chen</h3>
          <p class="text-zinc-500">CTO & Co-founder</p>
          <p class="text-sm text-zinc-600 mt-2">Ex-Meta, MIT</p>
        </div>
        <div class="text-center">
          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop" class="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-zinc-800" alt="CPO">
          <h3 class="text-xl font-bold">Marcus Rivera</h3>
          <p class="text-zinc-500">CPO & Co-founder</p>
          <p class="text-sm text-zinc-600 mt-2">Ex-Stripe, Harvard</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-32 px-6 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-cyan-600/10 to-blue-600/10"></div>
    <div class="relative z-10 max-w-4xl mx-auto text-center">
      <h2 class="text-5xl md:text-6xl font-black mb-6">Ready to join the future?</h2>
      <p class="text-xl text-zinc-400 mb-10 max-w-xl mx-auto">Get early access and be among the first to experience the next generation of work.</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <input type="email" placeholder="Enter your email" class="w-full sm:w-auto px-6 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition">
        <button class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 font-bold rounded-xl hover:shadow-2xl hover:shadow-emerald-500/25 transition-all">Join Waitlist</button>
      </div>
      <p class="text-sm text-zinc-600 mt-4">No spam. Unsubscribe anytime.</p>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 px-6 border-t border-zinc-800">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-black text-zinc-950 text-xs">{{projectName}}</div>
        <span class="text-zinc-500 text-sm">&copy; 2024 All rights reserved.</span>
      </div>
      <div class="flex gap-6">
        <a href="#" class="text-zinc-400 hover:text-white transition">Twitter</a>
        <a href="#" class="text-zinc-400 hover:text-white transition">LinkedIn</a>
        <a href="#" class="text-zinc-400 hover:text-white transition">GitHub</a>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },
]

// Get templates by category
export function getTemplatesByCategory(category: StarterTemplate['category']): StarterTemplate[] {
  return STARTER_TEMPLATES.filter(t => t.category === category)
}

// Get template by ID
export function getTemplateById(id: string): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find(t => t.id === id)
}

// Search templates
export function searchTemplates(query: string): StarterTemplate[] {
  const lowerQuery = query.toLowerCase()
  return STARTER_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

// Hydrate template with project values
export function hydrateTemplate(template: StarterTemplate, values: Record<string, any>): string {
  let html = template.html
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    html = html.replace(regex, String(value ?? ''))
  }
  return html
}
