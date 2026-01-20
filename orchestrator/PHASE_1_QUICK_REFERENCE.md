# Phase 1 Quick Reference Guide

## What We've Built So Far (Day 1)

```
✅ FOUNDATION COMPLETE

orchestrator/
├── package.json              # Dependencies configured
├── tsconfig.json             # TypeScript strict mode ready
├── .env.example              # Configuration template
├── README.md                 # Setup guide
│
├── src/
│   ├── types/
│   │   └── index.ts          # 💎 100+ complete types
│   ├── utils/
│   │   ├── database.ts       # PostgreSQL connection + schema
│   │   ├── logger.ts         # Winston structured logging
│   │   └── errors.ts         # Custom error classes
│   ├── services/
│   │   ├── file-watcher.ts   # 👀 File change detection
│   │   └── requirement-parser.ts  # 📋 Markdown → structured data
│   ├── core/
│   ├── agents/
│   ├── queue/
│   └── index.ts              # Entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── PHASE_1_IMPLEMENTATION_PLAN.md  # 📚 Complete roadmap
```

## Installation & Setup (Next Steps)

### 1. Install Dependencies
```bash
cd orchestrator
npm install
```

This installs:
- **Runtime**: express, bull, pg, redis, winston
- **TypeScript**: typescript, ts-jest, tsx
- **Development**: jest, eslint, prettier
- **Quality**: @typescript-eslint

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your local config:
# - PostgreSQL connection string
# - Redis URL
# - Claude API key
# - Git repository path
```

### 3. Initialize Database
```bash
npm run db:init
```

Creates all tables:
- `workflows` - Track workflow execution
- `tasks` - Individual tasks within workflows
- `artifacts` - Generated code/config files
- `agents` - Agent status and metrics
- `queue_messages` - Message history
- `file_changes` - File change audit trail
- `quality_gate_results` - Validation results
- `logs` - Structured logs

### 4. Start Development
```bash
npm run dev
```

Starts:
- File watcher monitoring `/product/` directory
- Logger ready for operations
- Database connections pooled
- Application listening on port 3001

## Key Files to Understand

### 1. **Type System** (`src/types/index.ts`)
Everything is typed. Start here to understand the data model.

Key interfaces:
- `Workflow` - Complete workflow execution
- `Task` - Individual unit of work
- `ParsedRequirements` - Parsed PRD
- `Agent` - AI agent definition
- `QueueMessage` - Inter-service message

### 2. **File Watcher** (`src/services/file-watcher.ts`)
Polls `/product/` directory and detects changes.

How it works:
1. Scans all `.md` files in watch directory
2. Calculates SHA256 hash of each file
3. On poll interval, detects hash changes
4. Analyzes if change is significant
5. Emits change events for orchestrator

Usage:
```typescript
const watcher = new FileWatcher();
await watcher.initialize();  // Load all current hashes
watcher.start();             // Start polling

// Later...
const analysis = await watcher.analyzeChanges(changes);
if (analysis.isSignificant) {
  // Trigger orchestration
}
```

### 3. **Requirement Parser** (`src/services/requirement-parser.ts`)
Converts markdown into structured data.

What it parses:
- **User Stories**: "As a X, I want Y, so that Z"
- **Acceptance Criteria**: Testable conditions
- **Constraints**: Technical/business limitations
- **Success Metrics**: How to measure success

Usage:
```typescript
const parser = new RequirementParser();
const requirements = await parser.parseRequirements(markdownContent, featureId);
// Returns: ParsedRequirements with all structured data
```

### 4. **Database** (`src/utils/database.ts`)
PostgreSQL connection pool with schema initialization.

Features:
- Connection pooling (min 2, max 20 connections)
- Automatic retry logic
- Type-safe queries
- Schema auto-initialization

Usage:
```typescript
await DatabaseConfig.initialize();
const result = await DatabaseConfig.query('SELECT * FROM workflows');
const client = await DatabaseConfig.getClient();
```

### 5. **Logger** (`src/utils/logger.ts`)
Winston-based structured logging to files and console.

Outputs:
- `logs/combined.log` - All operations
- `logs/error.log` - Errors only  
- `logs/exceptions.log` - Uncaught exceptions

Usage:
```typescript
const logger = new Logger('ComponentName');
logger.info('Operation completed', { duration: 1234 });
logger.error('Operation failed', { error: err.message }, err);
```

## Development Workflow

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test:coverage
```

### Code Quality
```bash
# Check types
npm run type-check

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
```

### Building for Production
```bash
npm run build
npm start
```

## Next Components to Build (This Week)

### Priority 1: Core Orchestrator
- [ ] Main orchestration engine
- [ ] Workflow management
- [ ] Task execution planning
- [ ] Dependency resolution

### Priority 2: Queue & Claude Integration
- [ ] Bull message queue setup
- [ ] Claude API wrapper
- [ ] Context window management
- [ ] Prompt engineering

### Priority 3: Frontend Agent
- [ ] First AI agent implementation
- [ ] React component generation
- [ ] Validation of generated code
- [ ] Output artifact management

