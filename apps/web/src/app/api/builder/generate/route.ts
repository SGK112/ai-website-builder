import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getApiSession } from '@/lib/api-auth'
import { connectDB } from '@/lib/db'
import { generateTextFree, FreeAIProvider } from '@/lib/free-ai-providers'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import {
  User,
  trackUsage,
  checkUsageLimits,
  isAdminEmail,
  PLAN_LIMITS
} from '@ai-website-builder/database'
import { LUXE_ECOMMERCE_TEMPLATE } from '@/lib/templates'

// Improved prompt for small/free AI models (3B-7B parameters)
// Uses chain-of-thought and few-shot prompting based on 2025 best practices
const SIMPLE_SYSTEM_PROMPT = `You are an expert web developer. Generate a COMPLETE, PROFESSIONAL, IMAGE-RICH HTML website.

THINK STEP BY STEP:
1. First, understand the business type and target audience
2. Choose appropriate colors, images, and content tone
3. Structure the page with semantic HTML sections
4. Apply responsive design with mobile-first approach
5. ADD IMAGES TO EVERY SECTION - this is critical for visual appeal
6. Output the complete HTML code

CRITICAL OUTPUT RULES:
1. Output ONLY HTML code - NO markdown, NO \`\`\`, NO explanations
2. Start with <!DOCTYPE html>
3. Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
4. Use dark theme: bg-slate-900/950, text-white, indigo/violet accents
5. Make it responsive with md: and lg: breakpoints
6. Include ALL sections with REAL content (not placeholders)
7. Add SEO meta tags: description, Open Graph, Twitter cards

⚠️ MANDATORY IMAGE REQUIREMENTS - USE THESE EXACT FORMATS:
- Hero background: style="background-image: url('https://picsum.photos/seed/KEYWORD/1920/1080')"
- Logo: <img src="https://picsum.photos/seed/logo/120/40" alt="Logo" class="h-10">
- Feature images: <img src="https://picsum.photos/seed/feature1/600/400" class="rounded-xl">
- Team photos: <img src="https://i.pravatar.cc/150?img=NUMBER" class="rounded-full">
- Product/showcase: <img src="https://picsum.photos/seed/product/800/600" class="rounded-2xl shadow-2xl">
- Gallery: <img src="https://picsum.photos/seed/gallery1/400/300" class="rounded-lg">

KEYWORD EXAMPLES BY BUSINESS TYPE:
- Tech/SaaS: technology, software, coding, laptop, dashboard, analytics
- Restaurant: food, restaurant, chef, dining, cuisine, kitchen
- Fitness: gym, workout, fitness, exercise, health, yoga
- Real Estate: house, home, interior, architecture, building
- Fashion: fashion, clothing, style, boutique, model
- Business: office, meeting, team, corporate, professional

REQUIRED STRUCTURE WITH IMAGES:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Brief compelling description of the business">
  <meta property="og:image" content="https://picsum.photos/seed/brand/1200/630">
  <title>BUSINESS NAME - Tagline</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif}</style>
</head>
<body class="bg-slate-950 text-white">

<!-- NAVIGATION with LOGO IMAGE -->
<nav class="fixed top-0 w-full bg-slate-950/80 backdrop-blur-lg border-b border-white/10 z-50">
  <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
    <a href="#" class="flex items-center gap-2">
      <img src="https://picsum.photos/seed/brandlogo/40/40" alt="Logo" class="h-10 w-10 rounded-lg">
      <span class="text-xl font-bold">BrandName</span>
    </a>
    <div class="hidden md:flex gap-8">
      <a href="#features" class="text-slate-300 hover:text-white transition">Features</a>
      <a href="#about" class="text-slate-300 hover:text-white transition">About</a>
      <a href="#contact" class="text-slate-300 hover:text-white transition">Contact</a>
    </div>
    <a href="#contact" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">Get Started</a>
  </div>
</nav>

<!-- HERO: Full viewport with BACKGROUND IMAGE -->
<section class="min-h-screen flex items-center pt-20 relative overflow-hidden">
  <!-- HERO BACKGROUND IMAGE - Use relevant keyword -->
  <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://picsum.photos/seed/hero/1920/1080')"></div>
  <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/50"></div>
  <div class="max-w-7xl mx-auto px-6 py-24 relative z-10 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <span class="inline-block px-4 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-6">Welcome to Our Platform</span>
      <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">Your Compelling<br><span class="text-indigo-400">Headline Here</span></h1>
      <p class="text-xl text-slate-300 mb-8 max-w-xl">A brief, persuasive description of what you offer and why visitors should care.</p>
      <div class="flex flex-wrap gap-4">
        <a href="#contact" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition shadow-lg shadow-indigo-600/30">Get Started</a>
        <a href="#features" class="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold border border-white/20 transition">Learn More</a>
      </div>
    </div>
    <!-- HERO PRODUCT/APP IMAGE -->
    <div class="hidden md:block">
      <img src="https://picsum.photos/seed/dashboard/800/600" alt="Product Preview" class="rounded-2xl shadow-2xl shadow-indigo-500/20 border border-white/10">
    </div>
  </div>
</section>

<!-- FEATURES: 3-column grid with IMAGES -->
<section id="features" class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">Describe your key benefits here</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Feature card WITH IMAGE -->
      <div class="bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition overflow-hidden group">
        <img src="https://picsum.photos/seed/feature1/600/400" alt="Feature 1" class="w-full h-48 object-cover group-hover:scale-105 transition duration-500">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-3">Feature One</h3>
          <p class="text-slate-400">Describe this feature and its benefits to the customer.</p>
        </div>
      </div>
      <div class="bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition overflow-hidden group">
        <img src="https://picsum.photos/seed/feature2/600/400" alt="Feature 2" class="w-full h-48 object-cover group-hover:scale-105 transition duration-500">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-3">Feature Two</h3>
          <p class="text-slate-400">Describe this feature and its benefits to the customer.</p>
        </div>
      </div>
      <div class="bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition overflow-hidden group">
        <img src="https://picsum.photos/seed/feature3/600/400" alt="Feature 3" class="w-full h-48 object-cover group-hover:scale-105 transition duration-500">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-3">Feature Three</h3>
          <p class="text-slate-400">Describe this feature and its benefits to the customer.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SHOWCASE: Large image with overlapping stats -->
<section class="py-24 px-6 bg-slate-900/50">
  <div class="max-w-7xl mx-auto">
    <div class="relative">
      <img src="https://picsum.photos/seed/showcase/1400/600" alt="Showcase" class="w-full h-96 object-cover rounded-3xl">
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent rounded-3xl"></div>
      <div class="absolute inset-0 flex items-center px-12">
        <div class="max-w-lg">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Trusted by Thousands</h2>
          <p class="text-slate-300 mb-6">Join the growing community of successful businesses using our platform.</p>
          <div class="grid grid-cols-3 gap-6">
            <div><div class="text-3xl font-bold text-indigo-400">10K+</div><div class="text-sm text-slate-400">Users</div></div>
            <div><div class="text-3xl font-bold text-indigo-400">95%</div><div class="text-sm text-slate-400">Satisfaction</div></div>
            <div><div class="text-3xl font-bold text-indigo-400">24/7</div><div class="text-sm text-slate-400">Support</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ABOUT/IMAGE SECTION -->
<section id="about" class="py-24 px-6 bg-slate-900/50">
  <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    <div>
      <h2 class="text-3xl md:text-4xl font-bold mb-6">About Our Company</h2>
      <p class="text-slate-300 mb-6">Tell your story here. What makes you unique? Why should customers trust you?</p>
      <ul class="space-y-3 text-slate-300">
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Key benefit or fact</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Another important point</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Third compelling reason</li>
      </ul>
    </div>
    <div>
      <img src="https://picsum.photos/seed/business/600/400" alt="About" class="rounded-2xl shadow-2xl">
    </div>
  </div>
</section>

<!-- CTA SECTION -->
<section class="py-24 px-6">
  <div class="max-w-4xl mx-auto text-center p-12 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 rounded-3xl border border-white/10">
    <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
    <p class="text-slate-300 mb-8 max-w-xl mx-auto">Take action today and join thousands of satisfied customers.</p>
    <a href="#" class="inline-block px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition">Start Free Trial</a>
  </div>
</section>

<!-- FOOTER -->
<footer class="py-12 px-6 border-t border-white/10">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
    <div class="text-slate-400">&copy; 2025 BrandName. All rights reserved.</div>
    <div class="flex gap-6">
      <a href="#" class="text-slate-400 hover:text-white transition">Privacy</a>
      <a href="#" class="text-slate-400 hover:text-white transition">Terms</a>
      <a href="#" class="text-slate-400 hover:text-white transition">Contact</a>
    </div>
  </div>
</footer>

</body>
</html>

NOW: Based on the user's request, generate a COMPLETE website following this exact structure. Replace ALL placeholder text with REAL, relevant content for their business. Use appropriate images. Output ONLY the HTML code.`

