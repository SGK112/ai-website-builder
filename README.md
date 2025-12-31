# AI Website Builder

> **Open Source Alternative to Webflow** - Build and deploy websites with AI, own your code, no vendor lock-in.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

![AI Website Builder Demo](https://via.placeholder.com/1200x600/1e293b/ffffff?text=AI+Website+Builder)

## Why AI Website Builder?

| Feature | AI Website Builder | Webflow | Wix |
|---------|-------------------|---------|-----|
| **Full Code Ownership** | ✅ Export everything | ❌ Locked in | ❌ Locked in |
| **Self-Hosted** | ✅ Your servers | ❌ Their cloud | ❌ Their cloud |
| **Open Source** | ✅ MIT License | ❌ Proprietary | ❌ Proprietary |
| **AI Generation** | ✅ Claude/GPT/Gemini | ⚠️ Limited | ⚠️ Limited |
| **Deploy Anywhere** | ✅ GitHub + Any host | ❌ Webflow only | ❌ Wix only |
| **Monthly Cost** | 💰 $0 (self-host) | 💰 $14-39/mo | 💰 $16-45/mo |

## Features

### 🎨 Visual Builder
- Drag-and-drop sections
- Real-time preview
- Responsive design controls
- Custom CSS injection

### 🤖 AI-Powered
- Generate pages from prompts
- Claude, GPT-4, and Gemini support
- Smart content suggestions

### 📦 Component Library
- 20+ pre-built sections
- Hero, Features, Pricing, Testimonials
- Contact forms, CTAs, Footers
- E-commerce components

### 🚀 One-Click Deploy
- Push to GitHub automatically
- Deploy to Render in seconds
- Custom domain support

### 📄 Multi-Page Support
- Create unlimited pages
- Internal linking
- Page management panel

### 🎯 SEO & Meta
- Open Graph tags
- Twitter Cards
- Custom meta descriptions
- Google Analytics integration

## Quick Start

```bash
# Clone the repo
git clone https://github.com/SGK112/ai-website-builder.git
cd ai-website-builder

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your API keys

# Start development server
npm run dev

# Open http://localhost:3000
```

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ai-website-builder

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# AI Providers (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Deployment (optional)
GITHUB_ACCESS_TOKEN=ghp_...
RENDER_API_KEY=rnd_...
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **Auth**: NextAuth.js
- **AI**: Anthropic Claude, OpenAI, Google Gemini
- **Animation**: Framer Motion
- **Drag & Drop**: dnd-kit

## Project Structure

```
ai-website-builder/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   │   ├── builder/ # Builder components
│       │   │   └── ui/      # UI primitives
│       │   └── lib/         # Utilities
│       └── public/          # Static assets
├── packages/
│   ├── ai-agents/           # AI provider integrations
│   ├── database/            # MongoDB models
│   ├── deploy-utils/        # Deployment utilities
│   └── shared/              # Shared types & utils
└── README.md
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork the repo
# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push and create a PR
git push origin feature/amazing-feature
```

## Roadmap

- [x] Visual page builder
- [x] AI-powered generation
- [x] Component library
- [x] GitHub/Render deployment
- [x] Multi-page support
- [ ] Visual database/CMS builder
- [ ] User authentication system
- [ ] E-commerce templates
- [ ] Plugin marketplace
- [ ] Real-time collaboration
- [ ] Version history

## License

MIT License - see [LICENSE](LICENSE) for details.

**You can:**
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Use privately

## Support

- 📖 [Documentation](https://github.com/SGK112/ai-website-builder/wiki)
- 🐛 [Report Bug](https://github.com/SGK112/ai-website-builder/issues)
- 💡 [Request Feature](https://github.com/SGK112/ai-website-builder/issues)
- 💬 [Discussions](https://github.com/SGK112/ai-website-builder/discussions)

---

**Built with ❤️ by the community. Star ⭐ if you find it useful!**
