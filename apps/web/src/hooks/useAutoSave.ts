'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseAutoSaveOptions {
  onSave: () => Promise<void>
  delay?: number // Debounce delay in ms
  enabled?: boolean
}

interface UseAutoSaveReturn {
  isDirty: boolean
  lastSaved: Date | null
  isSaving: boolean
  error: string | null
  markDirty: () => void
  markClean: () => void
  saveNow: () => Promise<void>
}

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const { onSave, delay = 2000, enabled = true } = options

  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveCallbackRef = useRef(onSave)

  // Keep save callback ref updated
  useEffect(() => {
    saveCallbackRef.current = onSave
  }, [onSave])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const saveNow = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      await saveCallbackRef.current()
      setLastSaved(new Date())
      setIsDirty(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setError(message)
      console.error('Auto-save error:', err)
    } finally {
      setIsSaving(false)
    }
  }, [isSaving])

  const markDirty = useCallback(() => {
    setIsDirty(true)

    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveNow()
    }, delay)
  }, [enabled, delay, saveNow])

  const markClean = useCallback(() => {
    setIsDirty(false)

    // Clear pending auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  return {
    isDirty,
    lastSaved,
    isSaving,
    error,
    markDirty,
    markClean,
    saveNow,
  }
}

export default useAutoSave
