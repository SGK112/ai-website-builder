// Template library from learning-zone/website-templates
// https://github.com/learning-zone/website-templates

export interface Template {
  id: string
  name: string
  category: string
  previewUrl: string
  sourceUrl: string
  tags: string[]
  description: string
}

export const TEMPLATE_CATEGORIES = [
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'portfolio', name: 'Portfolio', icon: 'user' },
  { id: 'restaurant', name: 'Restaurant & Food', icon: 'utensils' },
  { id: 'ecommerce', name: 'E-commerce', icon: 'shopping-cart' },
  { id: 'medical', name: 'Medical & Health', icon: 'heart' },
  { id: 'fitness', name: 'Fitness & Gym', icon: 'dumbbell' },
  { id: 'realestate', name: 'Real Estate', icon: 'home' },
  { id: 'agency', name: 'Agency & Creative', icon: 'palette' },
  { id: 'tech', name: 'Tech & SaaS', icon: 'code' },
  { id: 'education', name: 'Education', icon: 'graduation-cap' },
  { id: 'photography', name: 'Photography', icon: 'camera' },
  { id: 'hotel', name: 'Hotel & Travel', icon: 'plane' },
]

const BASE_URL = 'https://learning-zone.github.io/website-templates'
const RAW_URL = 'https://raw.githubusercontent.com/learning-zone/website-templates/master'

