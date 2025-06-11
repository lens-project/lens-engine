/**
 * Configuration Types for Lens Engine
 * 
 * DENO MODULE ORGANIZATION PATTERN:
 * ================================
 * 
 * This file demonstrates the recommended structure for organizing types in a Deno
 * monorepo with multiple modules. Each module should follow this pattern:
 * 
 * module_name/
 * ├── src/           # Private implementation details
 * ├── types.ts       # Public type definitions (THIS FILE)
 * └── mod.ts         # Public API entry point
 * 
 * RATIONALE:
 * - types.ts sits at module level (same as mod.ts) to clearly indicate it's part
 *   of the public API, not internal implementation
 * - src/ directory contains all private implementation files
 * - mod.ts acts as the single entry point, re-exporting from both src/ and types.ts
 * - This creates clean module boundaries and makes imports predictable
 * 
 * USAGE PATTERN:
 * - Internal files import: import { SomeType } from "../types.ts"
 * - External consumers import: import { SomeType } from "./module_name/mod.ts"
 * - CLI and other modules get clean imports without deep paths into src/
 * 
 * This pattern scales well across a monorepo because:
 * 1. Each module is self-contained with clear public/private boundaries
 * 2. Type conflicts are avoided through proper module encapsulation
 * 3. Refactoring internal implementation doesn't break external consumers
 * 4. The module structure mirrors how external packages would be organized
 * 
 * EXAMPLE MODULE STRUCTURE:
 * src/
 * ├── config/          # This module
 * │   ├── src/         # Implementation (config loading, validation, etc.)
 * │   ├── types.ts     # This file - public config types
 * │   └── mod.ts       # Re-exports getConfig() + types
 * ├── feeds/
 * │   ├── src/         # Feed processing implementation
 * │   ├── types.ts     # Feed-related types (FeedItem, ProcessOptions, etc.)
 * │   └── mod.ts       # Re-exports processFeedsFromOpml() + types
 * ├── retrieval/
 * │   ├── src/         # Content fetching implementation
 * │   ├── types.ts     # Retrieval types (ContentFetcherOptions, etc.)
 * │   └── mod.ts       # Re-exports fetchAllContent() + types
 * └── processors/
 *     ├── src/         # Content processing implementation
 *     ├── types.ts     # Processing types (ProcessorOptions, etc.)
 *     └── mod.ts       # Re-exports processContent() + types
 */

/**
 * Core application configuration
 * 
 * Defines fundamental settings that apply across the entire Lens Engine,
 * including data storage locations, logging behavior, and server configuration.
 */
export interface CoreConfig {
  /** Base directory for all data storage (feeds, fetched content, processed content) */
  dataDir: string;
  /** Logging verbosity level for application output */
  logLevel: "debug" | "info" | "warn" | "error";
  /** Port number for any web server functionality */
  port: number;
}

/**
 * Large Language Model configuration
 * 
 * Settings for LLM integration, including model selection and connection details.
 * Used by the processors module for content summarization and analysis.
 */
export interface LLMConfig {
  /** Base URL for Ollama API endpoint */
  ollamaBaseUrl: string;
  /** Model name for embedding generation */
  embeddingModel: string;
  /** Model name for text generation and processing */
  llmModel: string;
}

/**
 * LangChain framework configuration
 * 
 * Settings for LangChain integration, primarily for debugging and development.
 */
export interface LangChainConfig {
  /** Enable LangChain operation tracing for debugging */
  tracing: boolean;
}

/**
 * LangSmith observability configuration
 * 
 * Settings for LangSmith integration to monitor and trace LLM operations.
 */
export interface LangSmithConfig {
  /** API key for LangSmith service authentication */
  apiKey: string;
  /** Project name for organizing traces in LangSmith */
  project: string;
  /** Enable/disable LangSmith tracing */
  tracingEnabled: boolean;
}

/**
 * Database configuration
 * 
 * Settings for data persistence, including local SQLite and optional vector database.
 */
export interface DatabaseConfig {
  /** File path for local SQLite database */
  dbPath: string;
  /** Optional URL for vector database (e.g., for semantic search) */
  vectorDbUrl?: string;
}

/**
 * Complete application configuration
 * 
 * Root configuration interface that combines all module-specific configurations.
 * This is the primary interface used throughout the application.
 */
export interface AppConfig {
  /** Core application settings */
  core: CoreConfig;
  /** LLM integration settings */
  llm: LLMConfig;
  /** LangChain framework settings */
  langChain: LangChainConfig;
  /** LangSmith observability settings */
  langSmith: LangSmithConfig;
  /** Database and persistence settings */
  database: DatabaseConfig;
}

/**
 * Configuration-related error
 * 
 * Custom error type for configuration loading and validation failures.
 * Provides better error handling and debugging for config-related issues.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}