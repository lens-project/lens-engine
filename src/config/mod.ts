/**
 * Configuration management for the Lens application.
 *
 * This module handles loading configuration from .env files and environment variables,
 * providing a typed configuration object with validation.
 */

// Re-export types
export * from "./types.ts";

// Re-export defaults
export { defaultDataDir } from "./defaults.ts";

// Re-export loader functions
export { getConfig, getConfigWithTestSupport, loadConfig, validateConfig } from "./loader.ts";

// Re-export test configuration utilities
export {
  createTestConfig,
  isTestEnvironment,
  isTestConfig,
  setupTestEnvironment,
  cleanupTestEnvironment,
  configureTest,
  TEST_CONFIG_PRESETS,
  type TestConfig,
  type TestConfigOverrides,
} from "./test-config.ts";
