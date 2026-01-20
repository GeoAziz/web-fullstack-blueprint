/**
 * Security Review Agent
 * Analyzes code for vulnerabilities, enforces security best practices, and prevents insecure code from merging
 */
export interface SecurityReviewTask {
    taskId: string;
    workflowId: string;
    codeToReview: string;
    codeType: 'frontend' | 'backend' | 'infrastructure' | 'config';
    dependencies?: string[];
    metadata?: Record<string, any>;
}
export interface SecurityIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    lineNumber?: number;
    suggestedFix?: string;
    category: string;
}
export interface SecurityReview {
    id: string;
    taskId: string;
    codeType: string;
    passed: boolean;
    issues: SecurityIssue[];
    overallScore: number;
    reviewedAt: Date;
}
export declare class SecurityAgent {
    private logger;
    private claudeAPI;
    constructor();
    /**
     * Perform security review on code
     */
    performSecurityReview(task: SecurityReviewTask): Promise<SecurityReview>;
    /**
     * Analyze code for security issues
     */
    private analyzeSecurityIssues;
    /**
     * Check dependencies for vulnerabilities
     */
    private checkDependencies;
    /**
     * Build security analysis prompt
     */
    private buildSecurityAnalysisPrompt;
    /**
     * Parse security issues from analysis
     */
    private parseSecurityIssues;
    /**
     * Get default security checks based on code type
     */
    private getDefaultSecurityChecks;
    /**
     * Calculate overall security score (0-100)
     */
    private calculateSecurityScore;
    /**
     * Store review to database
     */
    private storeReview;
    /**
     * Get security review
     */
    getReview(taskId: string): Promise<SecurityReview | null>;
}
//# sourceMappingURL=security-agent.d.ts.map