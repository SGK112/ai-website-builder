'use client'

// All GitHub round-trip state for the workspace: which repo the project is
// linked to, pulling, pushing, and linking a repo after an import.
//
// Lives here rather than in page.tsx so the workspace page keeps only the thin
// glue (the OWL rule). page.tsx renders the buttons; this owns the behaviour.

import { useCallback, useEffect, useRef, useState } from 'react'

export interface GitLink {
  owner: string
  repo: string
  branch: string
  fullName: string
}

export interface PullDiff {
  added: string[]
  changed: string[]
  removed: string[]
  unchanged: number
  skipped: number
  branch: string
  destructive: boolean
}

type Toast = (type: 'success' | 'error' | 'info', message: string) => void
type Terminal = (level: 'info' | 'success' | 'error', message: string) => void

interface Options {
  projectId: string | null
  signedIn: boolean
  addToast: Toast
  addTerminalLine: Terminal
  // Current editor state → the files a push should commit.
  getRepoFiles: () => Array<{ path: string; content: string }>
  // Re-read the project after a pull replaced its files.
  onPulled: () => void | Promise<void>
  // The route answered "connect GitHub first".
  onNeedsGithub?: () => void
}

export function useGithubRepo(opts: Options) {
  const { projectId, signedIn, addToast, addTerminalLine, getRepoFiles, onPulled, onNeedsGithub } = opts

  const [link, setLink] = useState<GitLink | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [pullDiff, setPullDiff] = useState<PullDiff | null>(null)
  const [commitMessage, setCommitMessage] = useState('')

  // A repo picked during import, waiting for the draft to get a saved id.
  const pendingLinkRef = useRef<{ repoUrl: string; branch?: string } | null>(null)

  const handleNeedsGithub = useCallback((data: any): boolean => {
    if (!data?.needsGithub) return false
    addToast('error', data.error || 'Connect your GitHub account first.')
    onNeedsGithub?.()
    return true
  }, [addToast, onNeedsGithub])

  // ---- link state -------------------------------------------------------
  const refreshLink = useCallback(async () => {
    if (!projectId || !signedIn) { setLink(null); return }
    try {
      const res = await fetch(`/api/github/connect?projectId=${encodeURIComponent(projectId)}`)
      if (!res.ok) return
      const data = await res.json()
      setLink(data?.link ? { ...data.link, fullName: `${data.link.owner}/${data.link.repo}` } : null)
    } catch { /* link state is a nicety — never block the workspace on it */ }
  }, [projectId, signedIn])

  useEffect(() => { refreshLink() }, [refreshLink])

  // Connect a repo to this project (registers the push webhook server-side).
  const connectRepo = useCallback(async (repoUrl: string, branch?: string): Promise<boolean> => {
    if (!projectId) {
      // Imported drafts have no id until the first autosave lands. Remember
      // the choice and link as soon as one exists — and say so, otherwise the
      // dialog just sits there looking broken.
      pendingLinkRef.current = { repoUrl, branch }
      addToast('info', 'Linking as soon as this project saves…')
      return true
    }
    setIsLinking(true)
    try {
      const res = await fetch('/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, repoUrl, branch }),
      })
      const data = await res.json()
      if (!res.ok) { if (!handleNeedsGithub(data)) addToast('error', data?.error || 'Could not link that repo'); return false }
      setLink({ owner: data.repo.split('/')[0], repo: data.repo.split('/')[1], branch: data.branch, fullName: data.repo })
      addTerminalLine('success', `🔗 Linked ${data.repo} (${data.branch})`)
      if (data.webhookStatus === 'created' || data.webhookStatus === 'exists') {
        addToast('success', `Linked ${data.repo} — pushes will sync back automatically.`)
      } else {
        addToast('info', `Linked ${data.repo}. Auto-sync needs a webhook added manually.`)
      }
      return true
    } catch (e: any) {
      addToast('error', e?.message || 'Could not link that repo')
      return false
    } finally {
      setIsLinking(false)
    }
  }, [projectId, addToast, addTerminalLine, handleNeedsGithub])

  // Queue a link for an imported project whose id doesn't exist yet.
  const linkAfterImport = useCallback((repoUrl: string, branch?: string) => {
    pendingLinkRef.current = { repoUrl, branch }
  }, [])

  useEffect(() => {
    if (!projectId || !signedIn) return
    const pending = pendingLinkRef.current
    if (!pending) return
    pendingLinkRef.current = null
    connectRepo(pending.repoUrl, pending.branch)
  }, [projectId, signedIn, connectRepo])

  // ---- pull -------------------------------------------------------------
  const runPull = useCallback(async (confirmed: boolean) => {
    if (!projectId) { addToast('error', 'Save this project first, then you can sync with GitHub'); return }
    setIsPulling(true)
    try {
      if (!confirmed) {
        // Ask what the pull would do before letting it replace the file set.
        const res = await fetch('/api/github/pull', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, preview: true }),
        })
        const data = await res.json()
        if (!res.ok) { if (!handleNeedsGithub(data)) addToast('error', data?.error || 'Pull failed'); return }
        if (data.destructive) { setPullDiff(data); return }
        // Nothing of the user's would be lost — go straight through.
      }

      addTerminalLine('info', '⬇️ Pulling latest from GitHub…')
      const res = await fetch('/api/github/pull', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Pull failed')
      setPullDiff(null)
      addTerminalLine('success', `✅ Synced ${data.count} file${data.count === 1 ? '' : 's'} from ${data.repo}`)
      addToast('success', `Pulled ${data.count} file${data.count === 1 ? '' : 's'} from GitHub`)
      await onPulled()
    } catch (e: any) {
      addToast('error', e?.message || 'Pull failed')
      addTerminalLine('error', `❌ ${e?.message || 'GitHub pull failed'}`)
    } finally {
      setIsPulling(false)
    }
  }, [projectId, addToast, addTerminalLine, onPulled, handleNeedsGithub])

  const pull = useCallback(() => runPull(false), [runPull])
  const confirmPull = useCallback(() => runPull(true), [runPull])
  const cancelPull = useCallback(() => setPullDiff(null), [])

  // ---- push -------------------------------------------------------------
  const push = useCallback(async () => {
    if (!signedIn) { onNeedsGithub?.(); return }
    if (!projectId) { addToast('error', 'Save this project first, then you can push'); return }
    const files = getRepoFiles()
    if (!files.length) { addToast('error', 'Nothing to push yet — build something first'); return }

    setIsPushing(true)
    try {
      addTerminalLine('info', `⬆️ Committing ${files.length} file${files.length === 1 ? '' : 's'}…`)
      const res = await fetch('/api/github/push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files, message: commitMessage.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { if (!handleNeedsGithub(data)) throw new Error(data?.error || 'Push failed'); return }
      setCommitMessage('')
      addTerminalLine('success', `✅ Pushed ${data.files} file${data.files === 1 ? '' : 's'} to ${data.repo} (${data.commitSha.slice(0, 7)})`)
      addToast('success', `Pushed to ${data.repo}`)
      if (!link) refreshLink()
    } catch (e: any) {
      addToast('error', e?.message || 'Push failed')
      addTerminalLine('error', `❌ ${e?.message || 'GitHub push failed'}`)
    } finally {
      setIsPushing(false)
    }
  }, [signedIn, projectId, getRepoFiles, commitMessage, addToast, addTerminalLine, handleNeedsGithub, link, refreshLink, onNeedsGithub])

  return {
    link, isLinking, isPulling, isPushing, pullDiff, commitMessage,
    setCommitMessage, connectRepo, linkAfterImport, refreshLink,
    pull, confirmPull, cancelPull, push,
  }
}
