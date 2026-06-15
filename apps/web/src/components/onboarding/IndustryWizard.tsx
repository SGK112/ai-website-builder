'use client'

// IndustryWizard — first-run wizard that asks industry + goal and fires a
// tailored generation prompt so the user sees a real result in seconds.
// Shown before SkillPicker when no project exists and onboarding not complete.

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, Building2, ChefHat, Hammer, Heart,
  Home, Sparkles, TrendingUp, X, Zap,
} from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'

const INDUSTRIES = [
  { id: 'construction', label: 'Construction / Trades', icon: Hammer, color: 'amber' },
  { id: 'real-estate', label: 'Real Estate', icon: Home, color: 'blue' },
  { id: 'restaurant', label: 'Restaurant / Food', icon: ChefHat, color: 'orange' },
  { id: 'health', label: 'Health & Wellness', icon: Heart, color: 'rose' },
  { id: 'professional', label: 'Professional Services', icon: Building2, color: 'slate' },
  { id: 'startup', label: 'SaaS / Startup', icon: Zap, color: 'violet' },
  { id: 'ecommerce', label: 'E-commerce / Retail', icon: TrendingUp, color: 'emerald' },
  { id: 'other', label: 'Something else', icon: Sparkles, color: 'fuchsia' },
] as const

type IndustryId = typeof INDUSTRIES[number]['id']

