'use client'

import { useState } from 'react'
import {
  Layout,
  Type,
  Square,
  Columns,
  Table2,
  FormInput,
  Menu,
  ChevronDown,
  ChevronRight,
  Star,
  MessageSquare,
  Mail,
  CreditCard,
  Search,
  Bell,
  Grid3X3,
  Layers,
  Box,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComponentItem {
  id: string
  name: string
  icon: React.ElementType
  description: string
  code: string
}

interface ComponentCategory {
  id: string
  name: string
  icon: React.ElementType
  components: ComponentItem[]
}

const componentCategories: ComponentCategory[] = [
  {
    id: 'layout',
    name: 'Layout',
    icon: Layout,
    components: [
      {
        id: 'container',
        name: 'Container',
        icon: Box,
        description: 'Centered container with max-width',
        code: `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>`,
      },
      {
        id: 'section',
        name: 'Section',
        icon: Square,
        description: 'Full-width section with padding',
        code: `<section className="py-16 lg:py-24">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</section>`,
      },
      {
        id: 'grid',
        name: 'Grid',
        icon: Grid3X3,
        description: 'Responsive grid layout',
        code: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>`,
      },
      {
        id: 'columns',
        name: 'Columns',
        icon: Columns,
        description: 'Two-column layout',
        code: `<div className="flex flex-col lg:flex-row gap-8">
  <div className="flex-1">{/* Left */}</div>
  <div className="flex-1">{/* Right */}</div>
</div>`,
      },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: Menu,
    components: [
      {
        id: 'navbar',
        name: 'Navbar',
        icon: Menu,
        description: 'Responsive navigation bar',
        code: `<nav className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <span className="text-xl font-bold">Logo</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
        <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
        <a href="#" className="text-gray-600 hover:text-gray-900">Services</a>
        <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
      </div>
    </div>
  </div>
</nav>`,
      },
      {
        id: 'footer',
        name: 'Footer',
        icon: Layers,
        description: 'Site footer with links',
        code: `<footer className="bg-gray-900 text-white py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div>
        <h3 className="font-semibold mb-4">Company</h3>
        <ul className="space-y-2 text-gray-400">
          <li><a href="#">About</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>
    </div>
    <div className="mt-8 pt-8 border-t border-gray-800 text-gray-400 text-sm">
      © 2024 Company. All rights reserved.
    </div>
  </div>
</footer>`,
      },
    ],
  },
  {
    id: 'content',
    name: 'Content',
    icon: Type,
    components: [
      {
        id: 'hero',
        name: 'Hero Section',
        icon: Star,
        description: 'Hero section with CTA',
        code: `<section className="py-20 lg:py-32 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="text-4xl lg:text-6xl font-bold mb-6">
      Build Something Amazing
    </h1>
    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
      Create beautiful websites with our powerful platform.
    </p>
    <div className="flex gap-4 justify-center">
      <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50">
        Get Started
      </button>
      <button className="px-8 py-3 border border-white rounded-lg font-semibold hover:bg-white/10">
        Learn More
      </button>
    </div>
  </div>
</section>`,
      },
      {
        id: 'features',
        name: 'Features Grid',
        icon: Grid3X3,
        description: 'Feature cards in grid',
        code: `<section className="py-16 lg:py-24 bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Feature {i}</h3>
          <p className="text-gray-600">Description of this amazing feature.</p>
        </div>
      ))}
    </div>
  </div>
</section>`,
      },
      {
        id: 'testimonials',
        name: 'Testimonials',
        icon: MessageSquare,
        description: 'Customer testimonials',
        code: `<section className="py-16 lg:py-24">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl border">
          <div className="flex gap-1 text-yellow-400 mb-4">★★★★★</div>
          <p className="text-gray-600 mb-4">"Amazing product! Highly recommended."</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div>
              <p className="font-semibold">Customer Name</p>
              <p className="text-sm text-gray-500">Position</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>`,
      },
      {
        id: 'cta',
        name: 'Call to Action',
        icon: Bell,
        description: 'CTA section',
        code: `<section className="py-16 bg-blue-600 text-white">
  <div className="max-w-4xl mx-auto px-4 text-center">
    <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
    <p className="text-blue-100 mb-8">Join thousands of happy customers today.</p>
    <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50">
      Start Free Trial
    </button>
  </div>
</section>`,
      },
    ],
  },
  {
    id: 'forms',
    name: 'Forms',
    icon: FormInput,
    components: [
      {
        id: 'contact-form',
        name: 'Contact Form',
        icon: Mail,
        description: 'Contact form with fields',
        code: `<form className="space-y-6 max-w-lg mx-auto">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
    <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
    <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
    <textarea rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
  </div>
  <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
    Send Message
  </button>
</form>`,
      },
      {
        id: 'newsletter',
        name: 'Newsletter',
        icon: Mail,
        description: 'Email signup form',
        code: `<div className="bg-gray-100 py-12">
  <div className="max-w-xl mx-auto px-4 text-center">
    <h3 className="text-2xl font-bold mb-2">Subscribe to our newsletter</h3>
    <p className="text-gray-600 mb-6">Get the latest updates in your inbox.</p>
    <form className="flex gap-2">
      <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 border rounded-lg" />
      <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
        Subscribe
      </button>
    </form>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: CreditCard,
    components: [
      {
        id: 'product-card',
        name: 'Product Card',
        icon: Box,
        description: 'Product display card',
        code: `<div className="bg-white rounded-xl shadow-sm overflow-hidden group">
  <div className="aspect-square bg-gray-100 relative">
    <img src="/placeholder.jpg" alt="Product" className="w-full h-full object-cover" />
    <button className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
      Quick View
    </button>
  </div>
  <div className="p-4">
    <h3 className="font-semibold">Product Name</h3>
    <p className="text-gray-500 text-sm mb-2">Category</p>
    <div className="flex justify-between items-center">
      <span className="text-lg font-bold">$99.00</span>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
        Add to Cart
      </button>
    </div>
  </div>
</div>`,
      },
      {
        id: 'pricing',
        name: 'Pricing Table',
        icon: Table2,
        description: 'Pricing plans table',
        code: `<section className="py-16 lg:py-24">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl font-bold text-center mb-12">Pricing Plans</h2>
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {['Basic', 'Pro', 'Enterprise'].map((plan, i) => (
        <div key={plan} className={\`bg-white p-8 rounded-xl border-2 \${i === 1 ? 'border-blue-600 shadow-lg scale-105' : 'border-gray-200'}\`}>
          <h3 className="text-xl font-bold mb-2">{plan}</h3>
          <p className="text-gray-500 mb-4">Perfect for {plan.toLowerCase()} users</p>
          <p className="text-4xl font-bold mb-6">\${(i + 1) * 29}<span className="text-lg text-gray-500">/mo</span></p>
          <ul className="space-y-3 mb-8">
            {[1, 2, 3].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Feature {f}
              </li>
            ))}
          </ul>
          <button className={\`w-full py-3 rounded-lg font-semibold \${i === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}\`}>
            Get Started
          </button>
        </div>
      ))}
    </div>
  </div>
</section>`,
      },
    ],
  },
]