### Priority 4: Git & Quality
- [ ] Git operations (branch, commit, PR)
- [ ] Quality gates (TS, ESLint, tests)
- [ ] Integration with existing CI/CD
- [ ] End-to-end workflow validation

## Database Schema Overview

### workflows
Tracks the complete execution of a feature request.
```sql
- id (UUID)
- status (created | validating | planning | executing | testing | reviewing | completed | failed)
- title, description
- requirements (JSONB) - ParsedRequirements
- execution_plan (JSONB) - ExecutionPlan
- result (JSONB) - Final result
- created_at, started_at, completed_at
- created_by (who triggered it)
```

### tasks
Individual work units within a workflow.
```sql
- id (UUID)
- workflow_id (FK)
- agent_type (frontend | backend | infrastructure | test | security)
- status (pending | assigned | in-progress | completed | failed | retry)
- dependencies (UUID[]) - Other tasks that must finish first
- result (JSONB) - Task output
- retry_count, max_retries
- error (if failed)
- estimated_duration_ms, actual_duration_ms
```

### artifacts
Generated code, config, test files.
```sql
- id (UUID)
- task_id (FK)
- type (code | config | test | documentation | report)
- path (where to write file)
- content (file contents)
- checksum (for validation)
- size
- created_at
```

### agents
Status of each AI agent.
```sql
- id (UUID)
- agent_type (UNIQUE)
- name, status (idle | working | error)
- workers (available_workers, current_tasks)
- completed_tasks, failed_tasks
- capabilities, configuration (JSONB)
- last_health_check
```

## Common Commands

```bash
# Development
npm run dev              # Auto-reload development server
npm test                 # Run tests once
npm test:watch          # Watch mode

# Building
npm run build            # Compile TypeScript
npm run clean            # Remove build artifacts
npm start                # Run compiled code

# Quality
npm run lint            # Check code style
npm run lint:fix        # Auto-fix style issues
npm run format          # Format code with Prettier
npm run type-check      # Check TypeScript types

# Database
npm run db:init         # Initialize database schema
npm run db:migrate      # Run migrations (not yet used)
npm run db:seed         # Seed test data (not yet used)

# Monitoring
npm run logs            # Tail log files
npm run metrics         # Show system metrics
```

## Environment Variables Quick Reference

```env
NODE_ENV                  # development | production
PORT                      # Server port (3001)
DATABASE_URL              # PostgreSQL connection string
REDIS_URL                 # Redis connection string
CLAUDE_API_KEY            # Your Claude API key
CLAUDE_MODEL              # Model to use (claude-3-sonnet-20240229)
GIT_REPO_PATH             # Path to main repo (../)
WATCH_DIR                 # Directory to watch (../product)
LOG_LEVEL                 # Log verbosity (info, debug, error)
```

## Success Checklist

By end of Phase 1, you should have:

- [ ] Installation works: `npm install`
- [ ] Database initializes: `npm run db:init`
- [ ] Dev server starts: `npm run dev`
- [ ] File watcher detects changes in `/product/`
- [ ] Requirement parser converts markdown to data
- [ ] Orchestrator creates execution plans
- [ ] Frontend agent generates React code via Claude
- [ ] Quality gates validate generated code
- [ ] Git integration creates PRs
- [ ] End-to-end workflow completes < 5 minutes
- [ ] All logs are structured and searchable
- [ ] Tests cover >80% of code

## Debugging Tips

### File Watcher Not Detecting Changes
```bash
# Check watch directory
ls -la product/

# Verify .env has correct path
grep WATCH_DIR .env

# Enable debug logging
LOG_LEVEL=debug npm run dev
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW()"

# Check tables created
psql $DATABASE_URL -c "\dt"

# View logs
tail -f logs/error.log
```

### Claude API Issues
```bash
# Check API key
echo $CLAUDE_API_KEY | wc -c  # Should be ~90 chars

# Check rate limits in logs
grep -i "rate" logs/combined.log

# Monitor costs
grep -i "cost\|token" logs/combined.log | tail -20
```

## What's Ready to Test

You can now test these components:

1. **File Watcher**
   ```bash
   # Make a change to product/prd.md
   # Check logs: should detect change within 5 seconds
   ```

2. **Requirement Parser**
   ```bash
   # Look at product/prd.md content
   # Parser can extract features, user stories, acceptance criteria
   ```

3. **Database**
   ```bash
   # Manually query
   psql $DATABASE_URL -c "SELECT * FROM workflows"
   ```

4. **Logging**
   ```bash
   # Check log output
   tail -f logs/combined.log
   ```

## Next: Integration Testing

Once this week's components are built, integration tests will verify:

1. File change → Orchestrator receives it ✅
2. Orchestrator → Requirement parser processes it ✅
3. Parsed requirements → Execution plan created ✅
4. Execution plan → Tasks queued in Bull ✅
5. Task → Agent receives and processes ✅
6. Agent → Code generated via Claude ✅
7. Generated code → Quality gates validate ✅
8. Validated code → Git PR created ✅
9. Git PR → Human review on GitHub ✅
10. Human approval → Ready to merge ✅

---

**Phase 1 Target**: All 10 steps working end-to-end by Week 3.
