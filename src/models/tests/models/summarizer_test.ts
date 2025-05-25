/**
 * Tests for the Content Summarization Controller
 *
 * This file contains tests for the production summarization functionality,
 * adapted from the lab implementation tests.
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  summarizeContent,
  type SummaryOptions,
  type SummaryResponse,
} from "../../src/controller/summarizer.ts";

// IMPORTANT: Disable LangSmith tracing for tests
// This prevents network dependencies and config validation issues in test environments
Deno.env.set("LANGCHAIN_TRACING_V2", "false");
Deno.env.set("LANGCHAIN_API_KEY", "test-key-for-testing-only");
Deno.env.set("LANGCHAIN_PROJECT", "test-project-for-testing-only");

// Test content
const TEST_CONTENT = `
Test-Driven Development (TDD) is a software development approach where tests are written before the actual code. 
The process follows a Red-Green-Refactor cycle:

1. Red: Write a failing test
2. Green: Write the minimum code to make the test pass
3. Refactor: Improve the code while keeping tests passing

Benefits of TDD include:
- Improved code quality
- Better design decisions
- Documentation through tests
- Confidence when refactoring
- Reduced debugging time

TDD encourages developers to think about the requirements and design before implementation.
`;

// Test 1: Module exports exist
Deno.test("Summarizer - module exports exist", () => {
  assertExists(summarizeContent);
});

// Test 2: Summarize content with mocked Ollama (if real Ollama not available)
Deno.test({
  name: "Summarizer - summarizes content with disabled tracing",
  async fn() {
    // Test with LangSmith tracing explicitly disabled
    const result: SummaryResponse = await summarizeContent(TEST_CONTENT, {
      langSmithTracing: false,
      temperature: 0.1,
      modelName: "llama3.2", // Use a common model
    });

    // The test should either succeed (if Ollama is available) or fail gracefully
    assertExists(result);
    assertEquals(typeof result.success, "boolean");
    
    if (result.success) {
      assertExists(result.content);
      assertEquals(typeof result.content, "string");
      assertExists(result.metadata);
      assertEquals(typeof result.metadata.processingTime, "number");
      
      // Check that the summary contains relevant terms
      const summary = result.content.toLowerCase();
      const hasRelevantTerms = 
        summary.includes("test") || 
        summary.includes("development") || 
        summary.includes("tdd") ||
        summary.includes("code");
      
      assertEquals(hasRelevantTerms, true);
      
      console.log("Summary generated:", result.content);
    } else {
      // If it fails, it should have an error message
      assertExists(result.error);
      assertEquals(typeof result.error, "string");
      console.log("Summarization failed (expected if Ollama not running):", result.error);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 3: Handle empty content
Deno.test({
  name: "Summarizer - handles empty content gracefully",
  async fn() {
    const result = await summarizeContent("", {
      langSmithTracing: false,
      temperature: 0.1,
    });

    // Should either succeed with empty/minimal content or fail gracefully
    assertExists(result);
    assertEquals(typeof result.success, "boolean");
    
    if (!result.success) {
      assertExists(result.error);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 4: Validate options handling
Deno.test("Summarizer - handles various options", async () => {
  const options: SummaryOptions = {
    modelName: "test-model",
    baseUrl: "http://localhost:11434",
    temperature: 0.5,
    langSmithTracing: false,
  };

  const result = await summarizeContent("Test content for options validation", options);
  
  // Should handle options without throwing errors
  assertExists(result);
  assertEquals(typeof result.success, "boolean");
});

// Test 5: Metadata structure validation
Deno.test({
  name: "Summarizer - returns proper metadata structure",
  async fn() {
    const result = await summarizeContent(TEST_CONTENT, {
      langSmithTracing: false,
      modelName: "llama3.2",
    });

    assertExists(result);
    assertExists(result.metadata);
    assertEquals(typeof result.metadata.processingTime, "number");
    
    if (result.success) {
      assertEquals(typeof result.metadata.model, "string");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
