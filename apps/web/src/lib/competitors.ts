// Competitor comparison data for the /compare/[slug] pages. Kept honest and
// specific: every row is a real, defensible capability difference, and each
// page names where the competitor genuinely wins — fair comparisons rank and
// convert better than hit pieces, and don't age into being wrong.
//
// Imported by both the page (render + static params) and the sitemap (so new
// competitors get discovered automatically when added here).

export type CompareRow = {
  label: string
  webstew: string
  them: string
  webstewWins?: boolean
}

export type Competitor = {
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  tagline: string
  intro: string
  rows: CompareRow[]
  webstewWins: string[]
  themWins: string[]
  faqs: { q: string; a: string }[]
}

export const COMPETITORS: Record<string, Competitor> = {
  wix: {
    slug: 'wix',
    name: 'Wix',
    metaTitle: 'Webstew vs Wix: AI Builder Comparison (2026)',
    metaDescription:
      'Webstew vs Wix — compare AI website generation, code ownership, mobile-app output, pricing, and lock-in. See which builder fits founders and teams in 2026.',
    tagline: 'Own real code vs. an all-in-one hosted editor',
    intro:
      'Wix is one of the most popular all-in-one website builders — easy drag-and-drop, a huge template library, and everything hosted in one place. Webstew takes a different approach: describe what you want and AI generates a real, ownable codebase you can deploy anywhere. Here is how they compare.',
    rows: [
      { label: 'Builds from a single prompt', webstew: 'Yes — full site, app, or store', them: 'Section/template assists only', webstewWins: true },
      { label: 'Real code you own & export', webstew: 'Yes — Next.js, Astro, React', them: 'No — locked to Wix', webstewWins: true },
      { label: 'Native mobile app output', webstew: 'Yes — Expo / React Native', them: 'No', webstewWins: true },
      { label: 'Deploy to your own GitHub + host', webstew: 'Yes — GitHub + Render', them: 'Wix hosting only', webstewWins: true },
      { label: 'Built-in CMS', webstew: 'Yes', them: 'Yes' },
      { label: 'Template & app marketplace', webstew: 'Growing marketplace', them: 'Large, mature', webstewWins: false },
      { label: 'Learning curve', webstew: 'Describe it in words', them: 'Drag-and-drop editor' },
      { label: 'Free to start', webstew: 'Yes', them: 'Yes (with Wix branding)' },
    ],
    webstewWins: [
      'You own and export real code — move it anywhere, zero lock-in',
      'One prompt scaffolds the whole site, app, or store',
      'Ships web AND native mobile (Expo), not just web',
      'Deploys straight to your own GitHub + Render',
    ],
    themWins: [
      'Massive template and app marketplace out of the box',
      'Long-established with a huge support ecosystem',
      'All-in-one hosting, business email, and domains in one dashboard',
    ],
    faqs: [
      { q: 'Can I move my site off Wix?', a: 'Wix sites are tied to Wix hosting and can’t be exported as a full codebase. Webstew is the opposite — it generates real Next.js, Astro, or React code that you own and can deploy to your own GitHub and host.' },
      { q: 'Is Webstew cheaper than Wix?', a: 'Webstew is free to start and paid plans begin at $19/month. Because you can deploy to your own host, you’re not locked into a single platform’s hosting fees long-term.' },
      { q: 'Is Webstew a good Wix alternative for developers?', a: 'Yes. If you want the speed of a builder but real, ownable code (and optional native mobile output), Webstew fits developers and technical founders better than a closed drag-and-drop platform.' },
    ],
  },

  webflow: {
    slug: 'webflow',
    name: 'Webflow',
    metaTitle: 'Webstew vs Webflow: AI Builder vs Designer (2026)',
    metaDescription:
      'Webstew vs Webflow — AI prompt-to-app generation vs a pro visual designer. Compare code ownership, mobile output, learning curve, CMS, and pricing for 2026.',
    tagline: 'Prompt-to-app speed vs. designer-grade visual control',
    intro:
      'Webflow is a powerful visual design tool loved by designers for its pixel control and strong CMS. The trade-off is a real learning curve and a design-led, manual workflow. Webstew generates a full project from a prompt — faster from idea to deployed — and outputs app code, not just a static front end.',
    rows: [
      { label: 'Builds from a single prompt', webstew: 'Yes — full project', them: 'Manual visual design', webstewWins: true },
      { label: 'Real app code (not just static)', webstew: 'Yes — Next.js, Astro, React', them: 'Exports static HTML/CSS/JS', webstewWins: true },
      { label: 'Native mobile app output', webstew: 'Yes — Expo / React Native', them: 'No', webstewWins: true },
      { label: 'Deploy to your own GitHub + host', webstew: 'Yes — GitHub + Render', them: 'Webflow hosting or static export' },
      { label: 'Visual design control', webstew: 'Prompt + edit', them: 'Pixel-perfect canvas', webstewWins: false },
      { label: 'Built-in CMS', webstew: 'Yes', them: 'Yes — mature & powerful', webstewWins: false },
      { label: 'Learning curve', webstew: 'Describe it in words', them: 'Steep — designer tool to master' },
      { label: 'Free to start', webstew: 'Yes', them: 'Yes (limited)' },
    ],
    webstewWins: [
      'No learning curve — describe the site and it’s built',
      'Generates full application code, not just a static front end',
      'Native mobile (Expo) output, not web-only',
      'Faster from zero to a deployed product',
    ],
    themWins: [
      'Pixel-perfect, designer-grade visual control',
      'Mature CMS with advanced interactions and animations',
      'Large agency and designer ecosystem',
    ],
    faqs: [
      { q: 'Is Webstew easier than Webflow?', a: 'Yes — Webflow has a real learning curve as a professional design tool. With Webstew you describe what you want in plain language and get a working, deployable project, then refine it.' },
      { q: 'Does Webstew export code like Webflow?', a: 'Webflow exports static HTML/CSS/JS. Webstew generates a full application codebase (Next.js, Astro, or React) that you own and can deploy to your own GitHub and host.' },
      { q: 'Which is better for a startup?', a: 'If you want designer-grade control and have the time to learn, Webflow is excellent. If you want to go from idea to a deployed, ownable site or app fast, Webstew is the quicker path.' },
    ],
  },

  framer: {
    slug: 'framer',
    name: 'Framer',
    metaTitle: 'Webstew vs Framer: AI Builder Comparison (2026)',
    metaDescription:
      'Webstew vs Framer — compare AI generation, code ownership, mobile-app output, hosting, and lock-in. Find the right builder for ownable sites and apps in 2026.',
    tagline: 'Ownable, deployable code vs. a polished hosted canvas',
    intro:
      'Framer is a beautiful, design-first builder with slick templates and AI page generation — great for landing pages and portfolios. It’s hosted and design-focused. Webstew generates a real codebase you own across web and mobile, and deploys to your own infrastructure.',
    rows: [
      { label: 'Builds from a single prompt', webstew: 'Yes — site, app, or store', them: 'AI page generation (design)', webstewWins: true },
      { label: 'Real code you own & export', webstew: 'Yes — Next.js, Astro, React', them: 'No — Framer-hosted', webstewWins: true },
      { label: 'Native mobile app output', webstew: 'Yes — Expo / React Native', them: 'No', webstewWins: true },
      { label: 'Deploy to your own GitHub + host', webstew: 'Yes — GitHub + Render', them: 'Framer hosting', webstewWins: true },
      { label: 'Design-forward templates', webstew: 'Yes', them: 'Yes — best-in-class', webstewWins: false },
      { label: 'Built-in CMS', webstew: 'Yes', them: 'Yes' },
      { label: 'Learning curve', webstew: 'Describe it in words', them: 'Design canvas' },
      { label: 'Free to start', webstew: 'Yes', them: 'Yes (limited)' },
    ],
    webstewWins: [
      'Export and own the code — not locked to one host',
      'Builds apps and stores, not just marketing sites',
      'Native mobile (Expo) output',
      'Deploys to your own GitHub + Render',
    ],
    themWins: [
      'Beautiful, design-forward templates',
      'Polished, canvas-based visual editor',
      'Excellent for landing pages and portfolios',
    ],
    faqs: [
      { q: 'Can I export my code from Framer?', a: 'Framer sites are hosted on Framer and aren’t exported as a full codebase. Webstew generates real Next.js, Astro, or React code that you own and can host anywhere.' },
      { q: 'Is Webstew good for more than landing pages?', a: 'Yes. Framer shines for landing pages and portfolios; Webstew also builds full apps and stores, with optional native mobile output.' },
      { q: 'Which has less lock-in?', a: 'Webstew — because you own and deploy the code yourself. Framer keeps your site on its hosted platform.' },
    ],
  },

  lovable: {
    slug: 'lovable',
    name: 'Lovable',
    metaTitle: 'Webstew vs Lovable: AI App Builder Comparison (2026)',
    metaDescription:
      'Webstew vs Lovable — compare prompt-to-app generation, real websites vs. apps, native mobile output, publishing, and pricing. A fair look for founders in 2026.',
    tagline: 'A prompt-to-site builder vs. a prompt-to-React-app tool',
    intro:
      'Lovable is a popular AI tool for generating full-stack React apps from a prompt. Webstew overlaps on the “describe it and it builds” magic, but aims wider: real marketing sites and stores that publish instantly, PLUS apps and native mobile — not just a React project. Here is an honest comparison.',
    rows: [
      { label: 'One prompt → full result', webstew: 'Site, store, or app', them: 'React app', webstewWins: true },
      { label: 'Instant published site (your-name.webstew.net)', webstew: 'Yes — one click', them: 'Deploy a React app', webstewWins: true },
      { label: 'Native mobile output', webstew: 'Yes — Expo / React Native', them: 'Web app', webstewWins: true },
      { label: 'Talk-to-build voice', webstew: 'Yes — realtime voice', them: 'Text prompt', webstewWins: true },
      { label: 'Own & export the code', webstew: 'Yes', them: 'Yes', },
      { label: 'Built-in AI video / media studio', webstew: 'Yes', them: 'No', webstewWins: true },
      { label: 'Full-stack app depth', webstew: 'Good', them: 'Strong', webstewWins: false },
      { label: 'Free to start', webstew: 'Yes', them: 'Yes (limited)' },
    ],
    webstewWins: [
      'Publishes a real live site in one click — no deploy step for a simple site',
      'Ships web AND native mobile (Expo), plus an AI video/media studio',
      'Build hands-free by talking to it (realtime voice)',
      'One tool for a marketing site, a store, AND an app',
    ],
    themWins: [
      'Deep, focused full-stack React app generation',
      'Strong developer-oriented iteration loop',
      'Large, active community around app building',
    ],
    faqs: [
      { q: 'Is Webstew a Lovable alternative?', a: 'Yes — if you want to describe an app or site and have AI build it. Webstew goes wider: it also publishes marketing sites and stores instantly and outputs native mobile, not just a React app.' },
      { q: 'Can Webstew build a real app, not just a website?', a: 'Yes — React, Next.js, and native mobile via Expo, with real auth and a database. It also does one-click marketing sites and stores, which app-only tools don’t focus on.' },
      { q: 'Which should I pick?', a: 'Pick Lovable for a deep, code-heavy full-stack app. Pick Webstew if you want one tool that ships a live site today and can grow into an app + mobile, and prefer building by talking.' },
    ],
  },

  bolt: {
    slug: 'bolt',
    name: 'Bolt.new',
    metaTitle: 'Webstew vs Bolt.new: AI Builder Comparison (2026)',
    metaDescription:
      'Webstew vs Bolt.new — prompt-to-app generation, in-browser dev, instant publishing, native mobile, and who each is for. An honest 2026 comparison for builders.',
    tagline: 'An in-browser AI dev sandbox vs. a ship-it builder',
    intro:
      'Bolt.new lets you prompt a full-stack app into existence in an in-browser dev environment (WebContainers). Webstew shares that instant-generation feel but is built to SHIP: one-click published sites, stores, and native mobile, with a talk-to-build voice. Here is how they line up.',
    rows: [
      { label: 'One prompt → full result', webstew: 'Site, store, or app', them: 'Web app', webstewWins: true },
      { label: 'One-click live published site', webstew: 'Yes', them: 'Deploy from the sandbox', webstewWins: true },
      { label: 'Native mobile output', webstew: 'Yes — Expo', them: 'Web app', webstewWins: true },
      { label: 'Talk-to-build voice', webstew: 'Yes', them: 'Text prompt', webstewWins: true },
      { label: 'In-browser dev sandbox', webstew: 'Yes (WebContainer for apps)', them: 'Yes', },
      { label: 'AI video / media studio', webstew: 'Yes', them: 'No', webstewWins: true },
      { label: 'Raw coding control', webstew: 'Good', them: 'Strong', webstewWins: false },
      { label: 'Free to start', webstew: 'Yes', them: 'Yes (token-limited)' },
    ],
    webstewWins: [
      'Built to publish — a live site in one click, not just a dev sandbox',
      'Marketing sites and stores, not only apps',
      'Native mobile (Expo) + an AI video/media studio',
      'Hands-free building by voice',
    ],
    themWins: [
      'Powerful in-browser full-stack dev loop',
      'Fine-grained control for developers who want to code alongside AI',
      'Fast iteration on complex app logic',
    ],
    faqs: [
      { q: 'Is Webstew a Bolt.new alternative?', a: 'Yes, if your goal is to ship. Bolt is a strong in-browser dev sandbox; Webstew focuses on publishing a real live site or store instantly and can also output apps and native mobile.' },
      { q: 'Do I need to know how to code?', a: 'No. With Webstew you describe it (or talk to it) and get a live result. Bolt leans more developer-oriented with a code sandbox.' },
      { q: 'Which is better for a business site?', a: 'Webstew — it publishes a real marketing site or store in one click with built-in SEO. Bolt is aimed more at web apps.' },
    ],
  },

  v0: {
    slug: 'v0',
    name: 'v0',
    metaTitle: 'Webstew vs v0 (Vercel): AI Builder Comparison (2026)',
    metaDescription:
      'Webstew vs v0 by Vercel — compare UI generation vs. full site/app building, instant publishing, native mobile, voice, and pricing. An honest 2026 comparison.',
    tagline: 'A UI/component generator vs. a full ship-it builder',
    intro:
      'v0 by Vercel is excellent at generating React/Tailwind UI and components from a prompt. Webstew overlaps on generation but goes end-to-end: a complete, published site or store (or an app + native mobile), not just UI you then wire up yourself. Here is a fair comparison.',
    rows: [
      { label: 'One prompt → full result', webstew: 'Whole site, store, or app', them: 'UI / components', webstewWins: true },
      { label: 'One-click live published site', webstew: 'Yes', them: 'Copy code, then deploy', webstewWins: true },
      { label: 'Native mobile output', webstew: 'Yes — Expo', them: 'No', webstewWins: true },
      { label: 'Talk-to-build voice', webstew: 'Yes', them: 'No', webstewWins: true },
      { label: 'Real code you own', webstew: 'Yes', them: 'Yes (React/Tailwind)', },
      { label: 'AI video / media studio', webstew: 'Yes', them: 'No', webstewWins: true },
      { label: 'Component/UI polish', webstew: 'Good', them: 'Excellent', webstewWins: false },
      { label: 'Free to start', webstew: 'Yes', them: 'Yes (credit-limited)' },
    ],
    webstewWins: [
      'Generates and PUBLISHES a whole site/store, not just UI to assemble',
      'Native mobile (Expo) + AI video/media studio',
      'Build hands-free by talking to it',
      'One click to a live URL — no separate deploy',
    ],
    themWins: [
      'Best-in-class React/Tailwind UI + component generation',
      'Tight fit with the Vercel/Next.js ecosystem',
      'Great for designers/devs iterating on polished UI pieces',
    ],
    faqs: [
      { q: 'Is Webstew a v0 alternative?', a: 'Yes, if you want a finished, published site or app rather than UI code to wire up. v0 is superb for generating components; Webstew builds and ships the whole thing.' },
      { q: 'Does Webstew give me real React code?', a: 'Yes — it can output React, Next.js, and Astro you own, and also publishes a live site in one click. It adds native mobile and a media studio on top.' },
      { q: 'Which should I use?', a: 'Use v0 to generate beautiful UI pieces inside a Next.js project. Use Webstew to describe (or speak) a whole site/app and get a live, shippable result.' },
    ],
  },
}

export const COMPETITOR_SLUGS = Object.keys(COMPETITORS)

export function getCompetitor(slug: string): Competitor | null {
  return COMPETITORS[slug] ?? null
}
