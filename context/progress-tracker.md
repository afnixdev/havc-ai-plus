# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 0 — Pre-work / Foundation (in progress)

## Current Goal

- Lock the open questions that block the schema, then set up the foundation: Next.js project, design tokens, Prisma schema, seed data, Clerk with roles, and tenancy helpers.

## Completed

- Context files written (project overview, architecture, UI, code standards, workflow, tracker).
- Feature spec `01-design-system`: shadcn/ui initialized (`base-nova` style, Base UI primitives), components Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/` (unmodified), `lucide-react` installed, `lib/utils.ts` exports `cn()` (shadcn's `cn` package — clsx + tailwind-merge replacement). `globals.css` holds the `ui-context.md` light-theme tokens with shadcn variables mapped onto them. Verified: type check + lint pass, all components render, `cn()` merges project and shadcn tokens correctly, no stock shadcn palette or OS dark-mode styling in the compiled CSS.

- Feature spec `02-editor` — editor chrome:
  - [x] `components/editor/editor-navbar.tsx` — fixed `h-14` top navbar, left/center/right sections (`center` / `right` slot props), sidebar toggle using `PanelLeftOpen` / `PanelLeftClose` by `isSidebarOpen`, dark background (`bg-chrome`), subtle bottom border (`border-chrome-border`).
  - [x] `components/editor/project-sidebar.tsx` — `fixed` below the navbar so it floats over the canvas without pushing content, slides in from the left via `translate-x`, props `isOpen` / `onClose` / optional `onNewProject`, header "Project" + close button, shadcn `Tabs` (My Projects / Shared) with empty placeholder states, full-width New Project button with `Plus` at the bottom. `inert` while closed.
  - [x] `components/editor/editor-dialog.tsx` — dialog pattern over shadcn `Dialog` (unmodified) with token styling; supports `title`, `description`, `footer` actions, and body. No concrete dialogs built.
  - [x] New dark chrome tokens in `globals.css` (`--bg-chrome`, `--bg-chrome-hover`, `--border-chrome`, `--text-on-chrome`, `--text-on-chrome-muted`), documented in `ui-context.md`.
  - [x] Verified: type check, lint, and `next build` pass; new utilities are present in compiled CSS. Components are not yet mounted on any route.

## In Progress

- None.

## Next Up

Phase 0 / Foundation (Weeks 1–2):

1. Create the Next.js 16 + TypeScript project with Tailwind and shadcn/ui; add `globals.css` tokens from `ui-context.md`.
2. Add `lib/env.ts` with Zod validation and `.env.example`.
3. Write the Prisma schema for the core entities in `architecture-context.md`; first migration.
4. Seed: two demo companies (to test tenant isolation), staff, three technicians each, vehicles, service areas.
5. Clerk with Organizations and roles (`admin`, `dispatcher`, `technician`); `lib/tenancy` guards.
6. `lib/jobs/transitions.ts` with unit tests for every allowed and forbidden transition.
7. Page skeletons: landing, wizard, tracker, dispatch, tech, settings.
8. Booking flow mock with seeded data (no AI, no payments).

Then follow the Build Order in `ai-workflow-rules.md`.

## Open Questions

Business and legal:

- Product name and domain.
- Payments: Stripe Connect (each AC company receives money in its own Stripe account) or platform account with payouts? Affects onboarding and fees.
- Deposit amounts: fixed per company, or different for emergency vs standard? Is the deposit credited against the final bill?
- Cancellation and refund rules: who can cancel, until which status, full or partial refund?
- Consent, privacy policy, and terms wording — who writes them (company, us, lawyer)? US TCPA rules apply to auto-calls and SMS; get legal review before the pilot.
- Twilio US SMS requires A2P 10DLC registration — one platform brand or per company? Lead time can be weeks; start early.
- Auto-call content: what does the call say? Recorded/TTS confirmation only, or "press 1 to talk to dispatch" (needs a forwarding number per company)?
- What exactly happens when "manual follow-up required" — just a dispatcher alert, or also an email to the company?

Product:

- Time slots for standard bookings: fixed windows (e.g. 8–12, 12–4) set by the company, or free choice? Do we check technician availability, or does the dispatcher confirm?
- Auto-assign: nearest by straight-line distance or by driving ETA? Does it consider technician skills and current workload?
- Who enters the remaining balance amount — technician or dispatcher? Is there a maximum without admin approval?
- Can the customer edit the summary after the deposit, before the technician is assigned?
- Is an "after-hours emergency" surcharge needed in the deposit rules?
- Does the pilot need a basic metrics page in Phase 1, or is a manual monthly export enough?
- Spec `02-editor` adds "editor" chrome with a project list (My Projects / Shared, New Project). No editor or project surface is defined in `project-overview.md` — which product surface uses it, and what is a "project" here?
- Google reviews: pull through Google Places API (limited to 5 reviews), or company pastes selected reviews? Must be real either way.

Technical:

- AI provider/model (default plan: Anthropic Claude via Vercel AI SDK; keep swappable).
- Technician app Phase 1 is an installable web app: location only updates while the app is open on screen. Is that acceptable for the pilot, or must we go native (Expo) earlier?
- Hosting: Vercel for the app + managed Postgres (Neon/Supabase)? Region close to the pilot state.
- Error tracking and uptime monitoring tool (e.g. Sentry).

## Architecture Decisions

- One Next.js app serves all surfaces in Phase 1 (customer, dispatcher, technician, settings). A monorepo is introduced only when the native app arrives in Phase 2.
- Multi-tenant from day one: every tenant-owned table has `companyId`; one Clerk Organization per company.
- Customers do not sign in in Phase 1. They access one job through a hashed, revocable tracking token.
- Job status is a server-side state machine in `lib/jobs/transitions.ts`; every transition writes a `JobEvent`.
- Deposit and balance status are separate from job status and change only from verified Stripe webhooks.
- Realtime uses Ably (managed WebSockets) because serverless hosting cannot hold WebSocket connections; the server is the only publisher.
- Call retry sequences run in Trigger.dev (needs durable delays of minutes).
- AI summary runs synchronously at the review step with a deterministic fallback; booking never blocks on AI.
- Vehicle marker v1 mirrors technician location and is labeled "estimated".
- ETA uses Google Routes API and is recalculated only on status change, significant movement (~500 m), or at most every 2 minutes.
- Location history is kept 30 days; only the latest point is kept long-term.

## Session Notes

- 2026-10-31: Spec `01-design-system` said to match an "existing dark theme in globals.css"; this conflicted with `ui-context.md` (light theme, dark mode out of scope). Resolved with the user: light theme per `ui-context.md`; "no default light styling" read as "no stock shadcn neutral palette".
- 2026-10-31: Spec `02-editor` asks for a dark navbar inside the light theme. Implemented as specified with dedicated `chrome` tokens (no raw colors); the rest of the theme stays light. The sidebar is a light `bg-elevated` panel because the spec doesn't give it a color.

- Source plan: "Whole Process: Build, Launch, and Get Clients for Your AI HVAC/AC Platform (USA)". Phases, MVP list, and trust requirements in `project-overview.md` come from it.
- Target timeline: Phase 0 1–2 weeks, Phase 1 MVP 6–10 weeks, Phase 2 another 6–10 weeks.
- Pilot plan: one state/city first, "launch in 14 days" offer, 30–60 day trial — Phase 1 must be stable enough to onboard one real company.
