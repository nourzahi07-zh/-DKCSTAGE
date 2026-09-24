# DKC — Diabète Kiné Care

Web application for DKC, Rihab's physiotherapy cabinet in Fès (Morocco):
public website, patient accounts with online booking, and an admin dashboard
for the cabinet.

> **Status:** complete and running locally. Not deployed yet.
> The AI assistant (Gemini) is the one planned feature not built yet.

## Stack

| Part | Technology |
|---|---|
| Website + server logic | Next.js 16 (App Router, Server Components, Server Actions), TypeScript, Tailwind CSS 4 |
| Database, auth, security | Supabase (PostgreSQL, Supabase Auth, Row Level Security) |
| Animation | `motion` (menus, step transitions) + CSS |
| Icons | lucide-react |
| Tests | Vitest + PGlite (a real PostgreSQL inside Node, no Docker needed) |
| Hosting (planned) | Vercel |

There is no separate backend server: Next.js serves the pages and runs the
server code; Supabase is the only database.

## Routes

**Public**

| Route | Content |
|---|---|
| `/` | Homepage: hero, approach, services from the database, why DKC, booking CTA, about, contact |
| `/services` | Full catalogue with category filter |
| `/services/[id]` | One service: duration, price, location, booking button |
| `/a-propos` | The cabinet and its fields of care |
| `/contact` | Address and booking steps |

**Authentication:** `/auth/register`, `/auth/login`, `/auth/forgot-password`,
`/auth/reset-password`, `/auth/confirm` (password-reset link), `/auth/signout`,
and `/admin/login` for the cabinet.

**Patient** (sign-in required): `/patient/dashboard`, `/patient/appointments`,
`/patient/appointments/new` (booking), `/patient/appointments/[id]`,
`/patient/profile`.

**Admin** (admin role required): `/admin/dashboard`, `/admin/planning`,
`/admin/appointments`, `/admin/appointments/[id]`, `/admin/patients`,
`/admin/patients/[id]`, `/admin/services`, `/admin/availability`,
`/admin/account`.

## Folder structure

```
app/
  (public)/              public site (header + footer)
  auth/                  login, register, password reset, Server Actions
  patient/               patient area + its Server Actions (guarded layout)
  admin/login/           admin login (outside the guard)
  admin/(espace)/        admin area + its Server Actions (guarded layout)
  layout.tsx globals.css sitemap.ts robots.ts error.tsx not-found.tsx
components/
  ui/                    Button, Card, Field, Alert, Badge, States (skeleton/empty), Layout
  layout/                SiteHeader, SiteFooter, PatientNav
  home/ services/        homepage sections, service cards, catalogue filter
  booking/               BookingWizard (4 steps)
  appointments/          patient appointment cards, cancel dialog
  admin/                 AdminShell, stats, rows, status actions, service + availability managers
  account/ auth/ brand/ motion/
lib/
  auth/                  session guards, redirects, French error messages
  db/                    server-only queries (services, appointments, availability) + error mapping
  validation/            Zod schemas
  constants.ts format.ts cabinet.ts appointments.ts env.ts ui.ts
  supabase/              browser client, server client, proxy session refresh
proxy.ts                 refreshes the session, sends logged-out visitors to the right login
supabase/migrations/     the whole database, reproducible from scratch
supabase/seed.sql        the DKC service catalogue (18 services)
tests/unit/ tests/db/    unit tests + database tests (RLS, booking rules)
types/database.ts        generated from the database (npm run db:types)
```

## Database

| Table | Purpose |
|---|---|
| `profiles` | one row per Auth user: name, email, phone, date of birth, `role`, `is_active` |
| `services` | catalogue: category, price (NULL = "sur demande"), session or package, duration, cabinet/home |
| `availability_rules` | normal weekly hours |
| `availability_exceptions` | a date that is closed, or has different hours |
| `appointments` | bookings: patient, service, date, start/end, location, status |

Rules enforced **by the database**, not only by the website:

- **No double booking**: an exclusion constraint makes two overlapping
  pending/confirmed appointments impossible. Cabinet and home visits share
  Rihab's single calendar, and two people clicking the same slot cannot both win.
