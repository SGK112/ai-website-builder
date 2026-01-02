/**
 * SaaS Landing Page Template
 * Modern gradient SaaS with feature sections
 */

export const SAAS_LANDING_TEMPLATE = {
  id: 'saas-landing',
  name: 'SaaS Startup',
  description: 'Modern SaaS landing page with gradient accents, feature grids, pricing tables, and testimonials',
  category: 'saas',
  tags: ['saas', 'startup', 'tech', 'gradient', 'modern', 'pricing'],
  preview: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',

  variables: {
    productName: 'FlowSync',
    tagline: 'Simplify Your Workflow',
    heroTitle: 'The Modern Way to Manage Your Team',
    heroSubtitle: 'Streamline collaboration, automate tasks, and boost productivity with our all-in-one platform.',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6'
  },

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{productName}} - {{tagline}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --primary: {{primaryColor}}; --secondary: {{secondaryColor}}; }
    body { font-family: 'Inter', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); }
    .gradient-text {
      background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .card-hover { transition: all 0.3s ease; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.3); }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased">

<!-- Navigation -->
<nav class="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg gradient-bg"></div>
        <span class="font-bold text-xl">{{productName}}</span>
      </div>
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-sm text-slate-600 hover:text-slate-900 transition">Features</a>
        <a href="#pricing" class="text-sm text-slate-600 hover:text-slate-900 transition">Pricing</a>
        <a href="#testimonials" class="text-sm text-slate-600 hover:text-slate-900 transition">Testimonials</a>
        <a href="#" class="text-sm text-slate-600 hover:text-slate-900 transition">Docs</a>
      </div>
      <div class="flex items-center gap-4">
        <a href="#" class="text-sm text-slate-600 hover:text-slate-900 transition">Log in</a>
        <a href="#" class="px-4 py-2 text-sm font-medium text-white gradient-bg rounded-lg hover:opacity-90 transition">Start Free</a>
      </div>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="pt-32 pb-20 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="text-center max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium mb-8">
        <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
        New: AI-powered automation is here
      </div>
      <h1 class="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
        {{heroTitle}}
      </h1>
      <p class="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">{{heroSubtitle}}</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#" class="w-full sm:w-auto px-8 py-4 text-white font-semibold gradient-bg rounded-xl hover:opacity-90 transition shadow-lg shadow-indigo-500/30">
          Start Free Trial
        </a>
        <a href="#" class="w-full sm:w-auto px-8 py-4 text-slate-700 font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          Watch Demo
        </a>
      </div>
      <p class="mt-6 text-sm text-slate-500">No credit card required. 14-day free trial.</p>
    </div>

    <!-- Hero Image -->
    <div class="mt-20 relative">
      <div class="absolute inset-0 gradient-bg opacity-10 blur-3xl rounded-3xl"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="h-10 bg-slate-100 flex items-center px-4 gap-2">
          <div class="w-3 h-3 rounded-full bg-red-400"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div class="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop" alt="Dashboard" class="w-full">
      </div>
    </div>
  </div>
</section>

<!-- Logos -->
<section class="py-16 border-y border-slate-200 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <p class="text-center text-sm text-slate-500 mb-8">Trusted by 10,000+ teams worldwide</p>
    <div class="flex flex-wrap items-center justify-center gap-12 opacity-50">
      <span class="text-2xl font-bold text-slate-400">Stripe</span>
      <span class="text-2xl font-bold text-slate-400">Slack</span>
      <span class="text-2xl font-bold text-slate-400">Shopify</span>
      <span class="text-2xl font-bold text-slate-400">Notion</span>
      <span class="text-2xl font-bold text-slate-400">Linear</span>
    </div>
  </div>
</section>

<!-- Features -->
<section id="features" class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <p class="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Features</p>
      <h2 class="text-4xl font-bold mb-4">Everything you need to succeed</h2>
      <p class="text-xl text-slate-600 max-w-2xl mx-auto">Powerful features to help you manage projects, collaborate with your team, and deliver results.</p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="p-8 bg-white rounded-2xl border border-slate-200 card-hover">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Lightning Fast</h3>
        <p class="text-slate-600">Built for speed with instant page loads and real-time updates across all devices.</p>
      </div>

      <div class="p-8 bg-white rounded-2xl border border-slate-200 card-hover">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Enterprise Security</h3>
        <p class="text-slate-600">Bank-level encryption and SOC 2 compliance to keep your data safe.</p>
      </div>

      <div class="p-8 bg-white rounded-2xl border border-slate-200 card-hover">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Team Collaboration</h3>
        <p class="text-slate-600">Work together seamlessly with real-time editing and commenting.</p>
      </div>

      <div class="p-8 bg-white rounded-2xl border border-slate-200 card-hover">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Advanced Analytics</h3>
        <p class="text-slate-600">Deep insights with custom dashboards and automated reports.</p>
      </div>

      <div class="p-8 bg-white rounded-2xl border border-slate-200 card-hover">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">100+ Integrations</h3>
        <p class="text-slate-600">Connect with your favorite tools including Slack, GitHub, and more.</p>
      </div>

      <div class="p-8 bg-white rounded-2xl border border-slate-200 card-hover">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">24/7 Support</h3>
        <p class="text-slate-600">Get help anytime with our dedicated support team and extensive docs.</p>
      </div>
    </div>
  </div>
