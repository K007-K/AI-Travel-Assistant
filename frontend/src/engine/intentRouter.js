/**
 * Intent Router — Rule-based intent classification + deterministic handler routing
 *
 * Each intent maps to a handler that reads real engine state (allocation, reconciliation,
 * dailySummary) and returns a structured response — NOT hallucinated text.
 *
 * Fallback: Groq API with trip context system prompt for ambiguous queries.
 */

import { findEmergencyData } from '../data/emergencyData';

// ── Intent patterns ──────────────────────────────────────────────────

const INTENT_PATTERNS = [
    { intent: 'emergency', pattern: /\b(emergency|help me|police|hospital|embassy|sos|danger|accident|stolen|lost passport|attack)\b/i, priority: 10 },
    { intent: 'budget_inquiry', pattern: /\b(budget|money|cost|spend|afford|how much|remaining|left|envelope|balance)\b/i, priority: 5 },
    { intent: 'add_activity', pattern: /\b(add|include|insert|plan|schedule|book|want to do|can i do|can i go)\b/i, priority: 4 },
    { intent: 'food_search', pattern: /\b(food|eat|restaurant|lunch|dinner|breakfast|cafe|cuisine|meal|hungry|snack|street food)\b/i, priority: 6 },
    { intent: 'upgrade', pattern: /\b(upgrade|premium|better|luxury|suite|first class|vip|deluxe)\b/i, priority: 3 },
    { intent: 'navigation', pattern: /\b(direction|navigate|how to get|route|nearby|where is|distance|map)\b/i, priority: 2 },
    { intent: 'safety', pattern: /\b(safe|safety|dangerous|crime|scam|avoid|warning|risk|precaution)\b/i, priority: 4 },
    { intent: 'weather', pattern: /\b(weather|rain|temperature|cold|hot|humid|forecast|pack|clothing)\b/i, priority: 2 },
];

/**
 * Classify user message into an intent.
 * @param {string} message — User's text input
 * @returns {{ intent: string, confidence: number }}
 */
export function classifyIntent(message) {
    if (!message || message.trim().length === 0) {
        return { intent: 'general', confidence: 0 };
    }

    const matches = INTENT_PATTERNS
        .filter(p => p.pattern.test(message))
        .sort((a, b) => b.priority - a.priority);

    if (matches.length > 0) {
        return { intent: matches[0].intent, confidence: matches.length === 1 ? 0.9 : 0.7 };
    }

    return { intent: 'general', confidence: 0.3 };
}

// ── Deterministic Handlers ───────────────────────────────────────────

/**
 * Handle budget inquiry using real envelope data.
 */
function handleBudgetInquiry(message, context) {
    const { allocation, reconciliation, currency } = context;

    if (!allocation) {
        return {
            text: "No budget data available. Generate an itinerary first to see your budget breakdown.",
            type: 'info',
        };
    }

    const total = allocation.total_budget || 0;
    const used = reconciliation?.total || 0;
    const remaining = total - used;
    const balanced = reconciliation?.balanced !== false;

    const envelopes = [
        { name: 'Intercity Travel', allocated: allocation.intercity, remaining: allocation.intercity_remaining },
        { name: 'Accommodation', allocated: allocation.accommodation, remaining: allocation.accommodation_remaining },
        { name: 'Activities', allocated: allocation.activity, remaining: allocation.activity_remaining },
        { name: 'Local Transport', allocated: allocation.local_transport, remaining: allocation.local_transport_remaining },
    ].filter(e => e.allocated > 0);

    const envelopeLines = envelopes.map(e => {
        const pct = e.allocated > 0 ? Math.round((e.remaining / e.allocated) * 100) : 0;
        const status = pct < 10 ? '⚠️' : pct < 30 ? '🔶' : '✅';
        return `${status} ${e.name}: ${(e.remaining || 0).toLocaleString()} / ${e.allocated.toLocaleString()} ${currency} (${pct}% left)`;
    }).join('\n');

    return {
        text: `**Budget Summary** (${balanced ? '✅ Balanced' : '⚠️ Overshoot'})

💰 **Total:** ${total.toLocaleString()} ${currency}
📊 **Used:** ${used.toLocaleString()} ${currency}
💵 **Remaining:** ${remaining.toLocaleString()} ${currency}

**Envelopes:**
${envelopeLines}`,
        type: 'budget',
        data: { total, used, remaining, balanced, envelopes },
    };
}

