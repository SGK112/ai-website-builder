'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { BuildTargetModal, type BuildTargetId } from '@/components/builder/BuildTargetModal'
import { SiteGraderWidget } from '@/components/landing/SiteGraderWidget'
import { VoiceBuilderPreview } from '@/components/landing/VoiceBuilderPreview'

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

// Maps landing-page template gallery IDs to pre-built HTML template IDs in
// @/lib/templates. When a tile in this map is clicked, /workspace loads the
// pre-built HTML directly (instant, no LLM call). When the tile is NOT in
// the map, we fall through to the prompt path — AI generates from scratch
// with the new industry-aware system prompt. Both paths produce a starter
// the user can refine; this just lets people pick "instant known-good HTML"
// vs "AI riff on the idea".
const LANDING_TO_LIB_TEMPLATE: Record<string, string> = {
  'saas-modern': 'saas-landing',
  'restaurant-elegant': 'restaurant-menu',
  'agency-creative': 'agency-portfolio',
  'ecommerce-luxury': 'luxe-ecommerce',
  'portfolio-minimal': 'agency-portfolio',
  'startup-bold': 'saas-multipage',
  'photography-portfolio': 'agency-portfolio',
  // fitness-gym / realestate-luxury / medical-clinic / blog-magazine /
  // event-conference: no matching pre-built template yet → AI prompt path
}

