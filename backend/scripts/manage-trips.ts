/**
 * manage-trips.ts
 *
 * Terminal "backdoor" for managing trips directly against the DB, bypassing
 * the public API's rules - specifically BE-9's deliberate restriction that
 * only the driver who started a trip can end it (trips.service.ts). That
 * restriction is correct for the real API and stays untouched there; this
 * script exists because chasing down a driver JWT every time you want to
 * end a test/demo trip is real friction during development. It calls the
 * same model functions the API uses (trips.model.ts, vehicles.model.ts,
 * users.model.ts) directly against the DB, not over HTTP - none of the
 * role/ownership checks in the service layer apply here, which is the
 * entire point. Stays a local dev script, never an exposed endpoint.
 *
 * Usage:
 *   yarn trips list [--all]                                # active trips (default) or every trip with --all
 *   yarn trips vehicles                                     # list vehicles (for start's vehicle_id arg)
 *   yarn trips drivers                                      # list drivers (for start's optional driver_id arg)
 *   yarn trips start <vehicle_id> [route_id] [driver_id]    # driver_id optional - picks the first driver in the DB if omitted
 *   yarn trips end <trip_id>                                # ends regardless of who started it
 *   yarn trips end-all                                      # ends every currently active trip
 *
 * Examples:
 *   yarn trips list
 *   yarn trips start 11111111-1111-1111-1111-111111111111 22222222-2222-2222-2222-222222222222
 *   yarn trips end 7699ade5-8ed9-40f5-b56f-f5b992febf63
 */

import { DatabaseError } from 'pg';
import { pool } from '../src/config/db';
import * as tripsModel from '../src/features/trips/trips.model';
import * as vehiclesModel from '../src/features/vehicles/vehicles.model';
import * as usersModel from '../src/features/users/users.model';

const [, , command, ...args] = process.argv;

async function listTrips(showAll: boolean): Promise<void> {
    const trips = await tripsModel.listTripsWithPassengerCounts();
    const rows = (showAll ? trips : trips.filter((t) => t.status === 'active')).map((t) => ({
        trip_id: t.trip_id,
        status: t.status,
        vehicle: t.plate_number,
        route: t.route_name ?? '—',
        driver: `${t.driver_first_name} ${t.driver_last_name}`,
        passengers: `${t.passenger_count}/${t.capacity}`,
        started: t.start_time,
    }));
    if (rows.length === 0) {
        console.log(
            showAll ? 'No trips exist yet.' : 'No active trips. Pass --all to see completed/cancelled ones too.'
        );
        return;
    }
    console.table(rows);
}

async function listVehicles(): Promise<void> {
    const vehicles = await vehiclesModel.listVehiclesWithDriver();
    console.table(
        vehicles.map((v) => ({
            vehicle_id: v.vehicle_id,
            plate: v.plate_number,
            type: v.vehicle_type,
            capacity: v.capacity,
            active: v.is_active,
        }))
    );
}

async function listDrivers(): Promise<void> {
    const drivers = await usersModel.listUsersByRole('driver');
    if (drivers.length === 0) {
        console.log('No drivers registered yet - register one via POST /api/v1/auth/register with role=driver first.');
        return;
    }
    console.table(drivers.map((d) => ({ user_id: d.user_id, name: `${d.first_name} ${d.last_name}`, email: d.email })));
}

async function startTrip(
    vehicleId: string | undefined,
    routeId: string | undefined,
    driverId: string | undefined
): Promise<void> {
    if (!vehicleId) {
        console.error('Usage: yarn trips start <vehicle_id> [route_id] [driver_id]');
        process.exitCode = 1;
        return;
    }

    let resolvedDriverId = driverId;
    if (!resolvedDriverId) {
        const drivers = await usersModel.listUsersByRole('driver');
        if (drivers.length === 0) {
            console.error(
                'No drivers exist and none was given. Register one first (role=driver) or pass a driver_id explicitly.'
            );
            process.exitCode = 1;
            return;
        }
        resolvedDriverId = drivers[0].user_id;
        console.log(`No driver_id given - using ${drivers[0].first_name} ${drivers[0].last_name} (${resolvedDriverId})`);
    }

    const active = await tripsModel.findActiveTripByVehicle(vehicleId);
    if (active) {
        console.error(
            `Vehicle already has an active trip: ${active.trip_id}. End it first (yarn trips end ${active.trip_id}) or pick another vehicle.`
        );
        process.exitCode = 1;
        return;
    }

    try {
        const trip = await tripsModel.insertTrip(resolvedDriverId, vehicleId, routeId ?? null, null);
        console.log('Trip started:');
        console.table([trip]);
    } catch (err) {
        if (err instanceof DatabaseError && err.code === '23503') {
            console.error('vehicle_id, route_id, or driver_id does not reference an existing record.');
            process.exitCode = 1;
            return;
        }
        throw err;
    }
}

async function endTrip(tripId: string | undefined): Promise<void> {
    if (!tripId) {
        console.error('Usage: yarn trips end <trip_id>');
        process.exitCode = 1;
        return;
    }
    const trip = await tripsModel.findTripById(tripId);
    if (!trip) {
        console.error(`No trip found with id ${tripId}`);
        process.exitCode = 1;
        return;
    }
    if (trip.status !== 'active') {
        console.log(`Trip is already ${trip.status} - nothing to do.`);
        return;
    }
    const ended = await tripsModel.endTrip(tripId);
    console.log('Trip ended:');
    console.table([ended]);
}

async function endAllTrips(): Promise<void> {
    const trips = await tripsModel.listTripsWithPassengerCounts();
    const active = trips.filter((t) => t.status === 'active');
    if (active.length === 0) {
        console.log('No active trips to end.');
        return;
    }
    for (const t of active) {
        await tripsModel.endTrip(t.trip_id);
        console.log(`Ended ${t.trip_id} (${t.plate_number})`);
    }
}

function printUsage(): void {
    console.log(`MovIO trips backdoor - manage trips directly, bypassing driver-ownership checks.

Usage:
  yarn trips list [--all]
  yarn trips vehicles
  yarn trips drivers
  yarn trips start <vehicle_id> [route_id] [driver_id]
  yarn trips end <trip_id>
  yarn trips end-all
`);
}

async function main(): Promise<void> {
    switch (command) {
        case 'list':
            await listTrips(args.includes('--all'));
            break;
        case 'vehicles':
            await listVehicles();
            break;
        case 'drivers':
            await listDrivers();
            break;
        case 'start':
            await startTrip(args[0], args[1], args[2]);
            break;
        case 'end':
            await endTrip(args[0]);
            break;
        case 'end-all':
            await endAllTrips();
            break;
        default:
            printUsage();
            if (command) process.exitCode = 1;
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
