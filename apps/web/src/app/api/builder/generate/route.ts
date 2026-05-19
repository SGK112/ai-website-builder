import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getApiSession } from '@/lib/api-auth'
import { connectDB } from '@/lib/db'
import { generateTextFree, FreeAIProvider } from '@/lib/free-ai-providers'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import {
  User,
  trackUsage,
  checkUsageLimits,
  isAdminEmail,
  PLAN_LIMITS
} from '@ai-website-builder/database'
import { LUXE_ECOMMERCE_TEMPLATE } from '@/lib/templates'

// Sonnet 4.6 + 16K tokens + up to 2 continuation passes can take 2-3 minutes for
// elaborate sites. Without this Render's default request timeout cuts the stream.
export const maxDuration = 300
export const dynamic = 'force-dynamic'


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
Every image MUST use the /api/media proxy. It hits Pexels (real on-topic
photos) on first request and caches forever. Picsum and source.unsplash.com
are dead/unreliable for production use — do not emit URLs to them.

- Hero background: style="background-image: url('/api/media?q=KEYWORD&w=1920&h=1080')"
- Logo placeholder: <img src="/api/media?q=BUSINESS+TYPE+logo&w=120&h=40" alt="Logo" class="h-10">
- Feature images: <img src="/api/media?q=KEYWORD&w=600&h=400" class="rounded-xl">
- Team photos: <img src="https://i.pravatar.cc/150?img=NUMBER" class="rounded-full">
- Product/showcase: <img src="/api/media?q=KEYWORD&w=800&h=600" class="rounded-2xl shadow-2xl">
- Gallery: <img src="/api/media?q=KEYWORD&w=400&h=300" class="rounded-lg">

CRITICAL — KEYWORD must be a real topic-descriptive search query, not a
placeholder like "feature1" or "hero". The query is forwarded to Pexels
search; "feature1" returns nothing on-topic. Replace KEYWORD with what the
image should actually show. Use multiple words separated by '+'.

KEYWORD EXAMPLES BY BUSINESS TYPE (use these literally — they're real Pexels search terms):
- Tech/SaaS: "modern+office+desk", "team+coding", "laptop+screen+code", "data+analytics+dashboard"
- Restaurant: "plated+gourmet+dish", "chef+cooking+kitchen", "candlelit+restaurant+table", "fresh+ingredients"
- Fitness: "person+running+gym", "yoga+studio+morning", "weight+training+gym"
- Real Estate: "modern+living+room", "luxury+kitchen+interior", "house+exterior+sunset"
- Fashion: "fashion+model+studio", "minimalist+clothing+rack", "designer+boutique"
- Business: "team+meeting+modern+office", "professional+handshake", "office+collaboration"

REQUIRED STRUCTURE WITH IMAGES:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Brief compelling description of the business">
  <meta property="og:image" content="/api/media?q=brand&w=1200&h=630">
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
      <img src="/api/media?q=brandlogo&w=40&h=40" alt="Logo" class="h-10 w-10 rounded-lg">
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
  <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('/api/media?q=hero&w=1920&h=1080')"></div>
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
      <img src="/api/media?q=dashboard&w=800&h=600" alt="Product Preview" class="rounded-2xl shadow-2xl shadow-indigo-500/20 border border-white/10">
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
        <img src="/api/media?q=feature1&w=600&h=400" alt="Feature 1" class="w-full h-48 object-cover group-hover:scale-105 transition duration-500">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-3">Feature One</h3>
          <p class="text-slate-400">Describe this feature and its benefits to the customer.</p>
        </div>
      </div>
      <div class="bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition overflow-hidden group">
        <img src="/api/media?q=feature2&w=600&h=400" alt="Feature 2" class="w-full h-48 object-cover group-hover:scale-105 transition duration-500">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-3">Feature Two</h3>
          <p class="text-slate-400">Describe this feature and its benefits to the customer.</p>
        </div>
      </div>
      <div class="bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition overflow-hidden group">
        <img src="/api/media?q=feature3&w=600&h=400" alt="Feature 3" class="w-full h-48 object-cover group-hover:scale-105 transition duration-500">
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
      <img src="/api/media?q=showcase&w=1400&h=600" alt="Showcase" class="w-full h-96 object-cover rounded-3xl">
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
      <img src="/api/media?q=business&w=600&h=400" alt="About" class="rounded-2xl shadow-2xl">
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

⛔ MINIMUM OUTPUT BAR — ANY OUTPUT THAT FAILS THIS IS BROKEN:
A site that ships only a nav + hero + footer is FAILURE. Every page MUST contain at least all of:
- Sticky/fixed nav with brand, ≥4 navigation links, AT LEAST ONE working dropdown menu (services/products/resources), and a primary CTA button
- Hero with eyebrow badge, headline, subheadline, primary CTA, secondary CTA, and a hero visual (image OR illustration block)
- 3+ distinct content sections beyond hero (features grid, showcase, social proof / testimonials / logos, pricing OR FAQ, etc.)
- At least one functional web form (contact, booking, newsletter, or signup) with proper input types (email, tel, date, textarea, select)
- Multi-column footer with brand block, link columns, and social icons

If your token budget is tight, write SHORTER copy and SMALLER examples — but never skip a required element. A site missing dropdowns, forms, or distinct sections does not satisfy this prompt.

Quality bar: produce code at the level a senior engineer would commit to production — semantic HTML, real content (not "Lorem ipsum"), working interactivity wired up via the data attributes the runtime script expects (data-mobile-toggle, data-mobile-menu, data-dropdown, data-accordion-trigger, data-accordion-content).

REQUIRED HEAD STRUCTURE (include all of this — SEO and social share matter):
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Title — Tagline</title>
  <meta name="description" content="Specific 140-160 char description that includes the value proposition and primary keyword. NOT 'Site description'.">
  <meta name="theme-color" content="#0f172a">
  <link rel="canonical" href="https://example.com/">
  <!-- Open Graph (Facebook, LinkedIn, Slack, iMessage) -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Site Title — Tagline">
  <meta property="og:description" content="Same description as above.">
  <meta property="og:image" content="{{STOCK_HERO}}">
  <meta property="og:url" content="https://example.com/">
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Site Title — Tagline">
  <meta name="twitter:description" content="Same description as above.">
  <meta name="twitter:image" content="{{STOCK_HERO}}">
  <!-- JSON-LD structured data — pick one of: Organization, LocalBusiness, Product, SoftwareApplication, Article -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Brand Name",
    "url": "https://example.com",
    "description": "Same description as above."
  }
  </script>
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

Navigation (with dropdown menu + mobile hamburger — REQUIRED PATTERN):
<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#features" class="text-slate-300 hover:text-white transition">Features</a>
      <!-- Dropdown menu (hover on desktop, click on mobile). data-dropdown-trigger pairs with data-dropdown-menu. -->
      <div class="relative group">
        <button data-dropdown-trigger class="flex items-center gap-1 text-slate-300 hover:text-white transition" aria-haspopup="true" aria-expanded="false">
          Services
          <svg class="w-4 h-4 transition group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div data-dropdown-menu class="absolute top-full left-0 mt-2 w-56 p-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl">
          <a href="#" class="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition">Service One</a>
          <a href="#" class="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition">Service Two</a>
          <a href="#" class="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition">Service Three</a>
        </div>
      </div>
      <a href="#pricing" class="text-slate-300 hover:text-white transition">Pricing</a>
      <a href="#contact" class="text-slate-300 hover:text-white transition">Contact</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="#cta" class="hidden md:inline-flex px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition">Get Started</a>
      <button data-mobile-toggle class="md:hidden p-2 text-white" aria-label="Open menu" aria-expanded="false">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <!-- Mobile menu — toggled by data-mobile-toggle. Hidden on desktop. -->
  <div data-mobile-menu class="hidden md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl">
    <div class="px-6 py-4 flex flex-col gap-3">
      <a href="#features" class="text-slate-300 hover:text-white py-2">Features</a>
      <a href="#services" class="text-slate-300 hover:text-white py-2">Services</a>
      <a href="#pricing" class="text-slate-300 hover:text-white py-2">Pricing</a>
      <a href="#contact" class="text-slate-300 hover:text-white py-2">Contact</a>
      <a href="#cta" class="mt-2 px-5 py-3 bg-indigo-600 text-white font-medium rounded-lg text-center">Get Started</a>
    </div>
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
- /api/media?q=KEYWORD&w=WIDTH&h=HEIGHT
- Example: /api/media?q=business&w=800&h=600
- Example: /api/media?q=tech&w=600&h=400
- Example: /api/media?q=office&w=1200&h=800

