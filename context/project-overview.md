# AI AC Booking & Dispatch Platform

> Working name. Final product name is an open question in `progress-tracker.md`.

## Overview

A multi-company (multi-tenant) platform sold to AC repair companies in the USA. Homeowners book AC repair through an AI-guided wizard, pay a deposit to confirm, and watch their technician arrive on a live map. Dispatchers receive dispatch-ready jobs with an AI summary and photos, assign the nearest technician, and track every job in real time. Technicians receive jobs on their phone, navigate, share location, and update status.

The product is sold as one outcome, not as a website:

> **AI AC booking + emergency dispatch system with deposits, auto-call, and live technician tracking.**

What the client company buys: more booked jobs, faster emergency response, fewer missed leads, and more customer trust.

## Goals

1. Turn website visitors into confirmed, deposit-paid bookings — on mobile first.
2. Capture emergency jobs instantly, including after hours, so no lead is missed.
3. Give dispatchers a dispatch-ready job (symptoms, photos, address, deposit status) without a phone call.
4. Let dispatchers assign the nearest available technician in a few clicks.
5. Show the customer exactly who is coming, where they are, and when they will arrive.
6. Collect the remaining balance after the job is completed.
7. Record every step of every job so the company can see results (response time, conversion, completion).

## Users and Roles

| Role             | Who                                     | Signs in? | Main surface                     |
| ---------------- | --------------------------------------- | --------- | -------------------------------- |
| Customer         | Homeowner or tenant needing AC repair   | No (v1)   | Booking wizard + tracker link    |
| Dispatcher       | AC company office staff                 | Yes       | Dispatcher dashboard             |
| Technician       | AC company field technician             | Yes       | Technician mobile app            |
| Company admin    | AC company owner / manager              | Yes       | Company settings (+ dispatcher)  |
| Platform admin   | Us — the platform operator              | Yes       | Company onboarding (internal)    |

Customers do not create accounts in Phase 1. They reach their job through a private tracking link sent after booking.

## User Journeys

### Customer

1. **Landing page** (per company): Emergency AC Repair button at the top, Standard booking button, click-to-call, service area map, Google rating and recent reviews, "Live tracking available after booking", FAQ and trust signals.
2. **Service selection**: AC Repair only. Emergency or Standard.
3. **AI wizard** (one question per screen, optional chat to refine):
   1. What do you need? (AC repair)
   2. Is it an emergency? (Yes / No)
   3. Symptoms (multi-select)
   4. Equipment type (optional)
   5. Upload photos (optional, recommended)
   6. Address and service area check
   7. Schedule preference (ASAP or time slot)
   8. Contact details and consent (auto-call, SMS)
   9. Review "what we recorded" (editable) → Submit
4. **Confirmation + deposit**: "We received your request" → deposit checkout → "You're confirmed", job status timeline, live tracker placeholder.
5. **Live tracking**: technician marker, vehicle marker, ETA, and timeline updating in real time.
6. **Completion**: customer is notified and pays the remaining balance.

### Dispatcher

1. Job inbox with emergency jobs pinned to the top.
2. Job detail panel: AI summary, symptoms, photos, customer address and phone, deposit status, call attempt log.
3. Assign: manual pick, or auto-assign nearest available AC technician.
4. Follow status: Assigned → En route → Arrived → Working → Completed.
5. Monitor payments: deposit captured, remaining balance pending/paid.
6. Map: customer markers, technician markers, vehicle markers, ETA and route overlay.
7. Handle "manual follow-up required" jobs when auto-call fails.

### Technician

1. Receive a job notification.
2. View job details: customer info, AI summary, photos.
3. Start navigation (Google Maps deep link).
4. Share live location while the job is active.
5. Update status: En route → Arrived → Working → Completed.
6. On completion: mark complete and request the remaining payment if applicable.

## Features

### Company Setup (tenancy)

- Each AC company is a tenant with its own landing/booking page (`/{companySlug}`), staff, technicians, service areas, and settings.
- Company settings: name, address, phone, logo, brand color, service areas, timezone, business hours, deposit rules (standard and emergency), cancellation/refund policy, call retry intervals, Google Business Profile link.
- Platform admin creates companies during onboarding.

### Customer Booking

- Mobile-first landing page with trust elements (see Trust Requirements).
- AI wizard with structured questions and an optional chat to refine the summary.
- Photo upload (optional, recommended).
- Address autocomplete, geocoding, and service-area check.
- Emergency vs standard booking, ASAP or time-slot preference.
- Consent capture for auto-call and SMS with stored consent text.
- Editable "what we recorded" summary before submit.

### Deposits and Payments

- Deposit required to confirm a job.
- Remaining balance requested after the technician marks the job completed.
- Payment status visible to dispatcher and customer.
- Refunds follow the company's cancellation policy (processed by staff).

### AI Triage

- Converts wizard answers into structured job data.
- Produces a dispatch-ready summary framed as "reported symptoms" and "possible causes".
- Never states a diagnosis, never quotes a price, never gives unsafe DIY instructions.

### Auto-Call and SMS (Twilio)

- Consent-first: no call or SMS without consent on record.
- Attempt 1 immediately after booking is confirmed, Attempt 2 after X minutes, optional Attempt 3 after Y minutes (per-company settings).
- If no answer: mark "manual follow-up required", notify the dispatcher, optionally SMS (if SMS consent).
- Every attempt and outcome (answered / no answer / voicemail / failed, time, duration) is logged on the job timeline.

