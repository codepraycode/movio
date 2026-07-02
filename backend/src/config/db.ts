import { Pool, types } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';
import { env } from './env.config';
import { logger } from '../shared/utils/logger';

// OID 1700 = NUMERIC/DECIMAL. pg returns these as strings by default to avoid
// floating-point precision loss - this app has no need for arbitrary
// precision (GPS coordinates, see location_updates/boarding_events in
// db/schema.sql), so parse them as numbers to match the types in src/types.
types.setTypeParser(1700, (value) => parseFloat(value));

// pg's default connectionTimeoutMillis is 0 (wait forever). Seen in practice:
// a Supabase pooler DNS/network blip (EAI_AGAIN, then EAUTHTIMEOUT) left
// requests hanging 17-40s+ before failing instead of failing fast - expected
// given this project's real network-reliability context (see AGENTS.md
// working principle #1), but an unbounded hang serves nobody. 5s bounds a
// connection attempt without flagging a normal brief hiccup as an outage.
const CONNECTION_TIMEOUT_MS = 5_000;

// Single shared connection pool. Import { query } wherever you need the DB.
const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.PGSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
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
