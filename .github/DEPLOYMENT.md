# Deployment Setup Guide

This guide explains how to set up automatic deployments for the AI Website Builder.

## Prerequisites

- GitHub repository with push access
- Render account with the service deployed
- (Optional) RunPod API key for GPU endpoints

## GitHub Secrets Required

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

### Required Secrets

| Secret Name | Description | Where to get it |
|-------------|-------------|-----------------|
| `RENDER_DEPLOY_HOOK` | Render deploy hook URL | Render Dashboard → Service → Settings → Deploy Hook |
| `RENDER_API_KEY` | Render API key (alternative to deploy hook) | Render Dashboard → Account Settings → API Keys |
| `RENDER_SERVICE_ID` | Render service ID (use with API key) | `srv-d554is8gjchc7388svd0` |

### Optional Secrets

| Secret Name | Description | Where to get it |
|-------------|-------------|-----------------|
| `CRON_SECRET` | Secret for cron endpoint auth | Generate with: `openssl rand -hex 32` |
| `APP_URL` | Production URL | `https://ai-website-builder-ntzg.onrender.com` |

## Deployment Methods

### Method 1: Deploy Hook (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service → Settings
3. Scroll to "Deploy Hook"
4. Click "Generate Deploy Hook"
5. Copy the URL
6. Add to GitHub Secrets as `RENDER_DEPLOY_HOOK`

### Method 2: Render API

1. Go to [Render Account Settings](https://dashboard.render.com/u/settings)
2. Create an API key
3. Add to GitHub Secrets:
   - `RENDER_API_KEY`: Your API key
   - `RENDER_SERVICE_ID`: `srv-d554is8gjchc7388svd0`

## Workflows

### CI/CD Pipeline (`ci-cd.yml`)

Triggers on:
- Push to `main` or `master` branch
- Pull requests to `main` or `master`

Jobs:
1. **Lint** - ESLint and TypeScript checks
2. **Build** - Builds the application
3. **Test** - Runs test suite
4. **Deploy** - Deploys to Render (only on main branch push)
5. **Warmup** - Warms up GPU endpoints after deploy

### PR Check (`pr-check.yml`)

Triggers on:
- Pull request opened/updated

Jobs:
1. **Validate** - Quick lint and type checks
2. **Build Check** - Ensures build succeeds
3. **Security** - npm audit for vulnerabilities
4. **Comment** - Adds status comment to PR

### GPU Warmup Cron (`warmup-cron.yml`)

Triggers:
- Every 5 minutes (scheduled)
- Manual trigger via workflow dispatch

Purpose:
- Keeps RunPod GPU endpoints warm
- Reduces cold start latency for users

## Manual Deployment

To trigger a manual deployment:

```bash
# Using GitHub CLI
gh workflow run ci-cd.yml

# Or go to Actions tab → CI/CD Pipeline → Run workflow
```

## Monitoring

- **GitHub Actions**: Check the Actions tab for workflow runs
- **Render Dashboard**: Monitor deployments and logs
- **Health Check**: `GET /api/ai/health` returns provider status

## Troubleshooting

### Deploy fails with "No deployment credentials configured"

Ensure you have set either:
- `RENDER_DEPLOY_HOOK`, or
- Both `RENDER_API_KEY` and `RENDER_SERVICE_ID`

### Warmup fails with 401 Unauthorized

1. Generate a new cron secret: `openssl rand -hex 32`
2. Add to GitHub Secrets as `CRON_SECRET`
3. Add the same value to your Render environment variables

### Build fails with TypeScript errors

The workflow uses `continue-on-error: true` for lint/type checks. If you want strict mode:

1. Edit `.github/workflows/ci-cd.yml`
2. Remove `continue-on-error: true` from the relevant steps

## Environment Variables on Render

Make sure these are set in your Render service:

```
CRON_SECRET=<same as GitHub secret>
RUNPOD_API_KEY=<your RunPod API key>
RUNPOD_FLUX_ENDPOINT=<your FLUX endpoint ID>
```