REQUIRED IMAGE PLACEMENTS (DO NOT SKIP ANY):

A. HERO SECTION (MANDATORY background image):
<section class="relative min-h-screen" style="background-image: url('/api/media?q=KEYWORD&w=1920&h=1080'); background-size: cover; background-position: center;">
  <div class="absolute inset-0 bg-slate-950/70"></div>
  <!-- content with relative z-10 -->
</section>

B. NAVIGATION LOGO (MANDATORY):
<img src="/api/media?q=logo&w=120&h=40" alt="Logo" class="h-10">

C. FEATURE/SERVICE IMAGES (at least 3):
<img src="/api/media?q=feature1&w=600&h=400" alt="Feature" class="rounded-xl">
<img src="/api/media?q=feature2&w=600&h=400" alt="Feature" class="rounded-xl">
<img src="/api/media?q=feature3&w=600&h=400" alt="Feature" class="rounded-xl">

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
ALWAYS use /api/media?q=KEYWORD&w=W&h=H format for reliable images.
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

OPTIONAL UI COMPONENTS (use freely when the design calls for them — runtime JS is wired up):

MODAL / DIALOG (data-modal-trigger pairs with data-modal):
<button data-modal-trigger="signup" class="px-6 py-3 bg-indigo-600 text-white rounded-xl">Get Demo</button>
<div data-modal="signup" class="hidden fixed inset-0 z-50 items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
  <div class="relative max-w-md w-full p-8 bg-slate-900 rounded-2xl border border-white/10">
    <button data-modal-close class="absolute top-4 right-4 text-slate-400 hover:text-white" aria-label="Close">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <h3 class="text-2xl font-bold text-white mb-4">Modal title</h3>
    <p class="text-slate-300 mb-6">Modal body content.</p>
    <button class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">Action</button>
  </div>
</div>

TABS (data-tab-group with data-tab-trigger and data-tab-panel pairs by value):
<div data-tab-group>
  <div class="flex gap-2 border-b border-white/10 mb-6">
    <button data-tab-trigger="overview" class="px-4 py-2 text-white border-b-2 border-indigo-500" aria-selected="true">Overview</button>
    <button data-tab-trigger="features" class="px-4 py-2 text-slate-400 border-b-2 border-transparent hover:text-white" aria-selected="false">Features</button>
    <button data-tab-trigger="pricing" class="px-4 py-2 text-slate-400 border-b-2 border-transparent hover:text-white" aria-selected="false">Pricing</button>
  </div>
  <div data-tab-panel="overview">Overview panel content.</div>
  <div data-tab-panel="features" class="hidden">Features panel content.</div>
  <div data-tab-panel="pricing" class="hidden">Pricing panel content.</div>
</div>

CAROUSEL / SLIDER (data-carousel with data-carousel-track and data-carousel-prev/next):
<div data-carousel class="relative overflow-hidden">
  <div data-carousel-track class="flex transition-transform duration-500" style="transform: translateX(0)">
    <div class="min-w-full p-8">Slide 1</div>
    <div class="min-w-full p-8">Slide 2</div>
    <div class="min-w-full p-8">Slide 3</div>
  </div>
  <button data-carousel-prev class="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur rounded-full text-white" aria-label="Previous">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
  </button>
  <button data-carousel-next class="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur rounded-full text-white" aria-label="Next">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
  </button>
</div>

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

  // Dropdown menus — click to open on touch devices, hover handled by CSS group-hover.
  document.querySelectorAll('[data-dropdown-trigger]').forEach(trigger => {
    const menu = trigger.parentElement?.querySelector('[data-dropdown-menu]');
    if (!menu) return;
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = menu.classList.contains('opacity-100');
      // Close any other open dropdowns
      document.querySelectorAll('[data-dropdown-menu]').forEach(m => {
        m.classList.remove('opacity-100','visible');
        m.classList.add('opacity-0','invisible');
      });
      if (!isOpen) {
        menu.classList.remove('opacity-0','invisible');
        menu.classList.add('opacity-100','visible');
        trigger.setAttribute('aria-expanded','true');
      } else {
        trigger.setAttribute('aria-expanded','false');
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dropdown-trigger], [data-dropdown-menu]')) {
      document.querySelectorAll('[data-dropdown-menu]').forEach(m => {
        m.classList.remove('opacity-100','visible');
        m.classList.add('opacity-0','invisible');
      });
      document.querySelectorAll('[data-dropdown-trigger]').forEach(t => t.setAttribute('aria-expanded','false'));
    }
  });

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

  // Modal / Dialog — data-modal-trigger="<id>" opens [data-modal="<id>"], data-modal-close closes nearest.
  document.querySelectorAll('[data-modal-trigger]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const id = trigger.getAttribute('data-modal-trigger');
      const modal = document.querySelector('[data-modal="' + id + '"]');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
      }
    });
  });
  const closeAllModals = () => {
    document.querySelectorAll('[data-modal]').forEach(m => {
      m.classList.add('hidden');
      m.classList.remove('flex');
    });
    document.body.style.overflow = '';
  };
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  document.querySelectorAll('[data-modal]').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals();
    });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

  // Tabs — data-tab-group wraps triggers (data-tab-trigger="value") and panels (data-tab-panel="value").
  document.querySelectorAll('[data-tab-group]').forEach(group => {
    const triggers = group.querySelectorAll('[data-tab-trigger]');
    const panels = group.querySelectorAll('[data-tab-panel]');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const value = trigger.getAttribute('data-tab-trigger');
        triggers.forEach(t => {
          const active = t === trigger;
          t.setAttribute('aria-selected', active ? 'true' : 'false');
          t.classList.toggle('text-white', active);
          t.classList.toggle('border-indigo-500', active);
          t.classList.toggle('text-slate-400', !active);
          t.classList.toggle('border-transparent', !active);
        });
        panels.forEach(p => {
          p.classList.toggle('hidden', p.getAttribute('data-tab-panel') !== value);
        });
      });
    });
  });

  // Carousel — data-carousel wraps a data-carousel-track of equal-width children, plus prev/next buttons.
  // Auto-advances every 6s; pauses on hover. Wraps cleanly.
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('[data-carousel-track]');
    if (!track) return;
    const slides = track.children;
    let index = 0;
    let timer = null;
    const update = () => {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
    };
    const go = (delta) => {
      index = (index + delta + slides.length) % slides.length;
      update();
    };
    carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => go(-1));
    carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => go(1));
    const start = () => { timer = setInterval(() => go(1), 6000); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    start();
  });

})();
</script>

ACCESSIBILITY REQUIREMENTS:
- Use semantic HTML5 elements (header, nav, main, section, article, aside, footer)
- Include ARIA labels where needed (aria-label, aria-expanded, aria-hidden)
- Ensure color contrast meets WCAG AA standards
- Make all interactive elements keyboard accessible
- Add alt text to all images

RESPONSIVE DESIGN (MANDATORY — site is previewed on mobile, tablet, and desktop):
- Mobile-first Tailwind: write base classes for mobile (≤640px), then add sm:, md:, lg:, xl: overrides
- Every grid: collapse to 1 column on mobile, 2 on tablet (md:), 3+ on desktop (lg:)
- Hero text: text-4xl on mobile, scale up to md:text-6xl lg:text-7xl
- Buttons in hero: stack vertically on mobile (flex-col), side-by-side on sm: (sm:flex-row)
- Nav: full menu hidden on mobile (hidden md:flex), hamburger visible on mobile (md:hidden)
- Padding: tighter on mobile (px-4 py-12), generous on desktop (md:px-6 md:py-24)
- Images: w-full on mobile, fixed sizes on larger screens; use aspect-video / aspect-square for consistent ratios
- Test the layout mentally at 375px (mobile), 768px (tablet), 1280px (desktop) — all three must look intentional, not just "shrunk"

