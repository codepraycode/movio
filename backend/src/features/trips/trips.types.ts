import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { Route, Trip, Vehicle } from '../../types';

export class TripStartDto {
    @IsString()
    @IsNotEmpty()
    vehicle_id!: string;

    @IsOptional()
    @IsString()
    route_id?: string;

    @IsOptional()
    @IsString()
    device_id?: string;
}

export interface TripMonitorRow
    extends Pick<Trip, 'trip_id' | 'status' | 'start_time' | 'end_time'>,
        Pick<Vehicle, 'plate_number' | 'vehicle_type' | 'capacity'> {
    route_name: Route['route_name'] | null;
    driver_first_name: string;
    driver_last_name: string;
    passenger_count: number;
}
