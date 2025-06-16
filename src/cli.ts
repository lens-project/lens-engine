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
import { processContent, type ProcessingOptions } from "@src/processors/mod.ts";
import { rankContent, createCurrentContext, createExampleCriteriaConfig, type RankingOptions, type RankingResult, type ScoringResult, type RankingErrorData } from "@src/ranking/mod.ts";

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
  /** Run only content ranking */
  rankOnly?: boolean;
  /** Create example ranking criteria config */
  createCriteriaConfig?: boolean;
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
  /** User mood for ranking context */
  mood?: 'focused' | 'casual' | 'learning' | 'entertainment';
  /** Reading duration for ranking context */
  readingTime?: 'quick' | 'medium' | 'deep';
  /** Minimum score threshold for output */
  minScore?: number;
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
      case "--rank-only":
        options.rankOnly = true;
        break;
      case "--create-criteria-config":
        options.createCriteriaConfig = true;
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
      case "--mood":
        options.mood = args[++i] as CliOptions['mood'];
        break;
      case "--reading-time":
        options.readingTime = args[++i] as CliOptions['readingTime'];
        break;
      case "--min-score":
        options.minScore = parseFloat(args[++i]);
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
  --rank-only             Run only content ranking
  --create-criteria-config Create example ranking criteria configuration file
  
  # Operation-Specific Options
  -c, --category NAME     Filter feeds by category (feeds operation)
  -f, --feed-name NAME    Specify feed name for fetching (default: austin_kleon)
  --concurrency N         Set concurrency level (default: 2-3 depending on operation)
  --overwrite             Overwrite existing files
  --continue-on-error     Continue processing after errors
  
  # Ranking-Specific Options
  --mood MODE             Set user mood context (focused|casual|learning|entertainment)
  --reading-time TIME     Set available reading time (quick|medium|deep)
  --min-score N           Minimum score threshold for output (0-10, default: 4)

EXAMPLES:
  # Run complete pipeline (feeds → fetch → process → rank)
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts
  
  # Run only feed processing with category filter
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --feeds-only --category "Technology"
  
  # Run only content fetching for specific feed
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --fetch-only --feed-name "my_feed"
  
  # Run only content processing with verbose output
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --process-only --verbose
  
  # Run only ranking with specific context
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --rank-only --mood focused --reading-time medium --min-score 6
  
  # Run complete pipeline with custom settings
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --concurrency 5 --overwrite --verbose
  
  # Create example ranking criteria configuration file
  deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --create-criteria-config

CONFIGURATION:
  The CLI uses configuration from your .env file for data directories and LLM settings.
  Make sure your LENS_DATA_DIR is properly configured.
  
  Customize ranking criteria by creating config/ranking-criteria.json in your data directory.
  Use --create-criteria-config to generate an example configuration file.
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
 * Run content ranking operation
 */