const SITE_TYPES: Record<IndustryId, Array<{ id: string; label: string; desc: string; prompt: string }>> = {
  construction: [
    { id: 'proposal', label: 'Project Proposal', desc: 'Share a bid with a client link + QR code', prompt: 'Build a professional contractor project proposal page for a home renovation company. Include: hero with company name and tagline, project scope section, detailed line-item pricing table, project timeline, photo gallery of past work, team credentials (licensed & insured), testimonials, and a bold "Accept Proposal" CTA button. Use a dark professional palette with gold accents.' },
    { id: 'portfolio', label: 'Portfolio Site', desc: 'Show off your best work and get leads', prompt: 'Build a premium contractor portfolio website. Include: bold hero with trust badges (Licensed, Insured, 5-star rated), before/after project gallery with filter tabs (Kitchen, Bathroom, Exterior, Full Remodel), stats section (500+ projects, 15 years experience, 98% satisfaction), video testimonials section, services grid with icons, service area map section, FAQ accordion, and a sticky "Get Free Quote" CTA.' },
    { id: 'landing', label: 'Lead Generation', desc: 'Capture calls and quote requests', prompt: 'Build a high-converting contractor lead generation landing page. Include: headline focused on the service area, phone number click-to-call in the hero, instant quote form (name, email, phone, project type, budget range), trust signals (BBB logo, Google 5 stars, licensed badge), 3 service cards, urgency element ("Book before [month] for 10% off"), and a floating click-to-call bar on mobile.' },
    { id: 'company', label: 'Company Website', desc: 'Full site with about, services, contact', prompt: 'Build a complete construction company website with: modern hero with auto-playing video background, about us story section with founder photo, full services page (GC, Roofing, Remodeling, Flooring), project portfolio grid, team profiles, certifications and accreditations, client logos, contact page with map embed and form, footer with service area cities.' },
  ],
  'real-estate': [
    { id: 'listing', label: 'Property Listing', desc: 'Showcase a home for sale or rent', prompt: 'Build a luxury property listing page. Include: full-width photo gallery with lightbox, property stats bar (beds/baths/sqft/price), interactive floor plan section, neighborhood highlights with walkability scores, school ratings, market insights (median price, days on market), agent bio and contact card, virtual tour CTA, and a sticky "Schedule a Showing" button.' },
    { id: 'agent', label: 'Agent Bio Page', desc: 'Personal brand page for listings and leads', prompt: 'Build a luxury real estate agent website. Include: professional hero with agent photo and production stats ($50M+ sold, 200+ transactions), neighborhoods served section, featured listings grid with MLS-style cards, buyer/seller resources section, testimonials from recent clients, market report CTA, press mentions, and a direct calendar booking widget.' },
    { id: 'proposal', label: 'Listing Presentation', desc: 'Pitch a seller on why to list with you', prompt: 'Build a real estate listing presentation site (to pitch a seller). Include: personalized hero ("Here\'s how I will sell your home at 123 Main St"), comparative market analysis section with data visualizations, marketing plan (Zillow, MLS, social, open house, video tour), agent production stats, pricing strategy section, timeline from listing to close, testimonials from similar sellers, and a "Sign the Listing Agreement" CTA.' },
    { id: 'community', label: 'Neighborhood Guide', desc: 'Hyper-local content for SEO + buyers', prompt: 'Build a real estate neighborhood guide for a specific community. Include: lifestyle hero, quick stats (avg price, school ratings, commute time), things to do section (restaurants, parks, shopping), school profiles, recent sales data table, market trend chart, "Homes Currently Available" CTA grid, and an agent contact form.' },
  ],
  restaurant: [
    { id: 'menu', label: 'Menu & Reservations', desc: 'Digital menu with booking link', prompt: 'Build a beautiful restaurant website. Include: hero with ambiance photo and "Reserve a Table" CTA, story section with chef photo, full menu with categories (Starters, Mains, Desserts, Drinks), specials/seasonal items, hours & location with map embed, photo gallery, catering/private events section, and reservation form.' },
    { id: 'landing', label: 'Grand Opening', desc: 'Launch announcement + email capture', prompt: 'Build a grand opening landing page for a new restaurant. Include: countdown timer to opening date, teaser gallery of food and space, email/SMS sign-up for opening-night reservations, press coverage section, chef introduction, menu preview cards, location + parking info, and social media CTAs.' },
    { id: 'catering', label: 'Catering Page', desc: 'B2B catering and event services', prompt: 'Build a restaurant catering and private events page. Include: hero for corporate and social events, package tiers (Breakfast, Lunch, Dinner + packages), sample menus with photos, minimum order and delivery area info, testimonials from event planners, photo gallery from past events, inquiry form with date/headcount/budget fields.' },
    { id: 'delivery', label: 'Online Ordering', desc: 'Drive orders with a landing page', prompt: 'Build a restaurant online ordering landing page. Include: large food photography hero, "Order Now" CTA linking to delivery app, menu highlights with prices, combo deals section, loyalty program teaser, delivery area map, app download buttons (iOS/Android), and customer reviews.' },
  ],
  health: [
    { id: 'practice', label: 'Practice / Clinic', desc: 'Patient-facing site with booking', prompt: 'Build a health and wellness practice website. Include: welcoming hero with doctor/practitioner photo, services grid (primary care, specialist, wellness), insurance accepted section, patient testimonials, staff profiles, HIPAA-compliant appointment request form, patient resources section, location and hours, telehealth option CTA.' },
    { id: 'spa', label: 'Med Spa / Aesthetic', desc: 'Luxury aesthetic services + bookings', prompt: 'Build a luxury med spa website. Include: stunning hero with lifestyle photography, services menu with before/after results (Botox, fillers, laser, facials), treatment detail pages, pricing packages, provider credentials and certifications, real results gallery with consent disclaimer, loyalty program, gift card section, and Vagaro/Mindbody booking widget integration.' },
    { id: 'coach', label: 'Health Coach', desc: 'Personal brand + program sales', prompt: 'Build a health coach personal brand website. Include: transformation-focused hero with coach photo, "My story" section, program overview (12-week program, 1:1 coaching, group program), client success stories with photos, free resource lead magnet, podcast/blog preview, speaking engagements, and a discovery call booking CTA.' },
    { id: 'landing', label: 'Lead Generation', desc: 'Capture consultation requests', prompt: 'Build a health services lead generation page. Include: problem-agitate-solve hero, social proof strip (5 stars, hundreds of patients), specific service highlight, consultation request form (name, contact, concern, preferred time), FAQ section, trust badges (board certified, HIPAA compliant), and a click-to-call button.' },
  ],
  professional: [
    { id: 'firm', label: 'Agency / Firm', desc: 'Credibility site with case studies', prompt: 'Build a professional services firm website. Include: authoritative hero with expertise statement, services grid with sub-services, featured case studies (problem→solution→result), client logo strip, team profiles with credentials, awards and accreditations, thought leadership articles preview, and a contact form with engagement type selector.' },
    { id: 'proposal', label: 'Service Proposal', desc: 'Win a client with a custom proposal link', prompt: 'Build a professional service proposal page to send to a prospective client. Include: personalized hero with client name and project title, executive summary of their challenge, your proposed solution, scope of work with phases and deliverables, investment summary table, team qualifications, timeline, FAQs, client references, and a prominent "Accept Proposal" button.' },
    { id: 'landing', label: 'Lead Generation', desc: 'Consultation and inquiry capture', prompt: 'Build a professional services lead generation page. Include: authority-building hero (certifications, years in practice, number of clients served), core services with outcomes (not features), social proof section with specific results, free consultation offer form, FAQ section, LinkedIn thought leadership preview, and contact information.' },
    { id: 'portfolio', label: 'Consultant Portfolio', desc: 'Personal brand for consulting leads', prompt: 'Build a consultant personal brand and portfolio site. Include: professional hero photo and expertise statement, industries served, selected engagement case studies with metrics, speaking and media section, publications list, testimonials from C-suite clients, contact form, and newsletter CTA.' },
  ],
  startup: [
    { id: 'saas', label: 'SaaS Landing Page', desc: 'Product launch with sign-up funnel', prompt: 'Build a high-converting SaaS landing page. Include: bold hero with product demo video/screenshot, social proof strip (logos + "Trusted by X companies"), 3 key benefit sections, interactive feature showcase with tabs, pricing tiers (Free / Pro / Enterprise) with feature comparison, customer testimonials with photos, FAQ, and a strong "Start free trial" CTA.' },
    { id: 'waitlist', label: 'Waitlist / Launch', desc: 'Pre-launch hype with email capture', prompt: 'Build a product waitlist/launch page. Include: teaser hero with animated product preview, problem statement section, "How it works" 3-step visual, early access benefits, email waitlist form with counter (X people already waiting), founder story section, press mentions placeholders, and social share buttons.' },
    { id: 'pitch', label: 'Investor Pitch', desc: 'Deck to web — share with VCs', prompt: 'Build a startup investor pitch page. Include: company tagline hero, problem size section with market data, solution and product demo, business model diagram, traction metrics (MRR, users, growth %), team section with LinkedIn links, competitive differentiation matrix, funding ask and use of funds, and a contact form for investor inquiries.' },
    { id: 'docs', label: 'Product Docs', desc: 'Documentation and developer hub', prompt: 'Build a developer documentation landing page. Include: hero with code snippet preview, quick start section, API overview, feature highlights, integration logos, changelog preview, community links (GitHub, Discord), and a "Get API key" CTA.' },
  ],
  ecommerce: [
    { id: 'store', label: 'Online Store', desc: 'Product-first landing with buy CTA', prompt: 'Build an e-commerce product landing page. Include: hero with lifestyle product photography, product highlights (3 key benefits), social proof count (X+ happy customers), product feature breakdown with icons, user-generated content photo grid, FAQ, money-back guarantee badge, and a prominent add-to-cart section with multiple options (size, color, quantity).' },
    { id: 'launch', label: 'Product Launch', desc: 'Hype page for a new product', prompt: 'Build a product launch hype page. Include: dramatic hero with countdown timer, product teaser gallery, early-bird pricing (strikethrough + limited time), press coverage logos, founder story, comparison table (old way vs new way), pre-order form with urgency copy, and social share with referral incentive.' },
    { id: 'brand', label: 'Brand Story', desc: 'DTC brand page with values + mission', prompt: 'Build a DTC brand story page. Include: cinematic hero video section, brand mission statement, founder origin story with photos, materials and sourcing transparency section, sustainability commitments, community impact numbers, behind-the-scenes gallery, featured press mentions, and a shop CTA.' },
    { id: 'landing', label: 'Product Landing', desc: 'Single product focused conversion page', prompt: 'Build a single-product conversion landing page. Include: problem-focused hero, before/after transformation photos, key features with icons, how it works steps, 5-star reviews with customer photos, comparison to competitors, FAQ, risk-reversal (30-day return, free shipping), and a sticky "Buy Now" bar on scroll.' },
  ],
  other: [
    { id: 'landing', label: 'Landing Page', desc: 'Single-page lead capture', prompt: 'Build a beautiful, modern landing page with: compelling hero section, 3 feature/benefit cards, social proof section, and a clear call-to-action. Use a professional color scheme with violet accents.' },
    { id: 'portfolio', label: 'Portfolio / About', desc: 'Personal or professional showcase', prompt: 'Build a creative personal portfolio website. Include: minimal hero with name and title, selected work grid with hover effects, about section with photo and bio, skills/tools section, testimonials, and contact form.' },
    { id: 'event', label: 'Event Page', desc: 'Conference, workshop, or community event', prompt: 'Build an event landing page. Include: countdown timer hero, speaker lineup grid with photos, schedule/agenda section, ticket tiers with pricing, venue information with map, FAQ, and registration form.' },
    { id: 'community', label: 'Community / Group', desc: 'Member-facing page or club site', prompt: 'Build a community group website. Include: mission statement hero, membership benefits section, events calendar preview, member spotlight section, resources/content area, join CTA form, and social links.' },
  ],
}

