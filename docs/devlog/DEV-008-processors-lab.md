# Processors Lab - HTML Content Summarization

## Overview

This devlog documents my work on the HTML Content Summarizer module in the Lens project's processors lab. The module represents an exploration of functional programming techniques combined with LLM integration to create a pipeline for processing HTML content. This work builds on previous experiments in the retrieval lab, creating an end-to-end workflow for content processing.

## Motivation

The primary goals for this lab were:

1. Create a modular, functional approach to HTML content processing
2. Integrate with local LLMs via Ollama for content summarization
3. Develop a robust testing strategy for both unit and integration tests
4. Design a pipeline that could eventually be integrated into the main Lens codebase

## Technical Approach

### Functional Programming Design

I implemented the HTML Content Summarizer using a functional programming approach with pure functions and composition. This design choice offers several advantages:

1. **Modularity**: Each function has a single responsibility, making the code easier to understand and test
2. **Composability**: Functions can be combined in different ways to create new functionality
3. **Testability**: Pure functions with no side effects are easier to test in isolation
4. **Maintainability**: The code is more maintainable as changes to one function don't affect others

The core functions in the module include:

- `extractTextFromHtml`: Extracts text content from HTML
- `summarizeContent`: Summarizes content using Ollama
- `saveProcessedContent`: Saves processed content to a file
- `createOutputFilename`: Creates an output filename from an input path
- `processHtmlFile`: Orchestrates the entire process

### HTML Text Extraction

For HTML text extraction, I implemented a regex-based approach that:

1. Removes script and style elements
2. Extracts content from the body if present
3. Removes HTML tags while preserving content
4. Normalizes whitespace
5. Decodes HTML entities

While this approach is sufficient for the lab, I noted in the code that a more robust solution would use a proper HTML parser. This is an area for future improvement.

```typescript
export function extractTextFromHtml(html: string): string {
  try {
    // Remove script and style elements
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");

    // Extract content from body if present
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      text = bodyMatch[1];
    }
    
    // Additional processing...
    
    return text;
  } catch (error) {
    console.error("Error extracting text from HTML:", error);
    return "";
  }
}
```

### LLM Integration with Ollama

One of the most interesting aspects of this lab was integrating with Ollama, a local LLM server. I used LangChain to create a simple but effective pipeline:

1. Create a chat model with Ollama
2. Define a prompt template for summarization
3. Create a processing chain
4. Invoke the chain and handle the response

