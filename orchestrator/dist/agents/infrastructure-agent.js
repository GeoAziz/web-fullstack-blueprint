"use strict";
/**
 * Infrastructure Development Agent
 * Generates Terraform, Docker, and CI/CD configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureAgent = void 0;
const logger_1 = require("@utils/logger");
const claude_api_1 = require("@services/claude-api");
const database_1 = require("@utils/database");
const uuid_1 = require("uuid");
class InfrastructureAgent {
    constructor() {
        this.logger = new logger_1.Logger('InfrastructureAgent');
        this.claudeAPI = new claude_api_1.ClaudeWrapper();
    }
    /**
     * Process infrastructure generation task
     */
    async processInfrastructureGeneration(task) {
        this.logger.info('Processing infrastructure task', {
            taskId: task.taskId,
            types: task.infrastructure,
        });
        const generated = [];
        try {
            for (const infraType of task.infrastructure) {
                const result = await this.generateInfrastructure(task, infraType);
                generated.push(result);
            }
            // Store all generated infrastructure
            for (const infra of generated) {
                await this.storeInfrastructure(infra);
            }
            this.logger.info('Infrastructure generation complete', {
                taskId: task.taskId,
                count: generated.length,
            });
            return generated;
        }
        catch (error) {
            this.logger.error('Infrastructure generation failed', {
                taskId: task.taskId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Generate specific infrastructure type
     */
    async generateInfrastructure(task, type) {
        const startTime = Date.now();
        try {
            const prompt = this.buildInfrastructurePrompt(task, type);
            const generatedCode = await this.claudeAPI.generateCode(prompt);
            const validated = await this.validateInfrastructure(type, generatedCode);
            const infra = {
                id: (0, uuid_1.v4)().toString(),
                taskId: task.taskId,
                type: type,
                content: generatedCode,
                path: this.getOutputPath(type),
                validationPassed: validated,
                generatedAt: new Date(),
            };
            this.logger.info(`${type} generated`, {
                taskId: task.taskId,
                duration: Date.now() - startTime,
                validated,
            });
            return infra;
        }
        catch (error) {
            throw new Error(`Failed to generate ${type}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Build infrastructure generation prompt
     */
    buildInfrastructurePrompt(task, type) {
        const baseContext = `You are an expert infrastructure engineer. Generate production-ready ${type} configuration.

Project Requirements:
${JSON.stringify(task.requirements, null, 2)}

Output ONLY the ${type} code without explanation.
Follow best practices for security, scalability, and maintainability.`;
        switch (type) {
            case 'terraform':
                return `${baseContext}

Generate Terraform configuration for:
- PostgreSQL RDS database with automatic backups
- Redis ElastiCache cluster
- ECS cluster for services
- Application Load Balancer
- CloudWatch monitoring
- VPC with proper security groups

Use variables for environment-specific configuration.
Include outputs for important resource identifiers.`;
            case 'docker':
                return `${baseContext}

Generate Dockerfiles for:
- Node.js backend service (multi-stage build)
- Next.js frontend application
- Worker service for background jobs

Include:
- Health checks
- Proper signal handling
- Security best practices
- Environment variable configuration
- Optimized layer caching`;
            case 'cicd':
                return `${baseContext}

Generate GitHub Actions CI/CD pipeline with:
- Lint and type check on every push
- Run tests with coverage reporting
- Build and push Docker images to ECR
- Deploy to staging on merge to main
- Run E2E tests on staging
- Deploy to production with approval gate

Include secrets management and environment configuration.`;
            case 'monitoring':
                return `${baseContext}

Generate monitoring configuration (CloudWatch/Datadog format) including:
- Application performance monitoring metrics
- Database performance tracking
- Infrastructure health checks
- Error rate alerts
- Custom business metrics
- Dashboard definitions

Include alert thresholds and notification channels.`;
            default:
                return baseContext;
        }
    }
    /**
     * Validate generated infrastructure
     */
    async validateInfrastructure(type, content) {
        try {
            switch (type) {
                case 'terraform':
                    return content.includes('resource') && content.includes('variable');
                case 'docker':
                    return content.includes('FROM') && content.includes('RUN');
                case 'cicd':
                    return content.includes('jobs') && content.includes('runs-on');
                case 'monitoring':
                    return content.includes('metrics') || content.includes('alarms');
                default:
                    return false;
            }
        }
        catch (error) {
            this.logger.warn('Infrastructure validation inconclusive', { type });
            return false;
        }
    }
    /**
     * Get output path for infrastructure type
     */
    getOutputPath(type) {
        switch (type) {
            case 'terraform':
                return 'infra/terraform/main.tf';
            case 'docker':
                return 'infra/docker/Dockerfile';
            case 'cicd':
                return '.github/workflows/deploy.yml';
            case 'monitoring':
                return 'infra/monitoring/config.json';
            default:
                return 'infra/generated.conf';
        }
    }
    /**
     * Store generated infrastructure to database
     */
    async storeInfrastructure(infra) {
        try {
            await database_1.DatabaseConfig.query(`INSERT INTO generated_infrastructure (id, task_id, type, content, path, validation_passed, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [infra.id, infra.taskId, infra.type, infra.content, infra.path, infra.validationPassed, infra.generatedAt]);
            this.logger.debug('Infrastructure stored', { id: infra.id, type: infra.type });
        }
        catch (error) {
            this.logger.error('Failed to store infrastructure', {
                id: infra.id,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Get generated infrastructure
     */
    async getInfrastructure(taskId) {
        try {
            const result = await database_1.DatabaseConfig.query(`SELECT * FROM generated_infrastructure WHERE task_id = $1 ORDER BY generated_at DESC`, [taskId]);
            return result.rows.map((row) => ({
                id: row.id,
                taskId: row.task_id,
                type: row.type,
                content: row.content,
                path: row.path,
                validationPassed: row.validation_passed,
                generatedAt: row.generated_at,
            }));
        }
        catch (error) {
            this.logger.error('Failed to get infrastructure', {
                taskId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
}
exports.InfrastructureAgent = InfrastructureAgent;
//# sourceMappingURL=infrastructure-agent.js.map