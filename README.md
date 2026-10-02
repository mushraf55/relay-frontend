# Relay — Chatbot SaaS

Next.js frontend with a separate Express backend, Clerk authentication, Supabase Postgres storage through Drizzle, and Stripe subscriptions.

## Run locally

At the repository root:

```powershell
npm install
npm run dev
```

In another terminal:

```powershell
cd backend
npm install
npm run env:import
npm run db:migrate
npm run dev
```

Open http://localhost:3000. See [backend/README.md](backend/README.md) for environment configuration, database migrations, Stripe webhooks and API routes. The root `.env.local` supplies Clerk keys to Next; backend secrets live in ignored `backend/.env`. Never commit either file.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the folder map, main request flows, and where each feature belongs.

The landing page is public. Clerk controls login/signup and protects `/dashboard` and `/onboarding`. Accounts start with an empty cloud workspace. Bots, source content, conversations and preferences persist to Supabase; optimistic revision checks reject stale writes. Only workspace admins may edit. Clerk Organizations manage real team membership, and Stripe Checkout/Customer Portal manage subscriptions. Paid access is confirmed by signed webhooks.

Ollama powers real source embeddings and grounded playground answers. Website URLs, text, FAQ, PDF, DOCX, TXT and Markdown sources are supported. The URL scraper reads up to 10 public same-site pages, while uploaded documents are stored privately in Cloudflare R2, processed in the background, and indexed in Supabase. Published assistants provide a persistent shared `@relay` room and a working website embed script. Shopify, WooCommerce and WordPress can import read-only knowledge snapshots. Upstash Redis provides shared request limits. Account recovery is handled within Clerk. See backend/AI.md for local setup, backend/CONNECTORS.md for connector credentials, and the OpenAI deployment switch.

## Validate

```powershell
npm run lint
npm run build
npm --prefix backend test
```

See DESIGN.md for the visual system, and backend/README.md for remaining operational boundaries.

