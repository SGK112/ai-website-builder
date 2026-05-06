'use client'

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal,
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Code2,
  Eye,
  Layers,
  Download,
  RefreshCw,
  Undo2,
  Redo2,
  Copy,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Key,
  Plug,
  Zap,
  Github,
  Globe,
  Palette,
  Layout,
  Type,
  Box,
  MousePointer,
  FileCode,
  Braces,
  Package,
  GitBranch,
  Play,
  Bug,
  Lightbulb,
  User,
  Users,
  ShoppingCart,
  Star,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Settings,
  Sparkles,
  Image as ImageIcon,
  PanelLeftClose,
  PanelLeft,
  Home,
  Send,
  Wand2,
  Save,
  Trash2,
  FolderOpen,
  Plus,
  FileText,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Variable,
  Lock,
  Unlock,
  RotateCcw,
  MessageSquare,
  Cpu,
  Workflow,
  PenTool,
  Hammer,
  Rocket,
  Cloud,
  Crosshair,
  Target,
  Move,
  Scissors,
  Film,
  Eraser,
  ImagePlus,
  Wand,
  Crop,
  RotateCw,
  FlipHorizontal2,
  Contrast,
  CloudSun,
  MapPin,
  CreditCard,
  Coins,
  Store,
  Building2,
  BarChart3,
  Share2,
  Link2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Bot,
  Brain,
  Search,
  Sun,
  Moon,
  Paintbrush,
  Pencil,
  MousePointer2,
  Hand,
  Square,
  Circle,
  Triangle,
  ArrowUp,
  ArrowDown,
  Trash,
  MoreHorizontal,
  GripVertical,
  ChevronUp,
  LogIn,
  UserPlus,
  KeyRound,
  ChefHat,
  Maximize2,
  Upload,
  Database,
  Phone,
  Shield,
  Mail,
  Command,
  Hash,
  Maximize,
  FileDown,
  Edit3,
  Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { useSession } from 'next-auth/react'
import { useProject as useProjectHook } from '@/hooks/useProject'
import { StarryNight, SunriseBackground } from '@/components/landing/BackgroundEffects'
import { WebStewPanel, StewIngredient } from '@/components/WebStew'
import { OnboardingTour } from '@/components/onboarding'
import { MonacoCodeEditor } from '@/components/editor'
import { StylePresetPicker, ComponentPicker, ThemeBuilder } from '@/components/builder'
import { stylePresets, StylePreset, generatePresetStyles, applyThemeToHtml, generateAllThemesStyles } from '@/lib/builder/style-presets'
import { componentLibrary, ComponentSection, assemblePage } from '@/lib/builder/component-library'
import { imageService, getUnsplashImage, enhanceImagesInHtml } from '@/lib/builder/image-service'
import { ChefLoader } from '@/components/loading'
import { LUXE_ECOMMERCE_TEMPLATE, applyTemplateVariables } from '@/lib/templates'
// AgentPanel removed for simplicity - agent code preserved in /lib/agent if needed later
import { ExportPanel } from '@/components/builder/ExportPanel'

type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type ViewMode = 'preview' | 'code' | 'split'
type Panel = 'build' | 'projects' | 'integrations' | 'images' | 'video' | 'env' | 'console' | 'deploy' | 'webstew' | 'templates'
type SkillLevel = 'no-code' | 'low-code' | 'full-stack'
type BuildPhase = 'idle' | 'structure' | 'styling' | 'interactivity' | 'complete'
type ConsoleLogType = 'log' | 'info' | 'warn' | 'error' | 'success'

interface SelectedElement {
  tagName: string
  outerHTML: string
  textContent?: string
}

interface ImageEdit {
  id: string
  url: string
  name: string
  operation: 'remove-bg' | 'to-video' | 'enhance' | null
  status: 'idle' | 'processing' | 'complete' | 'error'
  result?: string
}

interface BusinessIntegration {
  id: string
  name: string
  description: string
  icon: typeof Globe
  category: 'maps' | 'payments' | 'ecommerce' | 'analytics' | 'database' | 'media' | 'communication' | 'automation' | 'ai' | 'scheduling' | 'auth'
  enabled: boolean
  envKeys: { key: string; label: string; placeholder: string; isSecret: boolean }[]
  codeSnippet: string
}

// AI Model Configuration
type AIProvider = 'anthropic' | 'openai' | 'google' | 'huggingface' | 'together' | 'cloudflare'

interface AIModel {
  id: string
  name: string
  provider: AIProvider
  description: string
  contextWindow: string
  speed: 'fast' | 'medium' | 'slow'
  quality: 'good' | 'great' | 'best'
  free?: boolean // Flag for free tier models
}

const aiModels: AIModel[] = [
  // FREE TIER MODELS (Free API tokens available - no credit card)
  // Hugging Face - Requires free HF token
  { id: 'hf-llama-3.2-3b', name: 'Llama 3.2 3B', provider: 'huggingface', description: 'FREE - Get token at huggingface.co', contextWindow: '8K', speed: 'fast', quality: 'good', free: true },
  { id: 'hf-mistral-7b', name: 'Mistral 7B', provider: 'huggingface', description: 'FREE - Get token at huggingface.co', contextWindow: '8K', speed: 'medium', quality: 'great', free: true },
  { id: 'hf-deepseek-r1', name: 'DeepSeek R1', provider: 'huggingface', description: 'FREE - Advanced reasoning', contextWindow: '32K', speed: 'medium', quality: 'best', free: true },
  { id: 'hf-qwen-2.5', name: 'Qwen 2.5 7B', provider: 'huggingface', description: 'FREE - Alibaba model', contextWindow: '8K', speed: 'medium', quality: 'great', free: true },
  // Together AI - Free trial credits
  { id: 'together-llama-3.2-3b', name: 'Llama 3.2 3B Turbo', provider: 'together', description: 'FREE trial - Fast inference', contextWindow: '8K', speed: 'fast', quality: 'good', free: true },
  { id: 'together-llama-3.1-8b', name: 'Llama 3.1 8B Turbo', provider: 'together', description: 'FREE trial - Great quality', contextWindow: '128K', speed: 'fast', quality: 'great', free: true },
  // Cloudflare Workers AI - 10K neurons/day free
  { id: 'cf-llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'cloudflare', description: 'FREE 10K/day - Edge inference', contextWindow: '8K', speed: 'fast', quality: 'great', free: true },
  { id: 'cf-mistral-7b', name: 'Mistral 7B', provider: 'cloudflare', description: 'FREE 10K/day - Fast edge', contextWindow: '8K', speed: 'fast', quality: 'good', free: true },

  // PAID MODELS
  // Anthropic Claude
  { id: 'claude-opus-4', name: 'Claude Opus 4', provider: 'anthropic', description: 'Most capable, best for complex tasks', contextWindow: '200K', speed: 'medium', quality: 'best' },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'anthropic', description: 'Balanced speed and quality', contextWindow: '200K', speed: 'fast', quality: 'great' },
  { id: 'claude-haiku-3.5', name: 'Claude Haiku 3.5', provider: 'anthropic', description: 'Fastest responses', contextWindow: '200K', speed: 'fast', quality: 'good' },
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Latest GPT-4 Omni model', contextWindow: '128K', speed: 'fast', quality: 'best' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'High capability with vision', contextWindow: '128K', speed: 'medium', quality: 'great' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', description: 'Original GPT-4', contextWindow: '8K', speed: 'slow', quality: 'great' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast and affordable', contextWindow: '16K', speed: 'fast', quality: 'good' },
  { id: 'o1-preview', name: 'o1-preview', provider: 'openai', description: 'Advanced reasoning model', contextWindow: '128K', speed: 'slow', quality: 'best' },
  { id: 'o1-mini', name: 'o1-mini', provider: 'openai', description: 'Fast reasoning model', contextWindow: '128K', speed: 'medium', quality: 'great' },
  // Google Gemini
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Latest fast model', contextWindow: '1M', speed: 'fast', quality: 'great' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'Most capable Gemini', contextWindow: '2M', speed: 'medium', quality: 'best' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', description: 'Fast multimodal', contextWindow: '1M', speed: 'fast', quality: 'good' },
]

// Stock Image Sources
interface StockImage {
  id: string
  url: string
  thumb: string
  alt: string
  category: string
  source: 'unsplash' | 'pexels' | 'pixabay'
}

const stockImageCategories = [
  'business', 'technology', 'nature', 'food', 'travel', 'people',
  'architecture', 'fashion', 'health', 'sports', 'abstract', 'animals'
]

interface Project {
  id: string
  name: string
  html: string
  envVars: EnvVar[]
  skillLevel: SkillLevel
  createdAt: Date
  updatedAt: Date
}

interface HistoryEntry {
  html: string
  prompt: string
  timestamp: Date
}

interface BuildStep {
  phase: BuildPhase
  label: string
  icon: typeof Code2
  status: 'pending' | 'active' | 'complete'
}

interface TerminalLine {
  type: 'command' | 'output' | 'success' | 'error' | 'info' | 'phase' | 'ai' | 'system'
  content: string
  timestamp?: Date
}

interface ConsoleLog {
  type: ConsoleLogType
  message: string
  timestamp: Date
  source?: string
}

interface EnvVar {
  key: string
  value: string
  isSecret: boolean
}

interface WorkspaceSettings {
  openaiKey: string
  githubToken: string
  renderKey: string
}

// Prompt suggestions by skill level
// Quick Start Templates - Premium industry templates with detailed prompts
const quickStartTemplates = [
  {
    id: 'luxe-ecommerce',
    icon: ShoppingCart,
    label: 'Luxe Boutique',
    gradient: 'from-amber-600 to-rose-600',
    prompt: 'Apple-inspired luxury e-commerce template',
    htmlTemplate: LUXE_ECOMMERCE_TEMPLATE.html, // Pre-made template - no AI generation needed
    isPremade: true,
  },
  {
    id: 'saas',
    icon: Rocket,
    label: 'SaaS Platform',
    gradient: 'from-indigo-600 to-purple-600',
    prompt: `Create a premium SaaS landing page for a developer productivity tool called "DevFlow". Include:
- Fixed glassmorphic navigation with logo, Features, Pricing, About, Blog links and "Start Free Trial" CTA
- Hero section with gradient text headline "Ship Code 10x Faster", animated dot grid background, announcement badge, two CTAs
- Logo cloud with company names: Stripe, Vercel, Linear, Notion, Figma
- Features grid with 6 features: Lightning Fast, Enterprise Security, Easy Integration, AI-Powered, Team Collaboration, 99.9% Uptime
- Alternating feature showcase with large screenshots
- Stats section: 50K+ developers, 99.9% uptime, 2M+ deployments, 4.9 rating
- 3 testimonial cards with avatars and star ratings
- 3-tier pricing: Starter $0, Pro $29/mo, Enterprise custom
- FAQ accordion with 5 questions
- CTA section with gradient background
- Footer with 4 columns: Product, Company, Resources, Legal`
  },
  {
    id: 'agency',
    icon: Building2,
    label: 'Digital Agency',
    gradient: 'from-fuchsia-600 to-pink-600',
    prompt: `Create a stunning digital agency website for "Apex Creative Studio". Include:
- Minimal navigation with logo and hamburger menu, "Let's Talk" button
- Hero with massive headline "We Build Digital Experiences", video background placeholder, scroll indicator
- Services section: Brand Strategy, Web Design, Development, Digital Marketing with hover animations
- Portfolio grid with 6 case study cards showing project images and categories
- About section with team photos and agency story
- Process section: Discovery, Design, Develop, Launch with numbered steps
- Client logos marquee animation
- Testimonials carousel
- Contact form with name, email, project type dropdown, message
- Footer with social links and newsletter signup`
  },
  {
    id: 'ecommerce',
    icon: ShoppingCart,
    label: 'E-Commerce',
    gradient: 'from-emerald-600 to-teal-600',
    prompt: `Create a luxury e-commerce storefront for "LUXE" premium fashion brand. Include:
- Sticky header with logo, search bar, navigation (New, Women, Men, Sale), cart icon with count
- Hero with full-width lifestyle image, "Summer Collection 2024" overlay text
- Category cards: Clothing, Accessories, Shoes, Bags with hover zoom
- Featured products grid: 8 products with images, names, prices, "Add to Cart" buttons
- Sale banner with countdown timer
- Newsletter section with email signup and 15% off offer
- Instagram feed section with product images
- Trust badges: Free Shipping, Easy Returns, Secure Checkout
- Footer with shop categories, customer service, about, and social links`
  },
  {
    id: 'restaurant',
    icon: Store,
    label: 'Restaurant',
    gradient: 'from-amber-600 to-orange-600',
    prompt: `Create an elegant fine dining restaurant website for "Ember & Oak". Include:
- Minimal navigation with logo, Menu, Reservations, Gallery, Contact
- Hero with stunning food photography, restaurant name, "Reserve a Table" CTA
- About section with chef's story and philosophy
- Menu preview with 3 sections: Starters, Mains, Desserts - show 3 items each with prices
- Photo gallery grid with restaurant and food images
- Reservation widget with date picker, time slots, party size
- Location section with embedded map placeholder and hours
- Private events section for catering
- Reviews from critics and guests
- Footer with address, phone, email, social links`
  },
  {
    id: 'portfolio',
    icon: Users,
    label: 'Portfolio',
    gradient: 'from-violet-600 to-indigo-600',
    prompt: `Create a creative portfolio for "Alex Chen" - Senior Product Designer. Include:
- Minimal navigation with name/logo and Resume button
- Hero with large photo, name, title "Product Designer at Spotify", brief intro, social links
- Selected work section with 4 case studies: project images, titles, descriptions, "View Case Study" links
- Skills section with design tools: Figma, Sketch, Protopie, Framer with proficiency levels
- Experience timeline: 3 positions with company logos, roles, dates
- Testimonials from colleagues and clients
- Writing/Blog section with 3 article previews
- Contact section with email and social links
- Minimal footer with copyright`
  },
  {
    id: 'startup',
    icon: TrendingUp,
    label: 'AI Startup',
    gradient: 'from-cyan-600 to-blue-600',
    prompt: `Create a cutting-edge AI startup landing page for "NeuralAI" - an AI automation platform. Include:
- Futuristic navigation with animated logo, Products, Solutions, Pricing, Docs, "Get API Key" CTA
- Hero with animated gradient mesh background, "AI That Understands Context", interactive demo preview
- Trusted by section with tech company logos
- Product features: Natural Language Processing, Computer Vision, Predictive Analytics, Custom Models
- Interactive demo section with code snippet preview
- Use cases: Customer Support, Data Analysis, Content Generation, Automation
- Pricing: API calls based - Free tier, Growth $49/mo, Scale $199/mo, Enterprise
- Developer resources: Documentation, SDKs, API Reference, Tutorials
- Security & compliance badges: SOC2, GDPR, HIPAA
- Footer with extensive links for developers`
  },
]

const promptSuggestions = {
  'no-code': {
    label: 'Visual Builder',
    description: 'Describe what you want, AI builds it',
    icon: PenTool,
    suggestions: [
      { icon: Palette, label: 'Modern landing page', prompt: 'Create a beautiful modern landing page for a SaaS startup with glassmorphic navigation, gradient hero section with announcement badge, logo cloud, 6 feature cards with icons, stats section, testimonials with avatars, 3-tier pricing, FAQ accordion, CTA section, and multi-column footer' },
      { icon: ShoppingCart, label: 'E-commerce store', prompt: 'Build an elegant online store homepage with sticky header, search bar, cart icon, hero with lifestyle image, category cards with hover effects, product grid with Add to Cart buttons, sale banner, newsletter signup, trust badges, and footer with shop categories' },
      { icon: Users, label: 'Portfolio site', prompt: 'Design a creative portfolio website with minimal navigation, hero with photo and social links, selected work case studies, skills section with proficiency bars, experience timeline, testimonials, writing/blog preview, and contact section' },
      { icon: Layout, label: 'Restaurant menu', prompt: 'Create a stylish restaurant website with elegant navigation, hero with food photography, chef story section, menu with starters/mains/desserts and prices, photo gallery, reservation form, location with map, and footer with hours and contact' },
      { icon: Star, label: 'Event page', prompt: 'Build an exciting event landing page with fixed navigation, hero with countdown timer, speaker profiles with photos, schedule timeline, ticket tiers with pricing, venue information with map, sponsor logos, FAQ section, and registration CTA' },
      { icon: FileText, label: 'Blog layout', prompt: 'Design a clean minimalist blog with navigation, featured post hero, recent posts grid with thumbnails, categories sidebar, author bio section, newsletter signup form, popular posts, and footer with social links' },
    ]
  },
  'low-code': {
    label: 'Hybrid Builder',
    description: 'Visual + code tweaks',
    icon: Workflow,
    suggestions: [
      { icon: MousePointer, label: 'Admin dashboard', prompt: 'Build an admin dashboard with collapsible sidebar navigation, top header with search and notifications, stats cards with charts, data table with sorting and pagination, activity feed, and dark/light mode toggle' },
      { icon: Box, label: 'Multi-step form', prompt: 'Create a multi-step checkout form with progress indicator, personal info step, shipping address step, payment details step, order review step, form validation, and success animation on completion' },
      { icon: TrendingUp, label: 'Analytics page', prompt: 'Design an analytics dashboard with date range picker, KPI cards showing key metrics, line chart for trends, bar chart for comparisons, pie chart for distribution, data table with filters, and export buttons' },
      { icon: Zap, label: 'Notification center', prompt: 'Build a notification center UI with tabs for All/Unread/Mentions, notification cards with avatars and timestamps, mark as read functionality, filter dropdown, empty state, and real-time badge counter' },
      { icon: MessageSquare, label: 'Chat interface', prompt: 'Create a modern chat application UI with sidebar contact list, active chat window, message bubbles with timestamps, typing indicator, emoji picker button, file attachment, and online status indicators' },
      { icon: Lightbulb, label: 'Settings page', prompt: 'Build a settings page with sidebar navigation, profile section with avatar upload, account settings form, notification preferences with toggles, theme switcher, privacy settings, and danger zone for account deletion' },
    ]
  },
  'full-stack': {
    label: 'Developer Mode',
    description: 'Full control + debugging',
    icon: Hammer,
    suggestions: [
      { icon: Braces, label: 'React components', prompt: 'Convert to React with TypeScript: create reusable Button, Card, Modal, Input, and Avatar components with proper props, variants (primary/secondary/ghost), sizes, and hover states' },
      { icon: Terminal, label: 'API integration', prompt: 'Add REST API integration: create a data fetching service with fetch, implement loading/error/success states, add retry logic, create custom hooks for data fetching, and display results in a styled table' },
      { icon: Package, label: 'Full-stack app', prompt: 'Create a full-stack Next.js app structure with: app router layout, API routes for CRUD operations, database schema types, authentication context, protected routes, and a sample data model' },
      { icon: GitBranch, label: 'Component library', prompt: 'Build a component library: create Button, Input, Select, Checkbox, Radio, Toggle, Card, Modal, Toast, and Avatar components with consistent styling, proper TypeScript types, and usage examples' },
      { icon: Bug, label: 'Testing setup', prompt: 'Add testing: create unit tests for utility functions, component tests with React Testing Library, mock API handlers, test fixtures, and a sample test file for the main component' },
      { icon: Rocket, label: 'Production ready', prompt: 'Optimize for production: add meta tags for SEO, Open Graph tags, structured data, lazy loading for images, code splitting hints, accessibility improvements (ARIA labels, focus states), and performance optimizations' },
    ]
  },
}

const buildSteps: BuildStep[] = [
  { phase: 'structure', label: 'HTML', icon: Code2, status: 'pending' },
  { phase: 'styling', label: 'CSS', icon: Palette, status: 'pending' },
  { phase: 'interactivity', label: 'JS', icon: Zap, status: 'pending' },
  { phase: 'complete', label: 'Done', icon: CheckCircle2, status: 'pending' },
]

// Fun quips that rotate during generation
const buildingQuips = [
  "Teaching pixels to dance...",
  "Convincing divs to align...",
  "Sprinkling CSS magic dust...",
  "Asking AI nicely for good code...",
  "Negotiating with the browser gods...",
  "Converting caffeine to markup...",
  "Summoning the flexbox spirits...",
  "Making buttons actually do stuff...",
  "Herding semicolons into place...",
  "Whispering to the DOM tree...",
  "Consulting the ancient Tailwind scrolls...",
  "Bribing the z-index council...",
  "Teaching gradients to be pretty...",
  "Wrangling responsive breakpoints...",
  "Politely asking margins to behave...",
  "Manifesting hover states...",
  "Debugging with positive vibes...",
  "Crafting artisanal HTML...",
  "Free-range organic JavaScript...",
  "Cloud-computing the vibes...",
  "Uploading creativity to the cloud...",
  "Downloading inspiration...",
  "Compiling dreams into reality...",
  "Making the internet a bit prettier...",
  "One div at a time...",
  "AI go brrrrrr...",
  "This is the way.",
  "Trust the process...",
  "Cooking up something special...",
  "Almost there, probably...",
  "The cloud is thinking hard...",
  "Pixels assemble!",
  "sudo make website...",
  "Have you tried turning it off and on?",
  "Works on my machine...",
  "It's not a bug, it's a feature!",
  "Burning the midnight oil...",
  "Rise and grind, AI style...",
  "24/7 hustle mode activated...",
  "While you sleep, we build...",
  "No rest for the wicked code...",
  "Working through the night...",
  "Dawn breaks, code ships...",
  "Moonlit coding sessions...",
  "Racing against the sunset...",
  "Sunrise delivery incoming...",
  "Brewing some late-night magic...",
  "The night shift is on duty...",
]

