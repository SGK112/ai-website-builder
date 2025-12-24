'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  Loader2,
  CheckCircle,
  Zap,
  Shield,
  Globe,
  Code2,
  Layers,
  Rocket,
  ArrowRight,
  Github,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ProjectType = 'business-portfolio' | 'ecommerce' | 'saas'
type GenerationStatus = 'idle' | 'generating' | 'error'

const stats = [
  { value: '10K+', label: 'Websites Built' },
  { value: '60s', label: 'Avg Build Time' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'User Rating' },
]

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Describe your idea and watch as Claude, Gemini, or GPT creates production-ready code.',
  },
  {
    icon: Code2,
    title: 'Clean, Exportable Code',
    description: 'Get TypeScript, React, and Tailwind CSS code you can understand, modify, and own.',
  },
  {
    icon: Layers,
    title: 'Visual Builder',
    description: 'Edit components visually with live preview. No coding required for customizations.',
  },
  {
    icon: Rocket,
    title: 'One-Click Deploy',
    description: 'Deploy to GitHub and Render instantly. Your site goes live in seconds.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your data stays private. No AI training on your code. SOC 2 compliant.',
  },
  {
    icon: Globe,
    title: 'Full-Stack Ready',
    description: 'Backend APIs, database models, and authentication included out of the box.',
  },
]

const projectTypes = [
  {
    type: 'business-portfolio' as ProjectType,
    title: 'Portfolio',
    description: 'Professional sites for agencies, freelancers, and creatives',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'ecommerce' as ProjectType,
    title: 'E-Commerce',
    description: 'Online stores with cart, checkout, and payment integration',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    type: 'saas' as ProjectType,
    title: 'SaaS App',
    description: 'Full-featured applications with auth, dashboards, and APIs',
    gradient: 'from-orange-500 to-red-500',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [projectType, setProjectType] = useState<ProjectType>('business-portfolio')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!projectName) {
      setError('Project name is required')
      return
    }

    setStatus('generating')
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description,
          type: projectType,
          config: {
            colorScheme: {
              primary: '#3b82f6',
              secondary: '#64748b',
              accent: '#f59e0b',
            },
          },
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()

      // Redirect directly to builder
      router.push(`/builder/${data.project._id}`)
    } catch (err) {
      setError('Failed to generate project. Please make sure your API keys are configured.')
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold">AI Builder</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-slate-400 transition hover:text-white">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-slate-400 transition hover:text-white">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm text-slate-400 transition hover:text-white">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-slate-300">Now with Claude Sonnet 3.5 support</span>
            </div>

            {/* Main heading */}
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Build Production Apps
              <span className="mt-2 block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Without Writing Code
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
              Describe your website in plain English. Our AI agents generate clean,
              production-ready Next.js code you can deploy instantly.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="h-12 gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 px-8 text-base font-medium hover:from-blue-600 hover:to-cyan-600"
                onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Sparkles className="h-4 w-4" />
                Start Building Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 border-white/20 bg-white/5 px-8 text-base font-medium text-white hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to ship fast
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              From idea to production in minutes, not weeks
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border-white/5 bg-white/5 backdrop-blur transition hover:border-white/10 hover:bg-white/10"
              >
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <feature.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator" className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-xl sm:p-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">AI-Powered Builder</span>
              </div>
              <h2 className="mt-4 text-3xl font-bold">Create Your Website</h2>
              <p className="mt-2 text-slate-400">
                Choose a template, describe your project, and let AI do the rest
              </p>
            </div>

            {/* Project Type Selection */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {projectTypes.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setProjectType(option.type)}
                  className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                    projectType === option.type
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 transition group-hover:opacity-5 ${
                      projectType === option.type ? 'opacity-10' : ''
                    }`}
                  />
                  <div className="relative">
                    <h3 className="text-lg font-semibold">{option.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{option.description}</p>
                  </div>
                  {projectType === option.type && (
                    <div className="absolute right-4 top-4">
                      <CheckCircle className="h-5 w-5 text-blue-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-slate-300">
                  Project Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Inc"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-slate-300">
                  Description (optional)
                </Label>
                <Input
                  id="description"
                  placeholder="A modern consulting agency..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={status === 'generating'}
              className="mt-8 h-14 w-full gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-base font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
            >
              {status === 'generating' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating your project...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Website
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to build your next project?
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Join thousands of developers and creators shipping faster with AI
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="h-12 gap-2 bg-white px-8 text-slate-900 hover:bg-slate-100">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://github.com/SGK112/ai-website-builder"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10"
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">AI Website Builder</span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} AI Website Builder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
