import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initSocketManager } from './shared/sockets/socketManager';
import { env } from './config/env.config';

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }, // tighten this before any real deployment
});

app.set('io', io);
initSocketManager(io);

server.listen(env.PORT, () => {
    console.log(`MovIO backend listening on port ${env.PORT}`);
});
