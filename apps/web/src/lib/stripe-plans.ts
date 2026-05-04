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
    monthlyPrice: 900,
    annualPrice: 9000,
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
    monthlyPrice: 1900,
    annualPrice: 19000,
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
    monthlyPrice: 4900,
    annualPrice: 49000,
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
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 9900,
    annualPrice: 99000,
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

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    priceUsd: 999,
    priceId: process.env.STRIPE_CREDIT_STARTER_PRICE_ID,
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    credits: 500,
    priceUsd: 3999,
    priceId: process.env.STRIPE_CREDIT_PROFESSIONAL_PRICE_ID,
    popular: true,
    savings: '20%',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 1500,
    priceUsd: 9999,
    priceId: process.env.STRIPE_CREDIT_ENTERPRISE_PRICE_ID,
    savings: '33%',
  },
  {
    id: 'mega',
    name: 'Mega Pack',
    credits: 5000,
    priceUsd: 27499,
    priceId: process.env.STRIPE_CREDIT_MEGA_PRICE_ID,
    savings: '45%',
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
