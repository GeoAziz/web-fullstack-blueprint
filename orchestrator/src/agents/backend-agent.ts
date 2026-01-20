/**
 * Backend Development Agent
 * Generates backend services, APIs, and data models
 */

import { v4 as uuid } from 'uuid';
import { Logger } from '@utils/logger';
import { ClaudeWrapper } from '@services/claude-api';
import { DatabaseConfig } from '@utils/database';
import { QueueManager, JobData } from '@queue/queue-manager';
import { ValidationError } from '@utils/errors';
import Bull from 'bull';

export interface BackendServiceGenerationPayload {
  serviceName: string;
  description: string;
  apiEndpoints: string[];
  dataModels: Record<string, any>[];
  userStories: string[];
  acceptanceCriteria: string[];
  existingServices?: string[];
}

export interface GeneratedBackendService {
  id: string;
  name: string;
  paths: {
    controllers: string;
    models: string;
    services: string;
    tests: string;
  };
  code: Record<string, string>;
  tests: string;
  metadata: ServiceMetadata;
}

export interface ServiceMetadata {
  generatedAt: Date;
  complexity: 'simple' | 'moderate' | 'complex';
  apiEndpointCount: number;
  modelCount: number;
  dependencies: string[];
}

export class BackendAgent {
  private logger: Logger;
  private claude: ClaudeWrapper;
  private queueManager: QueueManager;

  constructor(queueManager: QueueManager) {
    this.logger = new Logger('BackendAgent');
    this.claude = new ClaudeWrapper();
    this.queueManager = queueManager;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Backend Agent');

    try {
      await DatabaseConfig.initialize();
      await this.claude.validateConnection();

      // Register job processor
      await this.queueManager.processJobs('backend', (job) => this.processServiceGeneration(job));

      this.logger.info('Backend Agent initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Backend Agent', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Process backend service generation job
   */
  private async processServiceGeneration(job: Bull.Job<JobData>): Promise<GeneratedBackendService> {
    const startTime = Date.now();
    const { taskId, workflowId, payload } = job.data;
    const servicePayload = payload as BackendServiceGenerationPayload;

    try {
      this.logger.info('Processing backend service generation', {
        jobId: job.id,
        taskId,
        serviceName: servicePayload.serviceName,
      });

      // Validate payload
      this.validatePayload(servicePayload);

      // Generate service code
      const service = await this.generateService(servicePayload);

      // Generate tests
      const tests = await this.generateServiceTests(servicePayload, service);

      // Store service
      await this.storeService(service, tests, workflowId);

      // Update task
      await this.updateTaskCompletion(taskId, {
        serviceId: service.id,
        serviceName: service.name,
        duration: Date.now() - startTime,
        status: 'success',
      });

      this.logger.info('Backend service generation completed', {
        taskId,
        serviceName: servicePayload.serviceName,
        duration: Date.now() - startTime,
      });

      return service;
    } catch (error) {
      this.logger.error('Backend service generation failed', {
        jobId: job.id,
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Update task with failure
      await this.updateTaskCompletion(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Validate service generation payload
   */
  private validatePayload(payload: BackendServiceGenerationPayload): void {
    if (!payload.serviceName) {
      throw new ValidationError('Service name is required', { field: 'serviceName' });
    }

    if (!payload.description) {
      throw new ValidationError('Service description is required', { field: 'description' });
    }

    if (!Array.isArray(payload.apiEndpoints) || payload.apiEndpoints.length === 0) {
      throw new ValidationError('At least one API endpoint is required', { field: 'apiEndpoints' });
    }

    if (!Array.isArray(payload.dataModels) || payload.dataModels.length === 0) {
      throw new ValidationError('At least one data model is required', { field: 'dataModels' });
    }
  }

  /**
   * Generate backend service code
   */
  private async generateService(payload: BackendServiceGenerationPayload): Promise<GeneratedBackendService> {
    const systemPrompt = this.buildServicePrompt(payload);

    const serviceCode = await this.claude.generateCode(
      `Generate a backend service named ${payload.serviceName}\n\nDescription: ${payload.description}\n\nAPI Endpoints:\n${payload.apiEndpoints.join('\n')}\n\nData Models:\n${JSON.stringify(payload.dataModels, null, 2)}\n\nRequirements:\n${payload.userStories.join('\n')}`,
      systemPrompt
    );

    const service: GeneratedBackendService = {
      id: uuid(),
      name: payload.serviceName,
      paths: {
        controllers: `src/api/controllers/${payload.serviceName}Controller.ts`,
        models: `src/models/${payload.serviceName}Model.ts`,
        services: `src/services/${payload.serviceName}Service.ts`,
        tests: `tests/${payload.serviceName}.test.ts`,
      },
      code: { controllers: serviceCode },
      tests: '',
      metadata: {
        generatedAt: new Date(),
        complexity: payload.dataModels.length > 5 ? 'complex' : 'moderate',
        apiEndpointCount: payload.apiEndpoints.length,
        modelCount: payload.dataModels.length,
        dependencies: this.extractDependencies(serviceCode),
      },
    };

    return service;
  }

  /**
   * Generate service tests
   */
  private async generateServiceTests(payload: BackendServiceGenerationPayload, service: GeneratedBackendService): Promise<string> {
    const testPrompt = `Generate comprehensive Jest tests for the following backend service:\n\nService: ${service.name}\nCode: ${service.code.controllers}\n\nAPI Endpoints:\n${payload.apiEndpoints.join('\n')}\n\nAcceptance Criteria:\n${payload.acceptanceCriteria.join('\n')}\n\nRequirements:\n- Tests should cover all endpoints\n- Include error cases\n- Mock database/external services\n- Aim for >90% code coverage`;

    const tests = await this.claude.generateCode(testPrompt, 'Generate service tests');

    return tests;
  }

  /**
   * Store service to database
   */
  private async storeService(service: GeneratedBackendService, tests: string, workflowId: string): Promise<void> {
    try {
      const client = await DatabaseConfig.getPool().connect();

      try {
        await client.query(
          `
          INSERT INTO generated_services 
          (id, workflow_id, name, paths, code, tests, complexity, endpoint_count, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `,
          [
            service.id,
            workflowId,
            service.name,
            JSON.stringify(service.paths),
            JSON.stringify(service.code),
            tests,
            service.metadata.complexity,
            service.metadata.apiEndpointCount,
          ]
        );

        this.logger.info('Service stored in database', {
          serviceId: service.id,
          serviceName: service.name,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to store service', {
        serviceId: service.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update task completion status
   */
  private async updateTaskCompletion(taskId: string, result: Record<string, any>): Promise<void> {
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
   * Build service generation system prompt
   */
  private buildServicePrompt(_payload: BackendServiceGenerationPayload): string {
    return `You are a senior backend developer generating production-quality Node.js/TypeScript services.

Guidelines:
- Use TypeScript with strict types
- Follow REST API best practices
- Implement proper error handling
- Use dependency injection
- Include comprehensive JSDoc comments
- Add input validation
- Implement logging at key points
- Support graceful shutdown
- Use environment variables for config

Output ONLY valid TypeScript code, no explanations or markdown.`;
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
      if (!importPath.startsWith('.')) {
        dependencies.add(importPath.split('/')[0]);
      }
    }

    return Array.from(dependencies);
  }
}
