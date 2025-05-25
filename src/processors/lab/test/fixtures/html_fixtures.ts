/**
 * Test Fixtures for HTML Summarizer Tests
 *
 * This module provides test fixtures for the HTML summarizer tests:
 * - Sample HTML content with different structures
 * - Expected extraction results
 * - Mock summaries for testing without Ollama
 * - Helper functions for mocking
 */

// ============================================================================
// Sample HTML Content
// ============================================================================

/**
 * Simple HTML document with basic structure
 */
export const SIMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Simple Test Page</title>
</head>
<body>
  <h1>Simple Article</h1>
  <p>This is a simple test article with minimal content.</p>
  <p>It has just two paragraphs for basic testing.</p>
</body>
</html>
`;

/**
 * Complex HTML document with rich structure
 */
export const COMPLEX_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Complex Test Page</title>
  <meta name="description" content="A complex test page for HTML extraction">
  <style>
    body { font-family: Arial, sans-serif; }
    .content { margin: 20px; }
    .sidebar { float: right; }
  </style>
  <script>
    console.log("This script content should be removed");
    function test() {
      return "This should not appear in extraction";
    }
  </script>
</head>
<body>
  <header>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <div class="sidebar">
    <h3>Related Articles</h3>
    <ul>
      <li><a href="/article1">Article One</a></li>
      <li><a href="/article2">Article Two</a></li>
    </ul>
  </div>

  <main class="content">
    <h1>Complex Article Title</h1>
    <p>This is the first paragraph of the complex article with <strong>bold text</strong> and <em>emphasized text</em>.</p>
    <p>This is the second paragraph with some <a href="https://example.com">links</a> and special characters: &amp; &lt; &gt; &quot; &#39;</p>

    <h2>Article Section</h2>
    <p>This is a section of the article with more detailed content.</p>
    <ul>
      <li>List item one</li>
      <li>List item two with <strong>formatting</strong></li>
    </ul>

    <blockquote>
      This is a blockquote with important information that should be extracted.
    </blockquote>
  </main>

  <footer>
    <p>&copy; 2025 Test Site</p>
    <div class="footer-links">
      <a href="/privacy">Privacy Policy</a> |
      <a href="/terms">Terms of Service</a>
    </div>
  </footer>
</body>
</html>
`;

/**
 * HTML with special characters and entities
 */
export const SPECIAL_CHARS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Special Characters Test</title>
</head>
<body>
  <h1>Special &amp; Characters</h1>
  <p>This page tests special characters: &lt;tag&gt; &quot;quotes&quot; &amp; ampersands.</p>
  <p>It also includes numeric entities: &#39;apostrophe&#39; and &#8212; em dash.</p>
</body>
</html>
`;

/**
 * Empty HTML document
 */
export const EMPTY_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Empty Page</title>
</head>
<body>
  <!-- Empty body for testing edge cases -->
</body>
</html>
`;

/**
 * Malformed HTML document
 */
export const MALFORMED_HTML = `
<html>
<head>
  <title>Malformed HTML
</head>
<body>
  <h1>Malformed Document</h1>
  <p>This document has unclosed tags
  <div>This div is not closed
  <p>Another paragraph
</body>
`;

// ============================================================================
// Expected Extraction Results
// ============================================================================

/**
 * Expected extraction results for the simple HTML
 */
export const SIMPLE_HTML_EXTRACTED =
  "Simple Article This is a simple test article with minimal content. It has just two paragraphs for basic testing.";

/**
 * Expected extraction results for the complex HTML (partial match)
 */
export const COMPLEX_HTML_EXTRACTED_PARTS = [
  "Complex Article Title",
  "This is the first paragraph of the complex article with bold text and emphasized text.",
  "This is the second paragraph with some links and special characters: & < > \" '",
  "Article Section",
  "This is a section of the article with more detailed content.",
  "List item one",
  "List item two with formatting",
  "This is a blockquote with important information that should be extracted.",
];

/**
 * Expected extraction results for the special characters HTML
 */
export const SPECIAL_CHARS_HTML_EXTRACTED =
  "Special & Characters This page tests special characters: <tag> \"quotes\" & ampersands. It also includes numeric entities: 'apostrophe' and — em dash.";

// ============================================================================
// Mock Summaries
// ============================================================================

/**
 * Mock summary for the simple HTML
 */
