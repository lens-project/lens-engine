import {
  type ArticleInput,
  type RankingContext,
  type RankingOptions,
  type RankingResult,
  type ScoringResult,
  type LLMScoringRequest,
  type RankingErrorData,
  RankingError,
} from '../types.ts';
import { applyContextualAdjustments } from './context-ranker.ts';
import { createLLMRanker, type LLMRanker } from './llm-ranker.ts';
import { loadRankingCriteria } from './criteria-loader.ts';
import { type RankingCriteriaConfig } from '../types.ts';

export class ContentRanker {
  private llmRanker: LLMRanker;
  private defaultOptions: RankingOptions;
  private cachedCriteria?: RankingCriteriaConfig;

  constructor(options?: RankingOptions) {
    this.defaultOptions = {
      timeout: 60000, // Increase to 60 seconds for better reliability
      confidenceThreshold: 0.5,
      enableContextAdjustments: true,
      maxBatchSize: 10,
      continueOnError: true,
      ...options,
    };

    this.llmRanker = createLLMRanker(this.defaultOptions.timeout);
  }

  async rankArticle(
    article: ArticleInput,
    context: RankingContext,
    options?: RankingOptions
  ): Promise<RankingResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      // Validate inputs
      this.validateInputs(article, context);

      // Get base score from LLM - pass criteria if available
      const request: LLMScoringRequest = { 
        article, 
        context,
        criteriaConfig: mergedOptions.criteriaConfig
      };
      const baseScoringResult = await this.llmRanker.scoreArticle(request);

      // Apply contextual adjustments if enabled
      let finalScore = baseScoringResult.score;
      let contextFactors = undefined;

      if (mergedOptions.enableContextAdjustments) {
        const adjustedScore = applyContextualAdjustments(
          baseScoringResult.score,
          context,
          article
        );
        
        contextFactors = {
          dayOfWeekAdjustment: adjustedScore - baseScoringResult.score,
          timeOfDayAdjustment: 0, // TODO: Split out individual adjustments
          moodAlignment: 0, // TODO: Split out individual adjustments
        };

        finalScore = adjustedScore;
      }

      // Check confidence threshold
      if (baseScoringResult.confidence < (mergedOptions.confidenceThreshold || 0.5)) {
        console.warn(`Low confidence score (${baseScoringResult.confidence}) for article: ${article.title}`);
      }

      return {
        ...baseScoringResult,
        score: finalScore,
        input: article,
        contextFactors,
      };

    } catch (error) {
      if (this.isRankingErrorData(error)) {
        return error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        type: 'context_error',
        message: `Ranking failed: ${errorMessage}`,
        input: article,
        context,
      } as RankingErrorData;
    }
  }

  async rankBatch(
    articles: ArticleInput[],
    context: RankingContext,
    options?: RankingOptions
  ): Promise<RankingResult[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const results: RankingResult[] = [];

    // Load criteria once for the entire batch to avoid repeated loading
    if (!this.cachedCriteria && !mergedOptions.criteriaConfig) {
      console.log(`📋 Loading ranking criteria once for batch...`);
      this.cachedCriteria = await loadRankingCriteria(false); // Load quietly
      console.log(`✅ Loaded criteria: "${this.cachedCriteria.description || 'Default criteria'}" (v${this.cachedCriteria.version})`);
      console.log(`   📊 ${this.cachedCriteria.criteria.length} criteria, ${this.cachedCriteria.scoringGuidelines.length} scoring levels`);
    }

    // Use cached criteria or provided criteria
    mergedOptions.criteriaConfig = mergedOptions.criteriaConfig || this.cachedCriteria;

    // Process in batches to avoid overwhelming the LLM
    const batchSize = mergedOptions.maxBatchSize || 10;
    
    console.log(`🔄 Processing ${articles.length} articles in batches of ${batchSize}...`);
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(articles.length / batchSize);
      
      console.log(`📦 Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} articles (${i + 1}-${i + batch.length})...`);
      
      const batchPromises = batch.map((article, index) => {
        console.log(`   🔍 [${i + index + 1}/${articles.length}] Ranking: ${article.title.substring(0, 50)}${article.title.length > 50 ? '...' : ''}`);
        return this.rankArticle(article, context, options);
      });

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        const successful = batchResults.filter(r => !this.isRankingErrorData(r)).length;
        const errors = batchResults.filter(r => this.isRankingErrorData(r)).length;
        console.log(`   ✅ Batch ${batchNumber} complete: ${successful} successful, ${errors} errors`);
        
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} failed, processing individually...`);
        
        if (mergedOptions.continueOnError) {
          // Process articles individually if batch fails
          for (const article of batch) {
            try {
              console.log(`   🔄 Individual retry: ${article.title.substring(0, 50)}${article.title.length > 50 ? '...' : ''}`);
              const result = await this.rankArticle(article, context, options);
              results.push(result);
              console.log(`   ✅ Individual success`);
            } catch (individualError) {
              const errorMessage = individualError instanceof Error ? individualError.message : 'Unknown error';
              console.log(`   ❌ Individual failed: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`);
              results.push({
                type: 'context_error',
                message: `Individual ranking failed: ${errorMessage}`,
                input: article,
                context,
              } as RankingErrorData);
            }
          }
        } else {
          throw error;
        }
      }

      // Add small delay between batches to be respectful to the LLM
      if (i + batchSize < articles.length) {
        console.log(`   ⏸️  Pausing 100ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  validateArticle(article: ArticleInput): boolean {
    return !!(
      article.title &&
      article.title.trim().length > 0 &&
      article.summary &&
      article.summary.trim().length > 0 &&
      article.url &&
      this.isValidUrl(article.url)
    );
  }

  validateContext(context: RankingContext): boolean {
    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const validTimes = ['morning', 'afternoon', 'evening', 'night'];
    const validMoods = ['focused', 'casual', 'learning', 'entertainment'];
    const validDurations = ['quick', 'medium', 'deep'];

    return (
      validDays.includes(context.dayOfWeek) &&
      validTimes.includes(context.timeOfDay) &&
      (!context.userMood || validMoods.includes(context.userMood)) &&
      (!context.readingDuration || validDurations.includes(context.readingDuration))
    );
  }

  private validateInputs(article: ArticleInput, context: RankingContext): void {
    if (!this.validateArticle(article)) {
      throw {
        type: 'invalid_input',
        message: 'Invalid article input: title, summary, and valid URL are required',
        input: article,
        context,
      } as RankingErrorData;
    }

    if (!this.validateContext(context)) {
      throw {
        type: 'invalid_input',
        message: 'Invalid ranking context: invalid day, time, mood, or duration',
        input: article,
        context,
      } as RankingErrorData;
    }
  }

  private isRankingErrorData(obj: any): obj is RankingErrorData {
    return obj && typeof obj === 'object' && 'type' in obj && 'message' in obj;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}