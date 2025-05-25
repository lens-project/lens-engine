# Processors Production Architecture Plan

## Overview

This document outlines the design decisions and implementation plan for
promoting the processors lab functionality to production-ready code.

## Key Design Decisions

### 1. Architecture Pattern

- **Content Extraction Layer**: Format-specific extractors (HTML, Markdown, PDF)
- **Text Processing Layer**: Format-agnostic processors (summarize, analyze,
  translate)
- **Orchestration Layer**: Controllers for batch, real-time, and streaming
  execution

### 2. Code Organization Strategy

- Keep lab code intact as proven concepts with working tests
- Build fresh production code incorporating lessons learned
- Use shallow directory structure to avoid deep nesting
- Maintain clear separation between experimental and production code

### 3. Execution Strategy

- Start with batch processing as foundation
- Build controller abstraction for future real-time and streaming capabilities
- Use bootstrap approach with simple implementations and smoke tests

## Directory Structure

```
processors/
├── lab/                          # Existing proven concepts
│   ├── test/
│   │   ├── fixtures/             # Test data (sample.html, etc.)
│   │   ├── html_summarizer_test.ts
│   │   ├── markdown_summarizer_test.ts
│   │   └── metadata_extractor_test.ts
│   ├── html_summarizer.ts
│   ├── markdown_summarizer.ts
│   └── metadata_extractor.ts
├── src/                          # Production source code
│   ├── extract/                  # Content extraction functions
│   │   ├── html.ts
│   │   ├── markdown.ts
│   │   ├── pdf.ts               # Future
│   │   └── mod.ts               # Extract module exports
│   ├── process/                  # Text processing functions
│   │   ├── summarize.ts
│   │   ├── analyze.ts           # Future
│   │   └── mod.ts               # Process module exports
│   ├── controllers.ts            # Orchestration logic
│   └── mod.ts                   # Internal coordination
├── test/                         # Production tests
│   ├── fixtures/                 # Shared test data
│   ├── extract/
│   │   ├── html_test.ts
│   │   ├── markdown_test.ts
│   │   └── pdf_test.ts          # Future
│   ├── process/
│   │   ├── summarize_test.ts
│   │   └── analyze_test.ts      # Future
│   └── controllers_test.ts
└── mod.ts                       # Public API exports
```

## Updated Controller Architecture

### Shared Types: `src/controller/types.ts`

```typescript
/**
 * Shared Controller Types
 *
 * Common interfaces used across all controllers for consistent
 * processing workflows and result handling.
 */

/**
 * Options for processing operations
 */
export interface ProcessingOptions {
  /** Whether to overwrite existing output files */
  overwrite?: boolean;
  /** Maximum number of concurrent operations */
  maxConcurrency?: number;
  /** Output directory for processed files */
  outputDir?: string;
}

/**
 * Result of a processing operation
 */
export interface ProcessingResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Input file path or identifier */
  input: string;
  /** Output file path if successful */
  output?: string;
  /** Error message if failed */
  error?: string;
  /** Extracted content metadata */
  metadata?: {
    wordCount: number;
    urls: string[];
    title?: string;
  };
}

/**
 * Batch processing results summary
 */
export interface BatchResult {
  /** Total number of items processed */
  totalItems: number;
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  failureCount: number;
  /** Individual results */
  results: ProcessingResult[];
}

/**
 * Progress callback for batch processing
 */
export type ProgressCallback = (
  completed: number,
  total: number,
  current?: string,
) => void;
```

### HTML Content Controller: `src/controller/content/html.ts`

````typescript
/**
 * HTML Content Processing Controller
 *
 * Handles the complete processing workflow for HTML content:
 * extraction → processing → output generation
 */

import { extractFromHtml, type HtmlExtractResult } from "../../extract/mod.ts";
import type { ProcessingOptions, ProcessingResult } from "../types.ts";

/**
 * HTML-specific processing options
 */
export interface HtmlProcessingOptions extends ProcessingOptions {
  /** Whether to preserve URLs in extracted text */
  preserveUrls?: boolean;
  /** Whether to preserve heading structure */
  preserveHeadings?: boolean;
  /** CSS selectors to exclude from extraction */
  excludeSelectors?: string[];
}

/**
 * Process HTML content through the complete workflow
 *
 * @param html - HTML content to process
 * @param identifier - Identifier for this content (filename, url, etc.)
 * @param options - HTML processing options
 * @returns Processing result with extracted content
 *
 * @example
 * ```typescript
 * const html = "<h1>Title</h1><p>Content</p>";
 * const result = await processHtmlContent(html, "test.html");
 * console.log(result.success); // true
 * console.log(result.metadata?.wordCount); // 2
 * ```
 */
