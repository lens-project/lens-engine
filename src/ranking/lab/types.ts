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
  contextFactors?: {
    dayOfWeekAdjustment?: number;
    timeOfDayAdjustment?: number;
    moodAlignment?: number;
  };
}

export interface RankingError {
  type: "invalid_input" | "llm_error" | "context_error" | "timeout";
  message: string;
  input?: ArticleInput;
  context?: RankingContext;
}

export type RankingResult = ScoringResult | RankingError;

export type RelevanceCategory = "high-interest" | "maybe-interesting" | "skip";

export interface ContextualAdjustments {
  dayOfWeekMultiplier: number;
  timeOfDayMultiplier: number;
  moodMultiplier: number;
}

export interface LLMScoringRequest {
  article: ArticleInput;
  context: RankingContext;
}

export interface LLMScoringResponse {
  score: number;
  reasoning: string;
  categories: string[];
  estimatedReadTime: number;
}
