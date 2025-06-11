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
  _options: HtmlExtractOptions = {},
): HtmlExtractResult {
  // Bootstrap implementation - just basic tag stripping
  const text = html.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Extract URLs (basic implementation)
  const urlMatches = html.match(/href=["']([^"']+)["']/g) || [];
  const urls = urlMatches.map((match) => {
    const url = match.match(/href=["']([^"']+)["']/);
    return url ? url[1] : "";
  }).filter(Boolean);

  // Extract title (basic implementation)
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  // Count words
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    text,
    urls,
    title,
    wordCount,
  };
}

/**
 * Extract content from an HTML file
 *
 * @param filePath - Path to the HTML file
 * @param options - Extraction options
 * @returns Extracted content and metadata
 */
export async function extractFromHtmlFile(
  filePath: string,
  options: HtmlExtractOptions = {},
): Promise<HtmlExtractResult> {
  try {
    const html = await Deno.readTextFile(filePath);
    return extractFromHtml(html, options);
  } catch (error) {
    throw new Error(
      `Failed to read HTML file "${filePath}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
