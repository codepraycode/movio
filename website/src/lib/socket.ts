import { io, type Socket } from 'socket.io-client'
import { SOCKET_URL } from '@/lib/track-api'

/**
 * A single shared Socket.io connection to the MovIO backend, mirroring the
 * dashboard's "one shared instance" pattern. The backend's socketAuth accepts
 * anonymous connections (see backend socketAuth.ts) — the public live map needs
 * no token to receive location:update / trip:* broadcasts.
 */
let socket: Socket | null = null

export function getSocket(): Socket {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            reconnectionDelay: 1500,
        })
    }
    return socket
}
