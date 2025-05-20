/**
 * Content Fetcher
 *
 * This module provides functionality to fetch content from URLs found in a JSON file.
 * It is designed to download HTML content from blog posts or articles and save them
 * to a local directory for further processing and analysis.
 *
 * The module uses a functional programming approach with pure functions and composition.
 *
 * Key features:
 * 1. Load and parse JSON files containing URLs
 * 2. Fetch HTML content from URLs
 * 3. Save content to local files
 * 4. Process content in batches with configurable concurrency
 * 5. Handle errors gracefully with detailed logging
 *
 * Example usage:
 * ```typescript
 * // Fetch all content from a JSON file
 * await fetchAllContent({
 *   jsonPath: "./tmp/data/austin_kleon.json",
 *   outputDir: "./tmp/data/fetched",
 *   concurrency: 3
 * });
 * ```
 *
 * @module content_fetcher
 * @lab Experimental content fetcher for downloading and storing web content
 * @version 0.1.0
 * @author Lens Team
 */

import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

/**
 * Options for fetching content
 */
export interface FetchOptions {
  /** URL to fetch content from */
  url: string;
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** User agent string to use for the request (default: Mozilla/5.0...) */
  userAgent?: string;
}

/**
 * Options for saving content
 */
export interface SaveOptions {
  /** Path where the content should be saved */
  path: string;
  /** Whether to overwrite existing files (default: false) */
  overwrite?: boolean;
}

/**
 * Options for the content fetcher
 */
