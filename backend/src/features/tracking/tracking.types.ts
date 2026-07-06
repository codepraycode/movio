import { IsLatitude, IsLongitude, IsNotEmpty, IsString } from 'class-validator';
import type { LocationUpdate, Route, Trip, Vehicle } from '../../types';

export class LocationUpdateDto {
    @IsString()
    @IsNotEmpty()
    trip_id!: string;

    @IsLatitude()
    latitude!: number;

    @IsLongitude()
    longitude!: number;
}

export type LocationUpdateRow = LocationUpdate;

export interface ActiveTripRow
    extends Pick<Trip, 'trip_id' | 'status' | 'start_time'>,
        Pick<Vehicle, 'plate_number' | 'vehicle_type' | 'capacity'> {
    route_name: Route['route_name'] | null;
    driver_first_name: string;
    driver_last_name: string;
    passenger_count: number;
    latitude: LocationUpdate['latitude'] | null;
    longitude: LocationUpdate['longitude'] | null;
    last_location_at: LocationUpdate['recorded_at'] | null;
}

/**
 * The public (unauthenticated) active-trip shape served to the website live map.
 * Identical to ActiveTripRow minus the driver's name - see findPublicActiveTrips
 * in tracking.model.ts for why the personal fields are dropped.
 */
export type PublicActiveTripRow = Omit<ActiveTripRow, 'driver_first_name' | 'driver_last_name'>;
