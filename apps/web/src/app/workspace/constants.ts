// Workspace Constants. (Trimmed: aiModels / buildSteps / quickStartTemplates /
// promptSuggestions / buildingQuips / deviceDimensions were only used by the
// now-deleted orphan components — page.tsx keeps its own live copies.)

import type { SkillLevel, BuildTarget } from './types'

// Default build target per skill tier. no-code/low-code stay on the static
// `website` pipeline (instant publish, no build step); full-stack defaults to
// a Next.js app since those users expect routes/data, not a single HTML file.
// Only applied to a fresh/empty canvas — never clobbers an existing project.
export function defaultBuildTargetForLevel(level: SkillLevel): BuildTarget {
  return level === 'full-stack' ? 'nextjs' : 'website'
}

// Per-level microcopy — the workspace speaks to each skill level in its own
// register. no-code talks outcomes ("a site for my bakery"), full-stack talks
// in code/stack terms. Used for the chat-input placeholder and the empty
// preview coaching so the same surfaces read differently per tier.
export const levelCopy: Record<SkillLevel, {
  chatPlaceholder: string
  previewEmptyTitle: string
  previewEmptyBody: string
}> = {
  'no-code': {
    chatPlaceholder: 'Describe your site — “a landing page for my bakery”…',
    previewEmptyTitle: 'Your site preview',
    previewEmptyBody: 'Describe what you want and AI builds it right here',
  },
  'low-code': {
    chatPlaceholder: 'Describe a change, or paste a section to refine…',
    previewEmptyTitle: 'Preview',
    previewEmptyBody: 'Build with AI, tweak the markup, and see it live here',
  },
  'full-stack': {
    chatPlaceholder: 'Describe a feature, component, or API route…',
    previewEmptyTitle: 'Preview',
    previewEmptyBody: 'Your app renders here — wire data + routes in code',
  },
}
