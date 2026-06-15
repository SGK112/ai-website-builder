'use client'

import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Layout, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickStartItem {
  id: string
  icon: ComponentType<{ className?: string }>
  label: string
  gradient: string
}

export interface TemplateLibraryItem {
  id: string
  name: string
  category: string
  industry: string
  thumbnail_url: string
  is_premium: boolean
}

const MOBILE_STARTERS = [
  { id: 'expo-social', label: 'Social Feed', emoji: '👥', prompt: 'Build a social media feed app with a home screen showing posts with likes/comments, a profile screen, and a create-post screen. Clean minimal design, soft colors.' },
  { id: 'expo-ecommerce', label: 'Shop App', emoji: '🛍️', prompt: 'Build a mobile e-commerce app with a product grid home screen, product detail screen with add-to-cart, and a cart screen with checkout button. Modern dark theme.' },
  { id: 'expo-dashboard', label: 'Dashboard', emoji: '📊', prompt: 'Build a mobile analytics dashboard app with KPI cards, a line chart for trends, a list of recent activity, and a settings screen. Professional blue theme.' },
  { id: 'expo-fitness', label: 'Fitness Tracker', emoji: '💪', prompt: 'Build a fitness tracking app with a today screen showing workout progress, an exercise list screen, a timer screen with start/stop, and a stats screen. Energetic orange theme.' },
  { id: 'expo-notes', label: 'Notes App', emoji: '📝', prompt: 'Build a notes app with a home screen listing notes with search, a note editor screen with title and body, and a settings screen. Clean minimal white design.' },
  { id: 'expo-booking', label: 'Booking App', emoji: '📅', prompt: 'Build a service booking app with a services list, a calendar/date picker screen, a booking confirmation screen, and a my-bookings screen. Professional teal theme.' },
] as const

// Hide obvious stubs / test entries that confuse users.
const isRealTemplate = (name?: string) => !/^(test|stub|untitled|sample|temp)\b/i.test(name?.trim() || '')

interface TemplatesPanelProps {
  isDark: boolean
  quickStartTemplates: QuickStartItem[]
  onQuickStart: (id: string) => void
  supabaseTemplates: TemplateLibraryItem[]
  loadingTemplates: boolean
  onLoadSupabase: (id: string, name: string) => void
  mobileBusy: boolean
  onStartMobile: (prompt: string) => void
}

export function TemplatesPanel({
  isDark,
  quickStartTemplates,
  onQuickStart,
  supabaseTemplates,
  loadingTemplates,
  onLoadSupabase,
  mobileBusy,
  onStartMobile,
}: TemplatesPanelProps) {
  const libraryTemplates = supabaseTemplates.filter(t => isRealTemplate(t.name))

  return (
    <motion.div
      key="templates"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-3 space-y-4"
    >
      {/* Quick Start Templates */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className={cn('w-4 h-4', isDark ? 'text-violet-400' : 'text-violet-600')} />
          <h3 className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>Quick Start</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickStartTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onQuickStart(template.id)}
              className={cn(
                "p-3 rounded-xl border transition-all text-left group",
                `bg-gradient-to-br ${template.gradient}/10 border-white/10 hover:border-white/20`
              )}
            >
              <template.icon className={cn('w-5 h-5 mb-2 group-hover:scale-110 transition-transform', isDark ? 'text-white/80' : 'text-slate-700')} />
              <div className={cn('text-xs font-medium', isDark ? 'text-white' : 'text-slate-900')}>{template.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Supabase Templates */}
      {loadingTemplates ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : libraryTemplates.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layout className="w-4 h-4 text-fuchsia-400" />
            <h3 className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>Template Library</h3>
            <span className="text-[10px] text-zinc-500">
              ({libraryTemplates.length})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {libraryTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onLoadSupabase(template.id, template.name)}
                className={cn(
                  'group relative rounded-xl border hover:border-violet-500/30 transition-all text-left overflow-hidden',
                  isDark
                    ? 'bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.05]'
                    : 'bg-white border-slate-200 shadow-sm',
                )}
              >
                <div className={cn('aspect-video rounded-t-lg overflow-hidden', isDark ? 'bg-zinc-800' : 'bg-slate-100')}>
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    onError={(e) => {
                      // Broken thumbnail → swap for a deterministic fallback
                      // derived from the template id so the card stays
                      // presentable instead of showing the broken-image icon.
                      const img = e.currentTarget
                      const seed = encodeURIComponent(template.id || template.name || 'template')
                      const fallback = `https://www.webstew.net/api/media?q=${seed}/800/600`
                      if (img.src !== fallback) img.src = fallback
                      else img.style.display = 'none'
                    }}
                  />
                </div>
                <div className="p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn('text-[10px] font-medium truncate', isDark ? 'text-white' : 'text-slate-900')}>{template.name}</span>
                    {template.is_premium && (
                      <span className="px-1 py-0.5 text-[7px] font-bold bg-amber-500/20 text-amber-400 rounded">PRO</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 text-[9px] capitalize">{template.category}</span>
                    {template.industry && (
                      <>
                        <span className="text-zinc-600 text-[9px]">•</span>
                        <span className="text-zinc-500 text-[9px] capitalize">{template.industry}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn(
          'p-4 rounded-xl border text-center',
          isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200',
        )}>
          <Layout className={cn('w-8 h-8 mx-auto mb-2', isDark ? 'text-zinc-500' : 'text-slate-400')} />
          <p className={cn('text-sm', isDark ? 'text-zinc-300' : 'text-slate-700')}>No templates available</p>
          <p className={cn('text-[10px] mt-1', isDark ? 'text-zinc-500' : 'text-slate-500')}>Check your Supabase connection</p>
        </div>
      )}

      {/* Mobile App Starters */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          <h3 className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>Mobile App Starters</h3>
          <span className="text-[10px] text-zinc-500">iOS &amp; Android</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MOBILE_STARTERS.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => onStartMobile(tpl.prompt)}
              disabled={mobileBusy}
              className={cn(
                'group flex items-center gap-2 p-2.5 rounded-xl border hover:border-violet-500/30 transition-all text-left disabled:opacity-40',
                isDark
                  ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                  : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm',
              )}
            >
              <span className="text-xl">{tpl.emoji}</span>
              <span className={cn('text-[11px] font-medium', isDark ? 'text-white' : 'text-slate-800')}>{tpl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pro tip */}
      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
        <p className="text-violet-400 text-[10px] font-medium mb-1">💡 Pro tip</p>
        <p className="text-zinc-500 text-[10px] leading-relaxed">
          Quick Start tiles load full-design templates instantly — no AI wait. Type a prompt or click an element after loading to customize.
        </p>
      </div>
    </motion.div>
  )
}
