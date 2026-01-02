'use client'

import { motion } from 'framer-motion'
import {
  Monitor,
  Tablet,
  Smartphone,
  Code2,
  Eye,
  Layers,
  Download,
  RefreshCw,
  Undo2,
  Redo2,
  Copy,
  Check,
  Home,
  Save,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DeviceMode, ViewMode } from '../types'

interface ToolbarProps {
  deviceMode: DeviceMode
  viewMode: ViewMode
  canUndo: boolean
  canRedo: boolean
  copied: boolean
  theme: string
  onDeviceModeChange: (mode: DeviceMode) => void
  onViewModeChange: (mode: ViewMode) => void
  onUndo: () => void
  onRedo: () => void
  onCopy: () => void
  onRefresh: () => void
  onExport: () => void
  onSave: () => void
  onHome: () => void
  onThemeToggle: () => void
}

export function Toolbar({
  deviceMode,
  viewMode,
  canUndo,
  canRedo,
  copied,
  theme,
  onDeviceModeChange,
  onViewModeChange,
  onUndo,
  onRedo,
  onCopy,
  onRefresh,
  onExport,
  onSave,
  onHome,
  onThemeToggle,
}: ToolbarProps) {
  return (
    <div className={cn(
      "h-12 border-b flex items-center justify-between px-4",
      theme === 'dark'
        ? "bg-slate-900/95 border-slate-700/50"
        : "bg-white/95 border-slate-200"
    )}>
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onHome}
          className={cn(
            "p-2 rounded-lg transition-colors",
            theme === 'dark'
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
          title="Go to Home"
        >
          <Home className="w-4 h-4" />
        </motion.button>

        <div className={cn(
          "w-px h-6",
          theme === 'dark' ? "bg-slate-700" : "bg-slate-200"
        )} />

        {/* Undo/Redo */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            "p-2 rounded-lg transition-colors",
            !canUndo && "opacity-50 cursor-not-allowed",
            theme === 'dark'
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRedo}
          disabled={!canRedo}
          className={cn(
            "p-2 rounded-lg transition-colors",
            !canRedo && "opacity-50 cursor-not-allowed",
            theme === 'dark'
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Center: Device Mode */}
      <div className={cn(
        "flex items-center gap-1 p-1 rounded-lg",
        theme === 'dark' ? "bg-slate-800/50" : "bg-slate-100"
      )}>
        {[
          { mode: 'desktop' as const, icon: Monitor, label: 'Desktop' },
          { mode: 'tablet' as const, icon: Tablet, label: 'Tablet' },
          { mode: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
        ].map(({ mode, icon: Icon, label }) => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDeviceModeChange(mode)}
            className={cn(
              "p-2 rounded-md transition-all",
              deviceMode === mode
                ? theme === 'dark'
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-purple-500 text-white shadow-lg"
                : theme === 'dark'
                  ? "text-slate-400 hover:text-white hover:bg-slate-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            )}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </motion.button>
        ))}

        <div className={cn(
          "w-px h-6 mx-1",
          theme === 'dark' ? "bg-slate-700" : "bg-slate-300"
        )} />

        {/* View Mode */}
        {[
          { mode: 'preview' as const, icon: Eye, label: 'Preview' },
          { mode: 'code' as const, icon: Code2, label: 'Code' },
          { mode: 'split' as const, icon: Layers, label: 'Split View' },
        ].map(({ mode, icon: Icon, label }) => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange(mode)}
            className={cn(
              "p-2 rounded-md transition-all",
              viewMode === mode
                ? theme === 'dark'
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-purple-500 text-white shadow-lg"
                : theme === 'dark'
                  ? "text-slate-400 hover:text-white hover:bg-slate-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            )}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </motion.button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onThemeToggle}
          className={cn(
            "p-2 rounded-lg transition-colors",
            theme === 'dark'
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCopy}
          className={cn(
            "p-2 rounded-lg transition-colors",
            theme === 'dark'
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
          title="Copy HTML"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          className={cn(
            "p-2 rounded-lg transition-colors",
            theme === 'dark'
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
          title="Refresh Preview"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSave}
          className={cn(
            "p-2 rounded-lg transition-colors",
            theme === 'dark'
              ? "hover:bg-slate-800 text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
          title="Save Project"
        >
          <Save className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExport}
          className={cn(
            "px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2",
            theme === 'dark'
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25"
              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25"
          )}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Export</span>
        </motion.button>
      </div>
    </div>
  )
}

export default Toolbar
