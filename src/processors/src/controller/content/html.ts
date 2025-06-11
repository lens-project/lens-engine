/**
 * HTML Content Processing Controller
 *
 * Handles the complete processing workflow for HTML content:
 * extraction → processing → output generation
 */

import { extractFromHtml, type HtmlExtractResult } from "../../extract/mod.ts";
import type { ProcessingOptions, ProcessingResult } from "../types.ts";
import { summarizeContent, type SummaryOptions } from "@src/models/mod.ts";
import { getConfig } from "@src/config/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

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
 * Create an output filename from an input path
 */
function createOutputFilename(inputPath: string): string {
  // Get the base filename without extension
  const filename = inputPath.split("/").pop() || "unknown";
  const baseFilename = filename.replace(/\.[^/.]+$/, "");

  // Create the output filename
  return `${baseFilename}-summary.md`;
}

/**
 * Save processed content to a file
 */
async function saveProcessedContent(
  content: string,
  outputPath: string,
  overwrite: boolean = false,
): Promise<void> {
  try {
    // Check if file exists and we're not overwriting
    if (!overwrite) {
      try {
        const stat = await Deno.stat(outputPath);
        if (stat.isFile) {
          console.log(`File already exists: ${outputPath} (skipping)`);
          return;
        }
      } catch (_error) {
        // File doesn't exist, which is fine
      }
    }

    // Ensure the directory exists
    await ensureDir(outputPath.substring(0, outputPath.lastIndexOf("/")));

    // Write the content to the file
    await Deno.writeTextFile(outputPath, content);

    console.log(`Content saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(
      `Error saving content: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
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

    // Save processed content if outputDir is specified
    let outputPath: string | undefined;
    if (options.outputDir) {
      try {
        // Create output filename
        const outputFilename = createOutputFilename(identifier);
        outputPath = join(options.outputDir, outputFilename);

        // Prepare content to save
        let contentToSave = "";

        if (metadata.summary) {
          // If we have a summary, save it in markdown format
          contentToSave = `# ${metadata.title || "Summary"}

## Summary

${metadata.summary}

## Metadata

- **Word Count**: ${metadata.wordCount}
- **URLs Found**: ${metadata.urls.length}
- **Model**: ${metadata.summaryModel || "N/A"}
- **Processing Time**: ${metadata.summaryProcessingTime || "N/A"}ms

## URLs

${metadata.urls.map((url) => `- ${url}`).join("\n")}

---
*Generated from: ${identifier}*
`;
        } else {
          // If no summary, save the extracted text
          contentToSave = `# ${metadata.title || "Extracted Content"}

## Content

${extracted.text}

## Metadata

- **Word Count**: ${metadata.wordCount}
- **URLs Found**: ${metadata.urls.length}

## URLs

${metadata.urls.map((url) => `- ${url}`).join("\n")}

---
*Generated from: ${identifier}*
`;
        }

        // Save the content
        await saveProcessedContent(
          contentToSave,
          outputPath,
          options.overwrite,
        );
      } catch (saveError) {
        console.warn(`Failed to save content for ${identifier}:`, saveError);
        // Don't fail the entire operation if saving fails
      }
    }

    return {
      success: true,
      input: identifier,
      output: outputPath,
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