// Professional-grade system prompt for high-quality website generation
const ENHANCED_SYSTEM_PROMPT = `You are an elite web designer and full-stack developer creating stunning, production-ready websites. Generate COMPLETE HTML pages that look like they were built by a top-tier agency.

CRITICAL OUTPUT RULES:
1. Start with exactly: <!DOCTYPE html>
2. Return ONLY the HTML - no markdown, no \`\`\`, no explanations
3. Generate a COMPLETE, production-ready website
4. Code must be clean, semantic, and accessible

REQUIRED HEAD STRUCTURE (include exactly):
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Site description">
  <title>Site Title</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
          colors: {
            primary: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
            secondary: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7c3aed', 800: '#6d28d9', 900: '#5b21b6' }
          },
          animation: {
            'fade-in': 'fadeIn 0.6s ease-out',
            'fade-in-up': 'fadeInUp 0.6s ease-out',
            'fade-in-down': 'fadeInDown 0.6s ease-out',
            'slide-up': 'slideUp 0.5s ease-out',
            'slide-in-right': 'slideInRight 0.5s ease-out',
            'float': 'float 6s ease-in-out infinite',
            'pulse-slow': 'pulse 3s ease-in-out infinite',
            'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
            'shimmer': 'shimmer 2s linear infinite',
          },
          backdropBlur: { xs: '2px' },
          boxShadow: {
            'glow-sm': '0 0 20px -5px rgba(99, 102, 241, 0.3)',
            'glow': '0 0 40px -10px rgba(99, 102, 241, 0.4)',
            'glow-lg': '0 0 60px -15px rgba(99, 102, 241, 0.5)',
          }
        }
      }
    }
  </script>
  <style>
    /* Smooth animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
    @keyframes bounceSoft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

    /* Scroll-triggered animations */
    .animate-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
    .animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
    .animate-on-scroll.from-left { transform: translateX(-30px); }
    .animate-on-scroll.from-right { transform: translateX(30px); }
    .animate-on-scroll.visible.from-left, .animate-on-scroll.visible.from-right { transform: translateX(0); }

    /* Utility classes */
    .text-gradient { background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .bg-gradient-radial { background: radial-gradient(ellipse at center, var(--tw-gradient-from), var(--tw-gradient-to)); }
    .glass { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .glass-dark { background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }

    /* Selection styling */
    ::selection { background: rgba(99, 102, 241, 0.3); color: #fff; }

    /* Smooth scrolling */
    html { scroll-behavior: smooth; }

    /* Focus states for accessibility */
    *:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
    ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.5); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.7); }
  </style>
</head>

DESIGN EXCELLENCE REQUIREMENTS:

1. VISUAL HIERARCHY
- Clear typographic scale: text-7xl for hero, text-4xl for section titles, text-xl for subtitles
- Generous whitespace: py-24 or py-32 for sections, gap-8 or gap-12 for grids
- Consistent spacing system throughout

2. COLOR PALETTE (Modern Dark Theme)
- Background gradient: bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950
- Primary accent: indigo-500/600 for buttons/links
- Secondary accent: purple-500/violet-500 for gradients
- Text: text-white for headings, text-slate-300 for body, text-slate-500 for muted
- Glass effects: bg-white/5 backdrop-blur-xl border border-white/10

3. MODERN UI PATTERNS
- Glassmorphism: backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl
- Gradient text: bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent
- Subtle grid patterns: Use CSS background with dot grid
- Glowing effects: shadow-lg shadow-indigo-500/25
- Smooth hover states: hover:scale-105 transition-all duration-300

4. PROFESSIONAL COMPONENTS

Navigation:
<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-slate-300 hover:text-white transition">Link</a>
    </div>
    <a href="#" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition">CTA</a>
  </div>
</nav>

Hero Section:
<section class="relative min-h-screen flex items-center pt-20 overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent"></div>
  <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0); background-size: 40px 40px;"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-6 py-24">
    <div class="max-w-4xl">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
        <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
        <span class="text-indigo-300 text-sm font-medium">Announcement text</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
        Main Headline <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Highlight</span>
      </h1>
      <p class="text-xl text-slate-300 mb-10 max-w-2xl">Compelling subheadline that explains the value proposition.</p>
      <div class="flex flex-wrap gap-4">
        <a href="#" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-500/25">Primary CTA</a>
        <a href="#" class="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition">Secondary CTA</a>
      </div>
    </div>
  </div>
</section>

Feature Cards:
<div class="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-indigo-500/30 transition group">
  <div class="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition">
    <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  </div>
  <h3 class="text-xl font-semibold text-white mb-3">Feature Title</h3>
  <p class="text-slate-400">Feature description that explains the benefit clearly and concisely.</p>
</div>

Stats Section:
<div class="text-center">
  <div class="text-5xl font-bold text-white mb-2">10K+</div>
  <div class="text-slate-400">Happy Customers</div>
</div>

Testimonial Card:
<div class="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
  <div class="flex items-center gap-1 mb-4">★★★★★</div>
  <p class="text-slate-300 mb-6 italic">"Testimonial quote that builds trust and credibility."</p>
  <div class="flex items-center gap-4">
    <img src="https://i.pravatar.cc/48?img=1" alt="Avatar" class="w-12 h-12 rounded-full">
    <div>
      <div class="font-semibold text-white">Name</div>
      <div class="text-sm text-slate-500">Title, Company</div>
    </div>
  </div>
</div>

Pricing Card:
<div class="p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 relative">
  <div class="absolute -top-3 right-6 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">Popular</div>
  <h3 class="text-xl font-semibold text-white mb-2">Plan Name</h3>
  <div class="flex items-baseline gap-1 mb-6">
    <span class="text-4xl font-bold text-white">$29</span>
    <span class="text-slate-500">/month</span>
  </div>
  <ul class="space-y-3 mb-8">
    <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Feature item</li>
  </ul>
  <a href="#" class="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-center transition">Get Started</a>
</div>

5. ⚠️ MANDATORY IMAGE REQUIREMENTS - EVERY WEBSITE MUST HAVE IMAGES:

Use ONLY these reliable sources (they ALWAYS work):

AVATARS (for testimonials, team members):
- https://i.pravatar.cc/SIZE?img=NUMBER (NUMBER from 1-70)
- Example: https://i.pravatar.cc/100?img=1

GENERAL IMAGES (for hero, features, backgrounds):
- https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT
- Example: https://picsum.photos/seed/business/800/600
- Example: https://picsum.photos/seed/tech/600/400
- Example: https://picsum.photos/seed/office/1200/800

REQUIRED IMAGE PLACEMENTS (DO NOT SKIP ANY):

A. HERO SECTION (MANDATORY background image):
<section class="relative min-h-screen" style="background-image: url('https://picsum.photos/seed/KEYWORD/1920/1080'); background-size: cover; background-position: center;">
  <div class="absolute inset-0 bg-slate-950/70"></div>
  <!-- content with relative z-10 -->
</section>

B. NAVIGATION LOGO (MANDATORY):
<img src="https://picsum.photos/seed/logo/120/40" alt="Logo" class="h-10">

C. FEATURE/SERVICE IMAGES (at least 3):
<img src="https://picsum.photos/seed/feature1/600/400" alt="Feature" class="rounded-xl">
<img src="https://picsum.photos/seed/feature2/600/400" alt="Feature" class="rounded-xl">
<img src="https://picsum.photos/seed/feature3/600/400" alt="Feature" class="rounded-xl">

D. TESTIMONIAL AVATARS (at least 3):
<img src="https://i.pravatar.cc/150?img=1" alt="Customer" class="w-16 h-16 rounded-full">
<img src="https://i.pravatar.cc/150?img=2" alt="Customer" class="w-16 h-16 rounded-full">
<img src="https://i.pravatar.cc/150?img=3" alt="Customer" class="w-16 h-16 rounded-full">

E. TEAM/ABOUT IMAGES (if applicable):
<img src="https://i.pravatar.cc/200?img=10" alt="Team Member" class="rounded-xl">

KEYWORD EXAMPLES BY INDUSTRY (use relevant keywords):
- Fitness/Gym: gym, fitness, workout, training, weights
- Restaurant: food, restaurant, dining, chef, kitchen
- Tech/SaaS: tech, software, computer, coding, dashboard
- Real Estate: house, home, building, interior, architecture
- Healthcare: doctor, medical, health, clinic, hospital
- E-commerce: product, shopping, retail, fashion, store
- Agency: team, office, meeting, creative, design

CRITICAL: Do NOT use images.unsplash.com - these require real photo IDs.
ALWAYS use picsum.photos/seed/KEYWORD format for reliable images.
NEVER generate a website without at least 5-7 images!

6. SVG ICONS - Use Heroicons style:
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="..."/>
</svg>

REQUIRED SECTIONS (in order):
1. Fixed Navigation with glassmorphic blur effect
2. Hero with gradient accents, announcement badge, dot grid background
3. Logo cloud / social proof bar
4. Features grid (6 features in 3x2 grid)
5. Large feature showcase (alternating image + text)
6. Stats bar with impressive numbers
7. Testimonials (3 cards in grid)
8. Pricing section (3 tiers)
9. FAQ accordion
10. CTA section with gradient background
11. Footer with multiple columns

MULTI-FUNCTION WEBSITE SUPPORT:
When the user requests multiple features (e.g., "e-commerce + booking + blog"), include ALL requested functionality:

BOOKING SYSTEM:
<section id="booking" class="py-24 bg-slate-900/50">
  <div class="max-w-4xl mx-auto px-6">
    <h2 class="text-4xl font-bold text-center mb-12">Book an Appointment</h2>
    <form class="grid md:grid-cols-2 gap-6 p-8 bg-white/5 rounded-2xl border border-white/10">
      <input type="text" placeholder="Your Name" class="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500">
      <input type="email" placeholder="Email" class="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500">
      <input type="date" class="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
      <select class="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
        <option>Select Service</option>
        <option>Consultation</option>
        <option>Full Service</option>
      </select>
      <textarea placeholder="Message" class="md:col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 h-32"></textarea>
      <button type="submit" class="md:col-span-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition">Book Now</button>
    </form>
  </div>
</section>

E-COMMERCE / PRODUCTS:
<section id="products" class="py-24">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-4xl font-bold text-center mb-12">Our Products</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Product cards with image, title, price, add to cart button -->
    </div>
  </div>
</section>

CONTACT FORM:
<section id="contact" class="py-24 bg-slate-900/50">
  <div class="max-w-2xl mx-auto px-6">
    <h2 class="text-4xl font-bold text-center mb-12">Get in Touch</h2>
    <form class="space-y-6 p-8 bg-white/5 rounded-2xl border border-white/10">
      <!-- Name, email, phone, message fields -->
      <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition">Send Message</button>
    </form>
  </div>
</section>

BLOG/NEWS:
<section id="blog" class="py-24">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-4xl font-bold text-center mb-12">Latest News</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Blog cards with image, date, title, excerpt -->
    </div>
  </div>
</section>

GALLERY/PORTFOLIO:
<section id="gallery" class="py-24 bg-slate-900/50">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-4xl font-bold text-center mb-12">Our Work</h2>
    <div class="grid md:grid-cols-4 gap-4">
      <!-- Image grid with hover effects -->
    </div>
  </div>
</section>

TEAM SECTION:
<section id="team" class="py-24">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-4xl font-bold text-center mb-12">Meet Our Team</h2>
    <div class="grid md:grid-cols-4 gap-8">
      <!-- Team member cards with photo, name, role, social links -->
    </div>
  </div>
</section>

When combining features, ensure smooth navigation between all sections and maintain consistent styling throughout.

7. INTERACTIVITY - Add this enhanced script before </body>:
<script>
(function() {
  'use strict';

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80; // Account for fixed header
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // Intersection Observer for scroll animations
  const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Add stagger delay for children if they have data-delay
        entry.target.querySelectorAll('[data-delay]').forEach((el, i) => {
          el.style.transitionDelay = \`\${i * 100}ms\`;
        });
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => animateOnScroll.observe(el));

  // Mobile menu toggle with animation
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      mobileToggle.setAttribute('aria-expanded', mobileMenu.classList.contains('hidden') ? 'false' : 'true');
    });
  }

  // Navbar background on scroll
  const navbar = document.querySelector('nav');
  if (navbar) {
    const updateNavbar = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('bg-slate-950/95', 'shadow-lg');
        navbar.classList.remove('bg-slate-950/80');
      } else {
        navbar.classList.remove('bg-slate-950/95', 'shadow-lg');
        navbar.classList.add('bg-slate-950/80');
      }
    };
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();
  }

  // FAQ Accordion functionality
  document.querySelectorAll('[data-accordion-trigger]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const content = trigger.nextElementSibling;
      const icon = trigger.querySelector('[data-accordion-icon]');
      const isOpen = content.classList.contains('max-h-0');

      // Close all other accordions
      document.querySelectorAll('[data-accordion-content]').forEach(el => {
        el.classList.add('max-h-0');
        el.classList.remove('max-h-96');
      });
      document.querySelectorAll('[data-accordion-icon]').forEach(el => {
        el.style.transform = 'rotate(0deg)';
      });

      if (isOpen) {
        content.classList.remove('max-h-0');
        content.classList.add('max-h-96');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });

  // Counter animation for stats
  document.querySelectorAll('[data-count]').forEach(counter => {
    const target = parseInt(counter.getAttribute('data-count'), 10);
    const duration = 2000;
    const startTime = Date.now();

    const updateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      counter.textContent = Math.floor(target * eased).toLocaleString();

      if (progress < 1) requestAnimationFrame(updateCounter);
      else counter.textContent = target.toLocaleString();
    };

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        updateCounter();
        observer.disconnect();
      }
    });
    observer.observe(counter);
  });

  // Form validation
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = '✓ Submitted!';
          btn.classList.add('bg-green-600');
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.classList.remove('bg-green-600');
            form.reset();
          }, 2000);
        }, 1500);
      }
    });
  });

  // Lazy load images
  document.querySelectorAll('img[data-src]').forEach(img => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
        observer.disconnect();
      }
    });
    observer.observe(img);
  });

})();
</script>

ACCESSIBILITY REQUIREMENTS:
- Use semantic HTML5 elements (header, nav, main, section, article, aside, footer)
- Include ARIA labels where needed (aria-label, aria-expanded, aria-hidden)
- Ensure color contrast meets WCAG AA standards
- Make all interactive elements keyboard accessible
- Add alt text to all images

Generate a complete, stunning website. No placeholders - fill in realistic content. Return ONLY the HTML.`

