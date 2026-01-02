/**
 * Global State Management
 * Centralized Zustand stores for the application
 */

export {
  useWorkspaceStore,
  useHtml,
  useIsGenerating,
  useBuildPhase,
  useSelectedModel,
  useActivePanel,
  type WorkspaceState,
  type DeviceMode,
  type ViewMode,
  type Panel,
  type BuildPhase,
  type HistoryEntry,
} from './workspace'
