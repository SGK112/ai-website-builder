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
  // Construction & Home Services Templates
  {
    id: 'construction-company',
    name: 'Construction Company',
    category: 'business-portfolio',
    description: 'Building and renovation services',
    features: ['Project showcase', 'Services list', 'Quote request', 'Testimonials'],
    colorScheme: { primary: '#f97316', secondary: '#ea580c', accent: '#fbbf24' },
    icon: Building2,
    preview: {
      heroText: 'Building Your Dreams',
      sections: ['Projects', 'Services', 'Get Quote', 'About Us'],
    },
  },
  {
    id: 'home-renovation',
    name: 'Home Renovation',
    category: 'business-portfolio',
    description: 'Kitchen, bath, and home remodeling',
    features: ['Before/after gallery', 'Service areas', 'Free estimates', 'Portfolio'],
    colorScheme: { primary: '#84cc16', secondary: '#65a30d', accent: '#f59e0b' },
    icon: Building2,
    preview: {
      heroText: 'Transform Your Space',
      sections: ['Gallery', 'Services', 'Estimate', 'Reviews'],
    },
  },
  // Automotive Templates
  {
    id: 'auto-dealership',
    name: 'Auto Dealership',
    category: 'ecommerce',
    description: 'Car sales and inventory',
    features: ['Vehicle inventory', 'Finance calculator', 'Trade-in form', 'Specials'],
    colorScheme: { primary: '#1e40af', secondary: '#1d4ed8', accent: '#ef4444' },
    icon: Truck,
    preview: {
      heroText: 'Find Your Perfect Ride',
      sections: ['Inventory', 'Finance', 'Trade-In', 'Contact'],
    },
  },
  {
    id: 'auto-repair',
    name: 'Auto Repair Shop',
    category: 'business-portfolio',
    description: 'Mechanic and auto service',
    features: ['Service menu', 'Online booking', 'Specials', 'Reviews'],
    colorScheme: { primary: '#dc2626', secondary: '#b91c1c', accent: '#fbbf24' },
    icon: Building2,
    preview: {
      heroText: 'Expert Auto Care',
      sections: ['Services', 'Book Now', 'Specials', 'About'],
    },
  },
  // Wellness & Beauty Templates
  {
    id: 'spa-wellness',
    name: 'Spa & Wellness',
    category: 'business-portfolio',
    description: 'Relaxation and self-care services',
    features: ['Treatment menu', 'Online booking', 'Gift cards', 'Packages'],
    colorScheme: { primary: '#ec4899', secondary: '#db2777', accent: '#f0abfc' },
    icon: Stethoscope,
    preview: {
      heroText: 'Relax & Rejuvenate',
      sections: ['Treatments', 'Book', 'Gift Cards', 'About'],
    },
  },
  {
    id: 'hair-salon',
    name: 'Hair Salon',
    category: 'business-portfolio',
    description: 'Hair styling and beauty services',
    features: ['Service menu', 'Stylist profiles', 'Online booking', 'Gallery'],
    colorScheme: { primary: '#a855f7', secondary: '#9333ea', accent: '#fbbf24' },
    icon: Shirt,
    preview: {
      heroText: 'Your Best Look Awaits',
      sections: ['Services', 'Stylists', 'Book', 'Gallery'],
    },
  },
  // Nonprofit & Community Templates
  {
    id: 'nonprofit-charity',
    name: 'Nonprofit Organization',
    category: 'business-portfolio',
    description: 'Charity and fundraising',
    features: ['Donation form', 'Impact stories', 'Volunteer signup', 'Events'],
    colorScheme: { primary: '#10b981', secondary: '#059669', accent: '#f59e0b' },
    icon: Users,
    preview: {
      heroText: 'Make a Difference',
      sections: ['Donate', 'Our Impact', 'Volunteer', 'Events'],
    },
  },
  {
    id: 'church-ministry',
    name: 'Church & Ministry',
    category: 'business-portfolio',
    description: 'Religious organization website',
    features: ['Service times', 'Sermon archive', 'Events calendar', 'Give online'],
    colorScheme: { primary: '#6366f1', secondary: '#4f46e5', accent: '#fcd34d' },
    icon: Building2,
    preview: {
      heroText: 'Welcome Home',
      sections: ['Services', 'Sermons', 'Events', 'Give'],
    },
  },
  // Event & Entertainment Templates
  {
    id: 'event-venue',
    name: 'Event Venue',
    category: 'business-portfolio',
    description: 'Wedding and event space',
    features: ['Virtual tour', 'Availability calendar', 'Package pricing', 'Gallery'],
    colorScheme: { primary: '#d946ef', secondary: '#c026d3', accent: '#fbbf24' },
    icon: Calendar,
    preview: {
      heroText: 'Your Perfect Venue',
      sections: ['Spaces', 'Packages', 'Gallery', 'Book Tour'],
    },
  },
  {
    id: 'wedding-planner',
    name: 'Wedding Planner',
    category: 'business-portfolio',
    description: 'Wedding planning services',
    features: ['Service packages', 'Real weddings gallery', 'Vendor list', 'Contact'],
    colorScheme: { primary: '#f43f5e', secondary: '#e11d48', accent: '#fcd34d' },
    icon: Calendar,
    preview: {
      heroText: 'Dream Weddings',
      sections: ['Services', 'Gallery', 'Vendors', 'Inquire'],
    },
  },
  // Fitness & Sports Templates
  {
    id: 'fitness-gym',
    name: 'Fitness Gym',
    category: 'business-portfolio',
    description: 'Gym and fitness center',
    features: ['Class schedule', 'Membership plans', 'Trainer profiles', 'Virtual tour'],
    colorScheme: { primary: '#ef4444', secondary: '#dc2626', accent: '#22c55e' },
    icon: Briefcase,
    preview: {
      heroText: 'Transform Your Body',
      sections: ['Classes', 'Join', 'Trainers', 'Tour'],
    },
  },
  {
    id: 'yoga-studio',
    name: 'Yoga Studio',
    category: 'business-portfolio',
    description: 'Yoga and meditation center',
    features: ['Class schedule', 'Instructor bios', 'Online booking', 'Workshops'],
    colorScheme: { primary: '#14b8a6', secondary: '#0d9488', accent: '#fcd34d' },
    icon: Stethoscope,
    preview: {
      heroText: 'Find Your Balance',
      sections: ['Classes', 'Teachers', 'Book', 'Workshops'],
    },
  },
  // Professional Services Templates
  {
    id: 'accounting-firm',
    name: 'Accounting Firm',
    category: 'business-portfolio',
    description: 'CPA and tax services',
    features: ['Service list', 'Team profiles', 'Client portal', 'Resources'],
    colorScheme: { primary: '#0369a1', secondary: '#0284c7', accent: '#22c55e' },
    icon: BarChart3,
    preview: {
      heroText: 'Financial Peace of Mind',
      sections: ['Services', 'Team', 'Portal', 'Contact'],
    },
  },
  {
    id: 'consulting-agency',
    name: 'Consulting Agency',
    category: 'business-portfolio',
    description: 'Business consulting services',
    features: ['Case studies', 'Service areas', 'Team', 'Insights blog'],
    colorScheme: { primary: '#1e3a8a', secondary: '#1e40af', accent: '#f59e0b' },
    icon: Briefcase,
    preview: {
      heroText: 'Strategic Growth Partners',
      sections: ['Case Studies', 'Services', 'Team', 'Insights'],
    },
  },
  // Pet Services Templates
  {
    id: 'pet-grooming',
    name: 'Pet Grooming',
    category: 'business-portfolio',
    description: 'Pet grooming and care',
    features: ['Service menu', 'Online booking', 'Pet gallery', 'Loyalty program'],
    colorScheme: { primary: '#f97316', secondary: '#ea580c', accent: '#84cc16' },
    icon: Briefcase,
    preview: {
      heroText: 'Pamper Your Pet',
      sections: ['Services', 'Book', 'Gallery', 'Rewards'],
    },
  },
  {
    id: 'veterinary-clinic',
    name: 'Veterinary Clinic',
    category: 'business-portfolio',
    description: 'Animal hospital and care',
    features: ['Services', 'Emergency info', 'Pet portal', 'Team profiles'],
    colorScheme: { primary: '#059669', secondary: '#047857', accent: '#3b82f6' },
    icon: Stethoscope,
    preview: {
      heroText: 'Compassionate Pet Care',
      sections: ['Services', 'Emergency', 'Portal', 'Team'],
    },
  },
  // E-commerce Specialty Templates
  {
    id: 'jewelry-store',
    name: 'Jewelry Store',
    category: 'ecommerce',
    description: 'Fine jewelry and accessories',
    features: ['Product catalog', 'Custom orders', 'Gift registry', 'Care guide'],
    colorScheme: { primary: '#1c1917', secondary: '#292524', accent: '#d4af37' },
    icon: ShoppingBag,
    preview: {
      heroText: 'Timeless Elegance',
      sections: ['Shop', 'Custom', 'Registry', 'Care'],
    },
  },
  {
    id: 'organic-market',
    name: 'Organic Market',
    category: 'ecommerce',
    description: 'Organic food and wellness products',
    features: ['Product categories', 'Subscription boxes', 'Local delivery', 'Blog'],
    colorScheme: { primary: '#15803d', secondary: '#166534', accent: '#fbbf24' },
    icon: ShoppingBag,
    preview: {
      heroText: 'Fresh & Organic',
      sections: ['Shop', 'Subscribe', 'Delivery', 'Blog'],
    },
  },
  // Technology & SaaS Templates
  {
    id: 'ai-startup',
    name: 'AI Startup',
    category: 'saas',
    description: 'AI-powered product landing',
    features: ['Demo video', 'Feature highlights', 'API docs', 'Pricing'],
    colorScheme: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#06b6d4' },
    icon: Laptop,
    preview: {
      heroText: 'AI That Works',
      sections: ['Demo', 'Features', 'API', 'Pricing'],
    },
  },
  {
    id: 'developer-tools',
    name: 'Developer Tools',
    category: 'saas',
    description: 'Developer productivity platform',
    features: ['Documentation', 'GitHub integration', 'Changelog', 'Community'],
    colorScheme: { primary: '#0f172a', secondary: '#1e293b', accent: '#22d3ee' },
    icon: Laptop,
    preview: {
      heroText: 'Build Faster',
      sections: ['Docs', 'Integrations', 'Changelog', 'Community'],
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
