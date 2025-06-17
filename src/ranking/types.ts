/**
 * Ranking Module Types
 *
 * Public type definitions for the content ranking system.
 * This module provides intelligent content scoring based on article summaries
 * and contextual factors like time of day, user mood, and reading preferences.
 */

export interface ArticleInput {
  title: string;
  summary: string;
  url: string;
  publishedAt?: Date;
  source?: string;
  categories?: string[];
}

export interface RankingContext {
  dayOfWeek:
    | "Sunday"
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday";
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  userMood?: "focused" | "casual" | "learning" | "entertainment";
  readingDuration?: "quick" | "medium" | "deep";
}

export interface ScoringResult {
  score: number;
  confidence: number;
  method: "llm" | "embedding" | "hybrid";
  reasoning?: string;
  categories?: string[];
  estimatedReadTime?: number;
  input: ArticleInput;
  contextFactors?: {
    dayOfWeekAdjustment?: number;
    timeOfDayAdjustment?: number;
    moodAlignment?: number;
  };
}

export interface RankingErrorData {
  type:
    | "invalid_input"
    | "llm_error"
    | "context_error"
    | "timeout"
    | "config_error";
  message: string;
  input?: ArticleInput;
  context?: RankingContext;
}

export type RankingResult = ScoringResult | RankingErrorData;

export type RelevanceCategory = "high-interest" | "maybe-interesting" | "skip";

export interface RankingOptions {
  /** Maximum time to wait for LLM response (milliseconds) */
  timeout?: number;
  /** Confidence threshold for accepting scores */
  confidenceThreshold?: number;
  /** Whether to apply context-aware adjustments */
  enableContextAdjustments?: boolean;
  /** Maximum batch size for processing */
  maxBatchSize?: number;
  /** Whether to continue on individual article errors */
  continueOnError?: boolean;
  /** Custom ranking criteria configuration */
  criteriaConfig?: RankingCriteriaConfig;
}

export interface RankingConfig {
  /** Minimum confidence threshold for scoring */
  confidenceThreshold: number;
  /** Default user mood when not specified */
  defaultMood: "focused" | "casual" | "learning" | "entertainment";
  /** Enable context-aware scoring adjustments */
  contextAware: boolean;
  /** Timeout for LLM requests (milliseconds) */
  llmTimeout: number;
  /** Maximum batch size for processing */
  maxBatchSize: number;
}

export interface ContextualAdjustments {
  dayOfWeekMultiplier: number;
  timeOfDayMultiplier: number;
  moodMultiplier: number;
}

export interface LLMScoringRequest {
  article: ArticleInput;
  context: RankingContext;
  criteriaConfig?: RankingCriteriaConfig;
}

export interface LLMScoringResponse {
  score: number;
  reasoning: string;
  categories: string[];
  estimatedReadTime: number;
}

export class RankingError extends Error {
  public readonly type: RankingErrorData["type"];
  public readonly input?: ArticleInput;
  public readonly context?: RankingContext;

  constructor(
    type: RankingErrorData["type"],
    message: string,
    input?: ArticleInput,
    context?: RankingContext,
  ) {
    super(message);
    this.name = "RankingError";
    this.type = type;
    this.input = input;
    this.context = context;
  }
}

/**
 * Dynamic ranking criteria configuration
 * Allows customization of evaluation criteria without code changes
 */
export interface RankingCriteriaConfig {
  /** Configuration version for future compatibility */
  version: string;
  /** Human-readable description of this criteria set */
  description?: string;
  /** List of evaluation criteria */
  criteria: RankingCriterion[];
  /** Scoring guidelines with ranges */
  scoringGuidelines: ScoringGuideline[];
  /** Additional instructions for the LLM */
  additionalInstructions?: string[];
}

export interface RankingCriterion {
  /** Unique identifier for this criterion */
  id: string;
  /** Display name for the criterion */
  name: string;
  /** Detailed description/question for evaluation */
  description: string;
  /** Weight/importance (1-10, optional for future use) */
  weight?: number;
}

export interface ScoringGuideline {
  /** Score range (e.g., "0-2", "3-4", "7-8") */
  range: string;
  /** Description of content quality at this level */
  description: string;
  /** Optional examples */
  examples?: string[];
}
