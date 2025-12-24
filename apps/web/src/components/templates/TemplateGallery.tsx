'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Sparkles,
  Building2,
  ShoppingBag,
  Laptop,
  ChevronLeft,
  ChevronRight,
  Eye,
  Briefcase,
  Scale,
  Stethoscope,
  UtensilsCrossed,
  Shirt,
  MonitorSmartphone,
  Truck,
  Gift,
  FileDown,
  BarChart3,
  Kanban,
  Users,
  Calendar,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  category: 'business-portfolio' | 'ecommerce' | 'saas'
  description: string
  features: string[]
  colorScheme: {
    primary: string
    secondary: string
    accent: string
  }
  icon: React.ElementType
  preview: {
    heroText: string
    sections: string[]
  }
}

const templates: Template[] = [
  // Business Portfolio Templates
  {
    id: 'agency-portfolio',
    name: 'Creative Agency',
    category: 'business-portfolio',
    description: 'Modern agency site with case studies and team showcase',
    features: ['Hero with video background', 'Case study grid', 'Team section', 'Client logos'],
    colorScheme: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b' },
    icon: Briefcase,
    preview: {
      heroText: 'We Create Digital Experiences',
      sections: ['Case Studies', 'Our Team', 'Services', 'Contact'],
    },
  },
  {
    id: 'freelancer-portfolio',
    name: 'Freelancer Portfolio',
    category: 'business-portfolio',
    description: 'Personal portfolio for designers and developers',
    features: ['About section', 'Skills display', 'Project gallery', 'Testimonials'],
    colorScheme: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#f97316' },
    icon: Building2,
    preview: {
      heroText: 'Hi, I\'m a Creative Developer',
      sections: ['About Me', 'My Work', 'Skills', 'Contact'],
    },
  },
  {
    id: 'law-firm',
    name: 'Law Firm',
    category: 'business-portfolio',
    description: 'Professional site for legal services',
    features: ['Practice areas', 'Attorney profiles', 'Case results', 'Consultation form'],
    colorScheme: { primary: '#1e3a5f', secondary: '#2d4a6f', accent: '#c9a227' },
    icon: Scale,
    preview: {
      heroText: 'Justice. Integrity. Results.',
      sections: ['Practice Areas', 'Our Attorneys', 'Results', 'Contact'],
    },
  },
  {
    id: 'medical-practice',
    name: 'Medical Practice',
    category: 'business-portfolio',
    description: 'Healthcare provider website',
    features: ['Services list', 'Doctor profiles', 'Patient resources', 'Appointment booking'],
    colorScheme: { primary: '#0891b2', secondary: '#0e7490', accent: '#10b981' },
    icon: Stethoscope,
    preview: {
      heroText: 'Your Health, Our Priority',
      sections: ['Services', 'Our Doctors', 'Patient Portal', 'Book Appointment'],
    },
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    category: 'business-portfolio',
    description: 'Restaurant with menu and reservations',
    features: ['Menu display', 'Photo gallery', 'Online reservations', 'Location & hours'],
    colorScheme: { primary: '#dc2626', secondary: '#991b1b', accent: '#fbbf24' },
    icon: UtensilsCrossed,
    preview: {
      heroText: 'Taste the Difference',
      sections: ['Menu', 'Gallery', 'Reservations', 'Contact'],
    },
  },
  // E-commerce Templates
  {
    id: 'fashion-store',
    name: 'Fashion Boutique',
    category: 'ecommerce',
    description: 'Clothing and accessories store',
    features: ['Product catalog', 'Size guide', 'Wishlist', 'Instagram feed'],
    colorScheme: { primary: '#0f0f0f', secondary: '#262626', accent: '#d4af37' },
    icon: Shirt,
    preview: {
      heroText: 'New Season Collection',
      sections: ['Shop Now', 'Categories', 'Featured', 'Sale'],
    },
  },
  {
    id: 'electronics-store',
    name: 'Electronics Store',
    category: 'ecommerce',
    description: 'Tech gadgets and electronics',
    features: ['Product comparison', 'Specifications', 'Customer reviews', 'Deals section'],
    colorScheme: { primary: '#1e40af', secondary: '#1e3a8a', accent: '#f59e0b' },
    icon: MonitorSmartphone,
    preview: {
      heroText: 'Latest Tech Deals',
      sections: ['Shop', 'Compare', 'Deals', 'Support'],
    },
  },
  {
    id: 'food-delivery',
    name: 'Food Delivery',
    category: 'ecommerce',
    description: 'Restaurant delivery platform',
    features: ['Menu categories', 'Cart system', 'Delivery tracking', 'Reviews'],
    colorScheme: { primary: '#ea580c', secondary: '#c2410c', accent: '#16a34a' },
    icon: Truck,
    preview: {
      heroText: 'Delicious Food Delivered',
      sections: ['Order Now', 'Restaurants', 'Track Order', 'Account'],
    },
  },
  {
    id: 'subscription-box',
    name: 'Subscription Box',
    category: 'ecommerce',
    description: 'Monthly subscription service',
    features: ['Subscription tiers', 'Past boxes gallery', 'Account management', 'Gift subscriptions'],
    colorScheme: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#f472b6' },
    icon: Gift,
    preview: {
      heroText: 'Discover Monthly Surprises',
      sections: ['Subscribe', 'Past Boxes', 'Gift', 'How It Works'],
    },
  },
  {
    id: 'digital-products',
    name: 'Digital Products',
    category: 'ecommerce',
    description: 'Digital downloads and courses',
    features: ['Product previews', 'Instant download', 'License management', 'Author profiles'],
    colorScheme: { primary: '#059669', secondary: '#047857', accent: '#3b82f6' },
    icon: FileDown,
    preview: {
      heroText: 'Premium Digital Resources',
      sections: ['Browse', 'Categories', 'Authors', 'My Downloads'],
    },
  },
  // SaaS Templates
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    category: 'saas',
    description: 'Data analytics and reporting platform',
    features: ['Dashboard widgets', 'Chart visualizations', 'Report builder', 'Team access'],
    colorScheme: { primary: '#3b82f6', secondary: '#2563eb', accent: '#10b981' },
    icon: BarChart3,
    preview: {
      heroText: 'Insights That Drive Growth',
      sections: ['Dashboard', 'Reports', 'Analytics', 'Settings'],
    },
  },
  {
    id: 'project-management',
    name: 'Project Management',
    category: 'saas',
    description: 'Team collaboration and task tracking',
    features: ['Kanban boards', 'Task lists', 'Team calendar', 'Time tracking'],
    colorScheme: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#f59e0b' },
    icon: Kanban,
    preview: {
      heroText: 'Manage Projects Smarter',
      sections: ['Boards', 'Timeline', 'Team', 'Reports'],
    },
  },
  {
    id: 'crm-platform',
    name: 'CRM Platform',
    category: 'saas',
    description: 'Customer relationship management',
    features: ['Contact management', 'Deal pipeline', 'Email integration', 'Reports'],
    colorScheme: { primary: '#0891b2', secondary: '#0e7490', accent: '#f97316' },
    icon: Users,
    preview: {
      heroText: 'Build Better Relationships',
      sections: ['Contacts', 'Pipeline', 'Activities', 'Reports'],
    },
  },
  {
    id: 'booking-system',
    name: 'Booking System',
    category: 'saas',
    description: 'Appointment and reservation platform',
    features: ['Calendar view', 'Booking widget', 'Payment processing', 'Email reminders'],
    colorScheme: { primary: '#16a34a', secondary: '#15803d', accent: '#6366f1' },
    icon: Calendar,
    preview: {
      heroText: 'Streamline Your Bookings',
      sections: ['Calendar', 'Bookings', 'Clients', 'Settings'],
    },
  },
  {
    id: 'learning-management',
    name: 'Learning Management',
    category: 'saas',
    description: 'Online course platform',
    features: ['Course builder', 'Video hosting', 'Quiz system', 'Certificates'],
    colorScheme: { primary: '#dc2626', secondary: '#b91c1c', accent: '#0ea5e9' },
    icon: GraduationCap,
    preview: {
      heroText: 'Learn Without Limits',
      sections: ['Courses', 'My Learning', 'Certificates', 'Community'],
    },
  },
]

