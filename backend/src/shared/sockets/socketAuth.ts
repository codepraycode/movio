import type { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

/**
 * Socket.io connection middleware. If the client sends a JWT in
 * `socket.handshake.auth.token`, it's verified and attached to `socket.data.user`.
 *
 * TODO: connections are NOT currently required to be authenticated - dashboard/
 * mobile clients can connect and receive broadcasts (e.g. location:update) without
 * a token, matching the current unauthenticated-by-default state of the live map.
 * Flag this as a known limitation in Chapter 4; tightening it to reject
 * unauthenticated sockets is a deferred follow-up, not done here.
 */
export function socketAuth(socket: Socket, next: (err?: Error) => void): void {
    const token = socket.handshake.auth?.token as string | undefined;

    if (token) {
        try {
            socket.data.user = verifyToken(token);
        } catch {
            // Invalid/expired token - fall through as an anonymous connection rather
            // than rejecting outright, since auth isn't enforced yet (see TODO above).
        }
    }

    next();
}
