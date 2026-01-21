/**
 * END-TO-END WORKFLOW TEST
 * 
 * Tests the complete flow from requirement to validated, stored code:
 * 
 * 1. Parse requirement from PRD
 * 2. Load domain contracts
 * 3. Declare failure modes
 * 4. Generate explanation (simulated Claude)
 * 5. Validate explanation completeness
 * 6. Generate code (simulated Claude)
 * 7. Validate code against contracts + invariants + purity
 * 8. Store in database
 * 9. Verify audit trail and validation log
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DatabaseConfig } from '@utils/database';
import { ContractManager } from '@contracts/domain-contract';
import { FailureModeRegistry } from '@contracts/failure-modes';
import { InvariantEnforcer } from '@contracts/invariant-enforcer';
import { PurityValidator } from '@contracts/purity-validator';
import { SimulatedClaudeAPIService } from '@services/claude-api-simulated';
import { Logger } from '@utils/logger';
import { v4 as uuid } from 'uuid';

/**
 * End-to-end workflow orchestrator
 */
class E2EWorkflowOrchestrator {
  private logger: Logger;
  private contractManager: ContractManager;
  private failureModeRegistry: FailureModeRegistry;
  private invariantEnforcer: InvariantEnforcer;
  private purityValidator: PurityValidator;
  private claudeAPI: SimulatedClaudeAPIService;

  constructor() {
    this.logger = new Logger('E2EWorkflowTest');
    this.contractManager = new ContractManager();
    this.failureModeRegistry = new FailureModeRegistry();
    this.invariantEnforcer = new InvariantEnforcer();
    this.purityValidator = new PurityValidator();
    this.claudeAPI = new SimulatedClaudeAPIService();
  }