async function runContentRanking(options: CliOptions): Promise<boolean> {
  try {
    console.log("🔄 Ranking content...");

    const config = await getConfig();
    const baseDir = config.core.dataDir;
    const processedDir = join(baseDir, "processed");
    const rankedDir = join(baseDir, "ranked");

    if (options.verbose) {
      console.log(`Input directory: ${processedDir}`);
      console.log(`Output directory: ${rankedDir}`);
      console.log(`LLM Model: ${config.llm.llmModel}`);
      if (options.mood) console.log(`User mood: ${options.mood}`);
      if (options.readingTime) console.log(`Reading time: ${options.readingTime}`);
      if (options.minScore) console.log(`Min score threshold: ${options.minScore}`);
    }

    // Create ranking context
    const context = createCurrentContext(options.mood, options.readingTime);
    console.log(`📅 Ranking context: ${context.dayOfWeek} ${context.timeOfDay}, mood: ${context.userMood || 'default'}, reading: ${context.readingDuration || 'default'}`);

    // Ensure output directory exists
    await Deno.mkdir(rankedDir, { recursive: true });

    // Read processed content files
    const articles = await loadProcessedArticles(processedDir, options.verbose || false);
    if (articles.length === 0) {
      console.log("⚠️  No processed articles found to rank");
      return true;
    }

    console.log(`📊 Found ${articles.length} processed articles to rank`);

    // Rank the articles
    const rankingOptions: Partial<RankingOptions> = {
      maxBatchSize: Math.min(options.concurrency || 2, 2), // Smaller batches for better reliability
      continueOnError: true, // Always continue on error to prevent hanging
      timeout: 75000, // 75 second timeout per article for better reliability
    };

    const results = await rankContent(articles, context, rankingOptions);
    
    // Filter by minimum score if specified
    const minScore = options.minScore || 4;
    const filteredResults = results.filter(result => {
      if ('score' in result) return result.score >= minScore;
      return false; // Include errors for reporting
    });

    // Write ranked results to files
    await writeRankedResults(rankedDir, filteredResults, options);

    // Report results
    const successful = results.filter(r => 'score' in r).length;
    const errors = results.filter(r => 'type' in r).length;
    const aboveThreshold = filteredResults.filter(r => 'score' in r).length;

    console.log(`✅ Content ranking complete!`);
    console.log(`   Total articles: ${articles.length}`);
    console.log(`   Successfully ranked: ${successful}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Above threshold (${minScore}): ${aboveThreshold}`);

    if (errors > 0 && options.verbose) {
      console.log(`\nRanking errors:`);
      results
        .filter(r => 'type' in r)
        .forEach((r: RankingErrorData) => {
          console.log(`   - ${r.type}: ${r.message}`);
        });
    }

    return errors === 0;
  } catch (error) {
    console.error(
      `❌ Content ranking failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}

/**
 * Load processed articles from directory
 */
async function loadProcessedArticles(processedDir: string, verbose: boolean): Promise<Array<{title: string, summary: string, url: string, source?: string}>> {
  const articles = [];
  
  try {
    for await (const entry of Deno.readDir(processedDir)) {
      if (entry.isFile && entry.name.endsWith('-summary.md')) {
        try {
          const filePath = join(processedDir, entry.name);
          const content = await Deno.readTextFile(filePath);
          
          // Parse the markdown summary file
          const article = parseProcessedArticle(content, entry.name);
          if (article) {
            articles.push(article);
            if (verbose) {
              console.log(`   Loaded: ${article.title}`);
            }
          }
        } catch (error) {
          if (verbose) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`   Failed to load ${entry.name}: ${errorMessage}`);
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to read processed directory: ${errorMessage}`);
  }

  return articles;
}

/**
 * Parse a processed article markdown file
 */
