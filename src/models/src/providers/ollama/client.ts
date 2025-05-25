/**
 * Ollama Client Module
 *
 * This module provides functions for interacting with Ollama:
 * 1. Basic API validation to check if Ollama is running
 * 2. Simple LangChain integration for chat
 * 3. Configuration-based LangChain integration
 */

import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getConfig } from "@src/config/mod.ts";

// ============================================================================
// Types
// ============================================================================

/**
 * Response from the chat functions
 */
export interface ChatResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    model?: string;
    processingTime?: number;
  };
}

/**
 * Response from the validation function
 */
export interface ValidationResponse {
  success: boolean;
  data?: string[];
  error?: string;
}

// ============================================================================
// Basic Ollama API Validation
// ============================================================================

/**
 * Validates connection to Ollama API
 * @param baseUrl The Ollama API base URL
 * @returns Object with success status and either model list or error message
 */
export async function validateOllamaConnection(
  baseUrl: string = "http://localhost:11434",
): Promise<ValidationResponse> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.models?.map((model: { name: string }) => model.name) || [],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to connect to Ollama: ${errorMessage}`,
    };
  }
}

// ============================================================================
// Simple LangChain Integration
// ============================================================================

/**
 * Send a simple chat message to Ollama using LangChain
 *
 * @param message The user message to send
 * @param modelName The Ollama model to use
 * @param baseUrl The Ollama API base URL
 * @returns Object with success status and either response content or error message
 */
export async function chatWithOllama(
  message: string,
  modelName: string = "llama3.2",
  baseUrl: string = "http://localhost:11434",
): Promise<ChatResponse> {
  try {
    // Create the chat model
    const model = new ChatOllama({
      baseUrl,
      model: modelName,
      temperature: 0.7,
    });

    // Create a simple prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful AI assistant."],
      ["human", "{input}"],
    ]);

    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Invoke the chain with the user message
    const response = await chain.invoke({
      input: message,
    });

    return {
      success: true,
      content: response,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to chat with Ollama: ${errorMessage}`,
    };
  }
}

// ============================================================================
// Configuration-based LangChain Integration
// ============================================================================

/**
 * Send a simple chat message to Ollama using LangChain with configuration from the config system
 *
 * @param message The user message to send
 * @returns Object with success status and either response content or error message
 */
