/**
 * Infrastructure Development Agent
 * Generates Terraform, Docker, and CI/CD configurations
 */
export interface InfrastructureTask {
    taskId: string;
    workflowId: string;
    infrastructure: string[];
    requirements: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface GeneratedInfrastructure {
    id: string;
    taskId: string;
    type: 'terraform' | 'docker' | 'cicd' | 'monitoring';
    content: string;
    path: string;
    validationPassed: boolean;
    generatedAt: Date;
}
export declare class InfrastructureAgent {
    private logger;
    private claudeAPI;
    constructor();
    /**
     * Process infrastructure generation task
     */
    processInfrastructureGeneration(task: InfrastructureTask): Promise<GeneratedInfrastructure[]>;
    /**
     * Generate specific infrastructure type
     */
    private generateInfrastructure;
    /**
     * Build infrastructure generation prompt
     */
    private buildInfrastructurePrompt;
    /**
     * Validate generated infrastructure
     */
    private validateInfrastructure;
    /**
     * Get output path for infrastructure type
     */
    private getOutputPath;
    /**
     * Store generated infrastructure to database
     */
    private storeInfrastructure;
    /**
     * Get generated infrastructure
     */
    getInfrastructure(taskId: string): Promise<GeneratedInfrastructure[]>;
}
//# sourceMappingURL=infrastructure-agent.d.ts.map