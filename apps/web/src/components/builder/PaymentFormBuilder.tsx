'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  CreditCard,
  DollarSign,
  Lock,
  Shield,
  Eye,
  Code,
  Copy,
  Download,
  Settings,
  Palette,
  Plus,
  Trash2,
  GripVertical,
  Check,
  ChevronDown,
  ExternalLink
} from 'lucide-react'

// Payment form types
type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'custom'
type FormStyle = 'minimal' | 'modern' | 'classic' | 'branded'
type PaymentType = 'one-time' | 'subscription' | 'donation' | 'invoice'

interface PaymentField {
  id: string
  type: 'text' | 'email' | 'phone' | 'card' | 'amount' | 'select' | 'checkbox'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select fields
}

interface PaymentForm {
  id: string
  name: string
  provider: PaymentProvider
  paymentType: PaymentType
  currency: string
  amount?: number // For fixed amount
  minAmount?: number // For donation
  maxAmount?: number
  fields: PaymentField[]
  style: FormStyle
  colors: {
    primary: string
    background: string
    text: string
    accent: string
  }
  buttonText: string
  successMessage: string
  successRedirect?: string
  collectBillingAddress: boolean
  collectShippingAddress: boolean
  enableCoupons: boolean
}

// Pre-built payment form templates
const PAYMENT_TEMPLATES: Record<string, Partial<PaymentForm>> = {
  checkout: {
    name: 'Product Checkout',
    paymentType: 'one-time',
    buttonText: 'Pay Now',
    successMessage: 'Thank you for your purchase!',
    collectBillingAddress: true,
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { id: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
      { id: 'card', type: 'card', label: 'Card Details', required: true }
    ]
  },
  subscription: {
    name: 'Subscription Plan',
    paymentType: 'subscription',
    buttonText: 'Subscribe',
    successMessage: 'Welcome to the team!',
    collectBillingAddress: true,
    fields: [
      { id: 'name', type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true },
      { id: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
      { id: 'plan', type: 'select', label: 'Select Plan', required: true, options: ['Basic - $9/mo', 'Pro - $29/mo', 'Enterprise - $99/mo'] },
      { id: 'card', type: 'card', label: 'Card Details', required: true }
    ]
  },
  donation: {
    name: 'Donation Form',
    paymentType: 'donation',
    buttonText: 'Donate',
    successMessage: 'Thank you for your generous donation!',
    minAmount: 5,
    fields: [
      { id: 'name', type: 'text', label: 'Your Name', placeholder: 'John Doe', required: false },
      { id: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
      { id: 'amount', type: 'amount', label: 'Donation Amount', required: true },
      { id: 'message', type: 'text', label: 'Leave a Message (optional)', placeholder: 'Your message...', required: false },
      { id: 'card', type: 'card', label: 'Card Details', required: true }
    ]
  },
  invoice: {
    name: 'Invoice Payment',
    paymentType: 'invoice',
    buttonText: 'Pay Invoice',
    successMessage: 'Payment received! A receipt has been sent to your email.',
    fields: [
      { id: 'invoice', type: 'text', label: 'Invoice Number', placeholder: 'INV-001', required: true },
      { id: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
      { id: 'card', type: 'card', label: 'Card Details', required: true }
    ]
  }
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
]

const FORM_STYLES: { id: FormStyle; name: string; preview: string }[] = [
  { id: 'minimal', name: 'Minimal', preview: 'Clean and simple' },
  { id: 'modern', name: 'Modern', preview: 'Sleek with shadows' },
  { id: 'classic', name: 'Classic', preview: 'Traditional style' },
  { id: 'branded', name: 'Branded', preview: 'Custom colors' }
]

interface PaymentFormBuilderProps {
  onSave?: (form: PaymentForm) => void
  onExport?: (html: string) => void
  initialForm?: Partial<PaymentForm>
}

export function PaymentFormBuilder({ onSave, onExport, initialForm }: PaymentFormBuilderProps) {
  const [form, setForm] = useState<PaymentForm>({
    id: crypto.randomUUID(),
    name: initialForm?.name || 'Untitled Payment Form',
    provider: initialForm?.provider || 'stripe',
    paymentType: initialForm?.paymentType || 'one-time',
    currency: initialForm?.currency || 'USD',
    amount: initialForm?.amount,
    minAmount: initialForm?.minAmount,
    maxAmount: initialForm?.maxAmount,
    fields: initialForm?.fields || [
      { id: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
      { id: 'card', type: 'card', label: 'Card Details', required: true }
    ],
    style: initialForm?.style || 'modern',
    colors: {
      primary: '#6366f1',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#8b5cf6',
      ...initialForm?.colors
    },
    buttonText: initialForm?.buttonText || 'Pay Now',
    successMessage: initialForm?.successMessage || 'Payment successful!',
    successRedirect: initialForm?.successRedirect,
    collectBillingAddress: initialForm?.collectBillingAddress || false,
    collectShippingAddress: initialForm?.collectShippingAddress || false,
    enableCoupons: initialForm?.enableCoupons || false
  })

  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit')
  const [showTemplates, setShowTemplates] = useState(true)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const currency = CURRENCIES.find(c => c.code === form.currency) || CURRENCIES[0]

  const addField = useCallback((type: PaymentField['type']) => {
    const newField: PaymentField = {
      id: crypto.randomUUID(),
      type,
      label: type === 'card' ? 'Card Details' : type === 'amount' ? 'Amount' : `New ${type} field`,
      placeholder: '',
      required: type === 'card'
    }
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
    setSelectedFieldId(newField.id)
  }, [])

  const updateField = useCallback((fieldId: string, updates: Partial<PaymentField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }))
  }, [])

  const deleteField = useCallback((fieldId: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }, [selectedFieldId])

  const loadTemplate = useCallback((templateKey: string) => {
    const template = PAYMENT_TEMPLATES[templateKey]
    if (template) {
      setForm(prev => ({
        ...prev,
        name: template.name || prev.name,
        paymentType: template.paymentType || prev.paymentType,
        buttonText: template.buttonText || prev.buttonText,
        successMessage: template.successMessage || prev.successMessage,
        collectBillingAddress: template.collectBillingAddress ?? prev.collectBillingAddress,
        minAmount: template.minAmount,
        fields: (template.fields || []).map(f => ({ ...f, id: crypto.randomUUID() }))
      }))
      setShowTemplates(false)
    }
  }, [])

  // Generate HTML output
  const generateHTML = useCallback((): string => {
    const { style, colors, fields, buttonText, paymentType, amount, minAmount } = form

    const getStyleClasses = () => {
      switch (style) {
        case 'minimal':
          return {
            form: 'font-sans',
            input: 'border-b border-gray-300 focus:border-indigo-500 py-2 outline-none bg-transparent',
            button: 'w-full py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors'
          }
        case 'modern':
          return {
            form: 'font-sans shadow-xl rounded-2xl',
            input: 'border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none',
            button: 'w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg'
          }
        case 'classic':
          return {
            form: 'font-serif border border-gray-300',
            input: 'border border-gray-300 px-3 py-2 focus:border-gray-500 outline-none',
            button: 'w-full py-3 bg-gray-800 text-white font-medium border border-gray-800 hover:bg-gray-700 transition-colors'
          }
        case 'branded':
          return {
            form: 'font-sans rounded-2xl shadow-2xl',
            input: `border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-[${colors.primary}] outline-none`,
            button: `w-full py-4 text-white font-bold rounded-lg transition-all hover:opacity-90`
          }
        default:
          return { form: '', input: '', button: '' }
      }
    }

    const styles = getStyleClasses()

    const renderField = (field: PaymentField): string => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
          return `
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">${field.label}${field.required ? ' *' : ''}</label>
          <input type="${field.type}" name="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} class="${styles.input} w-full">
        </div>`

        case 'amount':
          return `
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">${field.label}${field.required ? ' *' : ''}</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">${currency.symbol}</span>
            <input type="number" name="amount" min="${minAmount || 1}" step="0.01" ${field.required ? 'required' : ''} class="${styles.input} w-full pl-8" ${amount ? `value="${amount}"` : ''}>
          </div>
          ${paymentType === 'donation' ? `
          <div class="flex gap-2 mt-2">
            ${[10, 25, 50, 100].map(amt => `<button type="button" onclick="this.form.amount.value=${amt}" class="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">${currency.symbol}${amt}</button>`).join('')}
          </div>` : ''}
        </div>`

        case 'select':
          return `
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">${field.label}${field.required ? ' *' : ''}</label>
          <select name="${field.id}" ${field.required ? 'required' : ''} class="${styles.input} w-full">
            <option value="">Select...</option>
            ${(field.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        </div>`

        case 'card':
          return `
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">${field.label}</label>
          <div id="card-element" class="${styles.input} w-full min-h-[44px]">
            <!-- Stripe/Payment Card Element -->
          </div>
        </div>`

        case 'checkbox':
          return `
        <div class="flex items-center gap-2">
          <input type="checkbox" name="${field.id}" id="${field.id}" ${field.required ? 'required' : ''} class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
          <label for="${field.id}" class="text-sm text-gray-600">${field.label}</label>
        </div>`

        default:
          return ''
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment - ${form.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${form.provider === 'stripe' ? '<script src="https://js.stripe.com/v3/"></script>' : ''}
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-gray-100 flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <form id="payment-form" class="${styles.form} bg-white p-8" style="background-color: ${colors.background};">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold" style="color: ${colors.text};">${form.name}</h1>
        ${amount ? `<p class="text-3xl font-bold mt-2" style="color: ${colors.primary};">${currency.symbol}${amount.toFixed(2)}</p>` : ''}
      </div>

      <!-- Fields -->
      <div class="space-y-5">
        ${fields.map(renderField).join('\n')}
      </div>

      <!-- Security Badge -->
      <div class="flex items-center justify-center gap-2 mt-6 text-xs text-gray-500">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span>Secured by ${form.provider === 'stripe' ? 'Stripe' : form.provider === 'paypal' ? 'PayPal' : 'SSL'}</span>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="${styles.button} mt-8" style="background-color: ${colors.primary};">
        ${buttonText}
      </button>

      <!-- Footer -->
      <p class="text-center text-xs text-gray-400 mt-4">
        By completing this payment, you agree to our Terms of Service.
      </p>
    </form>

    <!-- Success Message (hidden by default) -->
    <div id="payment-success" class="hidden ${styles.form} bg-white p-8 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h2 class="text-xl font-semibold mb-2">${form.successMessage}</h2>
      <p class="text-gray-600">A confirmation has been sent to your email.</p>
    </div>
  </div>

  <script>
    // Initialize payment form
    ${form.provider === 'stripe' ? `
    const stripe = Stripe('YOUR_STRIPE_PUBLISHABLE_KEY');
    const elements = stripe.elements();
    const cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '${colors.text}',
          '::placeholder': { color: '#9ca3af' }
        }
      }
    });
    cardElement.mount('#card-element');

    document.getElementById('payment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      // Handle Stripe payment
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        console.error(error);
        alert(error.message);
      } else {
        // Send paymentMethod.id to your server
        console.log('Payment method created:', paymentMethod.id);
        document.getElementById('payment-form').classList.add('hidden');
        document.getElementById('payment-success').classList.remove('hidden');
      }
    });
    ` : `
    document.getElementById('payment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      // Handle form submission
      document.getElementById('payment-form').classList.add('hidden');
      document.getElementById('payment-success').classList.remove('hidden');
    });
    `}
  </script>
</body>
</html>`
  }, [form, currency])

  const handleExport = useCallback(() => {
    const html = generateHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.name.toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
    onExport?.(html)
  }, [generateHTML, form.name, onExport])

  const handleCopyCode = useCallback(async () => {
    const html = generateHTML()
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [generateHTML])

  // Template selector
  if (showTemplates) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0f]">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-purple-400" />
            Payment Form Builder
          </h2>
          <p className="mt-2 text-sm text-gray-400">Choose a template to start</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(PAYMENT_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => loadTemplate(key)}
                className="p-6 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-purple-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  {key === 'donation' ? (
                    <DollarSign className="w-6 h-6 text-white" />
                  ) : key === 'subscription' ? (
                    <Shield className="w-6 h-6 text-white" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-white" />
                  )}
                </div>
                <h3 className="font-medium text-white">{template.name}</h3>
                <p className="mt-1 text-xs text-gray-400">{template.paymentType} payment</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTemplates(true)}
            className="text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded"
          >
            ← Templates
          </button>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="bg-transparent text-white font-medium focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-lg p-1">
            {(['edit', 'preview', 'code'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
            title="Copy HTML"
          >
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'edit' && (
          <>
            {/* Field Builder */}
            <div className="w-64 border-r border-white/10 p-4 overflow-y-auto">
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">Add Field</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  { type: 'text', label: 'Text' },
                  { type: 'email', label: 'Email' },
                  { type: 'phone', label: 'Phone' },
                  { type: 'amount', label: 'Amount' },
                  { type: 'select', label: 'Dropdown' },
                  { type: 'checkbox', label: 'Checkbox' }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addField(item.type as PaymentField['type'])}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Form Settings */}
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Provider</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value as PaymentProvider }))}
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="square">Square</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fixed Amount (optional)</label>
                  <input
                    type="number"
                    value={form.amount || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={form.buttonText}
                    onChange={(e) => setForm(prev => ({ ...prev, buttonText: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Style</label>
                  <select
                    value={form.style}
                    onChange={(e) => setForm(prev => ({ ...prev, style: e.target.value as FormStyle }))}
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                  >
                    {FORM_STYLES.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={form.colors.primary}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      colors: { ...prev.colors, primary: e.target.value }
                    }))}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto p-6 bg-[#1a1a2e] flex items-center justify-center">
              <iframe
                srcDoc={generateHTML()}
                className="bg-white rounded-lg shadow-2xl"
                style={{ width: 450, height: 600, border: 'none' }}
              />
            </div>

            {/* Field Editor */}
            {selectedFieldId && form.fields.find(f => f.id === selectedFieldId) && (
              <div className="w-64 border-l border-white/10 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white">Edit Field</h3>
                  <button
                    onClick={() => deleteField(selectedFieldId)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <FieldEditor
                  field={form.fields.find(f => f.id === selectedFieldId)!}
                  onChange={(updates) => updateField(selectedFieldId, updates)}
                />
              </div>
            )}
          </>
        )}

        {viewMode === 'preview' && (
          <div className="flex-1 overflow-auto p-6 bg-[#1a1a2e] flex items-center justify-center">
            <iframe
              srcDoc={generateHTML()}
              className="bg-white rounded-lg shadow-2xl"
              style={{ width: 450, height: 700, border: 'none' }}
            />
          </div>
        )}

        {viewMode === 'code' && (
          <div className="flex-1 overflow-auto p-4">
            <pre className="p-4 bg-[#1a1a2e] rounded-lg text-sm text-gray-300 font-mono overflow-auto h-full">
              {generateHTML()}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// Field Editor Component
function FieldEditor({
  field,
  onChange
}: {
  field: PaymentField
  onChange: (updates: Partial<PaymentField>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
        />
      </div>

      {field.type !== 'card' && field.type !== 'checkbox' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
          />
        </div>
      )}

      {field.type === 'select' && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">Options (one per line)</label>
          <textarea
            value={(field.options || []).join('\n')}
            onChange={(e) => onChange({ options: e.target.value.split('\n').filter(Boolean) })}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white h-24"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="rounded bg-white/5 border-white/10"
        />
        <label className="text-xs text-gray-400">Required field</label>
      </div>
    </div>
  )
}

export default PaymentFormBuilder
