# Movio Page

The landing page + research survey for **Movio** — a smart campus transportation
management system for the Federal University of Technology, Akure (FUTA). Movio
brings real-time GPS tracking and NFC tap-to-pay to all three campus transport
modes — the **shuttle (campus bus)**, **Keke (tricycle)** and **cab** — so
students stop guessing when their next ride is coming.

This site does two jobs:

1. **Collects needs-assessment data** from FUTA students (cited in Chapter 3 of
   the final-year project report, "Requirements Elicitation").
2. **Captures a waitlist** of students interested in Movio, as early demand
   validation.

> 🎓 Movio is a final year Software Engineering project at FUTA.

---

## Tech stack

| Layer       | Choice                                  |
| ----------- | --------------------------------------- |
| Framework   | React 19 + Vite (Rolldown, React Compiler) |
| Language    | TypeScript                              |
| Styling     | Tailwind CSS v4                         |
| Routing     | React Router                            |
| Backend/DB  | Supabase (Postgres + REST + RLS)        |
| Hosting     | Vercel                                  |
| Payments    | Paystack (`@paystack/inline-js`) — Transit Credit top-up |
| Tooling     | ESLint + Prettier, yarn                 |

### Notes on choices (deviations from the original spec)

The original build spec (`CLAUDE.md`) suggested plain JSX, shadcn/ui, and React
Router v6. The actual implementation differs slightly, on purpose:

- **TypeScript instead of plain JS** — the project was scaffolded with the Vite
  React-TS template, and typed survey answers map cleanly to the database columns.
- **Hand-rolled Tailwind components instead of shadcn/ui** — keeps the dependency
  surface small and avoids a non-interactive `shadcn init`. The components in
  `src/components/ui/` (Button, Card, Input, RadioGroup, Progress, Toast, …)
  cover everything the spec needed.
- **React Router 7** — current major; the two-route API used here is identical
  to v6.