/**
 * Handle activity addition request — checks envelope before responding.
 */
function handleAddActivity(message, context) {
    const { allocation, currency } = context;

    if (!allocation) {
        return {
            text: "Generate an itinerary first, then I can help you check if activities fit your budget.",
            type: 'info',
        };
    }

    const activityRemaining = allocation.activity_remaining || 0;
    const perDay = allocation.activity_per_day || 0;

    if (activityRemaining <= 0) {
        return {
            text: `⚠️ **Activity budget exhausted.** No activity budget remaining.

**Options to free up budget:**
1. Remove a lower-priority activity
2. Downgrade accommodation to free up funds
3. Increase your total budget

Current activity allocation: ${allocation.activity?.toLocaleString() || 0} ${currency} (fully used)`,
            type: 'warning',
        };
    }

    return {
        text: `✅ **Activity budget available!**

💰 **Remaining activity budget:** ${activityRemaining.toLocaleString()} ${currency}
📅 **Budget per day:** ~${perDay.toLocaleString()} ${currency}

You can add activities that cost up to **${activityRemaining.toLocaleString()} ${currency}** total. Go to your itinerary and use the "Add Activity" button to add it!`,
        type: 'success',
        data: { activityRemaining, perDay },
    };
}

/**
 * Handle emergency — static data, zero AI.
 */
function handleEmergency(message, context) {
    const { destination } = context;
    const data = findEmergencyData(destination);

    if (!data) {
        return {
            text: `🆘 **Emergency Contacts**

Could not find specific data for "${destination}".

**Universal emergency number (EU):** 112
**International SOS:** +1-215-942-8226

⚠️ Save local emergency numbers before traveling. Check your embassy's website for your destination.`,
            type: 'emergency',
        };
    }

    const lines = [
        `🆘 **Emergency Contacts — ${data.flag} ${data.country}**`,
        '',
        `🚔 **Police:** ${data.police}`,
        `🚑 **Ambulance:** ${data.ambulance}`,
        `🚒 **Fire:** ${data.fire}`,
    ];

    if (data.tourist_helpline) lines.push(`🧳 **Tourist Helpline:** ${data.tourist_helpline}`);
    if (data.tourist_police) lines.push(`👮 **Tourist Police:** ${data.tourist_police}`);
    if (data.women_helpline) lines.push(`👩 **Women's Helpline:** ${data.women_helpline}`);
    if (data.universal) lines.push(`📞 **Universal:** ${data.universal}`);

    lines.push('', '⚠️ *These are verified official numbers. Dial immediately in an emergency.*');

    return {
        text: lines.join('\n'),
        type: 'emergency',
        data,
    };
}

/**
 * Handle food search.
 */
function handleFoodSearch(message, context) {
    const { destination, currentLocation, allocation, currency } = context;
    const loc = currentLocation || destination || 'your destination';
    const dailyBudget = allocation?.activity_per_day || 0;
    const foodBudget = Math.round(dailyBudget * 0.3); // ~30% of daily activity budget for food

    return {
        text: `🍽️ **Food Recommendations near ${loc}**

💰 **Estimated food budget:** ~${foodBudget.toLocaleString()} ${currency}/day (from your activity envelope)

**Tips for ${loc}:**
• Search for highly-rated restaurants on Google Maps near your activities
• Try local street food for authentic and budget-friendly meals
• Ask your hotel/hostel for recommendations — they know the best spots
• Avoid restaurants directly at tourist landmarks (higher prices, lower quality)

🗺️ **Quick search:** Open Google Maps and search "restaurants near me" for real-time options with reviews and prices.`,
        type: 'food',
    };
}

/**
 * Handle upgrade request.
 */
