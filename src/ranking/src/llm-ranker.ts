import {
  type LLMScoringRequest,
  type RankingErrorData,
  type ScoringResult,
} from "../types.ts";
import {
  rankContent as modelsRankContent,
  type RankingArticleInput,
  type RankingContext as ModelsRankingContext,
} from "@src/models/mod.ts";

export interface LLMRanker {
  scoreArticle(request: LLMScoringRequest): Promise<ScoringResult>;
}

export class OllamaRanker implements LLMRanker {
  private timeout: number;

  constructor(timeout = 60000) { // Default to 60 seconds
    this.timeout = timeout;
  }

  async scoreArticle(request: LLMScoringRequest): Promise<ScoringResult> {
    const startTime = Date.now();
    const articleTitle = request.article.title.substring(0, 30);

    try {
      console.log(`      🤖 LLM ranking: "${articleTitle}..." - Starting...`);

      // Convert our types to models module types
      const modelsArticle: RankingArticleInput = {
        title: request.article.title,
        summary: request.article.summary,
        url: request.article.url,
        source: request.article.source,
        publishedAt: request.article.publishedAt,
        categories: request.article.categories,
      };

      const modelsContext: ModelsRankingContext = {
        dayOfWeek: request.context.dayOfWeek,
        timeOfDay: request.context.timeOfDay,
        userMood: request.context.userMood,
        readingDuration: request.context.readingDuration,
      };

      console.log(
        `      🔗 LLM ranking: "${articleTitle}..." - Calling models module with ${this.timeout}ms timeout...`,
      );

      // Use the models module ranking function with timeout
      const rankingPromise = modelsRankContent(modelsArticle, modelsContext, {
        temperature: 0.3, // Lower temperature for consistent scoring
        verbose: false, // Disable verbose logging to avoid spam
        criteriaConfig: request.criteriaConfig, // Pass through criteria if provided
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`LLM ranking timeout after ${this.timeout}ms`));
        }, this.timeout);
      });

      const response = await Promise.race([
        rankingPromise,
        timeoutPromise,
      ]) as {
        success: boolean;
        result?: {
          score: number;
          reasoning: string;
          categories: string[];
          estimatedReadTime: number;
        };
        error?: string;
      };

      const elapsed = Date.now() - startTime;
      console.log(
        `      ⏱️  LLM ranking: "${articleTitle}..." - Models call took ${elapsed}ms`,
      );

      if (!response.success || !response.result) {
        console.log(
          `      ❌ LLM ranking: "${articleTitle}..." - Models call failed: ${
            response.error || "Unknown error"
          }`,
        );
        throw {
          type: "llm_error",
          message: response.error || "Models ranking failed",
          input: request.article,
          context: request.context,
        } as RankingErrorData;
      }

      console.log(
        `      ✅ LLM ranking: "${articleTitle}..." - Success! Score: ${response.result.score}`,
      );

      return {
        score: response.result.score,
        confidence: 0.75, // TODO: Make this dynamic based on response quality
        method: "llm",
        reasoning: response.result.reasoning,
        categories: response.result.categories,
        estimatedReadTime: response.result.estimatedReadTime,
        input: request.article,
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.log(
        `      ❌ LLM ranking: "${articleTitle}..." - Error after ${elapsed}ms`,
      );

      if (error && typeof error === "object" && "type" in error) {
        throw error; // Re-throw RankingErrorData
      }

      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error";
      console.log(
        `      📝 LLM ranking: "${articleTitle}..." - Error details: ${
          errorMessage.substring(0, 100)
        }${errorMessage.length > 100 ? "..." : ""}`,
      );

      throw {
        type: "llm_error",
        message: `LLM scoring failed: ${errorMessage}`,
        input: request.article,
        context: request.context,
      } as RankingErrorData;
    }
  }
}

export function createLLMRanker(timeout?: number): LLMRanker {
  return new OllamaRanker(timeout);
}
