// Composio API helper — talks to backend.composio.dev for the connected-account
// (OAuth) flow. Each Webstew user is a Composio "entity" identified by their
// Mongo _id stringified, so connections naturally scope per-user without a
// separate sync step.
//
// We deliberately do NOT use @composio/core SDK here: we only need 4 endpoints,
// the SDK adds 1.5MB of deps + opinionated request shapes, and bypassing it
// keeps the failure surface small. If we later need agentic tool-calling
// (LLM picks Composio tool) we'll add the SDK in that path only.

const BASE = 'https://backend.composio.dev/api/v3'

function key(): string {
  const k = process.env.COMPOSIO_API_KEY
  if (!k) throw new Error('COMPOSIO_API_KEY not configured')
  return k
}

interface ComposioFetchInit {
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH'
  body?: unknown
}

async function composio<T = any>(path: string, init: ComposioFetchInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method || 'GET',
    headers: {
      'x-api-key': key(),
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Composio ${init.method || 'GET'} ${path} failed: ${res.status} ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

// ── Auth configs (the "templates" your account has set up per toolkit) ────────

export interface AuthConfig {
  id: string
  toolkitSlug: string
  name: string
  type: 'default' | 'custom'
}

let _authConfigCache: { at: number; data: AuthConfig[] } | null = null
const AUTH_CONFIG_TTL_MS = 5 * 60 * 1000

export async function listAuthConfigs(): Promise<AuthConfig[]> {
  if (_authConfigCache && Date.now() - _authConfigCache.at < AUTH_CONFIG_TTL_MS) {
    return _authConfigCache.data
  }
  const data = await composio<{ items: any[] }>('/auth_configs?limit=100')
  const out: AuthConfig[] = (data.items || []).map((a) => ({
    id: a.id,
    toolkitSlug: a.toolkit?.slug || a.toolkitSlug || '',
    name: a.name || '',
    type: a.type || 'default',
  }))
  _authConfigCache = { at: Date.now(), data: out }
  return out
}

export async function authConfigForToolkit(slug: string): Promise<AuthConfig | null> {
  const all = await listAuthConfigs()
  return all.find((a) => a.toolkitSlug === slug) || null
}

// ── Connected accounts (one per end-user × toolkit) ───────────────────────────

export interface ConnectedAccount {
  id: string
  toolkitSlug: string
  status: 'INITIATED' | 'ACTIVE' | 'FAILED' | 'EXPIRED' | string
  userId: string
  createdAt?: string
}

function normalizeAccount(a: any): ConnectedAccount {
  return {
    id: a.id,
    toolkitSlug: a.toolkit?.slug || a.toolkitSlug || '',
    status: a.status || 'INITIATED',
    userId: a.user_id || a.userId || '',
    createdAt: a.created_at,
  }
}

export async function listUserConnections(userId: string): Promise<ConnectedAccount[]> {
  const data = await composio<{ items: any[] }>(
    `/connected_accounts?user_ids=${encodeURIComponent(userId)}&limit=100`
  )
  return (data.items || []).map(normalizeAccount)
}

export async function initiateConnection(opts: {
  userId: string
  toolkitSlug: string
  callbackUrl: string
}): Promise<{ id: string; redirectUrl: string }> {
  const cfg = await authConfigForToolkit(opts.toolkitSlug)
  if (!cfg) {
    throw new Error(`No auth_config registered for toolkit "${opts.toolkitSlug}"`)
  }
  const res = await composio<any>('/connected_accounts', {
    method: 'POST',
    body: {
      auth_config: { id: cfg.id },
      connection: {
        user_id: opts.userId,
        callback_url: opts.callbackUrl,
      },
    },
  })
  // Composio returns the redirect URL nested under different keys depending on
  // toolkit type; check both common shapes.
  const redirectUrl =
    res.redirect_url ||
    res.connectionData?.redirectUrl ||
    res.connection_data?.redirect_url ||
    res.redirectUrl
  if (!redirectUrl) {
    throw new Error(`Composio did not return a redirect URL: ${JSON.stringify(res).slice(0, 200)}`)
  }
  return { id: res.id, redirectUrl }
}

export async function disconnectAccount(connectedAccountId: string): Promise<void> {
  await composio(`/connected_accounts/${encodeURIComponent(connectedAccountId)}`, {
    method: 'DELETE',
  })
}

// ── Display metadata for our UI (Composio's slugs vs human labels) ────────────

interface ToolkitMeta {
  slug: string
  label: string
  category: 'inbox' | 'crm' | 'comms' | 'data' | 'commerce' | 'social' | 'dev' | 'scheduling'
  description: string
}

// Only services we want surfaced in the Webstew Integrations tab. Add a slug
// here AND make sure an auth_config exists on the Composio account (we already
// have 19 wired — see scripts/composio-audit if you want to inventory).
export const SUPPORTED_TOOLKITS: ToolkitMeta[] = [
  { slug: 'gmail',          label: 'Gmail',           category: 'inbox',      description: 'Send form-submission notifications from your Gmail.' },
  { slug: 'slack',          label: 'Slack',           category: 'comms',      description: 'Post form submissions to a Slack channel.' },
  { slug: 'hubspot',        label: 'HubSpot',         category: 'crm',        description: 'Create a contact from each form submission.' },
  { slug: 'salesforce',     label: 'Salesforce',      category: 'crm',        description: 'Push form submissions as leads.' },
  { slug: 'googlesheets',   label: 'Google Sheets',   category: 'data',       description: 'Append each submission as a row.' },
  { slug: 'googledrive',    label: 'Google Drive',    category: 'data',       description: 'Save uploads + exports to a Drive folder.' },
  { slug: 'googlecalendar', label: 'Google Calendar', category: 'scheduling', description: 'Create calendar events from booking forms.' },
  { slug: 'microsoft_teams',label: 'Microsoft Teams', category: 'comms',      description: 'Notify a Teams channel on each submission.' },
  { slug: 'intercom',       label: 'Intercom',        category: 'crm',        description: 'Open a conversation per submission.' },
  { slug: 'zendesk',        label: 'Zendesk',         category: 'crm',        description: 'Open a ticket per submission.' },
  { slug: 'jira',           label: 'Jira',            category: 'dev',        description: 'Create an issue per submission.' },
  { slug: 'monday',         label: 'Monday',          category: 'data',       description: 'Add submissions to a Monday board.' },
  { slug: 'stripe',         label: 'Stripe',          category: 'commerce',   description: 'Trigger checkouts or read payments from your site.' },
  { slug: 'shopify',        label: 'Shopify',         category: 'commerce',   description: 'Sync orders + products with your generated store.' },
  { slug: 'linkedin',       label: 'LinkedIn',        category: 'social',     description: 'Cross-post your published content.' },
  { slug: 'facebook',       label: 'Facebook',        category: 'social',     description: 'Cross-post your published content.' },
  { slug: 'github',         label: 'GitHub',          category: 'dev',        description: 'Deploy generated projects + manage issues.' },
  { slug: 'quickbooks',     label: 'QuickBooks',      category: 'commerce',   description: 'Sync customers + invoices.' },
  { slug: 'googleads',      label: 'Google Ads',      category: 'social',     description: 'Read campaign metrics into your dashboards.' },
]

export function metaForToolkit(slug: string): ToolkitMeta | null {
  return SUPPORTED_TOOLKITS.find((m) => m.slug === slug) || null
}
