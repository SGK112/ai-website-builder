'use client'

import { useState, useCallback } from 'react'
import {
  Download,
  FileCode,
  FolderArchive,
  FileJson,
  Globe,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  Settings,
  Package,
  Code,
  FileText,
  Minimize2,
  Maximize2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ProjectFile {
  path: string
  content: string
}

interface ExportPanelProps {
  projectName: string
  files: ProjectFile[]
  html: string
  onClose: () => void
  className?: string
}

type ExportFormat = 'html' | 'zip' | 'nextjs' | 'static' | 'json'

interface ExportOption {
  id: ExportFormat
  name: string
  description: string
  icon: typeof Download
  color: string
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'html',
    name: 'Single HTML',
    description: 'Self-contained HTML file with inline CSS',
    icon: FileCode,
    color: 'text-orange-400',
  },
  {
    id: 'zip',
    name: 'ZIP Archive',
    description: 'Complete project with all assets',
    icon: FolderArchive,
    color: 'text-blue-400',
  },
  {
    id: 'static',
    name: 'Static Site',
    description: 'Optimized for static hosting (Netlify, Vercel)',
    icon: Globe,
    color: 'text-green-400',
  },
  {
    id: 'nextjs',
    name: 'Next.js Project',
    description: 'Full Next.js 14 App Router setup',
    icon: Package,
    color: 'text-purple-400',
  },
  {
    id: 'json',
    name: 'JSON Export',
    description: 'Project configuration and content as JSON',
    icon: FileJson,
    color: 'text-yellow-400',
  },
]

