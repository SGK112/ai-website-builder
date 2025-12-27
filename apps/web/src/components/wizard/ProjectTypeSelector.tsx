'use client'

import { useState } from 'react'
import {
  Briefcase,
  ShoppingCart,
  Rocket,
  User,
  Smartphone,
  Palette,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ProjectType = 'portfolio' | 'business' | 'ecommerce' | 'saas' | 'app' | 'custom'

interface Template {
  id: string
  name: string
  preview: string
  description: string
}

interface ProjectTypeConfig {
  id: ProjectType
  title: string
  description: string
  icon: React.ElementType
  features: string[]
  gradient: string
  popular?: boolean
  templates: Template[]
}

interface ProjectTypeSelectorProps {
  selected?: ProjectType
  selectedTemplate?: string
  onSelect: (type: ProjectType, templateId?: string) => void
}

const PROJECT_TYPES: ProjectTypeConfig[] = [
  {
    id: 'portfolio',
    title: 'Portfolio',
    description: 'Showcase your work and personal brand',
    icon: User,
    features: ['Project gallery', 'About section', 'Skills display', 'Contact form', 'Resume download'],
    gradient: 'from-cyan-500 to-blue-500',
    templates: [
      { id: 'portfolio-minimal', name: 'Minimal', preview: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400', description: 'Clean, simple design' },
      { id: 'portfolio-creative', name: 'Creative', preview: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400', description: 'Bold, artistic layout' },
      { id: 'portfolio-developer', name: 'Developer', preview: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400', description: 'Tech-focused design' },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    description: 'Professional sites for companies and agencies',
    icon: Briefcase,
    features: ['Hero sections', 'Services showcase', 'Team page', 'Testimonials', 'Contact forms'],
    gradient: 'from-blue-500 to-indigo-500',
    templates: [
      { id: 'business-corporate', name: 'Corporate', preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', description: 'Professional corporate look' },
      { id: 'business-agency', name: 'Agency', preview: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400', description: 'Modern agency style' },
      { id: 'business-startup', name: 'Startup', preview: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400', description: 'Dynamic startup vibe' },
    ],
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    description: 'Online stores with payments',
    icon: ShoppingCart,
    features: ['Product catalog', 'Shopping cart', 'Stripe checkout', 'Order tracking', 'Inventory management'],
    gradient: 'from-purple-500 to-pink-500',
    popular: true,
    templates: [
      { id: 'ecommerce-fashion', name: 'Fashion', preview: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', description: 'Clothing & accessories' },
      { id: 'ecommerce-electronics', name: 'Electronics', preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', description: 'Tech products store' },
      { id: 'ecommerce-food', name: 'Food & Beverage', preview: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', description: 'Restaurant or food delivery' },
    ],
  },
  {
    id: 'saas',
    title: 'SaaS',
    description: 'Software as a Service platforms',
    icon: Rocket,
    features: ['User authentication', 'Dashboard', 'Subscription billing', 'API routes', 'Admin panel'],
    gradient: 'from-orange-500 to-red-500',
    templates: [
      { id: 'saas-analytics', name: 'Analytics', preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', description: 'Data & analytics platform' },
      { id: 'saas-productivity', name: 'Productivity', preview: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400', description: 'Task & project management' },
      { id: 'saas-crm', name: 'CRM', preview: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', description: 'Customer management' },
    ],
  },
  {
    id: 'app',
    title: 'Web App',
    description: 'Interactive web applications',
    icon: Smartphone,
    features: ['Mobile responsive', 'Offline support', 'Push notifications', 'Real-time updates', 'PWA ready'],
    gradient: 'from-green-500 to-emerald-500',
    templates: [
      { id: 'app-social', name: 'Social', preview: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400', description: 'Social networking app' },
      { id: 'app-marketplace', name: 'Marketplace', preview: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400', description: 'Buy & sell platform' },
      { id: 'app-booking', name: 'Booking', preview: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400', description: 'Reservation system' },
    ],
  },
  {
    id: 'custom',
    title: 'Custom',
    description: 'Start from scratch with AI assistance',
    icon: Palette,
    features: ['Blank canvas', 'AI-powered design', 'Full customization', 'Any industry', 'Unique layouts'],
    gradient: 'from-violet-500 to-purple-500',
    templates: [
      { id: 'custom-blank', name: 'Blank Canvas', preview: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400', description: 'Start completely fresh' },
      { id: 'custom-ai', name: 'AI Generated', preview: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400', description: 'Let AI design for you' },
    ],
  },
]

export function ProjectTypeSelector({ selected, selectedTemplate, onSelect }: ProjectTypeSelectorProps) {
  const [expandedType, setExpandedType] = useState<ProjectType | null>(null)

  const handleTypeClick = (typeId: ProjectType) => {
    if (expandedType === typeId) {
      // If clicking the same expanded card, collapse it
      setExpandedType(null)
    } else {
      // Expand this card
      setExpandedType(typeId)
      // Auto-select if not already selected
      if (selected !== typeId) {
        onSelect(typeId)
      }
    }
  }

  const handleTemplateSelect = (typeId: ProjectType, templateId: string) => {
    onSelect(typeId, templateId)
  }

  return (
    <div className="space-y-4">
      {PROJECT_TYPES.map((type) => {
        const Icon = type.icon
        const isSelected = selected === type.id
        const isExpanded = expandedType === type.id

        return (
          <div
            key={type.id}
            className={cn(
              'relative rounded-xl border-2 transition-all duration-300 overflow-hidden',
              isSelected
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50 hover:shadow-md',
              isExpanded ? 'ring-2 ring-primary/20' : ''
            )}
          >
            {/* Main Card Header */}
            <button
              onClick={() => handleTypeClick(type.id)}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              {/* Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shrink-0',
                  type.gradient
                )}
              >
                <Icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{type.title}</h3>
                  {type.popular && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{type.description}</p>
              </div>

              {/* Selection indicator & expand arrow */}
              <div className="flex items-center gap-2 shrink-0">
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  isExpanded ? 'bg-primary/10' : 'bg-muted'
                )}>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </button>

            {/* Expandable Content */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="px-4 pb-4 border-t border-border/50">
                {/* Features */}
                <div className="py-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Includes:</p>
                  <div className="flex flex-wrap gap-2">
                    {type.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-muted rounded-full"
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full bg-gradient-to-r',
                            type.gradient
                          )}
                        />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Template Selection */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Choose a template:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {type.templates.map((template) => {
                      const isTemplateSelected = selectedTemplate === template.id && isSelected

                      return (
                        <button
                          key={template.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTemplateSelect(type.id, template.id)
                          }}
                          className={cn(
                            'group relative rounded-lg overflow-hidden border-2 transition-all',
                            isTemplateSelected
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-transparent hover:border-primary/50'
                          )}
                        >
                          {/* Template Preview Image */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                            <img
                              src={template.preview}
                              alt={template.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                            {/* Selected checkmark */}
                            {isTemplateSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          {/* Template Info */}
                          <div className="p-2 bg-card">
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Quick Action Button */}
                {isSelected && selectedTemplate && (
                  <div className="pt-4 flex justify-end">
                    <Button size="sm" className={cn('bg-gradient-to-r text-white', type.gradient)}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Continue with {type.templates.find(t => t.id === selectedTemplate)?.name}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
