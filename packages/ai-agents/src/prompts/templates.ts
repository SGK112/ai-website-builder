export const SYSTEM_PROMPTS = {
  codeGeneration: `You are an expert full-stack developer specialized in building modern web applications.

Your expertise includes:
- Next.js 14+ with App Router
- TypeScript with strict type safety
- React Server Components and Client Components
- Tailwind CSS for styling
- MongoDB with Mongoose for database
- NextAuth.js for authentication
- Stripe for payments (when applicable)

When generating code:
1. Always use TypeScript with proper type definitions
2. Follow Next.js 14 conventions (app router, server actions)
3. Use modern React patterns (hooks, context, suspense)
4. Implement proper error handling
5. Include comments for complex logic
6. Generate complete, runnable code files
7. Use Tailwind CSS for all styling

Format your code responses with file paths:
\`\`\`typescript:app/page.tsx
// code here
\`\`\``,

  tourGuide: `You are a friendly, helpful tour guide for an AI-powered website builder platform.

Your role is to:
1. Guide users through the website building process step-by-step
2. Explain each step clearly and concisely
3. Offer helpful suggestions based on their project type
4. Ask clarifying questions when needed
5. Celebrate their progress and achievements

Current wizard steps:
1. Choose Project Type (Business/Portfolio, E-commerce, SaaS)
2. Select a Template
3. Customize Design & Features
4. Configure API Credentials
5. Review & Generate

Be encouraging, clear, and professional. Use a friendly but professional tone.
Always end your responses with a clear call-to-action or question to move forward.

When discussing technical concepts, explain them in simple terms that non-developers can understand.`,

  templateCustomization: `You are a template customization expert.

Your task is to modify template files based on user requirements while:
1. Preserving the template structure
2. Replacing placeholder variables with actual values
3. Adding or removing features as requested
4. Maintaining code quality and consistency
5. Ensuring all file paths are correct

Template variables use the format: {{variableName}}
Replace these with actual values provided by the user.`,
}

export const CODE_GENERATION_PROMPTS = {
  nextjsPage: (pageName: string, features: string[]) => `
Generate a Next.js 14 page component for "${pageName}" with the following features:
${features.map((f) => `- ${f}`).join('\n')}

Requirements:
- Use TypeScript
- Use Tailwind CSS for styling
- Include proper metadata export
- Handle loading and error states
- Use Server Components where possible
`,

  apiRoute: (endpoint: string, method: string, description: string) => `
Generate a Next.js 14 API route for ${method} ${endpoint}.

Description: ${description}

Requirements:
- Use TypeScript with proper types
- Include request validation with Zod
- Implement proper error handling
- Return appropriate status codes
- Include authentication check if needed
`,

  component: (componentName: string, props: string[], description: string) => `
Generate a React component named "${componentName}".

Description: ${description}

Props:
${props.map((p) => `- ${p}`).join('\n')}

Requirements:
- Use TypeScript with proper prop types
- Use Tailwind CSS for styling
- Include proper accessibility attributes
- Handle loading and error states if applicable
`,

  businessPortfolio: (config: {
    businessName: string
    tagline?: string
    industry?: string
  }) => `
Generate a complete Next.js 14 business/portfolio website with:
- Hero section with headline: "${config.tagline || 'Welcome to our business'}"
- About section
- Services/Portfolio gallery
- Contact form with email integration
- Responsive navigation
- Footer with social links

Business: ${config.businessName}
Industry: ${config.industry || 'General'}
`,

  ecommerce: (config: {
    storeName: string
    currency?: string
  }) => `
Generate a complete Next.js 14 e-commerce store with:
- Product listing page with filters
- Product detail page
- Shopping cart (using Zustand)
- Checkout flow
- Stripe payment integration setup
- User authentication
- Order history

Store: ${config.storeName}
Currency: ${config.currency || 'USD'}
`,

  saas: (config: {
    appName: string
    features?: string[]
  }) => `
Generate a complete Next.js 14 SaaS application with:
- Landing page with pricing
- Authentication (login/signup)
- Dashboard layout
- User settings page
- Billing/subscription page (Stripe)
- API routes for core functionality

App: ${config.appName}
Features: ${config.features?.join(', ') || 'Standard features'}
`,
}

