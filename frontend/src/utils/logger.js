/**
 * Production Logger — Guards console output by environment mode.
 *
 * In production: suppresses debug/info, keeps warn/error.
 * In development: passes through to native console.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info('Data loaded', data);   // suppressed in prod
 *   logger.warn('Slow query');          // always shown
 *   logger.error('Failed', err);        // always shown
 *
 * @module utils/logger
 */

const IS_PROD = typeof import.meta !== 'undefined'
    && import.meta.env?.MODE === 'production';

export const logger = {
    /** Debug-level — suppressed in production */
    debug: (...args) => {
        if (!IS_PROD) console.debug('[DEBUG]', ...args);
    },

    /** Info-level — suppressed in production */
    info: (...args) => {
        if (!IS_PROD) console.info('[INFO]', ...args);
    },

    /** Warning-level — always shown */
    warn: (...args) => {
        console.warn('[WARN]', ...args);
    },

    /** Error-level — always shown */
    error: (...args) => {
        console.error('[ERROR]', ...args);
    },
};

export default logger;