```typescript
export async function summarizeContent(
  content: string,
  options: SummaryOptions = {}
): Promise<SummaryResponse> {
  try {
    // Create the chat model
    const model = new ChatOllama({
      baseUrl: options.baseUrl || "http://localhost:11434",
      model: options.modelName || "llama3.2",
      temperature: options.temperature || 0.7,
    });

    // Create a prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a helpful assistant that summarizes content...`],
      ["human", `Please summarize the following content:\n\n${content}`],
    ]);

    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Invoke the chain
    const summary = await chain.invoke({});

    return {
      success: true,
      content: summary,
    };
  } catch (error: unknown) {
    // Error handling...
  }
}
```

This approach demonstrates how LLMs can be integrated into content processing pipelines to add semantic understanding and transformation capabilities.

### End-to-End Processing

The main processing function, `processHtmlFile`, orchestrates the entire pipeline:

1. Read the HTML file
2. Extract text from HTML
3. Summarize the content using Ollama
4. Create an output filename
5. Save the processed content

This function demonstrates the power of functional composition, where each step in the pipeline is handled by a specialized function.

## Testing Strategy

I developed a comprehensive testing strategy for the HTML Content Summarizer, including:

### Unit Tests

Unit tests focus on testing individual functions in isolation:

- `extractTextFromHtml`: Tests that text is correctly extracted from HTML
- `createOutputFilename`: Tests that output filenames are correctly generated

### Integration Tests

Integration tests verify that the components work together correctly:

- `summarizeContent`: Tests integration with Ollama
- `processHtmlFile`: Tests the end-to-end processing pipeline

The tests are designed to be robust, with appropriate error handling and fallbacks when external dependencies (like Ollama) are not available.

## Connection to Retrieval Lab

This processors lab builds on the work done in the retrieval lab, which focused on fetching content from URLs. Together, they form a complete pipeline:

1. The retrieval lab fetches HTML content from URLs
2. The processors lab extracts text from HTML and summarizes it

This demonstrates how modular, functional components can be combined to create powerful workflows.

## Challenges and Learnings

### Challenges

1. **HTML Parsing**: Regex-based HTML parsing is inherently limited. A proper HTML parser would be more robust but would add complexity.
2. **LLM Integration**: Working with local LLMs introduces dependencies and potential points of failure. The code needs to handle cases where the LLM is not available or returns unexpected results.
3. **Testing**: Testing code that interacts with external services like Ollama is challenging. I had to design tests that could run both with and without Ollama being available.

### Learnings

1. **Functional Programming**: The functional approach proved to be very effective for this type of processing pipeline. It made the code more modular, testable, and maintainable.
2. **LLM Integration**: LangChain provides a powerful abstraction for working with LLMs. The chain-based approach makes it easy to compose different components.
3. **Error Handling**: Robust error handling is essential when working with external services. The code needs to gracefully handle failures at any point in the pipeline.

## Future Improvements

1. **HTML Parsing**: Replace the regex-based HTML parsing with a proper HTML parser library.
2. **Content Extraction**: Implement more sophisticated content extraction algorithms to better identify the main content of a page.
3. **Summarization Options**: Add more options for summarization, such as different prompt templates for different types of content.
4. **Parallelization**: Add support for processing multiple files in parallel.
5. **Caching**: Implement caching to avoid re-summarizing content that has already been processed.

## Conclusion

The HTML Content Summarizer lab demonstrates the power of combining functional programming with LLM integration for content processing. The modular, composable approach makes it easy to extend and adapt the code for different use cases.

As this lab matures, the next steps would be to refactor it into a production-ready module that could be integrated into the main Lens codebase. This would involve:

1. Moving the code out of the lab directory
2. Creating a proper types.ts file
3. Breaking the code into smaller, more focused files
4. Exporting everything through a mod.ts file
5. Creating comprehensive tests for the production code

This lab has been a valuable learning experience, providing insights into functional programming, LLM integration, and content processing that will inform future work on the Lens project.

## Examples

### Claude summarization

Based on the provided article, here's a summary:

Austin Kleon wrote a blog post titled "On reading novels" published on Thursday, April 24, 2025. The post features an image of posters from National Library Week 1960-1961.

In the post, Kleon references his Tuesday newsletter called "on sitting around and reading a novel" where he discussed the pleasure of novel reading. He shares a quote from that newsletter that emphasizes how reading novels in 2025 feels "subversive" and is "an act of resistance" against what he calls "the contemporary shitstream."

Kleon mentions that his newsletter received hundreds of book recommendations in the comments. He also directs readers to check out another of his previous newsletters titled "Big books for summer" for a list of his favorite novels.

The blog post is categorized under "Reading" and tagged with "newsletter," "novels," and "reading."

### qwen2.57b summarization

**Summary**

Austin Kleon's blog post discusses the importance of reading novels for pleasure and feeling like one is "getting away with something." He argues that reading should be a subversive act, swimming against the current of the contemporary media landscape.

**Main Points**

* Reading novels can feel like an act of resistance in today's culture.
* The experience of reading for pleasure is essential to the reading experience.
* Austin Kleon shares his favorite novels and encourages readers to explore new books.

**Important Details**

* The post was part of a newsletter that received hundreds of reader recommendations.
* Kleon mentions his previous letter, "Big books for summer," which lists some of his favorite novels.
* He is a bestselling author known for his books on creativity, including "Steal Like An Artist."