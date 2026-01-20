/**
 * Core Type Definitions for AI Orchestration System
 * Defines all contracts between components
 */

// ============================================================================
// WORKFLOW & TASK TYPES
// ============================================================================

export type TaskStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed' | 'retry' | 'blocked';
export type WorkflowStatus = 'created' | 'validating' | 'planning' | 'executing' | 'testing' | 'reviewing' | 'completed' | 'failed';
export type AgentType = 'frontend' | 'backend' | 'infrastructure' | 'test' | 'security' | 'orchestrator';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  workflowId: string;
  agentType: AgentType;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDurationMs?: number;
  actualDurationMs?: number;
  retryCount: number;
  maxRetries: number;
  error?: string;
  result?: TaskResult;
  dependencies: string[]; // Task IDs that must complete first
  metadata: Record<string, any>;
}

export interface TaskResult {
  success: boolean;
  output?: any;
  error?: string;
  artifacts: Artifact[];
  metrics: TaskMetrics;
}

export interface Artifact {
  id: string;
  type: 'code' | 'config' | 'test' | 'documentation' | 'report';
  path: string;
  content: string;
  size: number;
  checksum: string;
  createdAt: Date;
}

export interface TaskMetrics {
  executionTimeMs: number;
  tokensUsed: number;
  costUSD: number;
  retries: number;
  qualityScore: number; // 0-100
}

export interface Workflow {
  id: string;
  status: WorkflowStatus;
  title: string;
  description: string;
  requirements: ParsedRequirements;
  tasks: Task[];
  executionPlan: ExecutionPlan;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  result?: WorkflowResult;
}

export interface WorkflowResult {
  success: boolean;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  totalExecutionTimeMs: number;
  totalCostUSD: number;
  qualityScore: number;
  artifacts: Artifact[];
  errors: WorkflowError[];
}

export interface WorkflowError {
  taskId: string;
  taskTitle: string;
  error: string;
  recoveryAttempted: boolean;
  recoveryResult?: string;
}

// ============================================================================
// REQUIREMENT PARSING TYPES
// ============================================================================

export interface ParsedRequirements {
  featureId: string;
  title: string;
  description: string;
  priority: Priority;
  userStories: UserStory[];
  acceptanceCriteria: AcceptanceCriterion[];
  constraints: Constraint[];
  dependencies: string[]; // Feature IDs
  estimatedComplexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  estimatedEffortHours: number;
  successMetrics: SuccessMetric[];
  metadata: FeatureMetadata;
}

export interface UserStory {
  id: string;
  actor: string;
  action: string;
  goal: string;
  context?: string;
  acceptanceCriteria: string[];
}

export interface AcceptanceCriterion {
  id: string;
  criterion: string;
  validationMethod: 'automated-test' | 'manual-review' | 'performance-check' | 'security-scan';
  priority: Priority;
}

export interface Constraint {
  id: string;
  category: 'technical' | 'performance' | 'security' | 'compliance' | 'business';
  constraint: string;
  reason: string;
}

export interface SuccessMetric {
  metric: string;
  target: string;
  measurable: boolean;
  validationMethod: string;
}

export interface FeatureMetadata {
  assignedTeam?: string;
  deadline?: Date;
  estimatedBudgetUSD?: number;
  riskLevel: 'low' | 'medium' | 'high';
  dependencies: FeatureDependency[];
  tags: string[];
}

export interface FeatureDependency {
  featureId: string;
  type: 'blocks' | 'blocked-by' | 'depends-on' | 'related-to';
}

// ============================================================================
// EXECUTION PLAN TYPES
// ============================================================================

export interface ExecutionPlan {
  phaseCount: number;
  phases: ExecutionPhase[];
  totalEstimatedTimeMs: number;
  criticalPath: string[]; // Task IDs on critical path
  parallelizableGroups: string[][]; // Groups of tasks that can run in parallel
}

export interface ExecutionPhase {
  phaseNumber: number;
  name: string;
  description: string;
  taskIds: string[];
  estimatedDurationMs: number;
  prerequisitePhases: number[];
}

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  status: 'idle' | 'working' | 'error' | 'unavailable';
  workers: number;
  availableWorkers: number;
  currentTasks: Task[];
  completedTasks: number;
  failedTasks: number;
  lastHealthCheck: Date;
  capabilities: AgentCapability[];
  configuration: AgentConfig;
}

export interface AgentCapability {
  capability: string;
  version: string;
  reliability: number; // 0-1
}

export interface AgentConfig {
  maxConcurrentTasks: number;
  timeoutMs: number;
  retryStrategy: RetryStrategy;
  costLimit?: number;
}

export interface RetryStrategy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface AgentResponse {
  taskId: string;
  success: boolean;
  output?: any;
  error?: string;
  artifacts: Artifact[];
  metrics: TaskMetrics;
  timestamp: Date;
}

// ============================================================================
// QUEUE & MESSAGING TYPES
// ============================================================================

export interface QueueMessage {
  id: string;
  type: 'task-assignment' | 'task-result' | 'agent-request' | 'agent-response' | 'status-update' | 'error-report';
  sourceId: string; // Agent or service ID
  destinationId?: string; // Specific agent or broadcast
  payload: any;
  priority: Priority;
  createdAt: Date;
  processedAt?: Date;
  retryCount: number;
}

export interface QueueConfig {
  name: string;
  maxConcurrency: number;
  rateLimit?: {
    max: number;
    windowMs: number;
  };
  defaultJobOptions?: {
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
    removeOnComplete: boolean;
  };
}

// ============================================================================
// FILE WATCHING TYPES
// ============================================================================

export interface FileChange {
  filePath: string;
  changeType: 'created' | 'modified' | 'deleted';
  previousContent?: string;
  currentContent?: string;
  previousHash?: string;
  currentHash?: string;
  timestamp: Date;
}

export interface ChangeAnalysis {
  changes: FileChange[];
  isSignificant: boolean;
  changeCategory: 'feature-new' | 'feature-update' | 'feature-delete' | 'constraint-update' | 'design-update' | 'minor';
  affectedFeatures: string[];
  suggestedTriggerReason?: string;
}

// ============================================================================
// QUALITY GATE TYPES
// ============================================================================

export interface QualityGateResult {
  gateName: string;
  passed: boolean;
  score: number; // 0-100
  errors: QualityError[];
  warnings: QualityWarning[];
  details: Record<string, any>;
  executedAt: Date;
  executionTimeMs: number;
}

export interface QualityError {
  code: string;
  message: string;
  severity: 'error' | 'critical';
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface QualityWarning {
  code: string;
  message: string;
  severity: 'warning' | 'info';
  suggestion?: string;
}

// ============================================================================
// MONITORING & LOGGING TYPES
// ============================================================================

export interface WorkflowMetrics {
  workflowId: string;
  totalDurationMs: number;
  totalCostUSD: number;
  totalTokensUsed: number;
  taskMetrics: Map<string, TaskMetrics>;
  agentMetrics: Map<AgentType, AgentMetrics>;
  qualityScore: number;
  timestamp: Date;
}

export interface AgentMetrics {
  agentType: AgentType;
  tasksCompleted: number;
  tasksFailed: number;
  averageExecutionTimeMs: number;
  averageCostPerTaskUSD: number;
  successRate: number;
  lastActiveAt: Date;
}

export interface SystemHealthCheck {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealth[];
  overallScore: number; // 0-100
}

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  message?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  component: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}