export async function processHtmlContent(
  html: string,
  identifier: string,
  options: HtmlProcessingOptions = {},
): Promise<ProcessingResult> {
  try {
    // Extract content using our HTML extractor
    const extracted: HtmlExtractResult = extractFromHtml(html, {
      preserveUrls: options.preserveUrls ?? true,
      preserveHeadings: options.preserveHeadings ?? true,
    });

    // Bootstrap: For now, just return the extraction results
    // Future: This would continue to summarization, analysis, etc.
    // const processed = await summarizeContent(extracted.text, summaryOptions);
    // const saved = await saveContent(processed, outputPath);

    return {
      success: true,
      input: identifier,
      metadata: {
        wordCount: extracted.wordCount,
        urls: extracted.urls,
        title: extracted.title,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      input: identifier,
      error: `Failed to process HTML content: ${errorMessage}`,
    };
  }
}

/**
 * Process HTML file through the complete workflow
 *
 * @param filePath - Path to HTML file
 * @param options - HTML processing options
 * @returns Processing result
 */
export async function processHtmlFile(
  filePath: string,
  options: HtmlProcessingOptions = {},
): Promise<ProcessingResult> {
  try {
    const html = await Deno.readTextFile(filePath);
    return await processHtmlContent(html, filePath, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      input: filePath,
      error: `Failed to read HTML file: ${errorMessage}`,
    };
  }
}
````

### Batch Processing Controller: `src/controller/processing/batch.ts`

````typescript
/**
 * Batch Processing Controller
 *
 * Orchestrates batch processing workflows across different content types.
 * Handles concurrency, progress tracking, and error aggregation.
 */

import { processHtmlFile } from "../content/html.ts";
import type {
  BatchResult,
  ProcessingOptions,
  ProcessingResult,
  ProgressCallback,
} from "../types.ts";

/**
 * Batch processing options
 */
export interface BatchProcessingOptions extends ProcessingOptions {
  /** Progress callback function */
  onProgress?: ProgressCallback;
  /** Whether to continue processing after errors */
  continueOnError?: boolean;
}

/**
 * Process multiple HTML files in batch
 *
 * @param filePaths - Array of HTML file paths to process
 * @param options - Batch processing options
 * @returns Batch processing results
 *
 * @example
 * ```typescript
 * const files = ["doc1.html", "doc2.html"];
 * const results = await processHtmlBatch(files, {
 *   maxConcurrency: 3,
 *   onProgress: (completed, total) => console.log(`${completed}/${total}`)
 * });
 * ```
 */
export async function processHtmlBatch(
  filePaths: string[],
  options: BatchProcessingOptions = {},
): Promise<BatchResult> {
  const results: ProcessingResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Bootstrap: Process sequentially
  // Future: Add concurrency control with options.maxConcurrency
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];

    // Report progress
    if (options.onProgress) {
      options.onProgress(i, filePaths.length, filePath);
    }

    const result = await processHtmlFile(filePath, options);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      failureCount++;

      // Stop on first error if continueOnError is false
      if (!options.continueOnError) {
        break;
      }
    }
  }

  // Final progress report
  if (options.onProgress) {
    options.onProgress(results.length, filePaths.length);
  }

  return {
    totalItems: filePaths.length,
    successCount,
    failureCount,
    results,
  };
}

/**
 * Process mixed content types in batch
 *
 * Bootstrap implementation - currently only handles HTML files.
 * Future: Auto-detect file types and route to appropriate processors.
 *
 * @param filePaths - Array of file paths to process
 * @param options - Batch processing options
 * @returns Batch processing results
 */
export async function processMixedBatch(
  filePaths: string[],
  options: BatchProcessingOptions = {},
): Promise<BatchResult> {
  // Bootstrap: Only handle HTML files for now
  const htmlFiles = filePaths.filter((path) =>
    path.toLowerCase().endsWith(".html") || path.toLowerCase().endsWith(".htm")
  );

  if (htmlFiles.length !== filePaths.length) {
    console.warn(
      `Only processing ${htmlFiles.length} HTML files out of ${filePaths.length} total files`,
    );
  }

  return await processHtmlBatch(htmlFiles, options);
}
````

### Module Exports: `src/controller/mod.ts`

```typescript
/**
 * Controller Module
 *
 * Exports all controller functionality for content processing workflows.
 */

// Content controllers
export {
  type HtmlProcessingOptions,
  processHtmlContent,
  processHtmlFile,
} from "./content/html.ts";

// Processing controllers
export {
  type BatchProcessingOptions,
  processHtmlBatch,
  processMixedBatch,
} from "./processing/batch.ts";

// Shared types
export type {
  BatchResult,
  ProcessingOptions,
  ProcessingResult,
  ProgressCallback,
} from "./types.ts";
```

