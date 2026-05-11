'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Zap,
  Image as ImageIcon,
  Globe,
  Palette,
  Code2,
  Sun,
  Moon,
  Loader2,
  Rocket,
  X,
  Check,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { TECH_ICONS } from '@/lib/tech-icons'
import { DEMO_SITES } from '@/lib/demo-sites'

const examplePrompts = [
  "A modern SaaS landing page for a project management tool",
  "An e-commerce store for handmade jewelry",
  "A portfolio website for a UX designer with animations",
  "A restaurant website with online ordering",
  "A fitness app landing page with pricing tiers",
]

const examplePromptsByTarget: Record<'website' | 'webapp' | 'mobile', string[]> = {
  website: [
    "A modern SaaS landing page for a project management tool",
    "An e-commerce store for handmade jewelry",
    "A portfolio website for a UX designer with animations",
    "A restaurant website with online ordering",
  ],
  webapp: [
    "A dashboard with sidebar nav, KPI cards, sortable data table, and dark mode",
    "A blog with markdown posts, tag filtering, and an RSS feed",
    "A SaaS landing page with pricing tiers and a working signup form",
    "A documentation site with versioned docs and code highlighting",
  ],
  mobile: [
    "A fitness tracker with daily steps, workout history, and weekly charts",
    "A recipe app with search, favorites, and step-by-step cooking timers",
    "A habit tracker with streak counts and weekly stats",
    "A pomodoro timer with task list and session history",
  ],
}

const quickTemplates = [
  { icon: Globe, label: "Landing Page", prompt: "A modern landing page with hero, features, and CTA sections" },
  { icon: Code2, label: "SaaS", prompt: "A SaaS product website with pricing and features" },
  { icon: Palette, label: "Portfolio", prompt: "A creative portfolio website with project gallery" },
  { icon: Rocket, label: "Startup", prompt: "A startup landing page with waitlist signup" },
]

// Template gallery with real website screenshots and rich metadata
const templateGallery = [
  {
    id: 'saas-modern',
    name: 'Modern SaaS',
    category: 'SaaS',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    colors: { primary: '#6366F1', secondary: '#818CF8', accent: '#A5B4FC' },
    fonts: { heading: 'Inter', body: 'Inter' },
    sections: ['Hero', 'Logo Cloud', 'Features', 'Pricing', 'Testimonials', 'FAQ', 'CTA'],
    features: ['Responsive', 'Dark Mode', 'Animations'],
    prompt: 'Build a modern SaaS landing page similar to Linear or Vercel. Include: a dark hero section with gradient accents and a bold headline about shipping products faster, a logo cloud of tech companies, a 3-column feature grid with icons, an alternating features section with screenshots, a 3-tier pricing table, customer testimonials with photos, an FAQ accordion, and a gradient CTA section. Use a professional indigo/purple color scheme.',
  },
  {
    id: 'restaurant-elegant',
    name: 'Elegant Restaurant',
    category: 'Restaurant',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&q=80',
    colors: { primary: '#F59E0B', secondary: '#FBBF24', accent: '#FCD34D' },
    fonts: { heading: 'Playfair Display', body: 'Lora' },
    sections: ['Hero', 'About', 'Menu', 'Gallery', 'Reviews', 'Reservations', 'Location'],
    features: ['Responsive', 'Menu System', 'Booking Form'],
    prompt: 'Build an elegant restaurant website. Include: a full-screen hero with a beautiful food image and serif typography, an about section with the chef story, a menu section with categories (appetizers, mains, desserts) and prices, a gallery of food photos in a masonry grid, customer reviews, a reservation form with date/time picker, location with map placeholder, and opening hours. Use warm amber/cream colors with elegant serif fonts.',
  },
  {
    id: 'agency-creative',
    name: 'Creative Agency',
    category: 'Agency',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1920&q=80',
    colors: { primary: '#EC4899', secondary: '#F472B6', accent: '#FBCFE8' },
    fonts: { heading: 'Syne', body: 'Work Sans' },
    sections: ['Hero', 'Services', 'Portfolio', 'Clients', 'Team', 'Testimonials', 'Contact'],
    features: ['Responsive', 'Hover Effects', 'Portfolio Grid'],
    prompt: 'Build a creative agency website with bold design. Include: a large hero with animated text and a showreel button, a services section with hover effects, a portfolio grid showing case studies with images, client logos, team members with photos and roles, testimonials, a contact section with a creative form layout, and social media links. Use bold pink/magenta colors with modern sans-serif fonts and creative asymmetric layouts.',
  },
  {
    id: 'ecommerce-luxury',
    name: 'Luxury Fashion',
    category: 'E-Commerce',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80',
    colors: { primary: '#1F2937', secondary: '#6B7280', accent: '#D4AF37' },
    fonts: { heading: 'Cormorant Garamond', body: 'Montserrat' },
    sections: ['Hero', 'Featured', 'Categories', 'New Arrivals', 'Brand Story', 'Newsletter'],
    features: ['Responsive', 'Product Grid', 'Cart Ready'],
    prompt: 'Build a luxury e-commerce website for a fashion brand. Include: a minimal header with logo and cart icon, a full-width hero with a lifestyle image and minimal text, featured products in a clean grid, a new arrivals section, product categories with elegant hover effects, a brand story section, newsletter signup, and a sophisticated footer. Use a black/white/gold color scheme with elegant serif typography and lots of whitespace.',
  },
  {
    id: 'portfolio-minimal',
    name: 'Minimal Portfolio',
    category: 'Portfolio',
    image: 'https://images.unsplash.com/photo-1545665277-5937489579f2?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1920&q=80',
    colors: { primary: '#10B981', secondary: '#34D399', accent: '#6EE7B7' },
    fonts: { heading: 'DM Sans', body: 'DM Sans' },
    sections: ['Hero', 'Projects', 'About', 'Skills', 'Blog', 'Contact'],
    features: ['Responsive', 'Minimal Design', 'Project Gallery'],
    prompt: 'Build a minimal portfolio website for a designer/developer. Include: a simple header with name and navigation, a hero with a brief intro and profile photo, a projects grid with hover effects showing project details, an about section with skills and experience, a blog/writing section, contact information with social links, and a clean footer. Use a minimal black and white design with emerald accent colors and plenty of whitespace.',
  },
  {
    id: 'startup-bold',
    name: 'Startup Bold',
    category: 'Startup',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
    colors: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' },
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
    sections: ['Hero', 'Problem/Solution', 'Features', 'Social Proof', 'Team', 'Waitlist', 'CTA'],
    features: ['Responsive', 'Glassmorphism', 'Animations'],
    prompt: 'Build a bold startup landing page with disruptive energy. Include: a hero with a large bold headline and neon gradient accents, animated stats counters, a problem/solution section, product features with 3D-style cards, social proof with investor logos, a team section with fun photos, a waitlist signup with email input, and a bold CTA. Use vibrant violet/fuchsia gradients with bold typography and modern glassmorphism effects.',
  },
  {
    id: 'fitness-gym',
    name: 'Fitness Studio',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1920&q=80',
    colors: { primary: '#EF4444', secondary: '#F97316', accent: '#FBBF24' },
    fonts: { heading: 'Bebas Neue', body: 'Roboto' },
    sections: ['Hero', 'Classes', 'Trainers', 'Pricing', 'Testimonials', 'Gallery', 'Contact'],
    features: ['Responsive', 'Schedule View', 'Signup Form'],
    prompt: 'Build a fitness studio website. Include: a powerful hero with an action shot and bold headline, class schedule section, trainer profiles with photos, membership pricing tiers, testimonials from members, a gallery of the facility, contact form for trial class signup, and location/hours. Use energetic red/orange colors with bold typography.',
  },
  {
    id: 'realestate-luxury',
    name: 'Luxury Real Estate',
    category: 'Real Estate',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
    colors: { primary: '#1E1B4B', secondary: '#475569', accent: '#D4AF37' },
    fonts: { heading: 'Cormorant Garamond', body: 'Montserrat' },
    sections: ['Hero', 'Listings', 'Search', 'Agents', 'Testimonials', 'Neighborhoods', 'Contact'],
    features: ['Responsive', 'Property Search', 'Inquiry Form'],
    prompt: 'Build a luxury real estate website. Include: a full-screen hero with a stunning property image, featured listings grid with prices, property search filters, agent profile section, testimonials from clients, neighborhood guides, contact form for inquiries, and a sophisticated footer. Use elegant dark theme with gold accents.',
  },
  {
    id: 'medical-clinic',
    name: 'Medical Clinic',
    category: 'Healthcare',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1920&q=80',
    colors: { primary: '#0EA5E9', secondary: '#38BDF8', accent: '#7DD3FC' },
    fonts: { heading: 'DM Sans', body: 'DM Sans' },
    sections: ['Hero', 'Services', 'Doctors', 'Appointments', 'Testimonials', 'Insurance', 'Contact'],
    features: ['Responsive', 'Booking System', 'HIPAA Ready'],
    prompt: 'Build a modern medical clinic website. Include: a calming hero with a trust-building headline, services grid with medical specialties, doctor profiles with credentials, an appointment booking section, patient testimonials, accepted insurance logos, and contact with location map. Use calming blue tones with clean, accessible design.',
  },
  {
    id: 'blog-magazine',
    name: 'Blog Magazine',
    category: 'Blog',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=1920&q=80',
    colors: { primary: '#F97316', secondary: '#FB923C', accent: '#FDBA74' },
    fonts: { heading: 'Playfair Display', body: 'Source Sans Pro' },
    sections: ['Featured', 'Categories', 'Recent Posts', 'Newsletter', 'Popular', 'Author', 'Archive'],
    features: ['Responsive', 'Newsletter', 'Categories'],
    prompt: 'Build a modern blog magazine website. Include: a featured article hero with large image, category navigation, recent posts grid with thumbnails and excerpts, newsletter signup section, popular posts sidebar, author bio section, and archive. Use warm orange accents with elegant serif headings.',
  },
  {
    id: 'event-conference',
    name: 'Event Conference',
    category: 'Events',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1920&q=80',
    colors: { primary: '#7C3AED', secondary: '#8B5CF6', accent: '#A78BFA' },
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
    sections: ['Hero', 'Countdown', 'Speakers', 'Schedule', 'Tickets', 'Sponsors', 'Venue'],
    features: ['Responsive', 'Countdown Timer', 'Ticket Sales'],
    prompt: 'Build an event conference website. Include: an exciting hero with event name and date, countdown timer to event, speaker lineup with photos and bios, detailed schedule by day and track, ticket tiers with pricing, sponsor logos, and venue information with map. Use vibrant purple gradients with modern typography.',
  },
  {
    id: 'photography-portfolio',
    name: 'Photography Portfolio',
    category: 'Photography',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=1920&q=80',
    colors: { primary: '#18181B', secondary: '#27272A', accent: '#FAFAFA' },
    fonts: { heading: 'Cormorant Garamond', body: 'Montserrat' },
    sections: ['Hero', 'Gallery', 'About', 'Services', 'Clients', 'Booking', 'Contact'],
    features: ['Responsive', 'Lightbox Gallery', 'Minimal'],
    prompt: 'Build a photography portfolio website. Include: a stunning full-screen hero with signature photo, masonry gallery with lightbox, about section with photographer bio, services and packages, client logos or testimonials, booking/inquiry form, and minimal footer. Use black and white with elegant typography and let the photos speak.',
  },
]

