export type BillingPeriod = 'monthly' | 'annual'
export type PlanId = 'free' | 'starter' | 'pro' | 'scale' | 'enterprise'

export interface SubscriptionPlan {
  id: PlanId
  name: string
  monthlyPrice: number
  annualPrice: number
  monthlyPriceId: string | undefined
  annualPriceId: string | undefined
  monthlyCredits: number
  popular?: boolean
  features: string[]
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  priceUsd: number
  priceId: string | undefined
  popular?: boolean
  savings?: string
}

// Amounts here are the source of truth for what the page shows. They MUST
// match the live Stripe prices in the env vars below — anyone tweaking these
// without updating Stripe (or vice versa) will charge customers a different
// number than they saw. Reconciled 2026-05-12 against the live Stripe account.
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceId: undefined,
    annualPriceId: undefined,
    monthlyCredits: 100,
    features: [
      '3 projects',
      '100 starting credits',
      'All integrations',
      'Community support',
      'Export code',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 1900,
    annualPrice: 19000,
    monthlyPriceId: process.env.STRIPE_STARTER_PRICE_ID,
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    monthlyCredits: 200,
    features: [
      '5 projects',
      '200 credits/month',
      'Standard AI models',
      'Email support',
      'Custom domains',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 4900,
    annualPrice: 49000,
    monthlyPriceId: process.env.STRIPE_PRO_PRICE_ID,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    monthlyCredits: 500,
    popular: true,
    features: [
      'Unlimited projects',
      '500 credits/month',
      'Priority AI models',
      'Priority support',
      'Custom domains',
      'Remove branding',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyPrice: 14900,
    annualPrice: 149000,
    monthlyPriceId: process.env.STRIPE_SCALE_PRICE_ID,
    annualPriceId: process.env.STRIPE_SCALE_ANNUAL_PRICE_ID,
    monthlyCredits: 2000,
    features: [
      'Everything in Pro',
      '2,000 credits/month',
      'Team collaboration',
      'SSO & SAML',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
  // Enterprise is hidden from the self-serve /upgrade grid (filtered in the
  // page render) but kept here so existing enterprise subscribers, the
  // webhook, and back-channel sales deals still resolve. Display name shifts
  // to "Contact sales" on the public surface.
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 39900,
    annualPrice: 399000,
    monthlyPriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    annualPriceId: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID,
    monthlyCredits: 10000,
    features: [
      'Everything in Scale',
      '10,000 credits/month',
      'White-label',
      'Custom integrations',
      'Dedicated account manager',
      'Custom SLA',
    ],
  },
]

// Credit packs are one-time purchases that top up the user's `credits`
// balance forever (no expiry). Per-credit price drops with pack size to
// reward bulk. Mini sets the baseline at $0.10/credit; each larger pack
// gives a steeper discount. All five Stripe prices were rebuilt 2026-05-12
// to make the bulk-discount math actually work — previously the bigger
// packs cost MORE per credit than Mini, which made them pointless.
//   Mini       50 cr  $4.99  → $0.100/cr  (baseline)
//   Starter   100 cr  $8.99  → $0.090/cr  (10% off)
//   Pro       500 cr  $39    → $0.078/cr  (22% off)
//   Ent     1,500 cr  $99    → $0.066/cr  (34% off)
//   Mega    5,000 cr  $249   → $0.050/cr  (50% off)
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'mini',
    name: 'Mini Pack',
    credits: 50,
    priceUsd: 499,
    priceId: process.env.STRIPE_CREDIT_MINI_PRICE_ID,
  },
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    priceUsd: 899,
    priceId: process.env.STRIPE_CREDIT_STARTER_PRICE_ID,
    savings: '10%',
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    credits: 500,
    priceUsd: 3900,
    priceId: process.env.STRIPE_CREDIT_PROFESSIONAL_PRICE_ID,
    popular: true,
    savings: '22%',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 1500,
    priceUsd: 9900,
    priceId: process.env.STRIPE_CREDIT_ENTERPRISE_PRICE_ID,
    savings: '34%',
  },
  {
    id: 'mega',
    name: 'Mega Pack',
    credits: 5000,
    priceUsd: 24900,
    priceId: process.env.STRIPE_CREDIT_MEGA_PRICE_ID,
    savings: '50%',
  },
]

export const CREDIT_COSTS = {
  generate_website: 10,
  chat_message: 1,
  image_generation: 5,
  video_generation: 20,
  audio_generation: 10,
  image_enhance: 3,
  deployment: 0,
}

export function getPlanCredits(planId: string): number {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  return plan?.monthlyCredits ?? 0
}
