/**
 * Lens Engine Unified CLI
 *
 * Single entry point for all Lens Engine operations:
 * - Feed processing from OPML files
 * - Content fetching from feeds
 * - Content processing and summarization
 *
 * This CLI orchestrates the three main modules and provides a consistent
 * interface for both individual operations and complete pipeline execution.
 */

import { join } from "@std/path";
import { getConfig } from "@src/config/mod.ts";
import {
  processFeedsFromOpml,
  type ProcessOptions as FeedProcessOptions,
} from "@src/feeds/mod.ts";
import {
  type ContentFetcherOptions,
  fetchAllContent,
} from "@src/retrieval/mod.ts";
import {
  type ProcessingOptions,
  processContent,
} from "@src/processors/mod.ts";

/**
 * CLI command options
 */
interface CliOptions {
  /** Show help information */
  help?: boolean;
  /** Enable verbose output */
  verbose?: boolean;
  /** Run only feed processing */
  feedsOnly?: boolean;
  /** Run only content fetching */
  fetchOnly?: boolean;
  /** Run only content processing */
  processOnly?: boolean;
  /** Category filter for feeds */
  category?: string;
  /** Feed name for content fetching */
  feedName?: string;
  /** Concurrency for operations */
  concurrency?: number;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** Continue processing after errors */
  continueOnError?: boolean;
}

/**
 * Parse command line arguments
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
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--feeds-only":
        options.feedsOnly = true;
        break;
      case "--fetch-only":
        options.fetchOnly = true;
        break;
      case "--process-only":
        options.processOnly = true;
        break;
      case "--category":
      case "-c":
        options.category = args[++i];
        break;
      case "--feed-name":
      case "-f":
        options.feedName = args[++i];
        break;
      case "--concurrency":
        options.concurrency = parseInt(args[++i]);
        break;
      case "--overwrite":
        options.overwrite = true;
        break;
      case "--continue-on-error":
        options.continueOnError = true;
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
Lens Engine CLI - Unified Content Processing Pipeline

USAGE:
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts [OPTIONS]

OPTIONS:
  -h, --help              Show this help message
  -v, --verbose           Enable verbose output
  
  # Operation Selection (default: run all operations in sequence)
  --feeds-only            Run only feed processing from OPML
  --fetch-only            Run only content fetching
  --process-only          Run only content processing
  
  # Operation-Specific Options
  -c, --category NAME     Filter feeds by category (feeds operation)
  -f, --feed-name NAME    Specify feed name for fetching (default: austin_kleon)
  --concurrency N         Set concurrency level (default: 2-3 depending on operation)
  --overwrite             Overwrite existing files
  --continue-on-error     Continue processing after errors

EXAMPLES:
  # Run complete pipeline (feeds → fetch → process)
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts
  
  # Run only feed processing with category filter
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --feeds-only --category "Technology"
  
  # Run only content fetching for specific feed
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --fetch-only --feed-name "my_feed"
  
  # Run only content processing with verbose output
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --process-only --verbose
  
  # Run complete pipeline with custom settings
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --concurrency 5 --overwrite --verbose

CONFIGURATION:
  The CLI uses configuration from your .env file for data directories and LLM settings.
  Make sure your LENS_DATA_DIR is properly configured.
`);
}

/**
 * Run feed processing operation
 */
