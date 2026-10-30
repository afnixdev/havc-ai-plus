# UI Context

## Theme

Light theme. The product is used by homeowners on phones (often stressed, sometimes outdoors in strong sun), dispatchers on desktop for long shifts, and technicians on phones in the field. The visual language is **clean, calm, trustworthy, and high-contrast** — white and cool-gray surfaces, one cool blue accent (cooling / AC), and a strong red-orange reserved for emergencies.

Dark mode is out of scope for Phase 1.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes like `slate-*` or `blue-*`.

### Base Tokens

| Role              | CSS Variable           | Hex / Value                 |
| ----------------- | ---------------------- | --------------------------- |
| Page background   | `--bg-base`            | `#f6f8fb`                   |
| Surface (cards)   | `--bg-surface`         | `#ffffff`                   |
| Elevated surface  | `--bg-elevated`        | `#ffffff` + shadow          |
| Subtle surface    | `--bg-subtle`          | `#eef2f7`                   |
| Default border    | `--border-default`     | `#dfe5ee`                   |
| Strong border     | `--border-strong`      | `#c3ccd9`                   |
| Primary text      | `--text-primary`       | `#0f172a`                   |
| Secondary text    | `--text-secondary`     | `#334155`                   |
| Muted text        | `--text-muted`         | `#64748b`                   |
| Faint text        | `--text-faint`         | `#94a3b8`                   |
| Brand accent      | `--accent-primary`     | `#0a6cff` (cool blue)       |
| Brand hover       | `--accent-primary-hover` | `#0857cc`                 |
| Brand dim         | `--accent-primary-dim` | `rgba(10, 108, 255, 0.10)`  |
| AI accent         | `--accent-ai`          | `#6457f9` (indigo-purple)   |
| AI dim            | `--accent-ai-dim`      | `rgba(100, 87, 249, 0.10)`  |
| Emergency         | `--emergency`          | `#e5381e` (red-orange)      |
| Emergency dim     | `--emergency-dim`      | `rgba(229, 56, 30, 0.10)`   |
| Error             | `--state-error`        | `#dc2626`                   |
| Success           | `--state-success`      | `#059669`                   |
| Warning           | `--state-warning`      | `#d97706`                   |
| Info              | `--state-info`         | `#0284c7`                   |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `bg-subtle`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-brand`, `bg-accent-dim`, `text-emergency`, `bg-emergency`, etc.

Full color-name mapping (usable with any color utility: `bg-`, `text-`, `border-`, `ring-`, …):

| Color name               | Variable                 |
| ------------------------ | ------------------------ |
| `base`                   | `--bg-base`              |
| `surface`                | `--bg-surface`           |
| `elevated`               | `--bg-elevated`          |
| `subtle`                 | `--bg-subtle`            |
| `surface-border`         | `--border-default`       |
| `surface-border-strong`  | `--border-strong`        |
| `copy-primary` / `copy-secondary` / `copy-muted` / `copy-faint` | `--text-*` |
| `brand` / `brand-hover`  | `--accent-primary` / `--accent-primary-hover` |
| `accent-dim`             | `--accent-primary-dim`   |
| `ai` / `ai-dim`          | `--accent-ai` / `--accent-ai-dim` |
| `emergency` / `emergency-dim` | `--emergency` / `--emergency-dim` |
| `state-error` / `state-success` / `state-warning` / `state-info` | `--state-*` |

### shadcn/ui Variable Mapping

shadcn/ui's own variables are defined in `globals.css` as aliases of the tokens above, so the generated components in `components/ui/` use the project palette without being edited:

| shadcn variable                    | Token                  |
| ---------------------------------- | ---------------------- |
| `--background` / `--foreground`    | `--bg-base` / `--text-primary` |
| `--card`, `--popover`              | `--bg-surface`, `--bg-elevated` |
| `--primary` / `--primary-foreground` | `--accent-primary` / white |
| `--secondary`, `--muted`, `--accent` | `--bg-subtle`         |
| `--muted-foreground`               | `--text-muted`         |
| `--destructive`                    | `--state-error`        |
| `--border` / `--input`             | `--border-default` / `--border-strong` |
| `--ring`                           | `--accent-primary`     |

The `dark:` variant is bound to a `.dark` class that is never applied, so the `dark:` classes inside shadcn components stay inactive even when the OS prefers dark mode.

### Per-Company Brand Color

- Each company can set one brand color. It overrides only `--accent-primary`, `--accent-primary-hover`, and `--accent-primary-dim` on that company's customer pages (set on the page root from company settings).
- The override must pass 4.5:1 contrast with white text; if it fails, the platform default blue is used.
- Emergency, error, success, warning, and job status colors are **never** overridden by company branding.
- Dispatcher and technician surfaces always use the platform default blue.

### Job Status Colors

Defined once in `lib/jobs/status-display.ts` as `JOB_STATUS_DISPLAY` (label, token, icon). Every badge, map marker, and timeline uses this map.

| Status            | Label (customer-facing)  | Token / color              |
| ----------------- | ------------------------ | -------------------------- |
| `pending_deposit` | Awaiting deposit         | `--state-warning`          |
| `confirmed`       | Confirmed                | `--state-info`             |
| `assigned`        | Technician assigned      | `--accent-primary`         |
| `en_route`        | On the way               | `--accent-primary`         |
| `arrived`         | Arrived                  | `--accent-ai`              |
| `working`         | Working on your AC       | `--accent-ai`              |
| `completed`       | Completed                | `--state-success`          |
| `cancelled`       | Cancelled                | `--text-muted`             |
| `abandoned`       | Not confirmed            | `--text-muted`             |

Emergency jobs additionally show an `Emergency` badge in `--emergency` everywhere they appear.

## Typography

| Role      | Font       | CSS Variable        |
| --------- | ---------- | ------------------- |
| UI text   | Geist Sans | `--font-geist-sans` |
| Numbers / IDs / code | Geist Mono | `--font-geist-mono` |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`.