export interface ContentFetcherOptions {
  /** Path to the JSON file containing URLs to fetch */
  jsonPath: string;
  /** Directory where fetched content should be saved */
  outputDir: string;
  /** Number of concurrent fetches (default: 2) */
  concurrency?: number;
  /** Whether to overwrite existing files (default: false) */
  overwrite?: boolean;
  /** Default timeout for fetch operations in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Result of a fetch operation
 */
export interface FetchResult {
  /** URL that was fetched */
  url: string;
  /** Whether the fetch was successful */
  success: boolean;
  /** Path where the content was saved (if successful) */
  path?: string;
  /** Error message (if unsuccessful) */
  error?: string;
}

/**
 * Sanitize a filename by removing invalid characters
 *
 * @param filename - The filename to sanitize
 * @returns A sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Replace invalid characters with underscores
  return filename
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

/**
 * Create a filename from a URL
 *
 * @param url - The URL to create a filename from
 * @returns A sanitized filename
 */
export function createFilenameFromUrl(url: string): string {
  try {
    // Extract the pathname from the URL
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Get the last part of the path (excluding trailing slash)
    const lastPart = path.endsWith("/")
      ? path.slice(0, -1).split("/").pop()
      : path.split("/").pop();

    // If we have a valid last part, use it; otherwise use the hostname
    const baseFilename = lastPart || urlObj.hostname;

    // Sanitize and add .html extension
    return `${sanitizeFilename(baseFilename)}.html`;
  } catch (_error) {
    // If URL parsing fails, use a hash of the URL
    return `${sanitizeFilename(url)}.html`;
  }
}

/**
 * Fetch content from a URL
 *
 * @param options - Options for fetching content
 * @returns The fetched content as a string
 */
export async function fetchContent(
  options: FetchOptions,
): Promise<string> {
  const {
    url,
    timeout = 10000,
    userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
  } = options;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
      },
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch content: ${response.status} ${response.statusText}`,
      );
    }

    return await response.text();
  } catch (error) {
    throw new Error(
      `Error fetching content: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Save content to a file
 *
 * @param content - The content to save
 * @param options - Options for saving the content
 */
export async function saveContent(
  content: string,
  options: SaveOptions,
): Promise<void> {
  const { path, overwrite = false } = options;

  try {
    // Check if file exists and we're not overwriting
    if (!overwrite) {
      try {
        const stat = await Deno.stat(path);
        if (stat.isFile) {
          console.log(`File already exists: ${path} (skipping)`);
          return;
        }
      } catch (_error) {
        // File doesn't exist, which is fine
      }
    }

    // Ensure the directory exists
    await ensureDir(dirname(path));

    // Write the content to the file
    await Deno.writeTextFile(path, content);
  } catch (error) {
    throw new Error(
      `Error saving content: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Get the directory name from a path
 *
 * @param path - The path to get the directory name from
 * @returns The directory name
 */
function dirname(path: string): string {
  const parts = path.split(/[\/\\]/);
  parts.pop(); // Remove the last part (filename)
  return parts.join("/") || ".";
}

/**
 * Fetch content from a URL and save it to a file
 *
 * @param url - The URL to fetch content from
 * @param outputDir - The directory to save the content to
 * @param options - Additional options
 * @returns The result of the fetch operation
 */
export async function fetchAndSaveContent(
  url: string,
  outputDir: string,
  options: {
    timeout?: number;
    overwrite?: boolean;
  } = {},
): Promise<FetchResult> {
  const { timeout = 10000, overwrite = false } = options;

  try {
    // Create a filename from the URL
    const filename = createFilenameFromUrl(url);
    const outputPath = join(outputDir, filename);

    // Fetch the content
    const content = await fetchContent({ url, timeout });

    // Save the content
    await saveContent(content, { path: outputPath, overwrite });

    return {
      url,
      success: true,
      path: outputPath,
    };
  } catch (error) {
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Load and parse a JSON file containing URLs
 *
 * @param jsonPath - Path to the JSON file
 * @returns The parsed JSON data
 */
export async function loadJsonFile(
  jsonPath: string,
): Promise<Record<string, unknown>> {
  try {
    const content = await Deno.readTextFile(jsonPath);
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Error loading JSON file: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Extract URLs from a parsed JSON file
 *
 * @param data - The parsed JSON data
 * @returns An array of URLs
 */
export function extractUrls(data: Record<string, unknown>): string[] {
  // Check if the data has an 'items' array with 'link' properties
  if (Array.isArray(data.items)) {
    return data.items
      .filter((item: Record<string, unknown>) =>
        item.link && typeof item.link === "string"
      )
      .map((item: Record<string, unknown>) => item.link as string);
  }

  return [];
}

/**
 * Process a batch of URLs with limited concurrency
 *
 * @param urls - The URLs to process
 * @param outputDir - The directory to save the content to
 * @param options - Additional options
 * @returns The results of the fetch operations
 */
export async function processBatch(
  urls: string[],
  outputDir: string,
  options: {
    concurrency?: number;
    timeout?: number;
    overwrite?: boolean;
  } = {},
): Promise<FetchResult[]> {
  const {
    concurrency = 2,
    timeout = 10000,
    overwrite = false,
  } = options;

  const results: FetchResult[] = [];
  const queue = [...urls];

  // Process the queue with limited concurrency
  const workers = Array(Math.min(concurrency, queue.length))
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const url = queue.shift()!;
        console.log(`Fetching: ${url}`);

        const result = await fetchAndSaveContent(url, outputDir, {
          timeout,
          overwrite,
        });
        results.push(result);

        if (result.success) {
          console.log(
            `✅ Successfully fetched and saved: ${url} -> ${result.path}`,
          );
        } else {
          console.error(`❌ Failed to fetch: ${url} - ${result.error}`);
        }
      }
    });

  // Wait for all workers to complete
  await Promise.all(workers);

  return results;
}

/**
 * Fetch all content from a JSON file
 *
 * @param options - Options for the content fetcher
 * @returns The results of the fetch operations
 */
export async function fetchAllContent(
  options: ContentFetcherOptions,
): Promise<FetchResult[]> {
  const {
    jsonPath,
    outputDir,
    concurrency = 2,
    overwrite = false,
    timeout = 10000,
  } = options;

  try {
    // Ensure the output directory exists
    await ensureDir(outputDir);

    // Load and parse the JSON file
    const data = await loadJsonFile(jsonPath);

    // Extract URLs from the JSON data
    const urls = extractUrls(data);
    console.log(`Found ${urls.length} URLs to fetch`);

    // Process the URLs in batches
    return await processBatch(urls, outputDir, {
      concurrency,
      timeout,
      overwrite,
    });
  } catch (error) {
    console.error(
      `Error fetching content: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
}

/**
 * Main function to run the script from the command line
 */
if (import.meta.main) {
  try {
    // Get the feed name from command line or use default
    const feedName = Deno.args[0] || "austin_kleon"; // Default feed name
    const concurrency = parseInt(Deno.args[1] || "2");

    // Check for LENS_DATA_DIR environment variable
    const lensDataDir = Deno.env.get("LENS_DATA_DIR");

    // Exit if LENS_DATA_DIR is not set
    if (!lensDataDir) {
      console.error("Error: LENS_DATA_DIR environment variable is not set");
      Deno.exit(1);
    }

    console.log(`Using LENS_DATA_DIR environment variable: ${lensDataDir}`);
    const baseDir = lensDataDir;

    // Create directories within the data directory
    const feedsDir = join(baseDir, "feeds");
    const fetchedDir = join(baseDir, "fetched");

    // Ensure directories exist
    await ensureDir(feedsDir);
    await ensureDir(fetchedDir);

    // Construct the path to the feed JSON file
    let jsonPath = join(feedsDir, `${feedName}.json`);

    // Check if the feed file exists
    try {
      await Deno.stat(jsonPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Try the paz namespace path
        const pazJsonPath = join(feedsDir, "paz", `${feedName}.json`);

        try {
          await Deno.stat(pazJsonPath);
          console.log(`Feed file not found at ${jsonPath}, using ${pazJsonPath} instead`);
          jsonPath = pazJsonPath;
        } catch (_innerError) {
          // If the file doesn't exist in either location, warn the user
          console.warn(`Feed file not found at ${jsonPath} or ${pazJsonPath}`);
          // Continue with the original path (will fail later)
        }
      }
    }

    console.log(`Processing content from data directory: ${baseDir}`);
    console.log(
      `Fetching content from ${jsonPath} to ${fetchedDir} with concurrency ${concurrency}`,
    );

    const results = await fetchAllContent({
      jsonPath,
      outputDir: fetchedDir,
      concurrency,
      overwrite: false,
    });

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\nFetch summary:`);
    console.log(`- Total URLs: ${results.length}`);
    console.log(`- Successfully fetched: ${successful}`);
    console.log(`- Failed to fetch: ${failed}`);

    if (failed > 0) {
      console.log(`\nFailed URLs:`);
      results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`- ${r.url}: ${r.error}`));
    }
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    Deno.exit(1);
  }
}
