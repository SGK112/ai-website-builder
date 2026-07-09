import React from 'react'

// Real brand marks for connectors. Replaces the generic Lucide line-icons
// (a CreditCard standing in for Stripe, a MessageSquare for messaging) that
// made the integrations grid read as generic colored bubbles. Every mark is
// brand-coloured and inline (no external request — safe on published sites and
// behind our CSP). Unknown brands return null so the caller falls back to the
// category Lucide icon.
//
// Each entry is authored to fill a 24×24 viewBox so it drops into a fixed tile.

const ICONS: Record<string, React.ReactNode> = {
  // ── payments ──
  stripe: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#635BFF"/><path fill="#fff" d="M11.6 9.7c0-.5.4-.7 1-.7.9 0 2 .3 2.9.8V7c-1-.4-1.9-.5-2.9-.5-2.4 0-4 1.2-4 3.3 0 3.2 4.4 2.7 4.4 4.1 0 .5-.5.7-1.1.7-.9 0-2.1-.4-3.1-.9v2.8c1.1.5 2.2.7 3.1.7 2.4 0 4.1-1.2 4.1-3.3 0-3.4-4.4-2.8-4.4-4.2z"/></svg>
  ),
  square: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#1A1A1A"/><rect x="6" y="6" width="12" height="12" rx="2.5" fill="none" stroke="#fff" stroke-width="2"/><rect x="10" y="10" width="4" height="4" rx="1" fill="#fff"/></svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#fff" stroke="#E6E1DA"/><path fill="#003087" d="M9.6 18l.5-3.1h1.9c2.6 0 4.4-1.3 4.8-3.8.3-1.9-.6-3-2.3-3H10L8 18z"/><path fill="#009CDE" d="M11.4 18l.4-2.6h1.6c2.4 0 4-1.2 4.4-3.5.1-.5.1-1 0-1.4-.5 1.7-2 2.6-4.2 2.6h-1.9l-.8 4.9z"/></svg>
  ),

  // ── ai ──
  openai: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#000"/><path fill="#fff" d="M17.4 10.5a3.2 3.2 0 00-.3-2.7 3.3 3.3 0 00-3.5-1.6 3.2 3.2 0 00-2.4-1.1 3.3 3.3 0 00-3.1 2.3 3.2 3.2 0 00-2.2 1.6 3.3 3.3 0 00.4 3.9 3.2 3.2 0 00.3 2.7 3.3 3.3 0 003.5 1.6 3.2 3.2 0 002.4 1.1 3.3 3.3 0 003.1-2.3 3.2 3.2 0 002.2-1.6 3.3 3.3 0 00-.4-3.9zm-4.9 6.8a2.4 2.4 0 01-1.6-.6l2.9-1.7a.5.5 0 00.2-.4v-4l1.2.7v3.4a2.5 2.5 0 01-2.7 2.6zM7.8 15a2.4 2.4 0 01-.3-1.7l2.9 1.7a.5.5 0 00.5 0l3.5-2v1.4l-3 1.7a2.5 2.5 0 01-3.6-.9zm-.8-6.1a2.4 2.4 0 011.3-1.1v3.5a.5.5 0 00.2.4l3.5 2-1.2.7-3-1.7a2.5 2.5 0 01-1-3.8zm10 2.3l-3.5-2 1.2-.7 3 1.7a2.5 2.5 0 01-.4 4.5v-3.5a.5.5 0 00-.3-.4zM17.4 9.6l-2.9-1.7a.5.5 0 00-.5 0l-3.5 2V8.5l3-1.7a2.5 2.5 0 013.7 2.6zm-7.6 2.7l-1.2-.7V8.2a2.5 2.5 0 014.1-1.9l-2.9 1.7a.5.5 0 00-.2.4zm.7-1.4l1.6-.9 1.6.9v1.8l-1.6.9-1.6-.9z"/></svg>
  ),

  // ── database / backend ──
  supabase: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="#3ECF8E" d="M12.7 21.4c-.5.7-1.6.3-1.6-.5l-.2-8H16.9c1 0 1.5 1.1.9 1.8z"/><path fill="#3ECF8E" fill-opacity=".7" d="M11.3 2.6c.5-.7 1.6-.3 1.6.5l.1 8H7.1c-1 0-1.5-1.1-.9-1.8z"/></svg>
  ),
  firebase: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="#FFA000" d="M5 17.3L7.6 4.9c.1-.5.8-.6 1.1-.2l2.1 3.9z"/><path fill="#F57C00" d="M5 17.3l7.4-13c.2-.4.9-.4 1.1.1l1.5 2.8L19 17.3z"/><path fill="#FFCA28" d="M5 17.3l7 3.9 7-3.9-2-8.4c-.1-.5-.7-.6-1-.2z"/></svg>
  ),
  mongodb: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="#00ED64" d="M12 2c1.6 3 4.4 4.3 4.4 8.4 0 4.1-2.6 6-3.9 6.6l-.3-.2c-.2-2 .1-8.4-.2-14.8z"/><path fill="#00684A" d="M12 2c-.3 6.4 0 12.8-.2 14.8l-.3.2c-1.3-.6-3.9-2.5-3.9-6.6C7.6 6.3 10.4 5 12 2zm-.1 16.5l.4.3.1 2.6-.3.6-.3-.6.1-2.9z"/></svg>
  ),
  redis: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#FF4438"/><path fill="#fff" d="M6 9.2l6-2 6 2-6 2.1zm0 3l6-2 6 2-6 2.1zm0 3l6-2 6 2-6 2.1z"/></svg>
  ),
  upstash: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#00E9A3"/><path fill="none" stroke="#111" stroke-width="1.7" d="M8 15.5a5 5 0 000-7M16 8.5a5 5 0 000 7M10.5 13a2 2 0 000-2M13.5 11a2 2 0 000 2"/></svg>
  ),
  aws: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#232F3E"/><path fill="#FF9900" d="M7 14.6c2.9 1.9 7.3 1.9 10.2-.1l.3.5c-3.2 2.3-8 2.2-11-.1z"/><path fill="#FF9900" d="M17.6 13.4c.5-.4 1.3-.3 1.4-.1.1.2-.2.9-.7 1.3z"/><path fill="#fff" d="M8.6 10.9c0 .3 0 .5.1.7l.1.3-.5.3-.2-.3a2 2 0 01-1.2.5c-.6 0-1-.4-1-1s.4-1 1.3-1l.7-.1v-.2c0-.4-.2-.6-.7-.6-.4 0-.8.1-1.1.3l-.2-.5c.4-.2.9-.3 1.4-.3.9 0 1.3.4 1.3 1.2zm-1.1.3l-.5.1c-.4 0-.6.2-.6.5s.2.4.5.4c.3 0 .5-.1.6-.3z"/></svg>
  ),

  // ── communication / email ──
  twilio: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#F22F46"/><circle cx="9.3" cy="9.3" r="1.9" fill="#fff"/><circle cx="14.7" cy="9.3" r="1.9" fill="#fff"/><circle cx="9.3" cy="14.7" r="1.9" fill="#fff"/><circle cx="14.7" cy="14.7" r="1.9" fill="#fff"/></svg>
  ),
  sendgrid: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#fff" stroke="#E6E1DA"/><rect x="6" y="6" width="4" height="4" fill="#99E1F4"/><rect x="10" y="6" width="4" height="4" fill="#1A82E2"/><rect x="6" y="10" width="4" height="4" fill="#1A82E2"/><rect x="10" y="10" width="4" height="4" fill="#00B3E3"/><rect x="14" y="10" width="4" height="4" fill="#99E1F4"/><rect x="10" y="14" width="4" height="4" fill="#99E1F4"/></svg>
  ),
  mailchimp: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#FFE01B"/><ellipse cx="9.4" cy="11" rx="1.5" ry="2" fill="#241C15"/><ellipse cx="14.6" cy="11" rx="1.5" ry="2" fill="#241C15"/><path d="M9 15.5c1.8 1.2 4.2 1.2 6 0" fill="none" stroke="#241C15" stroke-width="1.3" stroke-linecap="round"/></svg>
  ),
  resend: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#000"/><path fill="#fff" d="M8 17V7h4.2c2 0 3.3 1.1 3.3 2.9 0 1.3-.7 2.2-1.8 2.6L16 17h-2.5l-1.8-3.9H10V17zm2-5.7h1.9c.9 0 1.4-.4 1.4-1.2s-.5-1.2-1.4-1.2H10z"/></svg>
  ),
  zapier: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#FF4F00"/><g stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M12 6.5v11M6.5 12h11M8.1 8.1l7.8 7.8M15.9 8.1l-7.8 7.8"/></g></svg>
  ),

  // ── ecommerce ──
  shopify: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="#95BF47" d="M15.3 5.4c-.1 0-1.8.4-1.8.4l-.8-.8c-.3-.3-.9-.2-1.1-.1L11 5c-.5-1.3-1.2-1.6-2-1.6-1.6.1-2.8 2.2-3.2 4.1L4 8.3c-.5.2-.6.3-.6.8l-1 8.6 9.2 1.7z"/><path fill="#5E8E3E" d="M15.3 5.4c-.1 0-.2 0-.3.1v13.9l.6-.1 1.9-.5-1.9-13.3z"/><path fill="#fff" d="M11.6 9.1l-.5 1.6s-.5-.2-1-.2c-.8 0-.9.5-.9.6 0 .7 2 1 2 2.8 0 1.4-.9 2.3-2.1 2.3-1.5 0-2.2-.9-2.2-.9l.4-1.3s.8.6 1.4.6c.4 0 .6-.3.6-.5 0-.9-1.7-1-1.7-2.6 0-1.4 1-2.7 3-2.7.7 0 1.5.3 1.5.3z"/></svg>
  ),

  // ── analytics ──
  plausible: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#5850EC"/><g stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M8 16V12M12 16V8M16 16v-2"/></g></svg>
  ),
  posthog: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#1D1F27"/><g stroke="#F9BD2B" stroke-width="2" stroke-linecap="round"><path d="M8 16V11M12 16V8M16 16v-3"/></g></svg>
  ),

  // ── scheduling ──
  calendly: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#006BFF"/><path fill="none" stroke="#fff" stroke-width="1.8" d="M15.5 9.5a4.5 4.5 0 100 5"/></svg>
  ),

  // ── auth ──
  auth0: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#EB5424"/><path fill="#fff" d="M12 4.6l5.3 1.9v3.9c0 3.3-2.2 6-5.3 6.9-3.1-.9-5.3-3.6-5.3-6.9V6.5z"/><path fill="#EB5424" d="M9.6 12.1l2.4-4.4 2.4 4.4-2.4 1.8z"/></svg>
  ),
  clerk: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#6C47FF"/><circle cx="12" cy="10.5" r="2.2" fill="#fff"/><path d="M8.4 16.2a4.5 4.5 0 017.2 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
  ),

  // ── media ──
  cloudinary: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#3448C5"/><path fill="#fff" d="M15.8 11.2a3 3 0 00-5.7-.9 2.4 2.4 0 00.3 4.7h5a2 2 0 00.4-3.8zm-4.5 1.9l1.4-1.4 1.4 1.4h-.9v1.4h-1v-1.4z"/></svg>
  ),

  // ── maps / google suite ──
  googlemaps: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="#EA4335" d="M12 2.5c-3.4 0-6.2 2.7-6.2 6.1 0 4.5 6.2 12.4 6.2 12.4s6.2-7.9 6.2-12.4c0-3.4-2.8-6.1-6.2-6.1z"/><circle cx="12" cy="8.6" r="2.3" fill="#fff"/></svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="#4285F4" d="M20 12.2c0-.6 0-1.1-.2-1.7H12v3.3h4.5a3.9 3.9 0 01-1.7 2.5v2.1h2.7c1.6-1.5 2.5-3.6 2.5-6.2z"/><path fill="#34A853" d="M12 20.5c2.3 0 4.2-.8 5.6-2.1l-2.7-2.1c-.8.5-1.7.8-2.9.8-2.2 0-4.1-1.5-4.8-3.5H4.4v2.2A8.5 8.5 0 0012 20.5z"/><path fill="#FBBC05" d="M7.2 13.5a5 5 0 010-3.2V8.1H4.4a8.5 8.5 0 000 7.6z"/><path fill="#EA4335" d="M12 6.8c1.3 0 2.4.4 3.3 1.3l2.4-2.4A8.5 8.5 0 004.4 8.1l2.8 2.2C7.9 8.3 9.8 6.8 12 6.8z"/></svg>
  ),
  googleanalytics: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="15" y="4" width="4.5" height="16" rx="2.2" fill="#F9AB00"/><rect x="9.5" y="9" width="4.5" height="11" rx="2.2" fill="#E37400"/><circle cx="6.2" cy="17.3" r="2.6" fill="#E37400"/></svg>
  ),

  // ── productivity / comms (Composio connector toolkits) ──
  gmail: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="2" fill="#fff" stroke="#DADCE0"/><path d="M5 16.5V8.5l7 5 7-5v8" fill="none" stroke="#EA4335" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  ),
  slack: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="7.2" y="2.5" width="3" height="19" rx="1.5" fill="#36C5F0"/><rect x="13.8" y="2.5" width="3" height="19" rx="1.5" fill="#2EB67D"/><rect x="2.5" y="7.2" width="19" height="3" rx="1.5" fill="#ECB22E"/><rect x="2.5" y="13.8" width="19" height="3" rx="1.5" fill="#E01E5A"/></svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="#181717" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#0A66C2"/><path fill="#fff" d="M8.3 18.5H5.7V9.8h2.6zM7 8.6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11.5 9.9h-2.6v-4.5c0-1.1-.4-1.8-1.4-1.8-.75 0-1.15.5-1.35 1-.07.18-.09.43-.09.68v4.6h-2.6s.03-7.9 0-8.7h2.6v1.2c.35-.53.96-1.3 2.35-1.3 1.7 0 3 1.1 3 3.5z"/></svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#1877F2"/><path fill="#fff" d="M15.5 12.5l.4-2.7h-2.6V8c0-.74.36-1.47 1.53-1.47h1.17V4.23s-1.06-.18-2.08-.18c-2.12 0-3.5 1.28-3.5 3.6v2.15H8v2.7h2.4v6.5h2.9v-6.5z"/></svg>
  ),
  hubspot: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#FF7A59"/><circle cx="17" cy="7.5" r="1.8" fill="#fff"/><circle cx="11" cy="14.5" r="3.3" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M11 11.2V8.6M13.7 12.6l2-3.5" stroke="#fff" stroke-width="1.6" fill="none"/></svg>
  ),
  salesforce: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#00A1E0"/><path fill="#fff" d="M15.6 10.2a2.9 2.9 0 00-5.5-1.1A2.4 2.4 0 006 11.4 2.2 2.2 0 007 15.6h8.1a2.5 2.5 0 00.5-5z"/></svg>
  ),
  jira: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#2684FF"/><path fill="#fff" d="M12 4.5l4.8 4.8a1 1 0 010 1.4L12 15.5l-2.4-2.4 2.5-2.5-2.5-2.5z"/><path fill="#fff" opacity=".7" d="M12 8.5l-2.4 2.4L7.2 8.5a1 1 0 010-1.4L9.6 4.7z"/></svg>
  ),
  monday: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#fff" stroke="#E6E1DA"/><rect x="4.5" y="8" width="4" height="8" rx="2" fill="#F65F7C"/><rect x="10" y="8" width="4" height="8" rx="2" fill="#FDAB3D"/><rect x="15.5" y="8" width="4" height="8" rx="2" fill="#00CA72"/></svg>
  ),
  zendesk: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#03363D"/><path fill="#fff" d="M7 8h10l-5 8z"/></svg>
  ),
  intercom: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#1F8DED"/><rect x="6" y="6" width="12" height="12" rx="3" fill="#fff"/><g stroke="#1F8DED" stroke-width="1.5" stroke-linecap="round"><path d="M9 9.5v3M12 9v4.5M15 9.5v3"/></g></svg>
  ),
  teams: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#5059C9"/><circle cx="16.5" cy="8" r="2.1" fill="#fff" opacity=".85"/><path fill="#fff" d="M7 8.5h7v1.7h-2.6V16h-1.8v-5.8H7z"/></svg>
  ),
  quickbooks: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#2CA01C"/><path fill="none" stroke="#fff" stroke-width="1.9" d="M13.2 7.2a5 5 0 00-1.2 9.6"/><path fill="none" stroke="#fff" stroke-width="1.9" d="M10.8 16.8a5 5 0 001.2-9.6"/><path stroke="#fff" stroke-width="1.9" d="M12 7v6.5M12 16.5v-2"/></svg>
  ),
}

