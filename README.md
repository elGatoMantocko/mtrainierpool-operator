# Mt. Rainier Pool Checker

A PWA that tracks whether the Mt. Rainier pool is open. It scrapes the pool's website, stores closure announcements in Supabase, and runs them through an AI model to extract structured open/closed status with dates and confidence scores.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite, TanStack Router, TanStack Query, Mantine v9 |
| Backend | Supabase Edge Function (Deno), Hono, zod-openapi |
| Database | Supabase Postgres |
| Auth | Supabase Auth — email/password + Discord OAuth |
| AI | Supabase AI (`pool-operator` model) |

## How it works

1. `GET /api/check` scrapes `mtrainierpool.com` and extracts the status banner text.
2. Each unique message is stored in `pool_closures` (deduplicated by UUID v5 of the message).
3. The `pool-operator` AI model analyzes the message and extracts `closure_date`, `reopening_date`, `confidence_score`, `reasoning`, and `flags` — stored in `pool_closure_analysis`.
4. The frontend displays the latest analysis to authenticated users.

## Prerequisites

- [Deno](https://deno.land/) v2
- [Node.js](https://nodejs.org/) + [Yarn](https://yarnpkg.com/) v4
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Local development

### 1. Start Supabase

```sh
supabase start
```

This runs the full local Supabase stack (Postgres, Auth, Edge Runtime, Studio at `:54323`).

### 2. Set up environment variables

Create `frontend/.env.local`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from supabase start output>
```

Create `.env` in the repo root (for the scripts CLI):
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

### 3. Start the frontend

```sh
yarn workspace frontend dev
# → http://localhost:3000
```

### 4. Serve the edge function

```sh
supabase functions serve
```

### 5. Trigger a pool check manually

```sh
yarn pool check
```

## Code generation

After changing the API routes or database schema, regenerate derived files:

```sh
# Regenerate TypeScript types from local Supabase schema
yarn gen:types

# Regenerate the scripts/client/ API client from the OpenAPI spec
yarn pool create-client
```

> `scripts/client/` and `frontend/src/routeTree.gen.ts` are generated — do not edit them by hand.

## Project structure

```
├── frontend/               # React PWA (Yarn workspace)
│   └── src/
│       ├── api/            # TanStack Query options + Supabase client
│       ├── components/     # UI components
│       └── routes/         # File-based routes (TanStack Router)
├── supabase/
│   ├── functions/api/      # Hono edge function (Deno)
│   └── migrations/         # Postgres migrations
└── scripts/
    ├── pool.ts             # CLI entrypoint
    └── client/             # Generated API client (do not edit)
```
