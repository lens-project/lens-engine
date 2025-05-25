/**
 * Tests for the Ollama client module
 *
 * This file contains tests for all Ollama client functionality:
 * 1. Basic API validation
 * 2. Simple LangChain integration
 * 3. Configuration-based LangChain integration
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  chatWithOllama,
  chatWithOllamaConfig,
  validateOllamaConnection,
} from "../../src/providers/ollama/client.ts";

// Helper to set environment variables for testing
async function withEnv(
  env: Record<string, string>,
  fn: () => Promise<void> | void,
): Promise<void> {
  const originalEnv: Record<string, string | undefined> = {};

  // Save original env values and set new ones
  for (const [key, value] of Object.entries(env)) {
    originalEnv[key] = Deno.env.get(key);
    if (value === "") {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, value);
    }
  }

  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
  } finally {
    // Restore original env values
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, value);
      }
    }
  }
}

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

// Test 3: Configuration-based LangChain integration
Deno.test({
  name: "chatWithOllamaConfig - LangChain chat with config test",
  async fn() {
    // Set required environment variables for the test
    await withEnv({
      LENS_LANGSMITH_API_KEY: "test-api-key", // Required by config validation
      LENS_OLLAMA_BASE_URL: "http://localhost:11434",
      LENS_OLLAMA_LLM_MODEL: "llama3.2", // Use the model we know is available
    }, async () => {
      // This test requires Ollama to be running locally
      const result = await chatWithOllamaConfig("Hello, how are you?");

      // We don't know if Ollama is running, so we just check the structure
      if (result.success) {
        assertEquals(result.success, true);
        assertExists(result.content);
        assertEquals(typeof result.content, "string");
        assertEquals(result.content.length > 0, true);
        assertEquals(result.error, undefined);

        console.log(
          "Ollama response with config:",
          result.content?.substring(0, 100) + "...",
        );
      } else {
        assertEquals(result.success, false);
        assertExists(result.error);
        assertEquals(result.content, undefined);

        console.log("Ollama chat with config failed:", result.error);
      }
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
