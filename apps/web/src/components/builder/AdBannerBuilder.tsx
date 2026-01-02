'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import {
  Image as ImageIcon,
  Type,
  Square,
  Download,
  Copy,
  Eye,
  Code,
  Palette,
  Layers,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Trash2,
  Plus,
  Settings,
  Smartphone,
  Monitor,
  LayoutGrid
} from 'lucide-react'

// Standard ad sizes
const AD_SIZES = {
  // Display Ads
  'leaderboard': { width: 728, height: 90, name: 'Leaderboard', category: 'Display' },
  'medium-rectangle': { width: 300, height: 250, name: 'Medium Rectangle', category: 'Display' },
  'large-rectangle': { width: 336, height: 280, name: 'Large Rectangle', category: 'Display' },
  'half-page': { width: 300, height: 600, name: 'Half Page', category: 'Display' },
  'wide-skyscraper': { width: 160, height: 600, name: 'Wide Skyscraper', category: 'Display' },
  'skyscraper': { width: 120, height: 600, name: 'Skyscraper', category: 'Display' },
  'billboard': { width: 970, height: 250, name: 'Billboard', category: 'Display' },
  'large-leaderboard': { width: 970, height: 90, name: 'Large Leaderboard', category: 'Display' },
  'square': { width: 250, height: 250, name: 'Square', category: 'Display' },
  'small-square': { width: 200, height: 200, name: 'Small Square', category: 'Display' },

  // Social Media
  'facebook-feed': { width: 1200, height: 628, name: 'Facebook Feed', category: 'Social' },
  'facebook-story': { width: 1080, height: 1920, name: 'Facebook Story', category: 'Social' },
  'instagram-feed': { width: 1080, height: 1080, name: 'Instagram Feed', category: 'Social' },
  'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story', category: 'Social' },
  'twitter-post': { width: 1200, height: 675, name: 'Twitter Post', category: 'Social' },
  'linkedin-post': { width: 1200, height: 627, name: 'LinkedIn Post', category: 'Social' },
  'youtube-thumbnail': { width: 1280, height: 720, name: 'YouTube Thumbnail', category: 'Social' },
  'pinterest-pin': { width: 1000, height: 1500, name: 'Pinterest Pin', category: 'Social' },

  // Email
  'email-header': { width: 600, height: 200, name: 'Email Header', category: 'Email' },
  'email-banner': { width: 600, height: 300, name: 'Email Banner', category: 'Email' }
}

type AdSize = keyof typeof AD_SIZES

interface AdElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'button'
  x: number
  y: number
  width: number
  height: number
  content: Record<string, any>
  styles: Record<string, string | number>
  zIndex: number
}

interface AdDesign {
  id: string
  name: string
  size: AdSize
  backgroundColor: string
  backgroundImage?: string
  backgroundGradient?: string
  elements: AdElement[]
}

