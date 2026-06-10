'use client'

import { motion } from 'framer-motion'
import {
  Key,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Rocket,
  Database,
  Share2,
  Github,
  Globe,
  Download,
  Send,
  Loader2,
  Terminal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CustomDomainCard } from '@/components/builder/CustomDomainCard'
import type { SkillLevel, WorkspaceSettings, BuildTarget } from '../types'

type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface BackendInfo {
  appId: string
  apiKey: string
  baseUrl: string
}

export interface DomainResult {
  domain: string
  available: boolean
  priceCents: number
  premium: boolean
}

export interface ConnectedDomain {
  domain: string
  dnsRecords: Array<{ type: string; name: string; value: string; note?: string }>
  message: string
}

interface ShipPanelProps {
  isDark: boolean
  skillLevel: SkillLevel
  // Project + keys
  projectName: string
  onProjectNameChange: (value: string) => void
  showAdvancedDeploy: boolean
  onToggleAdvancedDeploy: () => void
  settings: WorkspaceSettings
  onSettingChange: (key: keyof WorkspaceSettings, value: string) => void
  // Build context
  html: string
  buildTarget: BuildTarget
  hasVfsFiles: boolean
  // Go Live / publish
  isPublishing: boolean
  onPublishInstant: () => void
  publishUrl: string | null
  publishPath: string | null
  // Self-hosted deploy
  isDeploying: boolean
  deployStatus: 'idle' | 'github' | 'render' | 'success' | 'error'
  deployUrl: string | null
  deployError: string | null
  onDeployToGitHub: () => void
  onDeployToRender: () => void
  onOpenExport: () => void
  // Backend
  isProvisioningBackend: boolean
  onProvisionBackend: () => void
  backendInfo: BackendInfo | null
  // Collaboration / sharing
  projectId: string | null
  onOpenCollab: () => void
  onOpenShareModal: () => void
  onOpenPublishModal: () => void
  // GitHub two-way sync
  isPullingGit: boolean
  onPullFromGitHub: () => void
  // Domains
  domainQuery: string
  onDomainQueryChange: (value: string) => void
  onSearchDomain: () => void
  isSearchingDomain: boolean
  domainSearched: boolean
  domainResults: DomainResult[]
  onBuyDomain: (domain: string) => void
  ownDomainInput: string
  onOwnDomainInputChange: (value: string) => void
  onConnectOwnedDomain: () => void
  isConnectingDomain: boolean
  connectedDomain: ConnectedDomain | null
  // Full-stack console
  onOpenConsole: () => void
  // Toasts
  addToast: (type: ToastType, message: string) => void
}

// Embeddable WebstewDB snippet for a provisioned backend. Deploy-only helper —
// lives here with the only UI that renders it.
function backendSnippet(info: { appId: string; apiKey: string }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.webstew.net'
  return `<script>
window.WebstewDB = (function () {
  var BASE = "${origin}/api/backend/${info.appId}";
  var KEY = "${info.apiKey}";
  var APPID = "${info.appId}";
  var TOKEN = null;
  try { TOKEN = localStorage.getItem("webstew_token_" + APPID); } catch (e) {}
  function setToken(t) {
    TOKEN = t || null;
    try { t ? localStorage.setItem("webstew_token_" + APPID, t) : localStorage.removeItem("webstew_token_" + APPID); } catch (e) {}
  }
  function req(method, path, body, authed) {
    var headers = { "Content-Type": "application/json", "x-webstew-key": KEY };
    if (authed && TOKEN) headers["Authorization"] = "Bearer " + TOKEN;
    return fetch(BASE + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json(); });
  }
  function capture(p) { return p.then(function (r) { if (r && r.token) setToken(r.token); return r; }); }
  return {
    list:   function (c)      { return req("GET", "/" + c); },
    get:    function (c, id)  { return req("GET", "/" + c + "?id=" + id); },
    create: function (c, doc) { return req("POST", "/" + c, doc); },
    update: function (c, id, doc) { return req("PUT", "/" + c + "?id=" + id, doc); },
    remove: function (c, id)  { return req("DELETE", "/" + c + "?id=" + id); },
    signup: function (email, password) { return capture(req("POST", "/auth", { action: "signup", email: email, password: password })); },
    login:  function (email, password) { return capture(req("POST", "/auth", { action: "login", email: email, password: password })); },
    logout: function () { setToken(null); },
    isLoggedIn: function () { return !!TOKEN; },
    // Server action — runs a predefined outbound call server-side with your
    // secrets injected (configure in Data Studio). Secrets never reach the browser.
    action: function (name, body) { return req("POST", "/actions/" + name, body || {}); },
    // Integrations — your END-USERS connect THEIR own Stripe/Shopify/etc via
    // Composio, and you run actions on their behalf. Requires a logged-in user.
    // The COMPOSIO key stays on Webstew's server; it never reaches this page.
    integrations: {
      list: function () { return req("GET", "/integrations", null, true); },
      connect: function (toolkit, returnUrl) {
        return req("POST", "/integrations/connect", { toolkit: toolkit, returnUrl: returnUrl || window.location.href }, true)
          .then(function (r) { if (r && r.redirectUrl) window.location.href = r.redirectUrl; return r; });
      },
      run: function (toolkit, action, params) { return req("POST", "/integrations/run", { toolkit: toolkit, action: action, params: params || {} }, true); }
    }
  };
})();
<\/script>`
}

