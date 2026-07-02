import 'dotenv/config';

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
};
