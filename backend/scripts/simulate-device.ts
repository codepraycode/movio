/**
 * simulate-device.ts
 *
 * Full stand-in for a physical TapTrace unit (ESP32 + PN532 + GPS - not yet
 * built, blocked on parts ordering per AGENTS.md). Lets you pick (or auto-
 * pick) a trip and its configuration, then continuously posts GPS updates
 * and boarding taps against the real REST API - the same endpoints the real
 * device will call over MQTT once HW-4 exists. That matters because it's
 * what makes the admin dashboard's *live* features (Fleet Map's Socket.io
 * subscription, Trip Monitoring's count/capacity) provable today, not just
 * the REST responses.
 *
 * Note on "mobile": the mobile app has no real screens built yet (still a
 * placeholder shell per AGENTS.md) - this doesn't drive a mobile UI. It
 * makes the backend data realistic and live for whichever client reads it -
 * the dashboard today, mobile once it exists - since both read the same
 * endpoints.
 *
 * Interactive by default: prompts you through picking an existing active
 * trip to attach to (or starting a new one - vehicle/route/driver), then how
 * many passengers and how long to run. Every choice can also be given as a
 * flag to skip its prompt, or pass --yes to skip all prompts and auto-pick
 * anything not given. No new dependency for any of this - colors are
 * `node:util`'s built-in `styleText` (auto-disables when not a TTY, e.g. when
 * piped to a log file) and prompts are `node:readline/promises`.
 *
 * Usage:
 *   yarn simulate:device [flags]
 *
 * Flags:
 *   --trip <id>            Attach to this exact trip (skips vehicle/route/driver selection)
 *   --vehicle <plate>      Vehicle to use when starting a new trip
 *   --route <name>         Route to use when starting a new trip ("none" to skip)
 *   --driver <id>          Driver to use when starting a new trip
 *   --passengers <n>       How many simulated students board (default 3)
 *   --duration <seconds>   Auto-stop after N seconds (default: run until Ctrl+C)
 *   --yes                  Skip all prompts - auto-pick anything not given via flags
 *   --help                 Show this help
 *
 * Examples:
 *   yarn simulate:device                                    interactive - pick everything from a menu
 *   yarn simulate:device --yes                               fully automatic, 3 passengers, unlimited
 *   yarn simulate:device --yes --passengers 5 --duration 60
 *   yarn simulate:device --trip 7699ade5-...                 attach straight to a known trip, still prompts for passengers/duration
 *
 * Ctrl+C (or the duration elapsing) always ends the trip cleanly before
 * exiting - no dangling active trip left behind, the same problem
 * `manage-trips.ts end-all` exists to clean up after. Ending a trip is
 * normally a driver action, not something a real TapTrace device does -
 * this script does it anyway purely as a simulator convenience.
 */

import * as readline from 'node:readline/promises';
import { styleText } from 'node:util';
import { pool } from '../src/config/db';
import * as tripsModel from '../src/features/trips/trips.model';
import * as vehiclesModel from '../src/features/vehicles/vehicles.model';
import * as routesModel from '../src/features/routes/routes.model';
import * as usersModel from '../src/features/users/users.model';
import type { VehicleWithDriver } from '../src/features/vehicles/vehicles.types';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';
const SIM_PASSWORD = 'sim-password-123';
const TOPUP_AMOUNT = 5;
const GPS_INTERVAL_MS = 5_000; // matches the real device's cadence, Ch.3 §3.4.4
const TAP_INTERVAL_MS = 8_000;

// ---- colors (node:util.styleText - no dependency, auto-disables on non-TTY output) ----
const c = {
    title: (s: string) => styleText(['bold', 'cyan'], s),
    heading: (s: string) => styleText('bold', s),
    ok: (s: string) => styleText('green', s),
    err: (s: string) => styleText('red', s),
    warn: (s: string) => styleText('yellow', s),
    dim: (s: string) => styleText('dim', s),
    key: (s: string) => styleText('cyan', s),
};

// ---- flags ----
function flag(name: string): string | undefined {
    const i = process.argv.indexOf(`--${name}`);
    return i === -1 ? undefined : process.argv[i + 1];
}
function hasFlag(name: string): boolean {
    return process.argv.includes(`--${name}`);
}

