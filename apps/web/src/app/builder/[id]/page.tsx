'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Rocket,
  Loader2,
  Download,
  Eye,
  Code,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  MessageSquare,
  Layers,
  Plus,
  Settings,
  Plug,
  Zap,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  Palette,
  FileCode,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BuilderChat } from '@/components/builder/BuilderChat'
import { DeploymentPanel } from '@/components/builder/DeploymentPanel'
import { ComponentLibrary } from '@/components/builder/ComponentLibrary'
import { PropertiesPanel } from '@/components/builder/PropertiesPanel'
import { DraggableComponentList, parseComponentTree } from '@/components/builder/DraggableComponentList'
import type { ComponentNode } from '@/components/builder/DraggableComponentList'
import { CodeHighlighter } from '@/components/builder/CodeHighlighter'
import { EmbedWidgets } from '@/components/builder/EmbedWidgets'
import { STATIC_TEMPLATES, applyTemplateVariables } from '@/lib/templates'
import { cn } from '@/lib/utils'

interface ProjectFile {
  path: string
  content: string
}

type ViewMode = 'preview' | 'code'
type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type SidebarTab = 'components' | 'layers' | 'integrations' | 'embeds' | 'templates' | 'settings'

interface SelectedElement {
  id: string
  type: string
  tagName: string
  className: string
  textContent?: string
  styles: Record<string, string>
  attributes: Record<string, string>
}

// Sidebar panel data
const SIDEBAR_TABS = [
  { id: 'components' as const, icon: Plus, label: 'Components', color: 'text-blue-400' },
  { id: 'layers' as const, icon: Layers, label: 'Layers', color: 'text-purple-400' },
  { id: 'embeds' as const, icon: Zap, label: 'Widgets', color: 'text-orange-400' },
  { id: 'integrations' as const, icon: Plug, label: 'Integrations', color: 'text-green-400' },
  { id: 'templates' as const, icon: LayoutTemplate, label: 'Templates', color: 'text-pink-400' },
  { id: 'settings' as const, icon: Settings, label: 'Settings', color: 'text-slate-400' },
]

