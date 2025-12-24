'use client'

import { useState, useCallback } from 'react'
import {
  CreditCard,
  Calendar,
  FileText,
  MessageCircle,
  Mail,
  MapPin,
  Video,
  Share2,
  Bot,
  Zap,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EmbedWidget {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'payments' | 'scheduling' | 'forms' | 'chat' | 'social' | 'maps' | 'video' | 'automation'
  fields: {
    name: string
    label: string
    placeholder: string
    type: 'text' | 'select'
    options?: string[]
    required?: boolean
  }[]
  generateCode: (values: Record<string, string>) => string
  previewUrl?: string
}

const EMBED_WIDGETS: EmbedWidget[] = [
  // Payments
  {
    id: 'stripe-button',
    name: 'Stripe Payment Button',
    description: 'Add a buy button or donation link',
    icon: <CreditCard className="w-5 h-5 text-indigo-500" />,
    category: 'payments',
    fields: [
      { name: 'priceId', label: 'Price ID', placeholder: 'price_xxx', type: 'text', required: true },
      { name: 'buttonText', label: 'Button Text', placeholder: 'Buy Now', type: 'text' },
      { name: 'mode', label: 'Mode', placeholder: 'payment', type: 'select', options: ['payment', 'subscription'] },
    ],
    generateCode: (values) => `<form action="/api/checkout" method="POST">
  <input type="hidden" name="priceId" value="${values.priceId || 'price_xxx'}" />
  <input type="hidden" name="mode" value="${values.mode || 'payment'}" />
  <button type="submit" class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
    ${values.buttonText || 'Buy Now'}
  </button>
</form>`,
  },
  {
    id: 'stripe-elements',
    name: 'Stripe Card Form',
    description: 'Full payment form with card input',
    icon: <CreditCard className="w-5 h-5 text-indigo-500" />,
    category: 'payments',
    fields: [
      { name: 'amount', label: 'Amount (cents)', placeholder: '2999', type: 'text', required: true },
      { name: 'currency', label: 'Currency', placeholder: 'usd', type: 'select', options: ['usd', 'eur', 'gbp'] },
    ],
    generateCode: (values) => `<div id="payment-form" class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
  <h3 class="text-xl font-bold mb-4">Complete Payment</h3>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
    <div id="card-element" class="p-3 border rounded-lg bg-gray-50"></div>
  </div>
  <button id="submit-payment" class="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
    Pay $${((parseInt(values.amount) || 2999) / 100).toFixed(2)} ${(values.currency || 'USD').toUpperCase()}
  </button>
</div>
<script src="https://js.stripe.com/v3/"></script>`,
  },
  {
    id: 'paypal-button',
    name: 'PayPal Button',
    description: 'PayPal checkout button',
    icon: <CreditCard className="w-5 h-5 text-blue-500" />,
    category: 'payments',
    fields: [
      { name: 'clientId', label: 'Client ID', placeholder: 'Your PayPal Client ID', type: 'text', required: true },
      { name: 'amount', label: 'Amount', placeholder: '29.99', type: 'text', required: true },
    ],
    generateCode: (values) => `<div id="paypal-button-container"></div>
<script src="https://www.paypal.com/sdk/js?client-id=${values.clientId || 'YOUR_CLIENT_ID'}"></script>
<script>
  paypal.Buttons({
    createOrder: (data, actions) => actions.order.create({
      purchase_units: [{ amount: { value: '${values.amount || '29.99'}' } }]
    }),
    onApprove: (data, actions) => actions.order.capture().then(details => {
      alert('Transaction completed by ' + details.payer.name.given_name);
    })
  }).render('#paypal-button-container');
</script>`,
  },

  // Scheduling
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Embed scheduling calendar',
    icon: <Calendar className="w-5 h-5 text-blue-500" />,
    category: 'scheduling',
    fields: [
      { name: 'url', label: 'Calendly URL', placeholder: 'https://calendly.com/your-name', type: 'text', required: true },
      { name: 'height', label: 'Height', placeholder: '700', type: 'text' },
    ],
    generateCode: (values) => `<div class="calendly-inline-widget" data-url="${values.url || 'https://calendly.com/your-name'}" style="min-width:320px;height:${values.height || '700'}px;"></div>
<script src="https://assets.calendly.com/assets/external/widget.js" async></script>`,
  },
  {
    id: 'cal-com',
    name: 'Cal.com',
    description: 'Open source scheduling',
    icon: <Calendar className="w-5 h-5 text-orange-500" />,
    category: 'scheduling',
    fields: [
      { name: 'username', label: 'Cal.com Username', placeholder: 'your-username', type: 'text', required: true },
      { name: 'eventType', label: 'Event Type', placeholder: '30min', type: 'text' },
    ],
    generateCode: (values) => `<div id="cal-embed"></div>
<script>
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
  Cal("init");
  Cal("inline", { elementOrSelector: "#cal-embed", calLink: "${values.username || 'username'}/${values.eventType || '30min'}" });
</script>`,
  },

  // Forms
  {
    id: 'typeform',
    name: 'Typeform',
    description: 'Beautiful interactive forms',
    icon: <FileText className="w-5 h-5 text-purple-500" />,
    category: 'forms',
    fields: [
      { name: 'formId', label: 'Form ID', placeholder: 'abc123', type: 'text', required: true },
      { name: 'height', label: 'Height', placeholder: '500', type: 'text' },
    ],
    generateCode: (values) => `<div data-tf-live="${values.formId || 'YOUR_FORM_ID'}" style="width:100%;height:${values.height || '500'}px;"></div>
<script src="//embed.typeform.com/next/embed.js"></script>`,
  },
  {
    id: 'jotform',
    name: 'JotForm',
    description: 'Powerful form builder',
    icon: <FileText className="w-5 h-5 text-orange-500" />,
    category: 'forms',
    fields: [
      { name: 'formId', label: 'Form ID', placeholder: '123456789', type: 'text', required: true },
    ],
    generateCode: (values) => `<script src="https://form.jotform.com/jsform/${values.formId || 'YOUR_FORM_ID'}"></script>`,
  },
  {
    id: 'tally',
    name: 'Tally Forms',
    description: 'Free form builder',
    icon: <FileText className="w-5 h-5 text-teal-500" />,
    category: 'forms',
    fields: [
      { name: 'formId', label: 'Form ID', placeholder: 'abc123', type: 'text', required: true },
      { name: 'height', label: 'Height', placeholder: '500', type: 'text' },
    ],
    generateCode: (values) => `<iframe data-tally-src="https://tally.so/embed/${values.formId || 'YOUR_FORM_ID'}?alignLeft=1&hideTitle=1&transparentBackground=1" width="100%" height="${values.height || '500'}" frameborder="0" marginheight="0" marginwidth="0" title="Form"></iframe>
<script>var d=document,w="https://tally.so/widgets/embed.js",v=function(){"undefined"!=typeof Tally?Tally.loadEmbeds():d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((function(e){e.src=e.dataset.tallySrc}))};if("undefined"!=typeof Tally)v();else if(d.querySelector('script[src="'+w+'"]')==null){var s=d.createElement("script");s.src=w,s.onload=v,s.onerror=v,d.body.appendChild(s);}</script>`,
  },

  // Chat Widgets
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Customer messaging platform',
    icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
    category: 'chat',
    fields: [
      { name: 'appId', label: 'App ID', placeholder: 'abc123', type: 'text', required: true },
    ],
    generateCode: (values) => `<script>
  window.intercomSettings = { api_base: "https://api-iam.intercom.io", app_id: "${values.appId || 'YOUR_APP_ID'}" };
  (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${values.appId || 'YOUR_APP_ID'}';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
</script>`,
  },
  {
    id: 'crisp',
    name: 'Crisp Chat',
    description: 'Free live chat widget',
    icon: <MessageCircle className="w-5 h-5 text-purple-500" />,
    category: 'chat',
    fields: [
      { name: 'websiteId', label: 'Website ID', placeholder: 'abc123-def456', type: 'text', required: true },
    ],
    generateCode: (values) => `<script>
  window.$crisp=[];window.CRISP_WEBSITE_ID="${values.websiteId || 'YOUR_WEBSITE_ID'}";
  (function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
</script>`,
  },
  {
    id: 'tawk',
    name: 'Tawk.to',
    description: 'Free live chat',
    icon: <MessageCircle className="w-5 h-5 text-green-500" />,
    category: 'chat',
    fields: [
      { name: 'propertyId', label: 'Property ID', placeholder: 'abc123', type: 'text', required: true },
      { name: 'widgetId', label: 'Widget ID', placeholder: 'default', type: 'text' },
    ],
    generateCode: (values) => `<script>
  var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
  (function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src='https://embed.tawk.to/${values.propertyId || 'YOUR_PROPERTY_ID'}/${values.widgetId || 'default'}';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();
</script>`,
  },

  // Email Signup
  {
    id: 'mailchimp',
    name: 'Mailchimp Signup',
    description: 'Email newsletter signup',
    icon: <Mail className="w-5 h-5 text-yellow-500" />,
    category: 'forms',
    fields: [
      { name: 'formUrl', label: 'Form Action URL', placeholder: 'https://xxx.us1.list-manage.com/subscribe/post', type: 'text', required: true },
      { name: 'u', label: 'User ID (u)', placeholder: 'abc123', type: 'text', required: true },
      { name: 'id', label: 'List ID (id)', placeholder: 'def456', type: 'text', required: true },
    ],
    generateCode: (values) => `<form action="${values.formUrl || 'YOUR_FORM_URL'}?u=${values.u || 'USER_ID'}&id=${values.id || 'LIST_ID'}" method="post" class="flex gap-2 max-w-md">
  <input type="email" name="EMAIL" placeholder="Enter your email" required class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
  <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Subscribe</button>
</form>`,
  },

  // Maps
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Embed a location map',
    icon: <MapPin className="w-5 h-5 text-red-500" />,
    category: 'maps',
    fields: [
      { name: 'query', label: 'Location', placeholder: 'New York, NY', type: 'text', required: true },
      { name: 'height', label: 'Height', placeholder: '400', type: 'text' },
    ],
    generateCode: (values) => `<iframe src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(values.query || 'New York, NY')}" width="100%" height="${values.height || '400'}" style="border:0;border-radius:12px;" allowfullscreen="" loading="lazy"></iframe>`,
  },

  // Video
  {
    id: 'youtube',
    name: 'YouTube Video',
    description: 'Embed YouTube video',
    icon: <Video className="w-5 h-5 text-red-500" />,
    category: 'video',
    fields: [
      { name: 'videoId', label: 'Video ID', placeholder: 'dQw4w9WgXcQ', type: 'text', required: true },
      { name: 'autoplay', label: 'Autoplay', placeholder: 'No', type: 'select', options: ['No', 'Yes'] },
    ],
    generateCode: (values) => `<div class="aspect-video rounded-xl overflow-hidden shadow-lg">
  <iframe src="https://www.youtube.com/embed/${values.videoId || 'VIDEO_ID'}${values.autoplay === 'Yes' ? '?autoplay=1' : ''}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`,
  },
  {
    id: 'vimeo',
    name: 'Vimeo Video',
    description: 'Embed Vimeo video',
    icon: <Video className="w-5 h-5 text-blue-400" />,
    category: 'video',
    fields: [
      { name: 'videoId', label: 'Video ID', placeholder: '123456789', type: 'text', required: true },
    ],
    generateCode: (values) => `<div class="aspect-video rounded-xl overflow-hidden shadow-lg">
  <iframe src="https://player.vimeo.com/video/${values.videoId || 'VIDEO_ID'}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
</div>`,
  },
  {
    id: 'loom',
    name: 'Loom Video',
    description: 'Embed Loom recording',
    icon: <Video className="w-5 h-5 text-purple-500" />,
    category: 'video',
    fields: [
      { name: 'videoId', label: 'Video ID', placeholder: 'abc123def456', type: 'text', required: true },
    ],
    generateCode: (values) => `<div class="aspect-video rounded-xl overflow-hidden shadow-lg">
  <iframe src="https://www.loom.com/embed/${values.videoId || 'VIDEO_ID'}" width="100%" height="100%" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
</div>`,
  },

  // Social Embeds
  {
    id: 'twitter-timeline',
    name: 'Twitter/X Timeline',
    description: 'Embed Twitter feed',
    icon: <Share2 className="w-5 h-5 text-slate-800" />,
    category: 'social',
    fields: [
      { name: 'username', label: 'Username', placeholder: 'username', type: 'text', required: true },
      { name: 'height', label: 'Height', placeholder: '500', type: 'text' },
    ],
    generateCode: (values) => `<a class="twitter-timeline" data-height="${values.height || '500'}" href="https://twitter.com/${values.username || 'username'}">Tweets by @${values.username || 'username'}</a>
<script async src="https://platform.twitter.com/widgets.js"></script>`,
  },
  {
    id: 'instagram',
    name: 'Instagram Post',
    description: 'Embed Instagram post',
    icon: <Share2 className="w-5 h-5 text-pink-500" />,
    category: 'social',
    fields: [
      { name: 'postUrl', label: 'Post URL', placeholder: 'https://www.instagram.com/p/xxx/', type: 'text', required: true },
    ],
    generateCode: (values) => `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${values.postUrl || 'https://www.instagram.com/p/xxx/'}" style="max-width:540px;width:100%;"></blockquote>
<script async src="//www.instagram.com/embed.js"></script>`,
  },

  // Automation
  {
    id: 'n8n-webhook',
    name: 'n8n Webhook',
    description: 'Trigger n8n workflow',
    icon: <Zap className="w-5 h-5 text-orange-500" />,
    category: 'automation',
    fields: [
      { name: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://n8n.example.com/webhook/xxx', type: 'text', required: true },
      { name: 'buttonText', label: 'Button Text', placeholder: 'Submit', type: 'text' },
    ],
    generateCode: (values) => `<form id="n8n-form" class="space-y-4 max-w-md">
  <input type="text" name="name" placeholder="Your Name" class="w-full px-4 py-2 border rounded-lg" required />
  <input type="email" name="email" placeholder="Your Email" class="w-full px-4 py-2 border rounded-lg" required />
  <textarea name="message" placeholder="Your Message" rows="4" class="w-full px-4 py-2 border rounded-lg"></textarea>
  <button type="submit" class="w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">
    ${values.buttonText || 'Submit'}
  </button>
</form>
<script>
  document.getElementById('n8n-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch('${values.webhookUrl || 'YOUR_WEBHOOK_URL'}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    alert('Form submitted successfully!');
    e.target.reset();
  });
</script>`,
  },
  {
    id: 'zapier-webhook',
    name: 'Zapier Webhook',
    description: 'Trigger Zapier workflow',
    icon: <Zap className="w-5 h-5 text-orange-600" />,
    category: 'automation',
    fields: [
      { name: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/xxx', type: 'text', required: true },
    ],
    generateCode: (values) => `<form id="zapier-form" class="space-y-4 max-w-md">
  <input type="email" name="email" placeholder="Enter your email" class="w-full px-4 py-2 border rounded-lg" required />
  <button type="submit" class="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700">
    Subscribe
  </button>
</form>
<script>
  document.getElementById('zapier-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch('${values.webhookUrl || 'YOUR_WEBHOOK_URL'}', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData))
    });
    alert('Submitted!');
  });
</script>`,
  },

  // AI Chatbot
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    description: 'Embed AI chat assistant',
    icon: <Bot className="w-5 h-5 text-purple-500" />,
    category: 'chat',
    fields: [
      { name: 'botId', label: 'Bot ID', placeholder: 'Your bot ID', type: 'text', required: true },
      { name: 'position', label: 'Position', placeholder: 'right', type: 'select', options: ['right', 'left'] },
    ],
    generateCode: (values) => `<div id="ai-chatbot" data-bot-id="${values.botId || 'YOUR_BOT_ID'}" data-position="${values.position || 'right'}"></div>
<script src="/chatbot-widget.js"></script>`,
  },
]

