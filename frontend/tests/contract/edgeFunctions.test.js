/**
 * Edge Function Contract Tests — Schema Validation Only
 *
 * Validates that frontend assumptions about edge function
 * request/response shapes are correct.
 *
 * NO NETWORK CALLS. Uses hardcoded fixture data.
 */
import { describe, it, expect } from 'vitest';

// ── itinerary-generator contract ────────────────────────────────────

describe('itinerary-generator contract', () => {
    // Expected request shape (what frontend sends)
    const validRequest = {
        destination: 'Visakhapatnam',
        days: 3,
        budget: 30000,
        travelers: 1,
        currency: 'INR',
        budgetTier: 'mid-range',
        tripDays: [
            { dayNumber: 1, location: 'Visakhapatnam' },
            { dayNumber: 2, location: 'Araku Valley' },
            { dayNumber: 3, location: 'Visakhapatnam' },
        ],
        // Orchestrator fields
        activityBudget: 14800,
        travelStyle: 'city_exploration',
        pace: 'moderate',
        excludeTransport: true,
        excludeAccommodation: true,
    };

    it('request should have required fields', () => {
        expect(validRequest).toHaveProperty('destination');
        expect(typeof validRequest.destination).toBe('string');
        expect(validRequest).toHaveProperty('days');
        expect(typeof validRequest.days).toBe('number');
        expect(validRequest).toHaveProperty('budget');
        expect(typeof validRequest.budget).toBe('number');
        expect(validRequest).toHaveProperty('travelers');
        expect(typeof validRequest.travelers).toBe('number');
        expect(validRequest).toHaveProperty('currency');
        expect(typeof validRequest.currency).toBe('string');
    });

    it('request should have orchestrator-specific fields', () => {
        expect(validRequest).toHaveProperty('activityBudget');
        expect(typeof validRequest.activityBudget).toBe('number');
        expect(validRequest).toHaveProperty('excludeTransport');
        expect(typeof validRequest.excludeTransport).toBe('boolean');
        expect(validRequest).toHaveProperty('excludeAccommodation');
        expect(typeof validRequest.excludeAccommodation).toBe('boolean');
    });

    it('tripDays should be array with correct shape', () => {
        expect(Array.isArray(validRequest.tripDays)).toBe(true);
        for (const day of validRequest.tripDays) {
            expect(day).toHaveProperty('dayNumber');
            expect(typeof day.dayNumber).toBe('number');
            expect(day).toHaveProperty('location');
            expect(typeof day.location).toBe('string');
        }
    });

    // Expected response shape (what frontend receives)
    const validResponse = {
        choices: [
            {
                message: {
                    content: JSON.stringify({
                        days: [
                            {
                                dayNumber: 1,
                                activities: [
                                    {
                                        title: 'Beach Walk',
                                        time: '09:00',
                                        location: 'RK Beach',
                                        type: 'sightseeing',
                                        estimated_cost: 0,
                                        safety_warning: null,
                                        notes: 'Enjoy a morning walk along the coastline',
                                    },
                                ],
                            },
                        ],
                    }),
                },
            },
        ],
    };

    it('response should follow Groq completion shape', () => {
        expect(validResponse).toHaveProperty('choices');
        expect(Array.isArray(validResponse.choices)).toBe(true);
        expect(validResponse.choices[0]).toHaveProperty('message');
        expect(validResponse.choices[0].message).toHaveProperty('content');
    });

    it('parsed response content should have days array', () => {
        const content = JSON.parse(validResponse.choices[0].message.content);
        expect(content).toHaveProperty('days');
        expect(Array.isArray(content.days)).toBe(true);
    });

    it('each activity should have required fields', () => {
        const content = JSON.parse(validResponse.choices[0].message.content);
        const activity = content.days[0].activities[0];

        expect(activity).toHaveProperty('title');
        expect(typeof activity.title).toBe('string');
        expect(activity).toHaveProperty('time');
        expect(typeof activity.time).toBe('string');
        expect(activity).toHaveProperty('location');
        expect(typeof activity.location).toBe('string');
        expect(activity).toHaveProperty('type');
        expect(typeof activity.type).toBe('string');
        expect(activity).toHaveProperty('estimated_cost');
        expect(typeof activity.estimated_cost).toBe('number');
    });
});

