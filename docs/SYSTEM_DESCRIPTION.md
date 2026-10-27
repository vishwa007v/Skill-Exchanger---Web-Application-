# Skill Exchanger — System Description

## Product

Skill Exchanger is a learning marketplace where people discover practical
courses and teachers publish lessons made from videos, presentations, and
quizzes. Learners see courses ordered by rating, can search the catalog, mark a
course complete, and rate it after completion.

The visual system is cyan-led with deep navy, mint, and violet supporting
colors. A shared light/dark mode switch is available from the upper-right
corner on every route.

## Folder layout

```text
artifacts/
├── skillshare/                 # Frontend web application package
│   ├── public/                 # Logo, favicon, robots.txt
│   └── src/
│       ├── App.tsx             # Routes, shared shell, learner/teacher UI
│       ├── index.css           # Theme tokens, dark mode, motion, utilities
│       ├── components/         # Shared UI primitives and error boundary
│       ├── hooks/              # Reusable frontend hooks
│       └── pages/              # Route-level fallback pages
├── api-server/                 # Backend Express API package
│   └── src/
│       ├── routes/             # Health, courses, completion, rating, metrics
│       ├── db/                 # API-facing database connection entry point
│       ├── middlewares/        # Clerk production proxy middleware
│       └── lib/                # Server logging
lib/
├── api-spec/                   # OpenAPI source of truth
├── api-client-react/           # Generated React Query client/hooks
├── api-zod/                    # Generated request/response validators
└── db/                         # Shared PostgreSQL + Drizzle connection/schema
docs/
├── SYSTEM_DESCRIPTION.md       # This document
└── DEPLOYMENT_PLAN.md          # Release, test, review, and deployment checklist
```

## Frontend routes

- `/` — public product landing page
- `/sign-in/*?` and `/sign-up/*?` — managed Clerk authentication screens
- `/portal` — learner/teacher role selection
- `/learner` — rating-sorted catalog and search
- `/learner/course/:courseId` — mixed-content course player, completion, and rating
- `/teacher` — teacher metrics and recent courses
- `/teacher/new` — course builder for video, presentation, and quiz blocks

## Backend capabilities

The API contract lives in `lib/api-spec/openapi.yaml` and generates typed
frontend hooks. The API currently provides:

- Published course listing with search and rating/newest sorting
- Course creation
- Course details
- Completion tracking
- Completion-gated ratings
- Teacher summary metrics

The first build uses a seeded in-memory course store so the complete product
flow works immediately in preview. The backend database entry point is now
organized under `artifacts/api-server/src/db/` and reuses the shared
`@workspace/db` connection for the persistence phase.

## Authentication

Clerk is provisioned for browser authentication and the frontend uses the
managed Google-capable sign-in screens. Phone SMS sign-in is not enabled because
the managed Clerk setup does not currently support it; phone-number collection
can be added to onboarding when the persistence model is finalized.