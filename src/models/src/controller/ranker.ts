/**
 * Content Ranking Controller
 *
 * This module provides functionality to rank content using Ollama.
 * It integrates with the production Ollama client and follows the models module architecture.
 */

import { chatWithOllamaCustomPrompt } from "../providers/ollama/client.ts";
import { loadRankingCriteria, generateCriteriaPromptText } from "@src/ranking/src/criteria-loader.ts";
import { type RankingCriteriaConfig } from "@src/ranking/types.ts";

// ============================================================================
// Types
// ============================================================================

/**
 * Article input for ranking
 */
export interface ArticleInput {
  title: string;
  summary: string;
  url: string;
  source?: string;
  publishedAt?: Date;
  categories?: string[];
}

/**
 * Context for ranking
 */
export interface RankingContext {
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userMood?: 'focused' | 'casual' | 'learning' | 'entertainment';
  readingDuration?: 'quick' | 'medium' | 'deep';
}

/**
 * Options for ranking content
 */
export interface RankingOptions {
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
  /** Custom ranking criteria configuration */
  criteriaConfig?: RankingCriteriaConfig;
  /** Enable verbose logging for criteria loading */
  verbose?: boolean;
}

/**
 * Parsed ranking result from LLM
 */
export interface RankingResult {
  score: number;
  reasoning: string;
  categories: string[];
  estimatedReadTime: number;
}

/**
 * Response from the ranking function
 */
export interface RankingResponse {
  success: boolean;
  result?: RankingResult;
  error?: string;
  metadata?: {
    model?: string;
    processingTime?: number;
  };
}

// ============================================================================
// Core Ranking Function
// ============================================================================

/**
 * Rank content using Ollama
 *
 * This function sends article information to Ollama for ranking using LangChain.
 * It uses a specialized ranking prompt to evaluate content quality and relevance.
 *
 * @param article The article to rank
 * @param context The ranking context (day, time, mood, etc.)
 * @param options Options for the ranking
 * @returns Object with success status and either ranking result or error message
 */
export async function rankContent(
  article: ArticleInput,
  context: RankingContext,
  options: RankingOptions = {},
): Promise<RankingResponse> {
  const startTime = Date.now();

  try {
    // Load ranking criteria (either custom or defaults) - cache in options to avoid reloading
    let criteria: RankingCriteriaConfig;
    if (options.criteriaConfig) {
      criteria = options.criteriaConfig;
      if (options.verbose) {
        console.log(`🎯 Using provided criteria: "${criteria.description || 'Default criteria'}" (v${criteria.version})`);
      }
    } else {
      // Only load and log if not provided
      criteria = await loadRankingCriteria(options.verbose);
      if (options.verbose) {
        console.log(`🎯 Using loaded criteria: "${criteria.description || 'Default criteria'}" (v${criteria.version})`);
      }
    }

    // Load the base prompt template from file
    const promptPath = new URL(
      "../../prompts/rank-article.txt",
      import.meta.url,
    );
    const basePromptTemplate = await Deno.readTextFile(promptPath);
    
    // Generate dynamic criteria text
    const criteriaText = generateCriteriaPromptText(criteria);
    
    // Create the complete prompt by replacing the hardcoded criteria section
    const promptTemplate = basePromptTemplate.replace(
      /Evaluation Criteria:[\s\S]*?(?=Response Format:)/,
      criteriaText + '\n'
    );

    // Prepare template variables
    const templateVars = {
      title: article.title,
      summary: article.summary,
      source: article.source || 'Unknown',
      publishedAt: article.publishedAt ? article.publishedAt.toLocaleDateString() : 'Unknown',
      dayOfWeek: context.dayOfWeek,
      timeOfDay: context.timeOfDay,
      userMood: context.userMood || 'neutral',
      readingDuration: context.readingDuration || 'medium',
    };

    // Use the Ollama client with custom prompt
    const result = await chatWithOllamaCustomPrompt(
      promptTemplate,
      templateVars,
      {
        modelName: options.modelName,
        baseUrl: options.baseUrl,
        temperature: options.temperature || 0.3, // Lower temperature for consistent ranking
        langSmithTracing: options.langSmithTracing,
        langSmithApiKey: options.langSmithApiKey,
        langSmithProject: options.langSmithProject,
      },
    );

    if (!result.success) {
      throw new Error(result.error || "Unknown error from Ollama client");
    }

    // Parse the JSON response
    const rankingResult = parseRankingResponse(result.content || '');
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      result: rankingResult,
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
      error: `Failed to rank content: ${errorMessage}`,
      metadata: {
        processingTime,
      },
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse the JSON response from the LLM into a RankingResult
 */
function parseRankingResponse(response: string): RankingResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize the response
    return {
      score: normalizeScore(parsed.score),
      reasoning: parsed.reasoning || 'No reasoning provided',
      categories: normalizeCategories(parsed.categories),
      estimatedReadTime: normalizeReadTime(parsed.estimatedReadTime),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse LLM response: ${errorMessage}`);
  }
}

/**
 * Normalize score to be between 0-10
 */
function normalizeScore(score: any): number {
  const numScore = Number(score);
  if (isNaN(numScore)) return 0;
  return Math.max(0, Math.min(10, numScore));
}

/**
 * Normalize categories array
 */
function normalizeCategories(categories: any): string[] {
  if (!Array.isArray(categories)) return [];
  return categories
    .filter(cat => typeof cat === 'string' && cat.length > 0)
    .slice(0, 5); // Limit to 5 categories
}

/**
 * Normalize read time to be between 1-60 minutes
 */
function normalizeReadTime(readTime: any): number {
  const numTime = Number(readTime);
  if (isNaN(numTime) || numTime <= 0) return 5; // Default 5 minutes
  return Math.max(1, Math.min(60, numTime)); // Between 1-60 minutes
}