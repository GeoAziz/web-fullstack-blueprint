/**
 * Backend Development Agent
 * Generates backend services, APIs, and data models
 */
import { QueueManager } from '@queue/queue-manager';
export interface BackendServiceGenerationPayload {
    serviceName: string;
    description: string;
    apiEndpoints: string[];
    dataModels: Record<string, any>[];
    userStories: string[];
    acceptanceCriteria: string[];
    existingServices?: string[];
}
export interface GeneratedBackendService {
    id: string;
    name: string;
    paths: {
        controllers: string;
        models: string;
        services: string;
        tests: string;
    };
    code: Record<string, string>;
    tests: string;
    metadata: ServiceMetadata;
}
export interface ServiceMetadata {
    generatedAt: Date;
    complexity: 'simple' | 'moderate' | 'complex';
    apiEndpointCount: number;
    modelCount: number;
    dependencies: string[];
}
export declare class BackendAgent {
    private logger;
    private claude;
    private queueManager;
    constructor(queueManager: QueueManager);
    /**
     * Initialize the agent
     */
    initialize(): Promise<void>;
    /**
     * Process backend service generation job
     */
    private processServiceGeneration;
    /**
     * Validate service generation payload
     */
    private validatePayload;
    /**
     * Generate backend service code
     */
    private generateService;
    /**
     * Generate service tests
     */
    private generateServiceTests;
    /**
     * Store service to database
     */
    private storeService;
    /**
     * Update task completion status
     */
    private updateTaskCompletion;
    /**
     * Build service generation system prompt
     */
    private buildServicePrompt;
    /**
     * Extract dependencies from generated code
     */
    private extractDependencies;
}
//# sourceMappingURL=backend-agent.d.ts.map