/**
 * INVARIANT ENFORCEMENT SYSTEM
 * Invariants as first-class, machine-readable, enforceable artifacts
 * They are laws, not documentation
 */

/**
 * Invariant: A rule that must ALWAYS be true
 */
export interface Invariant {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'data' | 'security' | 'performance' | 'structural';
  enforcementLevel: 'hard' | 'soft'; // hard = always fail, soft = warn but allow
  rule: (state: any) => boolean; // Must be pure, deterministic, side-effect free
  whenViolated: 'error' | 'exception' | 'log'; // What happens if violated
  relatedConstraints?: string[]; // Which constraints enforce this
}

/**
 * Invariant check result
 */
export interface InvariantCheckResult {
  invariantId: string;
  invariantName: string;
  satisfied: boolean;
  timestamp: Date;
  context?: any; // State at time of check
}

/**
 * Invariant violation report
 */
export interface InvariantViolationReport {
  timestamp: Date;
  violations: Array<{
    invariantId: string;
    invariantName: string;
    category: string;
    enforceLevel: string;
    message: string;
    state: any;
  }>;
  criticalCount: number;
  totalCount: number;
}

/**
 * Invariant enforcer
 */
export class InvariantEnforcer {
  private invariants: Map<string, Invariant> = new Map();
  private history: InvariantCheckResult[] = [];
  private violations: InvariantViolationReport[] = [];

  /**
   * Register an invariant
   */
  registerInvariant(invariant: Invariant): void {
    this.invariants.set(invariant.id, invariant);
  }

  /**
   * Check a single invariant
   */
  checkInvariant(invariantId: string, state: any): InvariantCheckResult {
    const invariant = this.invariants.get(invariantId);
    if (!invariant) {
      throw new Error(`Invariant ${invariantId} not found`);
    }

    let satisfied = false;
    try {
      satisfied = invariant.rule(state);
    } catch (e) {
      satisfied = false;
    }

    const result: InvariantCheckResult = {
      invariantId,
      invariantName: invariant.name,
      satisfied,
      timestamp: new Date(),
      context: satisfied ? undefined : state, // Only log state if violated
    };

    this.history.push(result);
    return result;
  }

  /**
   * Check all invariants for a state
   */
  checkAll(state: any): InvariantViolationReport {
    const violations: InvariantViolationReport['violations'] = [];
    let criticalCount = 0;

    for (const [invariantId, invariant] of this.invariants.entries()) {
      const result = this.checkInvariant(invariantId, state);

      if (!result.satisfied) {
        const isCritical = invariant.enforcementLevel === 'hard';
        if (isCritical) criticalCount++;

        violations.push({
          invariantId: result.invariantId,
          invariantName: result.invariantName,
          category: invariant.category,
          enforceLevel: invariant.enforcementLevel,
          message: `Invariant "${invariant.name}" violated: ${invariant.description}`,
          state: result.context,
        });

        // Execute enforcement action
        this.enforceInvariant(invariant);
      }
    }

    const report: InvariantViolationReport = {
      timestamp: new Date(),
      violations,
      criticalCount,
      totalCount: violations.length,
    };

    this.violations.push(report);
    return report;
  }

  /**
   * Enforce an invariant (execute enforcement action)
   */
  private enforceInvariant(invariant: Invariant): void {
    switch (invariant.whenViolated) {
      case 'error':
        throw new Error(`INVARIANT VIOLATION: ${invariant.name}`);
      case 'exception':
        throw new InvariantViolationError(
          `Invariant "${invariant.name}" violated: ${invariant.description}`,
          invariant.id
        );
      case 'log':
        console.warn(`INVARIANT WARNING: ${invariant.name}`);
        break;
    }
  }

  /**
   * Check if all hard invariants are satisfied
   */
  allHardInvariantsSatisfied(state: any): boolean {
    for (const [_, invariant] of this.invariants.entries()) {
      if (invariant.enforcementLevel === 'hard') {
        try {
          if (!invariant.rule(state)) {
            return false;
          }
        } catch {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Get invariant by category
   */
  getInvariantsByCategory(category: string): Invariant[] {
    return Array.from(this.invariants.values()).filter((i) => i.category === category);
  }

  /**
   * Get violation history
   */
  getViolationHistory(limit?: number): InvariantViolationReport[] {
    let history = [...this.violations].reverse();
    if (limit) {
      history = history.slice(0, limit);
    }
    return history;
  }

  /**
   * Get recent violations (last N checks)
   */
  getRecentViolations(sinceDuration: number): InvariantViolationReport[] {
    const since = new Date(Date.now() - sinceDuration);
    return this.violations.filter((v) => v.timestamp >= since);
  }

  /**
   * Generate invariant report
   */
  generateReport(): string {
    const lines = [
      '\n=== INVARIANT ENFORCEMENT REPORT ===',
      `Total Invariants: ${this.invariants.size}`,
      `Total Checks: ${this.history.length}`,
      `Total Violations: ${this.violations.length}`,
      `\n--- Invariant Summary ---`,
    ];

    for (const [_, invariant] of this.invariants.entries()) {
      const violations = this.violations.reduce(
        (count, report) =>
          count +
          report.violations.filter((v) => v.invariantId === invariant.id).length,
        0
      );
      lines.push(
        `  [${invariant.enforcementLevel.toUpperCase()}] ${invariant.name}: ${violations} violations`
      );
    }

    if (this.violations.length > 0) {
      lines.push(`\n--- Recent Violations ---`);
      const recent = this.getViolationHistory(5);
      for (const report of recent) {
        lines.push(`  ${report.timestamp.toISOString()}: ${report.totalCount} violations`);
      }
    }

    lines.push('\n=== END REPORT ===\n');
    return lines.join('\n');
  }
}

/**
 * Custom error for invariant violations
 */
export class InvariantViolationError extends Error {
  constructor(
    message: string,
    public invariantId: string
  ) {
    super(message);
    this.name = 'InvariantViolationError';
  }
}

/**
 * Create invariant enforcer
 */
export const createInvariantEnforcer = (): InvariantEnforcer => {
  return new InvariantEnforcer();
};
