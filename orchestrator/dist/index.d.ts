/**
 * Main Entry Point for Orchestration Engine
 * Initializes all services and starts the system
 */
/**
 * Application main class
 */
declare class OrchestratorApplication {
    private fileWatcher?;
    private isRunning;
    constructor();
    /**
     * Initialize the application
     */
    initialize(): Promise<void>;
    /**
     * Start the application
     */
    start(): Promise<void>;
    /**
     * Stop the application
     */
    stop(): Promise<void>;
    /**
     * Health check
     */
    isHealthy(): boolean;
}
/**
 * Global application instance
 */
declare let app: OrchestratorApplication;
export { OrchestratorApplication };
export { app };
export { QualityGates } from '@services/quality-gates';
export { AgentCoordinator } from '@services/agent-coordinator';
export { InfrastructureAgent } from '@agents/infrastructure-agent';
export { TestingAgent } from '@agents/testing-agent';
export { SecurityAgent } from '@agents/security-agent';
//# sourceMappingURL=index.d.ts.map