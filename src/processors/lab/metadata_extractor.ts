/**
 * Metadata Extractor for Content Summaries
 *
 * This module provides functionality to extract structured metadata from content summaries
 * using LLM-based analysis. It identifies topics, technologies, content type, difficulty level,
 * and other relevant attributes to enable content discovery and matching.
 *
 * Key features:
 * 1. Extract metadata from summary content using Ollama
 * 2. Process summary files to generate metadata files
 * 3. Standardize metadata format for consistent use
 */

import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { getConfig } from "../../config/mod.ts";

// ============================================================================
// Types
// ============================================================================

/**
 * Content metadata schema
 */
export interface ContentMetadata {
  // Core metadata
  title: string;                  // Original title of the content
  summary: string;                // Brief 1-2 sentence summary

  // Classification
  topics: string[];               // Main topics covered (e.g., "AI", "Coding", "Development")
  technologies: string[];         // Technologies mentioned (e.g., "Claude", "GitHub", "Terminal")

  // Content attributes
  contentType: string;            // Type of content (e.g., "Tutorial", "Overview", "Deep Dive")
  difficultyLevel: string;        // Estimated difficulty (e.g., "Beginner", "Intermediate", "Advanced")

  // Additional metadata
  keywords: string[];             // Important keywords for search
  estimatedReadingTime: number;   // In minutes

  // Optional metadata
  author?: string;                // Author of the original content
  publicationDate?: string;       // When the content was published
  url?: string;                   // Source URL if available
}

/**
 * Options for extracting metadata
 */
export interface MetadataExtractionOptions {
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
  /** Output format (json or md) */
  format?: 'json' | 'md';
}

/**
 * Response from the metadata extraction function
 */
export interface MetadataExtractionResponse {
  success: boolean;
  metadata?: ContentMetadata;
  error?: string;
}

/**
 * Options for processing a summary file
 */
export interface ProcessOptions extends MetadataExtractionOptions {
  /** The input summary file path */
  inputPath: string;
  /** The output directory for metadata */
  outputDir: string;
  /** Whether to overwrite existing metadata files */
  overwrite?: boolean;
  /** Output format (json or md) */
  format?: 'json' | 'md';
}

// ============================================================================
// Metadata Extraction Functions
// ============================================================================

/**
 * Extract metadata from summary content
 *
 * This function sends summary content to Ollama for metadata extraction using LangChain.
 *
 * @param content The summary content to analyze
 * @param title The title of the content (extracted from filename if not provided)
 * @param options Options for the extraction
 * @returns Object with success status and either metadata or error message
 */
