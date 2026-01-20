/**
 * Bull Message Queue Manager
 * Handles job queuing and inter-agent communication
 */
import Queue from 'bull';
import { Task } from '@types';
export interface JobData {
    taskId: string;
    workflowId: string;
    agentType: string;
    payload: any;
}
export declare class QueueManager {
    private logger;
    private queues;
    private redisUrl;
    constructor();
    /**
     * Initialize queue system
     */
    initialize(): Promise<void>;
    /**
     * Queue a task for an agent
     */
    queueTask(task: Task, payload: any): Promise<string>;
    /**
     * Get queue for agent type
     */
    private getQueue;
    /**
     * Convert priority to Bull job priority score
     * Bull uses higher numbers = higher priority
     */
    private priorityToScore;
    /**
     * Process jobs for an agent
     */
    processJobs(agentType: string, processor: (job: Queue.Job<JobData>) => Promise<any>): Promise<void>;
    /**
     * Get job status
     */
    getJobStatus(jobId: string, agentType: string): Promise<string | null>;
    /**
     * Get queue statistics
     */
    getQueueStats(): Promise<Record<string, any>>;
    /**
     * Clear all queues
     */
    clearAllQueues(): Promise<void>;
    /**
     * Shutdown queue manager
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=queue-manager.d.ts.map