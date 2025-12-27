// Google reCAPTCHA v3 Integration
// Free for up to 1M verifications/month

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
export const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || ''

// Verify reCAPTCHA token on server side
export async function verifyRecaptcha(token: string): Promise<{ success: boolean; score: number; action?: string }> {
  if (!RECAPTCHA_SECRET_KEY) {
    // If reCAPTCHA is not configured, allow the request
    console.warn('reCAPTCHA not configured - skipping verification')
    return { success: true, score: 1.0 }
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const data = await response.json()

    return {
      success: data.success,
      score: data.score || 0,
      action: data.action,
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return { success: false, score: 0 }
  }
}

// Generate script tag for client-side
export function getRecaptchaScript(): string {
  if (!RECAPTCHA_SITE_KEY) return ''
  return `<script src="https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}"></script>`
}

// Client-side: Execute reCAPTCHA and get token
export function getRecaptchaClientCode(siteKey: string): string {
  return `
    async function executeRecaptcha(action) {
      if (typeof grecaptcha === 'undefined') return null;
      try {
        const token = await grecaptcha.execute('${siteKey}', { action });
        return token;
      } catch (error) {
        console.error('reCAPTCHA error:', error);
        return null;
      }
    }
  `
}
