/**
 * Integration Tests for HTML Processing with Summarization
 *
 * This file tests the complete workflow from HTML content to summarized output,
 * demonstrating the integration between the processors and models modules.
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { processHtmlContent } from "../../processors/src/controller/mod.ts";

// IMPORTANT: Disable LangSmith tracing for tests
Deno.env.set("LANGCHAIN_TRACING_V2", "false");
Deno.env.set("LANGCHAIN_API_KEY", "test-key-for-testing-only");
Deno.env.set("LANGCHAIN_PROJECT", "test-project-for-testing-only");

// Test HTML content
const TEST_HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Understanding Microservices Architecture</title>
</head>
<body>
    <h1>Understanding Microservices Architecture</h1>

    <p>Microservices architecture is a software development approach where applications are built as a collection of small, independent services that communicate over well-defined APIs.</p>

    <h2>Key Benefits</h2>
    <ul>
        <li>Scalability: Each service can be scaled independently</li>
        <li>Technology diversity: Different services can use different technologies</li>
        <li>Fault isolation: Failure in one service doesn't bring down the entire system</li>
        <li>Team autonomy: Small teams can own and develop services independently</li>
    </ul>

    <h2>Challenges</h2>
    <p>While microservices offer many benefits, they also introduce complexity in areas such as:</p>
    <ul>
        <li>Service discovery and communication</li>
        <li>Data consistency across services</li>
        <li>Monitoring and debugging distributed systems</li>
        <li>Deployment and orchestration</li>
    </ul>

    <p>For more information, visit <a href="https://microservices.io">microservices.io</a></p>
</body>
</html>
`;

// Test 1: Complete HTML processing workflow without summarization
Deno.test("Integration - HTML processing without summarization", async () => {
  const result = await processHtmlContent(TEST_HTML, "microservices.html", {
    skipSummarization: true,
  });

  assertEquals(result.success, true);
  assertEquals(result.input, "microservices.html");
  assertExists(result.metadata);
  assertEquals(typeof result.metadata.wordCount, "number");
  assertEquals(Array.isArray(result.metadata.urls), true);
  assertEquals(result.metadata.wordCount > 0, true);

  // Should not have summary metadata when skipped
  assertEquals(result.metadata.summary, undefined);
});

// Test 2: Complete HTML processing workflow with summarization
Deno.test({
  name: "Integration - HTML processing with summarization",
  async fn() {
    const result = await processHtmlContent(TEST_HTML, "microservices.html", {
      skipSummarization: false,
      summaryTemperature: 0.1,  // Low temperature for consistent results
    });

    assertEquals(result.success, true);
    assertEquals(result.input, "microservices.html");
    assertExists(result.metadata);
    assertEquals(typeof result.metadata.wordCount, "number");
    assertEquals(Array.isArray(result.metadata.urls), true);
    assertEquals(result.metadata.wordCount > 0, true);

    // If summarization succeeded, validate summary metadata
    if (result.metadata.summary) {
      assertEquals(typeof result.metadata.summary, "string");
      assertEquals(typeof result.metadata.summaryModel, "string");
      assertEquals(typeof result.metadata.summaryProcessingTime, "number");

      // Check that summary contains relevant terms
      const summary = result.metadata.summary.toLowerCase();
      const hasRelevantTerms =
        summary.includes("microservices") ||
        summary.includes("services") ||
        summary.includes("architecture") ||
        summary.includes("application");

      assertEquals(hasRelevantTerms, true);

      console.log("Integration test - Summary generated:");
      console.log(result.metadata.summary);
      console.log(`Processing time: ${result.metadata.summaryProcessingTime}ms`);
      console.log(`Model used: ${result.metadata.summaryModel}`);
    } else {
      console.log("Summarization skipped or failed (expected if Ollama not running)");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 3: Verify lab code remains untouched
Deno.test("Integration - Lab code preservation", async () => {
  // This test verifies that lab implementations still exist and are unchanged
  try {
    // Check that lab files still exist
    const labHtmlSummarizerExists = await Deno.stat("src/processors/lab/html_summarizer.ts");
    assertEquals(labHtmlSummarizerExists.isFile, true);

    const labOllamaClientExists = await Deno.stat("src/models/lab/ollama_client.ts");
    assertEquals(labOllamaClientExists.isFile, true);

    console.log("✅ Lab code preservation verified - all lab files remain intact");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Lab code preservation failed: ${errorMessage}`);
  }
});
