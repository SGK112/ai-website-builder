'use client'

import { useEffect, useState, useCallback } from 'react'
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
  RefreshCw,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  MousePointer,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BuilderChat } from '@/components/builder/BuilderChat'
import { IntegrationsPanel } from '@/components/builder/IntegrationsPanel'
import { DeploymentPanel } from '@/components/builder/DeploymentPanel'
import { ComponentLibrary } from '@/components/builder/ComponentLibrary'
import { PropertiesPanel } from '@/components/builder/PropertiesPanel'
import { DraggableComponentList, parseComponentTree } from '@/components/builder/DraggableComponentList'
import type { ComponentNode } from '@/components/builder/DraggableComponentList'
import { CodeHighlighter } from '@/components/builder/CodeHighlighter'

interface ProjectFile {
  path: string
  content: string
}

type ViewMode = 'preview' | 'code'
type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type LeftPanelMode = 'components' | 'layers' | 'collapsed'

interface SelectedElement {
  id: string
  type: string
  tagName: string
  className: string
  textContent?: string
  styles: Record<string, string>
  attributes: Record<string, string>
}

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
  const [showChat, setShowChat] = useState(true)
  const [userKeys, setUserKeys] = useState<Record<string, string>>({})
  const [showDeployPanel, setShowDeployPanel] = useState(false)
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>('components')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [componentTree, setComponentTree] = useState<ComponentNode[]>([])
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  // Handle saving user API keys
  async function handleSaveKeys(keys: Record<string, string>) {
    setUserKeys(keys)
    // In a real app, save to backend encrypted
    console.log('Saving API keys:', Object.keys(keys))
  }

  // Handle file changes from Claude chat
  function handleApplyChanges(changes: { path: string; content: string }[]) {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles]
      for (const change of changes) {
        const existingIndex = newFiles.findIndex(f => f.path === change.path)
        if (existingIndex >= 0) {
          newFiles[existingIndex] = { path: change.path, content: change.content }
        } else {
          newFiles.push({ path: change.path, content: change.content })
        }
      }
      return newFiles
    })
    // Refresh preview
    setPreviewKey(k => k + 1)
  }

  // Handle inserting a component from the library
  const handleInsertComponent = useCallback((code: string) => {
    // Find the main page file
    const pageFileIndex = files.findIndex(f =>
      f.path.includes('page.tsx') || f.path.includes('App.tsx')
    )

    if (pageFileIndex === -1) return

    const pageFile = files[pageFileIndex]

    // Find the return statement and insert before the closing tag
    const returnMatch = pageFile.content.match(/return\s*\(\s*([\s\S]*)\s*\)\s*;?\s*\}/)
    if (!returnMatch) return

    // Find a good insertion point (before the last closing div/section)
    const content = pageFile.content
    const lastMainDivEnd = content.lastIndexOf('</main>')
    const lastDivEnd = content.lastIndexOf('</div>')
    const insertPoint = lastMainDivEnd > 0 ? lastMainDivEnd : lastDivEnd

    if (insertPoint > 0) {
      const newContent =
        content.slice(0, insertPoint) +
        '\n\n      {/* New Component */}\n      ' +
        code +
        '\n\n      ' +
        content.slice(insertPoint)

      setFiles(prevFiles => {
        const newFiles = [...prevFiles]
        newFiles[pageFileIndex] = { ...pageFile, content: newContent }
        return newFiles
      })

      // Refresh preview
      setPreviewKey(k => k + 1)
    }
  }, [files])

  // Handle updating a selected element
  const handleUpdateElement = useCallback((updates: Partial<SelectedElement>) => {
    if (!selectedElement) return
    setSelectedElement(prev => prev ? { ...prev, ...updates } : null)
    // In a real implementation, this would update the actual file content
    setPreviewKey(k => k + 1)
  }, [selectedElement])

  // Handle deleting a selected element
  const handleDeleteElement = useCallback(() => {
    if (!selectedElement) return
    // In a real implementation, this would remove the element from the file
    setSelectedElement(null)
    setShowPropertiesPanel(false)
    setPreviewKey(k => k + 1)
  }, [selectedElement])

  // Handle duplicating a selected element
  const handleDuplicateElement = useCallback(() => {
    if (!selectedElement) return
    // In a real implementation, this would duplicate the element in the file
    setPreviewKey(k => k + 1)
  }, [selectedElement])

  // Component tree handlers
  const handleReorderComponents = useCallback((newComponents: ComponentNode[]) => {
    setComponentTree(newComponents)
    // In a real implementation, this would reorder components in the actual file
    setPreviewKey(k => k + 1)
  }, [])

  const handleSelectComponent = useCallback((componentId: string) => {
    setSelectedComponentId(componentId)
    setShowPropertiesPanel(true)
    // Find the component and set it as the selected element
    const findComponent = (nodes: ComponentNode[]): ComponentNode | null => {
      for (const node of nodes) {
        if (node.id === componentId) return node
        if (node.children) {
          const found = findComponent(node.children)
          if (found) return found
        }
      }
      return null
    }
    const component = findComponent(componentTree)
    if (component) {
      setSelectedElement({
        id: component.id,
        type: component.type,
        tagName: component.tagName,
        className: '',
        textContent: component.name,
        styles: {},
        attributes: {},
      })
    }
  }, [componentTree])

  const handleToggleComponentVisibility = useCallback((componentId: string) => {
    setComponentTree(prev => {
      const toggleVisibility = (nodes: ComponentNode[]): ComponentNode[] => {
        return nodes.map(node => {
          if (node.id === componentId) {
            return { ...node, visible: !node.visible }
          }
          if (node.children) {
            return { ...node, children: toggleVisibility(node.children) }
          }
          return node
        })
      }
      return toggleVisibility(prev)
    })
    setPreviewKey(k => k + 1)
  }, [])

  const handleDuplicateComponent = useCallback((componentId: string) => {
    setComponentTree(prev => {
      const duplicateComponent = (nodes: ComponentNode[]): ComponentNode[] => {
        const result: ComponentNode[] = []
        for (const node of nodes) {
          result.push(node)
          if (node.id === componentId) {
            result.push({
              ...node,
              id: `${node.id}-copy-${Date.now()}`,
              name: `${node.name} (Copy)`,
            })
          }
          if (node.children) {
            result[result.length - 1] = {
              ...result[result.length - 1],
              children: duplicateComponent(node.children),
            }
          }
        }
        return result
      }
      return duplicateComponent(prev)
    })
    setPreviewKey(k => k + 1)
  }, [])

  const handleDeleteComponent = useCallback((componentId: string) => {
    setComponentTree(prev => {
      const deleteComponent = (nodes: ComponentNode[]): ComponentNode[] => {
        return nodes
          .filter(node => node.id !== componentId)
          .map(node => {
            if (node.children) {
              return { ...node, children: deleteComponent(node.children) }
            }
            return node
          })
      }
      return deleteComponent(prev)
    })
    if (selectedComponentId === componentId) {
      setSelectedComponentId(null)
      setSelectedElement(null)
      setShowPropertiesPanel(false)
    }
    setPreviewKey(k => k + 1)
  }, [selectedComponentId])

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

        // Select main page file and parse component tree
        const mainFile = data.project.files?.find((f: ProjectFile) =>
          f.path.includes('page.tsx') || f.path.includes('App.tsx')
        )
        if (mainFile) {
          setSelectedFile(mainFile)
          // Parse component tree from the main file
          const tree = parseComponentTree(mainFile.content)
          setComponentTree(tree)
        }

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
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #1e293b;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900">
  <div id="preview-root" class="min-h-screen">
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
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="text-slate-300">Loading project...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-2">Failed to load project</p>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-800">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-semibold text-white">{projectName}</h1>
            <p className="text-xs text-slate-400 capitalize">{projectType?.replace('-', ' ')} Website</p>
          </div>
        </div>

        {/* Device Toggle */}
        <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-2 rounded text-slate-300 ${deviceMode === 'desktop' ? 'bg-slate-600 text-white' : 'hover:bg-slate-600'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-2 rounded text-slate-300 ${deviceMode === 'tablet' ? 'bg-slate-600 text-white' : 'hover:bg-slate-600'}`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-2 rounded text-slate-300 ${deviceMode === 'mobile' ? 'bg-slate-600 text-white' : 'hover:bg-slate-600'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className={`gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white ${showChat ? 'bg-purple-900/50 border-purple-500 text-purple-300' : ''}`}
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewKey(k => k + 1)}
            className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
            className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            {viewMode === 'preview' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {viewMode === 'preview' ? 'View Code' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={() => setShowDeployPanel(true)}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Rocket className="w-4 h-4" />
            Deploy
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
        {/* Left Sidebar - Mode Toggle */}
        <div className="w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-3 gap-1">
          <button
            onClick={() => setLeftPanelMode(leftPanelMode === 'components' ? 'collapsed' : 'components')}
            className={`p-2.5 rounded-lg transition ${leftPanelMode === 'components' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title="Components"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setLeftPanelMode(leftPanelMode === 'layers' ? 'collapsed' : 'layers')}
            className={`p-2.5 rounded-lg transition ${leftPanelMode === 'layers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title="Layers"
          >
            <Layers className="w-5 h-5" />
          </button>
          <div className="w-8 h-px bg-slate-800 my-2" />
          <button
            onClick={() => {
              setShowPropertiesPanel(!showPropertiesPanel)
            }}
            className={`p-2.5 rounded-lg transition ${showPropertiesPanel ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title="Properties"
          >
            <MousePointer className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setLeftPanelMode(leftPanelMode === 'collapsed' ? 'components' : 'collapsed')}
            className="p-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title={leftPanelMode === 'collapsed' ? 'Expand Panel' : 'Collapse Panel'}
          >
            {leftPanelMode === 'collapsed' ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* Component Library Panel */}
        {leftPanelMode === 'components' && (
          <ComponentLibrary onInsertComponent={handleInsertComponent} />
        )}

        {/* Layers Panel */}
        {leftPanelMode === 'layers' && (
          <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
            <div className="p-3 border-b border-slate-700">
              <h3 className="text-sm font-medium text-white">Page Layers</h3>
              <p className="text-xs text-slate-500 mt-1">Drag to reorder components</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DraggableComponentList
                components={componentTree}
                onReorder={handleReorderComponents}
                onSelect={handleSelectComponent}
                onToggleVisibility={handleToggleComponentVisibility}
                onDuplicate={handleDuplicateComponent}
                onDelete={handleDeleteComponent}
                selectedId={selectedComponentId || undefined}
              />
            </div>
            <div className="p-3 border-t border-slate-700">
              <div className="text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-slate-700 rounded" /> Drag to reorder
                </p>
                <p className="flex items-center gap-2">
                  <Eye className="w-3 h-3" /> Toggle visibility
                </p>
              </div>
            </div>
          </div>
        )}

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
              <div className="h-full bg-slate-950">
                {/* File Tabs */}
                <div className="flex border-b border-slate-700 bg-slate-900 overflow-x-auto">
                  {files.slice(0, 6).map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`px-4 py-2 text-sm whitespace-nowrap border-r border-slate-700 ${
                        selectedFile?.path === file.path
                          ? 'bg-slate-800 text-white font-medium'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {file.path.split('/').pop()}
                    </button>
                  ))}
                </div>
                {/* Code View with Syntax Highlighting */}
                <div className="p-4 overflow-auto h-[calc(100%-40px)] bg-slate-950">
                  {selectedFile ? (
                    <CodeHighlighter
                      code={selectedFile.content}
                      language={
                        selectedFile.path.endsWith('.tsx') || selectedFile.path.endsWith('.ts')
                          ? 'typescript'
                          : selectedFile.path.endsWith('.css')
                          ? 'css'
                          : selectedFile.path.endsWith('.json')
                          ? 'json'
                          : 'typescript'
                      }
                      showLineNumbers
                    />
                  ) : (
                    <p className="text-slate-500">Select a file to view its contents</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties or Project Details */}
        {showPropertiesPanel && selectedElement ? (
          <PropertiesPanel
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onClose={() => {
              setShowPropertiesPanel(false)
              setSelectedElement(null)
            }}
          />
        ) : (
          <div className="w-72 bg-slate-900 border-l border-slate-700 overflow-y-auto">
            <div className="p-4 border-b border-slate-700">
              <h3 className="font-semibold text-white">Project Details</h3>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Project Name
                </label>
                <p className="mt-1 text-white">{projectName}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Type
                </label>
                <p className="mt-1 text-white capitalize">{projectType?.replace('-', ' ')}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Files
                </label>
                <p className="mt-1 text-white">{files.length} files</p>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
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
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left text-slate-300 hover:bg-slate-800 hover:text-white rounded"
                    >
                      <Code className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{file.path}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-4 border-t border-slate-700">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Quick Tips</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-start gap-2">
                  <Plus className="w-3 h-3 mt-0.5 text-blue-400" />
                  <span>Click components to add them to your page</span>
                </li>
                <li className="flex items-start gap-2">
                  <MousePointer className="w-3 h-3 mt-0.5 text-purple-400" />
                  <span>Use Properties mode to edit elements</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="w-3 h-3 mt-0.5 text-green-400" />
                  <span>Ask AI to make complex changes</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* AI Chat Panel */}
        {showChat && (
          <BuilderChat
            files={files}
            projectName={projectName}
            onApplyChanges={handleApplyChanges}
          />
        )}
      </div>

      {/* Integrations Panel */}
      <IntegrationsPanel
        projectId={params.id}
        savedKeys={userKeys}
        onSaveKeys={handleSaveKeys}
      />

      {/* Deployment Panel */}
      {showDeployPanel && (
        <DeploymentPanel
          projectId={params.id}
          projectName={projectName}
          files={files}
          onClose={() => setShowDeployPanel(false)}
        />
      )}
    </div>
  )
}
