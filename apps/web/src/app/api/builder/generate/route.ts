import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { generateTextFree, FreeAIProvider } from '@/lib/free-ai-providers'
import {
  User,
  trackUsage,
  checkUsageLimits,
  isAdminEmail,
  PLAN_LIMITS
} from '@ai-website-builder/database'

// Improved prompt for small/free AI models (3B-7B parameters)
const SIMPLE_SYSTEM_PROMPT = `You are a web developer. Generate a COMPLETE, PROFESSIONAL HTML website.

CRITICAL RULES:
1. Output ONLY HTML code - NO markdown, NO \`\`\`, NO explanations
2. Start with <!DOCTYPE html>
3. Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
4. Use dark theme: bg-slate-900/950, text-white, indigo/violet accents
5. Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT (e.g., picsum.photos/seed/restaurant/800/600)
6. Make it responsive with md: and lg: breakpoints
7. Include ALL sections with REAL content (not placeholders)

REQUIRED STRUCTURE:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUSINESS NAME - Tagline</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif}</style>
</head>
<body class="bg-slate-950 text-white">

<!-- NAVIGATION: Fixed, glassmorphic -->
<nav class="fixed top-0 w-full bg-slate-950/80 backdrop-blur-lg border-b border-white/10 z-50">
  <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
    <a href="#" class="text-xl font-bold">BrandName</a>
    <div class="hidden md:flex gap-8">
      <a href="#features" class="text-slate-300 hover:text-white transition">Features</a>
      <a href="#about" class="text-slate-300 hover:text-white transition">About</a>
      <a href="#contact" class="text-slate-300 hover:text-white transition">Contact</a>
    </div>
    <a href="#" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">Get Started</a>
  </div>
</nav>

<!-- HERO: Full viewport, gradient background, compelling headline -->
<section class="min-h-screen flex items-center pt-20 relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-violet-600/20"></div>
  <div class="max-w-7xl mx-auto px-6 py-24 relative z-10">
    <div class="max-w-3xl">
      <span class="inline-block px-4 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-6">Welcome to Our Platform</span>
      <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">Your Compelling<br><span class="text-indigo-400">Headline Here</span></h1>
      <p class="text-xl text-slate-300 mb-8 max-w-xl">A brief, persuasive description of what you offer and why visitors should care. Make it specific to the business.</p>
      <div class="flex flex-wrap gap-4">
        <a href="#" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition shadow-lg shadow-indigo-600/30">Primary Action</a>
        <a href="#" class="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold border border-white/20 transition">Learn More</a>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES: 3-column grid with icons -->
<section id="features" class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">Describe your key benefits here</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Feature One</h3>
        <p class="text-slate-400">Describe this feature and its benefits to the customer.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Feature Two</h3>
        <p class="text-slate-400">Describe this feature and its benefits to the customer.</p>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h3 class="text-xl font-semibold mb-3">Feature Three</h3>
        <p class="text-slate-400">Describe this feature and its benefits to the customer.</p>
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

5. IMAGES - Use ONLY these reliable sources (they always work):

AVATARS (for testimonials, team members):
- https://i.pravatar.cc/SIZE?img=NUMBER (NUMBER from 1-70)
- Example: https://i.pravatar.cc/100?img=1

GENERAL IMAGES (for hero, features, backgrounds):
- https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT
- Example: https://picsum.photos/seed/business/800/600
- Example: https://picsum.photos/seed/tech/600/400
- Example: https://picsum.photos/seed/office/1200/800

PLACEHOLDER.COM (for simple placeholders):
- https://placehold.co/WIDTHxHEIGHT/COLOR/TEXTCOLOR?text=TEXT
- Example: https://placehold.co/600x400/1e293b/ffffff?text=Your+Image

IMPORTANT: Do NOT use images.unsplash.com - these require real photo IDs.
Always use picsum.photos/seed/KEYWORD format for reliable images.

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

// Build prompt with WebStew ingredients - IMAGES ARE CRITICAL
// This uses image markers to safely pass images through AI generation
function buildPromptWithIngredients(
  prompt: string,
  ingredients: StewIngredient[],
  currentHtml?: string
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
    return {
      prompt: `Modify this HTML based on the request: "${enhancedPrompt}"\n\nCurrent HTML:\n${currentHtml}\n\nReturn the COMPLETE modified HTML. Preserve all image placeholders ({{IMAGE_X_CATEGORY}}).`,
      imageMarkers
    }
  }

  return {
    prompt: `Create a complete website for: ${enhancedPrompt}\n\nMake it look professional with a dark theme, gradients, and modern design.`,
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
  let userPlan: 'free' | 'pro' | 'enterprise' = 'free'
  let userId: string | null = null

  try {
    const { prompt, currentHtml, model, apiKey, apiKeys, ingredients, stylePreset } = await req.json()

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
      plan?: 'free' | 'pro' | 'enterprise'
      credits?: number
    }

    // Get user session and check usage limits
    session = await getServerSession(authOptions)
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

    // Build prompt with image markers
    const { prompt: userPrompt, imageMarkers } = buildPromptWithIngredients(
      prompt || 'Create a professional website',
      ingredients,
      currentHtml
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

      console.log(`[Generate] Calling generateWithFreeProvider with simplified prompt...`)

      // Use simplified prompt for small models - they can't handle the complex one
      const result = await generateWithFreeProvider(
        freeProviderInfo.provider,
        freeProviderInfo.model || 'mistral-7b',
        SIMPLE_SYSTEM_PROMPT,
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

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    // Check if using Claude/Anthropic model
    const isClaudeModel = model?.toLowerCase().includes('claude')

    if (isClaudeModel) {
      console.log(`[Generate] Using Anthropic Claude: ${model}`)

      const anthropic = new Anthropic({
        apiKey: apiKey || apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY
      })

      // Map to actual Claude model IDs
      const claudeModel = model === 'claude-3-opus' ? 'claude-3-opus-20240229' :
                          model === 'claude-3-sonnet' ? 'claude-3-sonnet-20240229' :
                          model === 'claude-3-haiku' ? 'claude-3-haiku-20240307' :
                          model === 'claude-3.5-sonnet' ? 'claude-3-5-sonnet-20241022' :
                          'claude-3-haiku-20240307' // Default to Haiku (most available)

      // Set max tokens based on model capabilities
      const maxTokens = claudeModel.includes('haiku') ? 4096 :
                        claudeModel.includes('sonnet') ? 8192 :
                        claudeModel.includes('opus') ? 4096 : 4096

      const stream = anthropic.messages.stream({
        model: claudeModel,
        max_tokens: maxTokens,
        system: ENHANCED_SYSTEM_PROMPT,
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
              controller.close()
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

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
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

    const stream = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: ENHANCED_SYSTEM_PROMPT },
        { role: 'user', content: fullUserPrompt }
      ],
      stream: true,
      max_tokens: 16000,
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
            controller.close()
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

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
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
