/**
 * Markdown Content Summarizer Lab
 *
 * This module provides functionality to process markdown files,
 * summarize the content using Ollama, and save the processed results.
 *
 * It uses a functional programming approach with pure functions and composition.
 *
 * Key features:
 * 1. Process markdown content
 * 2. Summarize content using Ollama
 * 3. Save processed content to files
 * 4. Process markdown files in a single operation
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getConfig } from "../../config/mod.ts";

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
}

/**
 * Options for processing a markdown file
 */
export interface ProcessOptions extends SummaryOptions {
  /** The input file path */
  inputPath: string;
  /** The output directory */
  outputDir: string;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
}

// ============================================================================
// Markdown Processing Functions
// ============================================================================

/**
 * Process markdown content
 *
 * This function processes markdown content, removing any front matter
 * and preparing it for summarization.
 *
 * @param markdown The markdown content to process
 * @returns The processed text content
 */
export function processMarkdownContent(markdown: string): string {
  try {
    // Remove YAML front matter if present
    // This pattern matches front matter at the beginning of the document
    let text = markdown.replace(/^\s*---\s*\n[\s\S]*?\n\s*---\s*\n/, "");

    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, "");

    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, "");

    // Extract URLs from markdown links and preserve them
    const urls: string[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    // First, collect all URLs
    while ((match = linkRegex.exec(markdown)) !== null) {
      // We only need the URL (match[2]), not the link text (match[1])
      const url = match[2];
      if (url && url.startsWith("http")) {
        urls.push(url);
      }
    }

    // Then replace markdown links with just the text
    text = text.replace(linkRegex, "$1");

    // Add a URLs section at the end if any were found
    if (urls.length > 0) {
      text += "\n\nRelevant URLs:\n" + urls.map((url) => `- ${url}`).join("\n");
    }

    // Remove image references
    text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, "");

    // Remove bold and italic formatting but keep the text
    text = text.replace(/\*\*(.*?)\*\*/g, "$1"); // Bold
    text = text.replace(/\*(.*?)\*/g, "$1"); // Italic
    text = text.replace(/__(.*?)__/g, "$1"); // Bold
    text = text.replace(/_(.*?)_/g, "$1"); // Italic

    // Remove inline code but keep the text
    text = text.replace(/`([^`]+)`/g, "$1");

    // Replace special characters that might cause issues
    text = text.replace(/[{}]/g, ""); // Remove curly braces
    text = text.replace(/\\/g, ""); // Remove backslashes

    // Normalize whitespace
    text = text.replace(/\s+/g, " ");

    // Trim the text
    text = text.trim();

    return text;
  } catch (error) {
    console.error("Error processing markdown content:", error);
    return "";
  }
}

// ============================================================================
// Ollama Integration Functions
// ============================================================================

/**
 * Summarize content using Ollama
 *
 * This function sends content to Ollama for summarization using LangChain.
 *
 * @param content The content to summarize
 * @param options Options for the summarization
 * @returns Object with success status and either summary content or error message
 */
export async function summarizeContent(
  content: string,
  options: SummaryOptions = {},
): Promise<SummaryResponse> {
  try {
    // If LangSmith tracing is explicitly disabled, skip config loading
    if (options.langSmithTracing === false) {
      // Explicitly disable tracing
      Deno.env.set("LANGCHAIN_TRACING_V2", "false");
    } else {
      try {
        // Configure LangSmith tracing
        const config = await getConfig();

        // Use either provided options or config values
        const apiKey = options.langSmithApiKey || config.langSmith.apiKey;
        const project = options.langSmithProject || config.langSmith.project;

        if (apiKey) {
          Deno.env.set("LANGCHAIN_API_KEY", apiKey);
          Deno.env.set("LANGCHAIN_PROJECT", project);
          Deno.env.set("LANGCHAIN_TRACING_V2", "true");
        }
      } catch (_configError) {
        // If config loading fails but tracing isn't explicitly disabled,
        // disable it and continue
        console.warn("Failed to load LangSmith config, disabling tracing");
        Deno.env.set("LANGCHAIN_TRACING_V2", "false");
      }
    }

    // Create the chat model
    const model = new ChatOllama({
      baseUrl: options.baseUrl || "http://localhost:11434",
      model: options.modelName || "llama3.2",
      temperature: options.temperature || 0.7,
    });

    // Create a prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a helpful assistant that summarizes content.
      Create a concise but comprehensive summary of the provided text.
      Focus on the main points, key arguments, and important details.
      Organize the summary in a clear, readable format with paragraphs.
      Do not include your own opinions or analysis.
      IMPORTANT: If the content contains a "Relevant URLs" section, include those URLs in your summary
      to maintain links to the original content.`,
      ],
      ["human", `Please summarize the following content:\n\n${content}`],
    ]);

    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Invoke the chain (content is already in the prompt)
    const summary = await chain.invoke({});

    return {
      success: true,
      content: summary,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to summarize content: ${errorMessage}`,
    };
  }
}

// ============================================================================
// File Operations Functions
// ============================================================================

/**
 * Save processed content to a file
 *
 * @param content The content to save
 * @param outputPath The path to save the content to
 * @param overwrite Whether to overwrite existing files
 * @returns Promise that resolves when the content is saved
 */
export async function saveProcessedContent(
  content: string,
  outputPath: string,
  overwrite: boolean = false,
): Promise<void> {
  try {
    // Check if file exists and we're not overwriting
    if (!overwrite) {
      try {
        const stat = await Deno.stat(outputPath);
        if (stat.isFile) {
          console.log(`File already exists: ${outputPath} (skipping)`);
          return;
        }
      } catch (_error) {
        // File doesn't exist, which is fine
      }
    }

    // Ensure the directory exists
    await ensureDir(outputPath.substring(0, outputPath.lastIndexOf("/")));

    // Write the content to the file
    await Deno.writeTextFile(outputPath, content);

    console.log(`Content saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(
      `Error saving content: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Create an output filename from an input path
 *
 * @param inputPath The input file path
 * @returns The output filename
 */
export function createOutputFilename(inputPath: string): string {
  // Get the base filename without extension
  const filename = inputPath.split("/").pop() || "unknown";
  const baseFilename = filename.replace(/\.[^/.]+$/, "");

  // Create the output filename
  return `${baseFilename}-summary.md`;
}

// ============================================================================
// Main Processing Function
// ============================================================================

/**
 * Process a markdown file: extract text, summarize, and save
 *
 * @param options Options for processing the markdown file
 * @returns Object with success status and either summary content or error message
 */
export async function processMarkdownFile(
  options: ProcessOptions,
): Promise<SummaryResponse> {
  try {
    // Read the markdown file
    const markdown = await Deno.readTextFile(options.inputPath);

    // Process markdown content
    const text = processMarkdownContent(markdown);

    // Summarize the content
    const summary = await summarizeContent(text, {
      modelName: options.modelName,
      baseUrl: options.baseUrl,
      temperature: options.temperature,
      langSmithTracing: options.langSmithTracing,
      langSmithApiKey: options.langSmithApiKey,
      langSmithProject: options.langSmithProject,
    });

    // If summarization failed, return the error
    if (!summary.success) {
      return summary;
    }

    // Create the output filename
    const outputFilename = createOutputFilename(options.inputPath);
    const outputPath = join(options.outputDir, outputFilename);

    // Save the processed content
    await saveProcessedContent(summary.content!, outputPath, options.overwrite);

    return {
      success: true,
      content: summary.content,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to process markdown file: ${errorMessage}`,
    };
  }
}

