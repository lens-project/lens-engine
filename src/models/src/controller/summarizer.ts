/**
 * Content Summarization Controller
 *
 * This module provides functionality to summarize content using Ollama.
 * It integrates with the production Ollama client and follows the models module architecture.
 *
 * Adapted from lab implementation in src/processors/lab/html_summarizer.ts
 */

import { chatWithOllamaCustomPrompt } from "../providers/ollama/client.ts";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for summarizing content
 */
export interface SummaryOptions {
  /** The Ollama model to use */
  modelName?: string;
  /** The Ollama API base URL */
  baseUrl?: string;
  /** The temperature for generation (0.0-1.0) */
  temperature?: number;
  /** Whether to enable LangSmith tracing */
  langSmithTracing?: boolean;
  /** LangSmith API key (if not using config) */
  langSmithApiKey?: string;
  /** LangSmith project name (if not using config) */
  langSmithProject?: string;
}

/**
 * Response from the summarization function
 */
export interface SummaryResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    model?: string;
    processingTime?: number;
  };
}

// ============================================================================
// Core Summarization Function
// ============================================================================

/**
 * Summarize content using Ollama
 *
 * This function sends content to Ollama for summarization using LangChain.
 * Adapted from lab implementation to use production patterns.
 *
 * @param content The content to summarize
 * @param options Options for the summarization
 * @returns Object with success status and either summary content or error message
 */
export async function summarizeContent(
  content: string,
  options: SummaryOptions = {},
): Promise<SummaryResponse> {
  const startTime = Date.now();

  try {
    // Load the prompt template from file
    const promptPath = new URL("../../prompts/summarize-brief.txt", import.meta.url);
    const promptTemplate = await Deno.readTextFile(promptPath);

    // Use the Ollama client with custom prompt
    // The client will handle LangSmith tracing configuration
    const result = await chatWithOllamaCustomPrompt(
      promptTemplate,
      { content },
      {
        modelName: options.modelName,
        baseUrl: options.baseUrl,
        temperature: options.temperature,
        langSmithTracing: options.langSmithTracing,
        langSmithApiKey: options.langSmithApiKey,
        langSmithProject: options.langSmithProject,
      },
    );

    if (!result.success) {
      throw new Error(result.error || "Unknown error from Ollama client");
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      content: result.content,
      metadata: {
        model: result.metadata?.model,
        processingTime,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const processingTime = Date.now() - startTime;

    return {
      success: false,
      error: `Failed to summarize content: ${errorMessage}`,
      metadata: {
        processingTime,
      },
    };
  }
}