/**
 * Claude API Wrapper
 * Handles all communication with Claude API with context management
 */

import fetch from 'node-fetch';
import { Logger } from '@utils/logger';
import { ExternalServiceError, RateLimitError } from '@utils/errors';

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
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeWrapper {
  private logger: Logger;
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private contextWindow: number;
  private conversationHistory: ClaudeMessage[] = [];
  private tokenUsage = { input: 0, output: 0 };
  private costTracker = { totalUSD: 0 };

  constructor() {
    this.logger = new Logger('ClaudeWrapper');
    this.apiKey = process.env.CLAUDE_API_KEY || '';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10);
    this.contextWindow = parseInt(process.env.CLAUDE_CONTEXT_WINDOW || '200000', 10);

    if (!this.apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable not set');
    }

    this.logger.info('Claude wrapper initialized', { model: this.model, maxTokens: this.maxTokens });
  }

  /**
   * Generate code for a specific task
   */
  async generateCode(prompt: string, context?: string): Promise<string> {
    this.logger.info('Generating code with Claude', { promptLength: prompt.length });

    try {
      const messages: ClaudeMessage[] = [];

      // Add context if provided
      if (context) {
        messages.push({
          role: 'user',
          content: `Context:\n${context}\n\nTask:\n${prompt}`,
        });
      } else {
        messages.push({
          role: 'user',
          content: prompt,
        });
      }

      // Add conversation history
      messages.push(...this.conversationHistory);

      // Check context window usage
      this.checkContextWindow(messages);

      const request: ClaudeRequest = {
        model: this.model,
        max_tokens: this.maxTokens,
        system: this.getSystemPrompt(),
        messages,
      };

      const response = await this.callClaudeAPI(request);

      // Extract text from response
      const generatedText = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      // Track tokens and cost
      this.trackUsage(response.usage);

      // Add to conversation history for multi-turn support
      this.conversationHistory.push({ role: 'user', content: prompt });
      this.conversationHistory.push({ role: 'assistant', content: generatedText });

      // Maintain conversation history size
      this.trimConversationHistory();

      this.logger.info('Code generation successful', {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalCost: this.costTracker.totalUSD,
      });

      return generatedText;
    } catch (error) {
      this.logger.error('Code generation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Call Claude API
   */
  private async callClaudeAPI(request: ClaudeRequest): Promise<ClaudeResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(request),
      });

      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        throw new RateLimitError(seconds);
      }

      // Check for other errors
      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new ExternalServiceError('Claude API', `${response.status}: ${errorData.message}`);
      }

      return (await response.json()) as ClaudeResponse;
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      throw new ExternalServiceError('Claude API', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Check if context window is approaching limit
   */
  private checkContextWindow(messages: ClaudeMessage[]): void {
    const estimatedTokens = messages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);

    if (estimatedTokens > this.contextWindow * 0.9) {
      this.logger.warn('Approaching context window limit', {
        estimatedTokens,
        contextWindow: this.contextWindow,
        usage: (estimatedTokens / this.contextWindow) * 100 + '%',
      });

      // Clear old conversation history
      this.conversationHistory = this.conversationHistory.slice(-2); // Keep last exchange
    }
  }

  /**
   * Estimate tokens (rough approximation)
   * 1 token ≈ 4 characters on average
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Track API usage and costs
   */
  private trackUsage(usage: { input_tokens: number; output_tokens: number }): void {
    this.tokenUsage.input += usage.input_tokens;
    this.tokenUsage.output += usage.output_tokens;

    // Pricing for Claude 3 Sonnet (as of Jan 2024)
    // Input: $3 per 1M tokens
    // Output: $15 per 1M tokens
    const inputCost = (usage.input_tokens / 1000000) * 3;
    const outputCost = (usage.output_tokens / 1000000) * 15;
    const totalCost = inputCost + outputCost;

    this.costTracker.totalUSD += totalCost;

    this.logger.debug('Token usage tracked', {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cost: totalCost,
      totalCost: this.costTracker.totalUSD,
    });
  }

  /**
   * Trim conversation history to prevent token overflow
   */
  private trimConversationHistory(): void {
    // Keep max 20 messages (10 exchanges)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  /**
   * Get system prompt for code generation
   */
  private getSystemPrompt(): string {
    return `You are an expert full-stack developer. Generate production-quality code.

Rules:
1. Generate valid, compilable code
2. Follow TypeScript strict mode
3. Include proper error handling
4. Add JSDoc comments
5. Use industry best practices
6. Generate only code, no explanations
7. Ensure type safety throughout

Output format:
- Provide complete, working code
- No incomplete snippets
- Ready for production use`;
  }

  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
    this.logger.debug('Conversation history reset');
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      totalInputTokens: this.tokenUsage.input,
      totalOutputTokens: this.tokenUsage.output,
      totalTokens: this.tokenUsage.input + this.tokenUsage.output,
      totalCostUSD: this.costTracker.totalUSD,
    };
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const request: ClaudeRequest = {
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'say ok' }],
      };

      await this.callClaudeAPI(request);
      this.logger.info('Claude API connection validated');
      return true;
    } catch (error) {
      this.logger.error('Claude API connection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
