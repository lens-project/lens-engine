import { assertEquals, assertAlmostEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { 
  calculateContextualAdjustments, 
  applyContextualAdjustments 
} from '../src/context-ranker.ts';
import { testArticles, testContexts } from './fixtures/test-articles.ts';

Deno.test("Production Context Ranker - Day of Week Adjustments", () => {
  const techArticle = testArticles[0]; // TypeScript article
  const financeArticle = testArticles[1]; // Market analysis
  
  const mondayContext = testContexts[0]; // Monday morning, focused
  const sundayContext = testContexts[1]; // Sunday afternoon, casual
  
  // Monday should favor professional/tech content
  const mondayTechScore = applyContextualAdjustments(5, mondayContext, techArticle);
  const sundayTechScore = applyContextualAdjustments(5, sundayContext, techArticle);
  
  console.log(`Monday tech: ${mondayTechScore}, Sunday tech: ${sundayTechScore}`);
  
  // Monday should generally score higher for tech content
  assert(mondayTechScore >= sundayTechScore, "Monday should favor technical content");
});

Deno.test("Production Context Ranker - Time of Day Adjustments", () => {
  const productivityArticle = testArticles[2]; // Productivity hacks
  
  const morningContext = { ...testContexts[0], timeOfDay: 'morning' as const };
  const nightContext = { ...testContexts[0], timeOfDay: 'night' as const };
  
  const morningScore = applyContextualAdjustments(5, morningContext, productivityArticle);
  const nightScore = applyContextualAdjustments(5, nightContext, productivityArticle);
  
  console.log(`Morning productivity: ${morningScore}, Night productivity: ${nightScore}`);
  
  // Morning should favor actionable/productivity content
  assert(morningScore >= nightScore, "Morning should favor productivity content");
});

Deno.test("Production Context Ranker - Mood-Based Adjustments", () => {
  const techArticle = testArticles[0];
  
  const focusedContext = { ...testContexts[0], userMood: 'focused' as const };
  const casualContext = { ...testContexts[0], userMood: 'casual' as const };
  const learningContext = { ...testContexts[0], userMood: 'learning' as const };
  
  const focusedScore = applyContextualAdjustments(5, focusedContext, techArticle);
  const casualScore = applyContextualAdjustments(5, casualContext, techArticle);
  const learningScore = applyContextualAdjustments(5, learningContext, techArticle);
  
  console.log(`Focused: ${focusedScore}, Casual: ${casualScore}, Learning: ${learningScore}`);
  
  // Learning and focused moods should favor technical content
  assert(learningScore >= casualScore, "Learning mood should favor tech content");
  assert(focusedScore >= casualScore, "Focused mood should favor tech content");
});

Deno.test("Production Context Ranker - Score Bounds", () => {
  const article = testArticles[0];
  const context = testContexts[0];
  
  // Test various input scores
  const scores = [0, 2.5, 5, 7.5, 10, 15]; // Including out-of-bounds
  
  for (const inputScore of scores) {
    const adjustedScore = applyContextualAdjustments(inputScore, context, article);
    
    assert(adjustedScore >= 0, `Score ${adjustedScore} should be >= 0 (input: ${inputScore})`);
    assert(adjustedScore <= 10, `Score ${adjustedScore} should be <= 10 (input: ${inputScore})`);
  }
});

Deno.test("Production Context Ranker - Consistency", () => {
  const article = testArticles[0];
  const context = testContexts[0];
  
  // Multiple runs should produce identical results
  const scores = [];
  for (let i = 0; i < 5; i++) {
    scores.push(applyContextualAdjustments(7, context, article));
  }
  
  // All scores should be identical
  const uniqueScores = [...new Set(scores)];
  assertEquals(uniqueScores.length, 1, "Multiple runs should produce identical results");
});

Deno.test("Production Context Ranker - Contextual Adjustments Calculation", () => {
  const article = testArticles[0];
  const context = testContexts[0];
  
  const adjustments = calculateContextualAdjustments(context, article);
  
  // Verify structure
  assert(typeof adjustments.dayOfWeekMultiplier === 'number');
  assert(typeof adjustments.timeOfDayMultiplier === 'number');
  assert(typeof adjustments.moodMultiplier === 'number');
  
  // Verify reasonable ranges
  assert(adjustments.dayOfWeekMultiplier >= 0.5 && adjustments.dayOfWeekMultiplier <= 1.5);
  assert(adjustments.timeOfDayMultiplier >= 0.5 && adjustments.timeOfDayMultiplier <= 1.5);
  assert(adjustments.moodMultiplier >= 0.5 && adjustments.moodMultiplier <= 1.5);
});

Deno.test("Production Context Ranker - Different Articles Respond Differently", () => {
  const context = testContexts[0]; // Monday morning, focused
  const baseScore = 5;
  
  const techScore = applyContextualAdjustments(baseScore, context, testArticles[0]);
  const financeScore = applyContextualAdjustments(baseScore, context, testArticles[1]);
  const productivityScore = applyContextualAdjustments(baseScore, context, testArticles[2]);
  
  console.log(`Tech: ${techScore}, Finance: ${financeScore}, Productivity: ${productivityScore}`);
  
  // At least some variation should exist
  const scores = [techScore, financeScore, productivityScore];
  const uniqueScores = [...new Set(scores)];
  
  assert(uniqueScores.length >= 2, "Different article types should produce different adjustments");
});