/**
 * Template Client
 *
 * This module provides a client for using templates with LLMs.
 * It integrates the template engine to provide a simple interface
 * for calling LLMs with templates.
 *
 * This module uses a functional programming approach with pure functions
 * and composition.
 *
 * The template client provides high-level functions for common tasks:
 * 1. Extracting topics from content
 * 2. Reformulating queries
 * 3. Calling templates with custom variables
 *
 * It builds on top of the template engine and provides a more convenient
 * interface for specific use cases.
 *
 * Example usage:
 * ```typescript
 * const client = createTemplateClient({ templateDir: "./prompts" });
 *
 * // Extract topics from content
 * const content = "TypeScript is a strongly typed programming language...";
 * const topicsResult = await client.extractTopics(content);
 *
 * // Reformulate a query
 * const query = "how to use typescript with deno";
 * const queryResult = await client.reformulateQuery(query);
 * ```
 *
 * @module template_client
 * @lab Experimental template client for LLM interactions
 * @version 0.1.0
 * @author Lens Team
 */

import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  createTemplateEngine,
  LLMOptions,
  LLMResponse,
} from "./template_engine.ts";

/**
 * Configuration for the template client
 *
 * This interface defines the configuration options for the template client.
 * It includes the directory where templates are stored, the base URL for the
 * LLM API, and the default model to use.
 *
 * @interface TemplateClientConfig
 * @property {string} templateDir - The directory where templates are stored
 * @property {string} [baseUrl] - The base URL of the LLM API (default: "http://localhost:11434")
 * @property {string} [defaultModel] - The default model to use (default: "llama3.2")
 * @example
 * ```typescript
 * const config: TemplateClientConfig = {
 *   templateDir: "./prompts",
 *   baseUrl: "http://localhost:11434",
 *   defaultModel: "llama3.2"
 * };
 * ```
 */
export interface TemplateClientConfig {
  templateDir: string;
  baseUrl?: string;
  defaultModel?: string;
}

/**
 * Extract topics from content using a template
 *
 * This function extracts the main topics from a piece of content using an LLM.
 * It uses a template to guide the LLM in extracting topics that are relevant
 * and representative of the content.
 *
 * The function loads the template, creates a chat model, and invokes the model
 * with the content to extract topics. The topics can be returned in JSON format
 * or as a simple comma-separated list.
 *
 * @function extractTopics
 * @param {TemplateClientConfig} config - Template client configuration
 * @param {string} content - The content to analyze
 * @param {number} [maxTopics=5] - Maximum number of topics to extract
 * @param {"json" | "text"} [format="json"] - Output format (json or text)
 * @param {LLMOptions} [options={}] - LLM options
 * @returns {Promise<LLMResponse>} LLM response with extracted topics
 * @example
 * ```typescript
 * const config = { templateDir: "./prompts" };
 * const content = "TypeScript is a strongly typed programming language...";
 * const response = await extractTopics(config, content, 5, "json");
 * if (response.success) {
 *   const topics = JSON.parse(response.content);
 *   console.log(topics);
 * }
 * ```
 */
