/**
 * Models Module
 *
 * Exports all models functionality including providers and controllers.
 */

// Controllers
export {
  rankContent,
  type RankingArticleInput,
  type RankingContext,
  type RankingOptions,
  type RankingResponse,
  type RankingResult,
  summarizeContent,
  type SummaryOptions,
  type SummaryResponse,
} from "./src/controller/mod.ts";

// Providers
export {
  type ChatResponse,
  chatWithOllama,
  chatWithOllamaConfig,
  validateOllamaConnection,
  type ValidationResponse,
} from "./src/providers/ollama/client.ts";

// Future exports:
// export { type ProviderConfig } from "./src/providers/mod.ts";
// export { type ModelMetadata } from "./src/types.ts";
