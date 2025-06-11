/**
 * Controller Module
 *
 * Exports all controller functionality for content processing workflows.
 */

// Content controllers
export {
  type HtmlProcessingOptions,
  processHtmlContent,
  processHtmlFile,
} from "./content/html.ts";

// Processing controllers
export {
  type BatchProcessingOptions,
  processHtmlBatch,
  processMixedBatch,
} from "./processing/batch.ts";

// Shared types
export type {
  BatchResult,
  ProcessingOptions,
  ProcessingResult,
  ProgressCallback,
} from "./types.ts";