interface Props {
  isOpen: boolean
  onComplete: (prompt: string, industry: string) => void
  onSkip: () => void
}

const colorMap: Record<string, string> = {
  amber: 'from-amber-500 to-orange-500',
  blue: 'from-blue-500 to-cyan-500',
  orange: 'from-orange-500 to-red-500',
  rose: 'from-rose-500 to-pink-500',
  slate: 'from-slate-500 to-zinc-600',
  violet: 'from-violet-500 to-fuchsia-500',
  emerald: 'from-emerald-500 to-teal-500',
  fuchsia: 'from-fuchsia-500 to-purple-500',
}

export function IndustryWizard({ isOpen, onComplete, onSkip }: Props) {
  const [step, setStep] = useState<'industry' | 'site-type'>('industry')
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId | null>(null)
  const panelRef = useModalA11y<HTMLDivElement>(isOpen, onSkip)

  if (!isOpen) return null

  const industry = INDUSTRIES.find(i => i.id === selectedIndustry)
  const siteTypes = selectedIndustry ? SITE_TYPES[selectedIndustry] : []

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="industry-wizard-title"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {[1, 2].map(n => (
                  <div key={n} className={`h-1.5 w-12 rounded-full transition-colors ${
                    (step === 'industry' && n === 1) || (step === 'site-type' && n <= 2)
                      ? 'bg-violet-500'
                      : 'bg-white/10'
                  }`} />
                ))}
              </div>
              <div id="industry-wizard-title" className="text-white font-semibold">
                {step === 'industry' ? "What's your industry?" : `What are you building?`}
              </div>
              <div className="text-zinc-500 text-xs mt-0.5">
                {step === 'industry'
                  ? 'We\'ll tailor your first site to your field'
                  : `${industry?.label} · pick a starting point`}
              </div>
            </div>
            <button onClick={onSkip} aria-label="Skip wizard" className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {step === 'industry' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INDUSTRIES.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => { setSelectedIndustry(id); setStep('site-type') }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group text-center"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 'site-type' && selectedIndustry && (
              <div className="space-y-2">
                {siteTypes.map(({ id, label, desc, prompt }) => (
                  <button
                    key={id}
                    onClick={() => onComplete(prompt, selectedIndustry)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-500/30 transition-all group text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colorMap[industry!.color]} flex items-center justify-center shrink-0`}>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{label}</div>
                      <div className="text-xs text-zinc-500">{desc}</div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setStep('industry')}
                  className="w-full text-xs text-zinc-500 hover:text-zinc-300 mt-2 transition-colors"
                >
                  ← Back to industries
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/[0.06] flex justify-between items-center">
            <span className="text-[10px] text-zinc-600">Your first site will be ready in seconds</span>
            <button onClick={onSkip} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Skip — I'll type my own prompt
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
