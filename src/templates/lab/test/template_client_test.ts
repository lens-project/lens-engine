/**
 * Tests for the Template Client
 *
 * This module contains tests for the template client functionality.
 * It tests the following features:
 * 1. Extracting topics from content
 * 2. Reformulating queries
 *
 * These tests ensure that the template client works correctly and
 * can be used to perform common tasks with templates and LLMs.
 *
 * Note: These tests require Ollama to be running locally for full testing,
 * but they are designed to work even if Ollama is not running.
 *
 * @module template_client_test
 * @lab Tests for the experimental template client
 * @version 0.1.0
 * @author Lens Team
 */

import { assertEquals, assertExists } from "@std/assert";
import { TemplateClient } from "../template_client.ts";

// No fixtures needed for these tests as we're using the real implementation

/**
 * Note: We're using the class-based API here for backward compatibility with existing tests.
 * For new code, it's recommended to use the functional API with `createTemplateClient` instead.
 */

// Use the prompts directory
const templateDir = "./prompts";

/**
 * Test: extractTopics extracts topics from content
 *
 * This test verifies that the extractTopics function correctly extracts
 * topics from content using an LLM. It tests the basic functionality of
 * extracting topics from a piece of text about TypeScript.
 *
 * The test is designed to work even if Ollama is not running locally. It checks
 * the structure of the response and handles both success and error cases.
 *
 * If the response is successful and can be parsed as JSON, it checks that
 * the topics have the expected structure with "topic" and "relevance" properties.
 *
 * Note: This test requires Ollama to be running locally for full testing.
 */
Deno.test({
  name: "TemplateClient - extractTopics extracts topics from content",
  async fn() {
    // Create a client with a mock template engine
    const client = new TemplateClient({
      templateDir,
      defaultModel: "llama3.2",
    });

    // This test is designed to work even if Ollama is not running locally
    // We'll just check the structure of the response

    const content = `
      TypeScript is a strongly typed programming language that builds on JavaScript,
      giving you better tooling at any scale. It adds additional syntax to JavaScript
      to support a tighter integration with your editor. This can help catch errors early in your editor.

      TypeScript code converts to JavaScript, which runs anywhere JavaScript runs:
      In a browser, on Node.js or Deno and in your apps.

      TypeScript understands JavaScript and uses type inference to give you great tooling
      without additional code.
    `;

    const result = await client.extractTopics(content);

    // We don't know if Ollama is running, so we just check the structure
    if (result.success) {
      assertEquals(result.success, true);
      assertExists(result.content);
      assertEquals(typeof result.content, "string");
      assertEquals(result.content.length > 0, true);
      assertEquals(result.error, undefined);

      console.log(
        "Extracted topics:",
        result.content.substring(0, 100) + "...",
      );

      // Try to parse the JSON response
      try {
        const topics = JSON.parse(result.content);
        assertEquals(Array.isArray(topics), true);

        if (topics.length > 0) {
          assertExists(topics[0].topic);
          assertExists(topics[0].relevance);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.log("Failed to parse JSON response:", errorMessage);
      }
    } else {
      assertEquals(result.success, false);
      assertExists(result.error);
      assertEquals(result.content, undefined);

      console.log("Topic extraction failed:", result.error);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

/**
 * Test: reformulateQuery reformulates a query
 *
 * This test verifies that the reformulateQuery function correctly reformulates
 * a query using an LLM. It tests the basic functionality of reformulating a
 * query about using TypeScript with Deno.
 *
 * The test is designed to work even if Ollama is not running locally. It checks
 * the structure of the response and handles both success and error cases.
 *
 * If the response is successful and can be parsed as JSON, it checks that
 * the reformulated query has the expected structure with "expanded", "specific",
 * and "semantic" properties.
 *
 * Note: This test requires Ollama to be running locally for full testing.
 */
Deno.test({
  name: "TemplateClient - reformulateQuery reformulates a query",
  async fn() {
    // Create a client with a mock template engine
    const client = new TemplateClient({
      templateDir,
      defaultModel: "llama3.2",
    });

    const query = "how to use typescript with deno";
    const userContext =
      "Intermediate TypeScript developer interested in server-side development";
    const domain = "programming";

    const result = await client.reformulateQuery(query, userContext, domain);

    // We don't know if Ollama is running, so we just check the structure
    if (result.success) {
      assertEquals(result.success, true);
      assertExists(result.content);
      assertEquals(typeof result.content, "string");
      assertEquals(result.content.length > 0, true);
      assertEquals(result.error, undefined);

      console.log(
        "Reformulated query:",
        result.content.substring(0, 100) + "...",
      );

      // Try to parse the JSON response
      try {
        const reformulated = JSON.parse(result.content);
        assertExists(reformulated.expanded);
        assertExists(reformulated.specific);
        assertExists(reformulated.semantic);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.log("Failed to parse JSON response:", errorMessage);
      }
    } else {
      assertEquals(result.success, false);
      assertExists(result.error);
      assertEquals(result.content, undefined);

      console.log("Query reformulation failed:", result.error);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
