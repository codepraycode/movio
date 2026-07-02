/**
 * simulate-tap.ts
 *
 * Simulates one or more students tapping into an already-active trip, so
 * Trip Monitoring's passenger count (shown as `count/capacity`) can be
 * demoed ticking up independently of GPS movement. Run this alongside
 * `yarn simulate <trip_id>` (simulate-taptrace.ts) if you want both the
 * marker moving and passengers boarding at once - they're separate
 * concerns and don't need to run in the same process.
 *
 * Ensures the requested number of simulated student identities exist first
 * (registers a user + links an NFC credential + tops up their wallet the
 * first time it sees them; reuses the same deterministic email/uid on every
 * later run, so re-running this is safe), then taps each one into the given
 * trip, spaced `interval_ms` apart so the count visibly climbs rather than
 * jumping all at once.
 *
 * Usage (backend must be running, trip must already exist via `yarn trips:start`
 * or POST /api/v1/trips/start):
 *   yarn simulate:tap <trip_id> <passenger_count> [interval_ms=3000]
 *
 * Example:
 *   yarn simulate:tap 7699ade5-... 3
 */

import { pool } from '../src/config/db';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';
const SIM_PASSWORD = 'sim-password-123';
const TOPUP_AMOUNT = 5; // credits - enough for one tap, topped up fresh each run so re-runs never fail on balance

const tripId = process.argv[2];
const passengerCount = Number(process.argv[3]);
const intervalMs = process.argv[4] ? Number(process.argv[4]) : 3000;

if (!tripId || !Number.isInteger(passengerCount) || passengerCount < 1) {
    console.error('Usage: yarn simulate:tap <trip_id> <passenger_count> [interval_ms=3000]');
    process.exit(1);
}

interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface AuthResult {
    user: { user_id: string };
    token: string;
}

async function postJson<T>(path: string, body: object, token?: string): Promise<{ status: number; data: ApiEnvelope<T> }> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
    return { status: res.status, data };
}

// Registers a user on first run; every later run hits the same email and just
// logs in instead (register 409s on a duplicate email - that's expected, not
// an error here).
async function ensureUser(
    email: string,
    firstName: string,
    lastName: string,
    role: string
): Promise<AuthResult> {
    const register = await postJson<AuthResult>('/auth/register', {
        email,
        password: SIM_PASSWORD,
        first_name: firstName,
        last_name: lastName,
        role,
    });
    if (register.status === 201) return register.data.data;

    const login = await postJson<AuthResult>('/auth/login', { email, password: SIM_PASSWORD });
    if (login.status !== 200) {
        throw new Error(`Could not register or log in ${email}: ${JSON.stringify(login.data)}`);
    }
    return login.data.data;
}

// No REST endpoint registers NFC cards (documented in db/seed.sql as a
// direct-SQL step) - insert straight into the DB the same way, but only if
// this uid isn't already linked to someone.
async function ensureCredential(userId: string, uid: string): Promise<void> {
    const existing = await pool.query('SELECT credential_id FROM nfc_credentials WHERE nfc_uid = $1', [uid]);
    if (existing.rows.length > 0) return;
    await pool.query(
        `INSERT INTO nfc_credentials (user_id, nfc_uid, credential_type) VALUES ($1, $2, 'mifare_card')`,
        [userId, uid]
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
    console.log(`Setting up ${passengerCount} simulated passenger(s)...`);

    const personnel = await ensureUser('sim-personnel@movio.test', 'Sim', 'Personnel', 'transport_personnel');

    const passengers: { uid: string; userId: string }[] = [];
    for (let i = 1; i <= passengerCount; i++) {
        const email = `sim-student-${i}@movio.test`;
        const uid = `04SIMTAP${String(i).padStart(2, '0')}`;

        const student = await ensureUser(email, `Sim Student ${i}`, 'Passenger', 'student');
        await ensureCredential(student.user.user_id, uid);

        const topup = await postJson('/wallet/topup-cash', { user_id: student.user.user_id, amount: TOPUP_AMOUNT }, personnel.token);
        if (topup.status !== 200) {
            throw new Error(`Could not top up ${email}: ${JSON.stringify(topup.data)}`);
        }

        passengers.push({ uid, userId: student.user.user_id });
    }

    console.log(`Tapping ${passengerCount} passenger(s) into trip ${tripId}, ${intervalMs}ms apart...`);

    for (let i = 0; i < passengers.length; i++) {
        if (i > 0) await sleep(intervalMs);
        const { uid } = passengers[i];
        const { status, data } = await postJson('/boarding/authenticate', { uid, trip_id: tripId });
        console.log(`[tap ${i + 1}/${passengers.length}] uid=${uid} ${status}`, data);
    }

    await pool.end();
}

void run();