function parseProcessedArticle(content: string, filename: string): {title: string, summary: string, url: string, source?: string} | null {
  try {
    // First try to extract title from content metadata
    let title = '';
    
    // Look for title in various formats
    const titlePatterns = [
      /^#\s+(.+)$/m,                    // Markdown header: # Title
      /Title:\s*(.+)$/im,               // Title: value format
      /^(.+)$/m,                        // First line as title
    ];
    
    for (const pattern of titlePatterns) {
      const titleMatch = content.match(pattern);
      if (titleMatch && titleMatch[1]?.trim()) {
        title = titleMatch[1].trim();
        break;
      }
    }
    
    // Fall back to filename if no title found in content
    if (!title) {
      title = filename.replace('-summary.md', '').replace(/[-_]/g, ' ');
    }
    
    // Look for URL in content
    const urlMatch = content.match(/URL:\s*(https?:\/\/[^\s\n]+)/i);
    const url = urlMatch ? urlMatch[1] : `https://example.com/${filename}`;
    
    // Look for source in content
    const sourceMatch = content.match(/Source:\s*([^\n]+)/i);
    const source = sourceMatch ? sourceMatch[1].trim() : undefined;
    
    // Use the content as summary (clean up any metadata)
    let summary = content
      .replace(/URL:\s*https?:\/\/[^\s\n]+/gi, '')
      .replace(/Source:\s*[^\n]+/gi, '')
      .replace(/Title:\s*[^\n]+/gi, '')
      .replace(/#+\s*/g, '')
      .trim();
      
    if (!summary || summary.length < 10) {
      summary = `Processed content from ${title}`;
    }

    return { title, summary, url, source };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to parse article from ${filename}: ${errorMessage}`);
    return null;
  }
}

/**
 * Write ranked results to files
 */
async function writeRankedResults(rankedDir: string, results: RankingResult[], options: CliOptions): Promise<void> {
  // Write individual ranking files
  const rankingFile = join(rankedDir, 'rankings.json');
  const summaryFile = join(rankedDir, 'ranking-summary.md');
  
  // Prepare data for JSON output
  const jsonData = {
    timestamp: new Date().toISOString(),
    context: results.length > 0 ? 'context data would be here' : null,
    totalArticles: results.length,
    results: results.map((result: RankingResult) => {
      if ('score' in result) {
        return {
          title: result.input?.title || 'Unknown',
          url: result.input?.url || '',
          score: result.score,
          confidence: result.confidence,
          method: result.method,
          reasoning: result.reasoning,
          categories: result.categories,
          estimatedReadTime: result.estimatedReadTime,
        };
      } else {
        return {
          title: result.input?.title || 'Unknown',
          url: result.input?.url || '',
          error: result.type,
          message: result.message,
        };
      }
    })
  };
  
  // Write JSON file
  await Deno.writeTextFile(rankingFile, JSON.stringify(jsonData, null, 2));
  
  // Write markdown summary
  let markdown = `# Content Ranking Results\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `**Total Articles:** ${results.length}\n\n`;
  
  const successful = results.filter((r: RankingResult): r is ScoringResult => 'score' in r);
  const errors = results.filter((r: RankingResult): r is RankingErrorData => 'type' in r);
  
  markdown += `**Successfully Ranked:** ${successful.length}\n`;
  markdown += `**Errors:** ${errors.length}\n\n`;
  
  if (successful.length > 0) {
    // Sort by score descending
    const sorted = successful.sort((a: ScoringResult, b: ScoringResult) => b.score - a.score);
    
    markdown += `## Top Ranked Articles\n\n`;
    sorted.forEach((result: ScoringResult, index: number) => {
      markdown += `${index + 1}. **${result.input?.title || 'Unknown'}** (Score: ${result.score})\n`;
      markdown += `   - URL: ${result.input?.url || 'N/A'}\n`;
      markdown += `   - Categories: ${result.categories?.join(', ') || 'None'}\n`;
      markdown += `   - Read Time: ${result.estimatedReadTime || 'Unknown'} minutes\n`;
      if (result.reasoning) {
        markdown += `   - Reasoning: ${result.reasoning}\n`;
      }
      markdown += `\n`;
    });
  }
  
  if (errors.length > 0) {
    markdown += `## Ranking Errors\n\n`;
    errors.forEach((error: RankingErrorData, index: number) => {
      markdown += `${index + 1}. **${error.input?.title || 'Unknown'}**: ${error.message}\n`;
    });
  }
  
  await Deno.writeTextFile(summaryFile, markdown);
  
  if (options.verbose) {
    console.log(`📄 Results written to:`);
    console.log(`   JSON: ${rankingFile}`);
    console.log(`   Summary: ${summaryFile}`);
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

    // Handle criteria config creation
    if (options.createCriteriaConfig) {
      console.log("🚀 Lens Engine CLI - Creating Criteria Configuration");
      console.log("====================================================");
      
      const config = await getConfig();
      console.log(`Data directory: ${config.core.dataDir}`);
      
      try {
        await createExampleCriteriaConfig(config.core.dataDir);
        console.log("✅ Example ranking criteria configuration created successfully!");
        console.log("   📝 Edit the file to customize ranking criteria for your needs");
        console.log("   🔄 The ranking system will automatically use your custom criteria");
      } catch (error) {
        console.error(`❌ Failed to create criteria config: ${error instanceof Error ? error.message : String(error)}`);
        Deno.exit(1);
      }
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
      (!options.fetchOnly && !options.processOnly && !options.rankOnly && !options.createCriteriaConfig);
    const runFetch = options.fetchOnly ||
      (!options.feedsOnly && !options.processOnly && !options.rankOnly && !options.createCriteriaConfig);
    const runProcess = options.processOnly ||
      (!options.feedsOnly && !options.fetchOnly && !options.rankOnly && !options.createCriteriaConfig);
    const runRank = options.rankOnly ||
      (!options.feedsOnly && !options.fetchOnly && !options.processOnly && !options.createCriteriaConfig);

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
      console.log("");
    }

    if (runRank) {
      success = await runContentRanking(options) && success;
      if (!success && !options.continueOnError) {
        console.error("❌ Pipeline stopped due to content ranking failure");
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