function printUsage(): void {
    console.log(`${c.title('MovIO TapTrace Simulator')} - a full stand-in for the physical device.

${c.heading('Usage')}
  yarn simulate:device [flags]

${c.heading('Flags')}
  --trip <id>            Attach to this exact trip (skips vehicle/route/driver selection)
  --vehicle <plate>      Vehicle to use when starting a new trip
  --route <name>         Route to use when starting a new trip ("none" to skip)
  --driver <id>          Driver to use when starting a new trip
  --passengers <n>       How many simulated students board (default 3)
  --duration <seconds>   Auto-stop after N seconds (default: run until Ctrl+C)
  --yes                  Skip all prompts - auto-pick anything not given via flags
  --help                 Show this help

${c.heading('Examples')}
  yarn simulate:device
  yarn simulate:device --yes
  yarn simulate:device --yes --passengers 5 --duration 60
  yarn simulate:device --trip 7699ade5-...
`);
}

if (hasFlag('help')) {
    printUsage();
    process.exit(0);
}

const nonInteractive = hasFlag('yes');
const flags = {
    trip: flag('trip'),
    vehicle: flag('vehicle'),
    route: flag('route'),
    driver: flag('driver'),
    passengers: flag('passengers'),
    duration: flag('duration'),
};

// ---- interactive prompts ----
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function selectFrom<T>(
    label: string,
    items: T[],
    render: (item: T) => string,
    options: { allowSkip?: boolean; skipLabel?: string } = {}
): Promise<T | null> {
    console.log(`\n${c.heading(label)}`);
    items.forEach((item, i) => console.log(`  ${c.key(String(i + 1))}) ${render(item)}`));
    if (options.allowSkip) console.log(`  ${c.key('0')}) ${options.skipLabel ?? 'None / skip'}`);

    const answer = (await rl.question(c.dim('Select a number: '))).trim();
    const idx = Number(answer);
    if (options.allowSkip && idx === 0) return null;
    if (!Number.isInteger(idx) || idx < 1 || idx > items.length) {
        console.log(c.err('Invalid selection, try again.'));
        return selectFrom(label, items, render, options);
    }
    return items[idx - 1];
}

async function promptNumber(label: string, defaultValue: number): Promise<number> {
    const answer = (await rl.question(c.dim(`${label} [${defaultValue}]: `))).trim();
    if (!answer) return defaultValue;
    const n = Number(answer);
    if (!Number.isInteger(n) || n < 0) {
        console.log(c.err('Enter a whole number ≥ 0.'));
        return promptNumber(label, defaultValue);
    }
    return n;
}

async function promptOptionalNumber(label: string): Promise<number | undefined> {
    const answer = (await rl.question(c.dim(`${label} [unlimited]: `))).trim();
    if (!answer) return undefined;
    const n = Number(answer);
    if (!Number.isInteger(n) || n <= 0) {
        console.log(c.err('Enter a positive whole number, or leave blank for unlimited.'));
        return promptOptionalNumber(label);
    }
    return n;
}

// ---- HTTP helpers (real API calls - same endpoints the real device/mobile will use) ----
interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}
interface AuthResult {
    user: { user_id: string };
    token: string;
}

