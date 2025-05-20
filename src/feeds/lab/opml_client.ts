/**
 * OPML Client
 *
 * A module for working with OPML files and integrating with the RSS client.
 * This module provides functions to load OPML files, extract feeds, and
 * fetch RSS content from the feeds defined in an OPML file.
 *
 * @module opml_client
 * @lab Experimental OPML client for feed management
 * @version 0.1.0
 */

import { ensureDir } from "./rss_client.ts";
import { 
  fetchRssFeed, 
  parseRssFeed, 
  saveRssFeed, 
  type RssFeed,
  type FetchOptions,
  type SaveOptions
} from "./rss_client.ts";
import { 
  parseOpml, 
  extractFeeds, 
  getFeedsByCategory,
  type OpmlDocument, 
  type FeedSource 
} from "./opml_parser.ts";

/**
 * Options for loading an OPML file
 */
export interface OpmlLoadOptions {
  path: string;
}

/**
 * Options for fetching feeds from an OPML file
 */
export interface OpmlFetchOptions {
  timeout?: number;
  maxConcurrent?: number;
  categoryFilter?: string;
}

/**
 * Result of a feed fetch operation
 */
export interface FeedFetchResult {
  source: FeedSource;
  feed?: RssFeed;
  error?: string;
}

/**
 * Loads and parses an OPML file
 *
 * @param options - Options for loading the OPML file
 * @returns A promise that resolves to the parsed OPML document
 */
export async function loadOpmlFile(options: OpmlLoadOptions): Promise<OpmlDocument> {
  try {
    const xml = await Deno.readTextFile(options.path);
    return parseOpml(xml);
  } catch (error) {
    throw new Error(
      `Error loading OPML file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Fetches RSS feeds defined in an OPML file
 *
 * @param opmlOptions - Options for loading the OPML file
 * @param fetchOptions - Options for fetching the feeds
 * @returns A promise that resolves to an array of feed fetch results
 */
export async function fetchFeedsFromOpml(
  opmlOptions: OpmlLoadOptions,
  fetchOptions: OpmlFetchOptions = {}
): Promise<FeedFetchResult[]> {
  try {
    // Load and parse the OPML file
    const opmlDocument = await loadOpmlFile(opmlOptions);
    
    // Extract feeds, optionally filtering by category
    let feedSources: FeedSource[];
    if (fetchOptions.categoryFilter) {
      feedSources = getFeedsByCategory(opmlDocument, fetchOptions.categoryFilter);
    } else {
      feedSources = extractFeeds(opmlDocument);
    }
    
    // Set up concurrency control
    const maxConcurrent = fetchOptions.maxConcurrent || 5;
    const results: FeedFetchResult[] = [];
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
      const promise = fetchSingleFeed(source, fetchOptions)
        .then(result => {
          results.push(result);
        });
      
      pendingPromises.push(promise);
    }
    
    // Wait for all remaining promises to complete
    await Promise.all(pendingPromises);
    
    return results;
  } catch (error) {
    throw new Error(
      `Error fetching feeds from OPML: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Fetches a single RSS feed
 *
 * @param source - The feed source information
 * @param options - Options for fetching the feed
 * @returns A promise that resolves to a feed fetch result
 */
async function fetchSingleFeed(
  source: FeedSource,
  options: OpmlFetchOptions
): Promise<FeedFetchResult> {
  try {
    const xml = await fetchRssFeed({
      url: source.xmlUrl,
      timeout: options.timeout
    });
    
    const feed = parseRssFeed(xml);
    
    return {
      source,
      feed
    };
  } catch (error) {
    return {
      source,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetches and saves RSS feeds defined in an OPML file
 *
 * @param opmlOptions - Options for loading the OPML file
 * @param fetchOptions - Options for fetching the feeds
 * @param saveDir - Directory to save the feeds to
 * @returns A promise that resolves to an array of feed fetch results
 */
export async function fetchAndSaveFeedsFromOpml(
  opmlOptions: OpmlLoadOptions,
  fetchOptions: OpmlFetchOptions = {},
  saveDir: string
): Promise<FeedFetchResult[]> {
  try {
    // Ensure the save directory exists
    await ensureDir(saveDir);
    
    // Fetch the feeds
    const results = await fetchFeedsFromOpml(opmlOptions, fetchOptions);
    
    // Save each successfully fetched feed
    for (const result of results) {
      if (result.feed) {
        const fileName = sanitizeFileName(result.feed.title || result.source.title);
        await saveRssFeed(result.feed, {
          path: `${saveDir}/${fileName}.json`
        });
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(
      `Error fetching and saving feeds from OPML: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Sanitizes a string for use as a filename
 *
 * @param name - The string to sanitize
 * @returns A sanitized string safe for use as a filename
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .trim()
    .toLowerCase();
}

/**
 * Main function to run the script from the command line
 */
if (import.meta.main) {
  try {
    const opmlPath = Deno.args[0] || "./tmp/data/opml/paz.opml";
    const category = Deno.args[1]; // Optional category filter
    const saveDir = "./tmp/data/feeds";
    
    console.log(`Loading OPML file from ${opmlPath}...`);
    
    // Create fetch options with category filter if provided
    const fetchOptions: OpmlFetchOptions = {
      timeout: 10000,
      maxConcurrent: 3
    };
    
    if (category) {
      fetchOptions.categoryFilter = category;
      console.log(`Filtering feeds by category: ${category}`);
    }
    
    // Fetch and save the feeds
    const results = await fetchAndSaveFeedsFromOpml(
      { path: opmlPath },
      fetchOptions,
      saveDir
    );
    
    // Print summary
    const successful = results.filter(r => r.feed).length;
    const failed = results.filter(r => r.error).length;
    
    console.log(`\nFeed fetching complete:`);
    console.log(`- Total feeds: ${results.length}`);
    console.log(`- Successfully fetched: ${successful}`);
    console.log(`- Failed: ${failed}`);
    console.log(`\nFeeds saved to ${saveDir}`);
    
    // Print errors if any
    if (failed > 0) {
      console.log("\nErrors:");
      results
        .filter(r => r.error)
        .forEach(r => {
          console.log(`- ${r.source.title}: ${r.error}`);
        });
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
