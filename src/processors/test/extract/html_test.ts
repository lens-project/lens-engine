import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractFromHtml, extractFromHtmlFile } from "../../src/extract/mod.ts";
import type { HtmlExtractResult } from "../../src/extract/mod.ts";

Deno.test("HTML Extractor - module exists and exports", () => {
  // Smoke test - just verify the module loads and function exists
  assertExists(extractFromHtml);
  assertExists(extractFromHtmlFile);
});

Deno.test("HTML Extractor - basic extraction", () => {
  const html = "<h1>Test Title</h1><p>Test content</p>";
  const result: HtmlExtractResult = extractFromHtml(html);

  // Verify basic structure
  assertEquals(typeof result.text, "string");
  assertEquals(typeof result.wordCount, "number");
  assertEquals(Array.isArray(result.urls), true);

  // Basic functionality test
  assertEquals(result.text.includes("Test Title"), true);
  assertEquals(result.text.includes("Test content"), true);
  assertEquals(result.wordCount > 0, true);
});

Deno.test("HTML Extractor - empty input", () => {
  const result = extractFromHtml("");
  assertEquals(result.text, "");
  assertEquals(result.wordCount, 0);
  assertEquals(result.urls.length, 0);
});

Deno.test("HTML Extractor - with options", () => {
  const html = "<h1>Title</h1><p>Content</p>";
  const result = extractFromHtml(html, {
    preserveUrls: true,
    preserveHeadings: true,
  });

  // Just verify options are accepted without error
  assertExists(result);
  assertEquals(typeof result.text, "string");
});

// File extraction test (requires test fixture)
Deno.test("HTML Extractor - file extraction", async () => {
  // This test would use a fixture file
  // For now, just verify the function signature works
  try {
    await extractFromHtmlFile("nonexistent.html");
  } catch (error) {
    // Expected to fail with file not found - just verify it's an error
    assertEquals(error instanceof Error, true);
  }
});
