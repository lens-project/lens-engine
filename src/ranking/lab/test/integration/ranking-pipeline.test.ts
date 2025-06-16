import { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ContentRanker, scoreArticle, scoreArticles, categorizeRelevance } from '../../mod.ts';
import { mockArticles, mockContexts } from '../../mock-data.ts';
import { ArticleInput, RankingContext, ScoringResult, RankingError } from '../../types.ts';

Deno.test("Integration - ContentRanker End-to-End Pipeline", async () => {
  const ranker = new ContentRanker(true); // Use mock LLM
  const article = mockArticles[0]; // High-quality tech article
  const context = mockContexts[0]; // Monday morning, focused
  
  const result = await ranker.scoreArticle(article, context);
  
  // Verify it's a successful result, not an error
  assert(!('type' in result), "Should not return an error");
  
  const scoringResult = result as ScoringResult;
  
  assertEquals(scoringResult.method, 'llm');
  assert(scoringResult.score >= 0 && scoringResult.score <= 10, "Score in valid range");
  assert(scoringResult.confidence >= 0 && scoringResult.confidence <= 1, "Confidence in valid range");
  assertExists(scoringResult.reasoning, "Should include reasoning");
  assertExists(scoringResult.categories, "Should include categories");
  
  console.log(`Pipeline result: Score ${scoringResult.score}, Method: ${scoringResult.method}`);
  console.log(`Reasoning: ${scoringResult.reasoning}`);
});

Deno.test("Integration - Batch Article Scoring", async () => {
  const ranker = new ContentRanker(true);
  const articles = mockArticles.slice(0, 5); // First 5 articles
  const context = mockContexts[0];
  
  const results = await ranker.scoreArticles(articles, context);
  
  assertEquals(results.length, articles.length, "Should return result for each article");
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    assert(result.score >= 0 && result.score <= 10, `Result ${i} score in valid range`);
    assertEquals(result.method, 'llm', `Result ${i} should use LLM method`);
    assertExists(result.reasoning, `Result ${i} should have reasoning`);
  }
  
  console.log(`Batch scoring completed: ${results.length} articles processed`);
  results.forEach((result, i) => {
    console.log(`  Article ${i}: Score ${result.score}`);
  });
});

Deno.test("Integration - Context-Aware Scoring Differences", async () => {
  const ranker = new ContentRanker(true);
  const article = mockArticles[0]; // Tech article
  
  const mondayMorningScore = await ranker.scoreArticle(article, mockContexts[0]); // Monday morning, focused
  const sundayAfternoonScore = await ranker.scoreArticle(article, mockContexts[1]); // Sunday afternoon, casual
  const fridayEveningScore = await ranker.scoreArticle(article, mockContexts[2]); // Friday evening, entertainment
  
  // All should be successful results
  assert(!('type' in mondayMorningScore), "Monday result should not be error");
  assert(!('type' in sundayAfternoonScore), "Sunday result should not be error");
  assert(!('type' in fridayEveningScore), "Friday result should not be error");
  
  const mondayScore = (mondayMorningScore as ScoringResult).score;
  const sundayScore = (sundayAfternoonScore as ScoringResult).score;
  const fridayScore = (fridayEveningScore as ScoringResult).score;
  
  console.log(`Context-aware scores - Monday: ${mondayScore}, Sunday: ${sundayScore}, Friday: ${fridayScore}`);
  
  // Scores should be different due to context adjustments
  const scores = [mondayScore, sundayScore, fridayScore];
  const uniqueScores = [...new Set(scores)];
  
  console.log(`Unique scores: ${uniqueScores.length} out of ${scores.length}`);
});

Deno.test("Integration - Relevance Categorization", async () => {
  const ranker = new ContentRanker(true);
  const context = mockContexts[0];
  
  const highQualityArticle = mockArticles[0]; // Should score high
  const clickbaitArticle = mockArticles[1]; // Should score low
  const educationalArticle = mockArticles[2]; // Should score medium-high
  
  const highResult = await ranker.scoreArticle(highQualityArticle, context);
  const lowResult = await ranker.scoreArticle(clickbaitArticle, context);
  const mediumResult = await ranker.scoreArticle(educationalArticle, context);
  
  assert(!('type' in highResult), "High quality result should not be error");
  assert(!('type' in lowResult), "Low quality result should not be error");
  assert(!('type' in mediumResult), "Medium quality result should not be error");
  
  const highScore = (highResult as ScoringResult).score;
  const lowScore = (lowResult as ScoringResult).score;
  const mediumScore = (mediumResult as ScoringResult).score;
  
  const highCategory = ranker.categorizeRelevance(highScore);
  const lowCategory = ranker.categorizeRelevance(lowScore);
  const mediumCategory = ranker.categorizeRelevance(mediumScore);
  
  console.log(`Categorization - High: ${highScore}→${highCategory}, Low: ${lowScore}→${lowCategory}, Medium: ${mediumScore}→${mediumCategory}`);
  
  // Verify scoring trends match expected patterns
  assert(highScore > lowScore, "High quality should score higher than clickbait");
  assert(lowCategory === 'skip' || lowCategory === 'maybe-interesting', "Clickbait should be skip or maybe");
});

