/**
 * Security Review Agent
 * Analyzes code for vulnerabilities, enforces security best practices, and prevents insecure code from merging
 */

import { Logger } from '@utils/logger';
import { ClaudeWrapper } from '@services/claude-api';
import { DatabaseConfig } from '@utils/database';
import { v4 as uuid } from 'uuid';

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

export class SecurityAgent {
  private logger: Logger;
  private claudeAPI: ClaudeWrapper;

  constructor() {
    this.logger = new Logger('SecurityAgent');
    this.claudeAPI = new ClaudeWrapper();
  }

  /**
   * Perform security review on code
   */
  async performSecurityReview(task: SecurityReviewTask): Promise<SecurityReview> {
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

      const review: SecurityReview = {
        id: uuid().toString(),
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
    } catch (error) {
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
  private async analyzeSecurityIssues(task: SecurityReviewTask): Promise<SecurityIssue[]> {
    try {
      const prompt = this.buildSecurityAnalysisPrompt(task);
      const analysis = await this.claudeAPI.generateCode(prompt);

      return this.parseSecurityIssues(analysis, task.codeType);
    } catch (error) {
      this.logger.warn('Security analysis failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Check dependencies for vulnerabilities
   */
  private async checkDependencies(dependencies: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    const knownVulnerable: Record<string, string> = {
      'lodash@<4.17.21': 'Prototype Pollution Vulnerability',
      'express@<4.17.1': 'Open Redirect in express',
      'minimist@<1.2.6': 'Prototype Pollution Vulnerability',
      'react@<16.8.0': 'Multiple Security Issues',
    };

    for (const dep of dependencies) {
      for (const [vuln, title] of Object.entries(knownVulnerable)) {
        if (dep.includes(vuln.split('@')[0])) {
          issues.push({
            id: uuid().toString(),
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
  private buildSecurityAnalysisPrompt(task: SecurityReviewTask): string {
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
  private parseSecurityIssues(analysis: string, codeType: string): SecurityIssue[] {
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

      return parsed.map((issue: Record<string, any>) => ({
        id: uuid().toString(),
        severity: issue.severity || 'medium',
        title: issue.title || 'Security Issue',
        description: issue.description || '',
        lineNumber: issue.lineNumber,
        suggestedFix: issue.suggestedFix,
        category: issue.category || 'general',
      }));
    } catch (_error) {
      return this.getDefaultSecurityChecks(codeType);
    }
  }

  /**
   * Get default security checks based on code type
   */
  private getDefaultSecurityChecks(codeType: string): SecurityIssue[] {
    const checks: SecurityIssue[] = [];

    switch (codeType) {
      case 'frontend':
        checks.push({
          id: uuid().toString(),
          severity: 'high',
          title: 'Verify no hardcoded credentials',
          description: 'Check if API keys or secrets are embedded in frontend code',
          category: 'secrets',
          suggestedFix: 'Use environment variables only',
        });
        checks.push({
          id: uuid().toString(),
          severity: 'high',
          title: 'Verify XSS protection',
          description: 'Ensure all user input is sanitized and escaped',
          category: 'xss',
          suggestedFix: 'Use DOMPurify or React built-in escaping',
        });
        break;

      case 'backend':
        checks.push({
          id: uuid().toString(),
          severity: 'critical',
          title: 'Verify SQL injection protection',
          description: 'Ensure parameterized queries are used',
          category: 'injection',
          suggestedFix: 'Use prepared statements or ORMs like Prisma',
        });
        checks.push({
          id: uuid().toString(),
          severity: 'high',
          title: 'Verify authentication is enforced',
          description: 'Check that protected endpoints require valid authentication',
          category: 'authentication',
          suggestedFix: 'Add authentication middleware to all protected routes',
        });
        break;

      case 'infrastructure':
        checks.push({
          id: uuid().toString(),
          severity: 'high',
          title: 'Verify secrets management',
          description: 'Check that secrets are not stored in code or logs',
          category: 'secrets',
          suggestedFix: 'Use AWS Secrets Manager or similar service',
        });
        checks.push({
          id: uuid().toString(),
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
  private calculateSecurityScore(issues: SecurityIssue[]): number {
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
  private async storeReview(review: SecurityReview): Promise<void> {
    try {
      await DatabaseConfig.query(
        `INSERT INTO security_reviews (id, task_id, code_type, passed, issues, overall_score, reviewed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          review.id,
          review.taskId,
          review.codeType,
          review.passed,
          JSON.stringify(review.issues),
          review.overallScore,
          review.reviewedAt,
        ]
      );

      this.logger.debug('Review stored', { id: review.id });
    } catch (error) {
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
  async getReview(taskId: string): Promise<SecurityReview | null> {
    try {
      const result = await DatabaseConfig.query(
        `SELECT * FROM security_reviews WHERE task_id = $1 ORDER BY reviewed_at DESC LIMIT 1`,
        [taskId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as Record<string, any>;
      return {
        id: row.id,
        taskId: row.task_id,
        codeType: row.code_type,
        passed: row.passed,
        issues: JSON.parse(row.issues),
        overallScore: row.overall_score,
        reviewedAt: row.reviewed_at,
      };
    } catch (error) {
      this.logger.error('Failed to get review', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
