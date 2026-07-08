'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Plug,
  ExternalLink,
  Globe,
  Building2,
  Image as ImageIcon,
  CreditCard,
  Store,
  MessageSquare,
  Workflow,
  Sparkles,
  Clock,
  Lock,
  MapPin,
  BarChart3,
  Plus,
  ToggleRight,
  ToggleLeft,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandIcon, hasBrandIcon } from '@/lib/brand-icons'
import type { BusinessIntegration, EnvVar } from '../types'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'database', label: 'DB', icon: Building2 },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'payments', label: 'Pay', icon: CreditCard },
  { id: 'ecommerce', label: 'Shop', icon: Store },
  { id: 'communication', label: 'Msg', icon: MessageSquare },
  { id: 'automation', label: 'Auto', icon: Workflow },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'scheduling', label: 'Cal', icon: Clock },
  { id: 'auth', label: 'Auth', icon: Lock },
  { id: 'maps', label: 'Maps', icon: MapPin },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
] as const

interface IntegrationsPanelProps {
  isDark: boolean
  integrations: BusinessIntegration[]
  integrationFilter: string
  onFilterChange: (id: string) => void
  envVars: EnvVar[]
  // Insert button shows only when there's page HTML to inject into.
  hasHtml: boolean
  onInsertSnippet: (integration: BusinessIntegration) => void
  onToggle: (integration: BusinessIntegration) => void
  onEnvValueChange: (key: string, value: string) => void
  onAddToWebsite: (integration: BusinessIntegration) => void
}

export function IntegrationsPanel({
  isDark,
  integrations,
  integrationFilter,
  onFilterChange,
  envVars,
  hasHtml,
  onInsertSnippet,
  onToggle,
  onEnvValueChange,
  onAddToWebsite,
}: IntegrationsPanelProps) {
  const visibleIntegrations = integrations.filter(
    int => integrationFilter === 'all' || int.category === integrationFilter
  )
  return (
    <motion.div
      key="integrations"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Composio AI tools link */}
      <a
        href="/integrations"
        target="_blank"
        rel="noreferrer"
        className={cn(
          'flex items-center justify-between px-3 py-2.5 border-b text-xs font-medium transition-colors',
          isDark
            ? 'border-white/[0.05] text-violet-300 hover:bg-white/[0.04]'
            : 'border-slate-200 text-violet-700 hover:bg-violet-50'
        )}
      >
        <span className="flex items-center gap-2">
          <Plug className="w-3.5 h-3.5" />
          Connect AI tools — Gmail, Slack, HubSpot…
        </span>
        <ExternalLink className="w-3 h-3 opacity-60" />
      </a>

      {/* Category Filter */}
      <div className="p-2 border-b border-white/[0.05]">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onFilterChange(cat.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap transition-all',
                integrationFilter === cat.id
                  ? 'bg-violet-100 text-violet-700 border border-violet-300 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:text-white'
              )}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations List */}
      <div className="p-2 space-y-2">
        {visibleIntegrations.length === 0 ? (
          <div className={cn(
            'flex flex-col items-center justify-center text-center gap-1.5 py-10 px-4',
            isDark ? 'text-zinc-600' : 'text-slate-400',
          )}>
            <Plug className="w-6 h-6 opacity-50" />
            <p className="text-xs font-medium">No integrations in this category yet</p>
            <p className="text-[10px] opacity-80">Try a different category or check back later.</p>
          </div>
        ) : visibleIntegrations.map(integration => (
            <div
              key={integration.id}
              className={cn(
                'rounded-xl border transition-all',
                integration.enabled
                  ? 'bg-violet-100 border-violet-300 dark:bg-violet-500/10 dark:border-violet-500/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-white/[0.02] dark:border-white/[0.05] dark:hover:border-white/10'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden',
                    hasBrandIcon(integration.name)
                      // Real brand marks read best on a neutral tile, not tinted.
                      ? 'bg-white dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 p-1.5'
                      : integration.enabled
                        ? 'bg-violet-200 dark:bg-violet-500/20'
                        : 'bg-slate-100 dark:bg-white/[0.05]'
                  )}>
                    {hasBrandIcon(integration.name) ? (
                      <BrandIcon name={integration.name} className="w-full h-full" />
                    ) : (
                      <integration.icon className={cn(
                        'w-4 h-4',
                        integration.enabled
                          ? 'text-violet-700 dark:text-violet-400'
                          : 'text-slate-500 dark:text-zinc-500'
                      )} />
                    )}
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-xs font-medium",
                      integration.enabled
                        ? 'text-violet-900 dark:text-white'
                        : 'text-slate-900 dark:text-white'
                    )}>{integration.name}</h4>
                    <p className={cn(
                      "text-[10px] line-clamp-1",
                      integration.enabled
                        ? 'text-violet-700/80 dark:text-zinc-500'
                        : 'text-slate-500 dark:text-zinc-500'
                    )}>{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Insert snippet directly into the page HTML */}
                  {integration.codeSnippet && hasHtml && (
                    <button
                      onClick={() => onInsertSnippet(integration)}
                      title="Insert into page"
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border',
                        isDark
                          ? 'border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
                          : 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
                      )}
                    >
                      <Plus className="w-3 h-3" /> Insert
                    </button>
                  )}
                  <button
                    onClick={() => onToggle(integration)}
                    role="switch"
                    aria-checked={integration.enabled}
                    aria-label={`${integration.enabled ? 'Disable' : 'Enable'} ${integration.name} integration`}
                    title={`${integration.enabled ? 'Disable' : 'Enable'} ${integration.name}`}
                    className="p-1.5 flex items-center justify-center min-w-[44px] min-h-[44px]"
                  >
                    {integration.enabled ? (
                      <ToggleRight className="w-6 h-6 text-violet-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Config when enabled */}
              <AnimatePresence>
                {integration.enabled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "px-3 pb-3 space-y-2 pt-2 border-t",
                      isDark ? "border-white/[0.05]" : "border-violet-200"
                    )}>
                      {integration.envKeys.map(envKey => {
                        const envVar = envVars.find(e => e.key === envKey.key)
                        return (
                          <div key={envKey.key}>
                            <label className={cn(
                              "block text-[10px] mb-1 font-medium",
                              isDark ? "text-zinc-400" : "text-violet-800"
                            )}>
                              {envKey.label}
                            </label>
                            <input
                              type={envKey.isSecret ? 'password' : 'text'}
                              value={envVar?.value || ''}
                              onChange={(e) => onEnvValueChange(envKey.key, e.target.value)}
                              placeholder={envKey.placeholder}
                              className={cn(
                                "w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono focus:outline-none transition",
                                isDark
                                  ? "bg-black/30 border border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-violet-500/50"
                                  : "bg-white border border-violet-300 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 shadow-sm"
                              )}
                            />
                          </div>
                        )
                      })}

                      {/* Add to Website button */}
                      <button
                        onClick={() => onAddToWebsite(integration)}
                        className={cn(
                          "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors",
                          isDark
                            ? "bg-violet-500/20 hover:bg-violet-500/30 text-violet-400"
                            : "bg-violet-600 hover:bg-violet-700 text-white"
                        )}
                      >
                        <Zap className="w-3 h-3" />
                        Add to Website
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
      </div>

      {/* Quick Add Suggestion */}
      <div className="p-3 border-t border-white/[0.05]">
        <p className="text-[10px] text-zinc-600 text-center">
          Enable integrations and click "Add to Website" to bake them into your site
        </p>
      </div>
    </motion.div>
  )
}
