/**
 * Agency Portfolio Template
 * Modern dark theme creative agency
 */

export const AGENCY_PORTFOLIO_TEMPLATE = {
  id: 'agency-portfolio',
  name: 'Creative Agency',
  description: 'Modern dark theme agency portfolio with bold typography, case studies, and team showcase',
  category: 'agency',
  tags: ['agency', 'portfolio', 'dark', 'creative', 'modern', 'bold'],
  preview: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',

  variables: {
    agencyName: 'APEX',
    tagline: 'Digital Creative Agency',
    heroTitle: 'We Build Digital Experiences',
    heroSubtitle: 'Award-winning creative studio specializing in brand strategy, web design, and digital experiences.',
    primaryColor: '#a855f7',
    projects: [
      { title: 'Brand Refresh', client: 'TechCorp', image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop' },
      { title: 'E-commerce Platform', client: 'StyleHouse', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop' },
      { title: 'Mobile App', client: 'FinanceApp', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop' }
    ],
    stats: [
      { value: '150+', label: 'Projects Delivered' },
      { value: '12', label: 'Years Experience' },
      { value: '40+', label: 'Team Members' },
      { value: '25', label: 'Awards Won' }
    ]
  },

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{agencyName}} - {{tagline}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root { --primary: {{primaryColor}}; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0f;
      color: #ffffff;
    }
    .gradient-text {
      background: linear-gradient(135deg, {{primaryColor}} 0%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(168, 85, 247, 0.15); }
  </style>
</head>
<body class="antialiased">

<!-- Navigation -->
<nav class="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="text-xl font-bold tracking-wider">{{agencyName}}</a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#work" class="text-sm text-gray-400 hover:text-white transition">Work</a>
        <a href="#services" class="text-sm text-gray-400 hover:text-white transition">Services</a>
        <a href="#about" class="text-sm text-gray-400 hover:text-white transition">About</a>
        <a href="#contact" class="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full hover:opacity-90 transition">Let's Talk</a>
      </div>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="relative min-h-screen flex items-center pt-20">
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"></div>
    <div class="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px]"></div>
  </div>

  <div class="relative max-w-7xl mx-auto px-6 lg:px-8 py-32">
    <p class="text-sm font-medium uppercase tracking-[0.3em] text-purple-400 mb-6">{{tagline}}</p>
    <h1 class="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-8">
      {{heroTitle}}
    </h1>
    <p class="max-w-xl text-xl text-gray-400 mb-12 leading-relaxed">{{heroSubtitle}}</p>
    <a href="#work" class="inline-flex items-center gap-2 text-white hover:text-purple-400 transition group">
      <span class="text-lg font-medium">View Our Work</span>
      <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
      </svg>
    </a>
  </div>
</section>

<!-- Stats -->
<section class="py-20 border-y border-white/5">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="text-center">
        <div class="text-4xl md:text-5xl font-bold gradient-text mb-2">150+</div>
        <div class="text-sm text-gray-500 uppercase tracking-wider">Projects Delivered</div>
      </div>
      <div class="text-center">
        <div class="text-4xl md:text-5xl font-bold gradient-text mb-2">12</div>
        <div class="text-sm text-gray-500 uppercase tracking-wider">Years Experience</div>
      </div>
      <div class="text-center">
        <div class="text-4xl md:text-5xl font-bold gradient-text mb-2">40+</div>
        <div class="text-sm text-gray-500 uppercase tracking-wider">Team Members</div>
      </div>
      <div class="text-center">
        <div class="text-4xl md:text-5xl font-bold gradient-text mb-2">25</div>
        <div class="text-sm text-gray-500 uppercase tracking-wider">Awards Won</div>
      </div>
    </div>
  </div>
</section>

<!-- Work Section -->
<section id="work" class="py-32">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-end justify-between mb-16">
      <div>
        <p class="text-sm font-medium uppercase tracking-[0.3em] text-purple-400 mb-4">Selected Work</p>
        <h2 class="text-4xl md:text-5xl font-bold">Featured Projects</h2>
      </div>
      <a href="#" class="hidden md:flex items-center gap-2 text-purple-400 hover:text-purple-300 transition">
        View All
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </a>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <article class="group hover-lift">
        <div class="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-white/5">
          <img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop" alt="Project" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        <p class="text-sm text-purple-400 mb-2">Brand Strategy</p>
        <h3 class="text-xl font-semibold mb-2">TechCorp Brand Refresh</h3>
        <p class="text-gray-500">Complete brand overhaul including visual identity and guidelines.</p>
      </article>

      <article class="group hover-lift">
        <div class="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-white/5">
          <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop" alt="Project" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        <p class="text-sm text-purple-400 mb-2">E-commerce</p>
        <h3 class="text-xl font-semibold mb-2">StyleHouse Platform</h3>
        <p class="text-gray-500">High-converting e-commerce platform with seamless UX.</p>
      </article>

      <article class="group hover-lift">
        <div class="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-white/5">
          <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop" alt="Project" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        <p class="text-sm text-purple-400 mb-2">Mobile App</p>
        <h3 class="text-xl font-semibold mb-2">FinanceApp Mobile</h3>
        <p class="text-gray-500">Award-winning fintech app with 500K+ downloads.</p>
      </article>
    </div>
  </div>
</section>

<!-- Services -->
<section id="services" class="py-32 bg-white/[0.02]">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16">
      <p class="text-sm font-medium uppercase tracking-[0.3em] text-purple-400 mb-4">What We Do</p>
      <h2 class="text-4xl md:text-5xl font-bold">Our Services</h2>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Brand Strategy</h3>
        <p class="text-gray-400">Create a memorable brand identity that resonates with your audience.</p>
      </div>

      <div class="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Web Design</h3>
        <p class="text-gray-400">Beautiful, responsive websites that convert visitors into customers.</p>
      </div>

      <div class="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Mobile Apps</h3>
        <p class="text-gray-400">Native and cross-platform apps with exceptional user experience.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-32">
  <div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
    <h2 class="text-4xl md:text-6xl font-bold mb-6">Ready to Start Your Project?</h2>
    <p class="text-xl text-gray-400 mb-12">Let's create something amazing together.</p>
    <a href="#contact" class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full hover:opacity-90 transition">
      Get in Touch
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
      </svg>
    </a>
  </div>
</section>

<!-- Footer -->
<footer class="py-16 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex flex-col md:flex-row items-center justify-between gap-8">
      <div class="text-2xl font-bold">{{agencyName}}</div>
      <div class="flex items-center gap-6">
        <a href="#" class="text-gray-400 hover:text-white transition">Twitter</a>
        <a href="#" class="text-gray-400 hover:text-white transition">LinkedIn</a>
        <a href="#" class="text-gray-400 hover:text-white transition">Dribbble</a>
        <a href="#" class="text-gray-400 hover:text-white transition">Instagram</a>
      </div>
    </div>
    <div class="mt-12 pt-8 border-t border-white/5 text-center text-sm text-gray-500">
      &copy; 2024 {{agencyName}}. All rights reserved.
    </div>
  </div>
</footer>

</body>
</html>`
}
