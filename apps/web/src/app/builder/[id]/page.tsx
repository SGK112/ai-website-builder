'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Rocket,
  Loader2,
  Download,
  Monitor,
  Tablet,
  Smartphone,
  MessageSquare,
  Plus,
  LayoutTemplate,
  Undo2,
  Redo2,
  Save,
  Type,
  Image as ImageIcon,
  Square,
  MousePointer2,
  Sparkles,
  X,
  ChevronDown,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  DollarSign,
  Grid3X3,
  Mail,
  Users,
  Quote,
  Link2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  FolderOpen,
  Palette,
  ChevronRight,
  Layers,
  GripVertical,
  Settings,
  FileText,
  Package,
  Code2,
  Terminal,
  Copy,
  Check,
  Play,
  Eye,
  EyeOff,
  RefreshCw,
  Moon,
  Sun,
  Zap,
  Store,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { BuilderChat } from '@/components/builder/BuilderChat'
import { DeploymentPanel } from '@/components/builder/DeploymentPanel'
import { AppIntegrationsPanel } from '@/components/builder/AppIntegrationsPanel'
import { MediaCreator } from '@/components/builder/MediaCreator'
import { AssetPanel } from '@/components/builder/AssetPanel'
import { PageSettingsPanel, PageSettings } from '@/components/builder/PageSettingsPanel'
import { ComponentLibrary, ComponentTemplate } from '@/components/builder/ComponentLibrary'
import { PagesPanel, Page } from '@/components/builder/PagesPanel'
import { cn } from '@/lib/utils'

// Element types that can be added to the page
interface PageElement {
  id: string
  type: 'hero' | 'text' | 'image' | 'button' | 'features' | 'cta' | 'footer' | 'testimonials' | 'pricing' | 'gallery' | 'contact' | 'social' | 'divider' | 'video' | 'stats' | 'custom'
  content: {
    heading?: string
    subheading?: string
    text?: string
    buttonText?: string
    buttonLink?: string
    imageSrc?: string
    imageAlt?: string
    videoUrl?: string
    items?: Array<{ title?: string; description?: string; icon?: string; price?: string; image?: string; name?: string; role?: string }>
    socialLinks?: { facebook?: string; twitter?: string; instagram?: string; linkedin?: string; youtube?: string; tiktok?: string }
    contactEmail?: string
    contactPhone?: string
    contactAddress?: string
    customHtml?: string // For component library items
  }
  styles: {
    backgroundColor?: string
    textColor?: string
    accentColor?: string
    padding?: string
    textAlign?: 'left' | 'center' | 'right'
    borderRadius?: string
  }
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

const DEVICE_SIZES = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '375px', label: 'Mobile' },
}

// Section type definitions for adding new sections
const SECTION_TYPES = [
  { type: 'hero', name: 'Hero', icon: Sparkles, description: 'Large header with title and CTA' },
  { type: 'text', name: 'Text', icon: Type, description: 'Text content block' },
  { type: 'image', name: 'Image', icon: ImageIcon, description: 'Full-width image' },
  { type: 'features', name: 'Features', icon: Grid3X3, description: '3-column feature grid' },
  { type: 'testimonials', name: 'Testimonials', icon: Quote, description: 'Customer reviews' },
  { type: 'pricing', name: 'Pricing', icon: DollarSign, description: 'Pricing table' },
  { type: 'gallery', name: 'Gallery', icon: Grid3X3, description: 'Image gallery grid' },
  { type: 'contact', name: 'Contact', icon: Mail, description: 'Contact form section' },
  { type: 'social', name: 'Social Links', icon: Users, description: 'Social media buttons' },
  { type: 'stats', name: 'Stats', icon: Star, description: 'Numbers and statistics' },
  { type: 'cta', name: 'Call to Action', icon: Square, description: 'CTA banner' },
  { type: 'divider', name: 'Divider', icon: ChevronRight, description: 'Section separator' },
  { type: 'footer', name: 'Footer', icon: Link2, description: 'Page footer with links' },
  { type: 'custom', name: 'Custom Component', icon: Package, description: 'Custom HTML component' },
]

