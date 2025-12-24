import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const AIPageLayout = ({ title, subtitle, icon, color, children }) => (
    <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/ai" className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
                            {icon}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 leading-none">{title}</h1>
                            <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 md:p-12">
                {children}
            </div>
        </div>
    </div>
);