export default function HomePage() {
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Page-level scroll progress — drives a thin fixed bar at the top of the
  // viewport so users have constant feedback about where they are in the
  // story. Smoothed so it doesn't jitter when the user scrolls hard.
  const { scrollYProgress: pageProgress } = useScroll()
  const pageProgressSmooth = useSpring(pageProgress, { stiffness: 110, damping: 30 })


  const [prompt, setPrompt] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showTargetModal, setShowTargetModal] = useState(false)
  const [projectTheme, setProjectTheme] = useState<'light' | 'dark'>('dark')
  const [buildTarget, setBuildTarget] = useState<'website' | 'webapp' | 'mobile'>('website')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templateGallery[0] | null>(null)
  const [showAllTemplates, setShowAllTemplates] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rotatingWordIdx, setRotatingWordIdx] = useState(0)
  // Rotates through concrete OUTPUTS — what Webstew actually ships. Each
  // matches a card in the workspace's "What do you want to build?" picker
  // so the landing's promise lines up with the product's first step.
  // "store" not "online store" so "Build a ___" reads cleanly (no a/an
  // article problem) and landing page is dropped as a subset of website.
  const rotatingWords = ['website', 'mobile app', 'store', 'web app']
  const rotatingWord = rotatingWords[rotatingWordIdx]
  // Typewriter placeholder state
  const [typedText, setTypedText] = useState('')

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

  // Route to the workspace — the single build surface for every target.
  // Website target is anon-accessible (1 free generation, then a signup
  // wall); webapp / mobile targets ride through /signup since multi-target
  // generation is gated.
  const navigateToBuilder = (projectPrompt: string, t: 'website' | 'webapp' | 'mobile' = buildTarget) => {
    setIsTransitioning(true)
    let url: string
    let anonOk = false
    if (t === 'website') {
      const params = new URLSearchParams({ prompt: projectPrompt, theme: projectTheme })
      url = `/workspace?${params.toString()}`
      anonOk = true
    } else {
      const apiTarget = t === 'mobile' ? 'expo' : 'nextjs'
      const params = new URLSearchParams({ prompt: projectPrompt, target: apiTarget })
      url = `/workspace?${params.toString()}`
    }
    // Hard navigation (not router.push): /workspace's WebContainer preview
    // needs cross-origin isolation, which only applies on a full document
    // load — a soft client-side nav keeps the non-isolated home document.
    if (anonOk || sessionStatus === 'authenticated') {
      window.location.assign(url)
    } else {
      window.location.assign(`/signup?next=${encodeURIComponent(url)}`)
    }
  }

  // App Builder chooser — open the workspace already set to the picked
  // build target. Website is anon-accessible; the app targets are gated,
  // so route those through /signup when the visitor isn't signed in.
  const handlePickTarget = (target: BuildTargetId) => {
    setShowTargetModal(false)
    const url = target === 'website' ? '/workspace' : `/workspace?target=${target}`
    // Hard navigation (not router.push): /workspace's WebContainer preview
    // needs cross-origin isolation, and the COOP/COEP headers only take
    // effect on a full document load — a soft client-side nav keeps the
    // non-isolated home document and breaks the preview.
    if (target === 'website' || sessionStatus === 'authenticated') {
      window.location.assign(url)
    } else {
      window.location.assign(`/signup?next=${encodeURIComponent(url)}`)
    }
  }

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

  // Handle template selection — two paths depending on whether the landing
  // template tile maps to a pre-built lib template:
  //   - mapped: push /workspace?templateId=<libId> → workspace loads the
  //     pre-built HTML directly, no LLM call (instant starter)
  //   - unmapped: fall back to the prompt path → AI generates from scratch
  //     with the industry-aware system prompt
  const handleTemplateSelect = (template: { id: string; prompt: string }) => {
    const libTemplateId = LANDING_TO_LIB_TEMPLATE[template.id]
    if (libTemplateId) {
      setIsTransitioning(true)
      const url = `/workspace?templateId=${encodeURIComponent(libTemplateId)}`
      if (sessionStatus === 'authenticated') {
        router.push(url)
      } else {
        // Templates use the same anon-mode path as fresh website builds —
        // user can preview the starter, signup-wall fires on Save/Deploy.
        router.push(url)
      }
      return
    }
    navigateToBuilder(template.prompt, 'website')
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
          className="min-h-screen relative"
        >
          {/* Fixed scroll progress bar — thin gradient line at the very top
              of the viewport that fills as the user scrolls through the
              page. Constant feedback that the story has more to come. */}
          <motion.div
            style={{ scaleX: pageProgressSmooth }}
            className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 pointer-events-none"
            aria-hidden
          />

          {/* HERO BACKGROUND — contained to a `h-screen` wrapper anchored at
              the top of the page so the aurora/grid/beams/flecks only render
              in the hero area, NOT stretching across every section below.
              Also: this is the ONLY overflow-hidden wrapper in the layout —
              the page wrapper above must stay overflow-visible so descendant
              `position: sticky` (preview takeover) actually works. */}
          <div className="absolute inset-x-0 top-0 h-screen overflow-hidden pointer-events-none">
          {/* Hero background — layered: base + radial-masked grid +
              conic spotlight + drifting aurora beams + twinkling particles
              + bottom veil. Designed to feel cinematic, not "AI gradient
              blob". Palette leans violet/fuchsia/cyan with a warm amber
              accent so it still ties to the Webstew brand. */}
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a0b2e 0%, #0a0612 45%, #050308 100%)'
                : 'radial-gradient(ellipse 120% 80% at 50% 0%, #f5efff 0%, #fbf7ff 45%, #ffffff 100%)',
            }}
          />

          {/* Radial-masked grid — subtle structure, fades from center */}
          <div
            className="absolute inset-0 hero-grid pointer-events-none"
            style={{
              ['--hero-grid-color' as any]: isDark
                ? 'rgba(255,255,255,0.055)'
                : 'rgba(15,23,42,0.06)',
            }}
          />

          {/* Conic spotlight — slowly rotating multi-hue cone */}
          <div className="hero-spotlight pointer-events-none" aria-hidden />

          {/* Aurora beams — three long diagonal ribbons that drift */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="aurora-beam"
              style={{
                top: '-10%',
                left: '-10%',
                width: '70%',
                height: '38rem',
                ['--beam-rot' as any]: '14deg',
                ['--beam-duration' as any]: '16s',
                ['--beam-opacity-min' as any]: isDark ? 0.35 : 0.22,
                ['--beam-opacity-max' as any]: isDark ? 0.75 : 0.45,
                background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.55) 35%, rgba(236,72,153,0.55) 65%, transparent 100%)',
              }}
            />
            <div
              className="aurora-beam"
              style={{
                top: '22%',
                right: '-15%',
                width: '75%',
                height: '32rem',
                ['--beam-rot' as any]: '-12deg',
                ['--beam-duration' as any]: '19s',
                ['--beam-opacity-min' as any]: isDark ? 0.3 : 0.18,
                ['--beam-opacity-max' as any]: isDark ? 0.65 : 0.38,
                background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.5) 30%, rgba(139,92,246,0.55) 70%, transparent 100%)',
              }}
            />
            <div
              className="aurora-beam"
              style={{
                bottom: '-12%',
                left: '5%',
                width: '85%',
                height: '34rem',
                ['--beam-rot' as any]: '8deg',
                ['--beam-duration' as any]: '22s',
                ['--beam-opacity-min' as any]: isDark ? 0.28 : 0.16,
                ['--beam-opacity-max' as any]: isDark ? 0.6 : 0.35,
                background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.42) 25%, rgba(236,72,153,0.5) 60%, rgba(139,92,246,0.45) 90%, transparent 100%)',
              }}
            />
            {/* Webstew warm beam — saffron → paprika → wine. Anchors the
                cooking-theme palette inside the modern aurora field. */}
            <div
              className="aurora-beam"
              style={{
                top: '48%',
                left: '-20%',
                width: '80%',
                height: '30rem',
                ['--beam-rot' as any]: '-6deg',
                ['--beam-duration' as any]: '24s',
                ['--beam-opacity-min' as any]: isDark ? 0.32 : 0.18,
                ['--beam-opacity-max' as any]: isDark ? 0.7 : 0.42,
                background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.55) 25%, rgba(234,88,12,0.5) 55%, rgba(190,18,60,0.4) 85%, transparent 100%)',
              }}
            />
          </div>

          {/* Twinkling particles — sparse field of small dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { top: '12%', left: '8%',  size: 2, delay: 0,    dur: 4.5 },
              { top: '18%', left: '78%', size: 3, delay: 0.6,  dur: 5.2 },
              { top: '32%', left: '24%', size: 2, delay: 1.2,  dur: 4.8 },
              { top: '42%', left: '88%', size: 2, delay: 1.8,  dur: 5.5 },
              { top: '58%', left: '12%', size: 3, delay: 2.4,  dur: 4.7 },
              { top: '64%', left: '70%', size: 2, delay: 3.0,  dur: 5.1 },
              { top: '76%', left: '36%', size: 2, delay: 0.4,  dur: 5.3 },
              { top: '14%', left: '52%', size: 2, delay: 2.0,  dur: 4.9 },
              { top: '48%', left: '46%', size: 2, delay: 2.6,  dur: 5.4 },
              { top: '26%', left: '92%', size: 2, delay: 1.5,  dur: 4.6 },
              { top: '70%', left: '90%', size: 3, delay: 3.4,  dur: 5.0 },
              { top: '84%', left: '60%', size: 2, delay: 0.9,  dur: 4.8 },
            ].map((p, i) => (
              <span
                key={i}
                className="absolute rounded-full animate-twinkle"
                style={{
                  top: p.top,
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(124,58,237,0.6)',
                  boxShadow: isDark
                    ? '0 0 10px rgba(255,255,255,0.7), 0 0 20px rgba(167,139,250,0.55)'
                    : '0 0 8px rgba(124,58,237,0.45)',
                  ['--twinkle-duration' as any]: `${p.dur}s`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Webstew spice flecks — warm particles rising slowly through the
              hero like saffron and paprika lifting in a simmering broth. They
              start near the bottom edge and drift up + slightly sideways over
              ~14s. Sized between 2-4px so they read as ingredient flecks, not
              dust. Hues: saffron / paprika / cumin / sumac. */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { left: '6%',  size: 3, delay: 0,    dur: 13, sway: 22,  hue: 'saffron' },
              { left: '14%', size: 2, delay: 4.2,  dur: 15, sway: -18, hue: 'paprika' },
              { left: '22%', size: 4, delay: 7.5,  dur: 16, sway: 16,  hue: 'amber'   },
              { left: '31%', size: 2, delay: 2.1,  dur: 14, sway: -24, hue: 'cumin'   },
              { left: '42%', size: 3, delay: 9.0,  dur: 15, sway: 20,  hue: 'paprika' },
              { left: '51%', size: 2, delay: 5.4,  dur: 13, sway: -14, hue: 'saffron' },
              { left: '60%', size: 4, delay: 11.3, dur: 17, sway: 18,  hue: 'sumac'   },
              { left: '69%', size: 2, delay: 3.0,  dur: 14, sway: -22, hue: 'amber'   },
              { left: '78%', size: 3, delay: 8.1,  dur: 15, sway: 24,  hue: 'saffron' },
              { left: '86%', size: 2, delay: 6.0,  dur: 16, sway: -16, hue: 'paprika' },
              { left: '93%', size: 3, delay: 1.2,  dur: 14, sway: 20,  hue: 'cumin'   },
            ].map((p, i) => {
              const palette = {
                saffron: { bg: 'rgba(251,191,36,0.95)',  glow: 'rgba(251,191,36,0.55)' },
                paprika: { bg: 'rgba(234,88,12,0.95)',   glow: 'rgba(234,88,12,0.5)'   },
                amber:   { bg: 'rgba(245,158,11,0.95)',  glow: 'rgba(245,158,11,0.5)'  },
                cumin:   { bg: 'rgba(180,83,9,0.95)',    glow: 'rgba(180,83,9,0.45)'   },
                sumac:   { bg: 'rgba(190,18,60,0.95)',   glow: 'rgba(190,18,60,0.45)'  },
              }[p.hue as 'saffron' | 'paprika' | 'amber' | 'cumin' | 'sumac']
              return (
                <span
                  key={`spice-${i}`}
                  className="absolute rounded-full animate-spice"
                  style={{
                    left: p.left,
                    bottom: '-10px',
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    background: palette.bg,
                    boxShadow: `0 0 8px ${palette.glow}, 0 0 16px ${palette.glow}`,
                    opacity: isDark ? 0.85 : 0.7,
                    ['--spice-duration' as any]: `${p.dur}s`,
                    ['--spice-sway' as any]: `${p.sway}px`,
                    ['--spice-opacity' as any]: isDark ? 0.85 : 0.7,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              )
            })}
          </div>

          {/* Simmer glow — soft warm radial sitting at the bottom of the hero,
              breathing in and out like heat rising from a pot. Anchors the
              Webstew theme without dragging the palette back to "stew brown". */}
          <div
            className="absolute left-1/2 bottom-[-12rem] w-[70rem] h-[36rem] rounded-full pointer-events-none animate-simmer"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at center, rgba(234,88,12,0.28), rgba(251,191,36,0.16) 35%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(234,88,12,0.18), rgba(251,191,36,0.12) 35%, transparent 70%)',
              filter: 'blur(80px)',
              ['--simmer-duration' as any]: '9s',
              transform: 'translateX(-50%)',
            }}
            aria-hidden
          />

          {/* Bottom veil — fades hero into the next sections */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 h-64 pointer-events-none",
            isDark
              ? "bg-gradient-to-b from-transparent to-[#050308]"
              : "bg-gradient-to-b from-transparent to-white"
          )} />

          {/* Subtle noise overlay for film-grain texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
          </div>
          {/* /HERO BACKGROUND */}

          {/* Content overlay */}
          <div className="relative z-10">
            {/* Header */}
            <header className="px-4 py-4 sm:p-6">
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 sm:gap-2 min-w-0"
                >
                  <span
                    className="text-4xl sm:text-6xl leading-none select-none cursor-pointer hover:scale-110 hover:rotate-6 transition-all duration-500 ease-out shrink-0"
                    style={{
                      filter: isDark
                        ? 'drop-shadow(0 0 20px rgba(167, 139, 250, 0.6))'
                        : 'drop-shadow(0 0 20px rgba(251, 146, 60, 0.6))',
                      animation: 'float 4s ease-in-out infinite'
                    }}
                  >🍲</span>
                  {/* Wordmark — Webstew in Inter Tight (chosen 2026-05-15)
                      stacked over the "Ai Website Builder" tagline. Tight
                      leading so the two lines feel like one mark, not two
                      separate elements. */}
                  <span className="inline-flex flex-col items-center min-w-0 leading-none">
                    <span
                      className={cn(
                        "text-2xl sm:text-4xl tracking-tight truncate",
                        isDark
                          ? "bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent"
                          : "bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                      )}
                      style={{
                        fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      Webstew
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.22em] font-semibold whitespace-nowrap",
                        isDark ? "text-slate-400" : "text-slate-500"
                      )}
                      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                    >
                      <span className="text-violet-400 font-bold">Ai</span> Website Builder
                    </span>
                  </span>
                </motion.div>

                <motion.nav
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1 sm:gap-2 shrink-0"
                >
                  <a
                    href="/community"
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all hidden md:block",
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    Community
                  </a>
                  <button
                    onClick={() => setShowTargetModal(true)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all hidden sm:flex items-center gap-1.5",
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
                  </button>
                  <a
                    href="/login"
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all hidden sm:block",
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
                      "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
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
                      "p-2 sm:p-2.5 rounded-lg backdrop-blur-sm transition-all duration-300 shrink-0",
                      isDark
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-white/50 hover:bg-white/70 text-slate-700"
                    )}
                    aria-label="Toggle theme"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </motion.nav>
              </div>
            </header>

            {/* Main Content */}
            <main className="min-h-[60vh] flex items-center justify-center px-6 pb-4 pt-2">
              <div className="w-full max-w-2xl">
                {/* Hero — minimal Lovable shape: headline + input. No
                    status pill, no paragraph, no eyebrow. */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-10 relative"
                >
                  <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.04em] leading-[0.95] text-foreground">
                    Build a
                    <span className="block relative h-[1.15em] mt-2 overflow-visible">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={rotatingWord}
                          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          className={cn(
                            'absolute inset-0 italic font-normal bg-clip-text text-transparent',
                            isDark
                              ? 'bg-gradient-to-br from-violet-200 via-fuchsia-300 to-cyan-200'
                              : 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-600'
                          )}
                          style={{
                            fontFamily: 'var(--font-playfair), Georgia, "Times New Roman", serif',
                            fontSize: '1.2em',
                            lineHeight: '0.95',
                            letterSpacing: '-0.025em',
                          }}
                        >
                          {rotatingWord}.
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </h1>
                </motion.div>

                {/* Prompt window — large, generous padding. Single primary
                    action surface; visitors should never miss it. */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={cn(
                    'rounded-3xl backdrop-blur-xl border-2 transition-all duration-300',
                    isDark
                      ? 'bg-slate-900/70 border-white/10 shadow-2xl shadow-black/40'
                      : 'bg-white/95 border-slate-200 shadow-2xl shadow-slate-900/10',
                    prompt && (isDark ? 'ring-2 ring-violet-500/40 border-violet-500/30' : 'ring-2 ring-violet-400/30 border-violet-300/60')
                  )}
                >
                  <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-2">
                    <textarea
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={typedText || (
                        buildTarget === 'mobile'
                          ? `Describe the app you want to build…`
                          : buildTarget === 'webapp'
                            ? `Describe the web app you want to build…`
                            : `Describe the website you want to build…`
                      )}
                      rows={3}
                      className={cn(
                        'w-full resize-none bg-transparent text-lg sm:text-xl leading-relaxed focus:outline-none min-h-[88px] sm:min-h-[112px]',
                        isDark
                          ? 'text-white placeholder-slate-500'
                          : 'text-slate-900 placeholder-slate-400'
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pb-4 sm:pb-5">
                    {/* Build target dropdown (Lovable pattern) */}
                    <div className="relative">
                      <select
                        value={buildTarget}
                        onChange={(e) => setBuildTarget(e.target.value as typeof buildTarget)}
                        aria-label="Build target"
                        className={cn(
                          'appearance-none pl-3 pr-9 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors',
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                        )}
                      >
                        <option value="website">🌐  Website</option>
                        <option value="webapp">⚛️  Web App</option>
                        <option value="mobile">📱  Mobile App</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isTransitioning}
                      aria-label="Build it"
                      className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200',
                        prompt.trim()
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-100'
                          : isDark
                            ? 'bg-emerald-500/15 text-emerald-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-500 cursor-not-allowed'
                      )}
                    >
                      {isTransitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>


              </div>
            </main>

            {/* Build-with logo marquee — continuous horizontal scroll with
                edge fade. Pauses on hover. Track contains two copies of the
                logo list so the -50% translate loops seamlessly. */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative px-6 py-6"
            >
              <p className={cn(
                "text-center text-[11px] uppercase tracking-[0.28em] mb-4 font-semibold",
                isDark ? "text-slate-500" : "text-slate-500"
              )}>
                Ships with the stack teams actually use
              </p>
              <div className="marquee-pause max-w-6xl mx-auto marquee-mask overflow-hidden">
                <div className="flex w-max animate-marquee gap-3 will-change-transform">
                  {[...Array(2)].map((_, copy) => (
                    <div key={copy} className="flex gap-3 shrink-0" aria-hidden={copy === 1}>
                      {[
                        { slug: 'nextdotjs',   name: 'Next.js' },
                        { slug: 'react',       name: 'React' },
                        { slug: 'typescript',  name: 'TypeScript' },
                        { slug: 'tailwindcss', name: 'Tailwind' },
                        { slug: 'shadcnui',    name: 'shadcn/ui' },
                        { slug: 'vite',        name: 'Vite' },
                        { slug: 'astro',       name: 'Astro' },
                        { slug: 'expo',        name: 'Expo' },
                        { slug: 'apple',       name: 'iOS' },
                        { slug: 'android',     name: 'Android' },
                        { slug: 'python',      name: 'Python' },
                        { slug: 'nodedotjs',   name: 'Node.js' },
                        { slug: 'supabase',    name: 'Supabase' },
                        { slug: 'stripe',      name: 'Stripe' },
                        { slug: 'openai',      name: 'OpenAI' },
                        { slug: 'github',      name: 'GitHub' },
                        { slug: 'figma',       name: 'Figma' },
                        { slug: 'framer',      name: 'Framer Motion' },
                        { slug: 'prisma',      name: 'Prisma' },
                        { slug: 'vercel',      name: 'Vercel' },
                      ].map((tech) => (
                        <div
                          key={`${copy}-${tech.slug}`}
                          title={tech.name}
                          className={cn(
                            "shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-xl border backdrop-blur-md transition-colors",
                            isDark
                              ? "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14]"
                              : "bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300"
                          )}
                        >
                          {tech.slug === 'vercel' ? (
                            // Official Vercel asset (theme-aware) — black triangle on light,
                            // white on dark, per their brand guidelines.
                            <img
                              src={isDark
                                ? '/brand/partners/vercel/vercel-icon-dark.svg'
                                : '/brand/partners/vercel/vercel-icon-light.svg'}
                              alt="Vercel"
                              className="w-5 h-5"
                              loading="lazy"
                            />
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                              className={cn(
                                "w-5 h-5",
                                isDark ? "fill-slate-200" : "fill-slate-700"
                              )}
                              aria-hidden="true"
                            >
                              <path d={TECH_ICONS[tech.slug] || ''} />
                            </svg>
                          )}
                          <span className={cn(
                            "text-sm font-semibold tracking-tight whitespace-nowrap",
                            isDark ? "text-slate-200" : "text-slate-800"
                          )}>
                            {tech.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* How it works — 3 steps with bold numbered badges, kitchen
                language to lean into the brand. */}
            <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }} className="px-6 py-24">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.15] pb-2 text-foreground">
                    How it works.
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { num: '01', title: 'Describe', body: 'Plain English — as specific or as loose as you like.' },
                    { num: '02', title: 'Generate', body: 'Production code in under a minute. Next.js, React, Astro, or Expo.' },
                    { num: '03', title: 'Ship',     body: 'Preview, refine in chat, export the source, deploy anywhere.' },
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
                        "text-foreground"
                      )}>
                        {step.title}
                      </h3>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        "text-muted-foreground"
                      )}>
                        {step.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Templates section — image-top cards with title + sub below.
                4-col desktop, 2-col tablet, 1-col mobile. Tighter on phone
                so visitors aren't dragged through whitespace. */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 sm:px-6 py-12 sm:py-20"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex items-end justify-between mb-6 sm:mb-10 gap-4">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
                      Start from a template.
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground">
                      Pick a starting point. Customize anything in chat.
                    </p>
                  </div>
                  <a
                    href="/templates"
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
                      isDark
                        ? "border-white/10 hover:border-white/20 text-slate-300 hover:text-white bg-white/[0.03]"
                        : "border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-white"
                    )}
                  >
                    View all
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {([
                    // libId: ID in @/lib/templates if a pre-built starter
                    // exists for this category. Click → /workspace?templateId
                    // loads the HTML directly, no LLM call. Without libId,
                    // we fall back to AI generation with the title/sub as
                    // the prompt (industry-aware via detectIndustry).
                    { title: 'Personal portfolio', sub: 'Designer/dev work showcase', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', libId: 'agency-portfolio' },
                    { title: 'SaaS dashboard',     sub: 'Analytics, KPIs, charts',    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', libId: 'saas-landing' },
                    { title: 'Restaurant site',    sub: 'Menu, hours, reservations',  img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', libId: 'restaurant-menu' },
                    { title: 'Fitness mobile app', sub: 'Workouts, stats, streaks',   img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', libId: null },
                    { title: 'E-commerce store',   sub: 'Product grid, cart, checkout', img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80', libId: 'luxe-ecommerce' },
                    { title: 'Markdown blog',      sub: 'Posts, tags, search, RSS',   img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80', libId: null },
                    { title: 'Photography portfolio', sub: 'Masonry gallery, lightbox', img: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80', libId: 'agency-portfolio' },
                    { title: 'Documentation site', sub: 'Sidebar, search, code blocks', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', libId: null },
                  ] as Array<{ title: string; sub: string; img: string; libId: string | null }>).map((p, i) => (
                    <motion.button
                      key={p.title}
                      onClick={() => {
                        setIsTransitioning(true)
                        if (p.libId) {
                          router.push(`/workspace?templateId=${encodeURIComponent(p.libId)}`)
                        } else {
                          navigateToBuilder(`Build me a ${p.title.toLowerCase()} — ${p.sub.toLowerCase()}`, 'website')
                        }
                      }}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -3 }}
                      className="group text-left"
                    >
                      <div className={cn(
                        'aspect-[4/3] rounded-2xl overflow-hidden border mb-3 transition-shadow relative',
                        isDark ? 'border-white/10 group-hover:border-white/20 bg-slate-800' : 'border-slate-200 group-hover:shadow-lg bg-slate-100'
                      )}>
                        <img
                          src={p.img}
                          alt={p.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            // Unsplash CDN flake → swap to /api/media (Pexels)
                            const el = e.currentTarget
                            const fallback = `/api/media?q=${encodeURIComponent(p.title)}/800/600`
                            if (el.src !== fallback) el.src = fallback
                          }}
                        />
                      </div>
                      <h3 className={cn(
                        "font-semibold text-base mb-0.5 transition-colors",
                        isDark ? "text-white group-hover:text-violet-300" : "text-slate-900 group-hover:text-violet-600"
                      )}>
                        {p.title}
                      </h3>
                      <p className={cn(
                        "text-sm",
                        "text-muted-foreground"
                      )}>
                        {p.sub}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Lead-gen: grade their existing site. Free, no signup. Result
                inline + "Rebuild with Webstew" CTA drives signup with prompt
                pre-filled to rebuild a better version of their domain. */}
            <SiteGraderWidget isDark={isDark} />

            {/* Lead-gen: voice builder waitlist. "Coming soon" framing for
                the Aria bridge integration. Email capture posts to
                /api/waitlist (feature: 'voice-builder'). */}
            <VoiceBuilderPreview isDark={isDark} />

            {/* Tech stack — bigger, more prominent than before. Inline SVG so
                no CDN dependency and no alt-text-on-fail duplicate. Real
                section feel: visible heading, generous spacing, larger logos. */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="px-6 py-24"
            >
              <div className="max-w-6xl mx-auto">
                <p className={cn(
                  "text-center text-xs uppercase tracking-[0.25em] mb-3 font-semibold",
                  isDark ? "text-violet-300/80" : "text-violet-600/80"
                )}>
                  The pantry
                </p>
                <h2 className={cn(
                  "text-center text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.15] pb-2",
                  "text-foreground"
                )}>
                  The ingredients to
                  <span
                    className={cn(
                      // Playfair italic 'g' has a deep descender. The earlier
                      // clip was NOT a too-small box — it was the -mb-6 here:
                      // a negative bottom margin pulled the next element (with
                      // the opaque page background) UP over the descender and
                      // painted on top of it. So: enough leading + a little
                      // bottom padding to seat the descender, and NO negative
                      // margin. pr keeps the italic slant from clipping right.
                      "italic font-normal ml-3 bg-clip-text text-transparent inline-block leading-[1.35] pb-3 pr-3",
                      isDark
                        ? "bg-gradient-to-r from-amber-200 to-pink-300"
                        : "bg-gradient-to-r from-orange-500 to-pink-500"
                    )}
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                  >
                    greatness.
                  </span>
                </h2>
                <p className={cn(
                  "text-center text-base md:text-lg mb-12 max-w-2xl mx-auto",
                  "text-muted-foreground"
                )}>
                  Stocked with modern frameworks teams already love. Export the source, ship it anywhere.
                </p>
                {/* Bigger, slower-rolling marquee than the one near the
                    hero — this is the feature moment for the stack. Bigger
                    logos, generous chip padding, reverse-direction so it
                    visually distinguishes from the entry marquee above.
                    Two duplicated tracks keep the loop seamless. */}
                <div className="marquee-pause marquee-mask overflow-hidden">
                  <div className="flex w-max animate-marquee-reverse gap-4 will-change-transform">
                    {[...Array(2)].map((_, copy) => (
                      <div key={copy} className="flex gap-4 shrink-0" aria-hidden={copy === 1}>
                        {[
                          { slug: 'nextdotjs',   name: 'Next.js' },
                          { slug: 'react',       name: 'React' },
                          { slug: 'typescript',  name: 'TypeScript' },
                          { slug: 'tailwindcss', name: 'Tailwind' },
                          { slug: 'shadcnui',    name: 'shadcn/ui' },
                          { slug: 'vite',        name: 'Vite' },
                          { slug: 'astro',       name: 'Astro' },
                          { slug: 'expo',        name: 'Expo' },
                          { slug: 'apple',       name: 'iOS' },
                          { slug: 'android',     name: 'Android' },
                          { slug: 'nodedotjs',   name: 'Node.js' },
                          { slug: 'python',      name: 'Python', soon: true },
                          { slug: 'supabase',    name: 'Supabase' },
                          { slug: 'stripe',      name: 'Stripe' },
                          { slug: 'openai',      name: 'OpenAI' },
                          { slug: 'github',      name: 'GitHub' },
                          { slug: 'figma',       name: 'Figma' },
                          { slug: 'framer',      name: 'Framer Motion' },
                          { slug: 'prisma',      name: 'Prisma' },
                          { slug: 'vercel',      name: 'Vercel' },
                        ].map((tech) => (
                          <div
                            key={`${copy}-${tech.slug}`}
                            title={tech.soon ? `${tech.name} — coming soon` : tech.name}
                            className={cn(
                              "shrink-0 flex items-center gap-3 px-7 py-5 rounded-2xl border backdrop-blur-md transition-all",
                              tech.soon && "opacity-50",
                              isDark
                                ? "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.16]"
                                : "bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-md"
                            )}
                          >
                            {tech.slug === 'vercel' ? (
                              // Official Vercel asset (theme-aware).
                              <img
                                src={isDark
                                  ? '/brand/partners/vercel/vercel-icon-dark.svg'
                                  : '/brand/partners/vercel/vercel-icon-light.svg'}
                                alt="Vercel"
                                className="w-8 h-8"
                                loading="lazy"
                              />
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  "w-8 h-8",
                                  isDark ? "fill-slate-200" : "fill-slate-700"
                                )}
                                aria-hidden="true"
                              >
                                <path d={TECH_ICONS[tech.slug] || ''} />
                              </svg>
                            )}
                            <span className={cn(
                              "text-base font-semibold tracking-tight whitespace-nowrap",
                              isDark ? "text-slate-100" : "text-slate-900"
                            )}>
                              {tech.name}
                              {tech.soon && (
                                <span className={cn(
                                  "ml-2 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold align-middle",
                                  isDark ? "bg-white/10 text-slate-400" : "bg-slate-200 text-slate-500"
                                )}>soon</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Closing CTA — second prompt input, Lovable pattern. Same
                animated typewriter + dropdown + send arrow as the hero,
                with a "Ready to build?" headline above. Scrolls back to
                the same submit handler. */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="px-6 pb-24 pt-12"
            >
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.2] mb-8 pb-2 text-foreground">
                  Start building.
                </h2>

                {/* Same input component as the hero — animated typewriter,
                    dropdown picker, send arrow. Wired to the same submit. */}
                <div
                  className={cn(
                    "rounded-2xl backdrop-blur-xl border transition-all duration-300 text-left",
                    isDark
                      ? "bg-slate-900/70 border-white/10 shadow-xl shadow-black/30"
                      : "bg-white/90 border-slate-200/80 shadow-xl shadow-slate-300/30",
                    prompt && (isDark ? "ring-1 ring-violet-500/40" : "ring-1 ring-violet-400/40")
                  )}
                >
                  <div className="px-4 pt-3 pb-0">
                    <textarea
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
                        "text-muted-foreground"
                      )} />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isTransitioning}
                      aria-label="Build it"
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                        prompt.trim()
                          ? "bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-md shadow-emerald-500/30 hover:scale-105"
                          : isDark
                            ? "bg-emerald-500/15 text-emerald-400 cursor-not-allowed"
                            : "bg-emerald-50 text-emerald-500 cursor-not-allowed"
                      )}
                    >
                      {isTransitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className={cn(
                  "text-xs mt-4",
                  isDark ? "text-slate-500" : "text-slate-500"
                )}>
                  Free to start · No credit card · Your first build is on us
                </p>
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
                  <span
                    className={cn(
                      "inline-flex flex-col items-center leading-none",
                      isDark ? "text-white" : "text-slate-800"
                    )}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
                        fontWeight: 800,
                        fontSize: '1rem',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      Webstew
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 text-[8px] uppercase tracking-[0.22em] font-semibold",
                        isDark ? "text-slate-400" : "text-slate-500"
                      )}
                      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                    >
                      <span className="text-violet-500 font-bold">Ai</span> Website Builder
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-x-5 gap-y-2 flex-wrap justify-center sm:justify-end">
                  <a href="/grader" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Site Grader</a>
                  <button onClick={() => setShowTargetModal(true)} className={cn("transition-colors text-left", isDark ? "hover:text-white" : "hover:text-slate-900")}>App Builder</button>
                  <a href="/community" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Community</a>
                  <a href="/community?tab=feedback" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Feedback</a>
                  <a href="/upgrade" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Pricing</a>
                  <a href="/terms" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Terms</a>
                  <a href="/privacy" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Privacy</a>
                  <a href="/login" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Sign in</a>
                </div>
              </div>
              {/* Legal-entity disclosure. Stripe receipts + customer
                  portal show 'Remodely LLC' (the registered parent),
                  so we surface it here too — same name, end-to-end. */}
              <p className={cn(
                "max-w-5xl mx-auto mt-4 text-center sm:text-right text-xs",
                isDark ? "text-slate-600" : "text-slate-400"
              )}>
                Webstew AI is operated by Remodely LLC.
              </p>
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
                        onClick={() => handleTemplateSelect(selectedTemplate)}
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

            {/* App Builder chooser — opened from the "App Builder" nav/footer
                entries. Picking a target routes to /workspace?target=<id>. */}
            <BuildTargetModal
              open={showTargetModal}
              isDark={isDark}
              onClose={() => setShowTargetModal(false)}
              onPick={handlePickTarget}
            />

            {/* Keyboard hint removed — was a fixed overlay that covered the
                tech-stack heading on first load. The dropdown + send arrow
                inside the textarea already make the affordance clear. */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
