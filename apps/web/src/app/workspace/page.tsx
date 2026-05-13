'use client'

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// WebContainerPreview boots a Node sandbox in the browser to run real npm
// projects (Astro / Next.js / React / Expo web). Dynamic + ssr:false so the
// `@webcontainer/api` import doesn't run on the server.
const WebContainerPreview = dynamic(
  () => import('@/components/WebContainerPreview').then(m => m.WebContainerPreview),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">Booting preview…</div> }
)
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
  History,
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
  Award,
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
import { ContentPanel } from '@/components/builder/ContentPanel'
import { CustomDomainCard } from '@/components/builder/CustomDomainCard'
import { SiteGraderModal } from '@/components/builder/SiteGraderModal'
import { stylePresets, StylePreset, generatePresetStyles, applyThemeToHtml, generateAllThemesStyles } from '@/lib/builder/style-presets'
import { componentLibrary, ComponentSection, assemblePage } from '@/lib/builder/component-library'
import { imageService, getUnsplashImage, enhanceImagesInHtml } from '@/lib/builder/image-service'
import { ChefLoader } from '@/components/loading'
import {
  LUXE_ECOMMERCE_TEMPLATE,
  SAAS_LANDING_TEMPLATE,
  AGENCY_PORTFOLIO_TEMPLATE,
  FASHION_STORE_TEMPLATE,
  RESTAURANT_MENU_TEMPLATE,
  applyTemplateVariables,
} from '@/lib/templates'
// AgentPanel removed for simplicity - agent code preserved in /lib/agent if needed later
import { ExportPanel } from '@/components/builder/ExportPanel'

type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type ViewMode = 'preview' | 'code' | 'split'
type Panel = 'build' | 'projects' | 'integrations' | 'images' | 'video' | 'env' | 'console' | 'deploy' | 'webstew' | 'templates' | 'content'
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

interface ProjectPage {
  id: string
  name: string
  slug: string
  html: string
  isHome: boolean
}

interface SavedBlock {
  id: string
  name: string
  tag: string
  html: string
  savedAt: string  // ISO string for cleaner JSON serialization
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
// Quick Start Templates - Premium industry templates with detailed prompts.
// Some entries are pre-made (load instantly via setHtml), others trigger AI
// generation from `prompt`. Explicit type so TS doesn't narrow optional fields
// to never on the entries that omit them.
type QuickStartTemplate = {
  id: string
  icon: typeof Rocket
  label: string
  gradient: string
  prompt: string
  htmlTemplate?: string
  templateVariables?: Record<string, string | number | object[]>
  isPremade?: boolean
}
const quickStartTemplates: QuickStartTemplate[] = [
  {
    id: 'luxe-ecommerce',
    icon: ShoppingCart,
    label: 'Luxe Boutique',
    gradient: 'from-amber-600 to-rose-600',
    prompt: 'Apple-inspired luxury e-commerce template',
    htmlTemplate: LUXE_ECOMMERCE_TEMPLATE.html, // Pre-made template - no AI generation needed
    templateVariables: LUXE_ECOMMERCE_TEMPLATE.variables,
    isPremade: true,
  },
  {
    id: 'saas',
    icon: Rocket,
    label: 'SaaS Platform',
    gradient: 'from-indigo-600 to-purple-600',
    prompt: 'Premium SaaS landing page',
    htmlTemplate: SAAS_LANDING_TEMPLATE.html,
    templateVariables: SAAS_LANDING_TEMPLATE.variables,
    isPremade: true,
  },
  {
    id: 'agency',
    icon: Building2,
    label: 'Digital Agency',
    gradient: 'from-fuchsia-600 to-pink-600',
    prompt: 'Digital agency portfolio template',
    htmlTemplate: AGENCY_PORTFOLIO_TEMPLATE.html,
    templateVariables: AGENCY_PORTFOLIO_TEMPLATE.variables,
    isPremade: true,
  },
  {
    id: 'ecommerce',
    icon: ShoppingCart,
    label: 'E-Commerce',
    gradient: 'from-emerald-600 to-teal-600',
    prompt: 'Fashion e-commerce template',
    htmlTemplate: FASHION_STORE_TEMPLATE.html,
    templateVariables: FASHION_STORE_TEMPLATE.variables,
    isPremade: true,
  },
  {
    id: 'restaurant',
    icon: Store,
    label: 'Restaurant',
    gradient: 'from-amber-600 to-orange-600',
    prompt: 'Fine dining restaurant template',
    htmlTemplate: RESTAURANT_MENU_TEMPLATE.html,
    templateVariables: RESTAURANT_MENU_TEMPLATE.variables,
    isPremade: true,
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
      { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', placeholder: `sk_${'live'}_...`, isSecret: true },
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

  // Build target — what kind of project we're building. `website` is the
  // legacy single-HTML path that powers every state/effect below; the others
  // (astro/nextjs/react/expo) generate a multi-file VFS and render via
  // WebContainer instead of the srcDoc iframe. Adding new targets here without
  // wiring `vfsFiles` + the preview branch + the agent chat will break things —
  // grep for `buildTarget` first.
  type BuildTarget = 'website' | 'astro' | 'nextjs' | 'react' | 'expo'
  const [buildTarget, setBuildTarget] = useState<BuildTarget>('website')
  const [vfsFiles, setVfsFiles] = useState<Record<string, string>>({})
  const [vfsProjectMeta, setVfsProjectMeta] = useState<{ name: string; slug: string } | null>(null)

  // Inline edit mode — when on, headings/paragraphs in the preview iframe
  // become contenteditable. Blurring an edited element fires a postMessage
  // back here, which dispatches a chat message asking the agent to swap the
  // old text for the new in the source. Website target only (the script is
  // injected into srcDoc; WebContainer previews are a separate origin).
  const [editMode, setEditMode] = useState(false)

  // Site grader modal — runs the grader against the current draft HTML or
  // the deployed URL (when available) and shows score + actionable issues.
  const [graderOpen, setGraderOpen] = useState(false)

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

  // Inline edit modal — replaces native window.prompt() for right-click
  // "Edit Text" / "Edit Link" so the experience matches the rest of the app.
  const [inlineEdit, setInlineEdit] = useState<{
    show: boolean
    type: 'text' | 'link'
    title: string
    initialValue: string
    multiline: boolean
    onSave: (value: string) => void
  } | null>(null)

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
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)

  // Multi-page support — UI-only for now. The active page's html mirrors `html`
  // state above; switching tabs swaps both. Persistence to /api/projects/[id]/pages
  // is opt-in for signed-in users (existing endpoint already supports CRUD).
  const [pages, setPages] = useState<ProjectPage[]>([
    { id: 'home', name: 'Home', slug: 'index', html: '', isHome: true },
  ])
  const [activePageId, setActivePageId] = useState<string>('home')

  // User-saved blocks library — sections/components plucked from generated sites
  // for reuse. Persists to localStorage so it survives reloads.
  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>([])
  const [showBlocksPanel, setShowBlocksPanel] = useState(false)

  // Property-panel toggle — opens an inline second row below the element toolbar
  // with color/padding/radius swatches. Off by default to keep the bar compact.
  const [showStylePanel, setShowStylePanel] = useState(false)

  // Low-credit nudge — slides in from the right when monthly credits get low.
  // Only shows if the user is signed in AND credits are <= 30% of their plan
  // OR <= 30 absolute. Dismissable for 24h via localStorage. Pulses on entry
  // to grab attention; settles into a quiet glow.
  const [creditNudge, setCreditNudge] = useState<{
    show: boolean
    remaining?: number
    plan?: string
  }>({ show: false })

  useEffect(() => {
    if (!session?.user?.id) return
    let cancelled = false

    const checkCredits = async () => {
      try {
        // Honor a 24h dismissal cooldown
        const dismissedAt = parseInt(localStorage.getItem('webstew-credit-nudge-dismissed') || '0', 10)
        if (dismissedAt && Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return

        const res = await fetch('/api/usage')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return

        const planLimitCredits = data?.limits?.monthlyCredits ?? data?.limits?.credits ?? 100
        const usedThisMonth = data?.month?.credits ?? ((data?.month?.generations || 0) * 10)
        const remaining = Math.max(0, planLimitCredits - usedThisMonth)

        // Trigger when below 30% of plan OR below 30 credits absolute
        if (remaining <= 30 || remaining <= planLimitCredits * 0.3) {
          setCreditNudge({ show: true, remaining, plan: data?.user?.plan })
        }
      } catch {
        // Silent — usage endpoint failure shouldn't bother the user
      }
    }

    // Check on mount + every 60s
    checkCredits()
    const interval = setInterval(checkCredits, 60_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [session?.user?.id])

  // Credit wall — modal that appears when /api/builder/generate or /converse
  // returns 402 (anon trial cap) or 429 (signed-in plan limit).
  const [creditWall, setCreditWall] = useState<{
    show: boolean
    title?: string
    message?: string
    limit?: number
    isPlanLimit?: boolean
    plan?: string
  }>({ show: false })

  // Rewrite a page's nav to link to all sibling pages. Pure DOM operation —
  // no AI call. Looks for <nav> blocks, finds the largest direct-child <a> group
  // inside, copies styling from the first existing anchor, then replaces those
  // anchors with one per sibling page. Also handles [data-mobile-menu]. The
  // current page's anchor gets aria-current="page".
  // Conservative: if no <nav> or no link group found, returns html unchanged.
  const syncPageNav = useCallback((pageHtml: string, allPages: Pick<ProjectPage, 'name' | 'slug' | 'isHome'>[], currentSlug: string): string => {
    if (typeof window === 'undefined' || !pageHtml.trim()) return pageHtml
    try {
      const isFullDoc = /<!doctype|<html\b/i.test(pageHtml)
      const wrapped = isFullDoc ? pageHtml : `<!doctype html><html><head></head><body>${pageHtml}</body></html>`
      const doc = new DOMParser().parseFromString(wrapped, 'text/html')

      const buildNewLinks = (sampleClass: string): HTMLAnchorElement[] =>
        allPages.map(p => {
          const a = doc.createElement('a')
          a.href = p.isHome ? '/' : `/${p.slug}`
          a.className = sampleClass
          a.textContent = p.name
          if (p.slug === currentSlug) a.setAttribute('aria-current', 'page')
          return a
        })

      // Find link group containers — divs/uls/spans with multiple direct <a> children.
      // For each candidate, replace its anchors with the synced list.
      const findAndUpdateLinkGroups = (root: Element) => {
        const candidates = Array.from(root.querySelectorAll<HTMLElement>('div, ul, span'))
          .filter(el => Array.from(el.children).filter(c => c.tagName === 'A').length >= 2)
        if (candidates.length === 0) return false
        // Pick the candidate with the most direct anchor children
        candidates.sort((a, b) =>
          Array.from(b.children).filter(c => c.tagName === 'A').length -
          Array.from(a.children).filter(c => c.tagName === 'A').length
        )
        const container = candidates[0]
        const existingLinks = Array.from(container.children).filter(c => c.tagName === 'A') as HTMLAnchorElement[]
        const sampleClass = existingLinks[0]?.className || ''
        existingLinks.forEach(a => a.remove())
        buildNewLinks(sampleClass).forEach(a => container.appendChild(a))
        return true
      }

      // Update primary <nav>
      const navs = Array.from(doc.querySelectorAll('nav'))
      navs.forEach(nav => findAndUpdateLinkGroups(nav))

      // Update mobile menu (often outside <nav>)
      const mobileMenus = doc.querySelectorAll('[data-mobile-menu]')
      mobileMenus.forEach(menu => findAndUpdateLinkGroups(menu as Element))

      return isFullDoc ? doc.documentElement.outerHTML : doc.body.innerHTML
    } catch (e) {
      console.warn('[syncPageNav] failed:', e)
      return pageHtml
    }
  }, [])

  const syncNavAcrossPages = useCallback(() => {
    if (pages.length < 2) {
      addToast('info', 'Only one page — nothing to sync')
      return
    }
    const pageMeta = pages.map(p => ({ name: p.name, slug: p.slug, isHome: p.isHome }))
    let changed = 0
    // Snapshot current html into the active page so we work on its latest version
    const snapshotPages = pages.map(p => p.id === activePageId ? { ...p, html } : p)
    const updatedPages = snapshotPages.map(p => {
      const updated = syncPageNav(p.html, pageMeta, p.slug)
      if (updated !== p.html) changed++
      return { ...p, html: updated }
    })
    setPages(updatedPages)
    // If the active page changed, push it to the editor + history (inline
    // setHistory to avoid forward-reference to addToHistory which is declared
    // later in this component).
    const newActive = updatedPages.find(p => p.id === activePageId)
    if (newActive && newActive.html !== html) {
      setHtml(newActive.html)
      const entry: HistoryEntry = { html: newActive.html, prompt: 'Synced nav across pages', timestamp: new Date() }
      setHistory(prev => [...prev.slice(-29), entry])
      setHistoryIndex(prev => Math.min(prev + 1, 29))
    }
    addToast(changed > 0 ? 'success' : 'info',
      changed > 0 ? `Synced nav on ${changed} page${changed === 1 ? '' : 's'}` : 'Nav already in sync')
  }, [pages, activePageId, html, syncPageNav])

  // Switch active page — swap displayed html with the new page's content,
  // and stash the current html into the page we're leaving.
  const switchToPage = useCallback((pageId: string) => {
    setPages(prev => {
      const cur = prev.find(p => p.id === activePageId)
      if (!cur) return prev
      // Snapshot the live editor html into the page we're leaving
      return prev.map(p => p.id === activePageId ? { ...p, html: html } : p)
    })
    setActivePageId(pageId)
    const target = pages.find(p => p.id === pageId)
    if (target) {
      setHtml(target.html)
    }
  }, [activePageId, html, pages])

  const addNewPage = useCallback((name: string) => {
    const trimmed = name.trim() || `Page ${pages.length + 1}`
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `page-${pages.length + 1}`
    if (pages.some(p => p.slug === slug)) {
      addToast('error', `Page "${slug}" already exists`)
      return
    }
    const newPage: ProjectPage = {
      id: `page-${Date.now()}`,
      name: trimmed,
      slug,
      html: '',
      isHome: false,
    }
    // Snapshot current html into the active page, then sync nav across all
    // existing pages so they include a link to the new page. Pure DOM rewrite,
    // no AI call.
    const allPagesAfter = [
      ...pages.map(p => p.id === activePageId ? { ...p, html } : p),
      newPage,
    ]
    const pageMeta = allPagesAfter.map(p => ({ name: p.name, slug: p.slug, isHome: p.isHome }))
    let navsSynced = 0
    const synced = allPagesAfter.map(p => {
      if (p.id === newPage.id) return p // new page has no html yet
      const updated = syncPageNav(p.html, pageMeta, p.slug)
      if (updated !== p.html) navsSynced++
      return { ...p, html: updated }
    })
    setPages(synced)
    setActivePageId(newPage.id)
    setHtml('')
    if (navsSynced > 0) {
      addToast('success', `Added "${trimmed}" — synced nav on ${navsSynced} existing page${navsSynced === 1 ? '' : 's'}`)
    } else {
      addToast('success', `Added page "${trimmed}" — describe it in chat to generate`)
    }
  }, [pages, activePageId, html, syncPageNav])

  // ===== Saved blocks: load, persist, save, insert, delete =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem('webstew-saved-blocks')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setSavedBlocks(parsed)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('webstew-saved-blocks', JSON.stringify(savedBlocks))
    } catch {}
  }, [savedBlocks])

  // Tailwind class swaps for the property panel. Each family has a regex that
  // matches the existing utility on the OUTER element (first whitespace-separated
  // class group only — children's classes are left alone).
  // Returns the updated outer-element string.
  const swapClassOnOuter = useCallback((outerHtml: string, family: 'textColor' | 'bgColor' | 'padding' | 'radius', newClass: string): string => {
    // Capture the opening tag and its class attribute
    const tagMatch = outerHtml.match(/^<([a-zA-Z0-9]+)([^>]*)>/)
    if (!tagMatch) return outerHtml
    const [fullTag, tagName, attrs] = tagMatch
    const classMatch = attrs.match(/\sclass=["']([^"']*)["']/)
    const existing = classMatch ? classMatch[1] : ''

    // Remove conflicting classes from the existing class list per family
    const familyPatterns: Record<typeof family, RegExp> = {
      textColor:  /\btext-(?:white|black|slate|zinc|gray|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?\b/g,
      bgColor:    /\bbg-(?:white|black|slate|zinc|gray|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g,
      padding:    /\b(?:p|px|py)-\d{1,2}\b/g,
      radius:     /\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?\b/g,
    }
    const cleaned = existing.replace(familyPatterns[family], '').replace(/\s+/g, ' ').trim()
    const newClasses = cleaned ? `${cleaned} ${newClass}`.trim() : newClass

    let newAttrs: string
    if (classMatch) {
      newAttrs = attrs.replace(/\sclass=["'][^"']*["']/, ` class="${newClasses}"`)
    } else {
      newAttrs = `${attrs} class="${newClasses}"`
    }
    return `<${tagName}${newAttrs}>${outerHtml.slice(fullTag.length)}`
  }, [])

  // Apply a property change to the selected element and update html state.
  // The caller passes the element + family + new class so we don't forward-
  // reference selectedElement.
  const applyPropertyChange = useCallback((
    el: { outerHTML?: string; tagName?: string } | null,
    family: 'textColor' | 'bgColor' | 'padding' | 'radius',
    newClass: string,
    setSelectedFn: (el: any) => void
  ) => {
    if (!el?.outerHTML || !html) return
    const updatedOuter = swapClassOnOuter(el.outerHTML, family, newClass)
    if (updatedOuter === el.outerHTML) return
    if (!html.includes(el.outerHTML)) {
      addToast('error', 'Element no longer matches — re-select it')
      return
    }
    const newHtml = html.replace(el.outerHTML, updatedOuter)
    setHtml(newHtml)
    // Update selection so subsequent property tweaks operate on the new outerHTML
    setSelectedFn({ ...el, outerHTML: updatedOuter })
    const entry: HistoryEntry = { html: newHtml, prompt: `${family}: ${newClass}`, timestamp: new Date() }
    setHistory(prev => [...prev.slice(-29), entry])
    setHistoryIndex(prev => Math.min(prev + 1, 29))
  }, [html, swapClassOnOuter])

  // Caller passes the element to avoid a forward reference to selectedElement state
  // (declared later in this component).
  const saveBlockFromElement = useCallback((el: { outerHTML?: string; tagName?: string; textContent?: string } | null) => {
    if (!el?.outerHTML) {
      addToast('error', 'Select an element first')
      return
    }
    const tag = el.tagName?.toLowerCase() || 'block'
    const defaultName = el.textContent?.slice(0, 40).trim() || `${tag} block`
    const name = window.prompt('Name this block', defaultName)
    if (!name) return
    const block: SavedBlock = {
      id: `block-${Date.now()}`,
      name: name.trim(),
      tag,
      html: el.outerHTML,
      savedAt: new Date().toISOString(),
    }
    setSavedBlocks(prev => [block, ...prev].slice(0, 50))
    addToast('success', `Saved "${block.name}"`)
  }, [])

  const insertSavedBlock = useCallback((block: SavedBlock) => {
    if (!html) {
      // Empty page — just set it
      setHtml(block.html)
      addToHistory(block.html, `Inserted block: ${block.name}`)
      addToast('success', `Inserted "${block.name}"`)
      setShowBlocksPanel(false)
      return
    }
    // Insert before </body>, or append if no body tag
    const newHtml = html.includes('</body>')
      ? html.replace('</body>', `${block.html}\n</body>`)
      : `${html}\n${block.html}`
    setHtml(newHtml)
    addToHistory(newHtml, `Inserted block: ${block.name}`)
    addToast('success', `Inserted "${block.name}"`)
    setShowBlocksPanel(false)
  }, [html])

  const deleteSavedBlock = useCallback((id: string) => {
    setSavedBlocks(prev => prev.filter(b => b.id !== id))
  }, [])

  const deletePage = useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId)
    if (!page) return
    if (page.isHome) {
      addToast('error', "Can't delete the home page")
      return
    }
    if (!confirm(`Delete page "${page.name}"? This can't be undone.`)) return
    setPages(prev => prev.filter(p => p.id !== pageId))
    if (activePageId === pageId) {
      const home = pages.find(p => p.isHome) || pages[0]
      setActivePageId(home.id)
      setHtml(home.html)
    }
  }, [pages, activePageId])

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
  // Image-to-video: when set, the Generate button switches to animating this image.
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null)
  const [videoSourceUploading, setVideoSourceUploading] = useState(false)
  // Model dropdown — animate-diff for text-to-vid, svd for image-to-vid (auto-picked).
  const [videoModel, setVideoModel] = useState<'animate-diff' | 'zeroscope' | 'svd'>('animate-diff')

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

