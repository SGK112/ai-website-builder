import {
  SUBSCRIPTION_PLANS,
  CREDIT_PACKAGES,
  CREDIT_COSTS,
  getPlanCredits,
  type BillingPeriod,
  type PlanId,
  type SubscriptionPlan,
  type CreditPackage,
} from './stripe-plans'

export {
  SUBSCRIPTION_PLANS,
  CREDIT_PACKAGES,
  CREDIT_COSTS,
  getPlanCredits,
}
export type { BillingPeriod, PlanId, SubscriptionPlan, CreditPackage }

let stripe: import('stripe').default | null = null

async function initStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  try {
    const Stripe = (await import('stripe')).default
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  } catch (e) {
    console.warn('Stripe SDK not available')
    return null
  }
}

const getStripe = async () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = await initStripe()
  }
  return stripe
}

export { getStripe, stripe }

export async function createCreditsCheckoutSession(
  userId: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string,
  email?: string
): Promise<string | null> {
  const stripeClient = await getStripe()
  if (!stripeClient) {
    console.error('Stripe not configured')
    return null
  }

  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId)
  if (!creditPackage) {
    throw new Error('Invalid credit package')
  }
  if (!creditPackage.priceId) {
    console.error(`Credit package "${packageId}" has no priceId — set STRIPE_CREDIT_${packageId.toUpperCase()}_PRICE_ID`)
    return null
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: creditPackage.priceId, quantity: 1 }],
    metadata: {
      userId,
      packageId,
      credits: creditPackage.credits.toString(),
      type: 'credits',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session.url
}

export async function createSubscriptionCheckoutSession(
  userId: string,
  email: string,
  planId: string,
  successUrl: string,
  cancelUrl: string,
  billingPeriod: BillingPeriod = 'monthly'
): Promise<string | null> {
  const stripeClient = await getStripe()
  if (!stripeClient) {
    console.error('Stripe not configured')
    return null
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan) {
    throw new Error('Invalid subscription plan')
  }

  const priceId = billingPeriod === 'annual' ? plan.annualPriceId : plan.monthlyPriceId
  if (!priceId) {
    console.error(`Plan "${planId}" missing ${billingPeriod} priceId — set STRIPE_${planId.toUpperCase()}_${billingPeriod === 'annual' ? 'ANNUAL_' : ''}PRICE_ID`)
    return null
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId,
      planId,
      billingPeriod,
      type: 'subscription',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session.url
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  const stripeClient = await getStripe()
  if (!stripeClient) {
    console.error('Stripe not configured')
    return null
  }

  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}
