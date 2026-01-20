"use strict";
/**
 * File Change Detection System
 * Monitors product/ directory for changes and triggers orchestration
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
exports.FileWatcher = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("@utils/logger");
const errors_1 = require("@utils/errors");
const crypto = __importStar(require("crypto"));
class FileWatcher {
    constructor(watchDir = process.env.WATCH_DIR || './product') {
        this.fileHashes = new Map();
        this.debounceTimers = new Map();
        this.isRunning = false;
        this.logger = new logger_1.Logger('FileWatcher');
        this.watchDir = watchDir;
        this.debounceMs = parseInt(process.env.CHANGE_DEBOUNCE_MS || '1000', 10);
        this.pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);
    }
    /**
     * Initialize watcher by scanning all files
     */
    async initialize() {
        this.logger.info(`Initializing file watcher for directory: ${this.watchDir}`);
        try {
            if (!fs.existsSync(this.watchDir)) {
                throw new errors_1.AppError(`Watch directory does not exist: ${this.watchDir}`, 'WATCH_DIR_NOT_FOUND');
            }
            await this.scanDirectory();
            this.logger.info(`File watcher initialized with ${this.fileHashes.size} files tracked`);
        }
        catch (error) {
            this.logger.error('Failed to initialize file watcher', {
                watchDir: this.watchDir,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Start polling for file changes
     */
    start() {
        if (this.isRunning) {
            this.logger.warn('File watcher is already running');
            return;
        }
        this.isRunning = true;
        this.logger.info(`Starting file watcher with ${this.pollIntervalMs}ms poll interval`);
        this.pollInterval = setInterval(async () => {
            try {
                const changes = await this.detectChanges();
                if (changes.length > 0) {
                    this.handleChangesDetected(changes);
                }
            }
            catch (error) {
                this.logger.error('Error during file change detection', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }, this.pollIntervalMs);
    }
    /**
     * Stop polling for changes
     */
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = undefined;
        }
        this.isRunning = false;
        this.logger.info('File watcher stopped');
    }
    /**
     * Scan directory and detect all file changes
     */
    async detectChanges() {
        const changes = [];
        try {
            const files = await this.getMarkdownFiles();
            // Detect modified and new files
            for (const filePath of files) {
                const hash = await this.calculateFileHash(filePath);
                const previousHash = this.fileHashes.get(filePath);
                if (previousHash === undefined) {
                    // New file
                    const content = await this.readFile(filePath);
                    changes.push({
                        filePath,
                        changeType: 'created',
                        currentContent: content,
                        currentHash: hash,
                        timestamp: new Date(),
                    });
                    this.fileHashes.set(filePath, hash);
                }
                else if (previousHash !== hash) {
                    // Modified file
                    const previousContent = await this.getFileContent(filePath, previousHash);
                    const currentContent = await this.readFile(filePath);
                    changes.push({
                        filePath,
                        changeType: 'modified',
                        previousContent,
                        currentContent,
                        previousHash,
                        currentHash: hash,
                        timestamp: new Date(),
                    });
                    this.fileHashes.set(filePath, hash);
                }
            }
            // Detect deleted files
            for (const [trackedFile] of this.fileHashes) {
                if (!files.includes(trackedFile) && fs.existsSync(trackedFile)) {
                    // File was deleted but we still have it in tracking
                    const previousContent = await this.readFile(trackedFile);
                    changes.push({
                        filePath: trackedFile,
                        changeType: 'deleted',
                        previousContent,
                        previousHash: this.fileHashes.get(trackedFile),
                        timestamp: new Date(),
                    });
                    this.fileHashes.delete(trackedFile);
                }
            }
        }
        catch (error) {
            this.logger.error('Error detecting file changes', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
        return changes;
    }
    /**
     * Get all markdown files in watch directory
     */
    async getMarkdownFiles() {
        const files = [];
        const walk = (dir) => {
            const entries = fs.readdirSync(dir);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walk(fullPath);
                }
                else if (entry.endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        };
        walk(this.watchDir);
        return files;
    }
    /**
     * Scan all files and initialize hashes
     */
    async scanDirectory() {
        const files = await this.getMarkdownFiles();
        for (const filePath of files) {
            const hash = await this.calculateFileHash(filePath);
            this.fileHashes.set(filePath, hash);
        }
    }
    /**
     * Calculate SHA256 hash of file content
     */
    async calculateFileHash(filePath) {
        const content = await this.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    /**
     * Read file content
     */
    async readFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(data);
            });
        });
    }
    /**
     * Get file content from a specific hash (from git history or cache)
     * For Phase 1, this is simplified - just returns current content
     */
    async getFileContent(filePath, _hash) {
        try {
            return await this.readFile(filePath);
        }
        catch {
            return undefined;
        }
    }
    /**
     * Handle detected changes with debouncing
     */
    handleChangesDetected(changes) {
        // Clear existing debounce timer for this batch
        const batchKey = changes.map((c) => c.filePath).join('|');
        if (this.debounceTimers.has(batchKey)) {
            clearTimeout(this.debounceTimers.get(batchKey));
        }
        // Set new debounce timer
        const timer = setTimeout(() => {
            this.logger.info(`Processing ${changes.length} file changes`, {
                changes: changes.map((c) => ({ path: c.filePath, type: c.changeType })),
            });
            this.emitChanges(changes);
            this.debounceTimers.delete(batchKey);
        }, this.debounceMs);
        this.debounceTimers.set(batchKey, timer);
    }
    /**
     * Emit changes to listeners (to be connected to orchestrator)
     */
    emitChanges(changes) {
        // This will be connected to the orchestrator
        // For now, we just log
        this.logger.info(`Emitting ${changes.length} changes to orchestrator`);
    }
    /**
     * Analyze changes and determine if orchestration should be triggered
     */
    async analyzeChanges(changes) {
        const analysis = {
            changes,
            isSignificant: false,
            changeCategory: 'minor',
            affectedFeatures: [],
        };
        for (const change of changes) {
            // Skip minor files like formatting, comments
            if (this.isMinorChange(change)) {
                continue;
            }
            analysis.isSignificant = true;
            // Categorize change
            if (change.filePath.includes('prd.md')) {
                analysis.changeCategory = 'feature-new';
                analysis.affectedFeatures.push(...this.extractFeatureNames(change.currentContent || ''));
            }
            else if (change.filePath.includes('constraints.md')) {
                analysis.changeCategory = 'constraint-update';
            }
            else if (change.filePath.includes('ui_kit.md')) {
                analysis.changeCategory = 'design-update';
            }
        }
        return analysis;
    }
    /**
     * Check if change is significant or just formatting
     */
    isMinorChange(change) {
        if (change.changeType === 'deleted')
            return false;
        if (change.changeType === 'created')
            return false;
        if (!change.previousContent || !change.currentContent)
            return true;
        // Simple heuristic: if only whitespace changed, it's minor
        const prevNormalized = change.previousContent.replace(/\s+/g, ' ');
        const currNormalized = change.currentContent.replace(/\s+/g, ' ');
        return prevNormalized === currNormalized;
    }
    /**
     * Extract feature names from markdown content
     */
    extractFeatureNames(content) {
        const features = [];
        const headingRegex = /^##\s+(.+?)$/gm;
        let match;
        while ((match = headingRegex.exec(content)) !== null) {
            features.push(match[1].trim());
        }
        return features;
    }
}
exports.FileWatcher = FileWatcher;
//# sourceMappingURL=file-watcher.js.map