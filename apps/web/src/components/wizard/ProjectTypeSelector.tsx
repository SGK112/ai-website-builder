'use client'

import { Briefcase, ShoppingCart, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProjectType = 'business-portfolio' | 'ecommerce' | 'saas'

interface ProjectTypeSelectorProps {
  selected?: ProjectType
  onSelect: (type: ProjectType) => void
}

const PROJECT_TYPES = [
  {
    id: 'business-portfolio' as const,
    title: 'Business & Portfolio',
    description: 'Professional websites for businesses, agencies, and personal portfolios',
    icon: Briefcase,
    features: ['Landing pages', 'Contact forms', 'Gallery sections', 'About pages'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'ecommerce' as const,
    title: 'E-commerce Store',
    description: 'Full-featured online stores with payment processing',
    icon: ShoppingCart,
    features: ['Product catalog', 'Shopping cart', 'Stripe payments', 'Order management'],
    gradient: 'from-purple-500 to-pink-500',
    popular: true,
  },
  {
    id: 'saas' as const,
    title: 'SaaS Application',
    description: 'Complete web applications with user management',
    icon: Rocket,
    features: ['User authentication', 'Dashboard', 'API routes', 'Subscriptions'],
    gradient: 'from-orange-500 to-red-500',
  },
]

export function ProjectTypeSelector({ selected, onSelect }: ProjectTypeSelectorProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {PROJECT_TYPES.map((type) => {
        const Icon = type.icon
        const isSelected = selected === type.id

        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={cn(
              'relative flex flex-col p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg',
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            )}
          >
            {type.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                Most Popular
              </span>
            )}

            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br text-white mb-4',
                type.gradient
              )}
            >
              <Icon className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-semibold mb-2">{type.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{type.description}</p>

            <ul className="space-y-2 mt-auto">
              {type.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full mr-2 bg-gradient-to-r',
                      type.gradient
                    )}
                  />
                  {feature}
                </li>
              ))}
            </ul>

            {isSelected && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
