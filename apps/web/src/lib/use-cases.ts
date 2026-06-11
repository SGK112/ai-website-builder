// Use-case landing pages for /for/[slug] — niche "AI website builder for X"
// pages that target high-intent audience searches. Each is tailored to a real
// audience's pains and the pages they actually need, not generic filler.
//
// Imported by the page (render + static params) and the sitemap (auto-discovery
// when a new use case is added here).

export type UseCase = {
  slug: string
  audience: string
  metaTitle: string
  metaDescription: string
  h1: string
  intro: string
  pains: string[]
  features: { title: string; body: string }[]
  includes: string[]
  faqs: { q: string; a: string }[]
}

export const USE_CASES: Record<string, UseCase> = {
  restaurants: {
    slug: 'restaurants',
    audience: 'Restaurants',
    metaTitle: 'AI Website Builder for Restaurants',
    metaDescription:
      'Build a restaurant website with AI in minutes — menu, hours, reservations, and online ordering links. Get a fast, mobile-ready site. Free to start.',
    h1: 'AI Website Builder for Restaurants',
    intro:
      'Your customers check your website before they decide where to eat. Webstew turns a single description of your restaurant into a fast, mobile-ready site — menu, hours, location, and reservation links included — and deploys it for you. No designer, no monthly agency bill.',
    pains: [
      'A menu trapped in a PDF that no one can read on a phone',
      'Hours and holiday closures that are always out of date',
      'Paying a developer every time you add a dish or a photo',
      'A slow site that loses hungry customers before it loads',
    ],
    features: [
      { title: 'Menu that updates in seconds', body: 'Describe a change — “add a new pasta special at $18” — and Webstew updates the page. No PDF, no developer.' },
      { title: 'Reservations & ordering links', body: 'Wire in OpenTable, Resy, or your online-ordering provider so guests can book or order in one tap.' },
      { title: 'Mobile-first & fast', body: 'Most diners arrive on a phone. Your site loads quickly and reads cleanly on every screen.' },
      { title: 'Found on Google', body: 'Built-in SEO and local-business structured data help you show up when people search nearby.' },
    ],
    includes: ['Hero with your vibe & photos', 'Full menu page', 'Hours & location with map', 'Reservation / order buttons', 'About & story', 'Contact + click-to-call'],
    faqs: [
      { q: 'Can I update my menu myself?', a: 'Yes. Describe the change in plain language and Webstew updates your menu page — no code, no waiting on a developer.' },
      { q: 'Can customers make reservations?', a: 'Yes. You can link your reservation system (OpenTable, Resy, and others) and online-ordering provider directly from your site.' },
      { q: 'Will my restaurant show up on Google?', a: 'Webstew adds SEO basics and local-business structured data so search engines understand your hours, location, and cuisine.' },
    ],
  },

  photographers: {
    slug: 'photographers',
    audience: 'Photographers',
    metaTitle: 'AI Website Builder for Photographers',
    metaDescription:
      'Build a photography portfolio site with AI — fast galleries, services, and booking that load quick without crushing your images. Free to start.',
    h1: 'AI Website Builder for Photographers',
    intro:
      'Your work should sell itself — not get buried in a slow, clunky template. Webstew builds a clean portfolio site from a description of your style, with fast galleries, a services page, and a booking link, then deploys it. You shoot; it handles the website.',
    pains: [
      'Heavy galleries that take forever to load',
      'Template sites that all look the same',
      'No easy way for clients to inquire or book',
      'Paying monthly for a portfolio you barely control',
    ],
    features: [
      { title: 'Fast, image-first galleries', body: 'Your photos are the point. Webstew optimizes delivery so galleries stay sharp and load quickly.' },
      { title: 'A look that matches your style', body: 'Describe your aesthetic — moody, bright, editorial — and get a design that fits, not a stock template.' },
      { title: 'Inquiry & booking built in', body: 'A contact and booking flow so clients can reach you or reserve a session without friction.' },
      { title: 'You own it', body: 'Export the code and host it anywhere. Your portfolio isn’t locked to one platform.' },
    ],
    includes: ['Portfolio galleries by category', 'About / artist statement', 'Services & packages', 'Inquiry / booking form', 'Client testimonials', 'Instagram & social links'],
    faqs: [
      { q: 'Will my galleries load fast?', a: 'Yes. Webstew optimizes image delivery (modern formats and right-sizing) so your galleries stay high-quality without slowing the page.' },
      { q: 'Can clients book a session?', a: 'You can add an inquiry or booking flow and link your scheduling tool so clients can reach out or reserve directly.' },
      { q: 'Can I move my site later?', a: 'Yes — Webstew generates real code you own and can deploy to your own host. No lock-in.' },
    ],
  },

  'small-business': {
    slug: 'small-business',
    audience: 'Small Business',
    metaTitle: 'AI Website Builder for Small Business',
    metaDescription:
      'Build a small business website with AI in minutes — services, contact, and Google-ready SEO, no agency bill. Fast and ownable. Free to start.',
    h1: 'AI Website Builder for Small Business',
    intro:
      'You don’t have time to learn web design or budget for an agency. Webstew turns a description of your business into a professional, mobile-ready site — services, contact, and SEO included — and deploys it. Start free and only pay when you’re ready to grow.',
    pains: [
      'No time to learn a complicated website builder',
      'Agency quotes that don’t fit a small budget',
      'A site that doesn’t show up on Google',
      'Being locked into a platform you can’t leave',
    ],
    features: [
      { title: 'From description to live site', body: 'Tell Webstew what your business does and get a complete, professional site — no design skills needed.' },
      { title: 'Google-ready out of the box', body: 'SEO basics, structured data, sitemap, and mobile-friendliness so local customers can find you.' },
      { title: 'Easy to update', body: 'Change services, hours, or copy by describing what you want — not by wrestling with an editor.' },
      { title: 'Yours to keep', body: 'Real code you own and can host anywhere. No vendor lock-in, no surprise migrations.' },
    ],
    includes: ['Homepage with clear offer', 'Services / what you do', 'About & trust signals', 'Contact + click-to-call', 'Reviews / testimonials', 'Location & hours'],
    faqs: [
      { q: 'Do I need any technical skills?', a: 'No. You describe your business in plain language and Webstew builds and deploys the site. You can refine it the same way.' },
      { q: 'Will my business rank on Google?', a: 'Webstew includes SEO fundamentals — meta tags, structured data, a sitemap, and mobile-friendly layout — to give you a strong start.' },
      { q: 'How much does it cost?', a: 'It’s free to start with no credit card. Paid plans begin at $19/month when you’re ready for a custom domain and more.' },
    ],
  },
}

export const USE_CASE_SLUGS = Object.keys(USE_CASES)

export function getUseCase(slug: string): UseCase | null {
  return USE_CASES[slug] ?? null
}
