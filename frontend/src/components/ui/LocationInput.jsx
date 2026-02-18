import { useState, useEffect, useRef } from 'react';
import { MapPin, Building2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LocationInput = ({
    label,
    value,
    onChange,
    placeholder = "City or Airport",
    icon: _Icon = MapPin,
    className = ""
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

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

    const fetchLocations = async (query) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
                { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
            );

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            const formatted = data.map(item => {
                // Extract meaningful parts
                const city = item.address.city || item.address.town || item.address.village || item.name;
                const country = item.address.country;
                const state = item.address.state;

                return {
                    displayName: item.display_name,
                    city: city,
                    subtitle: [state, country].filter(Boolean).join(', '),
                    lat: item.lat,
                    lon: item.lon
                };
            });

            setSuggestions(formatted);
            setIsOpen(true);
        } catch (error) {
            console.error("Location search failed:", error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const query = e.target.value;
        onChange(query);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length > 2) {
            debounceRef.current = setTimeout(() => {
                fetchLocations(query);
            }, 500); // 500ms debounce
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (location) => {
        // Just use the main city/name for the input value to keep it clean
        // But we could pass the full object if onChange supported it
        onChange(location.displayName.split(',')[0]);
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
                {isLoading && (
                    <div className="absolute right-3 top-3">
                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    </div>
                )}
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
                                key={`${loc.lat}-${idx}`}
                                onClick={() => handleSelect(loc)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                            >
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 shrink-0">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                        {loc.displayName.split(',')[0]}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {loc.subtitle || loc.displayName}
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