  // Share preview state — anon-friendly /preview/<token> link (7-day TTL).
  // Skips the GitHub+Render bake; serves the snapshot from Mongo with a
  // Webstew-branded footer so every share is also a referral surface.
  const [isSharingPreview, setIsSharingPreview] = useState(false)
  const [previewLink, setPreviewLink] = useState<string | null>(null)

  // Signup nudge — fires for anon users at conversion-relevant moments:
  //   first-build:    once, after their first generation completes (celebratory)
  //   save:           when they click Save (project lives only in this browser)
  //   deploy-render:  when they click Deploy (needs an account)
  //   deploy-github:  when they click Push to GitHub
  // The "first-build" flavor is dismissable and remembered in sessionStorage
  // so we don't pop it twice. Action attempts (save/deploy) always nudge —
  // the work itself can't proceed without an account.
  type NudgeReason = 'first-build' | 'save' | 'deploy-render' | 'deploy-github'
  const [signupNudge, setSignupNudge] = useState<{ show: boolean; reason: NudgeReason | null }>({ show: false, reason: null })

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
  // Bump to force-remount the preview iframe. We can't call
  // contentWindow.location.reload() — the iframe is sandboxed without
  // allow-same-origin, so cross-origin access throws SecurityError.
  const [previewBumpKey, setPreviewBumpKey] = useState(0)
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

