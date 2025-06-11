/**
 * Retrieval Module Types for Lens Engine
 *
 * DENO MODULE ORGANIZATION PATTERN:
 * ================================
 *
 * This file contains all public type definitions for the retrieval module.
 * Following the established pattern:
 *
 * retrieval/
 * ├── src/           # Private implementation (content_fetcher.ts, etc.)
 * ├── types.ts       # Public type definitions (THIS FILE)
 * └── mod.ts         # Public API entry point
 *
 * These types define the public interface for content fetching operations,
 * including configuration options, operation parameters, and result types.
 * Internal implementation details remain in src/ files.
 *
 * USAGE:
 * - Internal files: import { FetchOptions } from "../types.ts"
 * - External consumers: import { FetchOptions } from "./retrieval/mod.ts"
 * - CLI imports: import { ContentFetcherOptions } from "./retrieval/mod.ts"
 */

/**
 * Options for fetching content from a single URL
 *
 * Configuration for individual fetch operations, including timeout and user agent settings.
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
 * Options for saving fetched content to disk
 *
 * Configuration for file save operations, including path and overwrite behavior.
 */
export interface SaveOptions {
  /** Path where the content should be saved */
  path: string;
  /** Whether to overwrite existing files (default: false) */
  overwrite?: boolean;
}

/**
 * Main configuration options for the content fetcher
 *
 * Primary interface used by the CLI and other consumers for batch content fetching.
 * This is the main public interface of the retrieval module.
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
 * Result of a single fetch operation
 *
 * Contains the outcome of fetching content from a URL, including success status,
 * file path (if successful), or error information (if failed).
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
