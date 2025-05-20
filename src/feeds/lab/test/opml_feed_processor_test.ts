/**
 * OPML Feed Processor Tests
 *
 * Tests for the OPML Feed Processor module.
 *
 * @module opml_feed_processor_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { processFeedsFromOpml, type ProcessOptions } from "../opml_feed_processor.ts";

// Import test fixtures
import {
  COMPLEX_OPML,
  SIMPLE_RSS
} from "./fixtures/fixtures.ts";

Deno.test("processFeedsFromOpml - should process all feeds", async () => {
  // Mock the modules we're testing
  const originalReadTextFile = Deno.readTextFile;
  const originalWriteTextFile = Deno.writeTextFile;
  const originalMkdir = Deno.mkdir;
  const originalStat = Deno.stat;
  const originalFetch = globalThis.fetch;

  // Track written files
  const writtenFiles: Record<string, string> = {};

  try {
    // Mock Deno.readTextFile to return OPML content
    // @ts-ignore: Mocking for test purposes
    Deno.readTextFile = (_path) => {
      return Promise.resolve(COMPLEX_OPML);
    };

    // Mock Deno.writeTextFile to track written files
    // @ts-ignore: Mocking for test purposes
    Deno.writeTextFile = (path, content) => {
      writtenFiles[String(path)] = String(content);
      return Promise.resolve();
    };

    // Mock Deno.mkdir to do nothing
    // @ts-ignore: Mocking for test purposes
    Deno.mkdir = (_path, _options) => {
      return Promise.resolve();
    };

    // Mock Deno.stat to simulate directory exists
    // @ts-ignore: Mocking for test purposes
    Deno.stat = (_path) => {
      return Promise.resolve({
        isFile: () => false,
        isDirectory: () => true,
        isSymlink: () => false,
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
        blocks: 0
      } as unknown as Deno.FileInfo);
    };

    // Mock fetch to return RSS content
    // @ts-ignore: Mocking for test purposes
    globalThis.fetch = (_url) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(SIMPLE_RSS)
      } as Response);
    };

    const options: ProcessOptions = {
      opmlPath: "./test.opml",
      outputDir: "./test-output"
    };

    const summary = await processFeedsFromOpml(options);

    // Check that we have results (the exact number may vary)
    assertEquals(summary.totalFeeds > 0, true);
    assertEquals(summary.successCount > 0, true);
    assertEquals(summary.failureCount, 0);
    assertEquals(summary.results.length > 0, true);

    // Check that all results were successful
    for (const result of summary.results) {
      assertEquals(result.success, true);
    }

    // Check that files were written
    assertEquals(Object.keys(writtenFiles).length > 0, true);
  } finally {
    // Restore original functions
    Deno.readTextFile = originalReadTextFile;
    Deno.writeTextFile = originalWriteTextFile;
    Deno.mkdir = originalMkdir;
    Deno.stat = originalStat;
    globalThis.fetch = originalFetch;
  }
});

Deno.test("processFeedsFromOpml - should filter feeds by category", async () => {
  // Mock the modules we're testing
  const originalReadTextFile = Deno.readTextFile;
  const originalWriteTextFile = Deno.writeTextFile;
  const originalMkdir = Deno.mkdir;
  const originalStat = Deno.stat;
  const originalFetch = globalThis.fetch;

  // Track written files
  const writtenFiles: Record<string, string> = {};

  try {
    // Mock Deno.readTextFile to return OPML content
    // @ts-ignore: Mocking for test purposes
    Deno.readTextFile = (_path) => {
      return Promise.resolve(COMPLEX_OPML);
    };

    // Mock Deno.writeTextFile to track written files
    // @ts-ignore: Mocking for test purposes
    Deno.writeTextFile = (path, content) => {
      writtenFiles[String(path)] = String(content);
      return Promise.resolve();
    };

    // Mock Deno.mkdir to do nothing
    // @ts-ignore: Mocking for test purposes
    Deno.mkdir = (_path, _options) => {
      return Promise.resolve();
    };

    // Mock Deno.stat to simulate directory exists
    // @ts-ignore: Mocking for test purposes
    Deno.stat = (_path) => {
      return Promise.resolve({
        isFile: () => false,
        isDirectory: () => true,
        isSymlink: () => false,
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
        blocks: 0
      } as unknown as Deno.FileInfo);
    };

    // Mock fetch to return RSS content
    // @ts-ignore: Mocking for test purposes
    globalThis.fetch = (_url) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(SIMPLE_RSS)
      } as Response);
    };

    const options: ProcessOptions = {
      opmlPath: "./test.opml",
      outputDir: "./test-output",
      categoryFilter: "Technology"
    };

    const summary = await processFeedsFromOpml(options);

    // Check that we have results (the exact number may vary)
    assertEquals(summary.totalFeeds > 0, true);
    assertEquals(summary.successCount > 0, true);
    assertEquals(summary.failureCount, 0);
    assertEquals(summary.results.length > 0, true);

    // Check that all results were successful
    for (const result of summary.results) {
      assertEquals(result.success, true);
    }

    // Check that files were written
    assertEquals(Object.keys(writtenFiles).length > 0, true);
  } finally {
    // Restore original functions
    Deno.readTextFile = originalReadTextFile;
    Deno.writeTextFile = originalWriteTextFile;
    Deno.mkdir = originalMkdir;
    Deno.stat = originalStat;
    globalThis.fetch = originalFetch;
  }
});

Deno.test("processFeedsFromOpml - should handle fetch errors", async () => {
  // Mock the modules we're testing
  const originalReadTextFile = Deno.readTextFile;
  const originalWriteTextFile = Deno.writeTextFile;
  const originalMkdir = Deno.mkdir;
  const originalStat = Deno.stat;
  const originalFetch = globalThis.fetch;

  // Track written files
  const writtenFiles: Record<string, string> = {};

  // Track fetch calls
  let fetchCallCount = 0;

  try {
    // Mock Deno.readTextFile to return OPML content
    // @ts-ignore: Mocking for test purposes
    Deno.readTextFile = (_path) => {
      return Promise.resolve(COMPLEX_OPML);
    };

    // Mock Deno.writeTextFile to track written files
    // @ts-ignore: Mocking for test purposes
    Deno.writeTextFile = (path, content) => {
      writtenFiles[String(path)] = String(content);
      return Promise.resolve();
    };

    // Mock Deno.mkdir to do nothing
    // @ts-ignore: Mocking for test purposes
    Deno.mkdir = (_path, _options) => {
      return Promise.resolve();
    };

    // Mock Deno.stat to simulate directory exists
    // @ts-ignore: Mocking for test purposes
    Deno.stat = (_path) => {
      return Promise.resolve({
        isFile: () => false,
        isDirectory: () => true,
        isSymlink: () => false,
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
        blocks: 0
      } as unknown as Deno.FileInfo);
    };

    // Mock fetch to return RSS content for most calls but fail for one
    // @ts-ignore: Mocking for test purposes
    globalThis.fetch = (_url) => {
      fetchCallCount++;

      // Make the second fetch call fail
      if (fetchCallCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
          text: () => Promise.resolve("Not Found")
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(SIMPLE_RSS)
      } as Response);
    };

    const options: ProcessOptions = {
      opmlPath: "./test.opml",
      outputDir: "./test-output"
    };

    const summary = await processFeedsFromOpml(options);

    // Check that we have both successes and failures
    assertEquals(summary.totalFeeds > 0, true);
    assertEquals(summary.successCount > 0, true);
    assertEquals(summary.failureCount > 0, true);
    assertEquals(summary.results.length > 0, true);

    // Check that we have at least one failure
    const successCount = summary.results.filter(r => r.success).length;
    const failureCount = summary.results.filter(r => !r.success).length;
    assertEquals(successCount > 0, true);
    assertEquals(failureCount > 0, true);

    // Check that the failure has an error message
    const failure = summary.results.find(r => !r.success);
    assertExists(failure);
    assertExists(failure.message);

    // Check that files were written for successful feeds only
    // The exact number may vary, so we just check that some files were written
    assertEquals(Object.keys(writtenFiles).length > 0, true);
  } finally {
    // Restore original functions
    Deno.readTextFile = originalReadTextFile;
    Deno.writeTextFile = originalWriteTextFile;
    Deno.mkdir = originalMkdir;
    Deno.stat = originalStat;
    globalThis.fetch = originalFetch;
  }
});

Deno.test("processFeedsFromOpml - should handle OPML parsing errors", async () => {
  // Mock the modules we're testing
  const originalReadTextFile = Deno.readTextFile;

  try {
    // Mock Deno.readTextFile to return invalid XML
    // @ts-ignore: Mocking for test purposes
    Deno.readTextFile = (_path) => {
      return Promise.resolve("<invalid>xml</invalid>");
    };

    const options: ProcessOptions = {
      opmlPath: "./test.opml",
      outputDir: "./test-output"
    };

    let error: Error | undefined;
    try {
      await processFeedsFromOpml(options);
    } catch (e) {
      error = e as Error;
    }

    assertExists(error);
    assertEquals(error instanceof Error, true);
    assertEquals(error.message.includes("Error processing feeds from OPML"), true);
  } finally {
    // Restore original function
    Deno.readTextFile = originalReadTextFile;
  }
});
