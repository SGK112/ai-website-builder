/**
 * SaaS Multi-Page Template
 * Complete SaaS website with pricing, features, and contact pages
 */

export const SAAS_MULTIPAGE_TEMPLATE = {
  id: 'saas-multipage',
  name: 'SaaS Complete',
  description: 'Full-featured SaaS template with pricing tables, feature sections, testimonials, and FAQ',
  category: 'saas' as const,
  tags: ['saas', 'software', 'pricing', 'features', 'startup', 'tech'],
  preview: 'https://www.webstew.net/api/media?q=modern+saas+dashboard&w=800&h=600',

  variables: {
    productName: 'FlowSync',
    tagline: 'Streamline Your Workflow',
    heroTitle: 'The modern way to manage your team',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
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
    :root {
      --primary: {{primaryColor}};
      --secondary: {{secondaryColor}};
    }
    body { font-family: 'Inter', sans-serif; }
    .gradient-text { background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .gradient-bg { background: linear-gradient(135deg, var(--primary), var(--secondary)); }
  </style>
</head>
<body class="bg-slate-950 text-white antialiased">

<!-- Navigation -->
<nav class="fixed top-0 w-full bg-slate-950/80 backdrop-blur-xl z-50 border-b border-white/5">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-10">
        <a href="#" class="flex items-center gap-2">
          <div class="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
            </svg>
          </div>
          <span class="font-bold text-lg">{{productName}}</span>
        </a>
        <nav class="hidden md:flex items-center gap-6">
          <a href="#features" class="text-sm text-slate-400 hover:text-white transition">Features</a>
          <a href="#pricing" class="text-sm text-slate-400 hover:text-white transition">Pricing</a>
          <a href="#testimonials" class="text-sm text-slate-400 hover:text-white transition">Testimonials</a>
          <a href="#faq" class="text-sm text-slate-400 hover:text-white transition">FAQ</a>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <a href="#" class="text-sm text-slate-400 hover:text-white transition">Login</a>
        <a href="#" class="px-4 py-2 gradient-bg rounded-lg text-sm font-medium hover:opacity-90 transition">
          Get Started Free
        </a>
      </div>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
  </div>
  <div class="max-w-5xl mx-auto text-center relative z-10">
    <div class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
      <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
      <span class="text-sm text-indigo-300">New: AI-powered automation</span>
    </div>
    <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
      {{heroTitle}} <span class="gradient-text">with ease</span>
    </h1>
    <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
      {{productName}} helps teams collaborate better, automate workflows, and ship faster. Join 50,000+ teams already using our platform.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
      <a href="#" class="px-8 py-4 gradient-bg rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/25">
        Start Free Trial
      </a>
      <a href="#" class="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
        Watch Demo
      </a>
    </div>
    <p class="text-sm text-slate-500 mb-8">No credit card required • Free 14-day trial • Cancel anytime</p>

    <!-- Dashboard Preview -->
    <div class="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-500/10">
      <img src="https://www.webstew.net/api/media?q=software+team+working&w=1200&h=700"
           alt="Dashboard" class="w-full">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
    </div>
  </div>
</section>

<!-- Logos -->
<section class="py-12 px-4 md:px-8 border-y border-white/5">
  <div class="max-w-6xl mx-auto">
    <p class="text-center text-sm text-slate-500 mb-8">Trusted by innovative companies worldwide</p>
    <div class="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50 grayscale">
      <span class="text-2xl font-bold text-slate-400">Stripe</span>
      <span class="text-2xl font-bold text-slate-400">Vercel</span>
      <span class="text-2xl font-bold text-slate-400">Linear</span>
      <span class="text-2xl font-bold text-slate-400">Notion</span>
      <span class="text-2xl font-bold text-slate-400">Figma</span>
    </div>
  </div>
</section>

<!-- Features Section -->
<section id="features" class="py-24 px-4 md:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <span class="gradient-text text-sm font-semibold uppercase tracking-wider">Features</span>
      <h2 class="text-3xl md:text-5xl font-bold mt-4 mb-4">Everything you need to scale</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">Powerful features to help your team work smarter, not harder.</p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition group">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Lightning Fast</h3>
        <p class="text-slate-400 text-sm">Optimized for speed with sub-second response times across all operations.</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition group">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Enterprise Security</h3>
        <p class="text-slate-400 text-sm">SOC 2 certified with end-to-end encryption and advanced access controls.</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition group">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Advanced Analytics</h3>
        <p class="text-slate-400 text-sm">Deep insights into team performance with customizable dashboards.</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition group">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Team Collaboration</h3>
        <p class="text-slate-400 text-sm">Real-time collaboration with comments, mentions, and shared workspaces.</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition group">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Customizable Workflows</h3>
        <p class="text-slate-400 text-sm">Build automated workflows with our visual drag-and-drop builder.</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition group">
        <div class="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">100+ Integrations</h3>
        <p class="text-slate-400 text-sm">Connect with your favorite tools including Slack, GitHub, Jira, and more.</p>
      </div>
    </div>
  </div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="py-24 px-4 md:px-8 bg-slate-900/50">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <span class="gradient-text text-sm font-semibold uppercase tracking-wider">Pricing</span>
      <h2 class="text-3xl md:text-5xl font-bold mt-4 mb-4">Simple, transparent pricing</h2>
      <p class="text-slate-400 max-w-xl mx-auto">Choose the perfect plan for your team size and needs.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <!-- Starter -->
      <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/10">
        <h3 class="text-lg font-semibold mb-2">Starter</h3>
        <p class="text-slate-400 text-sm mb-6">For individuals and small teams</p>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold">$0</span>
          <span class="text-slate-400">/month</span>
        </div>
        <a href="#" class="block w-full py-3 text-center border border-white/20 rounded-xl font-medium hover:bg-white/5 transition">
          Get Started Free
        </a>
        <ul class="mt-8 space-y-3">
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Up to 5 team members
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            3 projects
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Basic analytics
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Community support
          </li>
        </ul>
      </div>

      <!-- Pro - Highlighted -->
      <div class="relative p-8 rounded-2xl gradient-bg border border-transparent">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-indigo-600 text-sm font-semibold rounded-full">
          Most Popular
        </div>
        <h3 class="text-lg font-semibold mb-2">Pro</h3>
        <p class="text-white/70 text-sm mb-6">For growing teams</p>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold">$29</span>
          <span class="text-white/70">/user/month</span>
        </div>
        <a href="#" class="block w-full py-3 text-center bg-white text-indigo-600 rounded-xl font-semibold hover:bg-white/90 transition">
          Start Free Trial
        </a>
        <ul class="mt-8 space-y-3">
          <li class="flex items-center gap-3 text-sm text-white">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Unlimited team members
          </li>
          <li class="flex items-center gap-3 text-sm text-white">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Unlimited projects
          </li>
          <li class="flex items-center gap-3 text-sm text-white">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Advanced analytics
          </li>
          <li class="flex items-center gap-3 text-sm text-white">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Priority support
          </li>
          <li class="flex items-center gap-3 text-sm text-white">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            All integrations
          </li>
        </ul>
      </div>

      <!-- Enterprise -->
      <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/10">
        <h3 class="text-lg font-semibold mb-2">Enterprise</h3>
        <p class="text-slate-400 text-sm mb-6">For large organizations</p>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold">Custom</span>
        </div>
        <a href="#" class="block w-full py-3 text-center border border-white/20 rounded-xl font-medium hover:bg-white/5 transition">
          Contact Sales
        </a>
        <ul class="mt-8 space-y-3">
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Everything in Pro
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Custom contracts
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Dedicated support
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            SLA guarantee
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-300">
            <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            Custom integrations
          </li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section id="testimonials" class="py-24 px-4 md:px-8">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <span class="gradient-text text-sm font-semibold uppercase tracking-wider">Testimonials</span>
      <h2 class="text-3xl md:text-5xl font-bold mt-4 mb-4">Loved by teams worldwide</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <div class="flex items-center gap-1 mb-4">
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-300 text-sm mb-6">"{{productName}} transformed how our team works. We're shipping 3x faster and our developers love it."</p>
        <div class="flex items-center gap-3">
          <img src="https://randomuser.me/api/portraits/women/1.jpg" alt="Sarah" class="w-10 h-10 rounded-full">
          <div>
            <p class="font-medium text-sm">Sarah Johnson</p>
            <p class="text-slate-500 text-xs">CTO at TechCorp</p>
          </div>
        </div>
      </div>

      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <div class="flex items-center gap-1 mb-4">
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-300 text-sm mb-6">"The best project management tool we've ever used. The automation features alone have saved us 20 hours per week."</p>
        <div class="flex items-center gap-3">
          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael" class="w-10 h-10 rounded-full">
          <div>
            <p class="font-medium text-sm">Michael Chen</p>
            <p class="text-slate-500 text-xs">Product Manager at StartupXYZ</p>
          </div>
        </div>
      </div>

      <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <div class="flex items-center gap-1 mb-4">
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
        <p class="text-slate-300 text-sm mb-6">"Simple, powerful, and a joy to use. We migrated our entire team in less than a day."</p>
        <div class="flex items-center gap-3">
          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Emily" class="w-10 h-10 rounded-full">
          <div>
            <p class="font-medium text-sm">Emily Rodriguez</p>
            <p class="text-slate-500 text-xs">Engineering Lead at ScaleUp</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-24 px-4 md:px-8">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-3xl md:text-5xl font-bold mb-6">Ready to streamline your workflow?</h2>
    <p class="text-slate-400 text-lg mb-10">Start your free trial today. No credit card required.</p>
    <a href="#" class="inline-block px-10 py-4 gradient-bg rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-indigo-500/25">
      Get Started Free
    </a>
  </div>
</section>

<!-- Footer -->
<footer class="py-16 px-4 md:px-8 border-t border-white/5">
  <div class="max-w-7xl mx-auto">
    <div class="grid md:grid-cols-5 gap-10 mb-12">
      <div class="md:col-span-2">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
            </svg>
          </div>
          <span class="font-bold text-lg">{{productName}}</span>
        </div>
        <p class="text-slate-400 text-sm max-w-xs">Helping teams work smarter, not harder. Built for modern teams.</p>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Product</h4>
        <ul class="space-y-2 text-sm text-slate-400">
          <li><a href="#" class="hover:text-white transition">Features</a></li>
          <li><a href="#" class="hover:text-white transition">Pricing</a></li>
          <li><a href="#" class="hover:text-white transition">Integrations</a></li>
          <li><a href="#" class="hover:text-white transition">Changelog</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Company</h4>
        <ul class="space-y-2 text-sm text-slate-400">
          <li><a href="#" class="hover:text-white transition">About</a></li>
          <li><a href="#" class="hover:text-white transition">Blog</a></li>
          <li><a href="#" class="hover:text-white transition">Careers</a></li>
          <li><a href="#" class="hover:text-white transition">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold mb-4">Legal</h4>
        <ul class="space-y-2 text-sm text-slate-400">
          <li><a href="#" class="hover:text-white transition">Privacy</a></li>
          <li><a href="#" class="hover:text-white transition">Terms</a></li>
          <li><a href="#" class="hover:text-white transition">Security</a></li>
        </ul>
      </div>
    </div>
    <div class="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-slate-500 text-sm">&copy; 2024 {{productName}}. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-slate-400 hover:text-white transition">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
        </a>
        <a href="#" class="text-slate-400 hover:text-white transition">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        <a href="#" class="text-slate-400 hover:text-white transition">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

</body>
</html>`
}
