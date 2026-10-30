# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries and invariants defined in `architecture-context.md`.
- Prefer boring, explicit code over clever abstractions. This codebase handles money, phone calls, and people's homes.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Validate all unknown external input with Zod at system boundaries: request bodies, query params, webhook payloads, AI output, environment variables.
- Use `interface` for object contracts.
- Use string literal unions (or Prisma enums) for statuses — never free-form strings.
- Environment variables are read and validated once in `lib/env.ts`. No `process.env` anywhere else.

## Next.js

- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity, hooks, maps, or realtime subscriptions.
- Keep route handlers and server actions focused on a single responsibility.
- Delayed or retried work (call sequences, notifications, abandonment checks) belongs in Trigger.dev tasks, not in request handlers.
- Protect `/dispatch`, `/tech`, `/settings`, and `/platform` at the routing layer **and** check role again in every handler. Routing protection alone is not enough.

## Tenancy and Access

- Get the current company and role only through `lib/tenancy` helpers (e.g. `requireStaff({ roles: ["dispatcher", "admin"] })`), which resolve `companyId` from the session.
- Every Prisma query on a tenant-owned table includes `companyId` in its `where`. Use the scoped helpers in `lib/db` to make this the default.
- Technicians may only read and update jobs assigned to them — check `assignedTechnicianId` on every technician request.
- Customer access goes through `lib/tracking` (token lookup by hash). Never accept a raw `jobId` from a customer.
- Return `404` (not `403`) when a resource exists but belongs to another company or job, so IDs cannot be probed.

## Job Status

- Never write `job.status` directly. Call the transition module: `transitionJob({ jobId, to, actor, payload })`.
- A transition runs in one database transaction: check allowed from-state and actor, update the job, insert a `JobEvent`. Realtime publish and notifications happen **after** commit.
- Add new statuses or transitions in `lib/jobs/transitions.ts` and update `architecture-context.md` in the same change.

## Money

- All amounts are integers in cents (`amountCents: number`). No floats for money, ever.
- Currency is stored with every amount (`"usd"`).
- Format money for display only at the UI edge with one shared formatter.
- Never trust an amount from the client for a deposit — read it from company settings on the server.

## Time and Location

- Store timestamps in UTC (`DateTime` in Prisma). Display in the company's timezone using one shared formatter.
- Phone numbers are stored in E.164 (`+15551234567`), validated with `libphonenumber-js`.
- Coordinates are `Float` lat/lng with 6 decimal places. Validate ranges before saving.
- Throttle location writes on the server (ignore pings more frequent than every 5 seconds per technician).

## Webhooks (Stripe, Twilio)

- Verify the signature before reading the payload. Reject unsigned or invalid requests with `400`.
- Make every handler idempotent: record the provider event ID in `WebhookEvent` and skip duplicates.
- Respond quickly (`200`) and push follow-up work to background tasks.
- Never change payment status from a client redirect or client call — only from a verified webhook.

## Calls and SMS

- Use `lib/calls` and `lib/sms` only. No direct Twilio calls elsewhere.
- Check consent at send time inside these modules, not only when scheduling.
- Every send writes a `CallAttempt` or `JobEvent` with the provider SID.
- In development and preview, sending is restricted to an allowlist of test numbers (`DEV_ALLOWED_PHONES`). Real customer numbers are never called from non-production environments.

## AI

- All model calls go through `lib/ai`. Prompts live in `lib/ai/prompts/` as versioned files, not inline strings.
- Use structured output with a Zod schema. If parsing fails, use the deterministic fallback summary — never save unvalidated output.
- Never send customer name, phone, email, or exact address to the model.
- Store the prompt version with each saved AI summary.
- Safety messages (gas smell, sparking, burning smell) are static copy, not model output.

## Realtime

- Publish only from the server through `lib/realtime/publish.ts`. Channel names come from one helper (`channels.job(jobId)`, etc.) — never build channel strings inline.
- Clients subscribe through hooks in `components/realtime/` or `hooks/`; tokens come from `/api/realtime/token`, which issues subscribe-only capabilities for the caller's allowed channels.
- Realtime messages carry small payloads (IDs, status, coordinates). Clients refetch details from the server when needed.
- UI must handle disconnects: show a connection indicator and refetch state on reconnect.

## Styling

- Use CSS custom property tokens defined in `globals.css` — no raw Tailwind color classes like `slate-*` or hardcoded hex values.
- Reference tokens through their Tailwind utility names: `bg-base`, `bg-surface`, `text-copy-primary`, `border-surface-border`, `text-brand`, `bg-emergency`, etc.
- Job status display always comes from `JOB_STATUS_DISPLAY` — never hand-pick a color for a status.
- Maintain the border radius scale: `rounded-xl` small elements, `rounded-2xl` cards, `rounded-3xl` modals and sheets.
- Mobile first: write base styles for phones, then `md:` / `lg:` for larger screens.

## API Routes and Server Actions

- Validate and parse input before any logic runs.
- Enforce auth, role, and tenant checks before any read of private data or any mutation.
- Return a consistent response shape: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
- Keep handlers thin — push logic into `lib/` domain modules.
- Rate-limit public endpoints (booking submit, photo upload token, AI summary, refine chat, tracker token checks).

## Logging and Errors

- Use one logger (`lib/logger.ts`). Log job IDs, company IDs, and event types — never customer names, phone numbers, emails, addresses, or photo URLs.
- Never show raw errors to customers. Show a friendly message with the company phone number as a fallback.
- Report unexpected errors to the error tracker with the job ID attached.

## Testing

- Unit test: job transitions (every allowed and forbidden transition), deposit/balance logic, consent checks, AI output schema and fallback, service-area check, ETA recalculation rules.
- Integration test: Stripe and Twilio webhook handlers with recorded fixture payloads (including duplicate delivery).
- End-to-end (Playwright): customer booking happy path on a mobile viewport, dispatcher assign, technician status flow.
- Use Stripe test mode and Twilio test credentials in all automated tests.

## File Organization

- `app/(public)/[companySlug]/` — landing page and booking wizard.
- `app/track/[token]/` — customer tracker.
- `app/dispatch/` — dispatcher dashboard.
- `app/tech/` — technician app.
- `app/settings/` — company admin settings.
- `app/platform/` — internal platform admin.
- `app/api/` — route handlers; `app/api/webhooks/stripe`, `app/api/webhooks/twilio/*`.
- `lib/db/` — Prisma client and tenant-scoped query helpers.
- `lib/tenancy/` — session → company/role resolution and guards.
- `lib/tracking/` — tracking token creation, hashing, lookup.
- `lib/jobs/` — transitions, status display map, assignment (nearest technician).
- `lib/payments/` — Stripe checkout creation, webhook handling, refunds.
- `lib/calls/`, `lib/sms/` — Twilio voice and messaging with consent checks.
- `lib/consent/` — consent text versions and record creation.
- `lib/ai/` — model config, prompts, schemas, fallback summary.
- `lib/maps/` — geocoding, service-area check, ETA (Routes API), deep links.
- `lib/realtime/` — Ably server client, channel names, publish helpers.
- `lib/storage/` — Blob upload tokens and signed read URLs.
- `trigger/` — durable background tasks (call sequence, notifications, abandonment, retention cleanup).
- `components/` — UI composition only; no business logic. Feature folders: `booking/`, `tracker/`, `dispatch/`, `tech/`, `maps/`, `realtime/`.
- `prisma/` — schema, migrations, seed (one demo company, two dispatchers, three technicians).
- Name files after the responsibility they contain, not the technology (`assign-nearest-technician.ts`, not `postgis-utils.ts`).
