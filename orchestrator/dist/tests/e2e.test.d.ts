/**
 * End-to-End Integration Test
 * Tests full workflow: MD → parse → orchestrate → queue → agent → quality gates → git
 */
declare function runE2ETest(): Promise<{
    success: boolean;
    summary: {
        workflow: {
            id: string;
            status: import("../types").WorkflowStatus;
            title: string;
        };
        requirements: {
            featureId: string;
            userStories: number;
            complexity: "simple" | "moderate" | "complex" | "very-complex";
        };
        executionPlan: {
            phases: number;
            totalEstimatedTime: string;
        };
        tasks: {
            total: number;
            pending: number;
        };
        qualityGates: {
            passed: boolean;
            checksPassed: number;
            totalChecks: number;
        };
    };
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    summary?: undefined;
}>;
export { runE2ETest };
//# sourceMappingURL=e2e.test.d.ts.map