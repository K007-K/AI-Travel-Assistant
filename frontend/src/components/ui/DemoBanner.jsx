import { DEMO_MODE } from '../../config';
import { FlaskConical } from 'lucide-react';

/**
 * A reusable banner displayed wherever mock/demo flows exist.
 * @param {string} message - Optional override message.
 */
const DemoBanner = ({ message }) => {
    if (!DEMO_MODE) return null;

    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-800/40 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {message || 'Demo Mode – No real bookings or payments are processed.'}
            </p>
        </div>
    );
};

export default DemoBanner;
