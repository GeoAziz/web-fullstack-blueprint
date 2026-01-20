/**
 * Quality Gates Service
 * Validates generated code meets quality standards before merge
 */
export interface QualityGateResult {
    passed: boolean;
    checks: QualityCheck[];
    summary: string;
}
export interface QualityCheck {
    name: string;
    passed: boolean;
    message: string;
    duration: number;
}
export declare class QualityGates {
    private logger;
    private projectPath;
    constructor(projectPath?: string);
    /**
     * Run all quality gates
     */
    validateAll(): Promise<QualityGateResult>;
    /**
     * Validate TypeScript compilation
     */
    private validateTypeScript;
    /**
     * Validate ESLint
     */
    private validateESLint;
    /**
     * Validate tests
     */
    private validateTests;
    /**
     * Validate security (dependency check)
     */
    private validateSecurity;
    /**
     * Check code coverage
     */
    checkCoverage(minCoverage?: number): Promise<QualityCheck>;
    /**
     * Format results for display
     */
    formatResults(result: QualityGateResult): string;
}
//# sourceMappingURL=quality-gates.d.ts.map