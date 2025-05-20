/**
 * Template Engine for LLM interactions
 *
 * This module provides functionality to load, process, and render templates
 * for LLM interactions. Templates are stored as markdown files with a specific
 * structure and can include variable placeholders and conditional logic.
 *
 * This module uses a functional programming approach with pure functions
 * and composition.
 *
 * The template engine supports:
 * 1. Loading templates from the filesystem
 * 2. Parsing templates into structured sections
 * 3. Processing templates with conditional logic (if/else blocks)
 * 4. Rendering templates by substituting variables
 * 5. Converting templates to LangChain prompt templates
 * 6. Calling LLMs with rendered templates
 *
 * Templates are expected to be in a specific markdown format with sections:
 * - Template name (# Template: Name)
 * - Description (## Description)
 * - Input Variables (## Input Variables)
 * - System Prompt (## System Prompt)
 * - User Prompt (## User Prompt)
 * - Output Format (## Output Format)
 *
 * Example template:
 * ```markdown
 * # Template: Example
 *
 * ## Description
 * This is an example template.
 *
 * ## Input Variables
 * - variable1: Description of variable1
 * - variable2: Description of variable2
 *
 * ## System Prompt
 * You are a helpful assistant.
 *
 * ## User Prompt
 * Hello, my name is {{variable1}} and I'm {{variable2}}.
 *
 * ## Output Format
 * A friendly greeting.
 * ```
 *
 * @module template_engine
 * @lab Experimental template engine for LLM interactions
 * @version 0.1.0
 * @author Lens Team
 */

import { join } from "@std/path";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * Options for LLM calls
 *
 * This interface defines the configuration options for calling an LLM.
 * These options control the behavior of the LLM, such as which model to use,
 * where to connect to the LLM, and how creative the responses should be.
 *
 * @interface LLMOptions
 * @property {string} [modelName] - The name of the LLM model to use (e.g., "llama3.2")
 * @property {string} [baseUrl] - The base URL of the LLM API (e.g., "http://localhost:11434")
 * @property {number} [temperature] - Controls randomness in the output (0.0-1.0)
 *                                    Lower values make the output more deterministic,
 *                                    higher values make it more creative
 * @example
 * ```typescript
 * const options: LLMOptions = {
 *   modelName: "llama3.2",
 *   baseUrl: "http://localhost:11434",
 *   temperature: 0.7
 * };
 * ```
 */
export interface LLMOptions {
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
}

/**
 * Response from LLM calls
 *
 * This interface defines the structure of responses from LLM calls.
 * It includes a success flag, the content of the response (if successful),
 * and an error message (if unsuccessful).
 *
 * @interface LLMResponse
 * @property {boolean} success - Whether the LLM call was successful
 * @property {string} [content] - The content of the LLM response (if successful)
 * @property {string} [error] - The error message (if unsuccessful)
 * @example
 * ```typescript
 * // Successful response
 * const successResponse: LLMResponse = {
 *   success: true,
 *   content: "Hello, how can I help you today?"
 * };
 *
 * // Error response
 * const errorResponse: LLMResponse = {
 *   success: false,
 *   error: "Failed to connect to LLM API"
 * };
 * ```
 */
export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Template sections extracted from a markdown template
 *
 * This interface defines the structure of a parsed template.
 * It includes all the sections that can be extracted from a markdown template,
 * such as the name, description, input variables, prompts, and output format.
 *
 * @interface TemplateContent
 * @property {string} name - The name of the template
 * @property {string} description - A description of what the template does
 * @property {Record<string, string>} inputVariables - A map of input variable names to descriptions
 * @property {string} systemPrompt - The system prompt to send to the LLM
 * @property {string} userPrompt - The user prompt to send to the LLM
 * @property {string} outputFormat - A description of the expected output format
 * @example
 * ```typescript
 * const template: TemplateContent = {
 *   name: "Greeting",
 *   description: "A template for generating greetings",
 *   inputVariables: {
 *     name: "The name of the person to greet",
 *     time: "The time of day (morning, afternoon, evening)"
 *   },
 *   systemPrompt: "You are a friendly assistant.",
 *   userPrompt: "Generate a greeting for {{name}} during the {{time}}.",
 *   outputFormat: "A friendly greeting appropriate for the time of day."
 * };
 * ```
 */