  // Load initial prompt from URL params. Auto-fire generation immediately —
  // matches Lovable/v0/Bolt/Manus, the standard new-user flow: type prompt on
  // landing, land in workspace with preview already building. The URL is
  // cleared on the very first fire so reloads / signup-retry loops can't
  // re-trigger the same prompt. We do NOT restore a localStorage cache here;
  // a stale cached result for a matching prompt previously surfaced old HTML
  // instead of a fresh build (see commit 026728a).
  useEffect(() => {
    if (hasInitialized) return

    const promptFromUrl = searchParams.get('prompt')
    const projectId = searchParams.get('project')

    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        loadProject(project)
      }
      setHasInitialized(true)
    } else if (promptFromUrl) {
      // Clear URL first so a reload / browser-back can't re-fire the same prompt
      router.replace('/workspace', { scroll: false })
      // Show the prompt in the chat so the user sees what's being built
      setChatMessages(prev => [...prev, { role: 'user', content: promptFromUrl }])
      // User just submitted a real prompt — they don't need the onboarding tour.
      // Without this, the tour pops up ~1.5s after we clear the URL and
      // interrupts the generation flow.
      try { localStorage.setItem('webstew-onboarding-complete', 'true') } catch {}
      setHasCompletedOnboarding(true)
      setHasInitialized(true)
      // A prompt arriving via URL = user came from the landing page = a
      // brand new build. Clear any leftover HTML so handleGenerate fires
      // in fresh-build mode (no currentHtml = no "surgical editor" mode).
      setHtml('')
      setChatMessages(prev => prev.filter((_, i) => i === prev.length - 1)) // keep only the just-added user prompt
      // Fire generation immediately — this is the user's request from the landing page
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
      // Snapshot the current html into the active page before serializing pages
      const pagesSnapshot = pages.map(p =>
        p.id === activePageId ? { ...p, html: htmlToSave } : p
      )
      const autoSaveData = {
        html: htmlToSave,
        projectName,
        timestamp: new Date().toISOString(),
        selectedPreset,
        truncated: html.length > maxSize,
        pages: pagesSnapshot,
        activePageId,
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
  }, [html, projectName, selectedPreset, pages, activePageId])

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
            // Restore multi-page state if it was saved
            if (Array.isArray(saved.pages) && saved.pages.length > 0) {
              setPages(saved.pages)
              if (saved.activePageId && saved.pages.some((p: ProjectPage) => p.id === saved.activePageId)) {
                setActivePageId(saved.activePageId)
              }
            }
            addTerminalLine('system', '⏪ Restored previous session from auto-save')
            addConsoleLog('info', 'Auto-save restored - your work is safe!')
          }
        } catch (e) {
          console.error('Failed to restore auto-save:', e)
        }
      }
    }
  }, [hasInitialized, searchParams])

  // Check onboarding status on mount. Only show for users who landed here with
  // no prompt and no existing project — otherwise the tour interrupts an
  // in-progress generation kicked off from the landing-page submit.
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('webstew-onboarding-complete')
    const isMidGeneration = isGenerating || html.length > 0
    if (!hasSeenOnboarding && hasInitialized && !searchParams.get('prompt') && !isMidGeneration) {
      const timer = setTimeout(() => {
        // Re-check at timer fire so a generation that started during the delay
        // still suppresses the tour.
        if (!isGenerating && html.length === 0) setShowOnboarding(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
    if (hasSeenOnboarding) {
      setHasCompletedOnboarding(true)
    }
  }, [hasInitialized, searchParams, isGenerating, html])

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
      // Only accept messages from our own preview iframe — otherwise any
      // embedded ad / extension iframe could spoof element-click, image-drop,
      // or context-menu messages and mutate the user's HTML.
      const previewWin = iframeRef.current?.contentWindow
      if (previewWin && event.source !== previewWin) return
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
      } else if (event.data?.type === 'navigate-page') {
        // User clicked an internal link in the preview — switch tabs if the
        // target page exists. Otherwise show a hint that they can create it.
        const target: string = event.data.target
        const matched = pages.find(p =>
          p.slug.toLowerCase() === target ||
          p.name.toLowerCase() === target ||
          (target === 'index' && p.isHome)
        )
        if (matched) {
          if (matched.id !== activePageId) switchToPage(matched.id)
        } else {
          addToast('info', `Page "/${target}" doesn't exist yet — click "+ Add page" to create it`)
        }
      } else if (event.data?.type === 'open-external') {
        // External link from preview — open in a new tab so it doesn't blow up
        // the workspace iframe.
        const href: string = event.data.href || ''
        if (/^https?:\/\//i.test(href)) {
          window.open(href, '_blank', 'noopener,noreferrer')
        }
      } else if (event.data?.type === 'webstew-inline-edit') {
        // Inline edit from the preview iframe. Pure local find/replace on the
        // html string — no agent round-trip. The agent was wasteful for a
        // 3-char heading change (it tried to rewrite the entire 5K-line file
        // and hit max_tokens). Local swap is instant; Save persists it; the
        // history stack remembers it for undo.
        const oldText: string = String(event.data.oldText || '').trim()
        const newText: string = String(event.data.newText || '').trim()
        if (!oldText || !newText || oldText === newText) return
        setHtml(prev => {
          const idx = prev.indexOf(oldText)
          if (idx === -1) {
            addConsoleLog('warn', `Inline edit: couldn't find "${oldText.slice(0, 60)}" in source`)
            return prev
          }
          const second = prev.indexOf(oldText, idx + oldText.length)
          if (second !== -1) {
            // Ambiguous — don't guess. The user can fix in code view or chat.
            addConsoleLog('warn', `Inline edit: "${oldText.slice(0, 40)}" appears multiple times; skipped`)
            addToast('error', 'Text appears multiple times — edit in code view')
            return prev
          }
          const next = prev.slice(0, idx) + newText + prev.slice(idx + oldText.length)
          addToHistory(next, `Inline edit: ${oldText.slice(0, 30)} → ${newText.slice(0, 30)}`)
          return next
        })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [addConsoleLog, selectMode, html, pages, activePageId, switchToPage])

  // Project management
  const saveProject = async () => {
    // Anon users: still do the local backup (no work lost on refresh), but
    // pop the signup nudge so they know cloud-save needs an account.
    if (!session?.user) {
      setSignupNudge({ show: true, reason: 'save' })
    }
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
  const sharePreview = async () => {
    if (!html.trim()) {
      addToast('error', 'Nothing to share yet — build a site first')
      return
    }
    setIsSharingPreview(true)
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, name: projectName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create preview')
      setPreviewLink(data.url)
      try {
        await navigator.clipboard.writeText(data.url)
        addToast('success', 'Preview link copied — expires in 7 days')
      } catch {
        addToast('success', `Preview link ready: ${data.url}`)
      }
      addConsoleLog('success', `Preview link created: ${data.url}`)
    } catch (e: any) {
      const msg = e?.message || 'Failed to create preview'
      addToast('error', msg)
      addConsoleLog('error', msg)
    } finally {
      setIsSharingPreview(false)
    }
  }

  const deployToGitHub = async () => {
    // Anon users get the signup wall instead of a silent 401. Don't even
    // hit the API — short-circuit to the nudge so the conversion moment
    // doesn't get drowned out by a deploy-failed toast.
    if (!session?.user) {
      setSignupNudge({ show: true, reason: 'deploy-github' })
      return
    }
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
            { path: 'README.md', content: `# ${projectName}\n\nBuilt with Webstew (https://webstew.net)` }
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
    if (!session?.user) {
      setSignupNudge({ show: true, reason: 'deploy-render' })
      return
    }
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

      // Build the file list — every non-empty page becomes its own .html file.
      // Active page's html state is the source of truth (might be unsaved); other
      // tabs use their stored html. Home page is always index.html.
      const pagesSnapshot = pages.map(p =>
        p.id === activePageId ? { ...p, html } : p
      ).filter(p => p.html && p.html.trim().length > 0)
      const files = pagesSnapshot.length > 0
        ? pagesSnapshot.map(p => ({
            path: p.isHome ? 'index.html' : `${p.slug}.html`,
            content: p.html,
          }))
        : [{ path: 'index.html', content: html }]
      addTerminalLine('info', `📄 Deploying ${files.length} page${files.length === 1 ? '' : 's'}: ${files.map(f => f.path).join(', ')}`)

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          files,
          // Optional — when present, /api/deploy bakes any published CMS
          // collections into `cms/<slug>.json` (and Astro markdown if relevant).
          projectId: currentProject?.id,
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
      if (!res.ok) {
        addTerminalLine('error', `Template fetch failed (${res.status})`)
        return
      }
      const data = await res.json()
      const template = data.templates?.[0]
      const content: string = template?.html_content || ''
      // Guard against stub/empty templates that just render as a near-blank page.
      // These were the "test" entries that confused users — show a clear message
      // instead of loading 50 chars of placeholder HTML and pretending it worked.
      if (!content.trim() || content.trim().length < 500) {
        addTerminalLine('error', `Template "${templateName}" is incomplete (${content.length} chars). Use a Quick Start tile instead.`)
        addToast('error', `Template "${templateName}" appears to be a stub — try a Quick Start tile`)
        return
      }
      setHtml(content)
      setViewMode('preview')
      addTerminalLine('success', `✓ Loaded "${templateName}" template`)
      addConsoleLog('success', `Template "${templateName}" loaded successfully`)
      addToHistory(content, `Loaded ${templateName} template`)
    } catch (error) {
      addTerminalLine('error', `Failed to load template: ${error}`)
    }
  }

  // Inject console interceptor and element selector into HTML
  const getHtmlWithConsole = useCallback((originalHtml: string) => {
    const consoleScript = `
<script>
(function() {
  // Intercept link navigation. Original hrefs were rewritten to javascript:void(0)
  // before the HTML reached this iframe (parent did href→data-href swap), so the
  // iframe can never navigate itself. We read data-href, then route:
  //   - hash anchors scroll in-page (smooth-scroll script handles)
  //   - internal page paths postMessage to parent → parent switches tabs
  //   - external https URLs open in a new tab via parent
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;
    // Always prevent default — hrefs are now javascript:void(0) anyway, but
    // we don't want any action while the user is editing.
    var href = link.getAttribute('data-href') || link.getAttribute('href') || '';
    // Hash anchors run their own smooth-scroll behavior; for those we manually
    // scroll to the target since the original href was replaced.
    if (href.startsWith('#') && href.length > 1) {
      e.preventDefault();
      try {
        var target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (_) {}
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (!href || href === '#' || href.toLowerCase().startsWith('javascript:')) return;
    // External — open in a new tab (parent decides; iframe can't open windows).
    // NOTE: backslashes in regexes inside this template literal must be doubled
    // (\\/, \\.) so the literal in the iframe still has a single backslash.
    if (/^https?:\\/\\//i.test(href)) {
      window.parent.postMessage({ type: 'open-external', href: href }, '*');
      return;
    }
    // Internal page links — tell parent, parent switches tabs
    var isInternal = href.startsWith('/') || /^[a-z0-9_-]+(\\.html)?$/i.test(href);
    if (isInternal) {
      var slug = href.replace(/^\\//, '').replace(/\\.html$/i, '').toLowerCase();
      if (!slug || slug === 'index' || slug === 'home') slug = 'index';
      window.parent.postMessage({ type: 'navigate-page', target: slug }, '*');
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

  // IMAGE FALLBACK — Stop broken external images (rate-limited CDNs, dead
  // Unsplash IDs, etc.) from making the preview look junky. When an <img>
  // fails to load, swap to a neutral placeholder pattern with the original
  // alt text so the user still understands what was supposed to be there.
  function makePlaceholder(w, h, label) {
    var W = Math.max(120, w || 400);
    var H = Math.max(80, h || 300);
    var txt = (label || 'image').replace(/[<>&"']/g, '').slice(0, 40);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs><pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse">' +
      '<rect width="20" height="20" fill="#e2e8f0"/><rect width="10" height="10" fill="#cbd5e1"/>' +
      '<rect x="10" y="10" width="10" height="10" fill="#cbd5e1"/></pattern></defs>' +
      '<rect width="100%" height="100%" fill="url(#p)"/>' +
      '<text x="50%" y="50%" font-family="system-ui,sans-serif" font-size="14" fill="#64748b" text-anchor="middle" dominant-baseline="middle">' + txt + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  function attachImgFallback(img) {
    if (img.dataset.fallbackBound) return;
    img.dataset.fallbackBound = '1';
    img.addEventListener('error', function() {
      if (img.dataset.fellBack) return; // avoid loop
      img.dataset.fellBack = '1';
      img.src = makePlaceholder(img.naturalWidth || img.width, img.naturalHeight || img.height, img.alt);
    });
    if (img.complete && img.naturalWidth === 0 && img.src) {
      img.dispatchEvent(new Event('error'));
    }
  }
  document.querySelectorAll('img').forEach(attachImgFallback);
  new MutationObserver(function(muts) {
    muts.forEach(function(m) {
      m.addedNodes.forEach(function(n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'IMG') attachImgFallback(n);
        else if (n.querySelectorAll) n.querySelectorAll('img').forEach(attachImgFallback);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
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

    // Neutralize anchor hrefs so the iframe can't navigate itself away. The
    // sandbox can't block within-iframe nav, and inline onclick or scripts in
    // generated HTML routinely bypass our preventDefault. Stash the original
    // href in data-href; the in-iframe click handler reads it and postMessages
    // to the parent, which switches tabs (or opens external in a new tab).
    // Hash anchors (#section) stay live so smooth-scroll still works.
    result = result.replace(
      /<a\b([^>]*?)\shref=(["'])([^"']*)\2([^>]*)>/gi,
      (match, before, quote, href, after) => {
        // Leave hash-only and javascript: hrefs alone
        if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) {
          return match
        }
        // Skip if already neutralized (avoid double-processing)
        if (/data-href=/.test(before + after)) return match
        return `<a${before} href=${quote}javascript:void(0)${quote} data-href=${quote}${href}${quote}${after}>`
      }
    )

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

    // Inline edit script — only injected when editMode is on. Makes every
    // visible heading/paragraph/button/list-item contenteditable, draws a
    // dashed violet outline on focus, and on blur posts the diff back to the
    // parent so the agent can apply it to the source. We track originalText
    // per element so we can send (oldText, newText) instead of trying to
    // build a stable selector — the agent uses string-replace which is more
    // robust against minor HTML drift.
    if (editMode) {
      const inlineEditScript = `
<style>
  /* Hover + focus indicators rely on outline + box-shadow only — we cannot
     touch the element's \`background\` property because LLM-generated heroes
     often use \`background-image: linear-gradient + -webkit-background-clip: text
     + -webkit-text-fill-color: transparent\` for gradient text. Overriding
     background there makes the text fall through to transparent and
     disappear (light-theme presets in particular). The outline + tinted
     box-shadow ring give the same visual affordance without breaking the
     site's own paint pipeline. */
  [data-webstew-editable]:hover { outline: 1px dashed rgba(139,92,246,0.5); outline-offset: 2px; cursor: text; }
  [data-webstew-editable]:focus {
    outline: 2px solid #8b5cf6;
    outline-offset: 2px;
    box-shadow: 0 0 0 6px rgba(139,92,246,0.12);
    border-radius: 2px;
    caret-color: #8b5cf6;
  }
  body::after { content: 'Edit mode on — click any text to edit'; position: fixed; bottom: 12px; right: 12px; background: linear-gradient(90deg, #8b5cf6, #d946ef); color: white; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-family: -apple-system, system-ui, sans-serif; box-shadow: 0 4px 12px rgba(139,92,246,0.4); pointer-events: none; z-index: 2147483647; }
</style>
<script>
(function() {
  // Tag every leaf-text element. We exclude nav links + form inputs since
  // they have specialised handling already.
  var SELECTORS = 'h1,h2,h3,h4,h5,h6,p,li,button,blockquote,figcaption,span';
  var nodes = document.querySelectorAll(SELECTORS);
  nodes.forEach(function(el) {
    // Skip if it contains other tagged elements — only mark leaf nodes that
    // own their own text, so editing doesn't blow away nested markup.
    if (el.querySelector(SELECTORS)) return;
    var text = (el.textContent || '').trim();
    if (!text || text.length > 500) return; // too long → probably a section, skip
    el.setAttribute('data-webstew-editable', '');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.dataset.webstewOriginal = text;
    el.addEventListener('blur', function() {
      var newText = (el.textContent || '').trim();
      var oldText = el.dataset.webstewOriginal || '';
      if (newText && newText !== oldText) {
        window.parent.postMessage({
          type: 'webstew-inline-edit',
          oldText: oldText,
          newText: newText,
          tag: el.tagName.toLowerCase(),
        }, '*');
        el.dataset.webstewOriginal = newText;
      }
    }, true);
    // Block Enter from inserting newlines in single-line tags (h1-h6, button, li)
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && /^(h[1-6]|button|li|span)$/.test(el.tagName.toLowerCase())) {
        e.preventDefault();
        el.blur();
      }
    });
  });
})();
</script>`
      if (result.includes('</body>')) {
        result = result.replace('</body>', `${inlineEditScript}</body>`)
      } else {
        result = result + inlineEditScript
      }
    }

    return result
  }, [selectMode, editMode])

  // Multi-target generation for Astro / Next.js / React / Expo. These routes
  // return JSON `{ files, name, slug, instructions? }` — no streaming. We
  // stuff the result into vfsFiles and let the WebContainer preview boot.
  const handleGenerateMultiTarget = async (target: Exclude<BuildTarget, 'website'>, promptText: string) => {
    const endpoint = {
      astro:  '/api/builder/astro',
      nextjs: '/api/builder/nextjs',
      react:  '/api/builder/react',
      expo:   '/api/builder/app',
    }[target]
    setIsGenerating(true)
    setBuildPhase('structure')
    setViewMode('preview')
    addTerminalLine('command', promptText)
    addTerminalLine('ai', `🤖 Generating ${target} project…`)
    addConsoleLog('info', `Starting ${target} build: ${promptText.slice(0, 60)}…`)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedModel.id,
          apiKey: apiKeys[selectedModel.provider] || undefined,
        }),
      })
      if (res.status === 402 || res.status === 429) {
        const errBody = await res.json().catch(() => ({} as any))
        const isPlanLimit = res.status === 429
        setCreditWall({
          show: true,
          title: isPlanLimit ? 'Out of credits this month' : 'Out of free generations',
          message: errBody.error || errBody.message ||
            (isPlanLimit
              ? `You're on the ${errBody.plan || 'free'} plan and used all your monthly credits.`
              : `You've used your ${errBody.limit || 3} free generations.`),
          limit: errBody.limit || (isPlanLimit ? 100 : 3),
          isPlanLimit,
          plan: errBody.plan,
        })
        return
      }
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}${errText ? ': ' + errText.slice(0, 200) : ''}`)
      }
      const data = await res.json()
      if (!data?.files || typeof data.files !== 'object') {
        throw new Error('Generator returned no files')
      }
      setVfsFiles(data.files)
      setVfsProjectMeta({ name: data.name || `${target} project`, slug: data.slug || target })
      addTerminalLine('success', `✓ Generated ${Object.keys(data.files).length} files`)
      addConsoleLog('success', `${target} project ready — preview booting`)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Generated **${data.name || target}** (${Object.keys(data.files).length} files). Preview is booting in WebContainer — ask me to refine and I'll edit the files directly.`,
      }])
    } catch (e: any) {
      addTerminalLine('error', `Failed: ${e?.message || e}`)
      addConsoleLog('error', e?.message || String(e))
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Generation failed: ${e?.message || 'unknown error'}`,
      }])
    } finally {
      setIsGenerating(false)
      setBuildPhase('idle')
    }
  }

  // Layered generation with phases
  const handleGenerate = async (promptText: string | undefined, ingredients?: StewIngredient[]) => {
    if (!promptText?.trim() && (!ingredients || ingredients.length === 0)) {
      addTerminalLine('error', 'No prompt provided — please describe what you want to build')
      return
    }
    promptText = promptText || ''

    // Multi-target branch — route Astro/Next.js/React/Expo to the JSON generator
    // path. The website path below uses streaming deltas + style preset baking,
    // which doesn't apply to a real framework project.
    if (buildTarget !== 'website') {
      const creditCheck = await checkAndDeductCredits('generate_website')
      if (!creditCheck.success) {
        addTerminalLine('error', creditCheck.error || 'Insufficient credits')
        return
      }
      await handleGenerateMultiTarget(buildTarget, promptText)
      return
    }

    // Check and deduct credits before generation
    const creditCheck = await checkAndDeductCredits('generate_website')
    if (!creditCheck.success) {
      const msg = creditCheck.error || 'Insufficient credits'
      addTerminalLine('error', msg)
      addConsoleLog('error', creditCheck.error || 'Please upgrade to continue generating')
      // Make the failure visible in chat too — otherwise the converse-side
      // optimistic "Changes made" message looks like success when it isn't.
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I wasn't able to apply those changes — ${msg.toLowerCase()}. The page wasn't updated.`,
      }])
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

      // Multi-page context — only include when there's actually more than one page,
      // so single-page builds aren't burdened with empty multi-page directives.
      const activePage = pages.find(p => p.id === activePageId)
      const includeMultiPage = pages.length > 1 && activePage

      // FRESH-BUILD DETECTION — if the prompt clearly asks for a NEW site
      // (e.g., "build a restaurant site for…", "create a portfolio…",
      // "make me a saas landing…"), we DO NOT include currentHtml. Sending
      // currentHtml puts the server into "PRECISION EDITOR — surgical
      // modifications only" mode, which would return mostly the previous
      // HTML with tiny tweaks (the "stuck on same hero header" symptom).
      // Refinements ("change the hero text", "add a contact section") DO
      // include currentHtml so the existing structure is preserved.
      const freshBuildRegex =
        /\b(build|create|make|generate|design|launch|spin\s+up|put\s+together|whip\s+up)\b.+\b(site|website|page|landing|app|store|blog|portfolio|dashboard)\b/i
      const resetIntentRegex = /\b(start\s+over|new\s+site|different\s+site|another\s+site|from\s+scratch)\b/i
      const isFreshBuild = !html || freshBuildRegex.test(promptText) || resetIntentRegex.test(promptText)
      if (isFreshBuild && html) {
        // Drop the previous HTML from workspace state too so the preview
        // doesn't briefly show the old site while the new one streams in.
        setHtml('')
        addConsoleLog('info', 'Fresh build detected — starting from a blank canvas.')
      }

      const res = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          currentHtml: isFreshBuild ? undefined : (html || undefined),
          skillLevel,
          model: selectedModel.id,
          apiKey: apiKeys[selectedModel.provider] || undefined,
          ingredients: ingredients || stewIngredients.length > 0 ? (ingredients || stewIngredients) : undefined,
          stylePreset: {
            id: preset.id,
            name: preset.name,
            tokens: preset.tokens,
          },
          ...(includeMultiPage ? {
            siblingPages: pages.map(p => ({ name: p.name, slug: p.slug, isHome: p.isHome })),
            currentPage: { name: activePage!.name, slug: activePage!.slug, isHome: activePage!.isHome },
          } : {}),
        })
      })

      if (res.status === 402 || res.status === 429) {
        // Either anon trial cap (402) or signed-in plan limit (429). Both go
        // through the same credit-wall modal but with messaging tuned to which
        // case it is — 429 also flags `upgrade: true` so we can route to /upgrade.
        const errBody = await res.json().catch(() => ({} as any))
        const isPlanLimit = res.status === 429
        setCreditWall({
          show: true,
          title: isPlanLimit ? 'Out of credits this month' : 'Out of free generations',
          message: errBody.error || errBody.message ||
            (isPlanLimit
              ? `You're on the ${errBody.plan || 'free'} plan and used all your monthly credits. Upgrade or buy credits to keep building.`
              : `You've used your ${errBody.limit || 3} free generations on this browser.`),
          limit: errBody.limit || (isPlanLimit ? 100 : 3),
          isPlanLimit,
          plan: errBody.plan,
        })
        setIsGenerating(false)
        setBuildPhase('idle')
        return
      }
      if (!res.ok) throw new Error('Generation failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let generatedHtml = ''
      let hasShownInteractivity = false
      let wasTruncated = false

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
                // Delta-only streaming (new protocol): append the tail.
                // Replace/full streaming (image-marker resync OR legacy server): replace.
                if (typeof parsed.delta === 'string') {
                  generatedHtml += parsed.delta
                  setHtml(generatedHtml)
                } else if (parsed.html) {
                  generatedHtml = parsed.html
                  setHtml(generatedHtml)
                }

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
                if (parsed.complete && parsed.truncated) {
                  wasTruncated = true
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
      if (wasTruncated) {
        addTerminalLine('error', '└ Build truncated — output was cut off before the page finished. Try a more specific prompt or rerun.')
      } else {
        addTerminalLine('success', '└ Build complete!')
      }
      addTerminalLine('info', '')
      addTerminalLine('success', `✨ Generated ${(generatedHtml.length / 1024).toFixed(1)}KB`)

      addToHistory(generatedHtml, promptText)
      addConsoleLog(wasTruncated ? 'warn' : 'info', wasTruncated
        ? `Build truncated at ${(generatedHtml.length / 1024).toFixed(1)}KB`
        : `Build complete: ${(generatedHtml.length / 1024).toFixed(1)}KB`)

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
      if (wasTruncated) {
        addToast('warning', 'Output was cut off — preview may be incomplete. Try rerunning.')
      } else {
        addToast('success', 'Website generated!')
      }

      // Refresh credits after generation
      fetchCredits()

      // Anon "first build" nudge — celebrate the win, ask them to claim
      // their account before they walk away. Once per browser session;
      // we don't want to nag every time they iterate.
      if (!session?.user) {
        try {
          const alreadyNudged = sessionStorage.getItem('webstew-anon-nudged') === '1'
          if (!alreadyNudged) {
            sessionStorage.setItem('webstew-anon-nudged', '1')
            // Small delay so the preview reveal animation isn't interrupted
            setTimeout(() => setSignupNudge({ show: true, reason: 'first-build' }), 1800)
          }
        } catch { /* sessionStorage can throw in private contexts — ignore */ }
      }

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
    { id: 'action-refresh', label: 'Refresh Preview', category: 'action', icon: RefreshCw, action: () => setPreviewBumpKey(k => k + 1) },
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
      const element = contextMenu.element
      const currentText = element.textContent || ''
      const tag = element.tagName.toLowerCase()
      const multiline = ['p', 'textarea', 'div', 'li', 'blockquote'].includes(tag) || currentText.length > 60
      setInlineEdit({
        show: true,
        type: 'text',
        title: `Edit ${tag}`,
        initialValue: currentText,
        multiline,
        onSave: (newText) => {
          if (newText === currentText) return
          const result = findAndReplaceElement(html, element, (found) => {
            const openTagMatch = found.match(new RegExp(`^<${tag}[^>]*>`))
            if (openTagMatch) {
              return openTagMatch[0] + newText + `</${tag}>`
            }
            return found.replace(currentText, newText)
          })
          if (result && result !== html) {
            setHtml(result)
            addToHistory(result, `Edited text`)
            addToast('success', 'Text updated')
          } else {
            addToast('error', 'Could not find element to edit')
          }
        }
      })
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
      const element = contextMenu.element
      const currentHref = element.href || ''
      setInlineEdit({
        show: true,
        type: 'link',
        title: 'Edit link URL',
        initialValue: currentHref,
        multiline: false,
        onSave: (newHref) => {
          if (!newHref || newHref === currentHref) return
          const result = findAndReplaceElement(html, element, (found) => {
            return found.replace(currentHref, newHref)
          })
          if (result && result !== html) {
            setHtml(result)
            addToHistory(result, 'Updated link')
            addToast('success', 'Link updated')
          } else {
            addToast('error', 'Could not find link to edit')
          }
        }
      })
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
    if (!message.trim() || isGenerating || isThinking) return

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setChatSuggestions([])
    setCommandInput('')

    // First-prompt bootstrap for non-website targets: the agent loop is for
    // refining an existing project, not scaffolding one from scratch. With an
    // empty VFS it hits the iteration cap before finishing. Route the kickoff
    // through the dedicated scaffolder, which returns a complete project in
    // one JSON response.
    if (buildTarget !== 'website' && Object.keys(vfsFiles).length === 0) {
      await handleGenerate(message)
      return
    }

    setIsThinking(true)

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
      // Build an enriched prompt with selected-element + multi-page context
      const activePageForChat = pages.find(p => p.id === activePageId)
      let agentPrompt = message
      if (selectedElement) {
        agentPrompt = `User has selected this element in the live preview:\n\n\`\`\`html\n${selectedElement.outerHTML}\n\`\`\`\n\nThey want: ${message}`
      }
      if (pages.length > 1 && activePageForChat) {
        const others = pages.filter(p => p.id !== activePageId).map(p => `${p.name} (${p.slug})`).join(', ')
        agentPrompt = `${agentPrompt}\n\nCurrent page: "${activePageForChat.name}" (${activePageForChat.slug}). Other pages in this site: ${others}.`
      }

      // Anthropic-shaped history (strings only, last 10 turns)
      const agentHistory = chatMessages.slice(-10)
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: typeof m.content === 'string' ? m.content : String(m.content || '') }))
        .filter(m => m.content.trim().length > 0)

      const agentFiles = buildTarget === 'website'
        ? { 'index.html': html }
        : vfsFiles
      const response = await fetch('/api/builder/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: agentPrompt,
          files: agentFiles,
          history: agentHistory,
          model: selectedModel.id,
          apiKey: apiKeys[selectedModel.provider] || undefined,
          target: buildTarget,
          // Pass projectId so the agent can use cms_* tools to read/write
          // content collections on this project. Persists file changes to
          // Mongo via the onWrite/onDelete hooks too. Skip if no saved project.
          projectId: currentProject?.id,
        })
      })

      if (response.status === 402 || response.status === 429) {
        const errBody = await response.json().catch(() => ({} as any))
        const isPlanLimit = response.status === 429
        setCreditWall({
          show: true,
          title: isPlanLimit ? 'Out of credits this month' : 'Out of free chat refinements',
          message: errBody.error || errBody.message ||
            (isPlanLimit
              ? `You're on the ${errBody.plan || 'free'} plan and used all your monthly credits. Upgrade or buy credits to keep iterating.`
              : `You've used your ${errBody.limit || 3} free chat refinements on this browser.`),
          limit: errBody.limit || (isPlanLimit ? 100 : 3),
          isPlanLimit,
          plan: errBody.plan,
        })
        setIsThinking(false)
        return
      }
      if (!response.ok || !response.body) throw new Error('Agent stream failed')

      // ── SSE stream consumer ──────────────────────────────────────────────
      // The agent route emits: text, tool_use, tool_result, file_update,
      // file_delete, done, error. We map file_update on index.html → setHtml.
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let textBuf = ''
      let toolStatus = ''
      let latestHtml: string | null = null
      let wroteAnyFile = false

      // Insert a placeholder assistant message we'll mutate as events arrive.
      setChatMessages(prev => [...prev, { role: 'assistant', content: '…' }])
      const flushAssistant = (text: string) => {
        setChatMessages(prev => {
          const next = [...prev]
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === 'assistant') {
              next[i] = { ...next[i], content: text }
              break
            }
          }
          return next
        })
      }
      const renderProgress = () => {
        const body = textBuf.trim()
        const status = toolStatus ? `_${toolStatus}_` : ''
        return [body, status].filter(Boolean).join('\n\n') || '…'
      }

      let streamDone = false
      while (!streamDone) {
        const { value, done: rd } = await reader.read()
        if (rd) break
        sseBuffer += decoder.decode(value, { stream: true })
        const blocks = sseBuffer.split('\n\n')
        sseBuffer = blocks.pop() || ''
        for (const block of blocks) {
          if (!block.trim()) continue
          let evtName = 'message'
          let dataStr = ''
          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) evtName = line.slice(7).trim()
            else if (line.startsWith('data: ')) dataStr += line.slice(6)
          }
          if (!dataStr) continue
          let payload: any
          try { payload = JSON.parse(dataStr) } catch { continue }

          if (evtName === 'text') {
            textBuf += payload.text || ''
            flushAssistant(renderProgress())
          } else if (evtName === 'tool_use') {
            const n = payload.name
            const p = payload.input?.path
            if (n === 'list_files') toolStatus = 'Listing files…'
            else if (n === 'read_file') toolStatus = p ? `Reading ${p}…` : 'Reading file…'
            else if (n === 'write_file') toolStatus = p ? `Editing ${p}…` : 'Editing file…'
            else if (n === 'delete_file') toolStatus = p ? `Deleting ${p}…` : 'Deleting file…'
            else if (n === 'done') toolStatus = ''
            else toolStatus = `Running ${n}…`
            flushAssistant(renderProgress())
          } else if (evtName === 'file_update') {
            if (typeof payload.contents === 'string' && typeof payload.path === 'string') {
              if (buildTarget === 'website' && payload.path === 'index.html') {
                latestHtml = payload.contents
              } else if (buildTarget !== 'website') {
                // Multi-file VFS update — apply immediately so the WebContainer
                // preview HMR / file watcher picks up the change.
                setVfsFiles(prev => ({ ...prev, [payload.path]: payload.contents }))
              }
              wroteAnyFile = true
            }
          } else if (evtName === 'file_delete') {
            if (buildTarget !== 'website' && typeof payload.path === 'string') {
              setVfsFiles(prev => {
                const next = { ...prev }
                delete next[payload.path]
                return next
              })
              wroteAnyFile = true
            }
          } else if (evtName === 'done') {
            streamDone = true
            toolStatus = ''
            const summary = payload.summary || 'Done.'
            const final = [textBuf.trim(), wroteAnyFile ? `✅ ${summary}` : summary]
              .filter(Boolean).join('\n\n')
            flushAssistant(final || summary)
          } else if (evtName === 'error') {
            streamDone = true
            toolStatus = ''
            flushAssistant(`⚠️ ${payload.message || 'Agent failed.'}`)
          }
        }
      }

      // Commit HTML once at the end (avoids thrashing the preview iframe mid-stream)
      if (latestHtml && latestHtml !== html) {
        setHtml(latestHtml)
        addToHistory(latestHtml, 'AI Edit: ' + message.slice(0, 60))
        addToast('success', 'Changes applied!')
      }
      setConversationIntent(null)

    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you try again?'
      }])
    } finally {
      setIsThinking(false)
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

  const handleExport = async () => {
    // Multi-target projects: ship a zip of the VFS. The export panel is
    // HTML-specific (preview, single-file download, etc.) and doesn't apply.
    if (buildTarget !== 'website' && Object.keys(vfsFiles).length > 0) {
      try {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        const slug = vfsProjectMeta?.slug || buildTarget
        const folder = zip.folder(slug) || zip
        for (const [path, content] of Object.entries(vfsFiles)) {
          folder.file(path, content)
        }
        const blob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${slug}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        addConsoleLog('success', `Exported ${Object.keys(vfsFiles).length} files`)
      } catch (e: any) {
        addConsoleLog('error', `Export failed: ${e?.message || e}`)
      }
      return
    }
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
      {/* Signup nudge modal — fires for anon at conversion-relevant moments
          (after first build, or when they try to save/deploy). Copy varies
          by reason so each entry feels native, not like a one-size-fits-all
          paywall. */}
      <AnimatePresence>
        {signupNudge.show && (() => {
          const r = signupNudge.reason
          const isCelebration = r === 'first-build'
          const title = r === 'first-build' ? 'Your first site is ready 🎉'
            : r === 'save'                  ? 'Save your work to the cloud'
            : r === 'deploy-render'         ? 'Sign up to deploy live'
            : r === 'deploy-github'         ? 'Sign up to push to GitHub'
            : 'Sign up to keep going'
          const message = r === 'first-build'
            ? `Nice work. Sign up free to keep this build forever, deploy it to a live URL, and claim 100 free credits every month — that's ~10 fresh generations.`
            : r === 'save'
            ? `Your project is backed up to this browser only. Sign up free to save it to your account so it survives a refresh or a different device — plus 100 free credits/month.`
            : r === 'deploy-render'
            ? `Deploying gives your site a live URL anyone can visit. Free signup, no card required — includes 100 credits/month and your first deploy.`
            : r === 'deploy-github'
            ? `Push to GitHub creates a real repo from your project so you can edit code, share it, or fork it. Free signup unlocks it — plus 100 credits/month.`
            : `Sign up free to unlock this. 100 credits/month, no card required.`
          const router_ = router
          const closeAndRoute = (to: string) => {
            setSignupNudge({ show: false, reason: null })
            router_.push(to)
          }
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => isCelebration && setSignupNudge({ show: false, reason: null })}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "relative max-w-md w-full p-8 rounded-2xl border shadow-2xl",
                  isDark
                    ? "bg-zinc-950 border-violet-500/30 shadow-violet-500/20"
                    : "bg-white border-violet-300 shadow-violet-200/40"
                )}
              >
                {isCelebration && (
                  <button
                    onClick={() => setSignupNudge({ show: false, reason: null })}
                    className={cn(
                      "absolute top-4 right-4 p-1 rounded-lg transition",
                      isDark ? "text-zinc-500 hover:text-white hover:bg-white/5" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    )}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className={cn(
                  "text-xl font-bold mb-2",
                  isDark ? "text-white" : "text-slate-900"
                )}>{title}</h3>
                <p className={cn(
                  "text-sm leading-relaxed mb-6",
                  isDark ? "text-zinc-400" : "text-slate-600"
                )}>{message}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => closeAndRoute(`/signup?next=${encodeURIComponent('/workspace')}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold transition shadow-lg shadow-violet-500/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    Sign up free — claim 100 credits
                  </button>
                  <button
                    onClick={() => closeAndRoute(`/login?next=${encodeURIComponent('/workspace')}`)}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition",
                      isDark
                        ? "bg-white/[0.03] border border-white/10 text-zinc-300 hover:bg-white/[0.06]"
                        : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    I already have an account — sign in
                  </button>
                  {isCelebration && (
                    <button
                      onClick={() => setSignupNudge({ show: false, reason: null })}
                      className={cn(
                        "w-full px-4 py-2 rounded-xl text-xs font-medium transition",
                        isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Maybe later
                    </button>
                  )}
                </div>
                <p className={cn(
                  "mt-5 text-[10px] leading-relaxed",
                  isDark ? "text-zinc-600" : "text-slate-500"
                )}>
                  No credit card. Anytime cancel. Your work in this browser stays saved either way.
                </p>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Credit wall modal — shown when /api/builder/generate or /converse hits 402 */}
      <AnimatePresence>
        {creditWall.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setCreditWall({ show: false })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative max-w-md w-full p-8 rounded-2xl border border-violet-500/30 shadow-2xl shadow-violet-500/20",
                isDark ? "bg-zinc-950" : "bg-white"
              )}
            >
              <button
                onClick={() => setCreditWall({ show: false })}
                className={cn(
                  "absolute top-4 right-4 p-1 rounded-lg transition",
                  isDark ? "text-zinc-500 hover:text-white hover:bg-white/5" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                )}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className={cn("w-6 h-6", isDark ? "text-violet-400" : "text-violet-600")} />
              </div>
              <h3 className={cn(
                "text-xl font-bold mb-2",
                isDark ? "text-white" : "text-slate-900"
              )}>{creditWall.title || 'Out of free generations'}</h3>
              <p className={cn(
                "text-sm leading-relaxed mb-6",
                isDark ? "text-zinc-400" : "text-slate-600"
              )}>
                {creditWall.message || `You've used your free generations on this browser.`}
              </p>
              <div className="space-y-2">
                {creditWall.isPlanLimit ? (
                  <>
                    {/* Signed-in user out of monthly credits — push to /upgrade */}
                    <button
                      onClick={() => { setCreditWall({ show: false }); router.push('/upgrade') }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
                    >
                      <Zap className="w-4 h-4" />
                      <span className="flex-1 text-left">Buy credits — from $9.99</span>
                      <span className="text-xs opacity-75">No subscription</span>
                    </button>
                    <button
                      onClick={() => { setCreditWall({ show: false }); router.push('/upgrade') }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="flex-1 text-left">Upgrade plan</span>
                      <span className="text-xs opacity-75">More credits monthly</span>
                    </button>
                    <button
                      onClick={() => { setCreditWall({ show: false }); setActivePanel('build') }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition"
                    >
                      <Code2 className="w-4 h-4" />
                      <span className="flex-1 text-left">Use my own API key</span>
                      <span className="text-xs text-zinc-500">Free, unlimited</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Anonymous trial cap — push BYOK + signup */}
                    <button
                      onClick={() => {
                        setCreditWall({ show: false })
                        setActivePanel('build')
                        addToast('info', 'Paste your Anthropic or OpenAI key in the model picker (bottom of left sidebar) — it will bypass the limit.')
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="flex-1 text-left">Use my own API key</span>
                      <span className="text-xs opacity-75">Free, unlimited</span>
                    </button>
                    <button
                      onClick={() => router.push('/login?next=%2Fworkspace')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="flex-1 text-left">Sign in / Sign up</span>
                      <span className="text-xs text-zinc-500">Save your work + more credits</span>
                    </button>
                  </>
                )}
              </div>
              {creditWall.isPlanLimit ? (
                <p className="text-[10px] text-zinc-600 mt-5 leading-relaxed">
                  <span className="text-zinc-500">Each website generation uses 10 credits.</span> Free plan ships with 100 credits/month — that's ~10 generations. Buy a 100-credit pack for $9.99 (no subscription) or upgrade to a paid plan for monthly credits.
                </p>
              ) : (
                <p className="text-[10px] text-zinc-600 mt-5 leading-relaxed">
                  <span className="text-zinc-500">Tip:</span> Don't clear all browser data — that wipes your saved pages, blocks, and history along with the counter. Use a private window for a fresh trial that won't touch your work.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                { id: 'content' as Panel, icon: FileText, label: 'CMS', color: 'pink' },
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

                        {/* Suggestion buttons for this message — explicit
                            dark text on light backgrounds + light text on
                            dark to keep readable in both themes. */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border">
                            {msg.suggestions.map((suggestion, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => handleChatMessage(suggestion)}
                                className="px-3 py-1.5 text-xs font-medium rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-all shadow-sm dark:bg-violet-500/25 dark:text-violet-100 dark:hover:bg-violet-500/40 dark:border dark:border-violet-400/40"
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

                  {/* Chat thinking indicator (shown while converse API is in flight, before generation starts) */}
                  {isThinking && !isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                      <div className={cn(
                        "rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2",
                        isDark ? "bg-zinc-800/80 text-violet-300" : "bg-slate-100 text-violet-600"
                      )}>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="text-sm">Thinking…</span>
                      </div>
                    </motion.div>
                  )}

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
                            "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                            // Stronger contrast: explicit slate-900 text on
                            // white in light mode + slate-100 on a dark
                            // tinted bg in dark mode. The previous slate-600
                            // on slate-100 was too washed out to read.
                            "bg-card text-foreground border border-border hover:bg-violet-100 hover:text-violet-700 hover:border-violet-300 dark:hover:bg-violet-500/20 dark:hover:text-violet-200 dark:hover:border-violet-400/40"
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
                                    // Templates use {{var}} placeholders; substitute before render
                                    // or the preview shows literal "{{productName}}" text.
                                    const rendered = template.templateVariables
                                      ? applyTemplateVariables(template.htmlTemplate, template.templateVariables)
                                      : template.htmlTemplate
                                    setHtml(rendered)
                                    setViewMode('preview')
                                    setChatMessages(prev => [...prev, {
                                      role: 'assistant',
                                      content: `Loaded the "${template.label}" template! You can now customize it by telling me what changes you'd like to make.`
                                    }])
                                    addToHistory(rendered, `Loaded ${template.label} template`)
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

                    </div>
                  )}
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
                            const rendered = template.templateVariables
                              ? applyTemplateVariables(template.htmlTemplate, template.templateVariables)
                              : template.htmlTemplate
                            setHtml(rendered)
                            setProjectName(template.label)
                            addTerminalLine('success', `Loaded template: ${template.label}`)
                          } else {
                            // Don't blast the chip's hardcoded prompt (e.g. "Alex Chen at
                            // Spotify") into the LLM — that overwrites whatever the user
                            // had typed and produces wildly off-topic output. Route through
                            // the chat so the conversation layer can collect the user's
                            // actual details before generating.
                            handleChatMessage(`Build me a ${template.label.toLowerCase()} website`)
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
                ) : supabaseTemplates.filter(t =>
                    // Filter out obvious stubs / test entries that confuse users
                    !/^(test|stub|untitled|sample|temp)\b/i.test(t.name?.trim() || '')
                  ).length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layout className="w-4 h-4 text-fuchsia-400" />
                      <h3 className="text-sm font-medium text-white">Template Library</h3>
                      <span className="text-[10px] text-zinc-500">
                        ({supabaseTemplates.filter(t => !/^(test|stub|untitled|sample|temp)\b/i.test(t.name?.trim() || '')).length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {supabaseTemplates
                        .filter(t => !/^(test|stub|untitled|sample|temp)\b/i.test(t.name?.trim() || ''))
                        .map((template) => (
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
                    Quick Start tiles load full-design templates instantly — no AI wait. Type a prompt or click an element after loading to customize.
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

            {/* Content (CMS) Panel — Stage 1 of the Webflow-style CMS. Lists
                collections + lets you CRUD items via a schema-driven form.
                Generators can scaffold a sample collection; the agent can
                read/write items through the same /api/cms endpoints. */}
            {!sidebarCollapsed && activePanel === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <ContentPanel projectId={currentProject?.id || null} isDark={isDark} />
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
                            ? 'bg-violet-100 text-violet-700 border border-violet-300 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:text-white'
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
                            ? 'bg-violet-100 border-violet-300 dark:bg-violet-500/10 dark:border-violet-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-white/[0.02] dark:border-white/[0.05] dark:hover:border-white/10'
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              integration.enabled
                                ? 'bg-violet-200 dark:bg-violet-500/20'
                                : 'bg-slate-100 dark:bg-white/[0.05]'
                            )}>
                              <integration.icon className={cn(
                                'w-4 h-4',
                                integration.enabled
                                  ? 'text-violet-700 dark:text-violet-400'
                                  : 'text-slate-500 dark:text-zinc-500'
                              )} />
                            </div>
                            <div>
                              <h4 className={cn(
                                "text-xs font-medium",
                                integration.enabled
                                  ? 'text-violet-900 dark:text-white'
                                  : 'text-slate-900 dark:text-white'
                              )}>{integration.name}</h4>
                              <p className={cn(
                                "text-[10px] line-clamp-1",
                                integration.enabled
                                  ? 'text-violet-700/80 dark:text-zinc-500'
                                  : 'text-slate-500 dark:text-zinc-500'
                              )}>{integration.description}</p>
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

                {/* Image-to-Video: upload an image and animate it (Stable Video Diffusion) */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <label className="block text-sm text-blue-300 mb-3 font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Image to Video — bring a still photo to life
                  </label>
                  {videoSourceImage ? (
                    <div className="mb-3 relative">
                      <img src={videoSourceImage} alt="Source" className="w-full rounded-lg border border-blue-500/30" />
                      <button
                        onClick={() => setVideoSourceImage(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block mb-3">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={videoSourceUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setVideoSourceUploading(true)
                          setVideoError('')
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            const res = await fetch('/api/upload', { method: 'POST', body: formData })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
                            const url = data.url || data.secure_url
                            if (!url) throw new Error('Upload succeeded but no URL returned')
                            setVideoSourceImage(url)
                            addTerminalLine('success', `✓ Source image uploaded`)
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : 'Upload failed'
                            setVideoError(`Image upload: ${msg}`)
                            addTerminalLine('error', `Image upload failed: ${msg}`)
                          } finally {
                            setVideoSourceUploading(false)
                          }
                        }}
                      />
                      <div className="flex flex-col items-center justify-center w-full p-6 rounded-lg border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 cursor-pointer transition">
                        {videoSourceUploading ? (
                          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 text-blue-400/60 mb-2" />
                            <span className="text-xs text-zinc-400">Click to upload image</span>
                            <span className="text-[10px] text-zinc-600 mt-1">JPG, PNG, WebP</span>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                {/* Text to Video — only enabled when no source image is set */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <label className="block text-sm text-purple-300 mb-3 font-medium">
                    {videoSourceImage ? 'Optional motion prompt' : 'Text to Video'}
                  </label>
                  <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder={videoSourceImage
                      ? "Optional: describe the motion (e.g. 'gentle camera pan, leaves rustling')"
                      : "Describe your video... e.g., 'ocean waves crashing on a beach at sunset'"}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none mb-3"
                  />

                  <div className="mb-3">
                    <label className="block text-xs text-zinc-400 mb-1.5">Model</label>
                    <select
                      value={videoSourceImage ? 'svd' : videoModel}
                      onChange={(e) => setVideoModel(e.target.value as any)}
                      disabled={!!videoSourceImage}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50 disabled:opacity-60"
                    >
                      {videoSourceImage ? (
                        <option value="svd">Stable Video Diffusion (image → 4s clip)</option>
                      ) : (
                        <>
                          <option value="animate-diff">AnimateDiff (Fast, ~60s)</option>
                          <option value="zeroscope">Zeroscope (Higher quality)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <button
                    onClick={async () => {
                      const isImageMode = !!videoSourceImage
                      if (!isImageMode && !videoPrompt.trim()) return
                      setVideoGenerating(true)
                      setGeneratedVideoUrl(null)
                      setVideoError('')
                      setVideoStatus(isImageMode ? 'Animating your image...' : 'Starting video generation...')

                      try {
                        const response = await fetch('/api/ai/video', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(
                            isImageMode
                              ? {
                                  action: 'image-to-video',
                                  imageUrl: videoSourceImage,
                                  prompt: videoPrompt || undefined,
                                  model: 'svd',
                                }
                              : {
                                  action: 'text-to-video',
                                  prompt: videoPrompt,
                                  model: videoModel,
                                }
                          )
                        })

                        setVideoStatus(isImageMode ? 'Animating... ~60-90 seconds' : 'Processing... this takes ~60 seconds')
                        const data = await response.json()

                        if (response.ok && data.success && data.output) {
                          const url = Array.isArray(data.output) ? data.output[0] : data.output
                          setGeneratedVideoUrl(url)
                          setVideoStatus('✓ Video ready!')
                          addTerminalLine('success', isImageMode ? '✓ Image animated!' : '✓ Video generated!')
                        } else {
                          throw new Error(data.error || `Video generation failed (HTTP ${response.status})`)
                        }
                      } catch (error) {
                        const msg = error instanceof Error ? error.message : 'Failed'
                        setVideoError(msg)
                        setVideoStatus('')
                        addTerminalLine('error', `Video generation failed: ${msg}`)
                      }
                      setVideoGenerating(false)
                    }}
                    disabled={videoGenerating || (!videoSourceImage && !videoPrompt.trim())}
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
                        {videoSourceImage ? 'Animate Image' : 'Generate Video'}
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
                  {/* Share preview link — anon-friendly, no signup required.
                     Lives above Deploy/GitHub because it's the lowest-friction
                     way to show someone what you just built. */}
                  <button
                    onClick={sharePreview}
                    disabled={isSharingPreview || !html.trim()}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
                      isSharingPreview || !html.trim()
                        ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed"
                        : "bg-violet-500/10 border-violet-400/30 hover:bg-violet-500/15 hover:border-violet-400/50"
                    )}
                  >
                    {isSharingPreview ? (
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    ) : (
                      <Share2 className="w-5 h-5 text-violet-400 group-hover:text-violet-300" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">Share preview link</div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {previewLink ? previewLink.replace(/^https?:\/\//, '') : 'Instant link · expires in 7 days · no signup'}
                      </div>
                    </div>
                  </button>
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
                    disabled={isDeploying || (!html.trim() && Object.keys(vfsFiles).length === 0)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left shadow-md",
                      isDeploying || (!html.trim() && Object.keys(vfsFiles).length === 0)
                        ? "bg-slate-200 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-500 opacity-70 cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                    )}
                  >
                    {isDeploying && deployStatus === 'render' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Rocket className="w-5 h-5" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Deploy Live</div>
                      <div className="text-[10px] opacity-90">
                        {isDeploying ? 'Deploying to Render…' : 'One-click deploy'}
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

                  {/* Custom domain — only meaningful after a deploy exists.
                      The card itself handles the "not deployed yet" state. */}
                  <CustomDomainCard
                    projectId={currentProject?.id || null}
                    isDeployed={deployStatus === 'success' || !!deployUrl}
                    isDark={isDark}
                  />
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
                    className={cn(
                      "absolute bottom-full left-0 mb-2 w-72 max-h-80 overflow-y-auto rounded-xl shadow-2xl z-50 border",
                      isDark ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "p-2 border-b",
                      isDark ? "border-white/10" : "border-slate-200"
                    )}>
                      <p className={cn(
                        "text-[10px] font-medium px-2",
                        isDark ? "text-zinc-400" : "text-slate-600"
                      )}>Select AI Model</p>
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
                              ? (isDark ? "bg-violet-500/20 text-white" : "bg-violet-500/15 text-slate-900")
                              : (isDark ? "hover:bg-white/5 text-zinc-300" : "hover:bg-slate-100 text-slate-800")
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
                            <p className={cn(
                              "text-[9px] truncate",
                              isDark ? "text-zinc-500" : "text-slate-500"
                            )}>{model.description}</p>
                          </div>
                        </button>
                      ))}

                      {/* Paid Models */}
                      <div className="px-2 py-1 mt-2">
                        <p className={cn(
                          "text-[9px] font-medium uppercase tracking-wide",
                          isDark ? "text-zinc-500" : "text-slate-500"
                        )}>Premium Models</p>
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
                              ? (isDark ? "bg-violet-500/20 text-white" : "bg-violet-500/15 text-slate-900")
                              : (isDark ? "hover:bg-white/5 text-zinc-300" : "hover:bg-slate-100 text-slate-800")
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
          "h-12 border-b flex items-center justify-between px-4 backdrop-blur-xl relative z-50 gap-2 min-w-0",
          isDark ? "border-white/[0.08] bg-zinc-950/95" : "border-slate-200 bg-white/95"
        )}>
          {/* LHS toolbar group — allow horizontal scroll when content exceeds
              available width (e.g. when the chat sidebar is open). Without
              min-w-0 + overflow-x-auto here the LHS would push the RHS
              (Save / Export buttons) off-screen. */}
          <div className="flex items-center gap-3 min-w-0 overflow-x-auto scrollbar-hide flex-1">
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

            {/* Build Target Picker — Website / Astro / Next.js / React / Expo */}
            <div className="flex items-center gap-0.5 bg-white/[0.03] dark:bg-white/[0.03] bg-slate-100 border border-white/[0.05] dark:border-white/[0.05] border-slate-200 rounded-lg p-0.5">
              {([
                { id: 'website' as BuildTarget, label: 'Web', title: 'Static HTML website' },
                { id: 'astro' as BuildTarget,   label: 'Astro', title: 'Astro multi-page site' },
                { id: 'nextjs' as BuildTarget,  label: 'Next', title: 'Next.js app' },
                { id: 'react' as BuildTarget,   label: 'React', title: 'Vite + React SPA' },
                { id: 'expo' as BuildTarget,    label: 'Mobile', title: 'Expo mobile app' },
              ]).map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (isGenerating) return
                    if (buildTarget !== t.id && (html || Object.keys(vfsFiles).length > 0)) {
                      const ok = confirm(`Switch to ${t.label}? Your current project will be cleared.`)
                      if (!ok) return
                      setHtml('')
                      setVfsFiles({})
                      setVfsProjectMeta(null)
                      setChatMessages([])
                    }
                    setBuildTarget(t.id)
                  }}
                  title={t.title}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-medium transition-all',
                    buildTarget === t.id
                      ? 'bg-violet-500/20 text-violet-300 dark:bg-violet-500/20 dark:text-violet-300 bg-violet-100 text-violet-700'
                      : 'text-zinc-600 dark:text-zinc-500 hover:text-white dark:hover:text-white text-slate-500 hover:text-slate-900'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Site grader — scores SEO / technical / presence / AI-visibility
                for the current HTML. Lights up an Award icon; opens a modal
                with score + actionable issues. Works on draft HTML (any
                target where index.html exists in the VFS) and on a deployed
                URL when one is available. */}
            <button
              onClick={() => setGraderOpen(true)}
              disabled={!html && !(vfsFiles['index.html'])}
              title={
                (!html && !vfsFiles['index.html'])
                  ? 'Generate something first, then grade it'
                  : 'Grade my site (SEO / technical / presence)'
              }
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all border',
                (!html && !vfsFiles['index.html'])
                  ? 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-white/[0.03] dark:text-zinc-600 dark:border-white/[0.06] cursor-not-allowed'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/25'
              )}
            >
              <Award className="w-3 h-3" />
              Grade
            </button>

            {/* Inline Edit toggle — only meaningful for the website target
                because we inject the editor <script> into srcDoc. For
                WebContainer targets the preview is on a different origin so
                we can't drop a script in. Disabled there to be honest. */}
            <button
              onClick={() => setEditMode(v => !v)}
              disabled={buildTarget !== 'website' || !html}
              title={
                buildTarget !== 'website'
                  ? 'Inline edit currently only works for the Web target'
                  : !html
                    ? 'Generate something first'
                    : editMode
                      ? 'Exit edit mode'
                      : 'Click text in preview to edit inline'
              }
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all border',
                (buildTarget !== 'website' || !html)
                  ? 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-white/[0.03] dark:text-zinc-600 dark:border-white/[0.06] cursor-not-allowed'
                  : editMode
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-violet-500 shadow-sm'
                    : 'bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30 dark:hover:bg-violet-500/25'
              )}
            >
              <Pencil className="w-3 h-3" />
              {editMode ? 'Editing' : 'Edit'}
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
            <div className={cn(
              "flex rounded-lg p-0.5 border",
              isDark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-100 border-slate-200"
            )}>
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
                        ? (isDark ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/20' : 'bg-emerald-100 text-emerald-700 shadow-sm')
                        : color === 'blue'
                          ? (isDark ? 'bg-blue-500/20 text-blue-400 shadow-sm shadow-blue-500/20' : 'bg-blue-100 text-blue-700 shadow-sm')
                          : (isDark ? 'bg-violet-500/20 text-violet-400 shadow-sm shadow-violet-500/20' : 'bg-violet-100 text-violet-700 shadow-sm')
                      : (isDark
                          ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white')
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
            <div className="relative">
              <button
                onClick={() => setShowHistoryPanel(v => !v)}
                disabled={history.length === 0}
                className="p-1.5 rounded-lg hover:bg-violet-500/10 text-zinc-600 hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent disabled:hover:text-zinc-600 transition-all duration-200"
                title={`Version history (${history.length})`}
              >
                <History className="w-4 h-4" />
              </button>
              {showHistoryPanel && history.length > 0 && !showBlocksPanel && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowHistoryPanel(false)}
                  />
                  <div className={cn(
                    "absolute right-0 top-full mt-1 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border backdrop-blur-xl shadow-2xl",
                    isDark ? "border-white/10 bg-zinc-950/95" : "border-slate-200 bg-white/95"
                  )}>
                    <div className={cn(
                      "sticky top-0 px-3 py-2 border-b backdrop-blur-xl flex items-center justify-between",
                      isDark ? "border-white/5 bg-zinc-950/90" : "border-slate-200 bg-white/90"
                    )}>
                      <span className={cn("text-xs font-medium", isDark ? "text-white" : "text-slate-900")}>Version history</span>
                      <span className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>{history.length} / 30</span>
                    </div>
                    <div className="py-1">
                      {[...history].map((entry, displayIdx) => {
                        // Show newest first; map display idx → real array idx
                        const realIdx = history.length - 1 - displayIdx
                        const e = history[realIdx]
                        const isCurrent = realIdx === historyIndex
                        const ts = new Date(e.timestamp)
                        const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        return (
                          <button
                            key={realIdx}
                            onClick={() => {
                              setHistoryIndex(realIdx)
                              setHtml(e.html)
                              setShowHistoryPanel(false)
                              addConsoleLog('info', `Restored version from ${time}`)
                              addToast('success', `Restored to: ${e.prompt.slice(0, 40)}`)
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-left flex items-start gap-3 transition border-l-2",
                              isCurrent
                                ? "bg-violet-500/15 border-violet-500"
                                : isDark
                                  ? "hover:bg-white/5 border-transparent"
                                  : "hover:bg-slate-100 border-transparent"
                            )}
                          >
                            <span className={cn(
                              "mt-0.5 text-[10px] font-mono shrink-0 w-12",
                              isCurrent
                                ? (isDark ? "text-violet-300" : "text-violet-600")
                                : (isDark ? "text-zinc-500" : "text-slate-500")
                            )}>
                              {time}
                            </span>
                            <span className={cn(
                              "text-xs flex-1 line-clamp-2 break-words",
                              isCurrent
                                ? (isDark ? "text-white font-medium" : "text-slate-900 font-medium")
                                : (isDark ? "text-zinc-300" : "text-slate-700")
                            )}>
                              {e.prompt || '(no description)'}
                              {isCurrent && <span className="ml-1 text-[9px] text-violet-400">CURRENT</span>}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => { setShowBlocksPanel(v => !v); setShowHistoryPanel(false) }}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-zinc-600 hover:text-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200"
                title={`My saved blocks (${savedBlocks.length})`}
              >
                <Package className="w-4 h-4" />
              </button>
              {showBlocksPanel && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBlocksPanel(false)} />
                  <div className={cn(
                    "absolute right-0 top-full mt-1 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border backdrop-blur-xl shadow-2xl",
                    isDark ? "border-white/10 bg-zinc-950/95" : "border-slate-200 bg-white/95"
                  )}>
                    <div className={cn(
                      "sticky top-0 px-3 py-2 border-b backdrop-blur-xl flex items-center justify-between",
                      isDark ? "border-white/5 bg-zinc-950/90" : "border-slate-200 bg-white/90"
                    )}>
                      <span className={cn("text-xs font-medium", isDark ? "text-white" : "text-slate-900")}>My blocks</span>
                      <span className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>{savedBlocks.length} saved</span>
                    </div>
                    <div className="py-1">
                      {savedBlocks.length === 0 ? (
                        <div className={cn(
                          "px-3 py-6 text-center text-xs",
                          isDark ? "text-zinc-500" : "text-slate-500"
                        )}>
                          No saved blocks yet.
                          <br />
                          Select an element and click "Save block" to start.
                        </div>
                      ) : (
                        savedBlocks.map(block => (
                          <div
                            key={block.id}
                            className={cn(
                              "group px-3 py-2 border-l-2 border-transparent hover:border-emerald-500 transition flex items-start gap-2",
                              isDark ? "hover:bg-white/5" : "hover:bg-slate-100"
                            )}
                          >
                            <button
                              onClick={() => insertSavedBlock(block)}
                              className="flex-1 text-left flex items-start gap-2"
                              title={`Insert into current page (${pages.find(p => p.id === activePageId)?.name || 'Home'})`}
                            >
                              <code className="mt-0.5 px-1 py-0.5 text-[9px] font-mono shrink-0 rounded bg-emerald-500/10 text-emerald-300">
                                {block.tag}
                              </code>
                              <span className="text-xs flex-1 text-zinc-300 line-clamp-2 break-words">
                                {block.name}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Delete saved block "${block.name}"?`)) deleteSavedBlock(block.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition"
                              title="Delete"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setPreviewBumpKey(k => k + 1)}
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
              disabled={!html && Object.keys(vfsFiles).length === 0}
              data-tour="export"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                (html || Object.keys(vfsFiles).length > 0)
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-slate-200 text-slate-500 dark:bg-zinc-800 dark:text-zinc-500'
              )}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </header>

        {/* Selected Element Action Bar — quick edits without typing in chat */}
        <AnimatePresence>
          {selectedElement && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-violet-500/10 border-b-2 border-violet-500"
            >
              <div className="px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <code className="text-sm text-violet-300 font-mono font-bold shrink-0">
                    &lt;{selectedElement.tagName?.toLowerCase()}&gt;
                  </code>
                  <span className="text-xs text-zinc-400 truncate">
                    {selectedElement.textContent?.slice(0, 60) || 'selected'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* REWRITE — send to /converse with the selected element as context */}
                  <button
                    onClick={() => {
                      const tag = selectedElement.tagName?.toLowerCase() || 'element'
                      handleChatMessage(`Rewrite this ${tag} to be more polished. Keep its purpose and structure but improve the design and copy.`)
                      setSelectedElement(null)
                    }}
                    title="Rewrite with AI"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Rewrite
                  </button>

                  {/* DUPLICATE */}
                  <button
                    onClick={() => {
                      if (selectedElement.outerHTML && html) {
                        const newHtml = html.replace(
                          selectedElement.outerHTML,
                          selectedElement.outerHTML + '\n' + selectedElement.outerHTML
                        )
                        if (newHtml !== html) {
                          setHtml(newHtml)
                          addToHistory(newHtml, `Duplicated <${selectedElement.tagName?.toLowerCase()}>`)
                          addToast('success', 'Duplicated')
                        }
                        setSelectedElement(null)
                      }
                    }}
                    title="Duplicate"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>

                  {/* SAVE AS BLOCK */}
                  <button
                    onClick={() => {
                      saveBlockFromElement(selectedElement)
                      setSelectedElement(null)
                    }}
                    title="Save as reusable block"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Save block
                  </button>

                  {/* STYLE — toggles property panel below */}
                  <button
                    onClick={() => setShowStylePanel(v => !v)}
                    title="Quick style controls"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      showStylePanel
                        ? "bg-violet-600 hover:bg-violet-500 text-white"
                        : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                    )}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Style
                  </button>

                  {/* MOVE UP — swaps with previous sibling at the section level */}
                  <button
                    onClick={() => {
                      if (!selectedElement.outerHTML || !html) return
                      // Find the section's index and the prior section's outer HTML, then swap
                      const sectionPattern = /(<(?:section|nav|header|footer|main|aside|article)\b[^>]*>[\s\S]*?<\/\1>)/g
                      const sections: { html: string; start: number; end: number }[] = []
                      let m
                      while ((m = sectionPattern.exec(html)) !== null) {
                        sections.push({ html: m[1], start: m.index, end: m.index + m[1].length })
                      }
                      const idx = sections.findIndex(s => s.html === selectedElement.outerHTML)
                      if (idx > 0) {
                        const prev = sections[idx - 1]
                        const cur = sections[idx]
                        const newHtml = html.slice(0, prev.start) + cur.html + html.slice(prev.end, cur.start) + prev.html + html.slice(cur.end)
                        setHtml(newHtml)
                        addToHistory(newHtml, `Moved <${selectedElement.tagName?.toLowerCase()}> up`)
                      } else {
                        addToast('info', 'Already at top, or not a section')
                      }
                      setSelectedElement(null)
                    }}
                    title="Move section up"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  {/* MOVE DOWN */}
                  <button
                    onClick={() => {
                      if (!selectedElement.outerHTML || !html) return
                      const sectionPattern = /(<(?:section|nav|header|footer|main|aside|article)\b[^>]*>[\s\S]*?<\/\1>)/g
                      const sections: { html: string; start: number; end: number }[] = []
                      let m
                      while ((m = sectionPattern.exec(html)) !== null) {
                        sections.push({ html: m[1], start: m.index, end: m.index + m[1].length })
                      }
                      const idx = sections.findIndex(s => s.html === selectedElement.outerHTML)
                      if (idx >= 0 && idx < sections.length - 1) {
                        const cur = sections[idx]
                        const next = sections[idx + 1]
                        const newHtml = html.slice(0, cur.start) + next.html + html.slice(cur.end, next.start) + cur.html + html.slice(next.end)
                        setHtml(newHtml)
                        addToHistory(newHtml, `Moved <${selectedElement.tagName?.toLowerCase()}> down`)
                      } else {
                        addToast('info', 'Already at bottom, or not a section')
                      }
                      setSelectedElement(null)
                    }}
                    title="Move section down"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={() => deleteSelectedElement()}
                    title="Delete"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    Delete
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={() => {
                      setSelectedElement(null)
                      setSelectMode(false)
                      setShowStylePanel(false)
                    }}
                    className="px-2 py-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Style panel — second row of property controls. */}
              {showStylePanel && (
                <div className="px-4 py-2 border-t border-violet-500/30 bg-violet-500/5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                  {/* Text color swatches */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">Text</span>
                    {[
                      { cls: 'text-white', color: '#ffffff' },
                      { cls: 'text-slate-300', color: '#cbd5e1' },
                      { cls: 'text-violet-400', color: '#a78bfa' },
                      { cls: 'text-indigo-400', color: '#818cf8' },
                      { cls: 'text-emerald-400', color: '#34d399' },
                      { cls: 'text-amber-400', color: '#fbbf24' },
                      { cls: 'text-rose-400', color: '#fb7185' },
                      { cls: 'text-slate-900', color: '#0f172a' },
                    ].map(({ cls, color }) => (
                      <button
                        key={cls}
                        onClick={() => applyPropertyChange(selectedElement, 'textColor', cls, setSelectedElement)}
                        title={cls}
                        className="w-5 h-5 rounded border border-white/20 hover:scale-110 hover:ring-2 hover:ring-violet-400 transition"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Background color swatches */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">BG</span>
                    {[
                      { cls: 'bg-transparent', color: 'transparent', label: '∅' },
                      { cls: 'bg-slate-900', color: '#0f172a' },
                      { cls: 'bg-slate-800', color: '#1e293b' },
                      { cls: 'bg-violet-600', color: '#7c3aed' },
                      { cls: 'bg-indigo-600', color: '#4f46e5' },
                      { cls: 'bg-emerald-600', color: '#059669' },
                      { cls: 'bg-amber-500', color: '#f59e0b' },
                      { cls: 'bg-white', color: '#ffffff' },
                    ].map(({ cls, color, label }) => (
                      <button
                        key={cls}
                        onClick={() => applyPropertyChange(selectedElement, 'bgColor', cls, setSelectedElement)}
                        title={cls}
                        className="w-5 h-5 rounded border border-white/20 hover:scale-110 hover:ring-2 hover:ring-violet-400 transition flex items-center justify-center text-[10px] text-zinc-500"
                        style={{ backgroundColor: color === 'transparent' ? undefined : color, backgroundImage: color === 'transparent' ? 'linear-gradient(45deg,#27272a 25%,transparent 25%,transparent 75%,#27272a 75%),linear-gradient(45deg,#27272a 25%,transparent 25%,transparent 75%,#27272a 75%)' : undefined, backgroundSize: '6px 6px', backgroundPosition: '0 0, 3px 3px' }}
                      >
                        {label || ''}
                      </button>
                    ))}
                  </div>

                  {/* Padding */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">Padding</span>
                    {['p-2', 'p-4', 'p-6', 'p-8', 'p-12'].map(cls => (
                      <button
                        key={cls}
                        onClick={() => applyPropertyChange(selectedElement, 'padding', cls, setSelectedElement)}
                        title={cls}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-mono transition-colors"
                      >
                        {cls.slice(2)}
                      </button>
                    ))}
                  </div>

                  {/* Border radius */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">Radius</span>
                    {[
                      { cls: 'rounded-none', label: '0' },
                      { cls: 'rounded', label: 'sm' },
                      { cls: 'rounded-lg', label: 'lg' },
                      { cls: 'rounded-2xl', label: '2xl' },
                      { cls: 'rounded-full', label: 'full' },
                    ].map(({ cls, label }) => (
                      <button
                        key={cls}
                        onClick={() => applyPropertyChange(selectedElement, 'radius', cls, setSelectedElement)}
                        title={cls}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-mono transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page tabs — only show once we have content or more than one page.
            Hidden by default so single-page generations stay clutter-free. */}
        {(pages.length > 1 || html) && (
          <div className={cn(
            "flex items-stretch gap-0 px-3 border-b overflow-x-auto",
            isDark ? "bg-zinc-950/80 border-white/5" : "bg-slate-50 border-slate-200"
          )}>
            {pages.map(page => {
              const active = page.id === activePageId
              return (
                <div
                  key={page.id}
                  className={cn(
                    "group flex items-center gap-1 pl-3 pr-1 py-2 border-r first:border-l text-xs cursor-pointer transition-colors",
                    isDark ? "border-white/5" : "border-slate-200",
                    active
                      ? (isDark ? "bg-zinc-900 text-white border-b-2 border-b-violet-500 -mb-px" : "bg-white text-slate-900 border-b-2 border-b-violet-600 -mb-px")
                      : (isDark ? "text-zinc-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-white hover:text-slate-900")
                  )}
                  onClick={() => switchToPage(page.id)}
                >
                  {page.isHome && <Home className="w-3 h-3 shrink-0" />}
                  <span className="font-medium">{page.name}</span>
                  <span className={cn("text-[10px] font-mono", isDark ? "text-zinc-600" : "text-slate-400")}>/{page.slug}</span>
                  {!page.isHome && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePage(page.id) }}
                      className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition"
                      title={`Delete ${page.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
            <button
              onClick={() => {
                const name = prompt('Page name (e.g. "About", "Pricing", "Contact")')
                if (name) addNewPage(name)
              }}
              className={cn(
                "px-3 py-2 text-xs flex items-center gap-1 transition-colors",
                isDark ? "text-zinc-500 hover:text-violet-400 hover:bg-white/5" : "text-slate-500 hover:text-violet-600 hover:bg-white"
              )}
              title="Add a new page"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add page</span>
            </button>
            {pages.length > 1 && (
              <button
                onClick={syncNavAcrossPages}
                className={cn(
                  "px-3 py-2 text-xs flex items-center gap-1 transition-colors ml-auto",
                  isDark ? "text-zinc-500 hover:text-emerald-400 hover:bg-white/5" : "text-slate-500 hover:text-emerald-600 hover:bg-white"
                )}
                title="Rewrite each page's nav so all sibling pages link to each other"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync nav</span>
              </button>
            )}
          </div>
        )}

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
                {buildTarget !== 'website' && Object.keys(vfsFiles).length > 0 ? (
                  // Multi-file projects run inside WebContainer. The component
                  // owns its own toolbar (refresh, device size) so we don't
                  // wrap it in our iframe chrome.
                  <WebContainerPreview key={previewBumpKey} files={vfsFiles} />
                ) : html ? (
                  <iframe
                    key={previewBumpKey}
                    ref={iframeRef}
                    srcDoc={getHtmlWithConsole(html)}
                    className="w-full h-full border-0"
                    // SANDBOX HARDENING: removed `allow-same-origin`. With it,
                    // generated HTML (which is LLM-authored and could be
                    // prompt-injected) could read the workspace origin's
                    // localStorage / cookies / session token. The postMessage
                    // bridge for console-mirroring + element-select works
                    // cross-origin, so dropping same-origin doesn't break it.
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
                    title="Preview"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900/50 p-6">
                    <div className="text-center max-w-md">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                        <Eye className="w-7 h-7 text-violet-400/50" />
                      </div>
                      {pages.length > 1 && !pages.find(p => p.id === activePageId)?.isHome ? (
                        <>
                          <p className="text-white font-medium text-sm">
                            "{pages.find(p => p.id === activePageId)?.name || 'New page'}" is empty
                          </p>
                          <p className="text-zinc-400 text-xs mt-2">
                            Describe what should go on this page in the chat
                            <br />
                            (e.g. "Add an about section with our story and team")
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-zinc-500 font-medium text-sm">Preview</p>
                          <p className="text-zinc-700 text-xs mt-1">Your website appears here</p>
                        </>
                      )}
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
                projectName={currentProject?.name || 'Webstew Project'}
                files={[]}
                html={html}
                onClose={() => setShowExportPanel(false)}
                className="h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Site grader modal — toolbar button toggles `graderOpen`.
          onAutoFix hands the issue list to the chat agent which has the
          grade_site + read_file + write_file tools to actually apply fixes.
          We dispatch the exact issue text so the agent can address each
          item rather than re-running the grader to discover them. */}
      <SiteGraderModal
        open={graderOpen}
        onClose={() => setGraderOpen(false)}
        html={html || vfsFiles['index.html'] || ''}
        deployedUrl={deployUrl}
        isDark={isDark}
        onAutoFix={(issues, recommendations) => {
          const combined = [...issues, ...recommendations]
          if (combined.length === 0) return
          const bullets = combined.slice(0, 12).map(s => `- ${s}`).join('\n')
          handleChatMessage(
            `Fix the SEO / technical issues below in index.html. Apply ONLY actionable changes that don't require new content from me (meta description, viewport, schema.org JSON-LD, alt text on existing images, canonical link, heading structure, etc.). Leave a brief summary of what you changed.\n\n${bullets}`,
          )
          // Briefly nudge focus to chat — the panel update is on the right
          // sidebar so the user sees the agent working.
          setActivePanel('build')
        }}
      />

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
                        placeholder={`sk_${'test'}_... or sk_${'live'}_...`}
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

      {/* Inline edit modal — replaces window.prompt() for right-click text/link edits */}
      <AnimatePresence>
        {inlineEdit?.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setInlineEdit(null)}
            onContextMenu={(e) => { e.preventDefault(); setInlineEdit(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-full max-w-lg rounded-2xl border shadow-2xl",
                isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
              )}
            >
              <div className={cn("px-5 py-3 border-b flex items-center justify-between", isDark ? "border-slate-700" : "border-slate-200")}>
                <h3 className={cn("font-semibold text-sm", isDark ? "text-white" : "text-slate-900")}>{inlineEdit.title}</h3>
                <button onClick={() => setInlineEdit(null)} className={cn("p-1 rounded transition-colors", isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form
                className="p-5 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const value = String(fd.get('value') || '')
                  inlineEdit.onSave(value)
                  setInlineEdit(null)
                }}
              >
                {inlineEdit.multiline ? (
                  <textarea
                    name="value"
                    defaultValue={inlineEdit.initialValue}
                    autoFocus
                    rows={6}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border text-sm font-mono resize-y",
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                    )}
                  />
                ) : (
                  <input
                    name="value"
                    type={inlineEdit.type === 'link' ? 'url' : 'text'}
                    defaultValue={inlineEdit.initialValue}
                    autoFocus
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border text-sm",
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                    )}
                    placeholder={inlineEdit.type === 'link' ? 'https://...' : 'Enter text'}
                  />
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setInlineEdit(null)}
                    className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Low-credits slide-in nudge — non-obtrusive but attention-grabbing.
          Only appears when the user's monthly credits are running low (< 30
          remaining or under 30% of their plan). Slides in with bounce, then
          a quiet pulsing glow so it stays in your peripheral vision until
          dismissed. Stays dismissed for 24h via localStorage. */}
      <AnimatePresence>
        {creditNudge.show && (
          <motion.div
            initial={{ x: 420, opacity: 0, scale: 0.9 }}
            animate={{
              x: 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{ x: 420, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18, mass: 0.7 }}
            className="fixed bottom-6 right-6 z-[150] max-w-sm"
            style={{
              filter: creditNudge.remaining === 0
                ? 'drop-shadow(0 0 28px rgba(244,63,94,0.45))'
                : 'drop-shadow(0 0 24px rgba(245,158,11,0.4))',
            }}
          >
            <div className="relative p-4 pr-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-zinc-950/95 to-zinc-950/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl shadow-amber-500/20">
              <button
                onClick={() => {
                  setCreditNudge({ show: false })
                  try { localStorage.setItem('webstew-credit-nudge-dismissed', String(Date.now())) } catch {}
                }}
                className="absolute top-2 right-2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-3 pr-5">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white mb-0.5">
                    {creditNudge.remaining === 0 ? 'Out of credits' : `${creditNudge.remaining} credits left`}
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                    {creditNudge.remaining === 0
                      ? "You've used your monthly credits. Top up to keep building."
                      : `That's about ${Math.floor((creditNudge.remaining || 0) / 10)} more sites this month. Top up anytime.`}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push('/upgrade')}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-[11px] font-semibold transition"
                    >
                      Buy 50 credits — $4.99
                    </button>
                    <button
                      onClick={() => router.push('/upgrade')}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[11px] font-medium transition"
                    >
                      See plans
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
