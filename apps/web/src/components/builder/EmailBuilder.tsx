'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Mail,
  Layout,
  Type,
  Image as ImageIcon,
  Square,
  Columns,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Link2,
  Copy,
  Download,
  Eye,
  Code,
  Palette,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Send,
  Smartphone,
  Monitor
} from 'lucide-react'

// Email component types
type EmailBlockType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'columns' | 'footer' | 'hero' | 'social'

interface EmailBlock {
  id: string
  type: EmailBlockType
  content: Record<string, any>
  styles: Record<string, string>
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  preheader: string
  blocks: EmailBlock[]
  globalStyles: {
    backgroundColor: string
    contentWidth: string
    fontFamily: string
    primaryColor: string
    textColor: string
    linkColor: string
  }
}

// Pre-built email templates
const EMAIL_TEMPLATES: Record<string, Partial<EmailTemplate>> = {
  blank: {
    name: 'Blank Email',
    blocks: []
  },
  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to {{company}}!',
    preheader: 'Thanks for signing up',
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Welcome to {{company}}!',
          subtitle: "We're excited to have you on board.",
          buttonText: 'Get Started',
          buttonUrl: '{{cta_url}}'
        },
        styles: { backgroundColor: '#6366f1' }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          html: '<p>Hi {{first_name}},</p><p>Thank you for signing up! We are thrilled to have you as part of our community.</p><p>Here are a few things you can do to get started:</p><ul><li>Complete your profile</li><li>Explore our features</li><li>Connect with other members</li></ul>'
        },
        styles: {}
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          text: 'Explore Now',
          url: '{{cta_url}}',
          align: 'center'
        },
        styles: { backgroundColor: '#6366f1' }
      },
      {
        id: 'footer-1',
        type: 'footer',
        content: {
          company: '{{company}}',
          address: '123 Main St, City, State 12345',
          unsubscribe: true
        },
        styles: {}
      }
    ]
  },
  newsletter: {
    name: 'Newsletter',
    subject: '{{company}} Newsletter - {{date}}',
    preheader: 'Your weekly update',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          logo: '{{logo_url}}',
          title: '{{company}}'
        },
        styles: {}
      },
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'This Week\'s Highlights',
          subtitle: 'The latest news and updates',
          imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600'
        },
        styles: {}
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          html: '<h2>Featured Story</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>'
        },
        styles: {}
      },
      {
        id: 'columns-1',
        type: 'columns',
        content: {
          columns: [
            { title: 'Article 1', text: 'Brief description of the first article.', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=300' },
            { title: 'Article 2', text: 'Brief description of the second article.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300' }
          ]
        },
        styles: {}
      },
      {
        id: 'social-1',
        type: 'social',
        content: {
          platforms: ['twitter', 'facebook', 'linkedin', 'instagram']
        },
        styles: {}
      },
      {
        id: 'footer-1',
        type: 'footer',
        content: {
          company: '{{company}}',
          address: '123 Main St, City, State 12345',
          unsubscribe: true
        },
        styles: {}
      }
    ]
  },
  promotional: {
    name: 'Promotional',
    subject: '{{discount}}% OFF - Limited Time Offer!',
    preheader: 'Don\'t miss out on this exclusive deal',
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: '{{discount}}% OFF',
          subtitle: 'Limited Time Only!',
          buttonText: 'Shop Now',
          buttonUrl: '{{shop_url}}'
        },
        styles: { backgroundColor: '#dc2626' }
      },
      {
        id: 'image-1',
        type: 'image',
        content: {
          src: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
          alt: 'Sale Banner',
          link: '{{shop_url}}'
        },
        styles: {}
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          html: '<h2 style="text-align: center;">Use Code: <strong>{{promo_code}}</strong></h2><p style="text-align: center;">Valid until {{expiry_date}}</p>'
        },
        styles: {}
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          text: 'Claim Your Discount',
          url: '{{shop_url}}',
          align: 'center'
        },
        styles: { backgroundColor: '#dc2626' }
      },
      {
        id: 'footer-1',
        type: 'footer',
        content: {
          company: '{{company}}',
          address: '123 Main St, City, State 12345',
          unsubscribe: true
        },
        styles: {}
      }
    ]
  },
  transactional: {
    name: 'Order Confirmation',
    subject: 'Order #{{order_id}} Confirmed',
    preheader: 'Thank you for your order',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          logo: '{{logo_url}}',
          title: '{{company}}'
        },
        styles: {}
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          html: '<h1 style="text-align: center;">Order Confirmed!</h1><p style="text-align: center;">Thank you for your purchase, {{first_name}}.</p><p style="text-align: center;">Order #{{order_id}}</p>'
        },
        styles: {}
      },
      {
        id: 'divider-1',
        type: 'divider',
        content: {},
        styles: {}
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          html: '<h3>Order Summary</h3><p>{{order_items}}</p><p><strong>Subtotal:</strong> {{subtotal}}</p><p><strong>Shipping:</strong> {{shipping}}</p><p><strong>Total:</strong> {{total}}</p>'
        },
        styles: {}
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          text: 'Track Your Order',
          url: '{{tracking_url}}',
          align: 'center'
        },
        styles: { backgroundColor: '#059669' }
      },
      {
        id: 'footer-1',
        type: 'footer',
        content: {
          company: '{{company}}',
          address: '123 Main St, City, State 12345',
          unsubscribe: false
        },
        styles: {}
      }
    ]
  }
}

