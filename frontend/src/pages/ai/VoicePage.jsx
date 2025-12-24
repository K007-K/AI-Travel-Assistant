import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { AIPageLayout } from './components/AIPageLayout';

export const VoicePage = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    // Simulate listening
    useEffect(() => {
        let interval;
        if (isListening) {
            setTranscript('');
            const phrases = ["Planning trip to Paris...", "How is the weather?", "Find hotels near Eiffel Tower..."];
            let i = 0;
            interval = setInterval(() => {
                setTranscript(phrases[i % phrases.length]);
                i++;
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isListening]);

    return (
        <AIPageLayout
            title="Voice Assistant"
            subtitle="Hands-free travel planning and advice."
            icon={<Mic className="w-6 h-6" />}
            color="pink"
        >
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-10">
                <div className="relative mb-12">
                    {isListening && (
                        <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 bg-pink-400 rounded-full"
                        />
                    )}
                    <button
                        onClick={() => setIsListening(!isListening)}
                        className={`relative z-10 w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${isListening ? 'bg-gradient-to-br from-pink-500 to-rose-600 scale-105' : 'bg-white hover:bg-slate-50'}`}
                    >
                        {isListening ? (
                            <div className="flex items-center gap-1.5 h-10">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [10, 50, 10] }}
                                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                        className="w-2 bg-white rounded-full"
                                    />
                                ))}
                            </div>
                        ) : (
                            <Mic className="w-16 h-16 text-slate-800" />
                        )}
                    </button>
                </div>

                <h2 className={`text-4xl font-bold mb-4 transition-colors ${isListening ? 'text-pink-600' : 'text-slate-300'}`}>
                    {isListening ? 'Listening...' : 'Tap to Speak'}
                </h2>

                <p className="text-xl text-slate-500 max-w-md text-center h-20 transition-all">
                    {isListening ? `"${transcript}"` : 'Try saying "Find me a cheap flight to Tokyo" or "What is the currency in Thailand?"'}
                </p>
            </div>
        </AIPageLayout>
    );
};
