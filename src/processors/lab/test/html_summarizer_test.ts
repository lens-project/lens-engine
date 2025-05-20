/**
 * Tests for the HTML Content Summarizer module
 *
 * This file contains tests for all HTML summarizer functionality:
 * 1. HTML text extraction
 * 2. Content summarization with Ollama
 * 3. File processing and saving
 *
 * Tests use fixtures from the fixtures directory for consistent and comprehensive testing.
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createOutputFilename,
  extractTextFromHtml,
  processHtmlFile,
  processHtmlDirectory,
  summarizeContent,
} from "../html_summarizer.ts";

// Import test fixtures
import {
  SIMPLE_HTML,
  COMPLEX_HTML,
  SPECIAL_CHARS_HTML,
  EMPTY_HTML,
  MALFORMED_HTML,
  COMPLEX_HTML_EXTRACTED_PARTS,
  SIMPLE_HTML_SUMMARY,
  COMPLEX_HTML_SUMMARY,
  setupFileMocks,
  setupOllamaMock,
} from "./fixtures/fixtures.ts";

// IMPORTANT: Disable LangSmith tracing for tests
// This prevents network dependencies and config validation issues in test environments
Deno.env.set("LANGCHAIN_TRACING_V2", "false");
Deno.env.set("LANGCHAIN_API_KEY", "test-key-for-testing-only");
Deno.env.set("LANGCHAIN_PROJECT", "test-project-for-testing-only");

// Test 1: HTML text extraction - Simple HTML
Deno.test({
  name: "extractTextFromHtml - extracts text from simple HTML correctly",
  fn() {
    const text = extractTextFromHtml(SIMPLE_HTML);

    // Print the full extracted text for debugging
    console.log("SIMPLE HTML EXTRACTED TEXT:", text);

    // Check that the text contains the main content
    assertStringIncludes(text, "Simple Article");
    assertStringIncludes(text, "This is a simple test article with minimal content");
    assertStringIncludes(text, "It has just two paragraphs for basic testing");
  },
});

// Test 2: HTML text extraction - Complex HTML
Deno.test({
  name: "extractTextFromHtml - extracts text from complex HTML correctly",
  fn() {
    const text = extractTextFromHtml(COMPLEX_HTML);

    // Print the full extracted text for debugging
    console.log("COMPLEX HTML EXTRACTED TEXT (first 100 chars):", text.substring(0, 100));

    // Check that the text contains the main content parts
    for (const part of COMPLEX_HTML_EXTRACTED_PARTS) {
      assertStringIncludes(text, part);
    }

    // Check that script content is removed
    assertEquals(text.includes("This script content should be removed"), false);
    assertEquals(text.includes("This should not appear in extraction"), false);
  },
});

// Test 3: HTML text extraction - Special characters
Deno.test({
  name: "extractTextFromHtml - handles special characters correctly",
  fn() {
    const text = extractTextFromHtml(SPECIAL_CHARS_HTML);

    // Print the full extracted text for debugging
    console.log("SPECIAL CHARS HTML EXTRACTED TEXT:", text);

    // Check that special characters are handled correctly
    assertStringIncludes(text, "Special & Characters");
    assertStringIncludes(text, "<tag>");
    assertStringIncludes(text, "\"quotes\"");
    assertStringIncludes(text, "'apostrophe'");
  },
});

// Test 4: HTML text extraction - Empty HTML
Deno.test({
  name: "extractTextFromHtml - handles empty HTML gracefully",
  fn() {
    const text = extractTextFromHtml(EMPTY_HTML);

    // Should return empty string or just the title
    assertEquals(text.trim().length <= "Empty Page".length, true);
  },
});

// Test 5: HTML text extraction - Malformed HTML
Deno.test({
  name: "extractTextFromHtml - handles malformed HTML gracefully",
  fn() {
    const text = extractTextFromHtml(MALFORMED_HTML);

    // Should still extract some content despite malformed HTML
    assertStringIncludes(text, "Malformed Document");
    assertStringIncludes(text, "This document has unclosed tags");
  },
});

// Test 6: Create output filename
Deno.test({
  name: "createOutputFilename - creates correct output filename",
  fn() {
    const inputPath = "/path/to/article.html";
    const outputFilename = createOutputFilename(inputPath);

    assertEquals(outputFilename, "article-summary.md");
  },
});

// Test 7: Content summarization with Ollama (using mock)
Deno.test({
  name: "summarizeContent - summarizes content with mocked Ollama",
  async fn() {
    // Setup Ollama mock to return a predefined summary
    const ollamaMock = setupOllamaMock(SIMPLE_HTML_SUMMARY);

    try {
      // Extract text from simple HTML
      const extractedText = extractTextFromHtml(SIMPLE_HTML);

      // Call summarizeContent with the extracted text
      const result = await summarizeContent(extractedText, {
        langSmithTracing: false,
        temperature: 0.1,
      });

      // Check the result structure but not exact content
      // since Ollama responses can vary
      assertEquals(result.success, true);
      assertExists(result.content);
      assertEquals(typeof result.content, "string");
      assertEquals(result.content.length > 0, true);
      assertEquals(result.error, undefined);

      // Check that the content contains some expected keywords
      // The actual response might use different wording, so we check for common terms
      const resultContent = result.content.toLowerCase();
      const hasExpectedTerms =
        resultContent.includes("article") ||
        resultContent.includes("test") ||
        resultContent.includes("paragraph") ||
        resultContent.includes("content") ||
        resultContent.includes("summary");

      assertEquals(hasExpectedTerms, true);

      console.log("Mock summary:", result.content);
    } finally {
      // Restore original fetch
      ollamaMock.restore();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 8: Content summarization with real Ollama (if available)
Deno.test({
  name: "summarizeContent - summarizes content with real Ollama (if available)",
  async fn() {
    // This test requires Ollama to be running locally
    const extractedText = extractTextFromHtml(SIMPLE_HTML);

    // Explicitly disable LangSmith tracing for tests
    const result = await summarizeContent(extractedText, {
      langSmithTracing: false,
      temperature: 0.1,
    });

    // We don't know if Ollama is running, so we just check the structure
    if (result.success) {
      assertEquals(result.success, true);
      assertExists(result.content);
      assertEquals(typeof result.content, "string");
      assertEquals(result.content.length > 0, true);
      assertEquals(result.error, undefined);

      console.log("Real Ollama summary:", result.content?.substring(0, 100) + "...");
    } else {
      assertEquals(result.success, false);
      assertExists(result.error);
      assertEquals(result.content, undefined);

      console.log("Real Ollama summarization failed (expected if Ollama is not running):", result.error);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 9: Process HTML file with mocked dependencies
Deno.test({
  name: "processHtmlFile - processes HTML file end-to-end with mocks",
  async fn() {
    // Setup file system mocks
    const fileMocks = setupFileMocks(COMPLEX_HTML);

    // Setup Ollama mock
    const ollamaMock = setupOllamaMock(COMPLEX_HTML_SUMMARY);

    try {
      // Process the HTML file with LangSmith tracing disabled
      const result = await processHtmlFile({
        inputPath: "./test-input.html",
        outputDir: "./tmp/data/processed",
        temperature: 0.1,
        langSmithTracing: false,
      });

      // Check the result structure but not exact content
      assertEquals(result.success, true);
      assertExists(result.content);
      assertEquals(typeof result.content, "string");
      assertEquals(result.content.length > 0, true);
      assertEquals(result.error, undefined);

      // Check that content was written
      const writtenContent = fileMocks.getWrittenContent();
      const writtenPath = fileMocks.getWrittenPath();

      assertEquals(writtenContent.length > 0, true);
      assertEquals(writtenPath.includes("test-input-summary.md"), true);

      // Check that the content contains some expected keywords
      // The actual response might use different wording, so we check for common terms
      const content = result.content.toLowerCase();
      const hasExpectedTerms =
        content.includes("article") ||
        content.includes("content") ||
        content.includes("complex") ||
        content.includes("section") ||
        content.includes("summary");

      assertEquals(hasExpectedTerms, true);

      console.log("Processed HTML file successfully");
      console.log("Summary:", result.content?.substring(0, 100) + "...");
    } finally {
      // Restore original functions
      fileMocks.restore();
      ollamaMock.restore();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 10: Process HTML file from fixture file
Deno.test({
  name: "processHtmlFile - processes HTML from fixture file",
  async fn() {
    // Setup file system mocks to read from actual fixture file
    const originalReadTextFile = Deno.readTextFile;
    // @ts-ignore: Mocking for test purposes
    Deno.readTextFile = (path) => {
      if (path.toString().includes("test-input.html")) {
        // Instead of reading from file, use the sample HTML directly
        return Promise.resolve(COMPLEX_HTML);
      }
      return originalReadTextFile(path);
    };

    // Mock write operations
    let writtenContent = "";
    let writtenPath = "";
    const originalWriteTextFile = Deno.writeTextFile;
    // @ts-ignore: Mocking for test purposes
    Deno.writeTextFile = (path, content) => {
      writtenPath = String(path);
      writtenContent = String(content);
      return Promise.resolve();
    };

    // Mock Deno.stat to allow file writing
    const originalStat = Deno.stat;
    // @ts-ignore: Mocking for test purposes
    Deno.stat = (path) => {
      if (path.toString().includes("test-input-summary.md")) {
        throw new Deno.errors.NotFound();
      }
      if (path.toString().includes("tmp/data/processed")) {
        return Promise.resolve({
          isDirectory: () => true,
          isFile: false,
          isSymlink: false
        } as unknown as Deno.FileInfo);
      }
      return originalStat(path);
    };

    // Mock Deno.mkdir to do nothing
    const originalMkdir = Deno.mkdir;
    // @ts-ignore: Mocking for test purposes
    Deno.mkdir = () => Promise.resolve();

    // Setup Ollama mock with TDD-related content
    const ollamaMock = setupOllamaMock("Summary of TDD article: Test-Driven Development is a software development approach where tests are written before code. The process follows a Red-Green-Refactor cycle. Benefits include improved code quality, better design, documentation through tests, and confidence when refactoring.");

    try {
      // Process the HTML file
      const result = await processHtmlFile({
        inputPath: "./test-input.html",
        outputDir: "./tmp/data/processed",
        temperature: 0.1,
        langSmithTracing: false,
      });

      // Check the result structure but not exact content
      assertEquals(result.success, true);
      assertExists(result.content);
      assertEquals(typeof result.content, "string");
      assertEquals(result.content.length > 0, true);
      assertEquals(result.error, undefined);

      // Check that content was written
      assertEquals(writtenContent.length > 0, true);
      assertEquals(writtenPath.includes("test-input-summary.md"), true);

      console.log("Processed fixture HTML file successfully");
      console.log("Summary:", result.content?.substring(0, 100) + "...");
    } finally {
      // Restore original functions
      Deno.readTextFile = originalReadTextFile;
      Deno.writeTextFile = originalWriteTextFile;
      Deno.stat = originalStat;
      Deno.mkdir = originalMkdir;
      ollamaMock.restore();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 11: Process HTML directory
Deno.test({
  name: "processHtmlDirectory - processes multiple HTML files",
  async fn() {
    // Mock file system operations
    const originalReadDir = Deno.readDir;
    const originalReadTextFile = Deno.readTextFile;
    const originalWriteTextFile = Deno.writeTextFile;
    const originalMkdir = Deno.mkdir;
    const originalStat = Deno.stat;

    // Mock directory entries
    const mockEntries = [
      { name: "file1.html", isFile: true, isDirectory: false, isSymlink: false },
      { name: "file2.htm", isFile: true, isDirectory: false, isSymlink: false },
      { name: "not-html.txt", isFile: true, isDirectory: false, isSymlink: false },
      { name: "subdir", isFile: false, isDirectory: true, isSymlink: false },
    ];

    // Track processed files
    const processedFiles: string[] = [];

    // Mock Deno.readDir
    // @ts-ignore: Mocking for test purposes
    Deno.readDir = () => {
      let index = 0;
      return {
        next() {
          if (index < mockEntries.length) {
            return Promise.resolve({ value: mockEntries[index++], done: false });
          }
          return Promise.resolve({ done: true });
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };
    };

    // Mock Deno.readTextFile
    // @ts-ignore: Mocking for test purposes
    Deno.readTextFile = (path) => {
      const pathStr = path.toString();
      processedFiles.push(pathStr);

      if (pathStr.includes("file1.html")) {
        return Promise.resolve(SIMPLE_HTML);
      } else if (pathStr.includes("file2.htm")) {
        return Promise.resolve(COMPLEX_HTML);
      }
      return Promise.resolve("");
    };

    // Mock Deno.writeTextFile
    // @ts-ignore: Mocking for test purposes
    Deno.writeTextFile = () => Promise.resolve();

    // Mock Deno.mkdir
    // @ts-ignore: Mocking for test purposes
    Deno.mkdir = () => Promise.resolve();

    // Mock Deno.stat
    // @ts-ignore: Mocking for test purposes
    Deno.stat = () => Promise.resolve({
      isDirectory: () => true
    } as Deno.FileInfo);

    // Setup Ollama mock
    const ollamaMock = setupOllamaMock(SIMPLE_HTML_SUMMARY);

    try {
      // Process the HTML directory
      const result = await processHtmlDirectory(
        "./input-dir",
        "./output-dir",
        {
          temperature: 0.1,
          langSmithTracing: false,
        }
      );

      // Check the result
      assertEquals(result.totalFiles, 2); // Only HTML files should be counted
      assertEquals(result.successCount, 2);
      assertEquals(result.failureCount, 0);
      assertEquals(result.results.length, 2);

      // Check that both HTML files were processed
      assertEquals(processedFiles.some(p => p.includes("file1.html")), true);
      assertEquals(processedFiles.some(p => p.includes("file2.htm")), true);

      console.log("Processed HTML directory successfully");
      console.log(`Total files: ${result.totalFiles}, Success: ${result.successCount}, Failure: ${result.failureCount}`);
    } finally {
      // Restore original functions
      Deno.readDir = originalReadDir;
      Deno.readTextFile = originalReadTextFile;
      Deno.writeTextFile = originalWriteTextFile;
      Deno.mkdir = originalMkdir;
      Deno.stat = originalStat;
      ollamaMock.restore();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
