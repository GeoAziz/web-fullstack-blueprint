"use strict";
/**
 * Bull Message Queue Manager
 * Handles job queuing and inter-agent communication
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("@utils/logger");
const errors_1 = require("@utils/errors");
class QueueManager {
    constructor() {
        this.queues = new Map();
        this.logger = new logger_1.Logger('QueueManager');
        this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    }
    /**
     * Initialize queue system
     */
    async initialize() {
        this.logger.info('Initializing queue manager with Redis', { redisUrl: this.redisUrl });
        try {
            // Create queues for each agent type
            const agentTypes = ['frontend', 'backend', 'infrastructure', 'test', 'security', 'orchestrator'];
            for (const agentType of agentTypes) {
                const queue = new bull_1.default(agentType, this.redisUrl, {
                    defaultJobOptions: {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 2000,
                        },
                        removeOnComplete: false, // Keep for audit
                        removeOnFail: false, // Keep for debugging
                    },
                });
                // Setup event handlers
                queue.on('error', (error) => {
                    this.logger.error(`Queue error [${agentType}]`, { error: error.message });
                });
                queue.on('failed', (job, error) => {
                    this.logger.warn(`Job failed [${agentType}]`, {
                        jobId: job.id,
                        taskId: job.data.taskId,
                        error: error.message,
                        attemptsMade: job.attemptsMade,
                    });
                });
                queue.on('completed', (job) => {
                    this.logger.info(`Job completed [${agentType}]`, {
                        jobId: job.id,
                        taskId: job.data.taskId,
                    });
                });
                this.queues.set(agentType, queue);
            }
            this.logger.info('Queue manager initialized successfully', { queueCount: this.queues.size });
        }
        catch (error) {
            this.logger.error('Failed to initialize queue manager', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Queue a task for an agent
     */
    async queueTask(task, payload) {
        try {
            const queue = this.getQueue(task.agentType);
            const job = await queue.add({
                taskId: task.id,
                workflowId: task.workflowId,
                agentType: task.agentType,
                payload,
            }, {
                priority: this.priorityToScore(task.priority),
                delay: 0, // Process immediately
                jobId: task.id, // Use task ID as job ID for tracking
            });
            this.logger.info(`Task queued for agent [${task.agentType}]`, {
                jobId: job.id,
                taskId: task.id,
                priority: task.priority,
            });
            return job.id;
        }
        catch (error) {
            this.logger.error('Failed to queue task', {
                taskId: task.id,
                agentType: task.agentType,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Get queue for agent type
     */
    getQueue(agentType) {
        const queue = this.queues.get(agentType);
        if (!queue) {
            throw new errors_1.AppError(`Queue not found for agent type: ${agentType}`, 'QUEUE_NOT_FOUND');
        }
        return queue;
    }
    /**
     * Convert priority to Bull job priority score
     * Bull uses higher numbers = higher priority
     */
    priorityToScore(priority) {
        const scores = {
            critical: 100,
            high: 50,
            medium: 25,
            low: 10,
        };
        return scores[priority] || 25;
    }
    /**
     * Process jobs for an agent
     */
    async processJobs(agentType, processor) {
        try {
            const queue = this.getQueue(agentType);
            queue.process(processor);
            this.logger.info(`Job processor registered for agent [${agentType}]`);
        }
        catch (error) {
            this.logger.error('Failed to register job processor', {
                agentType,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Get job status
     */
    async getJobStatus(jobId, agentType) {
        try {
            const queue = this.getQueue(agentType);
            const job = await queue.getJob(jobId);
            if (!job) {
                return null;
            }
            const state = await job.getState();
            return state;
        }
        catch (error) {
            this.logger.error('Failed to get job status', {
                jobId,
                agentType,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Get queue statistics
     */
    async getQueueStats() {
        const stats = {};
        for (const [agentType, queue] of this.queues) {
            const counts = await queue.getJobCounts();
            stats[agentType] = {
                active: counts.active,
                waiting: counts.waiting,
                completed: counts.completed,
                failed: counts.failed,
                delayed: counts.delayed,
            };
        }
        return stats;
    }
    /**
     * Clear all queues
     */
    async clearAllQueues() {
        try {
            for (const [_, queue] of this.queues) {
                await queue.clean(0, 'completed'); // Keep only failed/active
                this.logger.info(`Queue cleared`);
            }
        }
        catch (error) {
            this.logger.error('Failed to clear queues', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Shutdown queue manager
     */
    async shutdown() {
        try {
            for (const [_, queue] of this.queues) {
                await queue.close();
            }
            this.queues.clear();
            this.logger.info('Queue manager shut down');
        }
        catch (error) {
            this.logger.error('Failed to shutdown queue manager', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
}
exports.QueueManager = QueueManager;
//# sourceMappingURL=queue-manager.js.map