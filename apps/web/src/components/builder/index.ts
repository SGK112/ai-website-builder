/**
 * Builder Components
 *
 * ACTIVELY USED:
 * - StylePresetPicker - Theme/style selection in workspace
 * - ComponentPicker - Component library picker modal
 *
 * AVAILABLE FOR FUTURE USE:
 * The following components are built and ready but not yet integrated:
 * - BuilderChat, ChatPanel, ChatRefinement - Chat interfaces
 * - CodeHighlighter, CodeViewer - Code display
 * - ComponentLibrary - Full component browser
 * - DeploymentPanel - Deployment UI
 * - DraggableComponentList - Drag-drop component tree
 * - EmbedWidgets - Third-party widget embeds
 * - FileTree - Project file browser
 * - IntegrationsPanel - Third-party integrations
 * - PropertiesPanel - Element properties editor
 * - LivePreview - Preview component
 * - PageManager, PagesPanel - Multi-page management
 * - SEOSettings - SEO configuration
 * - And more in the builder/ directory
 */

// ============================================
// ACTIVELY USED IN WORKSPACE
// ============================================
export { StylePresetPicker } from './StylePresetPicker'
export { ComponentPicker } from './ComponentPicker'

// ============================================
// AVAILABLE COMPONENTS (for future integration)
// ============================================
export { BuilderChat } from './BuilderChat'
export { CodeHighlighter, SimpleCodeBlock } from './CodeHighlighter'
export { CodeViewer } from './CodeViewer'
export { ComponentLibrary } from './ComponentLibrary'
export { DeploymentPanel } from './DeploymentPanel'
export { DraggableComponentList, parseComponentTree } from './DraggableComponentList'
export type { ComponentNode } from './DraggableComponentList'
export { EmbedWidgets } from './EmbedWidgets'
export { FileTree } from './FileTree'
export { IntegrationsPanel } from './IntegrationsPanel'
export { PropertiesPanel } from './PropertiesPanel'
