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

// Future exports:
// export { extractMetadata, type MetadataOptions } from "./metadata.ts";
// export { vectorizeContent, type VectorOptions } from "./vectorizer.ts";
