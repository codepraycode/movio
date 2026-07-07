import 'dotenv/config';
import { logger } from '../shared/utils/logger';

// Vars the app cannot run without - fail fast at startup rather than surface
// confusing downstream errors (e.g. a DB pool that never connects, tokens
// signed with 'undefined').
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'] as const;

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
    throw new Error(
        `Missing required environment variable(s): ${missing.join(', ')}. Check .env against .env.example.`
    );
}

export const env = {
    PORT: process.env.PORT || 4000,
    DATABASE_URL: process.env.DATABASE_URL as string,
    PGSSL: process.env.PGSSL === 'true',
    JWT_SECRET: process.env.JWT_SECRET as string,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '12h',
    // Optional - MQTT client degrades gracefully when these are unset (TapTrace
    // parts aren't ordered yet, see AGENTS.md open items).
    MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
    MQTT_USERNAME: process.env.MQTT_USERNAME,
    MQTT_PASSWORD: process.env.MQTT_PASSWORD,
    // Optional at boot (the site runs fine without top-up configured, same
    // pattern as the MQTT vars) - a warning is logged below if missing, so it's
    // not a silent gap. Test-mode keys during development.
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
    // ₦ per Transit Credit. Flat fare per Ch.1/3 and the conference paper is
    // ₦200/trip = 1 credit. CONFIRM this is still current with the FUTA SUG
    // transport desk before relying on it — fares change (AGENTS.md open item).
    FARE_NAIRA: Number(process.env.FARE_NAIRA) || 200,
};

if (!env.PAYSTACK_SECRET_KEY) {
    // Not fatal — top-up endpoints just won't be usable until this is set.
    logger.warn(
        'PAYSTACK_SECRET_KEY is not set — website Transit Credit top-up is disabled. Set it in .env to enable /wallet/topup-app.'
    );
}
