'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Sparkles,
  Loader2,
  ChevronDown,
  Zap,
  Bot,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiModels, quickStartTemplates, promptSuggestions } from '../constants'
import type { SkillLevel, AIModel } from '../types'

interface BuildPanelProps {
  prompt: string
  isGenerating: boolean
  selectedModel: string
  skillLevel: SkillLevel
  theme: string
  onPromptChange: (prompt: string) => void
  onGenerate: () => void
  onModelChange: (modelId: string) => void
  onSkillLevelChange: (level: SkillLevel) => void
  onTemplateSelect: (template: typeof quickStartTemplates[0]) => void
}

export function BuildPanel({
  prompt,
  isGenerating,
  selectedModel,
  skillLevel,
  theme,
  onPromptChange,
  onGenerate,
  onModelChange,
  onSkillLevelChange,
  onTemplateSelect,
}: BuildPanelProps) {
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentModel = aiModels.find(m => m.id === selectedModel) || aiModels[0]
  const currentSuggestions = promptSuggestions[skillLevel]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (prompt.trim() && !isGenerating) {
        onGenerate()
      }
    }
  }

  return (
    <div className={cn(
      "h-full flex flex-col",
      theme === 'dark' ? "bg-slate-900" : "bg-white"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 border-b",
        theme === 'dark' ? "border-slate-700" : "border-slate-200"
      )}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={cn(
            "font-semibold flex items-center gap-2",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Builder
          </h2>

          {/* Model selector */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModelPicker(!showModelPicker)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                theme === 'dark'
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <Bot className="w-4 h-4" />
              <span>{currentModel.name}</span>
              {currentModel.free && (
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">FREE</span>
              )}
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showModelPicker && "rotate-180"
              )} />
            </motion.button>

            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border z-50 max-h-80 overflow-auto",
                    theme === 'dark'
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  )}
                >
                  <div className="p-2">
                    <div className={cn(
                      "text-xs font-medium px-2 py-1 mb-1",
                      theme === 'dark' ? "text-green-400" : "text-green-600"
                    )}>
                      🆓 Free Models
                    </div>
                    {aiModels.filter(m => m.free).map(model => (
                      <ModelOption
                        key={model.id}
                        model={model}
                        selected={selectedModel === model.id}
                        theme={theme}
                        onClick={() => {
                          onModelChange(model.id)
                          setShowModelPicker(false)
                        }}
                      />
                    ))}

                    <div className={cn(
                      "text-xs font-medium px-2 py-1 mt-3 mb-1",
                      theme === 'dark' ? "text-purple-400" : "text-purple-600"
                    )}>
                      💎 Premium Models
                    </div>
                    {aiModels.filter(m => !m.free).map(model => (
                      <ModelOption
                        key={model.id}
                        model={model}
                        selected={selectedModel === model.id}
                        theme={theme}
                        onClick={() => {
                          onModelChange(model.id)
                          setShowModelPicker(false)
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skill level tabs */}
        <div className={cn(
          "flex gap-1 p-1 rounded-lg",
          theme === 'dark' ? "bg-slate-800" : "bg-slate-100"
        )}>
          {Object.entries(promptSuggestions).map(([level, config]) => {
            const Icon = config.icon
            return (
              <motion.button
                key={level}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSkillLevelChange(level as SkillLevel)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                  skillLevel === level
                    ? "bg-purple-600 text-white shadow-lg"
                    : theme === 'dark'
                      ? "text-slate-400 hover:text-white hover:bg-slate-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Quick Templates */}
      <div className={cn(
        "p-4 border-b overflow-x-auto",
        theme === 'dark' ? "border-slate-700" : "border-slate-200"
      )}>
        <div className="flex gap-2 min-w-max">
          {quickStartTemplates.slice(0, 4).map(template => {
            const Icon = template.icon
            return (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTemplateSelect(template)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  `bg-gradient-to-r ${template.gradient} text-white shadow-lg hover:shadow-xl`
                )}
              >
                <Icon className="w-4 h-4" />
                {template.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && !prompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "p-4 border-b overflow-auto max-h-48",
              theme === 'dark' ? "border-slate-700" : "border-slate-200"
            )}
          >
            <div className="grid grid-cols-2 gap-2">
              {currentSuggestions.suggestions.slice(0, 6).map((suggestion, i) => {
                const Icon = suggestion.icon
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPromptChange(suggestion.prompt)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                      theme === 'dark'
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    )}
                  >
                    <Icon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="truncate">{suggestion.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Input */}
      <div className="flex-1 p-4 flex flex-col">
        <div className={cn(
          "flex-1 rounded-xl border transition-colors",
          theme === 'dark'
            ? "bg-slate-800 border-slate-700 focus-within:border-purple-500"
            : "bg-slate-50 border-slate-200 focus-within:border-purple-500"
        )}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            disabled={isGenerating}
            className={cn(
              "w-full h-full p-4 bg-transparent resize-none outline-none text-sm",
              theme === 'dark'
                ? "text-white placeholder:text-slate-500"
                : "text-slate-900 placeholder:text-slate-400",
              isGenerating && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={cn(
            "mt-4 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
            prompt.trim() && !isGenerating
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
              : theme === 'dark'
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Generate Website
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}

function ModelOption({
  model,
  selected,
  theme,
  onClick,
}: {
  model: AIModel
  selected: boolean
  theme: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
        selected
          ? "bg-purple-600/20 border border-purple-500/50"
          : theme === 'dark'
            ? "hover:bg-slate-700"
            : "hover:bg-slate-100"
      )}
    >
      <Brain className={cn(
        "w-5 h-5",
        selected ? "text-purple-400" : theme === 'dark' ? "text-slate-500" : "text-slate-400"
      )} />
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium flex items-center gap-2",
          theme === 'dark' ? "text-white" : "text-slate-900"
        )}>
          {model.name}
          {model.free && (
            <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">FREE</span>
          )}
        </div>
        <div className={cn(
          "text-xs truncate",
          theme === 'dark' ? "text-slate-400" : "text-slate-500"
        )}>
          {model.description}
        </div>
      </div>
      <div className={cn(
        "text-xs",
        theme === 'dark' ? "text-slate-500" : "text-slate-400"
      )}>
        {model.contextWindow}
      </div>
    </motion.button>
  )
}

export default BuildPanel