## Bootstrap Implementation Example

### Source Code Example: `src/extract/html.ts`

````typescript
/**
 * HTML Content Extractor
 *
 * Extracts plain text content from HTML documents, focusing on main content
 * while preserving important metadata like URLs.
 */

/**
 * Options for HTML text extraction
 */
export interface HtmlExtractOptions {
  /** Whether to preserve URLs in output */
  preserveUrls?: boolean;
  /** Whether to preserve headings structure */
  preserveHeadings?: boolean;
  /** Custom selectors to exclude from extraction */
  excludeSelectors?: string[];
}

/**
 * Result of HTML text extraction
 */
export interface HtmlExtractResult {
  /** Extracted plain text content */
  text: string;
  /** URLs found in the document */
  urls: string[];
  /** Document title if found */
  title?: string;
  /** Word count of extracted text */
  wordCount: number;
}

/**
 * Extract plain text content from HTML
 *
 * This function processes HTML content to extract the main text while
 * removing navigation, scripts, styles, and other non-content elements.
 *
 * @param html - The HTML content to process
 * @param options - Extraction options
 * @returns Extracted text content and metadata
 *
 * @example
 * ```typescript
 * const html = "<h1>Title</h1><p>Content</p>";
 * const result = extractFromHtml(html, { preserveUrls: true });
 * console.log(result.text); // "Title\nContent"
 * ```
 */
export function extractFromHtml(
  html: string,
  options: HtmlExtractOptions = {},
): HtmlExtractResult {
  // Bootstrap implementation - just basic tag stripping
  const text = html.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    text,
    urls: [],
    wordCount: text.split(/\s+/).length,
  };
}

/**
 * Extract text from HTML file
 *
 * @param filePath - Path to HTML file
 * @param options - Extraction options
 * @returns Promise resolving to extracted content
 */
export async function extractFromHtmlFile(
  filePath: string,
  options: HtmlExtractOptions = {},
): Promise<HtmlExtractResult> {
  const html = await Deno.readTextFile(filePath);
  return extractFromHtml(html, options);
}
````

### Updated Controller Tests: `test/controller_test.ts`

```typescript
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type BatchResult,
  processHtmlBatch,
  processHtmlContent,
  processHtmlFile,
  type ProcessingResult,
  processMixedBatch,
} from "../src/controller/mod.ts";

// Content Controller Tests
Deno.test("HTML Controller - module exists and exports", () => {
  assertExists(processHtmlContent);
  assertExists(processHtmlFile);
});

Deno.test("HTML Controller - processHtmlContent success", async () => {
  const html = "<h1>Test Title</h1><p>This is test content.</p>";
  const result: ProcessingResult = await processHtmlContent(html, "test.html");

  assertEquals(result.success, true);
  assertEquals(result.input, "test.html");
  assertEquals(typeof result.metadata?.wordCount, "number");
  assertEquals(Array.isArray(result.metadata?.urls), true);
  assertEquals(result.metadata!.wordCount > 0, true);
});

Deno.test("HTML Controller - processHtmlContent with options", async () => {
  const html = "<h1>Title</h1><a href='http://example.com'>Link</a>";
  const result = await processHtmlContent(html, "test.html", {
    preserveUrls: true,
    preserveHeadings: true,
    outputDir: "/tmp/test",
  });

  assertEquals(result.success, true);
  assertEquals(result.input, "test.html");
});

Deno.test("HTML Controller - processHtmlFile nonexistent", async () => {
  const result = await processHtmlFile("nonexistent.html");

  assertEquals(result.success, false);
  assertEquals(result.input, "nonexistent.html");
  assertEquals(typeof result.error, "string");
});

// Batch Controller Tests
Deno.test("Batch Controller - module exists and exports", () => {
  assertExists(processHtmlBatch);
  assertExists(processMixedBatch);
});

Deno.test("Batch Controller - processHtmlBatch empty array", async () => {
  const result: BatchResult = await processHtmlBatch([]);

  assertEquals(result.totalItems, 0);
  assertEquals(result.successCount, 0);
  assertEquals(result.failureCount, 0);
  assertEquals(result.results.length, 0);
});

Deno.test("Batch Controller - processHtmlBatch with progress", async () => {
  const files = ["missing1.html", "missing2.html"];
  const progressCalls: Array<[number, number, string?]> = [];

  const result = await processHtmlBatch(files, {
    continueOnError: true,
    onProgress: (completed, total, current) => {
      progressCalls.push([completed, total, current]);
    },
  });

  assertEquals(result.totalItems, 2);
  assertEquals(result.failureCount, 2);
  assertEquals(progressCalls.length > 0, true);
});

Deno.test("Batch Controller - processMixedBatch filters file types", async () => {
  const files = ["test.html", "test.pdf", "test.txt", "test.htm"];
  const result = await processMixedBatch(files);

  // Should only process HTML files
  assertEquals(result.totalItems, 4); // All files counted
  // Results depend on whether files exist, but structure should be correct
  assertEquals(Array.isArray(result.results), true);
});
```

