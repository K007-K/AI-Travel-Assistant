import { useState, useEffect, useRef } from 'react';
import { MapPin, Plane, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data - Top Cities & Airports
const POPULAR_LOCATIONS = [
    { city: "New York", country: "USA", code: "JFK", type: "city" },
    { city: "London", country: "UK", code: "LHR", type: "city" },
    { city: "Paris", country: "France", code: "CDG", type: "city" },
    { city: "Dubai", country: "UAE", code: "DXB", type: "city" },
    { city: "Singapore", country: "Singapore", code: "SIN", type: "city" },
    { city: "Tokyo", country: "Japan", code: "HND", type: "city" },
    { city: "Mumbai", country: "India", code: "BOM", type: "city" },
    { city: "Delhi", country: "India", code: "DEL", type: "city" },
    { city: "Bangalore", country: "India", code: "BLR", type: "city" },
    { city: "Hyderabad", country: "India", code: "HYD", type: "city" },
    { city: "Goa", country: "India", code: "GOI", type: "city" },
    { city: "Bali", country: "Indonesia", code: "DPS", type: "city" },
    { city: "Bangkok", country: "Thailand", code: "BKK", type: "city" },
    { city: "Rome", country: "Italy", code: "FCO", type: "city" },
    { city: "Barcelona", country: "Spain", code: "BCN", type: "city" },
    { city: "Sydney", country: "Australia", code: "SYD", type: "city" },
    { city: "Los Angeles", country: "USA", code: "LAX", type: "city" },
    { city: "San Francisco", country: "USA", code: "SFO", type: "city" },
    { city: "Amsterdam", country: "Netherlands", code: "AMS", type: "city" },
    { city: "Istanbul", country: "Turkey", code: "IST", type: "city" },
    { city: "Kyoto", country: "Japan", code: "UKY", type: "city" },
    { city: "Maldives", country: "Maldives", code: "MLE", type: "city" },
    { city: "Phuket", country: "Thailand", code: "HKT", type: "city" },
    { city: "Santorini", country: "Greece", code: "JTR", type: "city" },
    { city: "Araku Valley", country: "India", code: "ARK", type: "city" }, // Local favorite based on Landing Page
    { city: "Jaipur", country: "India", code: "JAI", type: "city" },
];

const LocationInput = ({
    label,
    value,
    onChange,
    placeholder = "City or Airport",
    icon: Icon = MapPin,
    className = ""
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const query = e.target.value;
        onChange(query);

        if (query.trim().length > 0) {
            const filtered = POPULAR_LOCATIONS.filter(loc =>
                loc.city.toLowerCase().startsWith(query.toLowerCase()) ||
                loc.code.toLowerCase().includes(query.toLowerCase()) ||
                loc.country.toLowerCase().includes(query.toLowerCase())
            );
            setSuggestions(filtered);
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (location) => {
        onChange(`${location.city} (${location.code})`);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && (
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1 block mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <Icon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto scrollbar-thin"
                    >
                        {suggestions.map((loc, idx) => (
                            <button
                                key={`${loc.code}-${idx}`}
                                onClick={() => handleSelect(loc)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                            >
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {loc.city}, {loc.country}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {loc.code} • Popular Destination
                                    </p>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LocationInput;
