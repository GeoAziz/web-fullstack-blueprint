"use strict";
/**
 * Agent Communication and Coordination System
 * Enables agents to communicate, share data, coordinate tasks, and manage dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCoordinator = void 0;
const logger_1 = require("@utils/logger");
const queue_manager_1 = require("@queue/queue-manager");
const database_1 = require("@utils/database");
const uuid_1 = require("uuid");
class AgentCoordinator {
    constructor() {
        this.coordinations = new Map();
        this.logger = new logger_1.Logger('AgentCoordinator');
        this.queueManager = new queue_manager_1.QueueManager();
    }
    /**
     * Create coordination plan for workflow
     */
    async createCoordinationPlan(workflowId, tasks) {
        this.logger.info('Creating coordination plan', {
            workflowId,
            taskCount: tasks.length,
        });
        try {
            const agents = Array.from(new Set(tasks.map((t) => t.agentType)));
            const dependencies = new Map();
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
            const coordination = {
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
        }
        catch (error) {
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
    async getNextExecutableTask(workflowId, completedTasks) {
        const coordination = this.coordinations.get(workflowId);
        if (!coordination) {
            return null;
        }
        for (const taskId of coordination.taskOrder) {
            const dep = coordination.dependencies.get(taskId);
            if (!dep)
                continue;
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
    async sendMessage(message) {
        this.logger.debug('Sending agent message', {
            from: message.from,
            to: message.to,
            type: message.type,
            taskId: message.taskId,
        });
        try {
            // Store message in database
            await database_1.DatabaseConfig.query(`INSERT INTO agent_messages (id, from_agent, to_agent, type, payload, task_id, workflow_id, priority, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                message.id,
                message.from,
                message.to,
                message.type,
                JSON.stringify(message.payload),
                message.taskId,
                message.workflowId,
                message.priority,
                message.createdAt,
            ]);
            // Queue message for agent consumption
            const messagePriority = message.priority > 5 ? 'high' : 'medium';
            await this.queueManager.queueTask({
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
            }, message);
            this.logger.debug('Message sent and queued', { messageId: message.id });
        }
        catch (error) {
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
    async reportTaskCompletion(taskId, workflowId, result) {
        this.logger.info('Task completion reported', { taskId, workflowId });
        try {
            const coordination = this.coordinations.get(workflowId);
            if (!coordination) {
                throw new Error(`Coordination not found for workflow ${workflowId}`);
            }
            // Find tasks that depend on this one
            const dependentTasks = [];
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
            await database_1.DatabaseConfig.query(`INSERT INTO task_completions (id, task_id, workflow_id, result, dependent_tasks, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)`, [
                (0, uuid_1.v4)().toString(),
                taskId,
                workflowId,
                JSON.stringify(result),
                JSON.stringify(dependentTasks),
                new Date(),
            ]);
            this.logger.info('Task completion recorded', {
                taskId,
                dependentTasks: dependentTasks.length,
            });
        }
        catch (error) {
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
    async reportTaskFailure(taskId, workflowId, error, retryable = true) {
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
                            id: (0, uuid_1.v4)().toString(),
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
            await database_1.DatabaseConfig.query(`INSERT INTO task_failures (id, task_id, workflow_id, error, retryable, failed_at)
         VALUES ($1, $2, $3, $4, $5, $6)`, [(0, uuid_1.v4)().toString(), taskId, workflowId, error, retryable, new Date()]);
            this.logger.info('Task failure recorded', { taskId, retryable });
        }
        catch (error) {
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
    async shareArtifact(sourceTaskId, targetTaskId, artifactKey, artifact) {
        this.logger.debug('Sharing artifact', {
            from: sourceTaskId,
            to: targetTaskId,
            key: artifactKey,
        });
        try {
            await database_1.DatabaseConfig.query(`INSERT INTO shared_artifacts (id, source_task_id, target_task_id, key, value, shared_at)
         VALUES ($1, $2, $3, $4, $5, $6)`, [
                (0, uuid_1.v4)().toString(),
                sourceTaskId,
                targetTaskId,
                artifactKey,
                JSON.stringify(artifact),
                new Date(),
            ]);
            this.logger.debug('Artifact shared', { artifactKey });
        }
        catch (error) {
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
    async getSharedArtifacts(taskId) {
        try {
            const result = await database_1.DatabaseConfig.query(`SELECT key, value FROM shared_artifacts WHERE target_task_id = $1`, [taskId]);
            const artifacts = new Map();
            for (const row of result.rows) {
                const r = row;
                artifacts.set(r.key, JSON.parse(r.value));
            }
            return artifacts;
        }
        catch (error) {
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
    topologicalSort(tasks, dependencies) {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (taskId) => {
            if (visited.has(taskId))
                return;
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
    async saveCoordination(coordination) {
        try {
            const deps = Array.from(coordination.dependencies.values());
            await database_1.DatabaseConfig.query(`INSERT INTO agent_coordinations (id, workflow_id, agents, task_order, dependencies, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                (0, uuid_1.v4)().toString(),
                coordination.workflowId,
                JSON.stringify(coordination.agents),
                JSON.stringify(coordination.taskOrder),
                JSON.stringify(deps),
                coordination.status,
                new Date(),
            ]);
        }
        catch (error) {
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
    async getCoordinationStatus(workflowId) {
        return this.coordinations.get(workflowId) || null;
    }
    /**
     * Update coordination status
     */
    async updateCoordinationStatus(workflowId, status) {
        const coordination = this.coordinations.get(workflowId);
        if (coordination) {
            coordination.status = status;
            this.logger.info('Coordination status updated', { workflowId, status });
        }
    }
}
exports.AgentCoordinator = AgentCoordinator;
//# sourceMappingURL=agent-coordinator.js.map