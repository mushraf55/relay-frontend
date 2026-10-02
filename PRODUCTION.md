# Relay Production Checklist

Relay is ready to deploy only after these checks pass with production environment variables.

## Required services

- Clerk production app keys for frontend and backend. For interview/demo deployments only, Clerk development keys may be used with `ALLOW_CLERK_DEV_MODE=true`.
- Stripe live secret key, live price IDs, and a live webhook signing secret. For interview/demo deployments only, Stripe test mode may be used with `ALLOW_STRIPE_TEST_MODE=true`.
- Postgres with `pgvector` enabled.
- Cloudflare R2 credentials for private document storage.
- Cloudflare Workers AI, OpenAI, or another embedding provider.
- Groq, OpenAI, or another chat generation provider.
- Inngest event key and signing key.
- Upstash Redis REST URL and token for distributed rate limits.

## Backend deploy steps

1. Set `NODE_ENV=production`.
2. Set `APP_URL` to the final HTTPS frontend URL.
3. Set `ALLOWED_ORIGINS` to any extra trusted frontend or embed origins.
4. Set `JOB_PROVIDER=inngest`.
5. Run `npm --prefix backend run db:migrate`.
6. Run `NODE_ENV=production npm --prefix backend run production:check`.
7. Configure Stripe webhook URL: `https://YOUR_BACKEND_DOMAIN/webhooks/stripe`.
8. Configure Inngest endpoint: `https://YOUR_BACKEND_DOMAIN/api/inngest`.

## Security notes

- Do not commit `.env` files or provider secrets.
- Production startup refuses Clerk development keys unless `ALLOW_CLERK_DEV_MODE=true` is set for a demo deployment. Stripe test keys are refused unless `ALLOW_STRIPE_TEST_MODE=true` is set for a demo deployment.
- Production startup refuses non-HTTPS `APP_URL`.
- Public widget routes are intentionally CORS-open; authenticated API routes are restricted to configured origins.
- Request logs include request IDs and avoid secret-like fields.
