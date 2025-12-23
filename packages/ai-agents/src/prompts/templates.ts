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
