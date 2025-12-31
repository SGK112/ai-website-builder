# Contributing to AI Website Builder

First off, thank you for considering contributing to AI Website Builder! It's people like you that make this project a great open-source alternative to proprietary website builders.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs what actually happened
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

### Suggesting Features

Feature requests are welcome! Please:

1. Check if the feature is already on our [Roadmap](README.md#roadmap)
2. Open an issue with the `enhancement` label
3. Describe the feature and why it would be useful
4. Include mockups or examples if possible

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Test your changes**: `npm run test`
5. **Lint your code**: `npm run lint`
6. **Commit with conventional commits** (see below)
7. **Push and open a PR**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ai-website-builder.git
cd ai-website-builder

# Install dependencies
npm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your API keys

# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint
```

## Project Structure

```
ai-website-builder/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   │   ├── builder/ # Builder-specific components
│       │   │   └── ui/      # Reusable UI primitives
│       │   └── lib/         # Utilities and helpers
│       └── public/          # Static assets
├── packages/
│   ├── ai-agents/           # AI provider integrations
│   ├── database/            # MongoDB models & schemas
│   ├── deploy-utils/        # Deployment utilities
│   └── shared/              # Shared types & utilities
└── docs/                    # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types, avoid `any` when possible
- Use interfaces for object shapes

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Use meaningful prop names
- Prefer composition over inheritance

### Styling

- Use Tailwind CSS for styling
- Follow the existing design system
- Ensure responsive design (mobile, tablet, desktop)
- Use CSS variables for theme values

### File Naming

- Components: `PascalCase.tsx` (e.g., `ComponentLibrary.tsx`)
- Utilities: `camelCase.ts` (e.g., `generateHtml.ts`)
- Types: `types.ts` or inline in component files

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or fixing tests
- `chore`: Build process, dependencies, etc.

### Examples

```
feat(builder): add drag-and-drop section reordering
fix(deploy): handle Render API rate limiting
docs: update installation instructions
refactor(components): extract shared button styles
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place tests next to the code: `Component.test.tsx`
- Test user behavior, not implementation details
- Use meaningful test descriptions
- Include edge cases

## Areas We Need Help

- **Components**: New section types for the builder
- **Templates**: Pre-built website templates
- **Documentation**: Tutorials, guides, API docs
- **Testing**: Increase test coverage
- **Accessibility**: Improve a11y across the app
- **Performance**: Optimize load times and bundle size
- **Internationalization**: Add i18n support

## Questions?

- Open a [Discussion](https://github.com/SGK112/ai-website-builder/discussions)
- Check existing [Issues](https://github.com/SGK112/ai-website-builder/issues)

## Recognition

Contributors are recognized in our README and release notes. Thank you for helping make web development more accessible!
