// src/config/types.ts

/**
 * Core application configuration
 */
export interface CoreConfig {
  dataDir: string;
  logLevel: "debug" | "info" | "warn" | "error";
  port: number;
}

/**
 * LLM configuration
 */
export interface LLMConfig {
  ollamaBaseUrl: string;
  embeddingModel: string;
  llmModel: string;
}

/**
 * LangChain configuration
 */
export interface LangChainConfig {
  tracing: boolean;
}

/**
 * LangSmith configuration
 */
export interface LangSmithConfig {
  apiKey: string;
  project: string;
  tracingEnabled: boolean;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  dbPath: string;
  vectorDbUrl?: string;
}

/**
 * Complete application configuration
 */
export interface AppConfig {
  core: CoreConfig;
  llm: LLMConfig;
  langChain: LangChainConfig;
  langSmith: LangSmithConfig;
  database: DatabaseConfig;
}

/**
 * Configuration error
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
