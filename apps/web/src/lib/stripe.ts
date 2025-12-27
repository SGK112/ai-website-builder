// Dynamic import for Stripe to handle module resolution in monorepo
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

// Initialize on first use
const getStripe = async () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = await initStripe()
  }
  return stripe
}

export { getStripe, stripe }

// Credit packages with pricing
export const CREDIT_PACKAGES = [
  {
    id: 'credits_100',
    name: '100 Credits',
    credits: 100,
    price: 999, // $9.99 in cents
    priceId: process.env.STRIPE_PRICE_100_CREDITS,
    popular: false,
  },
  {
    id: 'credits_500',
    name: '500 Credits',
    credits: 500,
    price: 3999, // $39.99 in cents
    priceId: process.env.STRIPE_PRICE_500_CREDITS,
    popular: true,
    savings: '20%',
  },
  {
    id: 'credits_1500',
    name: '1,500 Credits',
    credits: 1500,
    price: 9999, // $99.99 in cents
    priceId: process.env.STRIPE_PRICE_1500_CREDITS,
    popular: false,
    savings: '33%',
  },
]

// Subscription plans
export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '3 projects',
      '100 starting credits',
      'All integrations',
      'Community support',
      'Export code',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1900, // $19/mo in cents
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
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
    id: 'team',
    name: 'Team',
    price: 4900, // $49/mo in cents
    priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    features: [
      'Everything in Pro',
      '2,000 credits/month',
      'Team collaboration',
      'SSO & SAML',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
]

// Credit costs for different operations
export const CREDIT_COSTS = {
  generate_website: 10,
  chat_message: 1,
  image_generation: 5,
  video_generation: 20,
  audio_generation: 10,
  image_enhance: 3,
  deployment: 0, // Free
}

// Create checkout session for credit purchase
export async function createCreditsCheckoutSession(
  userId: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string
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

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: creditPackage.name,
            description: `${creditPackage.credits} AI generation credits for WebCraft AI`,
          },
          unit_amount: creditPackage.price,
        },
        quantity: 1,
      },
    ],
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

// Create checkout session for subscription
export async function createSubscriptionCheckoutSession(
  userId: string,
  email: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  const stripeClient = await getStripe()
  if (!stripeClient) {
    console.error('Stripe not configured')
    return null
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan || !plan.priceId) {
    throw new Error('Invalid subscription plan')
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      planId,
      type: 'subscription',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session.url
}

// Create customer portal session for managing subscription
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
