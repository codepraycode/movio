import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
