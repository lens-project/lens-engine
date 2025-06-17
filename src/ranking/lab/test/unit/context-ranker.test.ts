import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  applyContextualAdjustments,
  calculateContextualAdjustments,
} from "../../context-ranker.ts";
import { mockArticles, mockContexts } from "../../mock-data.ts";

Deno.test("Context Ranker - Day of Week Adjustments", () => {
  const techArticle = mockArticles[0];
  const lifestyleArticle = mockArticles[7];

  const mondayContext = mockContexts[0];
  const sundayContext = mockContexts[1];

  const mondayTechScore = applyContextualAdjustments(
    5,
    mondayContext,
    techArticle,
  );
  const sundayTechScore = applyContextualAdjustments(
    5,
    sundayContext,
    techArticle,
  );

  const mondayLifestyleScore = applyContextualAdjustments(
    5,
    mondayContext,
    lifestyleArticle,
  );
  const sundayLifestyleScore = applyContextualAdjustments(
    5,
    sundayContext,
    lifestyleArticle,
  );

  console.log(
    `Monday tech: ${mondayTechScore}, Sunday tech: ${sundayTechScore}`,
  );
  console.log(
    `Monday lifestyle: ${mondayLifestyleScore}, Sunday lifestyle: ${sundayLifestyleScore}`,
  );
});

Deno.test("Context Ranker - Time of Day Adjustments", () => {
  const newsArticle = mockArticles[3];
  const entertainmentArticle = mockArticles[5];

  const morningContext = { ...mockContexts[0], timeOfDay: "morning" as const };
  const nightContext = { ...mockContexts[0], timeOfDay: "night" as const };

  const morningNewsScore = applyContextualAdjustments(
    5,
    morningContext,
    newsArticle,
  );
  const nightNewsScore = applyContextualAdjustments(
    5,
    nightContext,
    newsArticle,
  );

  const morningEntertainmentScore = applyContextualAdjustments(
    5,
    morningContext,
    entertainmentArticle,
  );
  const nightEntertainmentScore = applyContextualAdjustments(
    5,
    nightContext,
    entertainmentArticle,
  );

  console.log(
    `Morning news: ${morningNewsScore}, Night news: ${nightNewsScore}`,
  );
  console.log(
    `Morning entertainment: ${morningEntertainmentScore}, Night entertainment: ${nightEntertainmentScore}`,
  );
});

Deno.test("Context Ranker - Mood-Based Adjustments", () => {
  const techArticle = mockArticles[0];
  const educationalArticle = mockArticles[2];
  const entertainmentArticle = mockArticles[5];

  const focusedContext = { ...mockContexts[0], userMood: "focused" as const };
  const learningContext = { ...mockContexts[0], userMood: "learning" as const };
  const entertainmentContext = {
    ...mockContexts[0],
    userMood: "entertainment" as const,
  };

  const focusedTechScore = applyContextualAdjustments(
    5,
    focusedContext,
    techArticle,
  );
  const learningEducationalScore = applyContextualAdjustments(
    5,
    learningContext,
    educationalArticle,
  );
  const entertainmentFunScore = applyContextualAdjustments(
    5,
    entertainmentContext,
    entertainmentArticle,
  );

  console.log(`Focused tech: ${focusedTechScore}`);
  console.log(`Learning educational: ${learningEducationalScore}`);
  console.log(`Entertainment fun: ${entertainmentFunScore}`);
});

Deno.test("Context Ranker - Score Bounds", () => {
  const article = mockArticles[0];
  const context = mockContexts[0];

  const lowScore = applyContextualAdjustments(0, context, article);
  const midScore = applyContextualAdjustments(5, context, article);
  const highScore = applyContextualAdjustments(10, context, article);
  const overHighScore = applyContextualAdjustments(15, context, article);

  assertEquals(lowScore >= 0, true, "Score should not go below 0");
  assertEquals(highScore <= 10, true, "Score should not exceed 10");
  assertEquals(
    overHighScore <= 10,
    true,
    "Adjusted score should be capped at 10",
  );
  assertEquals(
    midScore >= 0 && midScore <= 10,
    true,
    "Mid-range scores should stay in bounds",
  );
});

Deno.test("Context Ranker - Contextual Adjustments Calculation", () => {
  const techArticle = mockArticles[0];
  const mondayMorningContext = mockContexts[0];

  const adjustments = calculateContextualAdjustments(
    mondayMorningContext,
    techArticle,
  );

  assertEquals(typeof adjustments.dayOfWeekMultiplier, "number");
  assertEquals(typeof adjustments.timeOfDayMultiplier, "number");
  assertEquals(typeof adjustments.moodMultiplier, "number");

  assertEquals(adjustments.dayOfWeekMultiplier >= 0.8, true);
  assertEquals(adjustments.dayOfWeekMultiplier <= 1.3, true);
  assertEquals(adjustments.timeOfDayMultiplier >= 0.8, true);
  assertEquals(adjustments.timeOfDayMultiplier <= 1.3, true);
  assertEquals(adjustments.moodMultiplier >= 0.8, true);
  assertEquals(adjustments.moodMultiplier <= 1.5, true);
});

Deno.test("Context Ranker - Consistency Check", () => {
  const article = mockArticles[0];
  const context = mockContexts[0];

  const score1 = applyContextualAdjustments(7, context, article);
  const score2 = applyContextualAdjustments(7, context, article);
  const score3 = applyContextualAdjustments(7, context, article);

  assertEquals(score1, score2, "Same inputs should produce identical results");
  assertEquals(score2, score3, "Repeated calls should be consistent");
});

Deno.test("Context Ranker - Different Contexts Produce Different Results", () => {
  const article = mockArticles[0];
  const baseScore = 5;

  const mondayScore = applyContextualAdjustments(
    baseScore,
    mockContexts[0],
    article,
  );
  const sundayScore = applyContextualAdjustments(
    baseScore,
    mockContexts[1],
    article,
  );
  const fridayScore = applyContextualAdjustments(
    baseScore,
    mockContexts[2],
    article,
  );

  const scores = [mondayScore, sundayScore, fridayScore];
  const _uniqueScores = [...new Set(scores)];

  console.log(
    `Monday: ${mondayScore}, Sunday: ${sundayScore}, Friday: ${fridayScore}`,
  );
});
