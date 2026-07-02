import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import type { Route, RouteStop } from '../../types';

export class RouteStopDto implements RouteStop {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsNumber()
    lat!: number;

    @IsNumber()
    lng!: number;
}

export class CreateRouteDto {
    @IsString()
    @IsNotEmpty()
    route_name!: string;

    @IsArray()
    @ArrayMinSize(2, { message: 'stops must contain at least 2 stops' })
    @ValidateNested({ each: true })
    @Type(() => RouteStopDto)
    stops!: RouteStopDto[];
}

export class UpdateRouteDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    route_name?: string;

    @IsOptional()
    @IsArray()
    @ArrayMinSize(2, { message: 'stops must contain at least 2 stops' })
    @ValidateNested({ each: true })
    @Type(() => RouteStopDto)
    stops?: RouteStopDto[];

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export type { Route };
