/**
 * Batch Processing Controller
 *
 * Orchestrates batch processing workflows across different content types.
 * Handles concurrency, progress tracking, and error aggregation.
 */

import { processHtmlFile } from "../content/html.ts";
import type {
  BatchResult,
  ProcessingOptions,
  ProcessingResult,
  ProgressCallback,
} from "../types.ts";

/**
 * Batch processing options
 */
export interface BatchProcessingOptions extends ProcessingOptions {
  /** Progress callback function */
  onProgress?: ProgressCallback;
  /** Whether to continue processing after errors */
  continueOnError?: boolean;
}

/**
 * Process multiple HTML files in batch
 *
 * @param filePaths - Array of HTML file paths to process
 * @param options - Batch processing options
 * @returns Batch processing results
 *
 * @example
 * ```typescript
 * const files = ["doc1.html", "doc2.html"];
 * const results = await processHtmlBatch(files, {
 *   maxConcurrency: 3,
 *   onProgress: (completed, total) => console.log(`${completed}/${total}`)
 * });
 * ```
 */
export async function processHtmlBatch(
  filePaths: string[],
  options: BatchProcessingOptions = {},
): Promise<BatchResult> {
  const results: ProcessingResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Bootstrap: Process sequentially
  // Future: Add concurrency control with options.maxConcurrency
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];

    // Report progress
    if (options.onProgress) {
      options.onProgress(i, filePaths.length, filePath);
    }

    const result = await processHtmlFile(filePath, options);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      failureCount++;

      // Stop on first error if continueOnError is false
      if (!options.continueOnError) {
        break;
      }
    }
  }

  // Final progress report
  if (options.onProgress) {
    options.onProgress(results.length, filePaths.length);
  }

  return {
    totalItems: filePaths.length,
    successCount,
    failureCount,
    results,
  };
}

/**
 * Process mixed content types in batch
 *
 * Bootstrap implementation - currently only handles HTML files.
 * Future: Auto-detect file types and route to appropriate processors.
 *
 * @param filePaths - Array of file paths to process
 * @param options - Batch processing options
 * @returns Batch processing results
 */
export async function processMixedBatch(
  filePaths: string[],
  options: BatchProcessingOptions = {},
): Promise<BatchResult> {
  // Bootstrap: Only handle HTML files for now
  const htmlFiles = filePaths.filter((path) =>
    path.toLowerCase().endsWith(".html") || path.toLowerCase().endsWith(".htm")
  );

  if (htmlFiles.length !== filePaths.length) {
    console.warn(
      `Only processing ${htmlFiles.length} HTML files out of ${filePaths.length} total files`,
    );
  }

  const batchResult = await processHtmlBatch(htmlFiles, options);

  // Return original total count instead of processed count
  return {
    ...batchResult,
    totalItems: filePaths.length, // Original input count
  };
}
