'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send,
  Loader2,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  Code2,
  Eye,
  Download,
  Rocket,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Wand2,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Zap,
  MessageSquare,
  X,
  ChevronRight,
  Settings,
  Sun,
  Moon,
  Plug,
  MousePointer2,
  Target,
  Paperclip,
  ImagePlus,
  Maximize2,
  Minimize2,
  FileCode2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PluginsPanel, Plugin } from '@/components/builder/PluginsPanel'
import { MediaPanel } from '@/components/builder/MediaPanel'

type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type ViewMode = 'preview' | 'code'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  generating?: boolean
  images?: string[] // URLs for attached images
}

// Parse message content and extract code blocks
function parseMessageContent(content: string): { text: string; codeBlocks: { lang: string; code: string }[] } {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const codeBlocks: { lang: string; code: string }[] = []
  let text = content

  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({ lang: match[1] || 'code', code: match[2].trim() })
  }

  // Remove code blocks from text
  text = content.replace(codeBlockRegex, '').trim()

  return { text, codeBlocks }
}

// Collapsible code block component
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lineCount = code.split('\n').length

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs bg-slate-800/50 hover:bg-slate-800 transition"
      >
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-300 font-medium">{lang.toUpperCase()}</span>
          <span className="text-slate-500">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy() }}
            className="p-1 hover:bg-white/10 rounded"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-90")} />
        </div>
      </button>
      {isExpanded && (
        <pre className="p-3 text-xs text-slate-300 overflow-x-auto max-h-60 overflow-y-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

interface GeneratedCode {
  html: string
  css: string
  js?: string
}

const DEVICE_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

interface EnvVariable {
  key: string
  value: string
  isSecret: boolean
}

// Starter prompts for inspiration
const STARTER_PROMPTS = [
  "Build a modern SaaS landing page with hero, features, pricing, and testimonials",
  "Create a portfolio website for a photographer with a gallery and contact form",
  "Design an e-commerce homepage for a fashion brand with product grid",
  "Make a restaurant website with menu, reservations, and location",
  "Build a startup landing page with waitlist signup and feature showcase",
]

export default function AIBuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({ html: '', css: '' })
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [projectName, setProjectName] = useState('Untitled Project')
  const [showCode, setShowCode] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  const [showPlugins, setShowPlugins] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [attachedImages, setAttachedImages] = useState<{ file: File; preview: string; base64?: string }[]>([])
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load environment variables from credentials page
  useEffect(() => {
    const loadEnvVariables = () => {
      const stored = localStorage.getItem('projectEnvVariables')
      if (stored) {
        try {
          setEnvVariables(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to load env variables')
        }
      }
    }
    loadEnvVariables()

    // Listen for storage changes (if user updates in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'projectEnvVariables') {
        loadEnvVariables()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Load project and initial prompt
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          const project = data.project
          setProjectName(project?.name || 'Untitled Project')

          // Get initial prompt from project config
          if (project?.config?.prompt) {
            setInitialPrompt(project.config.prompt)
          } else if (project?.description) {
            setInitialPrompt(project.description)
          }
        }
      } catch (error) {
        console.log('New project')
      }
    }
    loadProject()
  }, [params.id])

  // Auto-start generation if we have an initial prompt
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      handleSendMessage(initialPrompt)
      setInitialPrompt(null)
    }
  }, [initialPrompt, messages.length])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update iframe when code changes, edit mode changes, or env variables change
  useEffect(() => {
    if (iframeRef.current && generatedCode.html) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(generateFullHTML(generatedCode, editMode))
        doc.close()
      }
    }
  }, [generatedCode, editMode, envVariables])

  // Listen for messages from iframe (element selection)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'element-selected') {
        const el = event.data.element
        setSelectedElement(el.description)
        // Pre-fill the input with a reference to the element
        setInput(prev => prev ? prev : `For the ${el.description}, `)
        inputRef.current?.focus()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Handle image attachment
  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newImages = await Promise.all(
      files.slice(0, 3).map(async (file) => { // Max 3 images
        const preview = URL.createObjectURL(file)
        const base64 = await fileToBase64(file)
        return { file, preview, base64 }
      })
    )
    setAttachedImages(prev => [...prev, ...newImages].slice(0, 3))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:image/xxx;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setAttachedImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  // Analyze images with OpenAI Vision
  const analyzeImages = async (): Promise<string> => {
    if (attachedImages.length === 0) return ''

    setIsAnalyzingImage(true)
    try {
      const analyses = await Promise.all(
        attachedImages.map(async (img) => {
          const res = await fetch('/api/ai/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: img.base64 }),
          })
          if (!res.ok) throw new Error('Image analysis failed')
          const data = await res.json()
          return data.analysis
        })
      )
      return analyses.join('\n\n---\n\n')
    } catch (error) {
      console.error('Image analysis error:', error)
      return '[Image attached but analysis failed]'
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  const generateFullHTML = (code: GeneratedCode, withEditMode = false) => {
    // Inject environment variables into the preview
    const envScript = envVariables.length > 0 ? `
    <script>
      // Environment variables injected from credentials
      window.__ENV__ = ${JSON.stringify(
        envVariables.reduce((acc, v) => {
          if (v.key && v.value) {
            acc[v.key] = v.value
          }
          return acc
        }, {} as Record<string, string>)
      )};
      // Also expose as process.env for compatibility
      window.process = window.process || {};
      window.process.env = window.__ENV__;

      // Helper function to get env variable
      window.getEnv = function(key, defaultValue) {
        return window.__ENV__[key] || defaultValue || '';
      };

      console.log('[WebCraft] Environment variables loaded:', Object.keys(window.__ENV__).length);
    </script>
    ` : ''

    const editModeScript = withEditMode ? `
    <style>
      .element-hover { outline: 2px dashed #a855f7 !important; outline-offset: 2px; cursor: pointer !important; }
      .element-selected { outline: 3px solid #a855f7 !important; outline-offset: 2px; background: rgba(168, 85, 247, 0.1) !important; }
    </style>
    <script>
      let selectedEl = null;
      document.body.addEventListener('mouseover', (e) => {
        if (e.target !== document.body) {
          e.target.classList.add('element-hover');
        }
      });
      document.body.addEventListener('mouseout', (e) => {
        e.target.classList.remove('element-hover');
      });
      document.body.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedEl) selectedEl.classList.remove('element-selected');
        selectedEl = e.target;
        selectedEl.classList.add('element-selected');

        // Get element info
        const tag = e.target.tagName.toLowerCase();
        const text = e.target.innerText?.slice(0, 50) || '';
        const classes = e.target.className.replace('element-hover', '').replace('element-selected', '').trim();

        // Send to parent
        window.parent.postMessage({
          type: 'element-selected',
          element: {
            tag,
            text: text.length > 40 ? text.slice(0, 40) + '...' : text,
            classes: classes.slice(0, 100),
            description: tag + (text ? ': "' + (text.length > 30 ? text.slice(0, 30) + '...' : text) + '"' : '')
          }
        }, '*');
      }, true);
    </script>
    ` : '';

    // Script to fix images dynamically - improved handling
    const imageFixScript = `
    <script>
      // Placeholder gradient colors
      const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      ];

      function getRandomGradient() {
        return gradients[Math.floor(Math.random() * gradients.length)];
      }

      // Fix all images on load
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img').forEach((img, index) => {
          if (!img.src || img.src === 'about:blank') {
            // No source - show placeholder immediately
            showPlaceholder(img, index);
            return;
          }

          // Set referrer policy for all images
          img.referrerPolicy = 'no-referrer';

          // Add error handler with fallback
          img.onerror = function() {
            showPlaceholder(this, index);
          };

          // Check if image is already broken
          if (img.complete && img.naturalHeight === 0) {
            showPlaceholder(img, index);
          }
        });
      });

      function showPlaceholder(img, index) {
        const parent = img.parentElement;
        const placeholder = document.createElement('div');
        placeholder.style.cssText = \`
          background: \${gradients[index % gradients.length]};
          width: 100%;
          min-height: 200px;
          height: \${img.height ? img.height + 'px' : 'auto'};
          aspect-ratio: 16/9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        \`;
        placeholder.textContent = img.alt || 'Image';
        img.style.display = 'none';
        img.insertAdjacentElement('afterend', placeholder);
      }

      // Watch for dynamically added images
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.tagName === 'IMG') {
              node.referrerPolicy = 'no-referrer';
              node.onerror = function() { showPlaceholder(this, 0); };
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    </script>
    `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data: blob: 'unsafe-inline'; media-src * data: blob:; font-src * data:;">
  <title>${projectName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  ${envScript}
  <style>
    * { font-family: 'Inter', sans-serif; }
    img {
      max-width: 100%;
      height: auto;
    }
    /* Placeholder for broken images */
    img[alt]:not([src]), img[src=""] {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100px;
    }
    ${code.css}
  </style>
  ${editModeScript}
</head>
<body class="antialiased">
  ${code.html}
  ${code.js ? `<script>${code.js}</script>` : ''}
  ${imageFixScript}
</body>
</html>`
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if ((!text && attachedImages.length === 0) || isGenerating) return

    // Save image previews for the message before clearing
    const messageImages = attachedImages.map(img => img.preview)

    // Analyze attached images first
    let imageContext = ''
    if (attachedImages.length > 0) {
      setIsGenerating(true)
      imageContext = await analyzeImages()
      // Clear images from input (previews are kept in messageImages for display)
      setAttachedImages([])
      // Note: Don't revoke URLs here - they're needed to display in the message
    }

    // Combine user text with image analysis
    const finalPrompt = imageContext
      ? `${text || 'Build a website based on this design'}\n\n[IMAGE ANALYSIS]:\n${imageContext}`
      : text

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || 'Build based on attached image',
      timestamp: new Date(),
      images: messageImages.length > 0 ? messageImages : undefined,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)

    // Add generating message
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      generating: true,
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      // Build context from previous messages
      const context = messages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/ai/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          context,
          currentCode: generatedCode,
          projectId: params.id,
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      let codeBuffer = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'text') {
                  fullResponse += data.content
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullResponse, generating: true }
                      : m
                  ))
                } else if (data.type === 'code') {
                  codeBuffer += data.content
                } else if (data.type === 'complete') {
                  // Parse and update code
                  if (data.code) {
                    setGeneratedCode(data.code)
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Mark as complete
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: fullResponse || "I've updated your website. Check out the preview!", generating: false }
          : m
      ))

    } catch (error) {
      console.error('Generation error:', error)
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: "Sorry, I encountered an error. Please try again.", generating: false }
          : m
      ))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyCode = () => {
    const fullCode = generateFullHTML(generatedCode)
    navigator.clipboard.writeText(fullCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleExport = () => {
    const fullCode = generateFullHTML(generatedCode)
    const blob = new Blob([fullCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePluginSelect = (plugin: Plugin) => {
    // Build the prompt from the plugin
    const prompt = plugin.example
      ? `${plugin.prompt} ${plugin.example}`
      : plugin.prompt

    setInput(prompt)
    setShowPlugins(false)

    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  // Handle media insertion from MediaPanel
  const handleMediaInsert = (url: string, type: 'image' | 'video' | 'audio') => {
    let newHtml = generatedCode.html

    if (type === 'image') {
      // Add image to the current HTML
      const imgHtml = `\n<img src="${url}" alt="Generated image" class="w-full max-w-2xl mx-auto rounded-xl shadow-lg" />\n`
      newHtml = newHtml + imgHtml
    } else if (type === 'video') {
      const videoHtml = `\n<video src="${url}" controls class="w-full max-w-2xl mx-auto rounded-xl shadow-lg"></video>\n`
      newHtml = newHtml + videoHtml
    } else if (type === 'audio') {
      const audioHtml = `\n<audio src="${url}" controls class="w-full max-w-md mx-auto"></audio>\n`
      newHtml = newHtml + audioHtml
    }

    setGeneratedCode({ ...generatedCode, html: newHtml })
    setShowMedia(false)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded px-2 py-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Env Variables Indicator */}
          {envVariables.length > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium"
              title={`${envVariables.length} environment variable${envVariables.length > 1 ? 's' : ''} loaded`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              .env ({envVariables.length})
            </div>
          )}

          {/* Device Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setDeviceMode(mode)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  deviceMode === mode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {mode === 'desktop' && <Monitor className="w-4 h-4" />}
                {mode === 'tablet' && <Tablet className="w-4 h-4" />}
                {mode === 'mobile' && <Smartphone className="w-4 h-4" />}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/10" />

          {/* Edit Mode Toggle */}
          <button
            onClick={() => {
              setEditMode(!editMode)
              if (!editMode) setSelectedElement(null)
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              editMode
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            )}
          >
            <MousePointer2 className="w-4 h-4" />
            {editMode ? 'Click Elements' : 'Select'}
          </button>

          <div className="h-6 w-px bg-white/10" />

          {/* View Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'preview' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <Eye className="w-4 h-4 inline mr-1.5" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'code' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <Code2 className="w-4 h-4 inline mr-1.5" />
              Code
            </button>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <Button variant="ghost" size="sm" onClick={handleCopyCode} className="text-slate-400 hover:text-white">
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExport} className="text-slate-400 hover:text-white">
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="text-slate-400 hover:text-white"
            title="Full-screen preview"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Rocket className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[420px] flex flex-col border-r border-white/10 bg-slate-900/30">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">AI Website Builder</h2>
                <p className="text-xs text-slate-400">Describe what you want to build</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">What would you like to build?</h3>
                  <p className="text-sm text-slate-400 mb-2">
                    Describe your website or attach a reference image
                  </p>
                  <p className="text-xs text-slate-500">
                    Upload a design mockup to recreate it
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Try these:</p>
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-purple-500/30 transition-all text-sm text-slate-300 hover:text-white"
                    >
                      <Sparkles className="w-4 h-4 inline mr-2 text-purple-400" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const parsed = message.role === 'assistant' && !message.generating
                  ? parseMessageContent(message.content)
                  : null

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-200'
                      )}
                    >
                      {/* User message images */}
                      {message.role === 'user' && message.images && message.images.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {message.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Attached ${i + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-white/20"
                            />
                          ))}
                        </div>
                      )}

                      {message.generating ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm">
                            {message.content ? message.content.slice(0, 100) : 'Building...'}
                          </span>
                        </div>
                      ) : parsed ? (
                        // Assistant message with parsed content
                        <div>
                          {parsed.text && (
                            <p className="text-sm whitespace-pre-wrap">{parsed.text}</p>
                          )}
                          {parsed.codeBlocks.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {parsed.codeBlocks.map((block, i) => (
                                <CodeBlock key={i} lang={block.lang} code={block.code} />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium">You</span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageAttach}
              className="hidden"
            />

            {/* Attached Images Preview */}
            {attachedImages.length > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-slate-800/50 border border-white/10">
                {attachedImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Attached ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-white/20"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {isAnalyzingImage && (
                  <div className="flex items-center gap-2 text-sm text-purple-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </div>
                )}
              </div>
            )}

            {/* Selected Element Indicator */}
            {selectedElement && editMode && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 flex-1 truncate">
                  Selected: <span className="font-medium text-white">{selectedElement}</span>
                </span>
                <button
                  onClick={() => setSelectedElement(null)}
                  className="text-purple-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm text-slate-300 hover:text-white transition"
                title="Attach reference image"
              >
                <ImagePlus className="w-4 h-4 text-blue-400" />
                Ref
              </button>
              <button
                onClick={() => setShowMedia(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm text-white transition"
                title="AI Media Studio"
              >
                <Sparkles className="w-4 h-4" />
                Media
              </button>
              <button
                onClick={() => setShowPlugins(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm text-slate-300 hover:text-white transition"
              >
                <Plug className="w-4 h-4 text-purple-400" />
                Plugins
              </button>
              <button
                onClick={() => setInput('Add a contact form with name, email, and message fields')}
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition"
              >
                + Form
              </button>
              <button
                onClick={() => setInput('Add an image gallery section')}
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition"
              >
                + Gallery
              </button>
              <button
                onClick={() => setInput('Add a pricing table with 3 tiers')}
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition"
              >
                + Pricing
              </button>
            </div>

            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={messages.length === 0 ? "Describe your website or attach a design image..." : "Describe changes or attach an image..."}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                rows={3}
                disabled={isGenerating}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isGenerating}
                className={cn(
                  'absolute right-3 bottom-3 p-2 rounded-lg transition-colors',
                  input.trim() && !isGenerating
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Plugins Panel Overlay */}
        {showPlugins && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowPlugins(false)}
            />
            <div className="fixed left-[420px] top-[57px] bottom-0 w-[380px] z-50 animate-in slide-in-from-left duration-200">
              <PluginsPanel
                onSelectPlugin={handlePluginSelect}
                onClose={() => setShowPlugins(false)}
              />
            </div>
          </>
        )}

        {/* Media Panel Overlay */}
        {showMedia && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowMedia(false)}
            />
            <div className="fixed left-[420px] top-[57px] bottom-0 w-[400px] z-50 animate-in slide-in-from-left duration-200">
              <MediaPanel
                onClose={() => setShowMedia(false)}
                onInsert={handleMediaInsert}
              />
            </div>
          </>
        )}

        {/* Preview/Code Panel */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
          {/* Edit Mode Banner */}
          {editMode && viewMode === 'preview' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-medium shadow-lg shadow-purple-500/25 animate-pulse">
              <MousePointer2 className="w-4 h-4" />
              Click any element to select it, then describe changes in the chat
            </div>
          )}

          {viewMode === 'preview' ? (
            <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#020617_70%)]">
              <div
                className={cn(
                  'bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 relative',
                  deviceMode === 'desktop' ? 'w-full h-full' : 'h-[90%]',
                  editMode && 'ring-2 ring-purple-500 ring-offset-4 ring-offset-slate-950'
                )}
                style={{
                  width: DEVICE_WIDTHS[deviceMode],
                  maxWidth: '100%',
                }}
              >
                {generatedCode.html ? (
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                    <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center mb-4">
                      <Layout className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-500">No preview yet</p>
                    <p className="text-sm">Start chatting to build your website</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-slate-400 ml-2">index.html</span>
                </div>
                <pre className="p-4 text-sm text-slate-300 overflow-auto max-h-[calc(100vh-200px)]">
                  <code>{generateFullHTML(generatedCode)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-white transition-all duration-500 ease-out animate-in fade-in zoom-in-95"
          style={{ animationDuration: '300ms' }}
        >
          {/* Fullscreen Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold text-shadow">{projectName}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Device toggle in fullscreen */}
              <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-lg p-1">
                {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDeviceMode(mode)}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      deviceMode === mode ? 'bg-white text-slate-900' : 'text-white hover:bg-white/20'
                    )}
                  >
                    {mode === 'desktop' && <Monitor className="w-4 h-4" />}
                    {mode === 'tablet' && <Tablet className="w-4 h-4" />}
                    {mode === 'mobile' && <Smartphone className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-lg bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Preview Content */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div
              className={cn(
                'bg-white shadow-2xl transition-all duration-500 overflow-hidden',
                deviceMode === 'desktop' ? 'w-full h-full rounded-none' : 'rounded-3xl h-[90%]'
              )}
              style={{
                width: deviceMode === 'desktop' ? '100%' : DEVICE_WIDTHS[deviceMode],
                maxWidth: '100%',
              }}
            >
              <iframe
                srcDoc={generateFullHTML(generatedCode)}
                className="w-full h-full border-0"
                title="Fullscreen Preview"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>

          {/* Section indicators */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-2 h-8 rounded-full bg-purple-500"></div>
            <div className="w-2 h-8 rounded-full bg-white/30"></div>
            <div className="w-2 h-8 rounded-full bg-white/30"></div>
            <div className="w-2 h-8 rounded-full bg-white/30"></div>
          </div>
        </div>
      )}
    </div>
  )
}