function handleUpgrade(message, context) {
    const { allocation, currency } = context;

    if (!allocation) {
        return { text: "Generate an itinerary first to check upgrade options.", type: 'info' };
    }

    const upgradePool = allocation.upgrade_pool || 0;
    const bufferAvail = allocation.buffer || 0;
    const totalAvail = upgradePool + Math.round(bufferAvail * 0.5); // Can use 50% of buffer

    if (upgradePool > 0) {
        return {
            text: `✨ **Upgrade Pool Available!**

💎 **Upgrade pool:** ${upgradePool.toLocaleString()} ${currency}
🛡️ **Buffer (50% usable):** ${Math.round(bufferAvail * 0.5).toLocaleString()} ${currency}
💰 **Total available for upgrades:** ${totalAvail.toLocaleString()} ${currency}

You can upgrade accommodation or switch to premium transport using your upgrade pool. Check your booking options in the itinerary.`,
            type: 'upgrade',
        };
    }

    return {
        text: `⚠️ **No upgrade pool allocated.**

Your trip is on **${allocation._meta?.budgetTier || 'mid-range'}** tier. Upgrade pools are only available in **luxury** mode.

**Alternative:** You could increase your total budget or free up funds from other envelopes.`,
        type: 'info',
    };
}

/**
 * Handle safety inquiry.
 */
function handleSafety(message, context) {
    const { destination } = context;

    return {
        text: `🛡️ **Safety Tips for ${destination || 'your trip'}**

• **Research** your destination's safety situation before departure
• **Register** with your embassy's traveler program
• **Keep copies** of important documents (passport, insurance, IDs)
• **Share** your itinerary with someone you trust
• **Avoid** carrying large amounts of cash
• **Use** official taxis and verified tour operators
• **Be aware** of common tourist scams in the area

📱 Check your country's travel advisory website for up-to-date safety information.

Type **"emergency"** if you need immediate emergency contact numbers.`,
        type: 'safety',
    };
}

/**
 * Handle general/unclassified queries — builds context for Groq.
 */
function handleGeneral(message, context) {
    return {
        text: null, // Signal to caller: use Groq API fallback
        type: 'general',
        needsAI: true,
        systemPrompt: buildSystemPrompt(context),
    };
}

/**
 * Build system prompt with full trip context for Groq fallback.
 */
function buildSystemPrompt(context) {
    const { allocation, reconciliation, destination, currency, travelStyle, dailySummary: _dailySummary } = context;

    const parts = [
        'You are a helpful travel assistant for an AI-powered travel planner.',
        'Be concise, practical, and budget-aware in your responses.',
        'Always consider the user\'s budget constraints when making suggestions.',
        '',
    ];

    if (destination) parts.push(`Current destination: ${destination}`);
    if (currency) parts.push(`Currency: ${currency}`);
    if (travelStyle) parts.push(`Travel style: ${travelStyle}`);

    if (allocation) {
        parts.push(`\nBudget: ${allocation.total_budget} ${currency}`);
        parts.push(`Activity budget remaining: ${allocation.activity_remaining || 0} ${currency}`);
        parts.push(`Budget tier: ${allocation._meta?.budgetTier || 'mid-range'}`);
        parts.push(`Trip duration: ${allocation._meta?.totalDays || 0} days`);
        parts.push(`Travelers: ${allocation._meta?.travelers || 1}`);
    }

    if (reconciliation) {
        parts.push(`Budget status: ${reconciliation.balanced ? 'Balanced' : 'Overshoot by ' + reconciliation.overshoot}`);
    }

    return parts.join('\n');
}

// ── Main Router ──────────────────────────────────────────────────────

const HANDLERS = {
    emergency: handleEmergency,
    budget_inquiry: handleBudgetInquiry,
    add_activity: handleAddActivity,
    food_search: handleFoodSearch,
    upgrade: handleUpgrade,
    safety: handleSafety,
    general: handleGeneral,
    navigation: handleGeneral,
    weather: handleGeneral,
};

/**
 * Route a user message to the appropriate handler.
 *
 * @param {string} message — User's input text
 * @param {object} context — Trip context from stores
 * @returns {{ intent: string, confidence: number, response: object }}
 */
export function routeMessage(message, context) {
    const { intent, confidence } = classifyIntent(message);
    const handler = HANDLERS[intent] || handleGeneral;
    const response = handler(message, context);

    return { intent, confidence, response };
}
