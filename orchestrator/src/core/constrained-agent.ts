/**
 * AGENT INTEGRATION FRAMEWORK
 * Base class for all agents to use constraint systems
 * Enforces: contracts → explanations → code generation → validation
 */

import { Logger } from '@utils/logger';
import { DatabaseConfig } from '@utils/database';
import { ContractManager, EntityContract } from '@contracts/domain-contract';
import { FailureModeRegistry, FeatureFailureSpec } from '@contracts/failure-modes';
import { ExplanationCheckpoint, AgentExplanation } from '@contracts/explanation-checkpoint';
import { InvariantEnforcer } from '@contracts/invariant-enforcer';
import { PurityValidator } from '@contracts/purity-validator';
import { v4 as uuid } from 'uuid';

/**
 * Agent execution context - holds all constraint systems for an agent
 */
export interface AgentExecutionContext {
  taskId: string;
  workflowId: string;
  agentType: string;
  contractId: string;
  contractManager: ContractManager;
  failureModeRegistry: FailureModeRegistry;
  explanationCheckpoint: ExplanationCheckpoint;
  invariantEnforcer: InvariantEnforcer;
  purityValidator: PurityValidator;
}

/**
 * Result of code generation with full traceability
 */
export interface AgentCodeGenerationResult {
  success: boolean;
  explanationId: string;
  code?: string;
  filePath?: string;
  validationResults: {
    contractValid: boolean;
    invariantsHold: boolean;
    explanationComplete: boolean;
    purityValid: boolean;
  };
  errors?: string[];
  auditLog: AuditLogEntry[];
}

/**
 * Audit log entry for traceability
 */
export interface AuditLogEntry {
  timestamp: Date;
  stage: 'contract-load' | 'failure-mode-declare' | 'explanation-produce' | 'code-generate' | 'validation' | 'storage';
  status: 'success' | 'failure' | 'warning';
  message: string;
  details?: Record<string, any>;
}

/**
 * Base class for all constrained agents
 */
export abstract class ConstrainedAgent {
  protected logger: Logger;
  protected context?: AgentExecutionContext;
  protected auditLog: AuditLogEntry[] = [];

  constructor(agentType: string) {
    this.logger = new Logger(`ConstrainedAgent[${agentType}]`);
  }

  /**
   * Initialize agent with constraint systems
   */
  async initializeContext(
    taskId: string,
    workflowId: string,
    agentType: string,
    contractId: string,
    contractManager: ContractManager,
    failureModeRegistry: FailureModeRegistry,
    explanationCheckpoint: ExplanationCheckpoint,
    invariantEnforcer: InvariantEnforcer,
    purityValidator: PurityValidator
  ): Promise<void> {
    this.context = {
      taskId,
      workflowId,
      agentType,
      contractId,
      contractManager,
      failureModeRegistry,
      explanationCheckpoint,
      invariantEnforcer,
      purityValidator,
    };

    this.log('contract-load', 'success', 'Agent context initialized with all constraint systems');
  }

  /**
   * Step 1: Load domain contract
   */
  protected async loadDomainContract(entityName: string): Promise<EntityContract | null> {
    if (!this.context) {
      this.log('contract-load', 'failure', 'No context available');
      throw new Error('Agent context not initialized');
    }

    try {
      const contract = this.context.contractManager.getEntityContract(this.context.contractId, entityName);

      if (!contract) {
        this.log('contract-load', 'failure', `Contract not found for entity: ${entityName}`);
        return null;
      }

      this.log('contract-load', 'success', `Loaded contract for entity: ${entityName}`, {
        fields: Object.keys(contract.fields).length,
        constraints: contract.constraints.length,
      });

      return contract;
    } catch (error) {
      this.log('contract-load', 'failure', `Failed to load contract: ${error}`);
      throw error;
    }
  }

  /**
   * Step 2: Declare failure modes
   */
  protected async declareFailureModes(featureId: string): Promise<FeatureFailureSpec | null> {
    if (!this.context) {
      this.log('failure-mode-declare', 'failure', 'No context available');
      throw new Error('Agent context not initialized');
    }

    try {
      const spec = this.context.failureModeRegistry.getFeatureFailureSpec(featureId);

      if (!spec) {
        this.log('failure-mode-declare', 'warning', `No failure spec found for feature: ${featureId}`);
        return null;
      }

      // Validate completeness
      const { complete, gaps } = this.context.failureModeRegistry.validateCompleteness(featureId);

      if (!complete) {
        this.log('failure-mode-declare', 'warning', 'Failure specification incomplete', { gaps });
      } else {
        this.log('failure-mode-declare', 'success', `Declared ${spec.failureModes.length} failure modes`, {
          critical: spec.criticalInvariants.length,
        });
      }

      return spec;
    } catch (error) {
      this.log('failure-mode-declare', 'failure', `Failed to declare failure modes: ${error}`);
      throw error;
    }
  }

  /**
   * Step 3: Produce explanation checkpoint
   */
  protected async produceExplanation(
    explanation: Omit<AgentExplanation, 'id' | 'createdAt' | 'duration'>
  ): Promise<AgentExplanation> {
    if (!this.context) {
      this.log('explanation-produce', 'failure', 'No context available');
      throw new Error('Agent context not initialized');
    }

    try {
      const startTime = Date.now();

      const fullExplanation: AgentExplanation = {
        ...explanation,
        id: uuid().toString(),
        createdAt: new Date(),
        duration: 0, // Will update after validation
      };

      // Validate explanation
      const validator: any = (this.context.explanationCheckpoint as any).validator;
      const validation = validator.validate(fullExplanation);

      if (!validation.valid) {
        this.log('explanation-produce', 'failure', 'Explanation incomplete', { gaps: validation.gaps });
        throw new Error(`Explanation validation failed: ${validation.gaps.join('; ')}`);
      }

      fullExplanation.duration = Date.now() - startTime;

      // Record explanation
      this.context.explanationCheckpoint.recordExplanation(fullExplanation);

      this.log('explanation-produce', 'success', 'Explanation produced and validated', {
        explanationId: fullExplanation.id,
        duration: fullExplanation.duration,
      });

      return fullExplanation;
    } catch (error) {
      this.log('explanation-produce', 'failure', `Failed to produce explanation: ${error}`);
      throw error;
    }
  }

