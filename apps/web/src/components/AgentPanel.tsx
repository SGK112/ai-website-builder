'use client'

/**
 * StewAgent Panel - WebStew's Autonomous AI Chef
 * A Manus-like agent with cooking-themed UI that matches WebStew's branding
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Brain, Loader2, CheckCircle2, XCircle, AlertCircle,
  Sparkles, Code2, Image, FileText, Search, Globe,
  ChevronDown, ChevronUp, Play, Pause, X, Send,
  Zap, Clock, Activity, Layers, ArrowRight, RefreshCw,
  ChefHat, Flame, Soup, Cookie, UtensilsCrossed, Timer,
  Lightbulb, Target, Rocket, Wand2, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentProgressUpdate {
  type: 'thinking' | 'executing' | 'observing' | 'complete' | 'error' | 'waiting_input'
  message: string
  progress?: number
  artifacts?: any[]
  question?: string
}

interface AgentStep {
  id: string
  action: string
  thought?: string
  result?: string
  status: 'pending' | 'running' | 'complete' | 'error'
  timestamp: Date
  icon?: string
}

interface Artifact {
  id: string
  type: 'code' | 'image' | 'file' | 'text'
  name: string
  content: string | Buffer
  mimeType?: string
  metadata?: Record<string, any>
}

// Cooking-themed action descriptions
const COOKING_ACTIONS: Record<string, { verb: string; icon: any; color: string }> = {
  thinking: { verb: 'Simmering ideas', icon: Brain, color: 'text-amber-400' },
  search: { verb: 'Gathering ingredients', icon: Search, color: 'text-blue-400' },
  fetch: { verb: 'Sourcing fresh content', icon: Globe, color: 'text-cyan-400' },
  code: { verb: 'Cooking up code', icon: Code2, color: 'text-emerald-400' },
  generate: { verb: 'Preparing the recipe', icon: Wand2, color: 'text-violet-400' },
  image: { verb: 'Plating the visuals', icon: Image, color: 'text-pink-400' },
  file: { verb: 'Boxing up deliverables', icon: FileText, color: 'text-orange-400' },
  analyze: { verb: 'Tasting & adjusting', icon: UtensilsCrossed, color: 'text-yellow-400' },
  complete: { verb: 'Dish is ready!', icon: Cookie, color: 'text-emerald-400' },
  error: { verb: 'Burnt! Retrying...', icon: Flame, color: 'text-red-400' },
}

// Example tasks the agent can do
const EXAMPLE_TASKS = [
  { icon: Rocket, label: 'Build a landing page', prompt: 'Create a modern landing page for a tech startup with hero, features, and CTA sections' },
  { icon: Search, label: 'Research & create', prompt: 'Research best practices for e-commerce sites and build a product showcase page' },
  { icon: Image, label: 'Design with images', prompt: 'Build a photography portfolio with a gallery, about section, and contact form' },
  { icon: Code2, label: 'Complex app', prompt: 'Create an interactive dashboard with charts, stats cards, and a data table' },
]

interface AgentPanelProps {
  isOpen: boolean
  onClose: () => void
  goal: string
  onComplete?: (result: any) => void
  onArtifact?: (artifact: Artifact) => void
  className?: string
}

export function AgentPanel({
  isOpen,
  onClose,
  goal,
  onComplete,
  onArtifact,
  className
}: AgentPanelProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'waiting' | 'complete' | 'error'>('idle')
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [progress, setProgress] = useState(0)
  const [currentThought, setCurrentThought] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [waitingForInput, setWaitingForInput] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [question, setQuestion] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [showIntro, setShowIntro] = useState(true)

  const stepsRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll steps container
  useEffect(() => {
    if (stepsRef.current) {
      stepsRef.current.scrollTop = stepsRef.current.scrollHeight
    }
  }, [steps])

  // Get cooking-themed action info
  const getCookingAction = (action: string) => {
    const lowerAction = action.toLowerCase()
    if (lowerAction.includes('think') || lowerAction.includes('analyz')) return COOKING_ACTIONS.thinking
    if (lowerAction.includes('search')) return COOKING_ACTIONS.search
    if (lowerAction.includes('fetch') || lowerAction.includes('url')) return COOKING_ACTIONS.fetch
    if (lowerAction.includes('code') || lowerAction.includes('generat')) return COOKING_ACTIONS.code
    if (lowerAction.includes('image')) return COOKING_ACTIONS.image
    if (lowerAction.includes('file') || lowerAction.includes('write')) return COOKING_ACTIONS.file
    if (lowerAction.includes('complete') || lowerAction.includes('done')) return COOKING_ACTIONS.complete
    if (lowerAction.includes('error') || lowerAction.includes('fail')) return COOKING_ACTIONS.error
    return COOKING_ACTIONS.generate
  }

  // Start agent execution
  const startAgent = useCallback(async (taskGoal: string, additionalContext?: string) => {
    setStatus('running')
    setError(null)
    setSteps([])
    setArtifacts([])
    setProgress(0)
    setWaitingForInput(false)
    setShowIntro(false)

    // Add initial "Starting" step
    setSteps([{
      id: 'start',
      action: 'Firing up the kitchen',
      thought: 'Preparing to cook your website...',
      status: 'running',
      timestamp: new Date(),
    }])

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: additionalContext ? `${taskGoal}\n\nAdditional context: ${additionalContext}` : taskGoal,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Agent request failed: ${response.statusText}`)
      }

      // Mark first step as complete
      setSteps(prev => prev.map(s => s.id === 'start' ? { ...s, status: 'complete' as const } : s))

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'progress') {
                handleProgressUpdate(parsed.update)
              } else if (parsed.type === 'complete') {
                handleComplete(parsed.result)
              } else if (parsed.type === 'error') {
                handleError(parsed.error)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        handleError(err.message)
      }
    }
  }, [])

  // Handle progress updates from agent
  const handleProgressUpdate = (update: AgentProgressUpdate) => {
    setProgress(update.progress || 0)
    setCurrentThought(update.message)

    const cookingAction = getCookingAction(update.message)

    if (update.type === 'thinking') {
      setSteps(prev => [...prev, {
        id: `step_${Date.now()}`,
        action: cookingAction.verb,
        thought: update.message,
        status: 'running',
        timestamp: new Date(),
      }])
    } else if (update.type === 'executing') {
      setSteps(prev => {
        const updated = [...prev]
        if (updated.length > 0) {
          updated[updated.length - 1].status = 'complete'
        }
        return [...updated, {
          id: `step_${Date.now()}`,
          action: cookingAction.verb,
          status: 'running',
          timestamp: new Date(),
        }]
      })
    } else if (update.type === 'observing') {
      setSteps(prev => {
        const updated = [...prev]
        if (updated.length > 0) {
          updated[updated.length - 1].result = update.message
          updated[updated.length - 1].status = update.message.includes('Failed') ? 'error' : 'complete'
        }
        return updated
      })
    } else if (update.type === 'waiting_input') {
      setWaitingForInput(true)
      setQuestion(update.question || 'The chef needs your input:')
      setStatus('waiting')
    }

    // Handle artifacts
    if (update.artifacts) {
      setArtifacts(prev => [...prev, ...update.artifacts!])
      update.artifacts.forEach(artifact => {
        onArtifact?.(artifact)
      })
    }
  }

  // Handle completion
  const handleComplete = (result: any) => {
    setStatus('complete')
    setProgress(100)
    setSteps(prev => {
      const updated = prev.map(s => ({ ...s, status: s.status === 'running' ? 'complete' as const : s.status }))
      return [...updated, {
        id: 'complete',
        action: 'Order up! Your website is ready',
        status: 'complete' as const,
        timestamp: new Date(),
      }]
    })
    onComplete?.(result)
  }

  // Handle errors
  const handleError = (errorMessage: string) => {
    setStatus('error')
    setError(errorMessage)
    setSteps(prev => prev.map(s => ({ ...s, status: s.status === 'running' ? 'error' as const : s.status })))
  }

  // Submit user input (for multi-turn conversations)
  const submitUserInput = () => {
    if (!userInput.trim()) return

    setWaitingForInput(false)
    setQuestion('')
    setStatus('running')

    // Add user response as a step
    setSteps(prev => [...prev, {
      id: `input_${Date.now()}`,
      action: 'Added your special request',
      thought: userInput,
      status: 'complete',
      timestamp: new Date(),
    }])

    // Continue the agent with the user's input
    startAgent(goal, userInput)
    setUserInput('')
  }

  // Cancel agent
  const cancelAgent = () => {
    abortControllerRef.current?.abort()
    setStatus('idle')
    onClose()
  }

  // Start agent when goal changes
  useEffect(() => {
    if (isOpen && goal && status === 'idle' && !showIntro) {
      startAgent(goal)
    }
  }, [isOpen, goal, status, showIntro, startAgent])

  // Reset when panel opens with new goal
  useEffect(() => {
    if (isOpen && goal) {
      setShowIntro(false)
      setStatus('idle')
      startAgent(goal)
    }
  }, [goal])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={cn(
          'fixed bottom-24 right-6 w-[420px] max-h-[75vh] rounded-2xl overflow-hidden',
          'bg-gradient-to-b from-zinc-900 to-zinc-950',
          'border border-orange-500/20',
          'shadow-2xl shadow-orange-500/10',
          'z-50 flex flex-col',
          className
        )}
      >
        {/* Header - Chef themed */}
        <div className="px-4 py-3 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
                animate={status === 'running' ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5, repeat: status === 'running' ? Infinity : 0, repeatDelay: 1 }}
              >
                <ChefHat className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">StewAgent</span>
                  {status === 'running' && (
                    <motion.div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px]"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Flame className="w-3 h-3" />
                      <span>Cooking</span>
                    </motion.div>
                  )}
                  {status === 'complete' && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Done</span>
                    </div>
                  )}
                  {status === 'waiting' && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
                      <MessageSquare className="w-3 h-3" />
                      <span>Your input needed</span>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]">
                      <XCircle className="w-3 h-3" />
                      <span>Error</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500">
                  Your autonomous AI sous-chef
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button
                onClick={cancelAgent}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar - looks like a cooking timer */}
          {status === 'running' && (
            <div className="mt-3 relative">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Cooking progress
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Current Task */}
              {goal && (
                <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05]">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Target className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Current Order</span>
                      <p className="text-xs text-white line-clamp-2">{goal}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Capabilities intro (shown initially or when idle) */}
              {showIntro && !goal && (
                <div className="p-4 space-y-4">
                  <div className="text-center">
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto shadow-xl shadow-orange-500/30"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ChefHat className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white mt-3">Meet StewAgent</h3>
                    <p className="text-xs text-zinc-400 mt-1">Your AI sous-chef that works autonomously</p>
                  </div>

                  {/* What it can do */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-wide px-1">What I can cook up</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: Search, label: 'Research topics', color: 'text-blue-400' },
                        { icon: Code2, label: 'Generate code', color: 'text-emerald-400' },
                        { icon: Image, label: 'Create images', color: 'text-pink-400' },
                        { icon: Globe, label: 'Fetch content', color: 'text-cyan-400' },
                        { icon: Brain, label: 'Plan & reason', color: 'text-violet-400' },
                        { icon: FileText, label: 'Write files', color: 'text-orange-400' },
                      ].map(({ icon: Icon, label, color }) => (
                        <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                          <Icon className={cn('w-4 h-4', color)} />
                          <span className="text-xs text-zinc-300">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example tasks */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-wide px-1">Try asking me to</h4>
                    <div className="space-y-1.5">
                      {EXAMPLE_TASKS.map(({ icon: Icon, label, prompt }) => (
                        <button
                          key={label}
                          onClick={() => {
                            setShowIntro(false)
                            // This would trigger the agent through parent
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-orange-500/10 hover:border-orange-500/20 transition-all text-left group"
                        >
                          <Icon className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                          <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">{label}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-orange-400 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Steps timeline */}
              {!showIntro && steps.length > 0 && (
                <div
                  ref={stepsRef}
                  className="flex-1 overflow-y-auto max-h-[300px] px-4 py-3 space-y-3"
                >
                  {steps.map((step, index) => {
                    const cookingAction = getCookingAction(step.action)
                    const Icon = cookingAction.icon

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        {/* Connector line */}
                        {index !== steps.length - 1 && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-orange-500/30 to-transparent" />
                        )}

                        <div className="flex items-start gap-3">
                          {/* Step indicator */}
                          <motion.div
                            className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border',
                              step.status === 'running'
                                ? 'bg-orange-500/20 border-orange-500/50'
                                : step.status === 'complete'
                                  ? 'bg-emerald-500/20 border-emerald-500/30'
                                  : step.status === 'error'
                                    ? 'bg-red-500/20 border-red-500/30'
                                    : 'bg-zinc-800/50 border-zinc-700/50'
                            )}
                            animate={step.status === 'running' ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1, repeat: step.status === 'running' ? Infinity : 0 }}
                          >
                            {step.status === 'running' ? (
                              <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                            ) : step.status === 'complete' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : step.status === 'error' ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : (
                              <Icon className={cn('w-4 h-4', cookingAction.color)} />
                            )}
                          </motion.div>

                          {/* Step content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-sm font-medium',
                                step.status === 'running' ? 'text-orange-400' :
                                step.status === 'complete' ? 'text-white' :
                                step.status === 'error' ? 'text-red-400' :
                                'text-zinc-400'
                              )}>
                                {step.action}
                              </span>
                              {step.status === 'running' && (
                                <motion.span
                                  className="text-[10px] text-orange-400/60"
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  in progress...
                                </motion.span>
                              )}
                            </div>
                            {step.thought && (
                              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{step.thought}</p>
                            )}
                            {step.result && (
                              <p className={cn(
                                'text-[11px] mt-1 px-2 py-1 rounded-md inline-block',
                                step.status === 'error'
                                  ? 'text-red-400 bg-red-500/10'
                                  : 'text-emerald-400 bg-emerald-500/10'
                              )}>
                                {step.result}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Current thought bubble */}
                  {status === 'running' && currentThought && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-11 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[11px] text-amber-300">{currentThought}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Artifacts produced */}
              {artifacts.length > 0 && (
                <div className="px-4 py-3 border-t border-white/[0.08] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-medium text-white">Fresh from the oven</span>
                    <span className="text-[10px] text-zinc-500">({artifacts.length} items)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {artifacts.map((artifact) => (
                      <motion.button
                        key={artifact.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
                      >
                        {artifact.type === 'code' ? <Code2 className="w-3.5 h-3.5 text-emerald-400" /> :
                         artifact.type === 'image' ? <Image className="w-3.5 h-3.5 text-pink-400" /> :
                         <FileText className="w-3.5 h-3.5 text-orange-400" />}
                        <span className="text-[11px] text-zinc-300 max-w-[100px] truncate">{artifact.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Waiting for input */}
              {waitingForInput && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-4 border-t border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">{question}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitUserInput()}
                      placeholder="Type your response..."
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-800/80 border border-amber-500/20 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                      autoFocus
                    />
                    <button
                      onClick={submitUserInput}
                      disabled={!userInput.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:hover:shadow-none"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error state */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 border-t border-red-500/20 bg-red-500/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-400">Something burnt!</p>
                      <p className="text-[11px] text-red-300/70 mt-0.5">{error}</p>
                      <button
                        onClick={() => {
                          setError(null)
                          setStatus('idle')
                          startAgent(goal)
                        }}
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-orange-400 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Try cooking again</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Complete state */}
              {status === 'complete' && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-4 border-t border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/5"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-emerald-400">Order up!</p>
                      <p className="text-[11px] text-zinc-400">
                        Your website is ready to serve.
                        {artifacts.length > 0 && ` Created ${artifacts.length} item${artifacts.length !== 1 ? 's' : ''}.`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

export default AgentPanel
