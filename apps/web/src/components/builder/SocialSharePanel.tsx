'use client'

import { useState, useCallback } from 'react'
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Mail,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Download,
  Image as ImageIcon,
  QrCode,
  Code,
  ChevronDown
} from 'lucide-react'

interface SocialSharePanelProps {
  projectId?: string
  projectName?: string
  previewUrl?: string
  liveUrl?: string
  onGenerateShareImage?: () => Promise<string>
  onInsertShareButtons?: (html: string) => void
}

interface SharePlatform {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  getUrl: (url: string, title: string, description?: string) => string
}

const SHARE_PLATFORMS: SharePlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: <Twitter className="w-5 h-5" />,
    color: '#1DA1F2',
    getUrl: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-5 h-5" />,
    color: '#4267B2',
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin className="w-5 h-5" />,
    color: '#0A66C2',
    getUrl: (url, title, description) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <MessageCircle className="w-5 h-5" />,
    color: '#25D366',
    getUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
  },
  {
    id: 'email',
    name: 'Email',
    icon: <Mail className="w-5 h-5" />,
    color: '#EA4335',
    getUrl: (url, title, description) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check this out: ${url}\n\n${description || ''}`)}`
  }
]

// Pre-built share button HTML templates
const SHARE_BUTTON_TEMPLATES = {
  horizontal: `
<div style="display: flex; gap: 8px; flex-wrap: wrap;">
  <a href="https://twitter.com/intent/tweet?url={{URL}}&text={{TITLE}}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: #1DA1F2; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    Share on X
  </a>
  <a href="https://www.facebook.com/sharer/sharer.php?u={{URL}}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: #4267B2; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    Share
  </a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url={{URL}}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: #0A66C2; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    Share
  </a>
</div>`,
  vertical: `
<div style="display: flex; flex-direction: column; gap: 8px; max-width: 200px;">
  <a href="https://twitter.com/intent/tweet?url={{URL}}&text={{TITLE}}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #1DA1F2; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    Share on X
  </a>
  <a href="https://www.facebook.com/sharer/sharer.php?u={{URL}}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #4267B2; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    Share on Facebook
  </a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url={{URL}}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #0A66C2; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    Share on LinkedIn
  </a>
  <a href="https://wa.me/?text={{TITLE}}%20{{URL}}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #25D366; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    Share on WhatsApp
  </a>
</div>`,
  iconOnly: `
<div style="display: flex; gap: 8px;">
  <a href="https://twitter.com/intent/tweet?url={{URL}}&text={{TITLE}}" target="_blank" rel="noopener" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #1DA1F2; color: white; text-decoration: none; border-radius: 50%;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  </a>
  <a href="https://www.facebook.com/sharer/sharer.php?u={{URL}}" target="_blank" rel="noopener" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #4267B2; color: white; text-decoration: none; border-radius: 50%;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  </a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url={{URL}}" target="_blank" rel="noopener" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #0A66C2; color: white; text-decoration: none; border-radius: 50%;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  </a>
  <a href="https://wa.me/?text={{TITLE}}%20{{URL}}" target="_blank" rel="noopener" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #25D366; color: white; text-decoration: none; border-radius: 50%;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>
</div>`
}

export function SocialSharePanel({
  projectId,
  projectName = 'My Website',
  previewUrl,
  liveUrl,
  onGenerateShareImage,
  onInsertShareButtons
}: SocialSharePanelProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<'horizontal' | 'vertical' | 'iconOnly'>('horizontal')
  const [customUrl, setCustomUrl] = useState(liveUrl || previewUrl || '')
  const [customTitle, setCustomTitle] = useState(projectName)
  const [showTemplates, setShowTemplates] = useState(false)

  const shareUrl = liveUrl || previewUrl || customUrl
  const shareTitle = customTitle || projectName

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }, [shareUrl])

  const handleShare = useCallback((platform: SharePlatform) => {
    const url = platform.getUrl(shareUrl, shareTitle, `Check out ${shareTitle}`)
    window.open(url, '_blank', 'width=600,height=400')
  }, [shareUrl, shareTitle])

  const handleCopyCode = useCallback(async () => {
    const template = SHARE_BUTTON_TEMPLATES[selectedTemplate]
    const code = template
      .replace(/{{URL}}/g, encodeURIComponent(shareUrl))
      .replace(/{{TITLE}}/g, encodeURIComponent(shareTitle))
    await navigator.clipboard.writeText(code)
    setCopied('code')
    setTimeout(() => setCopied(null), 2000)
  }, [selectedTemplate, shareUrl, shareTitle])

  const handleInsertButtons = useCallback(() => {
    if (!onInsertShareButtons) return
    const template = SHARE_BUTTON_TEMPLATES[selectedTemplate]
    const code = template
      .replace(/{{URL}}/g, encodeURIComponent(shareUrl))
      .replace(/{{TITLE}}/g, encodeURIComponent(shareTitle))
    onInsertShareButtons(code)
  }, [onInsertShareButtons, selectedTemplate, shareUrl, shareTitle])

  return (
    <div className="space-y-6">
      {/* Share This Design */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share Your Design
        </h3>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Share URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://your-site.com"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy link"
            >
              {copied === 'link' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Share Title */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Share Title</label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="My Awesome Website"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Quick Share Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {SHARE_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleShare(platform)}
              className="p-3 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: `${platform.color}20` }}
              title={`Share on ${platform.name}`}
            >
              <span style={{ color: platform.color }}>{platform.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Share Buttons to Website */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Code className="w-4 h-4" />
          Add Share Buttons to Your Site
        </h3>

        {/* Template Selector */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Button Style</label>
          <div className="grid grid-cols-3 gap-2">
            {(['horizontal', 'vertical', 'iconOnly'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setSelectedTemplate(style)}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  selectedTemplate === style
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {style === 'horizontal' ? 'Horizontal' : style === 'vertical' ? 'Vertical' : 'Icons Only'}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-3">Preview:</p>
          <div
            className="transform scale-90 origin-top-left"
            dangerouslySetInnerHTML={{
              __html: SHARE_BUTTON_TEMPLATES[selectedTemplate]
                .replace(/{{URL}}/g, '#')
                .replace(/{{TITLE}}/g, 'Share')
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopyCode}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            {copied === 'code' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            Copy Code
          </button>
          {onInsertShareButtons && (
            <button
              onClick={handleInsertButtons}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white transition-colors"
            >
              <Code className="w-4 h-4" />
              Insert
            </button>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export for Social Media
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {onGenerateShareImage && (
            <button
              onClick={onGenerateShareImage}
              className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              Share Image
            </button>
          )}
          <button
            className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
        </div>
      </div>
    </div>
  )
}

export default SocialSharePanel
