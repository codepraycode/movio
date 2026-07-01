# AGENTS.md

Canonical, tool-agnostic project instructions for any AI coding agent working in this repo (Claude Code, Cursor, Copilot, etc.). This is the source of truth — `CLAUDE.md` just imports this file.

## Project
MovIO (Mobility Optimization Via Intelligent Operations) — final year software engineering project, FUTA. Smart campus transportation system: NFC boarding authentication (via the TapTrace device), real-time GPS shuttle tracking, Transit Credit wallet, admin analytics dashboard. Defence expected this month (July 2026), exact date unconfirmed — prioritize a working, honestly-scoped demo over an ambitious but broken one.

**The academic report (`docs/` — Chapters 1–3 already written) is the source of truth for requirements and architecture.** Check it before making an architectural decision. If code needs to diverge from what the report says (already happened once: Raspberry Pi → ESP32), update the report — don't let them drift apart. The person you're working with defends this report to human examiners.

## Who you're working with
A young software engineer, FUTA Software Engineering student, based in Nigeria. Comfortable with Vite/React and general JS. **New to Flutter and to embedded firmware (ESP32/C++)** — budget extra explanation and smaller steps specifically in those two areas. Wants to actually learn the hardware/firmware side, not have it done invisibly — narrate reasoning there, don't just hand over finished code. Working under real time pressure toward a defence date.

## Repo structure (monorepo)
```
movio/
  backend/    Node.js/Express REST + WebSocket API, PostgreSQL (via Supabase)
  dashboard/  React/Vite admin dashboard
  mobile/     Flutter student application
  firmware/   ESP32 firmware for the TapTrace device
  docs/       Chapter drafts, milestone plan, manual test plan, setup guides
```
One repo, parallel-track development: hardware (`firmware/`) and software (`backend/`, `dashboard/`, `mobile/`) progress independently and merge at integration testing, not sequentially.

## Tech stack — don't silently swap these without discussion
- **Backend:** Node.js + Express, raw `pg` (no ORM — deliberate, keeps queries visible/explainable for defence), PostgreSQL hosted on **Supabase** (free tier — chosen over Render's free Postgres because it pauses rather than hard-deletes after inactivity), Socket.io, JWT + `bcryptjs` (not `bcrypt` — native bindings failed to build in a sandboxed test environment; pure-JS avoids that class of problem entirely)
- **Dashboard:** React + Vite + Tailwind, Leaflet + OpenStreetMap. Deploys to **Vercel** (free), root directory `dashboard`
- **Backend deployment:** **Render** free Web Service, root directory `backend`. Known tradeoff: spins down after 15 min idle, ~30-60s cold start on next request. For live defence demos, run the backend locally instead of relying on the deployed cold-start-prone instance.
- **Mobile:** Flutter (Dart), flutter_map + OpenStreetMap, flutter_nfc_kit, geolocator. No cloud deployment — build APK locally, install on a test device.
- **Firmware:** ESP32 (not Raspberry Pi — cost/power reasons; see report §3.4.5 once updated), PN532 (NFC), Neo-6M (GPS), optionally SIM800L/A7670 for cellular MQTT. Flashed locally via USB, no cloud deployment.
- **Device name:** the vehicle-mounted NFC+GPS unit is **TapTrace** everywhere — code, docs, report. Don't reintroduce "Reader Device."
- **Project management:** Linear. Task codes (`BE-3`, `HW-2`, etc.) referenced in `docs/MovIO_Milestone_Plan.md` should match Linear issue titles — keep them traceable both directions.

## Setup / commands
- Backend: `cd backend && npm install && cp .env.example .env` (fill in `DATABASE_URL` from Supabase + `JWT_SECRET`), then `npm run dev`. Health check: `GET /health`.
- Backend DB: run `backend/db/schema.sql` against the Supabase Postgres instance before first use.
- Dashboard: `cd dashboard && npm install && npm run dev`.
- Simulate TapTrace hardware before it physically exists: `node backend/scripts/simulate-taptrace.js <trip_id> <nfc_uid>`.

## Testing
Manual testing is the primary strategy here (student-led final year project, tight timeline) — see `docs/MovIO_Manual_Test_Plan.md` for the full test case table, organized by feature area and mapped to the report's functional/non-functional requirements. When you add a feature, add or update the relevant test cases in that file rather than assuming coverage. If you write any automated tests, keep them simple (basic endpoint/unit tests) — don't introduce a heavy test framework under this timeline without discussion.

## Conventions
- SQL: parameterized queries only, never string-concatenated SQL
- Enums modeled as `VARCHAR` + `CHECK` constraints, not native Postgres `ENUM` types (easier to alter later — see comment at top of `backend/db/schema.sql`)
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`) — repo goes public after defence, keep history clean
- Every unauthenticated or clearly-incomplete endpoint gets an inline `// TODO` comment explaining what's missing and why it's deferred — these become the honest "known limitations" list in Chapter 4, not something to hide
- Keep code readable over clever — this person needs to explain every line at defence, in several tools they're still learning

## What NOT to do
- Don't invent features beyond the report's functional requirements without flagging it as a scope addition first
- Don't claim things work (a live bus pilot, hardware tested in-vehicle) that haven't actually been run — Chapter 4 needs to report real results, not aspirational ones
- Don't add heavy frameworks/tooling not already in the stack above without discussing first
- Don't skip `docs/MovIO_Manual_Test_Plan.md` when a feature is "done" — done means tested, not just implemented

## Where things stand
Update this section at the end of each session so the next one (in any tool) doesn't have to reconstruct state:
- [x] Backend scaffold + Postgres schema — auth, boarding, tracking endpoints exist; admin/report/complaint endpoints not yet (`BE-7`, `BE-8`)
- [ ] Dashboard
- [ ] Flutter mobile app
- [ ] TapTrace firmware — blocked on parts arriving
- [ ] Manual testing (`docs/MovIO_Manual_Test_Plan.md`)
- [ ] Deployment (Render + Vercel)
- [ ] Chapter 4 writeup

Full task-level detail: `docs/MovIO_Milestone_Plan.md`, mirrored in Linear.
