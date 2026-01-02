// Test script to generate website and test theme switching
const fs = require('fs');
const path = require('path');

// Import the style presets and theme application function
const stylePresetsPath = path.join(__dirname, 'src/lib/builder/style-presets.ts');

// Sample HTML that mimics what the AI would generate
const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskFlow - Modern Project Management</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif}</style>
</head>
<body class="bg-slate-950 text-white">

<!-- NAVIGATION -->
<nav class="fixed top-0 w-full bg-slate-950/80 backdrop-blur-lg border-b border-white/10 z-50">
  <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
    <a href="#" class="text-xl font-bold text-white">TaskFlow</a>
    <div class="hidden md:flex gap-8">
      <a href="#features" class="text-slate-300 hover:text-white transition">Features</a>
      <a href="#pricing" class="text-slate-300 hover:text-white transition">Pricing</a>
      <a href="#testimonials" class="text-slate-300 hover:text-white transition">Testimonials</a>
    </div>
    <a href="#" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">Get Started</a>
  </div>
</nav>

<!-- HERO -->
<section class="min-h-screen flex items-center pt-20 relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-violet-600/20"></div>
  <div class="max-w-7xl mx-auto px-6 py-24 relative z-10">
    <div class="max-w-3xl">
      <span class="inline-block px-4 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-6">
        #1 Project Management Tool
      </span>
      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        Manage Projects<br>
        <span class="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Like Never Before</span>
      </h1>
      <p class="text-xl text-slate-300 mb-8 max-w-xl">
        TaskFlow helps teams collaborate, track progress, and deliver projects on time. Start your free trial today.
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="#" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition shadow-lg shadow-indigo-600/30">
          Start Free Trial
        </a>
        <a href="#" class="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold border border-white/20 transition">
          Watch Demo
        </a>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section id="features" class="py-24 px-6 bg-slate-900/50">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-bold mb-4">Powerful Features</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">Everything you need to manage projects effectively</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3 text-white">Task Management</h3>
        <p class="text-slate-400">Create, assign, and track tasks with ease. Set priorities and deadlines.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3 text-white">Team Collaboration</h3>
        <p class="text-slate-400">Work together in real-time with comments, mentions, and file sharing.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3 text-white">Analytics Dashboard</h3>
        <p class="text-slate-400">Get insights into your team's performance with detailed reports.</p>
      </div>
    </div>
  </div>
</section>

<!-- PRICING -->
<section id="pricing" class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">Choose the plan that works for your team</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <h3 class="text-lg font-semibold text-slate-300 mb-2">Starter</h3>
        <div class="text-4xl font-bold mb-4">$9<span class="text-lg text-slate-400">/mo</span></div>
        <ul class="space-y-3 mb-8 text-slate-300">
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>5 Projects</li>
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>10 Team Members</li>
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Basic Analytics</li>
        </ul>
        <a href="#" class="block text-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition">Get Started</a>
      </div>
      <div class="p-8 bg-gradient-to-b from-indigo-600/20 to-violet-600/20 rounded-2xl border border-indigo-500/30 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 rounded-full text-xs font-semibold">Most Popular</div>
        <h3 class="text-lg font-semibold text-white mb-2">Professional</h3>
        <div class="text-4xl font-bold mb-4">$29<span class="text-lg text-slate-400">/mo</span></div>
        <ul class="space-y-3 mb-8 text-slate-300">
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited Projects</li>
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>50 Team Members</li>
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Advanced Analytics</li>
        </ul>
        <a href="#" class="block text-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition shadow-lg shadow-indigo-600/30">Get Started</a>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <h3 class="text-lg font-semibold text-slate-300 mb-2">Enterprise</h3>
        <div class="text-4xl font-bold mb-4">$99<span class="text-lg text-slate-400">/mo</span></div>
        <ul class="space-y-3 mb-8 text-slate-300">
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Everything in Pro</li>
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited Members</li>
          <li class="flex items-center gap-2"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Priority Support</li>
        </ul>
        <a href="#" class="block text-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition">Contact Sales</a>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section id="testimonials" class="py-24 px-6 bg-slate-900/50">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-bold mb-4">Loved by Teams</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">See what our customers are saying</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <div class="flex items-center gap-4 mb-4">
          <img src="https://i.pravatar.cc/48?img=1" alt="Avatar" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Sarah Johnson</div>
            <div class="text-sm text-slate-400">CEO, TechStart</div>
          </div>
        </div>
        <p class="text-slate-300">"TaskFlow transformed how our team works. We've increased productivity by 40% since switching."</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <div class="flex items-center gap-4 mb-4">
          <img src="https://i.pravatar.cc/48?img=2" alt="Avatar" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Mike Chen</div>
            <div class="text-sm text-slate-400">Product Lead, InnovateCo</div>
          </div>
        </div>
        <p class="text-slate-300">"The best project management tool I've ever used. Simple, powerful, and beautiful."</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <div class="flex items-center gap-4 mb-4">
          <img src="https://i.pravatar.cc/48?img=3" alt="Avatar" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Emily Davis</div>
            <div class="text-sm text-slate-400">Director, DesignHub</div>
          </div>
        </div>
        <p class="text-slate-300">"Finally, a tool that our whole team loves to use. The UI is incredibly intuitive."</p>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="py-12 px-6 border-t border-white/10">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
    <div class="text-slate-400">&copy; 2025 TaskFlow. All rights reserved.</div>
    <div class="flex gap-6">
      <a href="#" class="text-slate-400 hover:text-white transition">Privacy</a>
      <a href="#" class="text-slate-400 hover:text-white transition">Terms</a>
      <a href="#" class="text-slate-400 hover:text-white transition">Contact</a>
    </div>
  </div>
</footer>

</body>
</html>`;

// Save the sample HTML
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save original
fs.writeFileSync(path.join(outputDir, '1-original.html'), sampleHtml);
console.log('✓ Saved original sample website');

console.log('\nSample website generated and saved to:');
console.log('  test-output/1-original.html');
console.log('\nOpen this file in browser to see the original dark theme.');
console.log('Then test theme switching in the workspace at http://localhost:3000/workspace');
