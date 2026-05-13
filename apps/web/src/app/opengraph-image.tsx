// Dynamic 1200×630 OG image for social share previews (Slack, Twitter,
// iMessage, LinkedIn). Next.js serves it at /opengraph-image and the
// metadata API auto-wires it. Same for twitter-image (re-exports below).

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Webstew — AI website & app builder'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4a044e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Stew bowl mark */}
        <div
          style={{
            width: 200,
            height: 200,
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            borderRadius: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 36,
            boxShadow: '0 24px 60px rgba(168, 85, 247, 0.5)',
          }}
        >
          <svg width="140" height="140" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9">
              <path d="M11 9 q-1.6 -2 0 -3.5 q1.6 -1.5 0 -3.2" />
              <path d="M16 9 q-1.6 -2 0 -3.5 q1.6 -1.5 0 -3.2" />
              <path d="M21 9 q-1.6 -2 0 -3.5 q1.6 -1.5 0 -3.2" />
            </g>
            <ellipse cx="16" cy="13.5" rx="9.5" ry="1.6" fill="#ffffff" />
            <path d="M7 13.5 Q7.5 25 16 25 Q24.5 25 25 13.5 Z" fill="#ffffff" />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#ffffff',
            lineHeight: 1,
            marginBottom: 18,
          }}
        >
          Webstew
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Describe it, ship it. AI-built websites & apps.
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #f59e0b 100%)',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