export async function extractMetadata(
  content: string,
  title: string,
  options: MetadataExtractionOptions = {},
): Promise<MetadataExtractionResponse> {
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

    // Get the model name from options or config
    let modelName = options.modelName;
    if (!modelName) {
      try {
        const config = await getConfig();
        modelName = config.llm.llmModel;
      } catch (_error) {
        console.warn("Could not get model from config, using default");
      }
    }

    // Use a default model if none is specified
    modelName = modelName || "llama3.2";
    console.log(`Using Ollama model: ${modelName}`);

    // Create the system and user messages
    const systemMessage = "You are a metadata extraction assistant that analyzes content summaries and extracts structured metadata. Pay special attention to extracting or inferring URLs to the original content, as these are critical for linking back to the source.";

    const userMessage = `Please extract metadata from the following content summary with title "${title}":\n\n${content}\n\n` +
      `Extract the following metadata fields:\n` +
      `1. A concise 1-2 sentence summary of the content\n` +
      `2. Main topics covered (2-5 topics)\n` +
      `3. Technologies mentioned (if any)\n` +
      `4. Content type (Tutorial, Overview, Deep Dive, Case Study, etc.)\n` +
      `5. Difficulty level (Beginner, Intermediate, Advanced)\n` +
      `6. Important keywords (5-10 keywords)\n` +
      `7. Estimated reading time in minutes\n` +
      `8. Author (if mentioned)\n` +
      `9. Publication date (if mentioned)\n` +
      `10. URL (if mentioned) - IMPORTANT: Look carefully for any URLs, links, or references to websites in the content. If you can infer a URL based on the author or content, include it.\n\n` +
      `Format your response as a valid JSON object with this exact structure:\n` +
      `{\n` +
      `  "title": "${title}",\n` +
      `  "summary": "A concise 1-2 sentence summary",\n` +
      `  "topics": ["Topic1", "Topic2"],\n` +
      `  "technologies": ["Tech1", "Tech2"],\n` +
      `  "contentType": "The content type",\n` +
      `  "difficultyLevel": "The difficulty level",\n` +
      `  "keywords": ["Keyword1", "Keyword2"],\n` +
      `  "estimatedReadingTime": 5,\n` +
      `  "author": "Author name or null",\n` +
      `  "publicationDate": "Publication date or null",\n` +
      `  "url": "URL or null"\n` +
      `}\n\n` +
      `Be objective and accurate. Only include information that is explicitly or strongly implied in the summary.\n` +
      `If a field cannot be determined, use null for string fields and [] for arrays.\n` +
      `Return ONLY the JSON object with no additional text, comments, or explanations.\n` +
      `Do not include any comments in the JSON (no // or /* */ style comments).\n` +
      `The JSON must be valid and parseable.`;

    // Call Ollama API directly
    const baseUrl = options.baseUrl || "http://localhost:11434";
    const temperature = options.temperature || 0.2;

    // Prepare the request
    const requestBody = {
      model: modelName,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: temperature,
      stream: false
    };

    // Make the API call
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Parse the response
    const responseData = await response.json();
    const result = responseData.message.content;

    try {
      // Log the raw result for debugging
      console.log("Raw result:", result);

      // Extract the URL directly using regex
      let url: string | undefined = undefined;
      const urlMatch = result.match(/"url"\s*:\s*"([^"]*)"/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== "null") {
        url = urlMatch[1];
        console.log("Extracted URL:", url);
      }

      // Try to extract JSON from the result
      // First, look for JSON object pattern (most greedy match)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : result;

      // Extract key fields using regex
      const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]*)"/);
      const summaryMatch = jsonStr.match(/"summary"\s*:\s*"([^"]*)"/);
      const contentTypeMatch = jsonStr.match(/"contentType"\s*:\s*"([^"]*)"/);
      const authorMatch = jsonStr.match(/"author"\s*:\s*"([^"]*)"/);

      // Extract topics array using regex
      const topicsMatch = jsonStr.match(/"topics"\s*:\s*\[(.*?)\]/);
      const topics: string[] = [];
      if (topicsMatch && topicsMatch[1]) {
        const topicsStr = topicsMatch[1];
        const topicMatches = topicsStr.match(/"([^"]*)"/g);
        if (topicMatches) {
          topicMatches.forEach((topic: string) => {
            topics.push(topic.replace(/"/g, ''));
          });
        }
      }

      // Extract technologies array using regex
      const technologiesMatch = jsonStr.match(/"technologies"\s*:\s*\[(.*?)\]/);
      const technologies: string[] = [];
      if (technologiesMatch && technologiesMatch[1]) {
        const technologiesStr = technologiesMatch[1];
        const technologyMatches = technologiesStr.match(/"([^"]*)"/g);
        if (technologyMatches) {
          technologyMatches.forEach((tech: string) => {
            technologies.push(tech.replace(/"/g, ''));
          });
        }
      }

      // Extract keywords array using regex
      const keywordsMatch = jsonStr.match(/"keywords"\s*:\s*\[(.*?)\]/);
      const keywords: string[] = [];
      if (keywordsMatch && keywordsMatch[1]) {
        const keywordsStr = keywordsMatch[1];
        const keywordMatches = keywordsStr.match(/"([^"]*)"/g);
        if (keywordMatches) {
          keywordMatches.forEach((keyword: string) => {
            keywords.push(keyword.replace(/"/g, ''));
          });
        }
      }

      // Extract reading time
      let estimatedReadingTime = 5; // Default
      const readingTimeMatch = jsonStr.match(/"estimatedReadingTime"\s*:\s*(\d+)/);
      if (readingTimeMatch && readingTimeMatch[1]) {
        estimatedReadingTime = parseInt(readingTimeMatch[1], 10);
      }

      // Extract publication date
      let publicationDate: string | undefined = undefined;
      const publicationDateMatch = jsonStr.match(/"publicationDate"\s*:\s*"([^"]*)"/);
      if (publicationDateMatch && publicationDateMatch[1] && publicationDateMatch[1] !== "null") {
        publicationDate = publicationDateMatch[1];
      }

      // Create metadata object from extracted fields
      const metadata: ContentMetadata = {
        title: titleMatch && titleMatch[1] ? titleMatch[1] : title,
        summary: summaryMatch && summaryMatch[1] ? summaryMatch[1] : "",
        topics: topics.length > 0 ? topics : [],
        technologies: technologies.length > 0 ? technologies : [],
        contentType: contentTypeMatch && contentTypeMatch[1] ? contentTypeMatch[1] : "Article",
        difficultyLevel: "Intermediate", // Default
        keywords: keywords.length > 0 ? keywords : [],
        estimatedReadingTime: isNaN(estimatedReadingTime) ? 5 : estimatedReadingTime,
        author: authorMatch && authorMatch[1] ? authorMatch[1] : undefined,
        publicationDate: publicationDate,
        url: url
      };

      // Validate the metadata structure
      if (!metadata.title || !metadata.topics || !metadata.contentType) {
        throw new Error("Invalid metadata structure");
      }

      // Ensure all required fields are present
      const validatedMetadata: ContentMetadata = {
        title: metadata.title || title,
        summary: metadata.summary || "",
        topics: Array.isArray(metadata.topics) ? metadata.topics : [],
        technologies: Array.isArray(metadata.technologies) ? metadata.technologies : [],
        contentType: metadata.contentType || "Article",
        difficultyLevel: metadata.difficultyLevel || "Intermediate",
        keywords: Array.isArray(metadata.keywords) ? metadata.keywords : [],
        estimatedReadingTime: typeof metadata.estimatedReadingTime === 'number' ?
          metadata.estimatedReadingTime : 5,
        author: metadata.author || undefined,
        publicationDate: metadata.publicationDate || undefined,
        url: metadata.url || undefined
      };

      return {
        success: true,
        metadata: validatedMetadata,
      };
    } catch (parseError) {
      console.error("Raw result:", result);
      return {
        success: false,
        error: `Failed to parse metadata: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to extract metadata: ${errorMessage}`,
    };
  }
}