// Business integrations configuration
const defaultIntegrations: BusinessIntegration[] = [
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Embed interactive maps with your business location',
    icon: MapPin,
    category: 'maps',
    enabled: false,
    envKeys: [
      { key: 'GOOGLE_MAPS_API_KEY', label: 'Maps API Key', placeholder: 'AIza...', isSecret: true },
    ],
    codeSnippet: `<div id="map" style="width:100%;height:400px;"></div>
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap" async defer></script>
<script>
function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: YOUR_LAT, lng: YOUR_LNG },
    zoom: 15
  });
  new google.maps.Marker({ position: { lat: YOUR_LAT, lng: YOUR_LNG }, map });
}
</script>`,
  },
  {
    id: 'google-business',
    name: 'Google My Business',
    description: 'Display reviews, hours, and business info',
    icon: Building2,
    category: 'maps',
    enabled: false,
    envKeys: [
      { key: 'GOOGLE_BUSINESS_ID', label: 'Place ID', placeholder: 'ChIJ...', isSecret: false },
      { key: 'GOOGLE_PLACES_API_KEY', label: 'Places API Key', placeholder: 'AIza...', isSecret: true },
    ],
    codeSnippet: `<!-- Google Business Profile Widget -->
<div class="business-info" id="gmb-widget">
  <div class="business-hours"></div>
  <div class="business-reviews"></div>
</div>`,
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    description: 'Accept credit cards and online payments',
    icon: CreditCard,
    category: 'payments',
    enabled: false,
    envKeys: [
      { key: 'STRIPE_PUBLISHABLE_KEY', label: 'Publishable Key', placeholder: 'pk_live_...', isSecret: false },
      { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', placeholder: 'sk_live_...', isSecret: true },
    ],
    codeSnippet: `<script src="https://js.stripe.com/v3/"></script>
<button id="checkout-button" class="btn-primary">Buy Now - $99</button>
<script>
const stripe = Stripe('YOUR_PUBLISHABLE_KEY');
document.getElementById('checkout-button').addEventListener('click', async () => {
  // Redirect to Stripe Checkout
  const response = await fetch('/api/create-checkout-session', { method: 'POST' });
  const session = await response.json();
  await stripe.redirectToCheckout({ sessionId: session.id });
});
</script>`,
  },
  {
    id: 'shopify',
    name: 'Shopify Buy Button',
    description: 'Embed products from your Shopify store',
    icon: Store,
    category: 'ecommerce',
    enabled: false,
    envKeys: [
      { key: 'SHOPIFY_STORE_DOMAIN', label: 'Store Domain', placeholder: 'your-store.myshopify.com', isSecret: false },
      { key: 'SHOPIFY_STOREFRONT_TOKEN', label: 'Storefront Token', placeholder: 'shpat_...', isSecret: true },
    ],
    codeSnippet: `<div id="product-component"></div>
<script type="text/javascript">
(function () {
  var scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) { ShopifyBuyInit(); }
  } else {
    loadScript();
  }
  function loadScript() {
    var script = document.createElement('script');
    script.async = true;
    script.src = scriptURL;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
    script.onload = ShopifyBuyInit;
  }
  function ShopifyBuyInit() {
    var client = ShopifyBuy.buildClient({
      domain: 'YOUR_STORE.myshopify.com',
      storefrontAccessToken: 'YOUR_TOKEN',
    });
    ShopifyBuy.UI.onReady(client).then(function (ui) {
      ui.createComponent('product', {
        id: 'YOUR_PRODUCT_ID',
        node: document.getElementById('product-component'),
      });
    });
  }
})();
</script>`,
  },
  {
    id: 'ebay',
    name: 'eBay Listings',
    description: 'Display your eBay products and listings',
    icon: Store,
    category: 'ecommerce',
    enabled: false,
    envKeys: [
      { key: 'EBAY_APP_ID', label: 'App ID (Client ID)', placeholder: 'Your-App-ID', isSecret: false },
      { key: 'EBAY_DEV_ID', label: 'Dev ID', placeholder: 'Your-Dev-ID', isSecret: true },
      { key: 'EBAY_CERT_ID', label: 'Cert ID', placeholder: 'Your-Cert-ID', isSecret: true },
    ],
    codeSnippet: `<!-- eBay Listings Widget -->
<div id="ebay-listings" class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <!-- Products will be loaded dynamically -->
</div>
<script>
// Fetch and display eBay listings via your backend API
fetch('/api/ebay/listings')
  .then(res => res.json())
  .then(items => {
    const container = document.getElementById('ebay-listings');
    items.forEach(item => {
      container.innerHTML += \`
        <div class="product-card">
          <img src="\${item.image}" alt="\${item.title}">
          <h3>\${item.title}</h3>
          <p>\${item.price}</p>
          <a href="\${item.url}" target="_blank">View on eBay</a>
        </div>
      \`;
    });
  });
</script>`,
  },
  {
    id: 'square',
    name: 'Square Payments',
    description: 'Accept payments with Square',
    icon: CreditCard,
    category: 'payments',
    enabled: false,
    envKeys: [
      { key: 'SQUARE_APPLICATION_ID', label: 'Application ID', placeholder: 'sandbox-sq0...', isSecret: false },
      { key: 'SQUARE_ACCESS_TOKEN', label: 'Access Token', placeholder: 'EAAAl...', isSecret: true },
    ],
    codeSnippet: `<script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
<div id="card-container"></div>
<button id="card-button" type="button">Pay $1.00</button>`,
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track website visitors and behavior',
    icon: BarChart3,
    category: 'analytics',
    enabled: false,
    envKeys: [
      { key: 'GA_MEASUREMENT_ID', label: 'Measurement ID', placeholder: 'G-XXXXXXX', isSecret: false },
    ],
    codeSnippet: `<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_GA_ID');
</script>`,
  },
  {
    id: 'facebook-pixel',
    name: 'Facebook Pixel',
    description: 'Track conversions from Facebook ads',
    icon: Share2,
    category: 'analytics',
    enabled: false,
    envKeys: [
      { key: 'FB_PIXEL_ID', label: 'Pixel ID', placeholder: '123456789...', isSecret: false },
    ],
    codeSnippet: `<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>`,
  },
  // Database & Storage
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    description: 'NoSQL database for flexible data storage',
    icon: Building2,
    category: 'database' as const,
    enabled: false,
    envKeys: [
      { key: 'MONGODB_URI', label: 'Connection String', placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net/db', isSecret: true },
    ],
    codeSnippet: `// Backend: Connect to MongoDB
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('myapp');
const users = await db.collection('users').find({}).toArray();`,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Open source Firebase alternative with Postgres',
    icon: Building2,
    category: 'database' as const,
    enabled: false,
    envKeys: [
      { key: 'SUPABASE_URL', label: 'Project URL', placeholder: 'https://xxx.supabase.co', isSecret: false },
      { key: 'SUPABASE_ANON_KEY', label: 'Anon Key', placeholder: 'eyJhbGc...', isSecret: true },
    ],
    codeSnippet: `<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script>
const supabase = supabase.createClient('YOUR_URL', 'YOUR_KEY');
// Fetch data
const { data, error } = await supabase.from('products').select('*');
// Auth
const { user } = await supabase.auth.signInWithOAuth({ provider: 'google' });
</script>`,
  },
  {
    id: 'firebase',
    name: 'Firebase',
    description: 'Google backend platform with auth & realtime DB',
    icon: Building2,
    category: 'database' as const,
    enabled: false,
    envKeys: [
      { key: 'FIREBASE_API_KEY', label: 'API Key', placeholder: 'AIza...', isSecret: false },
      { key: 'FIREBASE_PROJECT_ID', label: 'Project ID', placeholder: 'my-project', isSecret: false },
    ],
    codeSnippet: `<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
<script>
firebase.initializeApp({ apiKey: 'YOUR_KEY', projectId: 'YOUR_PROJECT' });
const db = firebase.firestore();
const docs = await db.collection('items').get();
</script>`,
  },
  {
    id: 'redis',
    name: 'Redis / Upstash',
    description: 'In-memory cache and session storage',
    icon: Building2,
    category: 'database' as const,
    enabled: false,
    envKeys: [
      { key: 'REDIS_URL', label: 'Redis URL', placeholder: 'redis://user:pass@host:6379', isSecret: true },
      { key: 'UPSTASH_REST_URL', label: 'Upstash REST URL (optional)', placeholder: 'https://xxx.upstash.io', isSecret: false },
      { key: 'UPSTASH_REST_TOKEN', label: 'Upstash Token', placeholder: 'AXxx...', isSecret: true },
    ],
    codeSnippet: `// Using Upstash REST API (works in browser)
const redis = new Redis({ url: 'YOUR_URL', token: 'YOUR_TOKEN' });
await redis.set('user:1', JSON.stringify({ name: 'John' }));
const user = await redis.get('user:1');`,
  },
  // Media & Files
  {
    id: 'cloudinary',
    name: 'Cloudinary',
    description: 'Image and video management in the cloud',
    icon: ImageIcon,
    category: 'media' as const,
    enabled: false,
    envKeys: [
      { key: 'CLOUDINARY_CLOUD_NAME', label: 'Cloud Name', placeholder: 'my-cloud', isSecret: false },
      { key: 'CLOUDINARY_API_KEY', label: 'API Key', placeholder: '123456789', isSecret: false },
      { key: 'CLOUDINARY_API_SECRET', label: 'API Secret', placeholder: 'abc123...', isSecret: true },
    ],
    codeSnippet: `<script src="https://upload-widget.cloudinary.com/global/all.js"></script>
<button id="upload_widget" class="cloudinary-button">Upload Image</button>
<script>
var myWidget = cloudinary.createUploadWidget({
  cloudName: 'YOUR_CLOUD_NAME',
  uploadPreset: 'unsigned_preset'
}, (error, result) => {
  if (result.event === "success") {
    console.log('Uploaded:', result.info.secure_url);
  }
});
document.getElementById("upload_widget").addEventListener("click", () => myWidget.open());
</script>`,
  },
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'Cloud file storage and static hosting',
    icon: Cloud,
    category: 'media' as const,
    enabled: false,
    envKeys: [
      { key: 'AWS_ACCESS_KEY_ID', label: 'Access Key ID', placeholder: 'AKIA...', isSecret: false },
      { key: 'AWS_SECRET_ACCESS_KEY', label: 'Secret Key', placeholder: 'wJalr...', isSecret: true },
      { key: 'AWS_S3_BUCKET', label: 'Bucket Name', placeholder: 'my-bucket', isSecret: false },
      { key: 'AWS_REGION', label: 'Region', placeholder: 'us-east-1', isSecret: false },
    ],
    codeSnippet: `// Generate presigned URL for uploads (backend)
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = new S3Client({ region: process.env.AWS_REGION });
const url = await getSignedUrl(s3, new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET, Key: 'uploads/file.jpg'
}), { expiresIn: 3600 });`,
  },
  // Communication
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS, voice calls, and WhatsApp messaging',
    icon: MessageSquare,
    category: 'communication' as const,
    enabled: false,
    envKeys: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'AC...', isSecret: false },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: 'your-token', isSecret: true },
      { key: 'TWILIO_PHONE_NUMBER', label: 'Phone Number', placeholder: '+1234567890', isSecret: false },
    ],
    codeSnippet: `// Backend: Send SMS
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
await twilio.messages.create({
  body: 'Your order is confirmed!',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+1987654321'
});`,
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery and marketing automation',
    icon: MessageSquare,
    category: 'communication' as const,
    enabled: false,
    envKeys: [
      { key: 'SENDGRID_API_KEY', label: 'API Key', placeholder: 'SG.xxx...', isSecret: true },
      { key: 'SENDGRID_FROM_EMAIL', label: 'From Email', placeholder: 'hello@yourdomain.com', isSecret: false },
    ],
    codeSnippet: `// Backend: Send email
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({
  to: 'customer@example.com',
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Welcome!',
  html: '<h1>Thanks for signing up!</h1>'
});`,
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and audience management',
    icon: MessageSquare,
    category: 'communication' as const,
    enabled: false,
    envKeys: [
      { key: 'MAILCHIMP_API_KEY', label: 'API Key', placeholder: 'xxx-us1', isSecret: true },
      { key: 'MAILCHIMP_LIST_ID', label: 'List/Audience ID', placeholder: 'abc123', isSecret: false },
    ],
    codeSnippet: `<!-- Mailchimp Signup Form -->
<form action="https://YOUR_DOMAIN.us1.list-manage.com/subscribe/post?u=USER_ID&id=LIST_ID" method="post">
  <input type="email" name="EMAIL" placeholder="Enter your email" required>
  <button type="submit">Subscribe</button>
</form>`,
  },
  // Automation
  {
    id: 'n8n',
    name: 'n8n Workflows',
    description: 'Automate tasks with visual workflows',
    icon: Workflow,
    category: 'automation' as const,
    enabled: false,
    envKeys: [
      { key: 'N8N_WEBHOOK_URL', label: 'Webhook URL', placeholder: 'https://n8n.yourdomain.com/webhook/xxx', isSecret: false },
      { key: 'N8N_API_KEY', label: 'API Key (optional)', placeholder: 'n8n_api_...', isSecret: true },
    ],
    codeSnippet: `// Trigger n8n workflow from frontend
async function triggerWorkflow(data) {
  const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
// Example: triggerWorkflow({ email: 'user@example.com', action: 'signup' });`,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect apps and automate workflows',
    icon: Zap,
    category: 'automation' as const,
    enabled: false,
    envKeys: [
      { key: 'ZAPIER_WEBHOOK_URL', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/xxx', isSecret: false },
    ],
    codeSnippet: `// Send data to Zapier
async function sendToZapier(data) {
  await fetch('YOUR_ZAPIER_WEBHOOK', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
// Trigger: sendToZapier({ name: 'John', email: 'john@example.com' });`,
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Visual automation platform',
    icon: Workflow,
    category: 'automation' as const,
    enabled: false,
    envKeys: [
      { key: 'MAKE_WEBHOOK_URL', label: 'Webhook URL', placeholder: 'https://hook.make.com/xxx', isSecret: false },
    ],
    codeSnippet: `// Trigger Make scenario
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  await fetch('YOUR_MAKE_WEBHOOK', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(formData))
  });
});`,
  },
  // AI & ML
  {
    id: 'openai',
    name: 'OpenAI / ChatGPT',
    description: 'AI text generation and chat',
    icon: Sparkles,
    category: 'ai' as const,
    enabled: false,
    envKeys: [
      { key: 'OPENAI_API_KEY', label: 'API Key', placeholder: 'sk-...', isSecret: true },
    ],
    codeSnippet: `// Backend: Chat with GPT
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
console.log(completion.choices[0].message.content);`,
  },
  {
    id: 'anthropic',
    name: 'Claude AI',
    description: 'Anthropic Claude for advanced reasoning',
    icon: Sparkles,
    category: 'ai' as const,
    enabled: false,
    envKeys: [
      { key: 'ANTHROPIC_API_KEY', label: 'API Key', placeholder: 'sk-ant-...', isSecret: true },
    ],
    codeSnippet: `// Backend: Chat with Claude
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const message = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }]
});`,
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Run AI models in the cloud',
    icon: Sparkles,
    category: 'ai' as const,
    enabled: false,
    envKeys: [
      { key: 'REPLICATE_API_TOKEN', label: 'API Token', placeholder: 'r8_...', isSecret: true },
    ],
    codeSnippet: `// Backend: Generate image with Stable Diffusion
const Replicate = require('replicate');
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const output = await replicate.run('stability-ai/sdxl', {
  input: { prompt: 'A beautiful sunset over mountains' }
});`,
  },
  // Booking & Scheduling
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Embed booking calendar on your site',
    icon: Clock,
    category: 'scheduling' as const,
    enabled: false,
    envKeys: [
      { key: 'CALENDLY_URL', label: 'Scheduling Link', placeholder: 'https://calendly.com/yourname', isSecret: false },
    ],
    codeSnippet: `<!-- Calendly inline widget -->
<div class="calendly-inline-widget" data-url="YOUR_CALENDLY_URL" style="min-width:320px;height:630px;"></div>
<script src="https://assets.calendly.com/assets/external/widget.js" async></script>`,
  },
  {
    id: 'cal',
    name: 'Cal.com',
    description: 'Open source scheduling infrastructure',
    icon: Clock,
    category: 'scheduling' as const,
    enabled: false,
    envKeys: [
      { key: 'CAL_USERNAME', label: 'Cal.com Username', placeholder: 'yourname', isSecret: false },
      { key: 'CAL_EVENT_TYPE', label: 'Event Type Slug', placeholder: '30min', isSecret: false },
    ],
    codeSnippet: `<!-- Cal.com embed -->
<script>(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init");
</script>
<button data-cal-link="YOUR_USERNAME/EVENT_TYPE">Book a Call</button>`,
  },
  // Social & Auth
  {
    id: 'auth0',
    name: 'Auth0',
    description: 'Authentication and user management',
    icon: Lock,
    category: 'auth' as const,
    enabled: false,
    envKeys: [
      { key: 'AUTH0_DOMAIN', label: 'Domain', placeholder: 'your-tenant.auth0.com', isSecret: false },
      { key: 'AUTH0_CLIENT_ID', label: 'Client ID', placeholder: 'xxx...', isSecret: false },
    ],
    codeSnippet: `<script src="https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js"></script>
<script>
const auth0 = await createAuth0Client({
  domain: 'YOUR_DOMAIN',
  clientId: 'YOUR_CLIENT_ID'
});
document.getElementById('login').addEventListener('click', () => auth0.loginWithRedirect());
</script>`,
  },
  {
    id: 'clerk',
    name: 'Clerk',
    description: 'Drop-in authentication UI',
    icon: Users,
    category: 'auth' as const,
    enabled: false,
    envKeys: [
      { key: 'CLERK_PUBLISHABLE_KEY', label: 'Publishable Key', placeholder: 'pk_...', isSecret: false },
    ],
    codeSnippet: `<script src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"></script>
<script>
const clerkPubKey = 'YOUR_PUBLISHABLE_KEY';
const clerk = new window.Clerk(clerkPubKey);
await clerk.load();
if (!clerk.user) clerk.mountSignIn(document.getElementById("sign-in"));
</script>
<div id="sign-in"></div>`,
  },
]

function WorkspaceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const { data: session } = useSession()
  const isDark = theme === 'dark'

  // Database persistence hook
  const projectHook = useProjectHook({ autoLoad: !!session?.user })

  // Core state
  const [html, setHtml] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [buildPhase, setBuildPhase] = useState<BuildPhase>('idle')
  const [currentSteps, setCurrentSteps] = useState<BuildStep[]>(buildSteps)

  // Project state
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectName, setProjectName] = useState('Untitled Project')

  // UI state
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [activePanel, setActivePanel] = useState<Panel>('build')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('no-code')
  const [selectedPreset, setSelectedPreset] = useState<string>('modern-dark')
  const [hasInitialized, setHasInitialized] = useState(false)
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false)
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [showChatModelSelector, setShowChatModelSelector] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [commandSearch, setCommandSearch] = useState('')
  const [commandIndex, setCommandIndex] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const commandInputRef = useRef<HTMLInputElement>(null)

  // Toast notifications
  interface Toast {
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    duration?: number
  }
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  const addToast = useCallback((type: Toast['type'], message: string, duration = 3000) => {
    const id = `toast-${++toastIdRef.current}`
    setToasts(prev => [...prev, { id, type, message, duration }])

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Context Menu state
  interface ContextMenuState {
    show: boolean
    x: number
    y: number
    element: {
      tagName: string
      outerHTML: string
      innerHTML?: string
      textContent?: string
      src?: string
      href?: string
      className?: string
      id?: string
      attributes?: Record<string, string>
      selector?: string
      elementIndex?: number
      isImage: boolean
      isLink: boolean
      isText: boolean
    } | null
  }
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    element: null
  })

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [commandInput, setCommandInput] = useState('')
  const [chatPosition, setChatPosition] = useState<{ x: number; y: number } | null>(null) // null = docked at bottom center
  const [isDraggingChat, setIsDraggingChat] = useState(false)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Console state
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([
    { type: 'info', message: 'Console ready. Logs from your website will appear here.', timestamp: new Date() }
  ])
  const [consoleFilter, setConsoleFilter] = useState<ConsoleLogType | 'all'>('all')

  // Environment variables
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { key: 'API_URL', value: 'https://api.example.com', isSecret: false },
  ])
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')

  // WebStew ingredients
  const [stewIngredients, setStewIngredients] = useState<StewIngredient[]>([])

  // Supabase Templates
  interface SupabaseTemplate {
    id: string
    name: string
    description: string
    category: string
    industry: string
    thumbnail_url: string
    is_premium: boolean
    price_credits: number
    html_content?: string
  }
  const [supabaseTemplates, setSupabaseTemplates] = useState<SupabaseTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Settings
  const [settings, setSettings] = useState<WorkspaceSettings>({
    openaiKey: '',
    githubToken: '',
    renderKey: '',
  })

  // UI helpers
  const [codeCopied, setCodeCopied] = useState(false)
  const [currentQuip, setCurrentQuip] = useState(buildingQuips[0])
  const [quipIndex, setQuipIndex] = useState(0)

  // Element Selector state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedMediaElement, setSelectedMediaElement] = useState<{
    type: 'image' | 'video'
    src: string
    outerHTML: string
    tagName: string
    index: number
  } | null>(null)
  const [showMediaReplacer, setShowMediaReplacer] = useState(false)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [hoveredElement, setHoveredElement] = useState<SelectedElement | null>(null)

  // Image Editor state
  const [imageEdits, setImageEdits] = useState<ImageEdit[]>([])
  const [selectedImage, setSelectedImage] = useState<ImageEdit | null>(null)
  const [runpodEndpoint, setRunpodEndpoint] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoGenerating, setVideoGenerating] = useState(false)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [videoStatus, setVideoStatus] = useState('')
  const [videoError, setVideoError] = useState('')

  // AI Image Generation state
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageGenerating, setImageGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  // Smart Image Insertion state
  const [showImageInsertPanel, setShowImageInsertPanel] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [pendingImageName, setPendingImageName] = useState('')
  const [imageInsertSize, setImageInsertSize] = useState<'thumbnail' | 'small' | 'medium' | 'large' | 'full'>('medium')
  const [imageInsertPosition, setImageInsertPosition] = useState<'hero' | 'after-hero' | 'section' | 'footer' | 'replace'>('section')
  const [websiteImages, setWebsiteImages] = useState<{ src: string; index: number; context: string }[]>([])
  const [imageStyle, setImageStyle] = useState<string>('modern')
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9')
  const [imageTabMode, setImageTabMode] = useState<'url' | 'unsplash' | 'ai' | 'upload'>('url')
  const [unsplashResults, setUnsplashResults] = useState<string[]>([])
  const [unsplashLoading, setUnsplashLoading] = useState(false)

  // Business Integrations state
  const [integrations, setIntegrations] = useState<BusinessIntegration[]>(defaultIntegrations)
  const [integrationFilter, setIntegrationFilter] = useState<string>('all')

  // AI Model Selection state
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    aiModels.find(m => m.id === 'claude-haiku-3.5') ||
    aiModels.find(m => m.id === 'gpt-4o') ||
    aiModels.find(m => m.provider === 'anthropic' || m.provider === 'openai') ||
    aiModels[0]
  )
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [apiKeys, setApiKeys] = useState<{
    anthropic: string
    openai: string
    google: string
    huggingface: string
    together: string
    cloudflare: string
    cloudflareAccountId: string
  }>({
    anthropic: '',
    openai: '',
    google: '',
    huggingface: '', // Optional - works without key at lower rate limits
    together: '',
    cloudflare: '',
    cloudflareAccountId: '',
  })
  const [showModelSelector, setShowModelSelector] = useState(false)

  // Service credentials for databases, APIs, etc. (stored server-side encrypted)
  const [serviceCredentials, setServiceCredentials] = useState<{
    MONGODB_URI: string
    REDIS_URL: string
    SUPABASE_URL: string
    SUPABASE_ANON_KEY: string
    STRIPE_SECRET_KEY: string
    STRIPE_PUBLISHABLE_KEY: string
    SENDGRID_API_KEY: string
    TWILIO_AUTH_TOKEN: string
    TWILIO_ACCOUNT_SID: string
    CLOUDINARY_API_SECRET: string
    CLOUDINARY_API_KEY: string
  }>({
    MONGODB_URI: '',
    REDIS_URL: '',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_PUBLISHABLE_KEY: '',
    SENDGRID_API_KEY: '',
    TWILIO_AUTH_TOKEN: '',
    TWILIO_ACCOUNT_SID: '',
    CLOUDINARY_API_SECRET: '',
    CLOUDINARY_API_KEY: '',
  })
  const [savedCredentials, setSavedCredentials] = useState<string[]>([]) // Track which are saved
  const [apiKeyTab, setApiKeyTab] = useState<'ai' | 'services' | 'integrations'>('ai')
  const [savingCredentials, setSavingCredentials] = useState(false)

  // Stock Image state
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [imageSearchQuery, setImageSearchQuery] = useState('')
  const [imageCategory, setImageCategory] = useState<string>('all')
  const [stockImages, setStockImages] = useState<StockImage[]>([])
  const [loadingImages, setLoadingImages] = useState(false)

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  // Deploy state
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<'idle' | 'github' | 'render' | 'success' | 'error'>('idle')
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)

  // Conversational chat state
  const [showWelcome, setShowWelcome] = useState(true)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string; suggestions?: string[] }[]>([
    { role: 'assistant', content: "Welcome! I'm your AI creative assistant. What would you like to create today?", suggestions: ['Build a website', 'Generate an image', 'Create a video'] }
  ])
  const [chatSuggestions, setChatSuggestions] = useState<string[]>(['Build a website', 'Generate an image', 'Create a video'])
  const [conversationIntent, setConversationIntent] = useState<'website' | 'image' | 'video' | 'edit' | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Drag and drop state for images
  const [draggedImageUrl, setDraggedImageUrl] = useState<string | null>(null)
  const [isDraggingImage, setIsDraggingImage] = useState(false)

  // Agent Mode state - Manus-like autonomous AI agent
  // Agent mode removed for simplicity

  // Export panel state
  const [showExportPanel, setShowExportPanel] = useState(false)

  // Theme builder panel state
  const [showThemeBuilder, setShowThemeBuilder] = useState(false)

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate unique ID
  const generateId = () => `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add terminal line
  const addTerminalLine = useCallback((type: TerminalLine['type'], content: string) => {
    setTerminalLines(prev => [...prev, { type, content, timestamp: new Date() }])
  }, [])

  // Add console log
  const addConsoleLog = useCallback((type: ConsoleLogType, message: string, source?: string) => {
    setConsoleLogs(prev => [...prev, { type, message, timestamp: new Date(), source }])
  }, [])

  // Credit costs for operations
  const CREDIT_COSTS = {
    generate_website: 10,
    chat_message: 1,
    image_generation: 5,
  }

  // Check and deduct credits
  const checkAndDeductCredits = useCallback(async (operation: keyof typeof CREDIT_COSTS): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user) {
      // Anonymous users get limited free generations
      return { success: true }
    }

    const cost = CREDIT_COSTS[operation]

    try {
      // Check credits first
      const checkRes = await fetch('/api/credits')
      if (checkRes.ok) {
        const data = await checkRes.json()
        if (data.credits < cost && !data.isDemo) {
          return { success: false, error: `Insufficient credits. You have ${data.credits} credits but need ${cost}.` }
        }
      }

      // Deduct credits via PATCH
      const deductRes = await fetch('/api/credits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cost, operation })
      })

      if (!deductRes.ok) {
        const error = await deductRes.json()
        if (deductRes.status === 402) {
          return { success: false, error: `Insufficient credits. Need ${cost} credits.` }
        }
        return { success: false, error: error.error || 'Failed to deduct credits' }
      }

      const result = await deductRes.json()
      addConsoleLog('info', `Used ${cost} credits. Remaining: ${result.credits}`)
      return { success: true }
    } catch (error) {
      console.error('Credit check error:', error)
      return { success: true } // Allow generation on credit check failure
    }
  }, [session?.user, addConsoleLog])

  // Fetch user credits on load and after generation (works for anonymous too - returns demo credits)
  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/credits')
      if (res.ok) {
        const data = await res.json()
        setUserCredits(data.credits)
      }
    } catch (e) {
      console.error('Failed to fetch credits:', e)
      // Default to demo credits on error
      setUserCredits(100)
    }
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  // Fetch saved service credentials (for logged in users)
  const fetchServiceCredentials = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch('/api/credentials')
      if (res.ok) {
        const data = await res.json()
        // Track which credentials are saved (we don't get the actual values back, just metadata)
        const saved = data.credentials?.map((c: { name: string }) => c.name) || []
        setSavedCredentials(saved)
      }
    } catch (e) {
      console.error('Failed to fetch credentials:', e)
    }
  }, [session?.user])

  useEffect(() => {
    fetchServiceCredentials()
  }, [fetchServiceCredentials])

  // Save service credentials to server (encrypted)
  const saveServiceCredentials = useCallback(async () => {
    if (!session?.user) {
      addConsoleLog('warn', 'Login required to save service credentials securely')
      return false
    }

    setSavingCredentials(true)
    try {
      // Only send credentials that have values
      const credentialsToSave: Record<string, string> = {}
      for (const [key, value] of Object.entries(serviceCredentials)) {
        if (value && value.trim()) {
          credentialsToSave[key] = value
        }
      }

      if (Object.keys(credentialsToSave).length === 0) {
        addConsoleLog('info', 'No credentials to save')
        setSavingCredentials(false)
        return true
      }

      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: credentialsToSave })
      })

      if (res.ok) {
        const data = await res.json()
        addConsoleLog('success', `Saved ${data.savedCount} credentials securely`)
        // Refresh saved credentials list
        fetchServiceCredentials()
        return true
      } else {
        const error = await res.json()
        addConsoleLog('error', error.error || 'Failed to save credentials')
        return false
      }
    } catch (e) {
      console.error('Error saving credentials:', e)
      addConsoleLog('error', 'Failed to save credentials')
      return false
    } finally {
      setSavingCredentials(false)
    }
  }, [session?.user, serviceCredentials, addConsoleLog, fetchServiceCredentials])

  // Load projects from localStorage and merge with database projects
  useEffect(() => {
    // Load local projects
    const savedProjects = localStorage.getItem('vibe-projects')
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects)
        setProjects(parsed.map((p: Project) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        })))
      } catch (e) {
        console.error('Failed to parse saved projects')
      }
    }

    // Merge database projects when available
    if (session?.user && projectHook.projects.length > 0) {
      setProjects(prev => {
        const dbProjectIds = new Set(projectHook.projects.map(p => p.id))
        // Keep local projects that aren't in DB, and add all DB projects
        const localOnly = prev.filter(p => !dbProjectIds.has(p.id))
        const dbProjects = projectHook.projects.map(p => ({
          id: p.id,
          name: p.name,
          html: p.html || '',
          envVars: p.envVars || [],
          skillLevel: (p.skillLevel || 'no-code') as SkillLevel,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }))
        return [...dbProjects, ...localOnly]
      })
    }

    const savedSettings = localStorage.getItem('workspace-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Failed to parse saved settings')
      }
    }

    const savedSkillLevel = localStorage.getItem('workspace-skill-level')
    if (savedSkillLevel && ['no-code', 'low-code', 'full-stack'].includes(savedSkillLevel)) {
      setSkillLevel(savedSkillLevel as SkillLevel)
    }

    const savedApiKeys = localStorage.getItem('ai-builder-api-keys')
    if (savedApiKeys) {
      try {
        setApiKeys(JSON.parse(savedApiKeys))
      } catch (e) {
        console.error('Failed to parse saved API keys')
      }
    }
  }, [session?.user, projectHook.projects])

  // Fetch templates from Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const res = await fetch('/api/templates')
        if (res.ok) {
          const data = await res.json()
          setSupabaseTemplates(data.templates || [])
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoadingTemplates(false)
      }
    }
    fetchTemplates()
  }, [])

  // Load initial prompt from URL params - with caching to prevent token waste on reload
  useEffect(() => {
    if (hasInitialized) return

    const promptFromUrl = searchParams.get('prompt')
    const projectId = searchParams.get('project')

    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        loadProject(project)
      }
    } else if (promptFromUrl) {
      // Check if we have a cached result for this exact prompt
      const cachedResult = localStorage.getItem('webstew-last-generation')
      if (cachedResult) {
        try {
          const cached = JSON.parse(cachedResult)
          // If the prompt matches and we have HTML, use the cached version
          if (cached.prompt === promptFromUrl && cached.html) {
            setHtml(cached.html)
            setHasInitialized(true)
            addTerminalLine('info', '✓ Loaded from cache (reload detected)')
            addConsoleLog('info', 'Loaded cached generation - no tokens used')
            // Clear the prompt from URL to prevent future reloads from re-checking
            router.replace('/workspace', { scroll: false })
            return
          }
        } catch (e) {
          // Invalid cache, proceed with generation
        }
      }
      setHasInitialized(true)
      handleGenerate(promptFromUrl)
    } else {
      setHasInitialized(true)
    }
  }, [searchParams, hasInitialized, projects])

  // Save projects to localStorage
  useEffect(() => {
    if (projects.length > 0) {
      try {
        localStorage.setItem('vibe-projects', JSON.stringify(projects))
      } catch (e) {
        console.warn('Failed to save projects')
      }
    }
  }, [projects])

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem('workspace-settings', JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save settings')
    }
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem('workspace-skill-level', skillLevel)
    } catch (e) {
      console.warn('Failed to save skill level')
    }
  }, [skillLevel])

  // Auto-save current work to localStorage (browser refresh protection)
  useEffect(() => {
    if (html && html.length > 100) {
      // Limit HTML size to prevent quota errors (max ~500KB)
      const maxSize = 500000
      const htmlToSave = html.length > maxSize ? html.slice(0, maxSize) : html
      const autoSaveData = {
        html: htmlToSave,
        projectName,
        timestamp: new Date().toISOString(),
        selectedPreset,
        truncated: html.length > maxSize,
      }
      try {
        localStorage.setItem('webstew-autosave', JSON.stringify(autoSaveData))
      } catch (e) {
        // If quota exceeded, clear old data and try again
        console.warn('LocalStorage quota exceeded, clearing old data...')
        try {
          localStorage.removeItem('webstew-autosave')
          localStorage.removeItem('webstew-last-generation')
          localStorage.removeItem('vibe-projects')
          localStorage.setItem('webstew-autosave', JSON.stringify(autoSaveData))
        } catch (e2) {
          console.error('Failed to save even after clearing:', e2)
        }
      }
    }
  }, [html, projectName, selectedPreset])

  // Load auto-saved work on mount (if no URL params)
  useEffect(() => {
    if (hasInitialized && !html && !searchParams.get('prompt') && !searchParams.get('project')) {
      const autoSaved = localStorage.getItem('webstew-autosave')
      if (autoSaved) {
        try {
          const saved = JSON.parse(autoSaved)
          if (saved.html && saved.html.length > 100) {
            setHtml(saved.html)
            if (saved.projectName) setProjectName(saved.projectName)
            if (saved.selectedPreset) setSelectedPreset(saved.selectedPreset)
            addTerminalLine('system', '⏪ Restored previous session from auto-save')
            addConsoleLog('info', 'Auto-save restored - your work is safe!')
          }
        } catch (e) {
          console.error('Failed to restore auto-save:', e)
        }
      }
    }
  }, [hasInitialized, searchParams])

  // Check onboarding status on mount
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('webstew-onboarding-complete')
    if (!hasSeenOnboarding && hasInitialized && !searchParams.get('prompt')) {
      // Show onboarding for new users after a short delay
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
    if (hasSeenOnboarding) {
      setHasCompletedOnboarding(true)
    }
  }, [hasInitialized, searchParams])

  // Save onboarding completion
  const handleOnboardingComplete = () => {
    localStorage.setItem('webstew-onboarding-complete', 'true')
    setHasCompletedOnboarding(true)
    setShowOnboarding(false)
  }

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLines])

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleLogs])

  // Rotate quips during generation - faster for timelapse feel
  useEffect(() => {
    if (!isGenerating) return

    const interval = setInterval(() => {
      setQuipIndex(prev => {
        // Mix it up - sometimes go sequential, sometimes random
        const next = Math.random() > 0.3
          ? Math.floor(Math.random() * buildingQuips.length)
          : (prev + 1) % buildingQuips.length
        setCurrentQuip(buildingQuips[next])
        return next
      })
    }, 2000) // Change quip every 2 seconds for faster pace

    return () => clearInterval(interval)
  }, [isGenerating])

  // Listen for messages from iframe (console + element selection)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        addConsoleLog(event.data.level || 'log', event.data.message, 'iframe')
      } else if (event.data?.type === 'element-edited') {
        // Handle live edit from iframe
        const { oldContent, newContent, element } = event.data
        if (oldContent && newContent && oldContent !== newContent) {
          // Find and replace the content in HTML
          const tag = element.tagName.toLowerCase()
          const escapedOld = oldContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`(<${tag}[^>]*>)${escapedOld}(</${tag}>)`, 'g')

          let newHtml = html
          if (regex.test(html)) {
            newHtml = html.replace(regex, `$1${newContent}$2`)
          } else {
            // Fallback: simple string replacement
            newHtml = html.replace(oldContent, newContent)
          }

          if (newHtml !== html) {
            setHtml(newHtml)
            // Inline history update to avoid dependency on addToHistory
            const entry = { html: newHtml, prompt: `Edited ${tag}: "${newContent.slice(0, 30)}..."`, timestamp: new Date() }
            setHistory(prev => [...prev.slice(-29), entry])
            setHistoryIndex(prev => Math.min(prev + 1, 29))
            const sectionInfo = element.section ? ` in ${element.section.tagName}` : ''
            addConsoleLog('success', `Live edit saved${sectionInfo}`)
          }
        }
      } else if (event.data?.type === 'element-click' && selectMode) {
        // Simple: just store the element for deletion
        setSelectedElement(event.data.element)
        setSelectedMediaElement(null) // Clear media selection
        const tag = event.data.element.tagName?.toLowerCase() || 'element'
        addConsoleLog('info', `Selected <${tag}> - Click DELETE to remove`)
      } else if (event.data?.type === 'media-click' && selectMode) {
        // Handle image/video selection
        const { type, src, outerHTML, tagName, index } = event.data.element
        setSelectedMediaElement({ type, src, outerHTML, tagName, index })
        setSelectedElement(null) // Clear regular selection
        setShowMediaReplacer(true) // Show the replacement modal
        addConsoleLog('info', `Selected ${type} - Choose an action below`)
      } else if (event.data?.type === 'image-drop') {
        // Handle image drop from drag-and-drop
        const { oldSrc, newSrc, imageIndex } = event.data
        if (oldSrc && newSrc && html) {
          // Replace the specific image src in the HTML
          // First, try to find by exact src match
          const escapedOldSrc = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const srcRegex = new RegExp(`src=["']${escapedOldSrc}["']`, 'g')

          let newHtml = html
          if (srcRegex.test(html)) {
            newHtml = html.replace(srcRegex, `src="${newSrc}"`)
          } else {
            // Fallback: replace by image index
            let imgCount = 0
            newHtml = html.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
              if (imgCount === imageIndex) {
                imgCount++
                return `<img ${before}src="${newSrc}"${after}>`
              }
              imgCount++
              return match
            })
          }

          if (newHtml !== html) {
            setHtml(newHtml)
            // Inline history update to avoid dependency on addToHistory
            const entry = { html: newHtml, prompt: 'Replaced image via drag-and-drop', timestamp: new Date() }
            setHistory(prev => [...prev.slice(-29), entry])
            setHistoryIndex(prev => Math.min(prev + 1, 29))
            addConsoleLog('success', `Image ${imageIndex + 1} replaced successfully!`)
            addToast('success', 'Image replaced!')
            setChatMessages(prev => [...prev, {
              role: 'assistant',
              content: `Replaced image! You can drag more images onto specific images to replace them.`
            }])
          }
        }
        setIsDraggingImage(false)
        setDraggedImageUrl(null)
      } else if (event.data?.type === 'context-menu') {
        // Handle right-click context menu from iframe
        const { x, y, element } = event.data
        // Adjust position relative to iframe location
        const iframe = document.querySelector('iframe')
        if (iframe) {
          const rect = iframe.getBoundingClientRect()
          setContextMenu({
            show: true,
            x: rect.left + x,
            y: rect.top + y,
            element: element
          })
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [addConsoleLog, selectMode, html])

  // Project management
  const saveProject = async () => {
    const now = new Date()
    const project: Project = {
      id: currentProject?.id || generateId(),
      name: projectName,
      html,
      envVars,
      skillLevel,
      createdAt: currentProject?.createdAt || now,
      updatedAt: now,
    }

    // Save to local state
    setProjects(prev => {
      const existing = prev.findIndex(p => p.id === project.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = project
        return updated
      }
      return [...prev, project]
    })
    setCurrentProject(project)

    // Also save to database if authenticated
    if (session?.user) {
      try {
        const savedProject = await projectHook.saveProject({
          id: currentProject?.id,
          name: projectName,
          html,
        })
        if (savedProject) {
          // Update local project with database id
          setCurrentProject(prev => prev ? { ...prev, id: savedProject.id } : null)
          addTerminalLine('success', `Project "${projectName}" saved to cloud`)
          addConsoleLog('success', `Project synced to cloud: ${projectName}`)
          addToast('success', `Project saved to cloud`)
        }
      } catch (err) {
        addTerminalLine('error', `Failed to save to cloud: ${err}`)
        addConsoleLog('error', `Cloud save failed: ${err}`)
        addToast('error', `Failed to save project`)
      }
    } else {
      addTerminalLine('success', `Project "${projectName}" saved locally`)
      addConsoleLog('info', `Project saved locally: ${projectName}`)
      addToast('success', `Project saved locally`)
    }
  }

  const loadProject = (project: Project) => {
    setCurrentProject(project)
    setProjectName(project.name)
    setHtml(project.html)
    setEnvVars(project.envVars)
    setSkillLevel(project.skillLevel)
    setHasInitialized(true)
    addTerminalLine('info', `Loaded project: ${project.name}`)
    addConsoleLog('info', `Project loaded: ${project.name}`)
    setShowProjectsDropdown(false)
  }

  const deleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)

    // Delete from local state
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setProjectName('Untitled Project')
      setHtml('')
    }

    // Also delete from database if authenticated
    if (session?.user) {
      try {
        await projectHook.deleteProject(projectId)
        addTerminalLine('success', `Project "${project?.name}" deleted from cloud`)
      } catch (err) {
        addTerminalLine('error', `Failed to delete from cloud: ${err}`)
      }
    } else {
      addTerminalLine('info', `Project "${project?.name}" deleted locally`)
    }
  }

  const newProject = () => {
    setCurrentProject(null)
    setProjectName('Untitled Project')
    setHtml('')
    setEnvVars([{ key: 'API_URL', value: 'https://api.example.com', isSecret: false }])
    setTerminalLines([])
    setHistory([])
    setHistoryIndex(-1)
    addTerminalLine('info', 'New project created')
    setShowProjectsDropdown(false)
  }

  // Deploy functions
  const deployToGitHub = async () => {
    if (!html.trim()) {
      addTerminalLine('error', 'No content to deploy')
      addConsoleLog('error', 'Deploy failed: No HTML content')
      return
    }

    setIsDeploying(true)
    setDeployStatus('github')
    setDeployError(null)
    addTerminalLine('info', '🚀 Starting GitHub deployment...')

    try {
      const repoName = projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50) || 'ai-website'

      const response = await fetch('/api/deploy/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [
            { path: 'index.html', content: html },
            { path: 'README.md', content: `# ${projectName}\n\nBuilt with AI Website Builder` }
          ],
          repoName: `${repoName}-${Date.now().toString(36)}`,
          isPrivate: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create repository')
      }

      addTerminalLine('success', `✅ GitHub repo created: ${data.repoUrl}`)
      addConsoleLog('success', `Repository created: ${data.repoUrl}`)
      setDeployUrl(data.repoUrl)
      setDeployStatus('success')
    } catch (error: any) {
      const message = error.message || 'GitHub deployment failed'
      addTerminalLine('error', `❌ ${message}`)
      addConsoleLog('error', message)
      setDeployError(message)
      setDeployStatus('error')
    } finally {
      setIsDeploying(false)
    }
  }

  const deployToRender = async () => {
    if (!html.trim()) {
      addTerminalLine('error', 'No content to deploy')
      addConsoleLog('error', 'Deploy failed: No HTML content')
      return
    }

    setIsDeploying(true)
    setDeployStatus('github')
    addTerminalLine('info', '🚀 Starting full deployment...')

    try {
      addTerminalLine('info', '📦 Creating GitHub repository...')
      setDeployStatus('github')

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          files: [
            { path: 'index.html', content: html },
          ],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed')
      }

      addTerminalLine('info', '🌐 Deploying to Render...')
      setDeployStatus('render')

      // Wait a moment for Render to process
      await new Promise(r => setTimeout(r, 2000))

      addTerminalLine('success', `✅ Site deployed: ${data.url}`)
      addConsoleLog('success', `Live at: ${data.url}`)
      setDeployUrl(data.url)
      setDeployStatus('success')
    } catch (error: any) {
      const message = error.message || 'Deployment failed'
      addTerminalLine('error', `❌ ${message}`)
      addConsoleLog('error', message)
      setDeployError(message)
      setDeployStatus('error')
    } finally {
      setIsDeploying(false)
    }
  }

  const exportHtml = () => {
    if (!html.trim()) {
      addTerminalLine('error', 'No content to export')
      return
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; }
    .font-serif { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body>
${html}
</body>
</html>`

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addTerminalLine('success', `📥 Exported: ${a.download}`)
    addConsoleLog('success', `HTML exported: ${a.download}`)
  }

  // Environment variables
  const addEnvVar = () => {
    if (!newEnvKey.trim()) return
    setEnvVars(prev => [...prev, { key: newEnvKey, value: newEnvValue, isSecret: false }])
    setNewEnvKey('')
    setNewEnvValue('')
    addConsoleLog('info', `Added env variable: ${newEnvKey}`)
  }

  const removeEnvVar = (key: string) => {
    setEnvVars(prev => prev.filter(v => v.key !== key))
    addConsoleLog('info', `Removed env variable: ${key}`)
  }

  const toggleEnvSecret = (key: string) => {
    setEnvVars(prev => prev.map(v => v.key === key ? { ...v, isSecret: !v.isSecret } : v))
  }

  // History management
  const addToHistory = useCallback((newHtml: string, promptText: string) => {
    const entry: HistoryEntry = { html: newHtml, prompt: promptText, timestamp: new Date() }
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(entry)
      return newHistory.slice(-30)
    })
    setHistoryIndex(prev => Math.min(prev + 1, 29))
  }, [historyIndex])

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setHtml(history[historyIndex - 1].html)
      addConsoleLog('info', 'Undo')
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setHtml(history[historyIndex + 1].html)
      addConsoleLog('info', 'Redo')
    }
  }

  // Load template from Supabase
  const loadSupabaseTemplate = async (templateId: string, templateName: string) => {
    try {
      addTerminalLine('info', `Loading template: ${templateName}...`)
      const res = await fetch(`/api/templates?id=${templateId}`)
      if (res.ok) {
        const data = await res.json()
        const template = data.templates?.[0]
        if (template?.html_content) {
          setHtml(template.html_content)
          setViewMode('preview')
          addTerminalLine('success', `✓ Loaded "${templateName}" template`)
          addConsoleLog('success', `Template "${templateName}" loaded successfully`)
          addToHistory(template.html_content, `Loaded ${templateName} template`)
        } else {
          addTerminalLine('error', `Template content not found`)
        }
      }
    } catch (error) {
      addTerminalLine('error', `Failed to load template: ${error}`)
    }
  }

  // Inject console interceptor and element selector into HTML
  const getHtmlWithConsole = useCallback((originalHtml: string) => {
    const consoleScript = `
<script>
(function() {
  // Prevent all link navigation in preview
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Prevent form submissions
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
  }, true);

  const originalConsole = { log: console.log, info: console.info, warn: console.warn, error: console.error };
  ['log', 'info', 'warn', 'error'].forEach(level => {
    console[level] = function(...args) {
      originalConsole[level].apply(console, args);
      window.parent.postMessage({ type: 'console', level, message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
    };
  });
  window.onerror = function(msg, url, line) {
    window.parent.postMessage({ type: 'console', level: 'error', message: msg + ' (line ' + line + ')' }, '*');
  };

  // ========== RIGHT-CLICK CONTEXT MENU (always active) ==========
  // Generate unique CSS selector for an element
  function getElementSelector(el) {
    if (el.id) return '#' + el.id;

    // Build path from element to body
    const path = [];
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();

      // Add class if it exists and is unique enough
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\\s+/).filter(c => c && !c.includes(':'));
        if (classes.length > 0) {
          selector += '.' + classes.slice(0, 2).join('.');
        }
      }

      // Add nth-child for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += ':nth-of-type(' + index + ')';
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  // Get element's position in document order
  function getElementIndex(el) {
    const allElements = document.body.querySelectorAll('*');
    return Array.from(allElements).indexOf(el);
  }

  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    const tagName = el.tagName;
    const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LI', 'TD', 'TH', 'LABEL', 'BUTTON', 'DIV'];

    // Get a unique signature for this element
    const selector = getElementSelector(el);
    const elementIndex = getElementIndex(el);

    // Get attributes for better matching
    const attrs = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      attrs[attr.name] = attr.value;
    }

    window.parent.postMessage({
      type: 'context-menu',
      x: e.clientX,
      y: e.clientY,
      element: {
        tagName: tagName,
        outerHTML: el.outerHTML,
        innerHTML: el.innerHTML || '',
        textContent: el.innerText?.slice(0, 200) || '',
        src: el.src || null,
        href: el.href || null,
        className: el.className || '',
        id: el.id || '',
        attributes: attrs,
        selector: selector,
        elementIndex: elementIndex,
        isImage: tagName === 'IMG',
        isLink: tagName === 'A',
        isText: textTags.includes(tagName)
      }
    }, '*');
  }, true);

  // ========== DRAG AND DROP FOR IMAGES ==========
  // Listen for parent to notify us about dragging state
  let parentIsDragging = false;
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'drag-state') {
      parentIsDragging = e.data.isDragging;
      // Add/remove visual indicators on all images
      document.querySelectorAll('img').forEach(function(img, index) {
        if (parentIsDragging) {
          img.style.outline = '3px dashed #a855f7';
          img.style.outlineOffset = '4px';
          img.style.cursor = 'copy';
          img.setAttribute('data-drop-index', index);
        } else {
          img.style.outline = '';
          img.style.outlineOffset = '';
          img.style.cursor = '';
        }
      });
    }
  });

  // Make images droppable
  document.addEventListener('dragover', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      e.target.style.outline = '4px solid #22c55e';
      e.target.style.transform = 'scale(1.02)';
      e.target.style.transition = 'transform 0.15s';
    }
  }, true);

  document.addEventListener('dragleave', function(e) {
    if (e.target.tagName === 'IMG') {
      e.target.style.outline = parentIsDragging ? '3px dashed #a855f7' : '';
      e.target.style.transform = '';
    }
  }, true);

  document.addEventListener('drop', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();

      // Get the image URL from dataTransfer
      const imageUrl = e.dataTransfer.getData('image-url') || e.dataTransfer.getData('text/plain');

      if (imageUrl) {
        const oldSrc = e.target.src;
        // Get the index of this image
        const allImages = [...document.querySelectorAll('img')];
        const imageIndex = allImages.indexOf(e.target);

        // Send message to parent with the old src and new src
        window.parent.postMessage({
          type: 'image-drop',
          oldSrc: oldSrc,
          newSrc: imageUrl,
          imageIndex: imageIndex
        }, '*');

        // Update the image immediately for visual feedback
        e.target.src = imageUrl;
        e.target.style.outline = '4px solid #22c55e';
        setTimeout(function() {
          e.target.style.outline = '';
          e.target.style.transform = '';
        }, 500);
      }
    }
  }, true);
})();
</script>`

    // Simple element selector - click to select, shows delete button
    const elementSelectorScript = selectMode ? `
