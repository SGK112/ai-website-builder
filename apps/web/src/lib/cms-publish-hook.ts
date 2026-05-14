// Fire-and-forget side effects when a CMS item is newly published.
//
// v1 behavior: if the owner has Slack connected, post a one-line "new
// {collection} published: {title}" to the default channel. If they don't,
// no-op silently — this is best-effort, not part of the critical path.
//
// Future: per-collection routing config ("posts → #content channel +
// LinkedIn auto-post"), opt-out toggle, retries via a queue. Keeping it
// minimal so we don't blow up the publish path while the dispatch matures.

import type { CmsStoreItem } from '@/lib/cms-store'
import { listUserConnections, executeAction } from '@/lib/composio'

interface PublishHookArgs {
  projectId: string
  collection: string
  item: CmsStoreItem
  ownerId: string
}

function pickTitle(item: CmsStoreItem): string {
  const f = item.fields || {}
  return (
    (typeof f.title === 'string' && f.title) ||
    (typeof f.name === 'string' && f.name) ||
    (typeof f.headline === 'string' && f.headline) ||
    item.slug
  )
}

export async function firePublishHook(args: PublishHookArgs): Promise<void> {
  try {
    const connections = await listUserConnections(args.ownerId)
    const active = connections.filter((c) => c.status === 'ACTIVE')
    if (active.length === 0) return

    const title = pickTitle(args.item)
    const message = `:sparkles: New ${args.collection} published: *${title}*`

    // Slack — post a short notification to the user's authenticated default
    // channel. The Composio action picks the channel from the auth context;
    // we don't ask the user to configure it here (would need a separate UI).
    const slack = active.find((c) => c.toolkitSlug === 'slack')
    if (slack) {
      await executeAction({
        userId: args.ownerId,
        actionSlug: 'SLACK_SEND_MESSAGE',
        args: { text: message },
      }).catch(() => {})
    }

    // Discord (if/when we add it as a supported toolkit) — same shape.
    // Other channels (LinkedIn auto-share, Twitter cross-post) should be
    // opt-in per-collection, not blanket fire-on-publish. Holding off.
  } catch (e: any) {
    // Hook is best-effort. Log and move on.
    console.warn('[cms-publish-hook] failed:', e?.message || e)
  }
}