// Normalise a catalog name ("Stripe Payments", "OpenAI / ChatGPT",
// "Redis / Upstash") to a brand slug in ICONS.
function slugFor(name: string): string {
  const n = (name || '').toLowerCase()
  if (n.includes('stripe')) return 'stripe'
  if (n.includes('square')) return 'square'
  if (n.includes('paypal')) return 'paypal'
  if (n.includes('openai') || n.includes('chatgpt')) return 'openai'
  if (n.includes('supabase')) return 'supabase'
  if (n.includes('firebase')) return 'firebase'
  if (n.includes('mongo')) return 'mongodb'
  if (n.includes('upstash')) return 'upstash'
  if (n.includes('redis')) return 'redis'
  if (n.includes('aws') || n.includes('s3')) return 'aws'
  if (n.includes('twilio')) return 'twilio'
  if (n.includes('sendgrid')) return 'sendgrid'
  if (n.includes('mailchimp')) return 'mailchimp'
  if (n.includes('resend')) return 'resend'
  if (n.includes('zapier')) return 'zapier'
  if (n.includes('shopify')) return 'shopify'
  if (n.includes('plausible')) return 'plausible'
  if (n.includes('posthog')) return 'posthog'
  if (n.includes('calendly')) return 'calendly'
  if (n.includes('auth0')) return 'auth0'
  if (n.includes('clerk')) return 'clerk'
  if (n.includes('cloudinary')) return 'cloudinary'
  if (n.includes('gmail')) return 'gmail'
  if (n.includes('slack')) return 'slack'
  if (n.includes('github')) return 'github'
  if (n.includes('linkedin')) return 'linkedin'
  if (n.includes('facebook')) return 'facebook'
  if (n.includes('hubspot')) return 'hubspot'
  if (n.includes('salesforce')) return 'salesforce'
  if (n.includes('jira')) return 'jira'
  if (n.includes('monday')) return 'monday'
  if (n.includes('zendesk')) return 'zendesk'
  if (n.includes('intercom')) return 'intercom'
  if (n.includes('teams')) return 'teams'
  if (n.includes('quickbook')) return 'quickbooks'
  if (n.includes('google maps')) return 'googlemaps'
  if (n.includes('google analytics')) return 'googleanalytics'
  if (n.includes('google')) return 'google'
  return ''
}

export function hasBrandIcon(name: string): boolean {
  return !!ICONS[slugFor(name)]
}

// A brand mark sized to fill its container. Returns null for unknown brands so
// callers can fall back to a category Lucide icon.
export function BrandIcon({ name, className }: { name: string; className?: string }) {
  const icon = ICONS[slugFor(name)]
  if (!icon) return null
  return (
    <span className={className} style={{ display: 'inline-flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </span>
  )
}