// Block component definitions
const BLOCK_TYPES: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'header', label: 'Header', icon: <Layout className="w-4 h-4" /> },
  { type: 'hero', label: 'Hero', icon: <Square className="w-4 h-4" /> },
  { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
  { type: 'button', label: 'Button', icon: <Square className="w-4 h-4" /> },
  { type: 'columns', label: 'Columns', icon: <Columns className="w-4 h-4" /> },
  { type: 'divider', label: 'Divider', icon: <AlignCenter className="w-4 h-4" /> },
  { type: 'spacer', label: 'Spacer', icon: <Square className="w-4 h-4" /> },
  { type: 'social', label: 'Social', icon: <Share2Icon /> },
  { type: 'footer', label: 'Footer', icon: <AlignLeft className="w-4 h-4" /> }
]

function Share2Icon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
}

interface EmailBuilderProps {
  onSave?: (template: EmailTemplate) => void
  onExport?: (html: string) => void
  initialTemplate?: Partial<EmailTemplate>
}

export function EmailBuilder({ onSave, onExport, initialTemplate }: EmailBuilderProps) {
  const [template, setTemplate] = useState<EmailTemplate>({
    id: crypto.randomUUID(),
    name: initialTemplate?.name || 'Untitled Email',
    subject: initialTemplate?.subject || '',
    preheader: initialTemplate?.preheader || '',
    blocks: initialTemplate?.blocks || [],
    globalStyles: {
      backgroundColor: '#f3f4f6',
      contentWidth: '600px',
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#6366f1',
      textColor: '#1f2937',
      linkColor: '#6366f1',
      ...initialTemplate?.globalStyles
    }
  })

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit')
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop')
  const [showTemplates, setShowTemplates] = useState(true)

  const selectedBlock = useMemo(() => {
    return template.blocks.find(b => b.id === selectedBlockId)
  }, [template.blocks, selectedBlockId])

  const addBlock = useCallback((type: EmailBlockType) => {
    const newBlock: EmailBlock = {
      id: crypto.randomUUID(),
      type,
      content: getDefaultContent(type),
      styles: {}
    }
    setTemplate(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }))
    setSelectedBlockId(newBlock.id)
  }, [])

  const updateBlock = useCallback((blockId: string, updates: Partial<EmailBlock>) => {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId ? { ...b, ...updates } : b
      )
    }))
  }, [])

  const deleteBlock = useCallback((blockId: string) => {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId)
    }))
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null)
    }
  }, [selectedBlockId])

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setTemplate(prev => {
      const index = prev.blocks.findIndex(b => b.id === blockId)
      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === prev.blocks.length - 1) return prev

      const newBlocks = [...prev.blocks]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      ;[newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]]

      return { ...prev, blocks: newBlocks }
    })
  }, [])

  const loadTemplate = useCallback((templateKey: string) => {
    const preset = EMAIL_TEMPLATES[templateKey]
    if (preset) {
      setTemplate(prev => ({
        ...prev,
        name: preset.name || prev.name,
        subject: preset.subject || prev.subject,
        preheader: preset.preheader || prev.preheader,
        blocks: preset.blocks || []
      }))
      setShowTemplates(false)
    }
  }, [])

  // Generate HTML output
  const generateHTML = useCallback((): string => {
    const { globalStyles, blocks, subject, preheader } = template

    const renderBlock = (block: EmailBlock): string => {
      switch (block.type) {
        case 'header':
          return `
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #ffffff;">
                ${block.content.logo ? `<img src="${block.content.logo}" alt="Logo" style="max-height: 50px; margin-bottom: 10px;">` : ''}
                ${block.content.title ? `<h1 style="margin: 0; font-size: 24px; color: ${globalStyles.textColor};">${block.content.title}</h1>` : ''}
              </td>
            </tr>`

        case 'hero':
          return `
            <tr>
              <td style="padding: 40px 20px; text-align: center; background-color: ${block.styles.backgroundColor || globalStyles.primaryColor};">
                ${block.content.imageUrl ? `<img src="${block.content.imageUrl}" alt="" style="max-width: 100%; height: auto; margin-bottom: 20px;">` : ''}
                <h1 style="margin: 0 0 10px; font-size: 32px; color: #ffffff;">${block.content.title || ''}</h1>
                <p style="margin: 0 0 20px; font-size: 18px; color: rgba(255,255,255,0.9);">${block.content.subtitle || ''}</p>
                ${block.content.buttonText ? `
                  <a href="${block.content.buttonUrl || '#'}" style="display: inline-block; padding: 14px 28px; background-color: #ffffff; color: ${block.styles.backgroundColor || globalStyles.primaryColor}; text-decoration: none; border-radius: 6px; font-weight: bold;">${block.content.buttonText}</a>
                ` : ''}
              </td>
            </tr>`

        case 'text':
          return `
            <tr>
              <td style="padding: 20px 30px; background-color: #ffffff; color: ${globalStyles.textColor}; font-size: 16px; line-height: 1.6;">
                ${block.content.html || ''}
              </td>
            </tr>`

        case 'image':
          return `
            <tr>
              <td style="padding: 20px; background-color: #ffffff; text-align: center;">
                ${block.content.link ? `<a href="${block.content.link}">` : ''}
                <img src="${block.content.src || ''}" alt="${block.content.alt || ''}" style="max-width: 100%; height: auto;">
                ${block.content.link ? '</a>' : ''}
              </td>
            </tr>`

        case 'button':
          return `
            <tr>
              <td style="padding: 20px 30px; background-color: #ffffff; text-align: ${block.content.align || 'center'};">
                <a href="${block.content.url || '#'}" style="display: inline-block; padding: 14px 28px; background-color: ${block.styles.backgroundColor || globalStyles.primaryColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">${block.content.text || 'Click Here'}</a>
              </td>
            </tr>`

        case 'divider':
          return `
            <tr>
              <td style="padding: 20px 30px; background-color: #ffffff;">
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
              </td>
            </tr>`

        case 'spacer':
          return `
            <tr>
              <td style="height: ${block.content.height || '30'}px; background-color: #ffffff;"></td>
            </tr>`

        case 'columns':
          const cols = block.content.columns || []
          return `
            <tr>
              <td style="padding: 20px; background-color: #ffffff;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    ${cols.map((col: any, i: number) => `
                      <td style="width: ${100 / cols.length}%; padding: 10px; vertical-align: top;">
                        ${col.image ? `<img src="${col.image}" alt="" style="max-width: 100%; height: auto; margin-bottom: 10px;">` : ''}
                        ${col.title ? `<h3 style="margin: 0 0 8px; color: ${globalStyles.textColor};">${col.title}</h3>` : ''}
                        ${col.text ? `<p style="margin: 0; color: ${globalStyles.textColor}; font-size: 14px;">${col.text}</p>` : ''}
                      </td>
                    `).join('')}
                  </tr>
                </table>
              </td>
            </tr>`

        case 'social':
          const platforms = block.content.platforms || []
          const socialIcons: Record<string, string> = {
            twitter: 'https://cdn-icons-png.flaticon.com/32/733/733579.png',
            facebook: 'https://cdn-icons-png.flaticon.com/32/733/733547.png',
            linkedin: 'https://cdn-icons-png.flaticon.com/32/733/733561.png',
            instagram: 'https://cdn-icons-png.flaticon.com/32/733/733558.png'
          }
          return `
            <tr>
              <td style="padding: 20px; background-color: #ffffff; text-align: center;">
                ${platforms.map((p: string) => `
                  <a href="{{${p}_url}}" style="display: inline-block; margin: 0 8px;">
                    <img src="${socialIcons[p] || ''}" alt="${p}" width="32" height="32">
                  </a>
                `).join('')}
              </td>
            </tr>`

        case 'footer':
          return `
            <tr>
              <td style="padding: 30px; background-color: #f9fafb; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0 0 10px;">${block.content.company || ''}</p>
                <p style="margin: 0 0 10px;">${block.content.address || ''}</p>
                ${block.content.unsubscribe ? `<p style="margin: 0;"><a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a></p>` : ''}
              </td>
            </tr>`

        default:
          return ''
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; font-family: ${globalStyles.fontFamily}; }
    a { color: ${globalStyles.linkColor}; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${globalStyles.backgroundColor};">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${globalStyles.backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table class="email-container" role="presentation" width="${globalStyles.contentWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width: ${globalStyles.contentWidth}; background-color: #ffffff;">
          ${blocks.map(renderBlock).join('\n')}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }, [template])

  const handleExport = useCallback(() => {
    const html = generateHTML()
    onExport?.(html)

    // Also trigger download
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [generateHTML, onExport, template.name])

  const handleCopyCode = useCallback(async () => {
    const html = generateHTML()
    await navigator.clipboard.writeText(html)
  }, [generateHTML])

  // Template selection modal
  if (showTemplates) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0f]">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-3">
            <Mail className="w-6 h-6 text-purple-400" />
            Choose Email Template
          </h2>
          <p className="mt-2 text-sm text-gray-400">Start with a template or create from scratch</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(EMAIL_TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => loadTemplate(key)}
                className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-purple-500/50 transition-all group"
              >
                <div className="aspect-[4/3] mb-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-medium text-white">{t.name}</h3>
                <p className="mt-1 text-xs text-gray-400 truncate">{t.subject || 'Custom email template'}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Mail className="w-5 h-5 text-purple-400" />
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
            className="bg-transparent text-white font-medium focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
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
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Copy HTML"
          >
            <Copy className="w-5 h-5" />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
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
            {/* Block palette */}
            <div className="w-56 border-r border-white/10 p-4 overflow-y-auto">
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">Add Block</h3>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_TYPES.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => addBlock(block.type)}
                    className="p-3 bg-white/5 border border-white/10 rounded-lg text-center hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="text-gray-400 group-hover:text-purple-400 mb-1 flex justify-center">
                      {block.icon}
                    </div>
                    <span className="text-xs text-gray-500 group-hover:text-gray-300">{block.label}</span>
                  </button>
                ))}
              </div>

              {/* Email settings */}
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-medium text-gray-400 uppercase">Email Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={template.subject}
                      onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
                      placeholder="Enter subject..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Preheader</label>
                    <input
                      type="text"
                      value={template.preheader}
                      onChange={(e) => setTemplate(prev => ({ ...prev, preheader: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
                      placeholder="Preview text..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Primary Color</label>
                    <input
                      type="color"
                      value={template.globalStyles.primaryColor}
                      onChange={(e) => setTemplate(prev => ({
                        ...prev,
                        globalStyles: { ...prev.globalStyles, primaryColor: e.target.value }
                      }))}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a2e]">
              <div
                className="mx-auto bg-white rounded-lg shadow-2xl overflow-hidden"
                style={{ maxWidth: template.globalStyles.contentWidth }}
              >
                {template.blocks.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Add blocks from the left panel to build your email</p>
                  </div>
                ) : (
                  template.blocks.map((block) => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative group cursor-pointer ${
                        selectedBlockId === block.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                    >
                      {/* Block controls */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }}
                          className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                        >
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }}
                          className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Block preview */}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `<table width="100%" cellpadding="0" cellspacing="0" border="0">
                            ${renderBlockPreview(block, template.globalStyles)}
                          </table>`
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Properties panel */}
            {selectedBlock && (
              <div className="w-64 border-l border-white/10 p-4 overflow-y-auto">
                <h3 className="text-sm font-medium text-white mb-4">
                  Edit {BLOCK_TYPES.find(b => b.type === selectedBlock.type)?.label}
                </h3>
                <BlockEditor
                  block={selectedBlock}
                  onChange={(updates) => updateBlock(selectedBlock.id, updates)}
                  globalStyles={template.globalStyles}
                />
              </div>
            )}
          </>
        )}

        {viewMode === 'preview' && (
          <div className="flex-1 flex flex-col">
            {/* Device toggle */}
            <div className="p-4 border-b border-white/10 flex justify-center gap-2">
              <button
                onClick={() => setDevicePreview('desktop')}
                className={`p-2 rounded-lg transition-colors ${
                  devicePreview === 'desktop' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDevicePreview('mobile')}
                className={`p-2 rounded-lg transition-colors ${
                  devicePreview === 'mobile' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </button>
            </div>

            {/* Preview iframe */}
            <div className="flex-1 overflow-auto p-6 bg-[#1a1a2e] flex justify-center">
              <iframe
                srcDoc={generateHTML()}
                className="bg-white shadow-2xl"
                style={{
                  width: devicePreview === 'mobile' ? '375px' : '100%',
                  maxWidth: template.globalStyles.contentWidth,
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
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

// Helper function to get default content for a block type
function getDefaultContent(type: EmailBlockType): Record<string, any> {
  switch (type) {
    case 'header':
      return { title: 'Company Name', logo: '' }
    case 'hero':
      return { title: 'Welcome!', subtitle: 'Your subtitle here', buttonText: 'Get Started', buttonUrl: '#' }
    case 'text':
      return { html: '<p>Enter your text here...</p>' }
    case 'image':
      return { src: 'https://via.placeholder.com/600x300', alt: 'Image', link: '' }
    case 'button':
      return { text: 'Click Here', url: '#', align: 'center' }
    case 'divider':
      return {}
    case 'spacer':
      return { height: 30 }
    case 'columns':
      return { columns: [{ title: 'Column 1', text: 'Content' }, { title: 'Column 2', text: 'Content' }] }
    case 'social':
      return { platforms: ['twitter', 'facebook', 'linkedin'] }
    case 'footer':
      return { company: 'Company Name', address: '123 Main St', unsubscribe: true }
    default:
      return {}
  }
}

// Helper function to render a block preview
function renderBlockPreview(block: EmailBlock, globalStyles: EmailTemplate['globalStyles']): string {
  // This is simplified - in production you'd use the same logic as generateHTML
  switch (block.type) {
    case 'header':
      return `<tr><td style="padding: 20px; text-align: center;"><strong>${block.content.title || 'Header'}</strong></td></tr>`
    case 'hero':
      return `<tr><td style="padding: 40px 20px; text-align: center; background: ${block.styles.backgroundColor || globalStyles.primaryColor};"><h1 style="color: white; margin: 0;">${block.content.title || 'Hero'}</h1><p style="color: rgba(255,255,255,0.8); margin: 10px 0;">${block.content.subtitle || ''}</p></td></tr>`
    case 'text':
      return `<tr><td style="padding: 20px 30px;">${block.content.html || '<p>Text block</p>'}</td></tr>`
    case 'image':
      return `<tr><td style="padding: 20px; text-align: center;"><img src="${block.content.src}" alt="${block.content.alt}" style="max-width: 100%;"></td></tr>`
    case 'button':
      return `<tr><td style="padding: 20px; text-align: ${block.content.align || 'center'};"><a href="#" style="display: inline-block; padding: 14px 28px; background: ${block.styles.backgroundColor || globalStyles.primaryColor}; color: white; text-decoration: none; border-radius: 6px;">${block.content.text || 'Button'}</a></td></tr>`
    case 'divider':
      return `<tr><td style="padding: 20px 30px;"><hr style="border: none; border-top: 1px solid #e5e7eb;"></td></tr>`
    case 'spacer':
      return `<tr><td style="height: ${block.content.height || 30}px;"></td></tr>`
    case 'footer':
      return `<tr><td style="padding: 30px; background: #f9fafb; text-align: center; color: #6b7280; font-size: 12px;">${block.content.company || 'Footer'}</td></tr>`
    default:
      return `<tr><td style="padding: 20px; text-align: center; color: #999;">${block.type} block</td></tr>`
  }
}

// Block editor component
function BlockEditor({
  block,
  onChange,
  globalStyles
}: {
  block: EmailBlock
  onChange: (updates: Partial<EmailBlock>) => void
  globalStyles: EmailTemplate['globalStyles']
}) {
  const updateContent = (key: string, value: any) => {
    onChange({ content: { ...block.content, [key]: value } })
  }

  const updateStyles = (key: string, value: string) => {
    onChange({ styles: { ...block.styles, [key]: value } })
  }

  return (
    <div className="space-y-4">
      {block.type === 'header' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Title</label>
            <input
              type="text"
              value={block.content.title || ''}
              onChange={(e) => updateContent('title', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Logo URL</label>
            <input
              type="text"
              value={block.content.logo || ''}
              onChange={(e) => updateContent('logo', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
              placeholder="https://..."
            />
          </div>
        </>
      )}

      {block.type === 'hero' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Title</label>
            <input
              type="text"
              value={block.content.title || ''}
              onChange={(e) => updateContent('title', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Subtitle</label>
            <input
              type="text"
              value={block.content.subtitle || ''}
              onChange={(e) => updateContent('subtitle', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Button Text</label>
            <input
              type="text"
              value={block.content.buttonText || ''}
              onChange={(e) => updateContent('buttonText', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Button URL</label>
            <input
              type="text"
              value={block.content.buttonUrl || ''}
              onChange={(e) => updateContent('buttonUrl', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Background Color</label>
            <input
              type="color"
              value={block.styles.backgroundColor || globalStyles.primaryColor}
              onChange={(e) => updateStyles('backgroundColor', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </>
      )}

      {block.type === 'text' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Content (HTML)</label>
          <textarea
            value={block.content.html || ''}
            onChange={(e) => updateContent('html', e.target.value)}
            rows={6}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50 font-mono"
          />
        </div>
      )}

      {block.type === 'image' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Image URL</label>
            <input
              type="text"
              value={block.content.src || ''}
              onChange={(e) => updateContent('src', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Alt Text</label>
            <input
              type="text"
              value={block.content.alt || ''}
              onChange={(e) => updateContent('alt', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Link URL (optional)</label>
            <input
              type="text"
              value={block.content.link || ''}
              onChange={(e) => updateContent('link', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </>
      )}

      {block.type === 'button' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Button Text</label>
            <input
              type="text"
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">URL</label>
            <input
              type="text"
              value={block.content.url || ''}
              onChange={(e) => updateContent('url', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Alignment</label>
            <select
              value={block.content.align || 'center'}
              onChange={(e) => updateContent('align', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Button Color</label>
            <input
              type="color"
              value={block.styles.backgroundColor || globalStyles.primaryColor}
              onChange={(e) => updateStyles('backgroundColor', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </>
      )}

      {block.type === 'spacer' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Height (px)</label>
          <input
            type="number"
            value={block.content.height || 30}
            onChange={(e) => updateContent('height', parseInt(e.target.value))}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>
      )}

      {block.type === 'footer' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Company Name</label>
            <input
              type="text"
              value={block.content.company || ''}
              onChange={(e) => updateContent('company', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Address</label>
            <input
              type="text"
              value={block.content.address || ''}
              onChange={(e) => updateContent('address', e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={block.content.unsubscribe || false}
              onChange={(e) => updateContent('unsubscribe', e.target.checked)}
              className="rounded bg-white/5 border-white/10"
            />
            <label className="text-xs text-gray-400">Include unsubscribe link</label>
          </div>
        </>
      )}
    </div>
  )
}

export default EmailBuilder
