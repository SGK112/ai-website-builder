'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal,
  Monitor,
  Tablet,
  Smartphone,
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { StarryNight, SunriseBackground, DayNightCycle } from '@/components/landing/BackgroundEffects'
import { WebStewPanel, StewIngredient } from '@/components/WebStew'
import { OnboardingTour } from '@/components/onboarding'
import { MonacoCodeEditor } from '@/components/editor'
import { StylePresetPicker, ComponentPicker } from '@/components/builder'
import { stylePresets, StylePreset, generatePresetStyles } from '@/lib/builder/style-presets'
import { componentLibrary, ComponentSection, assemblePage } from '@/lib/builder/component-library'
import { imageService, getUnsplashImage, enhanceImagesInHtml } from '@/lib/builder/image-service'
import { ChefLoader } from '@/components/loading'

type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type ViewMode = 'preview' | 'code' | 'split'
type Panel = 'build' | 'projects' | 'integrations' | 'images' | 'env' | 'console' | 'deploy' | 'webstew'
type SkillLevel = 'no-code' | 'low-code' | 'full-stack'
type BuildPhase = 'idle' | 'structure' | 'styling' | 'interactivity' | 'complete'
type ConsoleLogType = 'log' | 'info' | 'warn' | 'error' | 'success'

interface SelectedElement {
  tagName: string
  className: string
  id: string
  textContent: string
  directText?: string
  outerHTML: string
  path: string
  rect: { top: number; left: number; width: number; height: number }
  section?: { tagName: string; id?: string; dataSection?: string; className?: string }
  isEditable?: boolean
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
  const isDark = theme === 'dark'

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
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [hoveredElement, setHoveredElement] = useState<SelectedElement | null>(null)

  // Image Editor state
  const [imageEdits, setImageEdits] = useState<ImageEdit[]>([])
  const [selectedImage, setSelectedImage] = useState<ImageEdit | null>(null)
  const [runpodEndpoint, setRunpodEndpoint] = useState('')

  // Business Integrations state
  const [integrations, setIntegrations] = useState<BusinessIntegration[]>(defaultIntegrations)
  const [integrationFilter, setIntegrationFilter] = useState<string>('all')

  // AI Model Selection state
  const [selectedModel, setSelectedModel] = useState<AIModel>(aiModels[0])
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
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

