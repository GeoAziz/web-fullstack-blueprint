/**
 * DOMAIN CONTRACT SYSTEM
 * Formal, machine-readable definitions of domain entities, state machines, and constraints
 * These are the source of truth. All agents validate against these contracts.
 */

/**
 * Constraint: A formal rule that must hold true
 */
export interface Constraint {
  id: string;
  name: string;
  description: string;
  rule: (value: any) => boolean; // Must be pure, deterministic
  severity: 'error' | 'warning';
  message: string; // Human-readable violation message
}

/**
 * Field definition with constraints
 */
export interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array' | 'object';
  required: boolean;
  constraints: Constraint[];
  allowedValues?: any[]; // For enums
  metadata?: Record<string, any>;
}

/**
 * State machine: Valid states and allowed transitions
 */
export interface StateMachine {
  name: string;
  states: string[];
  initialState: string;
  transitions: Array<{
    from: string;
    to: string;
    condition?: (context: any) => boolean;
    metadata?: Record<string, any>;
  }>;
}

/**
 * Relationship: How two entities relate
 */
export interface Relationship {
  name: string;
  from: string; // Entity type
  to: string; // Entity type
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  required: boolean;
  cascadeDelete?: boolean;
  constraints?: Constraint[];
}

/**
 * Entity contract: Complete formal definition of a domain entity
 */
export interface EntityContract {
  id: string;
  name: string;
  description: string;
  fields: Record<string, FieldDefinition>;
  stateMachine?: StateMachine;
  constraints: Constraint[]; // Cross-field invariants
  relationships: Relationship[];
  examples?: Record<string, any>[];
  createdAt: Date;
  version: string;
}

/**
 * Domain contract collection
 */
export interface DomainContract {
  id: string;
  name: string;
  version: string;
  description: string;
  entities: Record<string, EntityContract>;
  globalConstraints: Constraint[];
  createdAt: Date;
}

/**
 * Contract validation result
 */
export interface ContractValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    constraint: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

/**
 * Contract Manager: Manages domain contracts as source of truth
 */
export class ContractManager {
  private contracts: Map<string, DomainContract> = new Map();

  /**
   * Register a domain contract
   */
  registerContract(contract: DomainContract): void {
    this.contracts.set(contract.id, contract);
  }

  /**
   * Get a contract
   */
  getContract(contractId: string): DomainContract | null {
    return this.contracts.get(contractId) || null;
  }

  /**
   * Get entity contract
   */
  getEntityContract(contractId: string, entityName: string): EntityContract | null {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;
    return contract.entities[entityName] || null;
  }

  /**
   * Validate entity data against contract
   */
  validateEntity(
    contractId: string,
    entityName: string,
    data: Record<string, any>
  ): ContractValidationResult {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      return {
        valid: false,
        errors: [
          {
            path: 'root',
            constraint: 'contract-not-found',
            message: `Contract ${contractId} not found`,
            severity: 'error',
          },
        ],
      };
    }

    const entity = contract.entities[entityName];
    if (!entity) {
      return {
        valid: false,
        errors: [
          {
            path: 'root',
            constraint: 'entity-not-found',
            message: `Entity ${entityName} not defined in contract`,
            severity: 'error',
          },
        ],
      };
    }

    const errors: ContractValidationResult['errors'] = [];

