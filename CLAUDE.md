# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev        # Start with hot-reload (watch mode)
npm run start:debug      # Start with debugger attached

# Build
npm run build            # prisma generate + nest build

# Production
npm run start:prod       # prisma migrate deploy + node dist/src/main.js

# Code quality
npm run lint             # ESLint with auto-fix
npm run format           # Prettier format

# Tests
npm test                 # Jest
npm run test:watch       # Jest in watch mode
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests

# Database
npx prisma migrate dev --schema=prisma/schema.prisma   # Create and apply a migration
npx prisma studio --schema=prisma/schema.prisma         # Open Prisma Studio
npx prisma generate --schema=prisma/schema.prisma       # Regenerate client after schema changes
```

## Architecture

NestJS REST API for an AI platform (LinkSy) with credit-based billing, passwordless auth, and multi-provider AI.

**Global API prefix:** `/api/v1`
**Default port:** `3000` (overridable via `PORT` env)

### Global Guards & Filters (applied app-wide in `app.module.ts`)

- **ThrottlerGuard** — rate limiting (default 300/min, strict 100/min); use `@SkipThrottle()` to bypass
- **JwtAuthGuard** — all routes require a valid JWT by default; use `@Public()` to opt out
- **RolesGuard** — checks `@Roles(Role.ADMIN)` etc.; passes if no decorator is present
- **GlobalExceptionFilter** — maps Prisma P2002 → 409, P2025 → 404; normalizes all error responses

### Authentication

Magic links + Google/GitHub OAuth. All tokens live in httpOnly cookies (`access_token` 15 min, `refresh_token` 30 days, path-restricted to `/api/v1/auth`). A non-httpOnly `csrf_token` cookie must be forwarded as the `X-CSRF-Token` header on all mutating requests.

**CSRF is skipped for:** `GET health`, `GET auth/csrf`, OAuth callbacks, `POST auth/magic/verify`, `POST auth/refresh`.

Session management: max 5 sessions/user; oldest revoked on overflow; refresh rotates the session token; reuse detection revokes all sessions.

**Key decorators:** `@Public()`, `@Roles(Role.X)`, `@CurrentUser()`, `@IpAddress()`, `@UserAgent()`

### Billing & Credits

Three credit bucket types tracked in `UserCredit`: `SUBSCRIPTION`, `TOPUP`, `FREE_DAILY`.
- Free daily: 10 credits/day, reset by `ensureFreeDailyCredit()` in `BillingService`
- Orders (`Order` model) are created for plan upgrades and topup purchases; an admin confirms or rejects them
- All credit movements are append-only in `CreditTransaction`

### AI Chat (`ChatModule`)

Streaming responses via `POST /api/v1/chat/conversations/:id/stream`. Supported providers:
- **Anthropic:** Claude Haiku 4.5, Claude Sonnet 4.6
- **OpenAI:** GPT-4.1 Nano/Mini, GPT-4o, GPT-4o Mini
- **Gemini:** Gemini 2.5 Flash

Each message deducts credits. File attachments (images, PDFs, code) are supported.

### Key Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| Auth | `src/auth/` | Magic links, OAuth, JWT, sessions, CSRF |
| Users | `src/users/` | User CRUD, roles, agent order views |
| Chat | `src/chat/` | Conversations, streaming AI messages |
| Billing | `src/billing/` | Credits, subscriptions, topups, orders |
| Image | `src/image/` | Image generation with credit deduction |
| Voice | `src/voice/` | Voice transcription with credit deduction |
| Waitlist | `src/waitlist/` | Waitlist join, referrals, email blasts |
| Email | `src/email/` | Resend-based transactional email |
| Audit | `src/audit/` | Non-blocking security event logging |
| Prisma | `src/prisma/` | `@Global()` DB service, available everywhere |

### Database

PostgreSQL via Prisma. Schema at `prisma/schema.prisma`. Core models: `User`, `Session`, `MagicToken`, `Account`, `Conversation`, `ChatMessage`, `UserCredit`, `CreditTransaction`, `UserSubscription`, `Order`, `TopUpPack`, `FreeDailyCredit`, `GeneratedImage`, `AuditLog`, `WaitlistEntry`.

### Environment Variables

Copy `.env.example` to `.env`. Required vars:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — long random secrets
- `RESEND_API_KEY` + `EMAIL_FROM` — transactional email
- `GOOGLE_CLIENT_ID/SECRET` + `GITHUB_CLIENT_ID/SECRET` — OAuth providers
- `ALLOWED_ORIGINS` — comma-separated allowed CORS origins (default includes `localhost:3001`)
