'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search,
  Grid3X3,
  LayoutList,
  Star,
  Heart,
  Eye,
  Download,
  TrendingUp,
  DollarSign,
  ChevronRight,
  X,
  ExternalLink,
  CheckCircle2,
  Crown,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  Moon,
  Sun,
  Loader2,
  Users,
  Globe,
  Plus,
  Upload,
  Github,
  Code2,
  Palette,
  Layers,
  ArrowUpRight,
  Zap,
  BadgeCheck,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Creator {
  id: string
  name: string
  username: string
  avatar: string
  verified: boolean
  bio: string
  earnings: number
  templates: number
  sales: number
  followers: number
  following: number
  joinedDate: string
  socials?: {
    twitter?: string
    github?: string
    website?: string
  }
}

interface Template {
  id: string
  name: string
  description: string
  price: number
  author: {
    name: string
    avatar: string
    verified: boolean
    id?: string
  }
  thumbnail: string
  category: string
  tags: string[]
  stats: {
    views: number
    downloads: number
    rating: number
    reviews: number
  }
  featured?: boolean
  new?: boolean
  html: string
  css: string
  source?: 'community' | 'official' | 'partner'
}

interface CommunitySource {
  id: string
  name: string
  description: string
  url: string
  icon: string
  templates: number
  type: 'open-source' | 'premium' | 'mixed'
}

// Featured creators
const TOP_CREATORS: Creator[] = [
  {
    id: 'creator-1',
    name: 'Alex Chen',
    username: 'alexchen',
    avatar: 'A',
    verified: true,
    bio: 'Design systems & SaaS templates',
    earnings: 24500,
    templates: 12,
    sales: 847,
    followers: 2340,
    following: 156,
    joinedDate: '2024-01',
    socials: { twitter: 'alexchen', github: 'alexchen' }
  },
  {
    id: 'creator-2',
    name: 'Studio Brthrs',
    username: 'studiobrthrs',
    avatar: 'S',
    verified: true,
    bio: 'Minimal & elegant web designs',
    earnings: 18200,
    templates: 8,
    sales: 623,
    followers: 1890,
    following: 89,
    joinedDate: '2024-02',
    socials: { website: 'studiobrthrs.com' }
  },
  {
    id: 'creator-3',
    name: 'Emily Wang',
    username: 'emilywang',
    avatar: 'E',
    verified: true,
    bio: 'E-commerce & fashion templates',
    earnings: 15800,
    templates: 6,
    sales: 412,
    followers: 1456,
    following: 234,
    joinedDate: '2024-03',
    socials: { twitter: 'emilywang_design' }
  },
]

// Community/Open-source template sources
const COMMUNITY_SOURCES: CommunitySource[] = [
  {
    id: 'tailwindui',
    name: 'Tailwind UI',
    description: 'Official Tailwind CSS component library',
    url: 'https://tailwindui.com',
    icon: '🎨',
    templates: 500,
    type: 'premium'
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    description: 'Open-source components for React',
    url: 'https://ui.shadcn.com',
    icon: '⚡',
    templates: 40,
    type: 'open-source'
  },
  {
    id: 'daisyui',
    name: 'DaisyUI',
    description: 'Free Tailwind CSS component library',
    url: 'https://daisyui.com',
    icon: '🌼',
    templates: 50,
    type: 'open-source'
  },
  {
    id: 'flowbite',
    name: 'Flowbite',
    description: 'Tailwind CSS components & templates',
    url: 'https://flowbite.com',
    icon: '💧',
    templates: 400,
    type: 'mixed'
  },
]

const CATEGORIES = [
  { id: 'all', name: 'All Templates', count: 12, icon: Layers },
  { id: 'portfolio', name: 'Portfolio', count: 3, icon: Users },
  { id: 'saas', name: 'SaaS', count: 3, icon: Zap },
  { id: 'agency', name: 'Agency', count: 2, icon: Globe },
  { id: 'ecommerce', name: 'E-commerce', count: 2, icon: DollarSign },
  { id: 'blog', name: 'Blog', count: 2, icon: Code2 },
]

