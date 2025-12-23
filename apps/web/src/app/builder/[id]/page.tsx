'use client'

import { useEffect, useState } from 'react'
import {
  Rocket,
  Loader2,
  Download,
  Eye,
  Code,
  Palette,
  Type,
  Image,
  Layout,
  Settings,
  ChevronRight,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProjectFile {
  path: string
  content: string
}

type ViewMode = 'preview' | 'code'
type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export default function BuilderPage({ params }: { params: { id: string } }) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deployUrl, setDeployUrl] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  // Load project files
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
        if (!res.ok) throw new Error('Failed to load project')
        const data = await res.json()

        setProjectName(data.project.name)
        setProjectType(data.project.type)
        setFiles(data.project.files || [])

        // Select main page file
        const mainFile = data.project.files?.find((f: ProjectFile) =>
          f.path.includes('page.tsx') || f.path.includes('App.tsx')
        )
        if (mainFile) setSelectedFile(mainFile)

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
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          files,
          name: projectName,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setDeployUrl(data.url)
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
    const content = files
      .map((file) => `\n\n=== ${file.path} ===\n${file.content}`)
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '-')}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Generate static HTML preview from the React components
  function generatePreviewHTML(): string {
    const pageFile = files.find(f => f.path.includes('page.tsx') || f.path.includes('App.tsx'))
    const layoutFile = files.find(f => f.path.includes('layout.tsx'))
    const globalCss = files.find(f => f.path.includes('globals.css'))

    // Extract content from JSX (simplified)
    let content = pageFile?.content || ''

    // Basic JSX to HTML conversion for preview
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${globalCss?.content || ''}
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="preview-root">
    ${convertJSXToHTML(content)}
  </div>
</body>
</html>`

    return htmlContent
  }

  // Simple JSX to HTML converter for preview
  function convertJSXToHTML(jsx: string): string {
    // Extract the return statement content
    const returnMatch = jsx.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}/)
    if (!returnMatch) return '<div class="p-8"><h1 class="text-2xl font-bold">' + projectName + '</h1><p>Preview not available</p></div>'

    let html = returnMatch[1]

    // Convert JSX syntax to HTML
    html = html
      .replace(/className=/g, 'class=')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // Remove JSX comments
      .replace(/<([A-Z][a-zA-Z]*)/g, '<div data-component="$1"') // Convert components to divs
      .replace(/<\/([A-Z][a-zA-Z]*)>/g, '</div>')
      .replace(/\{`([^`]*)`\}/g, '$1') // Template literals
      .replace(/\{"([^"]*)"\}/g, '$1') // String expressions
      .replace(/\{([^{}]*)\}/g, '<!-- $1 -->') // Other expressions as comments
      .replace(/<ArrowRight[^>]*\/>/g, '→')
      .replace(/<Star[^>]*\/>/g, '★')
      .replace(/<Users[^>]*\/>/g, '👥')
      .replace(/<Target[^>]*\/>/g, '🎯')
      .replace(/<Check[^>]*\/>/g, '✓')
      .replace(/<([a-z]+)([^>]*)\s*\/>/g, '<$1$2></$1>') // Self-closing tags

    return html
  }

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          <span className="text-slate-600">Loading project...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-2">Failed to load project</p>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-semibold text-slate-900">{projectName}</h1>
            <p className="text-xs text-slate-500 capitalize">{projectType?.replace('-', ' ')} Website</p>
          </div>
        </div>

        {/* Device Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-2 rounded ${deviceMode === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-2 rounded ${deviceMode === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-2 rounded ${deviceMode === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewKey(k => k + 1)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
            className="gap-2"
          >
            {viewMode === 'preview' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {viewMode === 'preview' ? 'View Code' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={deploying}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {deploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            Create Webservice
          </Button>
        </div>
      </header>

      {/* Deploy Success Banner */}
      {deployUrl && (
        <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800">
            <span className="font-medium">Deployed successfully!</span>
            <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {deployUrl}
            </a>
          </div>
          <span className="text-sm text-green-600">May take a few minutes to build</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Quick Actions */}
        <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-2">
          <button className="p-3 rounded-lg hover:bg-slate-100 text-slate-600" title="Layout">
            <Layout className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-lg hover:bg-slate-100 text-slate-600" title="Colors">
            <Palette className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-lg hover:bg-slate-100 text-slate-600" title="Text">
            <Type className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-lg hover:bg-slate-100 text-slate-600" title="Images">
            <Image className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="p-3 rounded-lg hover:bg-slate-100 text-slate-600" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            style={{
              width: deviceWidths[deviceMode],
              maxWidth: '100%',
              minHeight: 'calc(100vh - 200px)'
            }}
          >
            {viewMode === 'preview' ? (
              <iframe
                key={previewKey}
                srcDoc={generatePreviewHTML()}
                className="w-full h-full min-h-[600px] border-0"
                title="Preview"
              />
            ) : (
              <div className="h-full">
                {/* File Tabs */}
                <div className="flex border-b bg-slate-50 overflow-x-auto">
                  {files.slice(0, 6).map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`px-4 py-2 text-sm whitespace-nowrap border-r ${
                        selectedFile?.path === file.path
                          ? 'bg-white text-slate-900 font-medium'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {file.path.split('/').pop()}
                    </button>
                  ))}
                </div>
                {/* Code View */}
                <pre className="p-4 text-sm overflow-auto h-[calc(100%-40px)] bg-slate-900 text-slate-100">
                  <code>{selectedFile?.content || 'Select a file'}</code>
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 bg-white border-l overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-slate-900">Project Details</h3>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Project Name
              </label>
              <p className="mt-1 text-slate-900">{projectName}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Type
              </label>
              <p className="mt-1 text-slate-900 capitalize">{projectType?.replace('-', ' ')}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Files
              </label>
              <p className="mt-1 text-slate-900">{files.length} files</p>
            </div>

            <div className="pt-4 border-t">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Project Files
              </label>
              <div className="mt-2 space-y-1">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => {
                      setSelectedFile(file)
                      setViewMode('code')
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-slate-100 rounded"
                  >
                    <Code className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{file.path}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