- Customer surfaces: base text `text-base` (16px) minimum — never smaller on inputs (prevents iOS zoom).
- Technician surfaces: base text `text-lg`; status buttons `text-xl font-semibold`.
- Dispatcher surfaces: dense — `text-sm` for tables and lists, `text-base` for job detail.
- ETAs, prices, and job numbers use `tabular-nums`.

## Border Radius

| Context           | Class         |
| ----------------- | ------------- |
| Inline / small UI | `rounded-xl`  |
| Cards / panels    | `rounded-2xl` |
| Modal / sheet     | `rounded-3xl` |
| Pills / badges    | `rounded-full`|

## Surfaces and Layout Patterns

### Customer Landing Page (`/{companySlug}`) — mobile first

- Top bar: company logo + name, click-to-call phone button (always visible).
- Hero: two primary actions stacked on mobile, side by side on desktop:
  - **Emergency AC Repair** — `bg-emergency`, full width, largest button on the page.
  - **Book Standard Service** — `bg-brand`.
- Below the fold, in this order: Google rating + recent reviews, "What happens next" timeline (3–4 steps), service area map, "Live tracking available after booking", deposit and refund policy summary, FAQ, footer with company address, phone, privacy policy, terms.

### Booking Wizard

- One question per screen. Progress bar at the top. Back button top-left.
- Sticky bottom bar on mobile with the primary "Continue" button (min height 52px).
- Multi-select symptoms as large tappable cards (icon + label), not checkboxes.
- Photo step: large dashed drop zone / "Take photo" button, thumbnails with remove buttons, "Optional — helps the technician prepare".
- Consent step: consent text shown in full next to each checkbox (call, SMS). Checkboxes are never pre-checked.
- Review step: "What we recorded" card with AI-accent left border (`border-l-4` in `--accent-ai`), editable fields, small "Prepared with AI · Your technician will confirm the diagnosis and price" note.
- Safety-flag answers (burning smell, sparking, gas) show a full-width `bg-emergency-dim` safety alert with fixed copy before continuing.

### Confirmation + Deposit

- Clear amount, what it covers, and refund policy link above the pay button.
- After payment: success state with a check icon, "You're confirmed", job number, "What happens next" timeline, and a tracker preview.
- While waiting for the payment webhook: "Confirming your payment…" with a spinner — never show "confirmed" before the webhook.

