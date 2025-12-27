'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  FileText,
  Image,
  Globe,
  Search,
  Share2,
  Code,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PageSettings {
  title: string
  description: string
  favicon: string
  ogImage: string
  ogTitle: string
  ogDescription: string
  keywords: string[]
  customHead: string
  customCSS: string
  googleAnalyticsId: string
  language: string
}

interface PageSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: PageSettings
  onSave: (settings: PageSettings) => void
}

const DEFAULT_SETTINGS: PageSettings = {
  title: 'My Website',
  description: 'A website built with AI Website Builder',
  favicon: '',
  ogImage: '',
  ogTitle: '',
  ogDescription: '',
  keywords: [],
  customHead: '',
  customCSS: '',
  googleAnalyticsId: '',
  language: 'en',
}

type TabType = 'general' | 'seo' | 'social' | 'code'

export function PageSettingsPanel({
  isOpen,
  onClose,
  settings: initialSettings,
  onSave,
}: PageSettingsPanelProps) {
  const [settings, setSettings] = useState<PageSettings>({ ...DEFAULT_SETTINGS, ...initialSettings })
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [newKeyword, setNewKeyword] = useState('')

  const handleSave = () => {
    onSave(settings)
    onClose()
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.keywords.includes(newKeyword.trim())) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }))
  }

  const tabs: { id: TabType; name: string; icon: React.ElementType }[] = [
    { id: 'general', name: 'General', icon: FileText },
    { id: 'seo', name: 'SEO', icon: Search },
    { id: 'social', name: 'Social', icon: Share2 },
    { id: 'code', name: 'Custom Code', icon: Code },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-[700px] max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Page Settings</h2>
                  <p className="text-sm text-slate-400">Configure SEO, meta tags, and custom code</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 border-b border-slate-800 bg-slate-800/50">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'general' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="My Awesome Website"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">Appears in browser tabs and search results</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Favicon URL
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={settings.favicon}
                        onChange={(e) => setSettings(prev => ({ ...prev, favicon: e.target.value }))}
                        placeholder="https://example.com/favicon.ico"
                        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                      {settings.favicon && (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                          <img src={settings.favicon} alt="Favicon" className="w-6 h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={settings.description}
                      onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="A brief description of your page for search engines..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      {settings.description.length}/160 characters (recommended)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Keywords
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                        placeholder="Add a keyword..."
                        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm"
                      />
                      <button
                        onClick={addKeyword}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.keywords.map(keyword => (
                        <span
                          key={keyword}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300"
                        >
                          {keyword}
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Google Analytics ID
                    </label>
                    <input
                      type="text"
                      value={settings.googleAnalyticsId}
                      onChange={(e) => setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                      placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-medium text-white mb-1">Open Graph Preview</h3>
                    <p className="text-xs text-slate-500 mb-4">How your page appears when shared on social media</p>

                    <div className="bg-white rounded-lg overflow-hidden max-w-[400px]">
                      {settings.ogImage && (
                        <div className="aspect-[1.91/1] bg-slate-100">
                          <img
                            src={settings.ogImage}
                            alt="OG Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        </div>
                      )}
                      <div className="p-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 uppercase mb-1">yoursite.com</div>
                        <div className="font-medium text-gray-900 text-sm">
                          {settings.ogTitle || settings.title || 'Page Title'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {settings.ogDescription || settings.description || 'Page description will appear here'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Social Image (OG Image)
                    </label>
                    <input
                      type="text"
                      value={settings.ogImage}
                      onChange={(e) => setSettings(prev => ({ ...prev, ogImage: e.target.value }))}
                      placeholder="https://example.com/social-image.jpg"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">Recommended size: 1200x630 pixels</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Social Title
                    </label>
                    <input
                      type="text"
                      value={settings.ogTitle}
                      onChange={(e) => setSettings(prev => ({ ...prev, ogTitle: e.target.value }))}
                      placeholder="Leave empty to use page title"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Social Description
                    </label>
                    <textarea
                      value={settings.ogDescription}
                      onChange={(e) => setSettings(prev => ({ ...prev, ogDescription: e.target.value }))}
                      placeholder="Leave empty to use meta description"
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'code' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Custom Head Code
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Add custom scripts, meta tags, or stylesheets to the &lt;head&gt; section</p>
                    <textarea
                      value={settings.customHead}
                      onChange={(e) => setSettings(prev => ({ ...prev, customHead: e.target.value }))}
                      placeholder="<!-- Add custom head code here -->"
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none font-mono text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Custom CSS
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Add custom styles to your page</p>
                    <textarea
                      value={settings.customCSS}
                      onChange={(e) => setSettings(prev => ({ ...prev, customCSS: e.target.value }))}
                      placeholder="/* Add custom CSS here */
body {
  /* Your styles */
}"
                      rows={8}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none font-mono text-sm resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-800/30">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