### Dispatch

- Job inbox (emergency priority), job detail panel, manual and auto-assign, status tracking, payments monitoring, dispatcher map.

### Technician App

- Job notifications, job details, navigation deep link, live location sharing, status updates, completion.

### Live Tracking

- Technician location updates every 10–20 seconds while a job is active.
- Status changes pushed immediately.
- Vehicle marker v1 mirrors the technician location and is clearly labeled as such. Vehicle GPS device integration in Phase 2.
- ETA from Google Maps, recalculated only when needed.

### Job Timeline

- Every event on a job (created, deposit paid, call attempts, assigned, status changes, payments, notes) is recorded with a timestamp and actor.
- The timeline is the source for customer status display and for company performance metrics.

## Trust Requirements

These are product requirements, not polish. They must be present on every booking page and in the tracker:

- Real company name, address, and phone.
- Google rating and recent reviews (real data from the company's Google Business Profile — never invented).
- "What happens next" timeline.
- Clear emergency deposit policy.
- Consent text for auto-call and SMS.
- Privacy policy covering GPS, photos, and phone number storage.
- Technician identity (name, photo) and vehicle info once assigned.
- Clear cancellation and refund policy.

AI trust rules:

- AI only collects information and prepares the dispatch summary.
- The technician does diagnosis and pricing.
- No unsafe instructions.
- The customer sees the AI summary as "what we recorded" and can edit it.

## Phases

### Phase 0 — Pre-work (1–2 weeks)

- Confirm stack and integrations (see `architecture-context.md`).
- Data model: companies, users/roles, jobs, consent, payments, call attempts, timeline, locations.
- UX flows: customer wizard → booking → dispatch → technician → customer tracker.
- Consent and privacy requirements written down.

### Phase 1 — MVP (sellable in 6–10 weeks)

1. Customer web (mobile + desktop)
2. Customer AI wizard (wizard + optional chat)
3. Photo upload
4. Booking request (emergency + standard)
5. Deposit payment at booking
6. Dispatcher dashboard (job inbox + assignment)
7. Technician mobile app (status updates) — installable web app in Phase 1
8. Live tracker v1 (technician marker + ETA; vehicle marker mirrored)
9. Twilio auto-call (consent-first)
10. Google Maps (directions + ETA)

### Phase 2 — Full package (next 6–10 weeks)

- Real vehicle tracking (vehicle GPS device), or mirrored with clear labeling if no device.
- Native technician app with background location.
- Customer mobile app and push notifications.
- Remaining balance payment polish, full job timeline UI, review request automation.
- Company performance report (see Success Metrics).
- Performance and scaling for 50+ technicians / multiple locations.

## Scope

### In Scope (Phase 1)

- Multi-company tenancy with per-company booking page and settings
- Staff authentication and roles (company admin, dispatcher, technician)
- Customer booking without an account, private tracking link
- AI wizard + optional chat + structured job summary
- Photo upload and storage
- Address autocomplete, geocoding, service-area check
- Deposit payment and remaining balance payment
- Consent capture and consent records
- Twilio auto-call sequence and SMS (consent-dependent)
- Dispatcher dashboard: inbox, job detail, assignment, map
- Technician web app: jobs, navigation link, status, location sharing
- Real-time tracker for customer and dispatcher
- Job timeline recording

### Out Of Scope (Phase 1)

- Services other than AC repair (no heating, plumbing, installs)
- Customer accounts and customer native app
- Native technician app and background location
- Real vehicle GPS device integration
- AI diagnosis, AI pricing, or AI quotes
- AI analysis of photos (photos are stored and shown, not interpreted)
- Invoicing, estimates, parts inventory, payroll
- Integrations with existing field-service software (ServiceTitan, Housecall Pro, Jobber)
- Self-serve company sign-up and subscription billing for the platform itself
- Languages other than English

## Business Context (for product decisions)

- Buyers: US AC repair companies with emergency demand, an outdated booking process, weak mobile experience, and missed after-hours calls.
- Go-to-market: one pilot city/state first, "launch in 14 days" pilot, 30–60 day trial, discounted setup fee.
- Onboarding collects: company info and service areas, deposit rules, technician list and skills, Twilio and payment accounts, Google Business Profile.
- The pilot is judged on measurable results — so the product must record the data for the metrics below from day one.

## Success Metrics (what the product must be able to report)

- Visits → booking requests
- Booking requests → deposit paid
- Emergency request conversion
- Average time from booking to assignment
- Job completion rate
- Customer ratings

Phase 1 records the events needed for these metrics on the job timeline. The report UI is Phase 2.

## Success Criteria (Phase 1 done)

1. A customer on a phone can complete the wizard, pay a deposit, and receive a tracking link in under 3 minutes.
2. A confirmed emergency job appears at the top of the dispatcher inbox within seconds.
3. A consenting customer receives the auto-call sequence; a non-consenting customer receives none.
4. A dispatcher can assign the nearest available technician manually or automatically.
5. The technician sees the job, opens navigation, and updates status; the customer and dispatcher see each change in real time.
6. The customer sees the technician moving on a map with an ETA.
7. After completion, the customer can pay the remaining balance and the dispatcher sees it as paid.
8. Every step is recorded on the job timeline with a timestamp.
9. One company's staff can never see another company's data.
