/**
 * Main Entry Point for Orchestration Engine
 * Initializes all services and starts the system
 */

import * as dotenv from 'dotenv';
import { Logger } from '@utils/logger';
import { DatabaseConfig } from '@utils/database';
import { FileWatcher } from '@services/file-watcher';

// Load environment variables
dotenv.config();

const logger = new Logger('Main');

/**
 * Application main class
 */
class OrchestratorApplication {
  private fileWatcher?: FileWatcher;
  private isRunning = false;

  constructor() {
    // Application initialization
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Orchestrator Application...');

    try {
      // 1. Initialize database
      logger.info('Initializing database...');
      await DatabaseConfig.initialize();

      // 2. Initialize file watcher
      logger.info('Initializing file watcher...');
      this.fileWatcher = new FileWatcher();
      await this.fileWatcher.initialize();

      logger.info('✅ Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Application is already running');
      return;
    }

    try {
      logger.info('Starting Orchestrator Application...');

      // Start file watcher
      if (this.fileWatcher) {
        this.fileWatcher.start();
      }

      this.isRunning = true;
      logger.info('✅ Application started successfully');
    } catch (error) {
      logger.error('Failed to start application', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Stop the application
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Application is not running');
      return;
    }

    try {
      logger.info('Stopping Orchestrator Application...');

      // Stop file watcher
      if (this.fileWatcher) {
        this.fileWatcher.stop();
      }

      // Close database connection
      await DatabaseConfig.shutdown();

      this.isRunning = false;
      logger.info('✅ Application stopped successfully');
    } catch (error) {
      logger.error('Failed to stop application', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    return this.isRunning;
  }
}

/**
 * Global application instance
 */
let app: OrchestratorApplication;

/**
 * Graceful shutdown handler
 */
async function handleGracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, gracefully shutting down...`);

  try {
    if (app) {
      await app.stop();
    }
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Create application instance
    app = new OrchestratorApplication();

    // Initialize
    await app.initialize();

    // Start
    await app.start();

    // Handle graceful shutdown
    process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

    logger.info('Orchestrator is running. Press Ctrl+C to stop.');
  } catch (error) {
    logger.fatal('Fatal error during startup', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.fatal('Unhandled error in main', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}

// Export for testing
export { OrchestratorApplication };
export { app };
export { QualityGates } from '@services/quality-gates';
export { AgentCoordinator } from '@services/agent-coordinator';
export { InfrastructureAgent } from '@agents/infrastructure-agent';
export { TestingAgent } from '@agents/testing-agent';
export { SecurityAgent } from '@agents/security-agent';
