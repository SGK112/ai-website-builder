'use client'

// Serializes voice-driven build/edit commands. A realtime build runs ~30-60s;
// while it's in flight the chef may call build_site/edit_site again. Without a
// queue those land in handleChatMessage's `if (isGenerating) return` and are
// silently DROPPED — the chef cheerfully says "done!" while nothing happened.
// Here we queue them and flush on the busy→idle edge, and signal when the last
// one lands so the voice session can truthfully announce completion.

import { useCallback, useEffect, useRef } from 'react'

interface Args {
  busy: boolean // isGenerating || isThinking
  active: boolean // a voice session is open (only then do we announce completion)
  dispatch: (prompt: string, mode: 'build' | 'edit') => void
  onAllDone: () => void
}

export function useVoiceBuildQueue({ busy, active, dispatch, onAllDone }: Args) {
  const queueRef = useRef<Array<{ prompt: string; mode: 'build' | 'edit' }>>([])
  const prevBusyRef = useRef(false)
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch
  const onAllDoneRef = useRef(onAllDone)
  onAllDoneRef.current = onAllDone

  // Enqueue a command. Runs now if idle + nothing queued; otherwise queues
  // behind the in-flight work. Returns the outcome so the caller can ack truthfully.
  const enqueue = useCallback((prompt: string, mode: 'build' | 'edit'): 'started' | 'queued' => {
    if (busy || queueRef.current.length > 0) {
      queueRef.current.push({ prompt, mode })
      return 'queued'
    }
    dispatchRef.current(prompt, mode)
    return 'started'
  }, [busy])

  // On the busy→idle edge: run the next queued command, or — if the queue is
  // empty and a voice session is live — tell it the work finished.
  useEffect(() => {
    if (prevBusyRef.current && !busy) {
      const next = queueRef.current.shift()
      if (next) dispatchRef.current(next.prompt, next.mode)
      else if (active) onAllDoneRef.current()
    }
    prevBusyRef.current = busy
  }, [busy, active])

  return enqueue
}
