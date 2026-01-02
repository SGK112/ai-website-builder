'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layout, Type, Image, Box, Grid3X3, Mail, ShoppingCart, Users,
  BarChart3, CreditCard, Layers, Sparkles, Wand2, Plus,
  Navigation, FileText, Quote, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComponentTemplate {
  id: string
  name: string
  icon: typeof Layout
  category: 'layout' | 'content' | 'media' | 'commerce' | 'social'
  description: string
  html: string
  preview?: string
}

const componentTemplates: ComponentTemplate[] = [
  // Layout Components
  {
    id: 'hero-gradient',
    name: 'Hero Section',
    icon: Layout,
    category: 'layout',
    description: 'Full-width hero with gradient',
    html: `<section class="relative min-h-[80vh] flex items-center py-20 overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-violet-600/20"></div>
  <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0); background-size: 40px 40px;"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-6">
    <div class="max-w-3xl">
      <span class="inline-block px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium mb-6">✨ New Feature Available</span>
      <h1 class="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
        Build Something <span class="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Amazing</span>
      </h1>
      <p class="text-xl text-slate-300 mb-8 max-w-xl">Transform your ideas into reality with our cutting-edge platform. Start building today.</p>
      <div class="flex flex-wrap gap-4">
        <a href="#" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30">Get Started Free</a>
        <a href="#" class="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition backdrop-blur">Watch Demo</a>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: 'navbar-glass',
    name: 'Glass Navbar',
    icon: Navigation,
    category: 'layout',
    description: 'Sticky glassmorphic navigation',
    html: `<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#features" class="text-slate-300 hover:text-white transition">Features</a>
      <a href="#pricing" class="text-slate-300 hover:text-white transition">Pricing</a>
      <a href="#about" class="text-slate-300 hover:text-white transition">About</a>
      <a href="#contact" class="text-slate-300 hover:text-white transition">Contact</a>
    </div>
    <div class="flex items-center gap-4">
      <a href="#" class="text-slate-300 hover:text-white transition hidden md:block">Log in</a>
      <a href="#" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition">Sign Up</a>
    </div>
  </div>
</nav>`
  },
  {
    id: 'features-grid',
    name: 'Features Grid',
    icon: Grid3X3,
    category: 'content',
    description: '3-column feature cards',
    html: `<section class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <span class="text-indigo-400 font-medium mb-4 block">Why Choose Us</span>
      <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">Powerful Features</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">Everything you need to succeed, all in one place.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:border-indigo-500/50 transition group">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/30 transition">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
        <p class="text-slate-400">Optimized for speed and performance. Load times under 100ms.</p>
      </div>
      <div class="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:border-indigo-500/50 transition group">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/30 transition">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Secure by Default</h3>
        <p class="text-slate-400">Enterprise-grade security with end-to-end encryption.</p>
      </div>
      <div class="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:border-indigo-500/50 transition group">
        <div class="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/30 transition">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Fully Customizable</h3>
        <p class="text-slate-400">Tailor every aspect to match your brand perfectly.</p>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    icon: Quote,
    category: 'social',
    description: 'Customer reviews carousel',
    html: `<section class="py-24 px-6 bg-slate-900/50">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-white mb-4">Loved by Thousands</h2>
      <p class="text-slate-400">See what our customers are saying</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
        <div class="flex gap-1 mb-4 text-yellow-400">★★★★★</div>
        <p class="text-slate-300 mb-6 italic">"This platform completely transformed how we work. The speed and reliability are unmatched."</p>
        <div class="flex items-center gap-4">
          <img src="https://i.pravatar.cc/48?img=1" alt="Sarah Johnson" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Sarah Johnson</div>
            <div class="text-sm text-slate-500">CEO, TechStart</div>
          </div>
        </div>
      </div>
      <div class="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
        <div class="flex gap-1 mb-4 text-yellow-400">★★★★★</div>
        <p class="text-slate-300 mb-6 italic">"The best investment we've made. ROI was visible within the first month."</p>
        <div class="flex items-center gap-4">
          <img src="https://i.pravatar.cc/48?img=12" alt="Michael Chen" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Michael Chen</div>
            <div class="text-sm text-slate-500">CTO, ScaleUp</div>
          </div>
        </div>
      </div>
      <div class="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
        <div class="flex gap-1 mb-4 text-yellow-400">★★★★★</div>
        <p class="text-slate-300 mb-6 italic">"Support team is incredible. They helped us migrate in under 24 hours."</p>
        <div class="flex items-center gap-4">
          <img src="https://i.pravatar.cc/48?img=5" alt="Emily Davis" class="w-12 h-12 rounded-full">
          <div>
            <div class="font-semibold text-white">Emily Davis</div>
            <div class="text-sm text-slate-500">Founder, GrowFast</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: 'pricing-cards',
    name: 'Pricing Table',
    icon: CreditCard,
    category: 'commerce',
    description: '3-tier pricing cards',
    html: `<section class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-white mb-4">Simple Pricing</h2>
      <p class="text-slate-400">No hidden fees. Cancel anytime.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <h3 class="text-xl font-semibold text-white mb-2">Starter</h3>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold text-white">$9</span>
          <span class="text-slate-500">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>5 Projects</li>
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Basic Analytics</li>
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Email Support</li>
        </ul>
        <a href="#" class="block w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-center transition">Get Started</a>
      </div>
      <div class="p-8 bg-gradient-to-b from-indigo-600/20 to-violet-600/20 rounded-2xl border border-indigo-500/30 relative">
        <div class="absolute -top-3 right-6 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">Most Popular</div>
        <h3 class="text-xl font-semibold text-white mb-2">Pro</h3>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold text-white">$29</span>
          <span class="text-slate-400">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Unlimited Projects</li>
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Advanced Analytics</li>
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Priority Support</li>
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Custom Domain</li>
        </ul>
        <a href="#" class="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-center transition">Get Started</a>
      </div>
      <div class="p-8 bg-white/5 rounded-2xl border border-white/10">
        <h3 class="text-xl font-semibold text-white mb-2">Enterprise</h3>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-bold text-white">$99</span>
          <span class="text-slate-500">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Everything in Pro</li>
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>SSO & SAML</li>
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Dedicated Support</li>
          <li class="flex items-center gap-3 text-slate-300"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>SLA Guarantee</li>
        </ul>
        <a href="#" class="block w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-center transition">Contact Sales</a>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    icon: Mail,
    category: 'content',
    description: 'Modern contact form',
    html: `<section class="py-24 px-6">
  <div class="max-w-2xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-4xl font-bold text-white mb-4">Get in Touch</h2>
      <p class="text-slate-400">We'd love to hear from you. Send us a message.</p>
    </div>
    <form class="space-y-6 p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">First Name</label>
          <input type="text" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" placeholder="John">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
          <input type="text" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" placeholder="Doe">
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Email</label>
        <input type="email" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" placeholder="john@example.com">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Message</label>
        <textarea rows="4" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none" placeholder="Your message..."></textarea>
      </div>
      <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition">Send Message</button>
    </form>
  </div>
</section>`
  },
  {
    id: 'cta-section',
    name: 'Call to Action',
    icon: Zap,
    category: 'content',
    description: 'Gradient CTA banner',
    html: `<section class="py-24 px-6">
  <div class="max-w-4xl mx-auto text-center p-12 bg-gradient-to-r from-indigo-600/20 via-violet-600/20 to-purple-600/20 rounded-3xl border border-white/10 relative overflow-hidden">
    <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0); background-size: 20px 20px;"></div>
    <div class="relative z-10">
      <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Get Started?</h2>
      <p class="text-slate-300 mb-8 max-w-xl mx-auto">Join thousands of satisfied customers and transform your business today.</p>
      <div class="flex flex-wrap justify-center gap-4">
        <a href="#" class="px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition shadow-lg">Start Free Trial</a>
        <a href="#" class="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition">Schedule Demo</a>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: 'footer-full',
    name: 'Footer',
    icon: FileText,
    category: 'layout',
    description: 'Multi-column footer',
    html: `<footer class="py-16 px-6 border-t border-white/10">
  <div class="max-w-7xl mx-auto">
    <div class="grid md:grid-cols-4 gap-12 mb-12">
      <div>
        <a href="#" class="text-xl font-bold text-white mb-4 block">Brand</a>
        <p class="text-slate-400 text-sm">Building the future of web development, one pixel at a time.</p>
      </div>
      <div>
        <h4 class="font-semibold text-white mb-4">Product</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Features</a></li>
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Pricing</a></li>
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Changelog</a></li>
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Roadmap</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-white mb-4">Company</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">About</a></li>
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Blog</a></li>
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Careers</a></li>
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-white mb-4">Legal</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Privacy</a></li>
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Terms</a></li>
          <li><a href="#" class="text-slate-400 hover:text-white transition text-sm">Cookies</a></li>
        </ul>
      </div>
    </div>
    <div class="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-slate-500 text-sm">© 2025 Brand. All rights reserved.</p>
      <div class="flex gap-4">
        <a href="#" class="text-slate-400 hover:text-white transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
        <a href="#" class="text-slate-400 hover:text-white transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
        <a href="#" class="text-slate-400 hover:text-white transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
      </div>
    </div>
  </div>
</footer>`
  },
  {
    id: 'stats-bar',
    name: 'Stats Section',
    icon: BarChart3,
    category: 'content',
    description: 'Animated statistics',
    html: `<section class="py-16 px-6 bg-slate-900/50 border-y border-white/5">
  <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
    <div class="text-center">
      <div class="text-4xl md:text-5xl font-bold text-white mb-2" data-count="10000">10K+</div>
      <div class="text-slate-400 text-sm">Happy Customers</div>
    </div>
    <div class="text-center">
      <div class="text-4xl md:text-5xl font-bold text-white mb-2" data-count="99">99%</div>
      <div class="text-slate-400 text-sm">Uptime SLA</div>
    </div>
    <div class="text-center">
      <div class="text-4xl md:text-5xl font-bold text-white mb-2" data-count="50">50+</div>
      <div class="text-slate-400 text-sm">Countries Served</div>
    </div>
    <div class="text-center">
      <div class="text-4xl md:text-5xl font-bold text-white mb-2" data-count="24">24/7</div>
      <div class="text-slate-400 text-sm">Expert Support</div>
    </div>
  </div>
</section>`
  },
]

interface ComponentPaletteProps {
  onInsert: (html: string) => void
  onAiGenerate: (componentType: string) => void
}

export function ComponentPalette({ onInsert, onAiGenerate }: ComponentPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAiPrompt, setShowAiPrompt] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')

  const categories = [
    { id: 'layout', name: 'Layout', icon: Layout },
    { id: 'content', name: 'Content', icon: Type },
    { id: 'media', name: 'Media', icon: Image },
    { id: 'commerce', name: 'Commerce', icon: ShoppingCart },
    { id: 'social', name: 'Social', icon: Users },
  ]

  const filteredComponents = componentTemplates.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !activeCategory || comp.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleInsert = useCallback((template: ComponentTemplate) => {
    onInsert(template.html)
  }, [onInsert])

  const handleAiGenerate = useCallback(() => {
    if (aiPrompt.trim()) {
      onAiGenerate(aiPrompt)
      setAiPrompt('')
      setShowAiPrompt(false)
    }
  }, [aiPrompt, onAiGenerate])

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white">Components</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* AI Generate Section */}
      <div className="p-4 border-b border-white/10">
        <AnimatePresence mode="wait">
          {showAiPrompt ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the component you want..."
                className="w-full px-4 py-3 bg-white/5 border border-indigo-500/30 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAiGenerate}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate
                </button>
                <button
                  onClick={() => setShowAiPrompt(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAiPrompt(true)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 hover:from-indigo-600/30 hover:to-violet-600/30 border border-indigo-500/30 rounded-xl text-white font-medium transition flex items-center justify-center gap-2 group"
            >
              <Wand2 className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition" />
              <span>AI Generate Component</span>
              <Sparkles className="w-3 h-3 text-violet-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Categories */}
      <div className="flex gap-1 p-2 border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap",
            !activeCategory ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/10"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5",
              activeCategory === cat.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Component Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredComponents.map((comp) => (
            <motion.button
              key={comp.id}
              onClick={() => handleInsert(comp)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 rounded-xl transition text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition">
                  <comp.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{comp.name}</span>
                    <Plus className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <p className="text-sm text-slate-400 truncate">{comp.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No components found</p>
            <button
              onClick={() => setShowAiPrompt(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300 transition text-sm"
            >
              Try AI generation instead
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComponentPalette
