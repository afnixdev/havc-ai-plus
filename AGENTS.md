<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, user journeys, features, phases, and scope
2. `context/architecture-context.md` — stack, system boundaries, data and storage model, integrations, and invariants
3. `context/ui-context.md` — theme, colors, typography, map conventions, and layout patterns for each app surface
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase, completed work, open questions, and next steps

Update `context/progress-tracker.md` after each meaningful implementation change.

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.

## Non-Negotiables (summary — full list in `architecture-context.md`)

- Every database query is scoped to a company (tenant). No cross-company data access.
- Job status only changes through the job transition module, and every change writes a timeline event.
- Payment status only changes from verified Stripe webhooks — never from a client redirect.
- No auto-call or SMS is sent without a stored consent record for that job.
- AI output is validated against its schema before it is saved. AI never states a diagnosis or a price.
- Technician location is shared only while the technician has an active job.