// Real templates from learning-zone/website-templates repo
export const TEMPLATES: Template[] = [
  // Portfolio
  {
    id: '3-col-portfolio',
    name: '3 Column Portfolio',
    category: 'portfolio',
    previewUrl: `${BASE_URL}/3-col-portfolio/`,
    sourceUrl: `${RAW_URL}/3-col-portfolio/index.html`,
    tags: ['portfolio', 'minimal', 'grid'],
    description: 'Clean 3-column portfolio layout',
  },

  // Education
  {
    id: 'above-educational',
    name: 'Educational Bootstrap',
    category: 'education',
    previewUrl: `${BASE_URL}/above-educational-bootstrap-responsive-template/`,
    sourceUrl: `${RAW_URL}/above-educational-bootstrap-responsive-template/index.html`,
    tags: ['education', 'school', 'bootstrap'],
    description: 'Educational institution website template',
  },
  {
    id: 'b-school',
    name: 'B-School',
    category: 'education',
    previewUrl: `${BASE_URL}/b-school-free-education-html5-website-template/`,
    sourceUrl: `${RAW_URL}/b-school-free-education-html5-website-template/index.html`,
    tags: ['education', 'school', 'modern'],
    description: 'Modern school and education template',
  },

  // Fitness & Health
  {
    id: 'add-life-health',
    name: 'Add Life Health & Fitness',
    category: 'fitness',
    previewUrl: `${BASE_URL}/add-life-health-fitness-free-bootstrap-html5-template/`,
    sourceUrl: `${RAW_URL}/add-life-health-fitness-free-bootstrap-html5-template/index.html`,
    tags: ['fitness', 'health', 'gym'],
    description: 'Health and fitness gym template',
  },
  {
    id: 'fit-healthy',
    name: 'Fit Healthy Gym',
    category: 'fitness',
    previewUrl: `${BASE_URL}/fit-healthy-fitness-and-gym-html5-bootstrap-theme/`,
    sourceUrl: `${RAW_URL}/fit-healthy-fitness-and-gym-html5-bootstrap-theme/index.html`,
    tags: ['fitness', 'gym', 'workout'],
    description: 'Fitness and gym HTML5 theme',
  },
  {
    id: 'fitness-zone',
    name: 'Fitness Zone',
    category: 'fitness',
    previewUrl: `${BASE_URL}/fitness-zone-html5-bootstrap-responsive-web-template/`,
    sourceUrl: `${RAW_URL}/fitness-zone-html5-bootstrap-responsive-web-template/index.html`,
    tags: ['fitness', 'gym', 'responsive'],
    description: 'Responsive fitness zone template',
  },

  // Real Estate
  {
    id: 'aerosky-realestate',
    name: 'Aerosky Real Estate',
    category: 'realestate',
    previewUrl: `${BASE_URL}/aerosky-real-estate-html-responsive-website-template/`,
    sourceUrl: `${RAW_URL}/aerosky-real-estate-html-responsive-website-template/index.html`,
    tags: ['realestate', 'property', 'listings'],
    description: 'Real estate property website template',
  },
  {
    id: 'my-home-realestate',
    name: 'My Home Real Estate',
    category: 'realestate',
    previewUrl: `${BASE_URL}/free-bootstrap-template-real-estate-my-home/`,
    sourceUrl: `${RAW_URL}/free-bootstrap-template-real-estate-my-home/index.html`,
    tags: ['realestate', 'home', 'property'],
    description: 'Real estate and home listings template',
  },

  // Agency & Business
  {
    id: 'agile-agency',
    name: 'Agile Agency',
    category: 'agency',
    previewUrl: `${BASE_URL}/agile-agency-free-bootstrap-web-template/`,
    sourceUrl: `${RAW_URL}/agile-agency-free-bootstrap-web-template/index.html`,
    tags: ['agency', 'business', 'modern'],
    description: 'Modern digital agency template',
  },
  {
    id: 'creative-bee',
    name: 'Creative Bee Corporate',
    category: 'agency',
    previewUrl: `${BASE_URL}/creative-bee-corporate-free-html5-web-template/`,
    sourceUrl: `${RAW_URL}/creative-bee-corporate-free-html5-web-template/index.html`,
    tags: ['agency', 'corporate', 'creative'],
    description: 'Creative corporate agency template',
  },
  {
    id: 'businessline',
    name: 'Business Line',
    category: 'business',
    previewUrl: `${BASE_URL}/businessline-corporate-portfolio-bootstrap-responsive-web-template/`,
    sourceUrl: `${RAW_URL}/businessline-corporate-portfolio-bootstrap-responsive-web-template/index.html`,
    tags: ['business', 'corporate', 'portfolio'],
    description: 'Corporate business portfolio template',
  },
  {
    id: 'enlive-corporate',
    name: 'Enlive Corporate',
    category: 'business',
    previewUrl: `${BASE_URL}/enlive-corporate-free-html5-bootstrap-web-template/`,
    sourceUrl: `${RAW_URL}/enlive-corporate-free-html5-bootstrap-web-template/index.html`,
    tags: ['corporate', 'business', 'professional'],
    description: 'Professional corporate website template',
  },
  {
    id: 'everest-corporate',
    name: 'Everest Corporate',
    category: 'business',
    previewUrl: `${BASE_URL}/everest-corporate-business-bootstrap-template/`,
    sourceUrl: `${RAW_URL}/everest-corporate-business-bootstrap-template/index.html`,
    tags: ['corporate', 'business', 'bootstrap'],
    description: 'Corporate business Bootstrap template',
  },

  // Photography
  {
    id: 'amaze-photography',
    name: 'Amaze Photography',
    category: 'photography',
    previewUrl: `${BASE_URL}/amaze-photography-bootstrap-html5-template/`,
    sourceUrl: `${RAW_URL}/amaze-photography-bootstrap-html5-template/index.html`,
    tags: ['photography', 'portfolio', 'gallery'],
    description: 'Photography portfolio with gallery',
  },

  // Beauty & Spa
  {
    id: 'aroma-beauty-spa',
    name: 'Aroma Beauty & Spa',
    category: 'medical',
    previewUrl: `${BASE_URL}/aroma-beauty-and-spa-responsive-bootstrap-template/`,
    sourceUrl: `${RAW_URL}/aroma-beauty-and-spa-responsive-bootstrap-template/index.html`,
    tags: ['beauty', 'spa', 'wellness'],
    description: 'Beauty salon and spa template',
  },
  {
    id: 'beauty-salon',
    name: 'Beauty Salon',
    category: 'medical',
    previewUrl: `${BASE_URL}/beauty-salon-bootstrap-html5-template/`,
    sourceUrl: `${RAW_URL}/beauty-salon-bootstrap-html5-template/index.html`,
    tags: ['beauty', 'salon', 'services'],
    description: 'Beauty salon services template',
  },

  // Restaurant & Food
  {
    id: 'bestro-restaurant',
    name: 'Bestro Restaurant',
    category: 'restaurant',
    previewUrl: `${BASE_URL}/bestro-restaurant-bootstrap-html5-template/`,
    sourceUrl: `${RAW_URL}/bestro-restaurant-bootstrap-html5-template/index.html`,
    tags: ['restaurant', 'food', 'menu'],
    description: 'Restaurant with menu display',
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    category: 'restaurant',
    previewUrl: `${BASE_URL}/coffee-shop-free-html5-template/`,
    sourceUrl: `${RAW_URL}/coffee-shop-free-html5-template/index.html`,
    tags: ['coffee', 'cafe', 'shop'],
    description: 'Coffee shop and cafe template',
  },
  {
    id: 'eat-restaurant',
    name: 'Eat Restaurant',
    category: 'restaurant',
    previewUrl: `${BASE_URL}/eat-restaurant-bootstrap-html5-template/`,
    sourceUrl: `${RAW_URL}/eat-restaurant-bootstrap-html5-template/index.html`,
    tags: ['restaurant', 'food', 'dining'],
    description: 'Modern restaurant dining template',
  },
  {
    id: 'treehut-restaurant',
    name: 'Treehut Restaurant',
    category: 'restaurant',
    previewUrl: `${BASE_URL}/free-bootstrap-template-restaurant-website-treehut/`,
    sourceUrl: `${RAW_URL}/free-bootstrap-template-restaurant-website-treehut/index.html`,
    tags: ['restaurant', 'organic', 'eco'],
    description: 'Organic restaurant website template',
  },

  // Tech & Hosting
  {
    id: 'cloud-hosting',
    name: 'Cloud Hosting',
    category: 'tech',
    previewUrl: `${BASE_URL}/cloud-hosting-free-bootstrap-responsive-website-template/`,
    sourceUrl: `${RAW_URL}/cloud-hosting-free-bootstrap-responsive-website-template/index.html`,
    tags: ['hosting', 'cloud', 'tech'],
    description: 'Cloud hosting service template',
  },
  {
    id: 'foodz-app',
    name: 'Foodz App Landing',
    category: 'tech',
    previewUrl: `${BASE_URL}/foodz-mobile-app-bootstrap-landing-page/`,
    sourceUrl: `${RAW_URL}/foodz-mobile-app-bootstrap-landing-page/index.html`,
    tags: ['app', 'mobile', 'landing'],
    description: 'Mobile app landing page',
  },

  // Multi-purpose
  {
    id: 'avenger-multipurpose',
    name: 'Avenger Multi-purpose',
    category: 'business',
    previewUrl: `${BASE_URL}/avenger-multi-purpose-responsive-html5-bootstrap-template/`,
    sourceUrl: `${RAW_URL}/avenger-multi-purpose-responsive-html5-bootstrap-template/index.html`,
    tags: ['multipurpose', 'responsive', 'modern'],
    description: 'Multi-purpose responsive template',
  },
  {
    id: 'basic-multipurpose',
    name: 'Basic Multi-purpose',
    category: 'business',
    previewUrl: `${BASE_URL}/basic-free-html5-template-for-multi-purpose/`,
    sourceUrl: `${RAW_URL}/basic-free-html5-template-for-multi-purpose/index.html`,
    tags: ['multipurpose', 'minimal', 'clean'],
    description: 'Clean multi-purpose template',
  },
  {
    id: 'delight-multipurpose',
    name: 'Delight Multi-purpose',
    category: 'business',
    previewUrl: `${BASE_URL}/delight-multi-purpose-free-html5-website-template/`,
    sourceUrl: `${RAW_URL}/delight-multi-purpose-free-html5-website-template/index.html`,
    tags: ['multipurpose', 'elegant', 'business'],
    description: 'Elegant multi-purpose template',
  },
  {
    id: 'elegant-multipurpose',
    name: 'Elegant Multi-purpose',
    category: 'business',
    previewUrl: `${BASE_URL}/elegant-free-multi-purpose-bootstrap-responsive-template/`,
    sourceUrl: `${RAW_URL}/elegant-free-multi-purpose-bootstrap-responsive-template/index.html`,
    tags: ['elegant', 'multipurpose', 'bootstrap'],
    description: 'Elegant responsive template',
  },
  {
    id: 'creative-business',
    name: 'Creative Business',
    category: 'agency',
    previewUrl: `${BASE_URL}/creative-free-responsive-html5-business-template/`,
    sourceUrl: `${RAW_URL}/creative-free-responsive-html5-business-template/index.html`,
    tags: ['creative', 'business', 'responsive'],
    description: 'Creative business template',
  },
  {
    id: 'frames-corporate',
    name: 'Frames Corporate',
    category: 'business',
    previewUrl: `${BASE_URL}/frames-corporate-bootstrap-free-html5-template/`,
    sourceUrl: `${RAW_URL}/frames-corporate-bootstrap-free-html5-template/index.html`,
    tags: ['corporate', 'frames', 'professional'],
    description: 'Frames corporate template',
  },

  // Music
  {
    id: 'delite-music',
    name: 'Delite Music',
    category: 'agency',
    previewUrl: `${BASE_URL}/delite-music-html5-bootstrap-responsive-web-template/`,
    sourceUrl: `${RAW_URL}/delite-music-html5-bootstrap-responsive-web-template/index.html`,
    tags: ['music', 'entertainment', 'events'],
    description: 'Music and entertainment template',
  },
]