✅ FINAL CHECKLIST — BEFORE YOU EMIT </html>, VERIFY:
[ ] <nav> exists, is fixed/sticky, contains brand + ≥4 links + ≥1 dropdown menu (data-dropdown-trigger) + a primary CTA button
[ ] Mobile hamburger button (data-mobile-toggle) and mobile menu (data-mobile-menu) are present
[ ] Hero has eyebrow badge, headline, subheadline, primary CTA, secondary CTA
[ ] At least 3 distinct content sections beyond hero (features, showcase, testimonials, pricing, FAQ, etc.)
[ ] At least one <form> with realistic inputs (email, tel, textarea, etc.) and a submit button
[ ] Footer is multi-column with brand + link columns + social icons
[ ] Layout uses Tailwind responsive prefixes (sm:, md:, lg:) — no fixed pixel widths that break on mobile
[ ] All required images use /api/media?q=KEYWORD&w=W&h=H or i.pravatar.cc/SIZE?img=N
[ ] HTML closes cleanly: </body></html>

If your output is missing ANY checklist item, add it before stopping. A truncated page is a failed page.

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

// Auto-router — picks the best model for the job when the user selects
// "auto" (or hasn't picked anything). The goal is fewer wasted tokens on
// cheap edits and stronger output on hard tasks. Manual model selection
// always wins — this only fires when model is unset or 'auto'.
//
// Decision matrix (in priority order):
//   1. Vision-heavy prompt              → grok-2-vision-1212
//   2. Complex reasoning / architecture → claude-opus-4-7
//   3. Quick refinement (short prompt, has currentHtml) → claude-haiku-4-5
//   4. Fresh full-site build            → claude-sonnet-4-6 (default)
//
// Returns { model, reason } so we can log why.
export type AutoModelChoice = { model: string; reason: string }

function pickBestModel(prompt: string, currentHtml?: string): AutoModelChoice {
  const p = (prompt || '').toLowerCase()
  const isShort = (prompt || '').trim().length < 80
  const hasCurrentHtml = !!(currentHtml && currentHtml.length > 100)

  // Vision: prompt explicitly mentions image work or design-from-image
  if (/\b(from this image|from this screenshot|match this design|clone this site|recreate this|like this image|image of|photo of|logo design|color from image|sample these colors)\b/.test(p)) {
    return { model: 'grok-2-vision-1212', reason: 'vision: image-anchored task' }
  }

  // Heavy reasoning / multi-step / architecture / complex code
  if (/\b(architect|architecture|plan a (multi[- ]?page|full|complex)|design the (data|database|schema)|workflow|state machine|implement (auth|authentication|payment|stripe|webhook|api endpoint)|complex (logic|integration)|reasoning|step.by.step|chain of)\b/.test(p)) {
    return { model: 'claude-opus-4-7', reason: 'reasoning: complex task' }
  }

  // Fresh-build detection — "build me a coffee shop site".
  // Use Haiku 4.5 for first-touch: ~3-5x faster than Sonnet (20-30s vs 2-3min)
  // and fits a full landing page in one pass (no max_tokens continuations).
  // Speed beats marginal quality here — users will refine via chat, and
  // a slow first build causes navigation-away → lost stream → blank site.
  const isFreshBuildIntent = /\b(build|create|make|generate|design|launch|spin\s+up|put\s+together|whip\s+up)\b.+\b(site|website|page|landing|app|store|blog|portfolio|dashboard)\b/.test(p)
  if (isFreshBuildIntent && !hasCurrentHtml) {
    return { model: 'claude-haiku-4-5-20251001', reason: 'fresh build (fast)' }
  }

  // Quick edit — short prompt against an existing site
  if (isShort && hasCurrentHtml) {
    return { model: 'claude-haiku-4-5-20251001', reason: 'quick refinement' }
  }

  // Default — balanced Sonnet
  return { model: 'claude-sonnet-4-6', reason: 'default (balanced)' }
}

// Industry detection — picks ONE primary industry from the prompt so we can
// fork the system prompt's section grammar. Without this, every non-ecommerce
// site gets the same Hero+Features+CTA skeleton regardless of what they
// actually need (restaurants want menus, photographers want portfolios, etc.).
// Ecommerce is checked last because it has its own fully-custom system prompt
// upstream; the rest just augment ENHANCED_SYSTEM_PROMPT with section overrides.
export type Industry = 'ecommerce' | 'restaurant' | 'portfolio' | 'saas' | 'realtor' | 'blog' | 'generic'