// E-commerce detection - identifies when user wants an online store
function isEcommerceRequest(prompt: string): boolean {
  const ecommerceKeywords = [
    'e-commerce', 'ecommerce', 'online store', 'shop', 'shopping',
    'products', 'cart', 'checkout', 'boutique', 'store', 'retail',
    'merchandise', 'sell online', 'product catalog', 'fashion',
    'clothing', 'accessories', 'jewelry', 'luxury', 'handbags'
  ]
  const lowerPrompt = prompt.toLowerCase()
  return ecommerceKeywords.some(keyword => lowerPrompt.includes(keyword))
}

// Premium E-commerce System Prompt - Uses Luxe template as reference
const ECOMMERCE_SYSTEM_PROMPT = `You are an elite e-commerce web designer specializing in luxury, high-converting online stores. Generate COMPLETE, PRODUCTION-READY HTML that rivals top brands like Apple, Coach, and Net-a-Porter.

CRITICAL OUTPUT RULES:
1. Start with exactly: <!DOCTYPE html>
2. Return ONLY the HTML - no markdown, no \`\`\`, no explanations
3. Generate a COMPLETE, production-ready e-commerce website
4. Code must be clean, semantic, and accessible

DESIGN PHILOSOPHY - APPLE-INSPIRED LUXURY:
- Minimalist elegance with generous whitespace
- Light theme with subtle gray tints (not pure white)
- Serif fonts for headings (Playfair Display), Sans-serif for body (Inter)
- Subtle hover animations and smooth transitions
- Photography-focused design with large product images
- Premium feel through restraint, not excess

COLOR PALETTE (Luxury Light Theme):
:root {
  --white: #ffffff;
  --white-soft: #fafafa;
  --white-muted: #f5f5f5;
  --gray-light: #e8e8e8;
  --gray-medium: #86868b;
  --black-soft: #1d1d1f;
  --accent: #bf4800; /* Use brand color from user request or this default */
}

REQUIRED STRUCTURE - Follow this premium e-commerce layout:

1. FIXED NAVIGATION (Glassmorphic)
- Logo on left, centered nav links, cart/search icons on right
- Sticky with blur backdrop
- Clean, minimal with good spacing

2. HERO SECTION (Full viewport, Ken Burns effect optional)
- Large lifestyle/product photography background
- Gradient overlays for text readability
- Elegant headline with serif font
- Subtitle with tracking-wide uppercase
- CTA button with rounded-full style

3. TRUST BADGES BAR
- Free Shipping, Easy Returns, Secure Checkout, Authentic Products
- Icons with small text, horizontal layout
- Subtle border-bottom separator

4. FEATURED PRODUCTS GRID
- 2 cols mobile, 4 cols desktop
- Product cards with:
  - Aspect ratio 4:5 images
  - Hover zoom effect on images
  - "Quick Add" button that appears on hover
  - NEW/SALE badges
  - Product name (small, medium font weight)
  - Price (with strikethrough for sale items)

5. CATEGORY SECTIONS
- Large category images with overlay text
- 2-3 cols responsive grid
- Hover scale effect

6. PROMOTIONAL BANNER
- Dark background (#1d1d1f)
- Centered text layout
- "Limited Time" or "Holiday Sale" messaging
- Strong CTA

7. MORE PRODUCTS / BESTSELLERS
- Same grid layout as featured products
- Different product selection

8. NEWSLETTER SECTION
- Email input with Join button
- "Get 15% off your first order" incentive

9. FOOTER
- Multi-column layout (Shop, Help, About, Newsletter)
- Social media icons
- Copyright and legal links

REFERENCE TEMPLATE - Study this luxury e-commerce code for quality standards:

\`\`\`html
${LUXE_ECOMMERCE_TEMPLATE.html.slice(0, 8000)}...
\`\`\`

PRODUCT CARD PATTERN (Use this exact structure):
<div class="group cursor-pointer">
  <div class="relative aspect-[4/5] bg-gray-100 mb-4 overflow-hidden">
    <img src="[PRODUCT_IMAGE]" alt="[PRODUCT_NAME]" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
    <button class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur py-3 text-xs tracking-[0.15em] uppercase font-medium opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
      Quick Add
    </button>
    <span class="absolute top-4 left-4 bg-black text-white text-[10px] tracking-wider px-3 py-1">NEW</span>
  </div>
  <h3 class="text-sm font-medium mb-1">[PRODUCT_NAME]</h3>
  <p class="text-sm text-gray-500">$[PRICE]</p>
</div>

⚠️ MANDATORY IMAGE REQUIREMENTS - E-COMMERCE SITES NEED MANY IMAGES:

Use https://picsum.photos/seed/[keyword]/[width]/[height] for ALL images (they ALWAYS work)

REQUIRED PLACEMENTS:
A. HERO BACKGROUND (MANDATORY - full width):
style="background-image: url('https://picsum.photos/seed/luxury/1920/1080'); background-size: cover;"

B. LOGO (MANDATORY):
<img src="https://picsum.photos/seed/logo/120/40" alt="Brand Logo" class="h-10">

C. PRODUCT IMAGES (at least 8 products):
- https://picsum.photos/seed/product1/400/500
- https://picsum.photos/seed/product2/400/500
- https://picsum.photos/seed/bag1/400/500
- https://picsum.photos/seed/shoe1/400/500
... use descriptive keywords for the product type

D. CATEGORY IMAGES (at least 3):
- https://picsum.photos/seed/fashion/600/800
- https://picsum.photos/seed/accessories/600/800
- https://picsum.photos/seed/newcollection/600/800

E. PROMOTIONAL BANNERS:
- https://picsum.photos/seed/sale/1200/600
- https://picsum.photos/seed/collection/1400/700

KEYWORD EXAMPLES BY PRODUCT TYPE:
- Fashion: dress, shirt, jacket, outfit, style
- Bags: bag, handbag, purse, tote, clutch
- Shoes: shoe, sneaker, heel, boot, sandal
- Jewelry: ring, necklace, watch, bracelet
- Home: furniture, decor, lamp, rug, pillow

CRITICAL: Never use placeholder URLs or broken images.
ALWAYS generate at least 10-15 images for e-commerce sites!

ANIMATIONS TO INCLUDE:
- @keyframes kenBurns { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
- Hover transitions: scale, opacity, transform
- Group-hover effects for product cards

Generate a COMPLETE, BEAUTIFUL e-commerce website based on the user's specific requirements. Match or exceed the quality of the reference template. Return ONLY the HTML.`

