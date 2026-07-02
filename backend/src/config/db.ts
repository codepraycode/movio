import { Pool } from 'pg';
import type { QueryResult } from 'pg';
import { env } from './env.config';
import { logger } from '../shared/utils/logger';

// Single shared connection pool. Import { query } wherever you need the DB.
const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.PGSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
    // Unexpected error on idle client - log and let the process manager restart if needed
    logger.error('Unexpected Postgres pool error: %s', err.message);
});

const query = (text: string, params?: unknown[]): Promise<QueryResult> =>
    pool.query(text, params as unknown[]);

export { query, pool };
