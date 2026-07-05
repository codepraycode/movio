/**
 * simulate-device.ts
 *
 * Full stand-in for a physical TapTrace unit (ESP32 + PN532 + GPS - not yet
 * built, blocked on parts ordering per AGENTS.md). Everything that changes
 * state goes through the real REST API - the same endpoints the real device
 * (and the driver app) will use - so every Socket.io broadcast the backend
 * makes (`trip:started`, `location:update`, `trip:passengers`, `trip:ended`)
 * actually fires and live clients (mobile map, dashboard Fleet Map) update
 * instantly. Direct DB access is kept only for read-only listings and for
 * seeding NFC credentials, which have no REST endpoint on purpose.
 *
 * What it does:
 *   - starts a trip (or attaches to an already-active one) and ends it cleanly
 *   - streams GPS every 5s, driving along the trip's real route stops when the
 *     route has coordinates (falls back to a random walk near FUTA otherwise)
 *   - taps students in and out ON DEMAND: while the trip runs you get a live
 *     console - press a student's number to tap them (the backend decides
 *     whether that tap is a tap-in or a tap-out), add students, check status,
 *     end the trip - all without restarting the script
 *   - --auto replaces the live console with hands-free behaviour (tap-ins
 *     staggered, tap-outs after a ride interval) for unattended demos
 *
 * Usage:
 *   yarn simulate:device [flags]
 *
 * Flags:
 *   --trip <id>            Attach to this exact trip (skips vehicle/route selection)
 *   --vehicle <plate|id>   Vehicle to use when starting a new trip
 *   --route <name|id>      Route to use when starting a new trip ("none" to skip)
 *   --passengers <n>       How many simulated students to prepare (default 3)
 *   --auto                 Hands-free: auto tap-in, ride, auto tap-out (no live console)
 *   --duration <seconds>   Auto-stop after N seconds (default: run until you end it)
 *   --yes                  Skip setup prompts - auto-pick anything not given via flags
 *   --help                 Show this help
 *
 * Trips this script starts belong to its own "Sim Driver" account (registered
 * through the real /auth/register), because /trips/start needs a driver JWT
 * and we don't know real drivers' passwords. If you attach to a trip some
 * other driver started, ending it falls back to a direct DB update (the
 * driver-ownership rule is real and stays enforced in the API) - that path
 * can't fire the `trip:ended` broadcast, so live clients reconcile on their
 * next roster poll instead. The script tells you when that happens.
 */

import * as readline from 'node:readline/promises';
import { styleText } from 'node:util';
import { pool } from '../src/config/db';
import * as tripsModel from '../src/features/trips/trips.model';
import * as vehiclesModel from '../src/features/vehicles/vehicles.model';
import * as routesModel from '../src/features/routes/routes.model';
import type { VehicleWithDriver } from '../src/features/vehicles/vehicles.types';
import type { RouteStop } from '../src/types';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';
const SIM_PASSWORD = 'sim-password-123';
const TOPUP_AMOUNT = 5;
const GPS_INTERVAL_MS = 5_000; // matches the real device's cadence, Ch.3 §3.4.4
const SPEED_KMH = 22; // simulated shuttle speed along the route
const AUTO_TAP_INTERVAL_MS = 8_000; // --auto: gap between tap-ins
const AUTO_RIDE_MS = 40_000; // --auto: how long each passenger rides before tap-out

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
  --trip <id>            Attach to this exact trip (skips vehicle/route selection)
  --vehicle <plate|id>   Vehicle to use when starting a new trip
  --route <name|id>      Route to use when starting a new trip ("none" to skip)
  --passengers <n>       How many simulated students to prepare (default 3)
  --auto                 Hands-free: auto tap-in, ride, auto tap-out (no live console)
  --duration <seconds>   Auto-stop after N seconds
  --yes                  Skip setup prompts - auto-pick anything not given via flags
  --help                 Show this help

${c.heading('Live console (default mode)')}
  1..n   tap that student - backend decides tap-in vs tap-out
  a      add one more simulated student
  s      status: who's aboard, last GPS position, ping count
  e      end the trip and exit
  d      detach - exit but leave the trip running
  h      help

