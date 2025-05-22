/**
 * Shared Controller Types
 * 
 * Common interfaces used across all controllers for consistent
 * processing workflows and result handling.
 */

/**
 * Options for processing operations
 */
export interface ProcessingOptions {
  /** Whether to overwrite existing output files */
  overwrite?: boolean;
  /** Maximum number of concurrent operations */
  maxConcurrency?: number;
  /** Output directory for processed files */
  outputDir?: string;
}

/**
 * Result of a processing operation
 */
export interface ProcessingResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Input file path or identifier */
  input: string;
  /** Output file path if successful */
  output?: string;
  /** Error message if failed */
  error?: string;
  /** Extracted content metadata */
  metadata?: {
    wordCount: number;
    urls: string[];
    title?: string;
  };
}

/**
 * Batch processing results summary
 */
export interface BatchResult {
  /** Total number of items processed */
  totalItems: number;
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  failureCount: number;
  /** Individual results */
  results: ProcessingResult[];
}

/**
 * Progress callback for batch processing
 */
export type ProgressCallback = (completed: number, total: number, current?: string) => void;