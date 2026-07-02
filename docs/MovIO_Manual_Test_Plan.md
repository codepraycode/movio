# MovIO — Manual Test Plan

Purpose: verify the system against the functional requirements (Ch.3 §3.3.4) and non-functional requirements (Ch.3 §3.3.5), and produce the evidence Chapter 4's "Testing and Evaluation" section needs. Record results honestly — a documented failure you fixed is better evidence of engineering than an unverified claim of success.

**How to use this:** work through each table top to bottom. For each case, record Pass/Fail and any actual measured number (don't estimate). Log any Fail as a bug issue in Linear (`BUG-` prefix) before moving on.

---

## 1. Authentication (`BE-2`, `BE-3`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| AUTH-01 | Backend running, DB reachable | POST `/auth/register` with valid student fields | 201, user + wallet created, wallet balance = 0 | | |
| AUTH-02 | — | POST `/auth/register` with an email already used | 409 conflict, no duplicate row created | | |
| AUTH-03 | — | POST `/auth/register` as student, omit `matric_no` | 400, clear error message | | |
| AUTH-04 | User from AUTH-01 exists | POST `/auth/login` with correct email/password | 200, valid JWT returned | | |
| AUTH-05 | — | POST `/auth/login` with wrong password | 401, no user data leaked in response | | |
| AUTH-06 | Valid JWT from AUTH-04 | GET `/tracking/active` with `Authorization: Bearer <token>` | 200, list returned | | |
| AUTH-07 | — | GET `/tracking/active` with no Authorization header | 401 | | |
| AUTH-08 | — | GET `/tracking/active` with an expired/tampered token | 401 | | |

## 2. Boarding / NFC Authentication (`BE-4`, `HW-4`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| BOARD-01 | Student with linked credential + wallet balance ≥ 1, active trip exists | POST `/boarding/authenticate` with valid `uid` + `trip_id` | 200, `success: true`, student name returned, wallet decremented by 1, boarding_event row created | | |
| BOARD-02 | Same student, wallet now at 0 | Repeat BOARD-01 | 200, `success: false, reason: insufficient_credits` — boarding NOT recorded | | |
| BOARD-03 | Unregistered/random UID | POST `/boarding/authenticate` with that UID | 200, `success: false, reason: unrecognized_or_inactive_card` | | |
| BOARD-04 | Credential exists but `is_active = false` | Tap that card | Boarding denied, same as BOARD-03 reason | | |
| BOARD-05 | Missing `trip_id` in request | POST `/boarding/authenticate` without `trip_id` | 400 | | |
| BOARD-06 | Real TapTrace device (once `HW-4` is ready) | Physically tap a real MIFARE card on the desk rig | Same success path as BOARD-01, using real hardware instead of the simulator | | |
| BOARD-07 | — | Time BOARD-06 from tap to confirmation display | Record actual ms — target is under 2 seconds (NFR, Ch.3 3.3.5) | | |

## 3. Transit Wallet / Credits

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| WALLET-01 | Student wallet at 0, transport_personnel JWT | POST `/wallet/topup-cash` with `{ user_id, amount: 50 }` | 200, balance increases by 50, `credit_transactions` row logged with `type='topup_cash'` | Balance 0 → 50, transaction row created (`ts-node-dev` + live Supabase, 2026-07-02) | Pass |
| WALLET-02 | — | Query `credit_transactions` for a student | Every boarding deduction and top-up appears, amounts sum correctly to current balance | | |
| WALLET-03 | Student JWT | POST `/wallet/topup-cash` as a student instead of transport_personnel | 403 Forbidden, no balance change | `{"success":false,"message":"Forbidden - insufficient role"}` | Pass |
| WALLET-04 | — | POST `/wallet/topup-cash` with no Authorization header | 401 | `{"success":false,"message":"Missing or malformed Authorization header"}` | Pass |
| WALLET-05 | transport_personnel JWT | POST `/wallet/topup-cash` with a `user_id` that has no wallet | 404 | `{"success":false,"message":"Wallet not found for this user"}` | Pass |
| WALLET-06 | transport_personnel JWT | POST `/wallet/topup-cash` with `amount: -5` | 422, validation error on `amount` | `{"success":false,"message":"Validation failed","errors":[{"field":"amount","constraints":["amount must be a positive number"]}]}` | Pass |

## 4. GPS Tracking (`BE-5`, `HW-3`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| TRACK-01 | Active trip exists | POST `/tracking/update` with valid lat/lng | 201, location_update row created | | |
| TRACK-02 | Dashboard/mobile connected via WebSocket | Trigger TRACK-01 | Connected client receives `location:update` event within ~1s | | |
| TRACK-03 | — | GET `/tracking/active` | Returns the trip with its most recent lat/lng, correct vehicle/route info | | |
| TRACK-04 | Simulator running (`simulate-taptrace.js`) | Let it run for 2+ minutes | Location updates arrive every ~5s consistently, no crashes | | |
| TRACK-05 | Real TapTrace device (once `HW-3`/`HW-4` ready) | Move the device physically (walk around with it) | Location updates reflect real movement on the dashboard map | | |
| TRACK-06 | — | Time from a real GPS update to it appearing on a connected client's map | Record actual ms — target under 10 seconds (NFR, Ch.3 3.3.5) | | |

## 5. Admin Dashboard (`FE-*`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| DASH-01 | Admin account exists | Log into dashboard | Redirected to main view, JWT stored | | |
| DASH-02 | Active trip with location updates | View live fleet map | Vehicle marker appears and updates position live | | |
| DASH-03 | — | Create a new vehicle via the UI | Appears in vehicle list, matches DB | | |
| DASH-04 | — | Create a new route with stops | Saved correctly, retrievable | | |
| DASH-05 | Several boarding events exist | View ridership report | Numbers match a manual COUNT query against `boarding_events` | | |
| DASH-06 | A complaint exists (inserted via API or later via mobile app) | View complaints list | Appears with correct status, can be marked resolved | | |
| DASH-07 | — | Log out, try to access dashboard routes directly by URL | Redirected to login, no data leaks in network tab | | |

## 6. Mobile App (`MOB-*`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| MOB-T01 | App installed on physical Android device | Register a new student account | Success, matches backend record | | |
| MOB-T02 | Logged in | View live map | Shows active shuttles, matches dashboard's view of the same data | | |
| MOB-T03 | — | View wallet balance | Matches DB value | | |
| MOB-T04 | Device has NFC hardware | Trigger HCE capability check | Correctly detects NFC availability | | |
| MOB-T05 | Device has no NFC | Trigger HCE capability check | Correctly reports unavailable, doesn't crash | | |
| MOB-T06 | Logged in | Submit a complaint | Appears in admin dashboard's complaint list | | |
| MOB-T07 | Poor/no network | Use the app | Fails gracefully with a clear message, doesn't crash — note honestly in Ch.4 if offline mode isn't fully built, this is acceptable to scope out but must not be silently broken | | |

## 7. Non-Functional / Performance (Ch.3 §3.3.5 targets)

| ID | Target (from NFRs) | Measurement method | Actual | Pass/Fail |
|---|---|---|---|---|---|
| PERF-01 | NFC auth completes under 2s | Stopwatch/timestamp from BOARD-07 | | |
| PERF-02 | GPS update visible under 10s | Stopwatch/timestamp from TRACK-06 | | |
| PERF-03 | REST API responds under 3s under normal load | Time 10 sequential requests to `/tracking/active`, note average and max | | |
| PERF-04 | System handles intermittent connectivity | Disconnect wifi mid-request, reconnect, confirm no data corruption/duplicate boarding | | |

## 8. Usability (Ch.3 §3.3.5, SUS ≥ 70 target)

| ID | Steps | Notes |
|---|---|---|
| SUS-01 | Recruit 5-10 participants (classmates, the driver contact, SUG contact if available) | Small-n, state this honestly in Ch.4, same standard as your original survey |
| SUS-02 | Have each complete: register → view live map → (simulate) tap to board → check wallet → submit a complaint | Time each participant, note where they get stuck |
| SUS-03 | Administer the standard 10-item SUS questionnaire immediately after | Compute score per Brooke (1996) scoring method |
| SUS-04 | Collect open-ended feedback | Direct quotes (with permission) strengthen Chapter 4's qualitative section |

## 9. Complaints (`BE-8`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| COMPLAINT-01 | Student JWT | POST `/complaints` with `{ description }` | 201, row created linked to `student_id`, `status='open'` | `{"success":true,"message":"Complaint submitted",...,"status":"open"}` | Pass |
| COMPLAINT-02 | Student JWT | POST `/complaints` with missing `description` | 422, validation error | `{"field":"description","constraints":[...]}` | Pass |
| COMPLAINT-03 | — | POST `/complaints` with no Authorization header | 401 | `{"message":"Missing or malformed Authorization header"}` | Pass |
| COMPLAINT-04 | Admin JWT, at least one complaint exists | GET `/admin/complaints` | 200, list includes complaint with submitting student's name joined in | Returned complaint with `first_name`/`last_name` populated | Pass |
| COMPLAINT-05 | Same as above | GET `/admin/complaints?status=open` | 200, filtered list, only `open` complaints | Matched | Pass |
| COMPLAINT-06 | Admin JWT | GET `/admin/complaints?status=bogus` | 400, invalid status filter | `{"message":"Invalid status filter. Must be one of: open, under_review, resolved"}` | Pass |
| COMPLAINT-07 | Student JWT | GET `/admin/complaints` as a non-admin | 403 | `{"message":"Forbidden - insufficient role"}` | Pass |
| COMPLAINT-08 | Admin JWT, complaint from COMPLAINT-01 | PATCH `/admin/complaints/:id` with `{ status: "resolved" }` | 200, status updated | `"status":"resolved"` returned | Pass |
| COMPLAINT-09 | Admin JWT | PATCH `/admin/complaints/:id` with a non-existent id | 404 | `{"message":"Complaint not found"}` | Pass |
| COMPLAINT-10 | Admin JWT | PATCH `/admin/complaints/:id` with an invalid `status` value | 422, validation error | `{"field":"status","constraints":[...]}` | Pass |

## 10. Trip Lifecycle (`BE-9`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| TRIP-01 | Driver JWT, vehicle exists, no active trip on it | POST `/trips/start` with `{ vehicle_id, route_id }` | 201, trip created with `status='active'` | `{"success":true,...,"status":"active"}` | Pass |
| TRIP-02 | Trip from TRIP-01 still active | POST `/trips/start` again with the same `vehicle_id` (different driver) | 409, no second trip created | `{"message":"This vehicle already has an active trip"}` | Pass |
| TRIP-03 | Driver JWT | POST `/trips/start` with a non-existent `vehicle_id` | 400 | `{"message":"vehicle_id, route_id, or device_id does not reference an existing record"}` | Pass |
| TRIP-04 | — | POST `/trips/start` with no Authorization header | 401 | `{"message":"Missing or malformed Authorization header"}` | Pass |
| TRIP-05 | Student JWT | POST `/trips/start` as a non-driver | 403 | `{"message":"Forbidden - insufficient role"}` | Pass |
| TRIP-06 | Trip from TRIP-01 active, second driver's JWT | POST `/trips/:id/end` as a driver who didn't start it | 403 | `{"message":"You can only end a trip you started"}` | Pass |
| TRIP-07 | Driver JWT | POST `/trips/:id/end` with a non-existent trip id | 404 | `{"message":"Trip not found"}` | Pass |
| TRIP-08 | Trip from TRIP-01 active, owning driver's JWT | POST `/trips/:id/end` | 200, `status='completed'`, `end_time` set | `"status":"completed","end_time":"2026-07-02T04:24:41.368Z"` | Pass |
| TRIP-09 | Trip from TRIP-08 now completed | POST `/trips/:id/end` again | 409 | `{"message":"Trip is not active"}` | Pass |

---

## Summary table (fill in once all sections are done — this table goes straight into Chapter 4)

| Category | Total Cases | Passed | Failed | Notes |
|---|---|---|---|---|
| Authentication | 8 | | | |
| Boarding/NFC | 7 | | | |
| Wallet | 6 | | | |
| Tracking | 6 | | | |
| Dashboard | 7 | | | |
| Mobile | 7 | | | |
| Non-functional | 4 | | | |
| Complaints | 10 | | | |
| Trip Lifecycle | 9 | | | |
| **Total** | **64** | | | |

SUS Score: ___ / 100 (n = ___)
