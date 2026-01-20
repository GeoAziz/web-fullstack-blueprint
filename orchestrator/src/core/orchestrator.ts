/**
 * Core Orchestration Engine
 * Coordinates all AI agents and workflow execution
 */

import { Logger } from '@utils/logger';
import { Workflow, WorkflowStatus, ParsedRequirements, ExecutionPlan, ExecutionPhase, Task, TaskStatus } from '@types';
import { AppError, ValidationError } from '@utils/errors';
import { DatabaseConfig } from '@utils/database';
import { v4 as uuid } from 'uuid';

export class Orchestrator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Orchestrator');
  }

  /**
   * Create and start a new workflow from requirements
   */
  async startWorkflow(requirements: ParsedRequirements, createdBy: string): Promise<Workflow> {
    this.logger.info(`Starting workflow for feature: ${requirements.featureId}`, {
      featureId: requirements.featureId,
      title: requirements.title,
      complexity: requirements.estimatedComplexity,
    });

    try {
      const workflowId = uuid().toString();
      const workflow: Workflow = {
        id: workflowId,
        status: 'validating',
        title: requirements.title,
        description: requirements.description,
        requirements,
        tasks: [],
        executionPlan: this.createExecutionPlan(requirements),
        createdAt: new Date(),
        createdBy,
      };

      // Validate requirements
      await this.validateRequirements(requirements);

      // Save workflow to database
      await this.saveWorkflow(workflow);

      // Create tasks from execution plan
      const tasks = await this.createTasks(workflow);
      workflow.tasks = tasks;

      // Update workflow status
      workflow.status = 'planning';
      await this.updateWorkflowStatus(workflow.id, 'planning');

      this.logger.info(`Workflow created: ${workflow.id}`, { workflowId: workflow.id });
      return workflow;
    } catch (error) {
      this.logger.error('Failed to start workflow', {
        featureId: requirements.featureId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create execution plan from requirements
   */
  private createExecutionPlan(_requirements: ParsedRequirements): ExecutionPlan {
    const phases: ExecutionPhase[] = [];

    // Phase 1: Frontend
    phases.push({
      phaseNumber: 1,
      name: 'Frontend Development',
      description: 'Generate React/Next.js components',
      taskIds: [],
      estimatedDurationMs: 60000,
      prerequisitePhases: [],
    });

    // Phase 2: Backend (future)
    phases.push({
      phaseNumber: 2,
      name: 'Backend Development',
      description: 'Generate API endpoints',
      taskIds: [],
      estimatedDurationMs: 60000,
      prerequisitePhases: [1],
    });

    // Phase 3: Tests
    phases.push({
      phaseNumber: 3,
      name: 'Testing',
      description: 'Generate and run tests',
      taskIds: [],
      estimatedDurationMs: 30000,
      prerequisitePhases: [1, 2],
    });

    // Phase 4: Quality Gates
    phases.push({
      phaseNumber: 4,
      name: 'Quality Validation',
      description: 'Run quality gates',
      taskIds: [],
      estimatedDurationMs: 20000,
      prerequisitePhases: [3],
    });

    // Phase 5: Git & Deployment
    phases.push({
      phaseNumber: 5,
      name: 'Git & Deployment',
      description: 'Create PR and prepare for deployment',
      taskIds: [],
      estimatedDurationMs: 10000,
      prerequisitePhases: [4],
    });

    const totalTime = phases.reduce((sum, p) => sum + p.estimatedDurationMs, 0);

    return {
      phaseCount: phases.length,
      phases,
      totalEstimatedTimeMs: totalTime,
      criticalPath: [], // Will be populated as tasks execute
      parallelizableGroups: [], // Will be populated based on task dependencies
    };
  }

  /**
   * Create tasks from execution plan
   */
  private async createTasks(workflow: Workflow): Promise<Task[]> {
    const tasks: Task[] = [];

    // For Phase 1, create frontend task only
    const frontendPhase = workflow.executionPlan.phases[0];

    const userStories = workflow.requirements.userStories;
    const componentCount = Math.max(1, Math.ceil(userStories.length / 2));

    for (let i = 0; i < componentCount; i++) {
      const task: Task = {
        id: uuid().toString(),
        workflowId: workflow.id,
        agentType: 'frontend',
        title: `Frontend Component ${i + 1}`,
        description: `Generate React component for user story(ies)`,
        status: 'pending',
        priority: workflow.requirements.priority,
        createdAt: new Date(),
        estimatedDurationMs: 60000,
        actualDurationMs: 0,
        retryCount: 0,
        maxRetries: 3,
        dependencies: i > 0 ? [tasks[i - 1].id] : [],
        metadata: {
          componentIndex: i,
          userStories: userStories.slice(i * 2, (i + 1) * 2),
        },
      };

      tasks.push(task);
      frontendPhase.taskIds.push(task.id);

      // Save task to database
      await this.saveTask(task);
    }

    return tasks;
  }

  /**
   * Validate requirements are complete
   */
  private async validateRequirements(requirements: ParsedRequirements): Promise<void> {
    const errors: string[] = [];

    if (!requirements.featureId) errors.push('Feature ID is required');
    if (!requirements.title) errors.push('Title is required');
    if (requirements.userStories.length === 0) errors.push('At least one user story is required');
    if (requirements.acceptanceCriteria.length === 0) errors.push('At least one acceptance criterion is required');

    if (errors.length > 0) {
      throw new ValidationError(`Requirements validation failed: ${errors.join('; ')}`, {
        errors,
      });
    }

    this.logger.info('Requirements validated successfully', {
      featureId: requirements.featureId,
    });
  }

  /**
   * Save workflow to database
   */
  private async saveWorkflow(workflow: Workflow): Promise<void> {
    try {
      const result = await DatabaseConfig.query(
        `INSERT INTO workflows 
         (id, status, title, description, requirements, execution_plan, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          workflow.id,
          workflow.status,
          workflow.title,
          workflow.description,
          JSON.stringify(workflow.requirements),
          JSON.stringify(workflow.executionPlan),
          workflow.createdBy,
        ]
      );

      if (result.rows.length === 0) {
        throw new AppError('Failed to save workflow', 'DB_INSERT_FAILED');
      }

      this.logger.debug('Workflow saved to database', { workflowId: workflow.id });
    } catch (error) {
      this.logger.error('Failed to save workflow', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Save task to database
   */
  private async saveTask(task: Task): Promise<void> {
    try {
      await DatabaseConfig.query(
        `INSERT INTO tasks 
         (id, workflow_id, agent_type, title, description, status, priority, 
          estimated_duration_ms, max_retries, dependencies, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          task.id,
          task.workflowId,
          task.agentType,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.estimatedDurationMs,
          task.maxRetries,
          JSON.stringify(task.dependencies),
          JSON.stringify(task.metadata),
        ]
      );

      this.logger.debug('Task saved to database', { taskId: task.id });
    } catch (error) {
      this.logger.error('Failed to save task', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update workflow status
   */
  private async updateWorkflowStatus(workflowId: string, status: WorkflowStatus): Promise<void> {
    try {
      await DatabaseConfig.query(
        'UPDATE workflows SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, workflowId]
      );

      this.logger.debug('Workflow status updated', { workflowId, status });
    } catch (error) {
      this.logger.error('Failed to update workflow status', {
        workflowId,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    try {
      const result = await DatabaseConfig.query('SELECT * FROM workflows WHERE id = $1', [workflowId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        status: row.status,
        title: row.title,
        description: row.description,
        requirements: row.requirements,
        executionPlan: row.execution_plan,
        tasks: [],
        createdAt: row.created_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdBy: row.created_by,
      };
    } catch (error) {
      this.logger.error('Failed to get workflow', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get tasks for workflow
   */
  async getWorkflowTasks(workflowId: string): Promise<Task[]> {
    try {
      const result = await DatabaseConfig.query('SELECT * FROM tasks WHERE workflow_id = $1 ORDER BY created_at', [
        workflowId,
      ]);

      return (result.rows as any[]).map((row) => ({
        id: row.id,
        workflowId: row.workflow_id,
        agentType: row.agent_type,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        estimatedDurationMs: row.estimated_duration_ms,
        actualDurationMs: row.actual_duration_ms,
        retryCount: row.retry_count,
        maxRetries: row.max_retries,
        error: row.error,
        dependencies: row.dependencies || [],
        metadata: row.metadata || {},
      }));
    } catch (error) {
      this.logger.error('Failed to get workflow tasks', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, error?: string): Promise<void> {
    try {
      const now = new Date();

      await DatabaseConfig.query(
        `UPDATE tasks SET status = $1, ${error ? 'error = $3,' : ''} 
         ${status === 'in-progress' ? 'started_at = $2,' : ''}
         ${status === 'completed' || status === 'failed' ? 'completed_at = $2,' : ''}
         updated_at = $2
         WHERE id = $1`,
        error ? [taskId, now, error] : [taskId, now]
      );

      this.logger.debug('Task status updated', { taskId, status });
    } catch (error) {
      this.logger.error('Failed to update task status', {
        taskId,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get next pending task
   */
  async getNextPendingTask(agentType: string): Promise<Task | null> {
    try {
      const result = await DatabaseConfig.query(
        `SELECT * FROM tasks 
         WHERE agent_type = $1 AND status = 'pending'
         ORDER BY priority DESC, created_at ASC
         LIMIT 1`,
        [agentType]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        workflowId: row.workflow_id,
        agentType: row.agent_type,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at,
        estimatedDurationMs: row.estimated_duration_ms,
        retryCount: row.retry_count,
        maxRetries: row.max_retries,
        dependencies: row.dependencies || [],
        metadata: row.metadata || {},
      };
    } catch (error) {
      this.logger.error('Failed to get next pending task', {
        agentType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