// Fix broken image URLs - replace unsplash with reliable picsum
function fixImageUrls(html: string): string {
  let result = html

  // Replace Unsplash URLs with Picsum equivalents
  // Match patterns like: https://images.unsplash.com/photo-XXXXX?w=600&h=400...
  result = result.replace(
    /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+\?[^"'\s]*/g,
    (match) => {
      // Extract dimensions if present
      const widthMatch = match.match(/w=(\d+)/)
      const heightMatch = match.match(/h=(\d+)/)
      const width = widthMatch ? widthMatch[1] : '800'
      const height = heightMatch ? heightMatch[1] : '600'
      // Generate a random seed based on the original URL
      const seed = match.replace(/[^a-zA-Z]/g, '').slice(0, 10) || 'image'
      return `https://picsum.photos/seed/${seed}/${width}/${height}`
    }
  )

  // Also fix source.unsplash.com URLs
  result = result.replace(
    /https:\/\/source\.unsplash\.com\/[^"'\s]+/g,
    (match) => {
      // Extract dimensions if present (e.g., /800x600/)
      const sizeMatch = match.match(/\/(\d+)x(\d+)/)
      const width = sizeMatch ? sizeMatch[1] : '800'
      const height = sizeMatch ? sizeMatch[2] : '600'
      const seed = match.replace(/[^a-zA-Z]/g, '').slice(0, 10) || 'photo'
      return `https://picsum.photos/seed/${seed}/${width}/${height}`
    }
  )

  return result
}

// Ensure HTML has required elements
function ensureCompleteHtml(html: string): string {
  let result = html.trim()

  // Fix broken image URLs first
  result = fixImageUrls(result)

  // Remove markdown code blocks more thoroughly
  // Handle ```html at start
  if (result.startsWith('```html')) {
    result = result.slice(7)
  } else if (result.startsWith('```')) {
    result = result.slice(3)
  }
  // Handle ``` at end (may have newlines before it)
  result = result.replace(/\n?```\s*$/, '')
  result = result.trim()

  // Also handle case where AI starts with "Here's your website:" etc.
  const doctypeIndex = result.toLowerCase().indexOf('<!doctype')
  if (doctypeIndex > 0 && doctypeIndex < 200) {
    result = result.slice(doctypeIndex)
  }

  // If doesn't start with DOCTYPE, wrap it
  if (!result.toLowerCase().startsWith('<!doctype')) {
    // Check if it's just body content
    if (!result.toLowerCase().includes('<html')) {
      result = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
          colors: { primary: '#6366f1', secondary: '#8b5cf6' }
        }
      }
    }
  </script>
  <style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body class="bg-slate-950 text-white min-h-screen font-sans antialiased">
${result}
</body>
</html>`
    }
  }

  // Ensure Tailwind CDN is present
  if (!result.includes('cdn.tailwindcss.com')) {
    result = result.replace(
      '</head>',
      `  <script src="https://cdn.tailwindcss.com"></script>
</head>`
    )
  }

  // MANDATORY: Inject interactivity script to make all buttons/forms functional
  const interactivityScript = `
<script>
(function() {
  'use strict';

  // ===== SMOOTH SCROLLING FOR ALL ANCHOR LINKS =====
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!') {
        e.preventDefault();
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ===== MOBILE MENU TOGGLE =====
  const mobileToggle = document.querySelector('[data-mobile-toggle], .mobile-menu-toggle, button[aria-label*="menu" i]');
  const mobileMenu = document.querySelector('[data-mobile-menu], .mobile-menu, nav ul.hidden');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
        mobileMenu.classList.toggle('flex');
      }
      // Toggle hamburger to X animation
      const spans = mobileToggle.querySelectorAll('span');
      spans.forEach(span => span.classList.toggle('rotate-45'));
    });
  }

  // ===== NAVBAR BACKGROUND ON SCROLL =====
  const navbar = document.querySelector('nav, header');
  if (navbar) {
    const updateNav = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('shadow-lg');
        navbar.style.background = 'rgba(15, 23, 42, 0.95)';
      } else {
        navbar.classList.remove('shadow-lg');
        navbar.style.background = '';
      }
    };
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  // ===== FORM SUBMISSION HANDLER =====
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"], input[type="submit"]');
      const originalText = btn ? btn.innerHTML : '';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>';
      }

      // Simulate form submission (in production, this would POST to a real endpoint)
      setTimeout(() => {
        if (btn) {
          btn.innerHTML = '✓ Success!';
          btn.classList.remove('bg-indigo-600');
          btn.classList.add('bg-green-600');
        }
        this.reset();

        setTimeout(() => {
          if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.classList.remove('bg-green-600');
            btn.classList.add('bg-indigo-600');
          }
        }, 2000);
      }, 1500);
    });
  });

  // ===== CTA BUTTON CLICK HANDLERS =====
  document.querySelectorAll('a[href="#"], button:not([type]), .cta-button').forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (this.getAttribute('href') === '#') {
        e.preventDefault();
        // Scroll to contact or first form section
        const contactSection = document.querySelector('#contact, #form, form, [id*="contact"]');
        if (contactSection) {
          const offset = 80;
          const top = contactSection.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        } else {
          // Show a simple alert if no contact section
          alert('Thank you for your interest! This feature will be available soon.');
        }
      }
    });
  });

  // ===== FAQ ACCORDION =====
  document.querySelectorAll('[data-accordion], .faq-item, .accordion-item').forEach(item => {
    const trigger = item.querySelector('button, [role="button"], .faq-question');
    const content = item.querySelector('[data-content], .faq-answer, .accordion-content, p');
    if (trigger && content) {
      content.style.maxHeight = '0';
      content.style.overflow = 'hidden';
      content.style.transition = 'max-height 0.3s ease';

      trigger.addEventListener('click', () => {
        const isOpen = content.style.maxHeight !== '0px';
        content.style.maxHeight = isOpen ? '0px' : content.scrollHeight + 'px';
        const icon = trigger.querySelector('svg, [class*="chevron"]');
        if (icon) icon.style.transform = isOpen ? '' : 'rotate(180deg)';
      });
    }
  });

  // ===== SCROLL REVEAL ANIMATIONS =====
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('section, .card, article, [class*="animate"]').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // ===== COUNTER ANIMATION FOR STATS =====
  document.querySelectorAll('[data-count], .stat-number').forEach(counter => {
    const target = parseInt(counter.textContent.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target)) return;

    counter.textContent = '0';
    const countObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let current = 0;
        const step = target / 50;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            counter.textContent = target.toLocaleString() + (counter.dataset.suffix || '+');
            clearInterval(timer);
          } else {
            counter.textContent = Math.floor(current).toLocaleString();
          }
        }, 30);
        countObserver.disconnect();
      }
    });
    countObserver.observe(counter);
  });

  console.log('✅ WebStew interactivity loaded');
})();
</script>`;

  // Inject script before </body> if not already present
  if (!result.includes('WebStew interactivity loaded')) {
    if (result.includes('</body>')) {
      result = result.replace('</body>', interactivityScript + '\n</body>');
    } else {
      result += interactivityScript;
    }
  }

  return result
}

// Types for WebStew ingredients
interface StewIngredient {
  id: string
  type: 'image' | 'document' | 'text' | 'link' | 'spreadsheet'
  name: string
  content: string
  preview?: string
  metadata?: {
    width?: number
    height?: number
    size?: number
    mimeType?: string
    extractedText?: string
    rows?: number
    columns?: number
  }
  category?: string
  tags?: string[]
  validation?: {
    isValid: boolean
    tested: boolean
    error?: string
  }
}

// Validate that image data is properly formatted
function validateImageData(dataUrl: string): boolean {
  if (!dataUrl) return false
  const pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/]+=*$/
  return pattern.test(dataUrl.slice(0, 100)) && dataUrl.length > 100
}

// Create a unique marker for each image to track it through generation
function createImageMarkers(images: StewIngredient[]): Map<string, string> {
  const markers = new Map<string, string>()
  images.forEach((img, idx) => {
    // Create a short unique ID for each image
    const marker = `__IMG_${idx}_${img.id.slice(-6)}__`
    markers.set(marker, img.content)
  })
  return markers
}

// Replace markers back with actual image data
function restoreImageData(html: string, markers: Map<string, string>): string {
  let result = html
  markers.forEach((imageData, marker) => {
    result = result.replace(new RegExp(marker, 'g'), imageData)
  })
  return result
}

// Verify all images in HTML are valid
function verifyImagesInHtml(html: string): { valid: boolean; imageCount: number; errors: string[] } {
  const errors: string[] = []
  let imageCount = 0

  // Find all img tags with src
  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match

  while ((match = imgPattern.exec(html)) !== null) {
    imageCount++
    const src = match[1]

    // Check if it's a base64 image
    if (src.startsWith('data:image/')) {
      if (!validateImageData(src)) {
        errors.push(`Image ${imageCount}: Invalid base64 format`)
      }
    } else if (src.startsWith('http')) {
      // External image - OK
    } else {
      errors.push(`Image ${imageCount}: Unknown source format`)
    }
  }

  return { valid: errors.length === 0, imageCount, errors }
}

// Service credentials type for full-stack generation
interface ServiceCredentials {
  // Database
  MONGODB_URI?: string
  REDIS_URL?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  // Payments
  STRIPE_SECRET_KEY?: string
  STRIPE_PUBLISHABLE_KEY?: string
  // Communications
  SENDGRID_API_KEY?: string
  TWILIO_AUTH_TOKEN?: string
  TWILIO_ACCOUNT_SID?: string
  // AI Generation
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  RUNPOD_FLUX_ENDPOINT?: string
  // Media
  PIXABAY_API_KEY?: string
  // Deployment
  GITHUB_ACCESS_TOKEN?: string
  RENDER_API_KEY?: string
}

