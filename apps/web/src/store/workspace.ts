/**
 * Workspace Store - Centralized state management for the builder
 * Using Zustand for simple, performant state management
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DeviceMode = 'desktop' | 'tablet' | 'mobile'
export type ViewMode = 'preview' | 'code' | 'split'
export type Panel = 'build' | 'components' | 'media' | 'deploy' | 'settings'
export type BuildPhase = 'idle' | 'thinking' | 'generating' | 'styling' | 'complete'

export interface HistoryEntry {
  html: string
  timestamp: number
  prompt?: string
}

export interface WorkspaceState {
  // Content
  html: string
  prompt: string

  // Generation
  isGenerating: boolean
  buildPhase: BuildPhase
  generationProgress: number
  selectedModel: string

  // UI State
  activePanel: Panel
  deviceMode: DeviceMode
  viewMode: ViewMode
  sidebarCollapsed: boolean

  // History (undo/redo)
  history: HistoryEntry[]
  historyIndex: number

  // Selected element for editing
  selectedElement: {
    tagName: string
    xpath: string
    styles: Record<string, string>
  } | null

  // Actions
  setHtml: (html: string, addToHistory?: boolean) => void
  setPrompt: (prompt: string) => void
  setGenerating: (isGenerating: boolean, phase?: BuildPhase) => void
  setProgress: (progress: number) => void
  setModel: (model: string) => void
  setActivePanel: (panel: Panel) => void
  setDeviceMode: (mode: DeviceMode) => void
  setViewMode: (mode: ViewMode) => void
  toggleSidebar: () => void
  setSelectedElement: (element: WorkspaceState['selectedElement']) => void

  // History actions
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Reset
  reset: () => void
}

const MAX_HISTORY = 50

const initialState = {
  html: '',
  prompt: '',
  isGenerating: false,
  buildPhase: 'idle' as BuildPhase,
  generationProgress: 0,
  selectedModel: 'claude-3-haiku',
  activePanel: 'build' as Panel,
  deviceMode: 'desktop' as DeviceMode,
  viewMode: 'preview' as ViewMode,
  sidebarCollapsed: false,
  history: [] as HistoryEntry[],
  historyIndex: -1,
  selectedElement: null,
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHtml: (html, addToHistory = true) => {
        const state = get()
        if (addToHistory && html !== state.html) {
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push({ html, timestamp: Date.now(), prompt: state.prompt })
          if (newHistory.length > MAX_HISTORY) newHistory.shift()
          set({
            html,
            history: newHistory,
            historyIndex: newHistory.length - 1
          })
        } else {
          set({ html })
        }
      },

      setPrompt: (prompt) => set({ prompt }),

      setGenerating: (isGenerating, phase = 'idle') => set({
        isGenerating,
        buildPhase: phase,
        generationProgress: isGenerating ? 0 : 100
      }),

      setProgress: (generationProgress) => set({ generationProgress }),

      setModel: (selectedModel) => set({ selectedModel }),

      setActivePanel: (activePanel) => set({ activePanel }),

      setDeviceMode: (deviceMode) => set({ deviceMode }),

      setViewMode: (viewMode) => set({ viewMode }),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSelectedElement: (selectedElement) => set({ selectedElement }),

      undo: () => {
        const state = get()
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1
          set({
            historyIndex: newIndex,
            html: state.history[newIndex].html
          })
        }
      },

      redo: () => {
        const state = get()
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1
          set({
            historyIndex: newIndex,
            html: state.history[newIndex].html
          })
        }
      },

      canUndo: () => get().historyIndex > 0,

      canRedo: () => get().historyIndex < get().history.length - 1,

      reset: () => set(initialState),
    }),
    {
      name: 'webstew-workspace',
      partialize: (state) => ({
        html: state.html,
        selectedModel: state.selectedModel,
        history: state.history.slice(-10), // Only persist last 10
        historyIndex: Math.min(state.historyIndex, 9),
      }),
    }
  )
)

// Selector hooks for performance
export const useHtml = () => useWorkspaceStore((s) => s.html)
export const useIsGenerating = () => useWorkspaceStore((s) => s.isGenerating)
export const useBuildPhase = () => useWorkspaceStore((s) => s.buildPhase)
export const useSelectedModel = () => useWorkspaceStore((s) => s.selectedModel)
export const useActivePanel = () => useWorkspaceStore((s) => s.activePanel)
