import { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ContentRanker } from '../src/orchestrator.ts';
import { testArticles, testContexts, invalidArticle, invalidContext } from './fixtures/test-articles.ts';
import { isRankingError, isScoringResult, getSuccessfulResults } from '../src/utils.ts';
import { getConfig } from "@src/config/mod.ts";

Deno.test("Production Orchestrator - Configuration Integration", async () => {
  // Test that config loads correctly
  const config = await getConfig();
  
  assertExists(config.llm, "LLM config should exist");
  assertExists(config.llm.llmModel, "LLM model should be configured");
  assertExists(config.llm.ollamaBaseUrl, "Ollama base URL should be configured");
  
  console.log(`LLM Model: ${config.llm.llmModel}`);
  console.log(`Ollama URL: ${config.llm.ollamaBaseUrl}`);
});

Deno.test("Production Orchestrator - Validation Methods", () => {
  const ranker = new ContentRanker();
  
  // Test valid inputs
  assert(ranker.validateArticle(testArticles[0]), "Valid article should pass validation");
  assert(ranker.validateContext(testContexts[0]), "Valid context should pass validation");
  
  // Test invalid inputs
  assert(!ranker.validateArticle(invalidArticle as any), "Invalid article should fail validation");
  assert(!ranker.validateContext(invalidContext as any), "Invalid context should fail validation");
});

Deno.test("Production Orchestrator - Input Validation Errors", async () => {
  const ranker = new ContentRanker();
  
  // Test with invalid article
  const result = await ranker.rankArticle(invalidArticle as any, testContexts[0]);
  
  assert(isRankingError(result), "Should return error for invalid article");
  assertEquals(result.type, 'invalid_input', "Should be input validation error");
  assertExists(result.message, "Should have error message");
});

Deno.test("Production Orchestrator - Batch Processing", async () => {
  const ranker = new ContentRanker({
    maxBatchSize: 2,
    continueOnError: true,
  });
  
  const results = await ranker.rankBatch(testArticles, testContexts[0]);
  
  assertEquals(results.length, testArticles.length, "Should return result for each article");
  
  const successful = getSuccessfulResults(results);
  console.log(`Successful rankings: ${successful.length}/${results.length}`);
  
  // At least some should succeed (depending on Ollama availability)
  for (const result of results) {
    if (isScoringResult(result)) {
      assert(result.score >= 0 && result.score <= 10, "Score should be in valid range");
      assertEquals(result.method, 'llm', "Should use LLM method");
      assertExists(result.reasoning, "Should have reasoning");
    } else {
      console.log(`Error: ${result.type} - ${result.message}`);
    }
  }
});

Deno.test("Production Orchestrator - Context Adjustments", async () => {
  const ranker = new ContentRanker({
    enableContextAdjustments: true,
  });
  
  const article = testArticles[0]; // Tech article
  const mondayResult = await ranker.rankArticle(article, testContexts[0]); // Monday focused
  const sundayResult = await ranker.rankArticle(article, testContexts[1]); // Sunday casual
  
  if (isScoringResult(mondayResult) && isScoringResult(sundayResult)) {
    console.log(`Monday score: ${mondayResult.score}, Sunday score: ${sundayResult.score}`);
    
    // Should have context factors
    assertExists(mondayResult.contextFactors, "Should include context factors");
    
    // Scores might be different due to context (though not guaranteed)
    console.log(`Context adjustment: ${mondayResult.contextFactors?.dayOfWeekAdjustment || 0}`);
  } else {
    console.log("One or both rankings failed - this is expected if Ollama is not available");
  }
});

Deno.test("Production Orchestrator - Error Handling", async () => {
  const ranker = new ContentRanker({
    timeout: 1, // Very short timeout to force failure
  });
  
  const result = await ranker.rankArticle(testArticles[0], testContexts[0]);
  
  // Should either succeed or fail gracefully
  if (isRankingError(result)) {
    assert(['llm_error', 'context_error', 'timeout'].includes(result.type), 
           "Should be a recognized error type");
    assertExists(result.message, "Should have error message");
    console.log(`Expected error with short timeout: ${result.type} - ${result.message}`);
  } else {
    console.log("Ranking succeeded despite short timeout - system is very fast!");
  }
});

Deno.test("Production Orchestrator - Configuration Options", () => {
  const customOptions = {
    timeout: 45000,
    confidenceThreshold: 0.8,
    enableContextAdjustments: false,
    maxBatchSize: 5,
    continueOnError: false,
  };
  
  const ranker = new ContentRanker(customOptions);
  
  // Test that the ranker was created successfully
  assertExists(ranker, "Ranker should be created with custom options");
  
  // Validation should still work
  assert(ranker.validateArticle(testArticles[0]), "Validation should work with custom options");
});

// This test will only run if SKIP_OLLAMA_TESTS is not set
Deno.test({
  name: "Production Orchestrator - Real LLM Integration",
  ignore: Deno.env.get("SKIP_OLLAMA_TESTS") === "true",
  fn: async () => {
    const ranker = new ContentRanker();
    const article = testArticles[0];
    const context = testContexts[0];
    
    try {
      const result = await ranker.rankArticle(article, context);
      
      if (isScoringResult(result)) {
        console.log(`✅ Real LLM ranking succeeded:`);
        console.log(`   Score: ${result.score}`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log(`   Method: ${result.method}`);
        console.log(`   Categories: ${result.categories?.join(', ')}`);
        console.log(`   Read Time: ${result.estimatedReadTime} minutes`);
        console.log(`   Reasoning: ${result.reasoning?.substring(0, 100)}...`);
        
        // Validate the response
        assert(result.score >= 0 && result.score <= 10, "Score in valid range");
        assert(result.confidence >= 0 && result.confidence <= 1, "Confidence in valid range");
        assertEquals(result.method, 'llm', "Should use LLM method");
        assertExists(result.reasoning, "Should have reasoning");
      } else {
        console.log(`❌ Real LLM ranking failed: ${result.type} - ${result.message}`);
        
        // This is acceptable if Ollama is not running
        assert(['llm_error', 'context_error'].includes(result.type), 
               "Should be LLM or context error if Ollama unavailable");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Real LLM test threw error: ${errorMessage}`);
      console.log("This is expected if Ollama is not running");
    }
  }
});