/**
 * RSS Client
 *
 * A simple Deno script to retrieve RSS feeds using functional programming principles.
 * This module provides functions to fetch, parse, and save RSS feeds to local files.
 *
 * @module rss_client
 * @lab Experimental RSS feed client
 * @version 0.1.0
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { getConfig } from "../../config/mod.ts";

/**
 * Represents an RSS feed item
 */
export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  guid: string;
  [key: string]: unknown;
}

/**
 * Represents an RSS feed
 */
export interface RssFeed {
  title: string;
  link: string;
  description: string;
  items: RssItem[];
  [key: string]: unknown;
}

/**
 * Options for fetching an RSS feed
 */
export interface FetchOptions {
  url: string;
  timeout?: number;
}

/**
 * Options for saving an RSS feed
 */
export interface SaveOptions {
  path: string;
  pretty?: boolean;
}

/**
 * Fetches an RSS feed from the specified URL
 *
 * @param options - Options for fetching the feed
 * @returns A promise that resolves to the raw XML content of the feed
 */
export const fetchRssFeed = async (
  options: FetchOptions,
): Promise<string> => {
  const { url, timeout = 10000 } = options;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch RSS feed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.text();
  } catch (error) {
    throw new Error(
      `Error fetching RSS feed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

/**
 * Parses raw XML content into an RssFeed object
 *
 * @param xml - The raw XML content of the feed
 * @returns The parsed RSS feed
 */
export const parseRssFeed = (xml: string): RssFeed => {
  try {
    // Simple XML parsing using regular expressions
    // This is a basic implementation for lab purposes
    // A more robust solution would use a proper XML parser

    // Extract feed title
    const titleMatch = xml.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : "";

    // Extract feed link
    const linkMatch = xml.match(/<link>(.*?)<\/link>/);
    const link = linkMatch ? linkMatch[1] : "";

    // Extract feed description
    const descMatch = xml.match(/<description>(.*?)<\/description>/);
    const description = descMatch ? descMatch[1] : "";

    // Extract items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items: RssItem[] = [];

    let itemMatch;
    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const itemContent = itemMatch[1];

      // Extract item properties
      const itemTitleMatch = itemContent.match(/<title>(.*?)<\/title>/);
      const itemLinkMatch = itemContent.match(/<link>(.*?)<\/link>/);
      const itemPubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
      const itemDescMatch = itemContent.match(
        /<description>([\s\S]*?)<\/description>/,
      );
      const itemGuidMatch = itemContent.match(/<guid.*?>(.*?)<\/guid>/);

      items.push({
        title: itemTitleMatch ? itemTitleMatch[1] : "",
        link: itemLinkMatch ? itemLinkMatch[1] : "",
        pubDate: itemPubDateMatch ? itemPubDateMatch[1] : "",
        description: itemDescMatch ? itemDescMatch[1] : "",
        guid: itemGuidMatch ? itemGuidMatch[1] : "",
      });
    }

    return {
      title,
      link,
      description,
      items,
    };
  } catch (error) {
    throw new Error(
      `Error parsing RSS feed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

/**
 * Saves an RSS feed to a local file
 *
 * @param feed - The RSS feed to save
 * @param options - Options for saving the feed
 * @returns A promise that resolves when the feed has been saved
 */
export const saveRssFeed = async (
  feed: RssFeed,
  options: SaveOptions,
): Promise<void> => {
  const { path, pretty = true } = options;

  try {
    const content = JSON.stringify(feed, null, pretty ? 2 : 0);
    await Deno.writeTextFile(path, content);
  } catch (error) {
    throw new Error(
      `Error saving RSS feed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

/**
 * Ensures that a directory exists, creating it if necessary
 *
 * @param dir - The directory path to ensure exists
 * @returns A promise that resolves when the directory exists
 */
export const ensureDir = async (dir: string): Promise<void> => {
  try {
    const stat = await Deno.stat(dir);
    if (!stat.isDirectory) {
      throw new Error(`Path exists but is not a directory: ${dir}`);
    }
  } catch (error) {
    // If the error is that the path doesn't exist, create the directory
    if (error instanceof Deno.errors.NotFound) {
      await Deno.mkdir(dir, { recursive: true });
    } else {
      throw error;
    }
  }
};

/**
 * Sanitizes a string for use as a filename
 *
 * @param name - The string to sanitize
 * @returns A sanitized string safe for use as a filename (lowercase)
 */
export const sanitizeFilename = (name: string): string => {
  // Replace invalid filename characters with underscores and convert to lowercase
  return name
    .replace(/[/\\?%*:|"<>]/g, "_") // Replace invalid chars with single underscore
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .trim() // Trim whitespace
    .toLowerCase(); // Convert to lowercase
};

/**
 * Fetches, parses, and saves an RSS feed in one operation
 *
 * @param fetchOptions - Options for fetching the feed
 * @param saveOptions - Options for saving the feed
 * @returns A promise that resolves to the parsed RSS feed
 */
export const fetchAndSaveRssFeed = async (
  fetchOptions: FetchOptions,
  saveOptions: SaveOptions,
): Promise<RssFeed> => {
  const xml = await fetchRssFeed(fetchOptions);
  const feed = parseRssFeed(xml);
  await saveRssFeed(feed, saveOptions);
  return feed;
};

/**
 * Main function to run the script from the command line
 */
if (import.meta.main) {
  try {
    // Get the feed URL from command line or use default
    const url = Deno.args[0] || "https://austinkleon.com/feed";

    // Get the configuration
    const config = await getConfig();
    const baseDir = config.core.dataDir;

    // Create directory within the data directory
    const feedsDir = join(baseDir, "feeds");

    // Ensure the directory exists
    await ensureDir(feedsDir);

    console.log(`Fetching RSS feed from ${url}...`);

    // First fetch and parse the feed to get the title
    const xml = await fetchRssFeed({ url });
    const feed = parseRssFeed(xml);

    // Create a filename based on the feed title
    const feedTitle = feed.title || "unnamed_feed";
    const sanitizedTitle = sanitizeFilename(feedTitle);
    const outputPath = join(feedsDir, `${sanitizedTitle}.json`);

    // Save the feed
    await saveRssFeed(feed, { path: outputPath });

    console.log(`Successfully fetched and saved RSS feed to ${outputPath}`);
    console.log(`Title: ${feed.title}`);
    console.log(`Items: ${feed.items.length}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