// Build prompt with WebStew ingredients - IMAGES ARE CRITICAL
// This uses image markers to safely pass images through AI generation
function buildPromptWithIngredients(
  prompt: string,
  ingredients: StewIngredient[],
  currentHtml?: string,
  serviceCredentials?: ServiceCredentials,
  outputMode: 'static' | 'nextjs' | 'react' = 'static'
): { prompt: string; imageMarkers: Map<string, string> } {
  let enhancedPrompt = prompt
  const imageMarkers = new Map<string, string>()

  if (ingredients && ingredients.length > 0) {
    // Only use validated images
    const images = ingredients.filter(i =>
      i.type === 'image' &&
      (i.validation?.isValid !== false) // Include if valid or not tested
    )
    const textContent = ingredients.filter(i => i.type === 'text' || i.type === 'document')
    const spreadsheets = ingredients.filter(i => i.type === 'spreadsheet')
    const links = ingredients.filter(i => i.type === 'link')

    // Group images by category
    const imagesByCategory: Record<string, (StewIngredient & { marker: string })[]> = {}
    images.forEach((img, globalIdx) => {
      const cat = img.category || 'gallery'
      if (!imagesByCategory[cat]) imagesByCategory[cat] = []

      // Create a unique marker for this image
      const marker = `{{IMAGE_${globalIdx}_${cat.toUpperCase()}}}`
      imageMarkers.set(marker, img.content)

      imagesByCategory[cat].push({ ...img, marker })
    })

    enhancedPrompt = `${prompt}

=== WEBSTEW INGREDIENTS - USE THESE IMAGE PLACEHOLDERS ===

IMPORTANT: I have uploaded ${images.length} image(s). Use the EXACT placeholder markers below in your HTML.
After generation, these markers will be automatically replaced with the actual image data.

`

    // IMAGES SECTION with markers
    if (images.length > 0) {
      enhancedPrompt += `🖼️ IMAGE PLACEHOLDERS TO USE:\n\n`

      // Logo
      if (imagesByCategory['logo']?.length) {
        enhancedPrompt += `LOGO (header/nav):\n`
        imagesByCategory['logo'].forEach((img) => {
          enhancedPrompt += `<img src="${img.marker}" alt="Logo" class="h-8 w-auto"> (${img.metadata?.width || 'auto'}x${img.metadata?.height || 'auto'})\n`
        })
        enhancedPrompt += '\n'
      }

      // Hero images
      if (imagesByCategory['hero']?.length) {
        enhancedPrompt += `HERO IMAGE (main hero section):\n`
        imagesByCategory['hero'].forEach((img) => {
          enhancedPrompt += `<img src="${img.marker}" alt="Hero" class="w-full h-auto object-cover rounded-lg">\n`
        })
        enhancedPrompt += '\n'
      }

      // Product images
      if (imagesByCategory['product']?.length) {
        enhancedPrompt += `PRODUCT IMAGES (product/services grid):\n`
        imagesByCategory['product'].forEach((img, i) => {
          enhancedPrompt += `Product ${i + 1}: <img src="${img.marker}" alt="${img.name}" class="w-full h-48 object-cover rounded-lg">\n`
        })
        enhancedPrompt += '\n'
      }

      // Team images
      if (imagesByCategory['team']?.length) {
        enhancedPrompt += `TEAM PHOTOS (about/team section):\n`
        imagesByCategory['team'].forEach((img, i) => {
          enhancedPrompt += `Team ${i + 1}: <img src="${img.marker}" alt="Team member" class="w-24 h-24 rounded-full object-cover">\n`
        })
        enhancedPrompt += '\n'
      }

      // Gallery images
      if (imagesByCategory['gallery']?.length) {
        enhancedPrompt += `GALLERY IMAGES (gallery/portfolio section):\n`
        imagesByCategory['gallery'].forEach((img, i) => {
          enhancedPrompt += `Gallery ${i + 1}: <img src="${img.marker}" alt="${img.name}" class="w-full h-64 object-cover rounded-lg">\n`
        })
        enhancedPrompt += '\n'
      }

      // Background images
      if (imagesByCategory['background']?.length) {
        enhancedPrompt += `BACKGROUND IMAGES (section backgrounds):\n`
        imagesByCategory['background'].forEach((img) => {
          enhancedPrompt += `style="background-image: url('${img.marker}'); background-size: cover; background-position: center;"\n`
        })
        enhancedPrompt += '\n'
      }

      enhancedPrompt += `⚠️ CRITICAL RULES FOR IMAGES:
1. Use the EXACT placeholder markers shown above (e.g., {{IMAGE_0_LOGO}})
2. Do NOT modify, shorten, or change the placeholders in any way
3. Place images in semantically appropriate sections
4. Each placeholder will be replaced with the actual image after generation

`
    }

    // Text content
    if (textContent.length > 0) {
      enhancedPrompt += `📝 TEXT CONTENT TO USE:\n`
      textContent.forEach((item, i) => {
        const text = item.metadata?.extractedText || item.content
        enhancedPrompt += `${i + 1}. ${item.name}:\n${text.slice(0, 1500)}${text.length > 1500 ? '...' : ''}\n\n`
      })
    }

    // Spreadsheet data
    if (spreadsheets.length > 0) {
      enhancedPrompt += `📊 SPREADSHEET DATA (for products/lists):\n`
      spreadsheets.forEach((sheet) => {
        const data = sheet.metadata?.extractedText || sheet.content
        enhancedPrompt += `${sheet.name} (${sheet.metadata?.rows} rows x ${sheet.metadata?.columns} columns):\n${data.slice(0, 2000)}\n\n`
      })
      enhancedPrompt += `Use this data to populate product cards, pricing tables, or content sections.\n\n`
    }

    // Reference links
    if (links.length > 0) {
      enhancedPrompt += `🔗 REFERENCE LINKS:\n`
      links.forEach((link, i) => {
        enhancedPrompt += `${i + 1}. ${link.content}\n`
      })
      enhancedPrompt += '\n'
    }

    enhancedPrompt += `=== END INGREDIENTS ===

REQUIREMENTS:
1. Include ALL image placeholders in appropriate sections
2. Use placeholder format exactly: {{IMAGE_X_CATEGORY}}
3. Incorporate text content for headings and descriptions
4. Create professional, cohesive design with dark theme
5. Every image placeholder MUST appear in the output HTML

Generate the complete HTML now.`
  }

  if (currentHtml) {
    // Smart edit detection - determine edit scope
    const editLower = enhancedPrompt.toLowerCase()
    const isColorChange = /color|theme|dark|light|palette|accent/.test(editLower)
    const isTextChange = /text|heading|title|copy|content|wording/.test(editLower)
    const isSectionAdd = /add|insert|include|create.*section/.test(editLower)
    const isSectionRemove = /remove|delete|hide.*section/.test(editLower)
    const isLayoutChange = /layout|grid|column|row|spacing|margin|padding/.test(editLower)
    const isComponentChange = /button|form|nav|footer|hero|card|image/.test(editLower)

    // Build precision guidance based on edit type
    let editGuidance = ''
    if (isColorChange) {
      editGuidance = `COLOR/THEME EDIT: Change color classes globally. Replace bg-slate-xxx, text-xxx, border-xxx consistently throughout.`
    } else if (isTextChange) {
      editGuidance = `TEXT EDIT: Change only text content within tags. Keep ALL HTML structure, classes, and attributes identical.`
    } else if (isSectionAdd) {
      editGuidance = `SECTION ADD: Insert new section matching existing design patterns. Use same class conventions, spacing, and component styles.`
    } else if (isSectionRemove) {
      editGuidance = `SECTION REMOVE: Delete the entire <section> block. Preserve surrounding sections completely.`
    } else if (isLayoutChange) {
      editGuidance = `LAYOUT EDIT: Modify grid/flex classes, spacing utilities. Keep content and other styles intact.`
    } else if (isComponentChange) {
      editGuidance = `COMPONENT EDIT: Modify specific component type requested. Match existing visual style.`
    }

    return {
      prompt: `PRECISION WEBSITE EDITOR - SURGICAL MODIFICATIONS ONLY

REQUEST: "${enhancedPrompt}"

${editGuidance ? `DETECTED EDIT TYPE: ${editGuidance}\n` : ''}
STRICT RULES:
1. PRESERVE 100% of HTML structure not mentioned in the request
2. PRESERVE all existing class names, IDs, and attributes unchanged
3. PRESERVE all image URLs and placeholder markers exactly
4. PRESERVE all script tags, style blocks, and meta information
5. PRESERVE all links (href), form actions, and interactive elements
6. ONLY modify what is explicitly requested - nothing more

DIFF-STYLE APPROACH:
- If user says "change hero text" → modify ONLY text inside hero section
- If user says "make button blue" → change ONLY button background color class
- If user says "add testimonials" → insert new section, touch nothing else

CURRENT HTML TO EDIT:
${currentHtml}

OUTPUT REQUIREMENTS:
- Return COMPLETE HTML document (<!DOCTYPE html> to </html>)
- Preserve every line not related to the requested change
- Keep all {{IMAGE_X_CATEGORY}} placeholders exactly as-is
- NO markdown code blocks - raw HTML only
- If unsure about a change, preserve the original`,
      imageMarkers
    }
  }

  // Build full-stack features based on available credentials
  let fullStackFeatures = ''
  if (serviceCredentials) {
    const features: string[] = []

    // Payment Integration
    if (serviceCredentials.STRIPE_PUBLISHABLE_KEY) {
      features.push(`PAYMENT: Include Stripe checkout button with onclick="handlePayment()". Add payment form section with price display.`)
    }

    // Communications
    if (serviceCredentials.SENDGRID_API_KEY || serviceCredentials.TWILIO_ACCOUNT_SID) {
      features.push(`CONTACT: Forms submit to action="/api/forms/submit" with email, name, message fields. Add success/error states.`)
    }

    // Authentication
    if (serviceCredentials.SUPABASE_URL) {
      features.push(`AUTH: Add login/signup modal with email/password inputs. Forms submit to action="/api/auth/signup" or "/api/auth/signin".`)
    }

    // Database
    if (serviceCredentials.MONGODB_URI) {
      features.push(`DATABASE: Dynamic content sections (testimonials, products, posts) can be populated via /api/sections endpoint.`)
    }

    // AI-Powered Features
    if (serviceCredentials.OPENAI_API_KEY || serviceCredentials.ANTHROPIC_API_KEY) {
      features.push(`AI CHAT: Add floating chat widget with input that posts to /api/ai/chat. Include thinking indicator.`)
    }

    // AI Image Generation
    if (serviceCredentials.RUNPOD_FLUX_ENDPOINT) {
      features.push(`AI IMAGES: Add "Generate Image" buttons that call /api/media/generate with prompts.`)
    }

    // Stock Photos
    if (serviceCredentials.PIXABAY_API_KEY) {
      features.push(`MEDIA: Use real stock photos from /api/media/pixabay?query=KEYWORD for any image sections.`)
    }

    if (features.length > 0) {
      fullStackFeatures = `

FULL-STACK CAPABILITIES - INTEGRATE THESE FEATURES:
${features.map(f => `• ${f}`).join('\n')}

FUNCTIONAL FORM PATTERN:
<form action="/api/forms/submit" method="POST" class="space-y-4" onsubmit="handleSubmit(event)">
  <input type="hidden" name="formId" value="contact">
  <input type="email" name="email" required placeholder="Email" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
  <textarea name="message" required placeholder="Message" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl"></textarea>
  <button type="submit" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium">Send</button>
</form>
<script>
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
    if (res.ok) { form.reset(); btn.textContent = 'Sent!'; }
    else { btn.textContent = 'Error - Try Again'; }
  } catch { btn.textContent = 'Error - Try Again'; }
  setTimeout(() => { btn.disabled = false; btn.textContent = 'Send'; }, 3000);
}
</script>

INTERACTIVE UI PATTERNS:
- Add loading spinners: <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
- Success states: class="text-emerald-400" with checkmark icon
- Error states: class="text-red-400" with alert icon
- Disabled states: class="opacity-50 cursor-not-allowed" with disabled attribute`
    }
  }

  return {
    prompt: `Create a complete, production-ready website for: ${enhancedPrompt}

DESIGN REQUIREMENTS:
- Professional dark theme with slate-900/950 backgrounds
- Gradient accents using indigo/violet/purple
- Glassmorphic cards with backdrop-blur effects
- Smooth hover transitions and animations
- Mobile-first responsive design (sm:, md:, lg: breakpoints)

CONTENT REQUIREMENTS:
- Write compelling, realistic copy for all sections
- Use relevant industry-specific terminology
- Include clear calls-to-action
- Add testimonials with realistic names and quotes
- Use appropriate picsum.photos images

FUNCTIONAL REQUIREMENTS:
- All forms must actually work (proper action, method, inputs)
- Include form validation with required and pattern attributes
- Add proper button states (hover, focus, disabled)
- Include accessibility attributes (aria-label, role, etc.)
${fullStackFeatures}

SEO REQUIREMENTS:
- Semantic HTML5 structure
- Meta description, Open Graph, Twitter cards
- Proper heading hierarchy (h1, h2, h3)
- Alt text on all images

Generate the complete HTML now.`,
    imageMarkers
  }
}

