/**
 * Models Controller Module
 *
 * Exports all controller functionality for the models module.
 */

// Summarization controller
export {
  summarizeContent,
  type SummaryOptions,
  type SummaryResponse,
} from "./summarizer.ts";

// Ranking controller
export {
  rankContent,
  type ArticleInput as RankingArticleInput,
  type RankingContext,
  type RankingOptions,
  type RankingResult,
  type RankingResponse,
} from "./ranker.ts";

// Future exports:
// export { extractMetadata, type MetadataOptions } from "./metadata.ts";
// export { vectorizeContent, type VectorOptions } from "./vectorizer.ts";
