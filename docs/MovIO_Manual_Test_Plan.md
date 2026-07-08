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
| DASH-01 | Admin account exists | Log into dashboard with correct email/password | Redirected to Fleet Map, JWT + admin name stored, topbar shows admin's name | | |
| DASH-01b | Admin account exists | Log in with wrong password | Plain-language error banner shown, no redirect, no token stored | | |
| DASH-01c | Non-admin (student/driver/transport_personnel) account exists | Log in with correct credentials for that account | Rejected with "This dashboard is for admin accounts only.", no token stored | | |
| DASH-02 | Active trip with a location update in the last 5s | View Fleet Map | Marker shows the amber pulse-ring animation | | |
| DASH-02b | Active trip, last location update 5-15s old | View Fleet Map | Marker shown static (no pulse), same amber dot | | |
| DASH-02c | Active trip, last location update >15s old | View Fleet Map | Marker fades to a grey outline only | | |
| DASH-02d | No active trips | View Fleet Map | Campus map still renders; "No active trips right now. Trips appear here once a driver starts one." shown | | |
| DASH-03 | — | Create a new vehicle via the UI | Not built this pass — no backend vehicle-management endpoint exists; nav item shows "Soon" | | N/A |
| DASH-04 | — | Create a new route with stops | Not built this pass — no backend route-management endpoint exists; nav item shows "Soon" | | N/A |
| DASH-05 | Several boarding events exist | View Ridership screen, switch groupBy route/vehicle/day | Table numbers match a manual `COUNT ... GROUP BY` query against `boarding_events` for each grouping; chart bars match the table | | |
| DASH-06 | Complaints exist in each status | View Complaints screen, filter by status tab | Correct subset shown per tab, student name/description/trip/submitted-time all correct | | |
| DASH-06b | Open complaint exists | Change its status via the row dropdown | `PATCH` succeeds, badge updates to new status without a full page reload | | |
| DASH-06c | No complaints match the current filter | View Complaints screen | "No open complaints." shown (plain register, no celebratory copy) | | |
| DASH-07 | — | Log out, try to access dashboard routes directly by URL | Redirected to login, no data leaks in network tab | | |
| DASH-08 | Backend + Supabase both reachable | View the status bar in the dashboard footer | Shows "All systems normal", technical detail (DB status/latency/uptime) available via hover tooltip only | | |
| DASH-09 | Backend running, Supabase connection broken/paused | View the status bar in the dashboard footer | Shows "Some features may be slower than usual", `GET /health` returns 503 | | |
| DASH-10 | Backend not running / unreachable | View the status bar in the dashboard footer | Shows "Taking longer than usual to respond" then "System temporarily unavailable" after the 10s timeout, Refresh button still works | | |
| DASH-11 | Ridership data exists, no fuel figure saved yet | View Sustainability screen | Prompts for a fuel estimate instead of showing a fabricated number; real trip count still shown | | |
| DASH-11b | Admin enters and saves a fuel-per-trip figure | View Sustainability screen | Headline litres = trip count × saved figure, labeled "Estimated · pending confirmed fuel data"; persists after a page reload (same browser) | | |

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

### 6a. Login / Register screens (`PSD-101` / MOB-2)

Contract rows were verified live via curl against the real backend + Supabase (register→login→409→401→422, and the created `users` + `transit_wallets` rows confirmed in Supabase then cleaned up). On-device UI/navigation rows are pending a run on the physical phone with the backend on the LAN IP.

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| MOB-2-01 | Backend on LAN IP, app on device | Register a new student (matric, name, email, password) | 201; app navigates to home; a `users` row **and** a `transit_wallets` row are created | Contract verified live (user+wallet row confirmed in Supabase, then removed); on-device nav pending | Pass (contract) |
| MOB-2-02 | Registered | Log out, log back in with the same email/password | Login succeeds, JWT stored, lands on home | Login envelope + token verified live via curl; on-device pending | Pass (contract) |
| MOB-2-03 | Logged in | Kill the app and relaunch | Still authenticated (JWT persisted in secure storage), goes straight to home — no re-login | Pending device run | |
| MOB-2-04 | — | Register with an already-used email/matric | Clean 409 "A user with this email or matric number already exists" surfaced as a snackbar | 409 path verified live via curl | Pass (contract) |
| MOB-2-05 | — | Login with a wrong password | Clean 401 "Invalid email or password" snackbar, no crash | 401 verified live via curl | Pass (contract) |
| MOB-2-06 | — | Submit register with empty name / bad email / short (<6) password | Inline field errors shown before any request is sent | Client validators mirror backend DTO; backend 422 envelope parsing verified live | Pass (contract) |
| MOB-2-07 | Backend down / wrong IP | Attempt login | Friendly "Can't reach the MovIO server…" message, no crash | Network-failure path coded in ApiClient; on-device pending | |

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

