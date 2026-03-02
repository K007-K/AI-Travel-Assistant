import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Bot, Languages, Map, Wallet, Brain, AlertTriangle, Utensils, Cpu, ArrowRight,
    Activity, Network, Settings
} from 'lucide-react';

// Enhanced Feature Data with Direct Routing Links
const AI_FEATURES = [
    // CORE INTELLIGENCE
    {
        id: 'core-chat',
        title: 'Core AI Chat',
        desc: 'Ask anything or route complex tasks to specialized agents.',
        models: 'Mixtral | Llama 3',
        agents: 3,
        icon: <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
        link: '/ai/chat',
        primary: true,
        category: 'Core Intelligence',
        capabilities: 'Context · Reasoning · Tools',
        agentChain: 'Router → Planner → Generator'
    },
    // TRAVEL TOOLS
    {
        id: 'live-translate',
        title: 'Live Translation',
        desc: 'Real-time translation with cultural nuance explanation.',
        models: 'Mixtral | Groq',
        agents: 2,
        icon: <Languages className="w-6 h-6 text-indigo-500" />,
        link: '/ai/translate',
        category: 'Travel Tools',
        capabilities: 'Text · Voice · Context',
        agentChain: 'Transcriber → Translator'
    },
    {
        id: 'emergency-help',
        title: 'Emergency Help',
        desc: 'Immediate, step-by-step safety and medical guidance.',
        models: 'Mixtral (Safety Tuned)',
        agents: 2,
        icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
        link: '/ai/emergency',
        category: 'Travel Tools',
        capabilities: 'Safety · Protocols · SOS',
        agentChain: 'Monitor → Advisor'
    },
    {
        id: 'food-discovery',
        title: 'Food Discovery',
        desc: 'Curated dining recommendations based on diet & budget.',
        models: 'Mixtral | Groq',
        agents: 2,
        icon: <Utensils className="w-6 h-6 text-amber-500" />,
        link: '/ai/food',
        category: 'Travel Tools',
        capabilities: 'Search · Filtering · Reviews',
        agentChain: 'Finder → Ranker'
    },
];

const CATEGORIES = [
    'Core Intelligence',
    'Travel Tools',
];

const AICenter = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] relative pb-20 transition-colors duration-300">
            {/* 1. STATUS STRIP */}
            <div className="w-full bg-slate-900 dark:bg-black border-b border-slate-800 dark:border-white/[0.06] py-1.5 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-medium text-slate-400">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-400" />
                            <span className="text-slate-300">AI Status: Active</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <Network className="w-3 h-3 text-blue-400" />
                            <span>Multi-Agent System Enabled</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-12 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
                            AI Control Center
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg">
                            Orchestrate your travel with specialized AI agents.
                            <br className="hidden md:block" />
                            Select a tool to launch its dedicated workspace.
                        </p>
                    </motion.div>
                </div>

                {/* Grouped Grid */}
                <div className="space-y-12">
                    {CATEGORIES.map((category, catIndex) => {
                        const features = AI_FEATURES.filter(f => f.category === category);
                        if (features.length === 0) return null;

                        return (
                            <div key={category}>
                                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 border-l-2 border-blue-500 dark:border-blue-400 pl-3">
                                    {category}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {features.map((feature, index) => (
                                        <FeatureCard
                                            key={feature.id}
                                            feature={feature}
                                            index={index + (catIndex * 4)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Feature Card Sub-component
const FeatureCard = ({ feature, index }) => {
    return (
        <Link to={feature.link} className="block h-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
                whileTap={{ scale: 0.98 }}
                className={`group relative bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/30 transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer ${feature.primary ? 'ring-1 ring-blue-500/20' : ''}`}
            >
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-white/[0.05] group-hover:bg-slate-100 dark:group-hover:bg-white/[0.08] transition-colors ${feature.primary ? 'bg-blue-50 dark:bg-blue-500/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20' : ''}`}>
                            {feature.icon}
                        </div>
                        {feature.primary ? (
                            <span className="px-2 py-1 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider rounded-md shadow-sm">
                                Start Here
                            </span>
                        ) : (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/[0.05] px-2 py-1 rounded">
                                {feature.agents} AGENTS
                            </div>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {feature.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed flex-1">
                        {feature.desc}
                    </p>

                    <div className="mb-5 px-3 py-2 bg-slate-50 dark:bg-white/[0.04] rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Settings className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {feature.capabilities}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-auto">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-4 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            <span className="truncate max-w-[65%]">
                                {feature.models}
                            </span>

                            <div className="hidden group-hover:flex items-center text-[10px] text-blue-600 dark:text-blue-400 font-bold transition-all">
                                {feature.agentChain}
                            </div>
                        </div>

                        <div
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${feature.primary ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 shadow-md' : 'bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/[0.12]'}`}
                        >
                            Open Workspace
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${feature.primary ? 'from-blue-500 to-indigo-500' :
                    feature.title.includes('Emergency') ? 'from-red-500 to-orange-500' :
                        feature.title.includes('Food') ? 'from-amber-500 to-orange-500' :
                            'from-slate-400 to-slate-600'
                    }`}></div>
            </motion.div>
        </Link>
    );
};

export default AICenter;