    // Validate fields
    for (const [fieldName, fieldDef] of Object.entries(entity.fields)) {
      const value = data[fieldName];

      // Check required
      if (fieldDef.required && (value === undefined || value === null)) {
        errors.push({
          path: `fields.${fieldName}`,
          constraint: 'required',
          message: `Field ${fieldName} is required`,
          severity: 'error',
        });
        continue;
      }

      // Skip further checks if not required and not provided
      if (!fieldDef.required && (value === undefined || value === null)) {
        continue;
      }

      // Check type
      if (!this.isValidType(value, fieldDef.type)) {
        errors.push({
          path: `fields.${fieldName}`,
          constraint: 'type-mismatch',
          message: `Field ${fieldName} must be ${fieldDef.type}, got ${typeof value}`,
          severity: 'error',
        });
        continue;
      }

      // Check field constraints
      for (const constraint of fieldDef.constraints) {
        try {
          if (!constraint.rule(value)) {
            errors.push({
              path: `fields.${fieldName}`,
              constraint: constraint.name,
              message: constraint.message,
              severity: constraint.severity,
            });
          }
        } catch (e) {
          errors.push({
            path: `fields.${fieldName}`,
            constraint: constraint.name,
            message: `Constraint validation failed: ${e instanceof Error ? e.message : String(e)}`,
            severity: 'error',
          });
        }
      }

      // Check enum values
      if (fieldDef.type === 'enum' && fieldDef.allowedValues) {
        if (!fieldDef.allowedValues.includes(value)) {
          errors.push({
            path: `fields.${fieldName}`,
            constraint: 'enum-value',
            message: `Field ${fieldName} must be one of: ${fieldDef.allowedValues.join(', ')}`,
            severity: 'error',
          });
        }
      }
    }

    // Validate entity-level constraints
    for (const constraint of entity.constraints) {
      try {
        if (!constraint.rule(data)) {
          errors.push({
            path: `entity.${entityName}`,
            constraint: constraint.name,
            message: constraint.message,
            severity: constraint.severity,
          });
        }
      } catch (e) {
        errors.push({
          path: `entity.${entityName}`,
          constraint: constraint.name,
          message: `Constraint validation failed: ${e instanceof Error ? e.message : String(e)}`,
          severity: 'error',
        });
      }
    }

    // Validate state machine if present
    if (entity.stateMachine) {
      const currentState = data.state || entity.stateMachine.initialState;
      if (!entity.stateMachine.states.includes(currentState)) {
        errors.push({
          path: `state`,
          constraint: 'invalid-state',
          message: `State "${currentState}" is not valid. Allowed: ${entity.stateMachine.states.join(', ')}`,
          severity: 'error',
        });
      }
    }

    const valid = !errors.some((e) => e.severity === 'error');

    return { valid, errors };
  }

  /**
   * Check state transition validity
   */
  isValidTransition(
    contractId: string,
    entityName: string,
    fromState: string,
    toState: string,
    context?: any
  ): boolean {
    const entity = this.getEntityContract(contractId, entityName);
    if (!entity || !entity.stateMachine) {
      return false;
    }

    const transition = entity.stateMachine.transitions.find(
      (t) => t.from === fromState && t.to === toState
    );

    if (!transition) {
      return false;
    }

    if (transition.condition && context) {
      return transition.condition(context);
    }

    return true;
  }

  /**
   * Validate against global constraints
   */
  validateGlobalConstraints(contractId: string, data: Record<string, any>): ContractValidationResult['errors'] {
    const contract = this.contracts.get(contractId);
    if (!contract) return [];

    const errors: ContractValidationResult['errors'] = [];

    for (const constraint of contract.globalConstraints) {
      try {
        if (!constraint.rule(data)) {
          errors.push({
            path: 'global',
            constraint: constraint.name,
            message: constraint.message,
            severity: constraint.severity,
          });
        }
      } catch (e) {
        errors.push({
          path: 'global',
          constraint: constraint.name,
          message: `Global constraint validation failed: ${e instanceof Error ? e.message : String(e)}`,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  /**
   * Get all constraints for an entity (including global)
   */
  getAllConstraints(contractId: string, entityName: string): Constraint[] {
    const contract = this.contracts.get(contractId);
    if (!contract) return [];

    const entity = contract.entities[entityName];
    if (!entity) return [];

    const constraints: Constraint[] = [...contract.globalConstraints, ...entity.constraints];

    // Add field constraints
    for (const field of Object.values(entity.fields)) {
      constraints.push(...field.constraints);
    }

    return constraints;
  }

  /**
   * Type validation helper
   */
  private isValidType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || typeof value === 'string';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'enum':
        return true; // Enum check handled separately
      default:
        return false;
    }
  }
}

/**
 * Create a new contract manager instance
 */
export const createContractManager = (): ContractManager => {
  return new ContractManager();
};
