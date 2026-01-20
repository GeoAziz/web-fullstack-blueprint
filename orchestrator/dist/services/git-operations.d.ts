/**
 * Git Operations Service
 * Handles all git operations: branches, commits, PRs
 */
export interface GitBranchOptions {
    branchName: string;
    baseBranch?: string;
}
export interface GitCommitOptions {
    message: string;
    author?: string;
}
export interface GitPROptions {
    title: string;
    description: string;
    branchName: string;
    baseBranch?: string;
    reviewers?: string[];
    labels?: string[];
}
export declare class GitOperations {
    private logger;
    private repoPath;
    private gitHubToken?;
    private gitHubOwner?;
    private gitHubRepo?;
    constructor(repoPath?: string);
    /**
     * Create a new branch
     */
    createBranch(options: GitBranchOptions): Promise<string>;
    /**
     * Stage all changes
     */
    stageChanges(): Promise<void>;
    /**
     * Commit changes
     */
    commit(options: GitCommitOptions): Promise<string>;
    /**
     * Push branch
     */
    push(branchName: string): Promise<void>;
    /**
     * Create a pull request on GitHub
     */
    createPullRequest(options: GitPROptions): Promise<{
        prNumber: number;
        prUrl: string;
    }>;
    /**
     * Add reviewers to a PR
     */
    private addReviewers;
    /**
     * Add labels to a PR
     */
    private addLabels;
    /**
     * Get current branch
     */
    getCurrentBranch(): Promise<string>;
    /**
     * Format PR description with metadata
     */
    private formatPRDescription;
    /**
     * Check if changes exist
     */
    hasChanges(): Promise<boolean>;
    /**
     * Get git status
     */
    getStatus(): Promise<string>;
}
//# sourceMappingURL=git-operations.d.ts.map