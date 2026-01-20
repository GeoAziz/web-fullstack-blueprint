/**
 * Agent Communication and Coordination System
 * Enables agents to communicate, share data, coordinate tasks, and manage dependencies
 */

import { Logger } from '@utils/logger';
import { QueueManager } from '@queue/queue-manager';
import { DatabaseConfig } from '@utils/database';
import { v4 as uuid } from 'uuid';

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'task' | 'result' | 'request' | 'status' | 'dependency' | 'failure';
  payload: Record<string, any>;
  taskId: string;
  workflowId: string;
  priority: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[]; // task IDs
  blockedUntil: string[]; // task IDs that must complete first
  isBlocked: boolean;
  resolvedAt?: Date;
}

export interface AgentCoordination {
  workflowId: string;
  agents: string[];
  taskOrder: string[];
  dependencies: Map<string, TaskDependency>;
  status: 'planning' | 'executing' | 'blocked' | 'complete' | 'failed';
}

export class AgentCoordinator {
  private logger: Logger;
  private queueManager: QueueManager;
  private coordinations: Map<string, AgentCoordination> = new Map();

  constructor() {
    this.logger = new Logger('AgentCoordinator');
    this.queueManager = new QueueManager();
  }

  /**
   * Create coordination plan for workflow
   */
  async createCoordinationPlan(
    workflowId: string,
    tasks: Array<{ id: string; agentType: string; dependencies?: string[] }>
  ): Promise<AgentCoordination> {
    this.logger.info('Creating coordination plan', {
      workflowId,
      taskCount: tasks.length,
    });

    try {
      const agents = Array.from(new Set(tasks.map((t) => t.agentType)));
      const dependencies = new Map<string, TaskDependency>();

      // Build dependency map
      for (const task of tasks) {
        dependencies.set(task.id, {
          taskId: task.id,
          dependsOn: task.dependencies || [],
          blockedUntil: task.dependencies || [],
          isBlocked: (task.dependencies?.length || 0) > 0,
        });
      }

      // Topologically sort tasks
      const taskOrder = this.topologicalSort(tasks, dependencies);

      const coordination: AgentCoordination = {
        workflowId,
        agents,
        taskOrder,
        dependencies,
        status: 'planning',
      };

      this.coordinations.set(workflowId, coordination);

      await this.saveCoordination(coordination);

      this.logger.info('Coordination plan created', {
        workflowId,
        agents: agents.length,
        taskOrder: taskOrder.length,
      });

      return coordination;
    } catch (error) {
      this.logger.error('Failed to create coordination plan', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get next task to execute (respecting dependencies)
   */
  async getNextExecutableTask(
    workflowId: string,
    completedTasks: Set<string>
  ): Promise<string | null> {
    const coordination = this.coordinations.get(workflowId);
    if (!coordination) {
      return null;
    }

    for (const taskId of coordination.taskOrder) {
      const dep = coordination.dependencies.get(taskId);
      if (!dep) continue;

      // Skip if already completed
      if (completedTasks.has(taskId)) {
        continue;
      }

      // Check if all dependencies are complete
      const allDepsComplete = dep.dependsOn.every((depId) => completedTasks.has(depId));

      if (allDepsComplete && dep.isBlocked) {
        // Mark as unblocked
        dep.isBlocked = false;
        dep.resolvedAt = new Date();
      }

      if (allDepsComplete) {
        return taskId;
      }
    }

    return null;
  }

  /**
   * Send message between agents
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    this.logger.debug('Sending agent message', {
      from: message.from,
      to: message.to,
      type: message.type,
      taskId: message.taskId,
    });

    try {
      // Store message in database
      await DatabaseConfig.query(
        `INSERT INTO agent_messages (id, from_agent, to_agent, type, payload, task_id, workflow_id, priority, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          message.id,
          message.from,
          message.to,
          message.type,
          JSON.stringify(message.payload),
          message.taskId,
          message.workflowId,
          message.priority,
          message.createdAt,
        ]
      );

      // Queue message for agent consumption
      const messagePriority: 'critical' | 'high' | 'medium' | 'low' = message.priority > 5 ? 'high' : 'medium';
      await this.queueManager.queueTask(
        {
          id: message.id,
          workflowId: message.workflowId,
          agentType: 'backend',
          title: `Message from ${message.from}`,
          description: `${message.type} message`,
          status: 'pending',
          priority: messagePriority,
          createdAt: message.createdAt,
          maxRetries: 3,
          retryCount: 0,
          dependencies: [],
          metadata: { messageType: message.type },
        },
        message
      );

      this.logger.debug('Message sent and queued', { messageId: message.id });
    } catch (error) {
      this.logger.error('Failed to send message', {
        messageId: message.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Report task completion and trigger dependents
   */
  async reportTaskCompletion(
    taskId: string,
    workflowId: string,
    result: Record<string, any>
  ): Promise<void> {
    this.logger.info('Task completion reported', { taskId, workflowId });

    try {
      const coordination = this.coordinations.get(workflowId);
      if (!coordination) {
        throw new Error(`Coordination not found for workflow ${workflowId}`);
      }

      // Find tasks that depend on this one
      const dependentTasks: string[] = [];
      for (const [depTaskId, dep] of coordination.dependencies.entries()) {
        if (dep.dependsOn.includes(taskId)) {
          dependentTasks.push(depTaskId);
          // Remove from blockedUntil
          dep.blockedUntil = dep.blockedUntil.filter((id) => id !== taskId);

          // Unblock if all dependencies are satisfied
          if (dep.blockedUntil.length === 0) {
            dep.isBlocked = false;
            dep.resolvedAt = new Date();
          }
        }
      }

      // Store completion
      await DatabaseConfig.query(
        `INSERT INTO task_completions (id, task_id, workflow_id, result, dependent_tasks, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuid().toString(),
          taskId,
          workflowId,
          JSON.stringify(result),
          JSON.stringify(dependentTasks),
          new Date(),
        ]
      );

      this.logger.info('Task completion recorded', {
        taskId,
        dependentTasks: dependentTasks.length,
      });
    } catch (error) {
      this.logger.error('Failed to report task completion', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Report task failure and handle cascade
   */
  async reportTaskFailure(
    taskId: string,
    workflowId: string,
    error: string,
    retryable: boolean = true
  ): Promise<void> {
    this.logger.error('Task failure reported', {
      taskId,
      workflowId,
      error,
      retryable,
    });

    try {
      const coordination = this.coordinations.get(workflowId);
      if (!coordination) {
        throw new Error(`Coordination not found for workflow ${workflowId}`);
      }

      // If not retryable, mark workflow as failed
      if (!retryable) {
        coordination.status = 'failed';

        // Notify all dependent tasks of failure
        for (const [depTaskId, dep] of coordination.dependencies.entries()) {
          if (dep.dependsOn.includes(taskId)) {
            await this.sendMessage({
              id: uuid().toString(),
              from: 'coordinator',
              to: 'system',
              type: 'failure',
              payload: {
                reason: `Dependency ${taskId} failed`,
                cascade: true,
              },
              taskId: depTaskId,
              workflowId,
              priority: 10,
              createdAt: new Date(),
            });
          }
        }
      }

      // Store failure
      await DatabaseConfig.query(
        `INSERT INTO task_failures (id, task_id, workflow_id, error, retryable, failed_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuid().toString(), taskId, workflowId, error, retryable, new Date()]
      );

      this.logger.info('Task failure recorded', { taskId, retryable });
    } catch (error) {
      this.logger.error('Failed to report task failure', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Share artifact between agents
   */
  async shareArtifact(
    sourceTaskId: string,
    targetTaskId: string,
    artifactKey: string,
    artifact: Record<string, any>
  ): Promise<void> {
    this.logger.debug('Sharing artifact', {
      from: sourceTaskId,
      to: targetTaskId,
      key: artifactKey,
    });

    try {
      await DatabaseConfig.query(
        `INSERT INTO shared_artifacts (id, source_task_id, target_task_id, key, value, shared_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuid().toString(),
          sourceTaskId,
          targetTaskId,
          artifactKey,
          JSON.stringify(artifact),
          new Date(),
        ]
      );

      this.logger.debug('Artifact shared', { artifactKey });
    } catch (error) {
      this.logger.error('Failed to share artifact', {
        artifactKey,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get shared artifacts for a task
   */
  async getSharedArtifacts(
    taskId: string
  ): Promise<Map<string, Record<string, any>>> {
    try {
      const result = await DatabaseConfig.query(
        `SELECT key, value FROM shared_artifacts WHERE target_task_id = $1`,
        [taskId]
      );

      const artifacts = new Map<string, Record<string, any>>();
      for (const row of result.rows) {
        const r = row as Record<string, any>;
        artifacts.set(r.key, JSON.parse(r.value));
      }

      return artifacts;
    } catch (error) {
      this.logger.error('Failed to get artifacts', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Topologically sort tasks by dependencies
   */
  private topologicalSort(
    tasks: Array<{ id: string; dependencies?: string[] }>,
    dependencies: Map<string, TaskDependency>
  ): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string): void => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        this.logger.warn('Circular dependency detected', { taskId });
        return;
      }

      visiting.add(taskId);

      const deps = dependencies.get(taskId);
      if (deps) {
        for (const depId of deps.dependsOn) {
          visit(depId);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(taskId);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return sorted;
  }

  /**
   * Save coordination to database
   */
  private async saveCoordination(coordination: AgentCoordination): Promise<void> {
    try {
      const deps = Array.from(coordination.dependencies.values());
      await DatabaseConfig.query(
        `INSERT INTO agent_coordinations (id, workflow_id, agents, task_order, dependencies, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuid().toString(),
          coordination.workflowId,
          JSON.stringify(coordination.agents),
          JSON.stringify(coordination.taskOrder),
          JSON.stringify(deps),
          coordination.status,
          new Date(),
        ]
      );
    } catch (error) {
      this.logger.error('Failed to save coordination', {
        workflowId: coordination.workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get coordination status
   */
  async getCoordinationStatus(workflowId: string): Promise<AgentCoordination | null> {
    return this.coordinations.get(workflowId) || null;
  }

  /**
   * Update coordination status
   */
  async updateCoordinationStatus(
    workflowId: string,
    status: 'planning' | 'executing' | 'blocked' | 'complete' | 'failed'
  ): Promise<void> {
    const coordination = this.coordinations.get(workflowId);
    if (coordination) {
      coordination.status = status;
      this.logger.info('Coordination status updated', { workflowId, status });
    }
  }
}
