// Dynamic 180×180 PNG for iOS "Add to Home Screen" + Android maskable icon.
// Next.js renders this at build time and serves it at /apple-icon.png.

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9">
            <path d="M11 9 q-1.6 -2 0 -3.5 q1.6 -1.5 0 -3.2" />
            <path d="M16 9 q-1.6 -2 0 -3.5 q1.6 -1.5 0 -3.2" />
            <path d="M21 9 q-1.6 -2 0 -3.5 q1.6 -1.5 0 -3.2" />
          </g>
          <ellipse cx="16" cy="13.5" rx="9.5" ry="1.6" fill="#ffffff" />
          <path d="M7 13.5 Q7.5 25 16 25 Q24.5 25 25 13.5 Z" fill="#ffffff" />
          <path
            d="M9.5 15.5 Q10 21.5 16 21.5 Q22 21.5 22.5 15.5"
            stroke="#c026d3"
            strokeWidth="0.5"
            fill="none"
            opacity="0.35"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