const CATEGORIES = [
  { id: 'payments', name: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'scheduling', name: 'Scheduling', icon: <Calendar className="w-4 h-4" /> },
  { id: 'forms', name: 'Forms', icon: <FileText className="w-4 h-4" /> },
  { id: 'chat', name: 'Chat & Support', icon: <MessageCircle className="w-4 h-4" /> },
  { id: 'video', name: 'Video', icon: <Video className="w-4 h-4" /> },
  { id: 'social', name: 'Social', icon: <Share2 className="w-4 h-4" /> },
  { id: 'maps', name: 'Maps', icon: <MapPin className="w-4 h-4" /> },
  { id: 'automation', name: 'Automation', icon: <Zap className="w-4 h-4" /> },
]

interface EmbedWidgetsProps {
  onInsertCode: (code: string) => void
}

export function EmbedWidgets({ onInsertCode }: EmbedWidgetsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('payments')
  const [selectedWidget, setSelectedWidget] = useState<EmbedWidget | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const getWidgetsByCategory = (categoryId: string) =>
    EMBED_WIDGETS.filter(w => w.category === categoryId)

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }))
  }

  const generatedCode = selectedWidget ? selectedWidget.generateCode(fieldValues) : ''

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInsert = () => {
    onInsertCode(generatedCode)
    setSelectedWidget(null)
    setFieldValues({})
  }

  if (selectedWidget) {
    return (
      <div className="p-3 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => {
              setSelectedWidget(null)
              setFieldValues({})
            }}
            className="p-1 hover:bg-slate-800 rounded"
          >
            <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-slate-800">
            {selectedWidget.icon}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{selectedWidget.name}</h4>
            <p className="text-xs text-slate-400">{selectedWidget.description}</p>
          </div>
        </div>

        {/* Configuration Fields */}
        <div className="space-y-3">
          {selectedWidget.fields.map(field => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={fieldValues[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                >
                  <option value="">Select...</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={fieldValues[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                />
              )}
            </div>
          ))}
        </div>

        {/* Generated Code Preview */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-400">Generated Code</label>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg text-xs text-green-400 overflow-x-auto max-h-48">
            {generatedCode}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleInsert}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Code className="w-4 h-4 mr-2" />
            Insert to Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1">
      {CATEGORIES.map(category => {
        const widgets = getWidgetsByCategory(category.id)
        if (widgets.length === 0) return null

        const isExpanded = expandedCategory === category.id

        return (
          <div key={category.id} className="rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{category.icon}</span>
                <span className="text-sm font-medium text-white">{category.name}</span>
                <span className="text-xs text-slate-500">{widgets.length}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="py-1 space-y-1">
                {widgets.map(widget => (
                  <button
                    key={widget.id}
                    onClick={() => setSelectedWidget(widget)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left"
                  >
                    <div className="p-1.5 rounded bg-slate-800">
                      {widget.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-white truncate">{widget.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{widget.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
