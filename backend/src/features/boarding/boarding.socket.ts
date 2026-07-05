import type { Server } from 'socket.io';

/** Emitted after every successful tap so live clients update occupancy instantly. */
export interface PassengerUpdatePayload {
    trip_id: string;
    passenger_count: number; // students currently aboard (boarded, not alighted)
    action: 'tap_in' | 'tap_out';
    student_name?: string;
}

export function emitPassengerUpdate(io: Server | undefined, payload: PassengerUpdatePayload): void {
    io?.emit('trip:passengers', payload);
}
