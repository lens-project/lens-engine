/**
 * Models Module
 * 
 * Exports all models functionality including providers and controllers.
 */

// Controllers
export {
  summarizeContent,
  type SummaryOptions,
  type SummaryResponse,
} from "./src/controller/mod.ts";

// Providers
export {
  validateOllamaConnection,
  chatWithOllama,
  chatWithOllamaConfig,
  type ValidationResponse,
  type ChatResponse,
} from "./src/providers/ollama/client.ts";

// Future exports:
// export { type ProviderConfig } from "./src/providers/mod.ts";
// export { type ModelMetadata } from "./src/types.ts";
