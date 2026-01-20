/**
 * Requirement Parsing and Extraction System
 * Converts markdown files into structured machine-processable requirements
 */
import { ParsedRequirements } from '@types';
export declare class RequirementParser {
    private logger;
    constructor();
    /**
     * Parse PRD markdown and extract structured requirements
     */
    parseRequirements(markdown: string, featureId: string): Promise<ParsedRequirements>;
    /**
     * Extract major sections from markdown
     */
    private extractSections;
    /**
     * Extract title from markdown
     */
    private extractTitle;
    /**
     * Extract priority level
     */
    private extractPriority;
    /**
     * Parse user stories from section
     */
    private parseUserStories;
    /**
     * Parse acceptance criteria
     */
    private parseAcceptanceCriteria;
    /**
     * Extract priority from individual criterion
     */
    private extractPriorityFromCriterion;
    /**
     * Parse constraints
     */
    private parseConstraints;
    /**
     * Extract reason from surrounding context
     */
    private extractReasonFromContext;
    /**
     * Parse success metrics
     */
    private parseSuccessMetrics;
    /**
     * Determine validation method for metric
     */
    private determineValidationMethod;
    /**
     * Extract dependencies on other features
     */
    private extractDependencies;
    /**
     * Estimate complexity based on user stories and criteria
     */
    private estimateComplexity;
    /**
     * Estimate effort in hours based on complexity
     */
    private estimateEffort;
    /**
     * Extract metadata
     */
    private extractMetadata;
    /**
     * Extract tags from content
     */
    private extractTags;
    /**
     * Extract risk level
     */
    private extractRiskLevel;
    /**
     * Validate parsed requirements
     */
    private validateRequirements;
}
//# sourceMappingURL=requirement-parser.d.ts.map