export interface TemplateContent {
  name: string;
  description: string;
  inputVariables: Record<string, string>;
  systemPrompt: string;
  userPrompt: string;
  outputFormat: string;
}

/**
 * Template engine configuration
 *
 * This interface defines the configuration options for the template engine.
 * Currently, it only includes the directory where templates are stored,
 * but it could be extended in the future to include other options.
 *
 * @interface TemplateEngineConfig
 * @property {string} templateDir - The directory where templates are stored
 * @example
 * ```typescript
 * const config: TemplateEngineConfig = {
 *   templateDir: "./prompts"
 * };
 * ```
 */
export interface TemplateEngineConfig {
  templateDir: string;
}

/**
 * Load a template from the filesystem
 *
 * This function loads a template file from the filesystem using the provided
 * configuration. The template file is expected to be a markdown file with
 * a specific structure.
 *
 * @function loadTemplate
 * @param {TemplateEngineConfig} config - Template engine configuration
 * @param {string} path - Path to the template, relative to the template directory
 * @returns {Promise<string>} The template content as a string
 * @throws {Error} If the template file cannot be loaded
 * @example
 * ```typescript
 * const config = { templateDir: "./prompts" };
 * const templateContent = await loadTemplate(config, "content_analysis/topic_extraction.md");
 * ```
 */
