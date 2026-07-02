export const RIDERSHIP_GROUP_BY_VALUES = ['route', 'vehicle', 'day'] as const;
export type RidershipGroupBy = (typeof RIDERSHIP_GROUP_BY_VALUES)[number];

export interface RidershipByRoute {
    route_name: string;
    boarding_count: number;
}

export interface RidershipByVehicle {
    plate_number: string;
    boarding_count: number;
}

export interface RidershipByDay {
    day: string;
    boarding_count: number;
}
