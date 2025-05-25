/**
 * HTML Content Processing Controller
 *
 * Handles the complete processing workflow for HTML content:
 * extraction → processing → output generation
 */

import { extractFromHtml, type HtmlExtractResult } from "../../extract/mod.ts";
import type { ProcessingOptions, ProcessingResult } from "../types.ts";
import {
  summarizeContent,
  type SummaryOptions,
} from "../../../../models/mod.ts";
import { getConfig } from "../../../../config/mod.ts";

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

    // Initialize metadata with extraction results
    const metadata: ProcessingResult["metadata"] = {
      wordCount: extracted.wordCount,
      urls: extracted.urls,
      title: extracted.title,
    };

    // Perform summarization if not skipped
    if (!options.skipSummarization && extracted.text.trim()) {
      try {
        // Get configuration for defaults
        const config = await getConfig();

        // Prepare summarization options
        const summaryOptions: SummaryOptions = {
          modelName: options.summaryModel || config.llm.llmModel,
          temperature: options.summaryTemperature ?? 0.7,
          langSmithTracing: config.langSmith.tracingEnabled,
        };

        // Summarize the extracted content
        const summaryResult = await summarizeContent(
          extracted.text,
          summaryOptions,
        );

        if (summaryResult.success && summaryResult.content) {
          // Add summary to metadata
          metadata.summary = summaryResult.content;
          metadata.summaryModel = summaryResult.metadata?.model;
          metadata.summaryProcessingTime = summaryResult.metadata
            ?.processingTime;
        } else {
          // Log summarization failure but don't fail the entire operation
          console.warn(
            `Summarization failed for ${identifier}: ${summaryResult.error}`,
          );
        }
      } catch (summaryError) {
        // Log error but don't fail the entire operation
        console.warn(`Summarization error for ${identifier}:`, summaryError);
      }
    }

    return {
      success: true,
      input: identifier,
      metadata,
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
