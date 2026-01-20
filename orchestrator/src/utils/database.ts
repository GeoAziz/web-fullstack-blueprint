/**
 * Database Configuration and Connection Management
 * Handles PostgreSQL connection pool and lifecycle
 */

import { Pool, PoolClient } from 'pg';
import { Logger } from '@utils/logger';
import { AppError } from '@utils/errors';

const logger = new Logger('DatabaseConfig');

export class DatabaseConfig {
  private static instance: Pool | null = null;

  static getPool(): Pool {
    if (!DatabaseConfig.instance) {
      throw new AppError('Database pool not initialized. Call initialize() first.', 'DB_NOT_INITIALIZED');
    }
    return DatabaseConfig.instance;
  }

  static async initialize(): Promise<void> {
    const {
      DATABASE_URL,
      DATABASE_POOL_MIN = '2',
      DATABASE_POOL_MAX = '20',
      DATABASE_TIMEOUT = '30000',
    } = process.env;

    if (!DATABASE_URL) {
      throw new AppError('DATABASE_URL environment variable not set', 'ENV_VAR_MISSING');
    }

    const pool = new Pool({
      connectionString: DATABASE_URL,
      min: parseInt(DATABASE_POOL_MIN, 10),
      max: parseInt(DATABASE_POOL_MAX, 10),
      idleTimeoutMillis: parseInt(DATABASE_TIMEOUT, 10),
      connectionTimeoutMillis: parseInt(DATABASE_TIMEOUT, 10),
    });

    // Error handler for connection errors
    pool.on('error', (err: Error) => {
      logger.error('Unexpected error on idle client', { error: err.message });
    });

    // Test connection
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('Database connection pool initialized successfully');
    } catch (error) {
      await pool.end();
      throw new AppError(
        `Failed to initialize database pool: ${error instanceof Error ? error.message : String(error)}`,
        'DB_INIT_FAILED'
      );
    }

    DatabaseConfig.instance = pool;
  }

  static async shutdown(): Promise<void> {
    if (DatabaseConfig.instance) {
      await DatabaseConfig.instance.end();
      DatabaseConfig.instance = null;
      logger.info('Database connection pool closed');
    }
  }

  static async query(text: string, values?: any[]): Promise<any> {
    const pool = DatabaseConfig.getPool();
    return pool.query(text, values);
  }

  static async getClient(): Promise<PoolClient> {
    const pool = DatabaseConfig.getPool();
    return pool.connect();
  }
}

/**
 * Schema migrations and initialization
 */
export const INIT_SCHEMA = `
-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements JSONB NOT NULL,
  execution_plan JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by VARCHAR(255),
  result JSONB,
  version INTEGER DEFAULT 1
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_duration_ms INTEGER,
  actual_duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error TEXT,
  result JSONB,
  dependencies TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1
);

-- Artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  path VARCHAR(1024) NOT NULL,
  content TEXT NOT NULL,
  size INTEGER NOT NULL,
  checksum VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'idle',
  workers INTEGER DEFAULT 3,
  available_workers INTEGER DEFAULT 3,
  current_tasks UUID[] DEFAULT '{}',
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  last_health_check TIMESTAMP DEFAULT NOW(),
  capabilities JSONB,
  configuration JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Queue messages table
CREATE TABLE IF NOT EXISTS queue_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  source_id VARCHAR(255) NOT NULL,
  destination_id VARCHAR(255),
  payload JSONB NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending'
);

-- File changes table
CREATE TABLE IF NOT EXISTS file_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(1024) NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  previous_hash VARCHAR(64),
  current_hash VARCHAR(64),
  is_significant BOOLEAN DEFAULT FALSE,
  change_category VARCHAR(100),
  affected_features TEXT[] DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Quality gate results table
CREATE TABLE IF NOT EXISTS quality_gate_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  gate_name VARCHAR(255) NOT NULL,
  passed BOOLEAN NOT NULL,
  score INTEGER,
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  details JSONB,
  executed_at TIMESTAMP DEFAULT NOW(),
  execution_time_ms INTEGER
);

-- Workflow metrics table
CREATE TABLE IF NOT EXISTS workflow_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  total_duration_ms INTEGER,
  total_cost_usd NUMERIC(10, 4),
  total_tokens_used INTEGER,
  quality_score INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP DEFAULT NOW(),
  level VARCHAR(20) NOT NULL,
  component VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  error TEXT,
  INDEX idx_timestamp (timestamp),
  INDEX idx_component (component),
  INDEX idx_level (level)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_type ON tasks(agent_type);
CREATE INDEX IF NOT EXISTS idx_artifacts_task_id ON artifacts(task_id);
CREATE INDEX IF NOT EXISTS idx_queue_messages_status ON queue_messages(status);
CREATE INDEX IF NOT EXISTS idx_file_changes_timestamp ON file_changes(timestamp);
CREATE INDEX IF NOT EXISTS idx_quality_results_task_id ON quality_gate_results(task_id);
`;

export async function initializeDatabase(): Promise<void> {
  logger.info('Initializing database schema...');

  try {
    await DatabaseConfig.initialize();
    const client = await DatabaseConfig.getClient();

    try {
      // Split and execute schema statements
      const statements = INIT_SCHEMA.split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await client.query(statement);
      }

      logger.info('Database schema initialized successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Failed to initialize database schema', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
