// /feedback → /community?tab=feedback
// Feedback is integrated into the community surface; this page just
// preserves the /feedback URL for existing bookmarks / footer links.

import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function FeedbackRedirectPage() {
  redirect('/community?tab=feedback')
}
