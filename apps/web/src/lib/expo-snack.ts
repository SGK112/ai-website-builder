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

// Snack supports specific Expo SDK majors. If the generated package.json
// pins a major Snack doesn't host yet, the save will 400. We resolve to a
// known-good fallback (53 — the latest GA when this was wired up; Snack's
// support window typically trails the latest SDK by ~1 release).
const SNACK_FALLBACK_SDK = '53.0.0'
const SNACK_SUPPORTED_MAJORS = new Set([50, 51, 52, 53, 54])

function parsePackageJson(raw: string | undefined): {
  dependencies: Record<string, { version: string }>
  sdkVersion: string
} {
  if (!raw) return { dependencies: defaultSnackDeps(), sdkVersion: SNACK_FALLBACK_SDK }
  let pkg: any
  try {
    pkg = JSON.parse(raw)
  } catch {
    return { dependencies: defaultSnackDeps(), sdkVersion: SNACK_FALLBACK_SDK }
  }
  const deps: Record<string, { version: string }> = {}
  for (const [k, v] of Object.entries((pkg.dependencies as Record<string, string>) || {})) {
    // Snack rejects react / react-dom / react-native — it pins them itself
    // based on sdkVersion. Same with `expo` (the runtime) and
    // react-native-web (pulled in automatically).
    if (k === 'react' || k === 'react-dom' || k === 'react-native' || k === 'expo' || k === '@expo/metro-runtime' || k === 'react-native-web') continue
    const version = typeof v === 'string' ? v.replace(/^[~^]/, '') : '*'
    deps[k] = { version }
  }
  // Derive SDK version from the `expo` dep major. The template ships ~54.0.x,
  // so we map ^54.0.0 / ~54.0.x / 54.x.x -> 54.0.0.
  const expoRange: string = (pkg.dependencies?.expo as string) || ''
  const majorMatch = expoRange.match(/(\d+)/)
  const major = majorMatch ? Number(majorMatch[1]) : NaN
  const sdkVersion =
    Number.isFinite(major) && SNACK_SUPPORTED_MAJORS.has(major)
      ? `${major}.0.0`
      : SNACK_FALLBACK_SDK
  // Snack rejects an empty dependencies object even when no third-party
  // packages are imported. Always supply at least the Expo essentials
  // the generated template uses so the save survives.
  if (Object.keys(deps).length === 0) Object.assign(deps, defaultSnackDeps())
  return { dependencies: deps, sdkVersion }
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

  const { dependencies, sdkVersion } = parsePackageJson(files['package.json'])
  const appJson = parseAppJson(files['app.json'])

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
  const manifest: Record<string, any> = { name, slug, description, sdkVersion }
  if (input.iconUrl) manifest.icon = input.iconUrl
  const body = { manifest, dependencies, code, isDraft: false }

  const r = await fetch(SNACK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Snack-Api-Version': '3.0.0',
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    let detail = ''
    try {
      detail = await r.text()
    } catch {}
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
