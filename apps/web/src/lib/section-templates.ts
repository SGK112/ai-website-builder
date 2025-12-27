// Pre-built, high-quality section templates
// Each section is self-contained with curated images

export interface SectionTemplate {
  id: string
  name: string
  category: 'hero' | 'features' | 'about' | 'gallery' | 'testimonials' | 'pricing' | 'cta' | 'footer' | 'contact' | 'team' | 'stats'
  description: string
  thumbnail: string
  html: string
}

// Curated, safe images from Unsplash
const SAFE_IMAGES = {
  hero: {
    business: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
    tech: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    creative: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1920&q=80',
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
    coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80',
    fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
  },
  team: {
    person1: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
    person2: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    person3: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  },
  product: {
    item1: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    item2: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    item3: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80',
  },
  food: {
    dish1: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    dish2: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    dish3: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    coffee1: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
    coffee2: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
  },
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  // HERO SECTIONS
  {
    id: 'hero-centered',
    name: 'Centered Hero',
    category: 'hero',
    description: 'Clean centered hero with headline and CTA',
    thumbnail: '/thumbnails/hero-centered.png',
    html: `
<section class="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80')] bg-cover bg-center opacity-20"></div>
  <div class="relative z-10 text-center px-6 max-w-4xl mx-auto">
    <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
      Build Something <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Amazing</span>
    </h1>
    <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
      Create stunning websites with our powerful tools. No coding required.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all">
        Get Started Free
      </a>
      <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all">
        Watch Demo
      </a>
    </div>
  </div>
</section>`,
  },
  {
    id: 'hero-split',
    name: 'Split Hero',
    category: 'hero',
    description: 'Hero with text on left and image on right',
    thumbnail: '/thumbnails/hero-split.png',
    html: `
<section class="min-h-[80vh] bg-white flex items-center">
  <div class="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <span class="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium mb-6">
        Welcome to the future
      </span>
      <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
        Transform Your Business Today
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Join thousands of companies using our platform to grow their business and reach new customers.
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="#" class="px-8 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors">
          Start Free Trial
        </a>
        <a href="#" class="px-8 py-4 text-gray-700 font-semibold hover:text-purple-600 transition-colors flex items-center gap-2">
          Learn More →
        </a>
      </div>
    </div>
    <div class="relative">
      <img src="${SAFE_IMAGES.hero.business}" alt="Hero" class="rounded-2xl shadow-2xl w-full" />
      <div class="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div>
          <p class="font-bold text-gray-900">10,000+</p>
          <p class="text-sm text-gray-500">Happy Customers</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // FEATURES SECTIONS
  {
    id: 'features-grid',
    name: 'Features Grid',
    category: 'features',
    description: '3-column feature grid with icons',
    thumbnail: '/thumbnails/features-grid.png',
    html: `
<section class="py-24 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Everything you need to build and grow your online presence
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
        <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
        <p class="text-gray-600">Optimized for speed with instant loading times and smooth animations.</p>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
        <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Secure by Default</h3>
        <p class="text-gray-600">Enterprise-grade security with SSL encryption and regular backups.</p>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
        <div class="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Easy to Use</h3>
        <p class="text-gray-600">Intuitive interface designed for everyone, no technical skills needed.</p>
      </div>
    </div>
  </div>
</section>`,
  },

  // ABOUT SECTIONS
  {
    id: 'about-image-left',
    name: 'About with Image',
    category: 'about',
    description: 'About section with image and text',
    thumbnail: '/thumbnails/about-image.png',
    html: `
<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-2 gap-16 items-center">
      <div class="relative">
        <img src="${SAFE_IMAGES.hero.creative}" alt="About us" class="rounded-2xl shadow-xl" />
        <div class="absolute -bottom-8 -right-8 bg-purple-600 text-white p-6 rounded-2xl">
          <p class="text-4xl font-bold">15+</p>
          <p class="text-sm opacity-90">Years Experience</p>
        </div>
      </div>
      <div>
        <span class="text-purple-600 font-semibold mb-4 block">About Us</span>
        <h2 class="text-4xl font-bold text-gray-900 mb-6">We Create Digital Experiences That Matter</h2>
        <p class="text-gray-600 mb-6 text-lg">
          We're a team of passionate designers and developers dedicated to creating beautiful,
          functional websites that help businesses succeed online.
        </p>
        <p class="text-gray-600 mb-8">
          Since 2010, we've helped hundreds of companies transform their digital presence
          and connect with their customers in meaningful ways.
        </p>
        <a href="#" class="inline-flex items-center gap-2 text-purple-600 font-semibold hover:gap-4 transition-all">
          Learn Our Story
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </a>
      </div>
    </div>
  </div>
</section>`,
  },

  // TESTIMONIALS
  {
    id: 'testimonials-cards',
    name: 'Testimonial Cards',
    category: 'testimonials',
    description: 'Customer testimonials in a card layout',
    thumbnail: '/thumbnails/testimonials.png',
    html: `
<section class="py-24 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
      <p class="text-xl text-gray-600">Don't just take our word for it</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white p-8 rounded-2xl shadow-sm">
        <div class="flex gap-1 mb-6">
          ${[1,2,3,4,5].map(() => '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>').join('')}
        </div>
        <p class="text-gray-600 mb-6">"This platform transformed our business. The results have been incredible - 300% increase in leads!"</p>
        <div class="flex items-center gap-4">
          <img src="${SAFE_IMAGES.team.person1}" alt="Sarah" class="w-12 h-12 rounded-full object-cover" />
          <div>
            <p class="font-semibold text-gray-900">Sarah Johnson</p>
            <p class="text-sm text-gray-500">CEO, TechStart</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm">
        <div class="flex gap-1 mb-6">
          ${[1,2,3,4,5].map(() => '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>').join('')}
        </div>
        <p class="text-gray-600 mb-6">"Best decision we ever made. The support team is amazing and the product is even better."</p>
        <div class="flex items-center gap-4">
          <img src="${SAFE_IMAGES.team.person2}" alt="Michael" class="w-12 h-12 rounded-full object-cover" />
          <div>
            <p class="font-semibold text-gray-900">Michael Chen</p>
            <p class="text-sm text-gray-500">Founder, GrowthCo</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm">
        <div class="flex gap-1 mb-6">
          ${[1,2,3,4,5].map(() => '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>').join('')}
        </div>
        <p class="text-gray-600 mb-6">"Incredibly easy to use. We had our new website up and running in just one day."</p>
        <div class="flex items-center gap-4">
          <img src="${SAFE_IMAGES.team.person3}" alt="Emily" class="w-12 h-12 rounded-full object-cover" />
          <div>
            <p class="font-semibold text-gray-900">Emily Davis</p>
            <p class="text-sm text-gray-500">Director, Innovate Inc</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // PRICING
  {
    id: 'pricing-three-tier',
    name: 'Three-Tier Pricing',
    category: 'pricing',
    description: 'Pricing table with three tiers',
    thumbnail: '/thumbnails/pricing.png',
    html: `
<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
      <p class="text-xl text-gray-600">Choose the plan that's right for you</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-gray-50 rounded-2xl p-8">
        <h3 class="text-xl font-bold text-gray-900 mb-2">Starter</h3>
        <p class="text-gray-600 mb-6">Perfect for getting started</p>
        <div class="mb-6">
          <span class="text-5xl font-bold text-gray-900">$9</span>
          <span class="text-gray-500">/month</span>
        </div>
        <ul class="space-y-4 mb-8">
          <li class="flex items-center gap-3 text-gray-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            1 Website
          </li>
          <li class="flex items-center gap-3 text-gray-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Basic Analytics
          </li>
          <li class="flex items-center gap-3 text-gray-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Email Support
          </li>
        </ul>
        <a href="#" class="block text-center py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-purple-600 hover:text-purple-600 transition-colors">
          Get Started
        </a>
      </div>
      <div class="bg-purple-600 rounded-2xl p-8 text-white transform scale-105 shadow-xl">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xl font-bold">Professional</h3>
          <span class="px-3 py-1 bg-white/20 rounded-full text-sm">Popular</span>
        </div>
        <p class="text-purple-200 mb-6">Best for growing businesses</p>
        <div class="mb-6">
          <span class="text-5xl font-bold">$29</span>
          <span class="text-purple-200">/month</span>
        </div>
        <ul class="space-y-4 mb-8">
          <li class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            5 Websites
          </li>
          <li class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Advanced Analytics
          </li>
          <li class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Priority Support
          </li>
          <li class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Custom Domain
          </li>
        </ul>
        <a href="#" class="block text-center py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
          Get Started
        </a>
      </div>
      <div class="bg-gray-50 rounded-2xl p-8">
        <h3 class="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
        <p class="text-gray-600 mb-6">For large organizations</p>
        <div class="mb-6">
          <span class="text-5xl font-bold text-gray-900">$99</span>
          <span class="text-gray-500">/month</span>
        </div>
        <ul class="space-y-4 mb-8">
          <li class="flex items-center gap-3 text-gray-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Unlimited Websites
          </li>
          <li class="flex items-center gap-3 text-gray-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Custom Integrations
          </li>
          <li class="flex items-center gap-3 text-gray-600">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Dedicated Support
          </li>
        </ul>
        <a href="#" class="block text-center py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-purple-600 hover:text-purple-600 transition-colors">
          Contact Sales
        </a>
      </div>
    </div>
  </div>
</section>`,
  },

  // CTA
  {
    id: 'cta-gradient',
    name: 'Gradient CTA',
    category: 'cta',
    description: 'Call-to-action with gradient background',
    thumbnail: '/thumbnails/cta.png',
    html: `
<section class="py-24 bg-gradient-to-r from-purple-600 to-pink-600">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
      Ready to Get Started?
    </h2>
    <p class="text-xl text-white/80 mb-8">
      Join thousands of satisfied customers building amazing websites today.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-colors">
        Start Free Trial
      </a>
      <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all">
        Talk to Sales
      </a>
    </div>
  </div>
</section>`,
  },

  // FOOTER
  {
    id: 'footer-full',
    name: 'Full Footer',
    category: 'footer',
    description: 'Complete footer with links and social',
    thumbnail: '/thumbnails/footer.png',
    html: `
<footer class="bg-gray-900 text-gray-300 py-16">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-12 mb-12">
      <div>
        <h3 class="text-2xl font-bold text-white mb-4">Company</h3>
        <p class="text-gray-400 mb-6">Building the future of web design, one website at a time.</p>
        <div class="flex gap-4">
          <a href="#" class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Product</h4>
        <ul class="space-y-3">
          <li><a href="#" class="hover:text-white transition-colors">Features</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Pricing</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Templates</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Integrations</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Company</h4>
        <ul class="space-y-3">
          <li><a href="#" class="hover:text-white transition-colors">About</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Blog</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Support</h4>
        <ul class="space-y-3">
          <li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Documentation</a></li>
          <li><a href="#" class="hover:text-white transition-colors">API Reference</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Status</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
      <p class="text-gray-500">© 2024 Company. All rights reserved.</p>
      <div class="flex gap-6 mt-4 md:mt-0">
        <a href="#" class="text-gray-500 hover:text-white transition-colors">Privacy</a>
        <a href="#" class="text-gray-500 hover:text-white transition-colors">Terms</a>
        <a href="#" class="text-gray-500 hover:text-white transition-colors">Cookies</a>
      </div>
    </div>
  </div>
</footer>`,
  },

  // CONTACT
  {
    id: 'contact-split',
    name: 'Contact Form',
    category: 'contact',
    description: 'Contact section with form and info',
    thumbnail: '/thumbnails/contact.png',
    html: `
<section class="py-24 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-2 gap-16">
      <div>
        <h2 class="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h2>
        <p class="text-gray-600 mb-8 text-lg">
          Have a question or want to work together? We'd love to hear from you.
        </p>
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Email</p>
              <p class="text-gray-900 font-medium">hello@company.com</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Phone</p>
              <p class="text-gray-900 font-medium">+1 (555) 123-4567</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Office</p>
              <p class="text-gray-900 font-medium">123 Business Ave, Suite 100</p>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-white p-8 rounded-2xl shadow-sm">
        <form class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" placeholder="John" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" placeholder="john@example.com" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea rows="4" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
          </div>
          <button type="submit" class="w-full py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors">
            Send Message
          </button>
        </form>
      </div>
    </div>
  </div>
</section>`,
  },

  // STATS
  {
    id: 'stats-bar',
    name: 'Stats Bar',
    category: 'stats',
    description: 'Horizontal stats display',
    thumbnail: '/thumbnails/stats.png',
    html: `
<section class="py-16 bg-purple-600">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
      <div>
        <p class="text-5xl font-bold mb-2">10K+</p>
        <p class="text-purple-200">Happy Customers</p>
      </div>
      <div>
        <p class="text-5xl font-bold mb-2">50M+</p>
        <p class="text-purple-200">Pages Created</p>
      </div>
      <div>
        <p class="text-5xl font-bold mb-2">99.9%</p>
        <p class="text-purple-200">Uptime</p>
      </div>
      <div>
        <p class="text-5xl font-bold mb-2">24/7</p>
        <p class="text-purple-200">Support</p>
      </div>
    </div>
  </div>
</section>`,
  },

  // TEAM SECTION
  {
    id: 'team-grid',
    name: 'Team Grid',
    category: 'team',
    description: 'Team members in a grid layout',
    thumbnail: '/thumbnails/team.png',
    html: `
<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        The talented people behind our success
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="text-center group">
        <div class="relative mb-6 overflow-hidden rounded-2xl">
          <img src="${SAFE_IMAGES.team.person1}" alt="Team Member" class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
            <div class="flex gap-3">
              <a href="#" class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-1">David Wilson</h3>
        <p class="text-purple-600 font-medium mb-2">CEO & Founder</p>
        <p class="text-gray-500 text-sm">10+ years of experience in tech leadership</p>
      </div>
      <div class="text-center group">
        <div class="relative mb-6 overflow-hidden rounded-2xl">
          <img src="${SAFE_IMAGES.team.person2}" alt="Team Member" class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
            <div class="flex gap-3">
              <a href="#" class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-1">Sarah Miller</h3>
        <p class="text-purple-600 font-medium mb-2">Head of Design</p>
        <p class="text-gray-500 text-sm">Award-winning designer with global experience</p>
      </div>
      <div class="text-center group">
        <div class="relative mb-6 overflow-hidden rounded-2xl">
          <img src="${SAFE_IMAGES.team.person3}" alt="Team Member" class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
            <div class="flex gap-3">
              <a href="#" class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-1">James Chen</h3>
        <p class="text-purple-600 font-medium mb-2">Lead Developer</p>
        <p class="text-gray-500 text-sm">Full-stack expert with a passion for clean code</p>
      </div>
    </div>
  </div>
</section>`,
  },

  // GALLERY SECTION
  {
    id: 'gallery-masonry',
    name: 'Photo Gallery',
    category: 'gallery',
    description: 'Masonry-style image gallery',
    thumbnail: '/thumbnails/gallery.png',
    html: `
<section class="py-24 bg-gray-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">Our Gallery</h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        A glimpse into our work and culture
      </p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div class="group relative overflow-hidden rounded-2xl aspect-square">
        <img src="${SAFE_IMAGES.hero.business}" alt="Gallery" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
          </svg>
        </div>
      </div>
      <div class="group relative overflow-hidden rounded-2xl aspect-square md:row-span-2">
        <img src="${SAFE_IMAGES.hero.tech}" alt="Gallery" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
          </svg>
        </div>
      </div>
      <div class="group relative overflow-hidden rounded-2xl aspect-square">
        <img src="${SAFE_IMAGES.hero.creative}" alt="Gallery" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
          </svg>
        </div>
      </div>
      <div class="group relative overflow-hidden rounded-2xl aspect-square">
        <img src="${SAFE_IMAGES.product.item1}" alt="Gallery" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
          </svg>
        </div>
      </div>
      <div class="group relative overflow-hidden rounded-2xl aspect-square md:col-span-2">
        <img src="${SAFE_IMAGES.hero.coffee}" alt="Gallery" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
          </svg>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // DARK HERO
  {
    id: 'hero-dark-minimal',
    name: 'Dark Minimal Hero',
    category: 'hero',
    description: 'Sleek dark hero with minimal design',
    thumbnail: '/thumbnails/hero-dark.png',
    html: `
<section class="min-h-screen bg-black flex items-center relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
  <div class="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px]"></div>
  <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[128px]"></div>

  <div class="max-w-7xl mx-auto px-6 py-24 relative z-10">
    <div class="max-w-3xl">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-8">
        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        <span class="text-sm text-gray-300">Now available worldwide</span>
      </div>

      <h1 class="text-6xl md:text-8xl font-bold text-white mb-6 leading-[0.9]">
        The Future<br/>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
          Starts Here
        </span>
      </h1>

      <p class="text-xl text-gray-400 mb-12 max-w-xl">
        Experience the next generation of web design. Built for speed, designed for impact.
      </p>

      <div class="flex flex-wrap gap-4">
        <a href="#" class="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors">
          Get Started
        </a>
        <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Watch Video
        </a>
      </div>
    </div>
  </div>
</section>`,
  },

  // RESTAURANT MENU SECTION
  {
    id: 'restaurant-menu',
    name: 'Restaurant Menu',
    category: 'features',
    description: 'Menu section for restaurants',
    thumbnail: '/thumbnails/menu.png',
    html: `
<section class="py-24 bg-stone-900 text-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-amber-400 font-medium tracking-wider uppercase text-sm">Our Menu</span>
      <h2 class="text-4xl md:text-5xl font-serif font-bold mt-4 mb-4">Culinary Delights</h2>
      <p class="text-stone-400 max-w-2xl mx-auto">
        Fresh ingredients, expertly crafted dishes
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-x-16 gap-y-8">
      <div class="flex gap-6 items-start group">
        <img src="${SAFE_IMAGES.food.dish1}" alt="Dish" class="w-24 h-24 rounded-xl object-cover group-hover:scale-105 transition-transform" />
        <div class="flex-1">
          <div class="flex justify-between items-baseline mb-2">
            <h3 class="text-xl font-semibold">Grilled Salmon</h3>
            <span class="text-amber-400 font-bold">$28</span>
          </div>
          <p class="text-stone-400 text-sm">Atlantic salmon with herb butter, roasted vegetables, and lemon sauce</p>
        </div>
      </div>

      <div class="flex gap-6 items-start group">
        <img src="${SAFE_IMAGES.food.dish2}" alt="Dish" class="w-24 h-24 rounded-xl object-cover group-hover:scale-105 transition-transform" />
        <div class="flex-1">
          <div class="flex justify-between items-baseline mb-2">
            <h3 class="text-xl font-semibold">Mediterranean Bowl</h3>
            <span class="text-amber-400 font-bold">$18</span>
          </div>
          <p class="text-stone-400 text-sm">Fresh greens, quinoa, feta cheese, olives, and grilled chicken</p>
        </div>
      </div>

      <div class="flex gap-6 items-start group">
        <img src="${SAFE_IMAGES.food.dish3}" alt="Dish" class="w-24 h-24 rounded-xl object-cover group-hover:scale-105 transition-transform" />
        <div class="flex-1">
          <div class="flex justify-between items-baseline mb-2">
            <h3 class="text-xl font-semibold">Artisan Pizza</h3>
            <span class="text-amber-400 font-bold">$22</span>
          </div>
          <p class="text-stone-400 text-sm">Wood-fired with San Marzano tomatoes, mozzarella, and fresh basil</p>
        </div>
      </div>

      <div class="flex gap-6 items-start group">
        <img src="${SAFE_IMAGES.food.coffee1}" alt="Dish" class="w-24 h-24 rounded-xl object-cover group-hover:scale-105 transition-transform" />
        <div class="flex-1">
          <div class="flex justify-between items-baseline mb-2">
            <h3 class="text-xl font-semibold">Specialty Coffee</h3>
            <span class="text-amber-400 font-bold">$6</span>
          </div>
          <p class="text-stone-400 text-sm">Single-origin espresso with your choice of milk and flavor</p>
        </div>
      </div>
    </div>

    <div class="text-center mt-12">
      <a href="#" class="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-black font-semibold rounded-full hover:bg-amber-400 transition-colors">
        View Full Menu
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        </svg>
      </a>
    </div>
  </div>
</section>`,
  },

  // FEATURES LARGE CARDS
  {
    id: 'features-large-cards',
    name: 'Feature Cards Large',
    category: 'features',
    description: 'Large feature cards with images',
    thumbnail: '/thumbnails/features-large.png',
    html: `
<section class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Discover what makes our platform stand out
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
      <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12">
        <div class="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Lightning Performance</h3>
        <p class="text-gray-600 mb-6">
          Our platform is optimized for speed, ensuring your website loads instantly across all devices and locations.
        </p>
        <ul class="space-y-3">
          <li class="flex items-center gap-3 text-gray-700">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Global CDN delivery
          </li>
          <li class="flex items-center gap-3 text-gray-700">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Optimized images
          </li>
          <li class="flex items-center gap-3 text-gray-700">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Smart caching
          </li>
        </ul>
      </div>

      <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 md:p-12">
        <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Enterprise Security</h3>
        <p class="text-gray-600 mb-6">
          Rest easy knowing your data is protected by industry-leading security measures and compliance standards.
        </p>
        <ul class="space-y-3">
          <li class="flex items-center gap-3 text-gray-700">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            SSL encryption
          </li>
          <li class="flex items-center gap-3 text-gray-700">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            GDPR compliant
          </li>
          <li class="flex items-center gap-3 text-gray-700">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Daily backups
          </li>
        </ul>
      </div>
    </div>
  </div>
</section>`,
  },
]

// Get sections by category
export function getSectionsByCategory(category: SectionTemplate['category']): SectionTemplate[] {
  return SECTION_TEMPLATES.filter(s => s.category === category)
}

// Get all categories
export function getSectionCategories(): SectionTemplate['category'][] {
  return ['hero', 'features', 'about', 'gallery', 'testimonials', 'pricing', 'team', 'cta', 'contact', 'stats', 'footer']
}