// Real template content with actual HTML/CSS
const TEMPLATES: Template[] = [
  {
    id: 'architect-portfolio',
    name: 'Architect Portfolio',
    description: 'Elegant portfolio for architects and designers with project showcase',
    price: 49,
    author: { name: 'Studio Brthrs', avatar: 'S', verified: true },
    thumbnail: '/templates/architect.jpg',
    category: 'portfolio',
    tags: ['minimal', 'dark', 'portfolio'],
    stats: { views: 12400, downloads: 847, rating: 4.9, reviews: 128 },
    featured: true,
    html: `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div class="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <span class="text-white font-bold tracking-widest text-sm">ARCH STUDIO</span>
          <div class="flex items-center gap-10">
            <a href="#" class="text-neutral-400 hover:text-white text-sm tracking-wide transition">WORK</a>
            <a href="#" class="text-neutral-400 hover:text-white text-sm tracking-wide transition">SERVICES</a>
            <a href="#" class="text-neutral-400 hover:text-white text-sm tracking-wide transition">ABOUT</a>
            <a href="#" class="text-neutral-400 hover:text-white text-sm tracking-wide transition">BLOG</a>
            <a href="#" class="text-neutral-400 hover:text-white text-sm tracking-wide transition">CONTACT</a>
          </div>
          <button class="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          </button>
        </div>
      </nav>

      <section class="pt-32 pb-20 bg-neutral-900">
        <div class="max-w-7xl mx-auto px-8">
          <div class="grid grid-cols-2 gap-20">
            <div>
              <p class="text-neutral-500 text-sm tracking-widest mb-6">ABOUT</p>
              <h1 class="text-5xl font-light text-white leading-tight mb-8">Design Philosophy</h1>
              <p class="text-neutral-400 text-lg leading-relaxed mb-8">
                We believe architecture should enhance human experience while respecting the natural environment. Our practice focuses on creating spaces that are both functional and poetic.
              </p>
              <p class="text-neutral-400 leading-relaxed">
                Founded in 2015, our studio has completed over 200 projects across residential, commercial, and cultural sectors. Each project begins with careful listening and ends with thoughtful execution.
              </p>
            </div>
            <div>
              <p class="text-neutral-500 text-sm tracking-widest mb-6">APPROACH</p>
              <div class="space-y-6">
                <div class="border-l-2 border-neutral-700 pl-6 py-2">
                  <h3 class="text-white font-medium text-lg mb-2">Research</h3>
                  <p class="text-neutral-500">Deep understanding of context, culture, and climate</p>
                </div>
                <div class="border-l-2 border-neutral-700 pl-6 py-2">
                  <h3 class="text-white font-medium text-lg mb-2">Collaboration</h3>
                  <p class="text-neutral-500">Close partnership with clients, engineers, and craftspeople</p>
                </div>
                <div class="border-l-2 border-neutral-700 pl-6 py-2">
                  <h3 class="text-white font-medium text-lg mb-2">Innovation</h3>
                  <p class="text-neutral-500">Sustainable materials and forward-thinking design solutions</p>
                </div>
              </div>
              <div class="flex gap-20 mt-12 pt-8 border-t border-neutral-800">
                <div>
                  <p class="text-neutral-500 text-sm mb-1">FOUNDED</p>
                  <p class="text-white text-3xl font-light">2015</p>
                </div>
                <div>
                  <p class="text-neutral-500 text-sm mb-1">PROJECTS</p>
                  <p class="text-white text-3xl font-light">200+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-neutral-950">
        <div class="max-w-7xl mx-auto px-8">
          <div class="flex items-center justify-between mb-12">
            <h2 class="text-3xl text-white font-light">Selected Projects</h2>
            <a href="#" class="text-neutral-400 hover:text-white text-sm flex items-center gap-2 transition">View All <span>→</span></a>
          </div>
          <div class="grid grid-cols-3 gap-6">
            <div class="group cursor-pointer">
              <div class="aspect-[4/3] bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg mb-4 overflow-hidden">
                <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h3 class="text-white font-medium mb-1">Mountain Retreat</h3>
              <p class="text-neutral-500 text-sm">Residential • Colorado</p>
            </div>
            <div class="group cursor-pointer">
              <div class="aspect-[4/3] bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg mb-4 overflow-hidden">
                <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h3 class="text-white font-medium mb-1">Urban Gallery</h3>
              <p class="text-neutral-500 text-sm">Cultural • New York</p>
            </div>
            <div class="group cursor-pointer">
              <div class="aspect-[4/3] bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg mb-4 overflow-hidden">
                <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h3 class="text-white font-medium mb-1">Coastal Office</h3>
              <p class="text-neutral-500 text-sm">Commercial • Miami</p>
            </div>
          </div>
        </div>
      </section>
    `,
    css: `
      body { background: #171717; }
    `,
  },
  {
    id: 'saas-starter',
    name: 'SaaS Starter',
    description: 'Modern SaaS landing page with hero, features, pricing, and testimonials',
    price: 59,
    author: { name: 'Launch Co', avatar: 'L', verified: true },
    thumbnail: '/templates/saas.jpg',
    category: 'saas',
    tags: ['saas', 'startup', 'modern'],
    stats: { views: 18200, downloads: 1240, rating: 4.8, reviews: 186 },
    featured: true,
    html: `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg"></div>
            <span class="font-bold text-gray-900">Acme</span>
          </div>
          <div class="flex items-center gap-8">
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Pricing</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Docs</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Blog</a>
          </div>
          <div class="flex items-center gap-4">
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm font-medium">Sign in</a>
            <a href="#" class="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition">Get Started</a>
          </div>
        </div>
      </nav>

      <section class="pt-32 pb-20 bg-gradient-to-b from-violet-50 via-white to-white">
        <div class="max-w-4xl mx-auto px-6 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full mb-8">
            <span class="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
            Now in public beta
          </div>
          <h1 class="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Build products faster with <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">AI-powered</span> tools
          </h1>
          <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            The all-in-one platform that helps teams ship better products. From idea to launch in days, not months.
          </p>
          <div class="flex items-center justify-center gap-4">
            <a href="#" class="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg shadow-gray-900/20 transition">
              Start for free
            </a>
            <a href="#" class="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Watch demo
            </a>
          </div>
          <p class="text-sm text-gray-500 mt-6">No credit card required • 14-day free trial</p>
        </div>
      </section>

      <section class="py-20 bg-white">
        <div class="max-w-6xl mx-auto px-6">
          <p class="text-center text-sm text-gray-500 mb-8">Trusted by 10,000+ companies worldwide</p>
          <div class="flex items-center justify-center gap-12 opacity-50">
            <div class="text-2xl font-bold text-gray-400">Stripe</div>
            <div class="text-2xl font-bold text-gray-400">Vercel</div>
            <div class="text-2xl font-bold text-gray-400">Linear</div>
            <div class="text-2xl font-bold text-gray-400">Notion</div>
            <div class="text-2xl font-bold text-gray-400">Figma</div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-gray-50">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Everything you need to ship fast</h2>
            <p class="text-gray-600 max-w-2xl mx-auto">Powerful features that help you build, deploy, and scale your applications.</p>
          </div>
          <div class="grid grid-cols-3 gap-8">
            <div class="p-6 bg-white rounded-2xl border border-gray-100">
              <div class="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p class="text-gray-600 text-sm">Deploy in seconds with our globally distributed edge network.</p>
            </div>
            <div class="p-6 bg-white rounded-2xl border border-gray-100">
              <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Enterprise Security</h3>
              <p class="text-gray-600 text-sm">SOC 2 compliant with end-to-end encryption for all your data.</p>
            </div>
            <div class="p-6 bg-white rounded-2xl border border-gray-100">
              <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
              <p class="text-gray-600 text-sm">Real-time collaboration with unlimited team members.</p>
            </div>
          </div>
        </div>
      </section>
    `,
    css: `
      body { background: white; }
    `,
  },
  {
    id: 'agency-bold',
    name: 'Agency Bold',
    description: 'Creative agency website with bold typography and case studies',
    price: 69,
    author: { name: 'Digital Craft', avatar: 'D', verified: true },
    thumbnail: '/templates/agency.jpg',
    category: 'agency',
    tags: ['agency', 'creative', 'bold'],
    stats: { views: 9800, downloads: 567, rating: 4.7, reviews: 92 },
    new: true,
    html: `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-black">
        <div class="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <span class="text-white font-black text-xl tracking-tight">BOLD.</span>
          <div class="flex items-center gap-8">
            <a href="#" class="text-white/70 hover:text-white text-sm font-medium transition">Work</a>
            <a href="#" class="text-white/70 hover:text-white text-sm font-medium transition">Services</a>
            <a href="#" class="text-white/70 hover:text-white text-sm font-medium transition">About</a>
            <a href="#" class="text-white/70 hover:text-white text-sm font-medium transition">Contact</a>
          </div>
          <a href="#" class="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-white/90 transition">Let's Talk</a>
        </div>
      </nav>

      <section class="pt-40 pb-32 bg-black overflow-hidden">
        <div class="max-w-7xl mx-auto px-8">
          <div class="max-w-4xl">
            <h1 class="text-7xl md:text-8xl font-black text-white leading-none mb-8">
              We create <br/>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">digital</span><br/>
              experiences
            </h1>
            <p class="text-xl text-white/60 max-w-lg mb-12">
              Award-winning creative agency helping brands stand out in the digital landscape since 2015.
            </p>
            <div class="flex items-center gap-6">
              <a href="#" class="group flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-white/90 transition">
                View Our Work
                <span class="group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a href="#" class="text-white/70 hover:text-white font-medium transition">Watch Showreel</a>
            </div>
          </div>
        </div>
      </section>

      <section class="py-32 bg-black border-t border-white/10">
        <div class="max-w-7xl mx-auto px-8">
          <div class="grid grid-cols-4 gap-8 text-center">
            <div>
              <p class="text-5xl font-black text-white mb-2">150+</p>
              <p class="text-white/50 text-sm">Projects Delivered</p>
            </div>
            <div>
              <p class="text-5xl font-black text-white mb-2">45</p>
              <p class="text-white/50 text-sm">Awards Won</p>
            </div>
            <div>
              <p class="text-5xl font-black text-white mb-2">12</p>
              <p class="text-white/50 text-sm">Countries</p>
            </div>
            <div>
              <p class="text-5xl font-black text-white mb-2">98%</p>
              <p class="text-white/50 text-sm">Happy Clients</p>
            </div>
          </div>
        </div>
      </section>

      <section class="py-32 bg-neutral-950">
        <div class="max-w-7xl mx-auto px-8">
          <div class="flex items-end justify-between mb-16">
            <h2 class="text-5xl font-black text-white">Featured Work</h2>
            <a href="#" class="text-white/60 hover:text-white flex items-center gap-2 font-medium transition">View All <span>→</span></a>
          </div>
          <div class="grid grid-cols-2 gap-8">
            <div class="group cursor-pointer">
              <div class="aspect-[4/3] bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl mb-6 overflow-hidden relative">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/50">
                  <span class="px-6 py-3 bg-white text-black font-bold rounded-full">View Case Study</span>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2">Nike Campaign</h3>
              <p class="text-white/50">Brand Identity • Digital Campaign</p>
            </div>
            <div class="group cursor-pointer">
              <div class="aspect-[4/3] bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl mb-6 overflow-hidden relative">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/50">
                  <span class="px-6 py-3 bg-white text-black font-bold rounded-full">View Case Study</span>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2">Spotify Wrapped</h3>
              <p class="text-white/50">Interactive • Motion Design</p>
            </div>
          </div>
        </div>
      </section>
    `,
    css: `
      body { background: black; }
    `,
  },
  {
    id: 'minimal-blog',
    name: 'Minimal Blog',
    description: 'Clean and elegant blog template with great typography',
    price: 0,
    author: { name: 'Free Templates', avatar: 'F', verified: true },
    thumbnail: '/templates/blog.jpg',
    category: 'blog',
    tags: ['free', 'blog', 'minimal'],
    stats: { views: 32000, downloads: 5600, rating: 4.6, reviews: 412 },
    html: `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div class="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="#" class="text-xl font-serif font-semibold text-gray-900">The Journal</a>
          <div class="flex items-center gap-6">
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm transition">Articles</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm transition">Categories</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm transition">About</a>
            <button class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <section class="pt-32 pb-16 bg-white">
        <div class="max-w-3xl mx-auto px-6 text-center">
          <p class="text-sm text-gray-500 uppercase tracking-wider mb-4">Featured Article</p>
          <h1 class="text-4xl md:text-5xl font-serif text-gray-900 leading-tight mb-6">
            The Art of Simplicity in Modern Design
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Exploring how minimalism shapes the way we create and experience digital products in 2024.
          </p>
          <div class="flex items-center justify-center gap-4">
            <div class="w-10 h-10 rounded-full bg-gray-200"></div>
            <div class="text-left">
              <p class="text-sm font-medium text-gray-900">Sarah Mitchell</p>
              <p class="text-xs text-gray-500">Dec 15, 2024 • 8 min read</p>
            </div>
          </div>
        </div>
      </section>

      <section class="py-16 bg-gray-50">
        <div class="max-w-5xl mx-auto px-6">
          <h2 class="text-2xl font-serif text-gray-900 mb-8">Latest Articles</h2>
          <div class="grid grid-cols-2 gap-8">
            <article class="bg-white rounded-xl overflow-hidden border border-gray-100 group cursor-pointer hover:shadow-lg transition">
              <div class="aspect-[16/10] bg-gradient-to-br from-blue-100 to-purple-100"></div>
              <div class="p-6">
                <p class="text-xs text-blue-600 font-medium mb-2">DESIGN</p>
                <h3 class="text-lg font-serif text-gray-900 mb-2 group-hover:text-blue-600 transition">Building Design Systems That Scale</h3>
                <p class="text-gray-600 text-sm mb-4">A practical guide to creating consistent design languages across teams and products.</p>
                <p class="text-xs text-gray-500">Dec 12, 2024 • 6 min read</p>
              </div>
            </article>
            <article class="bg-white rounded-xl overflow-hidden border border-gray-100 group cursor-pointer hover:shadow-lg transition">
              <div class="aspect-[16/10] bg-gradient-to-br from-amber-100 to-orange-100"></div>
              <div class="p-6">
                <p class="text-xs text-amber-600 font-medium mb-2">CREATIVITY</p>
                <h3 class="text-lg font-serif text-gray-900 mb-2 group-hover:text-amber-600 transition">Finding Inspiration in Constraints</h3>
                <p class="text-gray-600 text-sm mb-4">How limitations can actually fuel your most creative work and breakthrough ideas.</p>
                <p class="text-xs text-gray-500">Dec 10, 2024 • 5 min read</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    `,
    css: `
      body { background: white; font-family: Georgia, serif; }
    `,
  },
  {
    id: 'ecommerce-fashion',
    name: 'Fashion Store',
    description: 'Elegant e-commerce template for fashion and lifestyle brands',
    price: 79,
    author: { name: 'Commerce Labs', avatar: 'C', verified: true },
    thumbnail: '/templates/fashion.jpg',
    category: 'ecommerce',
    tags: ['ecommerce', 'fashion', 'elegant'],
    stats: { views: 14500, downloads: 890, rating: 4.8, reviews: 145 },
    featured: true,
    html: `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-white">
        <div class="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <span class="text-xl font-light tracking-[0.3em] text-gray-900">ATELIER</span>
          <div class="flex items-center gap-10">
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm tracking-wide transition">New Arrivals</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm tracking-wide transition">Women</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm tracking-wide transition">Men</a>
            <a href="#" class="text-gray-600 hover:text-gray-900 text-sm tracking-wide transition">Accessories</a>
          </div>
          <div class="flex items-center gap-4">
            <button class="text-gray-600 hover:text-gray-900 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
            <button class="text-gray-600 hover:text-gray-900 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <section class="pt-24 bg-stone-100">
        <div class="max-w-7xl mx-auto px-8 py-16">
          <div class="grid grid-cols-2 gap-16 items-center">
            <div>
              <p class="text-sm tracking-widest text-stone-500 mb-4">WINTER COLLECTION 2024</p>
              <h1 class="text-5xl font-light text-gray-900 leading-tight mb-6">
                Timeless<br/>Elegance
              </h1>
              <p class="text-gray-600 mb-8 max-w-md">
                Discover our curated selection of premium essentials designed for the modern wardrobe.
              </p>
              <a href="#" class="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white text-sm tracking-wider hover:bg-gray-800 transition">
                SHOP NOW
                <span>→</span>
              </a>
            </div>
            <div class="aspect-[3/4] bg-gradient-to-br from-stone-200 to-stone-300 rounded-sm">
              <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800')] bg-cover bg-center"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-8">
          <div class="flex items-center justify-between mb-12">
            <h2 class="text-2xl font-light text-gray-900">New Arrivals</h2>
            <a href="#" class="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">View All <span>→</span></a>
          </div>
          <div class="grid grid-cols-4 gap-8">
            <div class="group cursor-pointer">
              <div class="aspect-[3/4] bg-stone-100 mb-4 overflow-hidden">
                <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h3 class="text-sm font-medium text-gray-900 mb-1">Wool Blend Coat</h3>
              <p class="text-sm text-gray-500">$395</p>
            </div>
            <div class="group cursor-pointer">
              <div class="aspect-[3/4] bg-stone-100 mb-4 overflow-hidden">
                <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h3 class="text-sm font-medium text-gray-900 mb-1">Cashmere Sweater</h3>
              <p class="text-sm text-gray-500">$245</p>
            </div>
            <div class="group cursor-pointer">
              <div class="aspect-[3/4] bg-stone-100 mb-4 overflow-hidden">
                <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h3 class="text-sm font-medium text-gray-900 mb-1">Silk Blouse</h3>
              <p class="text-sm text-gray-500">$185</p>
            </div>
            <div class="group cursor-pointer">
              <div class="aspect-[3/4] bg-stone-100 mb-4 overflow-hidden">
                <div class="w-full h-full bg-[url('https://images.unsplash.com/photo-1560243563-062bfc001d68?w=600')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              </div>
              <h3 class="text-sm font-medium text-gray-900 mb-1">Tailored Trousers</h3>
              <p class="text-sm text-gray-500">$165</p>
            </div>
          </div>
        </div>
      </section>
    `,
    css: `
      body { background: white; }
    `,
  },
  {
    id: 'developer-portfolio',
    name: 'Developer Portfolio',
    description: 'Dark-themed portfolio for developers with project showcase and skills',
    price: 39,
    author: { name: 'Code Studio', avatar: 'C', verified: true },
    thumbnail: '/templates/dev.jpg',
    category: 'portfolio',
    tags: ['developer', 'dark', 'minimal'],
    stats: { views: 8900, downloads: 623, rating: 4.9, reviews: 89 },
    new: true,
    html: `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-lg border-b border-gray-800">
        <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span class="text-white font-mono font-bold">{'<'}alex{'/'}</span>
          <div class="flex items-center gap-8">
            <a href="#" class="text-gray-400 hover:text-white text-sm font-mono transition">about()</a>
            <a href="#" class="text-gray-400 hover:text-white text-sm font-mono transition">projects()</a>
            <a href="#" class="text-gray-400 hover:text-white text-sm font-mono transition">contact()</a>
          </div>
          <a href="#" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 text-sm font-bold rounded-lg transition">Resume</a>
        </div>
      </nav>

      <section class="pt-32 pb-20 bg-gray-950 min-h-screen flex items-center">
        <div class="max-w-5xl mx-auto px-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span class="text-emerald-500 font-mono text-sm">Available for work</span>
          </div>
          <h1 class="text-5xl md:text-6xl font-bold text-white mb-6">
            Hi, I'm Alex<span class="text-emerald-500">.</span><br/>
            <span class="text-gray-500">Full-stack Developer</span>
          </h1>
          <p class="text-xl text-gray-400 max-w-2xl mb-10">
            I build exceptional digital experiences with modern technologies. Currently focused on building scalable applications at <span class="text-white">Vercel</span>.
          </p>
          <div class="flex items-center gap-4">
            <a href="#" class="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition">View Projects</a>
            <a href="#" class="px-6 py-3 border border-gray-700 text-white font-medium rounded-lg hover:border-gray-500 transition">Get in Touch</a>
          </div>
        </div>
      </section>

      <section class="py-20 bg-gray-900">
        <div class="max-w-5xl mx-auto px-6">
          <h2 class="text-3xl font-bold text-white mb-2">Tech Stack</h2>
          <p class="text-gray-500 mb-12">Technologies I work with daily</p>
          <div class="grid grid-cols-4 gap-4">
            <div class="p-6 bg-gray-950 rounded-xl border border-gray-800 text-center hover:border-gray-700 transition">
              <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl font-bold">TS</div>
              <span class="text-white font-medium">TypeScript</span>
            </div>
            <div class="p-6 bg-gray-950 rounded-xl border border-gray-800 text-center hover:border-gray-700 transition">
              <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-2xl font-bold">R</div>
              <span class="text-white font-medium">React</span>
            </div>
            <div class="p-6 bg-gray-950 rounded-xl border border-gray-800 text-center hover:border-gray-700 transition">
              <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center text-2xl font-bold">N</div>
              <span class="text-white font-medium">Node.js</span>
            </div>
            <div class="p-6 bg-gray-950 rounded-xl border border-gray-800 text-center hover:border-gray-700 transition">
              <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl font-bold">P</div>
              <span class="text-white font-medium">PostgreSQL</span>
            </div>
          </div>
        </div>
      </section>
    `,
    css: `
      body { background: #030712; }
    `,
  },
]

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

