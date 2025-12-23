'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Rocket, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Dynamically import Sandpack to avoid SSR issues
const SandpackProvider = dynamic(
  () => import('@codesandbox/sandpack-react').then(mod => mod.SandpackProvider),
  { ssr: false }
)
const SandpackLayout = dynamic(
  () => import('@codesandbox/sandpack-react').then(mod => mod.SandpackLayout),
  { ssr: false }
)
const SandpackCodeEditor = dynamic(
  () => import('@codesandbox/sandpack-react').then(mod => mod.SandpackCodeEditor),
  { ssr: false }
)
const SandpackPreview = dynamic(
  () => import('@codesandbox/sandpack-react').then(mod => mod.SandpackPreview),
  { ssr: false }
)
const SandpackFileExplorer = dynamic(
  () => import('@codesandbox/sandpack-react').then(mod => mod.SandpackFileExplorer),
  { ssr: false }
)

interface ProjectFile {
  path: string
  content: string
}

export default function BuilderPage({ params }: { params: { id: string } }) {
  const [files, setFiles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deployUrl, setDeployUrl] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load project files
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
        if (!res.ok) throw new Error('Failed to load project')
        const data = await res.json()

        setProjectName(data.project.name)

        // Convert project files to Sandpack format
        const sandpackFiles: Record<string, string> = {}

        for (const file of data.project.files || []) {
          // Sandpack expects paths starting with /
          const path = file.path.startsWith('/') ? file.path : `/${file.path}`
          sandpackFiles[path] = file.content
        }

        // Ensure we have required files
        if (!sandpackFiles['/package.json']) {
          sandpackFiles['/package.json'] = JSON.stringify({
            name: 'preview',
            dependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0',
              'lucide-react': '^0.300.0'
            }
          }, null, 2)
        }

        // Convert app/page.tsx to App.tsx format for Sandpack
        if (sandpackFiles['/app/page.tsx'] && !sandpackFiles['/App.tsx']) {
          const pageContent = sandpackFiles['/app/page.tsx']
          sandpackFiles['/App.tsx'] = pageContent
            .replace(/export default function \w+/, 'export default function App')
            .replace(/'use client'\n?/, '')
        }

        // Ensure index file exists
        if (!sandpackFiles['/index.tsx'] && !sandpackFiles['/index.js']) {
          sandpackFiles['/index.tsx'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);`
        }

        // Ensure App exists
        if (!sandpackFiles['/App.tsx'] && !sandpackFiles['/App.js']) {
          sandpackFiles['/App.tsx'] = `export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Welcome to ${data.project.name}</h1>
      <p>Edit the files on the left to see changes.</p>
    </div>
  );
}`
        }

        setFiles(sandpackFiles)
        setLoading(false)
      } catch (err: any) {
        console.error('Failed to load project:', err)
        setError(err.message)
        setLoading(false)
      }
    }
    loadProject()
  }, [params.id])

  async function handleDeploy() {
    setDeploying(true)

    try {
      const projectFiles = Object.entries(files).map(([path, content]) => ({
        path: path.startsWith('/') ? path.slice(1) : path,
        content,
      }))

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          files: projectFiles,
          name: projectName,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setDeployUrl(data.url)
        alert(`Deployed successfully!\n\nURL: ${data.url}\n\nNote: It may take a few minutes to build.`)
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      alert('Deploy failed: ' + err.message)
    } finally {
      setDeploying(false)
    }
  }

  function handleDownload() {
    const content = Object.entries(files)
      .map(([path, fileContent]) => `\n\n=== ${path} ===\n${fileContent}`)
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>Loading project...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-2">Failed to load project</p>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-white">{projectName || 'Project Builder'}</h1>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500 text-white">
            Ready
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={deploying}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {deploying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4 mr-2" />
            )}
            Create Webservice
          </Button>
        </div>
      </header>

      {deployUrl && (
        <div className="px-4 py-2 bg-green-900/50 border-b border-green-700 text-green-200 text-sm">
          Deployed to: <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="underline">{deployUrl}</a>
        </div>
      )}

      {/* Sandpack Editor */}
      <div className="flex-1 overflow-hidden">
        {Object.keys(files).length > 0 && (
          <SandpackProvider
            files={files}
            theme="dark"
            template="react-ts"
            options={{
              visibleFiles: Object.keys(files).slice(0, 5),
              activeFile: Object.keys(files).find(f => f.includes('App') || f.includes('page')) || Object.keys(files)[0],
            }}
          >
            <SandpackLayout style={{ height: 'calc(100vh - 52px)', border: 'none' }}>
              <SandpackFileExplorer style={{ height: '100%' }} />
              <SandpackCodeEditor
                style={{ height: '100%' }}
                showLineNumbers
                showTabs
                closableTabs
              />
              <SandpackPreview
                style={{ height: '100%' }}
                showOpenInCodeSandbox={false}
                showRefreshButton
              />
            </SandpackLayout>
          </SandpackProvider>
        )}
      </div>
    </div>
  )
}
