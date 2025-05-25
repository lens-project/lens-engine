/**
 * Test Fixtures for Template Engine and Client Tests
 *
 * This module provides test fixtures for the template engine and client tests:
 * - Sample template content with different structures
 * - Sample LLM responses for different scenarios
 * - Mock functions for file system operations and LLM calls
 * - Helper functions for testing
 */

// ============================================================================
// Sample Template Content
// ============================================================================

/**
 * Simple template with all sections
 */
export const SIMPLE_TEMPLATE = `# Template: Simple Test Template

## Description
This is a simple test template for unit testing.

## Input Variables
- name: The name of the person
- age: The age of the person

## System Prompt
You are a helpful assistant providing information about {{name}}.

## User Prompt
Tell me about a person named {{name}} who is {{age}} years old.

## Output Format
A short paragraph about {{name}}.`;

/**
 * Complex template with conditional logic
 */
export const CONDITIONAL_TEMPLATE = `# Template: Conditional Test Template

## Description
This template demonstrates conditional logic in templates.

## Input Variables
- name: The name of the person
- age: The age of the person
- include_hobbies: Whether to include hobbies section
- favorite_color: The person's favorite color

## System Prompt
You are a helpful assistant providing information about people.

{% if age > 18 %}
You should address {{name}} as an adult.
{% else %}
You should address {{name}} as a child.
{% endif %}

## User Prompt
Tell me about a person named {{name}} who is {{age}} years old.

{% if include_hobbies %}
Also mention their hobbies and interests.
{% endif %}

{% if favorite_color == "blue" %}
Mention that they like the color of the sky.
{% elif favorite_color == "green" %}
Mention that they like the color of nature.
{% else %}
Mention that their favorite color is {{favorite_color}}.
{% endif %}

## Output Format
A paragraph about {{name}} with the requested information.`;

/**
 * Template with special characters and formatting
 */
export const SPECIAL_CHARS_TEMPLATE = `# Template: Special Characters Template

## Description
This template includes special characters and formatting.

## Input Variables
- query: The search query with special characters
- options: Additional options

## System Prompt
You are a search assistant helping with queries that may contain special characters like & < > " '.

## User Prompt
Process the following query: "{{query}}"

Additional options: {{options}}

## Output Format
Results for the query "{{query}}" with HTML tags <strong>highlighted</strong>.`;

/**
 * Malformed template missing sections
 */
export const MALFORMED_TEMPLATE = `# Template: Malformed Template

## Description
This template is missing some required sections.

## Input Variables
- name: The name of the person

## System Prompt
You are a helpful assistant.

## User Prompt
Hello, {{name}}!`;

/**
 * Empty template with minimal content
 */
export const EMPTY_TEMPLATE = `# Template: Empty Template

## Description
This is an empty template with minimal content.

## Input Variables

## System Prompt

## User Prompt

## Output Format
`;

// ============================================================================
// Sample LLM Responses
// ============================================================================

/**
 * Sample successful LLM response
 */
export const SUCCESSFUL_LLM_RESPONSE = {
  success: true,
  content: "This is a successful response from the LLM.",
  error: undefined,
};

/**
 * Sample failed LLM response
 */
export const FAILED_LLM_RESPONSE = {
  success: false,
  content: undefined,
  error: "Failed to connect to LLM API: Connection refused",
};

/**
 * Sample JSON LLM response
 */
export const JSON_LLM_RESPONSE = {
  success: true,
  content: `{
    "name": "Alice",
    "age": 30,
    "occupation": "Software Engineer",
    "skills": ["JavaScript", "TypeScript", "React"]
  }`,
  error: undefined,
};

/**
 * Sample topics extraction response
 */
export const TOPICS_EXTRACTION_RESPONSE = {
  success: true,
  content: `[
    {"topic": "TypeScript", "relevance": 0.95},
    {"topic": "JavaScript", "relevance": 0.85},
    {"topic": "Programming Languages", "relevance": 0.75},
    {"topic": "Web Development", "relevance": 0.65},
    {"topic": "Static Typing", "relevance": 0.55}
  ]`,
  error: undefined,
};

/**
 * Sample query reformulation response
 */
export const QUERY_REFORMULATION_RESPONSE = {
  success: true,
  content: `{
    "expanded": "how to use typescript with deno runtime environment javascript server",
    "specific": "typescript configuration and best practices for deno server development",
    "semantic": "implementing typescript projects in deno environment for server-side applications"
  }`,
  error: undefined,
};

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Setup mocks for file system operations
 *
 * @param templateContent The template content to return from readTextFile
 * @param templateMap Optional map of template paths to content
 * @returns Object with restore function
 */
