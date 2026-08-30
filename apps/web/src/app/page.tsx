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

const examplePromptsByTarget: Record<'website' | 'webapp' | 'mobile', string[]> = {
  website: [
    "A landing page for a cold-brew brand — hero, three-tier pricing, FAQ accordion, email capture",
    "A jewellery store with a product grid, quick-view modal, cart drawer and Stripe checkout",
    "A photographer's portfolio — full-bleed gallery, lightbox, filter by shoot type, contact form",
    "A taqueria site with a menu by section, order-ahead form, hours, and an embedded map",
  ],
  webapp: [
    "An analytics dashboard — KPI row, line chart, sortable table with column filters, CSV export",
    "A client CRM with a kanban pipeline, drag-to-stage, contact drawer and activity timeline",
    "An invoice builder — line items, live totals, tax rate, and a print-ready PDF view",
    "A support inbox with threaded conversations, canned replies, and status filters",
  ],
  mobile: [
    "A run tracker — start/stop timer, pace splits, weekly distance chart, saved routes",
    "A recipe app with search, favourites, a shopping list, and step timers that run while you cook",
    "A habit tracker — daily check-off grid, streaks, reminders, and a month heatmap",
    "A budget app with accounts, categorised spending, and a monthly burn-down",
  ],
}

// One click has to produce something worth looking at, so each of these names
// the sections it builds rather than gesturing at a category.
const quickTemplates = [
  { icon: Globe, label: "Landing page", prompt: "A landing page with a hero, logo strip, three feature cards, testimonial, FAQ accordion and a footer CTA" },
  { icon: Code2, label: "SaaS", prompt: "A SaaS site with a product hero, feature comparison, three pricing tiers with a monthly/annual toggle, and a signup form" },
  { icon: Palette, label: "Portfolio", prompt: "A portfolio with a filterable project grid, case-study pages, an about section and a contact form" },
  { icon: Rocket, label: "Storefront", prompt: "A storefront with a product grid, quick-view modal, cart drawer and a checkout page" },
]