const categoryIcons = {
  'business-portfolio': Building2,
  'ecommerce': ShoppingBag,
  'saas': Laptop,
}

const categoryLabels = {
  'business-portfolio': 'Portfolio',
  'ecommerce': 'E-Commerce',
  'saas': 'SaaS',
}

interface TemplateGalleryProps {
  onSelectTemplate?: (template: Template) => void
  selectedTemplateId?: string
}

export function TemplateGallery({ onSelectTemplate, selectedTemplateId }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | Template['category']>('all')
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  const categories = ['all', 'business-portfolio', 'ecommerce', 'saas'] as const

  const filteredTemplates = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => {
          const isActive = activeCategory === category
          const Icon = category === 'all' ? Sparkles : categoryIcons[category]
          const label = category === 'all' ? 'All Templates' : categoryLabels[category]

          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                isActive
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        })}
      </div>

      {/* Template Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id
          const isHovered = hoveredTemplate === template.id
          const Icon = template.icon

          return (
            <div
              key={template.id}
              className={cn(
                'group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer',
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-white/10 hover:border-white/20'
              )}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              onClick={() => onSelectTemplate?.(template)}
            >
              {/* Preview Window */}
              <div
                className="relative h-48 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${template.colorScheme.primary}20 0%, ${template.colorScheme.secondary}20 100%)`,
                }}
              >
                {/* Mock Browser Chrome */}
                <div className="absolute inset-x-0 top-0 h-6 bg-slate-800/80 backdrop-blur flex items-center px-2 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                  <div className="w-2 h-2 rounded-full bg-green-500/80" />
                  <div className="flex-1 mx-8 h-3 rounded bg-slate-700/50" />
                </div>

                {/* Mock Page Content */}
                <div className="pt-8 px-4 space-y-3">
                  {/* Mock Hero */}
                  <div
                    className="h-16 rounded-lg flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${template.colorScheme.primary} 0%, ${template.colorScheme.secondary} 100%)`,
                    }}
                  >
                    <p className="text-white text-xs font-medium text-center px-2 truncate">
                      {template.preview.heroText}
                    </p>
                  </div>

                  {/* Mock Navigation */}
                  <div className="flex gap-2 justify-center">
                    {template.preview.sections.slice(0, 4).map((section, idx) => (
                      <div
                        key={idx}
                        className="h-2 rounded-full bg-white/20"
                        style={{ width: `${20 + Math.random() * 20}%` }}
                      />
                    ))}
                  </div>

                  {/* Mock Content Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 rounded bg-white/10"
                      />
                    ))}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div
                  className={cn(
                    'absolute inset-0 bg-slate-900/80 flex items-center justify-center transition-opacity duration-300',
                    isHovered ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Eye className="w-8 h-8 text-white" />
                    <span className="text-white font-medium">View Template</span>
                  </div>
                </div>

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-8 right-2 bg-blue-500 text-white p-1 rounded-full">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="p-4 bg-white/5 backdrop-blur">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-xs text-slate-400">{categoryLabels[template.category]}</p>
                  </div>
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${template.colorScheme.primary}30 0%, ${template.colorScheme.secondary}30 100%)`,
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: template.colorScheme.primary }}
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-3">{template.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map((feature, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                      +{template.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { templates, type Template }
