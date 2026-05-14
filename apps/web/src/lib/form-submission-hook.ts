// Fire-and-forget side effects on every form submission.
//
// v1 behavior: if the project owner has Slack connected via Composio,
// post a one-line summary. If they don't, no-op silently. Mirror of
// cms-publish-hook.ts — same pattern, different trigger.
//
// Future: per-form configurable routing (this form → that Slack channel,
// that other form → HubSpot + Notion). For now everything is
// blanket-to-Slack which is what 90% of users want and zero of them
// have to configure.

import { listUserConnections, executeAction } from '@/lib/composio'

interface FormSubmissionHookArgs {
  ownerId: string
  projectName: string
  formId: string
  data: Record<string, any>
  submissionId: string
}

function summarizeFields(data: Record<string, any>): string {
  // Pull the most useful identifying fields into a short summary line.
  // Falls back to the first 3 key/value pairs if no obvious identity.
  const name = data.name || data.fullName || data.full_name
  const email = data.email
  const phone = data.phone || data.phoneNumber
  const subject = data.subject || data.topic || data.message?.slice?.(0, 40)
  const parts: string[] = []
  if (name) parts.push(String(name))
  if (email) parts.push(String(email))
  if (phone) parts.push(String(phone))
  if (subject) parts.push(`"${String(subject).slice(0, 40)}"`)
  if (parts.length > 0) return parts.join(' · ')
  // No identity fields — show first 3 entries.
  return Object.entries(data)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
    .join(' · ')
}

export async function fireFormSubmissionHook(args: FormSubmissionHookArgs): Promise<void> {
  try {
    const connections = await listUserConnections(args.ownerId)
    const active = connections.filter((c) => c.status === 'ACTIVE')
    if (active.length === 0) return

    const summary = summarizeFields(args.data)
    const message =
      `:inbox_tray: New ${args.formId} submission on *${args.projectName}*\n` +
      (summary ? `> ${summary}` : '')

    const slack = active.find((c) => c.toolkitSlug === 'slack')
    if (slack) {
      await executeAction({
        userId: args.ownerId,
        actionSlug: 'SLACK_SEND_MESSAGE',
        args: { text: message },
      }).catch(() => {})
    }
  } catch (e: any) {
    console.warn('[form-submission-hook] failed:', e?.message || e)
  }
}