  /**
   * Step 4: Check if code generation is allowed
   */
  protected canEmitCode(explanationId: string): boolean {
    if (!this.context) {
      this.log('validation', 'failure', 'No context available');
      return false;
    }

    const checkpoint = this.context.explanationCheckpoint.canEmitCode(explanationId);

    if (!checkpoint.allowed) {
      this.log('validation', 'failure', `Code emission blocked: ${checkpoint.reason}`);
      return false;
    }

    this.log('validation', 'success', 'Code emission allowed', { explanationId });
    return true;
  }

  /**
   * Step 5: Validate code against contracts
   */
  protected async validateCodeAgainstContract(code: string, entityName: string): Promise<boolean> {
    if (!this.context) {
      this.log('validation', 'failure', 'No context available');
      return false;
    }

    try {
      const contract = this.context.contractManager.getEntityContract(this.context.contractId, entityName);

      if (!contract) {
        this.log('validation', 'warning', `No contract found for validation: ${entityName}`);
        return true; // If no contract, pass through
      }

      // For now, basic validation - check for required patterns
      let valid = true;
      const violations: string[] = [];

      for (const [fieldName, fieldDef] of Object.entries(contract.fields)) {
        if (fieldDef.required && !code.includes(fieldName)) {
          violations.push(`Missing required field: ${fieldName}`);
          valid = false;
        }
      }

      if (!valid) {
        this.log('validation', 'failure', 'Code violates contract', { violations });
        return false;
      }

      this.log('validation', 'success', 'Code passes contract validation', { entityName });
      return true;
    } catch (error) {
      this.log('validation', 'failure', `Contract validation error: ${error}`);
      return false;
    }
  }

  /**
   * Step 6: Validate invariants
   */
  protected async validateInvariants(state: Record<string, any>): Promise<boolean> {
    if (!this.context) {
      this.log('validation', 'failure', 'No context available');
      return false;
    }

    try {
      const report = this.context.invariantEnforcer.checkAll(state);

      if (report.criticalCount > 0) {
        this.log('validation', 'failure', `${report.criticalCount} critical invariant violations`);
        return false;
      }

      this.log('validation', 'success', `All invariants hold (checked ${report.totalCount} invariants)`, {
        violations: report.totalCount,
      });

      return true;
    } catch (error) {
      this.log('validation', 'failure', `Invariant validation error: ${error}`);
      return false;
    }
  }

  /**
   * Step 7: Validate purity (pure logic vs side effects)
   */
  protected async validateCodePurity(code: string, moduleName: string): Promise<boolean> {
    if (!this.context) {
      this.log('validation', 'failure', 'No context available');
      return false;
    }

    try {
      // Determine if this should be pure business logic or integration layer
      const isPureModule = moduleName.includes('domain') || moduleName.includes('business') || moduleName.includes('logic');

      if (isPureModule) {
        const result = this.context.purityValidator.validateBusinessLogicPurity(code, moduleName);
        if (!result.valid) {
          this.log('validation', 'failure', `Business logic purity violation: ${result.reason}`);
          return false;
        }
      } else {
        const result = this.context.purityValidator.validateIntegrationLayer(code, moduleName);
        if (!result.valid) {
          this.log('validation', 'failure', `Integration layer validation failed: ${result.reason}`);
          return false;
        }
      }

      this.log('validation', 'success', 'Code purity validation passed', { moduleName });
      return true;
    } catch (error) {
      this.log('validation', 'failure', `Purity validation error: ${error}`);
      return false;
    }
  }

  /**
   * Step 8: Store result with full audit trail
   */
  protected async storeGenerationResult(result: AgentCodeGenerationResult): Promise<void> {
    try {
      await DatabaseConfig.query(
        `INSERT INTO agent_generation_results (id, task_id, workflow_id, agent_type, success, explanation_id, code, file_path, validation_results, audit_log, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          uuid().toString(),
          this.context?.taskId,
          this.context?.workflowId,
          this.context?.agentType,
          result.success,
          result.explanationId,
          result.code,
          result.filePath,
          JSON.stringify(result.validationResults),
          JSON.stringify(result.auditLog),
          new Date(),
        ]
      );

      this.log('storage', 'success', 'Generation result stored', { explanationId: result.explanationId });
    } catch (error) {
      this.log('storage', 'failure', `Failed to store result: ${error}`);
      throw error;
    }
  }

  /**
   * Log audit entry
   */
  protected log(
    stage: AuditLogEntry['stage'],
    status: AuditLogEntry['status'],
    message: string,
    details?: Record<string, any>
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      stage,
      status,
      message,
      details,
    };

    this.auditLog.push(entry);

    const icon = status === 'success' ? '✓' : status === 'failure' ? '✗' : '⚠';
    this.logger.info(`[${icon}] ${stage}: ${message}`, details);
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditLogEntry[] {
    return this.auditLog;
  }

  /**
   * Abstract method - agents implement this
   */
  abstract generateCode(): Promise<AgentCodeGenerationResult>;
}