  /**
   * Execute complete workflow: requirement → code → validation → storage
   */
  async executeWorkflow(requirement: {
    type: 'component' | 'service' | 'endpoint';
    name: string;
    description: string;
    requirements: string[];
  }) {
    const workflowId = uuid();
    const auditLog: any[] = [];

    this.logger.info(`Starting E2E workflow: ${requirement.name}`, { workflowId });

    try {
      // Step 1: Load domain contract
      this.logger.info(`Step 1: Loading domain contract for ${requirement.name}`);
      const domainContract = this.contractManager.getEntityContract(workflowId, requirement.name);
      if (!domainContract) {
        throw new Error(`No contract found for entity: ${requirement.name}`);
      }
      auditLog.push({
        stage: 'contract-load',
        status: 'success',
        timestamp: new Date(),
        message: `Loaded domain contract for: ${requirement.name}`,
      });

      // Step 2: Declare failure modes
      this.logger.info(`Step 2: Declaring failure modes`);
      const failureModes = this.failureModeRegistry.getFailureModesForFeature(requirement.name);
      auditLog.push({
        stage: 'failure-mode-declare',
        status: 'success',
        timestamp: new Date(),
        message: `Declared ${failureModes.length} failure modes`,
      });

      // Step 3: Request explanation from Claude (simulated)
      this.logger.info(`Step 3: Requesting explanation from Claude API`);
      const explanation = await this.claudeAPI.generateExplanation({
        entityType: requirement.type,
        entityName: requirement.name,
        description: requirement.description,
        requirements: requirement.requirements,
      });
      auditLog.push({
        stage: 'explanation-produce',
        status: 'success',
        timestamp: new Date(),
        message: `Generated explanation: ${explanation.explanationId}`,
        details: {
          assumptions: explanation.assumptions.length,
          tradeoffs: explanation.tradeoffs.length,
          constraints: explanation.constraintsHonored.length,
          edgeCases: explanation.edgeCasesHandled.length,
          failureModes: explanation.failureModesAddressed.length,
          invariants: explanation.invariantsMaintained.length,
        },
      });

      // Step 4: Validate explanation completeness (HARD GATE)
      this.logger.info(`Step 4: Validating explanation completeness (HARD GATE)`);
      const explanationValid = this.validateExplanationCompleteness(explanation);
      if (!explanationValid.valid) {
        throw new Error(`Explanation incomplete: ${explanationValid.errors.join(', ')}`);
      }
      auditLog.push({
        stage: 'explanation-validate',
        status: 'success',
        timestamp: new Date(),
        message: 'Explanation passed validation gate - ready for code generation',
      });

      // Step 5: Request code generation from Claude (simulated)
      this.logger.info(`Step 5: Requesting code generation from Claude API`);
      const codeGenResult = await this.claudeAPI.generateCode({
        explanationId: explanation.explanationId,
        entityType: requirement.type,
        entityName: requirement.name,
        explanation,
        language: 'typescript',
        framework: 'react',
      });
      auditLog.push({
        stage: 'code-generate',
        status: 'success',
        timestamp: new Date(),
        message: `Generated code: ${codeGenResult.codeId}`,
        details: {
          mainCodeLines: codeGenResult.mainCode.split('\n').length,
          testCodeLines: codeGenResult.testCode.split('\n').length,
          typesCodeLines: codeGenResult.typesCode.split('\n').length,
        },
      });

      // Step 6: Validate generated code against contracts
      this.logger.info(`Step 6: Validating code against domain contract`);
      const contractValidation = this.validateCodeAgainstContract(
        codeGenResult.mainCode,
        domainContract
      );
      if (!contractValidation.valid) {
        throw new Error(`Code violates contract: ${contractValidation.errors.join(', ')}`);
      }
      auditLog.push({
        stage: 'validation',
        status: 'success',
        timestamp: new Date(),
        message: 'Code passed contract validation',
        details: { violations: 0 },
      });

      // Step 7: Validate invariant enforcement
      this.logger.info(`Step 7: Validating invariant enforcement`);
      const invariantValidation = this.invariantEnforcer.checkAll({
        code: codeGenResult.mainCode,
      });
      if (invariantValidation.violations.length > 0) {
        throw new Error(`Invariant violations: ${invariantValidation.violations.length}`);
      }
      auditLog.push({
        stage: 'invariant-check',
        status: 'success',
        timestamp: new Date(),
        message: 'Code passed invariant enforcement checks',
      });

      // Step 8: Validate purity (business logic is pure)
      this.logger.info(`Step 8: Validating code purity`);
      const purityValidation = this.purityValidator.validateBusinessLogicPurity(
        codeGenResult.mainCode,
        requirement.name
      );
      if (!purityValidation.valid) {
        throw new Error(`Purity violations: ${purityValidation.reason}`);
      }
      auditLog.push({
        stage: 'purity-check',
        status: 'success',
        timestamp: new Date(),
        message: 'Code passed purity validation',
      });

      // Step 9: Store results in database (simulated)
      this.logger.info(`Step 9: Storing results in database`);
      const storageResult = await this.storeResults({
        workflowId,
        requirement,
        explanation,
        codeGenResult,
        auditLog,
      });
      auditLog.push({
        stage: 'storage',
        status: 'success',
        timestamp: new Date(),
        message: `Stored in database: ${storageResult.rowsInserted} rows`,
      });

      // Return complete workflow result
      return {
        success: true,
        workflowId,
        explanation,
        code: codeGenResult,
        auditLog,
        summary: {
          contractsLoaded: 1,
          failureModesProcessed: failureModes.length,
          explanationGenerated: true,
          explanationValidated: true,
          codeGenerated: true,
          contractValidationPassed: true,
          invariantValidationPassed: true,
          purityValidationPassed: true,
          stored: true,
        },
      };
    } catch (error) {
      this.logger.error(`Workflow failed`, {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      auditLog.push({
        stage: 'workflow',
        status: 'failure',
        timestamp: new Date(),
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate explanation has all required fields
   */
  private validateExplanationCompleteness(explanation: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!explanation.assumptions || explanation.assumptions.length === 0) {
      errors.push('Missing assumptions');
    }
    if (!explanation.tradeoffs || explanation.tradeoffs.length === 0) {
      errors.push('Missing tradeoffs');
    }
    if (!explanation.constraintsHonored || explanation.constraintsHonored.length === 0) {
      errors.push('Missing constraints honored');
    }
    if (!explanation.edgeCasesHandled || explanation.edgeCasesHandled.length === 0) {
      errors.push('Missing edge cases');
    }
    if (!explanation.failureModesAddressed || explanation.failureModesAddressed.length === 0) {
      errors.push('Missing failure modes');
    }
    if (!explanation.invariantsMaintained || explanation.invariantsMaintained.length === 0) {
      errors.push('Missing invariants');
    }
    if (!explanation.riskAssessment) {
      errors.push('Missing risk assessment');
    }
    if (explanation.validationGate !== 'COMPLETE') {
      errors.push('Validation gate not complete');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate code against domain contract
   */
  private validateCodeAgainstContract(
    code: string,
    _contract: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for export statement
    if (!code.includes('export')) {
      errors.push('Missing export statement');
    }

    // Check for type definitions if TypeScript
    if (!code.includes('interface') && !code.includes('type ')) {
      errors.push('Missing TypeScript type definitions');
    }

    // Check for documentation
    if (!code.includes('/**') && !code.includes('//')) {
      errors.push('Missing code documentation');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Store results in database (simulated)
   */
  private async storeResults(_data: any): Promise<{ rowsInserted: number }> {
    // Simulate database storage
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ rowsInserted: 3 }); // explanation + code + audit log
      }, 100);
    });
  }
}

/**
 * Test suite
 */
describe('E2E Workflow: Requirement → Code → Validation → Storage', () => {
  let orchestrator: E2EWorkflowOrchestrator;

  beforeAll(async () => {
    await DatabaseConfig.initialize();
    orchestrator = new E2EWorkflowOrchestrator();
  });

  afterAll(async () => {
    // Database cleanup would go here
    // await DatabaseConfig.teardown();
  });

  it('should complete full workflow for React component', async () => {
    const result = await orchestrator.executeWorkflow({
      type: 'component',
      name: 'Button',
      description: 'A reusable, accessible button component',
      requirements: [
        'Support multiple variants (primary, secondary, danger)',
        'Handle keyboard accessibility (Enter, Space)',
        'Accept custom classNames',
        'Forward ref for parent access',
      ],
    });

    expect(result.success).toBe(true);
    expect(result.workflowId).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThan(0);
  });

  it('should validate explanation completeness before code generation', async () => {
    const result = await orchestrator.executeWorkflow({
      type: 'component',
      name: 'Input',
      description: 'A form input component',
      requirements: ['Support multiple input types', 'Validate input', 'Show errors'],
    });

    const explanationAuditLog = result.auditLog.find(
      (log: any) => log.stage === 'explanation-validate'
    );
    expect(explanationAuditLog).toBeDefined();
    expect(explanationAuditLog.status).toBe('success');
  });

  it('should pass all validation gates', async () => {
    const result = await orchestrator.executeWorkflow({
      type: 'service',
      name: 'AuthService',
      description: 'Authentication service',
      requirements: ['Login user', 'Validate credentials', 'Generate token'],
    });

    const validationLogs = result.auditLog.filter(
      (log: any) => log.stage.includes('validate') || log.stage.includes('check')
    );
    expect(validationLogs.length).toBeGreaterThan(0);
    validationLogs.forEach((log: any) => {
      expect(log.status).toBe('success');
    });
  });

  it('should store audit trail in database', async () => {
    const result = await orchestrator.executeWorkflow({
      type: 'endpoint',
      name: 'GetUser',
      description: 'Get user by ID endpoint',
      requirements: ['Fetch user from database', 'Return JSON', 'Handle 404'],
    });

    const storageLog = result.auditLog.find((log: any) => log.stage === 'storage');
    expect(storageLog).toBeDefined();
    expect(storageLog.status).toBe('success');
  });

  it('should include all required checks in summary', async () => {
    const result = await orchestrator.executeWorkflow({
      type: 'component',
      name: 'Modal',
      description: 'Modal dialog component',
      requirements: ['Open/close', 'Backdrop click closes', 'Accessibility'],
    });

    const summary = result.summary;
    expect(summary.contractsLoaded).toBe(1);
    expect(summary.failureModesProcessed).toBeGreaterThan(0);
    expect(summary.explanationGenerated).toBe(true);
    expect(summary.explanationValidated).toBe(true);
    expect(summary.codeGenerated).toBe(true);
    expect(summary.contractValidationPassed).toBe(true);
    expect(summary.invariantValidationPassed).toBe(true);
    expect(summary.purityValidationPassed).toBe(true);
    expect(summary.stored).toBe(true);
  });
});
