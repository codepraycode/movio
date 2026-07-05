import type { Server } from 'socket.io';
import type { ActiveTripRow } from '../tracking/tracking.types';

/**
 * Trip lifecycle broadcasts. The payload for `trip:started` is the same row
 * shape `GET /tracking/active` returns, so live clients can add the vehicle
 * to their roster without an extra fetch (its location fields are null until
 * the first GPS ping lands).
 */
export function emitTripStarted(io: Server | undefined, trip: ActiveTripRow): void {
    io?.emit('trip:started', trip);
}

export function emitTripEnded(io: Server | undefined, tripId: string): void {
    io?.emit('trip:ended', { trip_id: tripId });
}