export default function MarketplacePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark')
  const [activeTab, setActiveTab] = useState<'templates' | 'creators' | 'community'>('templates')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const generatePreviewHTML = (template: Template) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    ${template.css}
  </style>
</head>
<body class="antialiased">
  ${template.html}
</body>
</html>
`

  const useTemplate = async (template: Template) => {
    // Create a new project with this template
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: `Based on ${template.name} template`,
          type: template.category,
          config: {
            template: template.id,
            html: template.html,
            css: template.css,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/workspace?project=${data.project._id}`)
      }
    } catch (error) {
      console.error('Failed to create project from template:', error)
    }
  }

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  }

  return (
    <div className="min-h-screen bg-[#0c0c0f]">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0c0c0f] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Marketplace</h1>
              <p className="text-sm text-slate-500">
                Templates & components by the community
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/marketplace/earnings"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.06] transition"
              >
                <Wallet className="w-4 h-4" />
                Earnings
              </Link>
              <Link href="/marketplace/sell">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition"
                >
                  <Upload className="w-4 h-4" />
                  Sell Templates
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={cn(
                'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition',
                activeTab === 'templates'
                  ? 'text-white border-violet-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              )}
            >
              <Layers className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('creators')}
              className={cn(
                'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition',
                activeTab === 'creators'
                  ? 'text-white border-violet-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              )}
            >
              <Users className="w-4 h-4" />
              Creators
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={cn(
                'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition',
                activeTab === 'community'
                  ? 'text-white border-violet-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              )}
            >
              <Globe className="w-4 h-4" />
              Community Sources
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={activeTab === 'templates' ? "Search templates..." : activeTab === 'creators' ? "Search creators..." : "Search sources..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition"
            />
          </div>

          {activeTab === 'templates' && (
            <>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition',
                    viewMode === 'grid' ? 'bg-violet-500 text-white' : 'text-slate-500 hover:text-white'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition',
                    viewMode === 'list' ? 'bg-violet-500 text-white' : 'text-slate-500 hover:text-white'
                  )}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {activeTab === 'templates' && (
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="w-52 flex-shrink-0">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                Categories
              </h3>
              <nav className="space-y-0.5">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition',
                        activeCategory === category.id
                          ? 'bg-violet-500/15 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{category.name}</span>
                      <span className="text-xs text-slate-600">{category.count}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Top Creator Card */}
              <div className="mt-6 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 border border-white/[0.06]">
                <div className="flex items-center gap-1.5 mb-3">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Top Creator</span>
                </div>
                <button
                  onClick={() => setSelectedCreator(TOP_CREATORS[0])}
                  className="flex items-center gap-2.5 w-full hover:opacity-80 transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                    {TOP_CREATORS[0].avatar}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{TOP_CREATORS[0].name}</p>
                    <p className="text-[10px] text-slate-400">${formatNumber(TOP_CREATORS[0].earnings)} earned</p>
                  </div>
                </button>
              </div>

              {/* Become a Creator CTA */}
              <div className="mt-4 p-3 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02]">
                <p className="text-xs text-slate-400 mb-2">Start earning today</p>
                <Link
                  href="/marketplace/become-creator"
                  className="flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition"
                >
                  <Plus className="w-4 h-4" />
                  Become a Creator
                </Link>
              </div>
            </aside>

            {/* Templates Grid */}
            <main className="flex-1">
              <p className="text-xs text-slate-500 mb-4">
                {filteredTemplates.length} templates
              </p>

              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              )}>
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedTemplate(template)}
                    className="cursor-pointer"
                  >
                    <TemplateCard template={template} viewMode={viewMode} />
                  </motion.div>
                ))}
              </div>
            </main>
          </div>
        )}

        {activeTab === 'creators' && (
          <div>
            {/* Top Creators */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Top Creators</h2>
                <span className="text-xs text-slate-500">{TOP_CREATORS.length} creators</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TOP_CREATORS.map((creator, index) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedCreator(creator)}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                        {creator.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{creator.name}</p>
                          {creator.verified && (
                            <BadgeCheck className="w-4 h-4 text-violet-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">@{creator.username}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
                    </div>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{creator.bio}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{creator.templates} templates</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        <span>{formatNumber(creator.sales)} sales</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>${formatNumber(creator.earnings)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Become a Creator Section */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start Selling Your Templates</h3>
                  <p className="text-slate-400 text-sm max-w-lg">
                    Join our community of creators and earn money by selling your website templates.
                    Keep 80% of every sale.
                  </p>
                </div>
                <Link href="/marketplace/become-creator">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition">
                    <Upload className="w-4 h-4" />
                    Apply Now
                  </button>
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-6 pt-6 border-t border-white/[0.06]">
                <div>
                  <p className="text-2xl font-bold text-white">$124K+</p>
                  <p className="text-xs text-slate-500">Paid to creators</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">50+</p>
                  <p className="text-xs text-slate-500">Active creators</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">80%</p>
                  <p className="text-xs text-slate-500">Revenue share</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">Open-Source & Partner Resources</h2>
              <p className="text-sm text-slate-400">
                Integrate templates and components from popular open-source libraries and premium partners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {COMMUNITY_SOURCES.map((source, index) => (
                <motion.a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-2xl">
                      {source.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{source.name}</h3>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase',
                          source.type === 'open-source' && 'bg-emerald-500/20 text-emerald-400',
                          source.type === 'premium' && 'bg-amber-500/20 text-amber-400',
                          source.type === 'mixed' && 'bg-blue-500/20 text-blue-400'
                        )}>
                          {source.type}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition ml-auto" />
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{source.description}</p>
                      <p className="text-xs text-slate-500">{source.templates}+ components available</p>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* GitHub Integration CTA */}
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Github className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Import from GitHub</h3>
                  <p className="text-sm text-slate-400">
                    Connect your GitHub account to import templates directly from any repository.
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/[0.1] text-white text-sm font-medium rounded-lg hover:bg-white/[0.1] transition">
                  <Github className="w-4 h-4" />
                  Connect GitHub
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0c0c14] rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-white/[0.1] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-white">{selectedTemplate.name}</h2>
                  <span className="text-sm text-slate-400">by {selectedTemplate.author.name}</span>
                  {selectedTemplate.author.verified && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Device Toggle */}
                  <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
                    {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
                      <button
                        key={device}
                        onClick={() => setPreviewDevice(device)}
                        className={cn(
                          'p-2 rounded-md transition',
                          previewDevice === device ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                        )}
                      >
                        {device === 'desktop' && <Monitor className="w-4 h-4" />}
                        {device === 'tablet' && <Tablet className="w-4 h-4" />}
                        {device === 'mobile' && <Smartphone className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => useTemplate(selectedTemplate)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    Use template
                  </button>

                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 overflow-hidden bg-[#1a1a24] flex items-center justify-center p-8">
                <div
                  className={cn(
                    'bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 h-full',
                    previewDevice === 'desktop' && 'w-full',
                    previewDevice === 'tablet' && 'w-[768px]',
                    previewDevice === 'mobile' && 'w-[375px]'
                  )}
                  style={{ maxWidth: '100%' }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={generatePreviewHTML(selectedTemplate)}
                    className="w-full h-full border-0"
                    title={`${selectedTemplate.name} Preview`}
                    sandbox="allow-scripts"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-[#0a0a0f]">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-white font-medium">{selectedTemplate.stats.rating}</span>
                    <span className="text-slate-500">({selectedTemplate.stats.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Download className="w-4 h-4" />
                    <span>{formatNumber(selectedTemplate.stats.downloads)} downloads</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(selectedTemplate.stats.views)} views</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {selectedTemplate.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-white/[0.05] text-slate-400 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {selectedTemplate.price === 0 ? 'Free' : `$${selectedTemplate.price}`}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creator Profile Modal */}
      <AnimatePresence>
        {selectedCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedCreator(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0c0c14] rounded-2xl w-full max-w-2xl overflow-hidden border border-white/[0.1] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Banner */}
              <div className="h-24 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600" />

              {/* Profile Content */}
              <div className="px-6 pb-6">
                {/* Avatar & Actions */}
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-[#0c0c14]">
                    {selectedCreator.avatar}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-white/[0.06] border border-white/[0.1] text-white text-sm font-medium rounded-lg hover:bg-white/[0.1] transition">
                      Follow
                    </button>
                    <button
                      onClick={() => setSelectedCreator(null)}
                      className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Name & Bio */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">{selectedCreator.name}</h2>
                    {selectedCreator.verified && (
                      <BadgeCheck className="w-5 h-5 text-violet-400" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-3">@{selectedCreator.username}</p>
                  <p className="text-slate-400">{selectedCreator.bio}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 py-4 border-y border-white/[0.06] mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{selectedCreator.templates}</p>
                    <p className="text-xs text-slate-500">Templates</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatNumber(selectedCreator.sales)}</p>
                    <p className="text-xs text-slate-500">Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">${formatNumber(selectedCreator.earnings)}</p>
                    <p className="text-xs text-slate-500">Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{formatNumber(selectedCreator.followers)}</p>
                    <p className="text-xs text-slate-500">Followers</p>
                  </div>
                </div>

                {/* Social Links */}
                {selectedCreator.socials && (
                  <div className="flex items-center gap-3 mb-6">
                    {selectedCreator.socials.twitter && (
                      <a
                        href={`https://twitter.com/${selectedCreator.socials.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
                      >
                        <span>@{selectedCreator.socials.twitter}</span>
                      </a>
                    )}
                    {selectedCreator.socials.github && (
                      <a
                        href={`https://github.com/${selectedCreator.socials.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
                      >
                        <Github className="w-4 h-4" />
                        {selectedCreator.socials.github}
                      </a>
                    )}
                    {selectedCreator.socials.website && (
                      <a
                        href={`https://${selectedCreator.socials.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
                      >
                        <Globe className="w-4 h-4" />
                        {selectedCreator.socials.website}
                      </a>
                    )}
                  </div>
                )}

                {/* Templates Preview */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Templates by {selectedCreator.name}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.filter(t => t.author.name === selectedCreator.name || t.author.name === 'Studio Brthrs').slice(0, 2).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedCreator(null)
                          setSelectedTemplate(template)
                        }}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-violet-300 transition">{template.name}</p>
                            <p className="text-xs text-slate-500">
                              {template.price === 0 ? 'Free' : `$${template.price}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TemplateCard({ template, viewMode }: { template: Template; viewMode: 'grid' | 'list' }) {
  const [liked, setLiked] = useState(false)

  // Generate a gradient based on category
  const gradients: Record<string, string> = {
    portfolio: 'from-neutral-800 to-neutral-900',
    saas: 'from-violet-500/20 to-indigo-500/20',
    agency: 'from-amber-500/20 to-red-500/20',
    blog: 'from-blue-500/20 to-violet-500/20',
    ecommerce: 'from-stone-300 to-stone-400',
  }

  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-violet-500/30 transition group">
        <div className={cn(
          'w-40 h-28 rounded-md flex-shrink-0 bg-gradient-to-br',
          gradients[template.category] || 'from-gray-700 to-gray-800'
        )} />
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-white text-sm">{template.name}</h3>
              {template.featured && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-semibold rounded">Featured</span>
              )}
              {template.new && (
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-semibold rounded">New</span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{template.description}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>{template.stats.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{formatNumber(template.stats.downloads)}</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-white">
              {template.price === 0 ? 'Free' : `$${template.price}`}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-violet-500/30 transition overflow-hidden">
      {/* Preview Thumbnail */}
      <div className="relative h-44 overflow-hidden">
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br group-hover:scale-105 transition-transform duration-500',
          gradients[template.category] || 'from-gray-700 to-gray-800'
        )}>
          {/* Mini preview representation */}
          <div className="absolute inset-3 bg-white/5 rounded-lg border border-white/10 flex flex-col overflow-hidden">
            <div className="h-3 bg-white/10 flex items-center px-2 gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
            </div>
            <div className="flex-1 p-2">
              <div className="h-1.5 w-16 bg-white/20 rounded mb-2" />
              <div className="h-1 w-24 bg-white/10 rounded mb-1" />
              <div className="h-1 w-20 bg-white/10 rounded" />
            </div>
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {template.featured && (
            <span className="px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
              Featured
            </span>
          )}
          {template.new && (
            <span className="px-2.5 py-1 bg-green-500/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
              New
            </span>
          )}
        </div>
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <span className="px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-lg">
            Preview Template
          </span>
        </div>
        {/* Price */}
        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
          <span className="text-sm font-bold text-white">
            {template.price === 0 ? 'Free' : `$${template.price}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1">{template.name}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">{template.description}</p>

        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
            {template.author.avatar}
          </div>
          <span className="text-xs text-slate-400">{template.author.name}</span>
          {template.author.verified && (
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{template.stats.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>{formatNumber(template.stats.downloads)}</span>
            </div>
          </div>
          <span className="text-xs text-purple-400 font-medium flex items-center gap-1">
            Preview <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  )
}
