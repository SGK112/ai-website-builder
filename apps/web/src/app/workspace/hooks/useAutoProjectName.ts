'use client'

// Keep the project name honest once real content exists. Premade templates seed
// the name with their LABEL ("E-Commerce") and fresh builds start "Untitled
// Project"; if the user then builds something else, the name used to stick —
// that's the "E-Commerce on a restaurant site" mislabel in the files tab. When
// the build settles (idle) and the name is still a generic placeholder, we
// re-derive it from the rendered <title>/<h1>. We never touch a user-chosen
// name, and we only derive once per generic span (a ref guards re-fires).

import { useEffect, useRef } from 'react'
import { suggestProjectName } from '@/lib/project-naming'

export function useAutoProjectName(opts: {
  html: string                         // current rendered HTML
  projectName: string                  // current project name
  busy: boolean                        // a build/edit is in flight — wait for it
  setProjectName: (name: string) => void
}) {
  const { html, projectName, busy, setProjectName } = opts
  // The html length we last derived from — avoids re-running on every keystroke
  // while still re-evaluating as the content grows during/after a build.
  const lastTriedRef = useRef<string>('')

  useEffect(() => {
    if (busy) return
    if (!html || html.length < 40) return
    // Cheap guard so a stable html doesn't re-trigger the regex work each render.
    if (lastTriedRef.current === html) return
    lastTriedRef.current = html
    const next = suggestProjectName(projectName, html)
    if (next) setProjectName(next)
  }, [html, projectName, busy, setProjectName])
}
