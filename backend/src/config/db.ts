import { Pool } from 'pg';
import type { QueryResult } from 'pg';
import { env } from './env.config';

// Single shared connection pool. Import { query } wherever you need the DB.
const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.PGSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
    // Unexpected error on idle client - log and let the process manager restart if needed
    console.error('Unexpected Postgres pool error', err);
});

const query = (text: string, params?: unknown[]): Promise<QueryResult> =>
    pool.query(text, params as unknown[]);

export { query, pool };
