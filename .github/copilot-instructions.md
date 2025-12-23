# AI Website Builder - Copilot Instructions

## Architecture Overview

This is a **Turborepo monorepo** with Next.js 14 (App Router) frontend and modular shared packages. The app generates full-stack websites using three AI providers (Claude, Gemini, OpenAI) via an intelligent routing system.

**Key Components:**
- `apps/web`: Next.js 14 app with App Router, NextAuth, and streaming AI chat
- `packages/ai-agents`: Multi-provider AI router with task-based agent selection
- `packages/database`: Mongoose models and connection management
- `packages/deploy-utils`: GitHub/Render deployment automation
- `packages/shared`: Constants, encryption, validation utilities

**Data Flow:**
User → Wizard → AI Chat API → AIAgentRouter → Claude/Gemini/OpenAI → Generated Code → Database → Project View → GitHub → Render

## Development Workflows

```bash
npm run dev        # Run all workspaces in parallel (web + packages)
npm run build      # Build all packages (uses Turbo cache)
npm run lint       # Lint all workspaces
```

**Important:** Always run commands from the **monorepo root**. Turbo handles workspace dependencies automatically. The `dev` task persists, `build` has `^build` dependency (builds packages before apps).

## Critical Patterns

### AI Agent Router (`packages/ai-agents/src/router.ts`)
The router intelligently selects AI providers based on task type:
- **Claude**: Complex TypeScript/React codegen, architecture design (200K context)
- **Gemini**: Multi-file operations, long contexts, cost-effective (1M context)
- **OpenAI**: Conversational UI, user chat, JSON mode (128K context)

**Usage:** Always check `AGENT_CAPABILITIES` when modifying routing logic. User `preferredAgent` overrides all routing decisions.

### Database Connection (`apps/web/src/lib/db.ts`)
Uses **global caching pattern** for Next.js serverless environments:
```typescript
if (!cached.conn) {
  cached.promise = mongoose.connect(MONGODB_URI)
}
```
**Never** create new connections in API routes—always import `connectDB()` from `@/lib/db`.

### Authentication (`apps/web/src/lib/auth.ts`)
NextAuth with three providers: Credentials (bcrypt), Google OAuth, GitHub OAuth.
- User model has `matchPassword()` method for bcrypt comparison
- Session includes custom fields: `id`, `plan` (free/pro/enterprise)
- OAuth users don't have passwords (`password` field is optional, `select: false`)

### API Routes Streaming Pattern (`apps/web/src/app/api/ai/chat/route.ts`)
Uses Server-Sent Events (SSE) for AI responses:
```typescript
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of generator) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({...})}\n\n`))
    }
  }
})
```
**Always** include `done: true` signal on completion and proper error handling in stream.

### Encryption (`packages/shared/src/encryption.ts`)
Credentials stored with AES-256-GCM + PBKDF2 key derivation. Format: `salt + iv + tag + encrypted`.
- `ENCRYPTION_KEY` must be ≥32 chars
- Use `EncryptionService` for all credential storage (Stripe keys, API tokens, etc.)

### Project Structure (`packages/database/src/models/Project.ts`)
Projects track:
- `files[]`: Generated code with `path`, `content`, `generatedBy` (claude/gemini/openai)
- `generationHistory[]`: Audit trail of all AI interactions
- `status`: 'draft' → 'generating' → 'ready' → 'deployed'
- `aiAgent`: Records which provider generated the project

**Important:** When generating code, always populate `files[]` array and update `generationHistory[]`.

### Project Generation Flow (`apps/web/src/app/api/projects/route.ts`)
The POST endpoint:
1. Creates project in "generating" status
2. Builds generation prompt from wizard config
3. Calls AIAgentRouter.execute() for code generation
4. Parses generated content using `---FILE: path---` markers
5. Updates project with files and sets status to "ready"

**File Parsing:** AI responses must use format:
```
---FILE: src/app/page.tsx---
[content]
---END FILE---
```

### Deployment Flow (`apps/web/src/app/api/projects/[id]/deploy/route.ts`)
Deployment pipeline:
1. Validates project status is "ready"
2. Creates Deployment record with logs
3. Uses GitHubDeployService to create repo and commit files
4. Updates project.repositoryUrl and project.status to "deployed"
5. Logs each step to deployment.logs[] array

**GitHub Token:** Requires `repo` and `workflow` scopes.

## Environment Variables

Required in `.env.local` (apps/web):
```bash
MONGODB_URI="mongodb://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="..." # ≥32 chars

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."

# OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."
```

## Deployment

Uses `render.yaml` for infrastructure as code. Build happens at monorepo root:
```bash
cd ../.. && npm install && npm run build  # From apps/web context
```
**Never** deploy individual workspaces—Turbo builds handle cross-package dependencies.

## Type Safety Notes

- All packages export proper TypeScript types via `src/index.ts`
- Database models: Import types from `@ai-website-builder/database` (e.g., `IUser`, `IProject`)
- AI agents: Use `ChatMessage`, `GenerationResult`, `TaskType` from `@ai-website-builder/ai-agents`
- Constants: Import from `@ai-website-builder/shared` to avoid magic strings

**Convention:** Type-only exports use `export type`, runtime exports use `export`.

## Common Pitfalls

1. **Don't** call mongoose models before `connectDB()`—you'll get connection errors
2. **Don't** use `bcrypt.hash()` directly—use `User.create()` which has a pre-save hook
3. **Don't** forget to check session in API routes (`getServerSession(authOptions)`)
4. **Don't** stream responses without proper error handling—wrap in try/catch
5. **Don't** use AI agents without checking API keys—router will throw if keys missing
6. **Don't** forget file parsing markers—AI must respond with `---FILE:` format
7. **Don't** deploy projects not in "ready" status—validation will fail

## Key Pages & Routes

- `/new-project` - 5-step wizard with live AI chat
- `/dashboard/projects` - Projects list with status badges
- `/dashboard/projects/[id]` - File tree + code viewer
- `POST /api/projects` - Creates project + generates code
- `POST /api/projects/[id]/deploy` - GitHub deployment with logs
