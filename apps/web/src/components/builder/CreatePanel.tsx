'use client'

import { useState } from 'react'
import {
  Globe,
  Mail,
  Image as ImageIcon,
  CreditCard,
  Share2,
  FileText,
  Megaphone,
  Layout,
  Video,
  Palette,
  X,
  ArrowRight,
  Sparkles,
  Plus
} from 'lucide-react'

interface CreateOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  available: boolean
  action: () => void
}

interface CreatePanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectOption: (option: string) => void
  theme?: 'light' | 'dark'
}

export function CreatePanel({ isOpen, onClose, onSelectOption, theme = 'dark' }: CreatePanelProps) {
  const isDark = theme === 'dark'

  const createOptions: CreateOption[] = [
    {
      id: 'website',
      name: 'Website',
      description: 'Build a complete website with AI assistance',
      icon: <Globe className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      available: true,
      action: () => onSelectOption('website')
    },
    {
      id: 'landing',
      name: 'Landing Page',
      description: 'Create high-converting landing pages',
      icon: <Layout className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      available: true,
      action: () => onSelectOption('landing')
    },
    {
      id: 'email',
      name: 'Email Template',
      description: 'Design responsive HTML email templates',
      icon: <Mail className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      available: true,
      action: () => onSelectOption('email')
    },
    {
      id: 'ad',
      name: 'Ad Banner',
      description: 'Create display ads and social media graphics',
      icon: <Megaphone className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      available: true,
      action: () => onSelectOption('ad')
    },
    {
      id: 'social',
      name: 'Social Graphics',
      description: 'Design posts for Instagram, Twitter, LinkedIn',
      icon: <Share2 className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-500',
      available: true,
      action: () => onSelectOption('social')
    },
    {
      id: 'payment',
      name: 'Payment Form',
      description: 'Build checkout and payment portals',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      available: true,
      action: () => onSelectOption('payment')
    },
    {
      id: 'blog',
      name: 'Blog Post',
      description: 'Write and design blog articles',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500',
      available: true,
      action: () => onSelectOption('blog')
    },
    {
      id: 'video',
      name: 'Video',
      description: 'Create promotional videos (Coming Soon)',
      icon: <Video className="w-6 h-6" />,
      color: 'from-gray-500 to-gray-600',
      available: false,
      action: () => {}
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative w-full max-w-4xl mx-4 ${isDark ? 'bg-[#0f0f1a]' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Create New
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Choose what you'd like to create
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {createOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.available ? option.action : undefined}
                disabled={!option.available}
                className={`group relative p-5 rounded-xl text-left transition-all ${
                  option.available
                    ? isDark
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-purple-500/50'
                    : isDark
                      ? 'bg-white/[0.02] border border-white/5 cursor-not-allowed'
                      : 'bg-gray-50 border border-gray-100 cursor-not-allowed'
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} p-3 mb-4 ${!option.available ? 'opacity-30' : ''}`}>
                  {option.icon}
                </div>

                {/* Title */}
                <h3 className={`font-medium mb-1 ${
                  option.available
                    ? isDark ? 'text-white' : 'text-gray-900'
                    : isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {option.name}
                </h3>

                {/* Description */}
                <p className={`text-xs ${
                  option.available
                    ? isDark ? 'text-gray-400' : 'text-gray-500'
                    : isDark ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {option.description}
                </p>

                {/* Coming Soon Badge */}
                {!option.available && (
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                    Soon
                  </span>
                )}

                {/* Hover Arrow */}
                {option.available && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>All designs are AI-powered</span>
            </div>
            <button
              onClick={onClose}
              className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact create button for toolbar
export function CreateButton({ onClick, theme = 'dark' }: { onClick: () => void; theme?: 'light' | 'dark' }) {
  const isDark = theme === 'dark'

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        isDark
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
      }`}
    >
      <Plus className="w-4 h-4" />
      Create
    </button>
  )
}

export default CreatePanel
