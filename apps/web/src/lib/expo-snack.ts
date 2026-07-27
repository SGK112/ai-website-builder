// Save a generated Expo project to Expo Snack so the user can run it on a
// real device through Expo Go, or share a link.
//
// Snack's save endpoint takes a manifest + a code map. We translate the
// workspace VFS into that shape: package.json -> manifest.dependencies +
// sdkVersion, app.json -> name/slug, everything else lands in `code`.
//
// The response includes an `id` (e.g. "@anonymous/my-app-abc123") that
// renders at `https://snack.expo.dev/<id>` and deep-links into Expo Go via
// `exp://exp.host/<id>`. We hand both back.

export interface SnackSaveResult {
  id: string
  hashId: string
  url: string
  embedUrl: string
  expoGoUrl: string
}

export interface SnackSaveInput {
  files: Record<string, string>
  name?: string
  description?: string
  slug?: string
  // Public https URL for a 1024×1024 PNG. Injected into the manifest so
  // Expo Go renders it as the app's home-screen icon. Optional.
  iconUrl?: string
}

const SNACK_API = 'https://exp.host/--/api/v2/snack/save'
const SNACK_VIEW = 'https://snack.expo.dev'
const SNACK_DEEP_LINK = 'exp://exp.host'

// Which Expo SDK to publish a Snack as.
//
// The old code derived this from the generated package.json (`expo: ~52.0.0`)
// and guarded it with a hardcoded `Set([50..54])` + a 53 fallback. Measured
// 2026-07-26, that guard was doing nothing at all:
//
//   • Snack's save endpoint does NOT validate sdkVersion. It returns 200 for
//     52, for 57, and for a nonexistent 40. So the "unsupported SDK → 400 →
//     fall back" path the constants existed to serve could never fire.
//   • The real failure lands on the USER'S PHONE, and is completely silent
//     server-side: we publish a Snack pinned to an aging SDK, the QR opens in
//     whatever Expo Go is on the App Store today, and Expo Go refuses it.
//     Nothing throws, nothing logs, the publish looks like a success.
//   • The allow-list also capped us at 54 while Snack already hosts 57, so
//     bumping the template would have silently DOWNGRADED the publish.
//
// So: don't derive the SDK from the template at all. Publish at the newest
// SDK Expo lists, which is what a freshly-installed Expo Go can open. That's
// safe here because generated apps only touch react, react-native,
// expo-status-bar and expo-linear-gradient — APIs that are stable across
// majors — and Snack pins react/react-native itself from sdkVersion.
const SNACK_VERSIONS_API = 'https://exp.host/--/api/v2/versions'

// Only used if the catalogue can't be fetched. Keep this at the newest SDK
// known good at time of writing — an OLD constant here recreates the exact
// silent-breakage this fix removes.
const SNACK_FALLBACK_SDK = '57.0.0'

// Cached per process — Expo ships a new SDK a few times a year, and a Snack
// publish shouldn't pay for an extra round trip.
let sdkCatalogue: { newest: string; at: number } | null = null
const SDK_CACHE_MS = 6 * 60 * 60 * 1000

async function newestExpoSdk(): Promise<string> {
  if (sdkCatalogue && Date.now() - sdkCatalogue.at < SDK_CACHE_MS) return sdkCatalogue.newest
  try {
    const r = await fetch(SNACK_VERSIONS_API, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) throw new Error(`versions ${r.status}`)
    const data = (await r.json()) as { sdkVersions?: Record<string, unknown> }
    const majors = Object.keys(data?.sdkVersions || {})
      .map((v) => Number(v.split('.')[0]))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
    if (!majors.length) throw new Error('no sdkVersions in catalogue')
    const newest = `${majors[majors.length - 1]}.0.0`
    sdkCatalogue = { newest, at: Date.now() }
    return newest
  } catch (e: any) {
    console.warn('[Snack] SDK catalogue fetch failed, publishing at fallback:', e?.message || e)
    return SNACK_FALLBACK_SDK
  }
}

function parsePackageJson(raw: string | undefined): {
  dependencies: Record<string, { version: string }>
  /** Major pinned by the generated package.json, or NaN when unreadable. */
  desiredMajor: number
} {
  if (!raw) return { dependencies: defaultSnackDeps(), desiredMajor: NaN }
  let pkg: any
  try {
    pkg = JSON.parse(raw)
  } catch {
    return { dependencies: defaultSnackDeps(), desiredMajor: NaN }
  }
  const deps: Record<string, { version: string }> = {}
  for (const [k, v] of Object.entries((pkg.dependencies as Record<string, string>) || {})) {
    // Snack rejects react / react-dom / react-native — it pins them itself
    // based on sdkVersion. Same with `expo` (the runtime) and
    // react-native-web (pulled in automatically).
    if (k === 'react' || k === 'react-dom' || k === 'react-native' || k === 'expo' || k === '@expo/metro-runtime' || k === 'react-native-web') continue
    // expo-* packages are versioned per SDK: expo-linear-gradient 14.x is the
    // SDK-52 build. Since we publish at the newest SDK (see above), sending
    // the template's pin would install a mismatched library. Let Snack pick
    // the right one. Third-party deps keep their pin — nobody else's version
    // is coupled to the Expo SDK.
    const version =
      k.startsWith('expo-') || k.startsWith('@expo/')
        ? '*'
        : typeof v === 'string'
          ? v.replace(/^[~^]/, '')
          : '*'
    deps[k] = { version }
  }
  // Derive the SDK major from the `expo` dep. Resolution against what Snack
  // actually hosts happens in saveSnack — this only reports what was asked for.
  const expoRange: string = (pkg.dependencies?.expo as string) || ''
  const majorMatch = expoRange.match(/(\d+)/)
  // Snack rejects an empty dependencies object even when no third-party
  // packages are imported. Always supply at least the Expo essentials
  // the generated template uses so the save survives.
  if (Object.keys(deps).length === 0) Object.assign(deps, defaultSnackDeps())
  return { dependencies: deps, desiredMajor: majorMatch ? Number(majorMatch[1]) : NaN }
}

