/**
 * Environment Variable Validation — Fast-fail on missing required vars.
 *
 * Call once from main.jsx before React renders.
 * Throws immediately in development; logs warning in production.
 *
 * @module config/validateEnv
 */

const REQUIRED_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
];

export function validateEnv() {
    const missing = REQUIRED_VARS.filter(
        (key) => !import.meta.env[key] || import.meta.env[key].trim() === ''
    );

    if (missing.length > 0) {
        const message = `❌ Missing required environment variables:\n${missing.map(v => `  • ${v}`).join('\n')}\n\nCreate a .env file in /frontend with these values.`;

        console.error('[validateEnv]', message);
        throw new Error(message);
    }
}