// ── budget-validator contract ───────────────────────────────────────

describe('budget-validator contract', () => {
    const validRequest = {
        destination: 'Visakhapatnam',
        days: 3,
        travelers: 1,
        budget: 30000,
        currency: 'INR',
        total_budget: 30000,
        actual_spent: 5000,
        ai_estimated_total: 18000,
        forecast_total: 23000,
        forecast_percent: 76.7,
        remaining_forecast: 7000,
        category_breakdown: [
            { category: 'accommodation', actual: 3000, estimated: 6000 },
            { category: 'transport', actual: 2000, estimated: 4000 },
        ],
    };

    it('request should have financial summary fields', () => {
        expect(validRequest).toHaveProperty('total_budget');
        expect(typeof validRequest.total_budget).toBe('number');
        expect(validRequest).toHaveProperty('actual_spent');
        expect(typeof validRequest.actual_spent).toBe('number');
        expect(validRequest).toHaveProperty('forecast_percent');
        expect(typeof validRequest.forecast_percent).toBe('number');
    });

    it('category_breakdown should be array with correct shape', () => {
        expect(Array.isArray(validRequest.category_breakdown)).toBe(true);
        for (const cat of validRequest.category_breakdown) {
            expect(cat).toHaveProperty('category');
            expect(typeof cat.category).toBe('string');
            expect(cat).toHaveProperty('actual');
            expect(typeof cat.actual).toBe('number');
        }
    });

    // Expected response
    const validResponse = {
        insights: {
            summary: 'Budget analysis complete.',
            risk_analysis: 'Moderate risk. Forecast utilization at 76.7%.',
            category_insights: ['Accommodation is 50% of spend.'],
            recommendations: ['Consider cheaper accommodation options.'],
        },
    };

    it('response should have insights object', () => {
        expect(validResponse).toHaveProperty('insights');
        expect(validResponse.insights).toHaveProperty('summary');
        expect(typeof validResponse.insights.summary).toBe('string');
        expect(validResponse.insights).toHaveProperty('risk_analysis');
        expect(typeof validResponse.insights.risk_analysis).toBe('string');
    });

    it('recommendations should be array of strings', () => {
        const recs = validResponse.insights.recommendations;
        expect(Array.isArray(recs)).toBe(true);
        for (const rec of recs) {
            expect(typeof rec).toBe('string');
        }
    });

    it('recommendations should have max 5 items', () => {
        expect(validResponse.insights.recommendations.length).toBeLessThanOrEqual(5);
    });
});

// ── chat-completion contract ────────────────────────────────────────

describe('chat-completion contract', () => {
    const validRequest = {
        messages: [
            { role: 'system', content: 'You are a helpful travel assistant.' },
            { role: 'user', content: 'What are the best places to visit in Goa?' },
        ],
    };

    it('request should have messages array', () => {
        expect(validRequest).toHaveProperty('messages');
        expect(Array.isArray(validRequest.messages)).toBe(true);
    });

    it('each message should have role and content', () => {
        for (const msg of validRequest.messages) {
            expect(msg).toHaveProperty('role');
            expect(['system', 'user', 'assistant']).toContain(msg.role);
            expect(msg).toHaveProperty('content');
            expect(typeof msg.content).toBe('string');
        }
    });

    const validResponse = {
        choices: [
            {
                message: {
                    role: 'assistant',
                    content: 'Here are the best places to visit in Goa...',
                },
            },
        ],
    };

    it('response should follow Groq completion shape', () => {
        expect(validResponse).toHaveProperty('choices');
        expect(Array.isArray(validResponse.choices)).toBe(true);
        expect(validResponse.choices[0].message).toHaveProperty('role');
        expect(validResponse.choices[0].message.role).toBe('assistant');
        expect(validResponse.choices[0].message).toHaveProperty('content');
        expect(typeof validResponse.choices[0].message.content).toBe('string');
    });
});