// ============================================================================
// File Operations Functions
// ============================================================================

/**
 * Extract title from summary filename
 *
 * @param filename The summary filename
 * @returns The extracted title
 */
export function extractTitleFromFilename(filename: string): string {
  // Remove file extension
  let title = filename.replace(/\.[^/.]+$/, "");

  // Remove "-summary" suffix if present
  title = title.replace(/-summary$/, "");

  // Replace hyphens with spaces
  title = title.replace(/-/g, " ");

  // Capitalize first letter of each word
  title = title.replace(/\b\w/g, (c) => c.toUpperCase());

  return title;
}

/**
 * Save metadata to a file
 *
 * @param metadata The metadata to save
 * @param outputPath The path to save the metadata to
 * @param overwrite Whether to overwrite existing files
 * @param format The output format (json or md)
 * @returns Promise that resolves when the metadata is saved
 */
export async function saveMetadata(
  metadata: ContentMetadata,
  outputPath: string,
  overwrite: boolean = false,
  format: 'json' | 'md' = 'md',
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

    // Prepare the content based on the format
    let content: string;

    if (format === 'json') {
      // JSON format
      content = JSON.stringify(metadata, null, 2);
    } else {
      // Markdown format
      content = `# ${metadata.title}

## Summary
${metadata.summary}

## Topics
${metadata.topics.map(topic => `- ${topic}`).join('\n')}

## Technologies
${metadata.technologies.length > 0
  ? metadata.technologies.map(tech => `- ${tech}`).join('\n')
  : '_No specific technologies mentioned_'}

## Content Type
${metadata.contentType}

## Difficulty Level
${metadata.difficultyLevel || 'Not specified'}

## Keywords
${metadata.keywords.map(keyword => `- ${keyword}`).join('\n')}

## Estimated Reading Time
${metadata.estimatedReadingTime !== undefined ? `${metadata.estimatedReadingTime} minutes` : 'Not specified'}

## Author
${metadata.author || 'Not specified'}

${metadata.url ? `## Original URL\n[${metadata.title}](${metadata.url})` : ''}

---
_Metadata extracted by Lens Engine_
`;
    }

    // Write the content to the file
    await Deno.writeTextFile(outputPath, content);

    console.log(`Metadata saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(
      `Error saving metadata: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Create an output filename from an input path
 *
 * @param inputPath The input file path
 * @param format The output format (json or md)
 * @returns The output filename
 */
export function createMetadataFilename(inputPath: string, format: 'json' | 'md' = 'md'): string {
  // Get the base filename without extension
  const filename = inputPath.split("/").pop() || "unknown";
  const baseFilename = filename.replace(/\.[^/.]+$/, "");

  // Create the output filename with the appropriate extension
  const extension = format === 'json' ? 'json' : 'md';
  return `${baseFilename}-metadata.${extension}`;
}

// ============================================================================
// Main Processing Function
// ============================================================================

/**
 * Process a summary file: extract metadata and save
 *
 * @param options Options for processing the summary file
 * @returns Object with success status and either metadata or error message
 */
export async function processSummaryFile(
  options: ProcessOptions,
): Promise<MetadataExtractionResponse> {
  try {
    // Read the summary file
    const summary = await Deno.readTextFile(options.inputPath);

    // Extract title from filename
    const filename = options.inputPath.split("/").pop() || "";
    const title = extractTitleFromFilename(filename);

    // Extract metadata
    const result = await extractMetadata(summary, title, {
      modelName: options.modelName,
      baseUrl: options.baseUrl,
      temperature: options.temperature,
      langSmithTracing: options.langSmithTracing,
      langSmithApiKey: options.langSmithApiKey,
      langSmithProject: options.langSmithProject,
    });

    // If extraction failed, return the error
    if (!result.success) {
      return result;
    }

    // Determine the output format (default to markdown)
    const format = options.format || 'md';

    // Create the output filename
    const outputFilename = createMetadataFilename(options.inputPath, format);
    const outputPath = join(options.outputDir, outputFilename);

    // Save the metadata
    await saveMetadata(result.metadata!, outputPath, options.overwrite, format);

    return {
      success: true,
      metadata: result.metadata,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: `Failed to process summary file: ${errorMessage}`,
    };
  }
}

// ============================================================================
// Directory Processing Function
// ============================================================================

/**
 * Process all summary files in a directory
 *
 * @param inputDir Directory containing summary files to process
 * @param outputDir Directory to save metadata files to
 * @param options Additional processing options
 * @returns Summary of processing results
 */
export async function processSummaryDirectory(
  inputDir: string,
  outputDir: string,
  options: MetadataExtractionOptions = {},
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

    // Get all summary files in the input directory
    const files: string[] = [];
    for await (const entry of Deno.readDir(inputDir)) {
      if (entry.isFile && entry.name.endsWith("-summary.md")) {
        files.push(entry.name);
      }
    }

    console.log(`Found ${files.length} summary files in ${inputDir}`);

    // Process each file
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const inputPath = join(inputDir, file);
      console.log(`Processing ${inputPath}...`);

      try {
        const result = await processSummaryFile({
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
        const errorMessage = error instanceof Error ? error.message : String(error);
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
    throw new Error(`Failed to process summary directory: ${errorMessage}`);
  }
}

// Example usage when run directly
if (import.meta.main) {
  console.log("Metadata Extractor for Content Summaries");
  console.log("========================================");

  try {
    // Load configuration to get data directory
    const config = await getConfig();
    const dataDir = config.core.dataDir;

    // Use the data directory from configuration
    const inputDir = join(dataDir, "processed");
    const outputDir = join(dataDir, "metadata");

    console.log(`Data directory: ${dataDir}`);
    console.log(`Input directory: ${inputDir}`);
    console.log(`Output directory: ${outputDir}`);
    console.log(`Using Ollama model: ${config.llm.llmModel || "llama3.2"}`);
    console.log("========================================\n");

    // Ensure output directory exists
    await ensureDir(outputDir);

    // Get command line arguments
    const args = Deno.args;
    const processAll = args.includes("--all");
    const specificFile = args.find(arg => arg.endsWith(".md"));
    const useJsonFormat = args.includes("--json");
    const format = useJsonFormat ? 'json' : 'md';

    // Determine which file to process
    let testFile: string;

    if (specificFile) {
      testFile = specificFile;
    } else {
      // Default test file
      testFile = "maycember-rage-summary.md";

      // Try to find any summary file if the default doesn't exist
      try {
        const stat = await Deno.stat(join(inputDir, testFile));
        if (!stat.isFile) {
          // Find the first summary file
          for await (const entry of Deno.readDir(inputDir)) {
            if (entry.isFile && entry.name.endsWith("-summary.md")) {
              testFile = entry.name;
              break;
            }
          }
        }
      } catch (_error) {
        // Find the first summary file
        for await (const entry of Deno.readDir(inputDir)) {
          if (entry.isFile && entry.name.endsWith("-summary.md")) {
            testFile = entry.name;
            break;
          }
        }
      }
    }

    const testInputPath = join(inputDir, testFile);
    console.log(`Processing file: ${testFile}`);

    // Process the test file
    const result = await processSummaryFile({
      inputPath: testInputPath,
      outputDir,
      modelName: config.llm.llmModel,
      temperature: 0.2,
      langSmithTracing: false, // Disable tracing for better performance
      overwrite: true,
      format: format // Use the format from command line args
    });

    if (result.success) {
      console.log("\n✅ Metadata extraction successful!");
      console.log("----------------------------------------");
      console.log(JSON.stringify(result.metadata, null, 2));
      console.log("----------------------------------------");
      console.log(`Metadata saved to: ${join(outputDir, createMetadataFilename(testInputPath))}`);

      // Process all files if requested
      if (processAll) {
        console.log("\nProcessing all summary files...");

        // Process all summary files in the processed directory
        const summary = await processSummaryDirectory(
          inputDir,
          outputDir,
          {
            modelName: config.llm.llmModel,
            temperature: 0.2,
            langSmithTracing: false, // Disable tracing for better performance
            format: format // Use the format from command line args
          }
        );

        console.log("\nProcessing Summary:");
        console.log(`Total files: ${summary.totalFiles}`);
        console.log(`Successfully processed: ${summary.successCount}`);
        console.log(`Failed to process: ${summary.failureCount}`);

        if (summary.failureCount > 0) {
          console.log("\nFailed files:");
          summary.results
            .filter(r => !r.success)
            .forEach(r => console.log(`- ${r.file}: ${r.error}`));
        }
      } else {
        console.log("\nTo process all files, run with --all flag:");
        console.log("deno run --allow-net --allow-read --allow-write --allow-env --env src/processors/lab/metadata_extractor.ts --all");
      }
    } else {
      console.error(`\n❌ Failed to extract metadata: ${result.error}`);
      console.error("Make sure Ollama is running and the model is available.");
      console.error("Try running: ollama run llama3.2");
    }
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );

    console.error("\nTroubleshooting tips:");
    console.error("1. Make sure Ollama is running (ollama serve)");
    console.error("2. Check that the model is available (ollama list)");
    console.error("3. Verify your data directory in .env file");
    console.error("4. Ensure you have summary files in the processed directory");
  }
}
