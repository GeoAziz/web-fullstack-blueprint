/**
 * FAILURE MODES DECLARATION SYSTEM
 * Defines all possible failure modes BEFORE code exists
 * Separates design-time failure declaration from implementation-time error handling
 */

/**
 * Failure classification
 */
export type FailureClass = 'recoverable' | 'fatal' | 'cascading' | 'transient' | 'permanent';

/**
 * Invariant affected by failure
 */
export interface InvariantImpact {
  invariantId: string;
  invariantName: string;
  violated: boolean;
  recoveryRequired: boolean;
}

/**
 * Recovery strategy
 */
export interface RecoveryStrategy {
  name: string;
  steps: string[];
  rollbackRequired: boolean;
  timeoutMs?: number;
}

/**
 * Failure mode definition
 */
export interface FailureMode {
  id: string;
  name: string;
  description: string;
  classification: FailureClass;
  triggers: string[]; // Conditions that cause this failure
  impacts: InvariantImpact[];
  recoveryStrategies: RecoveryStrategy[];
  alertLevel: 'critical' | 'high' | 'medium' | 'low';
  examples?: string[];
}

/**
 * Feature failure specification
 */
export interface FeatureFailureSpec {
  featureId: string;
  featureName: string;
  failureModes: FailureMode[];
  criticalInvariants: string[];
  safetyConstraints: string[];
}

/**
 * Failure mode registry
 */
export class FailureModeRegistry {
  private specs: Map<string, FeatureFailureSpec> = new Map();
  private modes: Map<string, FailureMode> = new Map();

  /**
   * Register a feature's failure specification
   */
  registerFeatureFailureSpec(spec: FeatureFailureSpec): void {
    this.specs.set(spec.featureId, spec);
    for (const mode of spec.failureModes) {
      this.modes.set(mode.id, mode);
    }
  }

  /**
   * Get failure specification for a feature
   */
  getFeatureFailureSpec(featureId: string): FeatureFailureSpec | null {
    return this.specs.get(featureId) || null;
  }

  /**
   * Get failure mode by ID
   */
  getFailureMode(modeId: string): FailureMode | null {
    return this.modes.get(modeId) || null;
  }

  /**
   * Get all failure modes for a feature
   */
  getFailureModesForFeature(featureId: string): FailureMode[] {
    const spec = this.specs.get(featureId);
    return spec ? spec.failureModes : [];
  }

  /**
   * Check if a failure is recoverable
   */
  isRecoverable(failureId: string): boolean {
    const mode = this.modes.get(failureId);
    return mode ? mode.classification === 'recoverable' || mode.classification === 'transient' : false;
  }

  /**
   * Get recovery strategies for a failure
   */
  getRecoveryStrategies(failureId: string): RecoveryStrategy[] {
    const mode = this.modes.get(failureId);
    return mode ? mode.recoveryStrategies : [];
  }

  /**
   * Check critical invariants for a feature
   */
  getCriticalInvariants(featureId: string): string[] {
    const spec = this.specs.get(featureId);
    return spec ? spec.criticalInvariants : [];
  }

  /**
   * Validate that all failure modes have recovery strategies
   */
  validateCompleteness(featureId: string): { complete: boolean; gaps: string[] } {
    const spec = this.specs.get(featureId);
    if (!spec) {
      return { complete: false, gaps: ['Specification not found'] };
    }

    const gaps: string[] = [];

    for (const mode of spec.failureModes) {
      if (mode.recoveryStrategies.length === 0 && mode.classification !== 'fatal') {
        gaps.push(`${mode.name} has no recovery strategy but is not fatal`);
      }

      if (mode.impacts.length === 0) {
        gaps.push(`${mode.name} has no declared invariant impacts`);
      }

      if (mode.triggers.length === 0) {
        gaps.push(`${mode.name} has no trigger conditions defined`);
      }
    }

    return { complete: gaps.length === 0, gaps };
  }

  /**
   * Get all failures that cascade from a given failure
   */
  getCascadingFailures(failureId: string): FailureMode[] {
    const cascading: FailureMode[] = [];
    for (const mode of this.modes.values()) {
      if (mode.classification === 'cascading' && mode.triggers.includes(failureId)) {
        cascading.push(mode);
      }
    }
    return cascading;
  }

  /**
   * Check if failure impacts critical invariants
   */
  impactsCriticalInvariants(featureId: string, failureId: string): boolean {
    const spec = this.specs.get(featureId);
    const mode = this.modes.get(failureId);

    if (!spec || !mode) return false;

    return mode.impacts.some((impact) => spec.criticalInvariants.includes(impact.invariantId));
  }
}

/**
 * Create failure mode registry
 */
export const createFailureModeRegistry = (): FailureModeRegistry => {
  return new FailureModeRegistry();
};
