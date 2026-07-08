# MovIO — Project Context Brief
### For any AI agent working on the mobile app, backend, or admin dashboard

> Read this once before touching code. It's the "story" of the project — what it is, who it's for, what's already decided, and what's still open. If something here conflicts with an explicit instruction the developer gives you in a session, the live instruction wins — but flag the conflict instead of silently overriding this doc.

---

## 1. The one-paragraph pitch

MovIO is a final-year software engineering project at the **Federal University of Technology, Akure (FUTA), Nigeria**, built by a solo student developer (the person you're working with). It digitizes FUTA's campus shuttle service — currently 100% manual, cash-only, untracked, and unauthenticated — by adding **NFC tap-to-board authentication**, **real-time GPS shuttle tracking**, a **prepaid "Transit Credit" wallet**, and a **centralized analytics dashboard**. It's a real system being built for real deployment consideration at a real Nigerian university, not a toy demo — treat correctness, cost-realism, and Nigerian-context constraints (intermittent connectivity, local hardware sourcing, low NFC-phone penetration) as first-class requirements, not nice-to-haves.

The developer is a **young, practicing software engineer based in Nigeria**, an ambitious FUTA software engineering student, currently preparing this as their **final year project defence report**. They want realism and professionalism over polish — don't assume things on their behalf; ask.

---

## 2. The problem being solved (FUTA's current reality)

FUTA has ~31,000 students and a fleet of **65 shuttle buses/cabs/tricycles ("keke")** running two main routes (South Gate–West Gate corridor, and SPS Road). The current system, confirmed via field observation, a driver interview, and a meeting with the FUTA Student Union Government (SUG):

- Flat cash fare of **₦200/trip**, no receipts, no digital record.
- **No exact-change mechanism** — drivers routinely can't give change, students overpay with no recourse (a paper IOU card exists but is almost never redeemed).
- **No boarding authentication** — anyone can board, no way to verify affiliation with the university.
- **No real-time tracking** — students wait blind at stops.
- **No ridership data** — administrators plan routes/fleet with zero empirical basis.
- Buses depart only when full, causing delays; no central dispatch — each driver self-manages their vehicle.
- SUG confirmed no digital transport system has ever been attempted at FUTA and expressed willingness to support a pilot.

## 3. The evidence base (104-student survey, June 2026)

A custom web survey (React/Vite/Supabase, distributed via WhatsApp) collected 104 responses across all levels. Key numbers — **treat these as real, citable data**, already written into the report:

| Finding | % |
|---|---|
| Use shuttle as primary transport mode | 78% |
| Travel daily / several times weekly | 69% |
| Rarely/never know when next shuttle arrives | 70% |
| Late/missed a lecture due to transport | 81% |
| Stranded on a full bus | 82% |
| Overpaid due to change problem | 89% (43% "frequently") |
| Mean satisfaction with current system | 2.7 / 5 |
| Rate live tracking useful/extremely useful | 93–94% |
| Interested in NFC tap-to-board | 99% (91% "definitely") |
| Comfortable using a transport app | 88–89% |
| Confirmed phone has NFC | **39%** (49% unsure, 12% no) |
| Top requested features | tap-to-pay (70%), live map (69%), ETA (43%) |

**The NFC-phone number (39% confirmed) is the single most architecture-defining data point in the whole project.** It's why the system does NOT assume smartphone NFC (Host Card Emulation) as the primary credential — it uses a **physical MIFARE card** as the primary credential, with phone-based HCE as a secondary/optional mode. Don't reverse this decision without flagging it — it's evidence-based, not arbitrary.

---

## 4. System architecture — the three tiers

MovIO is a three-tier client–server system:

```
┌───────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│  CLIENT LAYER      │   │ APPLICATION SERVER  │   │  DATA LAYER        │
│                     │   │                      │   │                    │
│ • Flutter student   │──▶│ Node.js + Express    │──▶│ PostgreSQL         │
│   mobile app        │   │ REST API + WebSocket │   │ (relational, JSONB │
│ • Admin web         │   │ (Socket.io)          │   │  for route stops)  │
│   dashboard (React) │   │ MQTT broker sub      │   │                    │
│ • Vehicle-mounted   │──▶│ (Mosquitto)          │   │                    │
│   "TapTrace" reader │   │                      │   │                    │
│   device            │   │                      │   │                    │
└───────────────────┘   └────────────────────┘   └────────────────────┘
```

**Two separate communication channels, on purpose:**
1. **HTTPS/REST + WebSocket** — student app and admin dashboard. TLS-encrypted, JWT bearer auth.
2. **MQTT (Mosquitto broker)** — vehicle reader devices only, publishing to `MovIO/boarding` and `MovIO/location` topics. Chosen because it's lightweight and built for constrained GSM/GPRS connections, and it isolates high-frequency IoT traffic from normal app traffic.

---

## 5. The three things you might be building

### 5.1 Student mobile app (Flutter)
- Live map of active shuttles (OpenStreetMap tiles via `flutter_map`, **not** Google Maps — cost reasons).
- Estimated arrival time at configured stops (derived from vehicle GPS vs. stop coordinates).
- Transit Credit wallet: balance display, top-up via **Paystack** (Nigeria's dominant payment gateway).
- NFC profile registration screen, with **automatic detection of whether the student's phone supports HCE** (most won't — plan the UI around "you probably need a physical card").
- Complaint submission (optionally linked to a trip).
- GPS via the `geolocator` package (wraps Android `FusedLocationProviderClient`).
- NFC via `flutter_nfc_kit` (handles MIFARE Classic/Ultralight over IsoDep/NfcA).
- Target: Android 8.0 (API 26)+, cross-platform Flutter codebase but primary testing is Android (dominant OS among Nigerian students).

### 5.2 Backend (Node.js + Express + PostgreSQL)
- JWT auth (bcrypt-hashed passwords), roles: `student`, `driver`, `transport_personnel`, `admin`.
- NFC boarding endpoint: looks up UID in `NFC_Credential`, checks/deducts Transit Credit, writes a `Boarding_Event`, returns success + student name. **Target: <2 seconds end-to-end.**
- GPS ingestion endpoint (and/or MQTT subscriber) writing `Location_Update` rows, pushed live to clients over WebSocket. **Target: visible to client within 10 seconds of real movement.**
- Paystack webhook handling for wallet top-ups.
- Ridership/financial reporting endpoints for the dashboard.
- Subscribes to the Mosquitto broker for reader-device traffic (boarding + GPS).
- Deployment target: a free-tier cloud PaaS (Railway or Render) — cost-zero for the prototype phase, HTTPS by default.
- **General API shape:**

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Student self-registration (matric number) |
| POST | `/api/v1/auth/login` | — | JWT for any role |
| GET | `/api/v1/tracking/active` | Student JWT | Active trips + latest GPS |
| POST | `/api/v1/tracking/update` | Driver/device JWT | GPS coordinate ingestion |
| POST | `/api/v1/boarding/authenticate` | Driver/device JWT | Validate NFC UID, log boarding |
| POST | `/api/v1/trips/start` / `/api/v1/trips/{id}/end` | Driver JWT | Trip lifecycle |
| GET | `/api/v1/admin/trips` | Admin JWT | Trip list w/ filters |
| GET | `/api/v1/admin/reports/ridership` | Admin JWT | Aggregated boarding stats |

### 5.3 Admin dashboard (React.js + Tailwind CSS)
- Live fleet map (Leaflet.js + OpenStreetMap), fed by the same WebSocket events as the student app.
- Vehicle, route, and driver-assignment CRUD.
- Complaint review/response workflow.
- Ridership reporting by route/vehicle/time period (tables + basic charts).
- Split-panel layout: live map as primary panel, KPI summary (active vehicles, passengers in transit, trips completed today) as secondary panel.

### 5.4 TapTrace — the vehicle-mounted reader device (hardware)
This is the physical unit bolted into each shuttle that does the actual NFC tap-to-board. **"TapTrace" is the working codename for this hardware subsystem inside the larger MovIO project** — use both names interchangeably but know TapTrace = the reader device specifically, not the whole app.

Its job: read the student's NFC card, get a GPS fix, and talk to the backend — while surviving vehicle vibration, drop-outs in connectivity, and driver-distraction concerns.

**⚠️ There is an unresolved hardware discrepancy you should know about (see §7) — the written report (Chapter 3) specifies a Raspberry Pi-based reader; the actual parts being ordered are ESP32-based.** Don't silently pick one; ask which is authoritative before writing firmware or wiring docs.

---

## 6. Data model (10–11 core entities)

| Entity | Role |
|---|---|
| `User` | All users; `role` enum governs access (student/driver/admin/transport_personnel) |
| `NFC_Credential` | Card UID or HCE token → user; multiple per user, individually deactivatable |
| `Vehicle` | Bus/cab/tricycle; FUTA's fleet is mixed-type |
| `Route` | Named route, ordered stop list (JSONB) with GPS coords |
| `Trip` | One journey: vehicle + driver + route; status = active/completed/cancelled |
| `Location_Update` | Timestamped GPS ping tied to a trip |
| `Boarding_Event` | Authenticated boarding: student + credential + trip + GPS + timestamp |
| `Transit_Wallet` | One per student; balance in credits |
| `Credit_Transaction` | Every credit movement (top-up app/cash, boarding deduction, redemption) |
| `Reader_Device` | Each TapTrace unit; `last_seen` flags offline devices |
| `Complaint` | Student complaint, optional trip link, open/under_review/resolved |

---

## 7. Open decisions — do not assume, ask the developer

The developer explicitly wants these treated as **real open questions**, not filled in with a plausible-sounding default:

1. **Reader hardware: Raspberry Pi Zero 2W/4 (as written in Chapter 3) vs. ESP32 dev board (as in the actual order list)?** These imply completely different firmware stacks (Python/Linux vs. Arduino-C++/MicroPython on a microcontroller), different power budgets, and different write-ups for the defence report. This needs to be settled before any reader-side code or wiring documentation is written.
2. **Connectivity module for the reader**: SIM800L (2G) vs SIM7070 (4G) vs none for the prototype phase — the two component lists disagree, and 2G network availability in the deployment area should be confirmed rather than assumed.
3. **Cellular/MQTT reachability on campus** — has actual GSM/GPRS/4G signal strength on FUTA's shuttle routes been tested? This affects whether the "5-second GPS update, offline caching" design is realistic as written.
4. Confirm current pricing/stock for hardware before finalizing a BOM — component lists were sourced from live Hub360/Nerdshed listings on a specific date and will drift.
5. Whether Google Maps is ever used anywhere (it isn't currently — OpenStreetMap/Leaflet only, for licensing-cost reasons) — don't introduce a Google Maps dependency without checking.

When in doubt on any of these, ask the developer directly — they've said explicitly they'd rather answer a question than have something assumed on their behalf.

---

## 8. Non-functional targets (already fixed in the report — build to these)

- NFC authentication: **< 2 seconds**
- GPS update visible to client: **< 10 seconds** from real movement
- REST API response time: **< 3 seconds** under normal load
- Usability: System Usability Scale (SUS) score **≥ 70** across all three user groups
- Must degrade gracefully under intermittent GSM/GPRS connectivity (offline NFC cache + queued sync)
- HTTPS/TLS everywhere; NFC UIDs not exposed as raw PII
- Architecture should scale conceptually to FUTA's ~31,000 students, even though the evaluated prototype uses a small sample (50–100 SUS participants)

---

## 9. Sustainability / SDG framing (this matters for the report, and it's genuinely real)

MovIO is explicitly positioned against three UN Sustainable Development Goals — this isn't decoration, it's argued substantively in the report and should be reflected in design choices where relevant:

- **SDG 4 (Quality Education)** — reducing transport-caused lateness/absenteeism.
- **SDG 9 (Industry, Innovation and Infrastructure)** — a digital infrastructure layer over an analogue service, using affordable, locally-sourced components.
- **SDG 11 (Sustainable Cities and Communities)** — demand-driven scheduling reduces under-filled/idle bus movement, cutting avoidable fuel use and emissions.

If you're proposing a feature, a reasonable lens is: *does this improve authentication, tracking, planning data, or fleet efficiency* — those are the four pillars the whole argument rests on.

---

## 10. Naming note

- **MovIO** (sometimes written "Movio") — the whole system/project name across the thesis, conference paper, and report chapters.
- **TapTrace** — codename specifically for the vehicle-mounted NFC+GPS reader hardware.
- Both names are correct depending on scope; don't "fix" one to the other.

---

## 11. How to work with this developer

- They are a **practicing software engineer**, not a beginner — skip hand-holding on fundamentals, but don't skip rigor.
- They explicitly want **realism over polish**: don't propose components, vendors, or numbers you haven't grounded in something concrete; flag when something needs field verification (pricing, network coverage, stakeholder confirmation) instead of stating it as fact.
- For anything touching the **TapTrace hardware**, think and respond like a **senior physicist/electronics engineer** — real power budgets, real signal/antenna considerations, real component tolerances — not hand-wavy IoT-tutorial advice.
- For the written report itself: keep Word deliverables **simple to edit** (minimal fancy styling), consistent with the existing chapters' tone and citation style (numbered/APA-style academic references, as seen in the existing chapters and conference paper).
- Always cross-check new content against the actual data already collected (the 104-student survey, the driver interview, the SUG meeting) rather than inventing new "typical" numbers.
