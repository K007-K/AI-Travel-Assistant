/**
 * DayExpenseSummary — Daily cost breakdown card using orchestrator data
 *
 * Extracted from ItineraryBuilder to reduce monolith size.
 */

import { Wallet } from 'lucide-react';
import { Card } from '../../ui/Card';

const DayExpenseSummary = ({
    activeDay,
    trip,
    storeDailySummary,
    activeCurrencySymbol,
}) => {
    const dayNum = activeDay?.dayNumber;
    const orchSummary = storeDailySummary?.find(s => s.day_number === dayNum);

    let dayTotal, activityCost, transportCost, accomCost;

    if (orchSummary) {
        dayTotal = orchSummary.total || orchSummary.total_day_cost || 0;
        activityCost = orchSummary.activity_cost || 0;
        transportCost = (orchSummary.transport_cost || orchSummary.travel_cost || 0) + (orchSummary.local_transport_cost || 0);
        accomCost = orchSummary.accommodation_cost || orchSummary.stay_cost || 0;
    } else {
        const acts = activeDay?.activities || [];
        const costSegments = acts.filter(a => !a.isGem);
        dayTotal = costSegments.reduce((s, a) => s + (a.estimated_cost || 0), 0);
        activityCost = costSegments.filter(a => !a.isLogistics).reduce((s, a) => s + (a.estimated_cost || 0), 0);
        transportCost = costSegments.filter(a => a.segmentType === 'outbound_travel' || a.segmentType === 'return_travel' || a.segmentType === 'intercity_travel' || a.segmentType === 'local_transport').reduce((s, a) => s + (a.estimated_cost || 0), 0);
        accomCost = costSegments.filter(a => a.segmentType === 'accommodation').reduce((s, a) => s + (a.estimated_cost || 0), 0);
    }

    const dailyBudget = trip.budget && trip.days.length ? Math.round(trip.budget / trip.days.length) : 0;
    if (dayTotal === 0 && dailyBudget === 0) return null;
    const pct = dailyBudget > 0 ? Math.min(100, Math.round((dayTotal / dailyBudget) * 100)) : 0;
    const isOver = dayTotal > dailyBudget && dailyBudget > 0;

    return (
        <Card className="mt-6 border-primary/20 bg-primary/5">
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Day {activeDay?.dayNumber} Expenses</h4>
                            <p className="text-xs text-muted-foreground">{orchSummary ? 'AI estimated (per person)' : 'Estimated total (per person)'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${isOver ? 'text-destructive' : 'text-primary'}`}>
                            {activeCurrencySymbol}{dayTotal.toLocaleString()}
                        </div>
                        {dailyBudget > 0 && (
                            <p className="text-xs text-muted-foreground">
                                of {activeCurrencySymbol}{dailyBudget.toLocaleString()} daily budget
                            </p>
                        )}
                    </div>
                </div>
                {/* Progress bar */}
                {dailyBudget > 0 && (
                    <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${isOver ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                    </div>
                )}
                {/* Category breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-background rounded-xl p-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Activities</p>
                        <p className="text-sm font-semibold text-foreground">{activeCurrencySymbol}{activityCost.toLocaleString()}</p>
                    </div>
                    <div className="bg-background rounded-xl p-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Transport</p>
                        <p className="text-sm font-semibold text-teal-600">{activeCurrencySymbol}{transportCost.toLocaleString()}</p>
                    </div>
                    <div className="bg-background rounded-xl p-2.5">
                        <p className="text-xs text-muted-foreground mb-0.5">Stay</p>
                        <p className="text-sm font-semibold text-indigo-600">{activeCurrencySymbol}{accomCost.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default DayExpenseSummary;
