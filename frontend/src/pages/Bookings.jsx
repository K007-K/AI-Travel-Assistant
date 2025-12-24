import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Train, Search, Calendar, MapPin, User, CheckCircle, ArrowRight, Star, Clock, Briefcase, Coffee, Wifi, Ban } from 'lucide-react';
import useBookingStore from '../store/bookingStore';
import { useNavigate } from 'react-router-dom';
import LocationInput from '../components/ui/LocationInput';

const Bookings = () => {
    const navigate = useNavigate();
    const { addBooking } = useBookingStore();
    const [activeTab, setActiveTab] = useState('flights');
    const [searchState, setSearchState] = useState('idle'); // idle, searching, results
    const [results, setResults] = useState([]);
    const [showConfetti, setShowConfetti] = useState(false);

    // Currency State
    const [currency, setCurrency] = useState({ code: 'USD', symbol: '$', rate: 1 });

    useEffect(() => {
        // Detect User Location for Currency
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timeZone.includes('Asia/Kolkata') || timeZone.includes('India')) {
                setCurrency({ code: 'INR', symbol: '₹', rate: 84 });
            } else {
                setCurrency({ code: 'USD', symbol: '$', rate: 1 });
            }
        } catch (e) {
            console.error("Failed to detect location", e);
        }
    }, []);

    const formatPrice = (amount) => {
        const value = Math.round(amount * currency.rate);
        return `${currency.symbol}${value.toLocaleString()}`;
    };

    // Date constraints
    const today = new Date().toISOString().split('T')[0];

    // Form inputs
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        date: today, // Default to today
        returnDate: '',
        travelers: 1,
        class: 'Economy',
        // Hotel specific
        checkIn: '',
        checkOut: '',
        rooms: 1,
        // Train specific
        trainClass: 'SL'
    });

    const [sortBy, setSortBy] = useState('recommended');

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchState('searching');
        setResults([]);

        // Simulate API delay
        setTimeout(() => {
            generateMockResults();
            setSearchState('results');
        }, 1500);
    };

    const generateMockResults = () => {
        const count = Math.floor(Math.random() * 5) + 3; // 3-7 results
        const newResults = [];

        for (let i = 0; i < count; i++) {
            if (activeTab === 'flights') {
                const depHour = Math.floor(Math.random() * 24);
                const durationH = Math.floor(Math.random() * 5) + 1; // 1-6 hours
                const arrHour = (depHour + durationH) % 24;

                // Smart Pricing: $50 base + $40 per hour of flight
                const basePrice = 50 + (durationH * 40);

                newResults.push({
                    id: i,
                    type: 'flight',
                    airline: ['IndiGo', 'Air India', 'Vistara', 'Emirates'][Math.floor(Math.random() * 4)],
                    logo: ['✈️', '🦅', '🦁', '🌍'][Math.floor(Math.random() * 4)],
                    flightNumber: `${['6E', 'AI', 'UK', 'EK'][Math.floor(Math.random() * 4)]}-${Math.floor(Math.random() * 900) + 100}`,
                    depTime: `${depHour.toString().padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`,
                    arrTime: `${arrHour.toString().padStart(2, '0')}:${Math.random() > 0.5 ? '15' : '45'}`,
                    duration: `${durationH}h ${Math.floor(Math.random() * 50)}m`,
                    stops: Math.random() > 0.7 ? '1 Stop' : 'Non-stop',
                    price: basePrice + Math.floor(Math.random() * 20), // Add small variation
                });
            } else if (activeTab === 'hotels') {
                const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5 to 5.0
                // Smart Pricing: Base $50 + ($50 * (rating - 3))
                const basePrice = 50 + (50 * (rating - 3));

                newResults.push({
                    id: i,
                    type: 'hotel',
                    name: `${['Grand', 'Royal', 'Cozy', 'Urban', 'Seaside'][Math.floor(Math.random() * 5)]} ${['Hotel', 'Inn', 'Stay', 'Resort', 'Suites'][Math.floor(Math.random() * 5)]}`,
                    rating: rating,
                    reviews: Math.floor(Math.random() * 500) + 50,
                    location: formData.destination || 'City Center',
                    price: Math.floor(basePrice),
                    image: `https://source.unsplash.com/800x600/?hotel,room&sig=${i}`,
                    amenities: ['Wifi', 'Pool', 'Breakfast'].slice(0, Math.floor(Math.random() * 3) + 1)
                });
            } else {
                const depHour = Math.floor(Math.random() * 24);
                const durationH = Math.floor(Math.random() * 10) + 4;
                const arrHour = (depHour + durationH) % 24;

                // Smart Pricing: $10 base + $5 per hour
                const basePrice = 10 + (durationH * 5);

                newResults.push({
                    id: i,
                    type: 'train',
                    name: ['Rajdhani Exp', 'Shatabdi Exp', 'Duronto Exp', 'Intercity Exp'][Math.floor(Math.random() * 4)],
                    number: Math.floor(Math.random() * 80000) + 10000,
                    depTime: `${depHour.toString().padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`,
                    arrTime: `${arrHour.toString().padStart(2, '0')}:${Math.random() > 0.5 ? '15' : '45'}`,
                    duration: `${durationH}h ${Math.floor(Math.random() * 50)}m`,
                    price: Math.floor(basePrice),
                    seats: Math.floor(Math.random() * 50) + 1,
                    class: formData.trainClass || 'SL'
                });
            }
        }
        setResults(newResults);
    };

    // Sort Results
    const sortedResults = [...results].sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'rating' && a.rating) return b.rating - a.rating;
        return 0; // recommended
    });

    const handleBook = (item) => {
        // Navigate to detailed review page instead of instant booking
        navigate('/booking/review', {
            state: {
                bookingData: {
                    ...item,
                    basePrice: item.price, // Keep original base price
                    price: Math.round(item.price * currency.rate), // Displayed price
                    type: item.type, // Use singular type from item (flight, hotel, train) instead of plural tab name
                    title: activeTab === 'hotels' ? item.name : activeTab === 'trains' ? item.name : `${item.airline} ${item.flightNumber}`,
                    details: activeTab === 'hotels' ? `${item.location} • ${formData.date}` : `${formData.origin} → ${formData.destination} • ${formData.date}`,
                },
                currency: currency
            }
        });
    };

    return (
        <div className="min-h-screen pt-20 pb-12 bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Hero Section */}
            <div className="bg-primary-600 pb-32 pt-12 px-6 md:px-8 relative">
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/my-bookings')}
                        className="bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg px-4 py-1.5 text-sm font-bold hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        My Bookings
                    </button>

                    <select
                        value={currency.code}
                        onChange={(e) => {
                            const newCode = e.target.value;
                            setCurrency(newCode === 'INR'
                                ? { code: 'INR', symbol: '₹', rate: 84 }
                                : { code: 'USD', symbol: '$', rate: 1 }
                            );
                        }}
                        className="bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer hover:bg-white/30 transition-colors"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                    </select>
                </div>

                <div className="container-custom max-w-7xl mx-auto text-center text-white">
                    <h1 className="text-4xl font-display font-bold mb-4">Book Your Journey</h1>
                    <p className="text-primary-100 text-lg max-w-2xl mx-auto">
                        Seamless bookings for flights, hotels, and trains. Best prices guaranteed in {currency.code}.
                    </p>
                </div>
            </div>

            <div className="container-custom max-w-7xl mx-auto -mt-24 relative z-10 px-6 md:px-8">
                {/* Search Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 dark:border-slate-700">
                        {['flights', 'hotels', 'trains'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSearchState('idle'); setResults([]); }}
                                className={`flex-1 py-4 text-sm font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${activeTab === tab
                                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {tab === 'flights' && <Plane className="w-5 h-5" />}
                                {tab === 'hotels' && <Hotel className="w-5 h-5" />}
                                {tab === 'trains' && <Train className="w-5 h-5" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <div className="p-8 md:p-12">
                        <form onSubmit={handleSearch} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                                {activeTab === 'flights' && (
                                    <>
                                        <div className="lg:col-span-1">
                                            <LocationInput
                                                label="From"
                                                value={formData.origin}
                                                onChange={(val) => setFormData({ ...formData, origin: val })}
                                                placeholder="City or Airport"
                                                icon={Plane}
                                            />
                                        </div>
                                        <div className="lg:col-span-1">
                                            <LocationInput
                                                label="To"
                                                value={formData.destination}
                                                onChange={(val) => setFormData({ ...formData, destination: val })}
                                                placeholder="City or Airport"
                                                icon={MapPin}
                                            />
                                        </div>
                                        <div className="lg:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Departure</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                                <input type="date" required min={today} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="lg:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Travelers & Class</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                                    <select className="w-full pl-9 pr-2 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                                                        value={formData.travelers} onChange={e => setFormData({ ...formData, travelers: e.target.value })}
                                                    >
                                                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                                                    </select>
                                                </div>
                                                <div className="relative flex-1">
                                                    <select className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 appearance-none text-sm"
                                                        value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })}
                                                    >
                                                        <option>Economy</option>
                                                        <option>Business</option>
                                                        <option>First</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'hotels' && (
                                    <>
                                        <div className="lg:col-span-2">
                                            <LocationInput
                                                label="City, Hotel or Area"
                                                value={formData.destination}
                                                onChange={(val) => setFormData({ ...formData, destination: val })}
                                                placeholder="Where do you want to stay?"
                                                icon={Hotel}
                                            />
                                        </div>
                                        <div className="lg:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Check-in</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                                <input type="date" required min={today} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="lg:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Guests & Rooms</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                                <select className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                                                    value={formData.travelers} onChange={e => setFormData({ ...formData, travelers: e.target.value })}
                                                >
                                                    <option value="1">1 Room, 1 Guest</option>
                                                    <option value="2">1 Room, 2 Guests</option>
                                                    <option value="3">2 Rooms, 4 Guests</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'trains' && (
                                    <>
                                        <div className="lg:col-span-1">
                                            <LocationInput
                                                label="From Station"
                                                value={formData.origin}
                                                onChange={(val) => setFormData({ ...formData, origin: val })}
                                                placeholder="Source Station"
                                                icon={Train}
                                            />
                                        </div>
                                        <div className="lg:col-span-1">
                                            <LocationInput
                                                label="To Station"
                                                value={formData.destination}
                                                onChange={(val) => setFormData({ ...formData, destination: val })}
                                                placeholder="Destination Station"
                                                icon={MapPin}
                                            />
                                        </div>
                                        <div className="lg:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Travel Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                                <input type="date" required min={today} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="lg:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                                <select className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                                                    value={formData.trainClass} onChange={e => setFormData({ ...formData, trainClass: e.target.value })}
                                                >
                                                    <option value="ALL">All Classes</option>
                                                    <option value="1A">AC First Class (1A)</option>
                                                    <option value="2A">AC 2 Tier (2A)</option>
                                                    <option value="3A">AC 3 Tier (3A)</option>
                                                    <option value="SL">Sleeper (SL)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-center pt-2">
                                <button
                                    type="submit"
                                    disabled={searchState === 'searching'}
                                    className="px-12 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-lg rounded-full shadow-xl shadow-primary-600/30 transform hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {searchState === 'searching' ? 'Searching...' : 'SEARCH'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>

            {/* Results Section */}
            <div className="container-custom max-w-7xl mx-auto px-6 md:px-8 mt-16">
                <AnimatePresence>
                    {searchState === 'results' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6 max-w-5xl mx-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    Available {activeTab === 'flights' ? 'Flights' : activeTab === 'hotels' ? 'Hotels' : 'Trains'}
                                </h2>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="recommended">Empferhlung (Recom)</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                    <option value="rating">Top Rated</option>
                                </select>
                            </div>

                            {sortedResults.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all group"
                                >
                                    {/* Flight Card */}
                                    {activeTab === 'flights' && (
                                        <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                                            <div className="flex items-center gap-4 w-full md:w-1/4">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl">
                                                    {item.logo}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.airline}</h3>
                                                    <p className="text-xs text-slate-500">{item.flightNumber}</p>
                                                </div>
                                            </div>

                                            <div className="flex-grow flex items-center justify-center gap-8 w-full md:w-auto text-center">
                                                <div>
                                                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{item.depTime}</div>
                                                    <div className="text-xs text-slate-500">{formData.origin || 'DEL'}</div>
                                                </div>
                                                <div className="flex flex-col items-center w-24">
                                                    <div className="text-xs text-slate-400 mb-1">{item.duration}</div>
                                                    <div className="w-full h-[2px] bg-slate-300 dark:bg-slate-600 relative">
                                                        <div className="absolute right-0 -top-1 w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                                        <div className="absolute left-0 -top-1 w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                                        <Plane className="w-3 h-3 text-primary-500 absolute left-1/2 -top-1.5 -translate-x-1/2" />
                                                    </div>
                                                    <div className="text-xs text-primary-600 font-medium mt-1">{item.stops}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{item.arrTime}</div>
                                                    <div className="text-xs text-slate-500">{formData.destination || 'BOM'}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-1/4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatPrice(item.price)}</div>
                                                    <div className="text-xs text-slate-500">per traveler</div>
                                                </div>
                                                <button onClick={() => handleBook(item)} className="btn btn-primary px-6 py-2">Book</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Hotel Card */}
                                    {activeTab === 'hotels' && (
                                        <div className="flex flex-col md:flex-row">
                                            <div className="md:w-64 h-48 md:h-auto relative">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {item.rating}
                                                </div>
                                            </div>
                                            <div className="p-6 flex-grow flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{item.name}</h3>
                                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" /> {item.location}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {item.amenities.map(am => (
                                                                <span key={am} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{am}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                                        Excellent location • {item.reviews} reviews
                                                    </p>
                                                </div>

                                                <div className="flex items-end justify-between mt-4 text-right">
                                                    <div className="text-left">
                                                        <p className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded inline-block">Free Cancellation</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div>
                                                            <span className="text-sm text-slate-400 line-through mr-2">{formatPrice(Math.round(item.price * 1.2))}</span>
                                                            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatPrice(item.price)}</span>
                                                            <p className="text-xs text-slate-500">per night</p>
                                                        </div>
                                                        <button onClick={() => handleBook(item)} className="btn btn-primary px-6 py-2">Book Place</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Train Card */}
                                    {activeTab === 'trains' && (
                                        <div className="p-6 flex flex-col gap-4">
                                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600">
                                                        <Train className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h3>
                                                        <p className="text-xs text-slate-500">#{item.number} • Runs Daily</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.duration}</div>
                                                    <div className="text-xs text-slate-500">Duration</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-8">
                                                    <div>
                                                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.depTime}</div>
                                                        <div className="text-xs text-slate-500">{formData.origin || 'Source'}</div>
                                                    </div>
                                                    <div className="flex items-center text-slate-300">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.arrTime}</div>
                                                        <div className="text-xs text-slate-500">{formData.destination || 'Dest'}</div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    {['1A', '2A', '3A', 'SL'].map(cls => (
                                                        <button
                                                            key={cls}
                                                            onClick={() => handleBook({ ...item, class: cls })}
                                                            className={`px-3 py-2 rounded-lg border text-sm text-center min-w-[80px] hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors ${item.class === cls ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-700'}`}
                                                        >
                                                            <div className="font-bold text-slate-900 dark:text-slate-100">{cls}</div>
                                                            <div className="text-xs text-slate-500">
                                                                {formatPrice(cls === '1A' ? item.price * 3 : cls === '2A' ? item.price * 2 : cls === '3A' ? Math.round(item.price * 1.5) : item.price)}
                                                            </div>
                                                            <div className={`text-[10px] mt-1 ${item.seats > 10 ? 'text-green-600' : 'text-orange-500'}`}>
                                                                AVL {Math.max(2, item.seats - (['1A', '2A'].includes(cls) ? 20 : 0))}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
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
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-500 animate-bounce">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Booking Confirmed!</h2>
                            <p className="text-slate-500 text-center mb-6">Your ticket has been sent to your email.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Bookings;
