/**
 * Frontend Development Agent
 * Generates React components and manages frontend assets
 */

import { v4 as uuid } from 'uuid';
import { Logger } from '@utils/logger';
import { ClaudeWrapper } from '@services/claude-api';
import { DatabaseConfig } from '@utils/database';
import { QueueManager, JobData } from '@queue/queue-manager';
import { ValidationError } from '@utils/errors';
import Bull from 'bull';

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

export class FrontendAgent {
  private logger: Logger;
  private claude: ClaudeWrapper;
  private queueManager: QueueManager;
  private componentLibrary: Map<string, GeneratedComponent> = new Map();

  constructor(queueManager: QueueManager) {
    this.logger = new Logger('FrontendAgent');
    this.claude = new ClaudeWrapper();
    this.queueManager = queueManager;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Frontend Agent');

    try {
      await DatabaseConfig.initialize();
      await this.claude.validateConnection();

      // Register job processor
      await this.queueManager.processJobs('frontend', (job) => this.processComponentGeneration(job));

      this.logger.info('Frontend Agent initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Frontend Agent', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Process component generation job
   */
  private async processComponentGeneration(job: Bull.Job<JobData>): Promise<GeneratedComponent> {
    const startTime = Date.now();
    const { taskId, workflowId, payload } = job.data;
    const componentPayload = payload as ComponentGenerationPayload;

    try {
      this.logger.info('Processing component generation', {
        jobId: job.id,
        taskId,
        componentName: componentPayload.componentName,
      });

      // Validate payload
      this.validatePayload(componentPayload);

      // Generate component code
      const component = await this.generateComponent(componentPayload);

      // Generate tests
      const tests = await this.generateTests(componentPayload, component);

      // Generate TypeScript typings
      const typings = await this.generateTypings(component);

      // Validate generated code
      await this.validateGeneratedCode(component.code, tests);

      // Store component
      await this.storeComponent(component, tests, typings, workflowId);

      // Update task
      await this.updateTaskCompletion(taskId, workflowId, {
        componentId: component.id,
        componentPath: component.path,
        duration: Date.now() - startTime,
        status: 'success',
      });

      this.logger.info('Component generation completed', {
        taskId,
        componentName: componentPayload.componentName,
        duration: Date.now() - startTime,
      });

      return component;
    } catch (error) {
      this.logger.error('Component generation failed', {
        jobId: job.id,
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Update task with failure
      await this.updateTaskCompletion(taskId, workflowId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Validate component generation payload
   */
  private validatePayload(payload: ComponentGenerationPayload): void {
    if (!payload.componentName) {
      throw new ValidationError('Component name is required', { field: 'componentName' });
    }

    if (!payload.description) {
      throw new ValidationError('Component description is required', { field: 'description' });
    }

    if (!Array.isArray(payload.userStories) || payload.userStories.length === 0) {
      throw new ValidationError('At least one user story is required', { field: 'userStories' });
    }

    if (!Array.isArray(payload.acceptanceCriteria) || payload.acceptanceCriteria.length === 0) {
      throw new ValidationError('At least one acceptance criterion is required', { field: 'acceptanceCriteria' });
    }
  }

  /**
   * Generate React component code
   */
  private async generateComponent(payload: ComponentGenerationPayload): Promise<GeneratedComponent> {
    const systemPrompt = this.buildComponentPrompt(payload);

    const componentCode = await this.claude.generateCode(
      `Generate a React component named ${payload.componentName}\n\nDescription: ${payload.description}\n\nRequirements:\n${payload.userStories.join('\n')}\n\nAcceptance Criteria:\n${payload.acceptanceCriteria.join('\n')}`,
      systemPrompt
    );

    const component: GeneratedComponent = {
      id: uuid(),
      name: payload.componentName,
      path: `src/components/${payload.componentName}/index.tsx`,
      code: componentCode,
      tests: '', // Will be generated next
      typings: '', // Will be generated next
      metadata: {
        generatedAt: new Date(),
        complexity: this.estimateComplexity(payload),
        estimatedCoverage: 0, // Will be calculated
        dependencies: this.extractDependencies(componentCode),
        storyCount: payload.userStories.length,
        criteriaCount: payload.acceptanceCriteria.length,
      },
    };

    return component;
  }

  /**
   * Generate component tests
   */
  private async generateTests(payload: ComponentGenerationPayload, component: GeneratedComponent): Promise<string> {
    const testPrompt = `Generate comprehensive Jest/React Testing Library tests for the following component:\n\nComponent:\n${component.code}\n\nAcceptance Criteria:\n${payload.acceptanceCriteria.join('\n')}\n\nRequirements:\n- Tests should cover all acceptance criteria\n- Use React Testing Library best practices\n- Include user interaction tests\n- Aim for >90% code coverage`;

    const tests = await this.claude.generateCode(testPrompt, 'Generate unit tests');

    return tests;
  }

  /**
   * Generate TypeScript type definitions
   */
  private async generateTypings(component: GeneratedComponent): Promise<string> {
    const typingPrompt = `Extract and generate TypeScript interface definitions for the following React component:\n\n${component.code}\n\nRequirements:\n- Export all prop interfaces\n- Include JSDoc comments\n- Define all state and context types\n- Make sure types are strict and complete`;

    const typings = await this.claude.generateCode(typingPrompt, 'Generate TypeScript types');

    return typings;
  }

  /**
   * Validate generated code quality
   */
  private async validateGeneratedCode(code: string, tests: string): Promise<void> {
    // Check for basic syntax validity
    if (!code.includes('export')) {
      throw new ValidationError('Generated code must export a component', { issue: 'missing_export' });
    }

    if (!code.includes('function ') && !code.includes('const ') && !code.includes('class ')) {
      throw new ValidationError('Generated code must define a component', { issue: 'no_component_definition' });
    }

    if (tests.length === 0) {
      throw new ValidationError('No tests were generated', { issue: 'empty_tests' });
    }

    // Check test structure
    if (!tests.includes('describe') && !tests.includes('it(')) {
      throw new ValidationError('Generated tests must use Jest structure', { issue: 'invalid_jest_format' });
    }

    this.logger.info('Generated code validation passed');
  }

  /**
   * Store component to database
   */
  private async storeComponent(
    component: GeneratedComponent,
    tests: string,
    typings: string,
    _workflowId: string
  ): Promise<void> {
    try {
      const client = await DatabaseConfig.getPool().connect();

      try {
        await client.query(
          `
          INSERT INTO generated_components 
          (id, workflow_id, name, path, code, tests, typings, complexity, estimated_coverage, dependencies, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `,
          [
            component.id,
            _workflowId,
            component.name,
            component.path,
            component.code,
            tests,
            typings,
            component.metadata.complexity,
            component.metadata.estimatedCoverage,
            JSON.stringify(component.metadata.dependencies),
          ]
        );

        this.logger.info('Component stored in database', {
          componentId: component.id,
          componentName: component.name,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to store component', {
        componentId: component.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update task completion status
   */
  private async updateTaskCompletion(
    taskId: string,
    _workflowId: string,
    result: Record<string, any>
  ): Promise<void> {
    try {
      const client = await DatabaseConfig.getPool().connect();

      try {
        await client.query(
          `
          UPDATE tasks 
          SET status = $1, result = $2, completed_at = NOW(), updated_at = NOW()
          WHERE id = $3
        `,
          [result.status === 'success' ? 'completed' : 'failed', JSON.stringify(result), taskId]
        );

        this.logger.info('Task completion updated', {
          taskId,
          status: result.status,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to update task', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Build component generation system prompt
   */
  private buildComponentPrompt(payload: ComponentGenerationPayload): string {
    return `You are a senior React developer generating production-quality React components.

Guidelines:
- Use TypeScript with strict types
- Follow React best practices
- Use functional components with hooks
- Include comprehensive JSDoc comments
- Handle edge cases and error states
- Ensure accessibility (a11y)
- Use composition over inheritance
- Implement proper error boundaries
- Support responsive design

Design System:
${payload.designSystem ? JSON.stringify(payload.designSystem, null, 2) : 'Use Tailwind CSS'}

Existing Components to Reference:
${payload.existingComponents?.join('\n') || 'No existing components'}

Output ONLY valid React TSX code, no explanations or markdown.`;
  }

  /**
   * Estimate component complexity
   */
  private estimateComplexity(payload: ComponentGenerationPayload): 'simple' | 'moderate' | 'complex' {
    const totalRequirements = payload.userStories.length + payload.acceptanceCriteria.length;

    if (totalRequirements <= 3) return 'simple';
    if (totalRequirements <= 8) return 'moderate';
    return 'complex';
  }

  /**
   * Extract dependencies from generated code
   */
  private extractDependencies(code: string): string[] {
    const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const dependencies: Set<string> = new Set();

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const importPath = match[1];
      // Only external dependencies (not relative imports)
      if (!importPath.startsWith('.')) {
        dependencies.add(importPath.split('/')[0]);
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Get component from library
   */
  getComponent(componentId: string): GeneratedComponent | undefined {
    return this.componentLibrary.get(componentId);
  }

  /**
   * Get all components for a workflow
   */
  async getWorkflowComponents(workflowId: string): Promise<GeneratedComponent[]> {
    try {
      const client = await DatabaseConfig.getPool().connect();

      try {
        const result = await client.query(
          `
          SELECT * FROM generated_components 
          WHERE workflow_id = $1
          ORDER BY created_at DESC
        `,
          [workflowId]
        );

        return (result.rows as any[]).map((row) => ({
          id: row.id,
          name: row.name,
          path: row.path,
          code: row.code,
          tests: row.tests,
          typings: row.typings,
          metadata: {
            generatedAt: row.created_at,
            complexity: row.complexity,
            estimatedCoverage: row.estimated_coverage,
            dependencies: JSON.parse(row.dependencies || '[]'),
            storyCount: 0,
            criteriaCount: 0,
          },
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to retrieve workflow components', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