## 9. Complaints (`BE-8`, `FE-10`)

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

## 11. Ridership Report (`BE-7`, `FE-9`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| REPORT-01 | Admin JWT, boarding_events exist | GET `/admin/reports/ridership?groupBy=route` | 200, counts per route match a manual `SELECT COUNT(*) ... GROUP BY route_name` | `[{"route_name":"South Gate to West Gate","boarding_count":3}]`, matched manual query | Pass |
| REPORT-02 | Same as above | GET `/admin/reports/ridership?groupBy=vehicle` | 200, counts per `plate_number` match a manual query | `[{"plate_number":"FUTA-001","boarding_count":3}]`, matched manual query | Pass |
| REPORT-03 | Same as above | GET `/admin/reports/ridership?groupBy=day` | 200, counts per day match a manual query | `[{"day":"2026-07-02","boarding_count":3}]` | Pass |
| REPORT-04 | Admin JWT | GET `/admin/reports/ridership` with no `groupBy` | 200, defaults to route grouping | Same as REPORT-01 | Pass |
| REPORT-05 | Admin JWT | GET `/admin/reports/ridership?groupBy=bogus` | 400 | `{"message":"Invalid groupBy. Must be one of: route, vehicle, day"}` | Pass |
| REPORT-06 | — | GET `/admin/reports/ridership?groupBy=route` with no Authorization header | 401 | `{"message":"Missing or malformed Authorization header"}` | Pass |
| REPORT-07 | Student JWT | GET `/admin/reports/ridership?groupBy=route` as a non-admin | 403 | `{"message":"Forbidden - insufficient role"}` | Pass |

## 12. Route Management (`BE-?`/`FE-7`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| ROUTE-01 | Admin JWT | POST `/admin/routes` with `route_name` + 2 stops | 201, stops round-trip correctly as JSONB | `{"route_id":"c810d5fa...","stops":[{"lat":7.2999,"lng":5.135,"name":"South Gate"},{"lat":7.301,"lng":5.136,"name":"Library"}]}` | Pass |
| ROUTE-02 | Admin JWT | POST `/admin/routes` with only 1 stop | 422, validation error | `{"message":"Validation failed","errors":[{"field":"stops","constraints":["stops must contain at least 2 stops"]}]}` | Pass |
| ROUTE-03 | Admin JWT, routes exist | GET `/admin/routes` | 200, list includes both seeded and newly created routes | Returned 2 routes including the seeded `South Gate to West Gate` | Pass |
| ROUTE-04 | Admin JWT, route from ROUTE-01 | PATCH `/admin/routes/:id` with new `route_name` + 3 stops | 200, name and stops updated | `{"route_name":"South Gate to Library (via Hostel)","stops":[...3 stops...]}` | Pass |
| ROUTE-05 | Same route | PATCH `/admin/routes/:id` with only `{"is_active":false}` | 200, only `is_active` changes, `route_name`/`stops` unchanged | `is_active:false`, name/stops preserved from ROUTE-04 | Pass |
| ROUTE-06 | Admin JWT | PATCH `/admin/routes/:id` for a non-existent route id | 404 | `{"message":"Route not found"}` | Pass |
| ROUTE-07 | — | GET `/admin/routes` with no Authorization header | 401 | `{"message":"Missing or malformed Authorization header"}` | Pass |
| ROUTE-08 | Student JWT | GET `/admin/routes` as a non-admin | 403 | `{"message":"Forbidden - insufficient role"}` | Pass |

## 13. Trip Monitoring (`FE-8`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| TRIPMON-01 | Admin JWT, active trip with no boarding events yet | GET `/admin/trips` | 200, that trip's `passenger_count` is 0 | `"passenger_count":0` | Pass |
| TRIPMON-02 | Same trip, one boarding tap via `POST /boarding/authenticate` | GET `/admin/trips` again | `passenger_count` increases to 1, matches manual `SELECT COUNT(*) FROM boarding_events WHERE trip_id=...` | `"passenger_count":1`, manual count also `1` | Pass |
| TRIPMON-03 | Trip ended via `POST /trips/:id/end` | GET `/admin/trips` | `status` flips from `active` to `completed`, `passenger_count` unchanged | `"status":"completed","passenger_count":1` | Pass |
| TRIPMON-04 | — | GET `/admin/trips` with no Authorization header | 401 | `{"message":"Missing or malformed Authorization header"}` | Pass |
| TRIPMON-05 | Student JWT | GET `/admin/trips` as a non-admin | 403 | `{"message":"Forbidden - insufficient role"}` | Pass |