### Test Example: `test/extract/html_test.ts`

```typescript
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  extractFromHtml,
  extractFromHtmlFile,
} from "../../src/extract/html.ts";
import type { HtmlExtractResult } from "../../src/extract/html.ts";

Deno.test("HTML Extractor - module exists and exports", () => {
  // Smoke test - just verify the module loads and function exists
  assertExists(extractFromHtml);
  assertExists(extractFromHtmlFile);
});

Deno.test("HTML Extractor - basic extraction", () => {
  const html = "<h1>Test Title</h1><p>Test content</p>";
  const result: HtmlExtractResult = extractFromHtml(html);

  // Verify basic structure
  assertEquals(typeof result.text, "string");
  assertEquals(typeof result.wordCount, "number");
  assertEquals(Array.isArray(result.urls), true);

  // Basic functionality test
  assertEquals(result.text.includes("Test Title"), true);
  assertEquals(result.text.includes("Test content"), true);
  assertEquals(result.wordCount > 0, true);
});

Deno.test("HTML Extractor - empty input", () => {
  const result = extractFromHtml("");
  assertEquals(result.text, "");
  assertEquals(result.wordCount, 0);
  assertEquals(result.urls.length, 0);
});

Deno.test("HTML Extractor - with options", () => {
  const html = "<h1>Title</h1><p>Content</p>";
  const result = extractFromHtml(html, {
    preserveUrls: true,
    preserveHeadings: true,
  });

  // Just verify options are accepted without error
  assertExists(result);
  assertEquals(typeof result.text, "string");
});

// File extraction test (requires test fixture)
Deno.test("HTML Extractor - file extraction", async () => {
  // This test would use a fixture file
  // For now, just verify the function signature works
  try {
    await extractFromHtmlFile("nonexistent.html");
  } catch (error) {
    // Expected to fail with file not found, not with function error
    assertEquals(error instanceof Deno.errors.NotFound, true);
  }
});
```

### Module Export Example: `src/extract/mod.ts`

```typescript
/**
 * Content Extraction Module
 *
 * This module provides functions to extract plain text content from
 * various document formats while preserving important metadata.
 */

export {
  extractFromHtml,
  extractFromHtmlFile,
  type HtmlExtractOptions,
  type HtmlExtractResult,
} from "./html.ts";

export {
  extractFromMarkdown,
  extractFromMarkdownFile,
  type MarkdownExtractOptions,
  type MarkdownExtractResult,
} from "./markdown.ts";

// Future exports
// export { extractFromPdf } from "./pdf.ts";
// export { extractFromDocx } from "./docx.ts";
```

## Implementation Plan

### Phase 1: Bootstrap Structure

1. Create directory structure
2. Add bootstrap implementations for:
   - `src/extract/html.ts` (basic implementation)
   - `src/extract/markdown.ts` (basic implementation)
   - `src/process/summarize.ts` (stub implementation)
   - `src/controllers.ts` (stub implementation)
3. Add corresponding smoke tests
4. Verify module imports and exports work

### Phase 2: Core Implementation

1. Implement robust HTML extraction (using lab learnings)
2. Implement robust Markdown extraction (using lab learnings)
3. Implement summarization processor (using lab Ollama integration)
4. Add comprehensive tests with fixtures

### Phase 3: Controller Implementation

1. Build batch processing controller
2. Add error handling and progress tracking
3. Implement configuration management
4. Add integration tests

### Phase 4: Additional Features

1. Add PDF extraction
2. Add additional processors (analyze, translate)
3. Implement real-time processing capabilities
4. Add streaming support

## Key Principles

1. **Keep Labs Intact**: Lab code remains as working reference implementations
2. **Bootstrap First**: Establish structure with simple implementations before
   complexity
3. **Test-Driven**: Every module has tests from the start
4. **Document Interfaces**: JSDoc serves as implementation specification
5. **Incremental Development**: Build one component at a time with confidence
6. **Clean Architecture**: Clear separation between extraction, processing, and
   orchestration

## Next Steps

1. Create the directory structure
2. Implement bootstrap files following the examples above
3. Run tests to verify module structure works
4. Begin implementing real functionality one module at a time
