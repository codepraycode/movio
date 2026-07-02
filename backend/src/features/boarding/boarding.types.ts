export interface BoardingRequestBody {
    uid: string;
    trip_id: string;
    latitude?: number;
    longitude?: number;
}

export interface BoardingResult {
    success: boolean;
    reason?: 'unrecognized_or_inactive_card' | 'insufficient_credits';
    student_name?: string;
    event_id?: string;
    boarded_at?: string;
}
