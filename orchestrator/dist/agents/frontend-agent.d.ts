/**
 * Frontend Development Agent
 * Generates React components and manages frontend assets
 */
import { QueueManager } from '@queue/queue-manager';
export interface ComponentGenerationPayload {
    componentName: string;
    description: string;
    userStories: string[];
    acceptanceCriteria: string[];
    existingComponents?: string[];
    designSystem?: Record<string, any>;
}
export interface GeneratedComponent {
    id: string;
    name: string;
    path: string;
    code: string;
    tests: string;
    typings: string;
    metadata: ComponentMetadata;
}
export interface ComponentMetadata {
    generatedAt: Date;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedCoverage: number;
    dependencies: string[];
    storyCount: number;
    criteriaCount: number;
}
export declare class FrontendAgent {
    private logger;
    private claude;
    private queueManager;
    private componentLibrary;
    constructor(queueManager: QueueManager);
    /**
     * Initialize the agent
     */
    initialize(): Promise<void>;
    /**
     * Process component generation job
     */
    private processComponentGeneration;
    /**
     * Validate component generation payload
     */
    private validatePayload;
    /**
     * Generate React component code
     */
    private generateComponent;
    /**
     * Generate component tests
     */
    private generateTests;
    /**
     * Generate TypeScript type definitions
     */
    private generateTypings;
    /**
     * Validate generated code quality
     */
    private validateGeneratedCode;
    /**
     * Store component to database
     */
    private storeComponent;
    /**
     * Update task completion status
     */
    private updateTaskCompletion;
    /**
     * Build component generation system prompt
     */
    private buildComponentPrompt;
    /**
     * Estimate component complexity
     */
    private estimateComplexity;
    /**
     * Extract dependencies from generated code
     */
    private extractDependencies;
    /**
     * Get component from library
     */
    getComponent(componentId: string): GeneratedComponent | undefined;
    /**
     * Get all components for a workflow
     */
    getWorkflowComponents(workflowId: string): Promise<GeneratedComponent[]>;
}
//# sourceMappingURL=frontend-agent.d.ts.map