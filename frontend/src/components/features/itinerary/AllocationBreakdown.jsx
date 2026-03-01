/**
 * AllocationBreakdown — Budget allocation sidebar card
 *
 * Extracted from ItineraryBuilder to reduce monolith size.
 */

import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';

const AllocationBreakdown = ({ storeAllocation, activeCurrencySymbol }) => {
    if (!storeAllocation) return null;

    return (
        <Card className="rounded-3xl border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-primary" /> Budget Allocation
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
                {[
                    { label: 'Intercity Travel', value: storeAllocation.intercity, color: 'bg-teal-500' },
                    { label: 'Accommodation', value: storeAllocation.accommodation, color: 'bg-indigo-500' },
                    { label: 'Activities', value: storeAllocation.activity, color: 'bg-primary' },
                    { label: 'Local Transport', value: storeAllocation.local_transport, color: 'bg-amber-500' },
                    { label: 'Buffer', value: storeAllocation.buffer, color: 'bg-muted-foreground' },
                    ...(storeAllocation.upgrade_pool ? [{ label: 'Upgrade Pool', value: storeAllocation.upgrade_pool, color: 'bg-amber-400' }] : []),
                ].map((item, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium text-foreground">{activeCurrencySymbol}{(item.value || 0).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(storeAllocation.total || storeAllocation.total_budget) > 0 ? Math.round(((item.value || 0) / (storeAllocation.total || storeAllocation.total_budget)) * 100) : 0}%` }} />
                        </div>
                    </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between text-xs font-semibold">
                    <span>Total Budget</span>
                    <span>{activeCurrencySymbol}{(storeAllocation.total || storeAllocation.total_budget || 0).toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default AllocationBreakdown;
