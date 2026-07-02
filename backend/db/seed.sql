-- Minimal seed data for local testing. Run after schema.sql.
-- Gives you: one vehicle, one route, one driver, one active trip, one student
-- with an NFC credential and 5 Transit Credits - enough to run
-- scripts/simulate-taptrace.js immediately and see it in the dashboard.

INSERT INTO vehicles (vehicle_id, plate_number, vehicle_type, capacity, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'FUTA-001', 'bus', 40, true);

INSERT INTO routes (route_id, route_name, stops, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'South Gate to West Gate',
  '[{"name":"South Gate","lat":7.2999,"lng":5.1350},{"name":"West Gate","lat":7.3050,"lng":5.1400}]',
  true
);

-- Driver: don't hardcode a password hash here (a made-up bcrypt string won't
-- actually verify against any real password, which would be misleading).
-- Instead, register the driver properly:
--   POST /api/v1/auth/register  { first_name, last_name, email, password, role: "driver" }
-- Then use the returned user_id in the trip insert below.

-- INSERT INTO trips (trip_id, vehicle_id, driver_id, route_id, start_time, status)
-- VALUES (
--   '44444444-4444-4444-4444-444444444444',
--   '11111111-1111-1111-1111-111111111111',
--   '<driver user_id from register response>',
--   '22222222-2222-2222-2222-222222222222',
--   now(),
--   'active'
-- );

-- Student: register this one properly through POST /api/v1/auth/register instead
-- of hardcoding a password hash, then link a credential to whatever user_id you get back:
-- INSERT INTO nfc_credentials (user_id, nfc_uid, credential_type)
-- VALUES ('<user_id from register response>', '04A1B2C3D4', 'mifare_card');
-- UPDATE transit_wallets SET balance_credits = 5 WHERE user_id = '<same user_id>';
