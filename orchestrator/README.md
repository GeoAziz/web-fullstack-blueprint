# Orchestrator Service - Phase 1 Implementation

## Overview

This is the **core orchestration engine** for the AI Web Full-Stack Blueprint. It's responsible for:

1. **Detecting** changes in the `/product/` directory
2. **Parsing** markdown requirements into structured format
3. **Planning** execution with dependency resolution
4. **Coordinating** AI agents via Bull message queue
5. **Managing** code generation and git operations
6. **Validating** output through quality gates

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Claude API key

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Initialize database
npm run db:init

# Start development server
npm run dev
```

### Environment Variables

```env
# Node Environment
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blueprint_orchestrator
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://localhost:6379

# Claude API
CLAUDE_API_KEY=your-key-here
CLAUDE_MODEL=claude-3-sonnet-20240229

# Git
GIT_REPO_PATH=../
GIT_BRANCH_PREFIX=feature/ai-

# File Monitoring
WATCH_DIR=../product
CHANGE_DEBOUNCE_MS=1000

# Logging
LOG_LEVEL=info
```

## Architecture

### Core Components

#### 1. **File Watcher** (`src/services/file-watcher.ts`)
Monitors `/product/` directory for changes and triggers orchestration.

```typescript
const watcher = new FileWatcher();
await watcher.initialize();
watcher.start();
```

#### 2. **Requirement Parser** (`src/services/requirement-parser.ts`)
Converts markdown files into structured requirements.

```typescript
const parser = new RequirementParser();
const requirements = await parser.parseRequirements(markdown, featureId);
```

#### 3. **Orchestrator** (`src/core/orchestrator.ts`)
Main coordination engine (coming next).

#### 4. **Queue Manager** (`src/queue/queue-manager.ts`)
Manages Bull message queue (coming next).

#### 5. **Frontend Agent** (`src/agents/frontend-agent.ts`)
Generates React/Next.js code with Claude (coming next).

### Data Flow

```
File Change
    ↓
FileWatcher (detects change)
    ↓
ChangeAnalysis (is it significant?)
    ↓
Orchestrator (plan execution)
    ↓
RequirementParser (extract requirements)
    ↓
ExecutionPlanner (resolve dependencies)
    ↓
BullQueue (queue tasks)
    ↓
Agent (generate code)
    ↓
QualityGates (validate)
    ↓
GitOperations (create PR)
```

## Development

### Scripts

```bash
# Development (auto-reload)
npm run dev

# Build
npm run build

# Start production build
npm start

# Run tests
npm test
npm test:watch

# Run tests with coverage
npm test:coverage

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Clean build artifacts
npm run clean
```

### Project Structure

```
src/
├── core/                      # Core orchestration logic
│   ├── orchestrator.ts        # Main orchestration engine
│   ├── workflow.ts            # Workflow management
│   ├── task-queue.ts          # Task queuing
│   └── dependency-resolver.ts # Dependency resolution
├── services/                  # Business logic services
│   ├── file-watcher.ts        # File change detection ✅
│   ├── requirement-parser.ts  # Requirement parsing ✅
│   ├── claude-api.ts          # Claude integration
│   ├── git-operations.ts      # Git automation
│   └── quality-gates.ts       # Code validation
├── agents/                    # AI agents
│   ├── base-agent.ts          # Base agent class
│   ├── frontend-agent.ts      # React/Next.js generator
│   └── agent-manager.ts       # Agent coordination
├── queue/                     # Message queue
│   ├── queue-manager.ts       # Bull setup
│   ├── message-router.ts      # Message routing
│   └── job-handlers.ts        # Job processing
├── utils/                     # Utilities
│   ├── database.ts            # PostgreSQL connection ✅
│   ├── logger.ts              # Structured logging ✅
│   ├── errors.ts              # Error handling ✅
│   ├── validators.ts          # Input validation
│   └── helpers.ts             # Utility functions
├── types/                     # TypeScript types
│   └── index.ts               # Complete type system ✅
└── index.ts                   # Entry point
tests/
├── unit/                      # Unit tests
├── integration/               # Integration tests
└── e2e/                       # End-to-end tests
```

## Type System

Complete TypeScript types are defined in `src/types/index.ts`:

- **Workflow Types**: `Workflow`, `WorkflowStatus`, `WorkflowResult`
- **Task Types**: `Task`, `TaskStatus`, `TaskResult`
- **Agent Types**: `Agent`, `AgentResponse`
- **Queue Types**: `QueueMessage`, `QueueConfig`
- **Requirement Types**: `ParsedRequirements`, `UserStory`
- **Quality Types**: `QualityGateResult`, `QualityError`
- **Monitoring Types**: `WorkflowMetrics`, `AgentMetrics`

## Phase 1 Deliverables

### ✅ Complete
- Project structure and configuration
- TypeScript types (100+ interfaces)
- Database schema and initialization
- File watcher service
- Requirement parser service
- Logging and error handling
- Environment configuration

### 🔄 In Progress
- Claude API wrapper
- Main orchestrator
- Task queue setup

### ⏳ Coming Next
- Frontend agent implementation
- Git integration
- Quality gates
- Agent manager
- End-to-end workflow testing

## Testing

### Unit Tests
```bash
npm test src/services/file-watcher.test.ts
npm test src/services/requirement-parser.test.ts
```

### Integration Tests
```bash
npm test tests/integration/
```

### E2E Tests
```bash
npm test tests/e2e/
```

## Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- `logs/exceptions.log` - Uncaught exceptions

## Deployment

### Docker
```bash
docker build -t orchestrator .
docker run --env-file .env orchestrator
```

### Kubernetes
See `infra/` for Kubernetes manifests.

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U user -d blueprint_orchestrator

# Check connection string in .env
# Reset database: DROP DATABASE blueprint_orchestrator; CREATE DATABASE blueprint_orchestrator;
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Check Redis connection string in .env
```

### File Watcher Not Detecting Changes
- Check `WATCH_DIR` path in `.env`
- Verify directory permissions
- Check logs for errors

### Claude API Errors
- Verify `CLAUDE_API_KEY` in `.env`
- Check API rate limits
- Monitor costs in Claude console

## Performance Targets

- File detection: < 5 seconds
- Requirement parsing: < 2 seconds
- Orchestration planning: < 5 seconds
- Code generation per component: < 60 seconds
- Full workflow end-to-end: < 5 minutes

## Cost Management

Claude API costs are tracked per workflow. Monthly budget: $500 (Phase 1).

Monitor costs in:
- Database: `workflow_metrics` table
- Real-time: Application logs
- Dashboard: (Coming Phase 2)

## Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Update types in `src/types/index.ts`
4. Document public APIs
5. Keep logs descriptive

## Related Documentation

- [Phase 1 Implementation Plan](./PHASE_1_IMPLEMENTATION_PLAN.md)
- [Completion Roadmap](../completion_roadmap.md)
- [System Architecture](../SYSTEM_ARCHITECTURE.md)
- [How It Works](../HOW_IT_WORKS.md)

## License

MIT - See LICENSE file
