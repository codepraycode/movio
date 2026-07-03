import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const getLevelSymbol = (level: string): string => {
    const symbols: Record<string, string> = {
        error: '✘',
        warn: '⚠',
        info: 'ℹ',
        http: '→',
        debug: '◆',
        verbose: '○',
        silly: '●',
    };
    return symbols[level] || '•';
};

const consoleFormat = printf(({ level, message, timestamp: ts, stack, metadata }) => {
    const symbol = getLevelSymbol(level);
    const base = `${symbol} ${message}`;

    if (metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
        const metaStr = Object.entries(metadata)
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(' ');
        return `[${ts}] ${base} | ${metaStr}${stack ? `\n${stack}` : ''}`;
    }

    return `[${ts}] ${base}${stack ? `\n${stack}` : ''}`;
});

// npm log levels (error, warn, info, http, verbose, debug, silly) - winston's
// default when none is passed. `http` is used by morgan.middleware.ts so
// request logs share this same colorized, timestamped format.
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'http' : 'debug',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'HH:mm:ss.SSS' }),
        colorize({ all: true }),
        consoleFormat,
    ),
    transports: [new winston.transports.Console()],
});

export const httpLogStream = {
    write: (message: string): void => {
        logger.http(message.trim());
    },
};