function detectIndustry(prompt: string): Industry {
  const p = (prompt || '').toLowerCase()
  // Order matters — most-specific keywords win to avoid false positives
  // (e.g. "saas for restaurants" should hit saas, not restaurant).
  if (/\b(saas|b2b|api|sdk|platform|developer tool|enterprise software|software-as-a-service)\b/.test(p)) return 'saas'
  if (/\b(restaurant|cafe|caf[eé]|coffee shop|bistro|eatery|diner|menu|dining|chef|cuisine|brunch)\b/.test(p)) return 'restaurant'
  if (/\b(portfolio|photographer|videographer|designer's site|creative freelance|showcase my work|case studies)\b/.test(p)) return 'portfolio'
  if (/\b(real estate|realtor|broker|listings|homes for sale|property listings|mls)\b/.test(p)) return 'realtor'
  if (/\b(blog|publication|newsletter|magazine|editorial|articles|writing portfolio)\b/.test(p)) return 'blog'
  if (isEcommerceRequest(prompt)) return 'ecommerce'
  return 'generic'
}

// Section-grammar override appended to ENHANCED_SYSTEM_PROMPT when industry is
// detected. We don't replace the base prompt — the quality/style/image/SEO
// guidance still applies. We just override the "3+ distinct content sections"
// list with industry-appropriate sections so output stops being interchangeable.
const INDUSTRY_SECTION_OVERRIDES: Partial<Record<Industry, string>> = {
  restaurant: `## RESTAURANT-SPECIFIC SECTION GRAMMAR (overrides the generic "features grid + testimonials + pricing" pattern)
This is a restaurant / cafe / dining site. The sections must reflect what a real restaurant patron looks for, not generic SaaS sections. DO NOT include "features grid", "pricing tiers", or "logo cloud" sections. Instead:

REQUIRED SECTIONS (in this order):
1. Hero — full-bleed appetizing food photo or warm interior shot, restaurant name in serif/display type, location/neighborhood, hours-today indicator, "Reserve a table" primary CTA and "View menu" secondary CTA.
2. About / Story — chef's bio or restaurant origin story, philosophy, ~2-3 paragraphs with one supporting image.
3. Menu — REAL menu sections by category (Starters, Mains, Desserts, Drinks) with item names, 1-line descriptions, and prices. Use a 2-column layout on desktop. Include "Vegetarian", "GF", "Spicy" icon badges where appropriate. AT LEAST 8 menu items.
4. Gallery — 6-9 image masonry grid of food/interior/staff (use /api/media?q=food&w=600&h=400, /api/media?q=restaurant+interior&w=600&h=400, /api/media?q=plating&w=600&h=400).
5. Reviews / Testimonials — 3-4 quote cards with diner name + star rating.
6. Reservations — form with name, party size, date, time, special requests. Use proper input types (date, time, number).
7. Visit Us — hours table (Mon-Sun), full address, phone, map placeholder (use /api/media?q=street+map&w=800&h=400 for visual), parking notes.
8. Footer — brand, social, hours condensed, contact.

The Menu section is the soul of a restaurant site — give it real content, real prices, real descriptions. Do not abbreviate it. Vary the categories based on cuisine type (Italian: Antipasti/Primi/Secondi/Dolci; Asian: Small Plates/Mains/Sushi/Sweets; etc.).`,

  saas: `## SAAS / B2B SECTION GRAMMAR (overrides the generic pattern)
This is a software/B2B product site. The sections must build trust with a technical buyer and convert to free trial / demo. Skip generic "About us" hero. Instead:

REQUIRED SECTIONS (in this order):
1. Hero — bold value-prop headline (problem you solve, not features), subheadline (one sentence on outcome), dual CTAs ("Start free trial" + "Book demo"), hero visual (product UI screenshot mockup using a placeholder image, or animated illustration block).
2. Logo Cloud — "Trusted by teams at" + 6-8 logo placeholders in a horizontal row (use /api/media?q=company+logo&w=120&h=40 with grayscale CSS filter).
3. Features — alternating left/right layout with 3-4 features: each has a short headline, 2-line explanation, a small UI mockup image, and a "Learn more →" link. NOT a grid of icons — alternating sections give more visual weight.
4. How It Works — 3-step numbered process (sign up → integrate → ship). Each step has icon, title, 1-line description.
5. Pricing — 3 tiers (Starter, Pro, Enterprise) in a comparison table. Each tier: name, monthly price, "best for" tagline, feature checkmark list (5-8 items), CTA button. Highlight the middle tier.
6. Testimonials / Social Proof — 2-3 quote cards from named customers with title + company + headshot (use i.pravatar.cc).
7. FAQ — accordion with 6-8 common questions (pricing, integrations, security, cancellation, support, free trial).
8. Final CTA — full-width gradient banner with strong call to action and a single button.
9. Footer — multi-column with Product / Resources / Company / Legal links + social.

Critical: pricing must be a real comparison table (not 3 cards stacked). Headlines should focus on OUTCOMES (e.g., "Ship features 3x faster"), not feature lists.`,

  portfolio: `## PORTFOLIO / CREATIVE SECTION GRAMMAR (overrides the generic pattern)
This is a personal portfolio for a designer/photographer/writer/creative. The sections must showcase work, not sell software. Skip "features grid", "pricing", "logo cloud". Instead:

REQUIRED SECTIONS (in this order):
1. Hero — large name in display type, role/discipline subtitle, brief 1-2 sentence intro, primary CTA "View work" + secondary "Get in touch". Hero visual is a striking self-portrait or signature work piece (use /api/media?q=creative+portrait&w=800&h=900).
2. About — 2-3 paragraph bio, professional photo, list of "Areas of focus" or "Skills" as tags.
3. Selected Work / Portfolio Grid — 6-9 project tiles in a masonry or 3-column grid. Each tile: large image, project name overlay, category tag (e.g., "Branding", "Web Design", "Photography"). Hover effect: scale + reveal description.
4. Featured Case Study — one in-depth project: large hero image, client name, year, role, 2-3 paragraph problem/approach/result writeup, 2-4 supporting images.
5. Press / Clients — "As seen in" or "Selected clients" — horizontal row of 6-10 logo placeholders.
6. Process — 3-5 step approach (Research → Concept → Design → Refine → Deliver), each with an icon and brief description.
7. Testimonials — 2-3 client quotes with name + company.
8. Contact — single-column form (name, email, project type dropdown, budget range, message) with a friendly CTA like "Let's make something good".
9. Footer — name, social icons (Instagram + Behance + LinkedIn + Dribbble where relevant), copyright.

Tone: confident, sparse, image-heavy. Less text, more visual weight. White space is the design.`,

  realtor: `## REAL ESTATE / REALTOR SECTION GRAMMAR (overrides the generic pattern)
This is a real estate agent or brokerage site. Buyers and sellers come here looking for listings and to trust the agent — NOT generic features/pricing/FAQ. Skip "features grid", "logo cloud", generic pricing tiers. Instead:

REQUIRED SECTIONS (in this order):
1. Hero — full-width property photo or neighborhood shot, agent name + brokerage, search bar with City / Price Range / Beds / Baths inputs, primary CTA "Browse listings" + secondary "Schedule a tour". Make the search bar prominent.
2. Featured Listings — grid of 6-9 property cards. Each card: photo, price (formatted with $ + commas), address (street + city), bed/bath/sqft icons with counts, status badge (For Sale / Pending / Sold). Use /api/media?q=house+exterior&w=600&h=400 (vary the q keyword per card: house, home+interior, modern+home, luxury+home, etc.).
3. Why Work With Me / Agent Bio — professional headshot, 2-3 paragraph bio, license number + brokerage, years in business + total transactions / sales volume stat callouts (e.g., "$50M+ sold").
4. Market Stats / Neighborhood Insight — 3-4 stat cards (median home price, days on market, # active listings, price per sqft) for the agent's primary market. Sourced from MLS-style data presentation.
5. Recent Sales — horizontal scroll or grid of 4-6 SOLD properties with sold price, days on market, photo.
6. Testimonials — 3 quote cards from named clients with their property address ("Sold our home in 12 days on Mockingbird Lane").
7. Resources / Buyer & Seller Guides — 2-3 cards linking to "First-time buyer guide", "Seller's prep checklist", "Market report" — even if just stubs.
8. Contact / Schedule a Tour — form with name, email, phone, property of interest (text or listing ID), preferred tour date + time, message. Plus the agent's direct phone + email displayed prominently.
9. Footer — brokerage logo, license #, equal housing logo, social, "DRE# / TREC# / etc." compliance text.

Tone: trustworthy, professional, local. Real estate sites that look generic don't convert — use real-sounding neighborhood names, real-feeling prices for the market.`,

  blog: `## BLOG / PUBLICATION SECTION GRAMMAR (overrides the generic pattern)
This is a blog, newsletter, or editorial publication site. Readers come to read articles and subscribe — NOT to buy software. Skip "features grid", "pricing tiers", "logo cloud". Instead:

REQUIRED SECTIONS (in this order):
1. Hero — large featured-post card (image + title + excerpt + author + read time) OR a magazine-style 2-column layout with the latest piece on the left and 3-4 thumbnails on the right. Site title + tagline in the header.
2. Recent Posts — grid of 6-9 post cards. Each card: cover image, category tag (Design / Technology / Culture / etc.), title (2-3 lines), 1-line excerpt, author avatar + name, publish date, read time (e.g., "5 min read"). Use a clean 3-column grid on desktop, single column on mobile.
3. Categories / Topics — visual category strip — 5-8 category tiles with cover images and post counts (e.g., "Design (47)").
4. Author / About — if a single-author blog: photo, bio, "Why I write", social links. If multi-author: grid of contributors with photos + names + roles.
5. Newsletter Signup — full-width section with bold pitch ("Get one thoughtful essay every Sunday"), email input + Subscribe button, social-proof line ("12,000+ subscribers"). NOT a popup — a real section in the page.
6. Popular / Most Read — sidebar or section showing 4-5 most-popular posts with thumbnail + title + view count.
7. Footer — site title, brief mission, archive link, RSS link, social, copyright, "Powered by [your stack]" if relevant.

Tone: editorial, considered, reader-first. Long-form-friendly typography (line-height 1.6+, comfortable measure). NO "buy now" / "sign up free" CTAs — only "Read" and "Subscribe". The publication earns trust through writing, not features.`,
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

Use /api/media?q=[keyword]&w=[width]&h=[height] for ALL images (they ALWAYS work)

REQUIRED PLACEMENTS:
A. HERO BACKGROUND (MANDATORY - full width):
style="background-image: url('/api/media?q=luxury&w=1920&h=1080'); background-size: cover;"

B. LOGO (MANDATORY):
<img src="/api/media?q=logo&w=120&h=40" alt="Brand Logo" class="h-10">

C. PRODUCT IMAGES (at least 8 products):
- /api/media?q=product1&w=400&h=500
- /api/media?q=product2&w=400&h=500
- /api/media?q=bag1&w=400&h=500
- /api/media?q=shoe1&w=400&h=500
... use descriptive keywords for the product type

D. CATEGORY IMAGES (at least 3):
- /api/media?q=fashion&w=600&h=800
- /api/media?q=accessories&w=600&h=800
- /api/media?q=newcollection&w=600&h=800

E. PROMOTIONAL BANNERS:
- /api/media?q=sale&w=1200&h=600
- /api/media?q=collection&w=1400&h=700

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

// Fetch a pool of topic-relevant photos from Pixabay so the generated site's
// images actually relate to the user's prompt (instead of picsum's seed-based
// random pool — a jewelry site would otherwise get bulldozers and fruit-market
// vendors because "seed/hero" deterministically returns the same unrelated
// photo every time). One API call returns a pool we then distribute across
// every <img> tag and background-image URL in the HTML.
async function fetchTopicImages(topic: string): Promise<string[]> {
  const key = process.env.PIXABAY_API_KEY
  if (!key) return []
  // Strip filler words and cap query length — Pixabay rejects > 100 chars
  // and works better with 2-4 nouns than a full sentence.
  const cleaned = topic
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(a|an|the|for|with|and|or|of|to|in|on|please|website|site|page|landing|build|create|make|design|that|sells|sell|selling|business|company)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4)
    .join(' ')
  if (!cleaned) return []

  try {
    const url = new URL('https://pixabay.com/api/')
    url.searchParams.set('key', key)
    url.searchParams.set('q', cleaned)
    url.searchParams.set('image_type', 'photo')
    url.searchParams.set('per_page', '20')
    url.searchParams.set('safesearch', 'true')
    url.searchParams.set('editors_choice', 'true')
    url.searchParams.set('lang', 'en')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url.toString(), { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return []
    const data = await res.json()
    const hits = (data?.hits || []) as Array<{ largeImageURL?: string; webformatURL?: string }>
    return hits
      .map(h => h.largeImageURL || h.webformatURL || '')
      .filter(Boolean)
  } catch {
    return []
  }
}

// Replace placeholder image URLs (picsum, unsplash, broken) with topic-relevant
// photos from the supplied pool. Each <img> and background-image gets a
// different image from the pool, cycling if needed. Leaves data URIs, user
// uploads, and marker tokens alone.
function injectTopicImages(html: string, pool: string[]): string {
  if (pool.length === 0) return html
  let i = 0
  const next = () => pool[i++ % pool.length]
  const isReplaceableUrl = (url: string): boolean => {
    if (!url) return true
    const u = url.toLowerCase()
    if (u.startsWith('data:')) return false
    if (u.startsWith('{{') || u.startsWith('__')) return false  // template markers
    if (u.includes('user-uploads') || u.includes('cloudinary')) return false
    return (
      u.includes('picsum.photos') ||
      u.includes('images.unsplash.com') ||
      u.includes('source.unsplash.com') ||
      u.includes('placeholder') ||
      u.includes('via.placeholder')
    )
  }

  let result = html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
    (match, pre, src, post) => isReplaceableUrl(src) ? `${pre}${next()}${post}` : match
  )

  result = result.replace(
    /background(-image)?\s*:\s*url\(\s*(['"]?)([^'")]+)\2\s*\)/gi,
    (match, suffix, quote, url) => isReplaceableUrl(url) ? `background${suffix || ''}: url(${quote}${next()}${quote})` : match
  )

  return result
}

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
      return `/api/media?q=${seed}&w=${width}&h=${height}`
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
      return `/api/media?q=${seed}&w=${width}&h=${height}`
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
  // Only target elements that OPT IN via [data-reveal] or .reveal-on-scroll
  // class. Previously this targeted every 'section'/'.card'/'article' and
  // set them all to opacity:0, which made the hero (and every other
  // already-visible section) flash on every page load. The hero should
  // never be hidden behind an observer; only opt-in elements should be.
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-reveal], .reveal-on-scroll').forEach(el => {
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

  console.log('✅ Webstew interactivity loaded');
})();
</script>`;

  // Only inject our universal-fallback interactivity if the model didn't
  // already include its own. The system prompt asks the LLM to produce
  // a working interactivity script — when it does, our injection is a
  // duplicate that double-binds form handlers, conflicting scroll
  // listeners, and causes the page to flash. Detect existing scripts.
  // Accept both spellings so previously-generated sites still detect as
  // ours after the 2026-05-12 Webstew rebrand.
  const hasOurMarker = result.includes('Webstew interactivity loaded') || result.includes('WebStew interactivity loaded')
  // Find non-CDN, non-JSON-LD inline scripts that bind event listeners or
  // run their own IIFE. If we find one, the LLM has interactivity covered
  // and we skip injection.
  const inlineScripts = result.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) || []
  const hasLLMInteractivity = inlineScripts.some((s) => {
    const isJsonLd = /type=["']application\/ld\+json["']/i.test(s)
    const isTailwindConfig = /tailwind\.config\s*=/i.test(s)
    if (isJsonLd || isTailwindConfig) return false
    // Counts as "real interactivity" if it adds listeners or wires up DOM.
    return /addEventListener|IntersectionObserver|querySelectorAll|querySelector\(/i.test(s)
  })
  if (!hasOurMarker && !hasLLMInteractivity) {
    if (result.includes('</body>')) {
      result = result.replace('</body>', interactivityScript + '\n</body>')
    } else {
      result += interactivityScript
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

// Fetch a small set of relevant stock images for the given prompt. Tries
// Pixabay first (configured on Render), falls back to Pexels if PEXELS_API_KEY
// is set instead. Returns a Map of marker→url that can be merged into
// imageMarkers, plus a human-readable addendum to append to the user prompt
// so the AI uses the markers instead of guessing at picsum seeds.
//
// Gracefully no-ops if neither PIXABAY_API_KEY nor PEXELS_API_KEY is set —
// generation still works, images just fall back to picsum in the system prompt.
async function fetchStockImagesForPrompt(
  prompt: string,
  count = 8
): Promise<{ markers: Map<string, string>; addendum: string }> {
  const markers = new Map<string, string>()
  const pixabayKey = process.env.PIXABAY_API_KEY
  const pexelsKey = process.env.PEXELS_API_KEY
  if (!pixabayKey && !pexelsKey) {
    return { markers, addendum: '' }
  }

  // Keep query focused — search engines work best on short subject phrases
  const query = prompt.replace(/\s+/g, ' ').trim().slice(0, 80).split(/[.,!?]/)[0].trim()
  if (!query) return { markers, addendum: '' }

  type Photo = { url: string }
  let photos: Photo[] = []
  let provider = ''

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    if (pixabayKey) {
      const res = await fetch(
        `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(query)}&per_page=${Math.max(count, 3)}&image_type=photo&orientation=horizontal&safesearch=true&editors_choice=true`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (res.ok) {
        const data: any = await res.json()
        const hits: any[] = Array.isArray(data?.hits) ? data.hits : []
        photos = hits.slice(0, count).map(h => ({
          url: h.largeImageURL || h.webformatURL || h.previewURL,
        })).filter(p => p.url)
        provider = 'Pixabay'
        if (photos.length === 0) {
          console.warn(`[Generate] Pixabay returned 0 photos for "${query}"`)
        }
      } else {
        console.warn(`[Generate] Pixabay search failed: ${res.status}`)
      }
    } else if (pexelsKey) {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        { headers: { Authorization: pexelsKey }, signal: controller.signal }
      )
      clearTimeout(timeout)
      if (res.ok) {
        const data: any = await res.json()
        const hits: any[] = Array.isArray(data?.photos) ? data.photos : []
        photos = hits.map(p => ({
          url: p?.src?.large2x || p?.src?.large || p?.src?.original,
        })).filter(p => p.url)
        provider = 'Pexels'
      } else {
        console.warn(`[Generate] Pexels search failed: ${res.status}`)
      }
    }

    if (photos.length === 0) return { markers, addendum: '' }

    photos.forEach((p, i) => {
      const role = i === 0 ? 'HERO' : i === 1 ? 'SHOWCASE' : `FEATURE_${i - 1}`
      const marker = `{{STOCK_${role}}}`
      markers.set(marker, p.url)
    })

    console.log(`[Generate] Fetched ${markers.size} ${provider} images for "${query}"`)

    const list = Array.from(markers.keys()).map(m => `- ${m}`).join('\n')
    const addendum = `\n\n🖼️ CURATED STOCK IMAGES (use these markers — they will be replaced with REAL relevant photos for "${query}"):
${list}

Usage rules:
- Use {{STOCK_HERO}} for the hero background or main hero visual.
- Use {{STOCK_SHOWCASE}} for any large feature showcase, about, or story section.
- Use {{STOCK_FEATURE_1}}, {{STOCK_FEATURE_2}}, etc. for feature cards, gallery items, or service tiles.
- Place markers EXACTLY as shown inside src="..." — do not modify them.
- Prefer these markers over /api/media?q=... URLs — markers are topic-matched to the actual prompt.
- For testimonial avatars, KEEP using https://i.pravatar.cc/SIZE?img=N (markers above are content photos, not portraits).`

    return { markers, addendum }
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.warn('[Generate] Stock image search timed out')
    } else {
      console.warn('[Generate] Stock image fetch error:', e?.message || e)
    }
    return { markers, addendum: '' }
  }
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

    // Group images by category. If the user uploaded images but never
    // explicitly tagged one as 'hero', promote the FIRST image to hero —
    // otherwise the AI buries it in a gallery section, which is rarely the
    // user's intent when they drop an image into the builder.
    const hasExplicitHero = images.some(img => img.category === 'hero')
    const imagesByCategory: Record<string, (StewIngredient & { marker: string })[]> = {}
    images.forEach((img, globalIdx) => {
      const isAutoHero = !hasExplicitHero && globalIdx === 0
      const cat = isAutoHero ? 'hero' : (img.category || 'gallery')
      if (!imagesByCategory[cat]) imagesByCategory[cat] = []

      // Create a unique marker for this image
      const marker = `{{IMAGE_${globalIdx}_${cat.toUpperCase()}}}`
      imageMarkers.set(marker, img.content)

      imagesByCategory[cat].push({ ...img, marker })
    })

    enhancedPrompt = `${prompt}

=== ⭐ USER-UPLOADED IMAGES — USE THESE FIRST, PROMINENTLY ===

The user uploaded ${images.length} image(s) and EXPECTS to see them in the result.
These markers WILL be replaced with the user's actual photos at render time:

- USE THE USER'S IMAGES PROMINENTLY (especially the hero — that's the first thing they'll look for).
- If only one image was uploaded, it should be the HERO visual (full-bleed background or featured image in the hero section).
- Do NOT default to placeholder URLs (picsum.photos / unsplash) when a user image is available for that role.
- Place markers EXACTLY as shown below, inside src="..." attributes. Do not modify them.

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
    const isImageChange = /\b(image|photo|picture|background|hero image|banner|thumbnail|avatar|logo)\b/.test(editLower) && /\b(change|swap|replace|update|new|different)\b/.test(editLower)
    const isColorChange = /color|theme|dark|light|palette|accent/.test(editLower)
    const isTextChange = /text|heading|title|copy|content|wording/.test(editLower)
    const isSectionAdd = /add|insert|include|create.*section/.test(editLower)
    const isSectionRemove = /remove|delete|hide.*section/.test(editLower)
    const isLayoutChange = /layout|grid|column|row|spacing|margin|padding/.test(editLower)
    const isComponentChange = /button|form|nav|footer|hero|card/.test(editLower)

    // Build precision guidance based on edit type. Image edits get extra
    // help: hero images are often inline `style="background-image: url(...)"`
    // on a positioned div rather than `<img>` tags, and the LLM previously
    // bailed with "couldn't find the code to change" because it didn't
    // realize that. This guidance teaches it to look in both places.
    let editGuidance = ''
    if (isImageChange) {
      editGuidance = `IMAGE EDIT: Find AND replace EVERY image URL pointing at the targeted region. Images can live in:
  • <img src="..."> attributes
  • <source srcset="..."> for picture elements
  • Inline style="background-image: url('...')" on divs/sections (HERO IMAGES ARE OFTEN HERE — not in <img> tags)
  • <meta property="og:image"> for social cards
  • CSS background-image rules in <style> blocks
  • JSON-LD "image" property in <script type="application/ld+json">
