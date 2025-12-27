// Curated Image Library for AI Website Builder
// High-quality Unsplash images organized by category

export interface ImageAsset {
  id: string
  url: string
  thumbnail: string
  category: string
  tags: string[]
  author: string
  aspectRatio: '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
}

// Hero Images - Large, impactful backgrounds
export const HERO_IMAGES = {
  // Tech & SaaS
  techDark: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
  techGradient: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
  codingSetup: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80',
  serverRoom: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80',
  abstractTech: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1920&q=80',

  // Business & Corporate
  modernOffice: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
  teamMeeting: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80',
  skylineCity: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80',
  handshake: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80',

  // Creative & Design
  creativeWorkspace: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1920&q=80',
  colorfulAbstract: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80',
  designTools: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1920&q=80',

  // Restaurant & Food
  elegantDining: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
  gourmetFood: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
  coffeeCafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80',
  barRestaurant: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&q=80',

  // E-commerce & Retail
  fashionStore: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
  luxuryProducts: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80',
  shoppingBags: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80',

  // Real Estate
  luxuryHome: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
  modernInterior: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
  cityApartment: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&q=80',

  // Fitness & Wellness
  gymEquipment: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
  yogaStudio: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1920&q=80',
  runningAthlete: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1920&q=80',

  // Nature & Landscape
  mountainLake: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
  forestPath: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
  oceanSunset: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
}

// People & Team Images
export const PEOPLE_IMAGES = {
  // Professional Headshots
  professionalWoman1: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
  professionalMan1: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
  professionalWoman2: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
  professionalMan2: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  professionalWoman3: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=80',
  professionalMan3: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',

  // Casual/Friendly
  casualWoman1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  casualMan1: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  casualWoman2: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  casualMan2: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',

  // Teams
  teamWorking: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  teamCelebrating: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  teamMeeting: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
}

// Product & Feature Images
export const PRODUCT_IMAGES = {
  // Tech Products
  laptopDesk: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
  mobileApp: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
  dashboard: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  analytics: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',

  // Fashion & Lifestyle
  fashionModel: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  luxuryWatch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  sunglasses: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
  handbag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',

  // Food & Beverage
  coffeeCup: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  gourmetDish: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  wineDining: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
}

// Icon/Abstract Images
export const ABSTRACT_IMAGES = {
  gradientPurple: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80',
  gradientBlue: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80',
  gradientOrange: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&q=80',
  geometricPattern: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&q=80',
  wavesAbstract: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&q=80',
}

// Template Preview Screenshots (simulated full-page captures)
export const TEMPLATE_PREVIEWS = {
  saasModern: {
    hero: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=90',
    full: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=90',
  },
  restaurant: {
    hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=90',
    full: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=90',
  },
  agency: {
    hero: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=90',
    full: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&q=90',
  },
  ecommerce: {
    hero: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=90',
    full: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=90',
  },
  portfolio: {
    hero: 'https://images.unsplash.com/photo-1545665277-5937489579f2?w=1200&q=90',
    full: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=90',
  },
  startup: {
    hero: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=90',
    full: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=90',
  },
  fitness: {
    hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=90',
    full: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&q=90',
  },
  realestate: {
    hero: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=90',
    full: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=90',
  },
}

// Font Pairings for Templates
export const FONT_PAIRINGS = {
  modern: {
    heading: 'Inter',
    body: 'Inter',
    accent: 'Space Grotesk',
  },
  elegant: {
    heading: 'Playfair Display',
    body: 'Lora',
    accent: 'Cormorant Garamond',
  },
  bold: {
    heading: 'Bebas Neue',
    body: 'Roboto',
    accent: 'Oswald',
  },
  minimal: {
    heading: 'DM Sans',
    body: 'DM Sans',
    accent: 'JetBrains Mono',
  },
  creative: {
    heading: 'Syne',
    body: 'Work Sans',
    accent: 'Space Mono',
  },
  luxury: {
    heading: 'Cormorant Garamond',
    body: 'Montserrat',
    accent: 'Italiana',
  },
}

// Color Palettes for Templates
export const COLOR_PALETTES = {
  violet: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    accent: '#C4B5FD',
    dark: '#1E1B4B',
  },
  emerald: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#6EE7B7',
    dark: '#064E3B',
  },
  amber: {
    primary: '#F59E0B',
    secondary: '#FBBF24',
    accent: '#FCD34D',
    dark: '#78350F',
  },
  rose: {
    primary: '#F43F5E',
    secondary: '#FB7185',
    accent: '#FDA4AF',
    dark: '#881337',
  },
  slate: {
    primary: '#475569',
    secondary: '#64748B',
    accent: '#94A3B8',
    dark: '#0F172A',
  },
  indigo: {
    primary: '#6366F1',
    secondary: '#818CF8',
    accent: '#A5B4FC',
    dark: '#1E1B4B',
  },
}

// Helper to get random team members
export function getRandomTeamMembers(count: number = 4) {
  const members = [
    { name: 'Sarah Chen', role: 'CEO & Founder', image: PEOPLE_IMAGES.professionalWoman1 },
    { name: 'Marcus Johnson', role: 'CTO', image: PEOPLE_IMAGES.professionalMan1 },
    { name: 'Emily Rodriguez', role: 'Head of Design', image: PEOPLE_IMAGES.professionalWoman2 },
    { name: 'David Kim', role: 'Lead Developer', image: PEOPLE_IMAGES.professionalMan2 },
    { name: 'Jessica Williams', role: 'Marketing Director', image: PEOPLE_IMAGES.professionalWoman3 },
    { name: 'Alex Thompson', role: 'Product Manager', image: PEOPLE_IMAGES.professionalMan3 },
  ]
  return members.slice(0, count)
}

// Helper to get testimonials with images
export function getTestimonials(count: number = 3) {
  const testimonials = [
    {
      quote: "This platform transformed how we build websites. Incredible results in minutes.",
      author: "Sarah Chen",
      role: "CEO at TechFlow",
      image: PEOPLE_IMAGES.casualWoman1,
      rating: 5,
    },
    {
      quote: "The AI understands exactly what I need. It's like having a professional designer on demand.",
      author: "Marcus Johnson",
      role: "Founder at StartupXYZ",
      image: PEOPLE_IMAGES.casualMan1,
      rating: 5,
    },
    {
      quote: "We've cut our development time by 80%. The templates are stunning.",
      author: "Emily Rodriguez",
      role: "Creative Director",
      image: PEOPLE_IMAGES.casualWoman2,
      rating: 5,
    },
    {
      quote: "Best investment we've made for our marketing team. Highly recommended.",
      author: "David Kim",
      role: "Marketing Lead",
      image: PEOPLE_IMAGES.casualMan2,
      rating: 5,
    },
  ]
  return testimonials.slice(0, count)
}
