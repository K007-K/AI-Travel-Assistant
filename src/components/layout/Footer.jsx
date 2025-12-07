import { Link } from 'react-router-dom';
import { Plane, Facebook, Twitter, Instagram, Mail } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        product: [
            { name: 'Features', path: '/#features' },
            { name: 'Pricing', path: '/#pricing' },
            { name: 'Destinations', path: '/discover' },
        ],
        company: [
            { name: 'About', path: '/about' },
            { name: 'Blog', path: '/blog' },
            { name: 'Careers', path: '/careers' },
        ],
        support: [
            { name: 'Help Center', path: '/help' },
            { name: 'Privacy', path: '/privacy' },
            { name: 'Terms', path: '/terms' },
        ],
    };

    return (
        <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
                                <Plane className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-display font-bold gradient-text">
                                TravelAI
                            </span>
                        </Link>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm">
                            Your AI-powered travel companion. Plan, explore, and experience the world with confidence.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Mail].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-primary-500 dark:hover:bg-primary-500 hover:text-white transition-all transform hover:scale-110"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Sections */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 capitalize">
                                {title}
                            </h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.path}>
                                        <Link
                                            to={link.path}
                                            className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400">
                    <p>&copy; {currentYear} TravelAI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
