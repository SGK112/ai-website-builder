'use client'

// A community card preview. When the listing carries its real HTML, render a
// sandboxed, non-interactive, scaled-down LIVE preview of the actual site —
// so the showcase shows finished sites, not stock-photo placeholders. Falls
// back to the thumbnail image (or a neutral gradient) when there's no HTML.
//
// Security: sandbox="allow-scripts" WITHOUT allow-same-origin runs the page's
// CSS/Tailwind-CDN in a null origin that can't touch the parent — safe for
// untrusted user HTML. pointer-events:none keeps it a thumbnail, not a frame
// the user can click into.

import { useState } from 'react'

export function SitePreview({
  html, thumbnail, title,
}: {
  html?: string | null
  thumbnail?: string | null
  title?: string
}) {
  const [imgOk, setImgOk] = useState(true)

  if (html && html.trim().length > 0) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-white">
        {/* Render at 1280px wide then scale to fit, so the preview looks like
            a real desktop site rather than a cramped mobile reflow. */}
        <iframe
          srcDoc={html}
          title={title || 'Site preview'}
          loading="lazy"
          sandbox="allow-scripts"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none origin-top-left"
          style={{ width: '1280px', height: '800px', transform: 'scale(0.3125)', border: '0' }}
        />
      </div>
    )
  }

  if (thumbnail && imgOk) {
    return (
      <img
        src={thumbnail}
        alt={title || 'Preview'}
        onError={() => setImgOk(false)}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
    )
  }

  // No HTML, no usable image — a neutral branded placeholder instead of a
  // broken-image icon.
  return (
    <div className="w-full h-full bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-transparent flex items-center justify-center">
      <span className="text-3xl opacity-40">🍲</span>
    </div>
  )
}