// ============================================================================
// Directory Processing Function
// ============================================================================

/**
 * Process all markdown files in a directory
 *
 * @param inputDir Directory containing markdown files to process
 * @param outputDir Directory to save processed files to
 * @param options Additional processing options
 * @returns Summary of processing results
 */
export async function processMarkdownDirectory(
  inputDir: string,
  outputDir: string,
  options: SummaryOptions = {},
): Promise<{
  totalFiles: number;
  successCount: number;
  failureCount: number;
  results: Array<{ file: string; success: boolean; error?: string }>;
}> {
  try {
    // Ensure directories exist
    await ensureDir(inputDir);
    await ensureDir(outputDir);

    // Get all markdown files in the input directory
    const files: string[] = [];
    for await (const entry of Deno.readDir(inputDir)) {
      if (
        entry.isFile &&
        (entry.name.endsWith(".md") || entry.name.endsWith(".markdown"))
      ) {
        files.push(entry.name);
      }
    }

    console.log(`Found ${files.length} markdown files in ${inputDir}`);

    // Process each file
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const inputPath = join(inputDir, file);
      console.log(`Processing ${inputPath}...`);

      try {
        const result = await processMarkdownFile({
          inputPath,
          outputDir,
          ...options,
        });

        if (result.success) {
          successCount++;
          results.push({ file, success: true });
          console.log(`✅ Successfully processed ${file}`);
        } else {
          failureCount++;
          results.push({ file, success: false, error: result.error });
          console.error(`❌ Failed to process ${file}: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        failureCount++;
        results.push({ file, success: false, error: errorMessage });
        console.error(`❌ Error processing ${file}: ${errorMessage}`);
      }
    }

    return {
      totalFiles: files.length,
      successCount,
      failureCount,
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to process markdown directory: ${errorMessage}`);
  }
}

// Example usage when run directly
if (import.meta.main) {
  console.log("Markdown Content Summarizer");

  try {
    // Load configuration to get data directory
    const config = await getConfig();
    const dataDir = config.core.dataDir;

    // Use the data directory from configuration
    const inputDir = join(dataDir, "clippings");
    const outputDir = join(dataDir, "processed");

    console.log(`Using data directory: ${dataDir}`);
    console.log(`Input directory: ${inputDir}`);
    console.log(`Output directory: ${outputDir}`);

    // Ensure directories exist
    try {
      await ensureDir(inputDir);
      await ensureDir(outputDir);
    } catch (dirError) {
      console.error(
        `Error creating directories: ${
          dirError instanceof Error ? dirError.message : String(dirError)
        }`,
      );
      Deno.exit(1);
    }

    // Get all markdown files in the input directory
    const files: string[] = [];
    try {
      for await (const entry of Deno.readDir(inputDir)) {
        if (
          entry.isFile &&
          (entry.name.endsWith(".md") || entry.name.endsWith(".markdown"))
        ) {
          files.push(entry.name);
        }
      }
    } catch (readError) {
      console.error(
        `Error reading directory: ${
          readError instanceof Error ? readError.message : String(readError)
        }`,
      );
      Deno.exit(1);
    }

    console.log(`Found ${files.length} markdown files in ${inputDir}`);

    if (files.length === 0) {
      console.log("No markdown files found to process.");
      Deno.exit(0);
    }

    // Process each file individually to isolate errors
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const inputPath = join(inputDir, file);
      console.log(`Processing ${inputPath}...`);

      try {
        // Read the file content
        const markdown = await Deno.readTextFile(inputPath);
        console.log(`Read ${markdown.length} characters from ${file}`);

        // Process markdown content
        const text = processMarkdownContent(markdown);
        console.log(`Processed to ${text.length} characters`);

        // Create output filename
        const outputFilename = createOutputFilename(inputPath);
        const outputPath = join(outputDir, outputFilename);

        // Summarize content
        try {
          const summary = await summarizeContent(text, {
            modelName: config.llm.llmModel,
            temperature: 0.5,
            langSmithTracing: config.langSmith.tracingEnabled,
          });

          if (summary.success && summary.content) {
            // Save the processed content
            await saveProcessedContent(summary.content, outputPath, true);
            successCount++;
            results.push({ file, success: true });
            console.log(`✅ Successfully processed ${file}`);
          } else {
            failureCount++;
            results.push({ file, success: false, error: summary.error });
            console.error(`❌ Failed to summarize ${file}: ${summary.error}`);
          }
        } catch (summaryError) {
          failureCount++;
          const errorMessage = summaryError instanceof Error
            ? summaryError.message
            : String(summaryError);
          results.push({
            file,
            success: false,
            error: `Summarization error: ${errorMessage}`,
          });
          console.error(`❌ Error summarizing ${file}: ${errorMessage}`);
        }
      } catch (fileError) {
        failureCount++;
        const errorMessage = fileError instanceof Error
          ? fileError.message
          : String(fileError);
        results.push({
          file,
          success: false,
          error: `File processing error: ${errorMessage}`,
        });
        console.error(`❌ Error processing ${file}: ${errorMessage}`);
      }
    }

    console.log("\nProcessing Summary:");
    console.log(`Total files: ${files.length}`);
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Failed to process: ${failureCount}`);

    if (failureCount > 0) {
      console.log("\nFailed files:");
      results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`- ${r.file}: ${r.error}`));
    }
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
