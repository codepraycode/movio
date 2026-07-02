# MovIO Backend

Node.js/Express REST + WebSocket API. Implements Milestone 1 (`DB-1`, `DB-2`, `BE-1` to `BE-6`) from the project milestone plan.

## Stack
- Express (REST API)
- `pg` (raw parameterized SQL, no ORM — every query is visible and explainable)
- PostgreSQL
- Socket.io (live location broadcast)
- JWT (`jsonwebtoken`) + `bcrypt` for auth

## Setup

1. **Install Postgres locally**, or create a free instance on Railway/Render.
2. **Create the database and run the schema:**
   ```bash
   createdb movio
   psql movio < db/schema.sql
   psql movio < db/seed.sql   # optional starter data
   ```
   (Or paste `schema.sql` into whatever SQL console your host gives you.)
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Configure environment:**
   ```bash
   cp .env.example .env
   # then fill in DATABASE_URL and a real JWT_SECRET
   ```
5. **Run it:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:4000/health` — should return `{ "status": "ok" }`.

## Testing the boarding flow without hardware

Once you've registered a student and linked an NFC credential (see the bottom of `db/seed.sql`), get an active `trip_id` and run:

```bash
node scripts/simulate-taptrace.js <trip_id> <nfc_uid>
```

This posts fake GPS updates every 5 seconds (matching the real TapTrace device's interval) and a fake boarding tap every 15 seconds, exactly like the real hardware will once `HW-4` is built. Point your dashboard/mobile app at this backend and you'll see live movement without owning a single ESP32 yet.

## API overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Self-registration (students) |
| POST | `/api/v1/auth/login` | No | Returns JWT for any role |
| GET | `/api/v1/tracking/active` | Student/Admin JWT | Active trips + latest GPS |
| POST | `/api/v1/tracking/update` | Device (TODO: device auth) | GPS update from TapTrace/simulator |
| POST | `/api/v1/boarding/authenticate` | Device (TODO: device auth) | NFC boarding + credit deduction |

More endpoints (trips start/end, admin reports, complaints) are in the milestone plan under `BE-*` — not built yet, add them the same way: controller → route → wire into `app.js`.

## Known TODOs (say these out loud in Chapter 4, don't hide them)
- Boarding/tracking endpoints are currently open — need per-device API key auth before any real deployment (noted inline in `boardingController.js`)
- No automated tests yet
- No rate limiting