export function ExportPanel({
  projectName,
  files,
  html,
  onClose,
  className,
}: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html')
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [includeAssets, setIncludeAssets] = useState(true)
  const [minify, setMinify] = useState(false)
  const [addMetaTags, setAddMetaTags] = useState(true)

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  const generateHTML = useCallback(() => {
    let content = html

    // Add meta tags if enabled
    if (addMetaTags) {
      const metaTags = `
  <meta name="generator" content="AI Website Builder">
  <meta name="author" content="${projectName}">
  <meta property="og:title" content="${projectName}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">`

      content = content.replace('</head>', `${metaTags}\n</head>`)
    }

    // Minify if enabled
    if (minify) {
      content = content
        .replace(/\n\s*/g, '')
        .replace(/>\s+</g, '><')
        .replace(/\s{2,}/g, ' ')
    }

    return content
  }, [html, projectName, addMetaTags, minify])

  const generateStaticSite = useCallback(() => {
    const slug = generateSlug(projectName)

    return {
      'index.html': generateHTML(),
      'styles.css': `/* ${projectName} Styles */\n@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');\n\n:root {\n  --primary: #8b5cf6;\n  --background: #ffffff;\n  --foreground: #1f2937;\n}\n\n* {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\nbody {\n  font-family: 'Inter', sans-serif;\n  background: var(--background);\n  color: var(--foreground);\n}`,
      'README.md': `# ${projectName}\n\nGenerated with AI Website Builder\n\n## Deployment\n\nThis is a static site that can be deployed to any static hosting service:\n\n- **Netlify**: Drag and drop the folder\n- **Vercel**: Import from Git or upload\n- **GitHub Pages**: Push to a repository\n- **Cloudflare Pages**: Connect your repository\n\n## Structure\n\n\`\`\`\n${slug}/\n├── index.html\n├── styles.css\n└── README.md\n\`\`\``,
      '_redirects': '/* /index.html 200',
      'netlify.toml': `[build]\n  publish = "."\n\n[[headers]]\n  for = "/*"\n  [headers.values]\n    X-Frame-Options = "DENY"\n    X-XSS-Protection = "1; mode=block"`,
      'vercel.json': JSON.stringify({
        cleanUrls: true,
        trailingSlash: false,
        headers: [
          {
            source: '/(.*)',
            headers: [
              { key: 'X-Frame-Options', value: 'DENY' },
              { key: 'X-Content-Type-Options', value: 'nosniff' },
            ],
          },
        ],
      }, null, 2),
    }
  }, [projectName, generateHTML])

  const generateNextJSProject = useCallback(() => {
    const slug = generateSlug(projectName)

    // Extract body content from HTML
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    const bodyContent = bodyMatch ? bodyMatch[1] : ''

    return {
      'package.json': JSON.stringify({
        name: slug,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@types/node': '^20',
          '@types/react': '^18',
          '@types/react-dom': '^18',
          typescript: '^5',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.0',
          postcss: '^8.4.0',
        },
      }, null, 2),
      'next.config.js': `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n}\n\nmodule.exports = nextConfig`,
      'tsconfig.json': JSON.stringify({
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
      'tailwind.config.ts': `import type { Config } from 'tailwindcss'\n\nconst config: Config = {\n  content: [\n    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',\n    './src/components/**/*.{js,ts,jsx,tsx,mdx}',\n    './src/app/**/*.{js,ts,jsx,tsx,mdx}',\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}\nexport default config`,
      'postcss.config.js': `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}`,
      'src/app/layout.tsx': `import type { Metadata } from 'next'\nimport { Inter } from 'next/font/google'\nimport './globals.css'\n\nconst inter = Inter({ subsets: ['latin'] })\n\nexport const metadata: Metadata = {\n  title: '${projectName}',\n  description: 'Built with AI Website Builder',\n}\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode\n}) {\n  return (\n    <html lang="en">\n      <body className={inter.className}>{children}</body>\n    </html>\n  )\n}`,
      'src/app/globals.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --foreground-rgb: 0, 0, 0;\n  --background-rgb: 255, 255, 255;\n}\n\nbody {\n  color: rgb(var(--foreground-rgb));\n  background: rgb(var(--background-rgb));\n}`,
      'src/app/page.tsx': `export default function Home() {\n  return (\n    <main>\n      {/* Content converted from HTML */}\n      <div dangerouslySetInnerHTML={{ __html: \`${bodyContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />\n    </main>\n  )\n}`,
      'README.md': `# ${projectName}\n\nGenerated with AI Website Builder.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nOpen [http://localhost:3000](http://localhost:3000) with your browser.\n\n## Deploy\n\nThe easiest way to deploy is using [Vercel](https://vercel.com).`,
      '.gitignore': `# dependencies\nnode_modules\n.pnp\n.pnp.js\n\n# testing\ncoverage\n\n# next.js\n.next/\nout/\nbuild\n\n# misc\n.DS_Store\n*.pem\n\n# local env files\n.env*.local\n\n# vercel\n.vercel\n\n# typescript\n*.tsbuildinfo\nnext-env.d.ts`,
    }
  }, [projectName, html])

  const generateJSONExport = useCallback(() => {
    return JSON.stringify({
      name: projectName,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      generator: 'AI Website Builder',
      files: files.map(f => ({
        path: f.path,
        content: f.content,
        size: f.content.length,
      })),
      html: html,
      metadata: {
        format: 'json',
        includeAssets,
      },
    }, null, 2)
  }, [projectName, files, html, includeAssets])

  const handlePreview = useCallback(() => {
    let content = ''

    switch (selectedFormat) {
      case 'html':
        content = generateHTML()
        break
      case 'json':
        content = generateJSONExport()
        break
      case 'static':
        content = JSON.stringify(generateStaticSite(), null, 2)
        break
      case 'nextjs':
        content = JSON.stringify(generateNextJSProject(), null, 2)
        break
      default:
        content = 'Preview not available for this format'
    }

    setPreviewContent(content)
    setShowPreview(true)
  }, [selectedFormat, generateHTML, generateJSONExport, generateStaticSite, generateNextJSProject])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      const slug = generateSlug(projectName)

      switch (selectedFormat) {
        case 'html': {
          const content = generateHTML()
          const blob = new Blob([content], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${slug}.html`
          a.click()
          URL.revokeObjectURL(url)
          break
        }

        case 'json': {
          const content = generateJSONExport()
          const blob = new Blob([content], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${slug}.json`
          a.click()
          URL.revokeObjectURL(url)
          break
        }

        case 'zip':
        case 'static':
        case 'nextjs': {
          const JSZip = (await import('jszip')).default
          const zip = new JSZip()

          let exportFiles: Record<string, string>

          if (selectedFormat === 'zip') {
            exportFiles = {
              'index.html': generateHTML(),
              ...Object.fromEntries(files.map(f => [f.path, f.content])),
            }
          } else if (selectedFormat === 'static') {
            exportFiles = generateStaticSite()
          } else {
            exportFiles = generateNextJSProject()
          }

          // Add files to zip
          Object.entries(exportFiles).forEach(([path, content]) => {
            zip.file(path, content)
          })

          const blob = await zip.generateAsync({ type: 'blob' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${slug}.zip`
          a.click()
          URL.revokeObjectURL(url)
          break
        }
      }

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }, [selectedFormat, projectName, files, generateHTML, generateJSONExport, generateStaticSite, generateNextJSProject])

  const copyToClipboard = useCallback(async () => {
    const content = selectedFormat === 'html' ? generateHTML() : generateJSONExport()
    await navigator.clipboard.writeText(content)
  }, [selectedFormat, generateHTML, generateJSONExport])

  return (
    <div className={cn('bg-slate-900 border-l border-slate-800 flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-purple-400" />
          Export Project
        </h2>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Export Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400">Export Format</label>
          <div className="grid gap-2">
            {EXPORT_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = selectedFormat === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedFormat(option.id)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                  )}
                >
                  <Icon className={cn('w-5 h-5 mt-0.5', option.color)} />
                  <div>
                    <p className={cn('font-medium', isSelected ? 'text-white' : 'text-slate-300')}>
                      {option.name}
                    </p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-purple-400 ml-auto" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="text-sm text-slate-400">Options</label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={addMetaTags}
              onChange={(e) => setAddMetaTags(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-300">Include SEO meta tags</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={minify}
              onChange={(e) => setMinify(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-300">Minify output</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAssets}
              onChange={(e) => setIncludeAssets(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-300">Include all assets</span>
          </label>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Preview</label>
              <button
                onClick={() => setShowPreview(false)}
                className="text-xs text-slate-500 hover:text-white"
              >
                Hide
              </button>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                {previewContent.slice(0, 2000)}
                {previewContent.length > 2000 && '\n... (truncated)'}
              </pre>
            </div>
          </div>
        )}

        {/* File Summary */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-sm text-slate-400">Project Files</label>
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Total files:</span>
              <span className="text-white">{files.length + 1}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">HTML size:</span>
              <span className="text-white">{(html.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-purple-600 hover:bg-purple-500"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : exportSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Downloaded!
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export {EXPORT_OPTIONS.find(o => o.id === selectedFormat)?.name}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
