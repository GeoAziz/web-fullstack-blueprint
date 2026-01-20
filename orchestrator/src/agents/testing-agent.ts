/**
 * Testing Development Agent
 * Generates comprehensive test suites including unit, integration, and E2E tests
 */

import { Logger } from '@utils/logger';
import { ClaudeWrapper } from '@services/claude-api';
import { DatabaseConfig } from '@utils/database';
import { v4 as uuid } from 'uuid';

export interface TestingTask {
  taskId: string;
  workflowId: string;
  testTypes: string[]; // ['unit', 'integration', 'e2e', 'performance']
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

export class TestingAgent {
  private logger: Logger;
  private claudeAPI: ClaudeWrapper;

  constructor() {
    this.logger = new Logger('TestingAgent');
    this.claudeAPI = new ClaudeWrapper();
  }

  /**
   * Process test generation task
   */
  async processTestGeneration(task: TestingTask): Promise<GeneratedTests[]> {
    this.logger.info('Processing test generation task', {
      taskId: task.taskId,
      testTypes: task.testTypes,
      component: task.componentPath,
    });

    const generated: GeneratedTests[] = [];

    try {
      for (const testType of task.testTypes) {
        const result = await this.generateTests(task, testType);
        generated.push(result);
      }

      // Store all generated tests
      for (const test of generated) {
        await this.storeTests(test);
      }

      this.logger.info('Test generation complete', {
        taskId: task.taskId,
        count: generated.length,
        avgCoverage: (generated.reduce((sum, t) => sum + t.coverageEstimate, 0) / generated.length).toFixed(1),
      });

      return generated;
    } catch (error) {
      this.logger.error('Test generation failed', {
        taskId: task.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate specific test type
   */
  private async generateTests(task: TestingTask, type: string): Promise<GeneratedTests> {
    const startTime = Date.now();

    try {
      const prompt = this.buildTestPrompt(task, type);
      const generatedCode = await this.claudeAPI.generateCode(prompt);

      const coverage = this.estimateCoverage(type, generatedCode);

      const tests: GeneratedTests = {
        id: uuid().toString(),
        taskId: task.taskId,
        type: type as 'unit' | 'integration' | 'e2e' | 'performance',
        content: generatedCode,
        path: this.getOutputPath(task.componentPath, type),
        coverageEstimate: coverage,
        generatedAt: new Date(),
      };

      this.logger.info(`${type} tests generated`, {
        taskId: task.taskId,
        coverage: `${coverage}%`,
        duration: Date.now() - startTime,
      });

      return tests;
    } catch (error) {
      throw new Error(`Failed to generate ${type} tests: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build test generation prompt
   */
  private buildTestPrompt(task: TestingTask, type: string): string {
    const baseContext = `You are an expert test engineer. Generate production-ready ${type} tests.

Component being tested:
${task.componentCode}

Component path: ${task.componentPath}
Requirements: ${task.requirements || 'Standard component'}

Output ONLY the test code without explanation.
Use Jest and React Testing Library where applicable.
Ensure tests are isolated, fast, and maintainable.`;

    switch (type) {
      case 'unit':
        return `${baseContext}

Generate comprehensive unit tests covering:
- All exported functions and methods
- Normal operation paths
- Edge cases and boundary conditions
- Error conditions and exceptions
- State changes and side effects

Target: 80%+ code coverage
Use mocking for external dependencies.
Include descriptive test names and comments.`;

      case 'integration':
        return `${baseContext}

Generate integration tests covering:
- Component integration with other components
- API integration and data fetching
- State management integration
- Database operations if applicable
- Error handling across component boundaries

Use realistic test data and scenarios.
Mock external services appropriately.
Test real user workflows and interactions.`;

      case 'e2e':
        return `${baseContext}

Generate end-to-end tests using Playwright covering:
- Complete user journeys from login to feature completion
- Critical business workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance under realistic conditions

Use page object patterns.
Include explicit waits and proper assertions.
Test accessibility and keyboard navigation.`;

      case 'performance':
        return `${baseContext}

Generate performance tests covering:
- Load testing for APIs (100-1000 concurrent requests)
- Rendering performance for components
- Memory usage and leak detection
- Database query performance
- Bundle size impact

Include baseline metrics and thresholds.
Use k6 or similar for load testing.
Provide performance benchmarks.`;

      default:
        return baseContext;
    }
  }

  /**
   * Estimate coverage percentage
   */
  private estimateCoverage(type: string, content: string): number {
    const testCount = (content.match(/it\(|test\(/g) || []).length;
    const describeCount = (content.match(/describe\(/g) || []).length;

    switch (type) {
      case 'unit':
        return Math.min(85, 20 + testCount * 2);
      case 'integration':
        return Math.min(70, 10 + testCount);
      case 'e2e':
        return Math.min(60, 5 + describeCount * 8);
      case 'performance':
        return Math.min(50, 10 + testCount);
      default:
        return 0;
    }
  }

  /**
   * Get output path for test type
   */
  private getOutputPath(componentPath: string, type: string): string {
    const dir = componentPath.substring(0, componentPath.lastIndexOf('/'));
    const file = componentPath.substring(componentPath.lastIndexOf('/') + 1, componentPath.lastIndexOf('.'));

    switch (type) {
      case 'unit':
        return `${dir}/__tests__/${file}.unit.test.ts`;
      case 'integration':
        return `${dir}/__tests__/${file}.integration.test.ts`;
      case 'e2e':
        return `tests/e2e/${file}.e2e.test.ts`;
      case 'performance':
        return `tests/performance/${file}.perf.test.ts`;
      default:
        return `${dir}/__tests__/${file}.test.ts`;
    }
  }

  /**
   * Store generated tests to database
   */
  private async storeTests(tests: GeneratedTests): Promise<void> {
    try {
      await DatabaseConfig.query(
        `INSERT INTO generated_tests (id, task_id, type, content, path, coverage_estimate, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tests.id, tests.taskId, tests.type, tests.content, tests.path, tests.coverageEstimate, tests.generatedAt]
      );

      this.logger.debug('Tests stored', { id: tests.id, type: tests.type });
    } catch (error) {
      this.logger.error('Failed to store tests', {
        id: tests.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get generated tests
   */
  async getTests(taskId: string): Promise<GeneratedTests[]> {
    try {
      const result = await DatabaseConfig.query(
        `SELECT * FROM generated_tests WHERE task_id = $1 ORDER BY generated_at DESC`,
        [taskId]
      );

      return result.rows.map((row: Record<string, any>) => ({
        id: row.id,
        taskId: row.task_id,
        type: row.type,
        content: row.content,
        path: row.path,
        coverageEstimate: row.coverage_estimate,
        generatedAt: row.generated_at,
      }));
    } catch (error) {
      this.logger.error('Failed to get tests', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
