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
        Pick<Vehicle, 'plate_number' | 'vehicle_type'> {
    route_name: Route['route_name'] | null;
    latitude: LocationUpdate['latitude'] | null;
    longitude: LocationUpdate['longitude'] | null;
    last_location_at: LocationUpdate['recorded_at'] | null;
}
