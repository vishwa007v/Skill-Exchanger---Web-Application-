# SkillShare Learning Platform

SkillShare helps people discover, publish, and complete practical courses made from videos, presentations, and quizzes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/skillshare/src/App.tsx` — learner, teacher, course builder, and auth-facing UI.
- `artifacts/skillshare/src/index.css` — SkillShare's saffron, ink, and paper visual language.
- `lib/api-spec/openapi.yaml` — source of truth for course, completion, rating, and teacher summary APIs.
- `artifacts/api-server/src/routes/courses.ts` — course discovery and publishing service.
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — managed Clerk production proxy.

## Architecture decisions

- Clerk provides managed web authentication with Google-capable sign-in screens; phone numbers are surfaced as onboarding context because managed Clerk phone SMS sign-in is not currently supported.
- The course API is contract-first through OpenAPI and generated React Query hooks.
- Courses are ordered by rating by default; rating mutations require a recorded completion.
- Video and presentation blocks store source links and metadata; file uploads can be added later with object storage without changing the course contract.

## Product

- Public landing page with sign-in and sign-up entry points.
- Learner portal with search, rating-sorted discovery, mixed-content course detail, completion, and completion-gated ratings.
- Teacher portal with publishing metrics and a course builder for video, presentation, and quiz blocks.

## User preferences

No additional preferences recorded.

## Gotchas

- Artifact builds need the workflow-provided `PORT` and `BASE_PATH` values; use the managed workflow or pass both explicitly for a local build.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
