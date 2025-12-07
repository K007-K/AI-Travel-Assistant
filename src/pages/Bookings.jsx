import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Train, Search, Calendar, MapPin, User, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import useBookingStore from '../store/bookingStore';
import { useNavigate } from 'react-router-dom';
import LocationInput from '../components/ui/LocationInput'; // [NEW]

const Bookings = () => {
    const navigate = useNavigate();
    const { addBooking } = useBookingStore();
    const [activeTab, setActiveTab] = useState('flights');
    const [searchState, setSearchState] = useState('idle'); // idle, searching, results
    const [results, setResults] = useState([]);
    const [showConfetti, setShowConfetti] = useState(false);

    // Form inputs
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        date: '',
        guests: 1,
        returnDate: ''
    });

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchState('searching');

        // Simulate API delay
        setTimeout(() => {
            generateMockResults();
            setSearchState('results');
        }, 1500);
    };

    const generateMockResults = () => {
        const count = Math.floor(Math.random() * 4) + 3; // 3-6 results
        const newResults = [];

        for (let i = 0; i < count; i++) {
            if (activeTab === 'flights') {
                newResults.push({
                    id: i,
                    type: 'flight',
                    airline: ['SkyHigh Air', 'Oceanic', 'Global Wings', 'RapidFly'][Math.floor(Math.random() * 4)],
                    time: `${Math.floor(Math.random() * 12) + 1}:00 ${Math.random() > 0.5 ? 'AM' : 'PM'} - ${Math.floor(Math.random() * 12) + 1}:00 ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
                    duration: `${Math.floor(Math.random() * 10) + 1}h ${Math.floor(Math.random() * 50)}m`,
                    price: Math.floor(Math.random() * 500) + 150,
                    logo: '✈️'
                });
            } else if (activeTab === 'hotels') {
                newResults.push({
                    id: i,
                    type: 'hotel',
                    name: `${['Grand', 'Royal', 'Cozy', 'Urban', 'Seaside'][Math.floor(Math.random() * 5)]} ${['Hotel', 'Inn', 'Stay', 'Resort', 'Suites'][Math.floor(Math.random() * 5)]}`,
                    rating: (Math.random() * 2 + 3).toFixed(1),
                    location: formData.destination || 'City Center',
                    price: Math.floor(Math.random() * 300) + 80,
                    image: '🏨'
                });
            } else {
                newResults.push({
                    id: i,
                    type: 'train',
                    operator: ['RailConnect', 'SpeedTrak', 'CityLine', 'MetroExpress'][Math.floor(Math.random() * 4)],
                    time: `${Math.floor(Math.random() * 12) + 1}:00 ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
                    duration: `${Math.floor(Math.random() * 5) + 1}h`,
                    price: Math.floor(Math.random() * 100) + 30,
                    logo: '🚆'
                });
            }
        }
        setResults(newResults);
    };

    const handleBook = (item) => {
        // Create booking object
        const booking = {
            type: activeTab,
            title: activeTab === 'hotels' ? item.name : `${item.airline || item.operator} to ${formData.destination}`,
            details: activeTab === 'hotels' ? `${item.location} • ${formData.date}` : `${formData.origin} → ${formData.destination} • ${formData.date}`,
            price: item.price,
            date: formData.date
        };

        addBooking(booking);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900 transition-colors">
            <div className="container-custom max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Book Your Trip</h1>
                    <p className="text-slate-500 dark:text-slate-400">Find the best deals on flights, hotels, and trains</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 inline-flex">
                        {['flights', 'hotels', 'trains'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSearchState('idle'); }}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab === 'flights' && <Plane className="w-4 h-4" />}
                                {tab === 'hotels' && <Hotel className="w-4 h-4" />}
                                {tab === 'trains' && <Train className="w-4 h-4" />}
                                <span className="capitalize">{tab}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Form */}
                <motion.div
                    layout
                    className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 mb-10"
                >
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <LocationInput
                                label={activeTab === 'hotels' ? 'Location' : 'From'}
                                value={formData.origin}
                                onChange={(val) => setFormData({ ...formData, origin: val })}
                                placeholder={activeTab === 'hotels' ? "City or Hotel" : "City or Airport"}
                            />
                        </div>

                        {activeTab !== 'hotels' && (
                            <div className="space-y-1">
                                <LocationInput
                                    label="To"
                                    value={formData.destination}
                                    onChange={(val) => setFormData({ ...formData, destination: val })}
                                    placeholder="Destination"
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={searchState === 'searching'}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {searchState === 'searching' ? (
                                    'Searching...'
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Search
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Results Area */}
                <div className="space-y-4">
                    {searchState === 'searching' && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
                            <p className="text-slate-500">Searching specifically for you...</p>
                        </div>
                    )}

                    {searchState === 'results' && results.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group"
                        >
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="text-4xl">{activeTab === 'hotels' ? '🏨' : activeTab === 'trains' ? '🚆' : '✈️'}</div>
                                <div className="flex-grow text-center md:text-left">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {activeTab === 'flights' ? item.airline : activeTab === 'trains' ? item.operator : item.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {activeTab === 'hotels' ? item.location : `Duration: ${item.duration} • ${item.time}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                                    <div className="text-right flex-grow md:flex-grow-0">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">${item.price}</p>
                                        <p className="text-xs text-slate-500">per person</p>
                                    </div>
                                    <button
                                        onClick={() => handleBook(item)}
                                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:bg-primary-600 dark:hover:bg-primary-400 dark:hover:text-white transition-colors"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Confetti / Success Modal */}
            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border-2 border-emerald-500 flex flex-col items-center">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Booking Confirmed!</h2>
                            <p className="text-slate-500 text-center mb-6">Your booking has been saved to your profile.</p>
                            <button className="px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-medium">Auto-closing...</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Bookings;
