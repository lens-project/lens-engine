/**
 * Batch Content Processor Module
 *
 * Pure module for batch processing content files. No CLI concerns.
 * Provides content processing functionality for the lens-engine system.
 * Supports HTML batch processing with progress tracking and comprehensive
 * error handling.
 */

import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";
import { getConfig } from "@src/config/mod.ts";

import {
  type BatchProcessingOptions,
  type BatchResult,
  processHtmlBatch,
  processMixedBatch,
} from "./batch.ts";

/**
 * Processing options for batch content processing
 */
export interface ProcessingOptions {
  /** Input directory or file path */
  input?: string;
  /** Output directory path */
  output?: string;
  /** Whether to process all file types (mixed batch) */
  mixed?: boolean;
  /** Whether to continue processing after errors */
  continueOnError?: boolean;
  /** Maximum concurrency (future feature) */
  maxConcurrency?: number;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** Enable verbose output */
  verbose?: boolean;
  /** Whether to skip summarization */
  skipSummarization?: boolean;
  /** Summarization strategy */
  summaryStrategy?: "brief" | "detailed" | "key-points";
  /** Custom model for summarization */
  summaryModel?: string;
  /** Temperature for summarization */
  summaryTemperature?: number;
}

// Re-export BatchResult for convenience
export type { BatchResult } from "./batch.ts";

/**
 * Get list of files to process from input path
 */
async function getFilesToProcess(
  inputPath: string,
  mixed: boolean = false,
): Promise<string[]> {
  const files: string[] = [];

  try {
    const stat = await Deno.stat(inputPath);

    if (stat.isFile) {
      // Single file
      files.push(inputPath);
    } else if (stat.isDirectory) {
      // Directory - scan for files
      for await (const entry of Deno.readDir(inputPath)) {
        if (entry.isFile) {
          const filePath = join(inputPath, entry.name);

          if (mixed) {
            // Accept all files for mixed processing
            files.push(filePath);
          } else {
            // Only HTML files for HTML-only processing
            const ext = entry.name.toLowerCase();
            if (ext.endsWith(".html") || ext.endsWith(".htm")) {
              files.push(filePath);
            }
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to read input path "${inputPath}": ${errorMessage}`,
    );
  }

  return files.sort(); // Sort for consistent processing order
}

/**
 * Format duration in milliseconds to human readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Get current timestamp for logging
 */
function getTimestamp(): string {
  return new Date().toISOString().substring(11, 23); // HH:mm:ss.SSS
}

/**
 * Progress callback for batch processing
 */
function createProgressCallback(verbose: boolean) {
  return (completed: number, total: number, current?: string) => {
    const timestamp = getTimestamp();
    if (verbose && current) {
      console.log(
        `[${timestamp}] [${completed + 1}/${total}] Processing: ${current}`,
      );
    } else if (completed === total) {
      console.log(`[${timestamp}] ✅ Completed processing ${total} files`);
    } else {
      // Simple progress indicator using console.log for Deno compatibility
      const percentage = Math.round((completed / total) * 100);
      console.log(
        `[${timestamp}] ⏳ Progress: ${completed}/${total} (${percentage}%)`,
      );
    }
  };
}

/**
 * Main processing function that can be called from other modules
 */
export async function processContent(
  options: Partial<ProcessingOptions> = {},
): Promise<BatchResult> {
  const startTime = performance.now();
  const timestamp = getTimestamp();

  console.log(`[${timestamp}] 🚀 Starting batch processing...`);

  // Load configuration
  const config = await getConfig();
  const dataDir = config.core.dataDir;

  // Determine input and output paths
  const inputPath = options.input || join(dataDir, "fetched");
  const outputPath = options.output || join(dataDir, "processed");

  console.log(`[${getTimestamp()}] 📁 Input: ${inputPath}`);
  console.log(`[${getTimestamp()}] 📁 Output: ${outputPath}`);
  console.log(
    `[${getTimestamp()}] 🔧 Mode: ${
      options.mixed ? "Mixed batch" : "HTML only"
    }`,
  );

  // Ensure directories exist
  if (!(await exists(inputPath))) {
    throw new Error(`Input path does not exist: ${inputPath}`);
  }

  await ensureDir(outputPath);

  // Get files to process
  console.log(`[${getTimestamp()}] 🔍 Scanning for files...`);
  const fileDiscoveryStart = performance.now();
  const files = await getFilesToProcess(inputPath, options.mixed);
  const fileDiscoveryTime = performance.now() - fileDiscoveryStart;

  if (files.length === 0) {
    throw new Error("No files found to process");
  }

  console.log(
    `[${getTimestamp()}] 📋 Found ${files.length} files to process (scan took ${
      formatDuration(fileDiscoveryTime)
    })`,
  );

  // Prepare batch processing options
  const batchOptions: BatchProcessingOptions = {
    outputDir: outputPath,
    overwrite: options.overwrite,
    continueOnError: options.continueOnError,
    maxConcurrency: options.maxConcurrency,
    onProgress: options.verbose
      ? createProgressCallback(options.verbose)
      : undefined,
    // Summarization options
    skipSummarization: options.skipSummarization,
    summaryStrategy: options.summaryStrategy,
    summaryModel: options.summaryModel || config.llm.llmModel,
    summaryTemperature: options.summaryTemperature ?? 0.7,
  };

  // Process files
  console.log(
    `[${getTimestamp()}] ⚡ Starting batch processing of ${files.length} files...`,
  );
  const batchProcessingStart = performance.now();

  const result = options.mixed
    ? await processMixedBatch(files, batchOptions)
    : await processHtmlBatch(files, batchOptions);

  const batchProcessingTime = performance.now() - batchProcessingStart;
  const totalTime = performance.now() - startTime;

  // Final summary
  console.log(`[${getTimestamp()}] 📊 Batch processing completed:`);
  console.log(
    `[${getTimestamp()}]   • Files processed: ${result.successCount}`,
  );
  console.log(`[${getTimestamp()}]   • Files failed: ${result.failureCount}`);
  console.log(
    `[${getTimestamp()}]   • Processing time: ${
      formatDuration(batchProcessingTime)
    }`,
  );
  console.log(
    `[${getTimestamp()}]   • Total time: ${formatDuration(totalTime)}`,
  );

  if (result.failureCount > 0) {
    console.log(`[${getTimestamp()}] ⚠️  Failed files:`);
    const failedResults = result.results.filter((r) => !r.success);
    failedResults.forEach((failure) => {
      console.log(
        `[${getTimestamp()}]   • ${failure.input}: ${
          failure.error || "Unknown error"
        }`,
      );
    });
  }

  return result;
}
