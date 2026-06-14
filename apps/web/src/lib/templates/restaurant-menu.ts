/**
 * Restaurant Menu Template
 * Modern restaurant with menu, reservations, and ordering
 */

export const RESTAURANT_MENU_TEMPLATE = {
  id: 'restaurant-menu',
  name: 'Restaurant Menu',
  description: 'Elegant restaurant template with menu sections, reservation system, and online ordering',
  category: 'restaurant' as const,
  tags: ['restaurant', 'food', 'menu', 'reservation', 'ordering'],
  preview: 'https://www.webstew.net/api/media?q=fine+dining+plated+dish&w=800&h=600',

  variables: {
    restaurantName: 'La Cuisine',
    tagline: 'Fine Dining Experience',
    heroTitle: 'Where Every Meal Becomes a Memory',
    primaryColor: '#c9a962',
    menuItems: [
      { name: 'Grilled Salmon', price: '$32', description: 'Fresh Atlantic salmon with herbs', category: 'Main' },
      { name: 'Beef Tenderloin', price: '$45', description: 'Prime cut with red wine reduction', category: 'Main' },
      { name: 'Truffle Pasta', price: '$28', description: 'Handmade pasta with black truffle', category: 'Main' },
      { name: 'Crème Brûlée', price: '$12', description: 'Classic vanilla custard', category: 'Dessert' },
    ]
  },

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{restaurantName}} - {{tagline}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root { --gold: {{primaryColor}}; }
    body { font-family: 'Montserrat', sans-serif; }
    .font-serif { font-family: 'Cormorant Garamond', serif; }
  </style>
</head>
<body class="bg-stone-900 text-white">

<!-- Navigation -->
<nav class="fixed top-0 w-full bg-stone-900/95 backdrop-blur-md z-50 border-b border-white/10">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <div class="flex items-center justify-between h-20">
      <a href="#" class="font-serif text-2xl md:text-3xl tracking-wide" style="color: var(--gold)">{{restaurantName}}</a>
      <nav class="hidden md:flex items-center gap-8">
        <a href="#about" class="text-sm tracking-wider hover:text-[var(--gold)] transition">ABOUT</a>
        <a href="#menu" class="text-sm tracking-wider hover:text-[var(--gold)] transition">MENU</a>
        <a href="#gallery" class="text-sm tracking-wider hover:text-[var(--gold)] transition">GALLERY</a>
        <a href="#contact" class="text-sm tracking-wider hover:text-[var(--gold)] transition">CONTACT</a>
      </nav>
      <a href="#reservations" class="px-6 py-2.5 border border-[var(--gold)] text-[var(--gold)] text-sm tracking-wider hover:bg-[var(--gold)] hover:text-stone-900 transition">
        RESERVE
      </a>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="relative min-h-screen flex items-center justify-center">
  <div class="absolute inset-0">
    <img src="https://www.webstew.net/api/media?q=gourmet+food+closeup&w=1920&h=1080"
         alt="Restaurant" class="w-full h-full object-cover">
    <div class="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-stone-900/40"></div>
  </div>
  <div class="relative z-10 text-center px-4 max-w-4xl mx-auto">
    <span class="inline-block text-[var(--gold)] text-sm tracking-[0.3em] uppercase mb-6">EST. 2010</span>
    <h1 class="font-serif text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight">{{heroTitle}}</h1>
    <p class="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
      Experience culinary excellence in an atmosphere of refined elegance. Our chefs craft each dish with passion and the finest ingredients.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#menu" class="px-8 py-4 bg-[var(--gold)] text-stone-900 font-medium tracking-wider hover:bg-[var(--gold)]/90 transition">
        VIEW MENU
      </a>
      <a href="#reservations" class="px-8 py-4 border-2 border-white/30 tracking-wider hover:border-white hover:bg-white/10 transition">
        MAKE RESERVATION
      </a>
    </div>
  </div>
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
    <svg class="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
    </svg>
  </div>
</section>

<!-- About Section -->
<section id="about" class="py-24 px-4 md:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div class="relative">
        <img src="https://www.webstew.net/api/media?q=elegant+restaurant+interior&w=600&h=800"
             alt="Chef" class="w-full rounded-lg">
        <div class="absolute -bottom-6 -right-6 w-48 h-48 border-2 border-[var(--gold)] rounded-lg -z-10"></div>
      </div>
      <div>
        <span class="text-[var(--gold)] text-sm tracking-[0.3em] uppercase">OUR STORY</span>
        <h2 class="font-serif text-4xl md:text-5xl mt-4 mb-6">A Legacy of Culinary Excellence</h2>
        <p class="text-white/70 mb-6 leading-relaxed">
          Since 2010, {{restaurantName}} has been dedicated to creating unforgettable dining experiences. Our passion for exceptional cuisine, combined with impeccable service, has made us a destination for food lovers.
        </p>
        <p class="text-white/70 mb-8 leading-relaxed">
          Every dish tells a story of tradition, innovation, and the finest seasonal ingredients sourced from local farmers and artisans.
        </p>
        <div class="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
          <div class="text-center">
            <span class="font-serif text-3xl text-[var(--gold)]">14+</span>
            <p class="text-sm text-white/50 mt-1">Years</p>
          </div>
          <div class="text-center">
            <span class="font-serif text-3xl text-[var(--gold)]">50K+</span>
            <p class="text-sm text-white/50 mt-1">Guests</p>
          </div>
          <div class="text-center">
            <span class="font-serif text-3xl text-[var(--gold)]">5</span>
            <p class="text-sm text-white/50 mt-1">Awards</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Menu Section -->
<section id="menu" class="py-24 px-4 md:px-8 bg-stone-800">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <span class="text-[var(--gold)] text-sm tracking-[0.3em] uppercase">DISCOVER</span>
      <h2 class="font-serif text-4xl md:text-5xl mt-4">Our Menu</h2>
    </div>

    <!-- Menu Tabs -->
    <div class="flex justify-center gap-4 mb-12">
      <button class="px-6 py-2 bg-[var(--gold)] text-stone-900 font-medium text-sm tracking-wider">STARTERS</button>
      <button class="px-6 py-2 border border-white/20 text-white/70 font-medium text-sm tracking-wider hover:border-[var(--gold)] hover:text-[var(--gold)] transition">MAIN COURSES</button>
      <button class="px-6 py-2 border border-white/20 text-white/70 font-medium text-sm tracking-wider hover:border-[var(--gold)] hover:text-[var(--gold)] transition">DESSERTS</button>
      <button class="px-6 py-2 border border-white/20 text-white/70 font-medium text-sm tracking-wider hover:border-[var(--gold)] hover:text-[var(--gold)] transition">DRINKS</button>
    </div>

    <!-- Menu Items -->
    <div class="grid md:grid-cols-2 gap-x-12 gap-y-8">
      <div class="flex gap-4 p-4 hover:bg-white/5 rounded-lg transition group">
        <img src="https://www.webstew.net/api/media?q=chef+cooking+kitchen&w=120&h=120"
             alt="Dish" class="w-24 h-24 rounded-lg object-cover">
        <div class="flex-1">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-serif text-xl group-hover:text-[var(--gold)] transition">Grilled Salmon</h3>
            <span class="text-[var(--gold)] font-medium">$32</span>
          </div>
          <p class="text-white/60 text-sm">Fresh Atlantic salmon with lemon herbs, served with seasonal vegetables and truffle mash</p>
        </div>
      </div>

      <div class="flex gap-4 p-4 hover:bg-white/5 rounded-lg transition group">
        <img src="https://www.webstew.net/api/media?q=pasta+gourmet&w=120&h=120"
             alt="Dish" class="w-24 h-24 rounded-lg object-cover">
        <div class="flex-1">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-serif text-xl group-hover:text-[var(--gold)] transition">Beef Tenderloin</h3>
            <span class="text-[var(--gold)] font-medium">$45</span>
          </div>
          <p class="text-white/60 text-sm">Prime cut beef with red wine reduction, roasted potatoes and grilled asparagus</p>
        </div>
      </div>

      <div class="flex gap-4 p-4 hover:bg-white/5 rounded-lg transition group">
        <img src="https://www.webstew.net/api/media?q=steak+fine+dining&w=120&h=120"
             alt="Dish" class="w-24 h-24 rounded-lg object-cover">
        <div class="flex-1">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-serif text-xl group-hover:text-[var(--gold)] transition">Truffle Pasta</h3>
            <span class="text-[var(--gold)] font-medium">$28</span>
          </div>
          <p class="text-white/60 text-sm">Handmade tagliatelle with black truffle, parmesan cream and wild mushrooms</p>
        </div>
      </div>

      <div class="flex gap-4 p-4 hover:bg-white/5 rounded-lg transition group">
        <img src="https://www.webstew.net/api/media?q=dessert+plating&w=120&h=120"
             alt="Dish" class="w-24 h-24 rounded-lg object-cover">
        <div class="flex-1">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-serif text-xl group-hover:text-[var(--gold)] transition">Lobster Risotto</h3>
            <span class="text-[var(--gold)] font-medium">$48</span>
          </div>
          <p class="text-white/60 text-sm">Creamy arborio rice with fresh lobster, saffron and a touch of champagne</p>
        </div>
      </div>

      <div class="flex gap-4 p-4 hover:bg-white/5 rounded-lg transition group">
        <img src="https://www.webstew.net/api/media?q=wine+glass+dining&w=120&h=120"
             alt="Dish" class="w-24 h-24 rounded-lg object-cover">
        <div class="flex-1">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-serif text-xl group-hover:text-[var(--gold)] transition">Duck Confit</h3>
            <span class="text-[var(--gold)] font-medium">$38</span>
          </div>
          <p class="text-white/60 text-sm">Slow-cooked duck leg with orange glaze, pommes sarladaises and red cabbage</p>
        </div>
      </div>

      <div class="flex gap-4 p-4 hover:bg-white/5 rounded-lg transition group">
        <img src="https://www.webstew.net/api/media?q=fine+dining+plated+dish&w=120&h=120"
             alt="Dish" class="w-24 h-24 rounded-lg object-cover">
        <div class="flex-1">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-serif text-xl group-hover:text-[var(--gold)] transition">Crème Brûlée</h3>
            <span class="text-[var(--gold)] font-medium">$12</span>
          </div>
          <p class="text-white/60 text-sm">Classic vanilla bean custard with caramelized sugar crust and fresh berries</p>
        </div>
      </div>
    </div>

    <div class="text-center mt-12">
      <a href="#" class="inline-flex items-center gap-2 px-8 py-3 border border-[var(--gold)] text-[var(--gold)] tracking-wider hover:bg-[var(--gold)] hover:text-stone-900 transition">
        VIEW FULL MENU
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </a>
    </div>
  </div>
</section>

<!-- Reservation Section -->
<section id="reservations" class="py-24 px-4 md:px-8">
  <div class="max-w-6xl mx-auto">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <span class="text-[var(--gold)] text-sm tracking-[0.3em] uppercase">RESERVATIONS</span>
        <h2 class="font-serif text-4xl md:text-5xl mt-4 mb-6">Book Your Table</h2>
        <p class="text-white/70 mb-8">
          Join us for an unforgettable dining experience. Reserve your table today and let us take care of the rest.
        </p>

        <form class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Your Name"
                   class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-[var(--gold)]">
            <input type="email" placeholder="Email Address"
                   class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-[var(--gold)]">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <input type="date"
                   class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-[var(--gold)]">
            <select class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-[var(--gold)]">
              <option value="" disabled selected>Time</option>
              <option value="18:00">6:00 PM</option>
              <option value="18:30">6:30 PM</option>
              <option value="19:00">7:00 PM</option>
              <option value="19:30">7:30 PM</option>
              <option value="20:00">8:00 PM</option>
              <option value="20:30">8:30 PM</option>
              <option value="21:00">9:00 PM</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <input type="tel" placeholder="Phone Number"
                   class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-[var(--gold)]">
            <select class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-[var(--gold)]">
              <option value="" disabled selected>Guests</option>
              <option value="1">1 Person</option>
              <option value="2">2 People</option>
              <option value="3">3 People</option>
              <option value="4">4 People</option>
              <option value="5">5 People</option>
              <option value="6">6+ People</option>
            </select>
          </div>
          <textarea placeholder="Special Requests" rows="3"
                    class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-[var(--gold)]"></textarea>
          <button type="submit" class="w-full py-4 bg-[var(--gold)] text-stone-900 font-medium tracking-wider hover:bg-[var(--gold)]/90 transition">
            CONFIRM RESERVATION
          </button>
        </form>
      </div>
      <div class="relative hidden md:block">
        <img src="https://www.webstew.net/api/media?q=gourmet+food+closeup&w=600&h=700"
             alt="Restaurant Interior" class="w-full rounded-lg">
      </div>
    </div>
  </div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-20 px-4 md:px-8 bg-stone-800">
  <div class="max-w-6xl mx-auto">
    <div class="grid md:grid-cols-3 gap-8 text-center">
      <div>
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
          <svg class="w-7 h-7 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h3 class="font-serif text-xl mb-2">Location</h3>
        <p class="text-white/60">123 Gourmet Street<br>New York, NY 10012</p>
      </div>
      <div>
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
          <svg class="w-7 h-7 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="font-serif text-xl mb-2">Hours</h3>
        <p class="text-white/60">Tue - Sat: 6PM - 11PM<br>Sun - Mon: Closed</p>
      </div>
      <div>
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
          <svg class="w-7 h-7 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
        </div>
        <h3 class="font-serif text-xl mb-2">Contact</h3>
        <p class="text-white/60">(555) 123-4567<br>hello@lacuisine.com</p>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="py-12 px-4 md:px-8 border-t border-white/10">
  <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
    <a href="#" class="font-serif text-2xl" style="color: var(--gold)">{{restaurantName}}</a>
    <p class="text-white/40 text-sm">&copy; 2024 {{restaurantName}}. All rights reserved.</p>
    <div class="flex gap-4">
      <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--gold)] transition">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>
      </a>
      <a href="#" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--gold)] transition">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
      </a>
    </div>
  </div>
</footer>

</body>
</html>`
}