// Pre-built ad templates
const AD_TEMPLATES: Record<string, Partial<AdDesign>> = {
  blank: {
    name: 'Blank Canvas',
    backgroundColor: '#ffffff',
    elements: []
  },
  sale: {
    name: 'Sale Banner',
    backgroundColor: '#dc2626',
    elements: [
      {
        id: 'text-1',
        type: 'text',
        x: 20,
        y: 30,
        width: 260,
        height: 60,
        content: { text: 'SALE' },
        styles: { fontSize: 48, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Impact' },
        zIndex: 2
      },
      {
        id: 'text-2',
        type: 'text',
        x: 20,
        y: 90,
        width: 260,
        height: 40,
        content: { text: 'Up to 50% OFF' },
        styles: { fontSize: 24, fontWeight: 'bold', color: '#fef08a', fontFamily: 'Arial' },
        zIndex: 2
      },
      {
        id: 'button-1',
        type: 'button',
        x: 20,
        y: 150,
        width: 120,
        height: 40,
        content: { text: 'Shop Now', url: '#' },
        styles: { backgroundColor: '#ffffff', color: '#dc2626', borderRadius: 4, fontWeight: 'bold' },
        zIndex: 2
      }
    ]
  },
  product: {
    name: 'Product Showcase',
    backgroundColor: '#f8fafc',
    elements: [
      {
        id: 'image-1',
        type: 'image',
        x: 150,
        y: 25,
        width: 130,
        height: 130,
        content: { src: 'https://via.placeholder.com/200' },
        styles: { borderRadius: 8 },
        zIndex: 1
      },
      {
        id: 'text-1',
        type: 'text',
        x: 15,
        y: 30,
        width: 130,
        height: 40,
        content: { text: 'New Arrival' },
        styles: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', fontFamily: 'Arial' },
        zIndex: 2
      },
      {
        id: 'text-2',
        type: 'text',
        x: 15,
        y: 70,
        width: 130,
        height: 30,
        content: { text: '$99.99' },
        styles: { fontSize: 28, fontWeight: 'bold', color: '#059669', fontFamily: 'Arial' },
        zIndex: 2
      },
      {
        id: 'button-1',
        type: 'button',
        x: 15,
        y: 110,
        width: 100,
        height: 35,
        content: { text: 'Buy Now', url: '#' },
        styles: { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: 6, fontWeight: '500' },
        zIndex: 2
      }
    ]
  },
  gradient: {
    name: 'Gradient Modern',
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    elements: [
      {
        id: 'text-1',
        type: 'text',
        x: 20,
        y: 50,
        width: 260,
        height: 50,
        content: { text: 'Your Brand' },
        styles: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Arial' },
        zIndex: 2
      },
      {
        id: 'text-2',
        type: 'text',
        x: 20,
        y: 100,
        width: 260,
        height: 30,
        content: { text: 'Catchy tagline goes here' },
        styles: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontFamily: 'Arial' },
        zIndex: 2
      },
      {
        id: 'button-1',
        type: 'button',
        x: 20,
        y: 150,
        width: 110,
        height: 36,
        content: { text: 'Learn More', url: '#' },
        styles: { backgroundColor: '#ffffff', color: '#667eea', borderRadius: 18, fontWeight: '600' },
        zIndex: 2
      }
    ]
  }
}

interface AdBannerBuilderProps {
  onSave?: (design: AdDesign) => void
  onExport?: (format: 'html' | 'png' | 'jpg') => void
  initialDesign?: Partial<AdDesign>
}

