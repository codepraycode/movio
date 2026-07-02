import { io, type Socket } from 'socket.io-client'
import { API_ORIGIN } from './api'
import { getToken } from './auth'

// Single shared connection for the whole app, same "one instance, import it
// wherever needed" pattern as the backend's own pg pool (config/db.ts). The
// backend's socketAuth middleware accepts an optional token and degrades to
// an anonymous connection if it's missing/invalid, so this works pre-login too.
let socket: Socket | undefined

export function getSocket(): Socket {
    if (!socket) {
        socket = io(API_ORIGIN, { auth: { token: getToken() ?? undefined } })
    }
    return socket
}