// Sortable Section Item Component
function SortableSectionItem({
  element,
  isSelected,
  onClick,
  onDelete,
}: {
  element: PageElement
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const sectionInfo = SECTION_TYPES.find(s => s.type === element.type)
  const Icon = sectionInfo?.icon || Square

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-500 hover:text-slate-300"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="12" cy="4" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="12" cy="8" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      </div>

      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium truncate flex-1">
        {element.content.heading || sectionInfo?.name || element.type}
      </span>

      {/* Delete button - visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className={cn(
          'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected ? 'hover:bg-purple-500' : 'hover:bg-slate-600 text-slate-400 hover:text-red-400'
        )}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

// Starter templates with actual element data
const TEMPLATES: Record<string, PageElement[]> = {
  'modern-saas': [
    {
      id: 'hero-1',
      type: 'hero',
      content: {
        heading: 'Build Amazing Products',
        subheading: 'The all-in-one platform for modern teams to ship faster',
        buttonText: 'Get Started Free',
        buttonLink: '#',
        imageSrc: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
      },
      styles: { backgroundColor: '#0f172a', textColor: '#ffffff', accentColor: '#8b5cf6', textAlign: 'center', padding: '80px' },
    },
    {
      id: 'features-1',
      type: 'features',
      content: {
        heading: 'Why Choose Us',
        items: [
          { title: 'Lightning Fast', description: 'Optimized performance that loads in milliseconds' },
          { title: 'Secure by Default', description: 'Enterprise-grade security built into every layer' },
          { title: 'Scale Infinitely', description: 'Grows seamlessly with your business needs' },
        ],
      },
      styles: { backgroundColor: '#ffffff', textColor: '#1e293b', accentColor: '#8b5cf6', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'testimonials-1',
      type: 'testimonials',
      content: {
        heading: 'What Our Customers Say',
        items: [
          { name: 'Sarah Johnson', role: 'CEO, TechCorp', description: 'This platform transformed how we build products. Highly recommended!' },
          { name: 'Mike Chen', role: 'Founder, StartupXYZ', description: 'The best tool we have ever used. Simple, powerful, and reliable.' },
        ],
      },
      styles: { backgroundColor: '#f8fafc', textColor: '#1e293b', accentColor: '#8b5cf6', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'cta-1',
      type: 'cta',
      content: {
        heading: 'Ready to get started?',
        subheading: 'Join thousands of happy customers today',
        buttonText: 'Start Free Trial',
        buttonLink: '#',
      },
      styles: { backgroundColor: '#7c3aed', textColor: '#ffffff', accentColor: '#ffffff', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'footer-1',
      type: 'footer',
      content: {
        text: '2025 Your Company. All rights reserved.',
        socialLinks: { twitter: '#', linkedin: '#', facebook: '#' },
      },
      styles: { backgroundColor: '#0f172a', textColor: '#94a3b8', accentColor: '#8b5cf6', textAlign: 'center', padding: '40px' },
    },
  ],
  'portfolio-minimal': [
    {
      id: 'hero-1',
      type: 'hero',
      content: {
        heading: 'John Designer',
        subheading: 'Creative Director & UI/UX Designer',
        buttonText: 'View Work',
        buttonLink: '#work',
      },
      styles: { backgroundColor: '#fafafa', textColor: '#18181b', accentColor: '#18181b', textAlign: 'center', padding: '100px' },
    },
    {
      id: 'gallery-1',
      type: 'gallery',
      content: {
        heading: 'Selected Work',
        items: [
          { title: 'Brand Identity', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400' },
          { title: 'Web Design', image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400' },
          { title: 'Mobile App', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400' },
          { title: 'Photography', image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400' },
        ],
      },
      styles: { backgroundColor: '#ffffff', textColor: '#18181b', accentColor: '#18181b', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'contact-1',
      type: 'contact',
      content: {
        heading: 'Get In Touch',
        subheading: 'Have a project in mind? Lets talk.',
        contactEmail: 'hello@example.com',
        socialLinks: { twitter: '#', instagram: '#', linkedin: '#' },
      },
      styles: { backgroundColor: '#18181b', textColor: '#ffffff', accentColor: '#ffffff', textAlign: 'center', padding: '60px' },
    },
  ],
  'ecommerce-store': [
    {
      id: 'hero-1',
      type: 'hero',
      content: {
        heading: 'Summer Collection 2025',
        subheading: 'Discover the latest trends in fashion',
        buttonText: 'Shop Now',
        buttonLink: '#',
        imageSrc: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      },
      styles: { backgroundColor: '#064e3b', textColor: '#ffffff', accentColor: '#34d399', textAlign: 'center', padding: '80px' },
    },
    {
      id: 'features-1',
      type: 'features',
      content: {
        heading: 'Why Shop With Us',
        items: [
          { title: 'Free Shipping', description: 'On all orders over $50' },
          { title: 'Easy Returns', description: '30-day hassle-free returns' },
          { title: 'Secure Payment', description: 'Your data is always protected' },
        ],
      },
      styles: { backgroundColor: '#ffffff', textColor: '#064e3b', accentColor: '#34d399', textAlign: 'center', padding: '40px' },
    },
    {
      id: 'gallery-1',
      type: 'gallery',
      content: {
        heading: 'Best Sellers',
        items: [
          { title: 'Classic Tee - $29', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
          { title: 'Denim Jacket - $89', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
          { title: 'Sneakers - $120', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
        ],
      },
      styles: { backgroundColor: '#f0fdf4', textColor: '#064e3b', accentColor: '#34d399', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'social-1',
      type: 'social',
      content: {
        heading: 'Follow Us',
        subheading: 'Stay updated with our latest drops',
        socialLinks: { instagram: '#', facebook: '#', twitter: '#', tiktok: '#' },
      },
      styles: { backgroundColor: '#064e3b', textColor: '#ffffff', accentColor: '#34d399', textAlign: 'center', padding: '40px' },
    },
  ],
  'agency-bold': [
    {
      id: 'hero-1',
      type: 'hero',
      content: {
        heading: 'We Create Digital Experiences',
        subheading: 'Award-winning creative agency',
        buttonText: 'Our Work',
        buttonLink: '#',
      },
      styles: { backgroundColor: '#fbbf24', textColor: '#000000', accentColor: '#000000', textAlign: 'left', padding: '80px' },
    },
    {
      id: 'stats-1',
      type: 'stats',
      content: {
        items: [
          { title: '150+', description: 'Projects Delivered' },
          { title: '50+', description: 'Happy Clients' },
          { title: '12', description: 'Awards Won' },
          { title: '8', description: 'Years Experience' },
        ],
      },
      styles: { backgroundColor: '#000000', textColor: '#ffffff', accentColor: '#fbbf24', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'features-1',
      type: 'features',
      content: {
        heading: 'Our Services',
        items: [
          { title: 'Branding', description: 'Complete brand identity and strategy' },
          { title: 'Web Design', description: 'Custom websites that convert visitors' },
          { title: 'Development', description: 'Scalable web and mobile applications' },
        ],
      },
      styles: { backgroundColor: '#ffffff', textColor: '#000000', accentColor: '#fbbf24', textAlign: 'left', padding: '60px' },
    },
  ],
  'blog-magazine': [
    {
      id: 'hero-1',
      type: 'hero',
      content: {
        heading: 'The Modern Blog',
        subheading: 'Stories, insights, and ideas that inspire',
        buttonText: 'Start Reading',
        buttonLink: '#',
      },
      styles: { backgroundColor: '#be123c', textColor: '#ffffff', accentColor: '#ffffff', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'gallery-1',
      type: 'gallery',
      content: {
        heading: 'Featured Articles',
        items: [
          { title: 'The Future of Design', image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400' },
          { title: 'Tech Trends 2025', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400' },
          { title: 'Mindful Living', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400' },
        ],
      },
      styles: { backgroundColor: '#fff1f2', textColor: '#be123c', accentColor: '#be123c', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'contact-1',
      type: 'contact',
      content: {
        heading: 'Subscribe to Our Newsletter',
        subheading: 'Get the latest articles delivered to your inbox',
        contactEmail: 'subscribe@blog.com',
      },
      styles: { backgroundColor: '#be123c', textColor: '#ffffff', accentColor: '#ffffff', textAlign: 'center', padding: '60px' },
    },
  ],
  'blank': [],
  'music-artist': [
    {
      id: 'hero-music',
      type: 'hero',
      content: {
        heading: 'New Album Out Now',
        subheading: 'Stream "Midnight Dreams" on all platforms',
        buttonText: 'Listen Now',
        buttonLink: '#',
        imageSrc: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      },
      styles: { backgroundColor: '#0f0f0f', textColor: '#ffffff', accentColor: '#1db954', textAlign: 'center', padding: '100px' },
    },
    {
      id: 'video-music',
      type: 'video',
      content: {
        heading: 'Latest Music Video',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      styles: { backgroundColor: '#1a1a1a', textColor: '#ffffff', accentColor: '#1db954', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'gallery-music',
      type: 'gallery',
      content: {
        heading: 'Tour Photos',
        items: [
          { title: 'NYC Show', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400' },
          { title: 'LA Concert', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400' },
          { title: 'London Live', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400' },
          { title: 'Berlin Festival', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400' },
        ],
      },
      styles: { backgroundColor: '#0f0f0f', textColor: '#ffffff', accentColor: '#1db954', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'social-music',
      type: 'social',
      content: {
        heading: 'Follow the Journey',
        socialLinks: { instagram: '#', tiktok: '#', youtube: '#', twitter: '#' },
      },
      styles: { backgroundColor: '#1a1a1a', textColor: '#ffffff', accentColor: '#1db954', textAlign: 'center', padding: '40px' },
    },
  ],
  'restaurant-menu': [
    {
      id: 'hero-restaurant',
      type: 'hero',
      content: {
        heading: 'Authentic Italian Cuisine',
        subheading: 'Family recipes passed down through generations',
        buttonText: 'View Menu',
        buttonLink: '#menu',
        imageSrc: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      },
      styles: { backgroundColor: '#1c1917', textColor: '#ffffff', accentColor: '#ca8a04', textAlign: 'center', padding: '100px' },
    },
    {
      id: 'features-restaurant',
      type: 'features',
      content: {
        heading: 'Our Signature Dishes',
        items: [
          { title: 'Truffle Risotto', description: 'Arborio rice, black truffle, parmesan - $32' },
          { title: 'Osso Buco', description: 'Braised veal shank, gremolata, saffron risotto - $45' },
          { title: 'Tiramisu', description: 'Classic Italian dessert, espresso, mascarpone - $14' },
        ],
      },
      styles: { backgroundColor: '#fef3c7', textColor: '#1c1917', accentColor: '#ca8a04', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'stats-restaurant',
      type: 'stats',
      content: {
        heading: 'Our Story',
        items: [
          { title: '50+', description: 'Years of Excellence' },
          { title: '200+', description: 'Wine Selections' },
          { title: '4.9★', description: 'Customer Rating' },
        ],
      },
      styles: { backgroundColor: '#1c1917', textColor: '#ffffff', accentColor: '#ca8a04', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'contact-restaurant',
      type: 'contact',
      content: {
        heading: 'Make a Reservation',
        subheading: 'Book your table for an unforgettable dining experience',
        contactEmail: 'reservations@restaurant.com',
        contactPhone: '(555) 123-4567',
        contactAddress: '123 Main Street, New York, NY 10001',
      },
      styles: { backgroundColor: '#fef3c7', textColor: '#1c1917', accentColor: '#ca8a04', textAlign: 'center', padding: '60px' },
    },
  ],
  'product-launch': [
    {
      id: 'hero-product',
      type: 'hero',
      content: {
        heading: 'The Future of Tech',
        subheading: 'Introducing the revolutionary new device that changes everything',
        buttonText: 'Pre-Order Now',
        buttonLink: '#',
        imageSrc: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
      },
      styles: { backgroundColor: '#09090b', textColor: '#ffffff', accentColor: '#06b6d4', textAlign: 'center', padding: '100px' },
    },
    {
      id: 'features-product',
      type: 'features',
      content: {
        heading: 'Revolutionary Features',
        items: [
          { title: 'AI-Powered', description: 'Advanced machine learning for seamless experiences' },
          { title: 'All-Day Battery', description: '24+ hours of continuous use on a single charge' },
          { title: 'Ultra-Slim Design', description: 'Just 6mm thin, crafted from premium materials' },
        ],
      },
      styles: { backgroundColor: '#18181b', textColor: '#ffffff', accentColor: '#06b6d4', textAlign: 'center', padding: '80px' },
    },
    {
      id: 'video-product',
      type: 'video',
      content: {
        heading: 'See It In Action',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      styles: { backgroundColor: '#09090b', textColor: '#ffffff', accentColor: '#06b6d4', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'pricing-product',
      type: 'pricing',
      content: {
        heading: 'Choose Your Model',
        items: [
          { title: 'Standard', price: '$999', description: '128GB Storage, Standard warranty' },
          { title: 'Pro', price: '$1,299', description: '256GB Storage, Extended warranty' },
          { title: 'Max', price: '$1,599', description: '512GB Storage, Premium support' },
        ],
      },
      styles: { backgroundColor: '#18181b', textColor: '#ffffff', accentColor: '#06b6d4', textAlign: 'center', padding: '80px' },
    },
    {
      id: 'cta-product',
      type: 'cta',
      content: {
        heading: 'Be First In Line',
        subheading: 'Limited quantities available. Reserve yours today.',
        buttonText: 'Pre-Order Now',
        buttonLink: '#',
      },
      styles: { backgroundColor: '#0891b2', textColor: '#ffffff', accentColor: '#ffffff', textAlign: 'center', padding: '80px' },
    },
  ],
  'fitness-gym': [
    {
      id: 'hero-fitness',
      type: 'hero',
      content: {
        heading: 'Transform Your Body',
        subheading: 'Join the #1 rated gym in the city. First month free!',
        buttonText: 'Start Free Trial',
        buttonLink: '#',
        imageSrc: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      },
      styles: { backgroundColor: '#0a0a0a', textColor: '#ffffff', accentColor: '#ef4444', textAlign: 'center', padding: '100px' },
    },
    {
      id: 'features-fitness',
      type: 'features',
      content: {
        heading: 'Why Choose Us',
        items: [
          { title: 'Expert Trainers', description: 'Certified professionals to guide your journey' },
          { title: '24/7 Access', description: 'Work out on your schedule, any time of day' },
          { title: 'Premium Equipment', description: 'State-of-the-art machines and free weights' },
        ],
      },
      styles: { backgroundColor: '#171717', textColor: '#ffffff', accentColor: '#ef4444', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'pricing-fitness',
      type: 'pricing',
      content: {
        heading: 'Membership Plans',
        items: [
          { title: 'Basic', price: '$29/mo', description: 'Gym access, locker room' },
          { title: 'Premium', price: '$49/mo', description: '+ Classes, sauna, pool' },
          { title: 'Elite', price: '$99/mo', description: '+ Personal trainer, nutrition' },
        ],
      },
      styles: { backgroundColor: '#0a0a0a', textColor: '#ffffff', accentColor: '#ef4444', textAlign: 'center', padding: '80px' },
    },
    {
      id: 'testimonials-fitness',
      type: 'testimonials',
      content: {
        heading: 'Success Stories',
        items: [
          { name: 'Jessica M.', role: 'Lost 30 lbs', description: 'The trainers here changed my life. I have never felt better!' },
          { name: 'David K.', role: 'Gained 15 lbs muscle', description: 'Best gym I have ever been to. The community is amazing.' },
        ],
      },
      styles: { backgroundColor: '#171717', textColor: '#ffffff', accentColor: '#ef4444', textAlign: 'center', padding: '60px' },
    },
  ],
  'event-conference': [
    {
      id: 'hero-event',
      type: 'hero',
      content: {
        heading: 'TechConf 2025',
        subheading: 'The biggest tech conference of the year. March 15-17, 2025',
        buttonText: 'Get Tickets',
        buttonLink: '#',
        imageSrc: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      },
      styles: { backgroundColor: '#1e1b4b', textColor: '#ffffff', accentColor: '#a855f7', textAlign: 'center', padding: '100px' },
    },
    {
      id: 'stats-event',
      type: 'stats',
      content: {
        heading: 'Conference Highlights',
        items: [
          { title: '50+', description: 'World-class Speakers' },
          { title: '100+', description: 'Sessions & Workshops' },
          { title: '5000+', description: 'Attendees Expected' },
        ],
      },
      styles: { backgroundColor: '#312e81', textColor: '#ffffff', accentColor: '#a855f7', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'features-event',
      type: 'features',
      content: {
        heading: 'Featured Speakers',
        items: [
          { title: 'Jane Smith', description: 'CEO, TechGiant - AI and the Future' },
          { title: 'John Doe', description: 'Founder, StartupX - Building at Scale' },
          { title: 'Emily Johnson', description: 'CTO, DataCorp - Big Data Insights' },
        ],
      },
      styles: { backgroundColor: '#1e1b4b', textColor: '#ffffff', accentColor: '#a855f7', textAlign: 'center', padding: '60px' },
    },
    {
      id: 'pricing-event',
      type: 'pricing',
      content: {
        heading: 'Ticket Options',
        items: [
          { title: 'General', price: '$299', description: 'Main sessions, networking' },
          { title: 'VIP', price: '$599', description: '+ Workshops, early access' },
          { title: 'Executive', price: '$999', description: '+ Private dinners, 1:1 meetings' },
        ],
      },
      styles: { backgroundColor: '#312e81', textColor: '#ffffff', accentColor: '#a855f7', textAlign: 'center', padding: '80px' },
    },
    {
      id: 'contact-event',
      type: 'contact',
      content: {
        heading: 'Location & Contact',
        subheading: 'San Francisco Convention Center',
        contactEmail: 'info@techconf.com',
        contactAddress: '747 Howard St, San Francisco, CA 94103',
      },
      styles: { backgroundColor: '#1e1b4b', textColor: '#ffffff', accentColor: '#a855f7', textAlign: 'center', padding: '60px' },
    },
  ],
}

const QUICK_TEMPLATES = [
  { id: 'blank', name: 'Blank', preview: 'bg-slate-200' },
  { id: 'modern-saas', name: 'SaaS', preview: 'bg-gradient-to-br from-purple-600 to-blue-600' },
  { id: 'portfolio-minimal', name: 'Portfolio', preview: 'bg-gradient-to-br from-slate-100 to-slate-200' },
  { id: 'agency-bold', name: 'Agency', preview: 'bg-gradient-to-br from-yellow-400 to-orange-500' },
  { id: 'ecommerce-store', name: 'E-Commerce', preview: 'bg-gradient-to-br from-emerald-400 to-teal-500' },
  { id: 'blog-magazine', name: 'Blog', preview: 'bg-gradient-to-br from-rose-400 to-pink-500' },
  { id: 'music-artist', name: 'Music', preview: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  { id: 'restaurant-menu', name: 'Restaurant', preview: 'bg-gradient-to-br from-amber-500 to-orange-600' },
  { id: 'product-launch', name: 'Product', preview: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
  { id: 'fitness-gym', name: 'Fitness', preview: 'bg-gradient-to-br from-red-500 to-rose-600' },
  { id: 'event-conference', name: 'Event', preview: 'bg-gradient-to-br from-violet-500 to-purple-600' },
]

// Sortable section item component
function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

export default function BuilderPage({ params }: { params: { id: string } }) {
  // Theme
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  // Core state
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState('My Website')
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [selectedTemplateId, setSelectedTemplateId] = useState('modern-saas')

  // Page elements - the actual editable content
  const [elements, setElements] = useState<PageElement[]>(TEMPLATES['modern-saas'])

  // History for undo/redo
  const [history, setHistory] = useState<PageElement[][]>([TEMPLATES['modern-saas']])
  const [historyIndex, setHistoryIndex] = useState(0)

  // UI state
  const [showChat, setShowChat] = useState(false)
  const [showDeployPanel, setShowDeployPanel] = useState(false)
  const [showAppIntegrations, setShowAppIntegrations] = useState(false)
  const [showMediaCreator, setShowMediaCreator] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)
  const [showAssetPanel, setShowAssetPanel] = useState(false)
  const [saving, setSaving] = useState(false)

  // View mode: preview or code
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [codeContent, setCodeContent] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(true)

  // AI Provider for vibe coding
  const [selectedAIProvider, setSelectedAIProvider] = useState<'claude' | 'openai' | 'gemini'>('claude')

  // Edit state
  const [editingElement, setEditingElement] = useState<PageElement | null>(null)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [activeImageField, setActiveImageField] = useState<string | null>(null)
  const [showLayersPanel, setShowLayersPanel] = useState(true)
  const [showPageSettings, setShowPageSettings] = useState(false)
  const [showComponentLibrary, setShowComponentLibrary] = useState(false)
  const [showPagesPanel, setShowPagesPanel] = useState(false)

  // Multi-page support
  const [pages, setPages] = useState<Page[]>([
    { id: 'home', name: 'Home', slug: '', isHome: true, elements: [], createdAt: new Date() }
  ])
  const [currentPageId, setCurrentPageId] = useState('home')

  const [pageSettings, setPageSettings] = useState<PageSettings>({
    title: projectName,
    description: 'A website built with AI Website Builder',
    favicon: '',
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
    keywords: [],
    customHead: '',
    customCSS: '',
    googleAnalyticsId: '',
    language: 'en',
  })

  // AI Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [generatingMessage, setGeneratingMessage] = useState('')
  const [generatingPhase, setGeneratingPhase] = useState<string>('')
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Add to history for undo/redo
  const pushHistory = useCallback((newElements: PageElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newElements)
      return newHistory.slice(-50) // Keep last 50 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])

  // Map template IDs from new-project page to builder template IDs
  const templateMapping: Record<string, string> = {
    'saas-modern': 'modern-saas',
    'startup-landing': 'modern-saas',
    'agency-creative': 'agency-bold',
    'consulting-firm': 'agency-bold',
    'ecommerce-fashion': 'ecommerce-store',
    'ecommerce-electronics': 'ecommerce-store',
    'portfolio-developer': 'portfolio-minimal',
    'portfolio-photographer': 'portfolio-minimal',
    'restaurant-modern': 'ecommerce-store',
    'cafe-cozy': 'ecommerce-store',
    'gym-fitness': 'modern-saas',
    'wellness-spa': 'portfolio-minimal',
  }

  // Load project
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          const project = data.project
          setProjectName(project?.name || 'My Website')

          // Load template from project config
          if (project?.config?.template) {
            const templateId = templateMapping[project.config.template] || project.config.template
            if (TEMPLATES[templateId]) {
              setElements(TEMPLATES[templateId])
              setSelectedTemplateId(templateId)
              setHistory([TEMPLATES[templateId]])
              setHistoryIndex(0)
            }
          }

          // Update page settings from project
          if (project?.description) {
            setPageSettings(prev => ({
              ...prev,
              title: project.name || prev.title,
              description: project.description || prev.description,
            }))
          }

          // Load pages from project
          if (project?.pages && project.pages.length > 0) {
            const loadedPages: Page[] = project.pages.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              isHome: p.isHome,
              elements: [], // Elements are stored in project.files, not pages
              createdAt: new Date(p.createdAt),
            }))
            setPages(loadedPages)
            setCurrentPageId(loadedPages.find(p => p.isHome)?.id || loadedPages[0].id)
          }
        }
      } catch (error) {
        console.log('Creating new project')
      } finally {
        setLoading(false)
      }
    }
    loadProject()
  }, [params.id])

  // AI generation function with abort support
  const generateFromPrompt = useCallback(async (prompt: string, theme: 'light' | 'dark') => {
    // Cancel any existing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsGenerating(true)
    setGeneratingMessage('Starting AI generation...')
    setGeneratingPhase('')
    setShowGeneratedPreview(true)
    setGeneratedHtml('')

    try {
      const response = await fetch('/api/ai/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, theme }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Generation failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let streamingHtml = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              // Handle status updates with phases
              if (data.type === 'status') {
                const phaseMessages: Record<string, string> = {
                  'analyzing': 'Analyzing your request...',
                  'designing': 'Designing the layout...',
                  'building': 'Building sections...',
                  'styling': 'Adding visual polish...',
                  'images': 'Sourcing images...',
                }
                if (data.phase) setGeneratingPhase(data.phase)
                setGeneratingMessage(data.message || phaseMessages[data.phase] || 'Processing...')
              }
              // Handle streaming text chunks
              else if (data.type === 'text') {
                streamingHtml += data.content || ''
                // Try to extract and show partial HTML for live preview
                const htmlMatch = streamingHtml.match(/<(!DOCTYPE html|html)[^>]*>[\s\S]*$/i)
                if (htmlMatch) {
                  setGeneratedHtml(streamingHtml)
                }
              }
              // Handle completion with full code
              else if (data.type === 'complete') {
                setGeneratingPhase('complete')
                setGeneratingMessage('Generation complete!')
                if (data.code?.html) {
                  setGeneratedHtml(data.code.html)
                }
              }
              // Handle updates (e.g., image injection)
              else if (data.type === 'update') {
                if (data.code?.html) {
                  setGeneratedHtml(data.code.html)
                }
              }
              // Handle errors
              else if (data.type === 'error') {
                setGeneratingPhase('error')
                setGeneratingMessage(data.message || 'Generation failed')
              }
            } catch (parseError) {
              // Log JSON parsing errors for debugging
              console.warn('Failed to parse SSE data:', line, parseError)
            }
          }
        }
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Generation cancelled')
        return
      }
      console.error('AI generation error:', error)
      setGeneratingPhase('error')
      setGeneratingMessage('Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [])

  // Check for pending prompt from landing page and auto-generate
  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('pending-prompt')
    const pendingTheme = sessionStorage.getItem('pending-theme') || 'dark'

    if (pendingPrompt && !loading) {
      // Clear the pending prompt first to prevent re-triggering
      sessionStorage.removeItem('pending-prompt')
      sessionStorage.removeItem('pending-theme')

      // Trigger AI generation
      generateFromPrompt(pendingPrompt, pendingTheme as 'light' | 'dark')
    }
  }, [loading, generateFromPrompt])

  // Generate preview HTML from elements
  const generatePreviewHTML = useCallback(() => {
    const renderElement = (el: PageElement): string => {
      const bg = el.styles.backgroundColor || '#ffffff'
      const text = el.styles.textColor || '#000000'
      const accent = el.styles.accentColor || '#8b5cf6'
      const pad = el.styles.padding || '40px'
      const align = el.styles.textAlign || 'center'

      const sectionStyle = `background-color: ${bg}; color: ${text}; padding: ${pad}; text-align: ${align};`
      const containerStyle = 'max-width: 1200px; margin: 0 auto; padding: 0 20px;'

      switch (el.type) {
        case 'hero':
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                <h1 style="font-size: 3.5rem; font-weight: 800; margin-bottom: 1rem; line-height: 1.1;">${el.content.heading || 'Heading'}</h1>
                <p style="font-size: 1.25rem; opacity: 0.8; margin-bottom: 2rem; max-width: 600px; ${align === 'center' ? 'margin-left: auto; margin-right: auto;' : ''}">${el.content.subheading || ''}</p>
                ${el.content.buttonText ? `<a href="${el.content.buttonLink || '#'}" style="display: inline-block; background-color: ${accent}; color: ${bg}; padding: 14px 36px; border-radius: 8px; font-weight: 600; text-decoration: none; transition: transform 0.2s;">${el.content.buttonText}</a>` : ''}
                ${el.content.imageSrc ? `<img src="${el.content.imageSrc}" alt="${el.content.imageAlt || ''}" style="margin-top: 3rem; max-width: 100%; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">` : ''}
              </div>
            </section>`

        case 'text':
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle} max-width: 800px;">
                ${el.content.heading ? `<h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem;">${el.content.heading}</h2>` : ''}
                <p style="font-size: 1.125rem; line-height: 1.8; opacity: 0.9;">${el.content.text || 'Your text here'}</p>
              </div>
            </section>`

        case 'features':
          const features = el.content.items || []
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                ${el.content.heading ? `<h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 3rem;">${el.content.heading}</h2>` : ''}
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
                  ${features.map(f => `
                    <div style="padding: 2rem; background: ${bg === '#ffffff' ? '#f8fafc' : 'rgba(255,255,255,0.05)'}; border-radius: 12px;">
                      <div style="width: 48px; height: 48px; background: ${accent}; border-radius: 10px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" fill="none" stroke="${bg}" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">${f.title}</h3>
                      <p style="opacity: 0.7; line-height: 1.6;">${f.description}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>`

        case 'testimonials':
          const testimonials = el.content.items || []
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                ${el.content.heading ? `<h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 3rem;">${el.content.heading}</h2>` : ''}
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                  ${testimonials.map(t => `
                    <div style="padding: 2rem; background: ${bg === '#ffffff' ? '#ffffff' : 'rgba(255,255,255,0.05)'}; border-radius: 12px; border: 1px solid ${bg === '#ffffff' ? '#e2e8f0' : 'rgba(255,255,255,0.1)'};">
                      <div style="font-size: 2rem; color: ${accent}; margin-bottom: 1rem;">"</div>
                      <p style="font-style: italic; opacity: 0.9; margin-bottom: 1.5rem; line-height: 1.7;">${t.description}</p>
                      <div style="font-weight: 600;">${t.name || 'Customer'}</div>
                      <div style="font-size: 0.875rem; opacity: 0.6;">${t.role || ''}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>`

        case 'pricing':
          const plans = el.content.items || []
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                ${el.content.heading ? `<h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">${el.content.heading}</h2>` : ''}
                ${el.content.subheading ? `<p style="opacity: 0.7; margin-bottom: 3rem; font-size: 1.125rem;">${el.content.subheading}</p>` : ''}
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
                  ${plans.map((p, i) => `
                    <div style="padding: 2rem; background: ${i === 1 ? accent : (bg === '#ffffff' ? '#ffffff' : 'rgba(255,255,255,0.05)')}; color: ${i === 1 ? bg : text}; border-radius: 16px; border: 2px solid ${i === 1 ? accent : (bg === '#ffffff' ? '#e2e8f0' : 'rgba(255,255,255,0.1)')}; ${i === 1 ? 'transform: scale(1.05);' : ''}">
                      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">${p.title}</h3>
                      <div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem;">${p.price || '$0'}</div>
                      <p style="opacity: 0.7; margin-bottom: 1.5rem;">${p.description}</p>
                      <button style="width: 100%; padding: 12px; background: ${i === 1 ? bg : accent}; color: ${i === 1 ? accent : bg}; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Get Started</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>`

        case 'gallery':
          const images = el.content.items || []
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                ${el.content.heading ? `<h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 3rem;">${el.content.heading}</h2>` : ''}
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                  ${images.map(img => `
                    <div style="position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 12px;">
                      <img src="${img.image || 'https://via.placeholder.com/400'}" alt="${img.title}" style="width: 100%; height: 100%; object-fit: cover;">
                      ${img.title ? `<div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; font-weight: 500;">${img.title}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>`

        case 'contact':
          const formId = `form-${el.id}`
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle} max-width: 600px;">
                ${el.content.heading ? `<h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">${el.content.heading}</h2>` : ''}
                ${el.content.subheading ? `<p style="opacity: 0.8; margin-bottom: 2rem;">${el.content.subheading}</p>` : ''}
                <form id="${formId}" style="display: flex; flex-direction: column; gap: 1rem;" onsubmit="return handleFormSubmit(event, '${formId}')">
                  <input type="text" name="name" placeholder="Your Name" required style="padding: 14px 18px; border: 1px solid ${bg === '#ffffff' ? '#e2e8f0' : 'rgba(255,255,255,0.2)'}; border-radius: 8px; background: ${bg === '#ffffff' ? '#ffffff' : 'rgba(255,255,255,0.05)'}; color: ${text}; font-size: 1rem;">
                  <input type="email" name="email" placeholder="Your Email" required style="padding: 14px 18px; border: 1px solid ${bg === '#ffffff' ? '#e2e8f0' : 'rgba(255,255,255,0.2)'}; border-radius: 8px; background: ${bg === '#ffffff' ? '#ffffff' : 'rgba(255,255,255,0.05)'}; color: ${text}; font-size: 1rem;">
                  <textarea name="message" placeholder="Your Message" rows="4" required style="padding: 14px 18px; border: 1px solid ${bg === '#ffffff' ? '#e2e8f0' : 'rgba(255,255,255,0.2)'}; border-radius: 8px; background: ${bg === '#ffffff' ? '#ffffff' : 'rgba(255,255,255,0.05)'}; color: ${text}; font-size: 1rem; resize: vertical;"></textarea>
                  <button type="submit" id="${formId}-btn" style="padding: 14px 32px; background: ${accent}; color: ${bg}; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer;">Send Message</button>
                  <div id="${formId}-status" style="display: none; padding: 12px; border-radius: 8px; text-align: center;"></div>
                </form>
                ${el.content.contactEmail ? `<p style="margin-top: 2rem; opacity: 0.7;">Or email us at: <a href="mailto:${el.content.contactEmail}" style="color: ${accent};">${el.content.contactEmail}</a></p>` : ''}
              </div>
            </section>`

        case 'social':
          const links = el.content.socialLinks || {}
          const socialIcons: Record<string, string> = {
            facebook: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
            twitter: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
            instagram: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
            linkedin: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
            youtube: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            tiktok: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
          }
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                ${el.content.heading ? `<h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">${el.content.heading}</h2>` : ''}
                ${el.content.subheading ? `<p style="opacity: 0.7; margin-bottom: 1.5rem;">${el.content.subheading}</p>` : ''}
                <div style="display: flex; gap: 1rem; justify-content: ${align}; flex-wrap: wrap;">
                  ${Object.entries(links).filter(([_, url]) => url).map(([platform, url]) => `
                    <a href="${url}" target="_blank" rel="noopener" style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: ${accent}; color: ${bg}; border-radius: 50%; transition: transform 0.2s;">
                      ${socialIcons[platform] || ''}
                    </a>
                  `).join('')}
                </div>
              </div>
            </section>`

        case 'stats':
          const stats = el.content.items || []
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 2rem;">
                  ${stats.map(s => `
                    <div>
                      <div style="font-size: 3rem; font-weight: 800; color: ${accent}; margin-bottom: 0.5rem;">${s.title}</div>
                      <div style="opacity: 0.7;">${s.description}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>`

        case 'cta':
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle} max-width: 700px;">
                <h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.75rem;">${el.content.heading || 'Call to Action'}</h2>
                <p style="opacity: 0.8; margin-bottom: 2rem; font-size: 1.125rem;">${el.content.subheading || ''}</p>
                ${el.content.buttonText ? `<a href="${el.content.buttonLink || '#'}" style="display: inline-block; background: ${accent}; color: ${bg}; padding: 14px 36px; border-radius: 8px; font-weight: 600; text-decoration: none;">${el.content.buttonText}</a>` : ''}
              </div>
            </section>`

        case 'divider':
          return `
            <section data-id="${el.id}" style="${sectionStyle} padding: 0; cursor: pointer;" class="editable-section">
              <div style="max-width: 100px; margin: 0 auto; border-bottom: 3px solid ${accent};"></div>
            </section>`

        case 'image':
          return `
            <section data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                <img src="${el.content.imageSrc || 'https://via.placeholder.com/1200x600'}" alt="${el.content.imageAlt || ''}" style="max-width: 100%; border-radius: 12px;">
              </div>
            </section>`

        case 'footer':
          const footerLinks = el.content.socialLinks || {}
          return `
            <footer data-id="${el.id}" style="${sectionStyle} cursor: pointer;" class="editable-section">
              <div style="${containerStyle}">
                <div style="display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 1.5rem;">
                  ${Object.entries(footerLinks).filter(([_, url]) => url).map(([platform]) => `
                    <a href="#" style="color: ${text}; opacity: 0.6; text-decoration: none; text-transform: capitalize;">${platform}</a>
                  `).join('')}
                </div>
                <p style="opacity: 0.6; font-size: 0.875rem;">${el.content.text || ' 2025 Company Name'}</p>
              </div>
            </footer>`

        case 'custom':
          // Render custom HTML from component library
          return `
            <div data-id="${el.id}" style="cursor: pointer;" class="editable-section">
              ${el.content.customHtml || '<div style="padding: 40px; text-align: center; color: #999;">Custom Component</div>'}
            </div>`

        default:
          return ''
      }
    }

    const sectionsHTML = elements.map(renderElement).join('')

    // Build meta tags
    const metaTags = []
    if (pageSettings.description) {
      metaTags.push(`<meta name="description" content="${pageSettings.description}">`)
    }
    if (pageSettings.keywords.length > 0) {
      metaTags.push(`<meta name="keywords" content="${pageSettings.keywords.join(', ')}">`)
    }
    // Open Graph tags
    metaTags.push(`<meta property="og:title" content="${pageSettings.ogTitle || pageSettings.title || projectName}">`)
    if (pageSettings.ogDescription || pageSettings.description) {
      metaTags.push(`<meta property="og:description" content="${pageSettings.ogDescription || pageSettings.description}">`)
    }
    if (pageSettings.ogImage) {
      metaTags.push(`<meta property="og:image" content="${pageSettings.ogImage}">`)
    }
    metaTags.push('<meta property="og:type" content="website">')
    // Twitter Card
    metaTags.push('<meta name="twitter:card" content="summary_large_image">')
    metaTags.push(`<meta name="twitter:title" content="${pageSettings.ogTitle || pageSettings.title || projectName}">`)
    if (pageSettings.ogDescription || pageSettings.description) {
      metaTags.push(`<meta name="twitter:description" content="${pageSettings.ogDescription || pageSettings.description}">`)
    }
    if (pageSettings.ogImage) {
      metaTags.push(`<meta name="twitter:image" content="${pageSettings.ogImage}">`)
    }

    // Google Analytics
    const gaScript = pageSettings.googleAnalyticsId ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${pageSettings.googleAnalyticsId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${pageSettings.googleAnalyticsId}');
  </script>` : ''

    return `<!DOCTYPE html>
<html lang="${pageSettings.language || 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageSettings.title || projectName}</title>
  ${pageSettings.favicon ? `<link rel="icon" href="${pageSettings.favicon}">` : ''}
  ${metaTags.join('\n  ')}
  ${gaScript}
  ${pageSettings.customHead || ''}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .editable-section { transition: outline 0.15s; }
    .editable-section:hover { outline: 2px dashed rgba(139, 92, 246, 0.6); outline-offset: -2px; }
    a { transition: opacity 0.2s; }
    a:hover { opacity: 0.8; }
    button:hover { transform: translateY(-2px); }
    input:focus, textarea:focus { outline: none; border-color: #8b5cf6 !important; }
    ${pageSettings.customCSS || ''}
  </style>
</head>
<body>
  ${sectionsHTML || '<div style="padding: 100px; text-align: center; color: #666;"><p>Click + to add your first section</p></div>'}
  <script>
    // Form submission handler
    const PROJECT_ID = '${params.id}';
    const API_URL = window.location.origin;

    async function handleFormSubmit(event, formId) {
      event.preventDefault();
      const form = document.getElementById(formId);
      const btn = document.getElementById(formId + '-btn');
      const status = document.getElementById(formId + '-status');

      // Get form data
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => { data[key] = value; });

      // Update UI
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        const response = await fetch(API_URL + '/api/forms/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: PROJECT_ID,
            formId: 'contact',
            data: data,
            page: window.location.pathname
          })
        });

        const result = await response.json();

        if (response.ok) {
          status.style.display = 'block';
          status.style.background = '#10b981';
          status.style.color = 'white';
          status.textContent = 'Message sent successfully!';
          form.reset();
        } else {
          throw new Error(result.error || 'Failed to send');
        }
      } catch (error) {
        status.style.display = 'block';
        status.style.background = '#ef4444';
        status.style.color = 'white';
        status.textContent = error.message || 'Failed to send message. Please try again.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
        setTimeout(() => { status.style.display = 'none'; }, 5000);
      }

      return false;
    }

    // Click handler for builder editing
    document.querySelectorAll('.editable-section').forEach(section => {
      section.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'ELEMENT_CLICK', id: section.dataset.id }, '*');
      });
    });
  </script>
</body>
</html>`
  }, [elements, projectName, pageSettings])

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_CLICK') {
        const element = elements.find(el => el.id === event.data.id)
        if (element) {
          setEditingElement({ ...element })
          setShowEditPanel(true)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [elements])

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const templateElements = TEMPLATES[templateId] || []
    setElements(templateElements)
    pushHistory(templateElements)
    setSelectedTemplateId(templateId)
    setShowTemplates(false)
  }

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex(el => el.id === active.id)
      const newIndex = elements.findIndex(el => el.id === over.id)
      const newElements = arrayMove(elements, oldIndex, newIndex)
      setElements(newElements)
      pushHistory(newElements)
    }
  }

  // Add new element
  const addElement = (type: PageElement['type']) => {
    const defaults: Partial<Record<PageElement['type'], Partial<PageElement['content']>>> = {
      hero: { heading: 'Your Headline Here', subheading: 'A compelling subheadline that explains your value proposition', buttonText: 'Get Started', buttonLink: '#' },
      text: { heading: 'Section Title', text: 'Add your content here. This is a great place to tell your story or explain your offering in detail.' },
      features: { heading: 'Our Features', items: [{ title: 'Feature One', description: 'Describe this amazing feature' }, { title: 'Feature Two', description: 'Describe this amazing feature' }, { title: 'Feature Three', description: 'Describe this amazing feature' }] },
      testimonials: { heading: 'What People Say', items: [{ name: 'Customer Name', role: 'Job Title', description: 'This product/service has been amazing!' }] },
      pricing: { heading: 'Pricing Plans', subheading: 'Choose the plan thats right for you', items: [{ title: 'Basic', price: '$9/mo', description: 'Perfect for getting started' }, { title: 'Pro', price: '$29/mo', description: 'Best for professionals' }, { title: 'Enterprise', price: '$99/mo', description: 'For large teams' }] },
      gallery: { heading: 'Gallery', items: [{ title: 'Image 1', image: 'https://via.placeholder.com/400' }, { title: 'Image 2', image: 'https://via.placeholder.com/400' }] },
      contact: { heading: 'Contact Us', subheading: 'Wed love to hear from you', contactEmail: 'hello@example.com' },
      social: { heading: 'Follow Us', socialLinks: { twitter: '#', instagram: '#', linkedin: '#' } },
      stats: { items: [{ title: '100+', description: 'Customers' }, { title: '50K', description: 'Downloads' }, { title: '99%', description: 'Satisfaction' }] },
      cta: { heading: 'Ready to Get Started?', subheading: 'Join thousands of satisfied customers', buttonText: 'Sign Up Now', buttonLink: '#' },
      image: { imageSrc: 'https://via.placeholder.com/1200x600', imageAlt: 'Image description' },
      footer: { text: ' 2025 Your Company. All rights reserved.', socialLinks: { twitter: '#', linkedin: '#' } },
      divider: {},
    }

    const newElement: PageElement = {
      id: `${type}-${Date.now()}`,
      type,
      content: defaults[type] || {},
      styles: { backgroundColor: '#ffffff', textColor: '#1e293b', accentColor: '#8b5cf6', textAlign: 'center', padding: '60px' },
    }
    const newElements = [...elements, newElement]
    setElements(newElements)
    pushHistory(newElements)
    setEditingElement(newElement)
    setShowEditPanel(true)
    setShowAddSection(false)
  }

  // Update element
  const updateElement = (id: string, updates: Partial<PageElement>) => {
    const newElements = elements.map(el => {
      if (el.id !== id) return el
      return {
        ...el,
        content: { ...el.content, ...updates.content },
        styles: { ...el.styles, ...updates.styles },
      }
    })
    setElements(newElements)
    // Don't push to history on every keystroke - debounce this
  }

  // Save element changes to history
  const saveElementChanges = () => {
    pushHistory(elements)
  }

  // Delete element
  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    pushHistory(newElements)
    setShowEditPanel(false)
    setEditingElement(null)
  }

  // Move element up/down
  const moveElement = (id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex(el => el.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === elements.length - 1) return

    const newElements = [...elements]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newElements[index], newElements[swapIndex]] = [newElements[swapIndex], newElements[index]]
    setElements(newElements)
    pushHistory(newElements)
  }

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements(history[historyIndex + 1])
    }
  }

  // Save project
  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, elements, templateId: selectedTemplateId }),
      })
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  // Export HTML
  const handleExport = () => {
    const html = generatePreviewHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Handle asset selection
  const handleAssetSelect = (asset: { url: string }) => {
    if (editingElement && activeImageField) {
      if (activeImageField === 'imageSrc') {
        updateElement(editingElement.id, { content: { imageSrc: asset.url } })
        setEditingElement({ ...editingElement, content: { ...editingElement.content, imageSrc: asset.url } })
      }
      // Handle gallery items
      if (activeImageField.startsWith('gallery-')) {
        const index = parseInt(activeImageField.split('-')[1])
        const items = [...(editingElement.content.items || [])]
        items[index] = { ...items[index], image: asset.url }
        updateElement(editingElement.id, { content: { items } })
        setEditingElement({ ...editingElement, content: { ...editingElement.content, items } })
      }
    }
    setShowAssetPanel(false)
    setActiveImageField(null)
  }

  // Component Library handler - convert ComponentTemplate to PageElement
  const handleInsertComponent = (template: ComponentTemplate) => {
    // Create a custom HTML element that wraps the component's HTML
    const newElement: PageElement = {
      id: `${template.category}-${Date.now()}`,
      type: 'custom',
      content: {
        heading: template.name,
        customHtml: template.html,
      },
      styles: {
        backgroundColor: 'transparent',
        textColor: '#1e293b',
        accentColor: '#3b82f6',
        textAlign: 'center',
        padding: '0px', // Component has its own padding
      },
    }
    const newElements = [...elements, newElement]
    setElements(newElements)
    pushHistory(newElements)
    setShowComponentLibrary(false)
  }

  // Page management handlers - connected to API
  const handleAddPage = async (name: string, slug: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, isHome: false, html: '' }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPage: Page = {
          id: data.page.id,
          name: data.page.name,
          slug: data.page.slug,
          isHome: false,
          elements: [],
          createdAt: new Date(),
        }
        setPages([...pages, newPage])
      }
    } catch (error) {
      console.error('Failed to add page:', error)
    }
  }

  const handleSelectPage = (pageId: string) => {
    // Save current page elements
    setPages(pages.map(p =>
      p.id === currentPageId ? { ...p, elements } : p
    ))
    // Load new page elements
    const newPage = pages.find(p => p.id === pageId)
    if (newPage) {
      setElements(newPage.elements)
      setCurrentPageId(pageId)
      setHistory([newPage.elements])
      setHistoryIndex(0)
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) return

    try {
      const response = await fetch(`/api/projects/${params.id}/pages?pageId=${pageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const newPages = pages.filter(p => p.id !== pageId)
        // If deleting current page, switch to first page
        if (pageId === currentPageId) {
          const firstPage = newPages[0]
          setCurrentPageId(firstPage.id)
          setElements(firstPage.elements)
        }
        setPages(newPages)
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
    }
  }

  const handleDuplicatePage = async (pageId: string) => {
    const pageToDuplicate = pages.find(p => p.id === pageId)
    if (!pageToDuplicate) return

    try {
      const response = await fetch(`/api/projects/${params.id}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${pageToDuplicate.name} (Copy)`,
          slug: `${pageToDuplicate.slug}-copy`,
          isHome: false,
          html: '', // Would need to get HTML from original page
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPage: Page = {
          id: data.page.id,
          name: data.page.name,
          slug: data.page.slug,
          isHome: false,
          elements: [...pageToDuplicate.elements],
          createdAt: new Date(),
        }
        setPages([...pages, newPage])
      }
    } catch (error) {
      console.error('Failed to duplicate page:', error)
    }
  }

  const handleRenamePage = async (pageId: string, name: string, slug: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/pages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, name, slug }),
      })

      if (response.ok) {
        setPages(pages.map(p =>
          p.id === pageId ? { ...p, name, slug } : p
        ))
      }
    } catch (error) {
      console.error('Failed to rename page:', error)
    }
  }

  const handleSetHomePage = async (pageId: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/pages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, isHome: true }),
      })

      if (response.ok) {
        setPages(pages.map(p => ({
          ...p,
          isHome: p.id === pageId,
          slug: p.id === pageId ? '' : p.slug,
        })))
      }
    } catch (error) {
      console.error('Failed to set home page:', error)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="text-slate-300">Loading builder...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Toolbar */}
      <header className="h-14 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800/80 flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
        {/* Left: Logo & Project Name */}
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="flex items-center gap-2.5 group" title="Back to Dashboard">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
          </a>
          <div className="flex items-center">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm focus:outline-none focus:bg-slate-800/60 hover:bg-slate-800/40 px-2.5 py-1.5 rounded-lg transition-colors w-44 border border-transparent focus:border-slate-700"
              placeholder="Project Name"
            />
          </div>
        </div>

        {/* Center: Main Actions */}
        <div className="flex items-center gap-1.5">
          {/* Add Section - Primary Action */}
          <button
            onClick={() => setShowAddSection(!showAddSection)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-sm transition-all duration-200",
              showAddSection
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>Add Section</span>
          </button>

          <div className="w-px h-7 bg-slate-700/60 mx-1" />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-all duration-200",
                viewMode === 'preview'
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
              title="Visual Preview"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden lg:inline">Preview</span>
            </button>
            <button
              onClick={() => {
                setViewMode('code')
                setCodeContent(generatePreviewHTML())
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-all duration-200",
                viewMode === 'code'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
              title="Code Editor"
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden lg:inline">Code</span>
            </button>
          </div>

          <div className="w-px h-7 bg-slate-700/60 mx-1" />

          {/* Device Toggle */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
            {Object.entries(DEVICE_SIZES).map(([key, { label }]) => {
              const Icon = key === 'desktop' ? Monitor : key === 'tablet' ? Tablet : Smartphone
              return (
                <button
                  key={key}
                  onClick={() => setDeviceMode(key as DeviceMode)}
                  className={cn(
                    "p-2 rounded-md transition-all duration-200",
                    deviceMode === key
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  )}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          <div className="w-px h-7 bg-slate-700/60 mx-1" />

          {/* Content Panels Group */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/30">
            {/* Layers */}
            <button
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-all duration-200",
                showLayersPanel
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
              title="Layers Panel"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden xl:inline">Layers</span>
            </button>

            {/* Pages Panel */}
            <button
              onClick={() => setShowPagesPanel(!showPagesPanel)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-all duration-200",
                showPagesPanel
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
              title="Pages Panel"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden xl:inline">Pages</span>
              <span className="text-[10px] bg-slate-600/80 px-1.5 py-0.5 rounded-full font-medium">{pages.length}</span>
            </button>

            {/* Component Library */}
            <button
              onClick={() => setShowComponentLibrary(!showComponentLibrary)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-all duration-200",
                showComponentLibrary
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
              title="Component Library"
            >
              <Package className="w-4 h-4" />
              <span className="hidden xl:inline">Components</span>
            </button>
          </div>

          <div className="w-px h-7 bg-slate-700/60 mx-1" />

          {/* Assets & Templates Group */}
          <div className="flex items-center gap-1">
            {/* Asset Library */}
            <button
              onClick={() => setShowAssetPanel(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all duration-200"
              title="Asset Library"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm hidden lg:inline">Assets</span>
            </button>

            {/* Template Selector */}
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200",
                showTemplates
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              )}
              title="Templates"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span className="text-sm hidden lg:inline">Templates</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showTemplates && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* History Controls */}
          <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/30">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all duration-200"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all duration-200"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-7 bg-slate-700/60 mx-1.5" />

          {/* AI Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              showChat
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/50"
            )}
            title="AI Assistant"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden xl:inline">AI Chat</span>
          </button>

          <div className="w-px h-7 bg-slate-700/60 mx-1.5" />

          {/* Quick Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 disabled:opacity-50 transition-all duration-200"
              title="Save Project (Ctrl+S)"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>

            <button
              onClick={handleExport}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all duration-200"
              title="Export HTML"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all duration-200"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowPageSettings(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all duration-200"
              title="Page Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-7 bg-slate-700/60 mx-1.5" />

          {/* Media Creator Button */}
          <button
            onClick={() => setShowMediaCreator(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg text-sm font-medium shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            <span>Media</span>
          </button>

          {/* Apps Button */}
          <button
            onClick={() => setShowAppIntegrations(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-sm font-medium shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
          >
            <Zap className="w-4 h-4" />
            <span>Apps</span>
          </button>

          {/* Deploy Button - Primary CTA */}
          <button
            onClick={() => setShowDeployPanel(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-sm font-medium shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
          >
            <Rocket className="w-4 h-4" />
            <span>Deploy</span>
          </button>
        </div>
      </header>

      {/* Add Section Dropdown */}
      <AnimatePresence>
        {showAddSection && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddSection(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-purple-500/10 p-5 w-[640px]"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold text-lg">Add Section</h3>
                  <p className="text-slate-400 text-sm mt-0.5">Choose a section type to add to your page</p>
                </div>
                <button
                  onClick={() => setShowAddSection(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {SECTION_TYPES.map(({ type, name, icon: Icon, description }) => (
                  <button
                    key={type}
                    onClick={() => addElement(type as PageElement['type'])}
                    className="p-3.5 rounded-xl border border-slate-700/60 hover:border-purple-500/60 hover:bg-purple-500/10 transition-all duration-200 text-left group hover:shadow-lg hover:shadow-purple-500/5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-800 group-hover:bg-purple-500/20 flex items-center justify-center mb-2.5 transition-colors">
                      <Icon className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="text-sm font-medium text-white group-hover:text-purple-100 transition-colors">{name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Template Dropdown */}
      <AnimatePresence>
        {showTemplates && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplates(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-5 w-[520px]"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-semibold text-lg">Choose Template</h3>
                  <p className="text-slate-400 text-sm mt-0.5">Start with a pre-designed layout</p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-lg",
                      selectedTemplateId === template.id
                        ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                        : "border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/50"
                    )}
                  >
                    <div className={cn(
                      "aspect-video rounded-lg mb-2.5 transition-transform duration-200 group-hover:scale-[1.02]",
                      template.preview
                    )} />
                    <span className="text-sm font-medium text-white">{template.name}</span>
                    {selectedTemplateId === template.id && (
                      <span className="ml-2 text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layers Panel */}
        <AnimatePresence>
          {showLayersPanel && (
            <motion.div
              initial={{ x: -256, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -256, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-800/80 flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between p-3.5 border-b border-slate-800/80">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  Sections
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full ml-1">{elements.length}</span>
                </h3>
                <button
                  onClick={() => setShowLayersPanel(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sortable Sections List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {elements.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-3">
                      <Layers className="w-7 h-7 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">No sections yet</p>
                    <p className="text-xs text-slate-500 mt-1.5">Click the button below to get started</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={elements.map(el => el.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {elements.map((element) => (
                        <SortableSectionItem
                          key={element.id}
                          element={element}
                          isSelected={editingElement?.id === element.id}
                          onClick={() => {
                            setEditingElement({ ...element })
                            setShowEditPanel(true)
                          }}
                          onDelete={() => deleteElement(element.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              {/* Quick Add Section Button */}
              <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
                <button
                  onClick={() => setShowAddSection(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layers Toggle Button (when panel is hidden) */}
        {!showLayersPanel && !showPagesPanel && !showComponentLibrary && (
          <button
            onClick={() => setShowLayersPanel(true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-lg"
            title="Show Layers"
          >
            <Layers className="w-5 h-5" />
          </button>
        )}

        {/* Pages Panel */}
        <AnimatePresence>
          {showPagesPanel && (
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <h3 className="font-medium text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Pages
                </h3>
                <button
                  onClick={() => setShowPagesPanel(false)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PagesPanel
                  pages={pages}
                  currentPageId={currentPageId}
                  onSelectPage={handleSelectPage}
                  onAddPage={handleAddPage}
                  onDeletePage={handleDeletePage}
                  onDuplicatePage={handleDuplicatePage}
                  onRenamePage={handleRenamePage}
                  onSetHomePage={handleSetHomePage}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Component Library Panel */}
        <AnimatePresence>
          {showComponentLibrary && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <h3 className="font-medium text-white text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-400" />
                  Component Library
                </h3>
                <button
                  onClick={() => setShowComponentLibrary(false)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ComponentLibrary onInsertComponent={handleInsertComponent} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview / Code Area */}
        <div className="flex-1 flex bg-slate-950/95 overflow-hidden">
          {viewMode === 'preview' ? (
            /* Visual Preview Mode */
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              {/* Device Frame Container */}
              <div
                className={cn(
                  "transition-all duration-300 ease-out",
                  deviceMode === 'mobile' && "max-w-[375px]",
                  deviceMode === 'tablet' && "max-w-[768px]",
                  deviceMode === 'desktop' && "max-w-full w-full"
                )}
                style={{ width: DEVICE_SIZES[deviceMode].width }}
              >
                {/* Browser/Device Chrome */}
                <div className={cn(
                  "rounded-t-xl overflow-hidden",
                  deviceMode === 'mobile'
                    ? "bg-slate-800 pt-6 pb-2 relative"
                    : "bg-slate-800/90 border border-slate-700/50"
                )}>
                  {/* Mobile Notch */}
                  {deviceMode === 'mobile' && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <div className="w-16 h-5 bg-slate-950 rounded-full flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                        <div className="w-6 h-1.5 rounded-full bg-slate-700" />
                      </div>
                    </div>
                  )}

                  {/* Browser Bar for Desktop/Tablet */}
                  {deviceMode !== 'mobile' && (
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/50">
                      {/* Window Controls */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
                      </div>

                      {/* URL Bar */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-4 py-1.5 min-w-[300px] max-w-[500px]">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-xs text-slate-400 truncate">
                            {projectName.toLowerCase().replace(/\s+/g, '-')}.com
                          </span>
                        </div>
                      </div>

                      {/* Device Label */}
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {DEVICE_SIZES[deviceMode].label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Preview Content */}
                <div className={cn(
                  "bg-white overflow-hidden shadow-2xl shadow-black/20",
                  deviceMode === 'mobile'
                    ? "rounded-b-[2rem] border-x-4 border-b-4 border-slate-800"
                    : "rounded-b-xl border border-t-0 border-slate-700/50"
                )}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={generatePreviewHTML()}
                    className="w-full border-0"
                    style={{
                      height: deviceMode === 'mobile' ? 'calc(100vh - 11rem)' : 'calc(100vh - 8.5rem)',
                      minHeight: '500px'
                    }}
                    title="Preview"
                  />
                </div>

                {/* Mobile Home Indicator */}
                {deviceMode === 'mobile' && (
                  <div className="flex justify-center py-2 bg-slate-800 rounded-b-xl">
                    <div className="w-24 h-1 bg-slate-600 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Code Editor Mode - Terminal Style */
            <div className="flex-1 flex flex-col">
              {/* Terminal Header */}
              <div className="bg-[#1a1b26] border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Terminal Controls */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  {/* Tab */}
                  <div className="flex items-center gap-2 bg-[#24273a] rounded-lg px-3 py-1.5">
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-sm text-slate-300 font-medium">index.html</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Live Preview Toggle */}
                  <button
                    onClick={() => setLivePreviewEnabled(!livePreviewEnabled)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      livePreviewEnabled
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700/50 text-slate-400"
                    )}
                  >
                    {livePreviewEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Live Preview
                  </button>
                  {/* Refresh */}
                  <button
                    onClick={() => setCodeContent(generatePreviewHTML())}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                    title="Refresh from Builder"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {/* Copy */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codeContent)
                      setCodeCopied(true)
                      setTimeout(() => setCodeCopied(false), 2000)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all text-xs font-medium"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {codeCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Code Editor & Preview Split */}
              <div className="flex-1 flex overflow-hidden">
                {/* Code Editor */}
                <div className={cn(
                  "flex flex-col overflow-hidden",
                  livePreviewEnabled ? "w-1/2 border-r border-slate-800" : "w-full"
                )}>
                  {/* Line Numbers + Code */}
                  <div className="flex-1 overflow-auto bg-[#0d0e14]">
                    <div className="flex min-h-full">
                      {/* Line Numbers */}
                      <div className="sticky left-0 bg-[#0d0e14] text-right pr-4 pl-4 py-4 select-none border-r border-slate-800/50">
                        {codeContent.split('\n').map((_, i) => (
                          <div key={i} className="text-slate-600 text-xs leading-6 font-mono">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      {/* Code Content */}
                      <div className="flex-1 p-4">
                        <textarea
                          value={codeContent}
                          onChange={(e) => setCodeContent(e.target.value)}
                          className="w-full h-full min-h-[500px] bg-transparent text-slate-200 font-mono text-xs leading-6 resize-none focus:outline-none"
                          spellCheck={false}
                          style={{
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terminal Footer */}
                  <div className="bg-[#1a1b26] border-t border-slate-800/80 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">claude-code</span>
                      </span>
                      <span>HTML</span>
                      <span>{codeContent.split('\n').length} lines</span>
                      <span>{codeContent.length} chars</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Preview Panel */}
                {livePreviewEnabled && (
                  <div className="w-1/2 flex flex-col bg-white">
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Live Preview</span>
                    </div>
                    <iframe
                      srcDoc={codeContent}
                      className="flex-1 w-full border-0"
                      title="Live Preview"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Panel */}
        <AnimatePresence>
          {showEditPanel && editingElement && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="font-medium text-white capitalize">{SECTION_TYPES.find(s => s.type === editingElement.type)?.name || editingElement.type}</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveElement(editingElement.id, 'up')} className="p-1.5 text-slate-400 hover:text-white rounded" title="Move Up">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveElement(editingElement.id, 'down')} className="p-1.5 text-slate-400 hover:text-white rounded" title="Move Down">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteElement(editingElement.id)} className="p-1.5 text-slate-400 hover:text-red-400 rounded" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setShowEditPanel(false); saveElementChanges() }} className="p-1.5 text-slate-400 hover:text-white rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Content Fields */}
                {editingElement.content.heading !== undefined && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Heading</label>
                    <input
                      type="text"
                      value={editingElement.content.heading || ''}
                      onChange={(e) => {
                        const updated = { ...editingElement, content: { ...editingElement.content, heading: e.target.value } }
                        setEditingElement(updated)
                        updateElement(editingElement.id, { content: { heading: e.target.value } })
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                )}

                {editingElement.content.subheading !== undefined && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Subheading</label>
                    <textarea
                      value={editingElement.content.subheading || ''}
                      onChange={(e) => {
                        const updated = { ...editingElement, content: { ...editingElement.content, subheading: e.target.value } }
                        setEditingElement(updated)
                        updateElement(editingElement.id, { content: { subheading: e.target.value } })
                      }}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm resize-none"
                    />
                  </div>
                )}

                {editingElement.content.text !== undefined && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Text</label>
                    <textarea
                      value={editingElement.content.text || ''}
                      onChange={(e) => {
                        const updated = { ...editingElement, content: { ...editingElement.content, text: e.target.value } }
                        setEditingElement(updated)
                        updateElement(editingElement.id, { content: { text: e.target.value } })
                      }}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm resize-none"
                    />
                  </div>
                )}

                {editingElement.content.buttonText !== undefined && (
                  <>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Button Text</label>
                      <input
                        type="text"
                        value={editingElement.content.buttonText || ''}
                        onChange={(e) => {
                          const updated = { ...editingElement, content: { ...editingElement.content, buttonText: e.target.value } }
                          setEditingElement(updated)
                          updateElement(editingElement.id, { content: { buttonText: e.target.value } })
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Button Link</label>
                      <input
                        type="text"
                        value={editingElement.content.buttonLink || ''}
                        onChange={(e) => {
                          const updated = { ...editingElement, content: { ...editingElement.content, buttonLink: e.target.value } }
                          setEditingElement(updated)
                          updateElement(editingElement.id, { content: { buttonLink: e.target.value } })
                        }}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      />
                    </div>
                  </>
                )}

                {(editingElement.content.imageSrc !== undefined || editingElement.type === 'hero') && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Image</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingElement.content.imageSrc || ''}
                        onChange={(e) => {
                          const updated = { ...editingElement, content: { ...editingElement.content, imageSrc: e.target.value } }
                          setEditingElement(updated)
                          updateElement(editingElement.id, { content: { imageSrc: e.target.value } })
                        }}
                        placeholder="Image URL"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      />
                      <button
                        onClick={() => { setActiveImageField('imageSrc'); setShowAssetPanel(true) }}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm"
                      >
                        Browse
                      </button>
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {editingElement.content.socialLinks !== undefined && (
                  <div className="space-y-3">
                    <label className="text-xs text-slate-400 block">Social Links</label>
                    {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'].map(platform => (
                      <div key={platform} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-20 capitalize">{platform}</span>
                        <input
                          type="text"
                          value={(editingElement.content.socialLinks as any)?.[platform] || ''}
                          onChange={(e) => {
                            const newLinks = { ...editingElement.content.socialLinks, [platform]: e.target.value }
                            const updated = { ...editingElement, content: { ...editingElement.content, socialLinks: newLinks } }
                            setEditingElement(updated)
                            updateElement(editingElement.id, { content: { socialLinks: newLinks } })
                          }}
                          placeholder={`${platform} URL`}
                          className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact Info */}
                {editingElement.content.contactEmail !== undefined && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Contact Email</label>
                    <input
                      type="email"
                      value={editingElement.content.contactEmail || ''}
                      onChange={(e) => {
                        const updated = { ...editingElement, content: { ...editingElement.content, contactEmail: e.target.value } }
                        setEditingElement(updated)
                        updateElement(editingElement.id, { content: { contactEmail: e.target.value } })
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                )}

                {/* Style Fields */}
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-xs text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Styles
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Background</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingElement.styles.backgroundColor || '#ffffff'}
                          onChange={(e) => {
                            const updated = { ...editingElement, styles: { ...editingElement.styles, backgroundColor: e.target.value } }
                            setEditingElement(updated)
                            updateElement(editingElement.id, { styles: { backgroundColor: e.target.value } })
                          }}
                          className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editingElement.styles.backgroundColor || '#ffffff'}
                          onChange={(e) => {
                            const updated = { ...editingElement, styles: { ...editingElement.styles, backgroundColor: e.target.value } }
                            setEditingElement(updated)
                            updateElement(editingElement.id, { styles: { backgroundColor: e.target.value } })
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingElement.styles.textColor || '#000000'}
                          onChange={(e) => {
                            const updated = { ...editingElement, styles: { ...editingElement.styles, textColor: e.target.value } }
                            setEditingElement(updated)
                            updateElement(editingElement.id, { styles: { textColor: e.target.value } })
                          }}
                          className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editingElement.styles.textColor || '#000000'}
                          onChange={(e) => {
                            const updated = { ...editingElement, styles: { ...editingElement.styles, textColor: e.target.value } }
                            setEditingElement(updated)
                            updateElement(editingElement.id, { styles: { textColor: e.target.value } })
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingElement.styles.accentColor || '#8b5cf6'}
                          onChange={(e) => {
                            const updated = { ...editingElement, styles: { ...editingElement.styles, accentColor: e.target.value } }
                            setEditingElement(updated)
                            updateElement(editingElement.id, { styles: { accentColor: e.target.value } })
                          }}
                          className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editingElement.styles.accentColor || '#8b5cf6'}
                          onChange={(e) => {
                            const updated = { ...editingElement, styles: { ...editingElement.styles, accentColor: e.target.value } }
                            setEditingElement(updated)
                            updateElement(editingElement.id, { styles: { accentColor: e.target.value } })
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Text Align</label>
                      <div className="flex gap-1">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            onClick={() => {
                              const updated = { ...editingElement, styles: { ...editingElement.styles, textAlign: align as 'left' | 'center' | 'right' } }
                              setEditingElement(updated)
                              updateElement(editingElement.id, { styles: { textAlign: align as 'left' | 'center' | 'right' } })
                            }}
                            className={cn(
                              "flex-1 py-2 px-3 rounded-lg text-sm capitalize transition",
                              editingElement.styles.textAlign === align ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                            )}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Padding</label>
                      <select
                        value={editingElement.styles.padding || '60px'}
                        onChange={(e) => {
                          const updated = { ...editingElement, styles: { ...editingElement.styles, padding: e.target.value } }
                          setEditingElement(updated)
                          updateElement(editingElement.id, { styles: { padding: e.target.value } })
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      >
                        <option value="20px">Small</option>
                        <option value="40px">Medium</option>
                        <option value="60px">Large</option>
                        <option value="80px">Extra Large</option>
                        <option value="100px">Huge</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Chat Sidebar - Vibe Coding Interface */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: 384, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 384, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "w-96 flex flex-col border-l",
                selectedAIProvider === 'claude' && "bg-gradient-to-b from-[#1a1a2e] to-[#16162a] border-orange-500/20",
                selectedAIProvider === 'openai' && "bg-gradient-to-b from-[#0a1628] to-[#0d1a2d] border-emerald-500/20",
                selectedAIProvider === 'gemini' && "bg-gradient-to-b from-[#1a1a2e] to-[#1e1e38] border-blue-500/20"
              )}
            >
              {/* AI Provider Selector Header */}
              <div className={cn(
                "p-3 border-b",
                selectedAIProvider === 'claude' && "border-orange-500/20",
                selectedAIProvider === 'openai' && "border-emerald-500/20",
                selectedAIProvider === 'gemini' && "border-blue-500/20"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Vibe with AI</span>
                  <button onClick={() => setShowChat(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* AI Provider Tabs */}
                <div className="flex gap-1 p-1 bg-black/20 rounded-xl">
                  {/* Claude */}
                  <button
                    onClick={() => setSelectedAIProvider('claude')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                      selectedAIProvider === 'claude'
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="text-base">🧠</span>
                    <span>Claude</span>
                  </button>
                  {/* OpenAI */}
                  <button
                    onClick={() => setSelectedAIProvider('openai')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                      selectedAIProvider === 'openai'
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="text-base">🤖</span>
                    <span>GPT-4</span>
                  </button>
                  {/* Gemini */}
                  <button
                    onClick={() => setSelectedAIProvider('gemini')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                      selectedAIProvider === 'gemini'
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="text-base">✨</span>
                    <span>Gemini</span>
                  </button>
                </div>
              </div>

              {/* AI Branding Header */}
              <div className={cn(
                "px-4 py-3 border-b flex items-center gap-3",
                selectedAIProvider === 'claude' && "border-orange-500/10 bg-orange-500/5",
                selectedAIProvider === 'openai' && "border-emerald-500/10 bg-emerald-500/5",
                selectedAIProvider === 'gemini' && "border-blue-500/10 bg-blue-500/5"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-lg",
                  selectedAIProvider === 'claude' && "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20",
                  selectedAIProvider === 'openai' && "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20",
                  selectedAIProvider === 'gemini' && "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20"
                )}>
                  {selectedAIProvider === 'claude' && '🧠'}
                  {selectedAIProvider === 'openai' && '🤖'}
                  {selectedAIProvider === 'gemini' && '✨'}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    {selectedAIProvider === 'claude' && 'Claude Code'}
                    {selectedAIProvider === 'openai' && 'GPT-4o'}
                    {selectedAIProvider === 'gemini' && 'Gemini Pro'}
                  </h3>
                  <p className={cn(
                    "text-[10px] font-mono",
                    selectedAIProvider === 'claude' && "text-orange-400/70",
                    selectedAIProvider === 'openai' && "text-emerald-400/70",
                    selectedAIProvider === 'gemini' && "text-blue-400/70"
                  )}>
                    {selectedAIProvider === 'claude' && 'claude-3-5-sonnet'}
                    {selectedAIProvider === 'openai' && 'gpt-4o-latest'}
                    {selectedAIProvider === 'gemini' && 'gemini-pro'}
                  </p>
                </div>
              </div>

              {/* Terminal-Style Status Bar */}
              <div className={cn(
                "px-4 py-2 border-b flex items-center gap-2 text-[10px] font-mono",
                selectedAIProvider === 'claude' && "border-orange-500/10 bg-black/20 text-orange-400/60",
                selectedAIProvider === 'openai' && "border-emerald-500/10 bg-black/20 text-emerald-400/60",
                selectedAIProvider === 'gemini' && "border-blue-500/10 bg-black/20 text-blue-400/60"
              )}>
                <Terminal className="w-3 h-3" />
                <span>~/projects/{projectName.toLowerCase().replace(/\s+/g, '-')}</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    selectedAIProvider === 'claude' && "bg-orange-400",
                    selectedAIProvider === 'openai' && "bg-emerald-400",
                    selectedAIProvider === 'gemini' && "bg-blue-400"
                  )} />
                  connected
                </span>
              </div>

              {/* Chat Area */}
              <BuilderChat
                files={[{ path: 'index.html', content: generatePreviewHTML() }]}
                projectName={projectName}
                onApplyChanges={(changes) => console.log('Apply changes:', changes)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Asset Panel */}
      <AssetPanel
        isOpen={showAssetPanel}
        onClose={() => { setShowAssetPanel(false); setActiveImageField(null) }}
        onSelectAsset={handleAssetSelect}
      />

      {/* Deployment Panel */}
      {showDeployPanel && (
        <DeploymentPanel
          projectId={params.id}
          projectName={projectName}
          files={[{ path: 'index.html', content: generatePreviewHTML() }]}
          onClose={() => setShowDeployPanel(false)}
        />
      )}

      {/* App Integrations Panel */}
      <AppIntegrationsPanel
        isOpen={showAppIntegrations}
        onClose={() => setShowAppIntegrations(false)}
        onIntegrationSelect={(integration) => {
          console.log('Connected:', integration.name)
        }}
      />

      {/* Media Creator Panel */}
      <MediaCreator
        isOpen={showMediaCreator}
        onClose={() => setShowMediaCreator(false)}
        onCreateMedia={(media) => {
          console.log('Media created:', media.type)
        }}
      />

      {/* Page Settings Panel */}
      <PageSettingsPanel
        isOpen={showPageSettings}
        onClose={() => setShowPageSettings(false)}
        settings={pageSettings}
        onSave={(settings) => {
          setPageSettings(settings)
          if (settings.title !== projectName) {
            setProjectName(settings.title)
          }
        }}
      />

      {/* AI Generation Overlay */}
      <AnimatePresence>
        {showGeneratedPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950"
          >
            {/* Header */}
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-white">AI Generation</span>
                </div>
                {isGenerating && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    <span className="text-sm text-purple-300">{generatingMessage}</span>
                  </div>
                )}
                {!isGenerating && generatedHtml && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-sm text-emerald-300">Complete</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isGenerating && generatedHtml && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Parse HTML to elements or use raw HTML mode
                        setShowGeneratedPreview(false)
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      Use Template Mode
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Keep the generated HTML and close overlay
                        setShowGeneratedPreview(false)
                      }}
                      className="bg-purple-600 hover:bg-purple-500"
                    >
                      Continue Editing
                    </Button>
                  </>
                )}
                {isGenerating && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Properly abort the fetch request
                      if (abortControllerRef.current) {
                        abortControllerRef.current.abort()
                      }
                      setShowGeneratedPreview(false)
                      setIsGenerating(false)
                      setGeneratingPhase('')
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="h-[calc(100vh-3.5rem)] flex bg-slate-950">
              {/* Phase Progress Sidebar */}
              {isGenerating && !generatedHtml && (
                <div className="w-72 bg-slate-900 border-r border-slate-800 p-6">
                  <h3 className="text-sm font-medium text-slate-400 mb-6">Generation Progress</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'analyzing', label: 'Analyzing', icon: '🔍' },
                      { id: 'designing', label: 'Designing', icon: '✏️' },
                      { id: 'building', label: 'Building', icon: '🏗️' },
                      { id: 'styling', label: 'Styling', icon: '🎨' },
                      { id: 'images', label: 'Images', icon: '🖼️' },
                    ].map((phase) => {
                      const phases = ['analyzing', 'designing', 'building', 'styling', 'images']
                      const currentIndex = phases.indexOf(generatingPhase)
                      const phaseIndex = phases.indexOf(phase.id)
                      const isActive = phase.id === generatingPhase
                      const isComplete = phaseIndex < currentIndex
                      const isPending = phaseIndex > currentIndex

                      return (
                        <div
                          key={phase.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isActive ? 'bg-purple-500/20' : isComplete ? 'bg-emerald-500/10' : 'bg-slate-800/50'
                          } ${isPending ? 'opacity-50' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                            isActive ? 'bg-purple-500/30' : isComplete ? 'bg-emerald-500/20' : 'bg-slate-700'
                          }`}>
                            {isComplete ? '✓' : phase.icon}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isActive ? 'text-purple-300' : isComplete ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              {phase.label}
                            </p>
                            {isActive && (
                              <p className="text-xs text-slate-500 mt-0.5">{generatingMessage}</p>
                            )}
                          </div>
                          {isActive && (
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Main Preview Area */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div
                  className="bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300"
                  style={{ width: '100%', maxWidth: '1200px', height: '85vh' }}
                >
                  {generatedHtml ? (
                    <iframe
                      srcDoc={generatedHtml}
                      className="w-full h-full border-0"
                      title="AI Generated Preview"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <div className="text-center max-w-md px-8">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                          Creating your website
                        </h3>
                        <p className="text-slate-600 mb-6">
                          AI is designing a custom website based on your description. This usually takes 10-30 seconds.
                        </p>
                        <div className="flex justify-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