export async function chatWithOllamaConfig(
  message: string,
): Promise<ChatResponse> {
  try {
    // Load configuration
    const config = await getConfig();

    // Create the chat model using configuration values
    const model = new ChatOllama({
      baseUrl: config.llm.ollamaBaseUrl,
      model: config.llm.llmModel,
      temperature: 0.7,
    });

    // Create a simple prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful AI assistant."],
      ["human", "{input}"],
    ]);

    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Invoke the chain with the user message
    const response = await chain.invoke({
      input: message,
    });

    return {
      success: true,
      content: response,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to chat with Ollama: ${errorMessage}`,
    };
  }
}

// ============================================================================
// Custom Prompt Integration
// ============================================================================

/**
 * Options for custom prompt chat
 */
export interface CustomPromptOptions {
  /** Custom temperature override (defaults to 0.7) */
  temperature?: number;
  /** Custom model override (uses config if not provided) */
  modelName?: string;
  /** Custom base URL override (uses config if not provided) */
  baseUrl?: string;
  /** Whether to enable LangSmith tracing (uses config if not provided) */
  langSmithTracing?: boolean;
  /** LangSmith API key (if not using config) */
  langSmithApiKey?: string;
  /** LangSmith project name (if not using config) */
  langSmithProject?: string;
}

/**
 * Send a message to Ollama using a custom prompt template with configuration from the config system
 *
 * This function allows using custom prompts (like those from prompt files) while still
 * leveraging the centralized Ollama client configuration and error handling.
 *
 * @param promptTemplate The prompt template string (can contain variables like {content})
 * @param variables Object containing variables to substitute in the template
 * @param options Optional overrides for model parameters
 * @returns Object with success status and either response content or error message
 */
export async function chatWithOllamaCustomPrompt(
  promptTemplate: string,
  variables: Record<string, string>,
  options: CustomPromptOptions = {},
): Promise<ChatResponse> {
  const startTime = Date.now();

  try {
    // Configure LangSmith tracing first
    if (options.langSmithTracing === false) {
      // Explicitly disable tracing - no config needed
      Deno.env.set("LANGCHAIN_TRACING_V2", "false");
    } else {
      // Need to check config for tracing settings
      try {
        const config = await getConfig();

        // Use provided options or fall back to config
        const tracingEnabled = options.langSmithTracing ??
          config.langSmith.tracingEnabled;
        const apiKey = options.langSmithApiKey || config.langSmith.apiKey;
        const project = options.langSmithProject || config.langSmith.project;

        if (tracingEnabled) {
          Deno.env.set("LANGCHAIN_TRACING_V2", "true");
          Deno.env.set("LANGCHAIN_API_KEY", apiKey);
          Deno.env.set("LANGCHAIN_PROJECT", project);
        } else {
          Deno.env.set("LANGCHAIN_TRACING_V2", "false");
        }
      } catch (configError) {
        // If config loading fails, disable tracing and continue
        console.warn(
          "Failed to load config for LangSmith, disabling tracing:",
          configError,
        );
        Deno.env.set("LANGCHAIN_TRACING_V2", "false");
      }
    }

    // Handle model settings - try to use provided options first to avoid config loading
    let modelName = options.modelName;
    let baseUrl = options.baseUrl;
    const temperature = options.temperature ?? 0.7;

    // Only load config if we're missing required options
    if (!modelName || !baseUrl) {
      try {
        const config = await getConfig();
        modelName = modelName || config.llm.llmModel;
        baseUrl = baseUrl || config.llm.ollamaBaseUrl;
      } catch (configError) {
        // If config loading fails, use defaults
        console.warn(
          "Failed to load config for model settings, using defaults:",
          configError,
        );
        modelName = modelName || "llama3.2";
        baseUrl = baseUrl || "http://localhost:11434";
      }
    }

    // Create the chat model using configuration values
    const model = new ChatOllama({
      baseUrl,
      model: modelName,
      temperature,
    });

    // Create prompt template from the provided string
    const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);

    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Invoke the chain with the provided variables
    const response = await chain.invoke(variables);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      content: response,
      metadata: {
        model: modelName,
        processingTime,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const processingTime = Date.now() - startTime;

    return {
      success: false,
      error: `Failed to chat with Ollama using custom prompt: ${errorMessage}`,
      metadata: {
        processingTime,
      },
    };
  }
}

// Example usage when run directly
if (import.meta.main) {
  console.log("Testing Ollama integration...");

  // Test connection
  console.log("\n1. Testing Ollama connection...");
  const connectionResult = await validateOllamaConnection();

  if (connectionResult.success) {
    console.log("✅ Successfully connected to Ollama");
    console.log("Available models:", connectionResult.data);

    // If connection successful, test chat
    console.log("\n2. Testing simple chat...");
    const chatResult = await chatWithOllama("Hello, how are you?");

    if (chatResult.success) {
      console.log("✅ Successfully chatted with Ollama");
      console.log("Response:", chatResult.content);

      // If simple chat successful, test config-based chat
      console.log("\n3. Testing config-based chat...");
      const configChatResult = await chatWithOllamaConfig(
        "Tell me about yourself.",
      );

      if (configChatResult.success) {
        console.log("✅ Successfully chatted with Ollama using config");
        console.log("Response:", configChatResult.content);
      } else {
        console.error(
          "❌ Failed to chat with Ollama using config:",
          configChatResult.error,
        );
      }
    } else {
      console.error("❌ Failed to chat with Ollama:", chatResult.error);
    }
  } else {
    console.error("❌ Failed to connect to Ollama:", connectionResult.error);
  }
}
