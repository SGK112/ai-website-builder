/**
 * Fashion Store Template
 * Modern fashion e-commerce with bold typography and clean layout
 */

export const FASHION_STORE_TEMPLATE = {
  id: 'fashion-store',
  name: 'Fashion Store',
  description: 'Bold modern fashion store with dynamic layouts, product filters, and shopping cart',
  category: 'ecommerce' as const,
  tags: ['fashion', 'clothing', 'modern', 'bold', 'shopping'],
  preview: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop',

  variables: {
    brandName: 'VOGUE STYLE',
    tagline: 'Define Your Style',
    heroTitle: 'NEW SEASON',
    heroSubtitle: 'Shop the latest trends',
    primaryColor: '#000000',
    accentColor: '#ff4081',
    products: [
      { name: 'Casual Blazer', price: '$189', originalPrice: '$249', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', category: 'Women' },
      { name: 'Denim Jacket', price: '$129', image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=500&fit=crop', category: 'Men' },
      { name: 'Summer Dress', price: '$159', image: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400&h=500&fit=crop', category: 'Women' },
      { name: 'Leather Bag', price: '$299', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop', category: 'Accessories' },
    ]
  },

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{brandName}} - {{tagline}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: {{primaryColor}};
      --accent: {{accentColor}};
    }
    body { font-family: 'Inter', sans-serif; }
    .font-display { font-family: 'Bebas Neue', sans-serif; }
  </style>
</head>
<body class="bg-white">

<!-- Header -->
<header class="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-8">
        <a href="#" class="font-display text-2xl tracking-wider">{{brandName}}</a>
        <nav class="hidden md:flex items-center gap-6">
          <a href="#" class="text-sm hover:text-pink-500 transition">Women</a>
          <a href="#" class="text-sm hover:text-pink-500 transition">Men</a>
          <a href="#" class="text-sm hover:text-pink-500 transition">Kids</a>
          <a href="#" class="text-sm text-pink-500 font-medium">Sale</a>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-gray-100 rounded-full">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
        <button class="p-2 hover:bg-gray-100 rounded-full">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        <button class="p-2 hover:bg-gray-100 rounded-full relative">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <span class="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- Hero Section -->
<section class="pt-16 relative min-h-[80vh] flex items-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
  <div class="absolute inset-0">
    <img src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920&h=1080&fit=crop"
         alt="Hero" class="w-full h-full object-cover opacity-30">
  </div>
  <div class="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-20">
    <div class="max-w-2xl">
      <span class="inline-block px-4 py-1 bg-pink-500 text-white text-sm font-medium rounded-full mb-4">
        New Arrivals
      </span>
      <h1 class="font-display text-6xl md:text-8xl tracking-wide mb-4">{{heroTitle}}</h1>
      <p class="text-xl text-gray-600 mb-8">{{heroSubtitle}}</p>
      <div class="flex gap-4">
        <a href="#products" class="px-8 py-4 bg-black text-white font-medium hover:bg-gray-800 transition">
          SHOP NOW
        </a>
        <a href="#" class="px-8 py-4 border-2 border-black font-medium hover:bg-black hover:text-white transition">
          VIEW LOOKBOOK
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Categories -->
<section class="py-16 px-4 md:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="grid md:grid-cols-3 gap-6">
      <a href="#" class="group relative h-80 overflow-hidden bg-gray-100 rounded-lg">
        <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=400&fit=crop"
             alt="Women" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-black/30 flex items-end p-6">
          <div>
            <h3 class="font-display text-3xl text-white mb-2">WOMEN</h3>
            <span class="text-white/80 text-sm">125 Products</span>
          </div>
        </div>
      </a>
      <a href="#" class="group relative h-80 overflow-hidden bg-gray-100 rounded-lg">
        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop"
             alt="Men" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-black/30 flex items-end p-6">
          <div>
            <h3 class="font-display text-3xl text-white mb-2">MEN</h3>
            <span class="text-white/80 text-sm">98 Products</span>
          </div>
        </div>
      </a>
      <a href="#" class="group relative h-80 overflow-hidden bg-gray-100 rounded-lg">
        <img src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop"
             alt="Accessories" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute inset-0 bg-black/30 flex items-end p-6">
          <div>
            <h3 class="font-display text-3xl text-white mb-2">ACCESSORIES</h3>
            <span class="text-white/80 text-sm">64 Products</span>
          </div>
        </div>
      </a>
    </div>
  </div>
</section>

<!-- Featured Products -->
<section id="products" class="py-16 px-4 md:px-8 bg-gray-50">
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-10">
      <h2 class="font-display text-4xl">TRENDING NOW</h2>
      <div class="flex gap-2">
        <button class="px-4 py-2 text-sm bg-black text-white rounded-full">All</button>
        <button class="px-4 py-2 text-sm hover:bg-gray-200 rounded-full transition">Women</button>
        <button class="px-4 py-2 text-sm hover:bg-gray-200 rounded-full transition">Men</button>
        <button class="px-4 py-2 text-sm hover:bg-gray-200 rounded-full transition">Accessories</button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div class="group">
        <div class="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop"
               alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute top-3 left-3 px-2 py-1 bg-pink-500 text-white text-xs font-medium rounded">
            SALE
          </div>
          <button class="absolute top-3 right-3 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <button class="absolute bottom-3 left-3 right-3 py-3 bg-black text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition">
            ADD TO CART
          </button>
        </div>
        <span class="text-xs text-gray-500 uppercase">Women</span>
        <h3 class="font-medium mb-1">Casual Blazer</h3>
        <div class="flex items-center gap-2">
          <span class="text-pink-500 font-semibold">$189</span>
          <span class="text-gray-400 line-through text-sm">$249</span>
        </div>
      </div>

      <div class="group">
        <div class="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img src="https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=500&fit=crop"
               alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <button class="absolute top-3 right-3 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <button class="absolute bottom-3 left-3 right-3 py-3 bg-black text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition">
            ADD TO CART
          </button>
        </div>
        <span class="text-xs text-gray-500 uppercase">Men</span>
        <h3 class="font-medium mb-1">Denim Jacket</h3>
        <span class="font-semibold">$129</span>
      </div>

      <div class="group">
        <div class="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img src="https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400&h=500&fit=crop"
               alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute top-3 left-3 px-2 py-1 bg-black text-white text-xs font-medium rounded">
            NEW
          </div>
          <button class="absolute top-3 right-3 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <button class="absolute bottom-3 left-3 right-3 py-3 bg-black text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition">
            ADD TO CART
          </button>
        </div>
        <span class="text-xs text-gray-500 uppercase">Women</span>
        <h3 class="font-medium mb-1">Summer Dress</h3>
        <span class="font-semibold">$159</span>
      </div>

      <div class="group">
        <div class="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop"
               alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <button class="absolute top-3 right-3 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <button class="absolute bottom-3 left-3 right-3 py-3 bg-black text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition">
            ADD TO CART
          </button>
        </div>
        <span class="text-xs text-gray-500 uppercase">Accessories</span>
        <h3 class="font-medium mb-1">Leather Bag</h3>
        <span class="font-semibold">$299</span>
      </div>
    </div>
  </div>
</section>

<!-- Newsletter -->
<section class="py-20 px-4 md:px-8 bg-black text-white">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="font-display text-4xl md:text-5xl mb-4">JOIN THE CLUB</h2>
    <p class="text-gray-400 mb-8">Subscribe to get 15% off your first order and exclusive access to new arrivals</p>
    <form class="flex gap-3 max-w-md mx-auto">
      <input type="email" placeholder="Enter your email"
             class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500">
      <button type="submit" class="px-8 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-medium transition">
        SUBSCRIBE
      </button>
    </form>
  </div>
</section>

<!-- Footer -->
<footer class="bg-gray-900 text-white py-16 px-4 md:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="grid md:grid-cols-4 gap-10 mb-12">
      <div>
        <h3 class="font-display text-2xl mb-4">{{brandName}}</h3>
        <p class="text-gray-400 text-sm">Your destination for curated fashion and timeless style.</p>
      </div>
      <div>
        <h4 class="font-medium mb-4">SHOP</h4>
        <ul class="space-y-2 text-gray-400 text-sm">
          <li><a href="#" class="hover:text-white transition">Women</a></li>
          <li><a href="#" class="hover:text-white transition">Men</a></li>
          <li><a href="#" class="hover:text-white transition">Kids</a></li>
          <li><a href="#" class="hover:text-white transition">Accessories</a></li>
          <li><a href="#" class="hover:text-white transition">Sale</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-medium mb-4">HELP</h4>
        <ul class="space-y-2 text-gray-400 text-sm">
          <li><a href="#" class="hover:text-white transition">Customer Service</a></li>
          <li><a href="#" class="hover:text-white transition">Track Order</a></li>
          <li><a href="#" class="hover:text-white transition">Returns</a></li>
          <li><a href="#" class="hover:text-white transition">Size Guide</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-medium mb-4">FOLLOW US</h4>
        <div class="flex gap-4">
          <a href="#" class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-pink-500 transition">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-pink-500 transition">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
          </a>
          <a href="#" class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-pink-500 transition">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div class="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-gray-400 text-sm">&copy; 2024 {{brandName}}. All rights reserved.</p>
      <div class="flex gap-6 text-sm text-gray-400">
        <a href="#" class="hover:text-white transition">Privacy Policy</a>
        <a href="#" class="hover:text-white transition">Terms of Service</a>
      </div>
    </div>
  </div>
</footer>

</body>
</html>`
}
