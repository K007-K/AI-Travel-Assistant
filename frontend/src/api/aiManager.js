import { makeGroqRequest } from './groq';
import { AGENT_PROMPTS } from '../ai/prompts';

// Model Registry - Mapping logical roles to actual Groq models
// Models: Mixtral-8x7b (Planning/Complex), Llama3-70b (Reasoning/Comparison), Llama3-8b (Fast/Simple)
const MODEL_REGISTRY = {
    PLANNER: 'mixtral-8x7b-32768',
    REASONING: 'llama3-70b-8192',
    FAST: 'llama3-8b-8192',
    MIXTRAL: 'mixtral-8x7b-32768',
    WHISPER: 'whisper-large-v3', // Note: Needs specific Whisper endpoint, usually handled differently
};

/**
 * AI Manager - Client-side Orchestrator
 * Routes requests to the correct agent and model.
 */
export const aiManager = {
    /**
     * Run a specific agent with user input.
     * @param {string} agentId - Key from AGENT_PROMPTS (e.g., 'TRANSLATION', 'BUDGET_VALIDATOR')
     * @param {string} userInput - The raw user input or stringified context
     * @param {object} context - Additional metadata (optional)
     * @returns {Promise<any>} - Parsed JSON response (or string if fallback)
     */
    async runAgent(agentId, userInput, context = {}) {
        const systemPrompt = AGENT_PROMPTS[agentId];
        if (!systemPrompt) {
            throw new Error(`Agent ID '${agentId}' not found.`);
        }

        // 1. Model Routing Logic
        let model = MODEL_REGISTRY.FAST; // Default
        switch (agentId) {
            case 'ITINERARY_PLANNER':
            case 'CULTURAL_CONTEXT':
            case 'PERSONALIZATION':
            case 'WHAT_IF_SIMULATION':
                model = MODEL_REGISTRY.PLANNER;
                break;
            case 'BUDGET_VALIDATOR':
            case 'SAFETY_ADVISORY':
            case 'EMERGENCY_ASSISTANCE':
            case 'FOOD_DISCOVERY':
                model = MODEL_REGISTRY.REASONING; // Needs better reasoning
                break;
            case 'TRANSLATION':
            case 'CORE_CHAT':
                model = MODEL_REGISTRY.FAST;
                break;
            default:
                model = MODEL_REGISTRY.FAST;
        }

        if (import.meta.env.DEV) console.log(`[AI Manager] Running Agent: ${agentId} on Model: ${model}`);

        // 2. Construct Messages
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput } // Simple context injection
        ];

        try {
            // 3. Call API
            const response = await makeGroqRequest(messages, model);

            // 4. Parse Output (Expect JSON)
            // Attempt to extract JSON if wrapped in markdown code blocks
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            try {
                return JSON.parse(cleanResponse);
            } catch (jsonError) {
                console.warn('[AI Manager] Failed to parse JSON, returning raw text.', jsonError);
                // Return a structured error fallback so UI doesn't crash
                return {
                    error: "Parsing Error",
                    raw_output: response,
                    details: "The agent returned non-JSON output."
                };
            }
        } catch (error) {
            console.error(`[AI Manager] Agent execution failed:`, error);
            throw error;
        }
    },

    /**
     * Identify intent from Core Chat and route to specific feature.
     * @param {string} message 
     */
    async routeIntent(message) {
        return this.runAgent('CORE_CHAT', message);
    }
};
