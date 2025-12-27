'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Layout,
  Grid3X3,
  MessageSquare,
  DollarSign,
  Mail,
  ChevronDown,
  Plus,
  Zap,
  BarChart3,
  Video,
  ShoppingCart,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComponentTemplate {
  id: string
  name: string
  category: string
  icon: React.ElementType
  preview: string
  description: string
  tags: string[]
  html: string
  isPro?: boolean
}

interface ComponentLibraryProps {
  onInsertComponent: (template: ComponentTemplate) => void
}

const COMPONENT_CATEGORIES = [
  { id: 'hero', name: 'Hero Sections', icon: Layout },
  { id: 'features', name: 'Features', icon: Grid3X3 },
  { id: 'testimonials', name: 'Testimonials', icon: MessageSquare },
  { id: 'pricing', name: 'Pricing', icon: DollarSign },
  { id: 'cta', name: 'Call to Action', icon: Zap },
  { id: 'stats', name: 'Statistics', icon: BarChart3 },
  { id: 'contact', name: 'Contact', icon: Mail },
  { id: 'maps', name: 'Maps & Location', icon: Layout },
  { id: 'media', name: 'Video & Media', icon: Video },
  { id: 'ecommerce', name: 'E-Commerce', icon: ShoppingCart },
  { id: 'footer', name: 'Footers', icon: Layout },
]