export async function loadTemplate(
  config: TemplateEngineConfig,
  path: string,
): Promise<string> {
  try {
    const fullPath = join(config.templateDir, path);
    return await Deno.readTextFile(fullPath);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load template at ${path}: ${errorMessage}`);
  }
}

/**
 * Parse a markdown template into sections
 *
 * This function parses a markdown template into structured sections.
 * It extracts the template name, description, input variables, system prompt,
 * user prompt, and output format from the markdown content.
 *
 * The template is expected to have the following structure:
 * ```markdown
 * # Template: Name
 *
 * ## Description
 * Description text
 *
 * ## Input Variables
 * - var1: Description of var1
 * - var2: Description of var2
 *
 * ## System Prompt
 * System prompt text
 *
 * ## User Prompt
 * User prompt text
 *
 * ## Output Format
 * Output format description
 * ```
 *
 * @function parseTemplate
 * @param {string} template - The template content as a string
 * @returns {TemplateContent} Parsed template sections
 * @example
 * ```typescript
 * const templateContent = "# Template: Greeting\n\n## Description\nA greeting template\n\n...";
 * const parsedTemplate = parseTemplate(templateContent);
 * console.log(parsedTemplate.name); // "Greeting"
 * ```
 */
export function parseTemplate(template: string): TemplateContent {
  // Split the template into sections based on markdown headers
  const sections = template.split(/^## /m);

  // Extract the template name from the first section
  const nameMatch = sections[0].match(/# Template: (.*?)$/m);
  const name = nameMatch ? nameMatch[1].trim() : "Unnamed Template";

  // Initialize the template content
  const content: TemplateContent = {
    name,
    description: "",
    inputVariables: {},
    systemPrompt: "",
    userPrompt: "",
    outputFormat: "",
  };

  // Process each section
  for (const section of sections) {
    if (!section.trim()) continue;

    const sectionLines = section.trim().split("\n");
    const sectionName = sectionLines[0].trim();
    const sectionContent = sectionLines.slice(1).join("\n").trim();

    switch (sectionName) {
      case "Description": {
        content.description = sectionContent;
        break;
      }
      case "Input Variables": {
        // Parse input variables from list format
        const variableLines = sectionContent.split("\n");
        for (const line of variableLines) {
          const match = line.match(/- (.*?): (.*)/);
          if (match) {
            content.inputVariables[match[1].trim()] = match[2].trim();
          }
        }
        break;
      }
      case "System Prompt": {
        content.systemPrompt = sectionContent;
        break;
      }
      case "User Prompt": {
        content.userPrompt = sectionContent;
        break;
      }
      case "Output Format": {
        content.outputFormat = sectionContent;
        break;
      }
    }
  }

  return content;
}

/**
 * Process a template by handling conditional logic
 *
 * This function processes a template by evaluating and resolving conditional
 * logic in the template. It supports if/else blocks with simple conditions.
 *
 * Conditional blocks in templates use the following syntax:
 * ```
 * {% if condition %}
 * Content to include if condition is true
 * {% else %}
 * Content to include if condition is false
 * {% endif %}
 * ```
 *
 * Conditions can be simple variable checks or equality comparisons:
 * - Simple check: `{% if variable %}` (true if variable exists and is truthy)
 * - Equality check: `{% if variable == "value" %}` (true if variable equals value)
 *
 * @function processTemplate
 * @param {string} template - The template content
 * @param {Record<string, unknown>} variables - Variables to use for conditional evaluation
 * @returns {string} Processed template with conditionals resolved
 * @example
 * ```typescript
 * const template = "{% if showGreeting %}Hello!{% else %}Goodbye!{% endif %}";
 * const variables = { showGreeting: true };
 * const processed = processTemplate(template, variables);
 * console.log(processed); // "Hello!"
 * ```
 */
export function processTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  // Simple implementation of conditional processing
  // This is a basic version that handles if/else blocks

  let processed = template;

  // Process if/else blocks
  const conditionalRegex =
    /{%\s*if\s+(.*?)\s*%}([\s\S]*?)(?:{%\s*else\s*%}([\s\S]*?))?{%\s*endif\s*%}/g;
  processed = processed.replace(
    conditionalRegex,
    (_, condition, ifContent, elseContent = "") => {
      // Evaluate the condition using the variables
      // This is a simple evaluation that checks if the variable exists and is truthy
      const parts = condition.split(/\s*==\s*/);
      let result: boolean;

      if (parts.length === 2) {
        // Handle equality comparison
        const varName = parts[0].trim();
        const value = parts[1].trim().replace(/^["']|["']$/g, ""); // Remove quotes
        result = String(variables[varName]) === value;
      } else {
        // Handle simple existence/truthiness check
        result = Boolean(variables[condition.trim()]);
      }

      return result ? ifContent : elseContent;
    },
  );

  return processed;
}

/**
 * Render a template by substituting variables
 *
 * This function renders a template by substituting variables into the template.
 * Variables in the template are denoted by double curly braces, e.g., {{variable}}.
 *
 * If a variable is not found in the variables object, it is left as is in the template.
 *
 * @function renderTemplate
 * @param {string} template - The processed template content
 * @param {Record<string, unknown>} variables - Variables to substitute into the template
 * @returns {string} Rendered template with variables substituted
 * @example
 * ```typescript
 * const template = "Hello, {{name}}! You are {{age}} years old.";
 * const variables = { name: "Alice", age: 30 };
 * const rendered = renderTemplate(template, variables);
 * console.log(rendered); // "Hello, Alice! You are 30 years old."
 * ```
 */
export function renderTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  // Substitute variables in the template
  return template.replace(/{{(.*?)}}/g, (_, variableName) => {
    const name = variableName.trim();
    return variables[name] !== undefined
      ? String(variables[name])
      : `{{${name}}}`;
  });
}

/**
 * Convert a template to a LangChain prompt template
 *
 * This function converts a parsed template to a LangChain ChatPromptTemplate.
 * It uses the system prompt and user prompt from the template to create a
 * chat prompt template that can be used with LangChain.
 *
 * @function toLangChainTemplate
 * @param {TemplateContent} templateContent - Parsed template content
 * @returns {ChatPromptTemplate} LangChain ChatPromptTemplate
 * @example
 * ```typescript
 * const template = parseTemplate(templateContent);
 * const langchainTemplate = toLangChainTemplate(template);
 * const chain = langchainTemplate.pipe(model).pipe(new StringOutputParser());
 * const response = await chain.invoke({});
 * ```
 */
export function toLangChainTemplate(
  templateContent: TemplateContent,
): ChatPromptTemplate {
  return ChatPromptTemplate.fromMessages([
    ["system", templateContent.systemPrompt],
    ["human", templateContent.userPrompt],
  ]);
}

/**
 * Call an LLM with a rendered template
 *
 * This function calls an LLM with a rendered template. It creates a chat model
 * using the provided options, creates a prompt template with the system and user
 * prompts, and invokes the model with the prompt.
 *
 * This function uses LangChain to interact with the LLM, specifically the ChatOllama
 * model from LangChain Community.
 *
 * @function callLLM
 * @param {string} systemPrompt - The system prompt to send to the LLM
 * @param {string} userPrompt - The user prompt to send to the LLM
 * @param {LLMOptions} [options={}] - Options for the LLM call
 * @returns {Promise<LLMResponse>} LLM response
 * @example
 * ```typescript
 * const systemPrompt = "You are a helpful assistant.";
 * const userPrompt = "Hello, how are you?";
 * const options = { modelName: "llama3.2", temperature: 0.7 };
 * const response = await callLLM(systemPrompt, userPrompt, options);
 * if (response.success) {
 *   console.log(response.content);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions = {},
): Promise<LLMResponse> {
  try {
    // Create the chat model
    const model = new ChatOllama({
      baseUrl: options.baseUrl || "http://localhost:11434",
      model: options.modelName || "llama3.2",
      temperature: options.temperature || 0.7,
    });

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
      error: `Failed to call LLM: ${errorMessage}`,
    };
  }
}

/**
 * Combined operation: load, parse, process, render, and call LLM with a template
 *
 * This function combines all the steps of the template engine into a single operation:
 * 1. Load the template from the filesystem
 * 2. Parse the template into sections
 * 3. Process the template (handle conditionals)
 * 4. Render the template (substitute variables)
 * 5. Call the LLM with the rendered template
 *
 * This is the main function of the template engine and provides a convenient
 * way to use templates with LLMs.
 *
 * @function callLLMWithTemplate
 * @param {TemplateEngineConfig} config - Template engine configuration
 * @param {string} path - Path to the template, relative to the template directory
 * @param {Record<string, unknown>} variables - Variables to use in the template
 * @param {LLMOptions} [options={}] - Options for the LLM call
 * @returns {Promise<LLMResponse>} LLM response
 * @example
 * ```typescript
 * const config = { templateDir: "./prompts" };
 * const variables = { name: "Alice", age: 30 };
 * const options = { modelName: "llama3.2", temperature: 0.7 };
 * const response = await callLLMWithTemplate(
 *   config,
 *   "greetings/hello.md",
 *   variables,
 *   options
 * );
 * if (response.success) {
 *   console.log(response.content);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export async function callLLMWithTemplate(
  config: TemplateEngineConfig,
  path: string,
  variables: Record<string, unknown>,
  options: LLMOptions = {},
): Promise<LLMResponse> {
  try {
    // Load the template
    const templateContent = await loadTemplate(config, path);

    // Parse the template
    const parsedTemplate = parseTemplate(templateContent);

    // Process the template (handle conditionals)
    const processedSystemPrompt = processTemplate(
      parsedTemplate.systemPrompt,
      variables,
    );
    const processedUserPrompt = processTemplate(
      parsedTemplate.userPrompt,
      variables,
    );

    // Render the template (substitute variables)
    const renderedSystemPrompt = renderTemplate(
      processedSystemPrompt,
      variables,
    );
    const renderedUserPrompt = renderTemplate(processedUserPrompt, variables);

    // Call the LLM
    return await callLLM(renderedSystemPrompt, renderedUserPrompt, options);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to process template: ${errorMessage}`,
    };
  }
}

/**
 * Create a template engine with the given configuration
 *
 * This factory function creates a template engine object with methods that
 * match the original class interface. It uses the functional implementation
 * under the hood, but provides an object-oriented interface for convenience.
 *
 * This is the recommended way to create a template engine, as it follows
 * functional programming principles while still providing a convenient API.
 *
 * @function createTemplateEngine
 * @param {TemplateEngineConfig} config - Template engine configuration
 * @returns {Object} Template engine object with methods
 * @example
 * ```typescript
 * const engine = createTemplateEngine({ templateDir: "./prompts" });
 *
 * // Load and parse a template
 * const templateContent = await engine.loadTemplate("greetings/hello.md");
 * const parsedTemplate = engine.parseTemplate(templateContent);
 *
 * // Process and render the template
 * const variables = { name: "Alice", age: 30 };
 * const processedSystemPrompt = engine.processTemplate(parsedTemplate.systemPrompt, variables);
 * const renderedSystemPrompt = engine.renderTemplate(processedSystemPrompt, variables);
 *
 * // Call the LLM
 * const response = await engine.callLLM(renderedSystemPrompt, "Hello!");
 * ```
 */
export function createTemplateEngine(config: TemplateEngineConfig) {
  return {
    loadTemplate: (path: string) => loadTemplate(config, path),
    parseTemplate,
    processTemplate,
    renderTemplate,
    toLangChainTemplate,
    callLLM,
    callLLMWithTemplate: (
      path: string,
      variables: Record<string, unknown>,
      options: LLMOptions = {},
    ) => callLLMWithTemplate(config, path, variables, options),
  };
}

/**
 * Template Engine class (for backward compatibility)
 *
 * This class provides an object-oriented interface to the template engine.
 * It is provided for backward compatibility with existing code that uses
 * the class-based API.
 *
 * For new code, it is recommended to use the functional API with the
 * `createTemplateEngine` factory function instead.
 *
 * @class TemplateEngine
 * @deprecated Use the functional API with `createTemplateEngine` instead
 * @example
 * ```typescript
 * const engine = new TemplateEngine("./prompts");
 * const templateContent = await engine.loadTemplate("greetings/hello.md");
 * const parsedTemplate = engine.parseTemplate(templateContent);
 * ```
 */
export class TemplateEngine {
  private config: TemplateEngineConfig;

  /**
   * Create a new TemplateEngine
   * @param {string} templateDir - The directory where templates are stored
   */
  constructor(templateDir: string) {
    this.config = { templateDir };
  }

  loadTemplate(path: string): Promise<string> {
    return loadTemplate(this.config, path);
  }

  parseTemplate(template: string): TemplateContent {
    return parseTemplate(template);
  }

  processTemplate(
    template: string,
    variables: Record<string, unknown>,
  ): string {
    return processTemplate(template, variables);
  }

  renderTemplate(template: string, variables: Record<string, unknown>): string {
    return renderTemplate(template, variables);
  }

  toLangChainTemplate(templateContent: TemplateContent): ChatPromptTemplate {
    return toLangChainTemplate(templateContent);
  }

  callLLM(
    systemPrompt: string,
    userPrompt: string,
    options: LLMOptions = {},
  ): Promise<LLMResponse> {
    return callLLM(systemPrompt, userPrompt, options);
  }

  callLLMWithTemplate(
    path: string,
    variables: Record<string, unknown>,
    options: LLMOptions = {},
  ): Promise<LLMResponse> {
    return callLLMWithTemplate(this.config, path, variables, options);
  }
}
