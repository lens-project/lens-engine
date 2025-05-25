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
  _options: HtmlExtractOptions = {}
): HtmlExtractResult {
  // Bootstrap implementation - just basic tag stripping
  const text = html.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Fix word count for empty strings
  const wordCount = text === "" ? 0 : text.split(/\s+/).length;

  return {
    text,
    urls: [],
    wordCount,
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
  options: HtmlExtractOptions = {}
): Promise<HtmlExtractResult> {
  const html = await Deno.readTextFile(filePath);
  return extractFromHtml(html, options);
}