export function AdBannerBuilder({ onSave, onExport, initialDesign }: AdBannerBuilderProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [design, setDesign] = useState<AdDesign>({
    id: crypto.randomUUID(),
    name: initialDesign?.name || 'Untitled Ad',
    size: initialDesign?.size || 'medium-rectangle',
    backgroundColor: initialDesign?.backgroundColor || '#ffffff',
    backgroundImage: initialDesign?.backgroundImage,
    backgroundGradient: initialDesign?.backgroundGradient,
    elements: initialDesign?.elements || []
  })

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit')
  const [showSizeSelector, setShowSizeSelector] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [dragState, setDragState] = useState<{ elementId: string; startX: number; startY: number } | null>(null)

  const selectedElement = useMemo(() => {
    return design.elements.find(e => e.id === selectedElementId)
  }, [design.elements, selectedElementId])

  const adSize = AD_SIZES[design.size]

  const addElement = useCallback((type: AdElement['type']) => {
    const newElement: AdElement = {
      id: crypto.randomUUID(),
      type,
      x: 20,
      y: 20,
      width: type === 'text' ? 200 : type === 'button' ? 120 : 100,
      height: type === 'text' ? 40 : type === 'button' ? 40 : 100,
      content: getDefaultElementContent(type),
      styles: getDefaultElementStyles(type),
      zIndex: design.elements.length + 1
    }
    setDesign(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }))
    setSelectedElementId(newElement.id)
  }, [design.elements.length])

  const updateElement = useCallback((elementId: string, updates: Partial<AdElement>) => {
    setDesign(prev => ({
      ...prev,
      elements: prev.elements.map(e =>
        e.id === elementId ? { ...e, ...updates } : e
      )
    }))
  }, [])

  const deleteElement = useCallback((elementId: string) => {
    setDesign(prev => ({
      ...prev,
      elements: prev.elements.filter(e => e.id !== elementId)
    }))
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }, [selectedElementId])

  const loadTemplate = useCallback((templateKey: string) => {
    const template = AD_TEMPLATES[templateKey]
    if (template) {
      setDesign(prev => ({
        ...prev,
        name: template.name || prev.name,
        backgroundColor: template.backgroundColor || prev.backgroundColor,
        backgroundGradient: template.backgroundGradient,
        backgroundImage: template.backgroundImage,
        elements: (template.elements || []).map(e => ({ ...e, id: crypto.randomUUID() }))
      }))
      setShowTemplates(false)
    }
  }, [])

  // Handle element dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    setSelectedElementId(elementId)
    setDragState({
      elementId,
      startX: e.clientX,
      startY: e.clientY
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return

    const element = design.elements.find(el => el.id === dragState.elementId)
    if (!element) return

    const dx = e.clientX - dragState.startX
    const dy = e.clientY - dragState.startY

    // Get scale factor from canvas
    const canvas = canvasRef.current
    const scale = canvas ? canvas.offsetWidth / adSize.width : 1

    updateElement(dragState.elementId, {
      x: Math.max(0, Math.min(adSize.width - element.width, element.x + dx / scale)),
      y: Math.max(0, Math.min(adSize.height - element.height, element.y + dy / scale))
    })

    setDragState({
      ...dragState,
      startX: e.clientX,
      startY: e.clientY
    })
  }, [dragState, design.elements, adSize, updateElement])

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  // Generate HTML output
  const generateHTML = useCallback((): string => {
    const { backgroundColor, backgroundGradient, backgroundImage, elements } = design

    const bgStyle = backgroundGradient || (backgroundImage ? `url(${backgroundImage})` : backgroundColor)

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .ad-container {
      position: relative;
      width: ${adSize.width}px;
      height: ${adSize.height}px;
      background: ${bgStyle};
      background-size: cover;
      background-position: center;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }
    .ad-element {
      position: absolute;
    }
    .ad-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      cursor: pointer;
      border: none;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="ad-container">
    ${elements.map(element => {
      const baseStyles = `
        left: ${element.x}px;
        top: ${element.y}px;
        width: ${element.width}px;
        height: ${element.height}px;
        z-index: ${element.zIndex};
      `

      switch (element.type) {
        case 'text':
          return `<div class="ad-element" style="${baseStyles} font-size: ${element.styles.fontSize || 16}px; font-weight: ${element.styles.fontWeight || 'normal'}; color: ${element.styles.color || '#000'}; font-family: ${element.styles.fontFamily || 'Arial'}; display: flex; align-items: center;">${element.content.text || ''}</div>`

        case 'image':
          return `<img class="ad-element" src="${element.content.src || ''}" alt="${element.content.alt || ''}" style="${baseStyles} object-fit: cover; border-radius: ${element.styles.borderRadius || 0}px;">`

        case 'button':
          return `<a class="ad-element ad-button" href="${element.content.url || '#'}" style="${baseStyles} background-color: ${element.styles.backgroundColor || '#000'}; color: ${element.styles.color || '#fff'}; border-radius: ${element.styles.borderRadius || 0}px; font-weight: ${element.styles.fontWeight || 'normal'}; font-size: ${element.styles.fontSize || 14}px;">${element.content.text || 'Click'}</a>`

        case 'shape':
          return `<div class="ad-element" style="${baseStyles} background-color: ${element.styles.backgroundColor || '#000'}; border-radius: ${element.styles.borderRadius || 0}px;"></div>`

        default:
          return ''
      }
    }).join('\n    ')}
  </div>
</body>
</html>`
  }, [design, adSize])

  const handleExport = useCallback(async (format: 'html' | 'png' | 'jpg') => {
    if (format === 'html') {
      const html = generateHTML()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${design.name.toLowerCase().replace(/\s+/g, '-')}.html`
      a.click()
      URL.revokeObjectURL(url)
    }
    // PNG/JPG export would require html2canvas or similar
    onExport?.(format)
  }, [generateHTML, design.name, onExport])

  const handleCopyCode = useCallback(async () => {
    const html = generateHTML()
    await navigator.clipboard.writeText(html)
  }, [generateHTML])

  // Size selector
  if (showSizeSelector) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0f]">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-purple-400" />
            Choose Ad Size
          </h2>
          <p className="mt-2 text-sm text-gray-400">Select a size for your ad banner</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {(['Display', 'Social', 'Email'] as const).map(category => (
            <div key={category} className="mb-8">
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">{category} Ads</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(AD_SIZES)
                  .filter(([_, size]) => size.category === category)
                  .map(([key, size]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setDesign(prev => ({ ...prev, size: key as AdSize }))
                        setShowSizeSelector(false)
                        setShowTemplates(true)
                      }}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-purple-500/50 transition-all group"
                    >
                      <div className="aspect-video mb-3 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg flex items-center justify-center overflow-hidden">
                        <div
                          className="bg-purple-500/20 border border-purple-500/30 rounded"
                          style={{
                            width: Math.min(size.width / 10, 100),
                            height: Math.min(size.height / 10, 60)
                          }}
                        />
                      </div>
                      <h4 className="font-medium text-white text-sm">{size.name}</h4>
                      <p className="text-xs text-gray-500">{size.width} x {size.height}</p>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Template selector
  if (showTemplates) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0f]">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-3">
            <Layers className="w-6 h-6 text-purple-400" />
            Choose Template
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {adSize.name} ({adSize.width} x {adSize.height})
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(AD_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => loadTemplate(key)}
                className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-purple-500/50 transition-all group"
              >
                <div
                  className="aspect-[4/3] mb-3 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{
                    background: template.backgroundGradient || template.backgroundColor || '#e5e7eb'
                  }}
                >
                  <span className="text-2xl font-bold" style={{ color: key === 'blank' ? '#6b7280' : '#ffffff' }}>
                    {key === 'blank' ? '+' : 'Aa'}
                  </span>
                </div>
                <h4 className="font-medium text-white text-sm">{template.name}</h4>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setShowSizeSelector(true)}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Change size
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSizeSelector(true)}
            className="text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded"
          >
            {adSize.name} ({adSize.width}x{adSize.height})
          </button>
          <input
            type="text"
            value={design.name}
            onChange={(e) => setDesign(prev => ({ ...prev, name: e.target.value }))}
            className="bg-transparent text-white font-medium focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-lg p-1">
            {(['edit', 'preview', 'code'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode === 'edit' ? 'Edit' : mode === 'preview' ? 'Preview' : 'Code'}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
            title="Copy HTML"
          >
            <Copy className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleExport('html')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'edit' && (
          <>
            {/* Element palette */}
            <div className="w-56 border-r border-white/10 p-4 overflow-y-auto">
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">Add Element</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  { type: 'text' as const, icon: <Type className="w-4 h-4" />, label: 'Text' },
                  { type: 'image' as const, icon: <ImageIcon className="w-4 h-4" />, label: 'Image' },
                  { type: 'button' as const, icon: <Square className="w-4 h-4" />, label: 'Button' },
                  { type: 'shape' as const, icon: <Square className="w-4 h-4" />, label: 'Shape' }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addElement(item.type)}
                    className="p-3 bg-white/5 border border-white/10 rounded-lg text-center hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="text-gray-400 group-hover:text-purple-400 mb-1 flex justify-center">
                      {item.icon}
                    </div>
                    <span className="text-xs text-gray-500 group-hover:text-gray-300">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Background settings */}
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">Background</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Color</label>
                  <input
                    type="color"
                    value={design.backgroundColor}
                    onChange={(e) => setDesign(prev => ({ ...prev, backgroundColor: e.target.value, backgroundGradient: undefined }))}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Image URL</label>
                  <input
                    type="text"
                    value={design.backgroundImage || ''}
                    onChange={(e) => setDesign(prev => ({ ...prev, backgroundImage: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Templates button */}
              <button
                onClick={() => setShowTemplates(true)}
                className="mt-6 w-full py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Browse Templates
              </button>
            </div>

            {/* Canvas */}
            <div
              className="flex-1 overflow-auto p-6 bg-[#1a1a2e] flex items-center justify-center"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={canvasRef}
                className="relative shadow-2xl"
                style={{
                  width: Math.min(adSize.width, 800),
                  height: (Math.min(adSize.width, 800) / adSize.width) * adSize.height,
                  background: design.backgroundGradient || (design.backgroundImage ? `url(${design.backgroundImage})` : design.backgroundColor),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onClick={() => setSelectedElementId(null)}
              >
                {design.elements.map((element) => {
                  const scale = Math.min(adSize.width, 800) / adSize.width
                  return (
                    <div
                      key={element.id}
                      className={`absolute cursor-move ${
                        selectedElementId === element.id ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' : ''
                      }`}
                      style={{
                        left: element.x * scale,
                        top: element.y * scale,
                        width: element.width * scale,
                        height: element.height * scale,
                        zIndex: element.zIndex
                      }}
                      onMouseDown={(e) => handleMouseDown(e, element.id)}
                    >
                      {renderElementPreview(element, scale)}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Properties panel */}
            {selectedElement && (
              <div className="w-64 border-l border-white/10 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white">
                    Edit {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
                  </h3>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <ElementEditor
                  element={selectedElement}
                  onChange={(updates) => updateElement(selectedElement.id, updates)}
                  adSize={adSize}
                />
              </div>
            )}
          </>
        )}

        {viewMode === 'preview' && (
          <div className="flex-1 overflow-auto p-6 bg-[#1a1a2e] flex items-center justify-center">
            <iframe
              srcDoc={generateHTML()}
              className="shadow-2xl"
              style={{
                width: adSize.width,
                height: adSize.height,
                border: 'none',
                transform: adSize.width > 800 ? `scale(${800 / adSize.width})` : 'none',
                transformOrigin: 'center center'
              }}
            />
          </div>
        )}

        {viewMode === 'code' && (
          <div className="flex-1 overflow-auto p-4">
            <pre className="p-4 bg-[#1a1a2e] rounded-lg text-sm text-gray-300 font-mono overflow-auto h-full">
              {generateHTML()}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
function getDefaultElementContent(type: AdElement['type']): Record<string, any> {
  switch (type) {
    case 'text':
      return { text: 'Your Text' }
    case 'image':
      return { src: 'https://via.placeholder.com/200', alt: 'Image' }
    case 'button':
      return { text: 'Click Here', url: '#' }
    case 'shape':
      return {}
    default:
      return {}
  }
}

function getDefaultElementStyles(type: AdElement['type']): Record<string, string | number> {
  switch (type) {
    case 'text':
      return { fontSize: 24, fontWeight: 'bold', color: '#000000', fontFamily: 'Arial' }
    case 'image':
      return { borderRadius: 0 }
    case 'button':
      return { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: 6, fontWeight: '500', fontSize: 14 }
    case 'shape':
      return { backgroundColor: '#6366f1', borderRadius: 0 }
    default:
      return {}
  }
}

function renderElementPreview(element: AdElement, scale: number): React.ReactNode {
  const scaledFontSize = (element.styles.fontSize as number || 16) * scale

  switch (element.type) {
    case 'text':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            fontSize: scaledFontSize,
            fontWeight: element.styles.fontWeight as any,
            color: element.styles.color as string,
            fontFamily: element.styles.fontFamily as string,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {element.content.text}
        </div>
      )

    case 'image':
      return (
        <img
          src={element.content.src}
          alt={element.content.alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: element.styles.borderRadius
          }}
        />
      )

    case 'button':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.styles.backgroundColor as string,
            color: element.styles.color as string,
            borderRadius: element.styles.borderRadius,
            fontWeight: element.styles.fontWeight as any,
            fontSize: scaledFontSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {element.content.text}
        </div>
      )

    case 'shape':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.styles.backgroundColor as string,
            borderRadius: element.styles.borderRadius
          }}
        />
      )

    default:
      return null
  }
}

// Element editor component
function ElementEditor({
  element,
  onChange,
  adSize
}: {
  element: AdElement
  onChange: (updates: Partial<AdElement>) => void
  adSize: { width: number; height: number }
}) {
  const updateContent = (key: string, value: any) => {
    onChange({ content: { ...element.content, [key]: value } })
  }

  const updateStyles = (key: string, value: any) => {
    onChange({ styles: { ...element.styles, [key]: value } })
  }

  return (
    <div className="space-y-4">
      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1">X</label>
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => onChange({ x: Math.max(0, Math.min(adSize.width - element.width, parseInt(e.target.value) || 0)) })}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Y</label>
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) => onChange({ y: Math.max(0, Math.min(adSize.height - element.height, parseInt(e.target.value) || 0)) })}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Width</label>
          <input
            type="number"
            value={element.width}
            onChange={(e) => onChange({ width: Math.max(10, parseInt(e.target.value) || 10) })}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Height</label>
          <input
            type="number"
            value={element.height}
            onChange={(e) => onChange({ height: Math.max(10, parseInt(e.target.value) || 10) })}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
          />
        </div>
      </div>

      {/* Type-specific fields */}
      {element.type === 'text' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Text</label>
            <textarea
              value={element.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Font Size</label>
            <input
              type="number"
              value={element.styles.fontSize || 16}
              onChange={(e) => updateStyles('fontSize', parseInt(e.target.value) || 16)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Font Weight</label>
            <select
              value={element.styles.fontWeight || 'normal'}
              onChange={(e) => updateStyles('fontWeight', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
            >
              <option value="normal">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Color</label>
            <input
              type="color"
              value={element.styles.color as string || '#000000'}
              onChange={(e) => updateStyles('color', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </>
      )}

      {element.type === 'image' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Image URL</label>
            <input
              type="text"
              value={element.content.src || ''}
              onChange={(e) => updateContent('src', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Border Radius</label>
            <input
              type="number"
              value={element.styles.borderRadius || 0}
              onChange={(e) => updateStyles('borderRadius', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
            />
          </div>
        </>
      )}

      {element.type === 'button' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Button Text</label>
            <input
              type="text"
              value={element.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">URL</label>
            <input
              type="text"
              value={element.content.url || ''}
              onChange={(e) => updateContent('url', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Background Color</label>
            <input
              type="color"
              value={element.styles.backgroundColor as string || '#6366f1'}
              onChange={(e) => updateStyles('backgroundColor', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Text Color</label>
            <input
              type="color"
              value={element.styles.color as string || '#ffffff'}
              onChange={(e) => updateStyles('color', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Border Radius</label>
            <input
              type="number"
              value={element.styles.borderRadius || 0}
              onChange={(e) => updateStyles('borderRadius', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
            />
          </div>
        </>
      )}

      {element.type === 'shape' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Background Color</label>
            <input
              type="color"
              value={element.styles.backgroundColor as string || '#6366f1'}
              onChange={(e) => updateStyles('backgroundColor', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Border Radius</label>
            <input
              type="number"
              value={element.styles.borderRadius || 0}
              onChange={(e) => updateStyles('borderRadius', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
            />
          </div>
        </>
      )}
    </div>
  )
}

export default AdBannerBuilder
