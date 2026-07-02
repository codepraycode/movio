import { IsOptional, IsString } from 'class-validator';
import type { Vehicle } from '../../types';

export interface VehicleWithDriver extends Vehicle {
    driver_first_name: string | null;
    driver_last_name: string | null;
}

export class AssignDriverDto {
    @IsOptional()
    @IsString()
    driver_id?: string | null;
}
