import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BoardingDto {
    @IsString()
    @IsNotEmpty()
    uid!: string; // NFC UID read from the card/phone by the reader

    @IsString()
    @IsNotEmpty()
    trip_id!: string; // the active trip the TapTrace device is currently attached to

    @IsOptional()
    @IsLatitude()
    latitude?: number;

    @IsOptional()
    @IsLongitude()
    longitude?: number;
}

/**
 * One row of a student's own trip history (GET /boarding/my-trips, MOB-7's
 * "My trips" screen): each boarding event with the trip's vehicle, driver and
 * route so the student can account for every credit spent.
 */
export interface StudentTripRow {
    event_id: string;
    trip_id: string;
    boarded_at: Date;
    alighted_at: Date | null;
    trip_status: string;
    plate_number: string;
    vehicle_type: string;
    route_name: string | null;
    driver_first_name: string;
    driver_last_name: string;
}

export interface BoardingResult {
    success: boolean;
    /**
     * A tap toggles: no open boarding event on this trip -> tap_in (deducts one
     * credit); an open event exists -> tap_out (free, just closes the event).
     * Matches the physical TapTrace flow - same card, same reader; the backend
     * decides which action the tap was.
     */
    action?: 'tap_in' | 'tap_out';
    reason?: 'unrecognized_or_inactive_card' | 'insufficient_credits';
    student_name?: string;
    event_id?: string;
    boarded_at?: Date;
    alighted_at?: Date | null;
}
