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
          background: 'linear-gradient(135deg, #12121a 0%, #0a0a10 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
        }}
      >
        <svg width="150" height="150" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.9">
            <path d="M11.4 15.6 q-1.75 -2.25 0 -4.5 q1.75 -2.25 0 -4.5" />
            <path d="M16 15.6 q-1.75 -2.25 0 -4.5 q1.75 -2.25 0 -4.5" />
            <path d="M20.6 15.6 q-1.75 -2.25 0 -4.5 q1.75 -2.25 0 -4.5" />
          </g>
          <path d="M4.9 18.5 Q4.9 28.75 16 28.75 Q27.1 28.75 27.1 18.5 Z" fill="#ffffff" />
          <ellipse cx="16" cy="18.5" rx="11.1" ry="2.25" fill="#ffffff" />
          <path
            d="M9 21 Q16 25.1 23 21"
            stroke="#eec6dd"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
