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

export interface BoardingResult {
    success: boolean;
    reason?: 'unrecognized_or_inactive_card' | 'insufficient_credits';
    student_name?: string;
    event_id?: string;
    boarded_at?: string;
}
