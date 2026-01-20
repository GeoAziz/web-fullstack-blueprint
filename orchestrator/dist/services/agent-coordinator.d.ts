/**
 * Agent Communication and Coordination System
 * Enables agents to communicate, share data, coordinate tasks, and manage dependencies
 */
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
    dependsOn: string[];
    blockedUntil: string[];
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
export declare class AgentCoordinator {
    private logger;
    private queueManager;
    private coordinations;
    constructor();
    /**
     * Create coordination plan for workflow
     */
    createCoordinationPlan(workflowId: string, tasks: Array<{
        id: string;
        agentType: string;
        dependencies?: string[];
    }>): Promise<AgentCoordination>;
    /**
     * Get next task to execute (respecting dependencies)
     */
    getNextExecutableTask(workflowId: string, completedTasks: Set<string>): Promise<string | null>;
    /**
     * Send message between agents
     */
    sendMessage(message: AgentMessage): Promise<void>;
    /**
     * Report task completion and trigger dependents
     */
    reportTaskCompletion(taskId: string, workflowId: string, result: Record<string, any>): Promise<void>;
    /**
     * Report task failure and handle cascade
     */
    reportTaskFailure(taskId: string, workflowId: string, error: string, retryable?: boolean): Promise<void>;
    /**
     * Share artifact between agents
     */
    shareArtifact(sourceTaskId: string, targetTaskId: string, artifactKey: string, artifact: Record<string, any>): Promise<void>;
    /**
     * Get shared artifacts for a task
     */
    getSharedArtifacts(taskId: string): Promise<Map<string, Record<string, any>>>;
    /**
     * Topologically sort tasks by dependencies
     */
    private topologicalSort;
    /**
     * Save coordination to database
     */
    private saveCoordination;
    /**
     * Get coordination status
     */
    getCoordinationStatus(workflowId: string): Promise<AgentCoordination | null>;
    /**
     * Update coordination status
     */
    updateCoordinationStatus(workflowId: string, status: 'planning' | 'executing' | 'blocked' | 'complete' | 'failed'): Promise<void>;
}
//# sourceMappingURL=agent-coordinator.d.ts.map