const COMPONENTS: ComponentTemplate[] = [
  {
    id: 'hero-gradient',
    name: 'Gradient Hero',
    category: 'hero',
    icon: Layout,
    description: 'Bold gradient background with centered text',
    tags: ['gradient', 'centered', 'modern'],
    preview: '<div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:20px;border-radius:8px;text-align:center;color:white;"><div style="font-weight:bold;">Build Amazing</div><div style="font-size:10px;opacity:0.8;">Start today</div></div>',
    html: '<section style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:80px 20px;text-align:center;color:white;"><h1 style="font-size:3rem;font-weight:bold;margin-bottom:1rem;">Build Something Amazing</h1><p style="font-size:1.25rem;opacity:0.9;margin-bottom:2rem;">Start your journey with our powerful platform</p><div style="display:flex;gap:1rem;justify-content:center;"><button style="background:white;color:#764ba2;padding:12px 24px;border-radius:8px;font-weight:600;border:none;cursor:pointer;">Get Started</button><button style="background:transparent;color:white;padding:12px 24px;border-radius:8px;font-weight:600;border:2px solid white;cursor:pointer;">Learn More</button></div></section>',
  },
  {
    id: 'hero-split',
    name: 'Split Hero',
    category: 'hero',
    icon: Layout,
    description: 'Two-column layout with text and image',
    tags: ['split', 'image', 'professional'],
    preview: '<div style="display:flex;gap:10px;padding:10px;background:#f8fafc;border-radius:8px;"><div style="flex:1;font-size:10px;">Welcome</div><div style="width:40px;height:30px;background:#e2e8f0;border-radius:4px;"></div></div>',
    html: '<section style="display:flex;align-items:center;gap:4rem;padding:80px 40px;max-width:1200px;margin:0 auto;"><div style="flex:1;"><h1 style="font-size:3rem;font-weight:bold;color:#1e293b;margin-bottom:1rem;">Welcome to Our Platform</h1><p style="font-size:1.25rem;color:#64748b;margin-bottom:2rem;">The best solution for modern businesses</p><button style="background:#3b82f6;color:white;padding:12px 24px;border-radius:8px;font-weight:600;border:none;cursor:pointer;">Start Free Trial</button></div><div style="flex:1;"><img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600" style="width:100%;border-radius:12px;" alt="Hero"/></div></section>',
  },
  {
    id: 'features-grid',
    name: 'Feature Grid',
    category: 'features',
    icon: Grid3X3,
    description: '3-column grid of feature cards',
    tags: ['grid', 'cards', 'icons'],
    preview: '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px;background:#f8fafc;border-radius:8px;"><div style="background:white;padding:8px;border-radius:4px;text-align:center;font-size:8px;">Feature 1</div><div style="background:white;padding:8px;border-radius:4px;text-align:center;font-size:8px;">Feature 2</div><div style="background:white;padding:8px;border-radius:4px;text-align:center;font-size:8px;">Feature 3</div></div>',
    html: '<section style="padding:80px 40px;background:#f8fafc;"><div style="max-width:1200px;margin:0 auto;text-align:center;"><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;margin-bottom:1rem;">Why Choose Us</h2><p style="color:#64748b;margin-bottom:3rem;">Everything you need to succeed</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;"><div style="background:white;padding:2rem;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);"><div style="width:48px;height:48px;background:#3b82f6;border-radius:12px;margin:0 auto 1rem;"></div><h3 style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;">Fast Performance</h3><p style="color:#64748b;">Lightning-fast load times for better user experience</p></div><div style="background:white;padding:2rem;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);"><div style="width:48px;height:48px;background:#10b981;border-radius:12px;margin:0 auto 1rem;"></div><h3 style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;">Secure & Reliable</h3><p style="color:#64748b;">Enterprise-grade security you can trust</p></div><div style="background:white;padding:2rem;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);"><div style="width:48px;height:48px;background:#f59e0b;border-radius:12px;margin:0 auto 1rem;"></div><h3 style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;">24/7 Support</h3><p style="color:#64748b;">Our team is always here to help you</p></div></div></div></section>',
  },
  {
    id: 'testimonial-cards',
    name: 'Testimonial Cards',
    category: 'testimonials',
    icon: MessageSquare,
    description: 'Grid of customer testimonials',
    tags: ['cards', 'reviews', 'social-proof'],
    preview: '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;padding:10px;background:#f8fafc;border-radius:8px;"><div style="background:white;padding:8px;border-radius:4px;font-size:8px;">"Great!"</div><div style="background:white;padding:8px;border-radius:4px;font-size:8px;">"Love it!"</div></div>',
    html: '<section style="padding:80px 40px;"><div style="max-width:1200px;margin:0 auto;text-align:center;"><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;margin-bottom:3rem;">What Our Customers Say</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;"><div style="background:white;padding:2rem;border-radius:12px;border:1px solid #e2e8f0;text-align:left;"><div style="color:#fbbf24;margin-bottom:1rem;">★★★★★</div><p style="color:#64748b;margin-bottom:1rem;">"This product completely transformed how we work. Highly recommended!"</p><div style="display:flex;align-items:center;gap:1rem;"><div style="width:48px;height:48px;background:#3b82f6;border-radius:50%;"></div><div><div style="font-weight:600;">Sarah Johnson</div><div style="font-size:0.875rem;color:#64748b;">CEO, TechCorp</div></div></div></div><div style="background:white;padding:2rem;border-radius:12px;border:1px solid #e2e8f0;text-align:left;"><div style="color:#fbbf24;margin-bottom:1rem;">★★★★★</div><p style="color:#64748b;margin-bottom:1rem;">"Best investment we made this year. The results speak for themselves."</p><div style="display:flex;align-items:center;gap:1rem;"><div style="width:48px;height:48px;background:#10b981;border-radius:50%;"></div><div><div style="font-weight:600;">Mike Chen</div><div style="font-size:0.875rem;color:#64748b;">Founder, StartupXYZ</div></div></div></div><div style="background:white;padding:2rem;border-radius:12px;border:1px solid #e2e8f0;text-align:left;"><div style="color:#fbbf24;margin-bottom:1rem;">★★★★★</div><p style="color:#64748b;margin-bottom:1rem;">"Outstanding support team and an incredible product. Five stars!"</p><div style="display:flex;align-items:center;gap:1rem;"><div style="width:48px;height:48px;background:#f59e0b;border-radius:50%;"></div><div><div style="font-weight:600;">Emily Davis</div><div style="font-size:0.875rem;color:#64748b;">Director, Agency Co</div></div></div></div></div></div></section>',
  },
  {
    id: 'pricing-cards',
    name: 'Pricing Cards',
    category: 'pricing',
    icon: DollarSign,
    description: 'Pricing tier comparison cards',
    tags: ['pricing', 'tiers', 'comparison'],
    preview: '<div style="display:flex;gap:6px;padding:10px;background:#f8fafc;border-radius:8px;"><div style="flex:1;background:white;padding:8px;border-radius:4px;text-align:center;font-size:10px;">$9</div><div style="flex:1;background:#3b82f6;padding:8px;border-radius:4px;text-align:center;font-size:10px;color:white;">$29</div></div>',
    html: '<section style="padding:80px 40px;background:#f8fafc;"><div style="max-width:1200px;margin:0 auto;text-align:center;"><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;margin-bottom:1rem;">Simple Pricing</h2><p style="color:#64748b;margin-bottom:3rem;">Choose the plan that works for you</p><div style="display:flex;gap:2rem;justify-content:center;"><div style="background:white;padding:2rem;border-radius:16px;width:300px;border:1px solid #e2e8f0;"><h3 style="font-size:1.5rem;font-weight:600;margin-bottom:0.5rem;">Starter</h3><div style="font-size:3rem;font-weight:bold;color:#1e293b;">$9<span style="font-size:1rem;color:#64748b;">/mo</span></div><ul style="text-align:left;margin:2rem 0;list-style:none;padding:0;"><li style="padding:0.5rem 0;color:#64748b;">✓ 5 Projects</li><li style="padding:0.5rem 0;color:#64748b;">✓ Basic Support</li><li style="padding:0.5rem 0;color:#64748b;">✓ 1GB Storage</li></ul><button style="width:100%;padding:12px;background:#e2e8f0;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Get Started</button></div><div style="background:#3b82f6;padding:2rem;border-radius:16px;width:300px;color:white;transform:scale(1.05);"><h3 style="font-size:1.5rem;font-weight:600;margin-bottom:0.5rem;">Pro</h3><div style="font-size:3rem;font-weight:bold;">$29<span style="font-size:1rem;opacity:0.8;">/mo</span></div><ul style="text-align:left;margin:2rem 0;list-style:none;padding:0;"><li style="padding:0.5rem 0;">✓ Unlimited Projects</li><li style="padding:0.5rem 0;">✓ Priority Support</li><li style="padding:0.5rem 0;">✓ 100GB Storage</li></ul><button style="width:100%;padding:12px;background:white;color:#3b82f6;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Get Started</button></div></div></div></section>',
  },
  {
    id: 'cta-banner',
    name: 'CTA Banner',
    category: 'cta',
    icon: Zap,
    description: 'Call-to-action banner',
    tags: ['banner', 'conversion', 'button'],
    preview: '<div style="background:#3b82f6;padding:12px;border-radius:8px;text-align:center;color:white;font-size:10px;">Ready? <span style="background:white;color:#3b82f6;padding:2px 6px;border-radius:4px;margin-left:4px;">Sign Up</span></div>',
    html: '<section style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:60px 40px;text-align:center;color:white;"><h2 style="font-size:2.5rem;font-weight:bold;margin-bottom:1rem;">Ready to Get Started?</h2><p style="font-size:1.25rem;opacity:0.9;margin-bottom:2rem;">Join thousands of satisfied customers today</p><button style="background:white;color:#3b82f6;padding:16px 32px;border-radius:8px;font-weight:600;font-size:1.125rem;border:none;cursor:pointer;">Start Your Free Trial</button></section>',
  },
  {
    id: 'stats-row',
    name: 'Stats Row',
    category: 'stats',
    icon: BarChart3,
    description: 'Key statistics display',
    tags: ['numbers', 'metrics', 'data'],
    preview: '<div style="display:flex;justify-content:space-around;padding:12px;background:#0f172a;border-radius:8px;color:white;font-size:8px;"><div>10K+</div><div>99%</div><div>24/7</div></div>',
    html: '<section style="background:#0f172a;padding:60px 40px;"><div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-around;text-align:center;"><div><div style="font-size:3rem;font-weight:bold;color:white;">10K+</div><div style="color:#94a3b8;">Happy Customers</div></div><div><div style="font-size:3rem;font-weight:bold;color:white;">99.9%</div><div style="color:#94a3b8;">Uptime</div></div><div><div style="font-size:3rem;font-weight:bold;color:white;">24/7</div><div style="color:#94a3b8;">Support</div></div><div><div style="font-size:3rem;font-weight:bold;color:white;">50+</div><div style="color:#94a3b8;">Countries</div></div></div></section>',
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'contact',
    icon: Mail,
    description: 'Contact form section',
    tags: ['form', 'contact', 'email'],
    preview: '<div style="background:white;padding:10px;border-radius:8px;border:1px solid #e2e8f0;font-size:8px;">Contact Us<div style="background:#f1f5f9;height:6px;margin:4px 0;border-radius:2px;"></div><div style="background:#3b82f6;color:white;text-align:center;padding:4px;border-radius:4px;margin-top:4px;">Send</div></div>',
    html: '<section style="padding:80px 40px;"><div style="max-width:600px;margin:0 auto;"><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;text-align:center;margin-bottom:1rem;">Get in Touch</h2><p style="text-align:center;color:#64748b;margin-bottom:3rem;">We would love to hear from you</p><form id="contact-form-component" style="display:flex;flex-direction:column;gap:1.5rem;" onsubmit="return handleFormSubmit(event, \'contact-form-component\')"><input type="text" name="name" placeholder="Your Name" required style="padding:16px;border:1px solid #e2e8f0;border-radius:8px;font-size:1rem;"/><input type="email" name="email" placeholder="Your Email" required style="padding:16px;border:1px solid #e2e8f0;border-radius:8px;font-size:1rem;"/><textarea name="message" placeholder="Your Message" rows="5" required style="padding:16px;border:1px solid #e2e8f0;border-radius:8px;font-size:1rem;resize:vertical;"></textarea><button type="submit" id="contact-form-component-btn" style="background:#3b82f6;color:white;padding:16px;border:none;border-radius:8px;font-weight:600;font-size:1rem;cursor:pointer;">Send Message</button><div id="contact-form-component-status" style="display:none;padding:12px;border-radius:8px;text-align:center;"></div></form></div></section>',
  },
  {
    id: 'footer-simple',
    name: 'Simple Footer',
    category: 'footer',
    icon: Layout,
    description: 'Clean footer with links',
    tags: ['footer', 'links', 'copyright'],
    preview: '<div style="background:#0f172a;padding:10px;border-radius:8px;color:white;text-align:center;font-size:6px;">Links | © 2025</div>',
    html: '<footer style="background:#0f172a;padding:40px;color:white;"><div style="max-width:1200px;margin:0 auto;text-align:center;"><div style="display:flex;justify-content:center;gap:2rem;margin-bottom:2rem;"><a href="#" style="color:#94a3b8;text-decoration:none;">Home</a><a href="#" style="color:#94a3b8;text-decoration:none;">About</a><a href="#" style="color:#94a3b8;text-decoration:none;">Services</a><a href="#" style="color:#94a3b8;text-decoration:none;">Contact</a></div><p style="color:#64748b;">© 2025 Your Company. All rights reserved.</p></div></footer>',
  },
  // Google Maps Components
  {
    id: 'map-simple',
    name: 'Google Map',
    category: 'maps',
    icon: Layout,
    description: 'Embedded Google Map',
    tags: ['map', 'google', 'location', 'directions'],
    preview: '<div style="background:#e2e8f0;padding:15px;border-radius:8px;text-align:center;font-size:10px;color:#64748b;">📍 Map</div>',
    html: '<section style="padding:60px 40px;background:#f8fafc;"><div style="max-width:1200px;margin:0 auto;text-align:center;"><h2 style="font-size:2rem;font-weight:bold;color:#1e293b;margin-bottom:1rem;">Find Us</h2><p style="color:#64748b;margin-bottom:2rem;">Visit our office or get directions</p><div style="border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.00425878428698!3d40.74076794379132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0xc80f9cfce5383d5d!2sGoogle!5e0!3m2!1sen!2sus!4v1234567890" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div></section>',
  },
  {
    id: 'map-with-info',
    name: 'Map with Contact Info',
    category: 'maps',
    icon: Layout,
    description: 'Map with address and contact details',
    tags: ['map', 'contact', 'address', 'phone'],
    preview: '<div style="display:flex;gap:6px;padding:8px;background:#f8fafc;border-radius:8px;"><div style="flex:1;background:#e2e8f0;border-radius:4px;padding:10px;text-align:center;font-size:8px;">📍</div><div style="flex:1;font-size:6px;padding:4px;">Address info</div></div>',
    html: '<section style="padding:60px 40px;"><div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;"><div><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;margin-bottom:1rem;">Get in Touch</h2><p style="color:#64748b;margin-bottom:2rem;">We would love to hear from you. Visit us or reach out!</p><div style="space-y:1rem;"><div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;"><div style="width:48px;height:48px;background:#3b82f6;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;">📍</div><div><p style="font-weight:600;color:#1e293b;">Address</p><p style="color:#64748b;">123 Business Street, City, State 12345</p></div></div><div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;"><div style="width:48px;height:48px;background:#10b981;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;">📞</div><div><p style="font-weight:600;color:#1e293b;">Phone</p><p style="color:#64748b;">(555) 123-4567</p></div></div><div style="display:flex;align-items:center;gap:1rem;"><div style="width:48px;height:48px;background:#f59e0b;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;">✉️</div><div><p style="font-weight:600;color:#1e293b;">Email</p><p style="color:#64748b;">hello@company.com</p></div></div></div></div><div style="border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.00425878428698!3d40.74076794379132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0xc80f9cfce5383d5d!2sGoogle!5e0!3m2!1sen!2sus!4v1234567890" width="100%" height="350" style="border:0;" allowfullscreen="" loading="lazy"></iframe></div></div></section>',
  },
  // YouTube / Video Components
  {
    id: 'youtube-video',
    name: 'YouTube Video',
    category: 'media',
    icon: Video,
    description: 'Embedded YouTube video player',
    tags: ['youtube', 'video', 'embed', 'media'],
    preview: '<div style="background:#0f0f0f;padding:12px;border-radius:8px;text-align:center;color:white;font-size:16px;">▶️</div>',
    html: '<section style="padding:60px 40px;background:#0f172a;"><div style="max-width:900px;margin:0 auto;text-align:center;"><h2 style="font-size:2rem;font-weight:bold;color:white;margin-bottom:1rem;">Watch Our Story</h2><p style="color:#94a3b8;margin-bottom:2rem;">Learn more about what we do and why we do it</p><div style="position:relative;padding-bottom:56.25%;height:0;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div></section>',
  },
  {
    id: 'video-testimonial',
    name: 'Video Testimonial',
    category: 'media',
    icon: Video,
    description: 'Video with testimonial text',
    tags: ['video', 'testimonial', 'review'],
    preview: '<div style="display:flex;gap:6px;padding:8px;background:#f8fafc;border-radius:8px;"><div style="width:50px;height:30px;background:#0f0f0f;border-radius:4px;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;">▶️</div><div style="flex:1;font-size:6px;">"Great!"</div></div>',
    html: '<section style="padding:80px 40px;"><div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;"><div style="position:relative;padding-bottom:56.25%;height:0;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.2);"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Customer testimonial" frameborder="0" allowfullscreen></iframe></div><div><div style="color:#fbbf24;font-size:2rem;margin-bottom:1rem;">★★★★★</div><p style="font-size:1.5rem;color:#1e293b;line-height:1.6;margin-bottom:2rem;">"This product completely transformed our business. The results exceeded all our expectations and the support team was incredible."</p><div style="display:flex;align-items:center;gap:1rem;"><div style="width:64px;height:64px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:50%;"></div><div><p style="font-weight:600;color:#1e293b;font-size:1.125rem;">Sarah Johnson</p><p style="color:#64748b;">CEO, TechCorp Inc.</p></div></div></div></div></section>',
  },
  // Google Calendar
  {
    id: 'calendar-embed',
    name: 'Google Calendar',
    category: 'media',
    icon: Layout,
    description: 'Embedded Google Calendar',
    tags: ['calendar', 'schedule', 'events', 'booking'],
    preview: '<div style="background:#fff;border:1px solid #e2e8f0;padding:8px;border-radius:8px;font-size:6px;"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div></div>',
    html: '<section style="padding:60px 40px;background:#f8fafc;"><div style="max-width:1000px;margin:0 auto;text-align:center;"><h2 style="font-size:2rem;font-weight:bold;color:#1e293b;margin-bottom:1rem;">Our Schedule</h2><p style="color:#64748b;margin-bottom:2rem;">View upcoming events and availability</p><div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);padding:1rem;"><iframe src="https://calendar.google.com/calendar/embed?src=en.usa%23holiday%40group.v.calendar.google.com&ctz=America%2FNew_York" style="border:0;width:100%;height:500px;" frameborder="0" scrolling="no"></iframe></div><p style="color:#94a3b8;font-size:0.875rem;margin-top:1rem;">Replace with your own Google Calendar embed code</p></div></section>',
  },
  // Newsletter with reCAPTCHA placeholder
  {
    id: 'newsletter-protected',
    name: 'Newsletter Signup',
    category: 'contact',
    icon: Mail,
    description: 'Email signup with spam protection',
    tags: ['newsletter', 'email', 'signup', 'subscribe'],
    preview: '<div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:10px;border-radius:8px;text-align:center;color:white;font-size:8px;">Subscribe ✉️</div>',
    html: '<section style="padding:60px 40px;background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);"><div style="max-width:600px;margin:0 auto;text-align:center;"><h2 style="font-size:2rem;font-weight:bold;color:white;margin-bottom:0.5rem;">Stay Updated</h2><p style="color:rgba(255,255,255,0.9);margin-bottom:2rem;">Subscribe to our newsletter for the latest updates and exclusive offers.</p><form id="newsletter-form" style="display:flex;gap:0.75rem;max-width:450px;margin:0 auto;" onsubmit="return handleFormSubmit(event, \'newsletter-form\')"><input type="email" name="email" placeholder="Enter your email" required style="flex:1;padding:14px 18px;border:none;border-radius:8px;font-size:1rem;"><button type="submit" id="newsletter-form-btn" style="padding:14px 28px;background:#0f172a;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;white-space:nowrap;">Subscribe</button></form><div id="newsletter-form-status" style="display:none;margin-top:1rem;padding:12px;border-radius:8px;"></div><p style="color:rgba(255,255,255,0.7);font-size:0.75rem;margin-top:1rem;">We respect your privacy. Unsubscribe at any time.</p></div></section>',
  },
  // E-commerce Components
  {
    id: 'product-card',
    name: 'Product Card',
    category: 'ecommerce',
    icon: ShoppingCart,
    description: 'Single product display card',
    tags: ['product', 'card', 'shop', 'buy'],
    preview: '<div style="background:white;padding:8px;border-radius:8px;border:1px solid #e2e8f0;"><div style="background:#f1f5f9;height:30px;border-radius:4px;margin-bottom:6px;"></div><div style="font-size:8px;font-weight:bold;">Product</div><div style="font-size:8px;color:#3b82f6;">$29.99</div></div>',
    html: '<div style="max-width:300px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);"><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" style="width:100%;height:250px;object-fit:cover;" alt="Product"/><div style="padding:1.5rem;"><span style="font-size:0.75rem;color:#3b82f6;font-weight:600;text-transform:uppercase;">New Arrival</span><h3 style="font-size:1.25rem;font-weight:bold;color:#1e293b;margin:0.5rem 0;">Premium Product</h3><div style="display:flex;align-items:center;gap:0.5rem;margin:0.5rem 0;"><span style="color:#fbbf24;">★★★★★</span><span style="font-size:0.875rem;color:#64748b;">(128 reviews)</span></div><div style="display:flex;align-items:center;justify-content:space-between;margin-top:1rem;"><span style="font-size:1.5rem;font-weight:bold;color:#1e293b;">$29.99</span><button style="padding:12px 24px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Add to Cart</button></div></div></div>',
  },
  {
    id: 'product-grid',
    name: 'Product Grid',
    category: 'ecommerce',
    icon: ShoppingCart,
    description: '4-column product grid',
    tags: ['products', 'grid', 'catalog', 'shop'],
    preview: '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:8px;background:#f8fafc;border-radius:8px;"><div style="background:white;padding:6px;border-radius:4px;font-size:6px;">$19</div><div style="background:white;padding:6px;border-radius:4px;font-size:6px;">$29</div><div style="background:white;padding:6px;border-radius:4px;font-size:6px;">$39</div><div style="background:white;padding:6px;border-radius:4px;font-size:6px;">$49</div></div>',
    html: '<section style="padding:60px 40px;background:#f8fafc;"><div style="max-width:1200px;margin:0 auto;"><div style="text-align:center;margin-bottom:3rem;"><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;">Featured Products</h2><p style="color:#64748b;margin-top:0.5rem;">Discover our best-selling items</p></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;"><div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.05);"><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300" style="width:100%;height:200px;object-fit:cover;" alt="Product 1"/><div style="padding:1rem;"><h4 style="font-weight:600;color:#1e293b;">Smart Watch</h4><p style="font-size:0.875rem;color:#64748b;">Premium design</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;"><span style="font-weight:bold;color:#1e293b;">$199</span><button style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:0.875rem;cursor:pointer;">Buy</button></div></div></div><div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.05);"><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300" style="width:100%;height:200px;object-fit:cover;" alt="Product 2"/><div style="padding:1rem;"><h4 style="font-weight:600;color:#1e293b;">Headphones</h4><p style="font-size:0.875rem;color:#64748b;">Wireless audio</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;"><span style="font-weight:bold;color:#1e293b;">$149</span><button style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:0.875rem;cursor:pointer;">Buy</button></div></div></div><div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.05);"><img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300" style="width:100%;height:200px;object-fit:cover;" alt="Product 3"/><div style="padding:1rem;"><h4 style="font-weight:600;color:#1e293b;">Camera</h4><p style="font-size:0.875rem;color:#64748b;">Pro quality</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;"><span style="font-weight:bold;color:#1e293b;">$599</span><button style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:0.875rem;cursor:pointer;">Buy</button></div></div></div><div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.05);"><img src="https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300" style="width:100%;height:200px;object-fit:cover;" alt="Product 4"/><div style="padding:1rem;"><h4 style="font-weight:600;color:#1e293b;">Phone Case</h4><p style="font-size:0.875rem;color:#64748b;">Slim fit</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;"><span style="font-weight:bold;color:#1e293b;">$29</span><button style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:0.875rem;cursor:pointer;">Buy</button></div></div></div></div></div></section>',
  },
  {
    id: 'shopping-cart',
    name: 'Shopping Cart',
    category: 'ecommerce',
    icon: ShoppingCart,
    description: 'Mini cart preview',
    tags: ['cart', 'checkout', 'shop'],
    preview: '<div style="background:white;padding:8px;border-radius:8px;border:1px solid #e2e8f0;font-size:7px;"><div>🛒 Cart (3)</div><div style="margin-top:4px;padding-top:4px;border-top:1px solid #e2e8f0;">Total: $89</div></div>',
    html: '<div style="background:white;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.15);padding:1.5rem;max-width:400px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;"><h3 style="font-size:1.25rem;font-weight:bold;color:#1e293b;">Shopping Cart</h3><span style="background:#3b82f6;color:white;padding:4px 12px;border-radius:20px;font-size:0.875rem;">3 items</span></div><div style="space-y:1rem;"><div style="display:flex;gap:1rem;padding:1rem 0;border-bottom:1px solid #e2e8f0;"><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100" style="width:60px;height:60px;border-radius:8px;object-fit:cover;" alt="Item"/><div style="flex:1;"><h4 style="font-weight:600;color:#1e293b;">Smart Watch</h4><p style="font-size:0.875rem;color:#64748b;">Qty: 1</p></div><span style="font-weight:bold;color:#1e293b;">$199</span></div><div style="display:flex;gap:1rem;padding:1rem 0;border-bottom:1px solid #e2e8f0;"><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100" style="width:60px;height:60px;border-radius:8px;object-fit:cover;" alt="Item"/><div style="flex:1;"><h4 style="font-weight:600;color:#1e293b;">Headphones</h4><p style="font-size:0.875rem;color:#64748b;">Qty: 2</p></div><span style="font-weight:bold;color:#1e293b;">$298</span></div></div><div style="margin-top:1.5rem;padding-top:1.5rem;border-top:2px solid #e2e8f0;"><div style="display:flex;justify-content:space-between;margin-bottom:1rem;"><span style="color:#64748b;">Subtotal</span><span style="font-weight:bold;color:#1e293b;">$497</span></div><button style="width:100%;padding:14px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Checkout</button></div></div>',
  },
  // FAQ Components
  {
    id: 'faq-accordion',
    name: 'FAQ Accordion',
    category: 'features',
    icon: Grid3X3,
    description: 'Expandable FAQ section',
    tags: ['faq', 'questions', 'accordion', 'help'],
    preview: '<div style="background:white;padding:8px;border-radius:8px;border:1px solid #e2e8f0;"><div style="font-size:8px;padding:4px;background:#f8fafc;border-radius:4px;margin-bottom:4px;">Q: How? +</div><div style="font-size:8px;padding:4px;background:#f8fafc;border-radius:4px;">Q: Why? +</div></div>',
    html: '<section style="padding:80px 40px;background:#f8fafc;"><div style="max-width:800px;margin:0 auto;"><div style="text-align:center;margin-bottom:3rem;"><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;">Frequently Asked Questions</h2><p style="color:#64748b;margin-top:0.5rem;">Find answers to common questions</p></div><div style="space-y:1rem;"><details style="background:white;border-radius:12px;padding:1.5rem;cursor:pointer;"><summary style="font-weight:600;color:#1e293b;font-size:1.125rem;list-style:none;display:flex;justify-content:space-between;align-items:center;">How do I get started?<span style="color:#3b82f6;">+</span></summary><p style="margin-top:1rem;color:#64748b;line-height:1.6;">Getting started is easy! Simply create an account, choose your template, and start building your website. Our intuitive drag-and-drop editor makes it simple for anyone to create a professional website in minutes.</p></details><details style="background:white;border-radius:12px;padding:1.5rem;cursor:pointer;margin-top:1rem;"><summary style="font-weight:600;color:#1e293b;font-size:1.125rem;list-style:none;display:flex;justify-content:space-between;align-items:center;">What payment methods do you accept?<span style="color:#3b82f6;">+</span></summary><p style="margin-top:1rem;color:#64748b;line-height:1.6;">We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are securely processed through our encrypted payment gateway.</p></details><details style="background:white;border-radius:12px;padding:1.5rem;cursor:pointer;margin-top:1rem;"><summary style="font-weight:600;color:#1e293b;font-size:1.125rem;list-style:none;display:flex;justify-content:space-between;align-items:center;">Can I cancel my subscription anytime?<span style="color:#3b82f6;">+</span></summary><p style="margin-top:1rem;color:#64748b;line-height:1.6;">Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your website will remain active until the end of your billing period.</p></details><details style="background:white;border-radius:12px;padding:1.5rem;cursor:pointer;margin-top:1rem;"><summary style="font-weight:600;color:#1e293b;font-size:1.125rem;list-style:none;display:flex;justify-content:space-between;align-items:center;">Do you offer customer support?<span style="color:#3b82f6;">+</span></summary><p style="margin-top:1rem;color:#64748b;line-height:1.6;">Absolutely! We offer 24/7 customer support via live chat, email, and phone. Our dedicated support team is always ready to help you with any questions or issues.</p></details></div></div></section>',
  },
  // Team Section
  {
    id: 'team-grid',
    name: 'Team Grid',
    category: 'features',
    icon: Grid3X3,
    description: 'Team members showcase',
    tags: ['team', 'about', 'people', 'staff'],
    preview: '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:8px;background:#f8fafc;border-radius:8px;"><div style="text-align:center;font-size:6px;"><div style="width:16px;height:16px;background:#3b82f6;border-radius:50%;margin:0 auto 2px;"></div>John</div><div style="text-align:center;font-size:6px;"><div style="width:16px;height:16px;background:#10b981;border-radius:50%;margin:0 auto 2px;"></div>Jane</div><div style="text-align:center;font-size:6px;"><div style="width:16px;height:16px;background:#f59e0b;border-radius:50%;margin:0 auto 2px;"></div>Mike</div></div>',
    html: '<section style="padding:80px 40px;"><div style="max-width:1200px;margin:0 auto;text-align:center;"><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;margin-bottom:1rem;">Meet Our Team</h2><p style="color:#64748b;margin-bottom:3rem;max-width:600px;margin-left:auto;margin-right:auto;">Our talented team of professionals is dedicated to delivering exceptional results.</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;"><div style="text-align:center;"><img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300" style="width:150px;height:150px;border-radius:50%;object-fit:cover;margin:0 auto 1rem;" alt="Team member"/><h4 style="font-weight:600;color:#1e293b;font-size:1.125rem;">John Smith</h4><p style="color:#3b82f6;font-size:0.875rem;margin-bottom:0.5rem;">CEO & Founder</p><p style="color:#64748b;font-size:0.875rem;">Visionary leader with 15+ years of experience</p></div><div style="text-align:center;"><img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300" style="width:150px;height:150px;border-radius:50%;object-fit:cover;margin:0 auto 1rem;" alt="Team member"/><h4 style="font-weight:600;color:#1e293b;font-size:1.125rem;">Sarah Johnson</h4><p style="color:#3b82f6;font-size:0.875rem;margin-bottom:0.5rem;">Head of Design</p><p style="color:#64748b;font-size:0.875rem;">Award-winning designer and creative director</p></div><div style="text-align:center;"><img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300" style="width:150px;height:150px;border-radius:50%;object-fit:cover;margin:0 auto 1rem;" alt="Team member"/><h4 style="font-weight:600;color:#1e293b;font-size:1.125rem;">Mike Chen</h4><p style="color:#3b82f6;font-size:0.875rem;margin-bottom:0.5rem;">Lead Developer</p><p style="color:#64748b;font-size:0.875rem;">Full-stack expert with passion for clean code</p></div><div style="text-align:center;"><img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300" style="width:150px;height:150px;border-radius:50%;object-fit:cover;margin:0 auto 1rem;" alt="Team member"/><h4 style="font-weight:600;color:#1e293b;font-size:1.125rem;">Emily Davis</h4><p style="color:#3b82f6;font-size:0.875rem;margin-bottom:0.5rem;">Marketing Director</p><p style="color:#64748b;font-size:0.875rem;">Growth strategist and brand specialist</p></div></div></div></section>',
  },
  // Logo Cloud
  {
    id: 'logo-cloud',
    name: 'Client Logos',
    category: 'features',
    icon: Star,
    description: 'Trusted by section with logos',
    tags: ['logos', 'clients', 'trust', 'brands'],
    preview: '<div style="background:#f8fafc;padding:8px;border-radius:8px;text-align:center;font-size:6px;"><div>Trusted by</div><div style="display:flex;gap:4px;justify-content:center;margin-top:4px;"><div style="background:#e2e8f0;padding:4px 8px;border-radius:4px;">Logo</div><div style="background:#e2e8f0;padding:4px 8px;border-radius:4px;">Logo</div><div style="background:#e2e8f0;padding:4px 8px;border-radius:4px;">Logo</div></div></div>',
    html: '<section style="padding:40px;background:#f8fafc;"><div style="max-width:1200px;margin:0 auto;text-align:center;"><p style="color:#64748b;margin-bottom:2rem;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.1em;">Trusted by leading companies worldwide</p><div style="display:flex;justify-content:center;align-items:center;gap:4rem;flex-wrap:wrap;opacity:0.6;"><svg style="height:32px;" viewBox="0 0 200 40"><text x="0" y="30" font-size="24" font-weight="bold" fill="#64748b">Company</text></svg><svg style="height:32px;" viewBox="0 0 200 40"><text x="0" y="30" font-size="24" font-weight="bold" fill="#64748b">Brand</text></svg><svg style="height:32px;" viewBox="0 0 200 40"><text x="0" y="30" font-size="24" font-weight="bold" fill="#64748b">Startup</text></svg><svg style="height:32px;" viewBox="0 0 200 40"><text x="0" y="30" font-size="24" font-weight="bold" fill="#64748b">Tech Co</text></svg><svg style="height:32px;" viewBox="0 0 200 40"><text x="0" y="30" font-size="24" font-weight="bold" fill="#64748b">Agency</text></svg></div></div></section>',
  },
  // Blog/News Section
  {
    id: 'blog-grid',
    name: 'Blog Posts Grid',
    category: 'features',
    icon: Grid3X3,
    description: 'Latest news and blog posts',
    tags: ['blog', 'news', 'articles', 'posts'],
    preview: '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:8px;background:#f8fafc;border-radius:8px;"><div style="background:white;padding:6px;border-radius:4px;"><div style="background:#e2e8f0;height:12px;border-radius:2px;margin-bottom:4px;"></div><div style="font-size:6px;">Article 1</div></div><div style="background:white;padding:6px;border-radius:4px;"><div style="background:#e2e8f0;height:12px;border-radius:2px;margin-bottom:4px;"></div><div style="font-size:6px;">Article 2</div></div><div style="background:white;padding:6px;border-radius:4px;"><div style="background:#e2e8f0;height:12px;border-radius:2px;margin-bottom:4px;"></div><div style="font-size:6px;">Article 3</div></div></div>',
    html: '<section style="padding:80px 40px;"><div style="max-width:1200px;margin:0 auto;"><div style="text-align:center;margin-bottom:3rem;"><h2 style="font-size:2.5rem;font-weight:bold;color:#1e293b;">Latest News</h2><p style="color:#64748b;margin-top:0.5rem;">Stay updated with our latest articles and insights</p></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;"><article style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);"><img src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400" style="width:100%;height:200px;object-fit:cover;" alt="Blog post"/><div style="padding:1.5rem;"><span style="font-size:0.75rem;color:#3b82f6;font-weight:600;">Technology</span><h3 style="font-size:1.25rem;font-weight:bold;color:#1e293b;margin:0.5rem 0;">The Future of Web Design</h3><p style="color:#64748b;font-size:0.875rem;margin-bottom:1rem;">Discover the latest trends shaping the future of digital experiences...</p><div style="display:flex;align-items:center;gap:0.75rem;"><img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="Author"/><div><p style="font-size:0.875rem;font-weight:500;color:#1e293b;">John Doe</p><p style="font-size:0.75rem;color:#64748b;">Dec 15, 2024</p></div></div></div></article><article style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);"><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400" style="width:100%;height:200px;object-fit:cover;" alt="Blog post"/><div style="padding:1.5rem;"><span style="font-size:0.75rem;color:#10b981;font-weight:600;">Business</span><h3 style="font-size:1.25rem;font-weight:bold;color:#1e293b;margin:0.5rem 0;">Growing Your Online Presence</h3><p style="color:#64748b;font-size:0.875rem;margin-bottom:1rem;">Essential strategies for building a strong digital footprint...</p><div style="display:flex;align-items:center;gap:0.75rem;"><img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="Author"/><div><p style="font-size:0.875rem;font-weight:500;color:#1e293b;">Jane Smith</p><p style="font-size:0.75rem;color:#64748b;">Dec 12, 2024</p></div></div></div></article><article style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);"><img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=400" style="width:100%;height:200px;object-fit:cover;" alt="Blog post"/><div style="padding:1.5rem;"><span style="font-size:0.75rem;color:#f59e0b;font-weight:600;">Design</span><h3 style="font-size:1.25rem;font-weight:bold;color:#1e293b;margin:0.5rem 0;">Mastering Color Theory</h3><p style="color:#64748b;font-size:0.875rem;margin-bottom:1rem;">Learn how to use color effectively in your designs...</p><div style="display:flex;align-items:center;gap:0.75rem;"><img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="Author"/><div><p style="font-size:0.875rem;font-weight:500;color:#1e293b;">Emily Chen</p><p style="font-size:0.75rem;color:#64748b;">Dec 10, 2024</p></div></div></div></article></div></div></section>',
  },
  // Image Gallery
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    category: 'media',
    icon: Layout,
    description: 'Masonry image gallery',
    tags: ['gallery', 'images', 'photos', 'portfolio'],
    preview: '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:6px;background:#f8fafc;border-radius:8px;"><div style="background:#e2e8f0;aspect-ratio:1;border-radius:4px;"></div><div style="background:#e2e8f0;aspect-ratio:1;border-radius:4px;"></div><div style="background:#e2e8f0;aspect-ratio:1;border-radius:4px;"></div></div>',
    html: '<section style="padding:60px 40px;"><div style="max-width:1200px;margin:0 auto;"><h2 style="font-size:2rem;font-weight:bold;color:#1e293b;text-align:center;margin-bottom:2rem;">Our Gallery</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;"><div style="overflow:hidden;border-radius:12px;"><img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400" style="width:100%;height:250px;object-fit:cover;transition:transform 0.3s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" alt="Gallery image"/></div><div style="overflow:hidden;border-radius:12px;"><img src="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400" style="width:100%;height:250px;object-fit:cover;transition:transform 0.3s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" alt="Gallery image"/></div><div style="overflow:hidden;border-radius:12px;"><img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400" style="width:100%;height:250px;object-fit:cover;transition:transform 0.3s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" alt="Gallery image"/></div><div style="overflow:hidden;border-radius:12px;"><img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" style="width:100%;height:250px;object-fit:cover;transition:transform 0.3s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" alt="Gallery image"/></div><div style="overflow:hidden;border-radius:12px;"><img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=400" style="width:100%;height:250px;object-fit:cover;transition:transform 0.3s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" alt="Gallery image"/></div><div style="overflow:hidden;border-radius:12px;"><img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400" style="width:100%;height:250px;object-fit:cover;transition:transform 0.3s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" alt="Gallery image"/></div></div></div></section>',
  },
  // Social Proof / Reviews
  {
    id: 'review-stars',
    name: 'Star Reviews',
    category: 'testimonials',
    icon: Star,
    description: 'Star rating reviews',
    tags: ['reviews', 'ratings', 'stars', 'testimonials'],
    preview: '<div style="background:white;padding:8px;border-radius:8px;border:1px solid #e2e8f0;text-align:center;"><div style="color:#fbbf24;font-size:10px;">★★★★★</div><div style="font-size:7px;color:#64748b;">4.9 (2,394 reviews)</div></div>',
    html: '<section style="padding:40px;background:#f8fafc;"><div style="max-width:800px;margin:0 auto;text-align:center;"><div style="display:flex;justify-content:center;gap:0.25rem;font-size:2rem;color:#fbbf24;margin-bottom:1rem;">★★★★★</div><p style="font-size:1.5rem;font-weight:bold;color:#1e293b;margin-bottom:0.5rem;">4.9 out of 5 stars</p><p style="color:#64748b;margin-bottom:2rem;">Based on 2,394 reviews from our customers</p><div style="display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;"><div><p style="font-size:2rem;font-weight:bold;color:#1e293b;">98%</p><p style="color:#64748b;font-size:0.875rem;">Satisfaction Rate</p></div><div><p style="font-size:2rem;font-weight:bold;color:#1e293b;">50K+</p><p style="color:#64748b;font-size:0.875rem;">Happy Customers</p></div><div><p style="font-size:2rem;font-weight:bold;color:#1e293b;">24/7</p><p style="color:#64748b;font-size:0.875rem;">Support Available</p></div></div></div></section>',
  },
  // Countdown Timer
  {
    id: 'countdown-timer',
    name: 'Countdown Timer',
    category: 'cta',
    icon: Zap,
    description: 'Sale countdown timer',
    tags: ['countdown', 'timer', 'sale', 'urgent'],
    preview: '<div style="background:#dc2626;padding:8px;border-radius:8px;text-align:center;color:white;font-size:8px;"><div>Sale Ends In</div><div style="display:flex;justify-content:center;gap:4px;margin-top:4px;"><span style="background:white;color:#dc2626;padding:2px 4px;border-radius:4px;">02</span>:<span style="background:white;color:#dc2626;padding:2px 4px;border-radius:4px;">15</span>:<span style="background:white;color:#dc2626;padding:2px 4px;border-radius:4px;">33</span></div></div>',
    html: '<section style="padding:40px;background:linear-gradient(135deg,#dc2626,#b91c1c);"><div style="max-width:800px;margin:0 auto;text-align:center;color:white;"><p style="font-size:1rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Limited Time Offer</p><h2 style="font-size:2.5rem;font-weight:bold;margin-bottom:1rem;">Flash Sale - 50% OFF</h2><p style="margin-bottom:2rem;opacity:0.9;">Hurry! This offer ends soon</p><div style="display:flex;justify-content:center;gap:1rem;margin-bottom:2rem;"><div style="background:white;color:#dc2626;padding:1.5rem;border-radius:12px;min-width:80px;"><p style="font-size:2.5rem;font-weight:bold;">02</p><p style="font-size:0.75rem;text-transform:uppercase;">Days</p></div><div style="background:white;color:#dc2626;padding:1.5rem;border-radius:12px;min-width:80px;"><p style="font-size:2.5rem;font-weight:bold;">15</p><p style="font-size:0.75rem;text-transform:uppercase;">Hours</p></div><div style="background:white;color:#dc2626;padding:1.5rem;border-radius:12px;min-width:80px;"><p style="font-size:2.5rem;font-weight:bold;">33</p><p style="font-size:0.75rem;text-transform:uppercase;">Minutes</p></div><div style="background:white;color:#dc2626;padding:1.5rem;border-radius:12px;min-width:80px;"><p style="font-size:2.5rem;font-weight:bold;">47</p><p style="font-size:0.75rem;text-transform:uppercase;">Seconds</p></div></div><button style="padding:16px 48px;background:white;color:#dc2626;border:none;border-radius:8px;font-weight:600;font-size:1.125rem;cursor:pointer;">Shop Now</button></div></section>',
  },
  // Social Links
  {
    id: 'social-links-bar',
    name: 'Social Links Bar',
    category: 'footer',
    icon: Layout,
    description: 'Social media icon bar',
    tags: ['social', 'icons', 'links', 'follow'],
    preview: '<div style="background:#0f172a;padding:8px;border-radius:8px;display:flex;justify-content:center;gap:6px;"><div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;"></div><div style="background:#1da1f2;width:16px;height:16px;border-radius:50%;"></div><div style="background:#e4405f;width:16px;height:16px;border-radius:50%;"></div><div style="background:#ff0000;width:16px;height:16px;border-radius:50%;"></div></div>',
    html: '<section style="padding:40px;background:#0f172a;"><div style="max-width:600px;margin:0 auto;text-align:center;"><p style="color:white;margin-bottom:1.5rem;font-size:1.125rem;">Follow us on social media</p><div style="display:flex;justify-content:center;gap:1rem;"><a href="#" style="width:48px;height:48px;background:#1877f2;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.25rem;text-decoration:none;">f</a><a href="#" style="width:48px;height:48px;background:#1da1f2;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.25rem;text-decoration:none;">𝕏</a><a href="#" style="width:48px;height:48px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.25rem;text-decoration:none;">📷</a><a href="#" style="width:48px;height:48px;background:#0077b5;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.25rem;text-decoration:none;">in</a><a href="#" style="width:48px;height:48px;background:#ff0000;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.25rem;text-decoration:none;">▶</a></div></div></section>',
  },
]

