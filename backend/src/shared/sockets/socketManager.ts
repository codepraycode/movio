import type { Server } from 'socket.io';
import { socketAuth } from './socketAuth';

/**
 * Attaches Socket.io to the HTTP server. Kept intentionally thin for now -
 * feature-specific emits live next to their feature (e.g.
 * features/tracking/tracking.socket.ts), not here.
 * Extend this file when you add rooms (e.g. per-route channels) in FE-3/MOB-2.
 */
export function initSocketManager(io: Server): void {
    io.use(socketAuth);

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}
