/**
 * OPML Feed Processor
 *
 * A facade module that combines the OPML parser and RSS client to process
 * feeds from an OPML file. It reads an OPML file, fetches each feed using
 * the RSS client, and saves the feeds as individual JSON files.
 *
 * @module opml_feed_processor
 * @lab Experimental OPML feed processor
 * @version 0.1.0
 */

import {
  fetchRssFeed,
  parseRssFeed,
  saveRssFeed,
  ensureDir,
  type RssFeed
} from "./rss_client.ts";

import {
  parseOpml,
  extractFeeds,
  getFeedsByCategory,
  type FeedSource
} from "./opml_parser.ts";

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
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
  options: ProcessOptions
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
          })
        );
        pendingPromises.splice(completedIndex, 1);
      }

      // Create a new promise for this feed
      const promise = processSingleFeed(source, options)
        .then(result => {
          results.push(result);
        });

      pendingPromises.push(promise);
    }

    // Wait for all remaining promises to complete
    await Promise.all(pendingPromises);

    // Prepare summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      totalFeeds: results.length,
      successCount,
      failureCount,
      results
    };
  } catch (error) {
    throw new Error(
      `Error processing feeds from OPML: ${
        error instanceof Error ? error.message : String(error)
      }`
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
  options: ProcessOptions
): Promise<ProcessResult> {
  try {
    // Fetch the feed
    const xml = await fetchRssFeed({
      url: source.xmlUrl,
      timeout: options.timeout
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
      outputPath
    };
  } catch (error) {
    return {
      source,
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Cleans up CDATA sections and other problematic content in a feed
 *
 * This function recursively processes all string properties in the feed object,
 * removing CDATA sections and cleaning up the content.
 *
 * @param feed - The RSS feed to clean
 */
function cleanFeedContent(feed: RssFeed): void {
  // Clean the feed title
  if (feed.title) {
    feed.title = cleanCdataContent(feed.title);
  }

  // Clean the feed description
  if (feed.description) {
    feed.description = cleanCdataContent(feed.description);
  }

  // Clean each item in the feed
  for (const item of feed.items) {
    // Clean item title
    if (item.title) {
      item.title = cleanCdataContent(item.title);
    }

    // Clean item description
    if (item.description) {
      item.description = cleanCdataContent(item.description);
    }

    // Clean other string properties
    for (const key in item) {
      if (typeof item[key] === "string") {
        item[key] = cleanCdataContent(item[key] as string);
      }
    }
  }
}

/**
 * Cleans CDATA sections and other problematic content from a string
 *
 * @param content - The string content to clean
 * @returns The cleaned string
 */
function cleanCdataContent(content: string): string {
  if (!content) return content;

  // Remove CDATA wrapper but keep the content
  let cleaned = content.replace(/\s*<!\[CDATA\[(.*?)\]\]>\s*/g, "$1");

  // If the content still contains CDATA markers (possibly malformed),
  // try a more aggressive approach
  if (cleaned.includes("![CDATA[")) {
    cleaned = cleaned.replace(/!\[CDATA\[/g, "");
  }

  if (cleaned.includes("]]>")) {
    cleaned = cleaned.replace(/\]\]>/g, "");
  }

  return cleaned;
}

/**
 * Cleans and sanitizes a string for use as a filename
 *
 * This function handles special cases like CDATA sections and other problematic
 * characters that might appear in feed titles.
 *
 * @param name - The string to sanitize
 * @returns A sanitized string safe for use as a filename
 */
function cleanAndSanitizeFilename(name: string): string {
  // Handle empty or undefined names
  if (!name) return "unnamed_feed";

  // Remove CDATA sections
  let cleaned = name.replace(/\s*<!\[CDATA\[(.*?)\]\]>\s*/g, "$1");

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // Replace invalid filename characters with underscores
  cleaned = cleaned.replace(/[/\\?%*:|"<>]/g, "_");

  // Replace multiple spaces and other whitespace with a single underscore
  cleaned = cleaned.replace(/\s+/g, "_");

  // Remove leading/trailing underscores and dots
  cleaned = cleaned.replace(/^[_\.]+|[_\.]+$/g, "");

  // Replace multiple consecutive underscores with a single one
  cleaned = cleaned.replace(/_+/g, "_");

  // Convert to lowercase
  cleaned = cleaned.toLowerCase();

  // If the name is empty after cleaning, use a default name
  if (!cleaned) return "unnamed_feed";

  return cleaned;
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

    // Default OPML file path (can be overridden by command line)
    let opmlPath = Deno.args[1] || join(opmlDir, "feeds.opml");

    // Check if the OPML file exists, if not, try the tmp directory
    try {
      await Deno.stat(opmlPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Try the tmp directory
        const tmpOpmlPath = join("tmp", "data", "opml", "paz.opml");
        try {
          await Deno.stat(tmpOpmlPath);
          console.log(`OPML file not found at ${opmlPath}, using ${tmpOpmlPath} instead`);
          opmlPath = tmpOpmlPath;
        } catch (_innerError) {
          // Both paths failed, continue with the original path (will fail later)
          console.warn(`OPML file not found at ${opmlPath} or ${tmpOpmlPath}`);
        }
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
      timeout: 10000
    });

    // Print summary
    console.log(`\nProcessing complete:`);
    console.log(`- Total feeds: ${summary.totalFeeds}`);
    console.log(`- Successfully processed: ${summary.successCount}`);
    console.log(`- Failed: ${summary.failureCount}`);

    // Print failures if any
    if (summary.failureCount > 0) {
      console.log("\nFailures:");
      summary.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`- ${r.source.title}: ${r.message}`);
        });
    }

    console.log(`\nFeeds saved to ${feedsDir}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
