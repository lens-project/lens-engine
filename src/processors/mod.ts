// processors/mod.ts
export {
  type BatchResult,
  processContent,
  type ProcessingOptions,
} from "./src/batch_processor.ts";

// Re-export other module functionality
export {
  processHtmlBatch,
  type ProcessingResult,
  processMixedBatch,
} from "./src/batch.ts";

// Keep CLI export for backward compatibility
export { type CliOptions } from "./src/content_processor.ts";
