/**
 * Content Processor CLI
 *
 * Standalone CLI for content processing operations.
 * Wraps the batch_processor module with command-line interface.
 */

import { processContent as processContentModule } from "./batch_processor.ts";
import type { BatchResult, ProcessingOptions } from "./batch_processor.ts";

/**
 * CLI options parsed from command line arguments
 */
export interface CliOptions extends ProcessingOptions {
  /** Show help information */
  help?: boolean;
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
Content Processor CLI

USAGE:
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/src/content_processor.ts [OPTIONS] [INPUT]

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
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/src/content_processor.ts

  # Process specific directory
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/src/content_processor.ts /path/to/html/files

  # Process with custom output directory
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/src/content_processor.ts -i ./input -o ./output

  # Process mixed file types and continue on errors
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/src/content_processor.ts --mixed --continue-on-error

  # Skip summarization for faster processing
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/src/content_processor.ts --skip-summarization

  # Use custom summarization settings
  deno run --allow-net --allow-read --allow-write --allow-env src/processors/src/content_processor.ts --summary-strategy detailed --summary-temperature 0.3

CONFIGURATION:
  The CLI uses configuration from your .env file for default directories and LLM settings.
  Make sure your LENS_DATA_DIR is properly configured.
`);
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
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`❌ ${r.input}: ${r.error}`);
      });
  }

  if (verbose && result.successCount > 0) {
    console.log("\nSUCCESSFUL FILES:");
    result.results
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(`✅ ${r.input}`);
        if (r.metadata) {
          console.log(
            `   Words: ${r.metadata.wordCount}, URLs: ${r.metadata.urls.length}`,
          );
          if (r.metadata.title) {
            console.log(`   Title: ${r.metadata.title}`);
          }
        }
      });
  }
}

/**
 * Main processing function that can be called from other modules
 * Delegates to the clean batch_processor module
 */
export async function processContent(
  options: Partial<ProcessingOptions> = {},
): Promise<BatchResult> {
  return await processContentModule(options);
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

    console.log("Content Processor CLI");
    console.log("====================");

    if (options.verbose) {
      console.log(
        `Processing mode: ${options.mixed ? "Mixed file types" : "HTML only"}`,
      );
      console.log(
        `Continue on error: ${options.continueOnError ? "Yes" : "No"}`,
      );
      console.log("");
    }

    console.log("🚀 Starting batch processing...\n");

    // Process content using the module
    const result = await processContent(options);

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
