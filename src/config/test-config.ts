/**
 * Test Configuration System
 *
 * This module provides utilities for creating and managing test configurations.
 * It allows tests to run with controlled, predictable settings without requiring
 * production configuration files.
 *
 * Key Features:
 * - Isolated test environments
 * - Predictable test configurations
 * - No dependency on production config files
 * - Support for future A/B testing and model comparison
 */

import type { AppConfig } from "./types.ts";

// ============================================================================
// Test Configuration Types
// ============================================================================

/**
 * Test-specific configuration interface
 * Extends the base AppConfig but with test-friendly defaults
 */
export interface TestConfig extends AppConfig {
  /** Explicitly mark this as a test configuration */
  _testMode: true;
}

/**
 * Partial test configuration for overrides
 * Allows tests to specify only the parts they care about
 */
export interface TestConfigOverrides {
  llm?: Partial<AppConfig["llm"]>;
  langSmith?: Partial<AppConfig["langSmith"]>;
  core?: Partial<AppConfig["core"]>;
}

// ============================================================================
// Default Test Configuration
// ============================================================================

/**
 * Default test configuration
 * Provides sensible defaults for all required configuration values
 */
const DEFAULT_TEST_CONFIG: TestConfig = {
  _testMode: true,
  core: {
    dataDir: "/tmp/lens-test-data",
    logLevel: "info",
    port: 8080,
  },
  llm: {
    ollamaBaseUrl: "http://localhost:11434",
    embeddingModel: "nomic-embed-text",
    llmModel: "llama3.2",
  },
  langChain: {
    tracing: false,
  },
  langSmith: {
    tracingEnabled: false,
    apiKey: "test-api-key-not-real",
    project: "test-project",
  },
  database: {
    dbPath: "/tmp/lens-test.db",
    vectorDbUrl: "http://localhost:6333",
  },
};

// ============================================================================
// Test Configuration Utilities
// ============================================================================

/**
 * Create a test configuration with optional overrides
 *
 * This function creates a complete test configuration by merging
 * the default test config with any provided overrides.
 *
 * @param overrides Partial configuration to override defaults
 * @returns Complete test configuration
 *
 * @example
 * ```typescript
 * // Use defaults
 * const config = createTestConfig();
 *
 * // Override specific values
 * const config = createTestConfig({
 *   llm: { llmModel: "mistral" },
 *   langSmith: { tracingEnabled: true }
 * });
 * ```
 */
export function createTestConfig(
  overrides: TestConfigOverrides = {},
): TestConfig {
  return {
    ...DEFAULT_TEST_CONFIG,
    core: {
      ...DEFAULT_TEST_CONFIG.core,
      ...overrides.core,
    },
    llm: {
      ...DEFAULT_TEST_CONFIG.llm,
      ...overrides.llm,
    },
    langSmith: {
      ...DEFAULT_TEST_CONFIG.langSmith,
      ...overrides.langSmith,
    },
  };
}

/**
 * Check if we're running in a test environment
 *
 * This function detects test environments by checking:
 * 1. DENO_TESTING environment variable (set by Deno test runner)
 * 2. NODE_ENV=test (common in Node.js environments)
 * 3. Explicit TEST_MODE environment variable
 *
 * @returns true if running in test environment
 */
export function isTestEnvironment(): boolean {
  return (
    Deno.env.get("DENO_TESTING") === "true" ||
    Deno.env.get("NODE_ENV") === "test" ||
    Deno.env.get("TEST_MODE") === "true"
  );
}

/**
 * Check if a configuration is a test configuration
 *
 * @param config Configuration to check
 * @returns true if this is a test configuration
 */
export function isTestConfig(config: AppConfig): config is TestConfig {
  return "_testMode" in config && config._testMode === true;
}

// ============================================================================
// Test Configuration Presets
// ============================================================================

/**
 * Predefined test configurations for common scenarios
 */
export const TEST_CONFIG_PRESETS = {
  /**
   * Minimal configuration for basic unit tests
   */
  minimal: (): TestConfig =>
    createTestConfig({
      langSmith: { tracingEnabled: false },
      llm: { llmModel: "llama3.2" },
    }),

  /**
   * Configuration for integration tests with tracing enabled
   */
  integration: (): TestConfig =>
    createTestConfig({
      langSmith: {
        tracingEnabled: true,
        project: "integration-tests",
      },
    }),

  /**
   * Configuration for performance testing
   */
  performance: (): TestConfig =>
    createTestConfig({
      llm: {
        llmModel: "llama3.2",
        ollamaBaseUrl: "http://localhost:11434",
      },
      langSmith: { tracingEnabled: false },
    }),

  /**
   * Configuration for model comparison tests (default model)
   */
  modelComparison: (): TestConfig =>
    createTestConfig({
      llm: { llmModel: "llama3.2" },
      langSmith: {
        tracingEnabled: true,
        project: "model-comparison-default",
      },
    }),
} as const;

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Set up test environment variables
 *
 * This function sets environment variables that tests might need,
 * ensuring a clean, predictable test environment.
 *
 * @param config Test configuration to use for environment setup
 */
export function setupTestEnvironment(config: TestConfig): void {
  // Set test mode indicator
  Deno.env.set("TEST_MODE", "true");

  // Configure LangChain for testing
  if (config.langSmith.tracingEnabled) {
    Deno.env.set("LANGCHAIN_TRACING_V2", "true");
    Deno.env.set("LANGCHAIN_API_KEY", config.langSmith.apiKey);
    Deno.env.set("LANGCHAIN_PROJECT", config.langSmith.project);
  } else {
    Deno.env.set("LANGCHAIN_TRACING_V2", "false");
  }
}

/**
 * Clean up test environment
 *
 * This function cleans up environment variables set during testing,
 * ensuring tests don't interfere with each other.
 */
export function cleanupTestEnvironment(): void {
  const testEnvVars = [
    "TEST_MODE",
    "LANGCHAIN_TRACING_V2",
    "LANGCHAIN_API_KEY",
    "LANGCHAIN_PROJECT",
  ];

  for (const envVar of testEnvVars) {
    Deno.env.delete(envVar);
  }
}

/**
 * Create a test configuration for a specific test scenario
 *
 * This is a convenience function that combines configuration creation
 * with environment setup for common test patterns.
 *
 * @param scenario Test scenario name or custom overrides
 * @returns Test configuration ready for use
 */
export function configureTest(
  scenario: keyof typeof TEST_CONFIG_PRESETS | TestConfigOverrides = "minimal",
): TestConfig {
  let config: TestConfig;

  if (typeof scenario === "string") {
    config = TEST_CONFIG_PRESETS[scenario]();
  } else {
    config = createTestConfig(scenario);
  }

  setupTestEnvironment(config);
  return config;
}
