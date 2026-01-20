/**
 * Core Orchestration Engine
 * Coordinates all AI agents and workflow execution
 */
import { Workflow, ParsedRequirements, Task, TaskStatus } from '@types';
export declare class Orchestrator {
    private logger;
    constructor();
    /**
     * Create and start a new workflow from requirements
     */
    startWorkflow(requirements: ParsedRequirements, createdBy: string): Promise<Workflow>;
    /**
     * Create execution plan from requirements
     */
    private createExecutionPlan;
    /**
     * Create tasks from execution plan
     */
    private createTasks;
    /**
     * Validate requirements are complete
     */
    private validateRequirements;
    /**
     * Save workflow to database
     */
    private saveWorkflow;
    /**
     * Save task to database
     */
    private saveTask;
    /**
     * Update workflow status
     */
    private updateWorkflowStatus;
    /**
     * Get workflow by ID
     */
    getWorkflow(workflowId: string): Promise<Workflow | null>;
    /**
     * Get tasks for workflow
     */
    getWorkflowTasks(workflowId: string): Promise<Task[]>;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: TaskStatus, error?: string): Promise<void>;
    /**
     * Get next pending task
     */
    getNextPendingTask(agentType: string): Promise<Task | null>;
}
//# sourceMappingURL=orchestrator.d.ts.map