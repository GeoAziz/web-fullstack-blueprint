/**
 * PURITY VALIDATOR SYSTEM
 * Enforces hard boundary between pure business logic and side effects
 * Business logic: pure, deterministic, IO-free, framework-agnostic
 * Integration layers: adapt inputs, call pure logic, handle side effects
 */

/**
 * Function purity classification
 */
export interface FunctionPurity {
  functionName: string;
  filePath: string;
  isPure: boolean;
  violations: string[];
  sideEffects: string[];
  dependencies: {
    external: string[]; // Network, disk, env
    internal: string[]; // Other functions called
  };
}

/**
 * Module architecture classification
 */
export interface ModuleArchitecture {
  modulePath: string;
  modules: {
    businessLogic: string[]; // Pure modules
    integration: string[]; // Side effect modules
    framework: string[]; // Framework-dependent
    utility: string[]; // Pure utilities
  };
  violations: {
    impureBusinessLogic: string[];
    framework: string[];
    mixedConcerns: string[];
  };
}

/**
 * Purity validator
 */
export class PurityValidator {
  private sideEffectPatterns = [
    /fetch\(/,
    /axios\./,
    /require\(/,
    /import\(/,
    /process\.env/,
    /fs\./,
    /\.write/,
    /\.read/,
    /\.create/,
    /\.update/,
    /\.delete/,
    /console\./,
    /throw new Error/,
    /throw\s/,
    /Math\.random/,
    /Date\.now/,
    /new Date/,
    /setTimeout/,
    /setInterval/,
    /Promise\.resolve/,
    /async\s+function/,
    /await\s/,
    /\.map\(/,
    /\.filter\(/,
    /\.reduce\(/,
    /Array\.from/,
  ];

  /**
   * Analyze function purity
   */
  analyzeFunctionPurity(functionCode: string, functionName: string, filePath: string): FunctionPurity {
    const violations: string[] = [];
    const sideEffects: string[] = [];
    const internalDependencies: string[] = [];
    const externalDependencies: string[] = [];

    // Check for async (side effect indicator)
    if (/async\s+function|async\s*\(|async\s*=>/.test(functionCode)) {
      violations.push('Function is async (potential side effects)');
    }

    // Check for common side effect patterns
    for (const pattern of this.sideEffectPatterns) {
      if (pattern.test(functionCode)) {
        const effect = pattern.source;
        sideEffects.push(effect);
        violations.push(`Detected potential side effect: ${effect}`);
      }
    }

    // Check for parameter mutations
    if (/([a-zA-Z_]\w*)\[[\w]+\]\s*=|([a-zA-Z_]\w*)\.(\w+)\s*=/.test(functionCode)) {
      violations.push('Function mutates parameters or external objects');
    }

    // Check for reassignments (pure functions don't reassign)
    const assignments = functionCode.match(/let\s+\w+|var\s+\w+/g) || [];
    if (assignments.length > 0) {
      violations.push(`Function has ${assignments.length} local variable assignments`);
    }

    // Extract function calls
    const callPattern = /([a-zA-Z_]\w*)\(/g;
    let match;
    while ((match = callPattern.exec(functionCode)) !== null) {
      if (!['if', 'for', 'while', 'switch', 'catch', 'function'].includes(match[1])) {
        internalDependencies.push(match[1]);
      }
    }

    // Identify external vs internal dependencies
    for (const dep of internalDependencies) {
      if (['fetch', 'axios', 'fs', 'process', 'console', 'document', 'window'].includes(dep)) {
        externalDependencies.push(dep);
      }
    }

    return {
      functionName,
      filePath,
      isPure: violations.length === 0,
      violations,
      sideEffects,
      dependencies: {
        external: [...new Set(externalDependencies)],
        internal: [...new Set(internalDependencies)],
      },
    };
  }

  /**
   * Analyze module architecture
   */
  analyzeModuleArchitecture(
    modules: Array<{ path: string; code: string }>
  ): ModuleArchitecture {
    const businessLogic: string[] = [];
    const integration: string[] = [];
    const framework: string[] = [];
    const utility: string[] = [];

    const impureBusinessLogic: string[] = [];
    const frameworkViolations: string[] = [];
    const mixedConcerns: string[] = [];

    for (const module of modules) {
      const analysis = this.analyzeFunctionPurity(module.code, module.path, module.path);

      // Classify module
      if (module.path.includes('domain') || module.path.includes('business') || module.path.includes('logic')) {
        businessLogic.push(module.path);
        if (!analysis.isPure) {
          impureBusinessLogic.push(`${module.path}: ${analysis.violations.join(', ')}`);
        }
      } else if (module.path.includes('integration') || module.path.includes('adapter')) {
        integration.push(module.path);
      } else if (
        module.path.includes('framework') ||
        module.path.includes('middleware') ||
        module.path.includes('controller')
      ) {
        framework.push(module.path);
      } else {
        utility.push(module.path);
      }

      // Check for framework in business logic
      if (businessLogic.includes(module.path) && /express|react|vue|angular|django|flask/.test(module.code)) {
        frameworkViolations.push(`Framework detected in business logic: ${module.path}`);
      }

      // Check for side effects in utility
      if (utility.includes(module.path) && analysis.sideEffects.length > 0) {
        mixedConcerns.push(`Side effects in utility: ${module.path}`);
      }
    }

    return {
      modulePath: 'analyzed',
      modules: {
        businessLogic,
        integration,
        framework,
        utility,
      },
      violations: {
        impureBusinessLogic,
        framework: frameworkViolations,
        mixedConcerns,
      },
    };
  }

  /**
   * Generate purity report
   */
  generatePurityReport(architecture: ModuleArchitecture): string {
    const lines = [
      '\n=== PURITY & ARCHITECTURE REPORT ===',
      `Business Logic Modules: ${architecture.modules.businessLogic.length}`,
      `Integration Modules: ${architecture.modules.integration.length}`,
      `Framework Modules: ${architecture.modules.framework.length}`,
      `Utility Modules: ${architecture.modules.utility.length}`,
    ];

    if (architecture.violations.impureBusinessLogic.length > 0) {
      lines.push('\n--- Impure Business Logic ❌ ---');
      for (const violation of architecture.violations.impureBusinessLogic) {
        lines.push(`  ${violation}`);
      }
    }

    if (architecture.violations.framework.length > 0) {
      lines.push('\n--- Framework in Business Logic ❌ ---');
      for (const violation of architecture.violations.framework) {
        lines.push(`  ${violation}`);
      }
    }

    if (architecture.violations.mixedConcerns.length > 0) {
      lines.push('\n--- Mixed Concerns ⚠️  ---');
      for (const violation of architecture.violations.mixedConcerns) {
        lines.push(`  ${violation}`);
      }
    }

    if (
      architecture.violations.impureBusinessLogic.length === 0 &&
      architecture.violations.framework.length === 0 &&
      architecture.violations.mixedConcerns.length === 0
    ) {
      lines.push('\n✅ Architecture is clean: business logic pure, concerns separated');
    }

    lines.push('\n=== END REPORT ===\n');
    return lines.join('\n');
  }

  /**
   * Validate that business logic module is pure
   */
  validateBusinessLogicPurity(code: string, moduleName: string): { valid: boolean; reason: string } {
    const analysis = this.analyzeFunctionPurity(code, moduleName, moduleName);

    if (!analysis.isPure) {
      return {
        valid: false,
        reason: `Business logic module is not pure: ${analysis.violations.join('; ')}`,
      };
    }

    return {
      valid: true,
      reason: 'Module is pure',
    };
  }

  /**
   * Validate integration layer handles side effects
   */
  validateIntegrationLayer(code: string, _moduleName: string): { valid: boolean; reason: string } {
    // Integration layers SHOULD have side effects
    // Check that it's not calling business logic indirectly through effects

    if (!/fetch|axios|fs\.|console\.|process\.env/.test(code)) {
      return {
        valid: false,
        reason: 'Integration layer has no side effects (may not be actual integration)',
      };
    }

    return {
      valid: true,
      reason: 'Integration layer properly handles side effects',
    };
  }
}

/**
 * Create purity validator
 */
export const createPurityValidator = (): PurityValidator => {
  return new PurityValidator();
};
