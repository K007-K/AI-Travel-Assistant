import { useState, useEffect, useRef } from 'react';
import { MapPin, Building2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { geocodeSearch } from '../../api/geocode';

const LocationInput = ({
    label,
    value,
    onChange,
    placeholder = "City or Airport",
    // eslint-disable-next-line no-unused-vars
    icon: Icon = MapPin,
    className = "",
    variant = "default" // "default" | "glass" | "minimalist"
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
            const data = await geocodeSearch(query, 5);

            const formatted = data.map(item => {
                // Extract meaningful parts
                const city = item.address?.city || item.address?.town || item.address?.village || item.name;
                const country = item.address?.country;
                const state = item.address?.state;

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
            console.warn("Location search failed:", error.message);
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
                <div className={`absolute left-0 top-0 bottom-0 flex items-center justify-center ${variant === 'glass' ? 'w-14' : variant === 'minimalist' ? 'w-12' : 'w-12'}`}>
                    <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className={`w-full outline-none transition-all ${
                        variant === 'glass' 
                        ? "bg-white/40 dark:bg-black/40 border border-white/40 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-white/70 backdrop-blur-2xl rounded-[2.5rem] focus:bg-white/60 dark:focus:bg-black/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] py-5 pl-14 pr-10 text-lg"
                        : variant === 'minimalist'
                        ? "pl-12 pr-10 py-4 bg-transparent border border-slate-200 dark:border-slate-800 rounded-full focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-slate-100 placeholder-slate-400 hover:shadow-sm focus:shadow-md transition-shadow"
                        : "pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    }`}
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
                        className={`absolute z-50 left-0 right-0 mt-2 rounded-xl shadow-xl border max-h-60 overflow-y-auto scrollbar-thin ${
                            variant === 'glass'
                            ? "bg-white/95 dark:bg-[#141414]/95 backdrop-blur-xl border-white/20 dark:border-white/10"
                            : variant === 'minimalist'
                            ? "bg-white dark:bg-[#0a0a0a] border-slate-100 dark:border-slate-800 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]"
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                        }`}
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
