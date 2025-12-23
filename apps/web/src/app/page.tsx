'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ProjectType = 'business-portfolio' | 'ecommerce' | 'saas'
type GenerationStatus = 'idle' | 'generating' | 'success' | 'error'

const workspaceValues = [
  { label: 'Launch pace', value: '4.2 min', detail: 'average project spin up' },
  { label: 'Agent sync', value: '99.9%', detail: 'Claude · Gemini · GPT' },
  { label: 'Workplace uptime', value: '24/7', detail: 'Globally distributed routers' },
]

const featureList = [
  'Automated release boards for your creative + engineering teams',
  'Data-safe prompts that never leave your private vectors',
  'Live status for every deployment and workspace integration',
]

export default function HomePage() {
  const [projectType, setProjectType] = useState<ProjectType>('business-portfolio')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [generatedFiles, setGeneratedFiles] = useState<any[]>([])
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
              primary: '#0f172a',
              secondary: '#111827',
              accent: '#000000',
            },
          },
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()
      const projectResponse = await fetch(`/api/projects/${data.project._id}`)
      const projectData = await projectResponse.json()

      setGeneratedFiles(projectData.project.files || [])
      setStatus('success')
    } catch (err) {
      setError('Failed to generate project. Please make sure your API keys are configured.')
      setStatus('error')
    }
  }

  const handleDownload = () => {
    const content = generatedFiles
      .map((file) => `\n\n=== ${file.path} ===\n${file.content}`)
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12">
        <section className="space-y-4 border-b border-slate-200 pb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">workspace os</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Helix Workplace</h1>
            <p className="text-lg text-slate-600">
              A modern SaaS platform where product, design, and engineering collaborate in one uncluttered control plane.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            {workspaceValues.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</span>
                <span className="text-2xl font-medium text-slate-900">{item.value}</span>
                <span className="text-sm text-slate-500">{item.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-3xl bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">new workspace</p>
              <Sparkles className="h-5 w-5 text-slate-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Build the next SaaS company</h2>
            <p className="text-sm text-slate-500">
              Use AI to sketch your first release in minutes, then ship it into a clean workplace tailored for hybrid teams.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: 'Portfolio', type: 'business-portfolio' as ProjectType },
              { label: 'E-Commerce', type: 'ecommerce' as ProjectType },
              { label: 'SaaS Launch', type: 'saas' as ProjectType },
            ].map((option) => (
              <button
                key={option.type}
                onClick={() => setProjectType(option.type)}
                className={`rounded-2xl border px-4 py-6 text-left transition ${
                  projectType === option.type
                    ? 'border-black/90 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                <span className="text-sm font-mono uppercase tracking-[0.4em] text-slate-400">{option.label}</span>
                <p className="mt-3 text-lg font-semibold">{option.label}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name" className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Project name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Nomad Supply"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1 border-slate-200 bg-white text-slate-900"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Description
              </Label>
              <Input
                id="description"
                placeholder="Flexible, remote-friendly workspace for engineers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 border-slate-200 bg-white text-slate-900"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-50/60 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={status === 'generating'}
            className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-slate-900 bg-slate-900 px-6 text-sm font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
          >
            {status === 'generating' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating workspace
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate workspace
              </>
            )}
          </Button>
        </section>

        {status === 'success' && generatedFiles.length > 0 && (
          <section className="rounded-3xl bg-white p-8 shadow-[0_20px_100px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-900">
                <CheckCircle className="h-6 w-6 text-white" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Workspace ready</p>
                <h3 className="text-2xl font-semibold text-slate-900">Clean, deployable files</h3>
                <p className="text-sm text-slate-500">
                  {generatedFiles.length} files were generated and are available for download.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {generatedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-800"
                >
                  {file.path}
                </div>
              ))}
            </div>

            <Button
              onClick={handleDownload}
              className="mt-6 flex h-14 items-center justify-center gap-3 rounded-2xl border border-slate-900 bg-white px-6 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900 shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download files
            </Button>
          </section>
        )}

        <section className="grid gap-6 rounded-3xl bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.06)] md:grid-cols-3">
          {featureList.map((feature) => (
            <Card key={feature} className="border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-600">{feature}</p>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
