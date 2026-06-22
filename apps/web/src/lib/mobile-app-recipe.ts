// Mobile-app builds are now installable WEB apps (PWAs), not Expo/React Native.
// "Try it on your phone" then = open a URL in the phone browser + Add to Home
// Screen — no Expo Go, no app store, works for everyone. This recipe is appended
// to the normal website generation prompt when the user wants a mobile app, so
// the output is an app-shell PWA HTML that flows through the whole website
// pipeline (preview, phone QR, publish, export).

// Detect "build me a mobile app" intent. Deliberately NOT triggered by "web
// app" alone (that's just a site). Explicit native ("react native"/"expo") is
// handled separately and keeps the Expo path.
export function wantsMobileApp(prompt: string): boolean {
  const p = prompt || ''
  if (/\b(react[\s-]?native|expo)\b/i.test(p)) return false // explicit native → not PWA
  return /\b(mobile app|ios app|android app|iphone app|smartphone app|phone app|app for (ios|android|iphone|my phone)|installable app|pwa|home[\s-]?screen app)\b/i.test(p)
}

export const MOBILE_APP_PROMPT = `MOBILE APP (PWA) MODE — the user wants a mobile app. Build a mobile-first, INSTALLABLE web app (PWA) that feels like a native app on a phone — NOT a long scrolling marketing page.

APP SHELL & LAYOUT:
- Full-viewport app frame: html,body{height:100%;margin:0;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}. A root container at height:100dvh; display:flex; flex-direction:column; overflow:hidden; max-width:480px; margin:0 auto (so it's phone-shaped, centered on desktop).
- A fixed TOP app bar (title / context) and a fixed BOTTOM TAB BAR (3–5 tabs, each an icon + short label) as the primary navigation. Only the middle content area scrolls; the bars stay put.
- Tabs switch the view IN-PAGE via JS (show/hide sections) — NO page reloads, NO anchor scrolling. Tapping a tab sets the active tab style and swaps the visible view.
- Touch-first: tap targets ≥ 44px, system font stack, no hover-only interactions. Respect safe areas: padding-bottom: env(safe-area-inset-bottom) on the bottom bar; padding-top: env(safe-area-inset-top) on the top bar.

INSTALLABLE / PWA — put in <head>:
- <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
- <meta name="theme-color" content="<your accent hex>">
- <meta name="apple-mobile-web-app-capable" content="yes">
- <meta name="mobile-web-app-capable" content="yes">
- <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
- <meta name="apple-mobile-web-app-title" content="<App Name>">
- A web app manifest inlined as a data URI so it ships in the single file:
  <link rel="manifest" href="data:application/manifest+json,<URL-ENCODED JSON>">
  where the JSON is {"name":"<App Name>","short_name":"<Short>","display":"standalone","background_color":"<bg hex>","theme_color":"<accent hex>","start_url":".","icons":[{"src":"<inline SVG data-URI icon>","sizes":"512x512","type":"image/svg+xml"}]}. URL-encode it (encodeURIComponent-style: spaces %20, quotes %22, # %23, etc.).
- Result: "Add to Home Screen" launches it fullscreen with no browser chrome — like a native app.

BEHAVIOR:
- Real app interactivity: working tab navigation, interactive controls, local state held in JS. Forms call preventDefault and show inline feedback (no backend).
- Keep ALL logic client-side so it works installed and offline-first.

Still output ONE complete HTML document.`
