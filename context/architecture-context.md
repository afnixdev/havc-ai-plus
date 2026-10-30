# Architecture Context

## Stack

| Layer              | Technology                                   | Role                                                                    |
| ------------------ | -------------------------------------------- | ----------------------------------------------------------------------- |
| Framework          | Next.js 16 + TypeScript                      | One full-stack app serving all surfaces (customer, dispatch, technician) |
| UI                 | Tailwind + shadcn/ui                         | Component composition and styling                                       |
| Staff auth         | Clerk (Organizations)                        | Staff identity, roles, and route protection; one Clerk org per company  |
| Database           | Prisma + PostgreSQL                          | All relational data: companies, jobs, payments, consent, timeline       |
| Realtime           | Ably (managed WebSockets)                    | Live location, job status, and inbox updates                            |
| Background tasks   | Trigger.dev                                  | Delayed call attempts, notifications, ETA refresh, cleanup              |
| File storage       | Vercel Blob (private)                        | Customer photos, technician photos, company logos                       |
| AI                 | Vercel AI SDK + Zod structured output        | Wizard → structured job summary; optional refine chat                   |
| Payments           | Stripe (Checkout + webhooks)                 | Deposit and remaining balance                                           |
| Voice + SMS        | Twilio (Programmable Voice + Messaging)      | Consent-first auto-call and SMS                                         |
| Maps               | Google Maps Platform                         | Maps JS, Places Autocomplete, Geocoding, Routes API (ETA)               |
| Email              | Resend                                       | Tracking link and receipts by email                                     |

The AI model provider is configured in one place (`lib/ai/model.ts`) so it can be swapped. See open questions in `progress-tracker.md`.

## System Boundaries

- `app/(public)/[companySlug]` — Customer-facing landing page and booking wizard. No sign-in.
- `app/track/[token]` — Customer job tracker. Access by tracking token only.
- `app/dispatch` — Dispatcher dashboard. Staff sign-in, role `dispatcher` or `admin`.
- `app/tech` — Technician web app (installable). Staff sign-in, role `technician`.
- `app/settings` — Company admin settings. Role `admin`.
- `app/platform` — Internal platform admin (company onboarding). Platform operators only.
- `app/api` — Request handlers: input validation, tenant and role checks, persistence, triggering background tasks.
- `app/api/webhooks/*` — Stripe and Twilio webhooks. Signature verified, idempotent.
- `trigger` — Durable background tasks: call attempt sequence, SMS, notifications, ETA refresh, data retention cleanup.
- `lib` — Shared domain and infrastructure modules (see File Organization in `code-standards.md`).
- `components` — UI composition only.
- `prisma` — Schema, migrations, seed data.

## Tenancy Model

- Every company is a `Company` row and a matching Clerk Organization.
- Every tenant-owned table has a `companyId` column.
- Staff requests resolve `companyId` from the signed-in user's active Clerk organization — never from the request body or URL.
- Public booking requests resolve `companyId` from `companySlug` on the server.
- Tracker requests resolve the job (and its company) from the tracking token.
- All queries go through tenant-scoped helpers in `lib/tenancy`.

## Auth and Roles

| Role           | Can                                                                                  |
| -------------- | ------------------------------------------------------------------------------------ |
| `admin`        | Everything a dispatcher can, plus company settings, staff, technicians, refunds       |
| `dispatcher`   | View all company jobs, assign/reassign, change status on behalf of a technician, notes |
| `technician`   | View only jobs assigned to them, update their own job status, share location          |
| Customer       | View and act on one job through its tracking token (pay, edit summary before dispatch, cancel per policy) |
| Platform admin | Create companies and invite their first admin (internal only)                         |

- Roles are Clerk organization roles and are checked on the server for every request.
- Tracking tokens are random, at least 32 bytes, stored hashed, and can be revoked. A token gives access to exactly one job.

## Data Model (core entities)

| Entity           | Purpose                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `Company`        | Tenant: profile, slug, timezone, brand color, policies, Stripe and Twilio config          |
| `CompanySettings`| Deposit amounts (standard/emergency), retry intervals, business hours, auto-assign on/off  |
| `ServiceArea`    | Zip codes and/or polygon per company                                                      |
| `StaffMember`    | Clerk user ↔ company ↔ role                                                               |
| `Technician`     | Profile linked to a StaffMember: display name, photo, skills, availability, vehicle       |
| `Vehicle`        | Make, model, color, plate (last digits), optional GPS device ID (Phase 2)                 |
| `Customer`       | Name, phone (E.164), email — scoped to one company                                        |
| `Job`            | Type (emergency/standard), status, address + lat/lng, schedule preference, AI summary, assigned technician, ETA, tracking token hash |
| `JobPhoto`       | Blob key, uploader, size, content type                                                    |
| `ConsentRecord`  | Call consent, SMS consent, exact consent text version, timestamp, IP, user agent          |
| `Payment`        | Kind (deposit/balance/refund), amount in cents, currency, Stripe IDs, status               |
| `CallAttempt`    | Attempt number, scheduled time, Twilio SID, outcome, duration                             |
| `JobEvent`       | Timeline entry: type, actor (customer/staff/system), payload, timestamp                   |
| `TechnicianLocation` | Latest position per technician (lat, lng, accuracy, heading, recordedAt)              |
| `LocationPing`   | Location history while on an active job (short retention)                                 |
| `WebhookEvent`   | Processed Stripe/Twilio event IDs for idempotency                                          |

## Job Lifecycle

Job status is a state machine implemented only in `lib/jobs/transitions.ts`.

```
draft ──submit──▶ pending_deposit ──deposit paid──▶ confirmed ──assign──▶ assigned
                        │                                │                    │
                        ▼                                ▼                    ▼
                    abandoned                        cancelled            en_route ──▶ arrived ──▶ working ──▶ completed
```

- `draft` — wizard in progress (server-side draft so photos can attach).
- `pending_deposit` — submitted, waiting for deposit. Not shown as confirmed to anyone.
- `abandoned` — deposit not paid within the configured window (background task).
- `confirmed` — deposit paid. Enters the dispatcher inbox. Auto-call sequence starts.
- `assigned` → `en_route` → `arrived` → `working` → `completed` — technician (or dispatcher) driven.
- `cancelled` — allowed before `arrived`; refund handling follows company policy.
- Reassignment is allowed in `assigned` and `en_route` and is recorded as an event.
- Each transition defines: allowed from-states, allowed actor roles, side effects (timeline event, realtime publish, notifications).

Payment status is separate from job status:

- `depositStatus`: `none` → `pending` → `paid` → (`refunded`)
- `balanceStatus`: `not_due` → `due` → `paid` (or `waived` by admin)

A job is `confirmed` only after the deposit webhook marks the deposit `paid`.

## Storage Model

- **PostgreSQL**: all relational and business data, the AI summary JSON, consent records, payment records, call attempts, timeline events, latest technician location.
- **Vercel Blob (private)**: photos and logos at `companies/{companyId}/jobs/{jobId}/photos/{photoId}.{ext}`, `companies/{companyId}/technicians/{technicianId}.{ext}`, `companies/{companyId}/logo.{ext}`. The database stores the blob key, not a public URL.
- Photos are served through short-lived signed URLs after an access check.
- Photo upload: client uploads directly to Blob using a server-issued upload token limited by type (JPEG, PNG, HEIC/WebP) and size (max 10 MB, max 6 photos per job).

## AI Model

### Booking Summary

- Input: wizard answers (symptoms, emergency flag, equipment type, schedule, notes) and photo count. No customer contact details are sent to the model.
- Execution: synchronous request at the review step with a short timeout (≈10 seconds). If the model fails or times out, a deterministic template summary is built from the answers so booking never blocks on AI.
- Output: JSON validated by a Zod schema:
  - `urgency`: `emergency` | `standard`
  - `reportedSymptoms`: string[]
  - `possibleCauses`: string[] (phrased as possibilities, never a diagnosis)
  - `equipmentType`: string | null
  - `customerNotes`: string | null
  - `summary`: short dispatch-ready text
  - `safetyFlag`: boolean (e.g. burning smell, sparking, gas smell)
- The customer can edit the summary before submit. The original AI output and the edited version are both stored.

### Refine Chat (optional)

- Short follow-up chat that can only update fields of the same schema.
- Limited turns per job. Same safety rules apply.

### Safety Rules (enforced in the prompt and checked on output)

- No diagnosis stated as fact. No prices, estimates, or quotes.
- No repair or DIY instructions beyond basic safety ("turn the system off at the thermostat").
- If the customer reports a burning smell, smoke, sparking, or gas smell: show a fixed safety message (leave the area, call 911 / the gas company) — this message is static copy, not model output.

## Realtime Model

- Provider: Ably. The server is the only publisher. Clients only subscribe.
- Channels:
  - `company:{companyId}:dispatch` — inbox changes, job status changes, technician locations for the dispatcher map.
  - `job:{jobId}` — status changes, technician location, ETA for that job's customer tracker.
  - `tech:{technicianId}` — new assignment and job updates for that technician.
