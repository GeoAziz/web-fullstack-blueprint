/**
 * Requirement Parsing and Extraction System
 * Converts markdown files into structured machine-processable requirements
 */

import { ParsedRequirements, UserStory, AcceptanceCriterion, Constraint, SuccessMetric, FeatureMetadata } from '@types';
import { Logger } from '@utils/logger';
import { ValidationError } from '@utils/errors';

export class RequirementParser {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('RequirementParser');
  }

  /**
   * Parse PRD markdown and extract structured requirements
   */
  async parseRequirements(markdown: string, featureId: string): Promise<ParsedRequirements> {
    this.logger.info(`Parsing requirements for feature: ${featureId}`);

    try {
      const sections = this.extractSections(markdown);

      const userStories = this.parseUserStories(sections.userStories);
      const acceptanceCriteria = this.parseAcceptanceCriteria(sections.acceptanceCriteria);
      const constraints = this.parseConstraints(sections.constraints);
      const successMetrics = this.parseSuccessMetrics(sections.successMetrics);

      const requirements: ParsedRequirements = {
        featureId,
        title: this.extractTitle(markdown),
        description: sections.description || '',
        priority: this.extractPriority(sections),
        userStories,
        acceptanceCriteria,
        constraints,
        dependencies: this.extractDependencies(sections),
        estimatedComplexity: this.estimateComplexity(userStories, acceptanceCriteria),
        estimatedEffortHours: this.estimateEffort(this.estimateComplexity(userStories, acceptanceCriteria)),
        successMetrics,
        metadata: this.extractMetadata(sections),
      };

      this.validateRequirements(requirements);
      return requirements;
    } catch (error) {
      this.logger.error('Failed to parse requirements', {
        featureId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Extract major sections from markdown
   */
  private extractSections(markdown: string): Record<string, string> {
    const sections: Record<string, string> = {};

    const sectionRegex = /^##\s+(.+?)$([\s\S]*?)(?=^##|$)/gm;
    let match;

    while ((match = sectionRegex.exec(markdown)) !== null) {
      const sectionName = match[1].toLowerCase().trim();
      const sectionContent = match[2].trim();
      sections[sectionName] = sectionContent;
    }

    return sections;
  }

  /**
   * Extract title from markdown
   */
  private extractTitle(markdown: string): string {
    const titleMatch = markdown.match(/^#\s+(.+?)$/m);
    return titleMatch ? titleMatch[1].trim() : 'Untitled Feature';
  }

  /**
   * Extract priority level
   */
  private extractPriority(sections: Record<string, string>): 'critical' | 'high' | 'medium' | 'low' {
    const content = Object.values(sections).join(' ').toLowerCase();

    if (content.includes('priority: critical')) return 'critical';
    if (content.includes('priority: p0')) return 'critical';
    if (content.includes('priority: high') || content.includes('priority: p1')) return 'high';
    if (content.includes('priority: low') || content.includes('priority: p3')) return 'low';

    return 'medium';
  }

  /**
   * Parse user stories from section
   */
  private parseUserStories(section: string): UserStory[] {
    const stories: UserStory[] = [];

    if (!section) return stories;

    // Match "As a X, I want Y, so that Z" patterns
    const storyRegex = /As a (.+?),\s+I want (.+?),\s+so that (.+?)[\n.]/gi;
    let match;

    let storyIndex = 0;
    while ((match = storyRegex.exec(section)) !== null) {
      const [, actor, action, goal] = match;

      // Extract acceptance criteria for this story
      const storyStart = section.indexOf(match[0]);
      const storyEnd = section.indexOf('As a', storyStart + 1);
      const storyBlock = section.substring(storyStart, storyEnd > 0 ? storyEnd : section.length);

      const acceptanceCriteriaRegex = /- (.+?)(?:\n|$)/g;
      const criteria: string[] = [];
      let critMatch;
      while ((critMatch = acceptanceCriteriaRegex.exec(storyBlock)) !== null) {
        criteria.push(critMatch[1].trim());
      }

      stories.push({
        id: `story-${storyIndex++}`,
        actor: actor.trim(),
        action: action.trim(),
        goal: goal.trim(),
        acceptanceCriteria: criteria,
      });
    }

    return stories;
  }

  /**
   * Parse acceptance criteria
   */
  private parseAcceptanceCriteria(section: string): AcceptanceCriterion[] {
    const criteria: AcceptanceCriterion[] = [];

    if (!section) return criteria;

    const criteriaRegex = /^-\s+(.+?)$/gm;
    let match;
    let index = 0;

    while ((match = criteriaRegex.exec(section)) !== null) {
      const criterion = match[1].trim();

      // Determine validation method
      let validationMethod: 'automated-test' | 'manual-review' | 'performance-check' | 'security-scan' = 'manual-review';

      if (criterion.toLowerCase().includes('test')) validationMethod = 'automated-test';
      if (criterion.toLowerCase().includes('performance') || criterion.toLowerCase().includes('ms')) {
        validationMethod = 'performance-check';
      }
      if (criterion.toLowerCase().includes('security')) validationMethod = 'security-scan';

      criteria.push({
        id: `criterion-${index++}`,
        criterion,
        validationMethod,
        priority: this.extractPriorityFromCriterion(criterion),
      });
    }

    return criteria;
  }

  /**
   * Extract priority from individual criterion
   */
  private extractPriorityFromCriterion(criterion: string): 'critical' | 'high' | 'medium' | 'low' {
    const text = criterion.toLowerCase();
    if (text.includes('must') || text.includes('critical')) return 'critical';
    if (text.includes('should') || text.includes('required')) return 'high';
    if (text.includes('could') || text.includes('optional')) return 'low';
    return 'medium';
  }

  /**
   * Parse constraints
   */
  private parseConstraints(section: string): Constraint[] {
    const constraints: Constraint[] = [];

    if (!section) return constraints;

    const constraintRegex = /^-\s+\[(\w+)\]\s+(.+?)$/gm;
    let match;
    let index = 0;

    while ((match = constraintRegex.exec(section)) !== null) {
      const [, category, constraint] = match;

      constraints.push({
        id: `constraint-${index++}`,
        category: (category.toLowerCase() as any) || 'technical',
        constraint: constraint.trim(),
        reason: this.extractReasonFromContext(section, match[0]),
      });
    }

    return constraints;
  }

  /**
   * Extract reason from surrounding context
   */
  private extractReasonFromContext(section: string, constraintLine: string): string {
    const index = section.indexOf(constraintLine);
    const nextLine = section.substring(index, section.indexOf('\n', index + 1));
    return nextLine.includes('because') ? nextLine.split('because')[1].trim() : 'Unknown reason';
  }

  /**
   * Parse success metrics
   */
  private parseSuccessMetrics(section: string): SuccessMetric[] {
    const metrics: SuccessMetric[] = [];

    if (!section) return metrics;

    const metricRegex = /^-\s+(.+?):\s+(.+?)$/gm;
    let match;

    while ((match = metricRegex.exec(section)) !== null) {
      const [, metric, target] = match;

      metrics.push({
        metric: metric.trim(),
        target: target.trim(),
        measurable: !target.toLowerCase().includes('yes') ? false : true,
        validationMethod: this.determineValidationMethod(metric),
      });
    }

    return metrics;
  }

  /**
   * Determine validation method for metric
   */
  private determineValidationMethod(metric: string): string {
    if (metric.toLowerCase().includes('lighthouse')) return 'lighthouse-audit';
    if (metric.toLowerCase().includes('load')) return 'performance-test';
    if (metric.toLowerCase().includes('coverage')) return 'code-coverage';
    if (metric.toLowerCase().includes('user')) return 'user-testing';
    return 'manual-verification';
  }

  /**
   * Extract dependencies on other features
   */
  private extractDependencies(sections: Record<string, string>): string[] {
    const dependencies: string[] = [];
    const content = Object.values(sections).join(' ');

    const depRegex = /depends on #(\w+)/gi;
    let match;

    while ((match = depRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  /**
   * Estimate complexity based on user stories and criteria
   */
  private estimateComplexity(
    userStories: UserStory[],
    criteria: AcceptanceCriterion[]
  ): 'simple' | 'moderate' | 'complex' | 'very-complex' {
    const score = userStories.length * 2 + criteria.length * 1.5;

    if (score < 5) return 'simple';
    if (score < 15) return 'moderate';
    if (score < 25) return 'complex';
    return 'very-complex';
  }

  /**
   * Estimate effort in hours based on complexity
   */
  private estimateEffort(complexity: 'simple' | 'moderate' | 'complex' | 'very-complex'): number {
    const estimates: Record<string, number> = {
      simple: 2,
      moderate: 8,
      complex: 20,
      'very-complex': 40,
    };
    return estimates[complexity];
  }

  /**
   * Extract metadata
   */
  private extractMetadata(sections: Record<string, string>): FeatureMetadata {
    const content = Object.values(sections).join(' ');

    return {
      tags: this.extractTags(content),
      riskLevel: this.extractRiskLevel(content),
      dependencies: [],
    };
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const tagRegex = /#(\w+)/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract risk level
   */
  private extractRiskLevel(content: string): 'low' | 'medium' | 'high' {
    const text = content.toLowerCase();
    if (text.includes('high risk') || text.includes('critical')) return 'high';
    if (text.includes('medium risk') || text.includes('moderate')) return 'medium';
    return 'low';
  }

  /**
   * Validate parsed requirements
   */
  private validateRequirements(requirements: ParsedRequirements): void {
    const errors: string[] = [];

    if (!requirements.title || requirements.title === 'Untitled Feature') {
      errors.push('Feature must have a clear title');
    }

    if (requirements.userStories.length === 0) {
      errors.push('Feature must have at least one user story');
    }

    if (requirements.acceptanceCriteria.length === 0) {
      errors.push('Feature must have at least one acceptance criterion');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Requirement validation failed: ${errors.join('; ')}`, {
        errors,
        featureId: requirements.featureId,
      });
    }

    this.logger.info(`Requirements validated successfully for feature: ${requirements.featureId}`);
  }
}
