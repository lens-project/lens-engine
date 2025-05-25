/**
 * Test Fixtures for Metadata Extractor Tests
 *
 * This module provides test fixtures for the metadata extractor tests:
 * - Sample summary content
 * - Expected metadata extraction results
 * - Mock functions for testing
 */

// ============================================================================
// Sample Summary Content
// ============================================================================

/**
 * Sample blog post summary
 */
export const BLOG_POST_SUMMARY = `
The text describes a blog post by Austin Kleon titled "Maycember Rage," which reflects on the stress and burnout associated with the end of the school year in May. Inspired by an article from Parents.com about "Maycember Madness," the author identifies with the feeling of overwhelming obligations and emotional exhaustion as summer approaches.

Key points include:
- The term "Maycember" is used to describe the challenging period at the end of the academic year.
- The author relates personally to this experience, noting feelings of stress and even crying or stress snacking during this time.
- The post also mentions a newsletter that shares such personal reflections and experiences.

Additional information provided includes:
- Austin Kleon's background as a writer and illustrator, with references to his best-selling book "Steal Like an Artist."
- A link to subscribe to the author's weekly newsletter.
- References to previous posts and mixtapes from past years.

The summary concludes by noting that this site is part of the Amazon Affiliates program, which supports its free access.
`;

/**
 * Sample technical article summary
 */
export const TECHNICAL_ARTICLE_SUMMARY = `
This article provides a comprehensive guide to API testing using ReqBin with n8n integration. The author explains that API testing is essential for ensuring reliable software, especially in the "vibe coding" era where developers prioritize user experience and intuitive design.

The guide covers:
1. Setting up ReqBin for API testing
2. Creating and organizing test collections
3. Writing effective test cases for different API endpoints
4. Integrating with n8n for automated testing workflows
5. Implementing continuous testing in development pipelines

The article emphasizes the importance of thorough API testing for maintaining software quality and preventing regression issues. It includes practical examples and code snippets for common testing scenarios.

The author recommends a systematic approach to API testing, starting with basic endpoint validation and progressing to complex scenario testing. The integration with n8n allows for automated test execution and reporting.

The guide is aimed at developers and QA engineers of intermediate skill level who want to improve their API testing practices.
`;

/**
 * Sample AI technology summary
 */
export const AI_TECHNOLOGY_SUMMARY = `
The document titled "The AI Agent Developer's Bible" serves as a comprehensive guide for building and deploying AI agents using Anthropic's technologies. It covers the entire development lifecycle from conceptualization to production deployment.

Key sections include:
- Fundamental concepts of AI agents and their capabilities
- Best practices for prompt engineering and system design
- Techniques for testing and evaluating agent performance
- Methods for integrating agents with external tools and APIs
- Strategies for deploying agents in production environments
- Approaches to monitoring and improving agents over time

The guide emphasizes the importance of responsible AI development, including considerations for safety, privacy, and ethical use. It provides practical examples and code snippets to illustrate key concepts.

The document is aimed at developers with some experience in AI or software development who want to build sophisticated AI agents using Anthropic's Claude models. It assumes basic familiarity with programming concepts but explains AI-specific terminology.

The guide concludes with case studies of successful agent implementations and resources for further learning.
`;

// ============================================================================
// Expected Metadata Extraction Results
// ============================================================================

/**
 * Expected metadata for the blog post summary
 */
export const BLOG_POST_METADATA = {
  "title": "Maycember Rage",
  "summary":
    "A blog post by Austin Kleon discussing the stress and burnout associated with the end of the school year in May, comparing it to the overwhelming nature of December.",
  "topics": [
    "Stress Management",
    "Parenting",
    "Education",
    "Personal Reflection",
    "Work-Life Balance",
  ],
  "technologies": [],
  "contentType": "Personal Blog Post",
  "difficultyLevel": "Beginner",
  "keywords": [
    "Maycember",
    "stress",
    "burnout",
    "school year",
    "parenting",
    "emotional exhaustion",
    "Austin Kleon",
    "newsletter",
    "Steal Like an Artist",
  ],
  "estimatedReadingTime": 3,
  "author": "Austin Kleon",
  "publicationDate": null,
  "url": "https://austinkleon.com/2023/05/22/maycember-rage/",
};

/**
 * Expected metadata for the technical article summary
 */
