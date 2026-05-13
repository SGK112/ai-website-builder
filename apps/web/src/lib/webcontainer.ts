// WebContainer manager — singleton boot of the in-browser Node runtime.
//
// Only ONE WebContainer instance can exist per browser tab; calling `boot()`
// twice throws. We memoize the boot promise so multiple consumers share the
// same instance.
//
// Mounting takes a flat `{ [path]: contents }` map (what the generation API
// returns) and converts it to the nested `FileSystemTree` shape WebContainer
// expects. Directory entries are created on demand from path segments.

import type { WebContainer, FileSystemTree, DirectoryNode } from '@webcontainer/api'

// IMPORTANT: store the boot promise on `window` (not in a module-scoped
// variable). Two reasons:
//   1. Next.js HMR reloads modules without reloading the page → a
//      module-scoped `bootPromise` becomes null on every hot-update, so
//      the next `getWebContainer()` call tries to boot a SECOND instance
//      → WebContainer throws "Only a single WebContainer instance can be
//      booted" (the user's error).
//   2. React Strict Mode double-mounts components in dev — if the second
//      mount runs through a different module instance, same problem.
// The `window` object survives HMR; storing the promise there means we
// reliably return the same boot promise no matter how many times this
// helper is called.
declare global {
  interface Window {
    __webstewBootPromise?: Promise<WebContainer>
    __webstewBootInstance?: WebContainer
  }
}

export function getWebContainer(): Promise<WebContainer> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('WebContainer can only be booted in the browser'))
  }
  // Already-resolved instance — cheapest path, no async.
  if (window.__webstewBootInstance) return Promise.resolve(window.__webstewBootInstance)
  // Boot in-flight — reuse the same promise.
  if (window.__webstewBootPromise) return window.__webstewBootPromise

  // CRITICAL: the promise must be assigned to `window` BEFORE any `await`,
  // otherwise two concurrent callers (e.g., React Strict Mode's double
  // mount) can both pass the cache check, then both call `WC.boot()` →
  // second boot throws "Only a single WebContainer instance can be
  // booted". The IIFE wraps all the async work in one already-running
  // promise that we register synchronously.
  const promise = (async () => {
    const { WebContainer: WC } = await import('@webcontainer/api')
    const instance = await WC.boot()
    window.__webstewBootInstance = instance
    return instance
  })()
  window.__webstewBootPromise = promise
  // If boot rejects, clear the cached promise so a retry can try again.
  promise.catch(() => {
    if (window.__webstewBootPromise === promise) {
      window.__webstewBootPromise = undefined
    }
  })
  return promise
}

// Convert flat file map into the nested FileSystemTree WebContainer wants.
export function buildFileTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {}
  for (const [path, contents] of Object.entries(files)) {
    const parts = path.replace(/^\/+/, '').split('/').filter(Boolean)
    if (parts.length === 0) continue
    let cursor: FileSystemTree = tree
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i]
      const existing = cursor[dir] as DirectoryNode | undefined
      if (!existing || !('directory' in existing)) {
        const node: DirectoryNode = { directory: {} }
        cursor[dir] = node
        cursor = node.directory
      } else {
        cursor = existing.directory
      }
    }
    cursor[parts[parts.length - 1]] = { file: { contents } }
  }
  return tree
}

// Check whether the user's browser meets WebContainer's requirements:
// SharedArrayBuffer must be available, which means cross-origin isolation
// headers (COOP + COEP) must have been served for the current page.
export function isWebContainerSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof SharedArrayBuffer === 'undefined') return false
  // crossOriginIsolated is only true when COOP/COEP have been applied.
  if (typeof window.crossOriginIsolated !== 'undefined' && !window.crossOriginIsolated) {
    return false
  }
  return true
}