interface ComponentLibraryProps {
  onInsertComponent: (code: string) => void
}

export function ComponentLibrary({ onInsertComponent }: ComponentLibraryProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['layout', 'content'])
  const [searchQuery, setSearchQuery] = useState('')

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const filteredCategories = componentCategories
    .map((category) => ({
      ...category,
      components: category.components.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.components.length > 0)

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      <div className="p-3 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => (
          <div key={category.id} className="border-b border-slate-800">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-slate-300 hover:bg-slate-800"
            >
              {expandedCategories.includes(category.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <category.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{category.name}</span>
              <span className="ml-auto text-xs text-slate-500">
                {category.components.length}
              </span>
            </button>

            {expandedCategories.includes(category.id) && (
              <div className="pb-2">
                {category.components.map((component) => (
                  <button
                    key={component.id}
                    onClick={() => onInsertComponent(component.code)}
                    className="w-full flex items-start gap-2 px-3 py-2 ml-6 mr-2 text-left rounded-lg hover:bg-slate-800 group"
                  >
                    <component.icon className="w-4 h-4 mt-0.5 text-slate-500 group-hover:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 group-hover:text-white">
                        {component.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {component.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-700 bg-slate-900/50">
        <p className="text-xs text-slate-500 text-center">
          Click a component to add it
        </p>
      </div>
    </div>
  )
}