// Generate style-specific prompt additions
function getStylePresetPrompt(stylePreset?: { id: string; name: string; tokens: Record<string, string> }): string {
  if (!stylePreset) return ''

  const t = stylePreset.tokens

  // Determine if this is a light or dark theme
  const isDark = t.background.includes('950') || t.background.includes('900') || t.background === 'zinc-950' || t.background === 'slate-950'

  // Generate hover variants
  const primaryHover = t.primary.replace('-500', '-400').replace('-600', '-500')
  const primaryDarker = t.primary.replace('-500', '-600').replace('-400', '-500')

  return `

=== MANDATORY STYLE PRESET: ${stylePreset.name} ===
⚠️ CRITICAL: You MUST use these EXACT Tailwind classes throughout the entire website.
Do NOT use any other color scheme. Override the default dark theme with these colors.

REQUIRED BODY/HTML CLASSES:
<body class="bg-${t.background} text-${t.foreground} min-h-screen font-sans antialiased">

PAGE BACKGROUND:
- Main background: bg-${t.background}
- Section alternating: bg-${t.backgroundAlt}
- ${isDark ? 'This is a DARK theme' : 'This is a LIGHT theme'}

TEXT COLORS (USE THESE EXACTLY):
- Headings (h1, h2, h3): text-${t.foreground}
- Body text: text-${t.foregroundMuted}
- Muted/subtle text: text-${t.foregroundMuted}/70

PRIMARY ACCENT (buttons, links, highlights):
- Button background: bg-${t.primary}
- Button hover: hover:bg-${primaryHover}
- Link text: text-${t.primary}
- Icons: text-${t.primary}

SECONDARY ACCENT (gradients, badges):
- Secondary color: ${t.secondary}
- Gradient: bg-gradient-to-r from-${t.primary} to-${t.secondary}
- Gradient text: bg-gradient-to-r from-${t.primary} to-${t.secondary} bg-clip-text text-transparent

BORDERS & CARDS:
- Border color: border-${t.border}
- Card background: bg-${t.backgroundAlt}
- Glass effect: bg-${t.backgroundAlt}/50 ${t.blur} border border-${t.border}

TYPOGRAPHY:
- Font family: ${t.fontFamily}
- Add this Google Font: <link href="https://fonts.googleapis.com/css2?family=${t.fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
- Tailwind config: fontFamily: { sans: ['${t.fontFamily}', 'system-ui', 'sans-serif'] }

SPECIFIC COMPONENT STYLES:
- Navigation: bg-${t.background}/80 ${t.blur} border-b border-${t.border}
- Hero section: bg-${t.background} with gradient overlay from-${t.primary}/10
- Feature cards: bg-${t.backgroundAlt} border border-${t.border} rounded-[${t.radius}]
- Buttons: bg-${t.primary} hover:bg-${primaryHover} text-${t.primaryForeground} rounded-[${t.radius}]
- Footer: bg-${t.backgroundAlt} border-t border-${t.border}

EXAMPLE HERO SECTION with this preset:
<section class="bg-${t.background}">
  <div class="max-w-7xl mx-auto px-6 py-24">
    <h1 class="text-5xl font-bold text-${t.foreground}">
      Headline <span class="bg-gradient-to-r from-${t.primary} to-${t.secondary} bg-clip-text text-transparent">Highlight</span>
    </h1>
    <p class="text-xl text-${t.foregroundMuted}">Subheadline text</p>
    <a href="#" class="px-8 py-4 bg-${t.primary} hover:bg-${primaryHover} text-${t.primaryForeground} font-semibold rounded-xl">CTA Button</a>
  </div>
</section>

⚠️ REMINDER: Use bg-${t.background}, text-${t.foreground}, bg-${t.primary} etc. throughout.
DO NOT default to slate-950/violet-500 unless that matches this preset.
=== END STYLE PRESET ===
`
}

