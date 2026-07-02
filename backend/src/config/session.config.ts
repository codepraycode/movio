import { env } from './env.config';

// env.config.ts already guarantees JWT_SECRET is set (throws at startup otherwise).
export const SESSION_SECRET = env.JWT_SECRET;
export const SESSION_EXPIRES_IN = env.JWT_EXPIRES_IN;
