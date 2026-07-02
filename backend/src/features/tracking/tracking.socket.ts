import type { Server } from 'socket.io';
import type { LocationUpdateRow } from './tracking.types';

/** Broadcasts a fresh GPS reading to any connected dashboard/mobile clients. */
export function emitLocationUpdate(io: Server | undefined, update: LocationUpdateRow): void {
    io?.emit('location:update', update);
}
