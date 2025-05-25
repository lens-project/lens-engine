/**
 * Test Fixtures for Markdown Summarizer Tests
 *
 * This module provides test fixtures for the markdown summarizer tests:
 * - Sample markdown content with different structures
 * - Expected processing results
 * - Mock summaries for testing without Ollama
 */

// ============================================================================
// Sample Markdown Content
// ============================================================================

/**
 * Simple markdown document with basic structure
 */
export const SIMPLE_MARKDOWN = `
# Simple Article

This is a simple test article with minimal content.

It has just two paragraphs for basic testing.
`;

/**
 * Markdown document with front matter
 */
export const MARKDOWN_WITH_FRONTMATTER = `
---
title: Test Document
author: Test Author
date: 2025-05-21
tags: [test, markdown, fixture]
---

# Document with Front Matter

This document has YAML front matter that should be removed during processing.

## Section

This is a section of the document with more content.
`;

/**
 * Complex markdown document with rich formatting
 */
export const COMPLEX_MARKDOWN = `
# Complex Markdown Document

This is a paragraph with **bold text** and *italic text* and some \`inline code\`.

## Section 1

This section contains:

- A bullet list
- With multiple items
- And some *formatting*

## Section 2

This section has a [link to example](https://example.com) and an image:

![Example Image](https://example.com/image.jpg)

### Subsection

> This is a blockquote with important information.
> It spans multiple lines.

\`\`\`javascript
// This is a code block
function example() {
  return "Hello World";
}
\`\`\`

## Final Section

This is the final section of the document.
`;

/**
 * Markdown with special characters
 */
export const SPECIAL_CHARS_MARKDOWN = `
# Special & Characters

This document tests special characters: < > & " '

It also includes backslashes \\ and backticks \` and other symbols: # * _ { } [ ] ( ) + - . !
`;

/**
 * Empty markdown document
 */
export const EMPTY_MARKDOWN = `
`;

// ============================================================================
// Expected Processing Results
// ============================================================================

/**
 * Expected processing results for the simple markdown
 */
export const SIMPLE_MARKDOWN_PROCESSED =
  "Simple Article This is a simple test article with minimal content. It has just two paragraphs for basic testing.";

/**
 * Expected processing results for the markdown with front matter
 */
export const MARKDOWN_WITH_FRONTMATTER_PROCESSED =
  "Document with Front Matter This document has YAML front matter that should be removed during processing. Section This is a section of the document with more content.";

/**
 * Expected parts that should be in the processed complex markdown
 */
export const COMPLEX_MARKDOWN_PROCESSED_PARTS = [
  "Complex Markdown Document",
  "This is a paragraph with bold text and italic text and some inline code",
  "Section 1",
  "This section contains:",
  "A bullet list",
  "With multiple items",
  "And some formatting",
  "Section 2",
  "This section has a link to example",
  "Subsection",
  "This is a blockquote with important information. It spans multiple lines.",
  "Final Section",
  "This is the final section of the document.",
];

// ============================================================================
// Mock Summaries
// ============================================================================

/**
 * Mock summary for the simple markdown
 */
export const SIMPLE_MARKDOWN_SUMMARY =
  "This is a simple test article with minimal content. It contains two paragraphs for basic testing purposes.";

/**
 * Mock summary for the markdown with front matter
 */
export const MARKDOWN_WITH_FRONTMATTER_SUMMARY =
  "This document demonstrates the use of YAML front matter in markdown files. The front matter contains metadata like title, author, date, and tags. The main content discusses how front matter should be removed during processing and includes a section with additional content.";

/**
 * Mock summary for the complex markdown
 */
export const COMPLEX_MARKDOWN_SUMMARY =
  `The document titled "Complex Markdown Document" demonstrates various markdown formatting features.

It begins with a paragraph showing text formatting options like bold, italic, and inline code. The content is organized into multiple sections.

Section 1 contains a bullet list with multiple items, some with formatting. Section 2 includes a link to an external website and an image reference. It also has a subsection with a blockquote spanning multiple lines and a JavaScript code block showing a simple function.

The document concludes with a final section containing a brief statement.`;

/**
 * Mock summary for the special characters markdown
 */
export const SPECIAL_CHARS_MARKDOWN_SUMMARY =
  "This document demonstrates the use of special characters in markdown content. It shows how characters like angle brackets, ampersands, quotes, apostrophes, backslashes, backticks, and various markdown syntax symbols can be included in markdown documents.";

// Import the file mocks and Ollama mocks from the HTML fixtures
export { setupFileMocks, setupOllamaMock } from "./html_fixtures.ts";
