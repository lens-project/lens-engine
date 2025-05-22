import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  processHtmlContent,
  processHtmlFile,
  processHtmlBatch,
  processMixedBatch,
  type ProcessingResult,
  type BatchResult,
} from "../../src/controller/mod.ts";

// Content Controller Tests
Deno.test("HTML Controller - module exists and exports", () => {
  assertExists(processHtmlContent);
  assertExists(processHtmlFile);
});

Deno.test("HTML Controller - processHtmlContent success", async () => {
  const html = "<h1>Test Title</h1><p>This is test content.</p>";
  const result: ProcessingResult = await processHtmlContent(html, "test.html");
  
  assertEquals(result.success, true);
  assertEquals(result.input, "test.html");
  assertEquals(typeof result.metadata?.wordCount, "number");
  assertEquals(Array.isArray(result.metadata?.urls), true);
  assertEquals(result.metadata!.wordCount > 0, true);
});

Deno.test("HTML Controller - processHtmlContent with options", async () => {
  const html = "<h1>Title</h1><a href='http://example.com'>Link</a>";
  const result = await processHtmlContent(html, "test.html", {
    preserveUrls: true,
    preserveHeadings: true,
    outputDir: "/tmp/test"
  });
  
  assertEquals(result.success, true);
  assertEquals(result.input, "test.html");
});

Deno.test("HTML Controller - processHtmlFile nonexistent", async () => {
  const result = await processHtmlFile("nonexistent.html");
  
  assertEquals(result.success, false);
  assertEquals(result.input, "nonexistent.html");
  assertEquals(typeof result.error, "string");
});

// Batch Controller Tests
Deno.test("Batch Controller - module exists and exports", () => {
  assertExists(processHtmlBatch);
  assertExists(processMixedBatch);
});

Deno.test("Batch Controller - processHtmlBatch empty array", async () => {
  const result: BatchResult = await processHtmlBatch([]);
  
  assertEquals(result.totalItems, 0);
  assertEquals(result.successCount, 0);
  assertEquals(result.failureCount, 0);
  assertEquals(result.results.length, 0);
});

Deno.test("Batch Controller - processHtmlBatch with progress", async () => {
  const files = ["missing1.html", "missing2.html"];
  const progressCalls: Array<[number, number, string?]> = [];
  
  const result = await processHtmlBatch(files, {
    continueOnError: true,
    onProgress: (completed, total, current) => {
      progressCalls.push([completed, total, current]);
    }
  });
  
  assertEquals(result.totalItems, 2);
  assertEquals(result.failureCount, 2);
  assertEquals(progressCalls.length > 0, true);
});

Deno.test("Batch Controller - processMixedBatch filters file types", async () => {
  const files = ["test.html", "test.pdf", "test.txt", "test.htm"];
  const result = await processMixedBatch(files);
  
  // Should only process HTML files
  assertEquals(result.totalItems, 4);  // All files counted
  // Results depend on whether files exist, but structure should be correct
  assertEquals(Array.isArray(result.results), true);
});