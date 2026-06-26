# Serving published sites from webstew.app (origin isolation)

**Why:** published sites currently serve at `www.webstew.net/s/<slug>` — the
**same origin** as the Webstew app. A malicious published site's JS can ride a
logged-in visitor's `www.webstew.net` session and read app-origin `localStorage`.
Fix: serve published sites from a **separate registrable domain** (`webstew.app`),
so the browser isolates them from the app automatically (different origin →
separate cookies, separate `localStorage`, no credentialed reads of app APIs).

The code is **already wired and shipped** — it's gated behind one env flag so it
does nothing until DNS + TLS exist. This file is the runbook to turn it on.

## What the code already does
- `middleware.ts` rewrites `*.webstew.app` → the `/s/[slug]` serving route.
- `lib/publish.ts` hands out the `https://<slug>.webstew.app` canonical URL when
  `PUBLISH_USE_SUBDOMAIN=1` (otherwise the `/s/<slug>` path URL).
- `app/s/[slug]/[[...path]]/route.ts` enforces **origin isolation**: when
  `PUBLISH_USE_SUBDOMAIN=1`, any `/s/<slug>` request that lands on the **app
  origin** (`www.webstew.net`, `*.onrender.com`) is `302`-redirected to the
  canonical `*.webstew.app` URL — a redirect runs no page JS, so published
  content never executes same-origin with the app. Existing `/s/<slug>` share
  links keep working (one bounce). While the flag is off, sites serve inline at
  `/s/<slug>` exactly as today.
- The published-app backend SDK (`lib/app-backend.ts`) already calls the API at
  an **absolute** `www.webstew.net` base, so its (CORS-open) calls keep working
  cross-origin from `webstew.app`. No SDK change needed.

## Steps to go live (do these in order)

### 1. DNS (Cloudflare — webstew.app)
Add `webstew.app` to the same Cloudflare account as `webstew.net`, then:
- `A`/`CNAME` **apex** `webstew.app` → the app (proxied / orange-cloud).
- `CNAME` **wildcard** `*.webstew.app` → the app (proxied / orange-cloud).
  Point both at the canonical app target you already use for `www.webstew.net`
  (the Render service host or the existing CF origin).

### 2. TLS
Cloudflare Universal SSL covers the apex **and one level of wildcard**
(`*.webstew.app`) automatically when both records are proxied — confirm the edge
cert lists `webstew.app` and `*.webstew.app` before continuing. (If you serve
Render directly instead of via CF, add `webstew.app` + `*.webstew.app` as custom
domains on service `srv-d554is8gjchc7388svd0` and let Render provision the cert.)

### 3. Render env (the "Webstew ENV" group)
Set:
```
NEXT_PUBLIC_PUBLISH_DOMAIN=webstew.app   # already the code default; set explicitly
PUBLISH_USE_SUBDOMAIN=1                   # the flip — turns on subdomain URLs + isolation
```
Redeploy (env change triggers it).

### 4. Verify
- `https://<some-published-slug>.webstew.app/` → serves the site at the root.
- `https://www.webstew.net/s/<that-slug>` → **302** to
  `https://<that-slug>.webstew.app/` (not an inline render).
- A freshly published site's Go-Live URL is now the `*.webstew.app` form.
- In a logged-in app tab, `document.cookie` / `localStorage` on a `webstew.app`
  site is empty (separate origin) — isolation confirmed.

## Rollback
Set `PUBLISH_USE_SUBDOMAIN=0` (or remove it) and redeploy. Serving reverts to
`/s/<slug>` inline on the app origin. Use a temporary (`302`) mindset — no
permanent redirects are emitted, so nothing is sticky in browser caches.

## Notes
- Custom domains (`acme.com`) are unaffected — they already serve via
  `/sites/by-host` and are already cross-origin.
- Do **not** ship the CSP `sandbox` stopgap as an alternative: it forces an
  opaque origin and breaks published apps that rely on real `localStorage`
  (e.g. the WebstewDB end-user auth token). The separate-domain approach here
  keeps `localStorage` working.
