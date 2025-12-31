# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email security concerns to: security@ai-website-builder.dev (or open a private security advisory on GitHub)
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

### Disclosure Policy

- We follow coordinated disclosure
- We'll work with you to understand and resolve the issue
- We'll credit you in the security advisory (unless you prefer anonymity)

## Security Best Practices for Users

### Environment Variables

Never commit sensitive data. Use `.env.local` for secrets:

```bash
# Required - generate strong secrets
NEXTAUTH_SECRET=<generate with: openssl rand -hex 32>
ENCRYPTION_KEY=<generate with: openssl rand -hex 32>

# API Keys - keep these private
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GITHUB_ACCESS_TOKEN=ghp_...
RENDER_API_KEY=rnd_...
```

### Database Security

- Use strong MongoDB passwords
- Enable authentication on your MongoDB instance
- Use SSL/TLS for database connections in production
- Regularly backup your database

### Deployment Security

- Use HTTPS in production
- Set appropriate CORS headers
- Enable rate limiting for API endpoints
- Keep dependencies updated

## Known Security Considerations

### User-Generated Content

The builder allows users to create custom HTML. When deploying user sites:
- Sites are deployed as static HTML
- No server-side code execution on deployed sites
- Consider implementing CSP headers for additional protection

### API Key Storage

- API keys are stored encrypted in the database
- Keys are never exposed to the client
- Consider rotating keys regularly

## Dependencies

We regularly update dependencies to patch security vulnerabilities. Run:

```bash
npm audit
npm audit fix
```

## Security Features

- **Authentication**: NextAuth.js with secure session handling
- **Password Hashing**: bcrypt with appropriate salt rounds
- **Input Validation**: Zod schemas for all API inputs
- **CSRF Protection**: Built into NextAuth.js
- **Rate Limiting**: Implemented on sensitive endpoints
