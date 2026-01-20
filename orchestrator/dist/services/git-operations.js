"use strict";
/**
 * Git Operations Service
 * Handles all git operations: branches, commits, PRs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitOperations = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const logger_1 = require("@utils/logger");
const errors_1 = require("@utils/errors");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitOperations {
    constructor(repoPath = process.cwd()) {
        this.logger = new logger_1.Logger('GitOperations');
        this.repoPath = repoPath;
        this.gitHubToken = process.env.GITHUB_TOKEN;
        this.gitHubOwner = process.env.GITHUB_OWNER;
        this.gitHubRepo = process.env.GITHUB_REPO;
    }
    /**
     * Create a new branch
     */
    async createBranch(options) {
        try {
            const baseBranch = options.baseBranch || 'main';
            this.logger.info('Creating branch', { branchName: options.branchName, baseBranch });
            await execAsync(`cd ${this.repoPath} && git fetch origin ${baseBranch}`);
            await execAsync(`cd ${this.repoPath} && git checkout -b ${options.branchName} origin/${baseBranch}`);
            this.logger.info('Branch created', { branchName: options.branchName });
            return options.branchName;
        }
        catch (error) {
            this.logger.error('Failed to create branch', {
                branchName: options.branchName,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Stage all changes
     */
    async stageChanges() {
        try {
            await execAsync(`cd ${this.repoPath} && git add -A`);
            this.logger.info('Changes staged');
        }
        catch (error) {
            this.logger.error('Failed to stage changes', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Commit changes
     */
    async commit(options) {
        try {
            const author = options.author || 'AI Agent <ai@blueprint.local>';
            await execAsync(`cd ${this.repoPath} && git commit -m "${options.message}" --author="${author}"`);
            const { stdout } = await execAsync(`cd ${this.repoPath} && git rev-parse HEAD`);
            const commitHash = stdout.trim();
            this.logger.info('Changes committed', { commitHash, message: options.message });
            return commitHash;
        }
        catch (error) {
            this.logger.error('Failed to commit changes', {
                message: options.message,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Push branch
     */
    async push(branchName) {
        try {
            await execAsync(`cd ${this.repoPath} && git push origin ${branchName}`);
            this.logger.info('Branch pushed', { branchName });
        }
        catch (error) {
            this.logger.error('Failed to push branch', {
                branchName,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Create a pull request on GitHub
     */
    async createPullRequest(options) {
        if (!this.gitHubToken || !this.gitHubOwner || !this.gitHubRepo) {
            throw new errors_1.AppError('GitHub credentials not configured. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO', 'GITHUB_NOT_CONFIGURED');
        }
        try {
            this.logger.info('Creating pull request', {
                title: options.title,
                branchName: options.branchName,
            });
            const baseBranch = options.baseBranch || 'main';
            const body = this.formatPRDescription(options.description);
            const response = await fetch(`https://api.github.com/repos/${this.gitHubOwner}/${this.gitHubRepo}/pulls`, {
                method: 'POST',
                headers: {
                    Authorization: `token ${this.gitHubToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/vnd.github.v3+json',
                },
                body: JSON.stringify({
                    title: options.title,
                    body,
                    head: options.branchName,
                    base: baseBranch,
                    draft: false,
                }),
            });
            if (!response.ok) {
                const error = (await response.json());
                throw new errors_1.AppError(`Failed to create PR: ${error.message || 'Unknown error'}`, 'GITHUB_PR_ERROR');
            }
            const pr = (await response.json());
            // Add reviewers if provided
            if (options.reviewers && options.reviewers.length > 0) {
                await this.addReviewers(pr.number, options.reviewers);
            }
            // Add labels if provided
            if (options.labels && options.labels.length > 0) {
                await this.addLabels(pr.number, options.labels);
            }
            this.logger.info('Pull request created', { prNumber: pr.number, prUrl: pr.html_url });
            return { prNumber: pr.number, prUrl: pr.html_url };
        }
        catch (error) {
            this.logger.error('Failed to create pull request', {
                title: options.title,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Add reviewers to a PR
     */
    async addReviewers(prNumber, reviewers) {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.gitHubOwner}/${this.gitHubRepo}/pulls/${prNumber}/requested_reviewers`, {
                method: 'POST',
                headers: {
                    Authorization: `token ${this.gitHubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reviewers }),
            });
            if (!response.ok) {
                this.logger.warn('Failed to add reviewers', { prNumber });
            }
        }
        catch (error) {
            this.logger.warn('Error adding reviewers', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Add labels to a PR
     */
    async addLabels(prNumber, labels) {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.gitHubOwner}/${this.gitHubRepo}/issues/${prNumber}/labels`, {
                method: 'POST',
                headers: {
                    Authorization: `token ${this.gitHubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ labels }),
            });
            if (!response.ok) {
                this.logger.warn('Failed to add labels', { prNumber });
            }
        }
        catch (error) {
            this.logger.warn('Error adding labels', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Get current branch
     */
    async getCurrentBranch() {
        try {
            const { stdout } = await execAsync(`cd ${this.repoPath} && git rev-parse --abbrev-ref HEAD`);
            return stdout.trim();
        }
        catch (error) {
            this.logger.error('Failed to get current branch', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Format PR description with metadata
     */
    formatPRDescription(description) {
        return `${description}\n\n---\n*Generated by AI Agent on ${new Date().toISOString()}*`;
    }
    /**
     * Check if changes exist
     */
    async hasChanges() {
        try {
            const { stdout } = await execAsync(`cd ${this.repoPath} && git status --short`);
            return stdout.trim().length > 0;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get git status
     */
    async getStatus() {
        try {
            const { stdout } = await execAsync(`cd ${this.repoPath} && git status --short`);
            return stdout;
        }
        catch (error) {
            throw new errors_1.AppError('Failed to get git status', 'GIT_ERROR');
        }
    }
}
exports.GitOperations = GitOperations;
//# sourceMappingURL=git-operations.js.map