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
}

export const COMPETITOR_SLUGS = Object.keys(COMPETITORS)

export function getCompetitor(slug: string): Competitor | null {
  return COMPETITORS[slug] ?? null
}