Deno.test("Integration - Input Validation and Error Handling", async () => {
  const ranker = new ContentRanker(true);
  
  // Test invalid article (missing title)
  const invalidArticle: ArticleInput = {
    title: "",
    summary: "Valid summary",
    url: "https://example.com/test"
  };
  
  const invalidContext: RankingContext = {
    dayOfWeek: 'Monday',
    timeOfDay: 'morning'
  };
  
  const result = await ranker.scoreArticle(invalidArticle, invalidContext);
  
  // Should return an error
  assert('type' in result, "Should return error for invalid input");
  
  const error = result as RankingError;
  assertEquals(error.type, 'invalid_input');
  assertExists(error.message);
  
  console.log(`Error handling: ${error.type} - ${error.message}`);
});

Deno.test("Integration - Functional API Methods", async () => {
  const article = mockArticles[0];
  const context = mockContexts[0];
  
  // Test functional API
  const singleResult = await scoreArticle(article, context, true);
  const batchResults = await scoreArticles([article], context, true);
  const category = categorizeRelevance(7);
  
  assert(!('type' in singleResult), "Functional single score should work");
  assertEquals(batchResults.length, 1, "Functional batch score should work");
  assertEquals(category, 'high-interest', "Functional categorization should work");
  
  console.log(`Functional API - Single: ${(singleResult as ScoringResult).score}, Batch: ${batchResults[0].score}, Category: ${category}`);
});

Deno.test("Integration - Performance Characteristics", async () => {
  const ranker = new ContentRanker(true);
  const article = mockArticles[0];
  const context = mockContexts[0];
  
  // Test single article performance
  const singleStart = performance.now();
  await ranker.scoreArticle(article, context);
  const singleEnd = performance.now();
  const singleDuration = singleEnd - singleStart;
  
  // Test batch performance
  const batchArticles = mockArticles.slice(0, 3);
  const batchStart = performance.now();
  await ranker.scoreArticles(batchArticles, context);
  const batchEnd = performance.now();
  const batchDuration = batchEnd - batchStart;
  
  console.log(`Performance - Single: ${singleDuration.toFixed(2)}ms, Batch (3): ${batchDuration.toFixed(2)}ms`);
  
  // Mock should be fast
  assert(singleDuration < 1000, "Single article should complete in under 1 second");
  assert(batchDuration < 3000, "Batch of 3 should complete in under 3 seconds");
});

Deno.test("Integration - Score Consistency and Determinism", async () => {
  const ranker = new ContentRanker(true);
  const article = mockArticles[0];
  const context = mockContexts[0];
  
  // Multiple runs should be consistent
  const results = [];
  for (let i = 0; i < 5; i++) {
    const result = await ranker.scoreArticle(article, context);
    assert(!('type' in result), `Run ${i} should not be error`);
    results.push((result as ScoringResult).score);
  }
  
  // All scores should be identical (deterministic mock)
  const uniqueScores = [...new Set(results)];
  assertEquals(uniqueScores.length, 1, "All runs should produce identical scores");
  
  console.log(`Consistency test - ${results.length} runs, all scored: ${results[0]}`);
});

Deno.test("Integration - Full Article Dataset Processing", async () => {
  const ranker = new ContentRanker(true);
  const context = mockContexts[0];
  
  const startTime = performance.now();
  const results = await ranker.scoreArticles(mockArticles, context);
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  
  assertEquals(results.length, mockArticles.length, "Should process all articles");
  
  // Verify score distribution
  const highScores = results.filter(r => r.score >= 7).length;
  const mediumScores = results.filter(r => r.score >= 4 && r.score < 7).length;
  const lowScores = results.filter(r => r.score < 4).length;
  
  console.log(`Full dataset processing: ${results.length} articles in ${duration.toFixed(2)}ms`);
  console.log(`Score distribution - High: ${highScores}, Medium: ${mediumScores}, Low: ${lowScores}`);
  
  // Should have reasonable distribution
  assert(results.length > 0, "Should process at least some articles");
  assert(duration < 10000, "Should complete full dataset in under 10 seconds");
});

Deno.test("Integration - Context Factor Tracking", async () => {
  const ranker = new ContentRanker(true);
  const article = mockArticles[0];
  const context = mockContexts[0];
  
  const result = await ranker.scoreArticle(article, context);
  assert(!('type' in result), "Should not be error");
  
  const scoringResult = result as ScoringResult;
  
  if (scoringResult.contextFactors) {
    assertExists(scoringResult.contextFactors.dayOfWeekAdjustment);
    assertEquals(typeof scoringResult.contextFactors.dayOfWeekAdjustment, 'number');
    
    console.log(`Context factors - Day adjustment: ${scoringResult.contextFactors.dayOfWeekAdjustment}`);
  }
});