function defaultSnackDeps(): Record<string, { version: string }> {
  return {
    'expo-status-bar': { version: '*' },
    'expo-linear-gradient': { version: '*' },
  }
}

function parseAppJson(raw: string | undefined): { name?: string; slug?: string } {
  if (!raw) return {}
  try {
    const j = JSON.parse(raw)
    return { name: j?.expo?.name, slug: j?.expo?.slug }
  } catch {
    return {}
  }
}

function makeSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'webstew-app'
  )
}

export async function saveSnack(input: SnackSaveInput): Promise<SnackSaveResult> {
  const { files } = input
  if (!files || typeof files !== 'object' || !Object.keys(files).length) {
    throw new Error('No files to save')
  }
  // Snack expects an entry called App.tsx OR App.js. Reject early with a
  // helpful message instead of letting Snack 400 us.
  const hasEntry = files['App.tsx'] || files['App.js'] || files['App.ts']
  if (!hasEntry) throw new Error('Project is missing App.tsx — cannot save as Snack')

  const { dependencies, desiredMajor } = parsePackageJson(files['package.json'])
  const appJson = parseAppJson(files['app.json'])

  // Publish at the newest SDK Expo lists — that's what the Expo Go on the
  // user's phone can open. Read live, so this never rots.
  const sdkVersion = await newestExpoSdk()
  if (Number.isFinite(desiredMajor) && `${desiredMajor}.0.0` !== sdkVersion) {
    // Informational, not an error: the publish is correct either way. It's a
    // standing reminder that the WebContainer template has drifted behind the
    // SDK we ship to phones, which is worth closing eventually.
    console.info(
      `[Snack] template pins Expo SDK ${desiredMajor}; publishing at ${sdkVersion} (newest Expo Go can open). Bump lib/templates/mobile-app.ts to close the gap.`,
    )
  }

  const name = input.name || appJson.name || 'Webstew App'
  const slug = makeSlug(input.slug || appJson.slug || name)
  const description = input.description || 'Generated with Webstew'

  // Build the `code` map. Snack accepts source files keyed by their path —
  // skip the scaffolding files that live in `manifest` instead, and skip
  // anything that isn't a usable text source.
  const code: Record<string, { contents: string; type: 'CODE' }> = {}
  // Snack ignores package.json's `main` field and always uses App.tsx as the
  // entry. The template's index.ts (`registerRootComponent(App)`) has no
  // default export, so leaving it in produces "No default export of
  // index.ts to render". Skip the scaffolding files and any entry shim.
  const skipPaths = new Set([
    'package.json',
    'app.json',
    'tsconfig.json',
    'babel.config.js',
    'metro.config.js',
    'index.ts',
    'index.js',
  ])
  for (const [path, contents] of Object.entries(files)) {
    if (skipPaths.has(path)) continue
    if (typeof contents !== 'string') continue
    if (!contents.length) continue
    code[path] = { contents, type: 'CODE' }
  }

  // Snack's save endpoint puts dependencies at the TOP LEVEL, not inside
  // manifest — passing them on manifest returns "Project dependencies not
  // provided." (verified against exp.host/--/api/v2/snack/save 2026-05-24).
  // Icon goes under manifest.icon (mirrors expo.icon in the underlying
  // app.json) so Expo Go shows the user's chosen home-screen icon.
  const post = async (sdk: string) => {
    const manifest: Record<string, any> = { name, slug, description, sdkVersion: sdk }
    if (input.iconUrl) manifest.icon = input.iconUrl
    return fetch(SNACK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Snack-Api-Version': '3.0.0',
      },
      body: JSON.stringify({ manifest, dependencies, code, isDraft: false }),
    })
  }

  const r = await post(sdkVersion)
  if (!r.ok) {
    let detail = ''
    try {
      detail = await r.text()
    } catch {}
    // No sdkVersion retry here on purpose: Snack accepts any sdkVersion, so a
    // non-2xx is never about the SDK — it's payload size, auth, or an outage.
    // Retrying on a different SDK would just repeat the same failure.
    throw new Error(`Snack save failed (${r.status}): ${detail.slice(0, 300) || r.statusText}`)
  }
  const data = (await r.json()) as { id?: string; hashId?: string }
  const id = data.id || (data.hashId ? `@anonymous/${slug}-${data.hashId}` : '')
  const hashId = data.hashId || ''
  if (!id) throw new Error('Snack save returned no id')

  // Encode the slash in the @user/slug id so the URL is well-formed.
  const safeId = id.split('/').map(encodeURIComponent).join('/')
  return {
    id,
    hashId,
    url: `${SNACK_VIEW}/${safeId}`,
    // Embedded player has its own QR + device tab and is the richest preview
    // surface. `preview=true` runs it on load; `platform=mydevice` opens the
    // device tab by default so the QR is the first thing the user sees.
    embedUrl: `${SNACK_VIEW}/embedded/${safeId}?platform=mydevice&preview=true&theme=dark&hideDevTools=true`,
    // Expo Go opens this scheme directly — scan as QR to skip the website.
    expoGoUrl: `${SNACK_DEEP_LINK}/${safeId}`,
  }
}
