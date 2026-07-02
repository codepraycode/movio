/**
 * simulate-taptrace.ts
 *
 * Pretends to be a TapTrace device: posts GPS updates and occasional boarding
 * events to the backend, exactly like the real ESP32 unit will once HW-4 is
 * built. This lets you build and test the dashboard/mobile app against
 * realistic data before the hardware exists.
 *
 * Usage (backend must be running, DB seeded with at least one active trip):
 *   yarn simulate <trip_id> [nfc_uid_to_tap]
 *
 * Example:
 *   yarn simulate 3f2a1c... 04A1B2C3D4
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';

const tripId = process.argv[2];
const uidToTap = process.argv[3]; // optional - if provided, simulates a boarding every ~15s

if (!tripId) {
    console.error('Usage: yarn tsx scripts/simulate-taptrace.ts <trip_id> [nfc_uid_to_tap]');
    process.exit(1);
}

// Rough FUTA campus bounding box for believable fake movement - adjust to real coordinates
let lat = 7.3006;
let lng = 5.1367;

async function postJson(path: string, body: object): Promise<{ status: number; data: unknown }> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

function jitter(value: number, amount: number): number {
    return value + (Math.random() - 0.5) * amount;
}

async function tick(): Promise<void> {
    lat = jitter(lat, 0.0006);
    lng = jitter(lng, 0.0006);

    const { status, data } = await postJson('/tracking/update', {
        trip_id: tripId,
        latitude: lat,
        longitude: lng,
    });
    console.log(`[location] ${status}`, data);
}

async function simulateBoarding(): Promise<void> {
    if (!uidToTap) return;
    const { status, data } = await postJson('/boarding/authenticate', {
        uid: uidToTap,
        trip_id: tripId,
        latitude: lat,
        longitude: lng,
    });
    console.log(`[boarding] ${status}`, data);
}

console.log(`Simulating TapTrace device for trip ${tripId}...`);
setInterval(tick, 5000); // matches the real device's 5s interval (see Ch.3 §3.4.4)
if (uidToTap) setInterval(simulateBoarding, 15000);
void tick();
