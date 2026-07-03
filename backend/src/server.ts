import 'reflect-metadata'; // required by class-validator/class-transformer decorators - must load first
import http from 'http';
import os from 'os';
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
    const localhost = `http://localhost:${env.PORT}`;
    const networkIP = Object.values(os.networkInterfaces())
        .flat()
        .find(iface => iface?.family === 'IPv4' && !iface.internal)?.address;
    const networkUrl = networkIP ? `http://${networkIP}:${env.PORT}` : 'unavailable';

    // Startup banner
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('MovIO Backend Server Started');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Local Access: ${localhost}`);
    logger.info(`Network Access: ${networkUrl}`);
    logger.info('═══════════════════════════════════════════════════════');
});
