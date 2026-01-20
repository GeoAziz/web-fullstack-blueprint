#!/usr/bin/env node
/**
 * Phase 1 Validation Script
 * Verify all core systems are operational
 */

import { DatabaseConfig } from '../src/utils/database';
import { Orchestrator } from '../src/core/orchestrator';
import { QueueManager } from '../src/queue/queue-manager';
import { FrontendAgent } from '../src/agents/frontend-agent';
import { RequirementParser } from '../src/services/requirement-parser';
import { Logger } from '../src/utils/logger';

const logger = new Logger('Validator');

async function validate(): Promise<void> {
  try {
    logger.info('=== Phase 1 Validation Started ===');

    // 1. Database
    logger.info('✓ Initializing database...');
    await DatabaseConfig.initialize();
    logger.info('✓ Database initialized');

    // 2. Queue Manager
    logger.info('✓ Initializing queue manager...');
    const queueManager = new QueueManager();
    await queueManager.initialize();
    const queueStats = await queueManager.getQueueStats();
    logger.info('✓ Queue manager ready', queueStats);

    // 3. Orchestrator
    logger.info('✓ Initializing orchestrator...');
    const orchestrator = new Orchestrator();
    logger.info('✓ Orchestrator ready');

    // 4. Requirement Parser
    logger.info('✓ Initializing requirement parser...');
    const parser = new RequirementParser();
    logger.info('✓ Requirement parser ready');

    // 5. Frontend Agent
    logger.info('✓ Initializing frontend agent...');
    const agent = new FrontendAgent(queueManager);
    await agent.initialize();
    logger.info('✓ Frontend agent initialized');

    // 6. Test parsing
    logger.info('✓ Testing requirement parsing...');
    const testMarkdown = `# Button Component

## User Stories
- As a user, I want to click a button
- As a developer, I want custom colors

## Acceptance Criteria
- Should respond to clicks
- Should support custom colors
- Should be accessible`;

    const parsed = await parser.parseRequirements(testMarkdown, 'button-component');
    logger.info('✓ Requirements parsed', {
      userStories: parsed.userStories.length,
      criteria: parsed.acceptanceCriteria.length,
      complexity: parsed.complexity,
    });

    // 7. Test workflow creation
    logger.info('✓ Testing workflow creation...');
    const workflow = await orchestrator.startWorkflow(parsed, 'validator-user');
    logger.info('✓ Workflow created', {
      workflowId: workflow.id,
      taskCount: workflow.taskIds.length,
      status: workflow.status,
    });

    // 8. Cleanup
    logger.info('✓ Shutting down...');
    await queueManager.shutdown();
    logger.info('✓ Shutdown complete');

    logger.info('=== ✓ ALL VALIDATIONS PASSED ===');
    process.exit(0);
  } catch (error) {
    logger.error('Validation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

validate();
