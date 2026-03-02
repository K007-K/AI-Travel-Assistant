/**
 * HiddenGemsPanel — Sidebar card showing AI-discovered hidden gems
 *
 * Extracted from ItineraryBuilder to reduce monolith size.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Sun, PlusCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';

const HiddenGemsPanel = ({
    storeHiddenGems,
    isLoadingGems,
    addedGemTitles,
    activeCurrencySymbol,
    selectedDay,
    onAddGem,
}) => {
    return (
        <Card className="rounded-3xl border-border flex flex-col max-h-[calc(100vh-25rem)]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sun className="w-5 h-5 text-yellow-500" /> Hidden Gems
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingGems && (
                    <div className="text-center py-4 text-muted-foreground text-sm">Loading gems…</div>
                )}
                <AnimatePresence>
                    {storeHiddenGems
                        .filter(gem => !addedGemTitles.has(gem.title))
                        .map((gem) => (
                            <motion.div
                                key={gem.title}
                                initial={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                                className="p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors shrink-0"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-medium text-foreground mb-1.5">{gem.title}</h4>
                                    <button
                                        onClick={() => onAddGem(gem)}
                                        className="shrink-0 p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                        title={`Add to Day ${selectedDay?.replace('day-', '') || '1'}`}
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{gem.description}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {gem.category && (
                                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">{gem.category}</span>
                                    )}
                                    {gem.best_time && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{gem.best_time}</span>
                                    )}
                                    {gem.estimated_cost > 0 && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                            {activeCurrencySymbol}{gem.estimated_cost}
                                        </span>
                                    )}
                                    {gem.estimated_cost === 0 && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Free</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default HiddenGemsPanel;