export async function POST(req: NextRequest) {
  // Track generation start time for performance metrics
  const startTime = Date.now()
  let session: any = null
  let userPlan: 'free' | 'starter' | 'pro' | 'scale' | 'enterprise' = 'free'
  let userId: string | null = null

  try {
    // Auth is optional — anon users can generate (freemium). Rate limiting
    // by IP keeps it from being abused. Save/deploy still require sign-in.
    session = await getApiSession(req)

    // Rate limit: 20 AI generations per minute
    try {
      checkApiRateLimit(req, 'aiGeneration')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    // Anon usage cap — 3 free generations per browser, then prompt sign-up.
    // Tracked via a non-HttpOnly cookie so the UI can also read it for prompts.
    const ANON_FREE_LIMIT = 3
    const cookieHeader = req.headers.get('cookie') || ''
    const anonMatch = cookieHeader.match(/aiwb_anon_gens=(\d+)/)
    const anonCount = anonMatch ? parseInt(anonMatch[1], 10) : 0
    if (!session?.user?.id && anonCount >= ANON_FREE_LIMIT) {
      return NextResponse.json(
        {
          error: 'Free generation limit reached',
          requireAuth: true,
          limit: ANON_FREE_LIMIT,
          message: `You've used your ${ANON_FREE_LIMIT} free generations. Sign in to keep building, save your work, and buy more credits.`,
        },
        { status: 402 }
      )
    }

    // Build the response headers, incrementing the anon counter when applicable
    const streamHeaders: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
    if (!session?.user?.id) {
      // 30-day max-age, readable from JS (not HttpOnly) so the workspace UI
      // can show the user how many free generations they have left.
      streamHeaders['Set-Cookie'] = `aiwb_anon_gens=${anonCount + 1}; Path=/; Max-Age=2592000; SameSite=Lax`
    }

    const { prompt, currentHtml, model, apiKey, apiKeys, ingredients, stylePreset, serviceCredentials, outputMode } = await req.json()

    // outputMode: 'static' (default) | 'nextjs' | 'react'
    const targetMode = outputMode || 'static'

    if (!prompt && (!ingredients || ingredients.length === 0)) {
      return new Response(JSON.stringify({ error: 'Prompt or ingredients required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Define user type for lean queries
    interface UserDoc {
      _id: string
      email?: string
      plan?: 'free' | 'starter' | 'pro' | 'scale' | 'enterprise'
      credits?: number
    }

    // User session already retrieved above
    let userEmail: string | undefined

    if (session?.user?.id) {
      userId = session.user.id
      userEmail = session.user.email || undefined

      try {
        await connectDB()
        const user = await User.findById(userId).lean() as UserDoc | null

        if (user) {
          userEmail = user.email || userEmail
          const isAdmin = userEmail ? isAdminEmail(userEmail) : false

          // Admin users get enterprise plan treatment
          userPlan = isAdmin ? 'enterprise' : (user.plan || 'free')

          // Check usage limits before generation (skip for admins)
          const limitCheck = await checkUsageLimits(userId!, userPlan, 'generation', userEmail)

          if (!limitCheck.allowed) {
            return new Response(JSON.stringify({
              error: limitCheck.reason || 'Daily generation limit reached',
              upgrade: true,
              remaining: 0,
              plan: userPlan
            }), {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          // Check if selected model is allowed for user's plan (admins can use all models)
          const limits = PLAN_LIMITS[userPlan]
          const modelKey = model?.replace(/^(hf-|together-|cf-)/, '') || 'default'

          // Premium models require pro/enterprise plan (admins bypass this)
          const premiumModels = ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'claude-3-opus', 'claude-3.5-sonnet', 'claude-3-sonnet']
          const isPremiumModel = premiumModels.some(pm => model?.toLowerCase().includes(pm.toLowerCase()))

          if (isPremiumModel && userPlan === 'free' && !isAdmin) {
            return new Response(JSON.stringify({
              error: `Model '${model}' requires a Pro or Enterprise plan. Please upgrade or select a free model.`,
              upgrade: true,
              availableModels: limits.models
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          console.log(`[Generate] User: ${userId}, Email: ${userEmail}, Plan: ${userPlan}, Admin: ${isAdmin}, Remaining: ${limitCheck.remaining}`)
        }
      } catch (dbError) {
        console.warn('[Generate] Database check failed, allowing anonymous generation:', dbError)
      }
    } else {
      console.log('[Generate] Anonymous user - using free tier limits')
    }

    // Build prompt with image markers and service credentials
    const { prompt: userPrompt, imageMarkers } = buildPromptWithIngredients(
      prompt || 'Create a professional website',
      ingredients,
      currentHtml,
      serviceCredentials,
      targetMode
    )

    // Add style preset to prompt
    const stylePrompt = getStylePresetPrompt(stylePreset)
    const fullUserPrompt = userPrompt + stylePrompt

    // Check if using a free AI model
    const freeProviderInfo = detectFreeProvider(model || '')

    if (freeProviderInfo.isFree && freeProviderInfo.provider) {
      // Use free AI provider (non-streaming for now)
      console.log(`Using free provider: ${freeProviderInfo.provider}, model: ${freeProviderInfo.model}`)

      // Get the appropriate API key for this provider (check env vars as fallback)
      const envKeys: Record<string, string | undefined> = {
        huggingface: process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN,
        together: process.env.TOGETHER_API_KEY,
        cloudflare: process.env.CLOUDFLARE_API_TOKEN,
      }
      const providerApiKey = apiKeys?.[freeProviderInfo.provider] || apiKey || envKeys[freeProviderInfo.provider]
      const accountId = apiKeys?.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID

      // Require API keys for free providers
      if (freeProviderInfo.provider !== 'huggingface' && !providerApiKey) {
        return new Response(JSON.stringify({
          error: `${freeProviderInfo.provider} requires an API key. Get one free at: ${
            freeProviderInfo.provider === 'together' ? 'https://api.together.ai' :
            freeProviderInfo.provider === 'cloudflare' ? 'https://dash.cloudflare.com' :
            'https://huggingface.co/settings/tokens'
          }`
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // For Hugging Face, it now requires a token too
      if (freeProviderInfo.provider === 'huggingface' && !providerApiKey) {
        return new Response(JSON.stringify({
          error: 'Hugging Face now requires an API token. Get one free (no credit card) at: https://huggingface.co/settings/tokens'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Detect if this is an e-commerce request for better prompting
      const isEcommerce = isEcommerceRequest(prompt || fullUserPrompt)
      const systemPrompt = isEcommerce ? ECOMMERCE_SYSTEM_PROMPT : SIMPLE_SYSTEM_PROMPT

      console.log(`[Generate] Calling generateWithFreeProvider (${isEcommerce ? 'e-commerce' : 'standard'} mode)...`)

      // Use e-commerce prompt for stores, simplified for other sites
      const result = await generateWithFreeProvider(
        freeProviderInfo.provider,
        freeProviderInfo.model || 'mistral-7b',
        systemPrompt,
        fullUserPrompt,
        providerApiKey,
        accountId
      )

      console.log(`[Generate] Result received:`, result.error ? `ERROR: ${result.error}` : `HTML length: ${result.html?.length || 0}`)

      if (result.error) {
        console.error(`[Generate] Free provider error:`, result.error)
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Process the HTML
      let finalHtml = ensureCompleteHtml(result.html || '')

      // Replace image markers
      if (imageMarkers.size > 0) {
        imageMarkers.forEach((imageData, marker) => {
          finalHtml = finalHtml.replace(new RegExp(escapeRegExp(marker), 'g'), imageData)
        })
      }

      const verification = verifyImagesInHtml(finalHtml)
      console.log(`Free AI Image verification: ${verification.imageCount} images, ${verification.valid ? 'all valid' : verification.errors.join(', ')}`)

      // Track usage for free provider generation
      const duration = Date.now() - startTime
      const creditsUsed = 1 // Free tier uses 1 credit per generation

      if (userId) {
        try {
          await trackUsage(userId, {
            type: 'generation',
            provider: freeProviderInfo.provider === 'huggingface' ? 'huggingface' :
                      freeProviderInfo.provider === 'together' ? 'together' :
                      freeProviderInfo.provider === 'cloudflare' ? 'cloudflare' : 'huggingface',
            model: freeProviderInfo.model || 'unknown',
            tokensUsed: Math.ceil(finalHtml.length / 4), // Approximate token count
            creditsUsed,
            prompt: prompt?.slice(0, 500),
            metadata: {
              responseLength: finalHtml.length,
              duration,
              success: true
            }
          })
          console.log(`[Generate] Usage tracked for user ${userId}: ${creditsUsed} credits`)
        } catch (trackError) {
          console.warn('[Generate] Failed to track usage:', trackError)
        }
      }

      // Return non-streaming response for free providers
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            html: finalHtml,
            complete: true,
            provider: freeProviderInfo.provider,
            model: freeProviderInfo.model,
            usage: { creditsUsed, tokensUsed: Math.ceil(finalHtml.length / 4) },
            imageStats: {
              total: imageMarkers.size,
              embedded: verification.imageCount,
              valid: verification.valid
            }
          })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      })

      return new Response(readable, { headers: streamHeaders })
    }

    // Check if using Claude/Anthropic model
    const isClaudeModel = model?.toLowerCase().includes('claude')

    if (isClaudeModel) {
      console.log(`[Generate] Using Anthropic Claude: ${model}`)

      const anthropic = new Anthropic({
        apiKey: apiKey || apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY
      })

      // Map UI model IDs to current Anthropic model snapshots (Claude 4.x family).
      // Older claude-3-* aliases are kept for backwards compat with existing UI selections.
      const claudeModel = model === 'claude-opus' || model === 'claude-3-opus' ? 'claude-opus-4-7' :
                          model === 'claude-sonnet' || model === 'claude-3-sonnet' || model === 'claude-3.5-sonnet' ? 'claude-sonnet-4-6' :
                          model === 'claude-haiku' || model === 'claude-3-haiku' ? 'claude-haiku-4-5-20251001' :
                          model === 'claude' ? 'claude-sonnet-4-6' :
                          'claude-haiku-4-5-20251001' // Default to Haiku (cheapest)

      // Set max tokens based on model capabilities
      const maxTokens = claudeModel.includes('haiku') ? 4096 :
                        claudeModel.includes('sonnet') ? 8192 :
                        claudeModel.includes('opus') ? 4096 : 4096

      // Detect if this is an e-commerce request for better prompting
      const isEcommerce = isEcommerceRequest(prompt || fullUserPrompt)
      const claudeSystemPrompt = isEcommerce ? ECOMMERCE_SYSTEM_PROMPT : ENHANCED_SYSTEM_PROMPT

      console.log(`[Generate] Using Claude ${claudeModel} (${isEcommerce ? 'e-commerce' : 'standard'} mode)`)

      const stream = anthropic.messages.stream({
        model: claudeModel,
        max_tokens: maxTokens,
        system: claudeSystemPrompt,
        messages: [
          { role: 'user', content: fullUserPrompt }
        ]
      })

      const encoder = new TextEncoder()
      let fullHtml = ''

      const readable = new ReadableStream({
        async start(controller) {
          let closed = false

          const safeClose = () => {
            if (!closed) {
              closed = true
              try {
                controller.close()
              } catch (e) {
                // Controller already closed, ignore
              }
            }
          }

          const safeEnqueue = (data: Uint8Array) => {
            if (!closed) {
              try {
                controller.enqueue(data)
              } catch (e) {
                // Controller already closed
              }
            }
          }

          try {
            stream.on('text', (text) => {
              fullHtml += text
              let streamHtml = fullHtml.trim()

              // Remove markdown wrapper if present
              if (streamHtml.startsWith('```html')) {
                streamHtml = streamHtml.slice(7).trim()
              } else if (streamHtml.startsWith('```')) {
                streamHtml = streamHtml.slice(3).trim()
              }

              // Replace image markers
              if (imageMarkers.size > 0) {
                imageMarkers.forEach((imageData, marker) => {
                  streamHtml = streamHtml.replace(new RegExp(escapeRegExp(marker), 'g'), imageData)
                })
              }

              safeEnqueue(encoder.encode(`data: ${JSON.stringify({ html: streamHtml, streaming: true })}\n\n`))
            })

            await stream.finalMessage()

            // Process final HTML
            let finalHtml = ensureCompleteHtml(fullHtml)
            if (finalHtml.startsWith('```html')) finalHtml = finalHtml.slice(7).trim()
            if (finalHtml.startsWith('```')) finalHtml = finalHtml.slice(3).trim()
            if (finalHtml.endsWith('```')) finalHtml = finalHtml.slice(0, -3).trim()

            // Replace image markers
            if (imageMarkers.size > 0) {
              imageMarkers.forEach((imageData, marker) => {
                finalHtml = finalHtml.replace(new RegExp(escapeRegExp(marker), 'g'), imageData)
              })
            }

            const verification = verifyImagesInHtml(finalHtml)
            console.log(`Claude Image verification: ${verification.imageCount} images, ${verification.valid ? 'all valid' : verification.errors.join(', ')}`)

            // Track usage for Claude generation
            const duration = Date.now() - startTime
            const tokensUsed = Math.ceil(finalHtml.length / 4) // Approximate
            const creditsUsed = claudeModel.includes('opus') ? 10 : claudeModel.includes('sonnet') ? 5 : 2

            if (userId) {
              try {
                await trackUsage(userId, {
                  type: 'generation',
                  provider: 'anthropic',
                  model: claudeModel,
                  tokensUsed,
                  creditsUsed,
                  prompt: prompt?.slice(0, 500),
                  metadata: {
                    responseLength: finalHtml.length,
                    duration,
                    success: true
                  }
                })
                console.log(`[Generate] Usage tracked for user ${userId}: ${creditsUsed} credits (Claude)`)
              } catch (trackError) {
                console.warn('[Generate] Failed to track Claude usage:', trackError)
              }
            }

            safeEnqueue(encoder.encode(`data: ${JSON.stringify({
              html: finalHtml,
              complete: true,
              provider: 'anthropic',
              model: claudeModel,
              usage: { creditsUsed, tokensUsed },
              imageStats: { total: imageMarkers.size, embedded: verification.imageCount, valid: verification.valid }
            })}\n\n`))
            safeEnqueue(encoder.encode('data: [DONE]\n\n'))
            safeClose()
          } catch (error: any) {
            console.error('[Claude] Stream error:', error)
            safeEnqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`))
            safeClose()
          }
        }
      })

      return new Response(readable, { headers: streamHeaders })
    }

    // Use OpenAI for GPT models
    console.log(`[Generate] Using OpenAI: ${model}`)

    const openai = new OpenAI({
      apiKey: apiKey || apiKeys?.openai || process.env.OPENAI_API_KEY
    })

    const selectedModel = model === 'gpt-4-turbo' ? 'gpt-4-turbo' :
                          model === 'gpt-4' ? 'gpt-4' :
                          model === 'gpt-3.5-turbo' ? 'gpt-3.5-turbo' :
                          model === 'gpt-4o' ? 'gpt-4o' :
                          model === 'gpt-4o-mini' ? 'gpt-4o-mini' :
                          'gpt-4o'

    // Get max tokens based on model - different models have different limits
    const getMaxTokens = (modelName: string): number => {
      switch (modelName) {
        case 'gpt-4-turbo': return 4096
        case 'gpt-4': return 4096
        case 'gpt-3.5-turbo': return 4096
        case 'gpt-4o': return 16000
        case 'gpt-4o-mini': return 16000
        default: return 4096
      }
    }
    const maxTokens = getMaxTokens(selectedModel)

    // Detect if this is an e-commerce request for better prompting
    const isEcommerce = isEcommerceRequest(prompt || fullUserPrompt)
    const openaiSystemPrompt = isEcommerce ? ECOMMERCE_SYSTEM_PROMPT : ENHANCED_SYSTEM_PROMPT

    console.log(`[Generate] Using OpenAI ${selectedModel} (${isEcommerce ? 'e-commerce' : 'standard'} mode, max_tokens: ${maxTokens})`)

    const stream = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: openaiSystemPrompt },
        { role: 'user', content: fullUserPrompt }
      ],
      stream: true,
      max_tokens: maxTokens,
      temperature: 0.7
    })

    const encoder = new TextEncoder()
    let fullHtml = ''

    const readable = new ReadableStream({
      async start(controller) {
        let closed = false

        const safeClose = () => {
          if (!closed) {
            closed = true
            try {
              controller.close()
            } catch (e) {
              // Controller already closed, ignore
            }
          }
        }

        const safeEnqueue = (data: Uint8Array) => {
          if (!closed) {
            try {
              controller.enqueue(data)
            } catch (e) {
              // Controller already closed
            }
          }
        }

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullHtml += content

              // During streaming, send HTML with placeholders (may be incomplete)
              let streamHtml = fullHtml.trim()

              // Remove markdown wrapper if present at start
              if (streamHtml.startsWith('```html')) {
                streamHtml = streamHtml.slice(7).trim()
              } else if (streamHtml.startsWith('```')) {
                streamHtml = streamHtml.slice(3).trim()
              }

              // During streaming, replace any complete image markers with actual data
              // This provides live preview of images as they're generated
              if (imageMarkers.size > 0) {
                imageMarkers.forEach((imageData, marker) => {
                  streamHtml = streamHtml.replace(new RegExp(escapeRegExp(marker), 'g'), imageData)
                })
              }

              safeEnqueue(encoder.encode(`data: ${JSON.stringify({ html: streamHtml, streaming: true })}\n\n`))
            }
          }

          // Final processing
          let finalHtml = ensureCompleteHtml(fullHtml)

          // Replace all image markers with actual base64 data
          if (imageMarkers.size > 0) {
            imageMarkers.forEach((imageData, marker) => {
              finalHtml = finalHtml.replace(new RegExp(escapeRegExp(marker), 'g'), imageData)
            })
          }

          // Verify images in the final HTML
          const verification = verifyImagesInHtml(finalHtml)
          console.log(`Image verification: ${verification.imageCount} images, ${verification.valid ? 'all valid' : verification.errors.join(', ')}`)

          // Track usage for OpenAI generation
          const duration = Date.now() - startTime
          const tokensUsed = Math.ceil(finalHtml.length / 4) // Approximate
          const creditsUsed = selectedModel.includes('gpt-4o') ? 5 :
                              selectedModel.includes('gpt-4-turbo') ? 8 :
                              selectedModel.includes('gpt-4') ? 10 :
                              selectedModel.includes('gpt-3.5') ? 1 : 3

          if (userId) {
            try {
              await trackUsage(userId, {
                type: 'generation',
                provider: 'openai',
                model: selectedModel,
                tokensUsed,
                creditsUsed,
                prompt: prompt?.slice(0, 500),
                metadata: {
                  responseLength: finalHtml.length,
                  duration,
                  success: true
                }
              })
              console.log(`[Generate] Usage tracked for user ${userId}: ${creditsUsed} credits (OpenAI)`)
            } catch (trackError) {
              console.warn('[Generate] Failed to track OpenAI usage:', trackError)
            }
          }

          safeEnqueue(encoder.encode(`data: ${JSON.stringify({
            html: finalHtml,
            complete: true,
            provider: 'openai',
            model: selectedModel,
            usage: { creditsUsed, tokensUsed },
            imageStats: {
              total: imageMarkers.size,
              embedded: verification.imageCount,
              valid: verification.valid
            }
          })}\n\n`))
          safeEnqueue(encoder.encode('data: [DONE]\n\n'))
          safeClose()
        } catch (error) {
          console.error('Stream error:', error)
          safeEnqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`))
          safeClose()
        }
      }
    })

    return new Response(readable, { headers: streamHeaders })
  } catch (error) {
    console.error('Generate error:', error)
    return new Response(JSON.stringify({ error: 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Helper to escape regex special characters in markers
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Detect if a model is a free model and return provider info
function detectFreeProvider(modelId: string): { isFree: boolean; provider?: FreeAIProvider; model?: string } {
  if (modelId.startsWith('hf-')) {
    // Map frontend model IDs to Hugging Face model keys
    const hfModelMap: Record<string, string> = {
      'hf-llama-3.2-3b': 'llama-3.2-3b',
      'hf-mistral-7b': 'mistral-7b',
      'hf-deepseek-r1': 'deepseek-r1',
      'hf-qwen-2.5': 'qwen-2.5-7b',
      'hf-phi-3-mini': 'phi-3-mini',
      'hf-gemma-2': 'gemma-2',
    }
    return { isFree: true, provider: 'huggingface', model: hfModelMap[modelId] || 'mistral-7b' }
  }

  if (modelId.startsWith('together-')) {
    const togetherModelMap: Record<string, string> = {
      'together-llama-3.2-3b': 'llama-3.2-3b',
      'together-llama-3.1-8b': 'llama-3.1-8b',
      'together-mistral-7b': 'mistral-7b',
      'together-qwen-2.5-7b': 'qwen-2.5-7b',
    }
    return { isFree: true, provider: 'together', model: togetherModelMap[modelId] || 'llama-3.1-8b' }
  }

  if (modelId.startsWith('cf-')) {
    const cfModelMap: Record<string, string> = {
      'cf-llama-3.1-8b': 'llama-3.1-8b',
      'cf-llama-3.2-3b': 'llama-3.2-3b',
      'cf-mistral-7b': 'mistral-7b',
    }
    return { isFree: true, provider: 'cloudflare', model: cfModelMap[modelId] || 'llama-3.1-8b' }
  }

  return { isFree: false }
}

// Generate website using free AI provider
async function generateWithFreeProvider(
  provider: FreeAIProvider,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  apiKey?: string,
  accountId?: string
): Promise<{ html?: string; error?: string }> {
  // Combine system and user prompts for models that don't support system role
  const fullPrompt = `${systemPrompt}\n\n---\n\nUSER REQUEST:\n${userPrompt}`

  try {
    const result = await generateTextFree(
      fullPrompt,
      { provider, apiKey, accountId },
      model,
      { maxTokens: 8192, temperature: 0.7 }
    )

    if (result.error) {
      return { error: result.error }
    }

    return { html: result.text }
  } catch (error: any) {
    return { error: error.message || 'Free AI generation failed' }
  }
}
