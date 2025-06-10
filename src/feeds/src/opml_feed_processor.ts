/**
 * OPML Feed Processor
 *
 * A facade module that combines the OPML parser and RSS client to process
 * feeds from an OPML file. It reads an OPML file, fetches each feed using
 * the RSS client, and saves the feeds as individual JSON files.
 *
 * @module opml_feed_processor
 * @version 1.0.0
 */

import {
  ensureDir,
  fetchRssFeed,
  parseRssFeed,
  type RssFeed,
  saveRssFeed,
} from "./rss_client.ts";

import {
  extractFeeds,
  type FeedSource,
  getFeedsByCategory,
  parseOpml,
} from "./opml_parser.ts";

import { join } from "@std/path";
import { getConfig } from "../../config/mod.ts";

/**
 * Options for processing feeds from an OPML file
 */
export interface ProcessOptions {
  opmlPath: string;
  outputDir: string;
  categoryFilter?: string;
  maxConcurrent?: number;
  timeout?: number;
}

/**
 * Result of processing a single feed
 */
export interface ProcessResult {
  source: FeedSource;
  success: boolean;
  message: string;
  outputPath?: string;
}

/**
 * Summary of the processing operation
 */
export interface ProcessSummary {
  totalFeeds: number;
  successCount: number;
  failureCount: number;
  results: ProcessResult[];
}

/**
 * Processes feeds from an OPML file, fetching each feed and saving it as a JSON file
 *
 * @param options - Options for processing the feeds
 * @returns A promise that resolves to a summary of the processing operation
 */
export async function processFeedsFromOpml(
  options: ProcessOptions,
): Promise<ProcessSummary> {
  try {
    // Ensure the output directory exists
    await ensureDir(options.outputDir);

    // Read and parse the OPML file
    const opmlContent = await Deno.readTextFile(options.opmlPath);
    const opmlDocument = parseOpml(opmlContent);

    // Extract feeds, optionally filtering by category
    let feedSources: FeedSource[];
    if (options.categoryFilter) {
      feedSources = getFeedsByCategory(opmlDocument, options.categoryFilter);
    } else {
      feedSources = extractFeeds(opmlDocument);
    }

    // Set up concurrency control
    const maxConcurrent = options.maxConcurrent || 5;
    const results: ProcessResult[] = [];
    const pendingPromises: Promise<void>[] = [];

    // Process feeds with concurrency limit
    for (const source of feedSources) {
      // If we've reached the concurrency limit, wait for one to complete
      if (pendingPromises.length >= maxConcurrent) {
        await Promise.race(pendingPromises);
        // Remove completed promises
        const completedIndex = await Promise.race(
          pendingPromises.map(async (p, i) => {
            try {
              await p;
              return i;
            } catch {
              return i;
            }
          }),
        );
        pendingPromises.splice(completedIndex, 1);
      }

      // Create a new promise for this feed
      const promise = processSingleFeed(source, options)
        .then((result) => {
          results.push(result);
        });

      pendingPromises.push(promise);
    }

    // Wait for all remaining promises to complete
    await Promise.all(pendingPromises);

    // Calculate summary statistics
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return {
      totalFeeds: results.length,
      successCount,
      failureCount,
      results,
    };
  } catch (error) {
    throw new Error(
      `Error processing feeds from OPML: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Processes a single feed, fetching it and saving it as a JSON file
 *
 * @param source - The feed source information
 * @param options - Options for processing the feed
 * @returns A promise that resolves to the result of processing the feed
 */
async function processSingleFeed(
  source: FeedSource,
  options: ProcessOptions,
): Promise<ProcessResult> {
  try {
    // Fetch the feed
    const xml = await fetchRssFeed({
      url: source.xmlUrl,
      timeout: options.timeout,
    });

    // Parse the feed
    const feed = parseRssFeed(xml);

    // Clean up CDATA sections in feed content
    cleanFeedContent(feed);

    // Create a filename based on the feed title
    const feedTitle = feed.title || source.title;
    const sanitizedTitle = cleanAndSanitizeFilename(feedTitle);
    const outputPath = `${options.outputDir}/${sanitizedTitle}.json`;

    // Save the feed
    await saveRssFeed(feed, { path: outputPath });

    return {
      source,
      success: true,
      message: `Successfully processed feed: ${feedTitle}`,
      outputPath,
    };
  } catch (error) {
    return {
      source,
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Cleans and sanitizes a string for use as a filename
 *
 * @param input - The input string
 * @returns A sanitized string safe for use as a filename
 */
function cleanAndSanitizeFilename(input: string): string {
  // Replace invalid filename characters with underscores
  return input
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

/**
 * Cleans CDATA sections from feed content
 *
 * @param feed - The feed to clean
 */
function cleanFeedContent(feed: RssFeed): void {
  if (feed.items) {
    for (const item of feed.items) {
      if (typeof item.content === 'string') {
        item.content = cleanCdata(item.content);
      }
      if (typeof item.contentSnippet === 'string') {
        item.contentSnippet = cleanCdata(item.contentSnippet);
      }
    }
  }
}

/**
 * Cleans CDATA sections from a string
 *
 * @param text - The text to clean
 * @returns The cleaned text
 */
function cleanCdata(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "");
}

/**
 * Main function to run the script from the command line
 */
if (import.meta.main) {
  try {
    // Get the configuration
    const config = await getConfig();
    const baseDir = config.core.dataDir;

    // Get optional category filter from command line
    const category = Deno.args[0]; // Optional category filter

    // Create directories within the data directory
    const opmlDir = join(baseDir, "opml");
    const feedsDir = join(baseDir, "feeds");

    // Ensure directories exist
    await ensureDir(opmlDir);
    await ensureDir(feedsDir);

    // Set OPML file path to example.opml in the opml directory
    const opmlPath = join(opmlDir, "example.opml");

    // Check if the OPML file exists, if not, exit with an error
    try {
      await Deno.stat(opmlPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.error(`Error: OPML file not found at ${opmlPath}`);
        console.error(
          `Please ensure that example.opml exists in the ${opmlDir} directory.`,
        );
        Deno.exit(1);
      } else {
        console.error(`Error checking OPML file: ${error instanceof Error ? error.message : String(error)}`);
        Deno.exit(1);
      }
    }

    console.log(`Processing feeds from data directory: ${baseDir}`);
    console.log(`Processing feeds from OPML file: ${opmlPath}`);
    console.log(`Output directory: ${feedsDir}`);

    if (category) {
      console.log(`Filtering by category: ${category}`);
    }

    // Process the feeds
    const summary = await processFeedsFromOpml({
      opmlPath,
      outputDir: feedsDir,
      categoryFilter: category,
      maxConcurrent: 3,
      timeout: 10000,
    });

    // Print summary
    console.log(`\nProcessing complete!`);
    console.log(`Total feeds: ${summary.totalFeeds}`);
    console.log(`Successfully processed: ${summary.successCount}`);
    console.log(`Failed: ${summary.failureCount}`);

    // Print details of failed feeds
    if (summary.failureCount > 0) {
      console.log(`\nFailed feeds:`);
      summary.results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`- ${result.source.title}: ${result.message}`);
        });
    }

    // Exit with appropriate code
    Deno.exit(summary.failureCount > 0 ? 1 : 0);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
