/**
 * Claude API Wrapper
 * Handles all communication with Claude API with context management
 */
export interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface ClaudeRequest {
    model: string;
    max_tokens: number;
    system?: string;
    messages: ClaudeMessage[];
}
export interface ClaudeResponse {
    id: string;
    type: string;
    role: string;
    content: Array<{
        type: string;
        text: string;
    }>;
    model: string;
    stop_reason: string;
    stop_sequence: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}
export declare class ClaudeWrapper {
    private logger;
    private apiKey;
    private model;
    private maxTokens;
    private contextWindow;
    private conversationHistory;
    private tokenUsage;
    private costTracker;
    constructor();
    /**
     * Generate code for a specific task
     */
    generateCode(prompt: string, context?: string): Promise<string>;
    /**
     * Call Claude API
     */
    private callClaudeAPI;
    /**
     * Check if context window is approaching limit
     */
    private checkContextWindow;
    /**
     * Estimate tokens (rough approximation)
     * 1 token ≈ 4 characters on average
     */
    private estimateTokens;
    /**
     * Track API usage and costs
     */
    private trackUsage;
    /**
     * Trim conversation history to prevent token overflow
     */
    private trimConversationHistory;
    /**
     * Get system prompt for code generation
     */
    private getSystemPrompt;
    /**
     * Reset conversation history
     */
    resetConversation(): void;
    /**
     * Get current usage statistics
     */
    getUsageStats(): {
        totalInputTokens: number;
        totalOutputTokens: number;
        totalTokens: number;
        totalCostUSD: number;
    };
    /**
     * Validate API connection
     */
    validateConnection(): Promise<boolean>;
}
//# sourceMappingURL=claude-api.d.ts.map