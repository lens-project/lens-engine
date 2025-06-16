/**
 * Ranking Module
 *
 * Intelligent content scoring system that analyzes article summaries and ranks them
 * based on relevance, quality, and contextual factors. This module provides both
 * functional and class-based APIs for content ranking.
 *
 * Usage:
 * ```typescript
 * import { rankContent, ContentRanker } from "@src/ranking/mod.ts";
 * 
 * // Functional API
 * const results = await rankContent(articles, context);
 * 
 * // Class-based API
 * const ranker = new ContentRanker();
 * const result = await ranker.rankArticle(article, context);
 * ```
 */

// Re-export all public types
export * from "./types.ts";

// Import implementation
import { ContentRanker as ContentRankerImpl } from "./src/orchestrator.ts";
import {
  type ArticleInput,
  type RankingContext,
  type RankingOptions,
  type RankingResult,
  type ScoringResult,
  type RelevanceCategory,
} from "./types.ts";

/**
 * Main functional API for ranking content
 *
 * Ranks multiple articles based on their summaries and contextual factors.
 * This is the primary entry point for most ranking operations.
 *
 * @param articles Array of articles to rank
 * @param context Contextual information (day, time, mood, etc.)
 * @param options Optional ranking configuration
 * @returns Promise resolving to ranking results for each article
 */
export async function rankContent(
  articles: ArticleInput[],
  context: RankingContext,
  options?: RankingOptions
): Promise<RankingResult[]> {
  const ranker = new ContentRankerImpl();
  return ranker.rankBatch(articles, context, options);
}

/**
 * Rank a single article
 *
 * Convenience function for ranking individual articles.
 *
 * @param article Single article to rank
 * @param context Contextual information
 * @param options Optional ranking configuration
 * @returns Promise resolving to ranking result
 */
export async function rankArticle(
  article: ArticleInput,
  context: RankingContext,
  options?: RankingOptions
): Promise<RankingResult> {
  const ranker = new ContentRankerImpl();
  return ranker.rankArticle(article, context, options);
}

/**
 * Categorize relevance based on score
 *
 * Converts numerical scores to categorical relevance levels.
 *
 * @param score Numerical score (0-10)
 * @returns Relevance category
 */
export function categorizeRelevance(score: number): RelevanceCategory {
  if (score >= 7) return 'high-interest';
  if (score >= 4) return 'maybe-interesting';
  return 'skip';
}

/**
 * Create current ranking context automatically
 *
 * Generates ranking context based on current date/time.
 * User mood and reading duration must be provided explicitly.
 *
 * @param userMood User's current mood/focus
 * @param readingDuration Available reading time
 * @returns Current ranking context
 */
export function createCurrentContext(
  userMood?: RankingContext['userMood'],
  readingDuration?: RankingContext['readingDuration']
): RankingContext {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[now.getDay()] as RankingContext['dayOfWeek'];
  
  const hour = now.getHours();
  let timeOfDay: RankingContext['timeOfDay'];
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';

  return {
    dayOfWeek,
    timeOfDay,
    userMood,
    readingDuration,
  };
}

// Export criteria management functions
export {
  loadRankingCriteria,
  createExampleCriteriaConfig,
  generateCriteriaPromptText,
} from './src/criteria-loader.ts';

// Export utilities
export {
  isRankingError,
  isScoringResult,
  getSuccessfulResults,
  getErrorResults,
  calculateRankingStats,
  sortByScore,
  filterByScore,
  filterByCategory,
  formatRankingResults,
  type RankingStats,
} from './src/utils.ts';

/**
 * ContentRanker Class
 *
 * Advanced class-based API for content ranking. Provides more control
 * over ranking configuration and supports stateful operations.
 */
export class ContentRanker {
  private impl: ContentRankerImpl;

  constructor(options?: RankingOptions) {
    this.impl = new ContentRankerImpl(options);
  }

  /**
   * Rank a single article
   */
  async rankArticle(
    article: ArticleInput,
    context: RankingContext,
    options?: RankingOptions
  ): Promise<RankingResult> {
    return this.impl.rankArticle(article, context, options);
  }

  /**
   * Rank multiple articles in batch
   */
  async rankBatch(
    articles: ArticleInput[],
    context: RankingContext,
    options?: RankingOptions
  ): Promise<RankingResult[]> {
    return this.impl.rankBatch(articles, context, options);
  }

  /**
   * Categorize relevance based on score
   */
  categorizeRelevance(score: number): RelevanceCategory {
    return categorizeRelevance(score);
  }

  /**
   * Validate article input
   */
  validateArticle(article: ArticleInput): boolean {
    return this.impl.validateArticle(article);
  }

  /**
   * Validate ranking context
   */
  validateContext(context: RankingContext): boolean {
    return this.impl.validateContext(context);
  }
}