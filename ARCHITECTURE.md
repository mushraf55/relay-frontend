# Active architecture

Relay follows one flow: authenticate, create a chatbot, add knowledge, retrieve grounded context, and publish.

- `src/app/` owns public, authentication, dashboard, share, and embed routes.
- `src/features/**/core-*` contains active user-facing modules.
- `src/lib/api.ts` is the authenticated HTTP adapter.
- `src/lib/workspace.ts` owns optimistic state, revision-checked persistence, file progress polling, and AI requests.
- The backend owns identity verification, tenant derivation, storage, indexing, retrieval, generation, citations, and publishing.

Only workspace, AI, knowledge, deployment, website ingestion, public chat, and embed interfaces are mounted. See root `LEGACY.md` for unmounted experiments.