export function ComponentLibrary({ onInsertComponent }: ComponentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['hero', 'features']))

  const filteredComponents = COMPONENTS.filter((component) => {
    return searchQuery === '' ||
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const groupedComponents = COMPONENT_CATEGORIES.map(category => ({
    ...category,
    components: filteredComponents.filter(c => c.category === category.id),
  })).filter(cat => cat.components.length > 0)

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groupedComponents.map(category => (
          <div key={category.id} className="border-b border-slate-800">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-800/50 transition"
            >
              <div className="flex items-center gap-2">
                <category.icon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">{category.name}</span>
                <span className="text-xs text-slate-500">({category.components.length})</span>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', expandedCategories.has(category.id) && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {expandedCategories.has(category.id) && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    {category.components.map(component => (
                      <div
                        key={component.id}
                        className="group relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500/50 transition cursor-pointer"
                        onClick={() => onInsertComponent(component)}
                      >
                        <div className="p-2 bg-white" dangerouslySetInnerHTML={{ __html: component.preview }} />
                        <div className="p-2 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-white">{component.name}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[150px]">{component.description}</div>
                          </div>
                          <button className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-500">{COMPONENTS.length} components</p>
        <p className="text-xs text-green-400 mt-1">Open Source • MIT License</p>
      </div>
    </div>
  )
}
