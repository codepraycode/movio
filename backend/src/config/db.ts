import { Pool, types } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';
import { env } from './env.config';
import { logger } from '../shared/utils/logger';

// OID 1700 = NUMERIC/DECIMAL. pg returns these as strings by default to avoid
// floating-point precision loss - this app has no need for arbitrary
// precision (GPS coordinates, see location_updates/boarding_events in
// db/schema.sql), so parse them as numbers to match the types in src/types.
types.setTypeParser(1700, (value) => parseFloat(value));

// Single shared connection pool. Import { query } wherever you need the DB.
const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.PGSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
    // Unexpected error on idle client - log and let the process manager restart if needed
    logger.error('Unexpected Postgres pool error: %s', err.message);
});

const query = <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> => pool.query<T>(text, params as unknown[]);

export { query, pool };