// Get templates by category
export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter(t => t.category === category)
}

// Search templates
export function searchTemplates(query: string): Template[] {
  const q = query.toLowerCase()
  return TEMPLATES.filter(
    t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q))
  )
}

// Fetch template HTML
export async function fetchTemplateHTML(template: Template): Promise<string> {
  try {
    const response = await fetch(template.sourceUrl)
    if (!response.ok) throw new Error('Failed to fetch template')
    return await response.text()
  } catch (error) {
    console.error('Error fetching template:', error)
    throw error
  }
}

// Match user requirements to best template
export function matchTemplate(requirements: {
  industry?: string
  style?: string
  features?: string[]
}): Template | null {
  const { industry, style, features = [] } = requirements

  // Score each template
  const scored = TEMPLATES.map(template => {
    let score = 0

    // Industry match
    if (industry && template.category.toLowerCase().includes(industry.toLowerCase())) {
      score += 10
    }

    // Tag matches
    const allTerms = [...(features || []), style, industry].filter(Boolean).map(s => s?.toLowerCase())
    for (const tag of template.tags) {
      if (allTerms.some(term => term?.includes(tag) || tag.includes(term || ''))) {
        score += 2
      }
    }

    return { template, score }
  })

  // Sort by score and return best match
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.score > 0 ? scored[0].template : null
}
