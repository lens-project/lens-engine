import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { MockLLMRanker } from "../../llm-ranker.ts";
import {
  expectedScoreRanges,
  mockArticles,
  mockContexts,
} from "../../mock-data.ts";
import { LLMScoringRequest } from "../../types.ts";

Deno.test("LLM Ranker - Mock Implementation Basic Scoring", async () => {
  const ranker = new MockLLMRanker();
  const request: LLMScoringRequest = {
    article: mockArticles[0], // High-quality tech article
    context: mockContexts[0],
  };

  const result = await ranker.scoreArticle(request);

  assertEquals(result.method, "llm");
  assertEquals(typeof result.score, "number");
  assertEquals(typeof result.confidence, "number");
  assert(
    result.score >= 0 && result.score <= 10,
    "Score should be between 0-10",
  );
  assert(
    result.confidence >= 0 && result.confidence <= 1,
    "Confidence should be between 0-1",
  );
  assertExists(result.reasoning, "Should include reasoning");
  assertExists(result.categories, "Should include categories");
});

Deno.test("LLM Ranker - High Quality Technical Content Scoring", async () => {
  const ranker = new MockLLMRanker();
  const techArticle = mockArticles[0];
  const request: LLMScoringRequest = {
    article: techArticle,
    context: mockContexts[0],
  };

  const result = await ranker.scoreArticle(request);

  assert(
    result.score >= expectedScoreRanges.highQualityTech.min,
    `Tech article score ${result.score} should be >= ${expectedScoreRanges.highQualityTech.min}`,
  );
  assert(
    result.score <= expectedScoreRanges.highQualityTech.max,
    `Tech article score ${result.score} should be <= ${expectedScoreRanges.highQualityTech.max}`,
  );

  console.log(`Tech article scored: ${result.score} - ${result.reasoning}`);
});

Deno.test("LLM Ranker - Clickbait Content Low Scoring", async () => {
  const ranker = new MockLLMRanker();
  const clickbaitArticle = mockArticles[1];
  const request: LLMScoringRequest = {
    article: clickbaitArticle,
    context: mockContexts[1],
  };

  const result = await ranker.scoreArticle(request);

  assert(
    result.score >= expectedScoreRanges.clickbait.min,
    `Clickbait score ${result.score} should be >= ${expectedScoreRanges.clickbait.min}`,
  );
  assert(
    result.score <= expectedScoreRanges.clickbait.max,
    `Clickbait score ${result.score} should be <= ${expectedScoreRanges.clickbait.max}`,
  );

  console.log(
    `Clickbait article scored: ${result.score} - ${result.reasoning}`,
  );
});

Deno.test("LLM Ranker - Educational Content High Scoring", async () => {
  const ranker = new MockLLMRanker();
  const educationalArticle = mockArticles[2];
  const request: LLMScoringRequest = {
    article: educationalArticle,
    context: mockContexts[3], // Learning mood context
  };

  const result = await ranker.scoreArticle(request);

  assert(
    result.score >= expectedScoreRanges.educational.min,
    `Educational score ${result.score} should be >= ${expectedScoreRanges.educational.min}`,
  );

  console.log(
    `Educational article scored: ${result.score} - ${result.reasoning}`,
  );
});

Deno.test("LLM Ranker - Consistency Across Multiple Calls", async () => {
  const ranker = new MockLLMRanker();
  const article = mockArticles[0];
  const context = mockContexts[0];
  const request: LLMScoringRequest = { article, context };

  const result1 = await ranker.scoreArticle(request);
  const result2 = await ranker.scoreArticle(request);
  const result3 = await ranker.scoreArticle(request);

  assertEquals(
    result1.score,
    result2.score,
    "Repeated calls should return same score",
  );
  assertEquals(
    result2.score,
    result3.score,
    "Consistency should be maintained",
  );
  assertEquals(
    result1.reasoning,
    result2.reasoning,
    "Reasoning should be consistent",
  );
});

Deno.test("LLM Ranker - Response Time Simulation", async () => {
  const ranker = new MockLLMRanker();
  const request: LLMScoringRequest = {
    article: mockArticles[0],
    context: mockContexts[0],
  };

  const startTime = Date.now();
  await ranker.scoreArticle(request);
  const endTime = Date.now();

  const duration = endTime - startTime;
  assert(duration >= 50, "Should simulate processing time of at least 50ms");
  assert(duration <= 200, "Should not take more than 200ms for mock");
});

Deno.test("LLM Ranker - Default Response for Unknown Articles", async () => {
  const ranker = new MockLLMRanker();
  const unknownArticle = {
    title: "Unknown Article Title That Doesn't Match Any Mock Data",
    summary:
      "This is a completely new article that hasn't been seen before and should trigger the default response logic in the mock ranker.",
    url: "https://example.com/unknown-article",
    publishedAt: new Date(),
    source: "Unknown Source",
  };

  const request: LLMScoringRequest = {
    article: unknownArticle,
    context: mockContexts[0],
  };

  const result = await ranker.scoreArticle(request);

  assertEquals(result.method, "llm");
  assert(
    result.score >= 1 && result.score <= 7,
    "Default scores should be in middle range",
  );
  assertExists(result.reasoning, "Should provide default reasoning");
  assertExists(result.categories, "Should categorize unknown content");
});

Deno.test("LLM Ranker - All Mock Articles Process Successfully", async () => {
  const ranker = new MockLLMRanker();
  const context = mockContexts[0];

  for (let i = 0; i < mockArticles.length; i++) {
    const article = mockArticles[i];
    const request: LLMScoringRequest = { article, context };

    const result = await ranker.scoreArticle(request);

    assert(
      result.score >= 0 && result.score <= 10,
      `Article ${i} (${article.title}) score ${result.score} out of range`,
    );
    assertExists(result.reasoning, `Article ${i} should have reasoning`);
    assertEquals(result.method, "llm", `Article ${i} should use LLM method`);
  }
});

Deno.test("LLM Ranker - Categories Detection", async () => {
  const ranker = new MockLLMRanker();
  const techArticle = mockArticles[0];
  const entertainmentArticle = mockArticles[5];
  const financeArticle = mockArticles[3];

  const requests = [
    { article: techArticle, context: mockContexts[0] },
    { article: entertainmentArticle, context: mockContexts[1] },
    { article: financeArticle, context: mockContexts[2] },
  ];

  for (const request of requests) {
    const result = await ranker.scoreArticle(request);

    assertExists(result.categories);
    assert(result.categories.length > 0, "Should detect at least one category");
    assert(
      result.categories.every((cat) =>
        typeof cat === "string" && cat.length > 0
      ),
      "All categories should be non-empty strings",
    );
  }
});