${c.heading('Examples')}
  yarn simulate:device                       guided setup, then live console
  yarn simulate:device --yes                 auto-pick everything, live console
  yarn simulate:device --auto --duration 90  unattended demo run
`);
}

if (hasFlag('help')) {
    printUsage();
    process.exit(0);
}

const nonInteractive = hasFlag('yes') || hasFlag('auto');
const autoMode = hasFlag('auto');
const flags = {
    trip: flag('trip'),
    vehicle: flag('vehicle'),
    route: flag('route'),
    passengers: flag('passengers'),
    duration: flag('duration'),
};

// ---- interactive prompts (setup phase) ----
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

// ---- HTTP helpers (real API calls - same endpoints the real device will use) ----
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

// ---- passengers ----
interface Passenger {
    n: number;
    name: string;
    uid: string;
    aboard: boolean;
}

let personnelToken: string | undefined;

async function setupPassenger(n: number): Promise<Passenger> {
    if (!personnelToken) {
        personnelToken = (await ensureUser('sim-personnel@movio.test', 'Sim', 'Personnel', 'transport_personnel'))
            .token;
    }
    const email = `sim-student-${n}@movio.test`;
    const uid = `04SIMTAP${String(n).padStart(2, '0')}`;

    const student = await ensureUser(email, `Sim Student ${n}`, 'Passenger', 'student');
    await ensureCredential(student.user.user_id, uid);

    const topup = await postJson(
        '/wallet/topup-cash',
        { user_id: student.user.user_id, amount: TOPUP_AMOUNT },
        personnelToken
    );
    if (topup.status !== 200) {
        throw new Error(`Could not top up ${email}: ${JSON.stringify(topup.data)}`);
    }
    return { n, name: `Sim Student ${n}`, uid, aboard: false };
}

async function setupPassengers(count: number): Promise<Passenger[]> {
    if (count === 0) return [];
    console.log(c.dim(`Setting up ${count} simulated passenger(s) (accounts, NFC cards, wallet top-ups)...`));
    const passengers: Passenger[] = [];
    for (let i = 1; i <= count; i++) passengers.push(await setupPassenger(i));
    return passengers;
}

// ---- GPS path: drive along the route's real stops when it has them ----
interface GeoPoint {
    lat: number;
    lng: number;
}

function haversineKm(a: GeoPoint, b: GeoPoint): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Walks back and forth along an ordered list of stops at ~SPEED_KMH, with a
 * touch of jitter so pings look like real GPS. With no usable stops it random-
 * walks near the FUTA campus instead.
 */
class PathDriver {
    private points: GeoPoint[];
    private segment = 0; // travelling points[segment] -> points[segment + direction]
    private progressKm = 0;
    private direction = 1; // 1 = forwards through the stops, -1 = back
    private fallback: GeoPoint = { lat: 7.3006, lng: 5.1367 };
    readonly followingRoute: boolean;

    constructor(stops: RouteStop[]) {
        this.points = stops
            .filter((s) => Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)))
            .map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
        this.followingRoute = this.points.length >= 2;
    }

    /** Advance by one GPS interval's worth of travel and return the new position. */
    next(): GeoPoint {
        if (!this.followingRoute) {
            this.fallback = {
                lat: this.fallback.lat + (Math.random() - 0.5) * 0.0012,
                lng: this.fallback.lng + (Math.random() - 0.5) * 0.0012,
            };
            return this.fallback;
        }

        let stepKm = (SPEED_KMH / 3600) * (GPS_INTERVAL_MS / 1000);
        while (stepKm > 0) {
            const from = this.points[this.segment];
            const to = this.points[this.segment + this.direction];
            const segKm = Math.max(haversineKm(from, to), 1e-6);
            const remaining = segKm - this.progressKm;
            if (stepKm < remaining) {
                this.progressKm += stepKm;
                stepKm = 0;
            } else {
                stepKm -= remaining;
                this.segment += this.direction;
                this.progressKm = 0;
                // Reached either end of the route - turn around.
                if (this.segment === this.points.length - 1 || this.segment === 0) {
                    this.direction *= -1;
                }
            }
        }

        const from = this.points[this.segment];
        const to = this.points[this.segment + this.direction];
        const segKm = Math.max(haversineKm(from, to), 1e-6);
        const t = this.progressKm / segKm;
        return {
            lat: from.lat + (to.lat - from.lat) * t + (Math.random() - 0.5) * 0.00008,
            lng: from.lng + (to.lng - from.lng) * t + (Math.random() - 0.5) * 0.00008,
        };
    }
}

// ---- trip resolution (start/end go through the REAL API so broadcasts fire) ----
interface TripHandle {
    tripId: string;
    plate: string;
    routeStops: RouteStop[];
    /** Set when this script's own Sim Driver owns the trip - lets us end it via REST. */
    driverToken?: string;
}

async function routeStopsById(routeId: string | null): Promise<RouteStop[]> {
    if (!routeId) return [];
    const routes = await routesModel.listRoutes();
    return routes.find((r) => r.route_id === routeId)?.stops ?? [];
}

async function startTripViaApi(vehicleId: string, plate: string, routeId: string | null): Promise<TripHandle> {
    const driver = await ensureUser('sim-driver@movio.test', 'Sim', 'Driver', 'driver');
    const started = await postJson<{ trip_id: string }>(
        '/trips/start',
        routeId ? { vehicle_id: vehicleId, route_id: routeId } : { vehicle_id: vehicleId },
        driver.token
    );
    if (started.status !== 201) {
        throw new Error(`Could not start trip: ${JSON.stringify(started.data)}`);
    }
    console.log(
        c.ok(`Started trip ${started.data.data.trip_id} on ${plate} (via REST - trip:started broadcast fired).`)
    );
    return {
        tripId: started.data.data.trip_id,
        plate,
        routeStops: await routeStopsById(routeId),
        driverToken: driver.token,
    };
}

async function attachToTrip(tripId: string, plate: string, routeId: string | null): Promise<TripHandle> {
    // If Sim Driver owns this trip (e.g. a previous run detached from it), we
    // can still end it over REST; otherwise ending falls back to direct DB.
    const trip = await tripsModel.findTripById(tripId);
    let driverToken: string | undefined;
    if (trip) {
        const driver = await ensureUser('sim-driver@movio.test', 'Sim', 'Driver', 'driver');
        if (trip.driver_id === driver.user.user_id) driverToken = driver.token;
    }
    return { tripId, plate, routeStops: await routeStopsById(routeId), driverToken };
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

async function chooseTrip(): Promise<TripHandle> {
    if (flags.trip) {
        const trip = await tripsModel.findTripById(flags.trip);
        if (!trip) throw new Error(`No trip found with id ${flags.trip}`);
        if (trip.status !== 'active') throw new Error(`Trip ${flags.trip} is not active (${trip.status}).`);
        const vehicles = await vehiclesModel.listVehiclesWithDriver();
        const plate = vehicles.find((v) => v.vehicle_id === trip.vehicle_id)?.plate_number ?? trip.vehicle_id;
        return attachToTrip(trip.trip_id, plate, trip.route_id);
    }

    const trips = await tripsModel.listTripsWithPassengerCounts();
    const activeTrips = trips.filter((t) => t.status === 'active');

    if (activeTrips.length > 0 && !flags.vehicle) {
        if (nonInteractive) {
            const t = activeTrips[0];
            console.log(c.dim(`Attaching to already-active trip ${t.trip_id} on ${t.plate_number}.`));
            const full = await tripsModel.findTripById(t.trip_id);
            return attachToTrip(t.trip_id, t.plate_number, full?.route_id ?? null);
        }
        const choice = await selectFrom(
            'Active trips found',
            activeTrips,
            (t) =>
                `${t.plate_number} on ${t.route_name ?? 'no route'} ${c.dim(`(${t.passenger_count}/${t.capacity} aboard, driver ${t.driver_first_name})`)}`,
            { allowSkip: true, skipLabel: 'Start a new trip instead' }
        );
        if (choice) {
            const full = await tripsModel.findTripById(choice.trip_id);
            return attachToTrip(choice.trip_id, choice.plate_number, full?.route_id ?? null);
        }
    }

    const { vehicleId, plate, routeId } = await resolveVehicleAndRoute();

    // The chosen vehicle might already have an active trip - attach rather than error.
    const already = await tripsModel.findActiveTripByVehicle(vehicleId);
    if (already) {
        console.log(c.dim(`${plate} already has an active trip - attaching to it.`));
        return attachToTrip(already.trip_id, plate, already.route_id);
    }

    return startTripViaApi(vehicleId, plate, routeId);
}

// ---- the tap itself (backend decides tap-in vs tap-out) ----
interface TapResponse {
    success: boolean;
    action?: 'tap_in' | 'tap_out';
    reason?: string;
    student_name?: string;
}

async function tap(passenger: Passenger, tripId: string, pos: GeoPoint): Promise<void> {
    const { data } = await postJson<TapResponse>('/boarding/authenticate', {
        uid: passenger.uid,
        trip_id: tripId,
        latitude: pos.lat,
        longitude: pos.lng,
    });
    const result = data.data;
    if (result?.success && result.action === 'tap_in') {
        passenger.aboard = true;
        console.log(`${c.ok('⇥ tap-in ')} ${passenger.name} ${c.dim('(1 credit deducted)')}`);
    } else if (result?.success && result.action === 'tap_out') {
        passenger.aboard = false;
        console.log(`${c.warn('⇤ tap-out')} ${passenger.name} ${c.dim('(no charge)')}`);
    } else {
        console.log(`${c.err('✗ tap failed')} ${passenger.name}: ${result?.reason ?? JSON.stringify(data)}`);
    }
}

// ---- main ----
async function main(): Promise<void> {
    console.log(c.title('\nMovIO TapTrace Simulator\n'));

    const handle = await chooseTrip();

    const passengerCount =
        flags.passengers !== undefined
            ? Number(flags.passengers)
            : nonInteractive
              ? 3
              : await promptNumber('How many simulated students should be available?', 3);

    const durationSeconds = flags.duration !== undefined ? Number(flags.duration) : undefined;

    const passengers = await setupPassengers(passengerCount);

    console.log(`\n${c.title('─── Simulating ───')}`);
    console.log(`  Trip:       ${c.key(handle.tripId)} ${c.dim(`(${handle.plate})`)}`);
    console.log(`  Students:   ${passengers.length} ${c.dim('ready to tap')}`);
    console.log(
        `  GPS:        every ${GPS_INTERVAL_MS / 1000}s, ${
            handle.routeStops.length >= 2
                ? `driving the route's ${handle.routeStops.length} stops at ~${SPEED_KMH} km/h`
                : 'random walk near campus (route has no usable stops)'
        }`
    );
    console.log(`  Mode:       ${autoMode ? 'auto (hands-free)' : "live console - press h + Enter for help"}`);
    if (durationSeconds) console.log(`  Duration:   ${durationSeconds}s`);
    console.log('');

    const pathDriver = new PathDriver(handle.routeStops);
    let pos = pathDriver.next();
    let pings = 0;
    let gpsFailures = 0;
    let ended = false;

    const gpsTimer = setInterval(() => {
        pos = pathDriver.next();
        void postJson('/tracking/update', { trip_id: handle.tripId, latitude: pos.lat, longitude: pos.lng }).then(
            ({ status }) => {
                if (status === 201) {
                    pings++;
                } else {
                    gpsFailures++;
                    console.log(`${c.err('[gps]')} update rejected with ${status}`);
                }
            },
            () => {
                gpsFailures++;
                console.log(`${c.err('[gps]')} network error posting update`);
            }
        );
    }, GPS_INTERVAL_MS);

    async function endTrip(): Promise<void> {
        if (handle.driverToken) {
            const res = await postJson(`/trips/${handle.tripId}/end`, {}, handle.driverToken);
            if (res.status === 200) {
                console.log(c.ok(`Trip ${handle.tripId} ended via REST - trip:ended broadcast fired.`));
                return;
            }
            console.log(c.warn(`REST end failed (${res.status}) - falling back to direct DB.`));
        } else {
            console.log(
                c.warn(
                    'This trip was started by another driver - ending it directly in the DB (no trip:ended broadcast; live clients reconcile on their next roster poll).'
                )
            );
        }
        const trip = await tripsModel.findTripById(handle.tripId);
        if (trip && trip.status === 'active') {
            await tripsModel.endTrip(handle.tripId);
            console.log(c.ok(`Trip ${handle.tripId} ended.`));
        }
    }

    async function shutdown(opts: { endTheTrip: boolean }): Promise<void> {
        if (ended) return;
        ended = true;
        clearInterval(gpsTimer);
        if (opts.endTheTrip) {
            await endTrip();
        } else {
            console.log(c.dim(`Detached - trip ${handle.tripId} is still active.`));
        }
        rl.close();
        await pool.end();
        process.exit(0);
    }

    process.on('SIGINT', () => void shutdown({ endTheTrip: true }));
    process.on('SIGTERM', () => void shutdown({ endTheTrip: true }));
    if (durationSeconds) setTimeout(() => void shutdown({ endTheTrip: true }), durationSeconds * 1000);

    if (autoMode) {
        // Hands-free: stagger tap-ins, let each passenger ride, then tap them out.
        passengers.forEach((p, i) => {
            setTimeout(() => {
                if (ended) return;
                void tap(p, handle.tripId, pos).then(() => {
                    setTimeout(() => {
                        if (!ended && p.aboard) void tap(p, handle.tripId, pos);
                    }, AUTO_RIDE_MS);
                });
            }, i * AUTO_TAP_INTERVAL_MS);
        });
        return; // runs until --duration elapses or Ctrl+C
    }

    // ---- live console ----
    function printHelp(): void {
        console.log(`${c.heading('Commands')} ${c.dim('(type one, then Enter)')}
  ${c.key(`1..${Math.max(passengers.length, 1)}`)}   tap that student (backend decides tap-in vs tap-out)
  ${c.key('a')}      add one more simulated student
  ${c.key('s')}      status - who's aboard, last GPS position
  ${c.key('e')}      end the trip and exit
  ${c.key('d')}      detach - exit but leave the trip running
  ${c.key('h')}      this help`);
    }

    function printStatus(): void {
        const aboard = passengers.filter((p) => p.aboard);
        console.log(`${c.heading('Status')}
  Trip:      ${handle.tripId} ${c.dim(`(${handle.plate})`)}
  Aboard:    ${aboard.length ? aboard.map((p) => p.name).join(', ') : c.dim('nobody')}
  Position:  ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)} ${c.dim(`(${pings} pings sent${gpsFailures ? `, ${gpsFailures} failed` : ''})`)}`);
        passengers.forEach((p) =>
            console.log(`  ${c.key(String(p.n))}) ${p.name} ${p.aboard ? c.ok('● aboard') : c.dim('○ off')}`)
        );
    }

    printHelp();
    printStatus();

    // GPS keeps ticking in the background; each loop iteration is one command.
    for (;;) {
        let line: string;
        try {
            line = (await rl.question(c.dim('\ntap> '))).trim().toLowerCase();
        } catch {
            break; // readline closed during shutdown
        }
        if (ended) break;
        if (line === '') continue;
        if (line === 'h' || line === '?') {
            printHelp();
        } else if (line === 's') {
            printStatus();
        } else if (line === 'a') {
            const p = await setupPassenger(passengers.length + 1);
            passengers.push(p);
            console.log(c.ok(`${p.name} is ready (card ${p.uid}, topped up).`));
        } else if (line === 'e') {
            await shutdown({ endTheTrip: true });
        } else if (line === 'd' || line === 'q') {
            await shutdown({ endTheTrip: false });
        } else if (/^\d+$/.test(line)) {
            const p = passengers.find((x) => x.n === Number(line));
            if (!p) {
                console.log(c.err(`No student ${line} - you have ${passengers.length} (press 'a' to add one).`));
            } else {
                await tap(p, handle.tripId, pos);
            }
        } else {
            console.log(c.err(`Unknown command "${line}" - press h for help.`));
        }
    }
}

void main().catch((err) => {
    console.error(c.err(String(err instanceof Error ? err.message : err)));
    rl.close();
    process.exit(1);
});
