import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
    return `[${ts}] ${level}: ${stack || message}`;
});

// npm log levels (error, warn, info, http, verbose, debug, silly) - winston's
// default when none is passed. `http` is used by morgan.middleware.ts so
// request logs share this same colorized, timestamped format.
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'http' : 'debug',
    format: combine(errors({ stack: true }), timestamp({ format: 'HH:mm:ss' }), colorize(), consoleFormat),
    transports: [new winston.transports.Console()],
});

export const httpLogStream = {
    write: (message: string): void => {
        logger.http(message.trim());
    },
};