// Template gallery with real website screenshots and rich metadata
const templateGallery = [
  {
    id: 'saas-modern',
    name: 'Modern SaaS',
    category: 'SaaS',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1545665277-5937489579f2?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1100&q=70&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=70&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=1100&q=70&auto=format&fit=crop',
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
  const inputRef = useRef<HTMLInputElement>(null)

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
  const [showAllTemplates, setShowAllTemplates] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rotatingWordIdx, setRotatingWordIdx] = useState(0)
  // Rotates through concrete OUTPUTS — what Webstew actually ships. Each
  // matches a card in the workspace's "What do you want to build?" picker
  // so the landing's promise lines up with the product's first step.
  // "store" not "online store" so "Build a ___" reads cleanly (no a/an
  // article problem) and landing page is dropped as a subset of website.
  const rotatingWords = ['website', 'online store', 'mobile app', 'new website', 'web app']
  const rotatingWord = rotatingWords[rotatingWordIdx]
  // Typewriter placeholder state
  const [typedText, setTypedText] = useState('')

  // Handle client-side mounting for animations
  useEffect(() => {
    setMounted(true)
  }, [])

  // Installed as a PWA (home-screen app) → this IS the app, so open the
  // workspace, not the marketing page. Belt-and-suspenders with the manifest
  // start_url: iOS often pins a home-screen shortcut to the URL it was ADDED
  // from ('/') rather than honoring start_url, so a stale shortcut lands here.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true // iOS Safari legacy flag
    if (standalone) router.replace('/workspace?source=pwa')
  }, [router])

  const visibleTemplates = showAllTemplates ? templateGallery : templateGallery.slice(0, 8)

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
            className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left bg-violet-500 pointer-events-none"
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

          {/* One quiet violet glow behind the headline — the single light
              source up top. (Replaced the rotating multi-hue cone + four aurora
              ribbons + twinkling dots + rising spice flecks; far too busy for
              the calm page. Knowledge over noise.) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-[-10rem] w-[58rem] max-w-[120vw] h-[42rem] rounded-full pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at center, rgba(124,58,237,0.20), rgba(124,58,237,0.06) 45%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(124,58,237,0.10), transparent 70%)',
              filter: 'blur(70px)',
            }}
            aria-hidden
          />

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
            {/* Minimal hero nav — the first surface stays clean and uncrowded:
                small solid wordmark + understated text links, no loud buttons or
                glow. Border-b mirrors the footer. Mobile keeps one clean row
                (logo + Start Building + theme); secondary links reveal at sm/md. */}
            <header className={cn(
              // pt clears the iPhone status bar when installed as a PWA
              // (standalone mode paints behind it); no-op on the web where the
              // safe-area inset is 0.
              "px-4 sm:px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b",
              isDark ? "border-white/5" : "border-slate-200"
            )}>
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 text-sm">
                {/* Logo — small pot + solid Webstew + tagline */}
                <a href="/" className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl sm:text-3xl leading-none select-none shrink-0">🍲</span>
                  <span className="inline-flex flex-col leading-none min-w-0">
                    <span
                      className={cn(
                        "tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-r",
                        isDark ? "from-white via-violet-200 to-fuchsia-200" : "from-orange-600 via-pink-600 to-purple-600"
                      )}
                      style={{
                        fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      Webstew
                    </span>
                  </span>
                </a>

                {/* Nav — understated text links */}
                <nav className="flex items-center gap-x-5 gap-y-2">
                  <a href="/community" className={cn("hidden md:block transition-colors", isDark ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-900")}>Community</a>
                  <button onClick={() => setShowTargetModal(true)} className={cn("hidden md:block transition-colors", isDark ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-900")}>App Builder</button>
                  <a href="/login" className={cn("hidden sm:block transition-colors", isDark ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-900")}>Sign in</a>
                  <a
                    href="/workspace"
                    className={cn("font-semibold transition-colors whitespace-nowrap", isDark ? "text-white hover:text-violet-200" : "text-slate-900 hover:text-violet-700")}
                  >
                    {sessionStatus === 'authenticated' ? 'Open Workspace →' : 'Start Cooking →'}
                  </a>
                  <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className={cn("p-1.5 rounded-md transition-colors shrink-0", isDark ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                    aria-label="Toggle theme"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </nav>
              </div>
            </header>

            {/* Main Content */}
            <main className="min-h-[60vh] flex items-center justify-center px-6 pb-4 pt-2">
              <div className="w-full max-w-2xl">
                {/* Hero — minimal Lovable shape: one-line headline, short
                    subtitle, slim single-line prompt bar. */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-7 relative"
                >
                  {/* Reimagined H1 — the assistant's voice (its workspace
                      greeting), with the input below as the answer. No rotating
                      word, no gimmick. */}
                  <h1 className="display-hero">
                    What should we cook up today?
                  </h1>
                  <p className="lede mt-5 max-w-xl mx-auto">
                    Real websites and apps — built from a sentence, ready to ship.
                  </p>
                </motion.div>

                {/* Slim single-line prompt — Lovable-style input bar. */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="max-w-xl mx-auto"
                >
                  <div className={cn(
                    'flex items-center gap-2 rounded-full border pl-5 pr-2 py-2 transition-all',
                    isDark
                      ? 'bg-white/[0.04] border-white/10 focus-within:border-violet-500/50 focus-within:bg-white/[0.06]'
                      : 'bg-white border-slate-200 shadow-sm focus-within:border-violet-400'
                  )}>
                    <input
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={typedText || 'Describe the site or app you want…'}
                      className={cn(
                        'flex-1 bg-transparent text-sm sm:text-base focus:outline-none min-w-0',
                        isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
                      )}
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isTransitioning}
                      aria-label="Build it"
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
                        prompt.trim()
                          ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 hover:scale-105'
                          : isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-500'
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
                  <h2 className="display-section">
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
                      <div className={cn(
                        "text-sm font-semibold tracking-widest mb-4",
                        isDark ? "text-violet-300/70" : "text-violet-500/80"
                      )}>
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
                    <h2 className="display-section mb-2">
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
                    { title: 'Personal portfolio', sub: 'Designer/dev work showcase', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=70&auto=format&fit=crop', libId: 'agency-portfolio' },
                    { title: 'SaaS dashboard',     sub: 'Analytics, KPIs, charts',    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=70&auto=format&fit=crop', libId: 'saas-landing' },
                    { title: 'Restaurant site',    sub: 'Menu, hours, reservations',  img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=70&auto=format&fit=crop', libId: 'restaurant-menu' },
                    { title: 'Fitness mobile app', sub: 'Workouts, stats, streaks',   img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=70&auto=format&fit=crop', libId: null },
                    { title: 'E-commerce store',   sub: 'Product grid, cart, checkout', img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=70&auto=format&fit=crop', libId: 'luxe-ecommerce' },
                    { title: 'Markdown blog',      sub: 'Posts, tags, search, RSS',   img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=70&auto=format&fit=crop', libId: null },
                    { title: 'Photography portfolio', sub: 'Masonry gallery, lightbox', img: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=70&auto=format&fit=crop', libId: 'agency-portfolio' },
                    { title: 'Documentation site', sub: 'Sidebar, search, code blocks', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=70&auto=format&fit=crop', libId: null },
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
                <h2 className="display-section text-center mb-4">
                  The ingredients to{' '}
                  <span className={isDark ? "text-violet-300" : "text-violet-600"}>greatness.</span>
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
                <h2 className="display-section mb-7">
                  Start cooking.
                </h2>

                {/* Slim single-line input — same shape as the hero. */}
                <div className={cn(
                  'flex items-center gap-2 rounded-full border pl-5 pr-2 py-2 transition-all',
                  isDark
                    ? 'bg-white/[0.04] border-white/10 focus-within:border-violet-500/50 focus-within:bg-white/[0.06]'
                    : 'bg-white border-slate-200 shadow-sm focus-within:border-violet-400'
                )}>
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={typedText || 'Describe the site or app you want…'}
                    className={cn(
                      'flex-1 bg-transparent text-sm sm:text-base focus:outline-none min-w-0',
                      isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
                    )}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || isTransitioning}
                    aria-label="Build it"
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
                      prompt.trim()
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-lg shadow-emerald-500/30 hover:scale-105'
                        : isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-500'
                    )}
                  >
                    {isTransitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                  </button>
                </div>

                <p className={cn(
                  "text-xs mt-4",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  Free to start · No credit card · Your first build is on us
                </p>
              </div>
            </motion.section>

            {/* Footer */}
            <footer className={cn(
              "py-10 px-6 border-t",
              isDark ? "border-white/5 text-slate-400" : "border-slate-200 text-slate-500"
            )}>
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍲</span>
                  <span className="inline-flex flex-col items-center leading-none">
                    <span
                      className={cn(
                        "bg-clip-text text-transparent bg-gradient-to-r",
                        isDark ? "from-white via-violet-200 to-fuchsia-200" : "from-orange-600 via-pink-600 to-purple-600"
                      )}
                      style={{
                        fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      Webstew
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-x-5 gap-y-2 flex-wrap justify-center sm:justify-end">
                  <a href="/grader" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Site Grader</a>
                  <button onClick={() => setShowTargetModal(true)} className={cn("transition-colors text-left", isDark ? "hover:text-white" : "hover:text-slate-900")}>App Builder</button>
                  <a href="/compare/wix" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>vs Wix</a>
                  <a href="/compare/webflow" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>vs Webflow</a>
                  <a href="/compare/framer" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>vs Framer</a>
                  <a href="/for/restaurants" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>For Restaurants</a>
                  <a href="/for/photographers" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>For Photographers</a>
                  <a href="/for/small-business" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>For Small Business</a>
                  <a href="/community" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Community</a>
                  <a href="/community?tab=feedback" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Feedback</a>
                  <a href="/upgrade" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Pricing</a>
                  <a href="mailto:support@webstew.net" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-slate-900")}>Support</a>
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
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                Webstew AI is operated by Remodely LLC.
              </p>
            </footer>


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
