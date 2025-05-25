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

//export {
//  extractFromMarkdown,
//  extractFromMarkdownFile,
//  type MarkdownExtractOptions,
//  type MarkdownExtractResult,
//} from "./markdown.ts";

// Future exports
// export { extractFromPdf } from "./pdf.ts";
// export { extractFromDocx } from "./docx.ts";