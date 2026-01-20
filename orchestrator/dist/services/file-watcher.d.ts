/**
 * File Change Detection System
 * Monitors product/ directory for changes and triggers orchestration
 */
import { FileChange, ChangeAnalysis } from '@types';
export declare class FileWatcher {
    private logger;
    private watchDir;
    private fileHashes;
    private debounceTimers;
    private debounceMs;
    private pollIntervalMs;
    private pollInterval?;
    private isRunning;
    constructor(watchDir?: string);
    /**
     * Initialize watcher by scanning all files
     */
    initialize(): Promise<void>;
    /**
     * Start polling for file changes
     */
    start(): void;
    /**
     * Stop polling for changes
     */
    stop(): void;
    /**
     * Scan directory and detect all file changes
     */
    private detectChanges;
    /**
     * Get all markdown files in watch directory
     */
    private getMarkdownFiles;
    /**
     * Scan all files and initialize hashes
     */
    private scanDirectory;
    /**
     * Calculate SHA256 hash of file content
     */
    private calculateFileHash;
    /**
     * Read file content
     */
    private readFile;
    /**
     * Get file content from a specific hash (from git history or cache)
     * For Phase 1, this is simplified - just returns current content
     */
    private getFileContent;
    /**
     * Handle detected changes with debouncing
     */
    private handleChangesDetected;
    /**
     * Emit changes to listeners (to be connected to orchestrator)
     */
    private emitChanges;
    /**
     * Analyze changes and determine if orchestration should be triggered
     */
    analyzeChanges(changes: FileChange[]): Promise<ChangeAnalysis>;
    /**
     * Check if change is significant or just formatting
     */
    private isMinorChange;
    /**
     * Extract feature names from markdown content
     */
    private extractFeatureNames;
}
//# sourceMappingURL=file-watcher.d.ts.map