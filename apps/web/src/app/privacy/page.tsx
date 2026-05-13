import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy · Webstew',
  description: 'How Webstew collects, uses, and protects your personal information across our web and mobile apps. GDPR + CCPA disclosures, third-party processors, your rights.',
}

const EFFECTIVE_DATE = '2026-05-13'
const ENTITY = 'Remodely LLC'
const CONTACT_EMAIL = 'webstew@remodely.ai'
const PRIVACY_EMAIL = 'privacy@remodely.ai'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-[#09090b] dark:text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white mb-8 inline-block"
        >
          ← Back to Webstew
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-500 mb-10">
          Effective {EFFECTIVE_DATE}
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-base prose-p:leading-relaxed prose-li:text-base prose-a:text-violet-600 dark:prose-a:text-violet-400">

          <p>
            This Privacy Policy explains how {ENTITY} ("<strong>Webstew</strong>," "<strong>we</strong>," "<strong>us</strong>") collects, uses, shares, and protects personal information when you use the Webstew website at webstew.net, the Webstew mobile applications for iOS and Android (when published), and related services (collectively, the "<strong>Service</strong>"). This policy applies to information processed in connection with the Service, including all of our web and mobile surfaces.
          </p>
          <p>
            We are the controller of your personal information for purposes of the EU/UK GDPR and the business under the California Consumer Privacy Act (CCPA/CPRA).
          </p>

          <h2 id="data-collected">1. Information We Collect</h2>

          <h3>1.1 Information you give us</h3>
          <ul>
            <li><strong>Account information</strong>: name, email address, password (hashed with bcrypt — we never store plaintext passwords), and optional profile photo.</li>
            <li><strong>Authentication identifiers</strong>: when you sign in with Google, GitHub, or (in the mobile app) Apple, we receive your name, email, profile photo, and a stable unique identifier from that provider.</li>
            <li><strong>Payment information</strong>: billing name and a Stripe customer identifier. We do <strong>not</strong> store payment card numbers — Stripe processes all card data directly under PCI-DSS compliance.</li>
            <li><strong>Content you create</strong>: prompts you type, websites/apps generated through the Service, HTML / CSS / JS you save or import, images you upload, templates you choose, CMS items, project names, and configuration choices.</li>
            <li><strong>Communications</strong>: support emails, feedback, survey responses.</li>
            <li><strong>Form submissions on sites you build</strong>: if you publish a site through Webstew that uses our hosted form-submission endpoint, the submissions from visitors to your site (typically: name, email, message, plus the submitting visitor's IP and user agent) are stored in our database so you can retrieve them from your account.</li>
            <li><strong>Bring-Your-Own credentials</strong>: API keys for third-party services you connect (Anthropic, OpenAI, Google, Render, GitHub, Stripe Connect, etc.). These are <strong>encrypted at rest</strong> using AES-256-GCM with keys we control and are only decrypted in memory at the moment a call is made on your behalf.</li>
          </ul>

          <h3>1.2 Information collected automatically</h3>
          <ul>
            <li><strong>Usage data</strong>: pages visited, features used, prompts entered, generation counts, deploy events, errors. We use this to operate the Service, track usage limits, and improve the product.</li>
            <li><strong>Device and browser data</strong>: browser type, operating system, screen resolution, time zone, language preference, referring URL, IP address.</li>
            <li><strong>Mobile device data (in our mobile app)</strong>: device model, OS version, app version, language, time zone, anonymous device identifier (IDFV on iOS, Android Advertising ID with your consent), and crash diagnostic data.</li>
            <li><strong>Cookies and similar technologies</strong>: see <a href="#cookies">Section 6</a>.</li>
            <li><strong>Microphone audio (mobile app, voice feature only)</strong>: when you tap the microphone button to use voice-driven building, we capture audio and send it to a speech-to-text provider for transcription and to a large language model for response generation. <strong>Microphone access is request-only — we never listen passively.</strong> Audio is transmitted over TLS and is not stored after the request completes (see retention below).</li>
            <li><strong>Push notification tokens (mobile app)</strong>: if you grant push permission, we store an opaque device token from Apple Push Notification Service (APNs) or Firebase Cloud Messaging (FCM) so we can send service-related notifications (e.g., generation finished, deploy succeeded, form submission received).</li>
            <li><strong>Camera and photo library (mobile app, on request)</strong>: if you choose to upload an image, the mobile app may request access to your camera or photo library. We only access images you explicitly select — we do not scan your photo library otherwise.</li>
          </ul>

          <h3>1.3 Information we do NOT collect</h3>
          <p>
            We do not knowingly collect precise device location, contacts, calendar, health data, financial account credentials, or biometric identifiers. We do not engage in cross-app advertising tracking — see <a href="#att">Apple App Tracking Transparency</a> below.
          </p>

          <h2 id="how-used">2. How We Use Information</h2>
          <p>We use personal information to:</p>
          <ul>
            <li><strong>Provide the Service</strong>: generate websites from your prompts, route content through AI providers, host previews, deliver form submissions, run the grader and other tools, deploy sites to your hosting providers.</li>
            <li><strong>Authenticate and secure</strong>: verify your identity, prevent abuse, detect fraud, enforce rate limits and usage caps, investigate security incidents.</li>
            <li><strong>Bill</strong>: process subscriptions and pay-as-you-go usage via Stripe, send receipts, send dunning emails on payment failure.</li>
            <li><strong>Communicate</strong>: send transactional notifications (account, billing, deploys, form submissions), respond to support requests, and — with your separate opt-in — send product updates and marketing.</li>
            <li><strong>Improve</strong>: aggregate, anonymized analytics to understand which features are used and where users get stuck. We do not use the content of your prompts or generated sites to train our AI models, and we instruct our AI providers not to train on your content (subject to their terms — see <a href="#third-parties">Section 4</a>).</li>
            <li><strong>Comply with law</strong>: respond to lawful requests, enforce our <Link href="/terms">Terms of Service</Link>, defend legal claims, prevent harm.</li>
          </ul>

          <h2 id="legal-basis">3. Legal Bases for Processing (EU/UK GDPR)</h2>
          <p>If you are in the European Economic Area, the United Kingdom, or Switzerland, we rely on the following legal bases:</p>
          <ul>
            <li><strong>Contract</strong>: to provide the Service you signed up for (creating an account, running generations, billing).</li>
            <li><strong>Legitimate interests</strong>: securing the Service, preventing fraud, basic product analytics, customer support.</li>
            <li><strong>Consent</strong>: optional marketing emails, push notifications, microphone access, camera access, non-essential cookies. You can withdraw consent at any time.</li>
            <li><strong>Legal obligation</strong>: tax records, compliance with court orders.</li>
          </ul>

          <h2 id="third-parties">4. Sharing and Third-Party Processors</h2>
          <p>We share personal information only with the categories below and only as needed to operate the Service.</p>

          <h3>4.1 Service providers (processors)</h3>
          <p>We use the following processors to operate Webstew. Each is bound by a Data Processing Agreement when applicable.</p>
          <ul>
            <li><strong>AI generation</strong>: OpenAI (LLC, US), Anthropic (PBC, US), Google LLC (Gemini). Your prompts and generated content are sent to these providers under their API terms. We have configured API requests so providers do not retain your data for training purposes, subject to their published terms.</li>
            <li><strong>Hosting and infrastructure</strong>: Render Services Inc. (US), MongoDB Atlas (MongoDB Inc., US, hosted on AWS), Cloudflare Inc. (US — DNS, CDN, email routing), Amazon Web Services Inc. (US — Simple Email Service for transactional email, S3 storage when used).</li>
            <li><strong>Payments</strong>: Stripe Inc. (US). Stripe is our payment processor and an independent controller of payment data under its own privacy policy.</li>
            <li><strong>Speech and voice (mobile/voice feature)</strong>: OpenAI Whisper (transcription) and TTS providers. Audio is processed and discarded.</li>
            <li><strong>Analytics and error monitoring</strong>: Sentry (Functional Software Inc., US) for error reporting. We aggregate usage metrics internally and may use a privacy-respecting analytics provider; we do not use Google Analytics-style cross-site advertising trackers.</li>
            <li><strong>OAuth identity providers</strong>: Google (when you sign in with Google), GitHub (when you sign in with GitHub), Apple (when you sign in with Apple in the mobile app).</li>
            <li><strong>Push notifications</strong>: Apple Push Notification Service (Apple Inc., US) and/or Firebase Cloud Messaging (Google LLC, US).</li>
            <li><strong>App distribution</strong>: Apple App Store (Apple Inc.) and Google Play (Google LLC) — they receive your purchase information when you buy through their stores; we receive billing reports.</li>
          </ul>

          <h3>4.2 Business transfers</h3>
          <p>
            If Webstew is involved in a merger, acquisition, financing, or sale of assets, personal information may be transferred to the successor entity. We'll notify you (by email or in-product) before your information becomes subject to a different privacy policy.
          </p>

          <h3>4.3 Legal disclosures</h3>
          <p>
            We may disclose personal information in response to a subpoena, court order, or other lawful request, or where we believe disclosure is necessary to (a) comply with law, (b) protect the rights or safety of Webstew, our users, or the public, (c) prevent fraud or abuse, or (d) enforce our Terms.
          </p>

          <h3>4.4 What we don't do</h3>
          <p>
            We do <strong>not sell</strong> your personal information. We do <strong>not share</strong> your personal information for cross-context behavioral advertising (within the meaning of California's CCPA/CPRA). We do not allow third parties to track you across other sites or apps via the Service.
          </p>

          <h2 id="retention">5. Data Retention</h2>
          <ul>
            <li><strong>Account information</strong>: retained for as long as you have an account and for up to 90 days after deletion (to allow restoration if you change your mind). Billing records are retained as required by tax law (typically 7 years).</li>
            <li><strong>Your generated content (projects, prompts, sites)</strong>: retained while your account is active. Deleted projects are removed from production databases within 30 days; backups retain copies for up to 90 days.</li>
            <li><strong>Form submissions on sites you build</strong>: retained for the life of the project unless you delete them. We auto-purge submissions after 18 months of inactivity unless your plan includes longer retention.</li>
            <li><strong>Preview snapshots</strong> (links shared via /preview/[token]): auto-deleted 7 days after creation via a MongoDB TTL index.</li>
            <li><strong>Voice / microphone audio</strong>: processed in-memory and discarded immediately after transcription. We do not persist raw audio.</li>
            <li><strong>Logs and analytics</strong>: aggregated and retained up to 13 months; raw IP logs purged after 90 days.</li>
            <li><strong>BYO API keys</strong>: retained encrypted as long as you keep them connected. Deleted within 30 days of disconnecting.</li>
          </ul>

          <h2 id="cookies">6. Cookies and Local Storage</h2>
          <p>We use the following first-party cookies and browser storage:</p>
          <ul>
            <li><strong>Authentication session</strong> (`next-auth.session-token`, required): keeps you logged in. Essential — cannot be disabled.</li>
            <li><strong>Anti-abuse counters</strong> (`wsanon`, etc.): tracks free-generation usage for anonymous users so we can enforce free-trial limits. Essential.</li>
            <li><strong>Theme preference</strong> (`webcraft-theme` in localStorage): remembers light/dark mode choice. Functional, not personal information.</li>
            <li><strong>Workspace autosave</strong> (`webstew-autosave` in localStorage): your in-progress work, saved locally on your device only. Never transmitted to us.</li>
          </ul>
          <p>
            We do not use third-party advertising cookies. You can clear cookies and local storage in your browser settings at any time; doing so will sign you out and clear local drafts.
          </p>

          <h2 id="rights-gdpr">7. Your Rights (GDPR / UK GDPR)</h2>
          <p>If you are in the EEA, UK, or Switzerland, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal information we hold about you;</li>
            <li><strong>Rectify</strong> inaccurate or incomplete information;</li>
            <li><strong>Erase</strong> your personal information ("right to be forgotten"), subject to our legal obligations;</li>
            <li><strong>Restrict</strong> processing in certain circumstances;</li>
            <li><strong>Object</strong> to processing based on legitimate interests, including for direct marketing;</li>
            <li><strong>Portability</strong> — receive a machine-readable copy of information you've given us;</li>
            <li><strong>Withdraw consent</strong> where we rely on consent (you can change your mind anytime);</li>
            <li><strong>Lodge a complaint</strong> with your local data protection authority.</li>
          </ul>
          <p>
            To exercise these rights, email <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. We respond within 30 days. We may need to verify your identity before fulfilling a request.
          </p>

          <h2 id="rights-ccpa">8. Your Rights (California CCPA/CPRA)</h2>
          <p>If you are a California resident, you have the right to:</p>
          <ul>
            <li><strong>Know</strong> what personal information we collect, use, and disclose;</li>
            <li><strong>Access</strong> a copy of your personal information;</li>
            <li><strong>Delete</strong> your personal information, subject to exceptions;</li>
            <li><strong>Correct</strong> inaccurate information;</li>
            <li><strong>Opt out of sale or sharing</strong> — we don't sell or share your personal information for cross-context behavioral advertising, so there's nothing to opt out of, but we honor browser-based Global Privacy Control signals where technically possible;</li>
            <li><strong>Non-discrimination</strong> for exercising your rights — we won't charge you more or give you less service.</li>
          </ul>
          <p>
            To exercise these rights, email <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. You may use an authorized agent; we'll verify the agent's authority.
          </p>
          <p>
            <strong>Categories of personal information collected in the past 12 months</strong>: identifiers (name, email, IP), commercial information (purchases), internet activity (usage), audio (microphone, in voice feature), inferences (usage patterns), professional info (if you self-identify), and the content you create through the Service. We disclose the categories described in <a href="#third-parties">Section 4</a> to the processors listed there for the business purposes described in <a href="#how-used">Section 2</a>. We do not sell or share personal information.
          </p>

          <h2 id="att">9. Apple App Tracking Transparency (ATT) and Mobile Privacy</h2>
          <p>
            Our iOS app does <strong>not</strong> request permission to track you across other apps and websites. We do not use IDFA for cross-app advertising. If Apple's ATT prompt appears, it is because of a third-party SDK and your choice will be honored.
          </p>
          <p>
            We declare the following <strong>data types collected</strong> in our Apple App Store privacy label (and the equivalent Google Play Data Safety section):
          </p>
          <ul>
            <li><strong>Contact info</strong>: name, email — linked to identity, used for app functionality and account.</li>
            <li><strong>Identifiers</strong>: user ID, device ID (IDFV on iOS) — linked to identity, used for app functionality and analytics.</li>
            <li><strong>Purchases</strong>: purchase history — linked to identity, used for app functionality.</li>
            <li><strong>User content</strong>: prompts, generated sites, photos you upload, audio (during voice use only) — linked to identity, used for app functionality.</li>
            <li><strong>Usage data</strong>: product interaction, crash data — linked to identity, used for app functionality and analytics.</li>
            <li><strong>Diagnostics</strong>: crash logs — not linked to identity, used for analytics.</li>
          </ul>
          <p>
            None of the above is used for advertising or third-party advertising tracking.
          </p>

          <h2 id="security">10. Security</h2>
          <p>
            We protect personal information with industry-standard safeguards: TLS 1.2+ in transit, AES-256 encryption at rest for BYO API keys, bcrypt password hashing, role-based access control for our staff, secret rotation, infrastructure separation by environment, and monitoring for suspicious activity. No system is perfectly secure — if a breach affects your personal information, we will notify you and applicable regulators as required by law.
          </p>

          <h2 id="international">11. International Transfers</h2>
          <p>
            Webstew is based in the United States, and our processors are primarily located in the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States and other countries that may have data-protection laws different from your country.
          </p>
          <p>
            For transfers from the EEA, UK, or Switzerland to the United States, we rely on the Standard Contractual Clauses (SCCs) approved by the European Commission, the UK International Data Transfer Addendum, or equivalent mechanisms.
          </p>

          <h2 id="children">12. Children's Privacy</h2>
          <p>
            Webstew is not directed to children under 13 (or 16 in jurisdictions where that is the digital age of consent). We do not knowingly collect personal information from children under those ages. If you believe a child has provided us with personal information, contact us at <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> and we will promptly delete it.
          </p>

          <h2 id="changes">13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we'll notify you by email or in-product before the changes take effect, and we'll update the Effective Date at the top of this page. Continued use of the Service after the effective date constitutes acceptance.
          </p>

          <h2 id="contact">14. Contact</h2>
          <p>
            For privacy questions or to exercise your rights, email <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> or write to:
          </p>
          <p>
            {ENTITY}<br />
            Attn: Privacy — Webstew<br />
            Arizona, United States
          </p>
          <p>
            <strong>EU/UK representative</strong>: if you are in the EU/UK and would like to contact a representative under Article 27 GDPR, email us and we will provide current representative details on request.
          </p>

          <hr className="my-10 border-slate-200 dark:border-white/10" />

          <p className="text-xs text-slate-500 dark:text-zinc-500">
            This Privacy Policy is a first-draft template intended to cover the major required disclosures under GDPR, CCPA/CPRA, and the Apple App Store / Google Play data-safety frameworks. It does not constitute legal advice. We recommend you have it reviewed by licensed counsel familiar with privacy law in the jurisdictions where you operate before launching commercially or submitting an app for review. © {new Date().getFullYear()} {ENTITY}. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}
