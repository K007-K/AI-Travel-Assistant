import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Train, Calendar, MapPin, Search, Download, Clock } from 'lucide-react';
import useBookingStore from '../store/bookingStore';
import DemoBanner from '../components/ui/DemoBanner';

const MyBookings = () => {
    const { bookings, fetchBookings, isLoading } = useBookingStore();
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const filteredBookings = activeTab === 'all'
        ? bookings
        : bookings.filter(b => b.type === activeTab.slice(0, -1)); // flights -> flight

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const handleDownload = async (booking) => {
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const d = booking.details || {};
            const traveler = d.traveler || {};
            // Sanitize: formatting helper to prevent PDF corruption from Emojis
            const cleanText = (str) => {
                if (!str) return '';
                // Remove non-printable ASCII characters and Emojis
                return String(str).replace(/[^\x20-\x7E]/g, '');
            };

            const type = cleanText(booking.type || 'Trip').toUpperCase();

            // --- Styles & Constants ---
            const primaryColor = [37, 99, 235]; // Blue
            const secondaryColor = [100, 116, 139]; // Slate
            const pageMargin = 20;
            let y = 20; // Cursor

            const addLine = (label, value) => {
                if (!value) return;
                doc.setFontSize(10);
                doc.setTextColor(...secondaryColor);
                doc.text(`${cleanText(label)}:`, pageMargin, y);

                doc.setFontSize(11);
                doc.setTextColor(0, 0, 0);
                const textValue = cleanText(value);
                doc.text(textValue, pageMargin + 40, y);
                y += 8;
            };

            const addSectionHeader = (title) => {
                y += 5;
                doc.setFillColor(241, 245, 249);
                doc.rect(pageMargin - 5, y - 6, 180, 10, 'F');
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.text(cleanText(title), pageMargin, y);
                doc.setFont("helvetica", "normal");
                y += 12;
            };

            // --- Ticket Header ---
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text('Roameo Ticket', pageMargin, 26);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`PNR: ${cleanText(d.pnr || booking.id.slice(0, 8).toUpperCase())}`, 150, 20);
            doc.text(`Status: ${cleanText(booking.status).toUpperCase()}`, 150, 28);
            doc.text(`Date: ${cleanText(new Date().toLocaleDateString())}`, 150, 36);

            y = 60;

            // --- Itinerary Section ---
            addSectionHeader(`${type} DETAILS`);

            // Title (Airline/Hotel Name)
            doc.setFontSize(16);
            doc.setTextColor(...primaryColor);
            doc.text(cleanText(d.title || d.name || 'Trip Details'), pageMargin, y);
            y += 10;

            if (booking.type === 'flight') {
                addLine('Flight Details', d.subtitle);
                addLine('Flight No', d.flightNumber || 'N/A');
                addLine('Departure', d.depTime || 'N/A');
                addLine('Arrival', d.arrTime || 'N/A');
                addLine('Duration', d.duration || 'N/A');
                addLine('Class', d.class || 'Economy');
            } else if (booking.type === 'hotel') {
                addLine('Location', d.location || 'City Center');
                addLine('Check-in', formatDate(booking.date));
                // Calculate Check-out if duration available, else just N/A for now
                addLine('Rating', d.rating ? `${d.rating} Stars` : 'N/A');
                addLine('Room Type', d.class || 'Standard');
                if (d.amenities) addLine('Amenities', Array.isArray(d.amenities) ? d.amenities.join(', ') : 'N/A');
            } else if (booking.type === 'train') {
                addLine('Train Info', d.subtitle);
                addLine('Train Number', d.number);
                addLine('Departure', d.depTime);
                addLine('Arrival', d.arrTime);
                addLine('Class', d.class);
                addLine('Seat', d.seats ? `Avl: ${d.seats}` : 'Confirmed');
            } else {
                addLine('Description', d.subtitle);
            }

            // --- Passenger Section ---
            y += 4;
            addSectionHeader('PASSENGER INFO');
            addLine('Traveler', `${traveler.firstName || ''} ${traveler.lastName || ''}`);
            addLine('Email', traveler.email);
            addLine('Phone', traveler.phone);

            // --- Payment Section ---
            y += 4;
            addSectionHeader('PAYMENT');

            if (d.addons) {
                if (d.addons.insurance) addLine('Add-on', 'Travel Insurance');
                if (d.addons.meal) addLine('Add-on', 'Meal Upgrade');
            }

            const symbol = d.currency === 'INR' ? 'Rs.' : '$';

            // Total Box
            y += 5;
            doc.setDrawColor(200);
            doc.setLineWidth(0.5);
            doc.line(pageMargin, y, 190, y);
            y += 10;

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text('Total Amount Paid', pageMargin, y);
            doc.setTextColor(...primaryColor);
            doc.text(`${symbol} ${Math.round(booking.price).toLocaleString()}`, 150, y);

            // Footer
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(150);
            doc.text('Roameo AI Travel - Computer Generated Ticket', pageMargin, 280);

            doc.save('ticket.pdf');
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate ticket. Please try again.");
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-[#0a0a0a] px-4 transition-colors duration-300">
            <div className="container-custom max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-slate-100 mb-2">My Bookings</h1>
                        <p className="text-slate-500">Manage your trips and download tickets</p>
                    </div>
                </div>

                <DemoBanner message="Demo Mode – Bookings and PNR numbers shown here are simulated." />

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                    {['all', 'flights', 'hotels', 'trains'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                : 'bg-white dark:bg-white/[0.03] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading your journeys...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/[0.03] rounded-3xl border border-slate-100 dark:border-slate-700">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Search className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No bookings found</h3>
                        <p className="text-slate-500">You haven't made any bookings in this category yet.</p>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {filteredBookings.map((booking) => (
                            <motion.div
                                key={booking.id}
                                variants={item}
                                className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow group"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">

                                        {/* Icon & Title */}
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${booking.type === 'flight' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                booking.type === 'hotel' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                                    'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                                }`}>
                                                {booking.type === 'flight' && <Plane className="w-6 h-6" />}
                                                {booking.type === 'hotel' && <Hotel className="w-6 h-6" />}
                                                {booking.type === 'train' && <Train className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${booking.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                    <span className="text-xs text-slate-400">#{booking.details?.pnr || 'N/A'}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                    {booking.details?.title || booking.type}
                                                </h3>
                                                <p className="text-slate-500 text-sm">
                                                    {booking.details?.subtitle || 'Trip Details'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Specific Details */}
                                        <div className="flex items-center gap-8 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(booking.date)}</span>
                                            </div>
                                            {booking.details?.traveler && (
                                                <div className="hidden md:block">
                                                    <p className="text-xs text-slate-400 uppercase font-semibold">Traveler</p>
                                                    <p className="font-medium">{booking.details.traveler.firstName} {booking.details.traveler.lastName}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6 justify-between md:justify-end w-full md:w-auto">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Total Amount</p>
                                                <p className="text-xl font-bold text-primary-600">
                                                    {booking.details?.currency === 'INR' ? '₹' : '$'}
                                                    {Math.round(booking.price).toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(booking)}
                                                className="btn btn-outline p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                                                title="Download Ticket"
                                            >
                                                <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details (Optional - keeping simple for now) */}
                                    {(booking.details?.addons?.insurance || booking.details?.addons?.meal) && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-4">
                                            {booking.details.addons.insurance && (
                                                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                                                    🛡️ Insurance Added
                                                </span>
                                            )}
                                            {booking.details.addons.meal && (
                                                <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded flex items-center gap-1">
                                                    🍱 Meal Included
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
