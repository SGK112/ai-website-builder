# Cloudflare setup runbook

Puts the AI website builder behind Cloudflare's free tier so the Render
origin stops getting hammered directly. Everything below is dashboard
work — no code changes required after the merge that introduced
`lib/abuse-guard.ts` (the app already honors `cf-connecting-ip` and
`cf-threat-score` when those headers show up).

Plan for ~30 min total.

## Prereqs

- A Cloudflare account (free).
- DNS access to the domain currently pointing at Render.
- The Render service hostname (something like
  `ai-website-builder.onrender.com`) — needed for the origin record.

## 1. Add the site to Cloudflare

1. Cloudflare dashboard → **Add a Site**.
2. Enter the apex domain (e.g. `webstew.app`). Pick the **Free** plan.
3. Cloudflare scans existing DNS and shows what it found.
4. **Verify the `A` / `CNAME` record(s) point at Render.** The record(s)
   for `@` and/or `www` should be:
   - Type: `CNAME`
   - Name: `@` (or `www`)
   - Target: `<your-service>.onrender.com`
   - **Proxy status: Proxied (orange cloud)** — this is the whole point.
5. Click **Continue**.

## 2. Switch nameservers at the registrar

Cloudflare gives you two nameservers (e.g. `lia.ns.cloudflare.com` /
`max.ns.cloudflare.com`). At your domain registrar (Namecheap, Google
Domains, Porkbun, whatever), replace the existing nameservers with
those two.

DNS propagation usually takes 5–30 min. Cloudflare will email when the
zone goes active. Until then, traffic still routes directly to Render
(no harm — just no protection yet).

## 3. Confirm proxy is active

Once the zone is active, `curl -sI https://yourdomain.com` should show:

```
server: cloudflare
cf-ray: <some-id>
```

If you see `server: render` instead, the DNS record's orange cloud is
off — toggle it on in **DNS → Records**.

## 4. Lock down the origin

Right now anyone who knows the Render hostname can bypass Cloudflare by
hitting `<service>.onrender.com` directly. Two ways to close that:

**Easy:** in Render's service settings, enable **"Custom domain only"**
mode (under Settings → Custom Domains). Render will 404 requests to the
`.onrender.com` hostname.

**Better:** add a Cloudflare **WAF custom rule**:
- Field: `cf.client.bot` is `false` AND `http.host` equals
  `<your-render-host>.onrender.com`
- Action: Block

Either step prevents attackers from bypassing CF entirely.

## 5. Turn on the free defenses

Under **Security → Settings**:

- **Security Level**: Medium (default)
- **Bot Fight Mode**: ON
- **Browser Integrity Check**: ON
- **Challenge Passage**: 30 minutes (default)
- **Privacy Pass Support**: ON

Under **SSL/TLS → Edge Certificates**:

- **Always Use HTTPS**: ON
- **HTTP Strict Transport Security (HSTS)**: ON (start with `max-age=300`,
  bump to `max-age=31536000` after a week of clean operation)
- **Minimum TLS Version**: TLS 1.2

Under **Speed → Optimization**:

- **Auto Minify**: HTML/CSS/JS all ON
- **Brotli**: ON
- **Early Hints**: ON

## 6. Rate-limit rule for the AI endpoints

Free plan gets one rate-limit rule with 10K matches/month. Spend it on
the costliest anon-accessible endpoint:

**Security → WAF → Rate limiting rules → Create rule**

- Name: `Anon AI throttle`
- If incoming requests match:
  - Field: `URI Path`
  - Operator: `starts with`
  - Value: `/api/builder/generate`
  - OR `URI Path` `starts with` `/api/tools/grade`
- When rate exceeds:
  - 30 requests per 1 minute, per IP
- Then take action:
  - Block (or Managed Challenge for a softer touch)
- Duration: 10 minutes

This is a *second layer* on top of `lib/abuse-guard.ts`. The app's
in-process limit is 8/hour anon; the CF rule catches sustained 30/min
bursts at the edge before they even hit the origin.

## 7. (Optional) Geo / ASN blocking

If you start seeing abuse from specific countries or VPS providers:

**Security → WAF → Tools → IP Access Rules**

Examples:
- Block country `RU` → `cn.country eq "RU"`
- Block all DigitalOcean traffic → `ip.geoip.asnum eq 14061`
- Block a specific /24 → `ip.src in {203.0.113.0/24}`

Major VPS ASNs to consider blocking if you don't have legit users on them:
- 14061 — DigitalOcean
- 16509 — Amazon AWS
- 15169 — Google Cloud
- 8075  — Microsoft Azure
- 63949 — Linode
- 24940 — Hetzner
- 16276 — OVH
- 20473 — Vultr

Free tier supports IP Access Rules; ASN matching works on the free plan
through firewall rules using `ip.geoip.asnum`.

## 8. (Optional) Cloudflare Turnstile on the grader

Free invisible-CAPTCHA. Use it on the grader's anon path so AI-tool
attempts at scraped grading get a hard wall.

1. **Turnstile** dashboard → **Add site**.
2. Hostname: your domain. Mode: **Managed**.
3. Copy the site key + secret.
4. Add to env:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY=`
   - `TURNSTILE_SECRET=`
5. Wire it in — pair with the grader widget on the landing page and
   verify server-side at `/api/tools/grade`. (Hook is in the abuse-guard
   layer; can be added in a follow-up commit.)

## 9. Tunnel route for Sentry

The Next.js Sentry wrapper routes browser error reports through
`/monitoring/*` on your own origin (set in `next.config.js`). This
matters because ad-blockers / privacy extensions drop direct requests
to `sentry.io`. Cloudflare doesn't need any extra config for this —
`/monitoring/*` is just another path on your domain — but make sure
your WAF/rate-limit rules don't accidentally match it.

## What you should NOT do

- Don't enable **Under Attack Mode** preemptively. It JS-challenges
  every visitor and tanks legitimate signup conversion. Reserve it for
  when you're actively being hit.
- Don't crank Security Level to **High**. It triggers managed
  challenges for ordinary residential ISPs and frustrates real users.
- Don't enable **Email Obfuscation** — it rewrites mailto links and
  often breaks the JS on generated sites.

## Verifying it's working

After CF is active, watch for these in your logs:

- Inbound requests should include the `cf-connecting-ip` header — the
  app's `lib/abuse-guard.ts` will start using that as the per-IP key
  automatically.
- Suspicious requests should sometimes 403 from the app's bot-UA gate,
  and sometimes never reach you at all (Cloudflare blocked them at the
  edge — visible in **Security → Events**).
- The **Security → Events** dashboard shows everything CF blocked. Use
  it to tune rules over time.

## Cost

Free tier covers everything above except:
- WAF managed rulesets (OWASP, Cloudflare Specials) — Pro plan, $25/mo.
- More than 1 rate-limit rule — Pro plan.
- Bot Management (vs Bot Fight Mode) — Enterprise.

The free plan is enough to close the holes we identified. Upgrade to
Pro if/when abuse actually starts costing real money despite the
defenses above.
