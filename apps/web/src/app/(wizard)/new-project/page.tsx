'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Quick start templates for inspiration
const QUICK_TEMPLATES = [
  { id: 'saas', label: 'SaaS Landing', prompt: 'Build a modern SaaS landing page with hero, features section, pricing table with 3 tiers, testimonials, and footer', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'ecommerce', label: 'E-Commerce', prompt: 'Create an online fashion store with hero banner, product grid with 8 products, shopping cart, and newsletter signup', gradient: 'from-pink-500 to-rose-500' },
  { id: 'portfolio', label: 'Portfolio', prompt: 'Design a minimal portfolio for a photographer with hero, photo gallery grid, about section, and contact form', gradient: 'from-amber-500 to-orange-500' },
  { id: 'restaurant', label: 'Restaurant', prompt: 'Make an elegant restaurant website with hero image, menu with categories, reservation form, location map, and hours', gradient: 'from-green-500 to-emerald-500' },
  { id: 'agency', label: 'Agency', prompt: 'Build a creative agency website with bold hero, services grid, case studies, team section, and contact form', gradient: 'from-purple-500 to-pink-500' },
  { id: 'startup', label: 'Startup', prompt: 'Create a startup landing page with animated hero, problem/solution section, features, pricing, and waitlist form', gradient: 'from-indigo-500 to-blue-500' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  // Read saved prompt from session storage
  useEffect(() => {
    const savedPrompt = sessionStorage.getItem('ai-prompt')
    if (savedPrompt) {
      setPrompt(savedPrompt)
      sessionStorage.removeItem('ai-prompt')
      // Auto-generate if we have a saved prompt
      handleGenerate(savedPrompt)
    }
  }, [])

  const handleGenerate = async (promptText?: string) => {
    const finalPrompt = promptText || prompt
    if (!finalPrompt.trim()) return

    setIsGenerating(true)
    try {
      // Create project and go straight to builder
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalPrompt.slice(0, 50),
          description: finalPrompt,
          type: 'business-portfolio',
          config: {
            framework: 'nextjs',
            prompt: finalPrompt,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to create project')

      const data = await response.json()
      // Store prompt for the builder to use immediately
      sessionStorage.setItem('pending-prompt', finalPrompt)
      router.push(`/builder/${data.project._id}`)
    } catch (error) {
      console.error('Project creation error:', error)
      setIsGenerating(false)
      alert('Failed to create project. Please try again.')
    }
  }

  const handleTemplateClick = (template: typeof QUICK_TEMPLATES[0]) => {
    setPrompt(template.prompt)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-600/20 via-blue-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI Website Builder
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          {/* Headline */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              What do you want to build?
            </h1>
            <p className="text-xl text-slate-400">
              Describe your website and AI will create it instantly
            </p>
          </div>

          {/* Main Prompt Input */}
          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-50 blur group-hover:opacity-75 transition" />
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                    e.preventDefault()
                    handleGenerate()
                  }
                }}
                placeholder="A modern SaaS landing page for a project management tool with pricing, features, and testimonials..."
                className="w-full h-40 px-6 py-5 bg-[#0f0f15] border border-white/10 rounded-xl text-white text-lg placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => handleGenerate()}
            disabled={!prompt.trim() || isGenerating}
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Creating your website...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-3" />
                Generate Website
                <ArrowRight className="h-5 w-5 ml-3" />
              </>
            )}
          </Button>

          {/* Quick tip */}
          <p className="text-center text-sm text-slate-500 mt-4">
            Press Enter to generate. Be specific for better results.
          </p>

          {/* Templates Section - Collapsible */}
          <div className="mt-12">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-white transition"
            >
              <Layers className="w-4 h-4" />
              <span className="text-sm">Need inspiration? Try a template</span>
              {showTemplates ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showTemplates && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className={cn(
                      'p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition text-left group',
                      prompt === template.prompt && 'border-purple-500/50 bg-purple-500/10'
                    )}
                  >
                    <div className={cn('w-8 h-1 rounded-full bg-gradient-to-r mb-3', template.gradient)} />
                    <h3 className="font-medium text-white group-hover:text-white">{template.label}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.prompt.slice(0, 60)}...</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
