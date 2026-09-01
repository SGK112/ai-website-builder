'use client'

// TemplatePreview — a miniature of what a template actually looks like,
// drawn from that template's own design tokens.
//
// The landing gallery used to show an unrelated Unsplash photo per card: a
// stock portrait of a woman for "Personal portfolio", a gym shot for a fitness
// app. Photos of a SUBJECT, never of the template — so eight cards of borrowed
// photography that told you nothing about what you'd get, and had no visual
// relationship to each other.
//
// Every template in the gallery already carries primary/secondary/accent
// colours, a heading + body font, and its section list. That's enough to draw
// the real thing in miniature: browser chrome, a hero in the template's own
// palette and typeface, and a body whose blocks follow its actual sections. No
// network, no images, and each of the twelve looks genuinely different because
// its tokens are different.

import { cn } from '@/lib/utils'

export interface TemplateTokens {
  colors: { primary: string; secondary: string; accent: string }
  fonts: { heading: string; body: string }
  sections: string[]
}

// Section name → the shape it takes in the miniature. Keeps the preview honest:
// a template listing "Pricing" shows a three-column band, one listing "Gallery"
// shows a photo grid.
function bandFor(section: string): 'grid' | 'split' | 'rows' | 'cards' | 'band' {
  const s = section.toLowerCase()
  if (/gallery|portfolio|product|menu|featured|new arrivals|categories/.test(s)) return 'grid'
  if (/about|story|feature|how it works|team|attorneys|experience/.test(s)) return 'split'
  if (/pricing|plans|tiers|services|treatments/.test(s)) return 'cards'
  if (/faq|reviews|testimonial|logo|clients/.test(s)) return 'rows'
  return 'band'
}

export function TemplatePreview({
  tokens, isDark, className,
}: { tokens: TemplateTokens; isDark: boolean; className?: string }) {
  const { colors, fonts, sections } = tokens
  const paper = isDark ? '#0f1115' : '#ffffff'
  const ink = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.13)'
  const inkSoft = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.07)'
  // Hero + the first two content sections is all that fits legibly at this size.
  const body = sections.slice(1, 3).map(bandFor)

  return (
    <div
      className={cn('w-full h-full flex flex-col overflow-hidden', className)}
      style={{ background: paper }}
      aria-hidden="true"
    >
      {/* Browser chrome — signals "this is a website", which a bare photo never did */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 shrink-0"
        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff5f57' }} />
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#febc2e' }} />
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#28c840' }} />
        <span className="ml-1.5 h-2 flex-1 rounded-sm" style={{ background: inkSoft }} />
      </div>

      {/* Hero — the template's palette and heading face doing the work */}
      <div
        className="relative px-3 pt-3 pb-3.5 shrink-0"
        style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
      >
        <div
          className="h-2 rounded-sm mb-1.5"
          style={{ width: '62%', background: 'rgba(255,255,255,0.92)' }}
        />
        <div className="h-1.5 rounded-sm mb-0.5" style={{ width: '82%', background: 'rgba(255,255,255,0.45)' }} />
        <div className="h-1.5 rounded-sm mb-2.5" style={{ width: '48%', background: 'rgba(255,255,255,0.45)' }} />
        <div className="flex gap-1.5">
          <div className="h-3 w-10 rounded" style={{ background: colors.accent }} />
          <div className="h-3 w-8 rounded" style={{ background: 'rgba(255,255,255,0.28)' }} />
        </div>
        {/* The heading typeface, shown rather than described */}
        <span
          className="absolute top-2 right-2.5 text-[7px] font-semibold tracking-wide"
          style={{ color: 'rgba(255,255,255,0.75)', fontFamily: `'${fonts.heading}', sans-serif` }}
        >
          Aa
        </span>
      </div>

      {/* Content bands — shaped by the sections this template actually has */}
      <div className="flex-1 px-3 py-2.5 flex flex-col gap-2 min-h-0">
        {body.map((kind, i) => (
          <div key={i} className="flex-1 min-h-0">
            {kind === 'grid' && (
              <div className="grid grid-cols-3 gap-1 h-full">
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <div key={n} className="rounded-sm" style={{ background: n % 4 === 0 ? colors.accent : inkSoft }} />
                ))}
              </div>
            )}
            {kind === 'cards' && (
              <div className="grid grid-cols-3 gap-1 h-full">
                {[0, 1, 2].map(n => (
                  <div
                    key={n}
                    className="rounded-sm border flex flex-col justify-end p-1 gap-0.5"
                    style={{ borderColor: n === 1 ? colors.primary : ink, background: inkSoft }}
                  >
                    <div className="h-1 w-full rounded-sm" style={{ background: n === 1 ? colors.primary : ink }} />
                    <div className="h-1 w-2/3 rounded-sm" style={{ background: ink }} />
                  </div>
                ))}
              </div>
            )}
            {kind === 'split' && (
              <div className="grid grid-cols-2 gap-1.5 h-full">
                <div className="rounded-sm" style={{ background: inkSoft }} />
                <div className="flex flex-col justify-center gap-1">
                  <div className="h-1.5 w-4/5 rounded-sm" style={{ background: colors.primary, opacity: 0.75 }} />
                  <div className="h-1 w-full rounded-sm" style={{ background: ink }} />
                  <div className="h-1 w-5/6 rounded-sm" style={{ background: ink }} />
                  <div className="h-1 w-3/5 rounded-sm" style={{ background: ink }} />
                </div>
              </div>
            )}
            {kind === 'rows' && (
              <div className="flex flex-col gap-1 h-full justify-center">
                {[0, 1, 2].map(n => (
                  <div key={n} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.accent }} />
                    <div className="h-1 rounded-sm" style={{ width: `${72 - n * 14}%`, background: ink }} />
                  </div>
                ))}
              </div>
            )}
            {kind === 'band' && (
              <div className="h-full rounded-sm flex items-center justify-center" style={{ background: inkSoft }}>
                <div className="h-1.5 w-1/3 rounded-sm" style={{ background: ink }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
