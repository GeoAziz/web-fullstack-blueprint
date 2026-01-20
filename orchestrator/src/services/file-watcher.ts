/**
 * File Change Detection System
 * Monitors product/ directory for changes and triggers orchestration
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@utils/logger';
import { FileChange, ChangeAnalysis } from '@types';
import { AppError } from '@utils/errors';
import * as crypto from 'crypto';

export class FileWatcher {
  private logger: Logger;
  private watchDir: string;
  private fileHashes: Map<string, string> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debounceMs: number;
  private pollIntervalMs: number;
  private pollInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(watchDir: string = process.env.WATCH_DIR || './product') {
    this.logger = new Logger('FileWatcher');
    this.watchDir = watchDir;
    this.debounceMs = parseInt(process.env.CHANGE_DEBOUNCE_MS || '1000', 10);
    this.pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);
  }

  /**
   * Initialize watcher by scanning all files
   */
  async initialize(): Promise<void> {
    this.logger.info(`Initializing file watcher for directory: ${this.watchDir}`);

    try {
      if (!fs.existsSync(this.watchDir)) {
        throw new AppError(`Watch directory does not exist: ${this.watchDir}`, 'WATCH_DIR_NOT_FOUND');
      }

      await this.scanDirectory();
      this.logger.info(`File watcher initialized with ${this.fileHashes.size} files tracked`);
    } catch (error) {
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
  start(): void {
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
      } catch (error) {
        this.logger.error('Error during file change detection', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, this.pollIntervalMs);
  }

  /**
   * Stop polling for changes
   */
  stop(): void {
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
  private async detectChanges(): Promise<FileChange[]> {
    const changes: FileChange[] = [];

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
        } else if (previousHash !== hash) {
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
    } catch (error) {
      this.logger.error('Error detecting file changes', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return changes;
  }

  /**
   * Get all markdown files in watch directory
   */
  private async getMarkdownFiles(): Promise<string[]> {
    const files: string[] = [];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (entry.endsWith('.md')) {
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
  private async scanDirectory(): Promise<void> {
    const files = await this.getMarkdownFiles();

    for (const filePath of files) {
      const hash = await this.calculateFileHash(filePath);
      this.fileHashes.set(filePath, hash);
    }
  }

  /**
   * Calculate SHA256 hash of file content
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const content = await this.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Read file content
   */
  private async readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  /**
   * Get file content from a specific hash (from git history or cache)
   * For Phase 1, this is simplified - just returns current content
   */
  private async getFileContent(filePath: string, _hash: string): Promise<string | undefined> {
    try {
      return await this.readFile(filePath);
    } catch {
      return undefined;
    }
  }

  /**
   * Handle detected changes with debouncing
   */
  private handleChangesDetected(changes: FileChange[]): void {
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
  private emitChanges(changes: FileChange[]): void {
    // This will be connected to the orchestrator
    // For now, we just log
    this.logger.info(`Emitting ${changes.length} changes to orchestrator`);
  }

  /**
   * Analyze changes and determine if orchestration should be triggered
   */
  async analyzeChanges(changes: FileChange[]): Promise<ChangeAnalysis> {
    const analysis: ChangeAnalysis = {
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
      } else if (change.filePath.includes('constraints.md')) {
        analysis.changeCategory = 'constraint-update';
      } else if (change.filePath.includes('ui_kit.md')) {
        analysis.changeCategory = 'design-update';
      }
    }

    return analysis;
  }

  /**
   * Check if change is significant or just formatting
   */
  private isMinorChange(change: FileChange): boolean {
    if (change.changeType === 'deleted') return false;
    if (change.changeType === 'created') return false;

    if (!change.previousContent || !change.currentContent) return true;

    // Simple heuristic: if only whitespace changed, it's minor
    const prevNormalized = change.previousContent.replace(/\s+/g, ' ');
    const currNormalized = change.currentContent.replace(/\s+/g, ' ');

    return prevNormalized === currNormalized;
  }

  /**
   * Extract feature names from markdown content
   */
  private extractFeatureNames(content: string): string[] {
    const features: string[] = [];
    const headingRegex = /^##\s+(.+?)$/gm;
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      features.push(match[1].trim());
    }

    return features;
  }
}
