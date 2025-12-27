// Builder.io Components
export {
  BuilderContent,
  BuilderPage,
  BuilderSection,
  BuilderAnnouncement,
  BuilderHeader,
  BuilderFooter,
} from './BuilderContent'

// Settings Component
export { BuilderSettings } from './BuilderSettings'

// Re-export utilities
export {
  builder,
  isBuilderConfigured,
  getBuilderPage,
  getBuilderSection,
  getBuilderEntries,
  registerBuilderComponent,
} from '@/lib/builder-io'
