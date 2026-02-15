import { Link } from 'react-router-dom';
import { Plane, Github, Twitter, Instagram, Mail } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        explore: [
            { name: 'Discover Destinations', path: '/discover' },
            { name: 'AI Travel Planner', path: '/ai' },
            { name: 'Features', path: '/#features' },
        ],
        tools: [
            { name: 'My Trips', path: '/my-trips' },
            { name: 'Bookings', path: '/bookings' },
            { name: 'Budget Tracker', path: '/budget' },
            { name: 'Translator', path: '/ai/translate' },
        ],
        company: [
            { name: 'About', path: '/about' },
            { name: 'Sign Up', path: '/signup' },
            { name: 'Log In', path: '/login' },
        ],
    };

    const sectionTitles = {
        explore: 'Explore',
        tools: 'Travel Tools',
        company: 'Account',
    };

    return (
        <footer className="bg-slate-100 dark:bg-[#0a0a0a] border-t border-slate-200 dark:border-white/[0.06]">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500">
                                <Plane className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-display font-bold text-slate-900 dark:text-white">
                                ROAMEO
                            </span>
                        </Link>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm">
                            Your AI-powered travel companion. Plan itineraries, book flights & hotels, track budgets, and explore the world — all in one place.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://github.com/K007-K/AI-Travel-Assistant"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-slate-200 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 hover:bg-blue-500 dark:hover:bg-blue-500 hover:text-white transition-all duration-300 hover:scale-110"
                                aria-label="GitHub"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="mailto:support@roameo.app"
                                className="p-2.5 rounded-xl bg-slate-200 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 hover:bg-blue-500 dark:hover:bg-blue-500 hover:text-white transition-all duration-300 hover:scale-110"
                                aria-label="Email"
                            >
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links Sections */}
                    {Object.entries(footerLinks).map(([key, links]) => (
                        <div key={key}>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                {sectionTitles[key]}
                            </h3>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.path}>
                                        {link.path.startsWith('/#') ? (
                                            <a
                                                href={link.path}
                                                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                                            >
                                                {link.name}
                                            </a>
                                        ) : (
                                            <Link
                                                to={link.path}
                                                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                                            >
                                                {link.name}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/[0.06] text-center">
                    <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-900/20">
                        <p className="text-xs text-amber-800 dark:text-amber-200/80">
                            <strong>AI Disclaimer:</strong> Roameo uses artificial intelligence to generate recommendations. While we strive for accuracy, errors can occur. Please verify critical details like visa requirements and health advisories with official sources.
                        </p>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-500">&copy; {currentYear} Roameo. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
