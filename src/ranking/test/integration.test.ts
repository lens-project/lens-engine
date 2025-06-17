import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  categorizeRelevance,
  ContentRanker,
  createCurrentContext,
  rankArticle,
  rankContent,
} from "../mod.ts";
import { testArticles, testContexts } from "./fixtures/test-articles.ts";
import {
  formatRankingResults,
  isRankingError,
  isScoringResult,
} from "../src/utils.ts";

Deno.test("Integration - Public API Functional Interface", async () => {
  const article = testArticles[0];
  const context = testContexts[0];

  // Test single article ranking
  const singleResult = await rankArticle(article, context);

  if (isScoringResult(singleResult)) {
    console.log(`✅ Single article ranking: Score ${singleResult.score}`);
    assert(
      singleResult.score >= 0 && singleResult.score <= 10,
      "Score in valid range",
    );
    assertEquals(singleResult.method, "llm", "Should use LLM method");
  } else {
    console.log(
      `⚠️  Single article ranking failed: ${singleResult.type} - ${singleResult.message}`,
    );
  }

  // Test batch ranking
  const batchResults = await rankContent([article], context);
  assertEquals(batchResults.length, 1, "Should return one result");

  console.log(`Batch ranking completed: ${batchResults.length} results`);
});

Deno.test("Integration - Class-Based API", async () => {
  const ranker = new ContentRanker();
  const article = testArticles[0];
  const context = testContexts[0];

  // Test validation methods
  assert(ranker.validateArticle(article), "Article should be valid");
  assert(ranker.validateContext(context), "Context should be valid");

  // Test ranking
  const result = await ranker.rankArticle(article, context);

  if (isScoringResult(result)) {
    const category = ranker.categorizeRelevance(result.score);
    console.log(`✅ Class API ranking: Score ${result.score} → ${category}`);

    assert(
      ["high-interest", "maybe-interesting", "skip"].includes(category),
      "Should return valid category",
    );
  } else {
    console.log(
      `⚠️  Class API ranking failed: ${result.type} - ${result.message}`,
    );
  }
});

Deno.test("Integration - Context Creation Helper", () => {
  const context = createCurrentContext("focused", "medium");

  assertExists(context.dayOfWeek, "Should have day of week");
  assertExists(context.timeOfDay, "Should have time of day");
  assertEquals(context.userMood, "focused", "Should have specified mood");
  assertEquals(
    context.readingDuration,
    "medium",
    "Should have specified duration",
  );

  const validDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const validTimes = ["morning", "afternoon", "evening", "night"];

  assert(validDays.includes(context.dayOfWeek), "Should have valid day");
  assert(validTimes.includes(context.timeOfDay), "Should have valid time");

  console.log(
    `Current context: ${context.dayOfWeek} ${context.timeOfDay}, ${context.userMood}, ${context.readingDuration}`,
  );
});

Deno.test("Integration - Relevance Categorization", () => {
  const testScores = [0, 2, 3.5, 4, 6, 7, 8.5, 10];

  for (const score of testScores) {
    const category = categorizeRelevance(score);

    if (score >= 7) {
      assertEquals(
        category,
        "high-interest",
        `Score ${score} should be high-interest`,
      );
    } else if (score >= 4) {
      assertEquals(
        category,
        "maybe-interesting",
        `Score ${score} should be maybe-interesting`,
      );
    } else {
      assertEquals(category, "skip", `Score ${score} should be skip`);
    }
  }

  console.log("✅ Relevance categorization working correctly");
});

Deno.test("Integration - Batch Processing with Mixed Results", async () => {
  // Create a mix of valid and invalid articles
  const mixedArticles = [
    testArticles[0], // Valid
    { // Invalid - missing required fields
      title: "",
      summary: "test",
      url: "invalid",
    } as Partial<typeof testArticles[0]>,
    testArticles[1], // Valid
  ];

  const context = testContexts[0];
  const results = await rankContent(mixedArticles, context, {
    continueOnError: true,
  });

  assertEquals(
    results.length,
    mixedArticles.length,
    "Should return result for each article",
  );

  const successful = results.filter(isScoringResult);
  const errors = results.filter(isRankingError);

  console.log(
    `Mixed batch results: ${successful.length} successful, ${errors.length} errors`,
  );

  // Should have at least one error from the invalid article
  assert(errors.length >= 1, "Should have at least one error");

  // Errors should be validation errors
  const validationErrors = errors.filter((e) => e.type === "invalid_input");
  assert(validationErrors.length >= 1, "Should have validation errors");
});

Deno.test("Integration - Performance and Statistics", async () => {
  const startTime = performance.now();

  const results = await rankContent(testArticles, testContexts[0], {
    maxBatchSize: 2,
  });

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(
    `Batch ranking performance: ${
      duration.toFixed(2)
    }ms for ${testArticles.length} articles`,
  );

  // Test the formatting utility
  const formattedResults = formatRankingResults(results);
  assertExists(formattedResults, "Should generate formatted results");
  assert(
    formattedResults.includes("Ranking Results Summary"),
    "Should include summary header",
  );

  console.log("Formatted Results Preview:");
  console.log(formattedResults.substring(0, 200) + "...");
});

Deno.test("Integration - Error Resilience", async () => {
  const ranker = new ContentRanker({
    timeout: 100, // Very short timeout
    continueOnError: true,
  });

  // This should either succeed quickly or fail gracefully
  const results = await ranker.rankBatch(
    testArticles.slice(0, 2),
    testContexts[0],
  );

  assertEquals(results.length, 2, "Should return result for each article");

  // All results should be either valid scores or proper errors
  for (const result of results) {
    if (isRankingError(result)) {
      assert(
        ["llm_error", "context_error", "timeout", "invalid_input"].includes(
          result.type,
        ),
        "Should be recognized error type",
      );
      assertExists(result.message, "Error should have message");
    } else {
      assert(result.score >= 0 && result.score <= 10, "Valid score range");
      assertEquals(result.method, "llm", "Should use LLM method");
    }
  }

  console.log(
    `Error resilience test: ${
      results.filter(isScoringResult).length
    } successes, ${results.filter(isRankingError).length} errors`,
  );
});

// Performance benchmark test
Deno.test({
  name: "Integration - Performance Benchmark",
  ignore: Deno.env.get("SKIP_PERFORMANCE_TESTS") === "true",
  fn: async () => {
    const iterations = 3;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await rankArticle(testArticles[0], testContexts[0]);
      const end = performance.now();
      durations.push(end - start);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log(`Performance Benchmark (${iterations} iterations):`);
    console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Min: ${minDuration.toFixed(2)}ms`);
    console.log(`  Max: ${maxDuration.toFixed(2)}ms`);

    // These are loose performance expectations
    // Actual performance depends heavily on Ollama setup
    if (avgDuration < 60000) { // Less than 1 minute average
      console.log("✅ Performance is acceptable");
    } else {
      console.log(
        "⚠️  Performance is slower than expected (may be normal for first runs)",
      );
    }
  },
});
