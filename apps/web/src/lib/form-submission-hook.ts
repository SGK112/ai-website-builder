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

// Form submissions are ANONYMOUS + attacker-controlled. Escape Slack control
// sequences so a submitter can't inject links/mentions (<!channel>, <@user>,
// <http://evil|click>) or break formatting in the owner's workspace. Per Slack
// docs, escaping & < > is sufficient; also flatten newlines.
function slackSafe(v: unknown, max = 60): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, max)
}

function summarizeFields(data: Record<string, any>): string {
  // Pull the most useful identifying fields into a short summary line.
  // Falls back to the first 3 key/value pairs if no obvious identity.
  const name = data.name || data.fullName || data.full_name
  const email = data.email
  const phone = data.phone || data.phoneNumber
  const subject = data.subject || data.topic || data.message
  const parts: string[] = []
  if (name) parts.push(slackSafe(name))
  if (email) parts.push(slackSafe(email))
  if (phone) parts.push(slackSafe(phone))
  if (subject) parts.push(`"${slackSafe(subject, 40)}"`)
  if (parts.length > 0) return parts.join(' · ')
  // No identity fields — show first 3 entries.
  return Object.entries(data)
    .slice(0, 3)
    .map(([k, v]) => `${slackSafe(k, 20)}: ${slackSafe(v, 30)}`)
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
