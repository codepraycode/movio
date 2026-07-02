import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { VEHICLE_TYPES } from '../../types';
import type { Vehicle, VehicleType } from '../../types';

export interface VehicleWithDriver extends Vehicle {
    driver_first_name: string | null;
    driver_last_name: string | null;
}

export class AssignDriverDto {
    @IsOptional()
    @IsString()
    driver_id?: string | null;
}

export class CreateVehicleDto {
    @IsString()
    @IsNotEmpty()
    plate_number!: string;

    @IsIn(VEHICLE_TYPES)
    vehicle_type!: VehicleType;

    @IsInt()
    @IsPositive()
    capacity!: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class UpdateVehicleDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    plate_number?: string;

    @IsOptional()
    @IsIn(VEHICLE_TYPES)
    vehicle_type?: VehicleType;

    @IsOptional()
    @IsInt()
    @IsPositive()
    capacity?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
