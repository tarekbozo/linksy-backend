# Auth patch summary

This patch integrates a production-hardened, passwordless auth flow into your NestJS project.

## Included
- Email magic links
- Google and GitHub OAuth
- JWT access + refresh tokens in httpOnly cookies
- Persistent session table with rotation and reuse detection
- Role-based auth primitives
- CSRF protection for mutating requests
- Audit logging
- Helmet, validation, throttling, and safer CORS defaults

## Important package additions
Install these if they are not already in your project:

```bash
npm i @nestjs/jwt @nestjs/passport passport passport-jwt passport-google-oauth20 passport-github2 @nestjs/config @nestjs/throttler cookie-parser helmet resend class-validator class-transformer
npm i -D @types/cookie-parser @types/passport-jwt @types/passport-google-oauth20
```

## Prisma
Run:

```bash
npx prisma generate
npx prisma migrate dev --name harden_auth
```

## Frontend usage
1. GET `/api/v1/auth/csrf`
2. send `X-CSRF-Token` on mutating requests
3. use `credentials: 'include'`
4. login via `/api/v1/auth/magic/request` or OAuth endpoints

## Password auth
Removed intentionally.
