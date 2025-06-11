/**
 * Test Fixtures for Content Fetcher Tests
 *
 * This module provides test fixtures for the content fetcher tests:
 * - Sample HTML content with different structures
 * - Sample JSON feed data with different formats
 * - Mock functions for network and file system operations
 * - Helper functions for testing
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
  <h1>Simple Test Content</h1>
  <p>This is a simple test page for the content fetcher.</p>
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
  <meta name="description" content="A complex test page for content fetching">
  <style>
    body { font-family: Arial, sans-serif; }
    .content { margin: 20px; }
  </style>
  <script>
    console.log("This is a test script");
  </script>
</head>
<body>
  <header>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>

  <main class="content">
    <h1>Complex Test Content</h1>
    <p>This is a complex test page with multiple elements.</p>

    <h2>Section 1</h2>
    <p>This is the first section of the test page.</p>

    <h2>Section 2</h2>
    <p>This is the second section with a <a href="https://example.com">link</a>.</p>

    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </main>

  <footer>
    <p>&copy; 2025 Test Site</p>
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
</body>
`;

// ============================================================================
// Sample JSON Feed Data
// ============================================================================

/**
 * Simple JSON feed with a few items
 */
export const SIMPLE_FEED = {
  title: "Simple Test Feed",
  link: "https://example.com",
  items: [
    {
      title: "Article 1",
      link: "https://example.com/article1",
      pubDate: "2025-01-01",
    },
    {
      title: "Article 2",
      link: "https://example.com/article2",
      pubDate: "2025-01-02",
    },
  ],
};

/**
 * Complex JSON feed with many items and nested structures
 */
export const COMPLEX_FEED = {
  title: "Complex Test Feed",
  link: "https://example.com",
  description: "A complex test feed with many items",
  language: "en",
  copyright: "Copyright 2025",
  items: [
    {
      title: "Article 1",
      link: "https://example.com/article1",
      pubDate: "2025-01-01",
      author: "Test Author 1",
      categories: ["Technology", "Web"],
      content: "This is the content of article 1",
    },
    {
      title: "Article 2",
      link: "https://example.com/article2",
      pubDate: "2025-01-02",
      author: "Test Author 2",
      categories: ["Science", "Research"],
      content: "This is the content of article 2",
    },
    {
      title: "Article 3",
      link: "https://example.com/article3",
      pubDate: "2025-01-03",
      author: "Test Author 3",
      categories: ["Health", "Wellness"],
      content: "This is the content of article 3",
    },
  ],
};

/**
 * Empty JSON feed with no items
 */
export const EMPTY_FEED = {
  title: "Empty Test Feed",
  link: "https://example.com",
  items: [],
};

/**
 * Invalid JSON feed with missing required fields
 */
export const INVALID_FEED = {
  title: "Invalid Test Feed",
  // Missing link field
  items: [
    {
      title: "Article without link",
      // Missing link field
      pubDate: "2025-01-01",
    },
  ],
};

// ============================================================================
// Mock Functions
// ============================================================================

// Import ensureDir for mocking
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

/**
 * Setup mocks for file system operations
 *
 * @param jsonContent The JSON content to return from readTextFile for JSON files
 * @param htmlContent The HTML content to return from readTextFile for HTML files
 * @returns Object with captured write information and restore function
 */
