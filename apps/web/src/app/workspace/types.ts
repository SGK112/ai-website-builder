// Workspace Types - Extracted from monolith for maintainability

import { Globe } from 'lucide-react'

export type DeviceMode = 'desktop' | 'tablet' | 'mobile'
export type ViewMode = 'preview' | 'code' | 'split'
export type Panel = 'build' | 'projects' | 'integrations' | 'images' | 'env' | 'console' | 'deploy' | 'webstew'
export type SkillLevel = 'no-code' | 'low-code' | 'full-stack'
export type BuildTarget = 'website' | 'astro' | 'nextjs' | 'react' | 'expo'
export type BuildPhase = 'idle' | 'structure' | 'styling' | 'interactivity' | 'complete'
export type ConsoleLogType = 'log' | 'info' | 'warn' | 'error' | 'success'
export type AIProvider = 'auto' | 'anthropic' | 'openai' | 'google' | 'xai' | 'huggingface' | 'together' | 'cloudflare'

export interface SelectedElement {
  tagName: string
  className: string
  id: string
  textContent: string
  directText?: string
  outerHTML: string
  path: string
  rect: { top: number; left: number; width: number; height: number }
  section?: { tagName: string; id?: string; dataSection?: string; className?: string }
  isEditable?: boolean
}

export interface ImageEdit {
  id: string
  url: string
  name: string
  operation: 'remove-bg' | 'to-video' | 'enhance' | null
  status: 'idle' | 'processing' | 'complete' | 'error'
  result?: string
}

export interface BusinessIntegration {
  id: string
  name: string
  description: string
  icon: typeof Globe
  category: 'maps' | 'payments' | 'ecommerce' | 'analytics' | 'database' | 'media' | 'communication' | 'automation' | 'ai' | 'scheduling' | 'auth'
  enabled: boolean
  envKeys: { key: string; label: string; placeholder: string; isSecret: boolean }[]
  codeSnippet: string
}

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  description: string
  contextWindow: string
  speed: 'fast' | 'medium' | 'slow'
  quality: 'good' | 'great' | 'best'
  free?: boolean
}

export interface StockImage {
  id: string
  url: string
  thumb: string
  alt: string
  category: string
  source: 'unsplash' | 'pexels' | 'pixabay'
}

export interface Project {
  id: string
  name: string
  html: string
  css?: string
  js?: string
  envVars: EnvVar[]
  skillLevel: SkillLevel
  createdAt: Date
  updatedAt: Date
}

export interface HistoryEntry {
  html: string
  prompt: string
  timestamp: Date
}

export interface BuildStep {
  phase: BuildPhase
  label: string
  icon: React.ComponentType<{ className?: string }>
  status: 'pending' | 'active' | 'complete'
}

export interface TerminalLine {
  type: 'command' | 'output' | 'success' | 'error' | 'info' | 'phase' | 'ai' | 'system'
  content: string
  timestamp?: Date
}

export interface ConsoleLog {
  type: ConsoleLogType
  message: string
  timestamp: Date
  source?: string
}

export interface EnvVar {
  key: string
  value: string
  isSecret: boolean
}

export interface WorkspaceSettings {
  openaiKey: string
  githubToken: string
  renderKey: string
}

export interface PromptSuggestion {
  icon: React.ComponentType<{ className?: string }>
  label: string
  prompt: string
}

export interface QuickStartTemplate {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  gradient: string
  prompt: string
  htmlTemplate?: string
  isPremade?: boolean
}

// Workspace State
export interface WorkspaceState {
  html: string
  prompt: string
  isGenerating: boolean
  deviceMode: DeviceMode
  viewMode: ViewMode
  activePanel: Panel
  skillLevel: SkillLevel
  buildPhase: BuildPhase
  selectedModel: string
  history: HistoryEntry[]
  historyIndex: number
  consoleLogs: ConsoleLog[]
  envVars: EnvVar[]
  selectedElement: SelectedElement | null
  sidebarCollapsed: boolean
}

// Workspace Actions
export type WorkspaceAction =
  | { type: 'SET_HTML'; payload: string }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_DEVICE_MODE'; payload: DeviceMode }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_ACTIVE_PANEL'; payload: Panel }
  | { type: 'SET_SKILL_LEVEL'; payload: SkillLevel }
  | { type: 'SET_BUILD_PHASE'; payload: BuildPhase }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'ADD_HISTORY'; payload: HistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'ADD_CONSOLE_LOG'; payload: ConsoleLog }
  | { type: 'CLEAR_CONSOLE' }
  | { type: 'SET_ENV_VARS'; payload: EnvVar[] }
  | { type: 'SET_SELECTED_ELEMENT'; payload: SelectedElement | null }
  | { type: 'TOGGLE_SIDEBAR' }
