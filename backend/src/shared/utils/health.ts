import { pool } from '../../config/db';
import { logger } from './logger';

export interface HealthCheckBody {
    service: 'movio-backend';
    status: 'ok' | 'degraded';
    uptime_seconds: number;
    timestamp: string;
    checks: {
        database: {
            status: 'ok' | 'down';
            latency_ms: number;
        };
    };
}

export interface HealthCheckResult {
    statusCode: 200 | 503;
    body: HealthCheckBody;
}

/** Pings Postgres directly so /health reflects reality instead of always reporting "ok". */
export async function getHealthStatus(): Promise<HealthCheckResult> {
    const dbStart = Date.now();
    let databaseStatus: 'ok' | 'down' = 'ok';

    try {
        await pool.query('SELECT 1');
    } catch (err) {
        databaseStatus = 'down';
        logger.error('Health check: database unreachable - %s', (err as Error).message);
    }

    const overallStatus = databaseStatus === 'ok' ? 'ok' : 'degraded';

    return {
        statusCode: overallStatus === 'ok' ? 200 : 503,
        body: {
            service: 'movio-backend',
            status: overallStatus,
            uptime_seconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            checks: {
                database: { status: databaseStatus, latency_ms: Date.now() - dbStart },
            },
        },
    };
}