Generate a NEW placeholder URL — use /api/media?q=<descriptive-keyword>&w=<w>&h=<h> with a NEW seed value reflecting the requested subject. DO NOT say "couldn't find" — find every image URL in the existing HTML that matches the targeted region (hero, gallery, card, etc.) and update them. Output the FULL HTML with the swap applied.`
    } else if (isColorChange) {
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
1. PRESERVE 100% of HTML structure NOT mentioned in the request
2. PRESERVE class names, IDs, attributes on elements UNRELATED to the request
3. PRESERVE all script tags, style blocks, and meta information (unless the request is about scripts/styles)
4. PRESERVE all links (href), form actions, and interactive elements UNRELATED to the request
5. ONLY modify what is explicitly requested — but DO modify it. NEVER respond with "couldn't find" — the requested element IS in the HTML; locate it.

IMPORTANT: When the request asks to CHANGE/SWAP/REPLACE something (image, text, color, button, etc.) you MUST find every match and update it. Do not preserve the thing you were asked to change. Image-preservation only applies to images NOT being changed.

DIFF-STYLE APPROACH:
- "change hero text" → modify text inside hero section only
- "change the hero image" → find the hero's <img src=...> OR style="background-image: url(...)" OR <meta property="og:image"> and swap URL; keep all OTHER images intact
- "make button blue" → change ONLY button background color class
- "add testimonials" → insert new section, touch nothing else
- "swap the gallery photos" → update only the gallery's image URLs

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

FUNCTIONAL FORM PATTERN (must POST JSON, NOT FormData — the API requires it):
<form action="/api/forms/submit" method="POST" class="space-y-4" onsubmit="handleSubmit(event)" data-form-id="contact">
  <input type="email" name="email" required placeholder="Email" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
  <input type="text" name="name" placeholder="Your name" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
  <textarea name="message" required placeholder="Message" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl"></textarea>
  <button type="submit" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium">Send</button>
</form>
<script>
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.disabled = true; btn.textContent = 'Sending...';
  // Collect form fields into a plain object — API expects { projectId, formId, data } JSON
  const data = {};
  new FormData(form).forEach((value, key) => { data[key] = value; });
  const projectId = form.dataset.projectId || window.__PROJECT_ID__ || '';
  const formId = form.dataset.formId || 'contact';
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, formId, data, page: location.pathname })
    });
    if (res.ok) {
      form.reset();
      btn.textContent = 'Sent!';
      btn.classList.add('bg-emerald-600');
    } else {
      const err = await res.json().catch(() => ({}));
      btn.textContent = err.error || 'Error — try again';
    }
  } catch {
    btn.textContent = 'Error — try again';
  }
  setTimeout(() => { btn.disabled = false; btn.textContent = originalText; btn.classList.remove('bg-emerald-600'); }, 3000);
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
- Use /api/media?q=KEYWORD&w=WIDTH&h=HEIGHT for all images (real Pexels photos, always reliable)

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

⚠️ HARD OVERRIDE — THIS PRESET WINS OVER EVERY DEFAULT IN THE SYSTEM PROMPT:
The system prompt above contains examples using bg-slate-950, text-white, text-slate-300, indigo-500, purple-500, violet-500. THOSE ARE EXAMPLES FOR THE DEFAULT DARK THEME ONLY. For THIS generation:
- Replace EVERY bg-slate-950 / bg-slate-900 with bg-${t.background} / bg-${t.backgroundAlt}
- Replace EVERY text-white with text-${t.foreground}
- Replace EVERY text-slate-300 / text-slate-400 / text-slate-500 with text-${t.foregroundMuted}
- Replace EVERY indigo-500/600 / violet-500 / purple-500 with ${t.primary} (and its hover variant ${primaryHover})
- Replace EVERY border-white/5 / border-white/10 with border-${t.border}
${isDark ? '' : '- This is a LIGHT theme: do NOT use bg-slate-950, bg-black, text-white, or any dark backgrounds. Body must be light.'}
${isDark ? '' : '- Glass/backdrop effects on light theme: use bg-white/70 backdrop-blur-xl border border-slate-200 (not white/5).'}
${isDark ? '' : '- Mobile menu / dropdown bg on light theme: bg-white/95 backdrop-blur-xl border border-slate-200 (not slate-900/95).'}

If you output a single bg-slate-950 or text-white when this preset is light, the result is wrong. Apply the override mechanically — substitute as you write each class.
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

    // Anon callers get the strict `anonAi` bucket plus bot-UA / Cloudflare
    // reputation checks; signed-in users get the looser `aiGeneration` bucket
    // because there's already a per-user plan-credit ceiling enforced below.
    if (!session?.user?.id) {
      const blocked = guardAnonAbuse(req, { rateLimit: 'anonAi' })
      if (blocked) return blocked
    } else {
      try {
        checkApiRateLimit(req, 'aiGeneration')
      } catch (error) {
        const rateLimitResponse = handleRateLimitError(error)
        if (rateLimitResponse) return rateLimitResponse
        throw error
      }
    }

    // Parse body. Auth is enforced by middleware (or by Bearer token via
    // BYOK), so we don't need an anon cap here anymore. The signed-in user's
    // plan limits are enforced via trackUsage / checkUsageLimits below.
    const body = await req.json()
    const { prompt, currentHtml, apiKey, apiKeys, ingredients, stylePreset, serviceCredentials, outputMode, siblingPages, currentPage } = body
    // let-bound because the auto-router below may reassign when model is
    // 'auto' / 'best' / unset.
    let model: string | undefined = body.model

    const hasOwnKey = !!(
      apiKey ||
      apiKeys?.anthropic ||
      apiKeys?.openai ||
      apiKeys?.google
    )

    // Anon users get a single free generation (cookie-gated). After that,
    // they hit the signup wall in the workspace UI. BYOK bypasses the cap
    // entirely — power users pay their own LLM bill so they can iterate freely.
    // Logged-in users skip this and are governed by plan limits below.
    const ANON_COOKIE = 'wsanon'
    const ANON_LIMIT = 3
    let anonGenCount = 0
    let isAnonPass = false
    if (!session?.user?.id && !hasOwnKey) {
      anonGenCount = parseInt(req.cookies.get(ANON_COOKIE)?.value || '0', 10) || 0
      if (anonGenCount >= ANON_LIMIT) {
        return NextResponse.json(
          {
            error: `You've used your ${ANON_LIMIT} free generations on this browser. Sign up free to keep building (100 credits/month, no card) — or paste your own API key for unlimited.`,
            limit: ANON_LIMIT,
            used: anonGenCount,
            signupWall: true,
          },
          { status: 402 }
        )
      }
      isAnonPass = true
    }

    const streamHeaders: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
    if (isAnonPass) {
      // Increment the anon-gen counter. After ANON_LIMIT generations, the
      // next request returns 402 above and walls them to signup.
      const next = anonGenCount + 1
      streamHeaders['Set-Cookie'] = `${ANON_COOKIE}=${next}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`
    }

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
          const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
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

    // Fetch curated stock photos from Pexels — but ONLY if the user didn't
    // upload their own ingredient images. When a user drops an image in Stew,
    // their intent is "use my image", so we skip Pexels to avoid the AI
    // picking stock over the user's upload.
    const userUploadedImages = Array.isArray(ingredients)
      ? ingredients.filter((i: any) => i?.type === 'image').length
      : 0
    const stockResult = userUploadedImages > 0
      ? { markers: new Map<string, string>(), addendum: '' }
      : await fetchStockImagesForPrompt(prompt || '', 8)
    stockResult.markers.forEach((url, marker) => imageMarkers.set(marker, url))
    if (userUploadedImages > 0) {
      console.log(`[Generate] Skipping Pexels — user uploaded ${userUploadedImages} image(s); their content wins`)
    }

    // Multi-page awareness: if this generation is part of a multi-page site,
    // tell the AI about every sibling page so the nav links cleanly between
    // them and the current page is highlighted as active.
    let multiPageAddendum = ''
    if (Array.isArray(siblingPages) && siblingPages.length > 1) {
      const list = siblingPages
        .map((p: { name: string; slug: string; isHome?: boolean }) => {
          const href = p.isHome ? '/' : `/${p.slug}`
          const isActive = currentPage && (p.slug === currentPage.slug || p.name === currentPage.name)
          return `- ${p.name} → href="${href}"${isActive ? '  ← THIS PAGE (mark this nav link as active/current)' : ''}`
        })
        .join('\n')
      const currentLabel = currentPage ? `the "${currentPage.name}" page` : 'this page'
      multiPageAddendum = `\n\n🗺️ MULTI-PAGE SITE — THIS PAGE IS ${currentLabel.toUpperCase()}:
This site has these pages — your nav MUST link to all of them with the exact hrefs shown:
${list}

Rules:
- Build the nav (and any footer site-map column) so each item links to its sibling href above. NOT '#features' or '#about' for sibling pages — use the real /slug paths.
- The link for the CURRENT page should be styled as active (e.g. text-${stylePreset?.tokens?.primary || 'indigo-400'} or font-semibold or aria-current="page").
- For in-page anchors within THIS page, keep using #section-id as usual — that's separate from sibling-page navigation.
- Generate content that matches THIS page's purpose (e.g. an "About" page is about the team and story, NOT a generic landing). Don't dump a hero with "Get Started" CTAs on every page — match the page's role.`
    }

    // Add style preset to prompt
    const stylePrompt = getStylePresetPrompt(stylePreset)
    const fullUserPrompt = userPrompt + stylePrompt + stockResult.addendum + multiPageAddendum

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
      const industry = detectIndustry(prompt || fullUserPrompt)
      const isEcommerce = industry === 'ecommerce'
      const industryOverride = INDUSTRY_SECTION_OVERRIDES[industry]
      const systemPrompt = isEcommerce
        ? ECOMMERCE_SYSTEM_PROMPT
        : industryOverride
          ? `${SIMPLE_SYSTEM_PROMPT}\n\n${industryOverride}`
          : SIMPLE_SYSTEM_PROMPT

      console.log(`[Generate] Calling generateWithFreeProvider (industry: ${industry})`)

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

      // Swap any remaining placeholder/random images for topic-relevant photos
      const freeTopicImages = await fetchTopicImages(prompt || '')
      if (freeTopicImages.length > 0) {
        finalHtml = injectTopicImages(finalHtml, freeTopicImages)
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

    // Auto-route: when the client doesn't pin a model (or explicitly asks
    // for 'auto'), call pickBestModel and reassign. This lets a user run
    // "make the hero bigger" through Haiku (cheap, fast) and a fresh
    // site build through Sonnet (balanced) without thinking about it.
    // Manual model picks pass through untouched.
    if (!model || model === 'auto' || model === 'best') {
      const choice = pickBestModel(prompt || fullUserPrompt, currentHtml)
      console.log(`[Generate] Auto-router → ${choice.model} (${choice.reason})`)
      model = choice.model
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
                          model === 'claude-haiku' || model === 'claude-3-haiku' || model === 'claude-haiku-3.5' || model === 'claude-3.5-haiku' ? 'claude-haiku-4-5-20251001' :
                          model === 'claude' ? 'claude-sonnet-4-6' :
                          'claude-sonnet-4-6' // Default: Sonnet 4.6 — 16K is enough for a full multi-section site in one shot

      // Set max tokens based on model capabilities. Higher caps reduce truncation
      // to a single hero section. Continuation logic below handles stop_reason='max_tokens'.
      const maxTokens = claudeModel.includes('haiku') ? 16384 :
                        claudeModel.includes('sonnet') ? 16384 :
                        claudeModel.includes('opus') ? 32000 : 16384

      // Detect if this is an e-commerce request for better prompting
      const industry = detectIndustry(prompt || fullUserPrompt)
      const isEcommerce = industry === 'ecommerce'
      const industryOverride = INDUSTRY_SECTION_OVERRIDES[industry]
      const claudeSystemPrompt = isEcommerce
        ? ECOMMERCE_SYSTEM_PROMPT
        : industryOverride
          ? `${ENHANCED_SYSTEM_PROMPT}\n\n${industryOverride}`
          : ENHANCED_SYSTEM_PROMPT

      console.log(`[Generate] Using Claude ${claudeModel} (industry: ${industry})`)

      const encoder = new TextEncoder()
      let fullHtml = ''
      // Track the cleaned+marker-replaced HTML we've already pushed to the
      // client so we can stream deltas instead of cumulative full HTML.
      // This cuts streamed bytes by ~100x for long generations.
      let lastEmittedHtml = ''

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

          // Run a single streaming pass. Returns stop_reason so the caller can decide
          // whether to continue from the partial HTML.
          const runPass = async (
            messages: Array<{ role: 'user' | 'assistant'; content: string }>
          ): Promise<string> => {
            const pass = anthropic.messages.stream({
              model: claudeModel,
              max_tokens: maxTokens,
              system: claudeSystemPrompt,
              messages,
            })

            pass.on('text', (text) => {
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

              if (streamHtml === lastEmittedHtml) return

              if (streamHtml.startsWith(lastEmittedHtml)) {
                // Pure append (the common case) — emit only the new tail.
                const delta = streamHtml.slice(lastEmittedHtml.length)
                lastEmittedHtml = streamHtml
                safeEnqueue(encoder.encode(`data: ${JSON.stringify({ delta, streaming: true })}\n\n`))
              } else {
                // Non-append change — typically an image-marker substitution
                // shifted earlier content. Send the full canonical HTML so the
                // client resyncs cleanly.
                lastEmittedHtml = streamHtml
                safeEnqueue(encoder.encode(`data: ${JSON.stringify({ html: streamHtml, replace: true, streaming: true })}\n\n`))
              }
            })

            const finalMsg = await pass.finalMessage()
            return finalMsg.stop_reason || 'end_turn'
          }

          try {
            // First pass
            let stopReason = await runPass([
              { role: 'user', content: fullUserPrompt },
            ])

            // Continue up to 2 more times if Claude hit the token cap mid-generation.
            // We prefill the assistant turn with what was already produced — Claude
            // resumes exactly where it left off, no duplication.
            const MAX_CONTINUATIONS = 2
            let continuations = 0
            while (stopReason === 'max_tokens' && continuations < MAX_CONTINUATIONS) {
              continuations++
              console.log(`[Generate] stop_reason=max_tokens, continuing (pass ${continuations + 1}/${MAX_CONTINUATIONS + 1})`)
              stopReason = await runPass([
                { role: 'user', content: fullUserPrompt },
                { role: 'assistant', content: fullHtml },
                { role: 'user', content: 'Continue generating the rest of the HTML from exactly where you left off. Output nothing but the remaining HTML — no explanation, no markdown fence, no repeated content.' },
              ])
            }

            const wasTruncated = stopReason === 'max_tokens'
            if (wasTruncated) {
              console.warn('[Generate] Output still truncated after continuations — final HTML may be incomplete')
            }

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

            // Swap any remaining placeholder/random images for topic-relevant photos
            const claudeTopicImages = await fetchTopicImages(prompt || '')
            if (claudeTopicImages.length > 0) {
              finalHtml = injectTopicImages(finalHtml, claudeTopicImages)
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

            // Structural completeness check: if Claude was cut off mid-tag and even
            // the continuation passes didn't close the document, surface that to the UI
            // so the chat agent doesn't claim success while the preview is half-rendered.
            const finalLower = finalHtml.toLowerCase()
            const structurallyComplete = finalLower.includes('</body>') && finalLower.includes('</html>')
            const truncated = wasTruncated || !structurallyComplete

            safeEnqueue(encoder.encode(`data: ${JSON.stringify({
              html: finalHtml,
              complete: true,
              truncated,
              stopReason,
              provider: 'anthropic',
              model: claudeModel,
              usage: { creditsUsed, tokensUsed },
              imageStats: { total: imageMarkers.size, embedded: verification.imageCount, valid: verification.valid }
            })}\n\n`))
            safeEnqueue(encoder.encode('data: [DONE]\n\n'))
            safeClose()

            // Persist the completed build so the user can close the tab and
            // come back to it. Fire-and-forget — never block the stream on
            // this and never throw out of the SSE controller.
            if (userId) {
              try {
                const { recordCompletedBuild } = await import('@/lib/pending-builds')
                await recordCompletedBuild({
                  userId,
                  kind: 'website',
                  prompt: prompt || fullUserPrompt.slice(0, 500),
                  model: claudeModel,
                  html: finalHtml,
                })
              } catch (persistErr: any) {
                console.warn('[Claude] pending_builds upsert failed:', persistErr?.message || persistErr)
              }
            }
          } catch (error: any) {
            console.error('[Claude] Stream error:', error)
            safeEnqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`))
            safeClose()
            if (userId) {
              try {
                const { recordFailedBuild } = await import('@/lib/pending-builds')
                await recordFailedBuild({
                  userId,
                  kind: 'website',
                  prompt: prompt || fullUserPrompt.slice(0, 500),
                  model: claudeModel,
                  error: error?.message || 'Stream error',
                })
              } catch { /* swallow */ }
            }
          }
        }
      })

      return new Response(readable, { headers: streamHeaders })
    }

    // xAI Grok models — OpenAI-compatible API at https://api.x.ai/v1 .
    // Same OpenAI SDK, just a different baseURL and API key. Falls through
    // to the OpenAI branch below if user picked GPT, or to here for any
    // model id starting with "grok".
    const isGrokModel = (model || '').toLowerCase().startsWith('grok')
    const isXAI = isGrokModel
    if (isXAI) {
      console.log(`[Generate] Using xAI Grok: ${model}`)
    } else {
      console.log(`[Generate] Using OpenAI: ${model}`)
    }

    const openai = isXAI
      ? new OpenAI({
          apiKey: apiKey || (apiKeys as any)?.xai || process.env.XAI_API_KEY,
          baseURL: 'https://api.x.ai/v1',
        })
      : new OpenAI({
          apiKey: apiKey || apiKeys?.openai || process.env.OPENAI_API_KEY,
        })

    const selectedModel = isGrokModel
      ? (model === 'grok-2' || model === 'grok-2-1212' ? 'grok-2-1212' :
         model === 'grok-2-vision' || model === 'grok-2-vision-1212' ? 'grok-2-vision-1212' :
         model === 'grok-beta' ? 'grok-beta' :
         'grok-2-1212')
      : (model === 'gpt-4-turbo' ? 'gpt-4-turbo' :
         model === 'gpt-4' ? 'gpt-4' :
         model === 'gpt-3.5-turbo' ? 'gpt-3.5-turbo' :
         model === 'gpt-4o' ? 'gpt-4o' :
         model === 'gpt-4o-mini' ? 'gpt-4o-mini' :
         'gpt-4o')

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
    const industry = detectIndustry(prompt || fullUserPrompt)
    const isEcommerce = industry === 'ecommerce'
    const industryOverride = INDUSTRY_SECTION_OVERRIDES[industry]
    const openaiSystemPrompt = isEcommerce
      ? ECOMMERCE_SYSTEM_PROMPT
      : industryOverride
        ? `${ENHANCED_SYSTEM_PROMPT}\n\n${industryOverride}`
        : ENHANCED_SYSTEM_PROMPT

    console.log(`[Generate] Using OpenAI ${selectedModel} (industry: ${industry}, max_tokens: ${maxTokens})`)

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

          // Swap any remaining placeholder/random images for topic-relevant photos
          const streamTopicImages = await fetchTopicImages(prompt || '')
          if (streamTopicImages.length > 0) {
            finalHtml = injectTopicImages(finalHtml, streamTopicImages)
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