export default function BuilderPage({ params }: { params: { id: string } }) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [deployUrl, setDeployUrl] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [showChat, setShowChat] = useState(true)
  const [userKeys, setUserKeys] = useState<Record<string, string>>({})
  const [showDeployPanel, setShowDeployPanel] = useState(false)

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<SidebarTab>('components')

  // Properties panel
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)

  // Component tree
  const [componentTree, setComponentTree] = useState<ComponentNode[]>([])
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  // Use static template for preview
  const [useStaticTemplate, setUseStaticTemplate] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState('modern-saas')

  // Handle saving user API keys
  async function handleSaveKeys(keys: Record<string, string>) {
    setUserKeys(keys)
    try {
      await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: keys, projectId: params.id }),
      })
    } catch (err) {
      console.error('Failed to save keys:', err)
    }
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
    setPreviewKey(k => k + 1)
  }

  // Handle inserting code (from components or embeds)
  const handleInsertCode = useCallback((code: string) => {
    const pageFileIndex = files.findIndex(f =>
      f.path.includes('page.tsx') || f.path.includes('App.tsx') || f.path.includes('index.html')
    )

    if (pageFileIndex === -1) {
      // Create a new HTML file with the code
      const newFile: ProjectFile = {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${code}
</body>
</html>`
      }
      setFiles(prev => [...prev, newFile])
    } else {
      const pageFile = files[pageFileIndex]
      const content = pageFile.content

      // Find insertion point before closing body/main tag
      let insertPoint = content.lastIndexOf('</main>')
      if (insertPoint === -1) insertPoint = content.lastIndexOf('</body>')
      if (insertPoint === -1) insertPoint = content.lastIndexOf('</div>')

      if (insertPoint > 0) {
        const newContent = content.slice(0, insertPoint) + '\n\n' + code + '\n\n' + content.slice(insertPoint)
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[pageFileIndex] = { ...pageFile, content: newContent }
          return newFiles
        })
      }
    }
    setPreviewKey(k => k + 1)
  }, [files, projectName])

  // Handle updating a selected element
  const handleUpdateElement = useCallback((updates: Partial<SelectedElement>) => {
    if (!selectedElement) return
    setSelectedElement(prev => prev ? { ...prev, ...updates } : null)
    setPreviewKey(k => k + 1)
  }, [selectedElement])

  // Handle deleting a selected element
  const handleDeleteElement = useCallback(() => {
    if (!selectedElement) return
    setSelectedElement(null)
    setShowPropertiesPanel(false)
    setPreviewKey(k => k + 1)
  }, [selectedElement])

  // Handle duplicating a selected element
  const handleDuplicateElement = useCallback(() => {
    if (!selectedElement) return
    setPreviewKey(k => k + 1)
  }, [selectedElement])

  // Component tree handlers
  const handleReorderComponents = useCallback((newComponents: ComponentNode[]) => {
    setComponentTree(newComponents)
    setPreviewKey(k => k + 1)
  }, [])

  const handleSelectComponent = useCallback((componentId: string) => {
    setSelectedComponentId(componentId)
    setShowPropertiesPanel(true)
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

  // Apply template
  const handleApplyTemplate = useCallback((templateId: string) => {
    const template = STATIC_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplateId(templateId)
      setUseStaticTemplate(true)
      setPreviewKey(k => k + 1)
    }
  }, [])

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

        const mainFile = data.project.files?.find((f: ProjectFile) =>
          f.path.includes('page.tsx') || f.path.includes('App.tsx')
        )
        if (mainFile) {
          setSelectedFile(mainFile)
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

  // Generate preview HTML
  function generatePreviewHTML(): string {
    // Use static template if enabled
    if (useStaticTemplate) {
      const template = STATIC_TEMPLATES.find(t => t.id === selectedTemplateId)
      if (template) {
        return applyTemplateVariables(template.html, { projectName })
      }
    }

    // Fallback to generated content
    const pageFile = files.find(f => f.path.includes('page.tsx') || f.path.includes('App.tsx'))
    const globalCss = files.find(f => f.path.includes('globals.css'))

    if (!pageFile) {
      return generateFallbackPreview()
    }

    const convertedHTML = convertJSXToHTML(pageFile.content)

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${globalCss?.content || ''}
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="preview-root">${convertedHTML}</div>
</body>
</html>`
  }

  function generateFallbackPreview(): string {
    const template = STATIC_TEMPLATES.find(t => t.id === 'modern-saas')
    if (template) {
      return applyTemplateVariables(template.html, { projectName })
    }
    return `<!DOCTYPE html><html><body><h1>${projectName}</h1></body></html>`
  }

  function convertJSXToHTML(jsx: string): string {
    let returnMatch = jsx.match(/return\s*\(\s*([\s\S]*)\s*\)\s*;?\s*\}[\s\S]*$/)
    if (!returnMatch) {
      returnMatch = jsx.match(/return\s*\(\s*([\s\S]+?)\s*\);?\s*\}\s*$/)
    }
    if (!returnMatch) return ''

    let html = returnMatch[1]
    html = html.replace(/^[\s\S]*?(?=<)/m, '')
    html = html.replace(/\{[\w\s\[\],\.]*\.map\s*\(\s*\([^)]*\)\s*=>\s*\(?([\s\S]*?)\)?\s*\)\s*\}/g, (_, content) => {
      const cleanContent = content.replace(/key=\{[^}]*\}/g, '').replace(/\{[\w\.]+\}/g, 'Item')
      return `${cleanContent}${cleanContent}${cleanContent}`
    })
    html = html.replace(/\{[^{}]*&&\s*(<[\s\S]*?>[\s\S]*?<\/[\s\S]*?>)\}/g, '$1')
    html = html.replace(/\{[^{}]*\?\s*(<[\s\S]*?>[\s\S]*?<\/[\s\S]*?>)\s*:\s*(<[\s\S]*?>[\s\S]*?<\/[\s\S]*?>)\}/g, '$1')
    html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    html = html.replace(/className=/g, 'class=')
    html = html.replace(/\{`([^`]*)`\}/g, '$1')
    html = html.replace(/\{"([^"]*)"\}/g, '$1')
    html = html.replace(/<([A-Z][a-zA-Z0-9]*)\s/g, '<div data-component="$1" ')
    html = html.replace(/<([A-Z][a-zA-Z0-9]*)>/g, '<div data-component="$1">')
    html = html.replace(/<\/([A-Z][a-zA-Z0-9]*)>/g, '</div>')
    html = html.replace(/<([A-Z][a-zA-Z0-9]*)\s*\/>/g, '<div data-component="$1"></div>')
    html = html.replace(/\{[^{}]*\}/g, '')
    html = html.replace(/\s+(on[A-Z][a-zA-Z]*)=\{[^}]*\}/g, '')
    html = html.replace(/\s+ref=\{[^}]*\}/g, '')
    html = html.replace(/=\{([^}]*)\}/g, '="$1"')
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
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="font-semibold text-white">{projectName}</h1>
            <p className="text-xs text-slate-500 capitalize">{projectType?.replace('-', ' ')} Website</p>
          </div>
        </div>

        {/* Device Toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {[
            { mode: 'desktop' as const, icon: Monitor },
            { mode: 'tablet' as const, icon: Tablet },
            { mode: 'mobile' as const, icon: Smartphone },
          ].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setDeviceMode(mode)}
              className={cn(
                "p-2 rounded text-slate-400 transition",
                deviceMode === mode && 'bg-slate-700 text-white'
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "gap-2 text-slate-400 hover:text-white",
              showChat && 'bg-purple-900/50 text-purple-300'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewKey(k => k + 1)}
            className="gap-2 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
            className="gap-2 text-slate-400 hover:text-white"
          >
            {viewMode === 'preview' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="gap-2 text-slate-400 hover:text-white"
          >
            <Download className="w-4 h-4" />
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
        <div className="px-4 py-2 bg-green-900/50 border-b border-green-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-300">
            <span className="font-medium">Deployed!</span>
            <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {deployUrl}
            </a>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <div className={cn(
          "flex transition-all duration-300",
          sidebarCollapsed ? "w-14" : "w-80"
        )}>
          {/* Tab Icons */}
          <div className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-2 gap-1">
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (sidebarCollapsed) setSidebarCollapsed(false)
                }}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition group relative",
                  activeTab === tab.id && !sidebarCollapsed
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 hover:text-white hover:bg-slate-800"
                )}
                title={tab.label}
              >
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id && tab.color)} />
                {sidebarCollapsed && (
                  <div className="absolute left-12 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">
                    {tab.label}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          {!sidebarCollapsed && (
            <div className="flex-1 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
              {/* Panel Header */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                  {SIDEBAR_TABS.find(t => t.id === activeTab)?.label}
                </h3>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'components' && (
                  <ComponentLibrary onInsertComponent={handleInsertCode} />
                )}

                {activeTab === 'layers' && (
                  <DraggableComponentList
                    components={componentTree}
                    onReorder={handleReorderComponents}
                    onSelect={handleSelectComponent}
                    onToggleVisibility={handleToggleComponentVisibility}
                    onDuplicate={handleDuplicateComponent}
                    onDelete={handleDeleteComponent}
                    selectedId={selectedComponentId || undefined}
                  />
                )}

                {activeTab === 'embeds' && (
                  <EmbedWidgets onInsertCode={handleInsertCode} />
                )}

                {activeTab === 'integrations' && (
                  <IntegrationsSidebar
                    projectId={params.id}
                    savedKeys={userKeys}
                    onSaveKeys={handleSaveKeys}
                  />
                )}

                {activeTab === 'templates' && (
                  <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="useTemplate"
                        checked={useStaticTemplate}
                        onChange={(e) => setUseStaticTemplate(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-800"
                      />
                      <label htmlFor="useTemplate" className="text-sm text-slate-300">
                        Use static template (recommended)
                      </label>
                    </div>
                    {STATIC_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template.id)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition",
                          selectedTemplateId === template.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-slate-700 hover:border-slate-600"
                        )}
                      >
                        <div className="aspect-video bg-slate-800 rounded mb-2 overflow-hidden">
                          <div className={cn(
                            "w-full h-full",
                            template.id === 'modern-saas' && "bg-gradient-to-br from-purple-600 to-blue-600",
                            template.id === 'portfolio-minimal' && "bg-gradient-to-br from-slate-100 to-slate-200",
                            template.id === 'agency-bold' && "bg-gradient-to-br from-yellow-400 to-orange-500"
                          )} />
                        </div>
                        <h4 className="text-sm font-medium text-white">{template.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase">Project Name</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase">Project Type</label>
                      <p className="mt-1 text-white capitalize">{projectType?.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase">Files</label>
                      <p className="mt-1 text-white">{files.length} files</p>
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-medium text-slate-400 uppercase mb-2">Files</h4>
                      <div className="space-y-1">
                        {files.map((file) => (
                          <button
                            key={file.path}
                            onClick={() => {
                              setSelectedFile(file)
                              setViewMode('code')
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left text-slate-400 hover:bg-slate-800 hover:text-white rounded"
                          >
                            <FileCode className="w-3 h-3" />
                            <span className="truncate">{file.path}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-4 overflow-auto bg-slate-950">
          <div
            className="mx-auto bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{
              width: deviceWidths[deviceMode],
              maxWidth: '100%',
              minHeight: 'calc(100vh - 180px)'
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
                <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
                  {files.slice(0, 6).map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={cn(
                        "px-4 py-2 text-xs whitespace-nowrap border-r border-slate-800",
                        selectedFile?.path === file.path
                          ? "bg-slate-800 text-white"
                          : "text-slate-500 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      {file.path.split('/').pop()}
                    </button>
                  ))}
                </div>
                <div className="p-4 overflow-auto h-[calc(100%-40px)] bg-slate-950">
                  {selectedFile ? (
                    <CodeHighlighter
                      code={selectedFile.content}
                      language={
                        selectedFile.path.endsWith('.tsx') || selectedFile.path.endsWith('.ts')
                          ? 'typescript'
                          : selectedFile.path.endsWith('.css')
                          ? 'css'
                          : 'typescript'
                      }
                      showLineNumbers
                    />
                  ) : (
                    <p className="text-slate-500">Select a file to view</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel (Right) */}
        {showPropertiesPanel && selectedElement && (
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

// Inline Integrations Sidebar Component
function IntegrationsSidebar({
  projectId,
  savedKeys,
  onSaveKeys,
}: {
  projectId: string
  savedKeys: Record<string, string>
  onSaveKeys: (keys: Record<string, string>) => void
}) {
  const [keys, setKeys] = useState<Record<string, string>>(savedKeys)
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  const INTEGRATIONS = [
    { id: 'openai', name: 'OpenAI', key: 'OPENAI_API_KEY', placeholder: 'sk-...', category: 'AI', required: true },
    { id: 'anthropic', name: 'Anthropic', key: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-...', category: 'AI' },
    { id: 'google', name: 'Google AI', key: 'GOOGLE_AI_API_KEY', placeholder: 'AIza...', category: 'AI' },
    { id: 'stripe', name: 'Stripe', key: 'STRIPE_SECRET_KEY', placeholder: 'sk_...', category: 'Payments' },
    { id: 'stripe_webhook', name: 'Stripe Webhook', key: 'STRIPE_WEBHOOK_SECRET', placeholder: 'whsec_...', category: 'Payments' },
    { id: 'mongodb', name: 'MongoDB', key: 'MONGODB_URI', placeholder: 'mongodb+srv://...', category: 'Database', required: true },
    { id: 'sendgrid', name: 'SendGrid', key: 'SENDGRID_API_KEY', placeholder: 'SG...', category: 'Email' },
    { id: 'n8n', name: 'n8n Webhook', key: 'N8N_WEBHOOK_URL', placeholder: 'https://n8n.example.com/webhook/...', category: 'Automation' },
    { id: 'render', name: 'Render', key: 'RENDER_API_KEY', placeholder: 'rnd_...', category: 'Deploy' },
    { id: 'github', name: 'GitHub Token', key: 'GITHUB_TOKEN', placeholder: 'ghp_...', category: 'Deploy' },
    { id: 'nextauth', name: 'NextAuth Secret', key: 'NEXTAUTH_SECRET', placeholder: 'random-secret', category: 'Auth', required: true },
    { id: 'google_oauth', name: 'Google OAuth', key: 'GOOGLE_CLIENT_ID', placeholder: 'xxx.apps.googleusercontent.com', category: 'Auth' },
  ]

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))]

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveKeys(keys)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 space-y-4">
      <p className="text-xs text-slate-500">
        Add API keys for services you want to use
      </p>

      {categories.map(category => {
        const categoryIntegrations = INTEGRATIONS.filter(i => i.category === category)
        return (
          <div key={category}>
            <h4 className="text-xs font-medium text-slate-400 uppercase mb-2">{category}</h4>
            <div className="space-y-2">
              {categoryIntegrations.map(integration => (
                <div key={integration.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-300 flex-1">
                      {integration.name}
                      {integration.required && <span className="text-amber-400 ml-1">*</span>}
                    </label>
                    {keys[integration.key] && (
                      <span className="text-xs text-green-400">Connected</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type={showKey[integration.id] ? 'text' : 'password'}
                      value={keys[integration.key] || ''}
                      onChange={(e) => setKeys(prev => ({ ...prev, [integration.key]: e.target.value }))}
                      placeholder={integration.placeholder}
                      className="flex-1 px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-white font-mono"
                    />
                    <button
                      onClick={() => setShowKey(prev => ({ ...prev, [integration.id]: !prev[integration.id] }))}
                      className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-white text-xs"
                    >
                      {showKey[integration.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-purple-600 hover:bg-purple-700"
        size="sm"
      >
        {saving ? 'Saving...' : 'Save All Keys'}
      </Button>
    </div>
  )
}
