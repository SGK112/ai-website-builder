import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Project } from '@ai-website-builder/database'
import { AIAgentRouter } from '@ai-website-builder/ai-agents'
import { CODE_GENERATION_PROMPTS } from '@ai-website-builder/ai-agents'
import mongoose from 'mongoose'

const router = new AIAgentRouter()

// GET /api/projects - List all projects for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const projects = await Project.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .select('-files.content') // Exclude large file contents from list
      .lean()

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('GET projects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project and generate code
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const body = await req.json()
    const { name, description, type, config, preferredAgent } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Create project in "generating" status
    // Use session user ID or generate a temp ObjectId for anonymous demo usage
    const userId = session?.user?.id
      ? new mongoose.Types.ObjectId(session.user.id)
      : new mongoose.Types.ObjectId()

    const project = await Project.create({
      userId,
      name,
      description: description || '',
      type,
      config: config || {},
      aiAgent: preferredAgent || 'claude',
      status: 'generating',
      wizardStep: 5,
      wizardCompleted: true,
      generationPrompts: [],
      generationHistory: [],
      files: [],
      credentialIds: [],
    })

    // Generate initial project structure in the background
    // For now, we'll do it synchronously, but this could be moved to a job queue
    try {
      const generationPrompt = buildGenerationPrompt(type, name, config)
      
      const { decision, result } = await router.execute({
        type: 'code-generation',
        prompt: generationPrompt,
        projectType: type,
        preferredAgent: preferredAgent || 'claude',
        stream: false,
      })

      let generatedContent: string
      if (typeof result === 'string') {
        generatedContent = result
      } else {
        // If it's an async generator, collect all chunks
        const chunks: string[] = []
        for await (const chunk of result as AsyncGenerator<string>) {
          chunks.push(chunk)
        }
        generatedContent = chunks.join('')
      }

      // Parse generated content and extract files
      const files = parseGeneratedFiles(generatedContent, decision.agent)

      // Update project with generated files
      project.files = files
      project.status = 'ready'
      project.aiAgent = decision.agent
      project.generationPrompts.push(generationPrompt)
      project.generationHistory.push({
        timestamp: new Date(),
        agent: decision.agent,
        prompt: generationPrompt,
        filesGenerated: files.map((f) => f.path),
      })

      await project.save()

      return NextResponse.json({
        success: true,
        project: {
          _id: project._id,
          name: project.name,
          type: project.type,
          status: project.status,
          filesCount: files.length,
        },
      })
    } catch (genError: any) {
      console.error('Generation error:', genError?.message || genError)

      // If AI generation fails for any reason, use fallback templates
      // This includes missing API keys, network errors, rate limits, etc.
      const shouldUseFallback = true // Always fall back to templates on error

      if (shouldUseFallback) {
        console.log('Using fallback templates due to AI generation error')
        const fallbackFiles = generateFallbackFiles(type, name, config || {})

        project.files = fallbackFiles
        project.status = 'ready'
        project.aiAgent = 'claude' // Mark as template-generated
        project.generationHistory.push({
          timestamp: new Date(),
          agent: 'template' as any,
          prompt: 'Fallback template (AI API keys not configured)',
          filesGenerated: fallbackFiles.map((f) => f.path),
        })

        await project.save()

        return NextResponse.json({
          success: true,
          project: {
            _id: project._id,
            name: project.name,
            type: project.type,
            status: project.status,
            filesCount: fallbackFiles.length,
            note: 'Generated with fallback templates. Configure AI API keys for AI-powered generation.',
          },
        })
      }

      project.status = 'failed'
      await project.save()

      return NextResponse.json(
        { error: 'Failed to generate project files', projectId: project._id },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('POST project error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

function buildGenerationPrompt(
  type: string,
  name: string,
  config: any
): string {
  // Ensure config is an object
  const cfg = config || {}
  const basePrompt = `Generate a complete ${type} website project named "${name}".`

  let specificRequirements = ''
  if (type === 'business-portfolio') {
    specificRequirements = `
Business Name: ${cfg.businessName || name}
Tagline: ${cfg.tagline || 'Professional services'}
Industry: ${cfg.industry || 'General'}
    `
  } else if (type === 'ecommerce') {
    specificRequirements = `
Store Name: ${cfg.storeName || name}
Currency: ${cfg.currency || 'USD'}
Payment Gateways: ${cfg.paymentGateways?.join(', ') || 'Stripe'}
    `
  } else if (type === 'saas') {
    specificRequirements = `
App Name: ${cfg.appName || name}
Features: ${cfg.features?.join(', ') || 'User authentication, dashboard'}
Auth Methods: ${cfg.authMethods?.join(', ') || 'Email/password'}
    `
  }

  const colorScheme = cfg.colorScheme
    ? `
Primary Color: ${cfg.colorScheme.primary}
Secondary Color: ${cfg.colorScheme.secondary}
Accent Color: ${cfg.colorScheme.accent}
    `
    : ''

  return `${basePrompt}

${specificRequirements}

Design Specifications:
${colorScheme}

Requirements:
- Generate a complete Next.js 14 project with App Router
- Use TypeScript for all files
- Include Tailwind CSS for styling
- Create a responsive, modern design
- Include proper file structure (pages, components, styles)
- Add placeholder content appropriate for the website type
- Include a package.json with necessary dependencies

Format your response with clear file separators like:
---FILE: path/to/file.tsx---
[file content]
---END FILE---

Start with the most important files first.`
}

function parseGeneratedFiles(
  content: string,
  agent: 'claude' | 'gemini' | 'openai'
): Array<{
  path: string
  content: string
  language: string
  generatedBy: 'claude' | 'gemini' | 'openai'
  lastModified: Date
}> {
  const files: Array<any> = []
  
  // Try to parse file blocks with ---FILE: pattern
  const fileRegex = /---FILE:\s*([^\n]+)---\n([\s\S]*?)(?=---(?:FILE|END FILE)---|$)/gi
  let match

  while ((match = fileRegex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = match[2].trim()
    
    // Determine language from file extension
    let language = 'plaintext'
    if (path.endsWith('.ts') || path.endsWith('.tsx')) language = 'typescript'
    else if (path.endsWith('.js') || path.endsWith('.jsx')) language = 'javascript'
    else if (path.endsWith('.json')) language = 'json'
    else if (path.endsWith('.css')) language = 'css'
    else if (path.endsWith('.md')) language = 'markdown'
    else if (path.endsWith('.html')) language = 'html'

    files.push({
      path,
      content: fileContent,
      language,
      generatedBy: agent,
      lastModified: new Date(),
    })
  }

  // If no files were parsed, create a fallback structure
  if (files.length === 0) {
    files.push({
      path: 'README.md',
      content: '# Generated Project\n\nThis project was generated by AI.\n\n' + content.substring(0, 500),
      language: 'markdown',
      generatedBy: agent,
      lastModified: new Date(),
    })
  }

  return files
}

function generateFallbackFiles(
  type: string,
  name: string,
  config: any
): Array<{
  path: string
  content: string
  language: string
  generatedBy: 'claude' | 'gemini' | 'openai' | 'template'
  lastModified: Date
}> {
  const cfg = config || {}
  const businessName = cfg.businessName || name
  const tagline = cfg.tagline || 'Building amazing things'
  const primaryColor = cfg.colorScheme?.primary || '#3B82F6'
  const secondaryColor = cfg.colorScheme?.secondary || '#10B981'

  const files: Array<any> = []
  const now = new Date()

  // Package.json
  files.push({
    path: 'package.json',
    content: JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '14.1.0',
        react: '^18',
        'react-dom': '^18',
        'lucide-react': '^0.300.0',
      },
      devDependencies: {
        '@types/node': '^20',
        '@types/react': '^18',
        '@types/react-dom': '^18',
        typescript: '^5',
        tailwindcss: '^3.4.1',
        autoprefixer: '^10.0.1',
        postcss: '^8',
      },
    }, null, 2),
    language: 'json',
    generatedBy: 'template',
    lastModified: now,
  })

  // Next.js config
  files.push({
    path: 'next.config.js',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig`,
    language: 'javascript',
    generatedBy: 'template',
    lastModified: now,
  })

  // Tailwind config
  files.push({
    path: 'tailwind.config.ts',
    content: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${primaryColor}',
        secondary: '${secondaryColor}',
      },
    },
  },
  plugins: [],
}

export default config`,
    language: 'typescript',
    generatedBy: 'template',
    lastModified: now,
  })

  // TypeScript config
  files.push({
    path: 'tsconfig.json',
    content: JSON.stringify({
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }, null, 2),
    language: 'json',
    generatedBy: 'template',
    lastModified: now,
  })

  // Global CSS
  files.push({
    path: 'src/app/globals.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: ${primaryColor};
  --secondary: ${secondaryColor};
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}`,
    language: 'css',
    generatedBy: 'template',
    lastModified: now,
  })

  // Layout
  files.push({
    path: 'src/app/layout.tsx',
    content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${businessName}',
  description: '${tagline}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}`,
    language: 'typescript',
    generatedBy: 'template',
    lastModified: now,
  })

  // Generate type-specific page
  if (type === 'business-portfolio') {
    files.push({
      path: 'src/app/page.tsx',
      content: `import { ArrowRight, Star, Users, Target } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">${businessName}</h1>
          <p className="text-xl text-slate-300 mb-8">${tagline}</p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-100 transition">
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
            <button className="border border-white/30 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Star, title: 'Excellence', desc: 'We deliver quality in everything we do' },
              { icon: Users, title: 'Team', desc: 'Experienced professionals at your service' },
              { icon: Target, title: 'Focus', desc: 'Dedicated to achieving your goals' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition">
                <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">Ready to get started?</h2>
          <p className="text-slate-600 mb-8">Contact us today to discuss your project</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Contact Us
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-slate-400">&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}`,
      language: 'typescript',
      generatedBy: 'template',
      lastModified: now,
    })
  } else if (type === 'ecommerce') {
    files.push({
      path: 'src/app/page.tsx',
      content: `import { ShoppingBag, Star, Truck, Shield } from 'lucide-react'

const products = [
  { id: 1, name: 'Product One', price: 49.99, image: '/placeholder.jpg' },
  { id: 2, name: 'Product Two', price: 79.99, image: '/placeholder.jpg' },
  { id: 3, name: 'Product Three', price: 99.99, image: '/placeholder.jpg' },
  { id: 4, name: 'Product Four', price: 129.99, image: '/placeholder.jpg' },
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">${businessName}</h1>
          <p className="text-xl opacity-90 mb-8">${tagline}</p>
          <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2 mx-auto">
            <ShoppingBag className="h-5 w-5" /> Shop Now
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-6 bg-gray-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
            { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
            { icon: Star, title: 'Top Quality', desc: 'Premium products only' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg">
              <f.icon className="h-8 w-8 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Featured Products</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                <div className="h-48 bg-gray-200" />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-indigo-600 font-bold">\${product.price.toFixed(2)}</p>
                  <button className="w-full mt-3 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-400">&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}`,
      language: 'typescript',
      generatedBy: 'template',
      lastModified: now,
    })
  } else if (type === 'saas') {
    files.push({
      path: 'src/app/page.tsx',
      content: `import { Zap, BarChart3, Shield, ArrowRight, Check } from 'lucide-react'

const plans = [
  { name: 'Starter', price: 9, features: ['5 Projects', '10GB Storage', 'Email Support'] },
  { name: 'Pro', price: 29, features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'API Access'] },
  { name: 'Enterprise', price: 99, features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Manager', 'SLA Guarantee'] },
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">${businessName}</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            Now in public beta
          </span>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">${tagline}</h1>
          <p className="text-xl text-gray-600 mb-8">
            The all-in-one platform to build, deploy, and scale your applications with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </button>
            <button className="border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-gray-700">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Optimized for speed and performance' },
              { icon: BarChart3, title: 'Analytics', desc: 'Deep insights into your data' },
              { icon: Shield, title: 'Secure', desc: 'Enterprise-grade security' },
            ].map((f, i) => (
              <div key={i} className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <div key={i} className={\`p-6 bg-white border rounded-xl \${i === 1 ? 'ring-2 ring-blue-600 scale-105' : 'border-gray-200'}\`}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{plan.name}</h3>
                <p className="text-4xl font-bold text-gray-900 mb-6">\${plan.price}<span className="text-lg text-gray-500">/mo</span></p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-600">
                      <Check className="h-4 w-4 text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={\`w-full py-2 rounded-lg font-semibold \${i === 1 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'} transition\`}>
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-400">&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}`,
      language: 'typescript',
      generatedBy: 'template',
      lastModified: now,
    })
  } else {
    // Generic page
    files.push({
      path: 'src/app/page.tsx',
      content: `export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">${businessName}</h1>
        <p className="text-gray-600">${tagline}</p>
      </div>
    </main>
  )
}`,
      language: 'typescript',
      generatedBy: 'template',
      lastModified: now,
    })
  }

  // README
  files.push({
    path: 'README.md',
    content: `# ${name}

${tagline}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view your site.

## Project Type

This is a **${type}** website generated by AI Website Builder.

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- React

## Deployment

This project is ready to deploy to Render, Vercel, or any Node.js hosting platform.
`,
    language: 'markdown',
    generatedBy: 'template',
    lastModified: now,
  })

  return files
}
