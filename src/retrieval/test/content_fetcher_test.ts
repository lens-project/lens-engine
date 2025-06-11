/**
 * Tests for the Content Fetcher module
 *
 * This module contains tests for the content fetcher functionality.
 * It tests the core functions for fetching and saving content from URLs.
 *
 * The tests use fixtures and mocks to avoid making actual network requests during testing.
 */

import { assertEquals, assertExists } from "@std/assert";

import {
  createFilenameFromUrl,
  extractUrls,
  fetchAllContent,
  fetchAndSaveContent,
  fetchContent,
  loadJsonFile,
  processBatch,
  sanitizeFilename,
  saveContent,
} from "../src/content_fetcher.ts";

import { FetchResult } from "../types.ts";

// Import test fixtures
import {
  COMPLEX_FEED,
  COMPLEX_HTML,
  EMPTY_FEED,
  INVALID_FEED,
  MALFORMED_HTML,
  setupEnvMocks,
  setupFileMocks,
  setupNetworkMocks,
  SIMPLE_FEED,
  SIMPLE_HTML,
  SPECIAL_CHARS_HTML,
} from "./fixtures/fixtures.ts";

Deno.test("sanitizeFilename - should sanitize filenames correctly", () => {
  assertEquals(sanitizeFilename("test file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename("test/file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename("test\\file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename("test?file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename("test:file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename("test*file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename("test|file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename('test"file.txt'), "test_file.txt");
  assertEquals(sanitizeFilename("test<file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename("test>file.txt"), "test_file.txt");
  assertEquals(sanitizeFilename("TEST FILE.TXT"), "test_file.txt");
});

Deno.test("createFilenameFromUrl - should create filenames from URLs correctly", () => {
  assertEquals(
    createFilenameFromUrl("https://example.com/article"),
    "article.html",
  );
  assertEquals(
    createFilenameFromUrl("https://example.com/article/"),
    "article.html",
  );
  assertEquals(
    createFilenameFromUrl("https://example.com/path/to/article"),
    "article.html",
  );
  assertEquals(
    createFilenameFromUrl("https://example.com"),
    "example.com.html",
  );
  assertEquals(
    createFilenameFromUrl("https://example.com/article?param=value"),
    "article.html",
  );
  assertEquals(
    createFilenameFromUrl("https://example.com/article#section"),
    "article.html",
  );
  assertEquals(
    createFilenameFromUrl("https://example.com/article-with-dashes"),
    "article-with-dashes.html",
  );
  assertEquals(
    createFilenameFromUrl("https://example.com/article_with_underscores"),
    "article_with_underscores.html",
  );
});

Deno.test("fetchContent - should fetch content successfully", async () => {
  // Setup network mock to return simple HTML
  const networkMock = setupNetworkMocks({
    "example.com": { content: SIMPLE_HTML, status: 200, ok: true },
  });

  try {
    const result = await fetchContent({ url: "https://example.com/article" });
    assertEquals(result, SIMPLE_HTML);
  } finally {
    networkMock.restore();
  }
});

Deno.test("fetchContent - should handle fetch errors", async () => {
  // Setup network mock to return an error
  const networkMock = setupNetworkMocks({
    "example.com/not-found": { content: "Not Found", status: 404, ok: false },
  });

  try {
    let error;
    try {
      await fetchContent({ url: "https://example.com/not-found" });
    } catch (e) {
      error = e;
    }
    assertExists(error);
    assertEquals(
      (error as Error).message.includes("Failed to fetch content: 404"),
      true,
    );
  } finally {
    networkMock.restore();
  }
});

Deno.test("extractUrls - should extract URLs from JSON data", () => {
  const urls = extractUrls(SIMPLE_FEED);
  assertEquals(urls, [
    "https://example.com/article1",
    "https://example.com/article2",
  ]);
});

Deno.test("extractUrls - should handle empty or invalid data", () => {
  assertEquals(extractUrls({}), []);
  assertEquals(extractUrls(EMPTY_FEED), []);
  assertEquals(extractUrls(INVALID_FEED), []);
});

Deno.test("fetchAndSaveContent - should fetch and save content", async () => {
  // Setup network mock to return complex HTML
  const networkMock = setupNetworkMocks({
    "example.com/article": { content: COMPLEX_HTML, status: 200, ok: true },
  });

  // Setup file system mocks
  const fileMocks = setupFileMocks();

  try {
    const result = await fetchAndSaveContent(
      "https://example.com/article",
      "./tmp/data/fetched",
    );

    // Check the result
    assertEquals(result.success, true);
    assertEquals(result.url, "https://example.com/article");
    assertExists(result.path);
    assertEquals(result.path?.includes("article"), true);

    // Check that the file was written
    const writtenFiles = fileMocks.getWrittenFiles();
    const fileKeys = Object.keys(writtenFiles);
    assertEquals(fileKeys.length > 0, true);
    assertEquals(fileKeys.some((key) => key.includes("article")), true);

    // Check that the content was written correctly
    const fileContent = Object.values(writtenFiles)[0];
    assertEquals(fileContent, COMPLEX_HTML);

    // Check that the directory was created
    const createdDirs = fileMocks.getCreatedDirs();
    assertEquals(
      createdDirs.includes("./tmp/data/fetched") ||
        createdDirs.some((dir) => dir.includes("fetched")),
      true,
    );
  } finally {
    networkMock.restore();
    fileMocks.restore();
  }
});

Deno.test("loadJsonFile - should load and parse JSON file", async () => {
  // Setup file system mocks to return a feed
  const fileMocks = setupFileMocks(COMPLEX_FEED);

  try {
    const result = await loadJsonFile("./test/fixtures/sample_feed.json");

    // Check that the result matches the feed
    assertEquals(result.title, COMPLEX_FEED.title);
    assertEquals(result.link, COMPLEX_FEED.link);

    // Check that items array exists and has the right length
    assertExists(result.items);
    const items = result.items as unknown[];
    assertEquals(Array.isArray(items), true);
    assertEquals(items.length, (COMPLEX_FEED.items as unknown[]).length);
  } finally {
    fileMocks.restore();
  }
});

Deno.test("processBatch - should process a batch of URLs", async () => {
  // Setup network mocks for different URLs
  const networkMock = setupNetworkMocks({
    "example.com/article1": { content: SIMPLE_HTML, status: 200, ok: true },
    "example.com/article2": { content: COMPLEX_HTML, status: 200, ok: true },
    "example.com/article3": {
      content: SPECIAL_CHARS_HTML,
      status: 200,
      ok: true,
    },
    "example.com/not-found": { content: "Not Found", status: 404, ok: false },
  });

  // Setup file system mocks
  const fileMocks = setupFileMocks();

  try {
    const urls = [
      "https://example.com/article1",
      "https://example.com/article2",
      "https://example.com/article3",
      "https://example.com/not-found",
    ];

    const results = await processBatch(
      urls,
      "./tmp/data/fetched",
      {
        concurrency: 2,
        timeout: 1000,
        overwrite: false,
      },
    );

    // Check the results array
    assertEquals(Array.isArray(results), true);
    assertEquals(results.length, 4);

    // Check that the successful URLs were processed
    const successfulResults = results.filter((r: FetchResult) => r.success);
    const successfulUrls = successfulResults.map((r: FetchResult) => r.url);
    assertEquals(successfulUrls.length, 3);
    assertEquals(successfulUrls.includes("https://example.com/article1"), true);
    assertEquals(successfulUrls.includes("https://example.com/article2"), true);
    assertEquals(successfulUrls.includes("https://example.com/article3"), true);

    // Check that the failed URL was recorded
    const failedResults = results.filter((r: FetchResult) => !r.success);
    const failedUrls = failedResults.map((r: FetchResult) => r.url);
    assertEquals(failedUrls.length, 1);
    assertEquals(failedUrls.includes("https://example.com/not-found"), true);

    // Check that files were written
    const writtenFiles = fileMocks.getWrittenFiles();
    const fileKeys = Object.keys(writtenFiles);
    assertEquals(fileKeys.length, 3); // 3 successful fetches
  } finally {
    networkMock.restore();
    fileMocks.restore();
  }
});

Deno.test("fetchAllContent - should fetch all content from a feed", async () => {
  // Setup environment variables
  const envMocks = setupEnvMocks({
    "LENS_DATA_DIR": "/tmp/lens",
  });

  // Setup network mocks
  const networkMock = setupNetworkMocks({
    "example.com/content-fetching": {
      content: SIMPLE_HTML,
      status: 200,
      ok: true,
    },
    "example.com/web-scraping": {
      content: COMPLEX_HTML,
      status: 200,
      ok: true,
    },
  });

  // Setup file system mocks
  const fileMocks = setupFileMocks(SIMPLE_FEED);

  try {
    const results = await fetchAllContent({
      jsonPath: "./test/fixtures/sample_feed.json",
      outputDir: "./tmp/data/fetched",
      concurrency: 2,
      timeout: 1000,
    });

    // Check the results array
    assertEquals(Array.isArray(results), true);
    assertEquals(results.length, 2);

    // Check that all URLs were successfully processed
    const successfulResults = results.filter((r: FetchResult) => r.success);
    assertEquals(successfulResults.length, 2);

    // Check that files were written
    const writtenFiles = fileMocks.getWrittenFiles();
    const fileKeys = Object.keys(writtenFiles);
    assertEquals(fileKeys.length >= 2, true); // At least 2 files (could be more due to the feed file)
  } finally {
    envMocks.restore();
    networkMock.restore();
    fileMocks.restore();
  }
});

Deno.test("saveContent - should save content to a file", async () => {
  // Setup file system mocks
  const fileMocks = setupFileMocks();

  try {
    // saveContent doesn't return a result, it just saves the content
    await saveContent(
      MALFORMED_HTML,
      {
        path: "./tmp/data/fetched/test.html",
        overwrite: true,
      },
    );

    // Check that the file was written
    const writtenFiles = fileMocks.getWrittenFiles();
    const fileKeys = Object.keys(writtenFiles);
    assertEquals(fileKeys.includes("./tmp/data/fetched/test.html"), true);

    // Check that the content was written correctly
    assertEquals(writtenFiles["./tmp/data/fetched/test.html"], MALFORMED_HTML);
  } finally {
    fileMocks.restore();
  }
});