export function ShipPanel(props: ShipPanelProps) {
  const {
    isDark, skillLevel,
    projectName, onProjectNameChange,
    showAdvancedDeploy, onToggleAdvancedDeploy,
    settings, onSettingChange,
    html, buildTarget, hasVfsFiles,
    isPublishing, onPublishInstant, publishUrl, publishPath,
    isDeploying, deployStatus, deployUrl, deployError,
    onDeployToGitHub, onDeployToRender, onOpenExport,
    isProvisioningBackend, onProvisionBackend, backendInfo,
    projectId, onOpenCollab, onOpenShareModal, onOpenPublishModal,
    isPullingGit, onPullFromGitHub,
    domainQuery, onDomainQueryChange, onSearchDomain, isSearchingDomain,
    domainSearched, domainResults, onBuyDomain,
    ownDomainInput, onOwnDomainInputChange, onConnectOwnedDomain, isConnectingDomain, connectedDomain,
    onOpenConsole,
    addToast,
  } = props

  // Per-level gates. no-code keeps the simplest ship surface (Go Live + custom
  // domain + share); low-code adds a managed backend + GitHub pull; full-stack
  // unlocks self-hosted deploy (GitHub/Render), export, API keys, and console.
  const showBackend = skillLevel !== 'no-code'
  const showGitPull = skillLevel !== 'no-code'
  const showAdvanced = skillLevel === 'full-stack'

  return (
    <motion.div
      key="deploy"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-3 space-y-4"
    >
      {/* Project Name */}
      <div>
        <label className={cn("block text-xs mb-1.5", isDark ? "text-zinc-500" : "text-slate-500")}>Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className={cn(
            "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-violet-500/50",
            isDark
              ? "bg-white/[0.03] border border-white/[0.08] text-white"
              : "bg-slate-100 border border-slate-200 text-slate-900"
          )}
        />
      </div>

      {/* Advanced disclosure — BYO API keys for self-hosted (GitHub/Render)
          deploy. full-stack only; hidden by default so the primary
          Go-Live + custom-domain flow isn't buried under key inputs. */}
      {showAdvanced && (<>
      <button
        onClick={onToggleAdvancedDeploy}
        className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition", isDark ? "bg-white/[0.02] border border-white/[0.06] text-zinc-400 hover:text-white" : "bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800")}
      >
        <span className="flex items-center gap-1.5"><Key className="w-3 h-3" /> Advanced — API keys for self-hosted deploy</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvancedDeploy && "rotate-180")} />
      </button>
      {showAdvancedDeploy && (
      <div className="space-y-2">
        <label className={cn("block text-xs flex items-center gap-1.5", isDark ? "text-zinc-500" : "text-slate-500")}>
          <Key className="w-3 h-3" />
          API Keys
        </label>
        {[
          { key: 'openaiKey', label: 'OpenAI', placeholder: 'sk-...' },
          { key: 'githubToken', label: 'GitHub', placeholder: 'ghp_...' },
          { key: 'renderKey', label: 'Render', placeholder: 'rnd_...' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className={cn("block text-[10px] mb-0.5", isDark ? "text-zinc-500" : "text-slate-500")}>{label}</label>
            <input
              type="password"
              value={settings[key as keyof WorkspaceSettings]}
              onChange={(e) => onSettingChange(key as keyof WorkspaceSettings, e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-violet-500/50",
                isDark
                  ? "bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-600"
                  : "bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400"
              )}
            />
          </div>
        ))}
      </div>
      )}
      </>)}

      {/* Deploy Status */}
      {deployUrl && (
        <div className={cn(
          "p-3 rounded-lg border",
          isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
        )}>
          <div className={cn("flex items-center gap-2 text-sm font-medium mb-1", isDark ? "text-emerald-400" : "text-emerald-700")}>
            <CheckCircle2 className="w-4 h-4" />
            Deployed! Building now (~2-3 min)
          </div>
          <a
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("text-xs underline break-all", isDark ? "text-emerald-300/80 hover:text-emerald-300" : "text-emerald-700 hover:text-emerald-800")}
          >
            {deployUrl}
          </a>
          <p className={cn("text-[10px] mt-1", isDark ? "text-emerald-400/60" : "text-emerald-600/70")}>
            The URL will show 404 until Render finishes the first build.
          </p>
        </div>
      )}

      {deployError && (
        <div className={cn(
          "p-3 rounded-lg border",
          isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
        )}>
          <div className={cn("flex items-center gap-2 text-sm font-medium mb-1", isDark ? "text-red-400" : "text-red-700")}>
            <AlertCircle className="w-4 h-4" />
            Deploy Failed
          </div>
          <p className={cn("text-xs", isDark ? "text-red-300/80" : "text-red-600")}>{deployError}</p>
        </div>
      )}

      {/* Instant publish success — live URL on webstew.app */}
      {publishUrl && (
        <div className={cn(
          "p-3 rounded-lg border",
          isDark ? "bg-emerald-500/10 border-emerald-500/25" : "bg-emerald-50 border-emerald-200"
        )}>
          <div className={cn("flex items-center gap-2 text-sm font-medium mb-1", isDark ? "text-emerald-400" : "text-emerald-700")}>
            <CheckCircle2 className="w-4 h-4" />
            Live now — instant publish
          </div>
          <a
            href={publishPath || publishUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("text-xs underline break-all", isDark ? "text-emerald-300/80 hover:text-emerald-300" : "text-emerald-700 hover:text-emerald-800")}
          >
            {publishUrl}
          </a>
          <p className={cn("text-[10px] mt-1", isDark ? "text-emerald-400/60" : "text-emerald-600/70")}>
            No GitHub or Render needed. Re-publish anytime — same URL.
          </p>
          {publishPath && (
            <a
              href={`/workspace?remix=${encodeURIComponent(publishPath.replace('/s/', ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("inline-block mt-1 text-[10px] underline", isDark ? "text-emerald-300/70 hover:text-emerald-300" : "text-emerald-700 hover:text-emerald-800")}
            >
              Remix this as a new draft →
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {/* Go Live — instant, key-free publish to {slug}.webstew.app. Primary CTA. */}
        <button
          onClick={onPublishInstant}
          disabled={isPublishing || !html.trim() || buildTarget !== 'website'}
          title={buildTarget !== 'website' ? 'Instant publish supports website projects. Use Deploy for app targets.' : 'Publish instantly to a webstew.app URL'}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left shadow-md",
            isPublishing || !html.trim() || buildTarget !== 'website'
              ? isDark ? "bg-white/[0.04] text-zinc-500 opacity-70 cursor-not-allowed" : "bg-slate-200 text-slate-400 opacity-70 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white"
          )}
        >
          {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
          <div className="flex-1">
            <div className="text-sm font-semibold">Go Live — instant &amp; free</div>
            <div className="text-[10px] opacity-90">
              {isPublishing ? 'Publishing…' : buildTarget !== 'website' ? 'Websites only — use Deploy for apps' : 'Get a shareable webstew.app URL in seconds — no accounts'}
            </div>
          </div>
        </button>

        {/* Add a backend — one-click managed DB + auth, no Supabase setup */}
        {showBackend && (<>
        <button
          onClick={onProvisionBackend}
          disabled={isProvisioningBackend}
          title="Provision a managed database + auth for this app — no accounts, no setup"
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
            isProvisioningBackend
              ? isDark ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed" : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
              : isDark ? "bg-cyan-500/10 border-cyan-400/30 hover:bg-cyan-500/15" : "bg-cyan-50 border-cyan-200 hover:bg-cyan-100"
          )}
        >
          {isProvisioningBackend ? <Loader2 className="w-5 h-5 animate-spin text-cyan-400" /> : <Database className={cn("w-5 h-5", isDark ? "text-cyan-400" : "text-cyan-600")} />}
          <div className="flex-1">
            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>{backendInfo ? 'Backend ready' : 'Add a backend'}</div>
            <div className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>
              {isProvisioningBackend ? 'Provisioning…' : backendInfo ? 'Database + auth · snippet below' : 'Database + auth in one click — no Supabase setup'}
            </div>
          </div>
        </button>
        {backendInfo && (
          <div className={cn("p-3 rounded-lg border text-[11px] space-y-2", isDark ? "bg-cyan-500/5 border-cyan-500/20" : "bg-cyan-50 border-cyan-200")}>
            <div className={cn("font-medium", isDark ? "text-cyan-300" : "text-cyan-800")}>Embed this once in your site:</div>
            <pre className={cn("p-2 rounded overflow-x-auto whitespace-pre-wrap break-all text-[10px] leading-snug", isDark ? "bg-black/40 text-zinc-300" : "bg-white text-slate-700 border border-slate-200")}>{backendSnippet(backendInfo)}</pre>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => { try { await navigator.clipboard.writeText(backendSnippet(backendInfo)); addToast('success', 'Snippet copied') } catch (e) { addToast('error', 'Copy failed') } }}
                className={cn("px-2 py-1 rounded text-[10px] font-medium", isDark ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30" : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200")}
              >Copy snippet</button>
              {/* Data Studio — view/edit the app's data + manage secrets */}
              <a
                href={`/backend?appId=${encodeURIComponent(backendInfo.appId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("px-2 py-1 rounded text-[10px] font-medium", isDark ? "bg-white/5 text-cyan-200 hover:bg-white/10" : "bg-slate-100 text-cyan-700 hover:bg-slate-200")}
              >Open Data Studio →</a>
            </div>
            <p className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>
              Then call <code>WebstewDB.create(&apos;todos&apos;, {'{...}'})</code>, <code>.list()</code>, <code>.login()</code>, etc. · View data + add secrets in Data Studio.
            </p>
          </div>
        )}
        </>)}

        {/* Share / invite collaborators — editor/viewer roles */}
        <button
          onClick={() => {
            if (!projectId) { addToast('error', 'Save the project first to invite collaborators'); return }
            onOpenCollab()
          }}
          className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
            isDark ? "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:bg-slate-50")}
        >
          <Share2 className={cn("w-5 h-5", isDark ? "text-violet-400" : "text-violet-600")} />
          <div className="flex-1">
            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>Share &amp; invite</div>
            <div className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>Add teammates or clients as editors or viewers</div>
          </div>
        </button>

        {/* Pull from GitHub — two-way sync (edits on GitHub → here) */}
        {showGitPull && (
        <button
          onClick={onPullFromGitHub}
          disabled={isPullingGit}
          title="Sync changes made on GitHub back into this project"
          className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
            isPullingGit ? "opacity-60 cursor-not-allowed" : "",
            isDark ? "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:bg-slate-50")}
        >
          {isPullingGit ? <Loader2 className="w-5 h-5 animate-spin text-zinc-400" /> : <Github className={cn("w-5 h-5", isDark ? "text-zinc-300" : "text-slate-700")} />}
          <div className="flex-1">
            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>Pull from GitHub</div>
            <div className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>{isPullingGit ? 'Syncing…' : 'Two-way sync — bring GitHub edits back into this project'}</div>
          </div>
        </button>
        )}

        {/* Buy a domain — search availability, buy via Stripe, auto-DNS */}
        <div className={cn("p-3 rounded-xl border space-y-2", isDark ? "bg-white/[0.02] border-white/[0.07]" : "bg-white border-slate-200")}>
          <div className={cn("flex items-center gap-2 text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>
            <Globe className={cn("w-4 h-4", isDark ? "text-amber-400" : "text-amber-500")} />
            Get a custom domain
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={domainQuery}
              onChange={(e) => onDomainQueryChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearchDomain() }}
              placeholder="yourbrand"
              className={cn(
                "flex-1 min-w-0 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500/50",
                isDark ? "bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-600" : "bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400"
              )}
            />
            <button
              onClick={onSearchDomain}
              disabled={isSearchingDomain}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", isDark ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30" : "bg-amber-100 text-amber-700 hover:bg-amber-200", isSearchingDomain && "opacity-60 cursor-not-allowed")}
            >
              {isSearchingDomain ? '…' : 'Search'}
            </button>
          </div>
          {domainSearched && !isSearchingDomain && domainResults.length === 0 && (
            <p className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>No results — try another name.</p>
          )}
          <div className="space-y-1">
            {domainResults.map((r) => (
              <div key={r.domain} className={cn("flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs", isDark ? "bg-white/[0.03]" : "bg-slate-50")}>
                <span className={cn("font-mono truncate", isDark ? "text-zinc-200" : "text-slate-700")}>{r.domain}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={cn(isDark ? "text-zinc-400" : "text-slate-500")}>${(r.priceCents / 100).toFixed(2)}/yr</span>
                  {r.available ? (
                    <button
                      onClick={() => onBuyDomain(r.domain)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500"
                    >Buy</button>
                  ) : (
                    <span className={cn("text-[10px]", isDark ? "text-zinc-600" : "text-slate-400")}>taken</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {domainResults.length > 0 && (
            <p className={cn("text-[10px]", isDark ? "text-zinc-600" : "text-slate-500")}>
              Buying auto-points DNS at your site — no registrar steps.
            </p>
          )}

          {/* Already own a domain? Connect it (BYO). */}
          <div className={cn("pt-2 mt-1 border-t", isDark ? "border-white/[0.06]" : "border-slate-200")}>
            <div className={cn("text-[10px] mb-1.5", isDark ? "text-zinc-500" : "text-slate-500")}>Already own a domain? Connect it:</div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={ownDomainInput}
                onChange={(e) => onOwnDomainInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onConnectOwnedDomain() }}
                placeholder="yourbrand.com"
                className={cn(
                  "flex-1 min-w-0 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500/50",
                  isDark ? "bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-600" : "bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400"
                )}
              />
              <button
                onClick={onConnectOwnedDomain}
                disabled={isConnectingDomain}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", isDark ? "bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1]" : "bg-slate-200 text-slate-700 hover:bg-slate-300", isConnectingDomain && "opacity-60 cursor-not-allowed")}
              >
                {isConnectingDomain ? '…' : 'Connect'}
              </button>
            </div>
            {connectedDomain && (
              <div className={cn("mt-2 p-2 rounded-lg text-[10px] space-y-1.5", isDark ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200")}>
                <div className={cn("font-medium", isDark ? "text-emerald-300" : "text-emerald-700")}>
                  {connectedDomain.domain} connected — add these DNS records at your registrar:
                </div>
                {connectedDomain.dnsRecords.map((r, i) => (
                  <div key={i} className={cn("font-mono flex flex-wrap gap-x-2", isDark ? "text-zinc-300" : "text-slate-700")}>
                    <span className="font-semibold">{r.type}</span>
                    <span>{r.name}</span>
                    <span className="opacity-60">→</span>
                    <span className="break-all">{r.value}</span>
                  </div>
                ))}
                <div className={cn(isDark ? "text-zinc-500" : "text-slate-500")}>Goes live with HTTPS once DNS resolves (usually minutes).</div>
              </div>
            )}
          </div>
        </div>

        {/* Share / Proposal — opens modal with QR code + proposal mode */}
        <button
          onClick={onOpenShareModal}
          disabled={!html.trim()}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
            !html.trim()
              ? isDark ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed" : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
              : isDark ? "bg-violet-500/10 border-violet-400/30 hover:bg-violet-500/15 hover:border-violet-400/50" : "bg-violet-50 border-violet-200 hover:bg-violet-100 hover:border-violet-300"
          )}
        >
          <Share2 className={cn("w-5 h-5", isDark ? "text-violet-400 group-hover:text-violet-300" : "text-violet-500 group-hover:text-violet-600")} />
          <div className="flex-1 min-w-0">
            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>Share / Proposal</div>
            <div className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>
              QR code · proposal link · accept button
            </div>
          </div>
        </button>

        {/* Self-hosted deploy — full-stack only: GitHub repo, Render deploy, export */}
        {showAdvanced && (<>
        <button
          onClick={onDeployToGitHub}
          disabled={isDeploying || !html.trim()}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
            isDeploying || !html.trim()
              ? isDark ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed" : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
              : isDark ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          {isDeploying && deployStatus === 'github' ? (
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          ) : (
            <Github className={cn("w-5 h-5", isDark ? "text-zinc-400 group-hover:text-white" : "text-slate-500 group-hover:text-slate-900")} />
          )}
          <div className="flex-1">
            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>Push to GitHub</div>
            <div className={cn("text-[10px]", isDark ? "text-zinc-600" : "text-slate-500")}>
              {isDeploying && deployStatus === 'github' ? 'Creating repository...' : 'Create repository'}
            </div>
          </div>
        </button>
        <button
          onClick={onDeployToRender}
          disabled={isDeploying || (!html.trim() && !hasVfsFiles)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left shadow-md",
            isDeploying || (!html.trim() && !hasVfsFiles)
              ? isDark ? "bg-white/[0.04] text-zinc-500 opacity-70 cursor-not-allowed" : "bg-slate-200 text-slate-400 opacity-70 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
          )}
        >
          {isDeploying && deployStatus === 'render' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Rocket className="w-5 h-5" />
          )}
          <div className="flex-1">
            <div className="text-sm font-semibold">Deploy Live</div>
            <div className="text-[10px] opacity-90">
              {isDeploying ? 'Deploying to Render…' : 'One-click deploy'}
            </div>
          </div>
        </button>
        <button
          onClick={onOpenExport}
          disabled={!html.trim()}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
            !html.trim()
              ? isDark ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed" : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
              : isDark ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          <Download className={cn("w-5 h-5", isDark ? "text-zinc-400 group-hover:text-white" : "text-slate-500 group-hover:text-slate-900")} />
          <div className="flex-1">
            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>Export Project</div>
            <div className={cn("text-[10px]", isDark ? "text-zinc-600" : "text-slate-500")}>HTML, ZIP, Next.js, or Static</div>
          </div>
        </button>
        {/* Dev console — full-stack devs jump to live logs/errors */}
        <button
          onClick={onOpenConsole}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
            isDark ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          <Terminal className={cn("w-5 h-5", isDark ? "text-zinc-400 group-hover:text-white" : "text-slate-500 group-hover:text-slate-900")} />
          <div className="flex-1">
            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>Dev console</div>
            <div className={cn("text-[10px]", isDark ? "text-zinc-600" : "text-slate-500")}>Live logs, errors &amp; runtime output</div>
          </div>
        </button>
        </>)}

        <button
          onClick={onOpenPublishModal}
          disabled={!html.trim()}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
            !html.trim()
              ? isDark ? "bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed" : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
              : isDark ? "bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/15" : "bg-violet-50 border-violet-200 hover:bg-violet-100"
          )}
        >
          <Send className={cn("w-5 h-5", isDark ? "text-violet-300 group-hover:text-white" : "text-violet-500 group-hover:text-violet-700")} />
          <div className="flex-1">
            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-800")}>Publish to Community</div>
            <div className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-slate-500")}>Share your build — others can view + remix</div>
          </div>
        </button>

        {/* Custom domain — only meaningful after a deploy exists.
            The card itself handles the "not deployed yet" state.
            id="custom-domain-card" is the scroll-into-view target
            so the "Connect domain" button in the What's-next coach
            can bring this card into view directly. */}
        <div id="custom-domain-card" className="scroll-mt-4">
          <CustomDomainCard
            projectId={projectId}
            isDeployed={deployStatus === 'success' || !!deployUrl}
            isDark={isDark}
          />
        </div>
      </div>
    </motion.div>
  )
}
