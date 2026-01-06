import { NextResponse } from 'next/server'

export async function GET() {
  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coffee Shop - Test</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white">
  <!-- Hero with image -->
  <section class="min-h-[60vh] relative flex items-center justify-center">
    <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920" alt="Hero" class="absolute inset-0 w-full h-full object-cover opacity-40">
    <div class="relative z-10 text-center px-6">
      <h1 class="text-5xl font-bold mb-4">Brew & Bean</h1>
      <p class="text-xl text-slate-300 mb-8">Artisan Coffee Since 2010</p>
      <a href="#menu" class="px-8 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-semibold">View Menu</a>
    </div>
  </section>

  <!-- Menu with images -->
  <section id="menu" class="py-20 px-6 max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-center mb-12">Our Menu</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-slate-900 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400" alt="Espresso" class="w-full h-48 object-cover">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Espresso</h3>
          <p class="text-slate-400 mb-4">Rich and bold single shot</p>
          <span class="text-amber-500 font-bold text-lg">$3.50</span>
        </div>
      </div>
      <div class="bg-slate-900 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" alt="Cappuccino" class="w-full h-48 object-cover">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Cappuccino</h3>
          <p class="text-slate-400 mb-4">Creamy foam perfection</p>
          <span class="text-amber-500 font-bold text-lg">$4.50</span>
        </div>
      </div>
      <div class="bg-slate-900 rounded-2xl overflow-hidden">
        <img src="https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400" alt="Latte" class="w-full h-48 object-cover">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Caramel Latte</h3>
          <p class="text-slate-400 mb-4">Sweet and smooth</p>
          <span class="text-amber-500 font-bold text-lg">$5.00</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-8 text-center text-slate-500 border-t border-slate-800">
    <p>&copy; 2024 Brew & Bean. Drag images from the sidebar to replace these!</p>
  </footer>
</body>
</html>`

  return NextResponse.json({ html: testHtml })
}