</section>

<!-- Pricing -->
<section id="pricing" class="py-24 px-6 bg-white">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <p class="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Pricing</p>
      <h2 class="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
      <p class="text-xl text-slate-600">No hidden fees. No surprises. Cancel anytime.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <!-- Starter -->
      <div class="p-8 bg-slate-50 rounded-2xl border border-slate-200">
        <h3 class="text-lg font-semibold mb-2">Starter</h3>
        <p class="text-slate-600 mb-6">For individuals and small teams</p>
        <div class="mb-6">
          <span class="text-4xl font-bold">$0</span>
          <span class="text-slate-500">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-slate-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Up to 5 users
          </li>
          <li class="flex items-center gap-3 text-slate-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            10 projects
          </li>
          <li class="flex items-center gap-3 text-slate-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Basic analytics
          </li>
        </ul>
        <a href="#" class="block w-full py-3 text-center border border-slate-200 rounded-xl font-medium hover:bg-slate-100 transition">Get Started</a>
      </div>

      <!-- Pro -->
      <div class="p-8 gradient-bg rounded-2xl text-white relative">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">Most Popular</div>
        <h3 class="text-lg font-semibold mb-2">Pro</h3>
        <p class="text-indigo-100 mb-6">For growing teams</p>
        <div class="mb-6">
          <span class="text-4xl font-bold">$29</span>
          <span class="text-indigo-200">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Unlimited users
          </li>
          <li class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Unlimited projects
          </li>
          <li class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Advanced analytics
          </li>
          <li class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Priority support
          </li>
        </ul>
        <a href="#" class="block w-full py-3 text-center bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition">Start Free Trial</a>
      </div>

      <!-- Enterprise -->
      <div class="p-8 bg-slate-50 rounded-2xl border border-slate-200">
        <h3 class="text-lg font-semibold mb-2">Enterprise</h3>
        <p class="text-slate-600 mb-6">For large organizations</p>
        <div class="mb-6">
          <span class="text-4xl font-bold">Custom</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-slate-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Everything in Pro
          </li>
          <li class="flex items-center gap-3 text-slate-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Custom integrations
          </li>
          <li class="flex items-center gap-3 text-slate-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Dedicated support
          </li>
          <li class="flex items-center gap-3 text-slate-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            SLA guarantee
          </li>
        </ul>
        <a href="#" class="block w-full py-3 text-center border border-slate-200 rounded-xl font-medium hover:bg-slate-100 transition">Contact Sales</a>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section id="testimonials" class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <p class="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Testimonials</p>
      <h2 class="text-4xl font-bold">Loved by teams everywhere</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-white rounded-2xl border border-slate-200">
        <div class="flex gap-1 mb-4">
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-600 mb-6">"{{productName}} has transformed how our team works. We've increased productivity by 40% since switching."</p>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400"></div>
          <div>
            <p class="font-semibold">Sarah Chen</p>
            <p class="text-sm text-slate-500">CEO, TechStart</p>
          </div>
        </div>
      </div>

      <div class="p-8 bg-white rounded-2xl border border-slate-200">
        <div class="flex gap-1 mb-4">
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-600 mb-6">"The best project management tool we've ever used. The integrations are seamless and the UI is beautiful."</p>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-cyan-400"></div>
          <div>
            <p class="font-semibold">Marcus Johnson</p>
            <p class="text-sm text-slate-500">CTO, DevFlow</p>
          </div>
        </div>
      </div>

      <div class="p-8 bg-white rounded-2xl border border-slate-200">
        <div class="flex gap-1 mb-4">
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-600 mb-6">"Finally a tool that our whole team actually uses. The onboarding was smooth and everyone loves it."</p>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-400"></div>
          <div>
            <p class="font-semibold">Emily Roberts</p>
            <p class="text-sm text-slate-500">PM, DesignCo</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-24 px-6">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-4xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
    <p class="text-xl text-slate-600 mb-10">Join thousands of teams already using {{productName}} to work smarter.</p>
    <a href="#" class="inline-block px-8 py-4 text-white font-semibold gradient-bg rounded-xl hover:opacity-90 transition shadow-lg shadow-indigo-500/30">
      Start Your Free Trial
    </a>
  </div>
</section>

<!-- Footer -->
<footer class="py-16 px-6 border-t border-slate-200">
  <div class="max-w-7xl mx-auto">
    <div class="grid md:grid-cols-4 gap-12 mb-12">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg gradient-bg"></div>
          <span class="font-bold text-xl">{{productName}}</span>
        </div>
        <p class="text-slate-600">{{tagline}}</p>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Product</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Features</a></li>
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Pricing</a></li>
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Integrations</a></li>
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Changelog</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Company</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">About</a></li>
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Blog</a></li>
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Careers</a></li>
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Legal</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Privacy</a></li>
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Terms</a></li>
          <li><a href="#" class="text-slate-600 hover:text-slate-900 transition">Security</a></li>
        </ul>
      </div>
    </div>
    <div class="pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
      &copy; 2024 {{productName}}. All rights reserved.
    </div>
  </div>
</footer>

</body>
</html>`
}
