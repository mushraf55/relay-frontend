# Relay codebase map

Relay has two applications in one repository:

- `src/` is the Next.js frontend. It renders the landing page, authenticated dashboard, public chat, and embedded widget.
- `backend/` is the Express API. It owns authentication checks, database writes, billing, background indexing, retrieval, and public-chat persistence.

## Frontend

```text
src/
├── app/                         Next.js routes and layouts
├── components/
│   ├── layout/                  Dashboard shell, sidebar, theme, cloud loader
│   ├── ui/                      Generated shadcn primitives
│   ├── formatted-text.tsx       Shared safe answer renderer
│   ├── icon.tsx                 Shared icons and brand mark
│   └── ui.tsx                   Small app-level wrappers around shadcn
├── features/
│   ├── auth/components/         Clerk sign-in and sign-up screens
│   ├── billing/components/      Pricing and subscription controls
│   ├── chatbots/components/     Assistant editor and playground
│   ├── conversations/components Conversation inbox and analytics
│   ├── knowledge/components/    Sources, upload progress, retry controls
│   ├── marketing/components/    Landing-page product preview
│   ├── public-chat/components/  Share-link and widget chat client
│   ├── settings/components/     Workspace and account settings
│   └── workspace/components/    Dashboard pages and navigation logic
├── hooks/                       Shared React hooks
└── lib/                         API client, workspace state, demo data
```

Put route entry points in `app/`, reusable shadcn primitives in `components/ui/`, and product-specific UI in the matching `features/` directory. The main client-side data store is `src/lib/workspace.ts`; HTTP helpers are in `src/lib/api.ts` and public chat uses `src/lib/public-chat.ts`.

## Backend

```text
backend/
├── migrations/                  Versioned Supabase SQL migrations
├── scripts/                     Setup, diagnostics, and live smoke tests
├── src/
│   ├── config/                  Environment parsing and database URL handling
│   ├── features/
│   │   ├── ai/                  Ollama/OpenAI clients, retrieval, chat routes
│   │   ├── billing/             Stripe routes, client, and webhook
│   │   ├── connectors/          Shopify, WooCommerce, WordPress imports
│   │   ├── deployments/         Publishing and embed configuration
│   │   ├── knowledge/           Uploads, extraction, indexing jobs, progress
│   │   ├── public-chat/         Shared rooms and widget endpoints
│   │   ├── websites/            Website crawler and scraper routes
│   │   └── workspaces/          Workspace loading and versioned persistence
│   ├── http/app.js              Express middleware and route mounting
│   ├── infrastructure/          Postgres, R2, and Upstash adapters
│   ├── realtime/                Socket.IO progress delivery
│   └── server.js                Process entry point and shutdown
└── test/                        Backend unit and API tests
```

`backend/src/http/app.js` wires features together. Business behavior belongs in `features/`; service-specific code belongs in `infrastructure/`; environment access belongs in `config/`.

## Main flows

### Authenticated workspace

Clerk protects the frontend route and signs API requests. Express verifies the token again, derives the workspace ID from Clerk claims, creates the workspace row when needed, then `features/workspaces/routes.js` loads or updates the versioned JSON document.

### Knowledge indexing

1. `features/knowledge/routes.js` validates a file up to 30 MB and stores it privately in R2.
2. It starts `indexStoredFile` inline for local Ollama or sends an Inngest event in production.
3. `features/knowledge/extraction.js` extracts readable text.
4. `features/ai/client.js` splits text into 2,400-character sections with overlap.
5. `features/knowledge/jobs.js` embeds up to 64 sections per model request and writes each batch to Supabase in one SQL statement.
6. `features/knowledge/progress.js` persists progress and emits Socket.IO updates to the dashboard.

The larger sections and batch writes reduce model calls and database round trips. They improve throughput but still depend on local CPU/GPU speed and model memory.

### Grounded chat

The chat route embeds the latest question, queries the nearest matching `relay.ai_chunks`, builds a prompt from those sections and recent messages, and calls the configured reasoning model. The playground receives authenticated newline-delimited stream events and renders model output as it arrives. Local development uses Ollama; production can switch to OpenAI through environment values.

### Publishing

Deployment routes create opaque share IDs and allowed embed origins. Public-chat routes store room messages and only invoke the assistant when a message contains `@relay`. `/embed.js` mounts the same assistant in an isolated iframe room.

## Commands

Run the frontend from the repository root:

```powershell
npm run dev
npm run lint
npm run build
```

Run the backend from `backend/`:

```powershell
npm run dev
npm test
npm run test:file-pipeline
npm run db:check
```

Use `backend/.env` for server secrets and `.env.local` for values needed by Next.js. Both files are ignored by Git.