// Extended template configurations for more specific use cases
export const TEMPLATE_CONFIGS = {
  // Business Portfolio Templates
  'agency-portfolio': {
    name: 'Creative Agency',
    category: 'business-portfolio',
    description: 'Modern agency site with case studies and team showcase',
    features: ['Hero with video background', 'Case study grid', 'Team section', 'Client logos', 'Contact form'],
    colorScheme: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b' },
  },
  'freelancer-portfolio': {
    name: 'Freelancer Portfolio',
    category: 'business-portfolio',
    description: 'Personal portfolio for designers and developers',
    features: ['About section', 'Skills display', 'Project gallery', 'Testimonials', 'Blog', 'Contact'],
    colorScheme: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#f97316' },
  },
  'law-firm': {
    name: 'Law Firm',
    category: 'business-portfolio',
    description: 'Professional site for legal services',
    features: ['Practice areas', 'Attorney profiles', 'Case results', 'Client testimonials', 'Consultation form'],
    colorScheme: { primary: '#1e3a5f', secondary: '#2d4a6f', accent: '#c9a227' },
  },
  'medical-practice': {
    name: 'Medical Practice',
    category: 'business-portfolio',
    description: 'Healthcare provider website',
    features: ['Services list', 'Doctor profiles', 'Patient resources', 'Appointment booking', 'Location map'],
    colorScheme: { primary: '#0891b2', secondary: '#0e7490', accent: '#10b981' },
  },
  'restaurant': {
    name: 'Restaurant',
    category: 'business-portfolio',
    description: 'Restaurant with menu and reservations',
    features: ['Menu display', 'Photo gallery', 'Online reservations', 'Location & hours', 'Reviews'],
    colorScheme: { primary: '#dc2626', secondary: '#991b1b', accent: '#fbbf24' },
  },

  // E-commerce Templates
  'fashion-store': {
    name: 'Fashion Boutique',
    category: 'ecommerce',
    description: 'Clothing and accessories store',
    features: ['Product catalog', 'Size guide', 'Wishlist', 'Reviews', 'Instagram feed'],
    colorScheme: { primary: '#0f0f0f', secondary: '#262626', accent: '#d4af37' },
  },
  'electronics-store': {
    name: 'Electronics Store',
    category: 'ecommerce',
    description: 'Tech gadgets and electronics',
    features: ['Product comparison', 'Specifications', 'Customer reviews', 'Deals section', 'Search filters'],
    colorScheme: { primary: '#1e40af', secondary: '#1e3a8a', accent: '#f59e0b' },
  },
  'food-delivery': {
    name: 'Food Delivery',
    category: 'ecommerce',
    description: 'Restaurant delivery platform',
    features: ['Menu categories', 'Cart system', 'Delivery tracking', 'Restaurant profiles', 'Reviews'],
    colorScheme: { primary: '#ea580c', secondary: '#c2410c', accent: '#16a34a' },
  },
  'subscription-box': {
    name: 'Subscription Box',
    category: 'ecommerce',
    description: 'Monthly subscription service',
    features: ['Subscription tiers', 'Past boxes gallery', 'Account management', 'Gift subscriptions', 'Reviews'],
    colorScheme: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#f472b6' },
  },
  'digital-products': {
    name: 'Digital Products',
    category: 'ecommerce',
    description: 'Digital downloads and courses',
    features: ['Product previews', 'Instant download', 'License management', 'Reviews', 'Author profiles'],
    colorScheme: { primary: '#059669', secondary: '#047857', accent: '#3b82f6' },
  },

  // SaaS Templates
  'analytics-dashboard': {
    name: 'Analytics Dashboard',
    category: 'saas',
    description: 'Data analytics and reporting platform',
    features: ['Dashboard widgets', 'Chart visualizations', 'Report builder', 'Export data', 'Team access'],
    colorScheme: { primary: '#3b82f6', secondary: '#2563eb', accent: '#10b981' },
  },
  'project-management': {
    name: 'Project Management',
    category: 'saas',
    description: 'Team collaboration and task tracking',
    features: ['Kanban boards', 'Task lists', 'Team calendar', 'File sharing', 'Time tracking'],
    colorScheme: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#f59e0b' },
  },
  'crm-platform': {
    name: 'CRM Platform',
    category: 'saas',
    description: 'Customer relationship management',
    features: ['Contact management', 'Deal pipeline', 'Email integration', 'Reports', 'Team collaboration'],
    colorScheme: { primary: '#0891b2', secondary: '#0e7490', accent: '#f97316' },
  },
  'booking-system': {
    name: 'Booking System',
    category: 'saas',
    description: 'Appointment and reservation platform',
    features: ['Calendar view', 'Booking widget', 'Payment processing', 'Email reminders', 'Staff management'],
    colorScheme: { primary: '#16a34a', secondary: '#15803d', accent: '#6366f1' },
  },
  'learning-management': {
    name: 'Learning Management',
    category: 'saas',
    description: 'Online course platform',
    features: ['Course builder', 'Video hosting', 'Quiz system', 'Progress tracking', 'Certificates'],
    colorScheme: { primary: '#dc2626', secondary: '#b91c1c', accent: '#0ea5e9' },
  },
}

export type TemplateKey = keyof typeof TEMPLATE_CONFIGS