export function setupFileMocks(
  jsonContent: Record<string, unknown> = SIMPLE_FEED,
  htmlContent: string = SIMPLE_HTML,
) {
  // Store original functions
  const originalReadTextFile = Deno.readTextFile;
  const originalWriteTextFile = Deno.writeTextFile;
  const originalMkdir = Deno.mkdir;
  const originalStat = Deno.stat;
  const _originalEnsureDirFn = ensureDir; // Prefixed with _ to indicate it's intentionally unused

  // Captured write information
  const writtenFiles: Record<string, string> = {};
  const createdDirs: string[] = [];

  // Mock Deno.readTextFile to return provided content based on file extension
  // @ts-ignore: Mocking for test purposes
  Deno.readTextFile = (path) => {
    const pathStr = String(path);

    if (pathStr.endsWith(".json")) {
      return Promise.resolve(JSON.stringify(jsonContent));
    } else if (pathStr.endsWith(".html") || pathStr.endsWith(".htm")) {
      return Promise.resolve(htmlContent);
    } else {
      throw new Deno.errors.NotFound(`File not found: ${pathStr}`);
    }
  };

  // Mock Deno.writeTextFile to capture written content
  // @ts-ignore: Mocking for test purposes
  Deno.writeTextFile = (path, content) => {
    const pathStr = String(path);
    writtenFiles[pathStr] = String(content);
    return Promise.resolve();
  };

  // Mock Deno.mkdir to track created directories
  // @ts-ignore: Mocking for test purposes
  Deno.mkdir = (path, _options) => {
    const pathStr = String(path);
    createdDirs.push(pathStr);
    return Promise.resolve();
  };

  // Mock Deno.stat to simulate file/directory exists
  // @ts-ignore: Mocking for test purposes
  Deno.stat = (path) => {
    const pathStr = String(path);

    // If the path is in writtenFiles, it's a file
    if (pathStr in writtenFiles) {
      return Promise.resolve({
        isFile: true,
        isDirectory: () => false,
        isSymlink: false,
        size: writtenFiles[pathStr].length,
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
    }

    // If the path is in createdDirs, it's a directory
    if (createdDirs.includes(pathStr)) {
      return Promise.resolve({
        isFile: false,
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
    }

    // Otherwise, the file/directory doesn't exist
    throw new Deno.errors.NotFound(`File not found: ${pathStr}`);
  };

  // Mock ensureDir to track created directories
  // @ts-ignore: Mocking for test purposes
  globalThis.ensureDir = (path: string) => {
    const pathStr = String(path);
    createdDirs.push(pathStr);
    return Promise.resolve();
  };

  // Return captured information and restore function
  return {
    getWrittenFiles: () => writtenFiles,
    getCreatedDirs: () => createdDirs,
    restore: () => {
      Deno.readTextFile = originalReadTextFile;
      Deno.writeTextFile = originalWriteTextFile;
      Deno.mkdir = originalMkdir;
      Deno.stat = originalStat;
      // @ts-ignore: Restoring global function
      delete globalThis.ensureDir;
    },
  };
}

/**
 * Setup mocks for network operations
 *
 * @param responseMap Map of URLs to response content
 * @returns Object with restore function
 */
export function setupNetworkMocks(responseMap: Record<string, {
  content: string;
  status: number;
  ok: boolean;
}> = {}) {
  // Store original fetch
  const originalFetch = globalThis.fetch;

  // Default response for any URL not in the map
  const defaultResponse = {
    content: SIMPLE_HTML,
    status: 200,
    ok: true,
  };

  // Mock fetch to return responses from the map
  // @ts-ignore: Mocking for test purposes
  globalThis.fetch = (url, _options) => {
    const urlStr = String(url);

    // Find the closest matching URL in the map
    const matchingUrl = Object.keys(responseMap).find((key) =>
      urlStr.includes(key)
    );
    const response = matchingUrl ? responseMap[matchingUrl] : defaultResponse;

    return Promise.resolve({
      ok: response.ok,
      status: response.status,
      statusText: response.ok ? "OK" : "Error",
      text: () => Promise.resolve(response.content),
    } as Response);
  };

  // Return restore function
  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

/**
 * Setup mocks for environment variables
 *
 * @param envVars Map of environment variables to values
 * @returns Object with restore function
 */
export function setupEnvMocks(envVars: Record<string, string> = {}) {
  // Store original env.get
  const originalGet = Deno.env.get;
  const originalSet = Deno.env.set;

  // Mock env.get to return values from the map
  // @ts-ignore: Mocking for test purposes
  Deno.env.get = (key) => {
    return key in envVars ? envVars[key] : null;
  };

  // Mock env.set to update the map
  // @ts-ignore: Mocking for test purposes
  Deno.env.set = (key, value) => {
    envVars[key] = value;
  };

  // Return restore function
  return {
    restore: () => {
      Deno.env.get = originalGet;
      Deno.env.set = originalSet;
    },
  };
}
