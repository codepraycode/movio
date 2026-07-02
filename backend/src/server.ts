import 'reflect-metadata'; // required by class-validator/class-transformer decorators - must load first
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initSocketManager } from './shared/sockets/socketManager';
import { env } from './config/env.config';
import { logger } from './shared/utils/logger';

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }, // tighten this before any real deployment
});

app.set('io', io);
initSocketManager(io);

server.listen(env.PORT, () => {
    logger.info(`MovIO backend listening on port ${env.PORT}`);
});
