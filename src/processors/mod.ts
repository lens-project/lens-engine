// processors/mod.ts
export {
  type ProcessingOptions,
  processContent,
  type BatchResult,
} from "./src/batch_processor.ts";

// Re-export other module functionality
export {
  type ProcessingResult,
  processHtmlBatch,
  processMixedBatch,
} from "./src/batch.ts";

// Keep CLI export for backward compatibility
export { type CliOptions } from "./src/content_processor.ts";