export const TECHNICAL_ARTICLE_METADATA = {
  "title": "API Testing In The Vibe Coding Age",
  "summary":
    "A comprehensive guide to API testing using ReqBin with n8n integration, covering setup, test creation, and automation in the context of modern 'vibe coding' that prioritizes user experience.",
  "topics": [
    "API Testing",
    "Software Development",
    "Quality Assurance",
    "Automation",
    "Integration Testing",
  ],
  "technologies": [
    "ReqBin",
    "n8n",
    "API",
    "Continuous Integration",
  ],
  "contentType": "Tutorial",
  "difficultyLevel": "Intermediate",
  "keywords": [
    "API testing",
    "ReqBin",
    "n8n",
    "integration",
    "vibe coding",
    "test automation",
    "continuous testing",
    "software quality",
    "test cases",
    "development pipeline",
  ],
  "estimatedReadingTime": 12,
  "author": null,
  "publicationDate": null,
  "url": "https://example.com/api-testing-vibe-coding",
};

/**
 * Expected metadata for the AI technology summary
 */
export const AI_TECHNOLOGY_METADATA = {
  "title": "The AI Agent Developer's Bible",
  "summary":
    "A comprehensive guide for building and deploying AI agents using Anthropic's technologies, covering the entire development lifecycle from conceptualization to production deployment.",
  "topics": [
    "Artificial Intelligence",
    "AI Agents",
    "Software Development",
    "Prompt Engineering",
    "AI Deployment",
  ],
  "technologies": [
    "Anthropic",
    "Claude",
    "AI Agents",
    "APIs",
  ],
  "contentType": "Technical Guide",
  "difficultyLevel": "Intermediate",
  "keywords": [
    "AI agents",
    "Anthropic",
    "Claude",
    "prompt engineering",
    "system design",
    "testing",
    "deployment",
    "monitoring",
    "responsible AI",
    "integration",
  ],
  "estimatedReadingTime": 25,
  "author": "Anthropic",
  "publicationDate": null,
  "url": "https://docs.anthropic.com/claude/docs/ai-agent-developers-guide",
};

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Setup Ollama mock for metadata extraction
 *
 * @param mockMetadata The metadata to return
 * @returns Object with restore function to reset the mock
 */
export function setupOllamaMock(mockMetadata: Record<string, unknown>) {
  const originalFetch = globalThis.fetch;

  // Mock the fetch function
  globalThis.fetch = (input: URL | RequestInfo, init?: RequestInit) => {
    // Check if this is an Ollama API call
    if (typeof input === "string" && input.includes("localhost:11434")) {
      // Check if this is a POST request with JSON body
      if (init && init.method === "POST" && init.body) {
        // Parse the request body to get the model and prompt
        try {
          const requestBody = JSON.parse(init.body.toString());

          // If this is a chat completion request
          if (requestBody.model && requestBody.messages) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  model: requestBody.model,
                  created_at: new Date().toISOString(),
                  message: {
                    role: "assistant",
                    content: JSON.stringify(mockMetadata),
                  },
                  done: true,
                }),
            } as Response);
          }
        } catch (e) {
          console.error("Error parsing request body:", e);
        }
      }

      // Default response for Ollama API calls
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            message: {
              content: JSON.stringify(mockMetadata),
            },
          }),
      } as Response);
    }

    // Pass through other fetch calls
    return originalFetch(input, init);
  };

  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

/**
 * Setup file system mocks
 *
 * @param summaryContent The content to return when reading files
 * @returns Object with functions to get written content and restore original functions
 */
export function setupFileMocks(summaryContent: string) {
  const originalReadTextFile = Deno.readTextFile;
  const originalWriteTextFile = Deno.writeTextFile;
  const originalMkdir = Deno.mkdir;
  const originalStat = Deno.stat;

  let writtenContent = "";
  let writtenPath = "";

  // Mock Deno.readTextFile
  // @ts-ignore: Mocking for test purposes
  Deno.readTextFile = () => Promise.resolve(summaryContent);

  // Mock Deno.writeTextFile
  // @ts-ignore: Mocking for test purposes
  Deno.writeTextFile = (path: string, content: string) => {
    writtenContent = content;
    writtenPath = path.toString();
    return Promise.resolve();
  };

  // Mock Deno.mkdir
  // @ts-ignore: Mocking for test purposes
  Deno.mkdir = () => Promise.resolve();

  // Mock Deno.stat
  // @ts-ignore: Mocking for test purposes
  Deno.stat = () =>
    Promise.resolve({
      isFile: true,
    } as Deno.FileInfo);

  return {
    getWrittenContent: () => writtenContent,
    getWrittenPath: () => writtenPath,
    restore: () => {
      Deno.readTextFile = originalReadTextFile;
      Deno.writeTextFile = originalWriteTextFile;
      Deno.mkdir = originalMkdir;
      Deno.stat = originalStat;
    },
  };
}
