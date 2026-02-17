/**
 * SegmentCard — Individual activity/segment card within the reorderable list
 *
 * Extracted from ItineraryBuilder to reduce monolith size.
 */

import { Reorder } from 'framer-motion';
import {
    GripVertical, CheckCircle2, Circle, Clock, MapPin, Trash2, AlertCircle,
} from 'lucide-react';
import { Card } from '../../ui/Card';

const ACTIVITY_TYPES = [
    { value: 'sightseeing', label: 'Sightseeing', icon: null, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
];

const SegmentCard = ({
    activity,
    typeInfo,
    isLogistics,
    isFocused,
    activeCurrencySymbol,
    storeBookingOptions,
    onFocus,
    onToggleComplete,
    onDelete,
}) => {
    const Icon = typeInfo.icon;

    return (
        <Reorder.Item value={activity} className="relative" dragListener={!isLogistics}>
            <Card
                className={`border hover:border-primary/50 transition-all cursor-pointer ${isFocused ? 'border-primary ring-2 ring-primary/20 shadow-md' : ''} ${activity.safety_warning ? 'border-l-4 border-l-destructive' : ''} ${isLogistics ? 'border-l-4 border-l-teal-500 bg-teal-50/30 dark:bg-teal-900/10' : ''}`}
                onClick={onFocus}
            >
                <div className="p-5 flex items-start gap-4">
                    {!isLogistics && <div className="mt-2 text-muted-foreground/50 cursor-grab hover:text-foreground"><GripVertical className="w-5 h-5" /></div>}
                    {!isLogistics && (
                        <button onClick={onToggleComplete} className={activity.isCompleted ? 'text-green-500 mt-2' : 'text-muted-foreground/50 mt-2 hover:text-muted-foreground transition-colors'}>
                            {activity.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>
                    )}
                    <div className={`p-3 rounded-xl ${typeInfo.color}`}><Icon className="w-5 h-5" /></div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className={`font-semibold text-lg ${activity.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{activity.title}</h3>
                            <div className="flex items-center gap-3">
                                {activity.estimated_cost > 0 && (
                                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                        {activeCurrencySymbol}{activity.estimated_cost.toLocaleString()}
                                    </span>
                                )}
                                {!isLogistics && (
                                    <button onClick={onDelete} className="p-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </div>
                        </div>
                        {activity.safety_warning && <p className="text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {activity.safety_warning}</p>}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            {!isLogistics && <span className="flex gap-1 items-center bg-muted px-2 py-1 rounded text-xs"><Clock className="w-3 h-3" /> {activity.time}</span>}
                            {activity.location && <span className="flex gap-1 items-center"><MapPin className="w-3 h-3" /> {activity.location}</span>}
                            <span className="px-2 py-1 rounded bg-muted text-xs font-medium uppercase">{typeInfo.label}</span>
                        </div>
                        {activity.notes && <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-xl">{activity.notes}</p>}
                    </div>
                </div>
            </Card>
            {/* Booking Options */}
            {activity.segmentId && storeBookingOptions?.[activity.segmentId] && (
                <div className="mx-5 mb-4 -mt-1">
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {storeBookingOptions[activity.segmentId].options?.map((opt, oi) => (
                            <div key={oi} className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs ${opt.tag === 'Upgrade Available'
                                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                                : opt.tag === 'Best'
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border bg-muted/30'
                                }`}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="font-medium text-foreground">{opt.provider}</span>
                                    {opt.tag && (
                                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${opt.tag === 'Upgrade Available'
                                            ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200'
                                            : 'bg-primary/20 text-primary'
                                            }`}>{opt.tag}</span>
                                    )}
                                </div>
                                <span className="text-muted-foreground">{activeCurrencySymbol}{(opt.estimated_price || 0).toLocaleString()}</span>
                                {opt.rating && <span className="ml-1 text-yellow-600">★{opt.rating}</span>}
                            </div>
                        ))}
                    </div>
                    {storeBookingOptions[activity.segmentId].demo_label && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Demo booking data</p>
                    )}
                </div>
            )}
        </Reorder.Item>
    );
};

export default SegmentCard;
