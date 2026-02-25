/**
 * DurationModal — Trip Duration Feasibility Confirmation
 *
 * Shows when the requested trip duration is infeasible.
 * Displays: explorationDays + travelDaysRequired breakdown.
 * Shows overnight travel tips when applicable.
 */
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, ArrowRight, Bus, Compass, Moon } from 'lucide-react';
import { Button } from './Button';

const DurationModal = ({ result, onConfirm, onEdit, onCancel }) => {
    if (!result || result.feasible) return null;

    const {
        suggestedDays,
        travelDaysRequired,
        explorationDays,
        segments,
        reason,
        overnightCount,
    } = result;

    const hasOvernightOptions = overnightCount > 0;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCancel}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border"
            >
                {/* Header */}
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Additional Days Required</h3>
                        <p className="text-sm text-muted-foreground">
                            {explorationDays} exploration + {travelDaysRequired} travel = {suggestedDays} days
                        </p>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {reason && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{reason}</p>
                    )}

                    {/* Overnight tip */}
                    {hasOvernightOptions && (
                        <div className="flex items-start gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
                            <Moon className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <span className="text-indigo-700 dark:text-indigo-300">
                                <strong>Tip:</strong> {overnightCount} of your routes offer overnight bus/train — travel while you sleep and save days!
                            </span>
                        </div>
                    )}

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                            <Compass className="w-5 h-5 text-primary mx-auto mb-1" />
                            <div className="text-2xl font-bold text-foreground">{explorationDays}</div>
                            <div className="text-xs text-muted-foreground">Exploration Days</div>
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-center">
                            <Bus className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-foreground">{travelDaysRequired}</div>
                            <div className="text-xs text-muted-foreground">Travel Days</div>
                        </div>
                    </div>

                    {/* Route Segments */}
                    {segments && segments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Travel Segments</p>
                            <div className="space-y-1.5">
                                {segments.map((seg, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                                        {seg.canOvernight
                                            ? <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                            : <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        }
                                        <span className="text-foreground font-medium">{seg.from}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-foreground font-medium">{seg.to}</span>
                                        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {seg.hours.toFixed(1)}h
                                            {seg.canOvernight && (
                                                <span className="text-indigo-500 font-medium ml-1">🌙 overnight</span>
                                            )}
                                            {!seg.canOvernight && seg.travelDays > 0 && (
                                                <span className="text-amber-500 font-medium ml-1">+{seg.travelDays}d</span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-muted/30">
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="outline" onClick={onEdit}>
                        ✏️ Edit Trip
                    </Button>
                    <Button onClick={() => onConfirm(suggestedDays)}>
                        ✅ Continue with {suggestedDays} Days
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default DurationModal;
