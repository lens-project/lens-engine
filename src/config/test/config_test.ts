// src/config/test/config_test.ts
import { assertEquals, assertExists } from "@std/assert";
import { loadConfig, validateConfig } from "../src/loader.ts";
import { AppConfig } from "../types.ts";
import { defaultDataDir } from "../src/defaults.ts";

// Mock environment setup
const mockEnv = {
  "LENS_OLLAMA_BASE_URL": "http://test-ollama:11434",
  "LENS_LANGSMITH_API_KEY": "test-api-key",
};

Deno.test("defaultDataDir returns expected path for current OS", () => {
  const dataDir = defaultDataDir();
  assertExists(dataDir);
  // Test specific OS conditions as needed
});

Deno.test("loadConfig loads values from environment", async () => {
  // Set mock environment variables
  const originalEnv = Deno.env.toObject();

  try {
    // Set mock environment
    for (const [key, value] of Object.entries(mockEnv)) {
      Deno.env.set(key, value);
    }

    const configResult = await loadConfig();
    assertEquals(configResult.isOk(), true);

    if (configResult.isOk()) {
      const config = configResult.unwrap();
      assertEquals(config.llm.ollamaBaseUrl, "http://test-ollama:11434");
      assertEquals(config.langSmith.apiKey, "test-api-key");
    }
  } finally {
    // Clean up environment
    for (const key of Object.keys(mockEnv)) {
      Deno.env.delete(key);
    }

    // Restore original environment
    for (const [key, value] of Object.entries(originalEnv)) {
      Deno.env.set(key, value);
    }
  }
});

Deno.test("validateConfig returns error for missing required values", () => {
  const incompleteConfig: AppConfig = {
    core: {
      dataDir: "/tmp/lens",
      logLevel: "info",
      port: 8000,
    },
    llm: {
      ollamaBaseUrl: "http://localhost:11434",
      embeddingModel: "nomic-embed-text",
      llmModel: "llama2",
    },
    langChain: {
      tracing: false,
    },
    langSmith: {
      apiKey: "", // Missing required value
      project: "lens-development",
      tracingEnabled: true,
    },
    database: {
      dbPath: "/tmp/lens/lens.db",
    },
  };

  const result = validateConfig(incompleteConfig);
  assertEquals(result.isErr(), true);
});