export async function extractTopics(
  config: TemplateClientConfig,
  content: string,
  maxTopics: number = 5,
  format: "json" | "text" = "json",
  options: LLMOptions = {},
): Promise<LLMResponse> {
  try {
    const templateEngine = createTemplateEngine({
      templateDir: config.templateDir,
    });
    const baseUrl = options.baseUrl || config.baseUrl ||
      "http://localhost:11434";
    const modelName = options.modelName || config.defaultModel || "llama3.2";

    // Create the chat model
    const model = new ChatOllama({
      baseUrl,
      model: modelName,
      temperature: options.temperature || 0.3, // Lower temperature for more deterministic results
    });

    // Load the template
    const templatePath = "content_analysis/topic_extraction.md";
    const templateContent = await templateEngine.loadTemplate(templatePath);

    // Parse the template
    const parsedTemplate = templateEngine.parseTemplate(templateContent);

    // Create a system prompt
    const systemPrompt = parsedTemplate.systemPrompt;

    // Create a user prompt
    let userPrompt = `Extract the main topics from the following content:

Content:
${content}

Extract up to ${maxTopics} topics that best represent the main themes of this content.

`;

    if (format === "json") {
      userPrompt +=
        `Return the topics as a JSON array of objects with "topic" and "relevance" properties. The relevance should be a number between 0 and 1 indicating how central the topic is to the content.`;
    } else {
      userPrompt += `Return the topics as a simple comma-separated list.`;
    }

    // Create a prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["human", userPrompt],
    ]);

    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Invoke the chain
    const response = await chain.invoke({});

    return {
      success: true,
      content: response,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to extract topics: ${errorMessage}`,
    };
  }
}

/**
 * Reformulate a query using a template
 *
 * This function reformulates a query using an LLM to improve search results.
 * It uses a template to guide the LLM in reformulating the query to be more
 * effective for search.
 *
 * The function can take optional user context and domain focus to make the
 * reformulation more relevant to the user's needs. It returns multiple
 * reformulated versions of the query, including an expanded version, a more
 * specific version, and a version optimized for semantic search.
 *
 * @function reformulateQuery
 * @param {TemplateClientConfig} config - Template client configuration
 * @param {string} query - The original query
 * @param {string} [userContext] - Optional user context (e.g., "Intermediate TypeScript developer")
 * @param {string} [domain] - Optional domain focus (e.g., "programming")
 * @param {LLMOptions} [options={}] - LLM options
 * @returns {Promise<LLMResponse>} LLM response with reformulated query
 * @example
 * ```typescript
 * const config = { templateDir: "./prompts" };
 * const query = "how to use typescript with deno";
 * const userContext = "Intermediate TypeScript developer";
 * const domain = "programming";
 * const response = await reformulateQuery(config, query, userContext, domain);
 * if (response.success) {
 *   console.log(response.content);
 * }
 * ```
 */
export async function reformulateQuery(
  config: TemplateClientConfig,
  query: string,
  userContext?: string,
  domain?: string,
  options: LLMOptions = {},
): Promise<LLMResponse> {
  const templateEngine = createTemplateEngine({
    templateDir: config.templateDir,
  });
  const baseUrl = options.baseUrl || config.baseUrl || "http://localhost:11434";
  const modelName = options.modelName || config.defaultModel || "llama3.2";

  const variables: Record<string, unknown> = { query };

  if (userContext) {
    variables.user_context = userContext;
  }

  if (domain) {
    variables.domain = domain;
  }

  return await templateEngine.callLLMWithTemplate(
    "query_processing/query_reformulation.md",
    variables,
    {
      modelName,
      baseUrl,
      temperature: options.temperature || 0.5,
    },
  );
}

/**
 * Call a template with custom variables
 *
 * This function calls a template with custom variables. It provides a more
 * general-purpose interface for using templates with LLMs, allowing you to
 * specify any template path and variables.
 *
 * This is useful when you have custom templates that don't fit into the
 * predefined categories like topic extraction or query reformulation.
 *
 * @function callTemplate
 * @param {TemplateClientConfig} config - Template client configuration
 * @param {string} templatePath - Path to the template, relative to the template directory
 * @param {Record<string, unknown>} variables - Variables to use in the template
 * @param {LLMOptions} [options={}] - LLM options
 * @returns {Promise<LLMResponse>} LLM response
 * @example
 * ```typescript
 * const config = { templateDir: "./prompts" };
 * const templatePath = "custom/my_template.md";
 * const variables = { name: "Alice", age: 30 };
 * const response = await callTemplate(config, templatePath, variables);
 * if (response.success) {
 *   console.log(response.content);
 * }
 * ```
 */
export async function callTemplate(
  config: TemplateClientConfig,
  templatePath: string,
  variables: Record<string, unknown>,
  options: LLMOptions = {},
): Promise<LLMResponse> {
  const templateEngine = createTemplateEngine({
    templateDir: config.templateDir,
  });
  const baseUrl = options.baseUrl || config.baseUrl || "http://localhost:11434";
  const modelName = options.modelName || config.defaultModel || "llama3.2";

  return await templateEngine.callLLMWithTemplate(
    templatePath,
    variables,
    {
      modelName,
      baseUrl,
      temperature: options.temperature !== undefined
        ? options.temperature
        : 0.7,
    },
  );
}

/**
 * Create a template client with the given configuration
 *
 * This factory function creates a template client object with methods that
 * match the original class interface. It uses the functional implementation
 * under the hood, but provides an object-oriented interface for convenience.
 *
 * This is the recommended way to create a template client, as it follows
 * functional programming principles while still providing a convenient API.
 *
 * @function createTemplateClient
 * @param {TemplateClientConfig} config - Template client configuration
 * @returns {Object} Template client object with methods
 * @example
 * ```typescript
 * const client = createTemplateClient({
 *   templateDir: "./prompts",
 *   defaultModel: "llama3.2"
 * });
 *
 * // Extract topics from content
 * const topicsResult = await client.extractTopics(content);
 *
 * // Reformulate a query
 * const queryResult = await client.reformulateQuery(query);
 * ```
 */
export function createTemplateClient(config: TemplateClientConfig) {
  return {
    extractTopics: (
      content: string,
      maxTopics: number = 5,
      format: "json" | "text" = "json",
      options: LLMOptions = {},
    ) => extractTopics(config, content, maxTopics, format, options),

    reformulateQuery: (
      query: string,
      userContext?: string,
      domain?: string,
      options: LLMOptions = {},
    ) => reformulateQuery(config, query, userContext, domain, options),

    callTemplate: (
      templatePath: string,
      variables: Record<string, unknown>,
      options: LLMOptions = {},
    ) => callTemplate(config, templatePath, variables, options),
  };
}

/**
 * Template Client class (for backward compatibility)
 *
 * This class provides an object-oriented interface to the template client.
 * It is provided for backward compatibility with existing code that uses
 * the class-based API.
 *
 * For new code, it is recommended to use the functional API with the
 * `createTemplateClient` factory function instead.
 *
 * @class TemplateClient
 * @deprecated Use the functional API with `createTemplateClient` instead
 * @example
 * ```typescript
 * const client = new TemplateClient({ templateDir: "./prompts" });
 * const topicsResult = await client.extractTopics(content);
 * const queryResult = await client.reformulateQuery(query);
 * ```
 */
export class TemplateClient {
  private config: TemplateClientConfig;

  /**
   * Create a new TemplateClient
   * @param {TemplateClientConfig} options - Template client configuration
   */
  constructor(options: TemplateClientConfig) {
    this.config = options;
  }

  extractTopics(
    content: string,
    maxTopics: number = 5,
    format: "json" | "text" = "json",
    options: LLMOptions = {},
  ): Promise<LLMResponse> {
    return extractTopics(this.config, content, maxTopics, format, options);
  }

  reformulateQuery(
    query: string,
    userContext?: string,
    domain?: string,
    options: LLMOptions = {},
  ): Promise<LLMResponse> {
    return reformulateQuery(this.config, query, userContext, domain, options);
  }

  callTemplate(
    templatePath: string,
    variables: Record<string, unknown>,
    options: LLMOptions = {},
  ): Promise<LLMResponse> {
    return callTemplate(this.config, templatePath, variables, options);
  }
}

// Example usage when run directly
if (import.meta.main) {
  // Use the prompts directory from the import map
  const config = {
    templateDir: "./prompts",
    defaultModel: "llama3.2",
  };

  // Create a client using the functional approach
  const client = createTemplateClient(config);

  // Example content for topic extraction
  const content = `
    TypeScript is a strongly typed programming language that builds on JavaScript,
    giving you better tooling at any scale. It adds additional syntax to JavaScript
    to support a tighter integration with your editor. This can help catch errors early in your editor.

    TypeScript code converts to JavaScript, which runs anywhere JavaScript runs:
    In a browser, on Node.js or Deno and in your apps.

    TypeScript understands JavaScript and uses type inference to give you great tooling
    without additional code.
  `;

  console.log("Testing topic extraction...");
  const topicsResult = await client.extractTopics(content);

  if (topicsResult.success) {
    console.log("✅ Successfully extracted topics");
    console.log("Topics:", topicsResult.content);
  } else {
    console.error("❌ Failed to extract topics:", topicsResult.error);
  }

  // Example query for reformulation
  const query = "how to use typescript with deno";

  console.log("\nTesting query reformulation...");
  const queryResult = await client.reformulateQuery(
    query,
    "Intermediate TypeScript developer interested in server-side development",
    "programming",
  );

  if (queryResult.success) {
    console.log("✅ Successfully reformulated query");
    console.log("Reformulated query:", queryResult.content);
  } else {
    console.error("❌ Failed to reformulate query:", queryResult.error);
  }
}