- **Appointments are written only through SQL functions** — `book_appointment`,
  `cancel_appointment`, `set_appointment_status` — which check the caller and
  every business rule. Patients have no direct write access to the table.
- **One definition of "bookable"**: `get_available_slots()` both lists the free
  times and validates each booking.
- **No role escalation**: sign-up always creates a patient; no one can change a
  role through the app. The first admin is promoted in the SQL editor.
- **Privacy**: a patient reads only their own profile and appointments.
- Services used by an appointment cannot be deleted — deactivate them instead.

Booking rules (in `..._appointment_functions.sql`): 30-minute slots, 2 h minimum
notice, 60-day horizon, max 10 upcoming appointments per patient, Morocco time
(`Africa/Casablanca`). Patients may cancel until the appointment starts. Package
sessions are booked one at a time.

Appointment lifecycle: `pending` → `confirmed` → `completed`, with `cancelled`
possible while active. "Terminé" is only accepted once the appointment has
started.

## Setup

### 1. Install

```bash
npm install
```

### 2. Database

Already applied to the linked Supabase project. From scratch:

```bash
npx supabase link --project-ref <your-project-ref>
```
```bash
npx supabase db push --include-seed
```

### 3. Environment variables

Copy `.env.example` to `.env.local` (never commit it):

| Variable | Where to find it | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → **Project URL** (`https://<ref>.supabase.co`, no `/rest/v1`) | public (safe) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → Publishable key | public (safe, protected by RLS) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, the domain in production | public |

The Supabase service-role key is **not** used by the application.

### 4. Supabase Auth settings

- **Sign In / Providers → Email**: enabled, **Confirm email OFF**. Sign-up
  creates the account, opens the session and lands on `/patient/dashboard`;
  no e-mail is sent and no SMTP is needed.
- Minimum password length **8** (the app requires 8 with a letter and a digit).
- **URL Configuration** (used only by the password-reset e-mail): Site URL
  `http://localhost:3000`, Redirect URL `http://localhost:3000/**`.

### 5. First admin

Public registration only ever creates patients. To make Rihab an admin:

1. She registers at `/auth/register` (or you add the user in the dashboard).
2. In the Supabase SQL editor, once:
   ```sql
   update public.profiles set role = 'admin' where email = 'rihab@example.com';
   ```
3. She logs in at `/admin/login`.

No default admin password exists anywhere in the code.

### 6. Commands

```bash
npm run dev         # http://localhost:3000
npm run lint
npm run typecheck
npm test            # unit + database tests (no Supabase project needed)
npm run build
npm run db:types    # regenerate types/database.ts from the linked project
```

## How authentication works

- Supabase Auth stores the passwords (hashed) and manages the session in
  cookies via `@supabase/ssr`. The app never stores or hashes passwords.
- Forms post to **Server Actions**; input is validated with Zod on the server
  and Supabase errors are translated into French — raw errors are never shown.
- `proxy.ts` refreshes the session and redirects logged-out visitors away from
  `/patient/*` and `/admin/*`.
- The patient and admin layouts check the **role** server-side; `/admin/login`
  refuses and signs out any non-admin account; deactivated accounts are signed out.
- These checks are for navigation. **The data itself is protected by RLS and the
  SQL functions**, so a direct API call with the public key can't bypass them.

## Design system

Colours, fonts, shadows and animations are defined once in `app/globals.css`
(Tailwind v4 `@theme`) and used everywhere: deep teal `brand-*` for care and
trust, warm `sand-*` as the accent, `ink-*` for text, a `cream` background.
Headings use Outfit, body text Inter.

Animations stay subtle and never hide content: the scroll reveal only hides an
element after JavaScript has confirmed it can show it again, and reveals it
anyway after two seconds if the observer never fires. Everything is disabled
for visitors who ask for reduced motion.

## Cabinet information still missing

`lib/cabinet.ts` holds the verified facts (name, founder, address, home service).
Phone, WhatsApp, e-mail, Google Maps link and Instagram are `null`: the site
shows a clearly-marked placeholder instead of inventing them. Fill them in there
and they appear automatically in the footer, the contact page and the homepage.

`/a-propos` also contains a marked placeholder block for Rihab's presentation
(background, diplomas, photos), which is deliberately not invented.
