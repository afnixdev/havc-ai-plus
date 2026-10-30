# Development Workflow

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and what the current state of progress is. Always implement against these specs — do not infer or invent behavior from scratch.

This product moves real money, places real phone calls, and shows real people's locations. Correctness and safety come before speed.

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.
- Build each surface against seeded data first, then connect the real integration (Stripe, Twilio, Google Maps, Ably, AI) in a separate step.

## Build Order

Follow this order unless `progress-tracker.md` says otherwise. Each line is one or more feature units.

1. **Foundation**: project setup, env validation, tokens in `globals.css`, Prisma schema, seed data, Clerk + roles + tenancy helpers.
2. **Booking (no AI, no payments)**: landing page, wizard screens, address autocomplete + service-area check, job draft → submit.
3. **AI summary**: schema, prompt, fallback summary, review step, optional refine chat.
4. **Photos**: upload token, direct upload, signed read URLs.
5. **Deposit**: Stripe Checkout, webhook, `pending_deposit → confirmed`, tracking token + link.
6. **Dispatcher inbox + job detail** (polling or manual refresh first).
7. **Assignment**: manual assign, then auto-assign nearest.
8. **Technician app**: job list, job detail, status buttons, navigation link.
9. **Realtime**: Ably tokens, status publish, inbox live updates.
10. **Live location + tracker**: location endpoint, tracker map, ETA, mirrored vehicle marker.
11. **Consent + auto-call**: consent records, Trigger.dev call sequence, Twilio callbacks, manual follow-up flag.
12. **SMS + notifications**.
13. **Completion + balance payment**.
14. **Hardening**: rate limits, error states, retention cleanup, end-to-end tests, pilot company setup.

## When To Split Work

Split an implementation step if it combines:

- UI changes and background task changes
- UI changes and a webhook handler
- Job status transitions and payment logic
- Realtime publishing and database schema changes
- A new external integration and the UI that uses it
- Multiple unrelated API routes
- Behavior that is not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Working With External Services

- Use Stripe **test mode**, Twilio **test credentials** or allowlisted test numbers, and a restricted Google Maps dev key in development.
- Never call, text, or charge a real customer from development or preview environments.
- Use a tunnel (e.g. ngrok) or Stripe CLI / Twilio CLI forwarding to test webhooks locally. Document the command in the README.
- Save sample webhook payloads as fixtures in `tests/fixtures/` and test handlers against them, including duplicate delivery.
- When adding a new external service or API, add its env vars to `lib/env.ts` and `.env.example` in the same change.

## Handling Missing Requirements

- Do not invent product behavior that is not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.
- Never invent customer-facing legal or policy text (consent wording, privacy policy, refund policy, deposit terms). Use clearly marked placeholders (`[PLACEHOLDER — company to supply]`) and add an open question.
- Never invent reviews, ratings, or testimonials — not even as sample data on a page that could ship. Seed data uses clearly fake names like "Demo Cooling Co."

## Protected Foundation Components

Do not modify generated third-party foundation components unless explicitly instructed.

This includes:

- `components/ui/*` (shadcn/ui components)
- third-party library internals
- generated Prisma client output

These should remain default and reusable.

Project-specific styling, layout changes, and feature logic must be implemented in app-level components instead of modifying foundation components.

Only modify these files when a task explicitly requires it.

## Database Changes

- Every schema change is a Prisma migration with a descriptive name.
- Never edit an applied migration. Create a new one.
- New tenant-owned tables must include `companyId` with an index, and the scoped helper must be used for queries.
- Update the Data Model table in `architecture-context.md` when entities change.

## Keeping Docs In Sync

Update the relevant context file whenever implementation changes:

- System architecture, boundaries, or integrations
- Data model, job lifecycle, or storage decisions
- Code conventions or standards
- Feature scope or phase
- UI tokens or layout patterns

Progress state must reflect the actual state of the implementation, not the intended state.

## Before Moving To The Next Unit

1. The current unit works end to end within its defined scope, on a mobile viewport where it is customer- or technician-facing.
2. No invariant defined in `architecture-context.md` was violated (re-read the list).
3. Tenant isolation was checked: a user from a second seeded company cannot see or change the new data.
4. Type check, lint, and relevant tests pass.
5. `progress-tracker.md` reflects the completed work.
