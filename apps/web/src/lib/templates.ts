// Static HTML Templates for reliable preview rendering
// These templates are pure HTML with Tailwind CSS - no JSX conversion needed

export interface Template {
  id: string
  name: string
  category: 'landing' | 'portfolio' | 'ecommerce' | 'saas' | 'blog' | 'agency'
  description: string
  thumbnail: string
  html: string
}

export const STATIC_TEMPLATES: Template[] = [
  {
    id: 'modern-saas',
    name: 'Modern SaaS',
    category: 'saas',
    description: 'Clean SaaS landing page with hero, features, pricing',
    thumbnail: '/templates/saas.png',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Modern SaaS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .gradient-text { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body class="bg-slate-950 text-white">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="text-xl font-bold gradient-text">{{projectName}}</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-slate-300 hover:text-white transition">Features</a>
        <a href="#pricing" class="text-slate-300 hover:text-white transition">Pricing</a>
        <a href="#testimonials" class="text-slate-300 hover:text-white transition">Testimonials</a>
        <a href="#faq" class="text-slate-300 hover:text-white transition">FAQ</a>
      </div>
      <div class="flex items-center gap-4">
        <a href="#" class="text-slate-300 hover:text-white transition">Sign In</a>
        <a href="#" class="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-medium hover:opacity-90 transition">Get Started</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-32 pb-20 px-6">
    <div class="max-w-7xl mx-auto text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
        <span class="text-purple-400 text-sm font-medium">New: AI-Powered Features</span>
        <span class="text-purple-400">-&gt;</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        Build faster with <br><span class="gradient-text">{{projectName}}</span>
      </h1>
      <p class="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
        The all-in-one platform that helps you ship products faster. Build, deploy, and scale with confidence.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-purple-500/25">
          Start Free Trial
        </a>
        <a href="#" class="px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-700 transition flex items-center gap-2">
          <span>Watch Demo</span>
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
        </a>
      </div>
      <p class="mt-6 text-sm text-slate-500">No credit card required. 14-day free trial.</p>
    </div>

    <!-- Hero Image/Dashboard Preview -->
    <div class="max-w-6xl mx-auto mt-16">
      <div class="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-purple-500/10">
        <div class="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none"></div>
        <div class="bg-slate-900 p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div class="grid grid-cols-4 gap-4">
            <div class="col-span-1 bg-slate-800 rounded-lg p-4 space-y-3">
              <div class="h-4 bg-slate-700 rounded w-3/4"></div>
              <div class="h-4 bg-slate-700 rounded w-1/2"></div>
              <div class="h-4 bg-purple-500/30 rounded w-full"></div>
              <div class="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
            <div class="col-span-3 bg-slate-800 rounded-lg p-4">
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-slate-700 rounded-lg p-4">
                  <div class="text-2xl font-bold text-white">12,543</div>
                  <div class="text-sm text-slate-400">Total Users</div>
                </div>
                <div class="bg-slate-700 rounded-lg p-4">
                  <div class="text-2xl font-bold text-green-400">+24.5%</div>
                  <div class="text-sm text-slate-400">Growth Rate</div>
                </div>
                <div class="bg-slate-700 rounded-lg p-4">
                  <div class="text-2xl font-bold text-purple-400">$48,290</div>
                  <div class="text-sm text-slate-400">Revenue</div>
                </div>
              </div>
              <div class="h-32 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Logos Section -->
  <section class="py-16 border-y border-slate-800">
    <div class="max-w-7xl mx-auto px-6">
      <p class="text-center text-slate-500 mb-8">Trusted by innovative companies worldwide</p>
      <div class="flex flex-wrap items-center justify-center gap-12 opacity-50">
        <div class="text-2xl font-bold text-slate-400">Stripe</div>
        <div class="text-2xl font-bold text-slate-400">Vercel</div>
        <div class="text-2xl font-bold text-slate-400">Linear</div>
        <div class="text-2xl font-bold text-slate-400">Notion</div>
        <div class="text-2xl font-bold text-slate-400">Figma</div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-24 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Everything you need to scale</h2>
        <p class="text-xl text-slate-400 max-w-2xl mx-auto">Powerful features to help you build, launch, and grow your product faster than ever.</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-purple-500/50 transition group">
          <div class="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Lightning Fast</h3>
          <p class="text-slate-400">Optimized for speed with edge computing and smart caching. Your users get instant responses.</p>
        </div>
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition group">
          <div class="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Enterprise Security</h3>
          <p class="text-slate-400">SOC 2 compliant with end-to-end encryption. Your data is always safe and secure.</p>
        </div>
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-green-500/50 transition group">
          <div class="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Easy Integration</h3>
          <p class="text-slate-400">Connect with your favorite tools in minutes. REST API, webhooks, and native integrations.</p>
        </div>
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-orange-500/50 transition group">
          <div class="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition">
            <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">AI-Powered</h3>
          <p class="text-slate-400">Smart suggestions and automation powered by cutting-edge AI to boost your productivity.</p>
        </div>
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-pink-500/50 transition group">
          <div class="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-500/20 transition">
            <svg class="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Team Collaboration</h3>
          <p class="text-slate-400">Real-time collaboration with your team. Comments, mentions, and activity tracking.</p>
        </div>
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition group">
          <div class="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition">
            <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <h3 class="text-xl font-semibold mb-3">Advanced Analytics</h3>
          <p class="text-slate-400">Deep insights into your business with customizable dashboards and reports.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section id="pricing" class="py-24 px-6 bg-slate-900/50">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
        <p class="text-xl text-slate-400">Choose the plan that's right for you</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl">
          <h3 class="text-lg font-semibold text-slate-400 mb-2">Starter</h3>
          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-4xl font-bold">$19</span>
            <span class="text-slate-400">/month</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Up to 5 team members</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>10 GB storage</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Basic analytics</li>
            <li class="flex items-center gap-3 text-slate-500"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>Custom integrations</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center border border-slate-700 rounded-xl font-medium hover:bg-slate-800 transition">Get Started</a>
        </div>
        <div class="p-8 bg-gradient-to-b from-purple-500/10 to-slate-900 border-2 border-purple-500/50 rounded-2xl relative">
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-sm font-medium">Most Popular</div>
          <h3 class="text-lg font-semibold text-purple-400 mb-2">Pro</h3>
          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-4xl font-bold">$49</span>
            <span class="text-slate-400">/month</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Up to 20 team members</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>100 GB storage</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Advanced analytics</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Custom integrations</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-medium hover:opacity-90 transition">Get Started</a>
        </div>
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl">
          <h3 class="text-lg font-semibold text-slate-400 mb-2">Enterprise</h3>
          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-4xl font-bold">$149</span>
            <span class="text-slate-400">/month</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited team members</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited storage</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Custom analytics</li>
            <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Dedicated support</li>
          </ul>
          <a href="#" class="block w-full py-3 text-center border border-slate-700 rounded-xl font-medium hover:bg-slate-800 transition">Contact Sales</a>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="py-24 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Loved by developers worldwide</h2>
        <p class="text-xl text-slate-400">See what our customers are saying</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div class="flex items-center gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-300 mb-6">"This platform has completely transformed how we build products. The speed and reliability are unmatched."</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full"></div>
            <div>
              <div class="font-medium">Sarah Chen</div>
              <div class="text-sm text-slate-500">CTO at TechCorp</div>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div class="flex items-center gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-300 mb-6">"We reduced our development time by 60%. The integrations just work, and the support team is incredible."</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full"></div>
            <div>
              <div class="font-medium">Michael Torres</div>
              <div class="text-sm text-slate-500">Founder at StartupXYZ</div>
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div class="flex items-center gap-1 mb-4">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <p class="text-slate-300 mb-6">"Best investment we've made. The AI features alone save us hours every week. Highly recommended!"</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full"></div>
            <div>
              <div class="font-medium">Emily Rodriguez</div>
              <div class="text-sm text-slate-500">VP Engineering at Scale</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-24 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <div class="p-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl">
        <h2 class="text-4xl font-bold mb-4">Ready to get started?</h2>
        <p class="text-xl text-white/80 mb-8">Join thousands of developers building faster with {{projectName}}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#" class="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg hover:bg-purple-50 transition shadow-lg">
            Start Free Trial
          </a>
          <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur rounded-xl font-semibold text-lg hover:bg-white/20 transition">
            Talk to Sales
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-16 px-6 border-t border-slate-800">
    <div class="max-w-7xl mx-auto">
      <div class="grid md:grid-cols-5 gap-8 mb-12">
        <div class="md:col-span-2">
          <a href="#" class="text-xl font-bold gradient-text">{{projectName}}</a>
          <p class="text-slate-400 mt-4 max-w-xs">Build faster, scale easier. The modern platform for ambitious teams.</p>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Product</h4>
          <ul class="space-y-2 text-slate-400">
            <li><a href="#" class="hover:text-white transition">Features</a></li>
            <li><a href="#" class="hover:text-white transition">Pricing</a></li>
            <li><a href="#" class="hover:text-white transition">Changelog</a></li>
            <li><a href="#" class="hover:text-white transition">Roadmap</a></li>
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
      <div class="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-slate-500">&copy; 2024 {{projectName}}. All rights reserved.</p>
        <div class="flex items-center gap-4">
          <a href="#" class="text-slate-400 hover:text-white transition">Twitter</a>
          <a href="#" class="text-slate-400 hover:text-white transition">GitHub</a>
          <a href="#" class="text-slate-400 hover:text-white transition">Discord</a>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },
  {
    id: 'portfolio-minimal',
    name: 'Minimal Portfolio',
    category: 'portfolio',
    description: 'Clean portfolio for creatives and developers',
    thumbnail: '/templates/portfolio.png',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-white text-gray-900">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="#" class="text-xl font-bold">{{projectName}}</a>
      <div class="flex items-center gap-8">
        <a href="#work" class="text-gray-600 hover:text-gray-900 transition">Work</a>
        <a href="#about" class="text-gray-600 hover:text-gray-900 transition">About</a>
        <a href="#contact" class="text-gray-600 hover:text-gray-900 transition">Contact</a>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="pt-32 pb-20 px-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-6xl md:text-8xl font-bold leading-tight mb-8">
        Designer &<br>Developer
      </h1>
      <p class="text-xl text-gray-600 max-w-xl">
        I create beautiful digital experiences that help businesses grow. Based in San Francisco.
      </p>
    </div>
  </section>

  <!-- Work Grid -->
  <section id="work" class="py-20 px-6">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-12">Selected Work</h2>
      <div class="grid md:grid-cols-2 gap-8">
        <a href="#" class="group">
          <div class="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-4">
            <div class="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 group-hover:scale-105 transition duration-500"></div>
          </div>
          <h3 class="text-xl font-semibold mb-1">Brand Identity</h3>
          <p class="text-gray-500">Fintech Startup</p>
        </a>
        <a href="#" class="group">
          <div class="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-4">
            <div class="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 group-hover:scale-105 transition duration-500"></div>
          </div>
          <h3 class="text-xl font-semibold mb-1">E-commerce Platform</h3>
          <p class="text-gray-500">Fashion Brand</p>
        </a>
        <a href="#" class="group">
          <div class="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-4">
            <div class="w-full h-full bg-gradient-to-br from-green-400 to-cyan-500 group-hover:scale-105 transition duration-500"></div>
          </div>
          <h3 class="text-xl font-semibold mb-1">Mobile App</h3>
          <p class="text-gray-500">Health & Fitness</p>
        </a>
        <a href="#" class="group">
          <div class="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-4">
            <div class="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 group-hover:scale-105 transition duration-500"></div>
          </div>
          <h3 class="text-xl font-semibold mb-1">Web Application</h3>
          <p class="text-gray-500">SaaS Product</p>
        </a>
      </div>
    </div>
  </section>

  <!-- About -->
  <section id="about" class="py-20 px-6 bg-gray-50">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <div class="aspect-square bg-gray-200 rounded-2xl"></div>
      <div>
        <h2 class="text-4xl font-bold mb-6">About Me</h2>
        <p class="text-gray-600 text-lg mb-6">
          I'm a designer and developer with over 10 years of experience creating digital products. I specialize in brand identity, UI/UX design, and full-stack development.
        </p>
        <p class="text-gray-600 text-lg mb-8">
          When I'm not designing, you can find me hiking, reading, or experimenting with new technologies.
        </p>
        <a href="#" class="inline-flex items-center gap-2 text-lg font-medium hover:gap-4 transition-all">
          Download Resume <span>-&gt;</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="py-20 px-6">
    <div class="max-w-6xl mx-auto text-center">
      <h2 class="text-4xl font-bold mb-6">Let's Work Together</h2>
      <p class="text-xl text-gray-600 mb-8">Have a project in mind? I'd love to hear about it.</p>
      <a href="mailto:hello@example.com" class="inline-block px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition">
        Get in Touch
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-8 px-6 border-t border-gray-100">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <p class="text-gray-500">&copy; 2024 {{projectName}}</p>
      <div class="flex items-center gap-6">
        <a href="#" class="text-gray-500 hover:text-gray-900 transition">Twitter</a>
        <a href="#" class="text-gray-500 hover:text-gray-900 transition">Dribbble</a>
        <a href="#" class="text-gray-500 hover:text-gray-900 transition">LinkedIn</a>
      </div>
    </div>
  </footer>
</body>
</html>`,
  },
  {
    id: 'agency-bold',
    name: 'Bold Agency',
    category: 'agency',
    description: 'Bold agency site with dynamic sections',
    thumbnail: '/templates/agency.png',
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
  <nav class="fixed top-0 left-0 right-0 z-50 px-6 py-6">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <a href="#" class="text-2xl font-bold">{{projectName}}</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#work" class="hover:text-yellow-400 transition">Work</a>
        <a href="#services" class="hover:text-yellow-400 transition">Services</a>
        <a href="#about" class="hover:text-yellow-400 transition">About</a>
        <a href="#contact" class="px-6 py-3 bg-yellow-400 text-black rounded-full font-medium hover:bg-yellow-300 transition">Contact</a>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="min-h-screen flex items-center px-6">
    <div class="max-w-7xl mx-auto pt-20">
      <h1 class="text-7xl md:text-[10rem] font-bold leading-none mb-8">
        WE CREATE<br>
        <span class="text-yellow-400">BRANDS</span>
      </h1>
      <p class="text-2xl text-gray-400 max-w-2xl mb-12">
        A full-service creative agency specializing in branding, digital experiences, and strategic marketing.
      </p>
      <div class="flex items-center gap-6">
        <a href="#work" class="px-8 py-4 bg-white text-black rounded-full font-medium text-lg hover:bg-gray-100 transition">
          View Work
        </a>
        <a href="#" class="flex items-center gap-3 text-lg hover:text-yellow-400 transition">
          <span class="w-12 h-12 border-2 border-current rounded-full flex items-center justify-center">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
          </span>
          Watch Reel
        </a>
      </div>
    </div>
  </section>

  <!-- Marquee -->
  <div class="py-8 bg-yellow-400 text-black overflow-hidden">
    <div class="flex gap-8 animate-marquee whitespace-nowrap">
      <span class="text-2xl font-bold">BRANDING</span>
      <span class="text-2xl">*</span>
      <span class="text-2xl font-bold">STRATEGY</span>
      <span class="text-2xl">*</span>
      <span class="text-2xl font-bold">DIGITAL</span>
      <span class="text-2xl">*</span>
      <span class="text-2xl font-bold">MOTION</span>
      <span class="text-2xl">*</span>
      <span class="text-2xl font-bold">WEB</span>
      <span class="text-2xl">*</span>
    </div>
  </div>

  <!-- Work -->
  <section id="work" class="py-32 px-6">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-5xl font-bold mb-16">Selected Work</h2>
      <div class="space-y-32">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div class="aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden">
            <div class="w-full h-full bg-gradient-to-br from-red-500 to-orange-500"></div>
          </div>
          <div>
            <span class="text-yellow-400 text-sm font-medium">01 / BRANDING</span>
            <h3 class="text-4xl font-bold mt-4 mb-6">Nike Campaign</h3>
            <p class="text-gray-400 text-lg mb-8">A bold rebrand for the iconic sports brand's 2024 summer campaign.</p>
            <a href="#" class="inline-flex items-center gap-2 font-medium hover:text-yellow-400 transition">
              View Project <span>-&gt;</span>
            </a>
          </div>
        </div>
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div class="order-2 md:order-1">
            <span class="text-yellow-400 text-sm font-medium">02 / DIGITAL</span>
            <h3 class="text-4xl font-bold mt-4 mb-6">Spotify Wrapped</h3>
            <p class="text-gray-400 text-lg mb-8">Interactive experience design for Spotify's annual wrapped campaign.</p>
            <a href="#" class="inline-flex items-center gap-2 font-medium hover:text-yellow-400 transition">
              View Project <span>-&gt;</span>
            </a>
          </div>
          <div class="aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden order-1 md:order-2">
            <div class="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section id="services" class="py-32 px-6 bg-gray-950">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-5xl font-bold mb-16">Services</h2>
      <div class="grid md:grid-cols-2 gap-px bg-gray-800">
        <div class="bg-gray-950 p-12">
          <span class="text-6xl font-bold text-gray-800">01</span>
          <h3 class="text-2xl font-bold mt-6 mb-4">Brand Strategy</h3>
          <p class="text-gray-400">Defining your brand's purpose, positioning, and personality to stand out in the market.</p>
        </div>
        <div class="bg-gray-950 p-12">
          <span class="text-6xl font-bold text-gray-800">02</span>
          <h3 class="text-2xl font-bold mt-6 mb-4">Visual Identity</h3>
          <p class="text-gray-400">Creating distinctive visual systems that communicate your brand at every touchpoint.</p>
        </div>
        <div class="bg-gray-950 p-12">
          <span class="text-6xl font-bold text-gray-800">03</span>
          <h3 class="text-2xl font-bold mt-6 mb-4">Digital Experience</h3>
          <p class="text-gray-400">Designing and building websites and apps that engage users and drive results.</p>
        </div>
        <div class="bg-gray-950 p-12">
          <span class="text-6xl font-bold text-gray-800">04</span>
          <h3 class="text-2xl font-bold mt-6 mb-4">Motion Design</h3>
          <p class="text-gray-400">Bringing brands to life through animation, video, and interactive experiences.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-32 px-6">
    <div class="max-w-7xl mx-auto text-center">
      <h2 class="text-6xl md:text-8xl font-bold mb-8">
        LET'S CREATE<br>
        <span class="text-yellow-400">TOGETHER</span>
      </h2>
      <a href="#contact" class="inline-block px-12 py-6 bg-yellow-400 text-black rounded-full font-bold text-xl hover:bg-yellow-300 transition">
        Start a Project
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-16 px-6 border-t border-gray-900">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
      <a href="#" class="text-2xl font-bold">{{projectName}}</a>
      <div class="flex items-center gap-8">
        <a href="#" class="hover:text-yellow-400 transition">Instagram</a>
        <a href="#" class="hover:text-yellow-400 transition">Twitter</a>
        <a href="#" class="hover:text-yellow-400 transition">Dribbble</a>
        <a href="#" class="hover:text-yellow-400 transition">Behance</a>
      </div>
      <p class="text-gray-500">&copy; 2024 {{projectName}}</p>
    </div>
  </footer>
</body>
</html>`,
  },
]

export function getTemplateById(id: string): Template | undefined {
  return STATIC_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return STATIC_TEMPLATES.filter(t => t.category === category)
}

export function applyTemplateVariables(html: string, variables: Record<string, string>): string {
  let result = html
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}
