/**
 * Testing Development Agent
 * Generates comprehensive test suites including unit, integration, and E2E tests
 */
export interface TestingTask {
    taskId: string;
    workflowId: string;
    testTypes: string[];
    componentPath: string;
    componentCode: string;
    requirements?: string;
    metadata?: Record<string, any>;
}
export interface GeneratedTests {
    id: string;
    taskId: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance';
    content: string;
    path: string;
    coverageEstimate: number;
    generatedAt: Date;
}
export declare class TestingAgent {
    private logger;
    private claudeAPI;
    constructor();
    /**
     * Process test generation task
     */
    processTestGeneration(task: TestingTask): Promise<GeneratedTests[]>;
    /**
     * Generate specific test type
     */
    private generateTests;
    /**
     * Build test generation prompt
     */
    private buildTestPrompt;
    /**
     * Estimate coverage percentage
     */
    private estimateCoverage;
    /**
     * Get output path for test type
     */
    private getOutputPath;
    /**
     * Store generated tests to database
     */
    private storeTests;
    /**
     * Get generated tests
     */
    getTests(taskId: string): Promise<GeneratedTests[]>;
}
//# sourceMappingURL=testing-agent.d.ts.map