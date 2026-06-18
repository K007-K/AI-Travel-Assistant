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
        <Reorder.Item value={activity} className="relative pl-8 sm:pl-12 pb-6 group/item" dragListener={!isLogistics}>
            {/* Timeline Vertical Line */}
            <div className="absolute left-[19px] top-4 bottom-[-1rem] w-px bg-border group-last/item:bottom-auto group-last/item:h-[calc(100%-1.5rem)]" />
            
            {/* Timeline Node */}
            <div className={`absolute left-[15px] top-8 w-[9px] h-[9px] rounded-full z-10 transition-colors ${activity.isCompleted ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground/30 ring-4 ring-background'}`} />

            <div 
                className={`group/card flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer border border-transparent hover:bg-muted/40 hover:border-border/50 ${isFocused ? 'bg-muted/40 border-border/80 shadow-sm' : ''} ${activity.safety_warning ? 'bg-red-50/50 dark:bg-red-900/10' : ''} ${isLogistics ? 'bg-teal-50/20 dark:bg-teal-900/10' : ''}`}
                onClick={onFocus}
            >
                {/* Actions column (Drag/Check) */}
                <div className="flex flex-col gap-3 items-center pt-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    {!isLogistics && <div className="text-muted-foreground/30 cursor-grab hover:text-foreground"><GripVertical className="w-4 h-4" /></div>}
                    {!isLogistics && (
                        <button onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} className={activity.isCompleted ? 'text-primary' : 'text-muted-foreground/30 hover:text-primary transition-colors'}>
                            {activity.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-grow pt-0.5">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className={`font-semibold text-[1.05rem] tracking-tight leading-snug ${activity.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{activity.title}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
                                {!isLogistics && <span className="font-medium text-foreground/80">{activity.time}</span>}
                                {activity.location && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {activity.location}</span>}
                                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                                    <Icon className="w-3 h-3" /> {typeInfo.label}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                            {activity.estimated_cost > 0 && (
                                <span className="text-sm font-semibold text-primary/80 bg-primary/5 px-2.5 py-1 rounded-lg">
                                    {activeCurrencySymbol}{activity.estimated_cost.toLocaleString()}/pp
                                </span>
                            )}
                            {!isLogistics && (
                                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 opacity-0 group-hover/card:opacity-100 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            )}
                        </div>
                    </div>
                    {activity.safety_warning && <p className="text-xs font-medium text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {activity.safety_warning}</p>}
                    {activity.notes && <p className="mt-3 text-[0.9rem] text-slate-500 dark:text-slate-400 leading-relaxed">{activity.notes}</p>}
                </div>
            </div>
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