export function setupFileMocks(
  templateContent: string = SIMPLE_TEMPLATE,
  templateMap: Record<string, string> = {},
) {
  // Store original functions
  const originalReadTextFile = Deno.readTextFile;

  // Mock Deno.readTextFile to return provided content
  // @ts-ignore: Mocking for test purposes
  Deno.readTextFile = (path) => {
    const pathStr = String(path);

    // If the path is in the templateMap, return that content
    if (pathStr in templateMap) {
      return Promise.resolve(templateMap[pathStr]);
    }

    // Otherwise, return the default template content
    return Promise.resolve(templateContent);
  };

  // Return restore function
  return {
    restore: () => {
      Deno.readTextFile = originalReadTextFile;
    },
  };
}

/**
 * LLM response type
 */
export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * LLM options type
 */
export interface LLMOptions {
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
  [key: string]: unknown;
}

/**
 * Setup mocks for LLM API calls
 *
 * @param response The response to return from LLM calls
 * @returns Object with captured calls and restore function
 */
export function setupLLMMocks(response: LLMResponse = SUCCESSFUL_LLM_RESPONSE) {
  // We'll need to mock the ChatOllama class from LangChain
  // This is a bit complex as we need to mock an external module

  // Store information about calls
  const calls: {
    systemPrompt: string;
    userPrompt: string;
    options: LLMOptions;
  }[] = [];

  // Create a mock implementation
  const mockLLM = {
    // Mock the call method to return the provided response
    call: (_messages: unknown[]) => {
      return Promise.resolve({ text: response.content || "Mock response" });
    },

    // Track calls for verification
    trackCall: (
      systemPrompt: string,
      userPrompt: string,
      options: LLMOptions,
    ) => {
      calls.push({ systemPrompt, userPrompt, options });
    },
  };

  // Return the mock and functions to access call information
  return {
    mockLLM,
    getCalls: () => calls,
    getLastCall: () => calls[calls.length - 1],
    // No restore function needed as we're not modifying global state
  };
}

/**
 * Setup mocks for environment variables
 *
 * @param envVars Map of environment variables to values
 * @returns Object with restore function
 */
export function setupEnvMocks(envVars: Record<string, string> = {}) {
  // Store original functions
  const originalGet = Deno.env.get;

  // Mock env.get to return values from the map
  // @ts-ignore: Mocking for test purposes
  Deno.env.get = (key) => {
    return key in envVars ? envVars[key] : null;
  };

  // Return restore function
  return {
    restore: () => {
      Deno.env.get = originalGet;
    },
  };
}

/**
 * Template content type
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
 * Create a mock template engine for testing
 *
 * This function creates a mock template engine that can be used for testing
 * the template client without relying on the actual template engine.
 *
 * @param response The response to return from callLLM and callLLMWithTemplate
 * @returns Mock template engine object
 */
export function createMockTemplateEngine(
  response: LLMResponse = SUCCESSFUL_LLM_RESPONSE,
) {
  // Store information about calls
  const calls: {
    method: string;
    args: unknown[];
  }[] = [];

  // Create a mock template engine
  return {
    // Mock methods that return static values
    loadTemplate: (path: string) => {
      calls.push({ method: "loadTemplate", args: [path] });
      return Promise.resolve(SIMPLE_TEMPLATE);
    },

    parseTemplate: (template: string) => {
      calls.push({ method: "parseTemplate", args: [template] });
      return {
        name: "Mock Template",
        description: "This is a mock template.",
        inputVariables: { name: "Name variable", age: "Age variable" },
        systemPrompt: "You are a helpful assistant.",
        userPrompt: "Hello, {{name}}! You are {{age}} years old.",
        outputFormat: "A friendly response.",
      } as TemplateContent;
    },

    processTemplate: (template: string, variables: Record<string, unknown>) => {
      calls.push({ method: "processTemplate", args: [template, variables] });
      return template;
    },

    renderTemplate: (template: string, variables: Record<string, unknown>) => {
      calls.push({ method: "renderTemplate", args: [template, variables] });
      // Simple variable substitution for testing
      return template.replace(
        /{{(\w+)}}/g,
        (_, name) => String(variables[name] || `{{${name}}}`),
      );
    },

    // Mock methods that return the provided response
    callLLM: (
      systemPrompt: string,
      userPrompt: string,
      options: LLMOptions = {},
    ) => {
      calls.push({
        method: "callLLM",
        args: [systemPrompt, userPrompt, options],
      });
      return Promise.resolve(response);
    },

    callLLMWithTemplate: (
      path: string,
      variables: Record<string, unknown>,
      options: LLMOptions = {},
    ) => {
      calls.push({
        method: "callLLMWithTemplate",
        args: [path, variables, options],
      });
      return Promise.resolve(response);
    },

    // Helper methods for testing
    getCalls: () => calls,
    getLastCall: () => calls[calls.length - 1],
    clearCalls: () => {
      calls.length = 0;
    },
  };
}
