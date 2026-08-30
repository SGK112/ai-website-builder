// How much of the free allowance an anonymous visitor already spent on this
// browser, so signing up tops them up to 100 rather than handing out a second
// 100 on top.
//
// Anon building is metered by the `wsanon` cookie in /api/builder/generate:
// one increment per generation, capped at ANON_LIMIT. That's deliberately
// generous — the whole funnel is "make something before you sign up". But the
// new-account grant was independent of it, so the browser that had just burned
// the full anon allowance got a clean 100 the moment it registered. Ten free
// generations, sign up, ten more, sign out, repeat: the platform LLM key pays
// for all of it.
//
// Signing up should CLAIM the remaining allowance, not reset it.

export const ANON_COOKIE = 'wsanon'
export const ANON_LIMIT = 10                    // generations
export const CREDITS_PER_ANON_GEN = 10          // ≈ one website generation
export const NEW_ACCOUNT_CREDITS = 100

// Cookie value → credits already consumed. Clamped both ends: a hand-edited
// cookie can't mint credits (negative) or brick an account (over the grant).
export function anonCreditsSpent(cookieValue: string | undefined | null): number {
  const used = parseInt(String(cookieValue ?? '0'), 10)
  if (!Number.isFinite(used) || used <= 0) return 0
  return Math.min(NEW_ACCOUNT_CREDITS, Math.min(used, ANON_LIMIT) * CREDITS_PER_ANON_GEN)
}

// The starting balance for a brand-new account created in this browser.
// Never below zero — a fresh account with negative credits would read as a
// bug and block the first build with a confusing error.
export function startingCreditsFor(cookieValue: string | undefined | null): number {
  return Math.max(0, NEW_ACCOUNT_CREDITS - anonCreditsSpent(cookieValue))
}
