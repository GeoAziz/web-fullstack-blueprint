"use strict";
/**
 * Security Review Agent
 * Analyzes code for vulnerabilities, enforces security best practices, and prevents insecure code from merging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAgent = void 0;
const logger_1 = require("@utils/logger");
const claude_api_1 = require("@services/claude-api");
const database_1 = require("@utils/database");
const uuid_1 = require("uuid");
class SecurityAgent {
    constructor() {
        this.logger = new logger_1.Logger('SecurityAgent');
        this.claudeAPI = new claude_api_1.ClaudeWrapper();
    }
    /**
     * Perform security review on code
     */
    async performSecurityReview(task) {
        this.logger.info('Starting security review', {
            taskId: task.taskId,
            codeType: task.codeType,
        });
        const startTime = Date.now();
        try {
            const issues = await this.analyzeSecurityIssues(task);
            const dependencyIssues = await this.checkDependencies(task.dependencies || []);
            const allIssues = [...issues, ...dependencyIssues];
            const passed = !allIssues.some((i) => i.severity === 'critical' || i.severity === 'high');
            const score = this.calculateSecurityScore(allIssues);
            const review = {
                id: (0, uuid_1.v4)().toString(),
                taskId: task.taskId,
                codeType: task.codeType,
                passed,
                issues: allIssues,
                overallScore: score,
                reviewedAt: new Date(),
            };
            await this.storeReview(review);
            this.logger.info('Security review complete', {
                taskId: task.taskId,
                passed,
                score: score.toFixed(1),
                issueCount: allIssues.length,
                duration: Date.now() - startTime,
            });
            return review;
        }
        catch (error) {
            this.logger.error('Security review failed', {
                taskId: task.taskId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Analyze code for security issues
     */
    async analyzeSecurityIssues(task) {
        try {
            const prompt = this.buildSecurityAnalysisPrompt(task);
            const analysis = await this.claudeAPI.generateCode(prompt);
            return this.parseSecurityIssues(analysis, task.codeType);
        }
        catch (error) {
            this.logger.warn('Security analysis failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    /**
     * Check dependencies for vulnerabilities
     */
    async checkDependencies(dependencies) {
        const issues = [];
        const knownVulnerable = {
            'lodash@<4.17.21': 'Prototype Pollution Vulnerability',
            'express@<4.17.1': 'Open Redirect in express',
            'minimist@<1.2.6': 'Prototype Pollution Vulnerability',
            'react@<16.8.0': 'Multiple Security Issues',
        };
        for (const dep of dependencies) {
            for (const [vuln, title] of Object.entries(knownVulnerable)) {
                if (dep.includes(vuln.split('@')[0])) {
                    issues.push({
                        id: (0, uuid_1.v4)().toString(),
                        severity: 'high',
                        title: `Vulnerable Dependency: ${title}`,
                        description: `${dep} has known security vulnerabilities`,
                        category: 'dependency',
                        suggestedFix: `Update to a patched version: npm update ${dep.split('@')[0]}`,
                    });
                }
            }
        }
        return issues;
    }
    /**
     * Build security analysis prompt
     */
    buildSecurityAnalysisPrompt(task) {
        return `Analyze the following ${task.codeType} code for security vulnerabilities and issues.

Code:
${task.codeToReview}

Check for:
1. Authentication/Authorization flaws
2. Input validation and injection vulnerabilities
3. XSS (Cross-Site Scripting) vulnerabilities
4. CSRF (Cross-Site Request Forgery) protection
5. Sensitive data exposure
6. Insecure cryptography
7. Hardcoded secrets or credentials
8. Insecure API usage
9. Race conditions
10. Improper error handling

For each issue found, provide:
- Severity: critical, high, medium, low
- Title: Brief issue name
- Description: Detailed explanation
- Line number (if applicable)
- Suggested fix

Output as JSON array of issues.
Only output the JSON, no other text.`;
    }
    /**
     * Parse security issues from analysis
     */
    parseSecurityIssues(analysis, codeType) {
        try {
            // Try to extract JSON from response
            const jsonMatch = analysis.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return this.getDefaultSecurityChecks(codeType);
            }
            const parsed = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(parsed)) {
                return this.getDefaultSecurityChecks(codeType);
            }
            return parsed.map((issue) => ({
                id: (0, uuid_1.v4)().toString(),
                severity: issue.severity || 'medium',
                title: issue.title || 'Security Issue',
                description: issue.description || '',
                lineNumber: issue.lineNumber,
                suggestedFix: issue.suggestedFix,
                category: issue.category || 'general',
            }));
        }
        catch (_error) {
            return this.getDefaultSecurityChecks(codeType);
        }
    }
    /**
     * Get default security checks based on code type
     */
    getDefaultSecurityChecks(codeType) {
        const checks = [];
        switch (codeType) {
            case 'frontend':
                checks.push({
                    id: (0, uuid_1.v4)().toString(),
                    severity: 'high',
                    title: 'Verify no hardcoded credentials',
                    description: 'Check if API keys or secrets are embedded in frontend code',
                    category: 'secrets',
                    suggestedFix: 'Use environment variables only',
                });
                checks.push({
                    id: (0, uuid_1.v4)().toString(),
                    severity: 'high',
                    title: 'Verify XSS protection',
                    description: 'Ensure all user input is sanitized and escaped',
                    category: 'xss',
                    suggestedFix: 'Use DOMPurify or React built-in escaping',
                });
                break;
            case 'backend':
                checks.push({
                    id: (0, uuid_1.v4)().toString(),
                    severity: 'critical',
                    title: 'Verify SQL injection protection',
                    description: 'Ensure parameterized queries are used',
                    category: 'injection',
                    suggestedFix: 'Use prepared statements or ORMs like Prisma',
                });
                checks.push({
                    id: (0, uuid_1.v4)().toString(),
                    severity: 'high',
                    title: 'Verify authentication is enforced',
                    description: 'Check that protected endpoints require valid authentication',
                    category: 'authentication',
                    suggestedFix: 'Add authentication middleware to all protected routes',
                });
                break;
            case 'infrastructure':
                checks.push({
                    id: (0, uuid_1.v4)().toString(),
                    severity: 'high',
                    title: 'Verify secrets management',
                    description: 'Check that secrets are not stored in code or logs',
                    category: 'secrets',
                    suggestedFix: 'Use AWS Secrets Manager or similar service',
                });
                checks.push({
                    id: (0, uuid_1.v4)().toString(),
                    severity: 'high',
                    title: 'Verify network security',
                    description: 'Check that security groups/firewalls are properly configured',
                    category: 'network',
                    suggestedFix: 'Implement least privilege network access rules',
                });
                break;
        }
        return checks;
    }
    /**
     * Calculate overall security score (0-100)
     */
    calculateSecurityScore(issues) {
        const criticalCount = issues.filter((i) => i.severity === 'critical').length;
        const highCount = issues.filter((i) => i.severity === 'high').length;
        const mediumCount = issues.filter((i) => i.severity === 'medium').length;
        let score = 100;
        score -= criticalCount * 20;
        score -= highCount * 10;
        score -= mediumCount * 2;
        return Math.max(0, score);
    }
    /**
     * Store review to database
     */
    async storeReview(review) {
        try {
            await database_1.DatabaseConfig.query(`INSERT INTO security_reviews (id, task_id, code_type, passed, issues, overall_score, reviewed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                review.id,
                review.taskId,
                review.codeType,
                review.passed,
                JSON.stringify(review.issues),
                review.overallScore,
                review.reviewedAt,
            ]);
            this.logger.debug('Review stored', { id: review.id });
        }
        catch (error) {
            this.logger.error('Failed to store review', {
                id: review.id,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Get security review
     */
    async getReview(taskId) {
        try {
            const result = await database_1.DatabaseConfig.query(`SELECT * FROM security_reviews WHERE task_id = $1 ORDER BY reviewed_at DESC LIMIT 1`, [taskId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                taskId: row.task_id,
                codeType: row.code_type,
                passed: row.passed,
                issues: JSON.parse(row.issues),
                overallScore: row.overall_score,
                reviewedAt: row.reviewed_at,
            };
        }
        catch (error) {
            this.logger.error('Failed to get review', {
                taskId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
}
exports.SecurityAgent = SecurityAgent;
//# sourceMappingURL=security-agent.js.map