/**
 * EXPLANATION CHECKPOINT SYSTEM
 * No agent can emit code without first producing a structured explanation
 * Explanations are logged, reviewable, diffable, and used for learning
 */

/**
 * Structured explanation from an agent
 */
export interface AgentExplanation {
  id: string;
  agentType: string;
  taskId: string;
  workflowId: string;

  // Core reasoning
  assumptions: string[]; // What the agent is assuming
  tradeoffs: Array<{
    option1: string;
    option2: string;
    chosen: string;
    reasoning: string;
  }>;
  constraints: string[]; // What the agent must honor
  edgeCases: Array<{
    case: string;
    handling: 'implemented' | 'deferred' | 'acknowledged-risk';
    details: string;
  }>;

  // Risk analysis
  risks: Array<{
    risk: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    mitigation: string;
  }>;

  // Domain alignment
  contractValidation: {
    contractId: string;
    entitiesUsed: string[];
    constraintsSatisfied: boolean;
    violations?: string[];
  };

  failureModeHandling: {
    modeId: string;
    handled: boolean;
    strategy: string;
  }[];

  // Metadata
  createdAt: Date;
  duration: number; // ms to generate explanation
  model?: string;
  tokensUsed?: number;
}

/**
 * Code emission result with explanation
 */
export interface CodeEmission {
  explanationId: string;
  code: string;
  language: string;
  filePath: string;
  validation: {
    explainationProvided: boolean;
    assumptionsClear: boolean;
    tradeoffsExplicit: boolean;
    constraintsSatisfied: boolean;
    edgeCasesHandled: boolean;
    failureModesCovered: boolean;
  };
  timestamp: Date;
}

/**
 * Explanation validator - ensures explanations are complete
 */
export class ExplanationValidator {
  /**
   * Validate explanation completeness
   */
  validate(explanation: AgentExplanation): { valid: boolean; gaps: string[] } {
    const gaps: string[] = [];

    // Check assumptions
    if (!explanation.assumptions || explanation.assumptions.length === 0) {
      gaps.push('No assumptions declared');
    }

    // Check tradeoffs
    if (!explanation.tradeoffs || explanation.tradeoffs.length === 0) {
      gaps.push('No design tradeoffs explained');
    }

    // Check constraints
    if (!explanation.constraints || explanation.constraints.length === 0) {
      gaps.push('No constraints acknowledged');
    }

    // Check edge cases
    if (!explanation.edgeCases || explanation.edgeCases.length === 0) {
      gaps.push('No edge cases identified');
    }

    // Check risk analysis
    if (!explanation.risks || explanation.risks.length === 0) {
      gaps.push('No risks identified');
    }

    // Check contract validation
    if (!explanation.contractValidation) {
      gaps.push('Contract validation missing');
    } else {
      if (!explanation.contractValidation.contractId) {
        gaps.push('No contract specified');
      }
      if (!explanation.contractValidation.constraintsSatisfied && explanation.contractValidation.violations) {
        for (const violation of explanation.contractValidation.violations) {
          gaps.push(`Contract violation: ${violation}`);
        }
      }
    }

    // Check failure mode handling
    if (!explanation.failureModeHandling || explanation.failureModeHandling.length === 0) {
      gaps.push('No failure modes addressed');
    } else {
      for (const mode of explanation.failureModeHandling) {
        if (!mode.handled) {
          gaps.push(`Failure mode ${mode.modeId} not handled`);
        }
      }
    }

    return {
      valid: gaps.length === 0,
      gaps,
    };
  }

  /**
   * Generate validation report
   */
  generateReport(explanation: AgentExplanation): string {
    const validation = this.validate(explanation);

    const lines = [
      `\n=== EXPLANATION VALIDATION REPORT ===`,
      `Agent: ${explanation.agentType}`,
      `Task: ${explanation.taskId}`,
      `Status: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`,
      `\n--- EXPLANATION CONTENT ---`,
      `Assumptions: ${explanation.assumptions.length}`,
      `Tradeoffs: ${explanation.tradeoffs.length}`,
      `Constraints: ${explanation.constraints.length}`,
      `Edge Cases: ${explanation.edgeCases.length}`,
      `Identified Risks: ${explanation.risks.length}`,
      `Failure Modes Addressed: ${explanation.failureModeHandling.length}`,
    ];

    if (!validation.valid) {
      lines.push(`\n--- GAPS ---`);
      for (const gap of validation.gaps) {
        lines.push(`  ⚠️  ${gap}`);
      }
    }

    lines.push(`\n=== END REPORT ===\n`);
    return lines.join('\n');
  }
}

/**
 * Explanation checkpoint enforcer
 */
export class ExplanationCheckpoint {
  private validator: ExplanationValidator;
  private explanations: Map<string, AgentExplanation> = new Map();

  constructor() {
    this.validator = new ExplanationValidator();
  }

  /**
   * Record an explanation
   */
  recordExplanation(explanation: AgentExplanation): void {
    this.explanations.set(explanation.id, explanation);
  }

  /**
   * Gate code emission on explanation
   */
  canEmitCode(explanationId: string): { allowed: boolean; reason: string } {
    const explanation = this.explanations.get(explanationId);

    if (!explanation) {
      return {
        allowed: false,
        reason: 'No explanation found for this task',
      };
    }

    const validation = this.validator.validate(explanation);

    if (!validation.valid) {
      return {
        allowed: false,
        reason: `Explanation incomplete: ${validation.gaps.join('; ')}`,
      };
    }

    return {
      allowed: true,
      reason: 'Explanation complete and valid',
    };
  }

  /**
   * Get explanation
   */
  getExplanation(explanationId: string): AgentExplanation | null {
    return this.explanations.get(explanationId) || null;
  }

  /**
   * Get all explanations for a workflow
   */
  getWorkflowExplanations(workflowId: string): AgentExplanation[] {
    return Array.from(this.explanations.values()).filter((e) => e.workflowId === workflowId);
  }

  /**
   * Audit trail - get explanation history
   */
  getExplanationAuditTrail(taskId: string): AgentExplanation[] {
    return Array.from(this.explanations.values())
      .filter((e) => e.taskId === taskId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Generate validation report for explanation
   */
  generateValidationReport(explanationId: string): string {
    const explanation = this.explanations.get(explanationId);
    if (!explanation) {
      return 'Explanation not found';
    }
    return this.validator.generateReport(explanation);
  }
}

/**
 * Create explanation checkpoint
 */
export const createExplanationCheckpoint = (): ExplanationCheckpoint => {
  return new ExplanationCheckpoint();
};
