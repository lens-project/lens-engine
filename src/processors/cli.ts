/**
 * CLI Wrapper for Processors Batch Processing
 *
 * Provides command-line interface for the refactored batch processing
 * architecture, supporting HTML batch processing with progress tracking
 * and comprehensive error handling.
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { getConfig } from "../config/mod.ts";
import {
  processHtmlBatch,
  processMixedBatch,
  type BatchProcessingOptions,
  type BatchResult,
} from "./src/controller/mod.ts";

/**
 * CLI options parsed from command line arguments
 */
interface CliOptions {
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
  /** Show help information */
  help?: boolean;
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

/**
 * Parse command line arguments into CLI options
 */
function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--input":
      case "-i":
        options.input = args[++i];
        break;
      case "--output":
      case "-o":
        options.output = args[++i];
        break;
      case "--mixed":
      case "-m":
        options.mixed = true;
        break;
      case "--continue-on-error":
      case "-c":
        options.continueOnError = true;
        break;
      case "--overwrite":
        options.overwrite = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--max-concurrency":
        options.maxConcurrency = parseInt(args[++i]);
        break;
      case "--skip-summarization":
        options.skipSummarization = true;
        break;
      case "--summary-strategy": {
        const strategy = args[++i] as "brief" | "detailed" | "key-points";
        if (["brief", "detailed", "key-points"].includes(strategy)) {
          options.summaryStrategy = strategy;
        }
        break;
      }
      case "--summary-model":
        options.summaryModel = args[++i];
        break;
      case "--summary-temperature":
        options.summaryTemperature = parseFloat(args[++i]);
        break;
      default:
        // If it doesn't start with --, treat as input path
        if (!arg.startsWith("--") && !options.input) {
          options.input = arg;
        }
        break;
    }
  }
  
  return options;
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
HTML Batch Processor CLI

USAGE:
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/cli.ts [OPTIONS] [INPUT]

ARGUMENTS:
  INPUT                 Input directory or file path (default: uses config dataDir/fetched)

OPTIONS:
  -i, --input PATH      Input directory or file path
  -o, --output PATH     Output directory (default: uses config dataDir/processed)
  -m, --mixed           Process mixed file types (not just HTML)
  -c, --continue-on-error  Continue processing after errors
  --overwrite           Overwrite existing output files
  -v, --verbose         Enable verbose output
  --max-concurrency N   Maximum concurrent operations (future feature)
  --skip-summarization  Skip the summarization step
  --summary-strategy S  Summarization strategy: brief, detailed, key-points
  --summary-model M     Custom model for summarization
  --summary-temperature T  Temperature for summarization (0.0-1.0)
  -h, --help            Show this help message

EXAMPLES:
  # Process all HTML files in default directory
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/cli.ts

  # Process specific directory
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/cli.ts /path/to/html/files

  # Process with custom output directory
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/cli.ts -i ./input -o ./output

  # Process mixed file types and continue on errors
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/cli.ts --mixed --continue-on-error

  # Skip summarization for faster processing
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/cli.ts --skip-summarization

  # Use custom summarization settings
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/cli.ts --summary-strategy detailed --summary-temperature 0.3

CONFIGURATION:
  The CLI uses configuration from your .env file for default directories and LLM settings.
  Make sure your LENS_DATA_DIR is properly configured.
`);
}

/**
 * Get list of files to process from input path
 */
async function getFilesToProcess(inputPath: string, mixed: boolean = false): Promise<string[]> {
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
            if (ext.endsWith('.html') || ext.endsWith('.htm')) {
              files.push(filePath);
            }
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read input path "${inputPath}": ${errorMessage}`);
  }
  
  return files.sort(); // Sort for consistent processing order
}

/**
 * Progress callback for batch processing
 */
function createProgressCallback(verbose: boolean) {
  return (completed: number, total: number, current?: string) => {
    if (verbose && current) {
      console.log(`[${completed + 1}/${total}] Processing: ${current}`);
    } else if (completed === total) {
      console.log(`✅ Completed processing ${total} files`);
    } else {
      // Simple progress indicator using console.log for Deno compatibility
      const percentage = Math.round((completed / total) * 100);
      console.log(`⏳ Progress: ${completed}/${total} (${percentage}%)`);
    }
  };
}

/**
 * Display batch processing results
 */
function displayResults(result: BatchResult, verbose: boolean): void {
  console.log("\n" + "=".repeat(50));
  console.log("BATCH PROCESSING RESULTS");
  console.log("=".repeat(50));
  console.log(`Total files: ${result.totalItems}`);
  console.log(`✅ Successful: ${result.successCount}`);
  console.log(`❌ Failed: ${result.failureCount}`);
  
  if (result.failureCount > 0) {
    console.log("\nFAILED FILES:");
    result.results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`❌ ${r.input}: ${r.error}`);
      });
  }
  
  if (verbose && result.successCount > 0) {
    console.log("\nSUCCESSFUL FILES:");
    result.results
      .filter(r => r.success)
      .forEach(r => {
        console.log(`✅ ${r.input}`);
        if (r.metadata) {
          console.log(`   Words: ${r.metadata.wordCount}, URLs: ${r.metadata.urls.length}`);
          if (r.metadata.title) {
            console.log(`   Title: ${r.metadata.title}`);
          }
        }
      });
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  try {
    const args = Deno.args;
    const options = parseArgs(args);
    
    // Show help if requested
    if (options.help) {
      showHelp();
      return;
    }
    
    console.log("HTML Batch Processor CLI");
    console.log("========================");
    
    // Load configuration
    const config = await getConfig();
    const dataDir = config.core.dataDir;
    
    // Determine input and output paths
    const inputPath = options.input || join(dataDir, "fetched");
    const outputPath = options.output || join(dataDir, "processed");
    
    console.log(`Input directory: ${inputPath}`);
    console.log(`Output directory: ${outputPath}`);
    console.log(`Processing mode: ${options.mixed ? "Mixed file types" : "HTML only"}`);
    console.log(`LLM Model: ${config.llm.llmModel}`);
    console.log(`Continue on error: ${options.continueOnError ? "Yes" : "No"}`);
    console.log("");
    
    // Ensure directories exist
    if (!(await exists(inputPath))) {
      throw new Error(`Input path does not exist: ${inputPath}`);
    }
    
    await ensureDir(outputPath);
    
    // Get files to process
    const files = await getFilesToProcess(inputPath, options.mixed);
    
    if (files.length === 0) {
      console.log("⚠️  No files found to process");
      return;
    }
    
    console.log(`Found ${files.length} files to process`);
    
    // Prepare batch processing options
    const batchOptions: BatchProcessingOptions = {
      outputDir: outputPath,
      overwrite: options.overwrite,
      continueOnError: options.continueOnError,
      maxConcurrency: options.maxConcurrency,
      onProgress: createProgressCallback(options.verbose || false),
      // Summarization options
      skipSummarization: options.skipSummarization,
      summaryStrategy: options.summaryStrategy,
      summaryModel: options.summaryModel || config.llm.llmModel,
      summaryTemperature: options.summaryTemperature ?? 0.7,
    };
    
    // Process files
    console.log("🚀 Starting batch processing...\n");
    
    const result = options.mixed 
      ? await processMixedBatch(files, batchOptions)
      : await processHtmlBatch(files, batchOptions);
    
    // Display results
    displayResults(result, options.verbose || false);
    
    // Exit with appropriate code
    if (result.failureCount > 0 && !options.continueOnError) {
      Deno.exit(1);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ CLI Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (import.meta.main) {
  await main();
}
