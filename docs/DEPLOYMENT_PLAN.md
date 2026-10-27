# Skill Exchanger — Deployment Plan

This is the follow-up checklist for moving the current preview build to a
production-ready release.

## 1. Persistence

- [ ] Replace the in-memory course store in
      `artifacts/api-server/src/routes/courses.ts` with Drizzle queries.
- [ ] Add database tables for users, courses, content blocks, quiz questions,
      enrollments/completions, and ratings under `lib/db/src/schema/`.
- [ ] Add foreign keys, unique constraints, indexes for course search and rating
      sorting, and timestamps.
- [ ] Run development schema push and seed a small safe dataset.
- [ ] Confirm publish-time schema changes against the production database.

## 2. Media and content

- [ ] Add object storage for uploaded videos, presentations, and thumbnails.
- [ ] Store object paths and metadata in PostgreSQL; do not store file bytes in
      database rows.
- [ ] Validate file size, MIME type, ownership, and access permissions.
- [ ] Add content moderation and a teacher publish/unpublish state.

## 3. Authentication and authorization

- [ ] Configure Google provider branding for the production Clerk environment.
- [ ] Confirm sign-in, sign-up, sign-out, session expiry, and OAuth callback
      behavior on the published domain.
- [ ] Connect Clerk user IDs to local user rows.
- [ ] Protect course creation, teacher metrics, completion, and rating routes.
- [ ] Decide whether phone numbers are profile data or a separate supported
      authentication provider before adding the onboarding field.

## 4. Functional tests

- [ ] API tests for course list ordering, search, create, detail, completion,
      rating authorization, and teacher summary.
- [ ] Frontend tests for light/dark mode persistence and toggle accessibility.
- [ ] Frontend tests for learner search and rating-sorted results.
- [ ] Frontend tests that rating controls stay hidden until completion.
- [ ] Frontend tests for adding video, presentation, and quiz blocks.
- [ ] Auth smoke tests for Google sign-in and sign-out.
- [ ] Responsive checks at mobile, tablet, and desktop widths.
- [ ] Accessibility checks for keyboard navigation, labels, contrast, and focus.

## 5. Review and security

- [ ] Run the project's typecheck and production build.
- [ ] Run dependency audit and static security scanning.
- [ ] Review API validation, authorization, rate limits, and error responses.
- [ ] Review upload security and private media access.
- [ ] Confirm no secrets are committed and production environment variables are
      configured through workspace secrets.
- [ ] Complete a code review focused on data ownership and learner privacy.

## 6. Release readiness

- [ ] Add error tracking, structured API logs, and a basic health check alert.
- [ ] Verify SEO title, description, Open Graph metadata, and favicon.
- [ ] Test database backup/restore and rollback behavior.
- [ ] Run a production-like smoke test after schema and environment setup.
- [ ] Publish only after the full checklist above is green.