## 14. Driver Assignment (`FE-11`)

Required the `assigned_driver_id` column on `vehicles`, added by a migration the engineer ran themselves between sessions (confirmed applied this session - `GET /admin/vehicles` now returns the column). All rows below verified live.

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| ASSIGN-01 | Admin JWT, at least one driver registered | GET `/admin/users?role=driver` | 200, only `role='driver'` users returned | `[{"first_name":"Dele","last_name":"Driver","role":"driver"}]` | Pass |
| ASSIGN-02 | Admin JWT | GET `/admin/users?role=bogus` | 400 | `{"message":"Invalid role. Must be one of: student, driver, transport_personnel, admin"}` | Pass |
| ASSIGN-03 | Admin JWT, vehicle + driver exist | PATCH `/admin/vehicles/:id/assign-driver` with `{"driver_id":"<driver user_id>"}` | 200, `GET /admin/vehicles` now shows that driver assigned | `{"assigned_driver_id":"1f4c9ff6...","driver_first_name":"Dele","driver_last_name":"Driver"}` | Pass |
| ASSIGN-04 | Same | PATCH `.../assign-driver` with a `driver_id` belonging to a non-driver user | 400 | `{"message":"driver_id must reference a user with role=driver"}` | Pass |
| ASSIGN-05 | Same | PATCH `.../assign-driver` with `{"driver_id":null}` | 200, vehicle shows unassigned | `{"assigned_driver_id":null,"driver_first_name":null,"driver_last_name":null}` | Pass |
| ASSIGN-06 | Same | PATCH `.../assign-driver` for a non-existent vehicle id | 404 | `{"message":"Vehicle not found"}` | Pass |
| ASSIGN-07 | — | GET `/admin/vehicles` with no Authorization header | 401 | `{"message":"Missing or malformed Authorization header"}` | Pass |
| ASSIGN-08 | Student JWT | PATCH `/admin/vehicles/:id/assign-driver` as a non-admin | 403 | `{"message":"Forbidden - insufficient role"}` | Pass |

## 15. Vehicle CRUD (`FE-6`)

| ID | Precondition | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| VEHICLE-01 | Admin JWT | POST `/admin/vehicles` with `{"plate_number":"FUTA-TEST-...","vehicle_type":"tricycle","capacity":4}` | 201, vehicle created with `is_active:true` by default | `{"vehicle_type":"tricycle","capacity":4,"is_active":true}` | Pass |
| VEHICLE-02 | Admin JWT | POST `/admin/vehicles` with `vehicle_type:"spaceship"` | 422, validation rejects any value outside `bus\|cab\|tricycle` | `{"message":"Validation failed","errors":[{"field":"vehicle_type","constraints":["vehicle_type must be one of the following values: bus, cab, tricycle"]}]}` | Pass |
| VEHICLE-03 | Vehicle from VEHICLE-01 exists | POST `/admin/vehicles` again with the same `plate_number` | 409, no duplicate row created | `{"message":"A vehicle with this plate number already exists"}` | Pass |
| VEHICLE-04 | Admin JWT, vehicle from VEHICLE-01 | PATCH `/admin/vehicles/:id` with `{"capacity":6,"vehicle_type":"cab"}` | 200, fields updated, `plate_number`/`is_active` untouched | `{"vehicle_type":"cab","capacity":6,"is_active":true}` | Pass |
| VEHICLE-05 | Same vehicle | PATCH `/admin/vehicles/:id` with `{"is_active":false}` | 200, row **deactivated, not deleted** | `{"is_active":false}`, then confirmed the row still appears in `GET /admin/vehicles` with `is_active:false` | Pass |
| VEHICLE-06 | Admin JWT | PATCH `/admin/vehicles/:id` for a non-existent vehicle id | 404 | `{"message":"Vehicle not found"}` | Pass |
| VEHICLE-07 | — | POST `/admin/vehicles` with no Authorization header | 401 | `{"message":"Missing or malformed Authorization header"}` | Pass |
| VEHICLE-08 | Student JWT | POST `/admin/vehicles` as a non-admin | 403 | `{"message":"Forbidden - insufficient role"}` | Pass |

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
| Ridership Report | 7 | | | |
| Route Management | 8 | | | |
| Trip Monitoring | 5 | | | |
| Driver Assignment | 8 | | | |
| Vehicle CRUD | 8 | | | |
| **Total** | **100** | | | |

SUS Score: ___ / 100 (n = ___)
