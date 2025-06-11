/**
 * Configuration management for the Lens application.
 *
 * This module handles loading configuration from .env files and environment variables,
 * providing a typed configuration object with validation.
 */

// Re-export types
export * from "./types.ts";

// Re-export defaults
export { defaultDataDir } from "./src/defaults.ts";

// Re-export loader functions
export {
  getConfig,
  getConfigWithTestSupport,
  loadConfig,
  validateConfig,
} from "./src/loader.ts";

// Re-export test configuration utilities
export {
  cleanupTestEnvironment,
  configureTest,
  createTestConfig,
  isTestConfig,
  isTestEnvironment,
  setupTestEnvironment,
  TEST_CONFIG_PRESETS,
  type TestConfig,
  type TestConfigOverrides,
} from "./test-config.ts";
