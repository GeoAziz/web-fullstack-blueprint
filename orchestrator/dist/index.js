"use strict";
/**
 * Main Entry Point for Orchestration Engine
 * Initializes all services and starts the system
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAgent = exports.TestingAgent = exports.InfrastructureAgent = exports.AgentCoordinator = exports.QualityGates = exports.app = exports.OrchestratorApplication = void 0;
const dotenv = __importStar(require("dotenv"));
const logger_1 = require("@utils/logger");
const database_1 = require("@utils/database");
const file_watcher_1 = require("@services/file-watcher");
// Load environment variables
dotenv.config();
const logger = new logger_1.Logger('Main');
/**
 * Application main class
 */
class OrchestratorApplication {
    constructor() {
        this.isRunning = false;
        // Application initialization
    }
    /**
     * Initialize the application
     */
    async initialize() {
        logger.info('Initializing Orchestrator Application...');
        try {
            // 1. Initialize database
            logger.info('Initializing database...');
            await database_1.DatabaseConfig.initialize();
            // 2. Initialize file watcher
            logger.info('Initializing file watcher...');
            this.fileWatcher = new file_watcher_1.FileWatcher();
            await this.fileWatcher.initialize();
            logger.info('✅ Application initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize application', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Start the application
     */
    async start() {
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
        }
        catch (error) {
            logger.error('Failed to start application', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Stop the application
     */
    async stop() {
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
            await database_1.DatabaseConfig.shutdown();
            this.isRunning = false;
            logger.info('✅ Application stopped successfully');
        }
        catch (error) {
            logger.error('Failed to stop application', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Health check
     */
    isHealthy() {
        return this.isRunning;
    }
}
exports.OrchestratorApplication = OrchestratorApplication;
/**
 * Global application instance
 */
let app;
/**
 * Graceful shutdown handler
 */
async function handleGracefulShutdown(signal) {
    logger.info(`Received ${signal}, gracefully shutting down...`);
    try {
        if (app) {
            await app.stop();
        }
        process.exit(0);
    }
    catch (error) {
        logger.error('Error during graceful shutdown', {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    }
}
/**
 * Main entry point
 */
async function main() {
    try {
        // Create application instance
        exports.app = app = new OrchestratorApplication();
        // Initialize
        await app.initialize();
        // Start
        await app.start();
        // Handle graceful shutdown
        process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
        logger.info('Orchestrator is running. Press Ctrl+C to stop.');
    }
    catch (error) {
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
var quality_gates_1 = require("@services/quality-gates");
Object.defineProperty(exports, "QualityGates", { enumerable: true, get: function () { return quality_gates_1.QualityGates; } });
var agent_coordinator_1 = require("@services/agent-coordinator");
Object.defineProperty(exports, "AgentCoordinator", { enumerable: true, get: function () { return agent_coordinator_1.AgentCoordinator; } });
var infrastructure_agent_1 = require("@agents/infrastructure-agent");
Object.defineProperty(exports, "InfrastructureAgent", { enumerable: true, get: function () { return infrastructure_agent_1.InfrastructureAgent; } });
var testing_agent_1 = require("@agents/testing-agent");
Object.defineProperty(exports, "TestingAgent", { enumerable: true, get: function () { return testing_agent_1.TestingAgent; } });
var security_agent_1 = require("@agents/security-agent");
Object.defineProperty(exports, "SecurityAgent", { enumerable: true, get: function () { return security_agent_1.SecurityAgent; } });
//# sourceMappingURL=index.js.map