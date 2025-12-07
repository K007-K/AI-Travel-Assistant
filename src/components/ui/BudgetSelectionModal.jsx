import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Star, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useItineraryStore from '../../store/itineraryStore';

const BudgetSelectionModal = ({ isOpen, onClose, destination }) => {
    const navigate = useNavigate();
    const createTrip = useItineraryStore((state) => state.createTrip);

    const budgetTiers = [
        {
            id: 'budget',
            name: 'Budget',
            icon: Coins,
            color: 'from-green-500 to-emerald-600',
            bgColor: 'bg-green-50 dark:bg-green-950/30',
            borderColor: 'border-green-200 dark:border-green-800',
            hoverColor: 'hover:border-green-400 dark:hover:border-green-600',
            description: 'Travel smart without breaking the bank',
            features: [
                'Hostels & budget hotels',
                'Local street food & eateries',
                'Public transportation',
                'Free walking tours & museums'
            ],
            priceRange: '$',
            estimatedDaily: '50-80'
        },
        {
            id: 'mid-range',
            name: 'Mid-Range',
            icon: DollarSign,
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
            borderColor: 'border-blue-200 dark:border-blue-800',
            hoverColor: 'hover:border-blue-400 dark:hover:border-blue-600',
            description: 'Perfect balance of comfort and value',
            features: [
                '3-4 star hotels',
                'Well-reviewed restaurants',
                'Mix of taxi & public transport',
                'Popular tours & attractions'
            ],
            priceRange: '$$',
            estimatedDaily: '150-250',
            recommended: true
        },
        {
            id: 'luxury',
            name: 'Luxury',
            icon: Star,
            color: 'from-purple-500 to-pink-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/30',
            borderColor: 'border-purple-200 dark:border-purple-800',
            hoverColor: 'hover:border-purple-400 dark:hover:border-purple-600',
            description: 'Indulge in premium experiences',
            features: [
                '5-star hotels & resorts',
                'Fine dining & Michelin stars',
                'Private tours & transfers',
                'Exclusive experiences'
            ],
            priceRange: '$$$',
            estimatedDaily: '400+'
        }
    ];

    const handleBudgetSelect = (budgetTier) => {
        // Create a new trip with the selected destination and budget tier
        const tripId = createTrip({
            title: `Trip to ${destination.name}`,
            destination: destination.name,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 7,
            budget: 0,
            budgetTier: budgetTier.id,
            travelers: 1,
            currency: 'USD'
        });

        onClose();
        navigate(`/itinerary/${tripId}`);
    };

    if (!destination) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>

                        {/* Header */}
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={destination.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(destination.name)}`}
                                alt={destination.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            <div className="absolute bottom-6 left-6 text-white">
                                <h2 className="text-3xl font-bold mb-2">{destination.name}</h2>
                                <p className="text-lg text-white/90">Choose your travel style</p>
                            </div>
                        </div>

                        {/* Budget Options */}
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {budgetTiers.map((tier) => {
                                    const Icon = tier.icon;
                                    return (
                                        <motion.button
                                            key={tier.id}
                                            onClick={() => handleBudgetSelect(tier)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`relative text-left p-6 rounded-xl border-2 ${tier.bgColor} ${tier.borderColor} ${tier.hoverColor} transition-all duration-300 group`}
                                        >
                                            {tier.recommended && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                    <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-semibold rounded-full shadow-lg">
                                                        Popular Choice
                                                    </span>
                                                </div>
                                            )}

                                            {/* Icon */}
                                            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${tier.color} mb-4`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>

                                            {/* Title & Price Range */}
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                                    {tier.name}
                                                </h3>
                                                <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                                                    {tier.priceRange}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                                {tier.description}
                                            </p>

                                            {/* Features */}
                                            <ul className="space-y-2 mb-4">
                                                {tier.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                                                        <span className="mr-2 text-primary-500">✓</span>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* Estimated Daily Cost */}
                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Est. daily budget
                                                </p>
                                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                    ${tier.estimatedDaily}
                                                </p>
                                            </div>

                                            {/* Hover Effect */}
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                                                style={{ backgroundImage: `linear-gradient(to bottom right, ${tier.color})` }}
                                            />
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer Note */}
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                                💡 Don't worry, you can adjust your budget and preferences after creating your itinerary
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BudgetSelectionModal;