export default function HomePage() {
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [prompt, setPrompt] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [projectTheme, setProjectTheme] = useState<'light' | 'dark'>('dark')
  const [buildTarget, setBuildTarget] = useState<'website' | 'webapp' | 'mobile'>('website')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templateGallery[0] | null>(null)
  const [showAllTemplates, setShowAllTemplates] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rotatingWordIdx, setRotatingWordIdx] = useState(0)
  const rotatingWords = ['delicious', 'real', 'alive', 'beautiful', 'fast']
  const rotatingWord = rotatingWords[rotatingWordIdx]
  // Typewriter placeholder state
  const [typedText, setTypedText] = useState('')
  // Live demo iframe state
  const [demoIdx, setDemoIdx] = useState(0)
  const [demoGenerating, setDemoGenerating] = useState(false)

  // Handle client-side mounting for animations
  useEffect(() => {
    setMounted(true)
  }, [])

  const visibleTemplates = showAllTemplates ? templateGallery : templateGallery.slice(0, 8)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % examplePrompts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Headline word rotation — swaps every 2.5s. Skipped while user is typing
  // so it doesn't feel chatty over their input.
  useEffect(() => {
    if (prompt) return
    const interval = setInterval(() => {
      setRotatingWordIdx(i => (i + 1) % rotatingWords.length)
    }, 2500)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt])

  // Cycle the demo iframe through DEMO_SITES every ~7s with a brief
  // "generating" overlay so it looks like Webstew is rebuilding each time.
  useEffect(() => {
    const tick = () => {
      setDemoGenerating(true)
      setTimeout(() => {
        setDemoIdx(i => (i + 1) % DEMO_SITES.length)
        setDemoGenerating(false)
      }, 1100)
    }
    const t = setInterval(tick, 7000)
    return () => clearInterval(t)
  }, [])

  // Typewriter for the placeholder — types out one example, holds, deletes,
  // types the next. Pauses entirely when the user starts typing. Examples
  // come from the target-specific bank so the demo always matches the picker.
  useEffect(() => {
    if (prompt) return
    const examples = examplePromptsByTarget[buildTarget]
    let cancelled = false
    let i = 0
    let charIdx = 0
    let phase: 'typing' | 'holding' | 'deleting' = 'typing'

    const tick = () => {
      if (cancelled) return
      const current = examples[i % examples.length]
      if (phase === 'typing') {
        charIdx++
        setTypedText(current.slice(0, charIdx))
        if (charIdx >= current.length) {
          phase = 'holding'
          setTimeout(tick, 1600)
          return
        }
        setTimeout(tick, 28 + Math.random() * 24)
      } else if (phase === 'holding') {
        phase = 'deleting'
        setTimeout(tick, 50)
      } else {
        charIdx--
        setTypedText(current.slice(0, charIdx))
        if (charIdx <= 0) {
          phase = 'typing'
          i++
          setTimeout(tick, 250)
          return
        }
        setTimeout(tick, 12)
      }
    }
    const start = setTimeout(tick, 500)
    return () => { cancelled = true; clearTimeout(start) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, buildTarget])

  // Route to the right builder based on the user's chosen target. If not yet
  // signed in, ride through /signup with ?next= preserving the destination so
  // the generation auto-fires after auth.
  const navigateToBuilder = (projectPrompt: string, t: 'website' | 'webapp' | 'mobile' = buildTarget) => {
    setIsTransitioning(true)
    let url: string
    if (t === 'website') {
      const params = new URLSearchParams({ prompt: projectPrompt, theme: projectTheme })
      url = `/workspace?${params.toString()}`
    } else {
      const apiTarget = t === 'mobile' ? 'expo' : 'nextjs'
      const params = new URLSearchParams({ prompt: projectPrompt, target: apiTarget })
      url = `/app-builder?${params.toString()}`
    }
    if (sessionStatus === 'authenticated') {
      router.push(url)
    } else {
      router.push(`/signup?next=${encodeURIComponent(url)}`)
    }
  }

  // Kept for backwards-compat with any inline call sites further down the file.
  const navigateToWorkspace = (projectPrompt: string) => navigateToBuilder(projectPrompt, 'website')

  const handleSubmit = () => {
    if (!prompt.trim() || isTransitioning) return
    navigateToBuilder(prompt.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle template selection - go to workspace with template prompt
  const handleTemplateSelect = (templatePrompt: string) => {
    navigateToWorkspace(templatePrompt)
  }

  return (
    <AnimatePresence mode="wait">
      {isTransitioning ? (
        <motion.div
          key="transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
            </div>
            <p className="text-zinc-500 text-sm">Loading workspace...</p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={mounted ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="min-h-screen relative overflow-hidden"
        >
          {/* Animated gradient mesh background — Lovable-style. Multiple
              blurred color blobs layered, drifting slowly. Sets the mood
              without occluding text because each blob is behind a 96px blur
              filter and the content sits on z-10. */}
          <div className={cn(
            "absolute inset-0",
            isDark ? "bg-slate-950" : "bg-[#fdf8f3]"
          )} />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Top-left warm blob */}
            <motion.div
              className="absolute -top-32 -left-20 w-[40rem] h-[40rem] rounded-full"
              style={{
                filter: 'blur(110px)',
                background: isDark
                  ? 'radial-gradient(circle, rgba(244,114,182,0.45), transparent 70%)'
                  : 'radial-gradient(circle, rgba(251,146,60,0.55), transparent 70%)',
              }}
              animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Top-right cool blob */}
            <motion.div
              className="absolute -top-24 -right-32 w-[36rem] h-[36rem] rounded-full"
              style={{
                filter: 'blur(120px)',
                background: isDark
                  ? 'radial-gradient(circle, rgba(167,139,250,0.5), transparent 70%)'
                  : 'radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)',
              }}
              animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
              transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Bottom-left magenta */}
            <motion.div
              className="absolute top-[35%] -left-32 w-[34rem] h-[34rem] rounded-full"
              style={{
                filter: 'blur(120px)',
                background: isDark
                  ? 'radial-gradient(circle, rgba(192,38,211,0.35), transparent 70%)'
                  : 'radial-gradient(circle, rgba(236,72,153,0.35), transparent 70%)',
              }}
              animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Bottom-right warm */}
            <motion.div
              className="absolute top-[40%] -right-20 w-[38rem] h-[38rem] rounded-full"
              style={{
                filter: 'blur(120px)',
                background: isDark
                  ? 'radial-gradient(circle, rgba(251,113,133,0.35), transparent 70%)'
                  : 'radial-gradient(circle, rgba(251,191,36,0.45), transparent 70%)',
              }}
              animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
              transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Center violet accent */}
            <motion.div
              className="absolute top-1/3 left-1/3 w-[28rem] h-[28rem] rounded-full"
              style={{
                filter: 'blur(120px)',
                background: isDark
                  ? 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)'
                  : 'radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)',
              }}
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          {/* Soft veil so text on top stays crisp regardless of where the
              blobs drift to */}
          <div className={cn(
            "absolute inset-0 pointer-events-none",
            isDark
              ? "bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/40"
              : "bg-gradient-to-b from-white/30 via-transparent to-white/40"
          )} />

          {/* Content overlay */}
          <div className="relative z-10">
            {/* Header */}
            <header className="p-6">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className="text-6xl leading-none select-none cursor-pointer hover:scale-110 hover:rotate-6 transition-all duration-500 ease-out"
                    style={{
                      filter: isDark
                        ? 'drop-shadow(0 0 20px rgba(167, 139, 250, 0.6))'
                        : 'drop-shadow(0 0 20px rgba(251, 146, 60, 0.6))',
                      animation: 'float 4s ease-in-out infinite'
                    }}
                  >🍲</span>
                  <span
                    className={cn(
                      "text-3xl tracking-tight",
                      isDark
                        ? "bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent"
                        : "bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                    )}
                    style={{
                      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      fontWeight: 800,
                      letterSpacing: '-0.03em'
                    }}
                  >
                    Webstew
                  </span>
                </motion.div>

                <motion.nav
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <a
                    href="/community"
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all hidden sm:block",
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    Community
                  </a>
                  <a
                    href="/app-builder"
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    <span>App Builder</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                      isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-600"
                    )}>NEW</span>
                  </a>
                  <a
                    href="/login"
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    Sign in
                  </a>
                  <a
                    href={sessionStatus === 'authenticated' ? '/workspace' : '/signup?next=%2Fworkspace'}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isDark
                        ? "bg-violet-600 hover:bg-violet-500 text-white"
                        : "bg-orange-500 hover:bg-orange-400 text-white"
                    )}
                  >
                    {sessionStatus === 'authenticated' ? 'Open Workspace' : 'Start Building'}
                  </a>
                  <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className={cn(
                      "p-2.5 rounded-lg backdrop-blur-sm transition-all duration-300",
                      isDark
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-white/50 hover:bg-white/70 text-slate-700"
                    )}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </motion.nav>
              </div>
            </header>

            {/* Main Content */}
            <main className="px-6 pb-12 pt-6">
              <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center min-h-[80vh]">
                {/* LEFT column — hero copy, prompt, chips */}
                <div className="w-full max-w-2xl mx-auto lg:mx-0">
                {/* Hero — mixed type weights, serif-italic on a ROTATING word.
                    Word swaps every 2.5s with a smooth slide. Lovable's
                    signature trick. */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center lg:text-left mb-8 relative"
                >
                  {/* Floating sparkles around the brand mark */}
                  <div className="relative inline-block">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.8, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                      className="text-5xl mb-3 inline-block relative"
                      style={{ filter: 'drop-shadow(0 6px 20px rgba(251,146,60,0.35))' }}
                    >
                      <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="inline-block"
                      >
                        🍲
                      </motion.span>
                    </motion.div>
                    {/* Sparkles drifting around the bowl */}
                    {[
                      { top: '-6px', left: '-30px', delay: 0 },
                      { top: '-12px', right: '-26px', delay: 0.6 },
                      { bottom: '8px', left: '-26px', delay: 1.2 },
                      { bottom: '4px', right: '-32px', delay: 1.8 },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        className="absolute pointer-events-none"
                        style={{ top: s.top, left: s.left, right: s.right, bottom: s.bottom }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1.1, 0], rotate: [0, 180, 360] }}
                        transition={{ duration: 2.4, delay: s.delay, repeat: Infinity, repeatDelay: 1 }}
                      >
                        <Sparkles className={cn("w-3 h-3", isDark ? "text-amber-300" : "text-orange-400")} />
                      </motion.div>
                    ))}
                  </div>
                  <h1 className={cn(
                    "text-5xl md:text-7xl font-bold tracking-tight leading-[1] mb-5",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    Build something
                    <span className="block relative h-[1.2em] mt-2 overflow-visible">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={rotatingWord}
                          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          className={cn(
                            "absolute inset-0 italic font-normal bg-clip-text text-transparent",
                            isDark
                              ? "bg-gradient-to-br from-amber-200 via-pink-300 to-violet-300"
                              : "bg-gradient-to-br from-orange-500 via-pink-500 to-violet-600"
                          )}
                          style={{
                            fontFamily: 'var(--font-playfair), Georgia, "Times New Roman", serif',
                            fontSize: '1.25em',
                            lineHeight: '0.95',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {rotatingWord}.
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </h1>
                  <p className={cn(
                    "text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed",
                    isDark ? "text-slate-300" : "text-slate-600"
                  )}>
                    Tell Webstew what to build. AI ships you a working <span className="font-semibold">website, web app, or mobile app</span> — real code, yours to keep.
                  </p>
                </motion.div>

                {/* Smaller, tighter input — target picker lives inside footer */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={cn(
                    "rounded-2xl backdrop-blur-xl border transition-all duration-300",
                    isDark
                      ? "bg-slate-900/70 border-white/10 shadow-xl shadow-black/30"
                      : "bg-white/90 border-slate-200/80 shadow-xl shadow-slate-300/30",
                    prompt && (isDark ? "ring-1 ring-violet-500/40" : "ring-1 ring-violet-400/40")
                  )}
                >
                  <div className="px-4 pt-3 pb-0">
                    <textarea
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={typedText || (
                        buildTarget === 'mobile'
                          ? `Ask Webstew to build a mobile app...`
                          : buildTarget === 'webapp'
                            ? `Ask Webstew to build a web app...`
                            : `Ask Webstew to build a website for...`
                      )}
                      rows={1}
                      className={cn(
                        "w-full resize-none bg-transparent text-base leading-snug focus:outline-none min-h-[44px]",
                        isDark
                          ? "text-white placeholder-slate-500"
                          : "text-slate-900 placeholder-slate-400"
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between px-3 pb-3">
                    {/* Build target dropdown (Lovable pattern) */}
                    <div className="relative">
                      <select
                        value={buildTarget}
                        onChange={(e) => setBuildTarget(e.target.value as typeof buildTarget)}
                        aria-label="Build target"
                        className={cn(
                          "appearance-none pl-2.5 pr-8 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                          isDark
                            ? "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                        )}
                      >
                        <option value="website">🌐  Website</option>
                        <option value="webapp">⚛️  Web App</option>
                        <option value="mobile">📱  Mobile App</option>
                      </select>
                      <ChevronDown className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none",
                        isDark ? "text-slate-400" : "text-slate-500"
                      )} />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isTransitioning}
                      aria-label="Build it"
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                        prompt.trim()
                          ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-md shadow-violet-500/30 hover:scale-105"
                          : isDark
                            ? "bg-white/5 text-slate-600 cursor-not-allowed"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {isTransitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>

                {/* Example prompts — small soft pills, Replit pattern */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-4 flex flex-wrap justify-start gap-2"
                >
                  {examplePromptsByTarget[buildTarget].slice(0, 4).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setPrompt(ex); inputRef.current?.focus() }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        isDark
                          ? "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
                          : "bg-slate-50 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                      )}
                    >
                      {ex.length > 50 ? ex.slice(0, 48) + '…' : ex}
                    </button>
                  ))}
                </motion.div>

                </div>{/* end left column */}

                {/* Right column — live demo. Browser frame with iframe srcDoc
                    cycling through 3 actual generated sites. Brief generating
                    overlay between switches. This is the demo. */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full max-w-xl mx-auto lg:max-w-none"
                >
                  {/* Glow under the mockup */}
                  <div className="absolute -inset-4 rounded-[2.5rem] opacity-60 blur-2xl bg-gradient-to-br from-violet-500/30 via-pink-500/30 to-amber-500/30 pointer-events-none" />
                  <div className={cn(
                    "relative rounded-2xl overflow-hidden border shadow-2xl",
                    isDark ? "bg-slate-950 border-white/10 shadow-black/60" : "bg-white border-slate-200 shadow-slate-400/30"
                  )}>
                    {/* Browser chrome */}
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-3 border-b",
                      isDark ? "bg-slate-900 border-white/5" : "bg-slate-50 border-slate-200"
                    )}>
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className={cn(
                        "flex-1 mx-3 px-3 py-1 rounded-md text-xs flex items-center gap-2",
                        isDark ? "bg-slate-800 text-slate-400" : "bg-white text-slate-500 border border-slate-200"
                      )}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-mono truncate">webstew.ai/preview/{DEMO_SITES[demoIdx].id}</span>
                      </div>
                      <div className={cn(
                        "text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded",
                        isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-600"
                      )}>
                        LIVE
                      </div>
                    </div>

                    {/* Live iframe — the actual demo render */}
                    <div className={cn("relative aspect-[16/11]", isDark ? "bg-slate-950" : "bg-white")}>
                      <AnimatePresence mode="wait">
                        <motion.iframe
                          key={demoIdx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          srcDoc={DEMO_SITES[demoIdx].html}
                          sandbox="allow-scripts"
                          className="absolute inset-0 w-full h-full"
                          title={`Webstew demo: ${DEMO_SITES[demoIdx].label}`}
                        />
                      </AnimatePresence>
                      {/* Generating overlay */}
                      <AnimatePresence>
                        {demoGenerating && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "absolute inset-0 flex items-center justify-center backdrop-blur-md",
                              isDark ? "bg-slate-950/85" : "bg-white/85"
                            )}
                          >
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <motion.div
                                  className="w-2 h-2 rounded-full bg-violet-500"
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                />
                                <motion.div
                                  className="w-2 h-2 rounded-full bg-fuchsia-500"
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                                />
                                <motion.div
                                  className="w-2 h-2 rounded-full bg-pink-500"
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                                />
                              </div>
                              <div className={cn("text-xs font-mono", isDark ? "text-slate-400" : "text-slate-600")}>
                                Generating with Claude…
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Prompt strip below — shows what prompt produced this site */}
                    <div className={cn(
                      "px-4 py-3 border-t flex items-center gap-3",
                      isDark ? "bg-slate-900/80 border-white/5" : "bg-slate-50 border-slate-200"
                    )}>
                      <div className={cn(
                        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs",
                        isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-600"
                      )}>
                        ✦
                      </div>
                      <div className={cn("text-xs font-mono italic truncate", isDark ? "text-slate-400" : "text-slate-600")}>
                        &ldquo;{DEMO_SITES[demoIdx].prompt}&rdquo;
                      </div>
                    </div>
                  </div>

                  {/* Dot indicators */}
                  <div className="flex items-center justify-center gap-2 mt-5">
                    {DEMO_SITES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setDemoGenerating(true); setTimeout(() => { setDemoIdx(i); setDemoGenerating(false) }, 800) }}
                        aria-label={`Show demo ${i + 1}`}
                        className={cn(
                          "rounded-full transition-all",
                          i === demoIdx
                            ? "w-8 h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            : isDark ? "w-2 h-2 bg-white/20 hover:bg-white/30" : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                        )}
                      />
                    ))}
                  </div>
                </motion.div>

              </div>
            </main>

            {/* Stats strip — Webflow-style stat callouts. Compact, confident,
                no chart vibes. Each one is a single number + small label. */}
            <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }} className="px-6 py-12">
              <div className={cn(
                "max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-3xl border",
                isDark ? "bg-white/[0.04] border-white/10" : "bg-slate-900/[0.04] border-slate-200"
              )}>
                {[
                  { num: '6', label: 'frameworks supported' },
                  { num: '<60s', label: 'prompt to preview' },
                  { num: '100%', label: 'code you own' },
                  { num: '0', label: 'lock-in' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "py-7 px-5 text-center",
                      isDark ? "bg-slate-950/40" : "bg-white/60"
                    )}
                  >
                    <div
                      className={cn(
                        "text-3xl md:text-4xl font-bold tracking-tight mb-1",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontStyle: 'italic' }}
                    >
                      {stat.num}
                    </div>
                    <div className={cn(
                      "text-xs uppercase tracking-wider",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* AI capabilities — three pillars (Code / Design / Media) so a
                visitor in 5 seconds knows Webstew isn't just HTML generation.
                Bold gradient borders, big icons, confident copy. */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="px-6 py-16"
            >
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className={cn(
                    "text-3xl md:text-5xl font-bold tracking-tight",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    Whatever you can describe,
                    <span
                      className={cn(
                        "italic font-normal ml-3 bg-clip-text text-transparent",
                        isDark
                          ? "bg-gradient-to-r from-amber-200 to-pink-300"
                          : "bg-gradient-to-r from-orange-500 to-pink-500"
                      )}
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
                      Webstew makes.
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      title: 'Code',
                      sub: 'Real production code in 6 frameworks',
                      body: 'Tailwind, TypeScript, Next.js, React, Astro, Expo. Generated, ready to deploy. Export the source — no lock-in.',
                      icon: <Code2 className="w-7 h-7" />,
                      grad: 'from-violet-500 to-fuchsia-500',
                    },
                    {
                      title: 'Design',
                      sub: 'Beautiful layouts, on-brand from the first try',
                      body: 'Modern aesthetics. Glassmorphism, gradients, real typography. Polished enough to ship without redesign.',
                      icon: <Palette className="w-7 h-7" />,
                      grad: 'from-pink-500 to-amber-500',
                    },
                    {
                      title: 'Media',
                      sub: 'Images, videos, audio — all in-flow',
                      body: 'Generate hero photos, product shots, short videos, voiceovers. Drop them straight into what you’re building.',
                      icon: <ImageIcon className="w-7 h-7" />,
                      grad: 'from-emerald-500 to-cyan-500',
                    },
                  ].map((c) => (
                    <div
                      key={c.title}
                      className={cn(
                        "relative rounded-3xl border p-6 overflow-hidden transition-all hover:scale-[1.02] hover:-translate-y-1",
                        isDark
                          ? "bg-slate-900/60 border-white/10"
                          : "bg-white/80 border-slate-200 shadow-sm hover:shadow-xl"
                      )}
                    >
                      <div className={cn("h-1 -mx-6 -mt-6 mb-5 bg-gradient-to-r", c.grad)} />
                      <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 bg-gradient-to-br text-white", c.grad)}>
                        {c.icon}
                      </div>
                      <h3 className={cn("text-2xl font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>{c.title}</h3>
                      <p className={cn("text-sm font-medium mb-3", isDark ? "text-slate-300" : "text-slate-700")}>{c.sub}</p>
                      <p className={cn("text-sm leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* What's on the menu — bento grid of target capabilities, each
                card has its own visual character. Webflow's bento pattern,
                colored hover, mini-mockups inline-SVG. */}
            <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }} className="px-6 py-20">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <p className={cn(
                    "text-xs uppercase tracking-[0.25em] mb-3 font-semibold",
                    isDark ? "text-violet-300/80" : "text-violet-600/80"
                  )}>
                    On the menu
                  </p>
                  <h2 className={cn(
                    "text-3xl md:text-5xl font-bold mb-4 tracking-tight",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    Order what you want.
                    <span
                      className={cn(
                        "italic font-normal ml-3 bg-clip-text text-transparent",
                        isDark
                          ? "bg-gradient-to-r from-amber-200 to-pink-300"
                          : "bg-gradient-to-r from-orange-500 to-pink-500"
                      )}
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
                      Webstew cooks it.
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: 'Websites',
                      sub: 'Static HTML + Tailwind',
                      tag: 'website',
                      gradient: 'from-orange-500 to-rose-500',
                      mockup: (
                        <svg viewBox="0 0 240 140" className="w-full h-full">
                          <rect x="0" y="0" width="240" height="140" rx="8" fill="currentColor" opacity="0.05" />
                          <rect x="12" y="12" width="60" height="6" rx="3" fill="currentColor" opacity="0.4" />
                          <rect x="180" y="10" width="48" height="10" rx="5" fill="currentColor" opacity="0.6" />
                          <rect x="12" y="36" width="140" height="14" rx="3" fill="currentColor" opacity="0.7" />
                          <rect x="12" y="56" width="100" height="6" rx="3" fill="currentColor" opacity="0.3" />
                          <rect x="12" y="68" width="80" height="6" rx="3" fill="currentColor" opacity="0.3" />
                          <rect x="12" y="88" width="48" height="40" rx="6" fill="currentColor" opacity="0.25" />
                          <rect x="68" y="88" width="48" height="40" rx="6" fill="currentColor" opacity="0.25" />
                          <rect x="124" y="88" width="48" height="40" rx="6" fill="currentColor" opacity="0.25" />
                          <rect x="180" y="88" width="48" height="40" rx="6" fill="currentColor" opacity="0.25" />
                        </svg>
                      ),
                    },
                    {
                      title: 'Web Apps',
                      sub: 'Next.js · React · Astro',
                      tag: 'webapp',
                      gradient: 'from-violet-500 to-fuchsia-500',
                      mockup: (
                        <svg viewBox="0 0 240 140" className="w-full h-full">
                          <rect x="0" y="0" width="240" height="140" rx="8" fill="currentColor" opacity="0.05" />
                          <rect x="8" y="8" width="40" height="124" rx="4" fill="currentColor" opacity="0.15" />
                          <circle cx="20" cy="22" r="3" fill="currentColor" opacity="0.5" />
                          <rect x="28" y="20" width="14" height="4" rx="2" fill="currentColor" opacity="0.5" />
                          <circle cx="20" cy="40" r="3" fill="currentColor" opacity="0.4" />
                          <rect x="28" y="38" width="14" height="4" rx="2" fill="currentColor" opacity="0.4" />
                          <circle cx="20" cy="58" r="3" fill="currentColor" opacity="0.4" />
                          <rect x="28" y="56" width="14" height="4" rx="2" fill="currentColor" opacity="0.4" />
                          <rect x="56" y="14" width="40" height="40" rx="5" fill="currentColor" opacity="0.25" />
                          <rect x="100" y="14" width="40" height="40" rx="5" fill="currentColor" opacity="0.25" />
                          <rect x="144" y="14" width="40" height="40" rx="5" fill="currentColor" opacity="0.25" />
                          <rect x="188" y="14" width="44" height="40" rx="5" fill="currentColor" opacity="0.25" />
                          <rect x="56" y="62" width="176" height="70" rx="5" fill="currentColor" opacity="0.15" />
                          <polyline points="64,118 84,98 104,108 124,82 144,92 164,72 184,86 204,68 224,78" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
                        </svg>
                      ),
                    },
                    {
                      title: 'Mobile Apps',
                      sub: 'Expo · iOS · Android',
                      tag: 'mobile',
                      gradient: 'from-pink-500 to-amber-500',
                      mockup: (
                        <svg viewBox="0 0 240 140" className="w-full h-full">
                          <rect x="0" y="0" width="240" height="140" rx="8" fill="currentColor" opacity="0.05" />
                          <rect x="84" y="8" width="72" height="124" rx="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                          <rect x="108" y="13" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
                          <rect x="92" y="24" width="56" height="22" rx="4" fill="currentColor" opacity="0.3" />
                          <rect x="92" y="52" width="56" height="6" rx="3" fill="currentColor" opacity="0.5" />
                          <rect x="92" y="62" width="36" height="4" rx="2" fill="currentColor" opacity="0.3" />
                          <rect x="92" y="74" width="26" height="26" rx="4" fill="currentColor" opacity="0.25" />
                          <rect x="122" y="74" width="26" height="26" rx="4" fill="currentColor" opacity="0.25" />
                          <rect x="92" y="106" width="56" height="20" rx="4" fill="currentColor" opacity="0.4" />
                          <circle cx="40" cy="36" r="4" fill="currentColor" opacity="0.4" />
                          <circle cx="40" cy="56" r="4" fill="currentColor" opacity="0.3" />
                          <circle cx="40" cy="76" r="4" fill="currentColor" opacity="0.3" />
                          <circle cx="200" cy="36" r="4" fill="currentColor" opacity="0.4" />
                          <circle cx="200" cy="56" r="4" fill="currentColor" opacity="0.3" />
                          <circle cx="200" cy="76" r="4" fill="currentColor" opacity="0.3" />
                        </svg>
                      ),
                    },
                    {
                      title: 'More coming',
                      sub: 'Python · FastAPI · Streamlit',
                      tag: 'soon',
                      gradient: 'from-emerald-500 to-cyan-500',
                      mockup: (
                        <svg viewBox="0 0 240 140" className="w-full h-full">
                          <rect x="0" y="0" width="240" height="140" rx="8" fill="currentColor" opacity="0.05" />
                          <g transform="translate(120 70)">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <rect
                                key={i}
                                x="-2"
                                y="-32"
                                width="4"
                                height={i % 3 === 0 ? 16 : 10}
                                rx="2"
                                fill="currentColor"
                                opacity={0.15 + (i % 4) * 0.1}
                                transform={`rotate(${i * 30})`}
                              />
                            ))}
                          </g>
                          <text x="120" y="120" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="10" fontWeight="600">COMING SOON</text>
                        </svg>
                      ),
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className={cn(
                        "group relative rounded-3xl border overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                        isDark
                          ? "bg-slate-900/60 border-white/10 hover:border-white/20"
                          : "bg-white/80 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg"
                      )}
                    >
                      {/* gradient accent bar */}
                      <div className={cn("h-1 bg-gradient-to-r", card.gradient)} />
                      <div className="p-5">
                        <h3 className={cn(
                          "text-lg font-bold mb-1",
                          isDark ? "text-white" : "text-slate-900"
                        )}>
                          {card.title}
                        </h3>
                        <p className={cn(
                          "text-xs mb-4",
                          isDark ? "text-slate-400" : "text-slate-500"
                        )}>
                          {card.sub}
                        </p>
                        <div className={cn(
                          "aspect-[12/7] rounded-xl overflow-hidden",
                          isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700"
                        )}>
                          {card.mockup}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* How it works — 3 steps with bold numbered badges, kitchen
                language to lean into the brand. */}
            <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }} className="px-6 py-20">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                  <p className={cn(
                    "text-xs uppercase tracking-[0.25em] mb-3 font-semibold",
                    isDark ? "text-violet-300/80" : "text-violet-600/80"
                  )}>
                    How it works
                  </p>
                  <h2 className={cn(
                    "text-3xl md:text-5xl font-bold tracking-tight",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    Prompt to live app in
                    <span
                      className={cn(
                        "italic font-normal ml-3 bg-clip-text text-transparent",
                        isDark
                          ? "bg-gradient-to-r from-amber-200 to-pink-300"
                          : "bg-gradient-to-r from-orange-500 to-pink-500"
                      )}
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
                      three steps.
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { num: '01', title: 'Describe', body: 'Tell Webstew what you want. Plain English. As specific or vague as you like.' },
                    { num: '02', title: 'Generate', body: 'AI writes real production code — Tailwind, TypeScript, React, Expo — in under a minute.' },
                    { num: '03', title: 'Ship', body: 'Preview in the workspace, refine with chat, export the source, deploy anywhere.' },
                  ].map((step) => (
                    <div
                      key={step.num}
                      className={cn(
                        "rounded-3xl border p-6 transition-colors",
                        isDark
                          ? "bg-slate-900/40 border-white/10 hover:border-white/20"
                          : "bg-white/80 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div
                        className={cn(
                          "text-4xl font-bold italic mb-5 bg-clip-text text-transparent inline-block",
                          isDark
                            ? "bg-gradient-to-br from-amber-200 to-pink-300"
                            : "bg-gradient-to-br from-orange-500 to-pink-500"
                        )}
                        style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                      >
                        {step.num}
                      </div>
                      <h3 className={cn(
                        "text-xl font-bold mb-2",
                        isDark ? "text-white" : "text-slate-900"
                      )}>
                        {step.title}
                      </h3>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        isDark ? "text-slate-400" : "text-slate-600"
                      )}>
                        {step.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Showcase — masonry-ish gallery of what people are building.
                Real Unsplash imagery as stand-ins for project hero shots.
                Hover lifts the card and reveals the project meta. The big
                "look what's possible" moment — Webflow / Lovable both have
                this kind of section after their explainer. */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="px-6 py-20"
            >
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <p className={cn(
                    "text-xs uppercase tracking-[0.25em] mb-3 font-semibold",
                    isDark ? "text-violet-300/80" : "text-violet-600/80"
                  )}>
                    Built with Webstew
                  </p>
                  <h2 className={cn(
                    "text-3xl md:text-5xl font-bold tracking-tight",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    Real projects.
                    <span
                      className={cn(
                        "italic font-normal ml-3 bg-clip-text text-transparent",
                        isDark
                          ? "bg-gradient-to-r from-amber-200 to-pink-300"
                          : "bg-gradient-to-r from-orange-500 to-pink-500"
                      )}
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
                      Shipped fast.
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { title: 'Aurora Analytics', kind: 'SaaS Dashboard', stack: 'Next.js · Tailwind', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80' },
                    { title: 'Folio', kind: 'Designer Portfolio', stack: 'React · Vite', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b8?w=1200&q=80' },
                    { title: 'Pace Run', kind: 'Mobile App', stack: 'Expo · iOS · Android', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80' },
                    { title: 'Lumen Bistro', kind: 'Restaurant Site', stack: 'Astro · Tailwind', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80' },
                    { title: 'Vault', kind: 'Crypto Tracker', stack: 'Next.js · Recharts', img: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80' },
                    { title: 'Quill', kind: 'Markdown Blog', stack: 'Astro · MDX', img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80' },
                  ].map((p, i) => (
                    <motion.div
                      key={p.title}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4 }}
                      className={cn(
                        "group relative rounded-3xl overflow-hidden border",
                        isDark ? "border-white/10" : "border-slate-200 shadow-sm hover:shadow-2xl"
                      )}
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={p.img}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold mb-1">{p.kind}</p>
                        <h3 className="text-xl font-bold text-white mb-1">{p.title}</h3>
                        <p className="text-xs text-white/80">{p.stack}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Tech stack — bigger, more prominent than before. Inline SVG so
                no CDN dependency and no alt-text-on-fail duplicate. Real
                section feel: visible heading, generous spacing, larger logos. */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="px-6 py-20"
            >
              <div className="max-w-6xl mx-auto">
                <h2 className={cn(
                  "text-center text-2xl md:text-3xl font-bold mb-3",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  Built on the stacks teams actually ship
                </h2>
                <p className={cn(
                  "text-center text-base md:text-lg mb-12 max-w-2xl mx-auto",
                  isDark ? "text-slate-400" : "text-slate-600"
                )}>
                  Real code in modern frameworks — not no-code lock-in. Export, deploy, own it.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-10">
                  {[
                    { slug: 'nextdotjs', name: 'Next.js' },
                    { slug: 'react', name: 'React' },
                    { slug: 'typescript', name: 'TypeScript' },
                    { slug: 'tailwindcss', name: 'Tailwind' },
                    { slug: 'astro', name: 'Astro' },
                    { slug: 'expo', name: 'Expo' },
                    { slug: 'apple', name: 'iOS' },
                    { slug: 'android', name: 'Android' },
                    { slug: 'python', name: 'Python', soon: true },
                    { slug: 'vercel', name: 'Vercel' },
                  ].map((tech) => (
                    <div
                      key={tech.slug}
                      title={tech.soon ? `${tech.name} — coming soon` : tech.name}
                      className={cn(
                        "group flex flex-col items-center gap-3 transition-all",
                        tech.soon
                          ? "opacity-50"
                          : isDark
                            ? "opacity-70 hover:opacity-100"
                            : "opacity-80 hover:opacity-100"
                      )}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 transition-transform group-hover:scale-110",
                          isDark ? "fill-slate-200" : "fill-slate-700"
                        )}
                        aria-hidden="true"
                      >
                        <path d={TECH_ICONS[tech.slug] || ''} />
                      </svg>
                      <span className={cn(
                        "text-sm md:text-base font-semibold tracking-tight",
                        isDark ? "text-slate-200" : "text-slate-800"
                      )}>
                        {tech.name}
                        {tech.soon && <span className={cn(
                          "ml-1.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold align-middle",
                          isDark ? "bg-white/10 text-slate-400" : "bg-slate-200 text-slate-500"
                        )}>soon</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Closing CTA — full-bleed gradient panel, single confident
                button. The "second hero" pattern Lovable / Vercel use to
                close out the marketing flow. */}
            <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }} className="px-6 pb-20 pt-4">
              <div
                className={cn(
                  "max-w-5xl mx-auto rounded-3xl overflow-hidden relative border",
                  isDark ? "border-white/10" : "border-white/40"
                )}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 30%, #831843 70%, #7c2d12 100%)'
                      : 'linear-gradient(135deg, #fed7aa 0%, #fbcfe8 30%, #ddd6fe 70%, #fef3c7 100%)',
                  }}
                />
                {/* Soft blob accents inside the panel */}
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="absolute -top-20 -left-20 w-80 h-80 rounded-full"
                    style={{
                      filter: 'blur(80px)',
                      background: isDark
                        ? 'radial-gradient(circle, rgba(244,114,182,0.4), transparent 70%)'
                        : 'radial-gradient(circle, rgba(251,146,60,0.5), transparent 70%)',
                    }}
                  />
                  <div
                    className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full"
                    style={{
                      filter: 'blur(80px)',
                      background: isDark
                        ? 'radial-gradient(circle, rgba(167,139,250,0.4), transparent 70%)'
                        : 'radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)',
                    }}
                  />
                </div>
                <div className="relative px-8 md:px-16 py-16 md:py-20 text-center">
                  <h2 className={cn(
                    "text-4xl md:text-6xl font-bold tracking-tight mb-4",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    Hungry to ship?
                    <span
                      className="block italic font-normal mt-1"
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
                      Pull up a chair.
                    </span>
                  </h2>
                  <p className={cn(
                    "text-base md:text-lg mb-9 max-w-xl mx-auto",
                    isDark ? "text-white/80" : "text-slate-800/80"
                  )}>
                    Free to try. No credit card. Your first build is on us.
                  </p>
                  <a
                    href={sessionStatus === 'authenticated' ? '/workspace' : '/signup?next=%2Fworkspace'}
                    className={cn(
                      "inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-[1.04] shadow-xl",
                      isDark
                        ? "bg-white text-slate-900 hover:bg-slate-100 shadow-pink-500/20"
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/30"
                    )}
                  >
                    {sessionStatus === 'authenticated' ? 'Open Workspace' : 'Start cooking, free'}
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.section>

            {/* Footer */}
            <footer className={cn(
              "py-10 px-6 border-t",
              isDark ? "border-white/5 text-slate-500" : "border-slate-200 text-slate-500"
            )}>
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍲</span>
                  <span className={cn("font-semibold", isDark ? "text-white" : "text-slate-800")}>Webstew</span>
                  <span className={cn("text-xs", isDark ? "text-slate-600" : "text-slate-400")}>· prompts to working code</span>
                </div>
                <div className="flex items-center gap-5">
                  <a href="/app-builder" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>App Builder</a>
                  <a href="/community" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Community</a>
                  <a href="/upgrade" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Pricing</a>
                  <a href="/login" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Sign in</a>
                </div>
              </div>
            </footer>

            {/* Template Preview Modal - Side by Side Card */}
            <AnimatePresence>
              {selectedTemplate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex w-full max-w-4xl h-[500px] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                  >
                    {/* Left: Mini Website Preview - Category Specific */}
                    <div className="w-1/2 overflow-y-auto border-r border-white/5 bg-white">
                      {/* Mini Hero */}
                      <div className="relative h-36">
                        <img src={selectedTemplate.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
                        <div className="relative h-full flex flex-col items-center justify-center p-3">
                          <div className="h-1.5 w-12 bg-white/30 rounded mb-1.5" />
                          <div className="h-2.5 w-28 bg-white/60 rounded mb-1" />
                          <div className="h-1.5 w-20 bg-white/30 rounded mb-2" />
                          <div className="h-4 w-14 rounded" style={{ backgroundColor: selectedTemplate.colors.primary }} />
                        </div>
                      </div>

                      {/* Category-specific content */}
                      {selectedTemplate.category === 'Restaurant' && (
                        <>
                          {/* Menu Items */}
                          <div className="p-3 bg-amber-50">
                            <div className="h-1.5 w-12 bg-amber-200 rounded mx-auto mb-2" />
                            <div className="space-y-1.5">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="flex justify-between items-center p-1.5 bg-white rounded">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-amber-100 rounded" />
                                    <div className="h-1.5 w-16 bg-zinc-200 rounded" />
                                  </div>
                                  <div className="h-1.5 w-6 bg-amber-400 rounded" />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="relative h-20">
                            <img src={selectedTemplate.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                        </>
                      )}

                      {selectedTemplate.category === 'E-Commerce' && (
                        <>
                          {/* Product Grid */}
                          <div className="p-3 bg-zinc-50">
                            <div className="grid grid-cols-2 gap-2">
                              {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white rounded-lg p-1.5 shadow-sm">
                                  <div className="h-12 bg-zinc-100 rounded mb-1.5" />
                                  <div className="h-1.5 w-full bg-zinc-200 rounded mb-1" />
                                  <div className="h-1.5 w-8 bg-zinc-900 rounded" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {selectedTemplate.category === 'Blog' && (
                        <>
                          {/* Blog Posts */}
                          <div className="p-3 bg-orange-50">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <div className="h-16 bg-orange-100 rounded mb-1.5" />
                                <div className="h-1.5 w-full bg-zinc-300 rounded mb-1" />
                                <div className="h-1 w-3/4 bg-zinc-200 rounded" />
                              </div>
                              <div className="w-20 space-y-2">
                                {[1, 2].map(i => (
                                  <div key={i} className="flex gap-1.5">
                                    <div className="w-8 h-8 bg-orange-100 rounded" />
                                    <div className="flex-1">
                                      <div className="h-1 w-full bg-zinc-300 rounded mb-0.5" />
                                      <div className="h-1 w-2/3 bg-zinc-200 rounded" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedTemplate.category === 'Events' && (
                        <>
                          {/* Countdown + Speakers */}
                          <div className="p-3 bg-violet-950">
                            <div className="flex justify-center gap-2 mb-3">
                              {['Days', 'Hrs', 'Min'].map(l => (
                                <div key={l} className="text-center">
                                  <div className="w-8 h-8 bg-violet-800 rounded flex items-center justify-center text-white text-xs font-bold">00</div>
                                  <div className="text-[8px] text-violet-400 mt-0.5">{l}</div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-center gap-2">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="text-center">
                                  <div className="w-8 h-8 bg-violet-700 rounded-full mx-auto mb-1" />
                                  <div className="h-1 w-8 bg-violet-600 rounded" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {selectedTemplate.category === 'Photography' && (
                        <>
                          {/* Masonry Gallery */}
                          <div className="p-2 bg-zinc-950">
                            <div className="grid grid-cols-3 gap-1">
                              <div className="h-16 bg-zinc-800 rounded" />
                              <div className="h-10 bg-zinc-800 rounded" />
                              <div className="h-20 bg-zinc-800 rounded row-span-2" />
                              <div className="h-12 bg-zinc-800 rounded" />
                              <div className="h-14 bg-zinc-800 rounded" />
                            </div>
                          </div>
                        </>
                      )}

                      {selectedTemplate.category === 'Healthcare' && (
                        <>
                          {/* Services + Doctors */}
                          <div className="p-3 bg-sky-50">
                            <div className="grid grid-cols-3 gap-1.5 mb-2">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="p-1.5 bg-white rounded text-center">
                                  <div className="w-5 h-5 bg-sky-100 rounded-full mx-auto mb-1" />
                                  <div className="h-1 w-full bg-zinc-200 rounded" />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-1.5">
                              {[1, 2].map(i => (
                                <div key={i} className="flex-1 flex items-center gap-1.5 p-1.5 bg-white rounded">
                                  <div className="w-6 h-6 bg-sky-200 rounded-full" />
                                  <div>
                                    <div className="h-1 w-10 bg-zinc-300 rounded mb-0.5" />
                                    <div className="h-1 w-8 bg-sky-300 rounded" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Default sections for other categories */}
                      {!['Restaurant', 'E-Commerce', 'Blog', 'Events', 'Photography', 'Healthcare'].includes(selectedTemplate.category) && (
                        <>
                          <div className="p-3 bg-zinc-950">
                            <div className="grid grid-cols-3 gap-1.5">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="p-2 bg-zinc-900 rounded">
                                  <div className="w-4 h-4 rounded mb-1" style={{ backgroundColor: `${selectedTemplate.colors.primary}40` }} />
                                  <div className="h-1 w-full bg-zinc-800 rounded mb-0.5" />
                                  <div className="h-1 w-3/4 bg-zinc-800/50 rounded" />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="relative h-16">
                            <img src={selectedTemplate.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                        </>
                      )}

                      {/* Testimonials */}
                      <div className="p-3 bg-zinc-900">
                        <div className="flex gap-1.5">
                          {[1, 2].map(i => (
                            <div key={i} className="flex-1 p-1.5 bg-zinc-800 rounded">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-3 h-3 rounded-full bg-zinc-600" />
                                <div className="h-1 w-8 bg-zinc-700 rounded" />
                              </div>
                              <div className="h-1 w-full bg-zinc-700/50 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="p-3 flex flex-col items-center" style={{ backgroundColor: selectedTemplate.colors.primary }}>
                        <div className="h-1.5 w-20 bg-white/40 rounded mb-1" />
                        <div className="h-4 w-16 bg-white/90 rounded" />
                      </div>

                      {/* Footer */}
                      <div className="p-2 bg-zinc-950 flex items-center justify-between">
                        <div className="h-1.5 w-10 bg-zinc-800 rounded" />
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-2.5 h-2.5 bg-zinc-800 rounded" />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Info */}
                    <div className="w-1/2 p-6 flex flex-col">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">
                            {selectedTemplate.category}
                          </span>
                          <h3 className="text-2xl font-bold text-white mt-1">
                            {selectedTemplate.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => setSelectedTemplate(null)}
                          className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Colors */}
                      <div className="flex gap-2 mb-6">
                        {Object.values(selectedTemplate.colors).map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-lg ring-1 ring-white/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      {/* Sections */}
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                          {selectedTemplate.sections.length} Sections Included
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.sections.map((section) => (
                            <span
                              key={section}
                              className="px-2.5 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md"
                            >
                              {section}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex gap-3 mb-6">
                        {selectedTemplate.features.map((f) => (
                          <span key={f} className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => handleTemplateSelect(selectedTemplate.prompt)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Use This Template
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keyboard hint removed — was a fixed overlay that covered the
                tech-stack heading on first load. The dropdown + send arrow
                inside the textarea already make the affordance clear. */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
