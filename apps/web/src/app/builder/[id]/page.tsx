'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { WebContainer } from '@webcontainer/api'
import Editor from '@monaco-editor/react'
import {
  Folder,
  FileCode,
  Play,
  Loader2,
  Rocket,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileNode {
  path: string
  content: string
  type: 'file' | 'directory'
}

interface ProjectFile {
  path: string
  content: string
}

export default function BuilderPage({ params }: { params: { id: string } }) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [status, setStatus] = useState<'loading' | 'booting' | 'installing' | 'running' | 'ready' | 'error'>('loading')
  const [logs, setLogs] = useState<string[]>([])
  const [deploying, setDeploying] = useState(false)
  const [projectName, setProjectName] = useState('')

  const webcontainerRef = useRef<WebContainer | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load project files
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
        if (!res.ok) throw new Error('Failed to load project')
        const data = await res.json()
        setFiles(data.project.files || [])
        setProjectName(data.project.name)
        if (data.project.files?.length > 0) {
          // Select first file (preferably page.tsx or index)
          const firstFile = data.project.files.find((f: ProjectFile) =>
            f.path.includes('page.tsx') || f.path.includes('index')
          ) || data.project.files[0]
          setSelectedFile(firstFile)
        }
        setStatus('booting')
      } catch (err) {
        console.error('Failed to load project:', err)
        setStatus('error')
      }
    }
    loadProject()
  }, [params.id])

  // Boot WebContainer when files are loaded
  useEffect(() => {
    if (status !== 'booting' || files.length === 0) return

    async function bootContainer() {
      try {
        addLog('Booting WebContainer...')
        const webcontainer = await WebContainer.boot()
        webcontainerRef.current = webcontainer

        addLog('Mounting files...')
        await mountFiles(webcontainer, files)

        addLog('Installing dependencies...')
        setStatus('installing')

        const installProcess = await webcontainer.spawn('npm', ['install'])
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            addLog(data)
          }
        }))
        const installExitCode = await installProcess.exit

        if (installExitCode !== 0) {
          throw new Error('npm install failed')
        }

        addLog('Starting dev server...')
        setStatus('running')

        const devProcess = await webcontainer.spawn('npm', ['run', 'dev'])
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            addLog(data)
          }
        }))

        // Wait for server to be ready
        webcontainer.on('server-ready', (port, url) => {
          addLog(`Server ready at ${url}`)
          setPreviewUrl(url)
          setStatus('ready')
        })

      } catch (err: any) {
        console.error('WebContainer error:', err)
        addLog(`Error: ${err.message}`)
        setStatus('error')
      }
    }

    bootContainer()

    return () => {
      webcontainerRef.current?.teardown()
    }
  }, [status, files])

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-50), message])
  }, [])

  async function mountFiles(webcontainer: WebContainer, projectFiles: ProjectFile[]) {
    const fileSystem: Record<string, any> = {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'preview-app',
            version: '1.0.0',
            scripts: {
              dev: 'next dev --port 3000',
              build: 'next build',
              start: 'next start'
            },
            dependencies: {
              next: '14.1.0',
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            }
          }, null, 2)
        }
      },
      'next.config.js': {
        file: {
          contents: 'module.exports = { reactStrictMode: true }'
        }
      }
    }

    // Add project files
    for (const file of projectFiles) {
      const parts = file.path.split('/')
      let current = fileSystem

      for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts[i]
        if (!current[dir]) {
          current[dir] = { directory: {} }
        }
        current = current[dir].directory
      }

      const fileName = parts[parts.length - 1]
      current[fileName] = { file: { contents: file.content } }
    }

    await webcontainer.mount(fileSystem)
  }

  async function handleFileChange(newContent: string | undefined) {
    if (!selectedFile || !newContent || !webcontainerRef.current) return

    // Update local state
    setFiles(prev => prev.map(f =>
      f.path === selectedFile.path ? { ...f, content: newContent } : f
    ))
    setSelectedFile({ ...selectedFile, content: newContent })

    // Update file in WebContainer
    try {
      await webcontainerRef.current.fs.writeFile(selectedFile.path, newContent)
    } catch (err) {
      console.error('Failed to write file:', err)
    }
  }

  async function handleDeploy() {
    setDeploying(true)
    addLog('Starting deployment to Render...')

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          files,
          name: projectName
        })
      })

      const data = await res.json()
      if (data.success) {
        addLog(`Deployed! URL: ${data.url}`)
        alert(`Deployed successfully!\n\nURL: ${data.url}`)
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      addLog(`Deploy failed: ${err.message}`)
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
    a.download = `${projectName.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Build file tree structure
  const fileTree = buildFileTree(files)

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">{projectName || 'Project Builder'}</h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={deploying || status !== 'ready'}
            className="bg-green-600 hover:bg-green-700"
          >
            {deploying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4 mr-2" />
            )}
            Deploy to Render
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-56 bg-slate-800 border-r border-slate-700 overflow-y-auto">
          <div className="p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Files
          </div>
          <FileTree
            tree={fileTree}
            selectedPath={selectedFile?.path}
            onSelect={(path) => {
              const file = files.find(f => f.path === path)
              if (file) setSelectedFile(file)
            }}
          />
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-1.5 bg-slate-700 text-sm text-slate-300 border-b border-slate-600">
            {selectedFile?.path || 'No file selected'}
          </div>
          <div className="flex-1">
            {selectedFile ? (
              <Editor
                height="100%"
                defaultLanguage={getLanguage(selectedFile.path)}
                value={selectedFile.content}
                onChange={handleFileChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                Select a file to edit
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="w-1/2 flex flex-col border-l border-slate-700">
          <div className="px-3 py-1.5 bg-slate-700 text-sm text-slate-300 border-b border-slate-600 flex items-center justify-between">
            <span>Preview</span>
            {previewUrl && (
              <button
                onClick={() => iframeRef.current?.contentWindow?.location.reload()}
                className="p-1 hover:bg-slate-600 rounded"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex-1 bg-white">
            {status === 'ready' && previewUrl ? (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0"
                title="Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-slate-400">
                {status === 'loading' && (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span>Loading project...</span>
                  </>
                )}
                {status === 'booting' && (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span>Booting WebContainer...</span>
                  </>
                )}
                {status === 'installing' && (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span>Installing dependencies...</span>
                  </>
                )}
                {status === 'running' && (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span>Starting dev server...</span>
                  </>
                )}
                {status === 'error' && (
                  <>
                    <span className="text-red-400">Failed to start preview</span>
                    <span className="text-xs mt-1">Check console for details</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="h-32 bg-slate-950 border-t border-slate-700 overflow-y-auto p-2 font-mono text-xs text-slate-400">
            {logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    loading: 'bg-yellow-500',
    booting: 'bg-yellow-500',
    installing: 'bg-blue-500',
    running: 'bg-blue-500',
    ready: 'bg-green-500',
    error: 'bg-red-500',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status]} text-white`}>
      {status}
    </span>
  )
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

function buildFileTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = []

  for (const file of files) {
    const parts = file.path.split('/')
    let current = root
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFile = i === parts.length - 1

      let node = current.find(n => n.name === part)
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          children: isFile ? undefined : []
        }
        current.push(node)
      }

      if (!isFile && node.children) {
        current = node.children
      }
    }
  }

  return root
}

function FileTree({
  tree,
  selectedPath,
  onSelect,
  depth = 0
}: {
  tree: TreeNode[]
  selectedPath?: string
  onSelect: (path: string) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  return (
    <div>
      {tree.map(node => (
        <div key={node.path}>
          <button
            onClick={() => {
              if (node.type === 'directory') {
                setExpanded(prev => {
                  const next = new Set(prev)
                  if (next.has(node.path)) next.delete(node.path)
                  else next.add(node.path)
                  return next
                })
              } else {
                onSelect(node.path)
              }
            }}
            className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-slate-700 ${
              selectedPath === node.path ? 'bg-slate-700 text-white' : 'text-slate-300'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {node.type === 'directory' ? (
              <>
                {expanded.has(node.path) ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
                <Folder className="w-4 h-4 text-yellow-500" />
              </>
            ) : (
              <>
                <span className="w-3.5" />
                <FileCode className="w-4 h-4 text-blue-400" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </button>

          {node.type === 'directory' && expanded.has(node.path) && node.children && (
            <FileTree
              tree={node.children}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    html: 'html',
    md: 'markdown',
  }
  return langMap[ext || ''] || 'plaintext'
}
