export * from './types.ts';
import { 
  ArticleInput, 
  RankingContext, 
  ScoringResult, 
  RankingError, 
  RankingResult,
  RelevanceCategory,
  LLMScoringRequest 
} from './types.ts';
import { applyContextualAdjustments } from './context-ranker.ts';
import { createLLMRanker, LLMRanker } from './llm-ranker.ts';

export class ContentRanker {
  private llmRanker: LLMRanker;

  constructor(useMockLLM = true) {
    this.llmRanker = createLLMRanker(useMockLLM);
  }

  async scoreArticle(
    article: ArticleInput,
    context: RankingContext
  ): Promise<RankingResult> {
    try {
      this.validateInput(article, context);

      const request: LLMScoringRequest = { article, context };
      const baseScoringResult = await this.llmRanker.scoreArticle(request);

      const contextAdjustedScore = applyContextualAdjustments(
        baseScoringResult.score,
        context,
        article
      );

      return {
        ...baseScoringResult,
        score: contextAdjustedScore,
        contextFactors: {
          dayOfWeekAdjustment: contextAdjustedScore - baseScoringResult.score,
          timeOfDayAdjustment: 0,
          moodAlignment: 0,
        },
      };
    } catch (error) {
      if (this.isRankingError(error)) {
        return error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        type: 'context_error',
        message: `Ranking failed: ${errorMessage}`,
        input: article,
        context,
      };
    }
  }

  async scoreArticles(
    articles: ArticleInput[],
    context: RankingContext
  ): Promise<ScoringResult[]> {
    const results: ScoringResult[] = [];
    
    for (const article of articles) {
      const result = await this.scoreArticle(article, context);
      if (!this.isRankingError(result)) {
        results.push(result);
      }
    }
    
    return results;
  }

  categorizeRelevance(score: number): RelevanceCategory {
    if (score >= 7) return 'high-interest';
    if (score >= 4) return 'maybe-interesting';
    return 'skip';
  }

  private validateInput(article: ArticleInput, context: RankingContext): void {
    if (!article.title || article.title.trim().length === 0) {
      throw {
        type: 'invalid_input',
        message: 'Article title is required',
        input: article,
        context,
      };
    }

    if (!article.summary || article.summary.trim().length === 0) {
      throw {
        type: 'invalid_input',
        message: 'Article summary is required',
        input: article,
        context,
      };
    }

    if (!article.url || !this.isValidUrl(article.url)) {
      throw {
        type: 'invalid_input',
        message: 'Valid article URL is required',
        input: article,
        context,
      };
    }

    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!validDays.includes(context.dayOfWeek)) {
      throw {
        type: 'invalid_input',
        message: 'Invalid day of week',
        input: article,
        context,
      };
    }

    const validTimes = ['morning', 'afternoon', 'evening', 'night'];
    if (!validTimes.includes(context.timeOfDay)) {
      throw {
        type: 'invalid_input',
        message: 'Invalid time of day',
        input: article,
        context,
      };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isRankingError(obj: any): obj is RankingError {
    return obj && typeof obj === 'object' && 'type' in obj && 'message' in obj;
  }
}

export function scoreArticle(
  article: ArticleInput,
  context: RankingContext,
  useMockLLM = true
): Promise<RankingResult> {
  const ranker = new ContentRanker(useMockLLM);
  return ranker.scoreArticle(article, context);
}

export function scoreArticles(
  articles: ArticleInput[],
  context: RankingContext,
  useMockLLM = true
): Promise<ScoringResult[]> {
  const ranker = new ContentRanker(useMockLLM);
  return ranker.scoreArticles(articles, context);
}

export function categorizeRelevance(score: number): RelevanceCategory {
  const ranker = new ContentRanker();
  return ranker.categorizeRelevance(score);
}

export function createRanker(useMockLLM = true): ContentRanker {
  return new ContentRanker(useMockLLM);
}