Everything the spec asked for — the multi-step survey, the "Never" conditional
exit, the max-3 feature-select validation, the waitlist with duplicate-email
handling, loading/success/error states — is implemented, and the survey has since
grown into an 18-question, one-question-at-a-time conversational flow covering all
three transport modes (see [The survey](#the-survey)).

---

## Project structure

```
movio-survey/
├── public/
│   └── favicon.svg
├── src/
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client + helpers
│   │   ├── survey.ts          # Declarative 18-question survey definition + types
│   │   ├── track-api.ts       # Live-map reads from the MovIO backend (not Supabase)
│   │   ├── backend.ts         # Shared POST helper + envelope handling for backend calls
│   │   ├── wallet-api.ts      # Paystack top-up initiate/verify (no login)
│   │   ├── complaints-api.ts  # Guest complaint / account-deletion submit (no login)
│   │   └── utils.ts           # cn() class-name helper
│   ├── components/
│   │   ├── ui/                # Button, Card, Input, Label, Textarea, OptionGroup
│   │   │                      #   (radio/checkbox), ScaleSelect, ModeRatingGrid,
│   │   │                      #   Progress, toast
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── PageShell.tsx      # Shared header/footer shell for the interactive pages
│   │   ├── LegalLayout.tsx    # Shared shell for Privacy / Terms
│   │   ├── ProgressBar.tsx    # Per-section "Question x of N" indicator
│   │   ├── SurveyHost.tsx     # Founder avatar + speech bubble (the "host")
│   │   ├── SurveyQuestion.tsx # Renders one question from the config + reactions
│   │   ├── Confetti.tsx       # Lightweight celebration on the thank-you screen
│   │   └── WaitlistForm.tsx   # Reused on landing + survey exit/thank-you
│   ├── pages/
│   │   ├── Landing.tsx        # Route: /       (hero, features, SDG, app pre-launch)
│   │   ├── Survey.tsx         # Route: /survey
│   │   ├── LiveMap.tsx        # Route: /live   (real backend GPS, no auth)
│   │   ├── TopUp.tsx          # Route: /topup  (Paystack Transit Credit top-up)
│   │   ├── Complaint.tsx      # Route: /complaint      (guest problem report)
│   │   ├── DeleteAccount.tsx  # Route: /delete-account (Play Store deletion path)
│   │   ├── Privacy.tsx        # Route: /privacy
│   │   └── Terms.tsx          # Route: /terms
│   ├── App.tsx                # Router + ToastProvider
│   ├── main.tsx               # Entry point
│   └── index.css              # Tailwind + brand theme
├── supabase/
│   └── schema.sql             # Tables + RLS policies (run in Supabase SQL editor)
├── docs/
│   ├── SUPABASE.md            # Database setup
│   └── DEPLOYMENT.md          # Vercel deployment
├── .env.example               # Copy to .env.local and fill in
├── vercel.json                # SPA rewrites for client-side routing
└── ...config (vite, tsconfig, eslint, prettier, editorconfig)
```

---

## Getting started

Prerequisites: **Node 20+** and **yarn** (standardised across the monorepo — backend/dashboard also use yarn).

```bash
# 1. Install dependencies
yarn install

# 2. Configure environment
cp .env.example .env.local
#   then edit .env.local with your Supabase URL + anon key
#   (Supabase dashboard → Settings → API)

# 3. Set up the database
#   Run supabase/schema.sql in the Supabase SQL editor (see docs/SUPABASE.md)

# 4. Start the dev server
yarn dev
```

The app runs at <http://localhost:5173>.

### Scripts

| Command         | What it does                                   |
| --------------- | ---------------------------------------------- |
| `yarn dev`      | Start the Vite dev server                      |
| `yarn build`    | Type-check (`tsc -b`) and build for production |
| `yarn preview`  | Preview the production build locally           |
| `yarn lint`     | Run ESLint                                      |
| `yarn format`   | Format the codebase with Prettier              |

---

## Environment variables

Defined in `.env.local` (never committed — it's gitignored):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Live map + top-up + guest complaints read/write the MovIO backend (not Supabase)
VITE_API_BASE_URL=http://localhost:4000            # Render backend URL in prod
# VITE_SOCKET_URL=http://localhost:4000            # defaults to VITE_API_BASE_URL

# Paystack PUBLIC key for the Transit Credit top-up page (pk_test_… in dev).
# The SECRET key stays in the backend only, never here.
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

These variables must be added in **Vercel → Project Settings →
Environment Variables** before deploying. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
Full descriptions of each are in [`.env.example`](.env.example).

---

## Code style & editor setup

- **Prettier** owns formatting. Config in `.prettierrc.json`:
  **4-space indent**, single quotes, no semicolons, trailing commas, 100-char
  width, with `prettier-plugin-tailwindcss` to auto-sort Tailwind classes.
- **ESLint** (flat config in `eslint.config.js`) handles code quality and defers
  all formatting to Prettier via `eslint-config-prettier`.
- **`.editorconfig`** enforces 4-space indent / LF endings across editors.
- **VS Code** (`.vscode/settings.json`) is set to **format on save** (and
  auto-save on focus change) using Prettier, plus ESLint auto-fix on save.
  Recommended extensions are in `.vscode/extensions.json` — accept the prompt to
  install Prettier, ESLint, and the Tailwind IntelliSense extensions.

---

## The survey

18 questions across 3 sections, defined declaratively in
[`src/lib/survey.ts`](src/lib/survey.ts) so the questions, types, and database
columns stay in one place. It plays as a **conversation**, not a form:

- **One question per frame** — questions advance one at a time with direction-aware
  slide animations, a per-section **"Question _x_ of N"** progress bar, and
  `Enter`-to-continue.
- **A talking host** — a founder avatar + speech bubble (`SurveyHost`) narrates
  each section, and the survey **whispers back** to telling answers inline (e.g.
  *"Over 30 minutes?! That's a whole lecture intro lost."*).
- **Three transport modes** — captures which modes the student uses (shuttle /
  Keke / cab), their primary mode, and a compact **per-mode 1–5 rating grid**
  (`ModeRatingGrid`) so the data is comparable across all three.
- **Conditional exit** — selecting *"Never — I walk or use my own vehicle"* on the
  gate question ends the survey early with a polite exit screen + waitlist form.
- **Max-3 feature select** + **per-question required validation** before advancing.
- **Contact step + waitlist opt-in** — an optional name/email step at the end with
  a default-on waitlist opt-in. The survey row itself stays **anonymous**; the
  email only ever feeds the `waitlist` table.
- **Thank-you screen** with a confetti burst, a copy-the-link share button, and a
  waitlist confirmation.

All responses insert into the `survey_responses` table in a single call; export
them as CSV from the Supabase Table Editor for your report.

> **Heads-up:** the schema changed for the three-mode update — re-run
> [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It
> renames `shuttle_frequency → transport_frequency` (guarded) and adds
> `transport_modes`, `primary_mode`, and the `shuttle_rating` / `keke_rating` /
> `cab_rating` columns. Existing rows are preserved.

See [`docs/SUPABASE.md`](docs/SUPABASE.md) for the schema and how the data maps
back into the report.

---

## Deployment

Push to GitHub and import the repo into Vercel — it auto-detects Vite. Add the
two environment variables, deploy, and share the URL. Full steps in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