async function runFeedProcessing(options: CliOptions): Promise<boolean> {
  try {
    console.log("🔄 Processing feeds from OPML...");

    const config = await getConfig();
    const baseDir = config.core.dataDir;
    const opmlDir = join(baseDir, "opml");
    const feedsDir = join(baseDir, "feeds");
    const opmlPath = join(opmlDir, "example.opml");

    if (options.verbose) {
      console.log(`OPML file: ${opmlPath}`);
      console.log(`Output directory: ${feedsDir}`);
      if (options.category) {
        console.log(`Category filter: ${options.category}`);
      }
    }

    const feedOptions: FeedProcessOptions = {
      opmlPath,
      outputDir: feedsDir,
      categoryFilter: options.category,
      maxConcurrent: options.concurrency || 3,
      timeout: 10000,
    };

    const summary = await processFeedsFromOpml(feedOptions);

    console.log(`✅ Feed processing complete!`);
    console.log(`   Total feeds: ${summary.totalFeeds}`);
    console.log(`   Successfully processed: ${summary.successCount}`);
    console.log(`   Failed: ${summary.failureCount}`);

    if (summary.failureCount > 0 && options.verbose) {
      console.log(`\nFailed feeds:`);
      summary.results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`   - ${result.source.title}: ${result.message}`);
        });
    }

    return summary.failureCount === 0;
  } catch (error) {
    console.error(
      `❌ Feed processing failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * Run content fetching operation
 */
async function runContentFetching(options: CliOptions): Promise<boolean> {
  try {
    console.log("🔄 Fetching content from feeds...");

    const config = await getConfig();
    const baseDir = config.core.dataDir;
    const feedsDir = join(baseDir, "feeds");
    const fetchedDir = join(baseDir, "fetched");

    const feedName = options.feedName || "austin_kleon";
    let jsonPath = join(feedsDir, `${feedName}.json`);

    // Check if the feed file exists, try paz namespace if not
    try {
      await Deno.stat(jsonPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        const pazJsonPath = join(feedsDir, "paz", `${feedName}.json`);
        try {
          await Deno.stat(pazJsonPath);
          jsonPath = pazJsonPath;
          if (options.verbose) {
            console.log(`Using feed file: ${pazJsonPath}`);
          }
        } catch (_innerError) {
          console.warn(`Feed file not found: ${jsonPath} or ${pazJsonPath}`);
        }
      }
    }

    if (options.verbose) {
      console.log(`Feed file: ${jsonPath}`);
      console.log(`Output directory: ${fetchedDir}`);
      console.log(`Concurrency: ${options.concurrency || 2}`);
    }

    const fetchOptions: ContentFetcherOptions = {
      jsonPath,
      outputDir: fetchedDir,
      concurrency: options.concurrency || 2,
      overwrite: options.overwrite || false,
      timeout: 10000,
    };

    const results = await fetchAllContent(fetchOptions);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`✅ Content fetching complete!`);
    console.log(`   Total URLs: ${results.length}`);
    console.log(`   Successfully fetched: ${successful}`);
    console.log(`   Failed to fetch: ${failed}`);

    if (failed > 0 && options.verbose) {
      console.log(`\nFailed URLs:`);
      results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`   - ${r.url}: ${r.error}`));
    }

    return failed === 0;
  } catch (error) {
    console.error(
      `❌ Content fetching failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * Run content processing operation
 */
async function runContentProcessing(options: CliOptions): Promise<boolean> {
  try {
    console.log("🔄 Processing content...");

    const config = await getConfig();
    const baseDir = config.core.dataDir;
    const fetchedDir = join(baseDir, "fetched");
    const processedDir = join(baseDir, "processed");

    if (options.verbose) {
      console.log(`Input directory: ${fetchedDir}`);
      console.log(`Output directory: ${processedDir}`);
      console.log(`LLM Model: ${config.llm.llmModel}`);
    }

    const processOptions: Partial<ProcessingOptions> = {
      input: fetchedDir,
      output: processedDir,
      overwrite: options.overwrite,
      continueOnError: options.continueOnError,
      verbose: options.verbose,
      maxConcurrency: options.concurrency,
    };

    const result = await processContent(processOptions);

    console.log(`✅ Content processing complete!`);
    console.log(`   Total files: ${result.totalItems}`);
    console.log(`   Successfully processed: ${result.successCount}`);
    console.log(`   Failed: ${result.failureCount}`);

    if (result.failureCount > 0 && options.verbose) {
      console.log(`\nFailed files:`);
      result.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   - ${r.input}: ${r.error}`);
        });
    }

    return result.failureCount === 0;
  } catch (error) {
    console.error(
      `❌ Content processing failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
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

    console.log("🚀 Lens Engine CLI");
    console.log("==================");

    // Load and display configuration
    const config = await getConfig();
    console.log(`Data directory: ${config.core.dataDir}`);
    console.log(`LLM Model: ${config.llm.llmModel}`);
    console.log("");

    let success = true;

    // Determine which operations to run
    const runFeeds = options.feedsOnly ||
      (!options.fetchOnly && !options.processOnly);
    const runFetch = options.fetchOnly ||
      (!options.feedsOnly && !options.processOnly);
    const runProcess = options.processOnly ||
      (!options.feedsOnly && !options.fetchOnly);

    // Run operations in sequence
    if (runFeeds) {
      success = await runFeedProcessing(options) && success;
      if (!success && !options.continueOnError) {
        console.error("❌ Pipeline stopped due to feed processing failure");
        Deno.exit(1);
      }
      console.log("");
    }

    if (runFetch) {
      success = await runContentFetching(options) && success;
      if (!success && !options.continueOnError) {
        console.error("❌ Pipeline stopped due to content fetching failure");
        Deno.exit(1);
      }
      console.log("");
    }

    if (runProcess) {
      success = await runContentProcessing(options) && success;
      if (!success && !options.continueOnError) {
        console.error("❌ Pipeline stopped due to content processing failure");
        Deno.exit(1);
      }
    }

    // Final summary
    if (success) {
      console.log("🎉 All operations completed successfully!");
    } else {
      console.log(
        "⚠️  Some operations completed with errors (see details above)",
      );
      if (!options.continueOnError) {
        Deno.exit(1);
      }
    }
  } catch (error) {
    console.error(
      `❌ CLI Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    Deno.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (import.meta.main) {
  await main();
}
