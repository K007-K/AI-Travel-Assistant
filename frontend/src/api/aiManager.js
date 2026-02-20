import { makeGroqRequest } from './groq';
import { AGENT_PROMPTS } from '../ai/prompts';

/**
 * AI Manager — thin wrapper that routes agent requests through Groq.
 * All model selection happens server-side in the Edge Function.
 */
export const aiManager = {
    /**
     * Run a specific agent with user input.
     * @param {string} agentId - Key from AGENT_PROMPTS (e.g., 'TRANSLATION', 'BUDGET_VALIDATOR')
     * @param {string} userInput - The raw user input or stringified context
     * @returns {Promise<any>} - Parsed JSON response or { raw_output } fallback
     */
    async runAgent(agentId, userInput) {
        const systemPrompt = AGENT_PROMPTS[agentId];
        if (!systemPrompt) throw new Error(`Agent '${agentId}' not found.`);

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput },
        ];

        const response = await makeGroqRequest(messages);

        // Attempt JSON parse; return raw text as structured fallback
        try {
            const clean = response
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/```\s*$/, '')
                .trim();
            return JSON.parse(clean);
        } catch {
            return { raw_output: response };
        }
    },
};
