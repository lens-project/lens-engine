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
