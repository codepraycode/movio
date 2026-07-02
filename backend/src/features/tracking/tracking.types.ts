import { IsLatitude, IsLongitude, IsNotEmpty, IsString } from 'class-validator';

export class LocationUpdateDto {
    @IsString()
    @IsNotEmpty()
    trip_id!: string;

    @IsLatitude()
    latitude!: number;

    @IsLongitude()
    longitude!: number;
}

export interface LocationUpdateRow {
    update_id: string;
    trip_id: string;
    latitude: number;
    longitude: number;
    recorded_at: string;
}

export interface ActiveTripRow {
    trip_id: string;
    status: string;
    start_time: string;
    plate_number: string;
    vehicle_type: string;
    route_name: string | null;
    latitude: number | null;
    longitude: number | null;
    last_location_at: string | null;
}