export const SIMPLE_HTML_SUMMARY =
  "This is a simple test article with minimal content. It contains two paragraphs for basic testing purposes.";

/**
 * Mock summary for the complex HTML
 */
export const COMPLEX_HTML_SUMMARY =
  `The article titled "Complex Article Title" discusses a topic with several key points.

The content is organized into sections, with the main section providing an overview of the topic. It includes formatted text elements like bold and emphasized text, as well as links to external resources.

A secondary section labeled "Article Section" provides more detailed information, presented in both paragraph form and as a bulleted list with two items. The article also includes a blockquote containing important information that emphasizes a key point.`;

/**
 * Mock summary for the special characters HTML
 */
export const SPECIAL_CHARS_HTML_SUMMARY =
  "This page demonstrates the use of special characters and HTML entities in web content. It shows how characters like angle brackets, quotes, ampersands, apostrophes, and em dashes can be properly encoded and displayed in HTML documents.";

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Setup mocks for file system operations
 *
 * @param htmlContent The HTML content to return from readTextFile
 * @returns Object with captured write information and restore function
 */
export function setupFileMocks(htmlContent: string = SIMPLE_HTML) {
  // Store original functions
  const originalReadTextFile = Deno.readTextFile;
  const originalWriteTextFile = Deno.writeTextFile;
  const originalMkdir = Deno.mkdir;
  const originalStat = Deno.stat;

  // Captured write information
  let writtenContent = "";
  let writtenPath = "";

  // Mock Deno.readTextFile to return provided HTML
  // @ts-ignore: Mocking for test purposes
  Deno.readTextFile = () => Promise.resolve(htmlContent);

  // Mock Deno.writeTextFile to capture written content
  // @ts-ignore: Mocking for test purposes
  Deno.writeTextFile = (path, content) => {
    writtenPath = String(path);
    writtenContent = String(content);
    return Promise.resolve();
  };

  // Mock Deno.mkdir to do nothing
  // @ts-ignore: Mocking for test purposes
  Deno.mkdir = () => Promise.resolve();

  // Mock Deno.stat to simulate file/directory exists
  // @ts-ignore: Mocking for test purposes
  Deno.stat = (path) => {
    // For the output path check in saveProcessedContent
    if (path.toString().includes("test-input-summary.md")) {
      // First call should return NotFound to allow writing
      // Subsequent calls should return file exists
      if (!writtenPath) {
        throw new Deno.errors.NotFound();
      }
    }

    return Promise.resolve({
      isFile: true,
      isDirectory: () => true,
      isSymlink: false,
      size: 0,
      mtime: new Date(),
      atime: new Date(),
      birthtime: new Date(),
      dev: 0,
      ino: 0,
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      rdev: 0,
      blksize: 0,
      blocks: 0,
    } as unknown as Deno.FileInfo);
  };

  // Return captured information and restore function
  return {
    getWrittenContent: () => writtenContent,
    getWrittenPath: () => writtenPath,
    restore: () => {
      Deno.readTextFile = originalReadTextFile;
      Deno.writeTextFile = originalWriteTextFile;
      Deno.mkdir = originalMkdir;
      Deno.stat = originalStat;
    },
  };
}

/**
 * Setup mocks for Ollama API
 *
 * @param mockSummary The summary to return from the mock
 * @returns Object with restore function
 */
export function setupOllamaMock(mockSummary: string) {
  // Store original fetch
  const originalFetch = globalThis.fetch;

  // Mock fetch to return a successful response with the mock summary
  // @ts-ignore: Mocking for test purposes
  globalThis.fetch = (url, options) => {
    // Check if this is an Ollama API call
    if (url.toString().includes("localhost:11434")) {
      // Parse the request body to determine the appropriate response format
      let requestBody = {};
      if (options && options.body) {
        try {
          requestBody = JSON.parse(options.body.toString());
        } catch (_e) {
          // Ignore parsing errors
        }
      }

      // Check if this is a chat completion request
      if (requestBody && "messages" in requestBody) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              message: { content: mockSummary },
            }),
        } as Response);
      } else {
        // For other Ollama API calls
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              response: mockSummary,
            }),
        } as Response);
      }
    }

    // Fall back to original fetch for other URLs
    return originalFetch(url, options);
  };

  // Return restore function
  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}