- Clients get an Ably token with subscribe-only capability for exactly the channels they are allowed: dispatcher → own company channel; technician → own tech channel; customer → own job channel (checked via tracking token).
- Location flow: technician app → `POST /api/tech/location` (every 10–20 s while job is `en_route`, `arrived`, or `working`) → server validates, throttles, saves `TechnicianLocation` (+ `LocationPing`) → publishes to `job:{jobId}` and `company:{companyId}:dispatch`.
- Status changes publish immediately after the transition commits.

## Maps Model

- Address entry: Places Autocomplete → server-side Geocoding to confirm lat/lng → service-area check.
- ETA: Routes API (driving, traffic-aware). Recalculated only when status changes, when the technician moves more than ~500 m since the last calculation, or at most every 2 minutes while `en_route`. Stored on the job.
- Navigation: Google Maps deep link (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) — no in-app turn-by-turn.
- Keys: a browser key restricted by HTTP referrer for Maps JS and Places; a server key for Geocoding and Routes, never sent to the client.

## Payments Model

- Stripe Checkout Sessions for deposit and for remaining balance. Amounts are integers in cents.
- Deposit amount comes from company settings (emergency and standard can differ).
- Remaining balance amount is entered by the technician or dispatcher at completion.
- `checkout.session.completed` and related webhooks are the only source of truth for payment status. The success redirect page only shows "confirming payment…" until the webhook lands.
- Refunds are issued by an admin through the dashboard and recorded as `Payment(kind=refund)`.
- How money reaches each AC company (Stripe Connect vs. platform account) is an open question in `progress-tracker.md`. Code must keep a per-company Stripe account reference so Connect can be adopted without schema changes.

## Calls and SMS Model

- Triggered when a job becomes `confirmed`, only if `ConsentRecord.callConsent = true`.
- Sequence is a Trigger.dev task: Attempt 1 immediately, Attempt 2 after X minutes, optional Attempt 3 after Y minutes (X, Y, and attempt count from company settings).
- The sequence stops as soon as a call is answered, the job is assigned, or the job is cancelled.
- Twilio status callbacks → `app/api/webhooks/twilio/voice-status` → update `CallAttempt` → timeline event.
- After the last unanswered attempt: mark job `needsManualFollowUp = true`, notify dispatcher channel, and send an SMS only if `smsConsent = true`.
- All SMS include company name and opt-out text ("Reply STOP to opt out"). Inbound STOP is recorded and blocks further SMS to that number for that company.
- Calls and SMS respect the company's quiet hours unless the job is an emergency the customer just submitted.

## Notifications

| Event                    | Customer                       | Dispatcher            | Technician        |
| ------------------------ | ------------------------------ | --------------------- | ----------------- |
| Deposit paid (confirmed) | Tracking link (SMS*/email)     | Inbox update (live)   | —                 |
| Assigned                 | SMS*/email + tracker update    | Live                  | Live + browser push |
| En route / Arrived       | SMS* + tracker update          | Live                  | —                 |
| Completed                | Balance payment link (SMS*/email) | Live              | —                 |
| Manual follow-up needed  | —                              | Live alert            | —                 |

\* SMS only with SMS consent.

## Privacy and Data Retention

- Technician location is collected only while the technician has an active job in `en_route`, `arrived`, or `working`. The app stops sending location on any other status.
- `LocationPing` history is deleted after 30 days. `TechnicianLocation` keeps only the latest point.
- Customer tracker stops showing technician location once the job is `completed` or `cancelled`.
- Photos are private, accessed only by signed URL by the job's company staff and the job's customer.
- No customer PII is sent to the AI model, logs, or analytics.
- Consent records are kept for the life of the company account (needed to prove consent).

## Invariants

1. Every tenant-owned query is scoped by `companyId` resolved on the server. Never trust a `companyId` from the client.
2. Job status changes only through `lib/jobs/transitions.ts`, and every transition writes a `JobEvent` in the same database transaction.
3. Payment status changes only from verified Stripe webhooks. Webhooks are signature-verified and idempotent (`WebhookEvent`).
4. No call or SMS is sent without a `ConsentRecord` permitting it, checked at send time — not only at schedule time.
5. AI output is schema-validated before use. AI output never contains a diagnosis stated as fact or a price, and the booking flow never blocks on AI.
6. The server is the only realtime publisher. Clients receive subscribe-only tokens for their own channels.
7. Technician location is accepted and broadcast only while that technician has an active job.
8. Request handlers do not wait on slow or delayed work (call sequences, notifications, retries) — that belongs in Trigger.dev tasks.
9. Secrets and server API keys never reach the client bundle.
10. Money is integer cents everywhere. Times are stored in UTC and shown in the company's timezone.
11. Client components are used only where browser interactivity, maps, or realtime state require them.
