/**
 * Integration Test - Phase 1
 * Tests core workflow: requirements → orchestrator → queue → agent → database
 */

import { Orchestrator } from '../src/core/orchestrator';
import { QueueManager } from '../src/queue/queue-manager';
import { FrontendAgent } from '../src/agents/frontend-agent';
import { FileWatcher } from '../src/services/file-watcher';
import { RequirementParser } from '../src/services/requirement-parser';
import { DatabaseConfig } from '../src/utils/database';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Phase 1 Integration Tests', () => {
  let orchestrator: Orchestrator;
  let queueManager: QueueManager;
  let frontendAgent: FrontendAgent;
  let fileWatcher: FileWatcher;
  let requirementParser: RequirementParser;

  beforeAll(async () => {
    // Initialize all components
    orchestrator = new Orchestrator();
    queueManager = new QueueManager();
    frontendAgent = new FrontendAgent(queueManager);
    fileWatcher = new FileWatcher();
    requirementParser = new RequirementParser();

    // Initialize database and queue
    await DatabaseConfig.initialize();
    await queueManager.initialize();
    await frontendAgent.initialize();
  });

  afterAll(async () => {
    await queueManager.shutdown();
  });

  test('should parse requirements from markdown', async () => {
    const markdown = `
    # Button Component

    ## User Stories
    - As a user, I want to click a button
    - As a developer, I want to customize button styles

    ## Acceptance Criteria
    - Button should respond to clicks
    - Button should support custom colors
    - Button should be accessible (ARIA)
    `;

    const parsed = await requirementParser.parseRequirements(markdown, 'button-component');

    expect(parsed).toBeDefined();
    expect(parsed.userStories.length).toBeGreaterThan(0);
    expect(parsed.acceptanceCriteria.length).toBeGreaterThan(0);
  });

  test('should create workflow from requirements', async () => {
    const markdown = `
    # Test Component
    ## User Stories
    - As a user, I want to see it

    ## Acceptance Criteria
    - Should render
    `;

    const parsed = await requirementParser.parseRequirements(markdown, 'test-component');
    const workflow = await orchestrator.startWorkflow(parsed, 'test-user');

    expect(workflow).toBeDefined();
    expect(workflow.id).toBeDefined();
    expect(workflow.status).toBe('created');
  });

  test('should create execution plan with phases', async () => {
    const markdown = `
    # Test Component
    ## User Stories
    - As a user, I want to use it

    ## Acceptance Criteria
    - Works
    `;

    const parsed = await requirementParser.parseRequirements(markdown, 'test-component-plan');
    const plan = (orchestrator as any).createExecutionPlan(parsed);

    expect(plan.phases.length).toBe(5); // 5 phases
    expect(plan.phases[0].name).toContain('Frontend');
    expect(plan.phases[1].name).toContain('Backend');
  });

  test('should queue tasks for agents', async () => {
    const markdown = `
    # Alert Component
    ## User Stories
    - As a user, I want to see alerts

    ## Acceptance Criteria
    - Displays message
    `;

    const parsed = await requirementParser.parseRequirements(markdown, 'alert-component');
    const workflow = await orchestrator.startWorkflow(parsed, 'test-user');

    expect(workflow.taskIds.length).toBeGreaterThan(0);
  });

  test('should track queue statistics', async () => {
    const stats = await queueManager.getQueueStats();

    expect(stats).toBeDefined();
    expect(stats.frontend).toBeDefined();
    expect(stats.backend).toBeDefined();
    expect(typeof stats.frontend.waiting).toBe('number');
  });
});
