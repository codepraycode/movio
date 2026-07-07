-- MovIO Database Schema
-- Source of truth: Chapter 3, Table 3.3 (Movio_Chapter3.docx)
-- Note: uses VARCHAR + CHECK constraints instead of native Postgres ENUM types.
-- Reason: ENUMs are painful to alter later (ALTER TYPE ... ADD VALUE has restrictions
-- inside transactions). CHECK constraints give the same guarantee and are easy to
-- change with a single migration. This is a deliberate implementation decision you
-- can mention in Chapter 4 if asked.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matric_no     VARCHAR(20) UNIQUE,          -- required for students, null for others
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    role          VARCHAR(20) NOT NULL CHECK (role IN ('student', 'driver', 'transport_personnel', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NFC CREDENTIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS nfc_credentials (
    credential_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    nfc_uid         VARCHAR(64) UNIQUE NOT NULL, -- UID read from card or HCE token
    credential_type VARCHAR(20) NOT NULL CHECK (credential_type IN ('mifare_card', 'hce_phone')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    registered_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nfc_credentials_uid ON nfc_credentials(nfc_uid);

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number       VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type       VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('bus', 'cab', 'tricycle')),
    capacity           INTEGER NOT NULL DEFAULT 0,
    is_active          BOOLEAN NOT NULL DEFAULT true,
    assigned_driver_id UUID REFERENCES users(user_id) -- current driver assigned to this vehicle (FE-11), nullable
);

-- ============================================================
-- ROUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS routes (
    route_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name VARCHAR(150) NOT NULL,
    stops      JSONB NOT NULL DEFAULT '[]', -- [{ "name": "...", "lat": 0.0, "lng": 0.0 }, ...]
    is_active  BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- TAPTRACE DEVICES  (was: Reader_Device)
-- ============================================================
CREATE TABLE IF NOT EXISTS taptrace_devices (
    device_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id        UUID REFERENCES vehicles(vehicle_id),
    sim_number        VARCHAR(20),
    firmware_version  VARCHAR(20),
    last_seen         TIMESTAMPTZ
);

-- ============================================================
-- TRIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
    trip_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id  UUID NOT NULL REFERENCES vehicles(vehicle_id),
    driver_id   UUID NOT NULL REFERENCES users(user_id),
    route_id    UUID REFERENCES routes(route_id),
    device_id    UUID REFERENCES taptrace_devices(device_id),
    start_time  TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time    TIMESTAMPTZ,
    status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);
CREATE INDEX idx_trips_status ON trips(status);

-- ============================================================
-- LOCATION UPDATES
-- ============================================================
CREATE TABLE IF NOT EXISTS location_updates (
    update_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id     UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    latitude    DECIMAL(10,8) NOT NULL,
    longitude   DECIMAL(11,8) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_location_updates_trip ON location_updates(trip_id);

-- ============================================================
-- TRANSIT WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS transit_wallets (
    wallet_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    balance_credits INTEGER NOT NULL DEFAULT 0,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CREDIT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id      UUID NOT NULL REFERENCES transit_wallets(wallet_id) ON DELETE CASCADE,
    amount         INTEGER NOT NULL, -- positive = credit added, negative = deduction
    type           VARCHAR(30) NOT NULL CHECK (type IN ('topup_app', 'topup_cash', 'boarding_deduction', 'redemption')),
    reference      VARCHAR(100),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- BOARDING EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS boarding_events (
    event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id       UUID NOT NULL REFERENCES trips(trip_id),
    student_id    UUID NOT NULL REFERENCES users(user_id),
    credential_id UUID NOT NULL REFERENCES nfc_credentials(credential_id),
    boarded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    alighted_at   TIMESTAMPTZ, -- NULL while aboard; set on tap-out, or for everyone still aboard when the trip ends
    latitude      DECIMAL(10,8),
    longitude     DECIMAL(11,8)
);
CREATE INDEX idx_boarding_events_student ON boarding_events(student_id);
CREATE INDEX idx_boarding_events_trip ON boarding_events(trip_id);

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID NOT NULL REFERENCES users(user_id),
    trip_id      UUID REFERENCES trips(trip_id),
    description  TEXT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Two things can reach these tables:
--   1. This backend (Express + raw pg), connecting via DATABASE_URL as the
--      `postgres` role. That role carries BYPASSRLS in Supabase, so every
--      policy (or lack of one) below is invisible to it - authorization for
--      this app is enforced entirely in Express (JWT + role middleware, see
--      backend/src/shared/middlewares/auth.middleware.ts), not in the DB.
--   2. Supabase's auto-generated PostgREST API, which exposes every table in
--      the `public` schema over HTTP to anyone holding the project's public
--      `anon` key - unless RLS is enabled. This app never uses that API, so
--      it has no reason to be reachable.
-- RLS is enabled below with NO policies attached. In Postgres that's a
-- default-deny: any role actually subject to RLS (anon, authenticated) gets
-- zero rows and zero writes, with no extra "reject" policy needed. If
-- Supabase Auth-based client access is ever added later, write narrow
-- policies for exactly what that feature needs at that point.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE taptrace_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MIGRATION (added 2026-07): guest complaints + Paystack app top-up
-- ============================================================
-- Idempotent (safe to re-run), matching the convention used in
-- website/supabase/schema.sql. Run this against the live Supabase instance
-- once — the new wallet/complaints queries below will 500 until it's applied.

-- 1) Complaints: allow submission with no MovIO account (website, no login).
ALTER TABLE complaints ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'complaint';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'complaints' AND constraint_name = 'complaints_category_check'
    ) THEN
        ALTER TABLE complaints ADD CONSTRAINT complaints_category_check
            CHECK (category IN ('complaint', 'account_deletion'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'complaints' AND constraint_name = 'complaints_identity_check'
    ) THEN
        -- Every complaint must be traceable to someone: a logged-in student
        -- (mobile app) OR a contact email/phone (guest, website).
        ALTER TABLE complaints ADD CONSTRAINT complaints_identity_check
            CHECK (student_id IS NOT NULL OR contact_email IS NOT NULL OR contact_phone IS NOT NULL);
    END IF;
END $$;

-- 2) Paystack app top-up idempotency: `type = 'topup_app'` already fits the
--    existing credit_transactions.type CHECK constraint - no column changes
--    needed. This partial unique index stops a repeated verify call (page
--    refresh, retry) from crediting the same payment twice.
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_topup_app_reference_idx
    ON credit_transactions (reference) WHERE type = 'topup_app';