<script>
(function() {
  // Add simple hover styles
  const style = document.createElement('style');
  style.textContent = \`
    *:hover { outline: 2px dashed #a855f7 !important; outline-offset: -2px; cursor: pointer !important; }
    img:hover, video:hover { outline: 3px solid #3b82f6 !important; outline-offset: 2px; cursor: pointer !important; }
    .__selected__ { outline: 3px solid #ef4444 !important; outline-offset: -3px; background: rgba(239,68,68,0.1) !important; }
    .__media-selected__ { outline: 4px solid #10b981 !important; outline-offset: 4px; box-shadow: 0 0 20px rgba(16,185,129,0.4) !important; }
  \`;
  document.head.appendChild(style);

  let selected = null;

  // Index all images and videos
  const mediaElements = [...document.querySelectorAll('img, video')];

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    // Remove previous selection
    if (selected) {
      selected.classList.remove('__selected__');
      selected.classList.remove('__media-selected__');
    }

    // IMPORTANT: Get outerHTML BEFORE adding class so it matches original HTML
    const outerHTML = e.target.outerHTML;
    const textContent = e.target.innerText?.slice(0, 100) || '';
    const tagName = e.target.tagName;

    // Check if it's an image or video
    const isMedia = tagName === 'IMG' || tagName === 'VIDEO';
    const mediaIndex = isMedia ? mediaElements.indexOf(e.target) : -1;

    // Select new element
    selected = e.target;
    selected.classList.add(isMedia ? '__media-selected__' : '__selected__');

    if (isMedia) {
      // Send media-specific message
      window.parent.postMessage({
        type: 'media-click',
        element: {
          type: tagName === 'IMG' ? 'image' : 'video',
          src: e.target.src || e.target.querySelector('source')?.src || '',
          outerHTML: outerHTML,
          tagName: tagName,
          index: mediaIndex
        }
      }, '*');
    } else {
      // Send regular element message
      window.parent.postMessage({
        type: 'element-click',
        element: {
          tagName: tagName,
          outerHTML: outerHTML,
          textContent: textContent
        }
      }, '*');
    }
  }, true);
})();
</script>` : '';

    // Inject console script in head, selector script before </body> so DOM is ready
    let result = originalHtml

    if (result.includes('</head>')) {
      result = result.replace('</head>', `${consoleScript}</head>`)
    } else {
      result = consoleScript + result
    }

    if (elementSelectorScript) {
      if (result.includes('</body>')) {
        result = result.replace('</body>', `${elementSelectorScript}</body>`)
      } else {
        result = result + elementSelectorScript
      }
    }

    return result
  }, [selectMode])

  // Layered generation with phases
  const handleGenerate = async (promptText: string | undefined, ingredients?: StewIngredient[]) => {
    if (!promptText?.trim() && (!ingredients || ingredients.length === 0)) {
      addTerminalLine('error', 'No prompt provided — please describe what you want to build')
      return
    }
    promptText = promptText || ''

    // Check and deduct credits before generation
    const creditCheck = await checkAndDeductCredits('generate_website')
    if (!creditCheck.success) {
      addTerminalLine('error', creditCheck.error || 'Insufficient credits')
      addConsoleLog('error', creditCheck.error || 'Please upgrade to continue generating')
      return
    }

    setIsGenerating(true)
    setBuildPhase('structure')
    setCurrentSteps(buildSteps.map(s => ({ ...s, status: 'pending' })))
    // Stay in preview mode to show the cloud loading screen
    setViewMode('preview')

    addTerminalLine('command', promptText)
    addTerminalLine('ai', '🤖 AI is thinking...')
    addConsoleLog('info', `Starting build: ${promptText.slice(0, 50)}...`)

    try {
      // Phase 1: Structure
      setCurrentSteps(prev => prev.map(s =>
        s.phase === 'structure' ? { ...s, status: 'active' } : s
      ))
      addTerminalLine('phase', '┌ Building in layers...')
      addTerminalLine('info', '│ ○ Creating HTML structure')
      await new Promise(r => setTimeout(r, 400))

      // Phase 2: Styling
      setBuildPhase('styling')
      setCurrentSteps(prev => prev.map(s =>
        s.phase === 'structure' ? { ...s, status: 'complete' } :
        s.phase === 'styling' ? { ...s, status: 'active' } : s
      ))
      addTerminalLine('success', '│ ✓ HTML structure complete')
      addTerminalLine('info', '│ ○ Applying Tailwind CSS')

      // Get the selected style preset for theming
      const preset = stylePresets.find(p => p.id === selectedPreset) || stylePresets[0]

      const res = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          currentHtml: html || undefined,
          skillLevel,
          model: selectedModel.id,
          apiKey: apiKeys[selectedModel.provider] || undefined,
          ingredients: ingredients || stewIngredients.length > 0 ? (ingredients || stewIngredients) : undefined,
          stylePreset: {
            id: preset.id,
            name: preset.name,
            tokens: preset.tokens,
          },
        })
      })

      if (!res.ok) throw new Error('Generation failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let generatedHtml = ''
      let hasShownInteractivity = false

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.html) {
                  generatedHtml = parsed.html
                  setHtml(generatedHtml)

                  if (!hasShownInteractivity && generatedHtml.includes('<script')) {
                    hasShownInteractivity = true
                    setBuildPhase('interactivity')
                    setCurrentSteps(prev => prev.map(s =>
                      s.phase === 'styling' ? { ...s, status: 'complete' } :
                      s.phase === 'interactivity' ? { ...s, status: 'active' } : s
                    ))
                    addTerminalLine('success', '│ ✓ CSS styles applied')
                    addTerminalLine('info', '│ ○ Adding JavaScript')
                  }
                }
              } catch {}
            }
          }
        }
      }

      setBuildPhase('complete')
      setCurrentSteps(prev => prev.map(s => ({ ...s, status: 'complete' })))

      if (!hasShownInteractivity) {
        addTerminalLine('success', '│ ✓ CSS styles applied')
      }
      addTerminalLine('success', '│ ✓ JavaScript added')
      addTerminalLine('success', '└ Build complete!')
      addTerminalLine('info', '')
      addTerminalLine('success', `✨ Generated ${(generatedHtml.length / 1024).toFixed(1)}KB`)

      addToHistory(generatedHtml, promptText)
      addConsoleLog('info', `Build complete: ${(generatedHtml.length / 1024).toFixed(1)}KB`)

      // Cache the generation to prevent token waste on page reload
      localStorage.setItem('webstew-last-generation', JSON.stringify({
        prompt: promptText,
        html: generatedHtml,
        timestamp: Date.now()
      }))

      // Clear prompt from URL to prevent accidental regeneration
      if (searchParams.get('prompt')) {
        router.replace('/workspace', { scroll: false })
      }

      // Show "Your website is ready!" for a moment before revealing
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Now reveal the preview
      setIsGenerating(false)
      setViewMode('preview')
      addToast('success', 'Website generated!')

      // Refresh credits after generation
      fetchCredits()

      // Reset build phase after a delay
      setTimeout(() => setBuildPhase('idle'), 500)

    } catch (error) {
      console.error('Generation error:', error)
      addTerminalLine('error', '└ Build failed. Please try again.')
      addConsoleLog('error', 'Build failed')
      addToast('error', 'Generation failed. Please try again.')
      setBuildPhase('idle')
      setIsGenerating(false)
    }
  }

  // Quick edit for simple text changes without full regeneration
  const handleQuickEdit = (newText: string): boolean => {
    if (!selectedElement || !html) return false

    const tag = selectedElement.tagName.toLowerCase()
    const oldText = selectedElement.textContent?.slice(0, 100) || ''

    // Only quick edit for simple text elements
    if (!['h1','h2','h3','h4','h5','h6','p','span','a','button','label'].includes(tag)) {
      return false
    }

    // Try to find and replace the text in the HTML
    // Look for the element with matching text
    const escapedOldText = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(<${tag}[^>]*>)([^<]*${escapedOldText}[^<]*)(</${tag}>)`, 'i')

    if (regex.test(html)) {
      const newHtml = html.replace(regex, (match, openTag, content, closeTag) => {
        return openTag + content.replace(oldText, newText) + closeTag
      })

      if (newHtml !== html) {
        setHtml(newHtml)
        addToHistory(newHtml, `Quick edit: "${oldText}" → "${newText}"`)
        addConsoleLog('success', `Quick edit applied: "${newText.slice(0, 30)}..."`)
        setSelectedElement(null)
        setSelectMode(false)
        return true
      }
    }

    return false
  }

  // Simple delete - just remove the outerHTML from the page
  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement || !html) return false

    const outerHtml = selectedElement.outerHTML
    const tag = selectedElement.tagName?.toLowerCase() || 'element'

    // Don't delete critical elements
    if (['HTML', 'BODY', 'HEAD'].includes(selectedElement.tagName)) {
      addConsoleLog('warn', 'Cannot delete page structure')
      return false
    }

    // Simple: just remove the outerHTML
    if (outerHtml && html.includes(outerHtml)) {
      const newHtml = html.replace(outerHtml, '')
      setHtml(newHtml)
      addToHistory(newHtml, `Deleted <${tag}>`)
      addConsoleLog('success', `Deleted <${tag}>`)
      setSelectedElement(null)
      setSelectMode(false)
      return true
    }

    addConsoleLog('warn', 'Could not find element to delete')
    return false
  }, [html, selectedElement, addConsoleLog, addToHistory])

  // Keyboard: Delete/Backspace to delete, Escape to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing
      const activeEl = document.activeElement
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || (activeEl as HTMLElement)?.isContentEditable) return

      // Global shortcuts (work without selected element)
      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl + Z = Undo
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          handleUndo()
          return
        }
        // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y = Redo
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          handleRedo()
          return
        }
        // Cmd/Ctrl + S = Save
        if (e.key === 's') {
          e.preventDefault()
          saveProject?.()
          return
        }
        // Cmd/Ctrl + P = Preview (toggle)
        if (e.key === 'p') {
          e.preventDefault()
          setViewMode(prev => prev === 'preview' ? 'split' : 'preview')
          return
        }
        // Cmd/Ctrl + Shift + P = Code mode
        if (e.key === 'P' || (e.key === 'p' && e.shiftKey)) {
          e.preventDefault()
          setViewMode('code')
          return
        }
        // Cmd/Ctrl + / = Show keyboard shortcuts
        if (e.key === '/') {
          e.preventDefault()
          setShowShortcuts(prev => !prev)
          return
        }
      }

      // ? key (without modifier) = Show shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowShortcuts(prev => !prev)
        return
      }

      // Selected element shortcuts
      if (!selectedElement) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelectedElement()
      }
      if (e.key === 'Escape') {
        setSelectedElement(null)
        setSelectMode(false)
      }
      // Cmd/Ctrl + D = Duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        if (selectedElement?.outerHTML && html) {
          const newHtml = html.replace(selectedElement.outerHTML, selectedElement.outerHTML + selectedElement.outerHTML)
          if (newHtml !== html) {
            setHtml(newHtml)
            addToHistory(newHtml, 'Duplicated element')
            addToast('success', 'Element duplicated')
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, deleteSelectedElement, handleUndo, handleRedo, saveProject, html, addToHistory, addToast, setHtml])

  // Command Palette Commands
  interface PaletteCommand {
    id: string
    label: string
    category: 'navigation' | 'view' | 'action' | 'generate' | 'tools'
    icon: typeof Wand2
    shortcut?: string
    action: () => void
  }

  const paletteCommands: PaletteCommand[] = [
    // Navigation
    { id: 'nav-build', label: 'Go to Build', category: 'navigation', icon: Wand2, action: () => setActivePanel('build') },
    { id: 'nav-templates', label: 'Go to Templates', category: 'navigation', icon: Layout, action: () => setActivePanel('templates') },
    { id: 'nav-files', label: 'Go to Files', category: 'navigation', icon: FolderOpen, action: () => setActivePanel('projects') },
    { id: 'nav-images', label: 'Go to Images', category: 'navigation', icon: ImageIcon, action: () => setActivePanel('images') },
    { id: 'nav-video', label: 'Go to Video', category: 'navigation', icon: Film, action: () => setActivePanel('video') },
    { id: 'nav-integrations', label: 'Go to APIs', category: 'navigation', icon: Link2, action: () => setActivePanel('integrations') },
    { id: 'nav-env', label: 'Go to Env Variables', category: 'navigation', icon: Variable, action: () => setActivePanel('env') },
    { id: 'nav-console', label: 'Go to Console', category: 'navigation', icon: Terminal, action: () => setActivePanel('console') },
    { id: 'nav-deploy', label: 'Go to Deploy', category: 'navigation', icon: Rocket, action: () => setActivePanel('deploy') },

    // View
    { id: 'view-preview', label: 'Preview Mode', category: 'view', icon: Eye, action: () => setViewMode('preview') },
    { id: 'view-code', label: 'Code Mode', category: 'view', icon: Code2, action: () => setViewMode('code') },
    { id: 'view-split', label: 'Split Mode', category: 'view', icon: Layers, action: () => setViewMode('split') },
    { id: 'view-desktop', label: 'Desktop View', category: 'view', icon: Monitor, action: () => setDeviceMode('desktop') },
    { id: 'view-tablet', label: 'Tablet View', category: 'view', icon: Tablet, action: () => setDeviceMode('tablet') },
    { id: 'view-mobile', label: 'Mobile View', category: 'view', icon: Smartphone, action: () => setDeviceMode('mobile') },
    { id: 'view-focus', label: 'Toggle Focus Mode', category: 'view', icon: Maximize, shortcut: 'F', action: () => setFocusMode(prev => !prev) },
    { id: 'view-sidebar', label: 'Toggle Sidebar', category: 'view', icon: PanelLeft, action: () => setSidebarCollapsed(prev => !prev) },

    // Actions
    { id: 'action-save', label: 'Save Project', category: 'action', icon: Save, shortcut: '⌘S', action: () => saveProject() },
    { id: 'action-export', label: 'Export Project', category: 'action', icon: FileDown, action: () => setShowExportPanel(true) },
    { id: 'action-undo', label: 'Undo', category: 'action', icon: Undo2, shortcut: '⌘Z', action: () => handleUndo() },
    { id: 'action-redo', label: 'Redo', category: 'action', icon: Redo2, shortcut: '⌘Y', action: () => handleRedo() },
    { id: 'action-refresh', label: 'Refresh Preview', category: 'action', icon: RefreshCw, action: () => iframeRef.current?.contentWindow?.location.reload() },
    { id: 'action-clear', label: 'Clear All', category: 'action', icon: Trash2, action: () => { if (confirm('Clear all content?')) { setHtml(''); setHistory([]); setHistoryIndex(-1) } } },
    { id: 'action-copy', label: 'Copy HTML', category: 'action', icon: Copy, action: () => { navigator.clipboard.writeText(html); addToast('success', 'HTML copied to clipboard') } },

    // Generate
    { id: 'gen-website', label: 'Generate Website...', category: 'generate', icon: Sparkles, action: () => { setActivePanel('build'); setTimeout(() => document.querySelector<HTMLInputElement>('[data-command-input]')?.focus(), 100) } },
    { id: 'gen-image', label: 'Generate Image...', category: 'generate', icon: ImageIcon, action: () => { setActivePanel('images'); setShowImageInsertPanel(true) } },
    { id: 'gen-video', label: 'Generate Video...', category: 'generate', icon: Film, action: () => setActivePanel('video') },

    // Tools
    { id: 'tool-select', label: 'Toggle Select Mode', category: 'tools', icon: MousePointer2, action: () => setSelectMode(prev => !prev) },
    { id: 'tool-theme', label: 'Open Theme Builder', category: 'tools', icon: Palette, action: () => setShowThemeBuilder(true) },
    { id: 'tool-components', label: 'Component Library', category: 'tools', icon: Package, action: () => setActivePanel('templates') },
    { id: 'tool-dark', label: 'Toggle Dark Mode', category: 'tools', icon: Moon, action: () => toggleTheme() },
  ]

  // Filter commands based on search
  const filteredCommands = commandSearch.trim()
    ? paletteCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(commandSearch.toLowerCase()) ||
        cmd.category.toLowerCase().includes(commandSearch.toLowerCase())
      )
    : paletteCommands

  // Execute command
  const executeCommand = (command: PaletteCommand) => {
    command.action()
    setShowCommandPalette(false)
    setCommandSearch('')
    setCommandIndex(0)
  }

  // Command Palette keyboard shortcut
  useEffect(() => {
    const handleCommandPalette = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
        setCommandSearch('')
        setCommandIndex(0)
      }

      // F for focus mode (when not typing)
      if (e.key === 'f' && !showCommandPalette) {
        const activeEl = document.activeElement
        if (activeEl?.tagName !== 'INPUT' && activeEl?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setFocusMode(prev => !prev)
        }
      }

      // Escape to close command palette or context menu
      if (e.key === 'Escape') {
        if (contextMenu.show) {
          setContextMenu(prev => ({ ...prev, show: false }))
        } else if (showCommandPalette) {
          setShowCommandPalette(false)
          setCommandSearch('')
        }
      }

      // Arrow navigation in command palette
      if (showCommandPalette) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setCommandIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setCommandIndex(prev => Math.max(prev - 1, 0))
        }
        if (e.key === 'Enter' && filteredCommands[commandIndex]) {
          e.preventDefault()
          executeCommand(filteredCommands[commandIndex])
        }
      }
    }

    window.addEventListener('keydown', handleCommandPalette)
    return () => window.removeEventListener('keydown', handleCommandPalette)
  }, [showCommandPalette, commandIndex, filteredCommands])

  // Focus command input when palette opens
  useEffect(() => {
    if (showCommandPalette && commandInputRef.current) {
      commandInputRef.current.focus()
    }
  }, [showCommandPalette])

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu.show) return

    const handleClick = () => {
      setContextMenu(prev => ({ ...prev, show: false }))
    }

    // Small delay to prevent immediate close
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick)
    }, 100)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', handleClick)
    }
  }, [contextMenu.show])

  // Close context menu helper
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, show: false }))
  }, [])

  // Context menu actions - simplified and robust
  // Robust element finding and replacement helper
  const findAndReplaceElement = useCallback((
    targetHtml: string,
    element: ContextMenuState['element'],
    replacement: string | ((found: string) => string)
  ): string | null => {
    if (!element) return null

    const outerHTML = element.outerHTML
    let result = targetHtml

    // Strategy 1: Direct exact match
    if (targetHtml.includes(outerHTML)) {
      const newContent = typeof replacement === 'function' ? replacement(outerHTML) : replacement
      // Only replace the first occurrence
      const index = targetHtml.indexOf(outerHTML)
      if (index !== -1) {
        result = targetHtml.slice(0, index) + newContent + targetHtml.slice(index + outerHTML.length)
        return result
      }
    }

    // Strategy 2: Normalize whitespace and try again
    const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
    const normalizedOuter = normalizeWs(outerHTML)
    const normalizedHtml = normalizeWs(targetHtml)

    if (normalizedHtml.includes(normalizedOuter)) {
      // Find original position by matching normalized content
      const lines = targetHtml.split('\n')
      let found = false
      for (let i = 0; i < lines.length && !found; i++) {
        for (let j = i; j < lines.length && !found; j++) {
          const chunk = lines.slice(i, j + 1).join('\n')
          if (normalizeWs(chunk) === normalizedOuter || chunk.includes(outerHTML.slice(0, 50))) {
            const newContent = typeof replacement === 'function' ? replacement(chunk) : replacement
            const before = lines.slice(0, i).join('\n')
            const after = lines.slice(j + 1).join('\n')
            result = before + (before ? '\n' : '') + newContent + (after ? '\n' : '') + after
            return result
          }
        }
      }
    }

    // Strategy 3: Match by tag + key attributes
    const tag = element.tagName.toLowerCase()
    const attrs = element.attributes || {}

    // Build a regex pattern based on the element's attributes
    let pattern = `<${tag}`

    // Add key attributes to pattern
    if (element.id) {
      pattern += `[^>]*id=["']${element.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`
    } else if (element.className) {
      const firstClass = element.className.split(' ')[0]
      if (firstClass) {
        pattern += `[^>]*class=["'][^"']*${firstClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*["']`
      }
    } else if (element.src) {
      pattern += `[^>]*src=["']${element.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`
    } else if (element.href) {
      pattern += `[^>]*href=["']${element.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`
    }

    // Match opening tag and everything until closing tag
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link']
    if (selfClosingTags.includes(tag)) {
      pattern += `[^>]*/?>` // Self-closing
    } else {
      pattern += `[^>]*>[\\s\\S]*?</${tag}>`
    }

    try {
      const regex = new RegExp(pattern, 'i')
      const match = targetHtml.match(regex)
      if (match) {
        const newContent = typeof replacement === 'function' ? replacement(match[0]) : replacement
        result = targetHtml.replace(match[0], newContent)
        return result
      }
    } catch (e) {
      console.error('[Context Menu] Regex failed:', e)
    }

    // Strategy 4: For text-heavy elements, match by text content
    if (element.textContent && element.textContent.length > 10) {
      const escapedText = element.textContent.slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      try {
        const textRegex = new RegExp(`<${tag}[^>]*>[^<]*${escapedText}[^<]*</${tag}>`, 'i')
        const match = targetHtml.match(textRegex)
        if (match) {
          const newContent = typeof replacement === 'function' ? replacement(match[0]) : replacement
          result = targetHtml.replace(match[0], newContent)
          return result
        }
      } catch (e) {
        console.error('[Context Menu] Text regex failed:', e)
      }
    }

    return null // Could not find element
  }, [])

  const contextMenuActions = useMemo(() => ({
    editText: () => {
      if (!contextMenu.element) return
      const newText = prompt('Edit text:', contextMenu.element.textContent || '')
      if (newText !== null && newText !== contextMenu.element.textContent) {
        const result = findAndReplaceElement(html, contextMenu.element, (found) => {
          // Replace inner text while keeping tags
          const tag = contextMenu.element!.tagName.toLowerCase()
          const openTagMatch = found.match(new RegExp(`^<${tag}[^>]*>`))
          if (openTagMatch) {
            return openTagMatch[0] + newText + `</${tag}>`
          }
          return found.replace(contextMenu.element!.textContent || '', newText)
        })
        if (result && result !== html) {
          setHtml(result)
          addToHistory(result, `Edited text`)
          addToast('success', 'Text updated')
        } else {
          addToast('error', 'Could not find element to edit')
        }
      }
      closeContextMenu()
    },

    copyText: () => {
      if (!contextMenu.element?.textContent) return
      navigator.clipboard.writeText(contextMenu.element.textContent)
      addToast('success', 'Text copied to clipboard')
      closeContextMenu()
    },

    replaceImage: () => {
      if (!contextMenu.element?.isImage) return
      setActivePanel('images')
      setSelectedMediaElement({
        type: 'image',
        src: contextMenu.element.src || '',
        outerHTML: contextMenu.element.outerHTML,
        tagName: 'IMG',
        index: 0
      })
      setShowMediaReplacer(true)
      closeContextMenu()
    },

    insertImageAfter: () => {
      if (!contextMenu.element) return
      setActivePanel('images')
      const placeholderImg = `<img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" alt="New image" class="w-full h-48 object-cover rounded-lg my-4" />`

      const containerTags = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'FIGURE']
      const isContainer = containerTags.includes(contextMenu.element.tagName)

      const result = findAndReplaceElement(html, contextMenu.element, (found) => {
        if (isContainer) {
          // Insert inside container before closing tag
          const tag = contextMenu.element!.tagName.toLowerCase()
          const closingTag = `</${tag}>`
          const lastIndex = found.lastIndexOf(closingTag)
          if (lastIndex !== -1) {
            return found.slice(0, lastIndex) + '\n  ' + placeholderImg + '\n' + found.slice(lastIndex)
          }
        }
        // Insert after element
        return found + '\n' + placeholderImg
      })

      if (result && result !== html) {
        setHtml(result)
        addToHistory(result, 'Inserted image')
        addToast('info', 'Image added - drag a new image to replace it')
      } else {
        addToast('error', 'Could not find element to insert after')
      }
      closeContextMenu()
    },

    copyImageUrl: () => {
      if (!contextMenu.element?.src) return
      navigator.clipboard.writeText(contextMenu.element.src)
      addToast('success', 'Image URL copied')
      closeContextMenu()
    },

    openLink: () => {
      if (!contextMenu.element?.href) return
      window.open(contextMenu.element.href, '_blank')
      closeContextMenu()
    },

    editLink: () => {
      if (!contextMenu.element?.href) return
      const newHref = prompt('Edit link URL:', contextMenu.element.href)
      if (newHref && newHref !== contextMenu.element.href) {
        const result = findAndReplaceElement(html, contextMenu.element, (found) => {
          return found.replace(contextMenu.element!.href!, newHref)
        })
        if (result && result !== html) {
          setHtml(result)
          addToHistory(result, 'Updated link')
          addToast('success', 'Link updated')
        } else {
          addToast('error', 'Could not find link to edit')
        }
      }
      closeContextMenu()
    },

    copyHtml: () => {
      if (!contextMenu.element) return
      navigator.clipboard.writeText(contextMenu.element.outerHTML)
      addToast('success', 'HTML copied')
      closeContextMenu()
    },

    duplicate: () => {
      if (!contextMenu.element) return
      const result = findAndReplaceElement(html, contextMenu.element, (found) => {
        return found + '\n' + found
      })
      if (result && result !== html) {
        setHtml(result)
        addToHistory(result, `Duplicated element`)
        addToast('success', 'Element duplicated')
      } else {
        addToast('error', 'Could not find element to duplicate')
      }
      closeContextMenu()
    },

    delete: () => {
      if (!contextMenu.element) return
      const result = findAndReplaceElement(html, contextMenu.element, '')
      if (result && result !== html) {
        setHtml(result)
        addToHistory(result, `Deleted element`)
        addToast('success', 'Element deleted')
      } else {
        addToast('error', 'Could not find element to delete')
      }
      closeContextMenu()
    }
  }), [contextMenu.element, html, closeContextMenu, addToHistory, addToast, setHtml, setActivePanel, setSelectedMediaElement, setShowMediaReplacer, findAndReplaceElement])

  // Escape key to close context menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu.show) {
        closeContextMenu()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [contextMenu.show, closeContextMenu])

  // Calculate smart position for context menu
  const getContextMenuPosition = useCallback(() => {
    const menuWidth = 220
    const menuHeight = 300
    const padding = 10

    let x = contextMenu.x
    let y = contextMenu.y

    // Prevent overflow right
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding
    }

    // Prevent overflow bottom
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding
    }

    // Prevent overflow left/top
    x = Math.max(padding, x)
    y = Math.max(padding, y)

    return { x, y }
  }, [contextMenu.x, contextMenu.y])

  // Handle conversational chat with AI assistant
  const handleChatMessage = async (message: string) => {
    if (!message.trim() || isGenerating) return

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setChatSuggestions([])
    setCommandInput('')

    // Check for quick edit if element is selected
    if (selectedElement) {
      const newText = message.trim()
      if (newText.length > 0 && newText.length < 200 && !newText.includes('<')) {
        if (handleQuickEdit(newText)) {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `Updated the ${selectedElement.tagName.toLowerCase()} element with your text.`
          }])
          return
        }
      }
    }

    try {
      // Call the conversational API with selected model
      const response = await fetch('/api/builder/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: chatMessages.slice(-10), // Last 10 messages for context
          currentHtml: html,
          model: selectedModel.id,
          apiKey: apiKeys[selectedModel.provider] || undefined,
          context: {
            hasWebsite: html.length > 100,
            selectedElement: selectedElement ? {
              tagName: selectedElement.tagName,
              textContent: selectedElement.textContent,
              outerHTML: selectedElement.outerHTML
            } : undefined
          }
        })
      })

      if (response.status === 402) {
        const errBody = await response.json().catch(() => ({}))
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: errBody.message || `You've used your free chat limit. Sign in to keep iterating.`
        }])
        return
      }
      if (!response.ok) throw new Error('Conversation failed')

      const data = await response.json()

      if (data.type === 'clarify' || data.type === 'answer') {
        // AI is asking clarifying questions or answering
        let assistantMessage = data.message

        // Add suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          assistantMessage += '\n\n💡 **Suggestions:** ' + data.suggestions.join(', ')
        }

        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: assistantMessage,
          suggestions: data.suggestedOptions
        }])
        setChatSuggestions(data.suggestedOptions || [])
        if (data.intent) setConversationIntent(data.intent)
      } else if (data.type === 'edit') {
        // AI is making direct edits to the website
        let editMessage = data.message

        // Apply the updated HTML if provided
        if (data.updatedHtml && data.updatedHtml !== html) {
          setHtml(data.updatedHtml)
          addToHistory(data.updatedHtml, 'AI Edit: ' + (data.codeEdits?.[0]?.description || 'Applied changes'))
          addToast('success', 'Changes applied!')

          // Add edit details to message
          if (data.codeEdits && data.codeEdits.length > 0) {
            editMessage += '\n\n✅ **Changes made:**'
            data.codeEdits.forEach((edit: { description: string }) => {
              editMessage += `\n• ${edit.description}`
            })
          }
        } else if (data.codeEdits && data.codeEdits.length > 0) {
          // Try to apply edits manually if updatedHtml wasn't provided
          let newHtml = html
          let appliedCount = 0
          const appliedEdits: string[] = []

          for (const edit of data.codeEdits) {
            let applied = false

            if (edit.type === 'replace' && edit.oldCode && edit.newCode) {
              const oldCode = edit.oldCode
              const newCode = edit.newCode

              // Strategy 1: Direct exact match
              if (newHtml.includes(oldCode)) {
                newHtml = newHtml.replace(oldCode, newCode)
                applied = true
              }

              // Strategy 2: Normalized whitespace match
              if (!applied) {
                const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
                const normalizedOld = normalizeWs(oldCode)

                const lines = newHtml.split('\n')
                for (let i = 0; i < lines.length && !applied; i++) {
                  for (let j = i; j < Math.min(i + 20, lines.length) && !applied; j++) {
                    const chunk = lines.slice(i, j + 1).join('\n')
                    if (normalizeWs(chunk) === normalizedOld) {
                      const before = lines.slice(0, i).join('\n')
                      const after = lines.slice(j + 1).join('\n')
                      newHtml = before + (before ? '\n' : '') + newCode + (after ? '\n' : '') + after
                      applied = true
                    }
                  }
                }
              }

              // Strategy 3: Flexible whitespace regex
              if (!applied) {
                try {
                  const escaped = oldCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                  const flexibleRegex = new RegExp(escaped.replace(/\s+/g, '\\s*'), 'i')
                  const match = newHtml.match(flexibleRegex)
                  if (match) {
                    newHtml = newHtml.replace(match[0], newCode)
                    applied = true
                  }
                } catch (e) {
                  console.error('[Edit] Replace regex failed:', e)
                }
              }

              // Strategy 4: Match by tag + key attributes
              if (!applied) {
                const tagMatch = oldCode.match(/<(\w+)/)
                if (tagMatch) {
                  const tag = tagMatch[1].toLowerCase()
                  const idMatch = oldCode.match(/id=["']([^"']+)["']/)
                  const classMatch = oldCode.match(/class=["']([^"']+)["']/)
                  const srcMatch = oldCode.match(/src=["']([^"']+)["']/)

                  let pattern = `<${tag}`

                  if (idMatch) {
                    pattern += `[^>]*id=["']${idMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`
                  } else if (classMatch) {
                    const firstClass = classMatch[1].split(' ')[0]
                    pattern += `[^>]*class=["'][^"']*${firstClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*["']`
                  } else if (srcMatch) {
                    pattern += `[^>]*src=["'][^"']*${srcMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split('/').pop()}[^"']*["']`
                  }

                  const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link']
                  if (selfClosingTags.includes(tag)) {
                    pattern += `[^>]*/?>`
                  } else {
                    pattern += `[^>]*>[\\s\\S]*?</${tag}>`
                  }

                  try {
                    const regex = new RegExp(pattern, 'i')
                    const match = newHtml.match(regex)
                    if (match) {
                      newHtml = newHtml.replace(match[0], newCode)
                      applied = true
                    }
                  } catch (e) {
                    console.error('[Edit] Replace attribute regex failed:', e)
                  }
                }
              }
            } else if (edit.type === 'style' && edit.oldCode && edit.newCode) {
              // Global class replacement
              if (newHtml.includes(edit.oldCode)) {
                newHtml = newHtml.split(edit.oldCode).join(edit.newCode)
                applied = true
              }
            } else if (edit.type === 'insert' && edit.newCode) {
              const target = edit.target?.toLowerCase() || ''

              if (target.includes('</body>') || target.includes('before body close') || target.includes('end of body')) {
                newHtml = newHtml.replace('</body>', `${edit.newCode}\n</body>`)
                applied = true
              } else if (target.includes('</head>') || target.includes('in head')) {
                newHtml = newHtml.replace('</head>', `${edit.newCode}\n</head>`)
                applied = true
              } else if (target.includes('after header') || target.includes('below header')) {
                newHtml = newHtml.replace(/<\/header>/i, `</header>\n${edit.newCode}`)
                applied = true
              } else if (target.includes('before footer') || target.includes('above footer')) {
                newHtml = newHtml.replace(/<footer/i, `${edit.newCode}\n<footer`)
                applied = true
              } else if (target.includes('after nav')) {
                newHtml = newHtml.replace(/<\/nav>/i, `</nav>\n${edit.newCode}`)
                applied = true
              } else if (target.includes('hero') || target.includes('first section')) {
                // Insert after first section or header
                const headerEnd = newHtml.indexOf('</header>')
                if (headerEnd > -1) {
                  newHtml = newHtml.slice(0, headerEnd + 9) + '\n' + edit.newCode + newHtml.slice(headerEnd + 9)
                  applied = true
                }
              } else {
                // Default: insert before </body>
                newHtml = newHtml.replace('</body>', `${edit.newCode}\n</body>`)
                applied = true
              }
            } else if (edit.type === 'delete' && edit.oldCode) {
              // Robust delete with multiple strategies
              const oldCode = edit.oldCode

              // Strategy 1: Direct exact match
              if (newHtml.includes(oldCode)) {
                newHtml = newHtml.replace(oldCode, '')
                applied = true
              }

              // Strategy 2: Normalized whitespace match
              if (!applied) {
                const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
                const normalizedOld = normalizeWs(oldCode)

                // Split HTML into chunks and find matching section
                const lines = newHtml.split('\n')
                for (let i = 0; i < lines.length && !applied; i++) {
                  for (let j = i; j < Math.min(i + 20, lines.length) && !applied; j++) {
                    const chunk = lines.slice(i, j + 1).join('\n')
                    if (normalizeWs(chunk) === normalizedOld) {
                      const before = lines.slice(0, i).join('\n')
                      const after = lines.slice(j + 1).join('\n')
                      newHtml = before + (before && after ? '\n' : '') + after
                      applied = true
                    }
                  }
                }
              }

              // Strategy 3: Match by tag and key attributes
              if (!applied) {
                const tagMatch = oldCode.match(/<(\w+)/)
                if (tagMatch) {
                  const tag = tagMatch[1].toLowerCase()

                  // Extract key attributes
                  const idMatch = oldCode.match(/id=["']([^"']+)["']/)
                  const classMatch = oldCode.match(/class=["']([^"']+)["']/)
                  const srcMatch = oldCode.match(/src=["']([^"']+)["']/)

                  let pattern = `<${tag}`

                  if (idMatch) {
                    pattern += `[^>]*id=["']${idMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`
                  } else if (classMatch) {
                    const firstClass = classMatch[1].split(' ')[0]
                    pattern += `[^>]*class=["'][^"']*${firstClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*["']`
                  } else if (srcMatch) {
                    pattern += `[^>]*src=["'][^"']*${srcMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split('/').pop()}[^"']*["']`
                  }

                  // Match opening tag to closing tag
                  const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link']
                  if (selfClosingTags.includes(tag)) {
                    pattern += `[^>]*/?>`
                  } else {
                    pattern += `[^>]*>[\\s\\S]*?</${tag}>`
                  }

                  try {
                    const regex = new RegExp(pattern, 'i')
                    const match = newHtml.match(regex)
                    if (match) {
                      newHtml = newHtml.replace(match[0], '')
                      applied = true
                    }
                  } catch (e) {
                    console.error('[Edit] Delete regex failed:', e)
                  }
                }
              }

              // Strategy 4: Match by text content for text-heavy elements
              if (!applied) {
                const textMatch = oldCode.match(/>([^<]{10,50})/)
                const tagMatch = oldCode.match(/<(\w+)/)
                if (textMatch && tagMatch) {
                  const text = textMatch[1].trim()
                  const tag = tagMatch[1].toLowerCase()
                  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                  try {
                    const textRegex = new RegExp(`<${tag}[^>]*>[^<]*${escapedText}[\\s\\S]*?</${tag}>`, 'i')
                    const match = newHtml.match(textRegex)
                    if (match) {
                      newHtml = newHtml.replace(match[0], '')
                      applied = true
                    }
                  } catch (e) {
                    console.error('[Edit] Text regex failed:', e)
                  }
                }
              }
            }

            // Special handling for background image edits
            const descLower = edit.description?.toLowerCase() || ''
            if (!applied && (descLower.includes('background') || descLower.includes('hero') || descLower.includes('header'))) {
              // Try to add/modify background style on hero, header, or first sections
              const bgImageMatch = edit.newCode?.match(/url\(['"](.*?)['"]\)/) ||
                                   edit.newCode?.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp|svg)/i) ||
                                   edit.newCode?.match(/https?:\/\/images\.unsplash\.com[^\s"'<>]+/)
              if (bgImageMatch) {
                const imageUrl = bgImageMatch[1] || bgImageMatch[0]

                // Try multiple selectors: hero section, first section, header
                const selectors = [
                  /<section[^>]*class="([^"]*(?:hero|banner)[^"]*)"[^>]*>/i,
                  /<header[^>]*class="([^"]*)"[^>]*>/i,
                  /<section[^>]*class="([^"]*)"[^>]*>/i,
                  /<div[^>]*class="([^"]*(?:hero|banner|header)[^"]*)"[^>]*>/i
                ]

                for (const selector of selectors) {
                  const match = newHtml.match(selector)
                  if (match) {
                    const fullMatch = match[0]
                    const oldClass = match[1]

                    // Check if already has background-image
                    if (fullMatch.includes('background-image')) {
                      // Replace existing background-image
                      const updated = fullMatch.replace(/background-image:\s*url\([^)]+\)/, `background-image: url('${imageUrl}')`)
                      newHtml = newHtml.replace(fullMatch, updated)
                    } else if (fullMatch.includes('style="')) {
                      // Add to existing style
                      const updated = fullMatch.replace(/style="([^"]*)"/, `style="$1; background-image: url('${imageUrl}'); background-size: cover; background-position: center;"`)
                      newHtml = newHtml.replace(fullMatch, updated)
                    } else {
                      // Add new style attribute
                      const newClass = oldClass.includes('bg-cover') ? oldClass : oldClass + ' bg-cover bg-center relative'
                      const updated = fullMatch.replace(`class="${oldClass}"`, `class="${newClass}" style="background-image: url('${imageUrl}')"`)
                      newHtml = newHtml.replace(fullMatch, updated)
                    }
                    applied = true
                    break
                  }
                }
              }
            }

            if (applied) {
              appliedCount++
              appliedEdits.push(edit.description || 'Applied change')
            }
          }

          if (newHtml !== html && appliedCount > 0) {
            setHtml(newHtml)
            addToHistory(newHtml, 'AI Edit: ' + appliedEdits[0])
            addToast('success', `Applied ${appliedCount} change${appliedCount > 1 ? 's' : ''}!`)

            editMessage += '\n\n✅ **Changes made:**'
            appliedEdits.forEach((desc) => {
              editMessage += `\n• ${desc}`
            })
          } else {
            // If edits failed, offer to regenerate the section
            editMessage += '\n\n⚠️ I couldn\'t apply the exact edit. Would you like me to regenerate the section instead? Just say "regenerate the hero section" or select the element you want to change.'
          }
        }

        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: editMessage
        }])
        setConversationIntent(null)
      } else if (data.type === 'ready') {
        // We have enough context - proceed with generation
        const intent = data.intent
        const enhancedPrompt = data.enhancedPrompt

        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message
        }])
        setConversationIntent(null)

        // Trigger the appropriate generation
        if (intent === 'website' || intent === 'edit') {
          handleGenerate(enhancedPrompt)
        } else if (intent === 'image') {
          // Trigger image generation
          setActivePanel('images')
          setImagePrompt(enhancedPrompt)
          // Auto-trigger image generation
          setTimeout(() => {
            handleImageGenerate(enhancedPrompt)
          }, 500)
        } else if (intent === 'video') {
          // Trigger video generation
          setActivePanel('video')
          setVideoPrompt(enhancedPrompt)
          // Auto-trigger video generation
          setTimeout(() => {
            handleVideoGenerate(enhancedPrompt)
          }, 500)
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you try again?'
      }])
    }

    // Scroll to bottom of chat
    setTimeout(() => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }, 100)
  }

  // Image generation handler for conversational flow
  const handleImageGenerate = async (prompt: string) => {
    setImageGenerating(true)
    addConsoleLog('info', `Generating image: ${prompt.slice(0, 50)}...`)

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt,
          style: imageStyle,
          aspectRatio: imageAspectRatio
        })
      })

      if (!response.ok) throw new Error('Image generation failed')

      const data = await response.json()
      if (data.output) {
        const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output
        setGeneratedImageUrl(imageUrl)
        addConsoleLog('success', 'Image generated successfully!')
        addToast('success', 'Image generated!')
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `Your image has been generated! Check the Media panel to see it and add it to your site.`
        }])
      }
    } catch (error) {
      addConsoleLog('error', 'Image generation failed')
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Image generation failed. Please try again with a different prompt.'
      }])
    } finally {
      setImageGenerating(false)
    }
  }

  // Video generation handler for conversational flow
  const handleVideoGenerate = async (prompt: string) => {
    setVideoGenerating(true)
    setVideoStatus('Starting video generation...')
    setVideoError('')
    addConsoleLog('info', `Generating video: ${prompt.slice(0, 50)}...`)

    try {
      const response = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'text-to-video',
          prompt,
          model: 'animate-diff',
          duration: 4,
          fps: 8
        })
      })

      if (!response.ok) throw new Error('Video generation failed')

      const data = await response.json()
      if (data.output) {
        const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output
        setGeneratedVideoUrl(videoUrl)
        setVideoStatus('Video generated successfully!')
        addConsoleLog('success', 'Video generated successfully!')
        addToast('success', 'Video generated!')
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `Your video has been generated! Check the Video panel to preview it and add it to your site.`
        }])
      }
    } catch (error) {
      setVideoError('Video generation failed. Please try again.')
      addConsoleLog('error', 'Video generation failed')
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Video generation failed. Please try again with a different prompt.'
      }])
    } finally {
      setVideoGenerating(false)
    }
  }

  const handleCommandSubmit = () => {
    if (!commandInput.trim() || isGenerating) return
    handleChatMessage(commandInput)
  }

  const handleExport = () => {
    if (!html.trim()) {
      addConsoleLog('error', 'No content to export')
      return
    }
    // Open the export panel with full options
    setShowExportPanel(true)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(html)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
    addConsoleLog('info', 'Code copied to clipboard')
    addToast('success', 'Code copied to clipboard')
  }

  const clearConsole = () => {
    setConsoleLogs([{ type: 'info', message: 'Console cleared', timestamp: new Date() }])
  }

  // Image Editor functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const newImage: ImageEdit = {
          id: generateId(),
          url: reader.result as string,
          name: file.name,
          operation: null,
          status: 'idle'
        }
        setImageEdits(prev => [...prev, newImage])
        addConsoleLog('info', `Uploaded: ${file.name}`)
      }
      reader.readAsDataURL(file)
    })
  }

  const processImage = async (imageId: string, operation: 'remove-bg' | 'to-video' | 'enhance') => {
    setImageEdits(prev => prev.map(img =>
      img.id === imageId ? { ...img, operation, status: 'processing' } : img
    ))

    addConsoleLog('info', `Processing: ${operation}`)
    addTerminalLine('info', `Starting ${operation} on image...`)

    try {
      const image = imageEdits.find(img => img.id === imageId)
      if (!image) return

      let response
      let result

      if (operation === 'to-video') {
        // Use our video generation API
        addTerminalLine('info', 'Converting image to video (this may take 1-3 minutes)...')
        response = await fetch('/api/ai/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'image-to-video',
            imageUrl: image.url,
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Video generation failed')
        }

        result = await response.json()
        const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output

        setImageEdits(prev => prev.map(img =>
          img.id === imageId ? { ...img, status: 'complete', result: videoUrl } : img
        ))
      } else {
        // Use image processing API for remove-bg and enhance
        response = await fetch('/api/ai/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: operation,
            imageUrl: image.url,
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Image processing failed')
        }

        result = await response.json()
        const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output

        setImageEdits(prev => prev.map(img =>
          img.id === imageId ? { ...img, status: 'complete', result: outputUrl } : img
        ))
      }

      addConsoleLog('info', `${operation} complete`)
      addTerminalLine('success', `✓ ${operation} complete`)
    } catch (error) {
      setImageEdits(prev => prev.map(img =>
        img.id === imageId ? { ...img, status: 'error' } : img
      ))
      const errorMsg = error instanceof Error ? error.message : String(error)
      addConsoleLog('error', `${operation} failed: ${errorMsg}`)
      addTerminalLine('error', `${operation} failed: ${errorMsg}`)
    }
  }

  const removeImage = (imageId: string) => {
    setImageEdits(prev => prev.filter(img => img.id !== imageId))
    if (selectedImage?.id === imageId) setSelectedImage(null)
  }

  // Extract all images from current HTML
  const extractWebsiteImages = useCallback(() => {
    if (!html) return []
    const images: { src: string; index: number; context: string }[] = []
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
    let match
    let index = 0
    while ((match = imgRegex.exec(html)) !== null) {
      // Try to determine context from surrounding HTML
      const start = Math.max(0, match.index - 100)
      const context = html.slice(start, match.index)
      let contextLabel = 'Image'
      if (context.includes('hero') || context.includes('Hero')) contextLabel = 'Hero'
      else if (context.includes('menu') || context.includes('Menu')) contextLabel = 'Menu'
      else if (context.includes('product') || context.includes('Product')) contextLabel = 'Product'
      else if (context.includes('team') || context.includes('Team')) contextLabel = 'Team'
      else if (context.includes('gallery') || context.includes('Gallery')) contextLabel = 'Gallery'
      else if (context.includes('footer') || context.includes('Footer')) contextLabel = 'Footer'
      else if (context.includes('about') || context.includes('About')) contextLabel = 'About'
      images.push({ src: match[1], index, context: contextLabel })
      index++
    }
    return images
  }, [html])

  // Get size classes based on selected size
  const getImageSizeClasses = (size: typeof imageInsertSize) => {
    switch (size) {
      case 'thumbnail': return 'w-20 h-20 object-cover rounded'
      case 'small': return 'w-48 h-auto rounded-lg'
      case 'medium': return 'w-full max-w-md h-auto rounded-lg shadow-lg'
      case 'large': return 'w-full max-w-2xl h-auto rounded-xl shadow-xl'
      case 'full': return 'w-full h-auto'
      default: return 'w-full max-w-md h-auto rounded-lg'
    }
  }

  // Open smart image insertion panel
  const openImageInsertPanel = (imageUrl: string, imageName: string = 'Image') => {
    if (!html) {
      addConsoleLog('warn', 'No website HTML. Generate a website first.')
      return
    }
    setPendingImageUrl(imageUrl)
    setPendingImageName(imageName)
    setWebsiteImages(extractWebsiteImages())
    setShowImageInsertPanel(true)
  }

  // Perform smart image insertion
  const performImageInsertion = (replaceIndex?: number) => {
    if (!html || !pendingImageUrl) return

    const sizeClass = getImageSizeClasses(imageInsertSize)
    let newHtml = html

    if (replaceIndex !== undefined) {
      // Replace specific image by index
      let imgCount = 0
      newHtml = html.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
        if (imgCount === replaceIndex) {
          imgCount++
          // Keep existing classes but update src
          return `<img ${before}src="${pendingImageUrl}"${after}>`
        }
        imgCount++
        return match
      })
      addConsoleLog('success', `Replaced image ${replaceIndex + 1}`)
    } else {
      // Insert new image at selected position
      const imgTag = `<img src="${pendingImageUrl}" alt="${pendingImageName}" class="${sizeClass}" />`
      const wrapper = `<div class="my-6 flex justify-center">${imgTag}</div>`

      switch (imageInsertPosition) {
        case 'hero':
          // Insert at the very beginning of body content
          const bodyMatch = html.match(/<body[^>]*>/i)
          if (bodyMatch) {
            const insertPoint = html.indexOf(bodyMatch[0]) + bodyMatch[0].length
            newHtml = html.slice(0, insertPoint) + `\n${wrapper}\n` + html.slice(insertPoint)
          }
          break
        case 'after-hero':
          // Insert after first section
          const firstSectionEnd = html.indexOf('</section>')
          if (firstSectionEnd !== -1) {
            newHtml = html.slice(0, firstSectionEnd + 10) + `\n${wrapper}\n` + html.slice(firstSectionEnd + 10)
          }
          break
        case 'section':
          // Insert as a new section
          const sectionHtml = `
<section class="py-12 px-4">
  <div class="max-w-4xl mx-auto">
    ${imgTag}
  </div>
</section>`
          const lastSectionEnd = html.lastIndexOf('</section>')
          if (lastSectionEnd !== -1) {
            newHtml = html.slice(0, lastSectionEnd + 10) + sectionHtml + html.slice(lastSectionEnd + 10)
          } else {
            newHtml = html.replace('</body>', `${sectionHtml}\n</body>`)
          }
          break
        case 'footer':
          // Insert just before footer or end of body
          const footerMatch = html.match(/<footer/i)
          if (footerMatch) {
            const insertPoint = html.indexOf(footerMatch[0])
            newHtml = html.slice(0, insertPoint) + `${wrapper}\n` + html.slice(insertPoint)
          } else {
            newHtml = html.replace('</body>', `${wrapper}\n</body>`)
          }
          break
      }
      addConsoleLog('success', `Added image at ${imageInsertPosition}`)
    }

    if (newHtml !== html) {
      setHtml(newHtml)
      addToHistory(newHtml, `Image: ${pendingImageName}`)
    }

    // Reset state
    setShowImageInsertPanel(false)
    setPendingImageUrl(null)
    setPendingImageName('')
    setSelectedMediaElement(null)
  }

  // Quick insert (legacy support) - now opens panel
  const insertImageIntoWebsite = (imageUrl: string, altText: string = 'Image') => {
    if (!html) {
      addConsoleLog('warn', 'No website HTML to insert image into. Generate a website first.')
      return
    }

    // If there's a selected media element, replace it directly
    if (selectedMediaElement && selectedMediaElement.type === 'image') {
      let imgCount = 0
      const newHtml = html.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
        if (imgCount === selectedMediaElement.index) {
          imgCount++
          return `<img ${before}src="${imageUrl}"${after}>`
        }
        imgCount++
        return match
      })
      setHtml(newHtml)
      addToHistory(newHtml, `Replaced image with ${altText}`)
      addConsoleLog('success', `Replaced image ${(selectedMediaElement.index || 0) + 1}`)
      setSelectedMediaElement(null)
      setShowMediaReplacer(false)
    } else {
      // Open the smart insertion panel
      openImageInsertPanel(imageUrl, altText)
    }
  }

  // Copy image URL to clipboard
  const copyImageUrl = (imageUrl: string, label: string) => {
    navigator.clipboard.writeText(imageUrl)
    addConsoleLog('info', `Copied ${label} image URL to clipboard`)
  }

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'mobile': return '375px'
      case 'tablet': return '768px'
      default: return '100%'
    }
  }

  const getConsoleIcon = (type: ConsoleLogType) => {
    switch (type) {
      case 'error': return <XCircle className="w-3.5 h-3.5 text-red-400" />
      case 'warn': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      case 'info': return <Info className="w-3.5 h-3.5 text-blue-400" />
      default: return <Terminal className="w-3.5 h-3.5 text-zinc-400" />
    }
  }

  const filteredLogs = consoleFilter === 'all'
    ? consoleLogs
    : consoleLogs.filter(log => log.type === consoleFilter)

  const currentSuggestions = promptSuggestions[skillLevel]

  return (
    <div className={cn(
      "h-screen flex overflow-hidden transition-colors duration-300",
      isDark ? "bg-[#09090b] text-white" : "bg-white text-slate-900"
    )}>
      {/* Gradient Background Orbs */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-[150px]" />
        </div>
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ width: 380 }}
        animate={{ width: focusMode ? 0 : sidebarCollapsed ? 56 : 380 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative h-full border-r flex flex-col z-10 overflow-hidden",
          isDark ? "border-white/[0.08] bg-zinc-900/95 backdrop-blur-xl" : "border-slate-200 bg-white",
          focusMode && "opacity-0 pointer-events-none"
        )}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Header */}
        <div className={cn(
          "h-14 border-b flex items-center justify-between px-3",
          isDark ? "border-white/[0.08]" : "border-slate-200"
        )}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 flex-1"
            >
              <button
                onClick={() => router.push('/')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isDark ? "hover:bg-white/5 text-zinc-500 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                )}
              >
                <Home className="w-4 h-4" />
              </button>
              <div className={cn("h-5 w-px", isDark ? "bg-white/10" : "bg-slate-200")} />

              {/* Project dropdown */}
              <div className="relative flex-1">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors w-full",
                  isDark ? "hover:bg-white/5" : "hover:bg-slate-100"
                )}>
                  <button
                    onClick={() => setShowProjectsDropdown(!showProjectsDropdown)}
                    className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </button>
                  {editingProjectName ? (
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onBlur={() => setEditingProjectName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingProjectName(false)
                        if (e.key === 'Escape') setEditingProjectName(false)
                      }}
                      autoFocus
                      className={cn(
                        "flex-1 border border-violet-500/50 rounded px-2 py-0.5 text-sm font-medium focus:outline-none",
                        isDark ? "bg-white/5 text-white" : "bg-white text-slate-900"
                      )}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingProjectName(true)}
                      className={cn(
                        "text-sm font-medium truncate flex-1 text-left transition-colors",
                        isDark ? "text-white hover:text-violet-400" : "text-slate-900 hover:text-violet-600"
                      )}
                      title="Click to rename project"
                    >
                      {projectName}
                    </button>
                  )}
                  <button onClick={() => setShowProjectsDropdown(!showProjectsDropdown)}>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-zinc-500" : "text-slate-400", showProjectsDropdown && "rotate-180")} />
                  </button>
                </div>

                <AnimatePresence>
                  {showProjectsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl overflow-hidden z-50 border",
                        isDark ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"
                      )}
                    >
                      <div className={cn("p-2 border-b", isDark ? "border-white/10" : "border-slate-100")}>
                        <button
                          onClick={newProject}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-violet-500 text-sm",
                            isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                          )}
                        >
                          <Plus className="w-4 h-4" />
                          New Project
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {projects.length === 0 ? (
                          <p className={cn("text-xs text-center py-4", isDark ? "text-zinc-600" : "text-slate-400")}>No saved projects</p>
                        ) : (
                          projects.map(project => (
                            <div
                              key={project.id}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg group",
                                isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                              )}
                            >
                              <button
                                onClick={() => loadProject(project)}
                                className="flex-1 text-left"
                              >
                                <div className={cn("text-sm", isDark ? "text-white" : "text-slate-900")}>{project.name}</div>
                                <div className={cn("text-[10px]", isDark ? "text-zinc-600" : "text-slate-400")}>
                                  {new Date(project.updatedAt).toLocaleDateString()}
                                </div>
                              </button>
                              <button
                                onClick={() => deleteProject(project.id)}
                                className={cn(
                                  "p-1.5 rounded hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all",
                                  isDark ? "text-zinc-600" : "text-slate-400"
                                )}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Save button */}
              <button
                onClick={saveProject}
                disabled={!html}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  html
                    ? isDark ? "hover:bg-white/5 text-zinc-500 hover:text-emerald-400" : "hover:bg-slate-100 text-slate-500 hover:text-emerald-600"
                    : isDark ? "text-zinc-700" : "text-slate-300"
                )}
              >
                <Save className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark ? "hover:bg-white/5 text-zinc-500 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            )}
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Skill Level Selector */}
        {!sidebarCollapsed && (
          <div className={cn("p-3 border-b", isDark ? "border-white/[0.08]" : "border-slate-200")}>
            <div className={cn(
              "grid grid-cols-3 gap-1 p-1 rounded-xl border",
              isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-slate-100/50 border-slate-200"
            )}>
              {(['no-code', 'low-code', 'full-stack'] as SkillLevel[]).map((level) => {
                const config = promptSuggestions[level]
                const Icon = config.icon
                return (
                  <button
                    key={level}
                    onClick={() => setSkillLevel(level)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-[10px] font-medium transition-all',
                      skillLevel === level
                        ? isDark
                          ? 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-white border border-violet-500/30'
                          : 'bg-white text-violet-700 border border-violet-300 shadow-sm'
                        : isDark
                          ? 'text-zinc-500 hover:text-white hover:bg-white/5'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Panel Tabs - Horizontal Scrolling Gallery */}
        {!sidebarCollapsed && (
          <div className={cn("relative border-b", isDark ? "border-white/[0.08]" : "border-slate-200")}>
            {/* Scroll gradient indicators */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-4 z-10 pointer-events-none opacity-50",
              isDark ? "bg-gradient-to-r from-zinc-900 to-transparent" : "bg-gradient-to-r from-slate-50 to-transparent"
            )} />
            <div className={cn(
              "absolute right-0 top-0 bottom-0 w-4 z-10 pointer-events-none opacity-50",
              isDark ? "bg-gradient-to-l from-zinc-900 to-transparent" : "bg-gradient-to-l from-slate-50 to-transparent"
            )} />

            {/* Scrollable tabs container */}
            <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide scroll-smooth">
              {[
                { id: 'build' as Panel, icon: Wand2, label: 'Build', color: 'violet' },
                { id: 'templates' as Panel, icon: Layout, label: 'Templates', tour: 'templates', color: 'blue' },
                { id: 'webstew' as Panel, icon: ChefHat, label: 'Stew', tour: 'webstew', color: 'orange' },
                { id: 'projects' as Panel, icon: FolderOpen, label: 'Files', color: 'emerald' },
                { id: 'integrations' as Panel, icon: Link2, label: 'APIs', color: 'cyan' },
                { id: 'images' as Panel, icon: ImageIcon, label: 'Media', color: 'pink' },
                { id: 'video' as Panel, icon: Film, label: 'Video', color: 'purple' },
                { id: 'env' as Panel, icon: Variable, label: 'Env', color: 'yellow' },
                { id: 'console' as Panel, icon: Terminal, label: 'Log', color: 'green' },
                { id: 'deploy' as Panel, icon: Rocket, label: 'Ship', tour: 'deploy', color: 'red' },
              ].map(({ id, icon: Icon, label, tour, color }) => (
                <button
                  key={id}
                  onClick={() => setActivePanel(id)}
                  data-tour={tour}
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 text-[11px] font-medium transition-all flex items-center gap-1.5 rounded-md whitespace-nowrap',
                    activePanel === id
                      ? `text-${color}-400 bg-${color}-500/15 ring-1 ring-${color}-500/30`
                      : isDark
                        ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  )}
                  style={activePanel === id ? {
                    color: color === 'violet' ? '#a78bfa' :
                           color === 'blue' ? '#60a5fa' :
                           color === 'orange' ? '#fb923c' :
                           color === 'emerald' ? '#34d399' :
                           color === 'cyan' ? '#22d3ee' :
                           color === 'pink' ? '#f472b6' :
                           color === 'purple' ? '#c084fc' :
                           color === 'yellow' ? '#facc15' :
                           color === 'green' ? '#4ade80' :
                           color === 'red' ? '#f87171' : '#a78bfa',
                    backgroundColor: color === 'violet' ? 'rgba(139, 92, 246, 0.15)' :
                                     color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
                                     color === 'orange' ? 'rgba(249, 115, 22, 0.15)' :
                                     color === 'emerald' ? 'rgba(16, 185, 129, 0.15)' :
                                     color === 'cyan' ? 'rgba(6, 182, 212, 0.15)' :
                                     color === 'pink' ? 'rgba(236, 72, 153, 0.15)' :
                                     color === 'purple' ? 'rgba(168, 85, 247, 0.15)' :
                                     color === 'yellow' ? 'rgba(234, 179, 8, 0.15)' :
                                     color === 'green' ? 'rgba(34, 197, 94, 0.15)' :
                                     color === 'red' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                  } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Panel Content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {/* Build Panel */}
            {!sidebarCollapsed && activePanel === 'build' && (
              <motion.div
                key="build"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                {/* Build Progress */}
                <AnimatePresence>
                  {buildPhase !== 'idle' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={cn(
                        "px-3 py-2 border-b",
                        isDark ? "border-white/[0.08] bg-violet-500/5" : "border-slate-200 bg-violet-50"
                      )}
                    >
                      <div className="flex items-center justify-center gap-3">
                        {currentSteps.map((step, i) => (
                          <div key={step.phase} className="flex items-center gap-1.5">
                            <div className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center transition-all text-[10px]',
                              step.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
                              step.status === 'active' ? 'bg-violet-500/20 text-violet-400' :
                              isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-slate-200 text-slate-400'
                            )}>
                              {step.status === 'complete' ? (
                                <Check className="w-3 h-3" />
                              ) : step.status === 'active' ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <step.icon className="w-2.5 h-2.5" />
                              )}
                            </div>
                            {i < currentSteps.length - 1 && (
                              <div className={cn(
                                'w-4 h-0.5 rounded-full',
                                step.status === 'complete' ? 'bg-emerald-500/50' : isDark ? 'bg-zinc-800' : 'bg-slate-200'
                              )} />
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Conversational Chat Interface */}
                <div
                  ref={chatContainerRef}
                  className={cn(
                    "flex-1 min-h-0 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-track-transparent",
                    isDark ? "scrollbar-thumb-zinc-700" : "scrollbar-thumb-slate-300"
                  )}
                >
                  {/* Chat Messages */}
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex gap-2',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                        msg.role === 'user'
                          ? isDark
                            ? 'bg-violet-500/20 text-violet-100 rounded-br-sm'
                            : 'bg-violet-500 text-white rounded-br-sm'
                          : isDark
                            ? 'bg-zinc-800/80 text-zinc-100 rounded-bl-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      )}>
                        {/* Render markdown-like content */}
                        <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
                          {msg.content.split('\n').map((line, lineIdx) => {
                            // Bold text
                            const boldParsed = line.replace(/\*\*([^*]+)\*\*/g, `<strong class="${isDark ? 'text-white' : 'text-slate-900'} font-semibold">$1</strong>`)
                            // Bullet points
                            if (line.startsWith('• ') || line.startsWith('- ')) {
                              return (
                                <div key={lineIdx} className="flex gap-2 ml-1">
                                  <span className="text-violet-400">•</span>
                                  <span dangerouslySetInnerHTML={{ __html: boldParsed.replace(/^[•-]\s*/, '') }} />
                                </div>
                              )
                            }
                            // Numbered list
                            if (/^\d+\.\s/.test(line)) {
                              return (
                                <div key={lineIdx} className="flex gap-2 ml-1">
                                  <span className="text-violet-400">{line.match(/^\d+/)?.[0]}.</span>
                                  <span dangerouslySetInnerHTML={{ __html: boldParsed.replace(/^\d+\.\s*/, '') }} />
                                </div>
                              )
                            }
                            return <div key={lineIdx} dangerouslySetInnerHTML={{ __html: boldParsed }} />
                          })}
                        </div>

                        {/* Suggestion buttons for this message */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-white/10">
                            {msg.suggestions.map((suggestion, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => handleChatMessage(suggestion)}
                                className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 hover:text-violet-200 transition-all border border-violet-500/20"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Generation Progress */}
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                      <div className={cn(
                        "rounded-2xl rounded-bl-sm px-3 py-2",
                        isDark ? "bg-zinc-800/80" : "bg-slate-100"
                      )}>
                        <div className={cn("flex items-center gap-2 text-sm", isDark ? "text-violet-300" : "text-violet-600")}>
                          <span className="animate-pulse">Creating your {conversationIntent || 'content'}...</span>
                        </div>
                        {/* Build steps */}
                        <div className="mt-2 space-y-1">
                          {currentSteps.map((step) => (
                            <div key={step.phase} className="flex items-center gap-2 text-[11px]">
                              {step.status === 'complete' ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : step.status === 'active' ? (
                                <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                              ) : (
                                <div className={cn("w-3 h-3 rounded-full border", isDark ? "border-zinc-600" : "border-slate-300")} />
                              )}
                              <span className={cn(
                                step.status === 'complete' ? 'text-emerald-400' :
                                step.status === 'active' ? 'text-violet-300' :
                                'text-zinc-500'
                              )}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick action suggestions at bottom */}
                  {chatSuggestions.length > 0 && !isGenerating && chatMessages.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-1.5 pt-2"
                    >
                      {chatSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleChatMessage(suggestion)}
                          className={cn(
                            "px-2.5 py-1 text-[11px] font-medium rounded-full transition-all",
                            isDark
                              ? "bg-white/5 text-zinc-400 border border-white/10 hover:bg-violet-500/20 hover:text-violet-300 hover:border-violet-500/30"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300"
                          )}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Quick Start Templates - Only show initially */}
                  {(chatMessages.length === 1 || !html) && !isGenerating && (
                    <div className="pt-4 space-y-4">
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider mb-2", isDark ? "text-zinc-500" : "text-slate-500")}>Quick Start</p>
                        <div className="grid grid-cols-2 gap-2">
                          {quickStartTemplates.slice(0, 4).map((template) => {
                            const Icon = template.icon
                            return (
                              <button
                                key={template.id}
                                onClick={() => {
                                  if (template.htmlTemplate && template.isPremade) {
                                    setHtml(template.htmlTemplate)
                                    setViewMode('preview')
                                    setChatMessages(prev => [...prev, {
                                      role: 'assistant',
                                      content: `Loaded the "${template.label}" template! You can now customize it by telling me what changes you'd like to make.`
                                    }])
                                    addToHistory(template.htmlTemplate, `Loaded ${template.label} template`)
                                  } else {
                                    handleChatMessage(`Build me a ${template.label.toLowerCase()}`)
                                  }
                                }}
                                className={cn(
                                  "group relative p-3 rounded-xl transition-all text-left overflow-hidden border",
                                  isDark
                                    ? "bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.05] hover:border-white/[0.15]"
                                    : "bg-white border-slate-200 hover:border-violet-300 hover:shadow-md"
                                )}
                              >
                                <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                {template.isPremade && (
                                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                                    INSTANT
                                  </span>
                                )}
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center mb-2`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className={cn("text-xs font-medium", isDark ? "text-white" : "text-slate-800")}>{template.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Test Button - Load sample website for testing */}
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/test-website')
                            const data = await res.json()
                            if (data.html) {
                              setHtml(data.html)
                              setViewMode('preview')
                              setChatMessages(prev => [...prev, {
                                role: 'assistant',
                                content: 'Loaded test website! Try dragging images from the Media panel to replace the images in the preview.'
                              }])
                              addToHistory(data.html, 'Loaded test website')
                            }
                          } catch (e) {
                            console.error('Failed to load test website:', e)
                          }
                        }}
                        className="w-full mt-3 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Load Test Website (for drag-drop testing)
                      </button>
                    </div>
                  )}

                  {/* Always visible test button */}
                  <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/test-website')
                          const data = await res.json()
                          if (data.html) {
                            setHtml(data.html)
                            setViewMode('preview')
                            setChatMessages(prev => [...prev, {
                              role: 'assistant',
                              content: 'Loaded test website! Drag images from Media panel to replace images.'
                            }])
                            addToHistory(data.html, 'Loaded test website')
                          }
                        } catch (e) {
                          console.error('Failed to load test website:', e)
                        }
                      }}
                      className="mx-3 mb-3 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Load Test Website
                    </button>
                </div>

              </motion.div>
            )}

            {/* Templates Panel */}
            {!sidebarCollapsed && activePanel === 'templates' && (
              <motion.div
                key="templates"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-3 space-y-4"
              >
                {/* Quick Start Templates */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-medium text-white">Quick Start</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickStartTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          if (template.isPremade && template.htmlTemplate) {
                            setHtml(template.htmlTemplate)
                            setProjectName(template.label)
                            addTerminalLine('success', `Loaded template: ${template.label}`)
                          } else {
                            setCommandInput(template.prompt)
                            handleGenerate(template.prompt)
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-left group",
                          `bg-gradient-to-br ${template.gradient}/10 border-white/10 hover:border-white/20`
                        )}
                      >
                        <template.icon className="w-5 h-5 text-white/80 mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-medium text-white">{template.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Supabase Templates */}
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                  </div>
                ) : supabaseTemplates.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layout className="w-4 h-4 text-fuchsia-400" />
                      <h3 className="text-sm font-medium text-white">Template Library</h3>
                      <span className="text-[10px] text-zinc-500">({supabaseTemplates.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {supabaseTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => loadSupabaseTemplate(template.id, template.name)}
                          className="group relative rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] hover:border-violet-500/30 transition-all text-left overflow-hidden"
                        >
                          <div className="aspect-video rounded-t-lg overflow-hidden bg-zinc-800">
                            <img
                              src={template.thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                            />
                          </div>
                          <div className="p-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-white text-[10px] font-medium truncate">{template.name}</span>
                              {template.is_premium && (
                                <span className="px-1 py-0.5 text-[7px] font-bold bg-amber-500/20 text-amber-400 rounded">PRO</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500 text-[9px] capitalize">{template.category}</span>
                              {template.industry && (
                                <>
                                  <span className="text-zinc-600 text-[9px]">•</span>
                                  <span className="text-zinc-500 text-[9px] capitalize">{template.industry}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                    <Layout className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">No templates available</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Check your Supabase connection</p>
                  </div>
                )}

                {/* Pro tip */}
                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <p className="text-violet-400 text-[10px] font-medium mb-1">💡 Pro tip</p>
                  <p className="text-zinc-500 text-[10px] leading-relaxed">
                    Quick Start templates generate with AI. Template Library contains pre-made designs that load instantly.
                  </p>
                </div>
              </motion.div>
            )}

            {/* WebStew Panel */}
            {!sidebarCollapsed && activePanel === 'webstew' && (
              <motion.div
                key="webstew"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <WebStewPanel
                  ingredients={stewIngredients}
                  onIngredientsChange={setStewIngredients}
                  onGenerateWithStew={(ingredients) => {
                    // Build a prompt from ingredients
                    const textParts: string[] = []
                    const imageParts: string[] = []

                    ingredients.forEach(ing => {
                      if (ing.type === 'text') {
                        textParts.push('Content: ' + ing.content.slice(0, 500))
                      } else if (ing.type === 'document') {
                        textParts.push('Document "' + ing.name + '": ' + (ing.metadata?.extractedText?.slice(0, 500) || 'Content available'))
                      } else if (ing.type === 'image') {
                        imageParts.push((ing.category || 'general') + ': ' + ing.name)
                      } else if (ing.type === 'link') {
                        textParts.push('Reference: ' + ing.content)
                      }
                    })

                    const stewPrompt = 'Create a professional website using these ingredients:\n\n' +
                      textParts.join('\n') + '\n\n' +
                      'Images provided: ' + (imageParts.length > 0 ? imageParts.join(', ') : 'None') + '\n\n' +
                      'Make sure to incorporate ALL the provided content and images into a cohesive, professional design.'

                    handleGenerate(stewPrompt, ingredients)
                    setActivePanel('build')
                  }}
                  isDark={isDark}
                />
              </motion.div>
            )}

            {/* Projects Panel */}
            {!sidebarCollapsed && activePanel === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Saved Projects</span>
                  <button
                    onClick={newProject}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    New
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                    <p className="text-xs text-zinc-600">No saved projects yet</p>
                    <p className="text-[10px] text-zinc-700 mt-1">Build something and save it!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        className={cn(
                          'p-3 rounded-xl border transition-all cursor-pointer',
                          currentProject?.id === project.id
                            ? 'bg-violet-500/10 border-violet-500/30'
                            : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'
                        )}
                        onClick={() => loadProject(project)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">{project.name}</div>
                            <div className="text-[10px] text-zinc-600 mt-0.5">
                              {new Date(project.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteProject(project.id)
                            }}
                            className="p-1.5 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded',
                            project.skillLevel === 'no-code' && 'bg-emerald-500/20 text-emerald-400',
                            project.skillLevel === 'low-code' && 'bg-amber-500/20 text-amber-400',
                            project.skillLevel === 'full-stack' && 'bg-violet-500/20 text-violet-400',
                          )}>
                            {project.skillLevel}
                          </span>
                          <span className="text-[9px] text-zinc-600">
                            {(project.html.length / 1024).toFixed(1)}KB
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Integrations Panel */}
            {!sidebarCollapsed && activePanel === 'integrations' && (
              <motion.div
                key="integrations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto"
              >
                {/* Category Filter */}
                <div className="p-2 border-b border-white/[0.05]">
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                      { id: 'all', label: 'All', icon: Globe },
                      { id: 'database', label: 'DB', icon: Building2 },
                      { id: 'media', label: 'Media', icon: ImageIcon },
                      { id: 'payments', label: 'Pay', icon: CreditCard },
                      { id: 'ecommerce', label: 'Shop', icon: Store },
                      { id: 'communication', label: 'Msg', icon: MessageSquare },
                      { id: 'automation', label: 'Auto', icon: Workflow },
                      { id: 'ai', label: 'AI', icon: Sparkles },
                      { id: 'scheduling', label: 'Cal', icon: Clock },
                      { id: 'auth', label: 'Auth', icon: Lock },
                      { id: 'maps', label: 'Maps', icon: MapPin },
                      { id: 'analytics', label: 'Stats', icon: BarChart3 },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setIntegrationFilter(cat.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap transition-all',
                          integrationFilter === cat.id
                            ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                            : 'bg-white/[0.03] text-zinc-500 hover:text-white border border-transparent'
                        )}
                      >
                        <cat.icon className="w-3 h-3" />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Integrations List */}
                <div className="p-2 space-y-2">
                  {integrations
                    .filter(int => integrationFilter === 'all' || int.category === integrationFilter)
                    .map(integration => (
                      <div
                        key={integration.id}
                        className={cn(
                          'rounded-xl border transition-all',
                          integration.enabled
                            ? 'bg-violet-500/10 border-violet-500/30'
                            : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10'
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              integration.enabled
                                ? 'bg-violet-500/20'
                                : 'bg-white/[0.05]'
                            )}>
                              <integration.icon className={cn(
                                'w-4 h-4',
                                integration.enabled ? 'text-violet-400' : 'text-zinc-500'
                              )} />
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-white">{integration.name}</h4>
                              <p className="text-[10px] text-zinc-500 line-clamp-1">{integration.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setIntegrations(prev => prev.map(int =>
                                int.id === integration.id ? { ...int, enabled: !int.enabled } : int
                              ))
                              if (!integration.enabled) {
                                // Add env keys when enabling
                                integration.envKeys.forEach(envKey => {
                                  if (!envVars.find(e => e.key === envKey.key)) {
                                    setEnvVars(prev => [...prev, {
                                      key: envKey.key,
                                      value: '',
                                      isSecret: envKey.isSecret
                                    }])
                                  }
                                })
                                addConsoleLog('info', `Enabled: ${integration.name}`)
                              }
                            }}
                            className="p-1"
                          >
                            {integration.enabled ? (
                              <ToggleRight className="w-6 h-6 text-violet-400" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-zinc-600" />
                            )}
                          </button>
                        </div>

                        {/* Expanded Config when enabled */}
                        <AnimatePresence>
                          {integration.enabled && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 space-y-2 border-t border-white/[0.05] pt-2">
                                {integration.envKeys.map(envKey => {
                                  const envVar = envVars.find(e => e.key === envKey.key)
                                  return (
                                    <div key={envKey.key}>
                                      <label className="block text-[10px] text-zinc-500 mb-1">
                                        {envKey.label}
                                      </label>
                                      <input
                                        type={envKey.isSecret ? 'password' : 'text'}
                                        value={envVar?.value || ''}
                                        onChange={(e) => {
                                          setEnvVars(prev => prev.map(env =>
                                            env.key === envKey.key ? { ...env, value: e.target.value } : env
                                          ))
                                        }}
                                        placeholder={envKey.placeholder}
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/[0.08] text-[11px] text-white font-mono focus:outline-none focus:border-violet-500/50"
                                      />
                                    </div>
                                  )
                                })}

                                {/* Add to Website button */}
                                <button
                                  onClick={() => {
                                    const snippet = integration.codeSnippet
                                    setCommandInput(`Add ${integration.name} integration to my website. Use this code: ${snippet.slice(0, 200)}...`)
                                    inputRef.current?.focus()
                                    setActivePanel('build')
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-[11px] font-medium transition-colors"
                                >
                                  <Zap className="w-3 h-3" />
                                  Add to Website
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                </div>

                {/* Quick Add Suggestion */}
                <div className="p-3 border-t border-white/[0.05]">
                  <p className="text-[10px] text-zinc-600 text-center">
                    Enable integrations and click "Add to Website" to bake them into your site
                  </p>
                </div>
              </motion.div>
            )}

            {/* Images Panel */}
            {!sidebarCollapsed && activePanel === 'images' && (
              <motion.div
                key="images"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-3 space-y-3"
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Selected Image Indicator */}
                {selectedMediaElement && selectedMediaElement.type === 'image' && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-amber-300">Image Selected</p>
                          <p className="text-[10px] text-amber-400/70 truncate">Click Insert to replace image #{(selectedMediaElement.index || 0) + 1}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMediaElement(null)
                          setShowMediaReplacer(false)
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tip when no image selected */}
                {!selectedMediaElement && html && (
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <p className="text-[10px] text-zinc-500">Enable <span className="text-violet-400">Select Mode</span> in toolbar, then click an image in preview to replace it</p>
                  </div>
                )}

                {/* AI Image Generation */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <label className="block text-xs text-blue-300 mb-2 flex items-center gap-1.5 font-medium">
                    <ImagePlus className="w-3.5 h-3.5" />
                    AI Image Generator
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image... e.g., 'modern office workspace with plants and natural lighting'"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none mb-2"
                  />

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Style</label>
                      <select
                        value={imageStyle}
                        onChange={(e) => setImageStyle(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white focus:outline-none"
                      >
                        <option value="modern">Modern</option>
                        <option value="professional">Professional</option>
                        <option value="creative">Creative</option>
                        <option value="tech">Tech</option>
                        <option value="nature">Nature</option>
                        <option value="luxury">Luxury</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Aspect</label>
                      <select
                        value={imageAspectRatio}
                        onChange={(e) => setImageAspectRatio(e.target.value as '1:1' | '16:9' | '9:16')}
                        className="w-full px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white focus:outline-none"
                      >
                        <option value="16:9">16:9 Wide</option>
                        <option value="1:1">1:1 Square</option>
                        <option value="9:16">9:16 Tall</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!imagePrompt.trim()) return
                      setImageGenerating(true)
                      setGeneratedImageUrl(null)
                      addTerminalLine('info', 'Generating AI image...')
                      try {
                        const response = await fetch('/api/ai/image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'generate',
                            prompt: imagePrompt,
                            style: imageStyle,
                            aspectRatio: imageAspectRatio,
                          })
                        })
                        const data = await response.json()
                        if (data.success && data.output) {
                          const url = Array.isArray(data.output) ? data.output[0] : data.output
                          setGeneratedImageUrl(url)
                          addTerminalLine('success', '✓ Image generated!')
                        } else {
                          throw new Error(data.error || 'Image generation failed')
                        }
                      } catch (error) {
                        const msg = error instanceof Error ? error.message : 'Failed'
                        addTerminalLine('error', `Image generation failed: ${msg}`)
                      }
                      setImageGenerating(false)
                    }}
                    disabled={imageGenerating || !imagePrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-medium transition"
                  >
                    {imageGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Image
                      </>
                    )}
                  </button>

                  {/* Generated Image Preview - Draggable */}
                  {generatedImageUrl && (
                    <div className="mt-3 space-y-2">
                      <div className="relative group">
                        <img
                          src={generatedImageUrl}
                          alt="AI Generated"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', generatedImageUrl)
                            e.dataTransfer.setData('image-url', generatedImageUrl)
                            setDraggedImageUrl(generatedImageUrl)
                            setIsDraggingImage(true)
                            // Notify iframe about drag state
                            iframeRef.current?.contentWindow?.postMessage({ type: 'drag-state', isDragging: true }, '*')
                          }}
                          onDragEnd={() => {
                            setDraggedImageUrl(null)
                            setIsDraggingImage(false)
                            iframeRef.current?.contentWindow?.postMessage({ type: 'drag-state', isDragging: false }, '*')
                          }}
                          className="w-full rounded-lg cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-violet-500/50 transition-all"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-2">
                          <span className="text-white text-[10px] font-medium bg-black/50 px-2 py-1 rounded">
                            Drag to replace an image
                          </span>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => {
                            setGeneratedImageUrl(null)
                            addConsoleLog('info', 'Image removed')
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => insertImageIntoWebsite(generatedImageUrl, 'AI Generated Image')}
                          disabled={!html}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg disabled:opacity-50 text-white text-[10px] font-medium transition",
                            selectedMediaElement
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                              : "bg-emerald-600 hover:bg-emerald-500"
                          )}
                        >
                          {selectedMediaElement ? (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              Replace
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              Add to Site
                            </>
                          )}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(generatedImageUrl)
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = 'ai-generated-image.webp'
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              window.URL.revokeObjectURL(url)
                            } catch {
                              window.open(generatedImageUrl, '_blank')
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-medium transition"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Tools */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const logoPrompt = prompt('Describe your logo (e.g., "minimalist tech startup logo with abstract shapes")')
                      if (logoPrompt) {
                        setImagePrompt(`Logo design: ${logoPrompt}, clean vector style, transparent background, professional branding`)
                        setImageStyle('minimalist')
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-medium text-emerald-300">Logo Generator</span>
                  </button>
                  <button
                    onClick={() => {
                      const iconPrompt = prompt('Describe your icon (e.g., "shopping cart icon for e-commerce")')
                      if (iconPrompt) {
                        setImagePrompt(`Icon: ${iconPrompt}, flat design, single color, minimal, SVG style`)
                        setImageStyle('minimalist')
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Box className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[10px] font-medium text-amber-300">Icon Generator</span>
                  </button>
                  <button
                    onClick={() => {
                      const bannerPrompt = prompt('Describe your banner (e.g., "sale banner with 50% off text")')
                      if (bannerPrompt) {
                        setImagePrompt(`Web banner: ${bannerPrompt}, eye-catching, promotional, modern design`)
                        setImageAspectRatio('16:9')
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <Layout className="w-4 h-4 text-pink-400" />
                    </div>
                    <span className="text-[10px] font-medium text-pink-300">Banner Maker</span>
                  </button>
                  <button
                    onClick={() => {
                      const heroPrompt = prompt('Describe your hero image (e.g., "modern office with happy team")')
                      if (heroPrompt) {
                        setImagePrompt(`Hero image: ${heroPrompt}, high quality, professional photography style, website hero section`)
                        setImageAspectRatio('16:9')
                        setImageStyle('photographic')
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-[10px] font-medium text-violet-300">Hero Image</span>
                  </button>
                </div>

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-zinc-500 hover:text-violet-400"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-sm">Upload Images</span>
                </button>

                {/* Image List */}
                {imageEdits.length === 0 ? (
                  <div className="text-center py-8">
                    <Cloud className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
                    <p className="text-xs text-zinc-600">No images uploaded</p>
                    <p className="text-[10px] text-zinc-700 mt-1">Upload images to remove backgrounds or create videos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {imageEdits.map(image => (
                      <div
                        key={image.id}
                        className={cn(
                          'rounded-xl border overflow-hidden transition-all',
                          selectedImage?.id === image.id
                            ? 'border-violet-500/50 bg-violet-500/5'
                            : 'border-white/[0.05] bg-white/[0.02]'
                        )}
                      >
                        {/* Image Preview - Draggable */}
                        <div
                          className="relative aspect-video cursor-pointer group"
                          onClick={() => setSelectedImage(image)}
                        >
                          <img
                            src={image.result || image.url}
                            alt={image.name}
                            draggable
                            onDragStart={(e) => {
                              const imageUrl = image.result || image.url
                              e.dataTransfer.setData('text/plain', imageUrl)
                              e.dataTransfer.setData('image-url', imageUrl)
                              setDraggedImageUrl(imageUrl)
                              setIsDraggingImage(true)
                              // Notify iframe about drag state
                              iframeRef.current?.contentWindow?.postMessage({ type: 'drag-state', isDragging: true }, '*')
                            }}
                            onDragEnd={() => {
                              setDraggedImageUrl(null)
                              setIsDraggingImage(false)
                              iframeRef.current?.contentWindow?.postMessage({ type: 'drag-state', isDragging: false }, '*')
                            }}
                            className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 pointer-events-none">
                            <span className="text-white text-[10px] font-medium bg-black/50 px-2 py-1 rounded">
                              Drag to replace an image
                            </span>
                          </div>
                          {image.status === 'processing' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="text-center">
                                <motion.div
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <Cloud className="w-8 h-8 text-violet-400 mx-auto" />
                                </motion.div>
                                <p className="text-xs text-violet-300 mt-2">Processing...</p>
                              </div>
                            </div>
                          )}
                          {image.status === 'complete' && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Image Actions */}
                        <div className="p-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white truncate flex-1">{image.name}</span>
                            <button
                              onClick={() => removeImage(image.id)}
                              className="p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={() => processImage(image.id, 'remove-bg')}
                              disabled={image.status === 'processing'}
                              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-violet-500/10 text-zinc-500 hover:text-violet-400 transition-colors disabled:opacity-50"
                            >
                              <Eraser className="w-3.5 h-3.5" />
                              <span className="text-[9px]">Remove BG</span>
                            </button>
                            <button
                              onClick={() => processImage(image.id, 'to-video')}
                              disabled={image.status === 'processing'}
                              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-violet-500/10 text-zinc-500 hover:text-violet-400 transition-colors disabled:opacity-50"
                            >
                              <Film className="w-3.5 h-3.5" />
                              <span className="text-[9px]">To Video</span>
                            </button>
                            <button
                              onClick={() => processImage(image.id, 'enhance')}
                              disabled={image.status === 'processing'}
                              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-violet-500/10 text-zinc-500 hover:text-violet-400 transition-colors disabled:opacity-50"
                            >
                              <Contrast className="w-3.5 h-3.5" />
                              <span className="text-[9px]">Enhance</span>
                            </button>
                          </div>

                          {/* Insert/Replace Button */}
                          <button
                            onClick={() => insertImageIntoWebsite(image.result || image.url, image.name)}
                            disabled={!html}
                            className={cn(
                              "w-full mt-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                              selectedMediaElement
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
                                : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white",
                              !html && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {selectedMediaElement ? (
                              <>
                                <ArrowRight className="w-3.5 h-3.5" />
                                Replace Selected Image
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                Insert into Website
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Video Panel */}
            {!sidebarCollapsed && activePanel === 'video' && (
              <motion.div
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-3 space-y-4"
              >
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <Film className="w-4 h-4" />
                  <span className="font-medium">AI Video Generator</span>
                </div>

                {/* Text to Video */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <label className="block text-sm text-purple-300 mb-3 font-medium">
                    Text to Video
                  </label>
                  <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="Describe your video... e.g., 'ocean waves crashing on a beach at sunset'"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none mb-3"
                  />

                  <div className="mb-3">
                    <label className="block text-xs text-zinc-400 mb-1.5">Model</label>
                    <select
                      value="animate-diff"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="animate-diff">AnimateDiff (Fast, ~60s)</option>
                      <option value="zeroscope">Zeroscope (Quality)</option>
                    </select>
                  </div>

                  <button
                    onClick={async () => {
                      if (!videoPrompt.trim()) return
                      setVideoGenerating(true)
                      setGeneratedVideoUrl(null)
                      setVideoError('')
                      setVideoStatus('Starting video generation...')

                      try {
                        setVideoStatus('Connecting to AI model...')
                        const response = await fetch('/api/ai/video', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'text-to-video',
                            prompt: videoPrompt,
                            model: 'animate-diff',
                          })
                        })

                        setVideoStatus('Processing... this takes ~60 seconds')
                        const data = await response.json()

                        if (data.success && data.output) {
                          const url = Array.isArray(data.output) ? data.output[0] : data.output
                          setGeneratedVideoUrl(url)
                          setVideoStatus('✓ Video ready!')
                          addTerminalLine('success', '✓ Video generated successfully!')
                        } else {
                          throw new Error(data.error || 'Video generation failed')
                        }
                      } catch (error) {
                        const msg = error instanceof Error ? error.message : 'Failed'
                        setVideoError(msg)
                        setVideoStatus('')
                        addTerminalLine('error', `Video generation failed: ${msg}`)
                      }
                      setVideoGenerating(false)
                    }}
                    disabled={videoGenerating || !videoPrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
                  >
                    {videoGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Video
                      </>
                    )}
                  </button>

                  {/* Status Message */}
                  {videoGenerating && videoStatus && (
                    <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2 text-sm text-purple-300">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {videoStatus}
                      </div>
                      <div className="mt-2 text-xs text-zinc-500">
                        AI is creating your video. Please wait...
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {videoError && (
                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="text-sm text-red-400">
                        ✕ {videoError}
                      </div>
                    </div>
                  )}
                </div>

                {/* Generated Video Preview */}
                {generatedVideoUrl && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <label className="block text-xs text-zinc-400 mb-2">Generated Video</label>
                    <video
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full rounded-lg mb-3"
                    />

                    {/* Insert into Website Button */}
                    <button
                      onClick={() => {
                        if (!html) {
                          addTerminalLine('error', 'No website generated yet. Build a website first!')
                          return
                        }
                        const videoHtml = `
<!-- AI Generated Video -->
<div style="width: 100%; max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
  <video
    src="${generatedVideoUrl}"
    controls
    autoplay
    loop
    muted
    playsinline
    style="width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"
  >
    Your browser does not support the video tag.
  </video>
</div>
`
                        // Insert before closing body tag
                        const updatedHtml = html.replace('</body>', `${videoHtml}</body>`)
                        setHtml(updatedHtml)
                        addTerminalLine('success', '✓ Video inserted into website!')
                        setVideoStatus('Video added to your website')
                      }}
                      disabled={!html}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition mb-2"
                    >
                      <Plus className="w-4 h-4" />
                      Insert into Website
                    </button>

                    <div className="flex gap-2">
                      <a
                        href={generatedVideoUrl}
                        download="ai-video.mp4"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedVideoUrl)
                          addTerminalLine('info', 'Video URL copied to clipboard!')
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy URL
                      </button>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-xs text-zinc-400 space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="text-purple-400">•</span>
                      Powered by Replicate AI
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-purple-400">•</span>
                      Generation takes ~60 seconds
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-purple-400">•</span>
                      Output: MP4 video clip
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Env Panel */}
            {!sidebarCollapsed && activePanel === 'env' && (
              <motion.div
                key="env"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-3 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Variable className="w-3.5 h-3.5" />
                  <span>Environment Variables</span>
                </div>

                <div className="space-y-2">
                  {envVars.map((envVar, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={envVar.key}
                          onChange={(e) => setEnvVars(prev => prev.map((v, idx) => idx === i ? { ...v, key: e.target.value } : v))}
                          className="flex-1 bg-transparent text-xs text-violet-400 font-mono focus:outline-none"
                          placeholder="KEY"
                        />
                        <button
                          onClick={() => toggleEnvSecret(envVar.key)}
                          className="p-1 rounded hover:bg-white/5 text-zinc-600"
                        >
                          {envVar.isSecret ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => removeEnvVar(envVar.key)}
                          className="p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type={envVar.isSecret ? 'password' : 'text'}
                        value={envVar.value}
                        onChange={(e) => setEnvVars(prev => prev.map((v, idx) => idx === i ? { ...v, value: e.target.value } : v))}
                        className="w-full bg-zinc-900 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                        placeholder="value"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.1] space-y-2">
                  <input
                    type="text"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                    className="w-full bg-transparent text-xs text-zinc-400 font-mono focus:outline-none"
                    placeholder="NEW_VARIABLE"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEnvValue}
                      onChange={(e) => setNewEnvValue(e.target.value)}
                      className="flex-1 bg-zinc-900 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none"
                      placeholder="value"
                    />
                    <button
                      onClick={addEnvVar}
                      disabled={!newEnvKey.trim()}
                      className="px-3 py-1.5 rounded bg-violet-500/20 text-violet-400 text-xs hover:bg-violet-500/30 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Console Panel */}
            {!sidebarCollapsed && activePanel === 'console' && (
              <motion.div
                key="console"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-1">
                    {(['all', 'log', 'info', 'warn', 'error'] as const).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setConsoleFilter(filter)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] transition-colors',
                          consoleFilter === filter
                            ? 'bg-white/10 text-white'
                            : 'text-zinc-600 hover:text-white'
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={clearConsole}
                    className="p-1 rounded hover:bg-white/5 text-zinc-600 hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                <div
                  ref={consoleRef}
                  className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-0.5"
                >
                  {filteredLogs.map((log, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-2 px-2 py-1 rounded',
                        log.type === 'error' && 'bg-red-500/10',
                        log.type === 'warn' && 'bg-amber-500/10',
                      )}
                    >
                      {getConsoleIcon(log.type)}
                      <span className={cn(
                        'flex-1',
                        log.type === 'error' && 'text-red-400',
                        log.type === 'warn' && 'text-amber-400',
                        log.type === 'info' && 'text-blue-400',
                        log.type === 'log' && 'text-zinc-300',
                      )}>
                        {log.message}
                      </span>
                      <span className="text-zinc-700 text-[9px]">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Deploy Panel */}
            {!sidebarCollapsed && activePanel === 'deploy' && (
              <motion.div
                key="deploy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-3 space-y-4"
              >
                {/* Project Name */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                {/* API Keys */}
                <div className="space-y-2">
                  <label className="block text-xs text-zinc-500 flex items-center gap-1.5">
                    <Key className="w-3 h-3" />
                    API Keys
                  </label>
                  {[
                    { key: 'openaiKey', label: 'OpenAI', placeholder: 'sk-...' },
                    { key: 'githubToken', label: 'GitHub', placeholder: 'ghp_...' },
                    { key: 'renderKey', label: 'Render', placeholder: 'rnd_...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] text-zinc-600 mb-0.5">{label}</label>
                      <input
                        type="password"
                        value={settings[key as keyof WorkspaceSettings]}
                        onChange={(e) => setSettings(s => ({ ...s, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  ))}
                </div>

                {/* Deploy Status */}
                {deployUrl && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Deployed Successfully!
                    </div>
                    <a
                      href={deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-300/80 hover:text-emerald-300 underline break-all"
                    >
                      {deployUrl}
                    </a>
                  </div>
                )}

                {deployError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
                      <AlertCircle className="w-4 h-4" />
                      Deploy Failed
                    </div>
                    <p className="text-xs text-red-300/80">{deployError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={deployToGitHub}
                    disabled={isDeploying || !html.trim()}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
                      isDeploying || !html.trim()
                        ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed"
                        : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
                    )}
                  >
                    {isDeploying && deployStatus === 'github' ? (
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    ) : (
                      <Github className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Push to GitHub</div>
                      <div className="text-[10px] text-zinc-600">
                        {isDeploying && deployStatus === 'github' ? 'Creating repository...' : 'Create repository'}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={deployToRender}
                    disabled={isDeploying || !html.trim()}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                      isDeploying || !html.trim()
                        ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 hover:from-violet-500/20 hover:to-fuchsia-500/20"
                    )}
                  >
                    {isDeploying && deployStatus === 'render' ? (
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    ) : (
                      <Rocket className="w-5 h-5 text-violet-400" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Deploy Live</div>
                      <div className="text-[10px] text-violet-300/60">
                        {isDeploying ? 'Deploying to Render...' : 'One-click deploy'}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowExportPanel(true)}
                    disabled={!html.trim()}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
                      !html.trim()
                        ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed"
                        : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
                    )}
                  >
                    <Download className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Export Project</div>
                      <div className="text-[10px] text-zinc-600">HTML, ZIP, Next.js, or Static</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Docked Chat Input - Always Visible */}
        {!sidebarCollapsed && (
          <div className={cn(
            "p-3 border-t",
            isDark ? "border-white/[0.08] bg-zinc-900/50" : "border-slate-200 bg-slate-50"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                isGenerating
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse'
                  : isDark ? 'bg-white/5' : 'bg-slate-200'
              )}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <MessageSquare className={cn("w-4 h-4", isDark ? "text-zinc-400" : "text-slate-500")} />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
                placeholder={isGenerating ? 'Creating...' : 'Chat with AI...'}
                disabled={isGenerating}
                className={cn(
                  "flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 disabled:opacity-50",
                  isDark
                    ? "bg-white/5 border-white/10 text-white placeholder-zinc-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                )}
              />
              <button
                onClick={handleCommandSubmit}
                disabled={!commandInput.trim() || isGenerating}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  commandInput.trim() && !isGenerating
                    ? 'bg-violet-500 hover:bg-violet-400 text-white'
                    : isDark ? 'bg-white/5 text-zinc-500' : 'bg-slate-200 text-slate-400'
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {/* Model selector */}
            <div className="flex items-center justify-between mt-2 relative">
              <button
                onClick={() => setShowChatModelSelector(!showChatModelSelector)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                  isDark ? "bg-white/5 hover:bg-white/10 text-zinc-400" : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                )}
              >
                {selectedModel.provider === 'anthropic' ? <Brain className="w-3 h-3" /> :
                 selectedModel.provider === 'openai' ? <Bot className="w-3 h-3" /> :
                 selectedModel.provider === 'huggingface' ? <Sparkles className="w-3 h-3" /> :
                 <Sparkles className="w-3 h-3" />}
                <span>{selectedModel.name}</span>
                {selectedModel.free && <span className="text-emerald-400 text-[9px]">FREE</span>}
                <ChevronDown className={cn("w-3 h-3 transition-transform", showChatModelSelector && "rotate-180")} />
              </button>

              {/* Model Dropdown */}
              <AnimatePresence>
                {showChatModelSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 mb-2 w-72 max-h-80 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50"
                  >
                    <div className="p-2 border-b border-white/10">
                      <p className="text-[10px] font-medium text-zinc-400 px-2">Select AI Model</p>
                    </div>
                    <div className="p-1">
                      {/* Free Models — only shown when user has the corresponding provider key configured. Many free providers (HuggingFace, Together, Cloudflare) require user-supplied tokens and frequently have model-deprecation issues, so we hide them by default to avoid silent failures. */}
                      {aiModels.some(m => m.free && apiKeys[m.provider]) && (
                        <div className="px-2 py-1">
                          <p className="text-[9px] font-medium text-emerald-400 uppercase tracking-wide">Free (via your API key)</p>
                        </div>
                      )}
                      {aiModels.filter(m => m.free && apiKeys[m.provider]).map(model => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model)
                            setShowChatModelSelector(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all",
                            selectedModel.id === model.id
                              ? "bg-violet-500/20 text-white"
                              : "hover:bg-white/5 text-zinc-300"
                          )}
                        >
                          <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium truncate">{model.name}</span>
                              <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">FREE</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 truncate">{model.description}</p>
                          </div>
                        </button>
                      ))}

                      {/* Paid Models */}
                      <div className="px-2 py-1 mt-2">
                        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide">Premium Models</p>
                      </div>
                      {aiModels.filter(m => !m.free).map(model => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model)
                            setShowChatModelSelector(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all",
                            selectedModel.id === model.id
                              ? "bg-violet-500/20 text-white"
                              : "hover:bg-white/5 text-zinc-300"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
                            model.provider === 'anthropic' ? "bg-orange-500/20" :
                            model.provider === 'openai' ? "bg-emerald-500/20" :
                            "bg-blue-500/20"
                          )}>
                            {model.provider === 'anthropic' ? <Brain className="w-3 h-3 text-orange-400" /> :
                             model.provider === 'openai' ? <Bot className="w-3 h-3 text-emerald-400" /> :
                             <Sparkles className="w-3 h-3 text-blue-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium truncate block">{model.name}</span>
                            <p className="text-[9px] text-zinc-500 truncate">{model.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {session?.user && userCredits !== null && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium',
                  userCredits < 10 ? 'bg-red-500/10 text-red-400' :
                  userCredits < 50 ? 'bg-amber-500/10 text-amber-400' :
                  'bg-emerald-500/10 text-emerald-400'
                )}>
                  <Coins className="w-3 h-3" />
                  <span>{userCredits}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Bar */}
        {!sidebarCollapsed && (
          <div className="h-7 border-t border-white/[0.08] flex items-center justify-between px-3 text-[10px] text-zinc-600 bg-black/20">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                isGenerating ? 'bg-violet-400 animate-pulse' : 'bg-emerald-400'
              )} />
              <span>{isGenerating ? 'Building...' : 'Ready'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{history.length} versions</span>
              <span>{consoleLogs.filter(l => l.type === 'error').length} errors</span>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Focus Mode Indicator */}
        <AnimatePresence>
          {focusMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 z-[80] flex items-center gap-2"
            >
              <button
                onClick={() => setFocusMode(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs hover:bg-violet-500/30 transition-colors backdrop-blur-sm"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>Focus Mode</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/30 text-[10px]">F</kbd>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar - High z-index so dropdowns appear above preview */}
        <header className={cn(
          "h-12 border-b flex items-center justify-between px-4 backdrop-blur-xl relative z-50",
          isDark ? "border-white/[0.08] bg-zinc-950/95" : "border-slate-200 bg-white/95"
        )}>
          <div className="flex items-center gap-3">
            {/* Device toggles */}
            <div className={cn(
              "flex rounded-lg p-0.5 border",
              isDark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-100 border-slate-200"
            )}>
              {([
                { mode: 'desktop' as DeviceMode, icon: Monitor },
                { mode: 'tablet' as DeviceMode, icon: Tablet },
                { mode: 'mobile' as DeviceMode, icon: Smartphone },
              ]).map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setDeviceMode(mode)}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    deviceMode === mode
                      ? 'bg-violet-500/20 text-violet-400'
                      : isDark ? 'text-zinc-600 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Image Library */}
            <button
              onClick={() => setShowImageLibrary(!showImageLibrary)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                showImageLibrary
                  ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/20'
                  : 'bg-white/[0.03] text-zinc-600 hover:text-fuchsia-400 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/30 hover:shadow-lg hover:shadow-fuchsia-500/20 border border-white/[0.05]'
              )}
              title="Browse image library"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Images</span>
            </button>

            {/* Style Preset Picker - Auto-applies on selection */}
            <div data-tour="styles" className="flex items-center gap-1">
              <StylePresetPicker
                selected={selectedPreset}
                onChange={(preset) => {
                  setSelectedPreset(preset.id)
                  // Auto-apply preset to current HTML in background
                  if (html) {
                    const updatedHtml = applyThemeToHtml(html, preset)
                    setHtml(updatedHtml)
                    addConsoleLog('info', `Theme switched to ${preset.name}`)
                  }
                }}
                compact
              />
              <button
                onClick={() => setShowThemeBuilder(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 transition-all group"
                title="Advanced Theme Builder"
              >
                <Palette className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
              </button>
            </div>

            {/* Component Library */}
            <ComponentPicker
              onInsert={(component) => {
                if (html) {
                  // Insert component before closing body tag
                  const updatedHtml = html.replace(
                    /<\/body>/i,
                    `\n${component.html}\n</body>`
                  )
                  setHtml(updatedHtml)
                  addConsoleLog('info', `Inserted ${component.name} section`)
                } else {
                  // Create new page with this component
                  const newHtml = assemblePage([component.id])
                  setHtml(newHtml)
                  addConsoleLog('info', `Created page with ${component.name}`)
                }
              }}
            />

            <div className="h-4 w-px bg-white/10" />

            {/* View mode */}
            <div className="flex bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.05]">
              {([
                { mode: 'preview' as ViewMode, icon: Eye, label: 'Preview', tour: undefined, color: 'emerald' },
                { mode: 'code' as ViewMode, icon: Code2, label: 'Code', tour: 'code', color: 'blue' },
                { mode: 'split' as ViewMode, icon: Layers, label: 'Split', tour: undefined, color: 'violet' },
              ]).map(({ mode, icon: Icon, label, tour, color }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  data-tour={tour}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                    viewMode === mode
                      ? color === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/20'
                        : color === 'blue'
                          ? 'bg-blue-500/20 text-blue-400 shadow-sm shadow-blue-500/20'
                          : 'bg-violet-500/20 text-violet-400 shadow-sm shadow-violet-500/20'
                      : 'text-zinc-600 hover:text-white hover:bg-white/5'
                  )}
                  title={`Switch to ${label} view`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg hover:bg-violet-500/10 text-zinc-600 hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent disabled:hover:text-zinc-600 transition-all duration-200"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg hover:bg-violet-500/10 text-zinc-600 hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent disabled:hover:text-zinc-600 transition-all duration-200"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => iframeRef.current?.contentWindow?.location.reload()}
              className="p-1.5 rounded-lg hover:bg-blue-500/10 text-zinc-600 hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
              title="Refresh Preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (html && !confirm('Clear the current preview and start fresh?')) return
                setHtml('')
                setHistory([])
                setHistoryIndex(-1)
                setChatMessages([])
                setStewIngredients([])
                addConsoleLog('info', 'Workspace cleared - ready for a fresh start!')
                addTerminalLine('success', '✨ Workspace cleared')
              }}
              disabled={!html}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent disabled:hover:text-zinc-600 transition-all duration-200"
              title="Clear Preview (Start Fresh)"
            >
              <Eraser className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            {/* Command Palette */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="p-1.5 rounded-lg hover:bg-violet-500/10 text-zinc-600 hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-200 flex items-center gap-1"
              title="Command Palette (⌘K)"
            >
              <Command className="w-4 h-4" />
              <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-white/5 text-[9px] text-zinc-500">K</kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-zinc-600 hover:text-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Profile Link */}
            <Link
              href="/profile"
              className="p-1.5 rounded-lg hover:bg-violet-500/10 text-zinc-600 hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-200"
              title="Profile & Settings"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={saveProject}
              disabled={!html}
              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-zinc-600 hover:text-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent disabled:hover:text-zinc-600 transition-all duration-200"
              title="Save Project"
            >
              <Save className="w-4 h-4" />
            </button>

            <button
              onClick={handleExport}
              disabled={!html}
              data-tour="export"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                html
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-zinc-800 text-zinc-600'
              )}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </header>

        {/* Simple Selected Element Bar */}
        <AnimatePresence>
          {selectedElement && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-red-500/10 border-b-2 border-red-500"
            >
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <code className="text-sm text-red-400 font-mono font-bold">
                    &lt;{selectedElement.tagName?.toLowerCase()}&gt;
                  </code>
                  <span className="text-xs text-zinc-400 max-w-[300px] truncate">
                    {selectedElement.textContent?.slice(0, 50) || 'selected'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => deleteSelectedElement()}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold transition-all"
                  >
                    <Trash className="w-4 h-4" />
                    DELETE
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={() => {
                      setSelectedElement(null)
                      setSelectMode(false)
                    }}
                    className="px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Preview Area - z-0 to stay below header dropdowns */}
        <div className="flex-1 flex overflow-hidden relative z-0">
          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={cn(
              'relative flex items-center justify-center p-4',
                isDark ? 'bg-zinc-950/50' : 'bg-slate-100/50',
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            )}>
              {/* Fullscreen Toggle */}
              <button
                onClick={() => {
                  const previewEl = document.querySelector('[data-tour="preview"]')
                  if (previewEl) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen()
                    } else {
                      previewEl.requestFullscreen()
                    }
                  }
                }}
                className={cn(
                  "absolute top-6 right-6 z-10 p-2 rounded-lg border transition-all",
                  isDark
                    ? "bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-white"
                    : "bg-white/80 hover:bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm"
                )}
                title="Toggle fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Chef Loader - Enhanced cooking animation with phase indicator */}
              <ChefLoader isVisible={isGenerating} phase={buildPhase} />

              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                data-tour="preview"
                className={cn(
                  "bg-white rounded-lg overflow-hidden shadow-2xl shadow-black/50 h-full transition-all duration-300 relative",
                  isDraggingImage && "ring-4 ring-violet-500/50 ring-offset-2 ring-offset-black"
                )}
                style={{ width: getDeviceWidth(), maxWidth: '100%' }}
                onDragOver={(e) => {
                  if (isDraggingImage) {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'copy'
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const imageUrl = e.dataTransfer.getData('image-url') || e.dataTransfer.getData('text/plain')
                  if (imageUrl && html) {
                    // Find the first img tag and replace its src (simple replacement)
                    // In a more advanced version, you would identify which image to replace
                    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi
                    const matches = [...html.matchAll(imgRegex)]
                    if (matches.length > 0) {
                      // Replace the first image src
                      const newHtml = html.replace(
                        matches[0][0],
                        `<img ${matches[0][1]}src="${imageUrl}"${matches[0][3]}>`
                      )
                      setHtml(newHtml)
                      addToHistory(newHtml, 'Replaced image via drag-and-drop')
                      addConsoleLog('success', 'Image replaced successfully!')
                      addToast('success', 'Image replaced!')
                      setChatMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'Image replaced! Drag onto different parts of the preview to replace other images.'
                      }])
                    } else {
                      // No images in the HTML - add the image
                      const imgHtml = `\n<img src="${imageUrl}" alt="Added Image" style="width: 100%; max-width: 800px; margin: 2rem auto; display: block; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);" />\n`
                      const newHtml = html.replace('</body>', `${imgHtml}</body>`)
                      setHtml(newHtml)
                      addToHistory(newHtml, 'Added image via drag-and-drop')
                      addConsoleLog('success', 'Image added to the website!')
                    }
                  }
                  setDraggedImageUrl(null)
                  setIsDraggingImage(false)
                }}
              >
                {/* Drop overlay */}
                {isDraggingImage && html && (
                  <div className="absolute inset-0 z-50 bg-violet-500/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                    <div className="bg-zinc-900/90 rounded-2xl px-6 py-4 text-center border border-violet-500/50 shadow-xl">
                      <ImagePlus className="w-10 h-10 text-violet-400 mx-auto mb-2" />
                      <p className="text-white font-medium">Drop to replace image</p>
                      <p className="text-zinc-400 text-xs mt-1">The first image will be replaced</p>
                    </div>
                  </div>
                )}
                {html ? (
                  <iframe
                    ref={iframeRef}
                    srcDoc={getHtmlWithConsole(html)}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    title="Preview"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                        <Eye className="w-7 h-7 text-violet-400/50" />
                      </div>
                      <p className="text-zinc-500 font-medium text-sm">Preview</p>
                      <p className="text-zinc-700 text-xs mt-1">Your website appears here</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Code View */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className={cn(
              'bg-zinc-900/50 flex flex-col',
              viewMode === 'split' ? 'w-1/2 border-l border-white/[0.08]' : 'w-full'
            )}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-zinc-500">{projectName.toLowerCase().replace(/\s+/g, '-')}.html</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-white transition-colors"
                >
                  {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {html ? (
                  <MonacoCodeEditor
                    value={html}
                    onChange={(newValue) => {
                      setHtml(newValue)
                      // Update history for undo/redo
                      setHistory(prev => [...prev.slice(0, historyIndex + 1), { html: newValue, prompt: 'Manual edit', timestamp: new Date() }])
                      setHistoryIndex(prev => prev + 1)
                    }}
                    language="html"
                    fileName={`${projectName.toLowerCase().replace(/\s+/g, '-')}.html`}
                    onSave={saveProject}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-700">
                    <div className="text-center">
                      <Code2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No code yet</p>
                      <p className="text-xs text-zinc-600 mt-1">Generate a website to see the code</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Export Panel */}
      <AnimatePresence>
        {showExportPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-end bg-black/40 backdrop-blur-sm"
            onClick={() => setShowExportPanel(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[400px]"
            >
              <ExportPanel
                projectName={currentProject?.name || 'WebStew Project'}
                files={[]}
                html={html}
                onClose={() => setShowExportPanel(false)}
                className="h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Builder Panel */}
      <AnimatePresence>
        {showThemeBuilder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-end bg-black/40 backdrop-blur-sm"
            onClick={() => setShowThemeBuilder(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[420px]"
            >
              <ThemeBuilder
                currentHtml={html}
                onThemeApply={(updatedHtml, theme) => {
                  setHtml(updatedHtml)
                  addToHistory(updatedHtml, `Applied theme: ${theme.name}`)
                  addConsoleLog('success', `Theme "${theme.name}" applied successfully`)
                  addToast('success', `Theme "${theme.name}" applied`)
                  setShowThemeBuilder(false)
                }}
                onClose={() => setShowThemeBuilder(false)}
                className="h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette (Cmd+K) */}
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCommandPalette(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl mx-4 rounded-xl bg-zinc-900 border border-white/[0.15] shadow-2xl overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
                <Command className="w-5 h-5 text-violet-400" />
                <input
                  ref={commandInputRef}
                  type="text"
                  value={commandSearch}
                  onChange={(e) => { setCommandSearch(e.target.value); setCommandIndex(0) }}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 outline-none"
                />
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs font-mono">ESC</kbd>
              </div>

              {/* Commands List */}
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {['navigation', 'view', 'action', 'generate', 'tools'].map(category => {
                  const categoryCommands = filteredCommands.filter(cmd => cmd.category === category)
                  if (categoryCommands.length === 0) return null

                  const categoryLabels: Record<string, string> = {
                    navigation: 'Navigation',
                    view: 'View',
                    action: 'Actions',
                    generate: 'Generate',
                    tools: 'Tools'
                  }

                  return (
                    <div key={category} className="mb-2">
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        {categoryLabels[category]}
                      </div>
                      {categoryCommands.map((cmd) => {
                        const globalIndex = filteredCommands.indexOf(cmd)
                        const isSelected = globalIndex === commandIndex
                        const Icon = cmd.icon

                        return (
                          <button
                            key={cmd.id}
                            onClick={() => executeCommand(cmd)}
                            onMouseEnter={() => setCommandIndex(globalIndex)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                              isSelected
                                ? "bg-violet-500/20 text-white"
                                : "text-zinc-300 hover:bg-white/[0.05]"
                            )}
                          >
                            <Icon className={cn("w-4 h-4", isSelected ? "text-violet-400" : "text-zinc-500")} />
                            <span className="flex-1 text-sm">{cmd.label}</span>
                            {cmd.shortcut && (
                              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}

                {filteredCommands.length === 0 && (
                  <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                    No commands found for "{commandSearch}"
                  </div>
                )}
              </div>

              {/* Footer Hint */}
              <div className="px-4 py-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-zinc-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 rounded bg-zinc-800">↑</kbd>
                    <kbd className="px-1 rounded bg-zinc-800">↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 rounded bg-zinc-800">↵</kbd>
                    select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  <kbd className="px-1 rounded bg-zinc-800">K</kbd>
                  toggle
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Media Replacer Modal */}
      <AnimatePresence>
        {showMediaReplacer && selectedMediaElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowMediaReplacer(false)
              setSelectedMediaElement(null)
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl mx-4 rounded-2xl bg-zinc-900 border border-white/[0.1] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                    {selectedMediaElement.type === 'image' ? (
                      <ImageIcon className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Film className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedMediaElement.type === 'image' ? 'Edit Image' : 'Edit Video'}
                    </h2>
                    <p className="text-xs text-zinc-500">Replace with URL, stock photos, AI generation, or upload</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMediaReplacer(false)
                    setSelectedMediaElement(null)
                  }}
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Current Media Preview */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-zinc-400 mb-2">Current {selectedMediaElement.type}</label>
                    <div className="rounded-lg overflow-hidden bg-black/40 border border-white/10 h-40">
                      {selectedMediaElement.type === 'image' ? (
                        <img src={selectedMediaElement.src} alt="Selected" className="w-full h-full object-contain" />
                      ) : (
                        <video src={selectedMediaElement.src} controls className="w-full h-full object-contain" />
                      )}
                    </div>
                  </div>
                  {generatedImageUrl && selectedMediaElement.type === 'image' && (
                    <div className="flex-1">
                      <label className="block text-sm text-emerald-400 mb-2">New Image Preview</label>
                      <div className="rounded-lg overflow-hidden bg-black/40 border border-emerald-500/30 h-40">
                        <img src={generatedImageUrl} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Replacement Options - Tabs */}
                {selectedMediaElement.type === 'image' && (
                  <div className="space-y-4">
                    {/* Tab Buttons */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                      {[
                        { id: 'url', label: 'URL', icon: LinkIcon },
                        { id: 'unsplash', label: 'Stock Photos', icon: ImageIcon },
                        { id: 'ai', label: 'AI Generate', icon: Sparkles },
                        { id: 'upload', label: 'Upload', icon: Upload },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setImageTabMode?.(tab.id as 'url' | 'unsplash' | 'ai' | 'upload')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            (imageTabMode || 'url') === tab.id
                              ? "bg-violet-600 text-white shadow-lg"
                              : "text-zinc-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* URL Input Tab */}
                    {(imageTabMode || 'url') === 'url' && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                        <label className="block text-sm text-violet-300 mb-3 font-medium">
                          Replace with Image URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 mb-3"
                          id="image-url-input"
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById('image-url-input') as HTMLInputElement
                            const newUrl = input?.value?.trim()
                            if (!newUrl) {
                              addToast('error', 'Please enter an image URL')
                              return
                            }
                            const oldSrc = selectedMediaElement.src
                            const newHtml = html.replace(oldSrc, newUrl)
                            if (newHtml !== html) {
                              setHtml(newHtml)
                              addToHistory(newHtml, 'Replaced image with URL')
                              addTerminalLine('success', '✓ Image replaced with URL!')
                              addToast('success', 'Image replaced successfully!')
                            }
                            setShowMediaReplacer(false)
                            setSelectedMediaElement(null)
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium transition"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Replace Image
                        </button>
                      </div>
                    )}

                    {/* Unsplash Stock Photos Tab */}
                    {(imageTabMode || 'url') === 'unsplash' && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                        <label className="block text-sm text-amber-300 mb-3 font-medium">
                          Search Unsplash Stock Photos
                        </label>
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            placeholder="Search for images... (e.g., 'office', 'nature', 'technology')"
                            className="flex-1 px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                            id="unsplash-search-input"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const query = (e.target as HTMLInputElement).value.trim()
                                if (query) {
                                  setUnsplashResults?.([])
                                  setUnsplashLoading?.(true)
                                  // Generate Unsplash URLs directly (no API key needed for source.unsplash.com)
                                  const results = [
                                    `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=1`,
                                    `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=2`,
                                    `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=3`,
                                    `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=4`,
                                    `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=5`,
                                    `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=6`,
                                  ]
                                  setUnsplashResults?.(results)
                                  setUnsplashLoading?.(false)
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById('unsplash-search-input') as HTMLInputElement
                              const query = input?.value?.trim()
                              if (query) {
                                setUnsplashResults?.([])
                                setUnsplashLoading?.(true)
                                const results = [
                                  `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=1`,
                                  `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=2`,
                                  `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=3`,
                                  `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=4`,
                                  `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=5`,
                                  `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=6`,
                                ]
                                setUnsplashResults?.(results)
                                setUnsplashLoading?.(false)
                              }
                            }}
                            className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick category buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {['business', 'technology', 'nature', 'office', 'people', 'abstract'].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                const results = [
                                  `https://source.unsplash.com/800x600/?${cat}&sig=${Date.now()}1`,
                                  `https://source.unsplash.com/800x600/?${cat}&sig=${Date.now()}2`,
                                  `https://source.unsplash.com/800x600/?${cat}&sig=${Date.now()}3`,
                                  `https://source.unsplash.com/800x600/?${cat}&sig=${Date.now()}4`,
                                  `https://source.unsplash.com/800x600/?${cat}&sig=${Date.now()}5`,
                                  `https://source.unsplash.com/800x600/?${cat}&sig=${Date.now()}6`,
                                ]
                                setUnsplashResults?.(results)
                              }}
                              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white capitalize transition"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Results grid */}
                        {unsplashResults && unsplashResults.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {unsplashResults.map((url, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const oldSrc = selectedMediaElement.src
                                  const newHtml = html.replace(oldSrc, url)
                                  if (newHtml !== html) {
                                    setHtml(newHtml)
                                    addToHistory(newHtml, 'Replaced image with Unsplash photo')
                                    addTerminalLine('success', '✓ Image replaced with Unsplash photo!')
                                    addToast('success', 'Image replaced!')
                                  }
                                  setShowMediaReplacer(false)
                                  setSelectedMediaElement(null)
                                }}
                                className="relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-amber-500 transition-all group"
                              >
                                <img src={url} alt={`Stock ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">Select</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {!unsplashResults?.length && (
                          <p className="text-center text-zinc-500 text-sm py-8">
                            Search or select a category to find stock photos
                          </p>
                        )}
                      </div>
                    )}

                    {/* AI Generate Tab */}
                    {(imageTabMode || 'url') === 'ai' && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <label className="block text-sm text-blue-300 mb-3 font-medium">
                          Generate New AI Image
                        </label>
                        <textarea
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          placeholder="Describe the image... e.g., 'professional team photo in modern office'"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none mb-3"
                        />
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Style</label>
                            <select
                              value={imageStyle}
                              onChange={(e) => setImageStyle(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                            >
                              <option value="modern">Modern</option>
                              <option value="professional">Professional</option>
                              <option value="creative">Creative</option>
                              <option value="tech">Tech</option>
                              <option value="luxury">Luxury</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Aspect Ratio</label>
                            <select
                              value={imageAspectRatio}
                              onChange={(e) => setImageAspectRatio(e.target.value as '1:1' | '16:9' | '9:16')}
                              className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                            >
                              <option value="16:9">16:9 Wide</option>
                              <option value="1:1">1:1 Square</option>
                              <option value="9:16">9:16 Tall</option>
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!imagePrompt.trim()) {
                              addToast('error', 'Please enter a prompt')
                              return
                            }
                            setImageGenerating(true)
                            try {
                              const response = await fetch('/api/ai/image', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  action: 'generate',
                                  prompt: imagePrompt,
                                  style: imageStyle,
                                  aspectRatio: imageAspectRatio,
                                })
                              })
                              const data = await response.json()
                              if (data.success && data.output) {
                                const url = Array.isArray(data.output) ? data.output[0] : data.output
                                setGeneratedImageUrl(url)
                                addTerminalLine('success', '✓ New image generated!')
                              } else {
                                throw new Error(data.error || 'Generation failed')
                              }
                            } catch (err) {
                              addTerminalLine('error', `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
                              addToast('error', 'Image generation failed')
                            }
                            setImageGenerating(false)
                          }}
                          disabled={imageGenerating}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium transition"
                        >
                          {imageGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate AI Image
                            </>
                          )}
                        </button>

                        {/* Apply generated image button */}
                        {generatedImageUrl && (
                          <button
                            onClick={() => {
                              const oldSrc = selectedMediaElement.src
                              const newHtml = html.replace(oldSrc, generatedImageUrl)
                              if (newHtml !== html) {
                                setHtml(newHtml)
                                addToHistory(newHtml, 'Replaced image with AI-generated')
                                addTerminalLine('success', '✓ Image replaced with AI-generated!')
                                addToast('success', 'Image replaced!')
                              }
                              setShowMediaReplacer(false)
                              setSelectedMediaElement(null)
                              setGeneratedImageUrl(null)
                            }}
                            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-medium transition"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Apply Generated Image
                          </button>
                        )}
                      </div>
                    )}

                    {/* Upload Tab */}
                    {(imageTabMode || 'url') === 'upload' && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                        <label className="block text-sm text-emerald-300 mb-3 font-medium">
                          Upload Image File
                        </label>
                        <div
                          className="border-2 border-dashed border-emerald-500/30 rounded-xl p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-500/10')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-500/10')
                          }}
                          onDrop={async (e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-500/10')
                            const file = e.dataTransfer.files[0]
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader()
                              reader.onload = (ev) => {
                                const dataUrl = ev.target?.result as string
                                const oldSrc = selectedMediaElement.src
                                const newHtml = html.replace(oldSrc, dataUrl)
                                if (newHtml !== html) {
                                  setHtml(newHtml)
                                  addToHistory(newHtml, 'Replaced image with uploaded file')
                                  addTerminalLine('success', '✓ Image replaced with uploaded file!')
                                  addToast('success', 'Image uploaded and replaced!')
                                }
                                setShowMediaReplacer(false)
                                setSelectedMediaElement(null)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (ev) => {
                                  const dataUrl = ev.target?.result as string
                                  const oldSrc = selectedMediaElement.src
                                  const newHtml = html.replace(oldSrc, dataUrl)
                                  if (newHtml !== html) {
                                    setHtml(newHtml)
                                    addToHistory(newHtml, 'Replaced image with uploaded file')
                                    addTerminalLine('success', '✓ Image replaced with uploaded file!')
                                    addToast('success', 'Image uploaded and replaced!')
                                  }
                                  setShowMediaReplacer(false)
                                  setSelectedMediaElement(null)
                                }
                                reader.readAsDataURL(file)
                              }
                            }
                            input.click()
                          }}
                        >
                          <Upload className="w-10 h-10 mx-auto mb-3 text-emerald-400/60" />
                          <p className="text-white font-medium mb-1">Drop image here or click to browse</p>
                          <p className="text-zinc-500 text-xs">Supports JPG, PNG, GIF, WebP</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Video Tab (simplified) */}
                {selectedMediaElement.type === 'video' && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <label className="block text-sm text-blue-300 mb-3 font-medium">
                      Generate New AI Video
                    </label>
                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Describe the video... e.g., 'smooth camera pan over product'"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none mb-3"
                    />
                    <button
                      onClick={async () => {
                        if (!videoPrompt.trim()) {
                          addToast('error', 'Please enter a prompt')
                          return
                        }
                        setVideoGenerating(true)
                        setVideoStatus('Generating video...')
                        try {
                          const response = await fetch('/api/ai/video', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'text-to-video',
                              prompt: videoPrompt,
                              model: 'animate-diff',
                            })
                          })
                          const data = await response.json()
                          if (data.success && data.output) {
                            const url = Array.isArray(data.output) ? data.output[0] : data.output
                            setGeneratedVideoUrl(url)
                            addTerminalLine('success', '✓ New video generated!')
                          } else {
                            throw new Error(data.error || 'Generation failed')
                          }
                        } catch (err) {
                          addTerminalLine('error', `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
                        }
                        setVideoGenerating(false)
                        setVideoStatus('')
                      }}
                      disabled={videoGenerating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium transition"
                    >
                      {videoGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Video
                        </>
                      )}
                    </button>

                    {generatedVideoUrl && (
                      <>
                        <div className="mt-3 rounded-lg overflow-hidden bg-black/40 border border-white/10">
                          <video src={generatedVideoUrl} controls autoPlay loop muted className="w-full max-h-48" />
                        </div>
                        <button
                          onClick={() => {
                            const oldSrc = selectedMediaElement.src
                            const newHtml = html.replace(oldSrc, generatedVideoUrl)
                            if (newHtml !== html) {
                              setHtml(newHtml)
                              addToHistory(newHtml, 'Replaced video with AI-generated')
                              addTerminalLine('success', '✓ Video replaced!')
                            }
                            setShowMediaReplacer(false)
                            setSelectedMediaElement(null)
                            setGeneratedVideoUrl(null)
                          }}
                          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-medium transition"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Apply Generated Video
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const newHtml = html.replace(selectedMediaElement.outerHTML, '')
                      if (newHtml !== html) {
                        setHtml(newHtml)
                        addToHistory(newHtml, `Deleted ${selectedMediaElement.type}`)
                        addTerminalLine('success', `✓ ${selectedMediaElement.type === 'image' ? 'Image' : 'Video'} deleted!`)
                      }
                      setShowMediaReplacer(false)
                      setSelectedMediaElement(null)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-medium transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowMediaReplacer(false)
                      setSelectedMediaElement(null)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-4 rounded-2xl bg-zinc-900 border border-white/[0.1] shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <Command className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
                    <p className="text-xs text-zinc-500">Press ? to toggle this panel</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* General Shortcuts */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-xs">⌘</span>
                    General
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { keys: ['⌘', 'K'], desc: 'Open Command Palette' },
                      { keys: ['⌘', '/'], desc: 'Toggle Shortcuts' },
                      { keys: ['⌘', 'S'], desc: 'Save Project' },
                      { keys: ['⌘', 'Z'], desc: 'Undo' },
                      { keys: ['⌘', '⇧', 'Z'], desc: 'Redo' },
                      { keys: ['Esc'], desc: 'Close Modal / Deselect' },
                    ].map((shortcut, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-sm text-zinc-400">{shortcut.desc}</span>
                        <div className="flex gap-1">
                          {shortcut.keys.map((key, i) => (
                            <kbd key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">{key}</kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View Shortcuts */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-400" />
                    View
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { keys: ['⌘', 'P'], desc: 'Toggle Preview Mode' },
                      { keys: ['⌘', '⇧', 'P'], desc: 'Code Mode' },
                      { keys: ['F'], desc: 'Toggle Focus Mode' },
                    ].map((shortcut, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-sm text-zinc-400">{shortcut.desc}</span>
                        <div className="flex gap-1">
                          {shortcut.keys.map((key, i) => (
                            <kbd key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">{key}</kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Element Shortcuts */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-emerald-400" />
                    When Element Selected
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { keys: ['Delete'], desc: 'Delete Element' },
                      { keys: ['Backspace'], desc: 'Delete Element' },
                      { keys: ['⌘', 'D'], desc: 'Duplicate Element' },
                      { keys: ['Esc'], desc: 'Deselect Element' },
                    ].map((shortcut, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-sm text-zinc-400">{shortcut.desc}</span>
                        <div className="flex gap-1">
                          {shortcut.keys.map((key, i) => (
                            <kbd key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">{key}</kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tips */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                  <h3 className="text-sm font-semibold text-violet-300 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Pro Tips
                  </h3>
                  <ul className="text-sm text-zinc-400 space-y-1.5">
                    <li>• Right-click on any element for a context menu with more options</li>
                    <li>• Use the AI chat to describe changes - it understands natural language</li>
                    <li>• Press ⌘K to quickly navigate between panels</li>
                    <li>• Click on text elements in preview to edit them directly</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowApiKeyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 rounded-2xl bg-zinc-900 border border-white/[0.1] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                    <Key className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">API Keys & Services</h2>
                    <p className="text-xs text-zinc-500">Connect AI models and services</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-4 flex gap-1 border-b border-white/[0.08]">
                {[
                  { id: 'ai', label: 'AI Models', icon: Brain },
                  { id: 'services', label: 'Databases', icon: Database },
                  { id: 'integrations', label: 'Integrations', icon: Plug },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setApiKeyTab(tab.id as typeof apiKeyTab)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all',
                      apiKeyTab === tab.id
                        ? 'bg-white/[0.05] text-white border-b-2 border-violet-500'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                {/* AI Models Tab */}
                {apiKeyTab === 'ai' && (
                  <>
                {/* Anthropic */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center">
                      <Brain className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Anthropic (Claude)</span>
                    {apiKeys.anthropic && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKeys.anthropic}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                      placeholder="sk-ant-api03-..."
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-violet-400 hover:text-violet-300"
                    >
                      Get key
                    </a>
                  </div>
                </div>

                {/* OpenAI */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-white">OpenAI</span>
                    {apiKeys.openai && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                      placeholder="sk-proj-..."
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-violet-400 hover:text-violet-300"
                    >
                      Get key
                    </a>
                  </div>
                </div>

                {/* Google */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Google (Gemini)</span>
                    {apiKeys.google && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKeys.google}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, google: e.target.value }))}
                      placeholder="AIza..."
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-violet-400 hover:text-violet-300"
                    >
                      Get key
                    </a>
                  </div>
                </div>

                {/* Divider - Free Providers */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-xs text-zinc-500 font-medium">FREE PROVIDERS</span>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>

                {/* Hugging Face */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-xs">🤗</span>
                    </div>
                    <span className="text-sm font-medium text-white">Hugging Face</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">FREE</span>
                    {apiKeys.huggingface && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKeys.huggingface}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, huggingface: e.target.value }))}
                      placeholder="hf_..."
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                    />
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-yellow-400 hover:text-yellow-300"
                    >
                      Get free token
                    </a>
                  </div>
                </div>

                {/* Together AI */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Together AI</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">FREE</span>
                    {apiKeys.together && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKeys.together}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, together: e.target.value }))}
                      placeholder="..."
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    <a
                      href="https://api.together.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-purple-300"
                    >
                      Get free credits
                    </a>
                  </div>
                </div>

                {/* Cloudflare */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center">
                      <Cloud className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Cloudflare AI</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">FREE</span>
                    {apiKeys.cloudflare && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKeys.cloudflare}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, cloudflare: e.target.value }))}
                      placeholder="API Token..."
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                    <a
                      href="https://dash.cloudflare.com/profile/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-orange-400 hover:text-orange-300"
                    >
                      Get token
                    </a>
                  </div>
                  <input
                    type="text"
                    value={apiKeys.cloudflareAccountId}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, cloudflareAccountId: e.target.value }))}
                    placeholder="Account ID (from Workers & Pages)"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>

                {/* Info */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-300/80">
                    Your API keys are stored locally in your browser and never sent to our servers.
                    Free providers require tokens but don't charge your credit card.
                  </p>
                </div>
                  </>
                )}

                {/* Services Tab - Databases */}
                {apiKeyTab === 'services' && (
                  <>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-4">
                      <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-300/80">
                        Service credentials are encrypted and stored securely on our servers.
                        The builder can use these to create working integrations.
                      </p>
                    </div>

                    {/* MongoDB */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-green-500/20 flex items-center justify-center">
                          <Database className="w-3.5 h-3.5 text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-white">MongoDB</span>
                        {savedCredentials.includes('MONGODB_URI') && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                      </div>
                      <input
                        type="password"
                        value={serviceCredentials.MONGODB_URI}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, MONGODB_URI: e.target.value }))}
                        placeholder="mongodb+srv://user:pass@cluster..."
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50 transition-colors"
                      />
                    </div>

                    {/* Redis */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center">
                          <Zap className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-white">Redis</span>
                        {savedCredentials.includes('REDIS_URL') && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                      </div>
                      <input
                        type="password"
                        value={serviceCredentials.REDIS_URL}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, REDIS_URL: e.target.value }))}
                        placeholder="redis://user:pass@host:port"
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>

                    {/* Supabase */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                          <Database className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium text-white">Supabase</span>
                        {savedCredentials.includes('SUPABASE_URL') && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                      </div>
                      <input
                        type="text"
                        value={serviceCredentials.SUPABASE_URL}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, SUPABASE_URL: e.target.value }))}
                        placeholder="https://your-project.supabase.co"
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                      <input
                        type="password"
                        value={serviceCredentials.SUPABASE_ANON_KEY}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, SUPABASE_ANON_KEY: e.target.value }))}
                        placeholder="Anon/Public Key"
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* Integrations Tab */}
                {apiKeyTab === 'integrations' && (
                  <>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 mb-4">
                      <Plug className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-violet-300/80">
                        Add payment, email, and media services. The builder will create
                        working integrations you can test in the preview.
                      </p>
                    </div>

                    {/* Stripe */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
                          <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <span className="text-sm font-medium text-white">Stripe</span>
                        {savedCredentials.includes('STRIPE_SECRET_KEY') && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                      </div>
                      <input
                        type="password"
                        value={serviceCredentials.STRIPE_SECRET_KEY}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, STRIPE_SECRET_KEY: e.target.value }))}
                        placeholder="sk_test_... or sk_live_..."
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                      <input
                        type="text"
                        value={serviceCredentials.STRIPE_PUBLISHABLE_KEY}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, STRIPE_PUBLISHABLE_KEY: e.target.value }))}
                        placeholder="pk_test_... or pk_live_..."
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>

                    {/* SendGrid */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-white">SendGrid</span>
                        {savedCredentials.includes('SENDGRID_API_KEY') && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                      </div>
                      <input
                        type="password"
                        value={serviceCredentials.SENDGRID_API_KEY}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, SENDGRID_API_KEY: e.target.value }))}
                        placeholder="SG.xxxx..."
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>

                    {/* Twilio */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center">
                          <Phone className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-white">Twilio</span>
                        {savedCredentials.includes('TWILIO_AUTH_TOKEN') && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                      </div>
                      <input
                        type="text"
                        value={serviceCredentials.TWILIO_ACCOUNT_SID}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, TWILIO_ACCOUNT_SID: e.target.value }))}
                        placeholder="Account SID"
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
                      />
                      <input
                        type="password"
                        value={serviceCredentials.TWILIO_AUTH_TOKEN}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, TWILIO_AUTH_TOKEN: e.target.value }))}
                        placeholder="Auth Token"
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>

                    {/* Cloudinary */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-white">Cloudinary</span>
                        {savedCredentials.includes('CLOUDINARY_API_KEY') && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                      </div>
                      <input
                        type="text"
                        value={serviceCredentials.CLOUDINARY_API_KEY}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, CLOUDINARY_API_KEY: e.target.value }))}
                        placeholder="API Key"
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                      <input
                        type="password"
                        value={serviceCredentials.CLOUDINARY_API_SECRET}
                        onChange={(e) => setServiceCredentials(prev => ({ ...prev, CLOUDINARY_API_SECRET: e.target.value }))}
                        placeholder="API Secret"
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Save AI keys to localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('ai-builder-api-keys', JSON.stringify(apiKeys))
                    }
                    // Save service credentials to server (if on services/integrations tab)
                    if (apiKeyTab !== 'ai') {
                      await saveServiceCredentials()
                    }
                    setShowApiKeyModal(false)
                    addTerminalLine('success', 'Settings saved successfully')
                  }}
                  disabled={savingCredentials}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all",
                    savingCredentials && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {savingCredentials ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Library Panel */}
      <AnimatePresence>
        {showImageLibrary && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-12 right-0 bottom-0 w-80 z-50 bg-zinc-900 border-l border-white/[0.1] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-fuchsia-400" />
                <h3 className="text-sm font-medium text-white">Image Library</h3>
              </div>
              <button
                onClick={() => setShowImageLibrary(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Upload & Search */}
            <div className="p-3 border-b border-white/[0.08] space-y-2">
              {/* Upload Button */}
              <button
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = () => {
                        const dataUrl = reader.result as string
                        insertImageIntoWebsite(dataUrl, file.name.replace(/\.[^/.]+$/, ''))
                      }
                      reader.readAsDataURL(file)
                    }
                  }
                  input.click()
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-400 hover:to-violet-400 text-white text-sm font-medium transition-all shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>

              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <Search className="w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={imageSearchQuery}
                  onChange={(e) => setImageSearchQuery(e.target.value)}
                  placeholder="Search free images..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="p-3 border-b border-white/[0.08]">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setImageCategory('all')}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] font-medium transition-all',
                    imageCategory === 'all'
                      ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
                      : 'bg-white/[0.03] text-zinc-400 border border-transparent hover:bg-white/[0.05]'
                  )}
                >
                  All
                </button>
                {stockImageCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setImageCategory(cat)}
                    className={cn(
                      'px-2 py-1 rounded text-[10px] font-medium transition-all capitalize',
                      imageCategory === cat
                        ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
                        : 'bg-white/[0.03] text-zinc-400 border border-transparent hover:bg-white/[0.05]'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Sources */}
            <div className="px-3 py-2 border-b border-white/[0.08] flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">Sources:</span>
              <div className="flex gap-1">
                {['Unsplash', 'Pexels', 'Pixabay'].map(source => (
                  <span key={source} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.03] text-zinc-400">
                    {source}
                  </span>
                ))}
              </div>
            </div>

            {/* Image Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              {loadingImages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-fuchsia-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Quick Insert Presets */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Quick Insert</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Hero Image', seed: 'hero-banner', size: '1200x600' },
                        { label: 'Team Photo', seed: 'team-office', size: '800x600' },
                        { label: 'Product', seed: 'product-modern', size: '600x600' },
                        { label: 'Background', seed: 'abstract-gradient', size: '1920x1080' },
                        { label: 'Avatar', seed: 'professional-headshot', size: '200x200' },
                        { label: 'Testimonial', seed: 'business-person', size: '150x150' },
                      ].map(preset => {
                        const imageUrl = `https://picsum.photos/seed/${preset.seed}/${preset.size.replace('x', '/')}`
                        return (
                          <div
                            key={preset.label}
                            className="group flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-fuchsia-500/20 transition-all"
                          >
                            <div
                              className="w-full aspect-video rounded bg-cover bg-center relative overflow-hidden"
                              style={{ backgroundImage: `url(https://picsum.photos/seed/${preset.seed}/200/150)` }}
                            >
                              {/* Hover overlay with actions */}
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                <button
                                  onClick={() => insertImageIntoWebsite(imageUrl, preset.label)}
                                  className="px-2 py-1 rounded bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-[9px] font-medium transition-colors"
                                >
                                  Insert
                                </button>
                                <button
                                  onClick={() => copyImageUrl(imageUrl, preset.label)}
                                  className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[9px] font-medium transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-400">{preset.label}</span>
                            <span className="text-[9px] text-zinc-600">{preset.size}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom Image URL */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Custom Picsum</h4>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-2">
                      <p className="text-[10px] text-zinc-400">Generate any size placeholder:</p>
                      <code className="block text-[10px] text-fuchsia-400 bg-black/30 p-2 rounded font-mono">
                        picsum.photos/seed/YOUR_KEYWORD/WIDTH/HEIGHT
                      </code>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://picsum.photos/seed/custom/800/600')
                            addConsoleLog('info', 'Copied placeholder URL')
                          }}
                          className="flex-1 text-[10px] px-2 py-1.5 rounded bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/30 transition-all"
                        >
                          Copy 800x600
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://picsum.photos/seed/custom/1200/800')
                            addConsoleLog('info', 'Copied placeholder URL')
                          }}
                          className="flex-1 text-[10px] px-2 py-1.5 rounded bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/30 transition-all"
                        >
                          Copy 1200x800
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Editing Tools */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Image Tools</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Crop, label: 'Crop', desc: 'Resize images' },
                        { icon: Wand, label: 'Enhance', desc: 'Auto improve' },
                        { icon: Contrast, label: 'Filters', desc: 'Apply effects' },
                        { icon: Eraser, label: 'Remove BG', desc: 'Transparent' },
                      ].map(tool => (
                        <button
                          key={tool.label}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-all text-left"
                        >
                          <div className="w-7 h-7 rounded-md bg-fuchsia-500/10 flex items-center justify-center">
                            <tool.icon className="w-3.5 h-3.5 text-fuchsia-400" />
                          </div>
                          <div>
                            <p className="text-[11px] text-white">{tool.label}</p>
                            <p className="text-[9px] text-zinc-500">{tool.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-[10px] text-blue-300/80 space-y-1">
                        <p>All images from Unsplash, Pexels, and Pixabay are free for commercial use.</p>
                        <p>Use the AI builder to describe the image you want and it will be generated automatically.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Image Insertion Panel */}
      <AnimatePresence>
        {showImageInsertPanel && pendingImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowImageInsertPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Insert Image</h2>
                    <p className="text-xs text-zinc-400">{pendingImageName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImageInsertPanel(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Preview Image */}
                <div className="flex justify-center">
                  <img
                    src={pendingImageUrl}
                    alt={pendingImageName}
                    className="max-h-40 rounded-lg border border-white/10 object-contain"
                  />
                </div>

                {/* Size Options */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Image Size</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'thumbnail' as const, label: 'Thumbnail', desc: '80px' },
                      { value: 'small' as const, label: 'Small', desc: '192px' },
                      { value: 'medium' as const, label: 'Medium', desc: '448px' },
                      { value: 'large' as const, label: 'Large', desc: '672px' },
                      { value: 'full' as const, label: 'Full Width', desc: '100%' },
                    ].map(size => (
                      <button
                        key={size.value}
                        onClick={() => setImageInsertSize(size.value)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center",
                          imageInsertSize === size.value
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/50"
                            : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
                        )}
                      >
                        <span>{size.label}</span>
                        <span className="text-[10px] opacity-60">{size.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position Options */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Insert Position</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'hero' as const, label: 'Hero', icon: Rocket },
                      { value: 'after-hero' as const, label: 'After Hero', icon: ArrowRight },
                      { value: 'section' as const, label: 'New Section', icon: Layout },
                      { value: 'footer' as const, label: 'Before Footer', icon: ChevronDown },
                    ].map(pos => {
                      const Icon = pos.icon
                      return (
                        <button
                          key={pos.value}
                          onClick={() => setImageInsertPosition(pos.value)}
                          className={cn(
                            "px-3 py-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1",
                            imageInsertPosition === pos.value
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                              : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{pos.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Replace Existing Image */}
                {websiteImages.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">Or Replace Existing Image</label>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 bg-white/[0.02] rounded-lg border border-white/10">
                      {websiteImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => performImageInsertion(img.index)}
                          className="group relative rounded-lg overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all aspect-video"
                        >
                          <img
                            src={img.src}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center">
                              <ArrowRight className="w-4 h-4 text-amber-400 mx-auto" />
                              <span className="text-[9px] text-white font-medium">Replace</span>
                            </div>
                          </div>
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-[8px] text-white rounded">
                            {img.context}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowImageInsertPanel(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => performImageInsertion()}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Insert Image
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

      {/* Right-Click Context Menu */}
      <AnimatePresence>
        {contextMenu.show && contextMenu.element && (
          <>
            {/* Invisible backdrop to catch clicks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeContextMenu}
              onContextMenu={(e) => { e.preventDefault(); closeContextMenu() }}
              className="fixed inset-0 z-[299]"
            />
            {/* Context menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                left: getContextMenuPosition().x,
                top: getContextMenuPosition().y,
                zIndex: 300
              }}
              className={cn(
                "w-52 py-1.5 backdrop-blur-xl border rounded-xl shadow-2xl",
                isDark
                  ? "bg-slate-900/95 border-slate-700/50 shadow-black/60 ring-1 ring-white/5"
                  : "bg-white/95 border-slate-200 shadow-slate-300/50"
              )}
            >
              {/* Compact header */}
              <div className={cn(
                "px-3 py-2 border-b flex items-center gap-2",
                isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-100 bg-slate-50/50"
              )}>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-mono font-medium",
                  isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-600"
                )}>
                  {contextMenu.element.tagName.toLowerCase()}
                </span>
                {contextMenu.element.textContent && (
                  <span className={cn("text-[10px] truncate flex-1", isDark ? "text-slate-400" : "text-slate-500")}>
                    {contextMenu.element.textContent.slice(0, 25)}...
                  </span>
                )}
              </div>

              {/* Menu items */}
              <div className="py-1">
                {/* Primary action based on element type */}
                {contextMenu.element.isImage ? (
                  <>
                    <button onClick={contextMenuActions.replaceImage} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-violet-500/15" : "hover:bg-violet-50")}>
                      <ImageIcon className="w-4 h-4 text-violet-400" />
                      <span className={cn("text-[13px] font-medium", isDark ? "text-slate-100" : "text-slate-800")}>Replace Image</span>
                    </button>
                    <button onClick={contextMenuActions.copyImageUrl} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100")}>
                      <LinkIcon className={cn("w-4 h-4", isDark ? "text-slate-400" : "text-slate-500")} />
                      <span className={cn("text-[13px]", isDark ? "text-slate-200" : "text-slate-700")}>Copy URL</span>
                    </button>
                  </>
                ) : contextMenu.element.isLink ? (
                  <>
                    <button onClick={contextMenuActions.editLink} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-blue-500/15" : "hover:bg-blue-50")}>
                      <Edit3 className="w-4 h-4 text-blue-400" />
                      <span className={cn("text-[13px] font-medium", isDark ? "text-slate-100" : "text-slate-800")}>Edit Link</span>
                    </button>
                    <button onClick={contextMenuActions.openLink} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100")}>
                      <ExternalLink className={cn("w-4 h-4", isDark ? "text-slate-400" : "text-slate-500")} />
                      <span className={cn("text-[13px]", isDark ? "text-slate-200" : "text-slate-700")}>Open in New Tab</span>
                    </button>
                  </>
                ) : contextMenu.element.isText ? (
                  <>
                    <button onClick={contextMenuActions.editText} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-emerald-500/15" : "hover:bg-emerald-50")}>
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      <span className={cn("text-[13px] font-medium", isDark ? "text-slate-100" : "text-slate-800")}>Edit Text</span>
                    </button>
                    <button onClick={contextMenuActions.copyText} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100")}>
                      <Copy className={cn("w-4 h-4", isDark ? "text-slate-400" : "text-slate-500")} />
                      <span className={cn("text-[13px]", isDark ? "text-slate-200" : "text-slate-700")}>Copy Text</span>
                    </button>
                  </>
                ) : null}

                {/* Divider */}
                <div className={cn("my-1.5 mx-2 border-t", isDark ? "border-slate-700/50" : "border-slate-200")} />

                {/* Insert image option (for non-image elements) */}
                {!contextMenu.element.isImage && (
                  <button onClick={contextMenuActions.insertImageAfter} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-violet-500/15" : "hover:bg-violet-50")}>
                    <ImagePlus className="w-4 h-4 text-violet-400" />
                    <span className={cn("text-[13px]", isDark ? "text-slate-200" : "text-slate-700")}>Add Image Here</span>
                  </button>
                )}

                {/* Quick Color Picker */}
                {!contextMenu.element.isImage && (
                  <div className="px-3 py-2">
                    <div className={cn("text-[11px] mb-1.5 font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Quick Colors</div>
                    <div className="flex gap-1">
                      {[
                        { color: '#f43f5e', name: 'Red' },
                        { color: '#f97316', name: 'Orange' },
                        { color: '#eab308', name: 'Yellow' },
                        { color: '#22c55e', name: 'Green' },
                        { color: '#3b82f6', name: 'Blue' },
                        { color: '#8b5cf6', name: 'Purple' },
                        { color: '#ffffff', name: 'White' },
                        { color: '#000000', name: 'Black' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          title={`Change text color to ${c.name}`}
                          onClick={() => {
                            if (!contextMenu.element) return
                            const tagName = contextMenu.element.tagName.toLowerCase()
                            const outerHTML = contextMenu.element.outerHTML
                            // Add or update style attribute
                            let newHtml: string
                            if (outerHTML.includes('style="')) {
                              // Has existing style - add/update color
                              newHtml = outerHTML.replace(/style="([^"]*)"/, (match, styles) => {
                                if (styles.includes('color:')) {
                                  return `style="${styles.replace(/color:[^;]+;?/, `color:${c.color};`)}"`
                                }
                                return `style="${styles};color:${c.color}"`
                              })
                            } else {
                              // No existing style - add it
                              newHtml = outerHTML.replace(new RegExp(`<${tagName}`), `<${tagName} style="color:${c.color}"`)
                            }
                            const updatedHtml = html.replace(outerHTML, newHtml)
                            if (updatedHtml !== html) {
                              setHtml(updatedHtml)
                              addToHistory(updatedHtml, `Changed text color to ${c.name}`)
                              addToast('success', `Text color changed to ${c.name}`)
                            }
                            closeContextMenu()
                          }}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                            c.color === '#ffffff' ? "border-slate-400" : "border-transparent",
                            c.color === '#000000' ? "border-slate-600" : ""
                          )}
                          style={{ backgroundColor: c.color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Common actions */}
                <button onClick={contextMenuActions.duplicate} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100")}>
                  <Copy className={cn("w-4 h-4", isDark ? "text-slate-400" : "text-slate-500")} />
                  <span className={cn("text-[13px]", isDark ? "text-slate-200" : "text-slate-700")}>Duplicate</span>
                </button>
                <button onClick={contextMenuActions.copyHtml} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100")}>
                  <Code className={cn("w-4 h-4", isDark ? "text-slate-400" : "text-slate-500")} />
                  <span className={cn("text-[13px]", isDark ? "text-slate-200" : "text-slate-700")}>Copy HTML</span>
                </button>

                {/* Divider */}
                <div className={cn("my-1.5 mx-2 border-t", isDark ? "border-slate-700/50" : "border-slate-200")} />

                {/* Delete - always last */}
                <button onClick={contextMenuActions.delete} className={cn("w-full px-3 py-2 flex items-center gap-2.5 transition-colors text-left", isDark ? "hover:bg-red-500/15" : "hover:bg-red-50")}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span className={cn("text-[13px] font-medium", isDark ? "text-red-400" : "text-red-500")}>Delete</span>
                  <span className={cn("ml-auto text-[10px] font-medium", isDark ? "text-slate-500" : "text-slate-400")}>⌫</span>
                </button>
              </div>

              {/* Footer hint */}
              <div className={cn("px-3 py-1.5 border-t", isDark ? "border-slate-700/50 bg-slate-800/20" : "border-slate-100 bg-slate-50/50")}>
                <span className={cn("text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>Press <kbd className={cn("px-1 py-0.5 rounded text-[9px] font-mono", isDark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600")}>Esc</kbd> to close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
              error: <XCircle className="w-4 h-4 text-red-400" />,
              warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
              info: <Info className="w-4 h-4 text-blue-400" />
            }
            const bgColors = {
              success: 'bg-emerald-500/10 border-emerald-500/20',
              error: 'bg-red-500/10 border-red-500/20',
              warning: 'bg-amber-500/10 border-amber-500/20',
              info: 'bg-blue-500/10 border-blue-500/20'
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl shadow-lg min-w-[280px] max-w-[400px]",
                  bgColors[toast.type],
                  "bg-zinc-900/90"
                )}
              >
                {icons[toast.type]}
                <span className="flex-1 text-sm text-white/90">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Loading quips for the Suspense loader
const loadingQuips = [
  "Warming up the cloud engines...",
  "Stretching the pixels...",
  "Polishing the interface...",
  "Brewing some fresh code...",
  "Loading creativity modules...",
  "Calibrating the vibes...",
  "Syncing with the cloud...",
  "Almost ready to create magic...",
]

// Cloud Loading Component
function CloudLoader() {
  // Safe default - don't use context hooks in Suspense fallback
  const [quip, setQuip] = useState(loadingQuips[0])
  const isDark = true // Default to dark theme for loading

  useEffect(() => {
    const interval = setInterval(() => {
      setQuip(loadingQuips[Math.floor(Math.random() * loadingQuips.length)])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen flex items-center justify-center overflow-hidden">
      {/* Day/Night Background */}
      {isDark ? <StarryNight /> : <SunriseBackground />}

      {/* Center loading */}
      <div className="relative z-10 text-center">
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center -z-10"
          >
            <div className={cn(
              "w-32 h-32 rounded-full blur-3xl",
              isDark
                ? "bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30"
                : "bg-gradient-to-br from-orange-300/40 to-pink-300/40"
            )} />
          </motion.div>

          <div className={cn(
            "w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-2xl",
            isDark
              ? "bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-violet-500/30 shadow-violet-500/20"
              : "bg-gradient-to-br from-orange-200/60 to-pink-200/60 border border-orange-300/50 shadow-orange-300/30"
          )}>
            <CloudSun className={cn(
              "w-12 h-12",
              isDark ? "text-violet-300" : "text-orange-500"
            )} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "px-8 py-5 rounded-2xl backdrop-blur-xl border shadow-xl",
            isDark
              ? "bg-black/30 border-white/10"
              : "bg-white/40 border-white/50"
          )}
        >
          <h2 className={cn(
            "text-xl font-semibold mb-3",
            isDark ? "text-white" : "text-slate-800"
          )}>
            Loading Workspace
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={quip}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "text-sm",
                isDark ? "text-zinc-400" : "text-slate-600"
              )}
            >
              {quip}
            </motion.p>
          </AnimatePresence>

          {/* Loading dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  isDark ? "bg-violet-500" : "bg-orange-400"
                )}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<CloudLoader />}>
      <WorkspaceContent />
    </Suspense>
  )
}