### Customer Tracker (`/track/[token]`)

- Mobile: map fills the top ~55% of the viewport; a bottom sheet (`rounded-t-3xl`) holds status, ETA, technician card, and timeline. The sheet can be dragged up.
- Desktop: map left (≈60%), panel right.
- Technician card (once assigned): photo, first name, "AC Technician", vehicle make/model/color, call button.
- ETA shown large (`text-3xl tabular-nums`) with "Updated X seconds ago".
- Before assignment: map shows only the home marker and the text "We'll show your technician here once they're on the way."

### Dispatcher Dashboard (`/dispatch`) — desktop first

- Top navbar: company name, live connection indicator, user menu.
- Three-pane layout:
  - **Left (≈360px)**: job inbox. Tabs: Needs action / Active / Completed. Emergency jobs pinned at the top with a red left border. "Manual follow-up" jobs show a warning badge.
  - **Center**: map with all active jobs and technicians.
  - **Right (≈420px, slide-over)**: job detail — AI summary card, photos grid, customer info, deposit/balance status, call attempt log, timeline, assignment controls.
- Assignment: "Auto-assign nearest" primary button + technician list sorted by distance/ETA with availability badges.
- New emergency jobs: subtle sound (can be muted) and a brief highlight animation in the inbox.
- Minimum supported width: 1280px. Below that, the right pane overlays the map.

### Technician App (`/tech`) — phone, outdoors, gloves

- Single column. Large tap targets (min 56px height). High contrast.
- Home: current job card at top, then upcoming assigned jobs.
- Job screen: customer name and address, "Navigate" button (opens Google Maps), call customer button, AI summary, photos.
- Fixed bottom action bar with **one** primary button showing the next status (e.g. "I'm on my way" → "I've arrived" → "Start work" → "Complete job"). Destructive or unusual actions go in a menu.
- Location sharing indicator always visible while a job is active ("Sharing location with customer"), with a clear notice if location permission is denied.
- Completion screen: remaining balance amount input, notes, "Send payment request".

### Settings (`/settings`)

- Standard form pages in cards: Company profile, Service areas, Deposits & policies, Calls & SMS, Technicians & vehicles, Staff.

## Maps

- Map component wraps Google Maps JS in `components/maps/`. Map styling uses a light, low-saturation style so markers stand out.
- Markers:
  - **Home / job location**: house pin in `--text-primary`; emergency jobs use `--emergency`.
  - **Technician**: circle with initials, filled `--accent-primary`, white border, heading arrow when moving.
  - **Vehicle**: van icon. When mirrored from the technician (v1), it is drawn with a dashed outline and the label "Vehicle (estimated)". When from a real GPS device (Phase 2), solid outline.
  - **Stale location** (no update for > 2 minutes): marker at 50% opacity with "Last seen X min ago".
- Route line: `--accent-primary` at 70% opacity, 4px.
- The map auto-fits to show home + technician; the user can pan, and a "Recenter" button restores auto-fit.

## AI Presentation

- AI-generated content is always visually marked with the AI accent (indigo-purple left border or small "AI" chip) and labeled "Reported symptoms" / "Possible causes".
- Never style AI output as a diagnosis, a verdict, or a price.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch.

## Accessibility

- WCAG 2.1 AA contrast for all text and controls.
- All interactive elements reachable by keyboard; visible focus ring in `--accent-primary`.
- Status is never shown by color alone — always a label and/or icon.
- Map content has a text equivalent (status, ETA, technician name) in the panel.
- Respect `prefers-reduced-motion` for marker animation and inbox highlights.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` inline, `h-5 w-5` in buttons, `h-6 w-6` in technician action buttons, `h-8 w-8` for feature icons and empty states.

Common icons: `Siren` (emergency), `Snowflake` (AC service), `Phone`, `MapPin`, `Navigation`, `Truck` (vehicle), `Clock` (ETA), `Camera`, `ShieldCheck` (trust/consent), `Sparkles` (AI), `CreditCard` (payment), `CheckCircle2` (completed).
