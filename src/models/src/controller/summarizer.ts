/**
 * Content Summarization Controller
 *
 * This module provides functionality to summarize content using Ollama.
 * It integrates with the production Ollama client and follows the models module architecture.
 *
 * Adapted from lab implementation in src/processors/lab/html_summarizer.ts
 */

import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getConfig } from "../../../config/mod.ts";

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
    // If LangSmith tracing is explicitly disabled, skip config loading
    if (options.langSmithTracing === false) {
      // Explicitly disable tracing
      Deno.env.set("LANGCHAIN_TRACING_V2", "false");
    } else {
      try {
        // Configure LangSmith tracing
        const config = await getConfig();

        if (config.langSmith.tracingEnabled) {
          Deno.env.set("LANGCHAIN_TRACING_V2", "true");
          Deno.env.set("LANGCHAIN_API_KEY", config.langSmith.apiKey);
          Deno.env.set("LANGCHAIN_PROJECT", config.langSmith.project);
        } else {
          Deno.env.set("LANGCHAIN_TRACING_V2", "false");
        }
      } catch (configError) {
        // If config loading fails, disable tracing and continue
        console.warn("Failed to load config for LangSmith, disabling tracing:", configError);
        Deno.env.set("LANGCHAIN_TRACING_V2", "false");
      }
    }

    // Get configuration for defaults
    let config;
    try {
      config = await getConfig();
    } catch (configError) {
      // If config fails, use provided options or defaults
      console.warn("Failed to load config, using provided options or defaults:", configError);
    }

    // Set up model parameters
    const modelName = options.modelName || config?.llm.llmModel || "llama3.2";
    const baseUrl = options.baseUrl || config?.llm.ollamaBaseUrl || "http://localhost:11434";
    const temperature = options.temperature ?? 0.7;

    // Create the chat model
    const model = new ChatOllama({
      baseUrl,
      model: modelName,
      temperature,
    });

    // Create the prompt template (copied from lab implementation)
    const prompt = ChatPromptTemplate.fromTemplate(`
You are an expert content summarizer. Your task is to create a concise, informative summary of the provided content.

Guidelines:
- Create a summary that captures the main points and key insights
- Keep the summary concise but comprehensive
- Focus on the most important information
- Maintain the original tone and context
- Include any relevant URLs or references mentioned

Content to summarize:
{content}

Please provide a clear, well-structured summary:
    `);

    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Invoke the chain
    const summary = await chain.invoke({ content });

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      content: summary,
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
      error: `Failed to summarize content: ${errorMessage}`,
      metadata: {
        processingTime,
      },
    };
  }
}