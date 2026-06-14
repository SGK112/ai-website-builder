/**
 * Luxe E-commerce Template
 * Based on luxe-coach-boutique design
 * Apple-inspired minimalist luxury e-commerce
 */

export const LUXE_ECOMMERCE_TEMPLATE = {
  id: 'luxe-ecommerce',
  name: 'Luxe E-commerce',
  description: 'Apple-inspired luxury e-commerce template with hero slider, product grids, and elegant typography',
  category: 'ecommerce',
  tags: ['luxury', 'fashion', 'minimal', 'elegant', 'apple-style'],
  preview: 'https://www.webstew.net/api/media?q=designer+handbag&w=800&h=600',

  // Variables that can be customized
  variables: {
    brandName: 'LUXE BOUTIQUE',
    tagline: 'Curated Luxury',
    heroTitle: 'The Holiday Collection',
    heroSubtitle: 'Discover the perfect gift',
    accentColor: '#bf4800',
    products: [
      { name: 'Product 1', price: '$299', image: 'https://www.webstew.net/api/media?q=premium+jewelry&w=400&h=500' },
      { name: 'Product 2', price: '$349', image: 'https://www.webstew.net/api/media?q=elegant+watch&w=400&h=500' },
      { name: 'Product 3', price: '$199', image: 'https://www.webstew.net/api/media?q=luxury+boutique+interior&w=400&h=500' },
      { name: 'Product 4', price: '$449', image: 'https://www.webstew.net/api/media?q=high+fashion+model&w=400&h=500' },
    ]
  },

  // The HTML template
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{brandName}} - {{tagline}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent: {{accentColor}};
      --white: #ffffff;
      --white-soft: #fafafa;
      --gray-medium: #86868b;
      --black-soft: #1d1d1f;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: var(--black-soft);
      background: var(--white);
    }
    .font-display { font-family: 'Playfair Display', Georgia, serif; }
    .container-main { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
    @media (min-width: 768px) { .container-main { padding: 0 60px; } }

    @keyframes kenBurns {
      0% { transform: scale(1); }
      100% { transform: scale(1.08); }
    }
  </style>
</head>
<body>

<!-- Navigation -->
<nav class="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50">
  <div class="container-main">
    <div class="flex items-center justify-between h-16 md:h-20">
      <!-- Logo -->
      <a href="#" class="text-lg md:text-xl font-medium tracking-wider">{{brandName}}</a>

      <!-- Desktop Nav -->
      <div class="hidden md:flex items-center gap-10">
        <a href="#" class="text-sm text-gray-600 hover:text-black transition">New</a>
        <a href="#" class="text-sm text-gray-600 hover:text-black transition">Shop</a>
        <a href="#" class="text-sm text-gray-600 hover:text-black transition">Collections</a>
        <a href="#" class="text-sm text-gray-600 hover:text-black transition">Sale</a>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-gray-100 rounded-full transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
        <button class="p-2 hover:bg-gray-100 rounded-full transition relative">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <span class="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">2</span>
        </button>
      </div>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="relative w-full h-[70vh] md:h-[90vh] min-h-[500px] max-h-[1000px] bg-black overflow-hidden">
  <!-- Background Image -->
  <div class="absolute inset-[-5%]" style="animation: kenBurns 12s ease-in-out infinite alternate">
    <img src="https://www.webstew.net/api/media?q=luxury+fashion+product&w=1920&h=600"
         alt="" class="w-full h-full object-cover">
  </div>

  <!-- Overlays -->
  <div class="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-black/50"></div>
  <div class="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/70 to-transparent"></div>

  <!-- Content -->
  <div class="absolute inset-0 flex items-center justify-center text-center text-white px-6">
    <div class="max-w-3xl">
      <!-- Accent Line -->
      <div class="w-16 h-0.5 mx-auto mb-6" style="background: linear-gradient(90deg, var(--accent), transparent)"></div>

      <!-- Subtitle -->
      <p class="text-xs md:text-sm tracking-[0.3em] uppercase mb-4 opacity-85">{{heroSubtitle}}</p>

      <!-- Title -->
      <h1 class="font-display text-4xl md:text-6xl lg:text-7xl font-normal tracking-wide mb-10 leading-tight">
        {{heroTitle}}
      </h1>

      <!-- CTA -->
      <a href="#products" class="inline-flex items-center gap-3 bg-white text-black px-12 py-5 text-xs tracking-[0.2em] uppercase font-medium rounded-full hover:bg-gray-100 transition shadow-2xl">
        Shop Now
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </a>
    </div>
  </div>

  <!-- Scroll Indicator -->
  <div class="absolute bottom-12 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/60">
    <span class="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
    <div class="w-px h-10 bg-white/30"></div>
  </div>
</section>

<!-- Features Bar -->
<section class="border-b border-gray-100">
  <div class="container-main">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
      <div class="flex items-center justify-center gap-3">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
        </svg>
        <span class="text-xs text-gray-500 tracking-wide">Free Shipping $150+</span>
      </div>
      <div class="flex items-center justify-center gap-3">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span class="text-xs text-gray-500 tracking-wide">30-Day Returns</span>
      </div>
      <div class="flex items-center justify-center gap-3">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <span class="text-xs text-gray-500 tracking-wide">100% Authentic</span>
      </div>
      <div class="flex items-center justify-center gap-3">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
        <span class="text-xs text-gray-500 tracking-wide">Secure Checkout</span>
      </div>
    </div>
  </div>
</section>

<!-- New Arrivals -->
<section id="products" class="py-20 md:py-28">
  <div class="container-main">
    <!-- Section Header -->
    <div class="text-center mb-12 md:mb-16">
      <p class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4">Just In</p>
      <h2 class="font-display text-3xl md:text-4xl font-normal">New Arrivals</h2>
    </div>

    <!-- Product Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
      <!-- Product Card 1 -->
      <div class="group cursor-pointer">
        <div class="relative aspect-[4/5] bg-gray-100 mb-4 overflow-hidden">
          <img src="https://www.webstew.net/api/media?q=silk+scarf+luxury&w=400&h=500" alt="Product"
               class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
          <button class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur py-3 text-xs tracking-[0.15em] uppercase font-medium opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
            Quick Add
          </button>
          <span class="absolute top-4 left-4 bg-black text-white text-[10px] tracking-wider px-3 py-1">NEW</span>
        </div>
        <h3 class="text-sm font-medium mb-1">Designer Handbag</h3>
        <p class="text-sm text-gray-500">$299</p>
      </div>

      <!-- Product Card 2 -->
      <div class="group cursor-pointer">
        <div class="relative aspect-[4/5] bg-gray-100 mb-4 overflow-hidden">
          <img src="https://www.webstew.net/api/media?q=perfume+bottle+elegant&w=400&h=500" alt="Product"
               class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
          <button class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur py-3 text-xs tracking-[0.15em] uppercase font-medium opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
            Quick Add
          </button>
        </div>
        <h3 class="text-sm font-medium mb-1">Leather Tote</h3>
        <p class="text-sm text-gray-500">$349</p>
      </div>

      <!-- Product Card 3 -->
      <div class="group cursor-pointer">
        <div class="relative aspect-[4/5] bg-gray-100 mb-4 overflow-hidden">
          <img src="https://www.webstew.net/api/media?q=luxury+fashion+product&w=400&h=500" alt="Product"
               class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
          <button class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur py-3 text-xs tracking-[0.15em] uppercase font-medium opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
            Quick Add
          </button>
          <span class="absolute top-4 left-4 text-[10px] tracking-wider px-3 py-1" style="background: var(--accent); color: white;">SALE</span>
        </div>
        <h3 class="text-sm font-medium mb-1">Crossbody Bag</h3>
        <p class="text-sm"><span class="text-gray-400 line-through mr-2">$249</span><span style="color: var(--accent)">$199</span></p>
      </div>

      <!-- Product Card 4 -->
      <div class="group cursor-pointer">
        <div class="relative aspect-[4/5] bg-gray-100 mb-4 overflow-hidden">
          <img src="https://www.webstew.net/api/media?q=designer+handbag&w=400&h=500" alt="Product"
               class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
          <button class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur py-3 text-xs tracking-[0.15em] uppercase font-medium opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
            Quick Add
          </button>
        </div>
        <h3 class="text-sm font-medium mb-1">Premium Clutch</h3>
        <p class="text-sm text-gray-500">$449</p>
      </div>
    </div>

    <!-- View All -->
    <div class="text-center mt-12">
      <a href="#" class="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">
        View All Products
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </a>
    </div>
  </div>
</section>

<!-- Categories -->
<section class="py-20 md:py-28 bg-gray-50">
  <div class="container-main">
    <div class="text-center mb-12">
      <p class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4">Explore</p>
      <h2 class="font-display text-3xl md:text-4xl font-normal">Shop by Category</h2>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      <a href="#" class="group relative aspect-[3/4] overflow-hidden">
        <img src="https://www.webstew.net/api/media?q=premium+jewelry&w=600&h=800" alt="Handbags" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
        <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-white text-lg md:text-xl font-display tracking-wider">Handbags</span>
        </div>
      </a>
      <a href="#" class="group relative aspect-[3/4] overflow-hidden">
        <img src="https://www.webstew.net/api/media?q=elegant+watch&w=600&h=800" alt="Wallets" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
        <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-white text-lg md:text-xl font-display tracking-wider">Wallets</span>
        </div>
      </a>
      <a href="#" class="group relative aspect-[3/4] overflow-hidden col-span-2 md:col-span-1">
        <img src="https://www.webstew.net/api/media?q=luxury+boutique+interior&w=600&h=800" alt="Accessories" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
        <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-white text-lg md:text-xl font-display tracking-wider">Accessories</span>
        </div>
      </a>
    </div>
  </div>
</section>

<!-- Sale Banner -->
<section class="py-24 md:py-32 bg-[#1d1d1f] text-white">
  <div class="container-main text-center">
    <p class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4">Limited Time</p>
    <h2 class="font-display text-4xl md:text-5xl font-normal mb-6">Holiday Sale</h2>
    <p class="text-gray-400 max-w-md mx-auto mb-10">
      Up to 40% off select designer pieces. The perfect gift awaits.
    </p>
    <a href="#" class="inline-block bg-white text-black px-12 py-5 text-xs tracking-[0.2em] uppercase font-medium hover:bg-gray-100 transition">
      Shop Sale
    </a>
  </div>
</section>

<!-- Footer -->
<footer class="py-16 md:py-20 bg-gray-50">
  <div class="container-main">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
      <div class="col-span-2 md:col-span-1">
        <h3 class="text-lg font-medium tracking-wider mb-6">{{brandName}}</h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          Curated luxury fashion and accessories for the modern individual.
        </p>
      </div>
      <div>
        <h4 class="text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">Shop</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-sm text-gray-600 hover:text-black transition">New Arrivals</a></li>
          <li><a href="#" class="text-sm text-gray-600 hover:text-black transition">Bestsellers</a></li>
          <li><a href="#" class="text-sm text-gray-600 hover:text-black transition">Sale</a></li>
          <li><a href="#" class="text-sm text-gray-600 hover:text-black transition">All Products</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">Help</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-sm text-gray-600 hover:text-black transition">Contact Us</a></li>
          <li><a href="#" class="text-sm text-gray-600 hover:text-black transition">Shipping</a></li>
          <li><a href="#" class="text-sm text-gray-600 hover:text-black transition">Returns</a></li>
          <li><a href="#" class="text-sm text-gray-600 hover:text-black transition">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">Newsletter</h4>
        <p class="text-sm text-gray-500 mb-4">Subscribe for exclusive offers.</p>
        <form class="flex gap-2">
          <input type="email" placeholder="Email" class="flex-1 px-4 py-3 text-sm bg-white border border-gray-200 focus:outline-none focus:border-gray-400 transition">
          <button type="submit" class="px-6 py-3 bg-black text-white text-xs tracking-wider uppercase hover:bg-gray-800 transition">
            Join
          </button>
        </form>
      </div>
    </div>

    <div class="pt-10 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-xs text-gray-400">&copy; 2024 {{brandName}}. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <a href="#" class="text-gray-400 hover:text-black transition">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
        </a>
        <a href="#" class="text-gray-400 hover:text-black transition">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>
        <a href="#" class="text-gray-400 hover:text-black transition">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

</body>
</html>`
};

export default LUXE_ECOMMERCE_TEMPLATE;
