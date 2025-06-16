import { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { mockArticles, mockContexts, expectedScoreRanges } from '../../mock-data.ts';
import { ArticleInput, RankingContext, ScoringResult } from '../../types.ts';

Deno.test("Mock Validation - Article Data Structure Compliance", () => {
  for (let i = 0; i < mockArticles.length; i++) {
    const article = mockArticles[i];
    
    // Validate required fields
    assertExists(article.title, `Article ${i} should have title`);
    assertExists(article.summary, `Article ${i} should have summary`);
    assertExists(article.url, `Article ${i} should have URL`);
    
    // Validate field types
    assertEquals(typeof article.title, 'string', `Article ${i} title should be string`);
    assertEquals(typeof article.summary, 'string', `Article ${i} summary should be string`);
    assertEquals(typeof article.url, 'string', `Article ${i} URL should be string`);
    
    // Validate field content
    assert(article.title.length > 0, `Article ${i} title should not be empty`);
    assert(article.summary.length > 0, `Article ${i} summary should not be empty`);
    assert(article.url.startsWith('http'), `Article ${i} URL should be valid HTTP(S)`);
    
    // Validate optional fields if present
    if (article.publishedAt) {
      assert(article.publishedAt instanceof Date, `Article ${i} publishedAt should be Date`);
    }
    
    if (article.source) {
      assertEquals(typeof article.source, 'string', `Article ${i} source should be string`);
      assert(article.source.length > 0, `Article ${i} source should not be empty`);
    }
    
    if (article.categories) {
      assert(Array.isArray(article.categories), `Article ${i} categories should be array`);
      article.categories.forEach((cat, catIndex) => {
        assertEquals(typeof cat, 'string', `Article ${i} category ${catIndex} should be string`);
        assert(cat.length > 0, `Article ${i} category ${catIndex} should not be empty`);
      });
    }
  }
  
  console.log(`✓ Validated ${mockArticles.length} mock articles`);
});

Deno.test("Mock Validation - Context Data Structure Compliance", () => {
  const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const validTimes = ['morning', 'afternoon', 'evening', 'night'];
  const validMoods = ['focused', 'casual', 'learning', 'entertainment'];
  const validDurations = ['quick', 'medium', 'deep'];
  
  for (let i = 0; i < mockContexts.length; i++) {
    const context = mockContexts[i];
    
    // Validate required fields
    assertExists(context.dayOfWeek, `Context ${i} should have dayOfWeek`);
    assertExists(context.timeOfDay, `Context ${i} should have timeOfDay`);
    
    // Validate enum values
    assert(validDays.includes(context.dayOfWeek), `Context ${i} dayOfWeek should be valid: ${context.dayOfWeek}`);
    assert(validTimes.includes(context.timeOfDay), `Context ${i} timeOfDay should be valid: ${context.timeOfDay}`);
    
    // Validate optional fields if present
    if (context.userMood) {
      assert(validMoods.includes(context.userMood), `Context ${i} userMood should be valid: ${context.userMood}`);
    }
    
    if (context.readingDuration) {
      assert(validDurations.includes(context.readingDuration), `Context ${i} readingDuration should be valid: ${context.readingDuration}`);
    }
  }
  
  console.log(`✓ Validated ${mockContexts.length} mock contexts`);
});

Deno.test("Mock Validation - Article Content Diversity", () => {
  // Check for content diversity in mock data
  const titles = mockArticles.map(a => a.title.toLowerCase());
  const summaries = mockArticles.map(a => a.summary.toLowerCase());
  const sources = mockArticles.map(a => a.source).filter(Boolean);
  
  // Ensure no duplicate titles
  const uniqueTitles = [...new Set(titles)];
  assertEquals(uniqueTitles.length, titles.length, "All article titles should be unique");
  
  // Ensure content variety
  const hasHighQuality = mockArticles.some(a => 
    a.title.includes('TypeScript') || a.title.includes('Quantum') || a.title.includes('Deep Learning')
  );
  const hasClickbait = mockArticles.some(a => 
    a.title.includes('Shocking') || a.title.includes('won\'t believe')
  );
  const hasNews = mockArticles.some(a => 
    a.title.includes('Market') || a.title.includes('Breaking')
  );
  const hasLifestyle = mockArticles.some(a => 
    a.title.includes('Recipe') || a.title.includes('Productivity')
  );
  
  assert(hasHighQuality, "Should include high-quality technical content");
  assert(hasClickbait, "Should include clickbait examples");
  assert(hasNews, "Should include news content");
  assert(hasLifestyle, "Should include lifestyle content");
  
  console.log(`✓ Content diversity validated: ${mockArticles.length} articles across multiple categories`);
});

Deno.test("Mock Validation - Context Scenario Coverage", () => {
  const days = mockContexts.map(c => c.dayOfWeek);
  const times = mockContexts.map(c => c.timeOfDay);
  const moods = mockContexts.map(c => c.userMood).filter(Boolean);
  const durations = mockContexts.map(c => c.readingDuration).filter(Boolean);
  
  // Check coverage of different scenarios
  const uniqueDays = [...new Set(days)];
  const uniqueTimes = [...new Set(times)];
  const uniqueMoods = [...new Set(moods)];
  const uniqueDurations = [...new Set(durations)];
  
  assert(uniqueDays.length >= 3, `Should cover at least 3 different days, got ${uniqueDays.length}`);
  assert(uniqueTimes.length >= 3, `Should cover at least 3 different times, got ${uniqueTimes.length}`);
  assert(uniqueMoods.length >= 2, `Should cover at least 2 different moods, got ${uniqueMoods.length}`);
  
  console.log(`✓ Context coverage: ${uniqueDays.length} days, ${uniqueTimes.length} times, ${uniqueMoods.length} moods`);
});

Deno.test("Mock Validation - Expected Score Ranges Validity", () => {
  // Validate score range definitions
  for (const [category, range] of Object.entries(expectedScoreRanges)) {
    assert(typeof range.min === 'number', `${category} min should be number`);
    assert(typeof range.max === 'number', `${category} max should be number`);
    assert(range.min >= 0, `${category} min should be >= 0`);
    assert(range.max <= 10, `${category} max should be <= 10`);
    assert(range.min < range.max, `${category} min should be less than max`);
  }
  
  // Ensure ranges cover the full spectrum
  const allMins = Object.values(expectedScoreRanges).map(r => r.min);
  const allMaxs = Object.values(expectedScoreRanges).map(r => r.max);
  
  const lowestMin = Math.min(...allMins);
  const highestMax = Math.max(...allMaxs);
  
  assertEquals(lowestMin, 0, "Should include minimum possible score");
  assertEquals(highestMax, 10, "Should include maximum possible score");
  
  console.log(`✓ Score ranges validated: ${Object.keys(expectedScoreRanges).length} categories`);
});

Deno.test("Mock Validation - Article Categories Match Expected Types", () => {
  const allCategories = new Set<string>();
  
  mockArticles.forEach(article => {
    if (article.categories) {
      article.categories.forEach(cat => allCategories.add(cat.toLowerCase()));
    }
  });
  
  // Expected category types based on our test data
  const expectedCategoryTypes = [
    'technology', 'programming', 'typescript',
    'entertainment', 'celebrity', 'gossip',
    'science', 'education', 'quantum',
    'finance', 'news', 'economics',
    'productivity', 'lifestyle', 'food',
    'ai', 'research', 'machine-learning'
  ];
  
  const foundExpectedCategories = expectedCategoryTypes.filter(expected => 
    Array.from(allCategories).some(actual => actual.includes(expected))
  );
  
  assert(foundExpectedCategories.length >= 8, 
    `Should have diverse categories, found ${foundExpectedCategories.length} of ${expectedCategoryTypes.length}`
  );
  
  console.log(`✓ Category diversity: ${allCategories.size} unique categories`);
  console.log(`  Found: ${Array.from(allCategories).join(', ')}`);
});

Deno.test("Mock Validation - Realistic Content Lengths", () => {
  for (let i = 0; i < mockArticles.length; i++) {
    const article = mockArticles[i];
    
    // Title lengths should be reasonable
    assert(article.title.length >= 10, `Article ${i} title too short: ${article.title.length} chars`);
    assert(article.title.length <= 200, `Article ${i} title too long: ${article.title.length} chars`);
    
    // Summary lengths should be substantial
    assert(article.summary.length >= 50, `Article ${i} summary too short: ${article.summary.length} chars`);
    assert(article.summary.length <= 1000, `Article ${i} summary too long: ${article.summary.length} chars`);
    
    // URLs should be properly formatted
    assert(article.url.includes('example.com'), `Article ${i} should use example.com domain`);
    assert(article.url.startsWith('https://'), `Article ${i} should use HTTPS`);
  }
  
  const avgTitleLength = mockArticles.reduce((sum, a) => sum + a.title.length, 0) / mockArticles.length;
  const avgSummaryLength = mockArticles.reduce((sum, a) => sum + a.summary.length, 0) / mockArticles.length;
  
  console.log(`✓ Content lengths - Avg title: ${avgTitleLength.toFixed(1)}, Avg summary: ${avgSummaryLength.toFixed(1)}`);
});

Deno.test("Mock Validation - Chronological Data Consistency", () => {
  const articlesWithDates = mockArticles.filter(a => a.publishedAt);
  
  assert(articlesWithDates.length > 0, "Should have articles with publication dates");
  
  for (const article of articlesWithDates) {
    const pubDate = article.publishedAt!;
    const now = new Date();
    
    assert(pubDate <= now, `Article "${article.title}" date should not be in future`);
    
    // Dates should be recent (within reasonable test range)
    const daysDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    assert(daysDiff <= 365, `Article "${article.title}" should be within last year`);
  }
  
  console.log(`✓ Chronological validation: ${articlesWithDates.length} dated articles`);
});

Deno.test("Mock Validation - Interface Compatibility Verification", () => {
  // Test that mock data can be used with actual interfaces
  function testArticleInterface(article: ArticleInput): boolean {
    return typeof article.title === 'string' && 
           typeof article.summary === 'string' && 
           typeof article.url === 'string';
  }
  
  function testContextInterface(context: RankingContext): boolean {
    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const validTimes = ['morning', 'afternoon', 'evening', 'night'];
    
    return validDays.includes(context.dayOfWeek) && validTimes.includes(context.timeOfDay);
  }
  
  const articleCompatibility = mockArticles.every(testArticleInterface);
  const contextCompatibility = mockContexts.every(testContextInterface);
  
  assert(articleCompatibility, "All mock articles should be interface compatible");
  assert(contextCompatibility, "All mock contexts should be interface compatible");
  
  console.log(`✓ Interface compatibility verified for ${mockArticles.length} articles and ${mockContexts.length} contexts`);
});