/**
 * Full End-to-End Integration Test
 * Complete workflow: Requirement → Parse → Orchestrate → All Agents → Quality Gates → Git → PR
 */
interface E2ETestResult {
    success: boolean;
    phases: Array<{
        name: string;
        status: 'pass' | 'fail' | 'partial';
        duration: number;
        details: string;
    }>;
    totalDuration: number;
    coverage: {
        frontend: number;
        backend: number;
        tests: number;
        security: number;
    };
}
declare function runFullE2ETest(): Promise<E2ETestResult>;
export { runFullE2ETest };
//# sourceMappingURL=e2e-full.test.d.ts.map