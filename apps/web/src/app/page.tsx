'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
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
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { StarryNight, SunriseBackground } from '@/components/landing/BackgroundEffects'

const examplePrompts = [
  "A modern SaaS landing page for a project management tool",
  "An e-commerce store for handmade jewelry",
  "A portfolio website for a UX designer with animations",
  "A restaurant website with online ordering",
  "A fitness app landing page with pricing tiers",
]

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
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [prompt, setPrompt] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [projectTheme, setProjectTheme] = useState<'light' | 'dark'>('dark')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templateGallery[0] | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [showAllTemplates, setShowAllTemplates] = useState(false)

  const visibleTemplates = showAllTemplates ? templateGallery : templateGallery.slice(0, 8)

  // Track scroll for hint visibility
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % examplePrompts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Navigate to workspace with prompt as URL param
  const navigateToWorkspace = (projectPrompt: string) => {
    setIsTransitioning(true)
    const params = new URLSearchParams({
      prompt: projectPrompt,
      theme: projectTheme,
    })
    router.push(`/workspace?${params.toString()}`)
  }

  const handleSubmit = () => {
    if (!prompt.trim() || isTransitioning) return
    navigateToWorkspace(prompt.trim())
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="min-h-screen relative overflow-hidden"
        >
          {/* Animated Background */}
          {isDark ? <StarryNight /> : <SunriseBackground />}

          {/* Content overlay */}
          <div className="relative z-10">
            {/* Header */}
            <header className="p-6">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                    isDark
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30"
                      : "bg-gradient-to-br from-orange-400 to-pink-500 shadow-orange-400/30"
                  )}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className={cn(
                    "text-xl font-bold tracking-tight",
                    isDark ? "text-white" : "text-slate-800"
                  )}>
                    WebCraft
                  </span>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className={cn(
                    "p-3 rounded-xl backdrop-blur-sm transition-all duration-300",
                    isDark
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-white/50 hover:bg-white/70 text-slate-700 shadow-lg"
                  )}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.button>
              </div>
            </header>

            {/* Main Content */}
            <main className="min-h-[85vh] flex items-center justify-center px-6 pb-16">
              <div className="w-full max-w-2xl">
                {/* Hero */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-10"
                >
                  <h1 className={cn(
                    "text-5xl md:text-6xl font-bold mb-5 tracking-tight leading-tight",
                    isDark ? "text-white" : "text-slate-800"
                  )}>
                    What will you
                    <span className={cn(
                      "bg-clip-text text-transparent",
                      isDark
                        ? "bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400"
                        : "bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500"
                    )}> create</span>?
                  </h1>
                  <p className={cn(
                    "text-lg",
                    isDark ? "text-slate-400" : "text-slate-600"
                  )}>
                    Describe your vision. AI builds it in seconds.
                  </p>
                </motion.div>

                {/* Chat Input */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={cn(
                    "rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-300",
                    isDark
                      ? "bg-slate-900/80 border-white/10 shadow-black/50"
                      : "bg-white/80 border-white/50 shadow-orange-200/30",
                    prompt && (isDark ? "ring-2 ring-violet-500/50" : "ring-2 ring-orange-400/50")
                  )}
                >
                  <div className="p-5">
                    <textarea
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={examplePrompts[placeholderIndex]}
                      rows={3}
                      className={cn(
                        "w-full resize-none bg-transparent text-lg leading-relaxed focus:outline-none",
                        isDark
                          ? "text-white placeholder-slate-500"
                          : "text-slate-800 placeholder-slate-400"
                      )}
                    />
                  </div>

                  <div className={cn(
                    "flex items-center justify-between px-5 py-4 border-t",
                    isDark ? "border-white/10" : "border-slate-200/50"
                  )}>
                    <div className="flex items-center gap-3">
                      {/* Theme selector */}
                      <div className={cn(
                        "flex items-center p-1 rounded-xl",
                        isDark ? "bg-white/5" : "bg-slate-100"
                      )}>
                        <button
                          onClick={() => setProjectTheme('light')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            projectTheme === 'light'
                              ? isDark ? "bg-white/10 text-white" : "bg-white shadow-sm text-slate-800"
                              : isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          <Sun className="w-4 h-4" />
                          Light
                        </button>
                        <button
                          onClick={() => setProjectTheme('dark')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            projectTheme === 'dark'
                              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg"
                              : isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          <Moon className="w-4 h-4" />
                          Dark
                        </button>
                      </div>

                      <button className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        isDark
                          ? "text-slate-500 hover:text-white hover:bg-white/10"
                          : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      )}>
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isTransitioning}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                        prompt.trim()
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
                          : isDark
                            ? "bg-white/5 text-slate-600 cursor-not-allowed"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {isTransitioning ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Build
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Templates */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-6 flex flex-wrap justify-center gap-2"
                >
                  {quickTemplates.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => { setPrompt(t.prompt); inputRef.current?.focus() }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:scale-105",
                        isDark
                          ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                          : "bg-white/60 hover:bg-white/80 text-slate-700 border border-white/50 shadow-sm"
                      )}
                    >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  ))}
                </motion.div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-16 flex justify-center gap-10"
                >
                  {[
                    { icon: Zap, text: "AI-Powered" },
                    { icon: Code2, text: "Production Ready" },
                    { icon: Palette, text: "Fully Custom" },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        isDark ? "text-slate-500" : "text-slate-500"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.text}
                    </div>
                  ))}
                </motion.div>

              </div>
            </main>

            {/* Apple-Style Glassmorphic Template Showcase */}
            <div className="relative px-6 pb-32 -mt-24">
              {/* Decorative gradient orbs */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[128px] pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-6xl mx-auto relative"
              >
                {/* Section Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-violet-400 text-xs font-medium tracking-wide">TEMPLATES</span>
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className={cn(
                      "text-2xl font-bold",
                      isDark ? "text-white" : "text-zinc-900"
                    )}
                  >
                    Start with a proven design
                  </motion.h2>
                </div>

                {/* Glassmorphic Container */}
                <div className={cn(
                  "relative rounded-3xl overflow-hidden",
                  isDark
                    ? "bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08]"
                    : "bg-black/[0.02] backdrop-blur-2xl border border-black/[0.05]"
                )}>
                  {/* Top accent line */}
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

                  {/* Content */}
                  <div className="relative p-8">
                    {/* Template Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                      {visibleTemplates.map((template, index) => (
                        <motion.button
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + index * 0.08, duration: 0.6 }}
                          onClick={() => setSelectedTemplate(template)}
                          className={cn(
                            "group relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-500",
                            "hover:scale-[1.02] hover:-translate-y-1",
                            isDark
                              ? "bg-zinc-900/50 ring-1 ring-white/10 hover:ring-violet-500/40 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-violet-500/10"
                              : "bg-white/50 ring-1 ring-black/5 hover:ring-violet-500/30 shadow-lg shadow-black/5 hover:shadow-xl"
                          )}
                        >
                          {/* Screenshot */}
                          <img
                            src={template.image}
                            alt={template.name}
                            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                          />

                          {/* Permanent label at bottom */}
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                            <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-[10px] uppercase tracking-wider font-semibold text-white mb-2">
                              {template.category}
                            </span>
                            <p className="text-white font-bold text-base leading-tight drop-shadow-lg">
                              {template.name}
                            </p>
                          </div>

                          {/* Hover overlay with CTA */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                              <span>Preview</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Corner accent */}
                          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      ))}
                    </div>

                    {/* View All / Show Less Button */}
                    {templateGallery.length > 8 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex justify-center mt-6"
                      >
                        <button
                          onClick={() => setShowAllTemplates(!showAllTemplates)}
                          className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                            isDark
                              ? "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                              : "bg-black/5 hover:bg-black/10 text-zinc-700 border border-black/10"
                          )}
                        >
                          {showAllTemplates ? (
                            <>Show Less</>
                          ) : (
                            <>View All {templateGallery.length} Templates</>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
                </div>

                {/* Floating tech lines */}
                <div className="absolute -left-4 top-1/4 w-px h-32 bg-gradient-to-b from-transparent via-violet-500/30 to-transparent" />
                <div className="absolute -right-4 bottom-1/4 w-px h-32 bg-gradient-to-b from-transparent via-fuchsia-500/30 to-transparent" />
              </motion.div>
            </div>

            {/* Footer */}
            <footer className={cn(
              "py-12 px-6 text-center",
              isDark ? "text-zinc-600" : "text-zinc-500"
            )}>
              <p className="text-sm">
                Built with AI. Powered by imagination.
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

            {/* Keyboard hint - shows on prompt, hides on scroll, returns on scroll up */}
            <AnimatePresence>
              {scrollY < 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed bottom-6 inset-x-0 z-50 flex justify-center"
                >
                  <p className={cn(
                    "text-xs backdrop-blur-md px-4 py-2 rounded-full border",
                    isDark
                      ? "text-slate-400 bg-slate-900/80 border-white/10"
                      : "text-slate-500 bg-white/80 border-slate-200 shadow-lg"
                  )}>
                    Press <kbd className={cn(
                      "px-2 py-0.5 rounded text-xs font-mono mx-1",
                      isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                    )}>Enter</kbd> to build
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
