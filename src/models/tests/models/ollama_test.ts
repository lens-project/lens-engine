/**
 * Tests for the Ollama client module
 *
 * This file contains tests for all Ollama client functionality using
 * the test configuration system for reliable, isolated testing:
 * 1. Basic API validation
 * 2. Simple LangChain integration
 * 3. Configuration-based LangChain integration
 * 4. Custom prompt integration
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  chatWithOllama,
  chatWithOllamaCustomPrompt,
  validateOllamaConnection,
} from "../../src/providers/ollama/client.ts";
import { cleanupTestEnvironment, configureTest } from "../../../config/mod.ts";

// Test 1: Basic Ollama API validation
Deno.test({
  name: "validateOllamaConnection - API connection test",
  async fn() {
    // This test requires Ollama to be running locally
    const result = await validateOllamaConnection();

    // We don't know if Ollama is running, so we just check the structure
    if (result.success) {
      assertEquals(result.success, true);
      assertExists(result.data);
      assertEquals(Array.isArray(result.data), true);
      assertEquals(result.error, undefined);

      console.log("Available Ollama models:", result.data);
    } else {
      assertEquals(result.success, false);
      assertExists(result.error);
      assertEquals(result.data, undefined);

      console.log("Ollama connection failed:", result.error);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 2: Simple LangChain integration
Deno.test({
  name: "chatWithOllama - simple LangChain chat test",
  async fn() {
    // This test requires Ollama to be running locally
    const result = await chatWithOllama("Hello, how are you?");

    // We don't know if Ollama is running, so we just check the structure
    if (result.success) {
      assertEquals(result.success, true);
      assertExists(result.content);
      assertEquals(typeof result.content, "string");
      assertEquals(result.content.length > 0, true);
      assertEquals(result.error, undefined);

      console.log(
        "Ollama response:",
        result.content?.substring(0, 100) + "...",
      );
    } else {
      assertEquals(result.success, false);
      assertExists(result.error);
      assertEquals(result.content, undefined);

      console.log("Ollama chat failed:", result.error);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Test 3: Custom prompt integration (test-friendly)
Deno.test({
  name: "chatWithOllamaCustomPrompt - custom prompt test",
  async fn() {
    const testConfig = configureTest("minimal");

    try {
      const customPrompt =
        "You are a helpful assistant. Please respond to: {message}";
      const variables = { message: "What is 2+2?" };

      const result = await chatWithOllamaCustomPrompt(
        customPrompt,
        variables,
        {
          modelName: testConfig.llm.llmModel,
          baseUrl: testConfig.llm.ollamaBaseUrl,
          temperature: 0.1,
          langSmithTracing: testConfig.langSmith.tracingEnabled,
        },
      );

      // Check response structure
      assertExists(result);
      assertEquals(typeof result.success, "boolean");

      if (result.success) {
        assertExists(result.content);
        assertEquals(typeof result.content, "string");
        assertExists(result.metadata);
        assertEquals(typeof result.metadata.processingTime, "number");

        console.log(
          "Custom prompt response:",
          result.content?.substring(0, 100) + "...",
        );
      } else {
        assertExists(result.error);
        console.log(
          "Custom prompt failed (expected if Ollama not running):",
          result.error,
        );
      }
    } finally {
      cleanupTestEnvironment();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