async function postJson<T>(
    path: string,
    body: object,
    token?: string
): Promise<{ status: number; data: ApiEnvelope<T> }> {
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

async function ensureUser(email: string, firstName: string, lastName: string, role: string): Promise<AuthResult> {
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

async function ensureCredential(userId: string, uid: string): Promise<void> {
    const existing = await pool.query('SELECT credential_id FROM nfc_credentials WHERE nfc_uid = $1', [uid]);
    if (existing.rows.length > 0) return;
    await pool.query(
        `INSERT INTO nfc_credentials (user_id, nfc_uid, credential_type) VALUES ($1, $2, 'mifare_card')`,
        [userId, uid]
    );
}

function jitter(value: number, amount: number): number {
    return value + (Math.random() - 0.5) * amount;
}

// ---- trip/vehicle/route/driver resolution ----
async function resolveDriver(): Promise<string> {
    if (flags.driver) return flags.driver;

    const drivers = await usersModel.listUsersByRole('driver');
    if (drivers.length === 0) {
        console.log(c.warn('No drivers exist yet - creating one (sim-driver@movio.test)'));
        const driver = await ensureUser('sim-driver@movio.test', 'Sim', 'Driver', 'driver');
        return driver.user.user_id;
    }
    if (nonInteractive) {
        console.log(c.dim(`Using driver: ${drivers[0].first_name} ${drivers[0].last_name}`));
        return drivers[0].user_id;
    }
    const chosen = await selectFrom('Choose a driver', drivers, (d) => `${d.first_name} ${d.last_name} ${c.dim(d.email)}`);
    return chosen!.user_id;
}

async function resolveVehicleAndRoute(): Promise<{ vehicleId: string; plate: string; routeId: string | null }> {
    const vehicles = await vehiclesModel.listVehiclesWithDriver();
    const activeVehicles = vehicles.filter((v) => v.is_active);
    if (activeVehicles.length === 0) {
        throw new Error('No active vehicles exist. Create one first (dashboard Vehicles page).');
    }

    let vehicle: VehicleWithDriver;
    if (flags.vehicle) {
        const found = activeVehicles.find((v) => v.plate_number === flags.vehicle || v.vehicle_id === flags.vehicle);
        if (!found) throw new Error(`No active vehicle matches "${flags.vehicle}".`);
        vehicle = found;
    } else if (nonInteractive) {
        vehicle = activeVehicles[0];
        console.log(c.dim(`Using vehicle: ${vehicle.plate_number}`));
    } else {
        vehicle = (await selectFrom(
            'Choose a vehicle',
            activeVehicles,
            (v) => `${v.plate_number} ${c.dim(`(${v.vehicle_type}, capacity ${v.capacity})`)}`
        ))!;
    }

    const routes = await routesModel.listRoutes();
    const activeRoutes = routes.filter((r) => r.is_active);

    let routeId: string | null = null;
    if (flags.route === 'none') {
        routeId = null;
    } else if (flags.route) {
        const found = activeRoutes.find((r) => r.route_name === flags.route || r.route_id === flags.route);
        if (!found) throw new Error(`No active route matches "${flags.route}".`);
        routeId = found.route_id;
    } else if (nonInteractive) {
        routeId = activeRoutes[0]?.route_id ?? null;
        if (routeId) console.log(c.dim(`Using route: ${activeRoutes[0].route_name}`));
    } else if (activeRoutes.length > 0) {
        const chosen = await selectFrom(
            'Choose a route',
            activeRoutes,
            (r) => `${r.route_name} ${c.dim(`(${r.stops.length} stops)`)}`,
            { allowSkip: true, skipLabel: 'No route' }
        );
        routeId = chosen?.route_id ?? null;
    }

    return { vehicleId: vehicle.vehicle_id, plate: vehicle.plate_number, routeId };
}

async function chooseTrip(): Promise<{ tripId: string; plate: string }> {
    if (flags.trip) {
        const trip = await tripsModel.findTripById(flags.trip);
        if (!trip) throw new Error(`No trip found with id ${flags.trip}`);
        const vehicles = await vehiclesModel.listVehiclesWithDriver();
        const plate = vehicles.find((v) => v.vehicle_id === trip.vehicle_id)?.plate_number ?? trip.vehicle_id;
        return { tripId: trip.trip_id, plate };
    }

    const trips = await tripsModel.listTripsWithPassengerCounts();
    const activeTrips = trips.filter((t) => t.status === 'active');

    if (activeTrips.length > 0) {
        if (nonInteractive) {
            console.log(c.dim(`Attaching to already-active trip ${activeTrips[0].trip_id} on ${activeTrips[0].plate_number}.`));
            return { tripId: activeTrips[0].trip_id, plate: activeTrips[0].plate_number };
        }
        const choice = await selectFrom(
            'Active trips found',
            activeTrips,
            (t) =>
                `${t.plate_number} on ${t.route_name ?? 'no route'} ${c.dim(`(${t.passenger_count}/${t.capacity} aboard, driver ${t.driver_first_name})`)}`,
            { allowSkip: true, skipLabel: 'Start a new trip instead' }
        );
        if (choice) return { tripId: choice.trip_id, plate: choice.plate_number };
    }

    const driverId = await resolveDriver();
    const { vehicleId, plate, routeId } = await resolveVehicleAndRoute();

    // The chosen vehicle might already have an active trip (picked explicitly
    // via --vehicle, or a fresh trip started elsewhere since the list above
    // was fetched) - reuse it rather than erroring, same as manage-trips.ts.
    const already = await tripsModel.findActiveTripByVehicle(vehicleId);
    if (already) {
        console.log(c.dim(`${plate} already has an active trip - attaching to it.`));
        return { tripId: already.trip_id, plate };
    }

    const trip = await tripsModel.insertTrip(driverId, vehicleId, routeId, null);
    console.log(c.ok(`Started trip ${trip.trip_id} on ${plate}.`));
    return { tripId: trip.trip_id, plate };
}

async function setupPassengers(count: number): Promise<{ uid: string }[]> {
    if (count === 0) return [];
    console.log(c.dim(`Setting up ${count} simulated passenger(s)...`));
    const personnel = await ensureUser('sim-personnel@movio.test', 'Sim', 'Personnel', 'transport_personnel');

    const passengers: { uid: string }[] = [];
    for (let i = 1; i <= count; i++) {
        const email = `sim-student-${i}@movio.test`;
        const uid = `04SIMTAP${String(i).padStart(2, '0')}`;

        const student = await ensureUser(email, `Sim Student ${i}`, 'Passenger', 'student');
        await ensureCredential(student.user.user_id, uid);

        const topup = await postJson(
            '/wallet/topup-cash',
            { user_id: student.user.user_id, amount: TOPUP_AMOUNT },
            personnel.token
        );
        if (topup.status !== 200) {
            throw new Error(`Could not top up ${email}: ${JSON.stringify(topup.data)}`);
        }

        passengers.push({ uid });
    }
    return passengers;
}

async function main(): Promise<void> {
    console.log(c.title('\nMovIO TapTrace Simulator\n'));

    const { tripId, plate } = await chooseTrip();

    const passengerCount =
        flags.passengers !== undefined
            ? Number(flags.passengers)
            : nonInteractive
              ? 3
              : await promptNumber('How many passengers should board?', 3);

    const durationSeconds =
        flags.duration !== undefined
            ? Number(flags.duration)
            : nonInteractive
              ? undefined
              : await promptOptionalNumber('Auto-stop after how many seconds? (blank = run until Ctrl+C)');

    rl.close();

    const passengers = await setupPassengers(passengerCount);

    console.log(`\n${c.title('─── Simulating ───')}`);
    console.log(`  Trip:        ${c.key(tripId)} ${c.dim(`(${plate})`)}`);
    console.log(`  Passengers:  ${passengers.length}`);
    console.log(`  Duration:    ${durationSeconds ? `${durationSeconds}s` : 'until Ctrl+C'}`);
    console.log(c.dim(`  GPS every ${GPS_INTERVAL_MS / 1000}s, taps every ${TAP_INTERVAL_MS / 1000}s\n`));

    let lat = 7.3006;
    let lng = 5.1367;
    let ended = false;

    const gpsTimer: ReturnType<typeof setInterval> = setInterval(() => {
        lat = jitter(lat, 0.0006);
        lng = jitter(lng, 0.0006);
        void postJson('/tracking/update', { trip_id: tripId, latitude: lat, longitude: lng }).then(({ status }) => {
            const badge = status === 201 ? c.ok(String(status)) : c.err(String(status));
            console.log(`${c.dim('[gps]')} ${badge} (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        });
    }, GPS_INTERVAL_MS);

    let tapIndex = 0;
    const tapTimer: ReturnType<typeof setInterval> = setInterval(() => {
        if (tapIndex >= passengers.length) {
            clearInterval(tapTimer);
            return;
        }
        const { uid } = passengers[tapIndex++];
        void postJson<{ success: boolean; reason?: string; student_name?: string }>('/boarding/authenticate', {
            uid,
            trip_id: tripId,
            latitude: lat,
            longitude: lng,
        }).then(({ data }) => {
            const tag = c.dim(`[tap ${tapIndex}/${passengers.length}]`);
            if (data.data?.success) {
                console.log(`${tag} ${c.ok('boarded')} ${data.data.student_name ?? uid}`);
            } else {
                console.log(`${tag} ${c.err('failed')} uid=${uid} ${data.data?.reason ?? JSON.stringify(data)}`);
            }
        });
    }, TAP_INTERVAL_MS);

    async function endAndExit(): Promise<void> {
        if (ended) return;
        ended = true;
        clearInterval(gpsTimer);
        clearInterval(tapTimer);

        const trip = await tripsModel.findTripById(tripId);
        if (trip && trip.status === 'active') {
            await tripsModel.endTrip(tripId);
            console.log(c.ok(`\nTrip ${tripId} ended.`));
        }
        await pool.end();
        process.exit(0);
    }

    process.on('SIGINT', () => void endAndExit());
    process.on('SIGTERM', () => void endAndExit());

    if (durationSeconds) {
        setTimeout(() => void endAndExit(), durationSeconds * 1000);
    }
}

void main().catch((err) => {
    console.error(c.err(String(err instanceof Error ? err.message : err)));
    rl.close();
    process.exit(1);
});