  // Stock Image state
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [imageSearchQuery, setImageSearchQuery] = useState('')
  const [imageCategory, setImageCategory] = useState<string>('all')
  const [stockImages, setStockImages] = useState<StockImage[]>([])
  const [loadingImages, setLoadingImages] = useState(false)

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  // Welcome chat message state
  const [showWelcome, setShowWelcome] = useState(true)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: '👋 Welcome to WebStew! I\'m your AI builder assistant. Describe your website idea, or upload your content in the Stew panel - I\'ll cook up something amazing!' }
  ])

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

  // Load projects from localStorage
  useEffect(() => {
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
      localStorage.setItem('vibe-projects', JSON.stringify(projects))
    }
  }, [projects])

  // Save settings
  useEffect(() => {
    localStorage.setItem('workspace-settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem('workspace-skill-level', skillLevel)
  }, [skillLevel])

  // Auto-save current work to localStorage (browser refresh protection)
  useEffect(() => {
    if (html && html.length > 100) {
      const autoSaveData = {
        html,
        projectName,
        timestamp: new Date().toISOString(),
        selectedPreset,
      }
      localStorage.setItem('webstew-autosave', JSON.stringify(autoSaveData))
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
            addToHistory(newHtml, `Edited ${tag}: "${newContent.slice(0, 30)}..."`)
            const sectionInfo = element.section ? ` in ${element.section.tagName}` : ''
            addConsoleLog('success', `Live edit saved${sectionInfo}`)
          }
        }
      } else if (event.data?.type === 'element-click' && selectMode) {
        setSelectedElement(event.data.element)
        const tag = event.data.element.tagName.toLowerCase()
        const directText = event.data.element.directText || event.data.element.textContent?.slice(0, 50) || ''
        const section = event.data.element.section
        const isEditable = event.data.element.isEditable

        // Show section context
        const sectionInfo = section ? `[${section.tagName}${section.id ? '#' + section.id : ''}] ` : ''

        // For editable elements, user can edit directly - show helpful message
        if (isEditable) {
          addConsoleLog('info', `${sectionInfo}Editing <${tag}>: "${directText.slice(0, 30)}..." - Type to edit, Enter to save`)
          // Don't fill command input - user is editing inline
          setCommandInput('')
        } else {
          // For non-editable elements, offer AI edit via chat
          let prompt = ''
          if (tag === 'img') {
            prompt = `Replace this image with: `
          } else if (tag === 'div' || tag === 'section') {
            prompt = `Modify this ${tag} section: `
          } else {
            prompt = `Edit this ${tag}: `
          }
          setCommandInput(prompt)
          inputRef.current?.focus()
          addConsoleLog('info', `${sectionInfo}Selected <${tag}> - Use chat to edit`)
        }
      } else if (event.data?.type === 'element-hover' && selectMode) {
        setHoveredElement(event.data.element)
      } else if (event.data?.type === 'element-leave') {
        setHoveredElement(null)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [addConsoleLog, selectMode])

  // Project management
  const saveProject = () => {
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
    addTerminalLine('success', `Project "${projectName}" saved`)
    addConsoleLog('info', `Project saved: ${projectName}`)
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

  const deleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setProjectName('Untitled Project')
      setHtml('')
    }
    addTerminalLine('info', `Project "${project?.name}" deleted`)
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

  // Inject console interceptor and element selector into HTML
  const getHtmlWithConsole = useCallback((originalHtml: string) => {
    const consoleScript = `
<script>
(function() {
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
})();
</script>`

    const elementSelectorScript = selectMode ? `
<script>
(function() {
  let highlightEl = null;
  let toolbarEl = null;
  let activeElement = null;
  let originalContent = '';

  // Editable element types
  const EDITABLE_TAGS = ['h1','h2','h3','h4','h5','h6','p','span','a','button','label','li','td','th'];
  const SECTION_TAGS = ['section', 'header', 'footer', 'nav', 'main', 'article', 'aside'];

  // Get only direct text content
  function getDirectText(el) {
    let text = '';
    for (let node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent.trim() + ' ';
      }
    }
    return text.trim() || el.innerText?.slice(0, 100)?.trim() || '';
  }

  // Find parent section
  function findSection(el) {
    let current = el;
    while (current && current !== document.body) {
      if (SECTION_TAGS.includes(current.tagName.toLowerCase()) ||
          current.dataset?.section ||
          current.id?.includes('section')) {
        return {
          tagName: current.tagName.toLowerCase(),
          id: current.id || null,
          dataSection: current.dataset?.section || null,
          className: current.className?.split(' ').slice(0, 2).join(' ') || ''
        };
      }
      current = current.parentElement;
    }
    return null;
  }

  // Create floating toolbar
  function createToolbar() {
    if (toolbarEl) return toolbarEl;
    toolbarEl = document.createElement('div');
    toolbarEl.id = '__edit-toolbar__';
    toolbarEl.innerHTML = \`
      <button data-action="bold" title="Bold">B</button>
      <button data-action="italic" title="Italic">I</button>
      <span class="divider"></span>
      <button data-action="save" title="Save" class="save">✓</button>
      <button data-action="cancel" title="Cancel" class="cancel">✕</button>
    \`;
    toolbarEl.style.cssText = 'position:fixed;z-index:100000;background:#18181b;border:1px solid #3f3f46;border-radius:8px;padding:4px;display:none;gap:2px;box-shadow:0 10px 40px rgba(0,0,0,0.5);';
    const style = document.createElement('style');
    style.textContent = \`
      #__edit-toolbar__ button {
        background:#27272a;border:none;color:#a1a1aa;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;
      }
      #__edit-toolbar__ button:hover { background:#3f3f46;color:#fff; }
      #__edit-toolbar__ button.save { color:#22c55e; }
      #__edit-toolbar__ button.save:hover { background:#22c55e;color:#fff; }
      #__edit-toolbar__ button.cancel { color:#ef4444; }
      #__edit-toolbar__ button.cancel:hover { background:#ef4444;color:#fff; }
      #__edit-toolbar__ .divider { width:1px;background:#3f3f46;margin:0 4px; }
      [contenteditable="true"] { outline:2px solid #a855f7 !important;outline-offset:2px;background:rgba(168,85,247,0.05); }
    \`;
    document.head.appendChild(style);
    document.body.appendChild(toolbarEl);

    // Toolbar actions
    toolbarEl.addEventListener('click', function(e) {
      const action = e.target.dataset?.action;
      if (!action || !activeElement) return;

      if (action === 'bold') document.execCommand('bold');
      else if (action === 'italic') document.execCommand('italic');
      else if (action === 'save') saveEdit();
      else if (action === 'cancel') cancelEdit();
    });

    return toolbarEl;
  }

  function showToolbar(el) {
    const toolbar = createToolbar();
    const rect = el.getBoundingClientRect();
    toolbar.style.display = 'flex';
    toolbar.style.top = Math.max(5, rect.top - 40) + 'px';
    toolbar.style.left = rect.left + 'px';
  }

  function hideToolbar() {
    if (toolbarEl) toolbarEl.style.display = 'none';
  }

  function saveEdit() {
    if (!activeElement) return;
    const newContent = activeElement.innerHTML;
    activeElement.contentEditable = 'false';
    hideToolbar();

    // Send update to parent
    window.parent.postMessage({
      type: 'element-edited',
      oldContent: originalContent,
      newContent: newContent,
      element: {
        tagName: activeElement.tagName,
        className: activeElement.className,
        id: activeElement.id,
        section: findSection(activeElement)
      }
    }, '*');

    activeElement = null;
    originalContent = '';
  }

  function cancelEdit() {
    if (!activeElement) return;
    activeElement.innerHTML = originalContent;
    activeElement.contentEditable = 'false';
    hideToolbar();
    activeElement = null;
    originalContent = '';
  }

  // Create highlight
  function createHighlight() {
    if (highlightEl) return highlightEl;
    highlightEl = document.createElement('div');
    highlightEl.id = '__selector-highlight__';
    highlightEl.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #a855f7;background:rgba(168,85,247,0.1);z-index:99998;transition:all 0.1s ease;border-radius:4px;';
    document.body.appendChild(highlightEl);
    return highlightEl;
  }

  document.addEventListener('mouseover', function(e) {
    if (e.target.id?.startsWith('__') || activeElement) return;
    const rect = e.target.getBoundingClientRect();
    const hl = createHighlight();
    hl.style.top = rect.top + 'px';
    hl.style.left = rect.left + 'px';
    hl.style.width = rect.width + 'px';
    hl.style.height = rect.height + 'px';

    window.parent.postMessage({
      type: 'element-hover',
      element: {
        tagName: e.target.tagName,
        className: e.target.className,
        id: e.target.id,
        textContent: getDirectText(e.target).slice(0, 60),
        section: findSection(e.target)
      }
    }, '*');
  });

  document.addEventListener('mouseout', function(e) {
    if (!activeElement) window.parent.postMessage({ type: 'element-leave' }, '*');
  });

  document.addEventListener('click', function(e) {
    if (e.target.id?.startsWith('__')) return;
    e.preventDefault();
    e.stopPropagation();

    const tag = e.target.tagName.toLowerCase();
    const section = findSection(e.target);
    const rect = e.target.getBoundingClientRect();

    // For editable elements, enable inline editing
    if (EDITABLE_TAGS.includes(tag)) {
      // Cancel any previous edit
      if (activeElement && activeElement !== e.target) {
        cancelEdit();
      }

      activeElement = e.target;
      originalContent = e.target.innerHTML;
      e.target.contentEditable = 'true';
      e.target.focus();
      showToolbar(e.target);

      // Select all text
      const range = document.createRange();
      range.selectNodeContents(e.target);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Send click info to parent
    window.parent.postMessage({
      type: 'element-click',
      element: {
        tagName: e.target.tagName,
        className: e.target.className,
        id: e.target.id,
        textContent: getDirectText(e.target).slice(0, 150),
        directText: getDirectText(e.target).slice(0, 80),
        outerHTML: e.target.outerHTML.slice(0, 400),
        section: section,
        isEditable: EDITABLE_TAGS.includes(tag),
        rect: rect
      }
    }, '*');
  }, true);

  // Handle Escape to cancel edit
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && activeElement) {
      cancelEdit();
    } else if ((e.key === 'Enter' && !e.shiftKey) && activeElement) {
      e.preventDefault();
      saveEdit();
    }
  });

  // Click outside to save
  document.addEventListener('click', function(e) {
    if (activeElement && !activeElement.contains(e.target) && !e.target.id?.startsWith('__')) {
      saveEdit();
    }
  });
})();
</script>
<style>
body { cursor: crosshair !important; }
*:not([contenteditable="true"]):hover { outline: 2px dashed rgba(168,85,247,0.3) !important; }
</style>` : '';

    if (originalHtml.includes('</head>')) {
      return originalHtml.replace('</head>', `${consoleScript}${elementSelectorScript}</head>`)
    }
    return consoleScript + elementSelectorScript + originalHtml
  }, [selectMode])

  // Layered generation with phases
  const handleGenerate = async (promptText: string, ingredients?: StewIngredient[]) => {
    if (!promptText.trim() && (!ingredients || ingredients.length === 0)) return

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

      // Reset build phase after a delay
      setTimeout(() => setBuildPhase('idle'), 500)

    } catch (error) {
      console.error('Generation error:', error)
      addTerminalLine('error', '└ Build failed. Please try again.')
      addConsoleLog('error', 'Build failed')
      setBuildPhase('idle')
      setIsGenerating(false)
    }
  }

  // Quick edit for simple text changes without full regeneration
  const handleQuickEdit = (newText: string): boolean => {
    if (!selectedElement || !html) return false

    const tag = selectedElement.tagName.toLowerCase()
    const oldText = selectedElement.directText || selectedElement.textContent?.slice(0, 100) || ''

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

  const handleCommandSubmit = () => {
    if (!commandInput.trim() || isGenerating) return
    const command = commandInput
    setCommandInput('')

    // Check if this is a simple text replacement for selected element
    if (selectedElement) {
      const tag = selectedElement.tagName.toLowerCase()
      const directText = selectedElement.directText || selectedElement.textContent?.slice(0, 50) || ''

      // Check for patterns like 'Change this heading "X" to: Y'
      const textReplaceMatch = command.match(/^(?:Change this (?:heading|button|link|text)[^"]*"[^"]*"[^:]*:\s*)?(.+)$/i)
      if (textReplaceMatch) {
        const newText = textReplaceMatch[1].trim()
        // If new text is short and simple, try quick edit
        if (newText.length > 0 && newText.length < 200 && !newText.includes('<')) {
          if (handleQuickEdit(newText)) {
            return // Quick edit succeeded, no need for full generation
          }
        }
      }
    }

    // Fall back to full generation
    handleGenerate(command)
  }

  const handleExport = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
    addConsoleLog('info', `Exported: ${projectName}.html`)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(html)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
    addConsoleLog('info', 'Code copied to clipboard')
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
    if (!runpodEndpoint) {
      addConsoleLog('error', 'RunPod endpoint not configured')
      return
    }

    setImageEdits(prev => prev.map(img =>
      img.id === imageId ? { ...img, operation, status: 'processing' } : img
    ))

    addConsoleLog('info', `Processing: ${operation}`)
    addTerminalLine('info', `Starting ${operation} on image...`)

    try {
      // Simulate RunPod API call (replace with actual endpoint)
      const image = imageEdits.find(img => img.id === imageId)
      if (!image) return

      const response = await fetch(runpodEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            image: image.url,
            operation,
          }
        })
      })

      if (!response.ok) throw new Error('Processing failed')

      const result = await response.json()

      setImageEdits(prev => prev.map(img =>
        img.id === imageId ? { ...img, status: 'complete', result: result.output?.image || result.output } : img
      ))

      addConsoleLog('info', `${operation} complete`)
      addTerminalLine('success', `✓ Image ${operation} complete`)
    } catch (error) {
      setImageEdits(prev => prev.map(img =>
        img.id === imageId ? { ...img, status: 'error' } : img
      ))
      addConsoleLog('error', `${operation} failed: ${error}`)
      addTerminalLine('error', `Image ${operation} failed`)
    }
  }

  const removeImage = (imageId: string) => {
    setImageEdits(prev => prev.filter(img => img.id !== imageId))
    if (selectedImage?.id === imageId) setSelectedImage(null)
  }

  // Insert image into website HTML
  const insertImageIntoWebsite = (imageUrl: string, altText: string = 'Image') => {
    if (!html) {
      addConsoleLog('warn', 'No website HTML to insert image into. Generate a website first.')
      return
    }

    // If there's a selected element that's an image, replace its src
    if (selectedElement && selectedElement.tagName.toLowerCase() === 'img') {
      const newHtml = html.replace(
        new RegExp(`<img[^>]*src=["'][^"']*["'][^>]*>`, 'i'),
        (match) => {
          if (match.includes(selectedElement.outerHTML.slice(0, 50))) {
            return match.replace(/src=["'][^"']*["']/, `src="${imageUrl}"`)
          }
          return match
        }
      )
      setHtml(newHtml)
      addToHistory(newHtml, `Replaced image with ${altText}`)
      addConsoleLog('success', `Replaced selected image with: ${altText}`)
    } else {
      // Insert as a new image element - find a good spot (after first section or in hero)
      const imgTag = `<img src="${imageUrl}" alt="${altText}" class="w-full h-auto rounded-lg shadow-lg" />`

      // Try to insert after the first <section> opening tag
      let newHtml = html
      const sectionMatch = html.match(/<section[^>]*>/i)
      if (sectionMatch) {
        const insertPoint = html.indexOf(sectionMatch[0]) + sectionMatch[0].length
        newHtml = html.slice(0, insertPoint) + `\n  <div class="my-8">${imgTag}</div>\n` + html.slice(insertPoint)
      } else {
        // Fallback: insert before closing body tag
        newHtml = html.replace('</body>', `<div class="my-8">${imgTag}</div>\n</body>`)
      }

      setHtml(newHtml)
      addToHistory(newHtml, `Added image: ${altText}`)
      addConsoleLog('success', `Inserted image: ${altText}`)
    }

    setShowImageLibrary(false)
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
    <div className="h-screen flex bg-[#09090b] text-white overflow-hidden">
      {/* Gradient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ width: 380 }}
        animate={{ width: sidebarCollapsed ? 56 : 380 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-full border-r border-white/[0.08] flex flex-col bg-white/[0.02] backdrop-blur-xl z-10"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Header */}
        <div className="h-14 border-b border-white/[0.08] flex items-center justify-between px-3">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 flex-1"
            >
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
              </button>
              <div className="h-5 w-px bg-white/10" />

              {/* Project dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => setShowProjectsDropdown(!showProjectsDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors w-full"
                >
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white truncate flex-1 text-left">{projectName}</span>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", showProjectsDropdown && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showProjectsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-2 border-b border-white/10">
                        <button
                          onClick={newProject}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-violet-400 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          New Project
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {projects.length === 0 ? (
                          <p className="text-xs text-zinc-600 text-center py-4">No saved projects</p>
                        ) : (
                          projects.map(project => (
                            <div
                              key={project.id}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 group"
                            >
                              <button
                                onClick={() => loadProject(project)}
                                className="flex-1 text-left"
                              >
                                <div className="text-sm text-white">{project.name}</div>
                                <div className="text-[10px] text-zinc-600">
                                  {new Date(project.updatedAt).toLocaleDateString()}
                                </div>
                              </button>
                              <button
                                onClick={() => deleteProject(project.id)}
                                className="p-1.5 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
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
                  html ? "hover:bg-white/5 text-zinc-500 hover:text-emerald-400" : "text-zinc-700"
                )}
              >
                <Save className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Skill Level Selector */}
        {!sidebarCollapsed && (
          <div className="p-3 border-b border-white/[0.08]">
            <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/[0.05]">
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
                        ? 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-white border border-violet-500/30'
                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
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

        {/* Panel Tabs */}
        {!sidebarCollapsed && (
          <div className="flex border-b border-white/[0.08] overflow-x-auto">
            {[
              { id: 'build' as Panel, icon: Wand2, label: 'Build' },
              { id: 'webstew' as Panel, icon: ChefHat, label: 'Stew', tour: 'webstew' },
              { id: 'projects' as Panel, icon: FolderOpen, label: 'Files' },
              { id: 'integrations' as Panel, icon: Link2, label: 'APIs' },
              { id: 'images' as Panel, icon: ImageIcon, label: 'Media' },
              { id: 'env' as Panel, icon: Variable, label: 'Env' },
              { id: 'console' as Panel, icon: Terminal, label: 'Log' },
              { id: 'deploy' as Panel, icon: Rocket, label: 'Ship', tour: 'deploy' },
            ].map(({ id, icon: Icon, label, tour }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                data-tour={tour}
                className={cn(
                  'flex-1 min-w-0 py-2 text-[10px] font-medium transition-all flex flex-col items-center gap-0.5',
                  activePanel === id
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-zinc-600 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {/* Build Panel */}
            {!sidebarCollapsed && activePanel === 'build' && (
              <motion.div
                key="build"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col"
              >
                {/* Build Progress */}
                <AnimatePresence>
                  {buildPhase !== 'idle' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3 py-2 border-b border-white/[0.08] bg-violet-500/5"
                    >
                      <div className="flex items-center justify-center gap-3">
                        {currentSteps.map((step, i) => (
                          <div key={step.phase} className="flex items-center gap-1.5">
                            <div className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center transition-all text-[10px]',
                              step.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
                              step.status === 'active' ? 'bg-violet-500/20 text-violet-400' :
                              'bg-zinc-800 text-zinc-600'
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
                                step.status === 'complete' ? 'bg-emerald-500/50' : 'bg-zinc-800'
                              )} />
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Terminal Output */}
                <div
                  ref={terminalRef}
                  className="flex-1 overflow-y-auto p-3 text-xs font-mono"
                >
                  {terminalLines.length === 0 ? (
                    <div className="h-full overflow-y-auto px-3 py-4 space-y-4">
                      {/* Quick Start Templates */}
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Quick Start</p>
                        <div className="grid grid-cols-2 gap-2">
                          {quickStartTemplates.slice(0, 4).map((template) => {
                            const Icon = template.icon
                            return (
                              <button
                                key={template.id}
                                onClick={() => {
                                  setCommandInput(template.prompt)
                                  handleGenerate(template.prompt)
                                }}
                                className="group relative p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] hover:border-white/[0.15] transition-all text-left overflow-hidden"
                              >
                                <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center mb-2`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-white text-xs font-medium">{template.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Skill-based Suggestions */}
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">
                          {currentSuggestions.label}
                        </p>
                        <div className="space-y-1.5">
                          {currentSuggestions.suggestions.slice(0, 4).map(({ icon: Icon, label, prompt }) => (
                            <button
                              key={label}
                              onClick={() => {
                                setCommandInput(prompt)
                                inputRef.current?.focus()
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-violet-500/20 transition-all text-left group"
                            >
                              <Icon className="w-3.5 h-3.5 text-violet-400 group-hover:text-violet-300" />
                              <span className="text-zinc-400 text-[11px] group-hover:text-zinc-300">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pro tip */}
                      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                        <p className="text-violet-400 text-[10px] font-medium mb-1">Pro tip</p>
                        <p className="text-zinc-500 text-[10px] leading-relaxed">
                          Click a Quick Start template to generate a full website instantly, or click a suggestion below to customize the prompt first.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {terminalLines.map((line, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            'flex items-start gap-2 py-0.5 px-2 rounded',
                            // Claude/Gemini terminal colors
                            line.type === 'command' && 'text-violet-400 bg-violet-500/5',
                            line.type === 'success' && 'text-emerald-400',
                            line.type === 'error' && 'text-red-400 bg-red-500/5',
                            line.type === 'info' && 'text-zinc-300',
                            line.type === 'output' && 'text-white',
                            line.type === 'phase' && 'text-blue-400 font-medium bg-blue-500/5',
                            line.type === 'ai' && 'text-amber-400 bg-amber-500/5',
                            line.type === 'system' && 'text-zinc-500 italic',
                          )}
                        >
                          {line.type === 'command' && <ChevronRight className="w-3 h-3 mt-0.5 text-violet-500" />}
                          {line.type === 'ai' && <Cpu className="w-3 h-3 mt-0.5 text-amber-500" />}
                          {line.type === 'success' && <Check className="w-3 h-3 mt-0.5 text-emerald-500" />}
                          {line.type === 'error' && <XCircle className="w-3 h-3 mt-0.5 text-red-500" />}
                          {line.type === 'phase' && <Sparkles className="w-3 h-3 mt-0.5 text-blue-500" />}
                          <span className="flex-1 break-words">{line.content}</span>
                        </motion.div>
                      ))}
                      {isGenerating && (
                        <div className="flex items-center gap-2 text-violet-400 py-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>generating...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Model Selector */}
                <div className="px-3 py-2 border-t border-white/[0.08]">
                  <div className="relative">
                    <button
                      onClick={() => setShowModelSelector(!showModelSelector)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-violet-500/20 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center',
                          selectedModel.provider === 'anthropic' ? 'bg-orange-500/20 text-orange-400' :
                          selectedModel.provider === 'openai' ? 'bg-emerald-500/20 text-emerald-400' :
                          selectedModel.provider === 'huggingface' ? 'bg-yellow-500/20 text-yellow-400' :
                          selectedModel.provider === 'together' ? 'bg-purple-500/20 text-purple-400' :
                          selectedModel.provider === 'cloudflare' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        )}>
                          {selectedModel.provider === 'anthropic' ? <Brain className="w-3.5 h-3.5" /> :
                           selectedModel.provider === 'openai' ? <Bot className="w-3.5 h-3.5" /> :
                           selectedModel.provider === 'huggingface' ? <Sparkles className="w-3.5 h-3.5" /> :
                           selectedModel.provider === 'together' ? <Zap className="w-3.5 h-3.5" /> :
                           selectedModel.provider === 'cloudflare' ? <Cloud className="w-3.5 h-3.5" /> :
                           <Sparkles className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xs text-white font-medium">{selectedModel.name}</p>
                            <p className="text-[10px] text-zinc-500">{selectedModel.description}</p>
                          </div>
                          {selectedModel.free && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              FREE
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        'w-4 h-4 text-zinc-500 transition-transform',
                        showModelSelector && 'rotate-180'
                      )} />
                    </button>

                    <AnimatePresence>
                      {showModelSelector && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-zinc-900 border border-white/[0.1] shadow-xl z-50 max-h-[300px] overflow-y-auto"
                        >
                          {/* FREE MODELS Section */}
                          <div className="mb-3 pb-2 border-b border-emerald-500/20">
                            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                              <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                                <Sparkles className="w-3 h-3" />
                              </div>
                              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">
                                FREE MODELS
                              </span>
                              <span className="ml-auto text-[9px] text-emerald-400/70">No payment required</span>
                            </div>
                            <div className="space-y-0.5">
                              {aiModels.filter(m => m.free).map((model) => (
                                <button
                                  key={model.id}
                                  onClick={() => {
                                    setSelectedModel(model)
                                    setShowModelSelector(false)
                                  }}
                                  className={cn(
                                    'w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left',
                                    selectedModel.id === model.id
                                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                                      : 'hover:bg-white/[0.05] border border-transparent'
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      'w-4 h-4 rounded flex items-center justify-center',
                                      model.provider === 'huggingface' ? 'bg-yellow-500/20 text-yellow-400' :
                                      model.provider === 'together' ? 'bg-purple-500/20 text-purple-400' :
                                      'bg-orange-500/20 text-orange-400'
                                    )}>
                                      {model.provider === 'huggingface' ? <Sparkles className="w-2.5 h-2.5" /> :
                                       model.provider === 'together' ? <Zap className="w-2.5 h-2.5" /> :
                                       <Cloud className="w-2.5 h-2.5" />}
                                    </div>
                                    <span className="text-[11px] text-white">{model.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                      FREE
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] text-zinc-500 capitalize">{model.provider}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* PAID Provider Groups */}
                          {(['anthropic', 'openai', 'google'] as AIProvider[]).map((provider) => (
                            <div key={provider} className="mb-2 last:mb-0">
                              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                                <div className={cn(
                                  'w-5 h-5 rounded flex items-center justify-center',
                                  provider === 'anthropic' ? 'bg-orange-500/20 text-orange-400' :
                                  provider === 'openai' ? 'bg-emerald-500/20 text-emerald-400' :
                                  'bg-blue-500/20 text-blue-400'
                                )}>
                                  {provider === 'anthropic' ? <Brain className="w-3 h-3" /> :
                                   provider === 'openai' ? <Bot className="w-3 h-3" /> :
                                   <Sparkles className="w-3 h-3" />}
                                </div>
                                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                                  {provider === 'anthropic' ? 'Claude' : provider === 'openai' ? 'OpenAI' : 'Google'}
                                </span>
                                {!apiKeys[provider] && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowApiKeyModal(true)
                                    }}
                                    className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px]"
                                  >
                                    <Key className="w-2.5 h-2.5" />
                                    Add Key
                                  </button>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                {aiModels.filter(m => m.provider === provider && !m.free).map((model) => (
                                  <button
                                    key={model.id}
                                    onClick={() => {
                                      setSelectedModel(model)
                                      setShowModelSelector(false)
                                    }}
                                    className={cn(
                                      'w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-left',
                                      selectedModel.id === model.id
                                        ? 'bg-violet-500/20 border border-violet-500/30'
                                        : 'hover:bg-white/[0.05] border border-transparent'
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-white">{model.name}</span>
                                      <span className={cn(
                                        'text-[9px] px-1.5 py-0.5 rounded',
                                        model.quality === 'best' ? 'bg-violet-500/20 text-violet-300' :
                                        model.quality === 'great' ? 'bg-blue-500/20 text-blue-300' :
                                        'bg-zinc-700 text-zinc-400'
                                      )}>
                                        {model.quality}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-zinc-500">{model.contextWindow}</span>
                                      <span className={cn(
                                        'text-[9px] px-1 py-0.5 rounded',
                                        model.speed === 'fast' ? 'bg-emerald-500/20 text-emerald-400' :
                                        model.speed === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/20 text-red-400'
                                      )}>
                                        {model.speed}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* API Keys Button */}
                          <div className="pt-2 mt-2 border-t border-white/[0.08]">
                            <button
                              onClick={() => {
                                setShowModelSelector(false)
                                setShowApiKeyModal(true)
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] transition-all"
                            >
                              <Key className="w-3.5 h-3.5 text-violet-400" />
                              <span className="text-xs text-zinc-400">Manage API Keys</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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

                {/* RunPod Endpoint */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" />
                    RunPod Endpoint
                  </label>
                  <input
                    type="text"
                    value={runpodEndpoint}
                    onChange={(e) => setRunpodEndpoint(e.target.value)}
                    placeholder="https://api.runpod.ai/v2/..."
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-violet-500/50"
                  />
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
                        {/* Image Preview */}
                        <div
                          className="relative aspect-video cursor-pointer"
                          onClick={() => setSelectedImage(image)}
                        >
                          <img
                            src={image.result || image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-all text-left group">
                    <Github className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Push to GitHub</div>
                      <div className="text-[10px] text-zinc-600">Create repository</div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 hover:from-violet-500/20 hover:to-fuchsia-500/20 transition-all text-left">
                    <Rocket className="w-5 h-5 text-violet-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Deploy Live</div>
                      <div className="text-[10px] text-violet-300/60">One-click deploy</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
        {/* Toolbar - High z-index so dropdowns appear above preview */}
        <header className="h-12 border-b border-white/[0.08] flex items-center justify-between px-4 bg-zinc-950/95 backdrop-blur-xl relative z-50">
          <div className="flex items-center gap-3">
            {/* Device toggles */}
            <div className="flex bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.05]">
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
                      : 'text-zinc-600 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* Element Selector */}
            <button
              onClick={() => {
                setSelectMode(!selectMode)
                if (!selectMode) {
                  addConsoleLog('info', 'Element selector enabled - click any element to edit')
                } else {
                  setSelectedElement(null)
                  setHoveredElement(null)
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                selectMode
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30 shadow-lg shadow-violet-500/20'
                  : 'bg-white/[0.03] text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/20 border border-white/[0.05]'
              )}
              title="Select elements to edit"
            >
              <Crosshair className={cn("w-3.5 h-3.5", selectMode && "animate-pulse")} />
              <span className="hidden sm:inline">{selectMode ? 'Selecting' : 'Select'}</span>
            </button>

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

            {/* Style Preset Picker */}
            <StylePresetPicker
              selected={selectedPreset}
              onChange={(preset) => {
                setSelectedPreset(preset.id)
                // Apply preset to current HTML if exists
                if (html) {
                  const presetStyles = generatePresetStyles(preset)
                  // Inject preset styles into the HTML
                  const updatedHtml = html.replace(
                    /<head>/i,
                    `<head>\n${presetStyles}`
                  )
                  setHtml(updatedHtml)
                  addConsoleLog('info', `Applied ${preset.name} style preset`)
                }
              }}
              compact
            />

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

            <div className="h-4 w-px bg-white/10 mx-1" />

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

        {/* Selected Element Indicator - Enhanced with AI Editing */}
        <AnimatePresence>
          {selectedElement && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-white/[0.08] bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent overflow-hidden"
            >
              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                {/* Element Info */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-violet-400" />
                    </div>
                    <code className="text-xs text-violet-400 font-mono font-medium">
                      &lt;{selectedElement.tagName.toLowerCase()}&gt;
                    </code>
                  </div>
                  {selectedElement.className && (
                    <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[100px]">
                      .{selectedElement.className.split(' ').slice(0, 2).join('.')}
                    </span>
                  )}
                  {selectedElement.id && (
                    <span className="text-[10px] text-amber-400 font-mono">
                      #{selectedElement.id}
                    </span>
                  )}
                </div>

                {/* AI Edit Input */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] focus-within:border-violet-500/50">
                    <Wand2 className="w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Edit with AI: 'make text larger' or 'change color to blue'..."
                      className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                          const editPrompt = (e.target as HTMLInputElement).value
                          const elementContext = `Modify this ${selectedElement.tagName.toLowerCase()} element: ${editPrompt}. The element currently contains: "${selectedElement.textContent?.slice(0, 100)}"`
                          setCommandInput(editPrompt)
                          ;(e.target as HTMLInputElement).value = ''
                          handleGenerate(elementContext)
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Quick Edit Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Quick Style Presets */}
                  <div className="flex gap-0.5 p-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                    {[
                      { icon: Type, label: 'Style text', prompt: 'Make the text larger and bolder' },
                      { icon: Palette, label: 'Change colors', prompt: 'Change colors to use a modern gradient' },
                      { icon: Box, label: 'Add spacing', prompt: 'Add more padding and margin for better spacing' },
                      { icon: Sparkles, label: 'Enhance', prompt: 'Make this element look more modern and professional' },
                    ].map(action => (
                      <button
                        key={action.label}
                        title={action.label}
                        onClick={() => {
                          const elementContext = `Modify the ${selectedElement.tagName.toLowerCase()} element: ${action.prompt}. Element content: "${selectedElement.textContent?.slice(0, 50)}"`
                          handleGenerate(elementContext)
                        }}
                        className="p-1.5 rounded hover:bg-violet-500/20 text-zinc-500 hover:text-violet-400 transition-colors"
                      >
                        <action.icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>

                  <div className="w-px h-5 bg-white/10 mx-1" />

                  {/* Copy/Delete Actions */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedElement.outerHTML || '')
                      addConsoleLog('info', 'Element HTML copied to clipboard')
                    }}
                    title="Copy HTML"
                    className="p-1.5 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      const deletePrompt = `Delete the ${selectedElement.tagName.toLowerCase()} element that contains: "${selectedElement.textContent?.slice(0, 50)}"`
                      handleGenerate(deletePrompt)
                    }}
                    title="Delete element"
                    className="p-1.5 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedElement(null)
                      setSelectMode(false)
                    }}
                    className="p-1.5 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover Element Tooltip */}
        <AnimatePresence>
          {selectMode && hoveredElement && !selectedElement && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 shadow-xl"
            >
              <code className="text-xs text-violet-400 font-mono">
                &lt;{hoveredElement.tagName.toLowerCase()}&gt;
              </code>
              {hoveredElement.className && (
                <span className="text-xs text-zinc-500 ml-2 font-mono">
                  .{hoveredElement.className.split(' ')[0]}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Area - z-0 to stay below header dropdowns */}
        <div className="flex-1 flex overflow-hidden relative z-0">
          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={cn(
              'relative flex items-center justify-center p-4 bg-zinc-950/50',
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
                className="absolute top-6 right-6 z-10 p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-all"
                title="Toggle fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Chef Loader - Simple, witty cooking animation */}
              <ChefLoader isVisible={isGenerating} />

              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                data-tour="preview"
                className="bg-white rounded-lg overflow-hidden shadow-2xl shadow-black/50 h-full transition-all duration-300"
                style={{ width: getDeviceWidth(), maxWidth: '100%' }}
              >
                {html ? (
                  <iframe
                    ref={iframeRef}
                    srcDoc={getHtmlWithConsole(html)}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
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

        {/* Floating Command Input - Draggable, Docked at Bottom Center */}
        <div
          data-chat-container
          style={chatPosition ? {
            position: 'fixed',
            left: chatPosition.x,
            top: chatPosition.y,
            zIndex: 40,
          } : {
            position: 'fixed',
            left: '50%',
            bottom: 24,
            transform: 'translateX(-50%)',
            zIndex: 40,
          }}
          className="w-full max-w-2xl px-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            data-tour="chat"
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl',
              'focus-within:border-violet-500/50 focus-within:shadow-violet-500/20',
              !isDraggingChat && 'transition-colors',
              isDraggingChat && 'cursor-grabbing',
              isGenerating
                ? 'bg-zinc-900/90 border-violet-500/40 shadow-violet-500/30'
                : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
            )}
          >
            {/* Drag Handle */}
            <div
              className="flex items-center gap-1 cursor-grab active:cursor-grabbing select-none touch-none"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()

                // Get the outer container
                const container = document.querySelector('[data-chat-container]') as HTMLElement
                if (!container) return

                const rect = container.getBoundingClientRect()

                // Store offset in ref (cursor position relative to element top-left)
                dragOffsetRef.current = {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                }

                setIsDraggingChat(true)

                const onMouseMove = (moveEvent: MouseEvent) => {
                  moveEvent.preventDefault()
                  setChatPosition({
                    x: moveEvent.clientX - dragOffsetRef.current.x,
                    y: moveEvent.clientY - dragOffsetRef.current.y,
                  })
                }

                const onMouseUp = () => {
                  setIsDraggingChat(false)
                  document.removeEventListener('mousemove', onMouseMove)
                  document.removeEventListener('mouseup', onMouseUp)
                }

                document.addEventListener('mousemove', onMouseMove)
                document.addEventListener('mouseup', onMouseUp)
              }}
            >
              <GripVertical className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
            </div>
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all',
              isGenerating
                ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse'
                : commandInput
                  ? 'bg-violet-500/20'
                  : 'bg-white/5'
            )}>
              {isGenerating ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Wand2 className={cn(
                  'w-4 h-4 transition-colors',
                  commandInput ? 'text-violet-400' : 'text-zinc-500'
                )} />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
              placeholder={isGenerating ? 'Building your website...' : 'Describe what to build or change...'}
              disabled={isGenerating}
              data-tour="prompt"
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center gap-2 shrink-0">
              {/* AI Model indicator */}
              <div className={cn(
                'hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium',
                selectedModel.provider === 'anthropic' ? 'bg-orange-500/10 text-orange-400' :
                selectedModel.provider === 'openai' ? 'bg-emerald-500/10 text-emerald-400' :
                selectedModel.provider === 'huggingface' ? 'bg-yellow-500/10 text-yellow-400' :
                selectedModel.provider === 'together' ? 'bg-purple-500/10 text-purple-400' :
                selectedModel.provider === 'cloudflare' ? 'bg-orange-500/10 text-orange-400' :
                'bg-blue-500/10 text-blue-400'
              )}>
                {selectedModel.provider === 'anthropic' ? <Brain className="w-3 h-3" /> :
                 selectedModel.provider === 'openai' ? <Bot className="w-3 h-3" /> :
                 selectedModel.provider === 'huggingface' ? <Sparkles className="w-3 h-3" /> :
                 selectedModel.provider === 'together' ? <Zap className="w-3 h-3" /> :
                 selectedModel.provider === 'cloudflare' ? <Cloud className="w-3 h-3" /> :
                 <Sparkles className="w-3 h-3" />}
                <span>{selectedModel.name.split(' ')[0]}</span>
                {selectedModel.free && <span className="text-emerald-400">FREE</span>}
              </div>
              <button
                onClick={handleCommandSubmit}
                disabled={!commandInput.trim() || isGenerating}
                className={cn(
                  'p-2 rounded-xl transition-all',
                  commandInput.trim() && !isGenerating
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105'
                    : 'bg-zinc-800 text-zinc-600'
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
          {/* Keyboard shortcut hint & dock button */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-[10px] text-zinc-600">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-500 font-mono">Enter</kbd> to generate
            </span>
            {chatPosition && (
              <button
                onClick={() => setChatPosition(null)}
                className="text-[10px] text-zinc-500 hover:text-violet-400 flex items-center gap-1 transition-colors"
              >
                <ArrowDown className="w-3 h-3" />
                Dock
              </button>
            )}
          </div>
        </div>
      </main>

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
                    <h2 className="text-lg font-semibold text-white">API Keys</h2>
                    <p className="text-xs text-zinc-500">Add your own keys to use AI models</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
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

                {/* Info */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-300/80">
                    Your API keys are stored locally in your browser and never sent to our servers.
                    You can also use our hosted AI service without adding keys.
                  </p>
                </div>
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
                  onClick={() => {
                    // Save to localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('ai-builder-api-keys', JSON.stringify(apiKeys))
                    }
                    setShowApiKeyModal(false)
                    addTerminalLine('success', 'API keys saved successfully')
                  }}
                  className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                >
                  Save Keys
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

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [quip, setQuip] = useState(loadingQuips[0])

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
