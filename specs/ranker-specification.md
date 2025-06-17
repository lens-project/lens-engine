# Ranker Module Technical Specification

## 1. Introduction & Context

### Problem Statement
RSS feeds and content aggregators suffer from the "fire hose problem" - they deliver overwhelming volumes of content without intelligence about what's actually worth reading. Users waste time scanning headlines and clicking articles that turn out to be irrelevant, clickbait, or poorly written.

### Purpose
The Ranker module transforms the Lens Engine from a basic RSS reader into an intelligent content curator. By analyzing article summaries (not just headlines), it predicts personal relevance and helps users focus on content that matters to them.

### Position in Lens Engine Architecture
The Ranker sits between content processing and user interface:
```
RSS Feeds → Content Retrieval → Content Processing → **Ranking** → User Interface
```

It receives processed article summaries and returns relevance scores that drive filtering and presentation decisions.

## 2. Technical Architecture

### 3-Phase Implementation Strategy

**Phase 1: LLM-Based Scoring** (Current Implementation)
- Uses local Ollama models for prompt-based scoring
- Returns 0-10 relevance scores with detailed reasoning
- Collects training data for future phases
- Performance: ~25 seconds per article (development acceptable)

**Phase 2: Embedding-Based Scoring** (Future)
- Fast similarity scoring using collected training data
- Sub-second scoring for bulk processing
- Cosine similarity between user preferences and new content

**Phase 3: Hybrid System** (Target)
- Embeddings for high-confidence, fast scoring
- LLM fallback for edge cases and detailed analysis
- Optimized decision logic for speed + accuracy

### Component Design Principles

**Pure Functional Architecture**
- All ranking functions are pure: given the same inputs, always return the same outputs
- No side effects, no external service calls during core logic
- Immutable data structures throughout

**Zero External Dependencies (Lab Phase)**
- Lab implementation uses comprehensive mocks
- No network calls, database connections, or external services
- Enables fast iteration and reliable testing

**Context-Aware Intelligence**
- Scoring adapts to temporal context (day of week, time of day)
- User mood and reading context influence relevance
- Different criteria for different consumption scenarios

## 3. Interface Definitions

### Core Data Structures

```typescript
interface ArticleInput {
  title: string;
  summary: string; // Processed summary from content processing module
  url: string;
  publishedAt?: Date;
  source?: string;
  categories?: string[];
}

interface RankingContext {
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userMood?: 'focused' | 'casual' | 'learning' | 'entertainment';
  readingDuration?: 'quick' | 'medium' | 'deep'; // Available reading time
}

interface ScoringResult {
  score: number; // 0-10 relevance score (0=skip, 10=must-read)
  confidence: number; // 0-1 confidence in the score
  method: 'llm' | 'embedding' | 'hybrid';
  reasoning?: string; // LLM explanation for the score
  categories?: string[]; // Detected content categories
  estimatedReadTime?: number; // Minutes to read
  contextFactors?: {
    dayOfWeekAdjustment?: number;
    timeOfDayAdjustment?: number;
    moodAlignment?: number;
  };
}

interface RankingError {
  type: 'invalid_input' | 'llm_error' | 'context_error' | 'timeout';
  message: string;
  input?: ArticleInput;
  context?: RankingContext;
}
```

### Function Signatures

```typescript
// Core ranking function
function scoreArticle(
  article: ArticleInput,
  context: RankingContext
): Promise<ScoringResult | RankingError>;

// Batch scoring for efficiency
function scoreArticles(
  articles: ArticleInput[],
  context: RankingContext
): Promise<ScoringResult[]>;

// Context-aware score adjustment
function applyContextualAdjustments(
  baseScore: number,
  context: RankingContext,
  article: ArticleInput
): number;

// Decision logic
function categorizeRelevance(score: number): 'high-interest' | 'maybe-interesting' | 'skip';
```

## 4. Implementation Details

### LLM Prompt Engineering (Phase 1)

**Scoring Prompt Structure**:
```
You are an intelligent content curator. Rate this article's relevance on a scale of 0-10.

Context:
- Day: {dayOfWeek}
- Time: {timeOfDay} 
- User mood: {userMood}
- Reading time available: {readingDuration}

Article:
Title: {title}
Summary: {summary}

Consider:
1. Content quality and depth
2. Relevance to context (day/time/mood)
3. Actionability and practical value
4. Uniqueness vs repetitive news
5. Match to reading duration

Respond in JSON format:
{
  "score": 0-10,
  "reasoning": "detailed explanation",
  "categories": ["category1", "category2"],
  "estimatedReadTime": minutes
}
```

### Context-Aware Scoring Logic

**Day-of-Week Adjustments**:
- **Sunday**: +2 bonus for lifestyle, entertainment, personal development
- **Monday**: +2 bonus for industry news, professional development, planning content
- **Friday PM**: +1 bonus for creative content, -1 penalty for heavy technical analysis
- **Weekend**: -1 penalty for urgent business news

**Time-of-Day Adjustments**:
- **Morning**: +1 bonus for actionable content, news updates, planning articles
- **Afternoon**: Neutral scoring, balanced content
- **Evening**: +1 bonus for educational content, tutorials, reflective pieces
- **Night**: +2 bonus for entertainment, light reading, -2 penalty for work content

**Mood-Based Scoring**:
- **Focused**: +2 for technical content, tutorials, analysis
- **Casual**: +1 for news, entertainment, light reading
- **Learning**: +3 for educational content, tutorials, how-to guides
- **Entertainment**: +2 for humor, stories, interesting facts

### Mock-Driven Development (Lab Implementation)

**Mock LLM Responses**:
```typescript
const mockScoringResponses = {
  highQualityTech: {
    score: 8,
    reasoning: "High-quality technical content with practical applications...",
    categories: ["technology", "programming"],
    estimatedReadTime: 12
  },
  lowQualityClickbait: {
    score: 2,
    reasoning: "Clickbait headline with little substantive content...",
    categories: ["entertainment"],
    estimatedReadTime: 3
  },
  // ... comprehensive mock data for all scenarios
};
```

**Test Article Library**:
- High-quality technical articles
- News articles (urgent vs evergreen)
- Entertainment content
- Educational tutorials
- Opinion pieces
- Clickbait examples
- Edge cases (empty summaries, very long content)

## 5. Testing Strategy

### Lab-Based Development Approach

**Zero External Dependencies**:
- Mock LLM service with predictable responses
- Mock article data covering all content types
- Mock context scenarios for comprehensive testing
- No network calls, database connections, or external services

**Testing Pyramid**:

**Unit Tests** (`lab/test/unit/`):
- Core scoring algorithms with mock data
- Context adjustment calculations
- Edge case handling (empty inputs, invalid scores)
- Error condition testing

**Integration Tests** (`lab/test/integration/`):
- End-to-end ranking pipeline
- Article input → context application → score output
- Batch processing workflows
- Performance benchmarking with mock data

**Mock Validation Tests** (`lab/test/mocks/`):
- Ensure mock data matches production interfaces
- Validate mock LLM responses are realistic
- Test mock service behavior consistency

### Test Coverage Requirements

**Functional Coverage**:
- All scoring ranges (0-10) with representative articles
- All context combinations (7 days × 4 times × 4 moods)
- All error conditions and edge cases
- All content categories and article types

**Performance Testing**:
- Batch scoring performance (target: 100 articles in <5 minutes for lab)
- Memory usage patterns
- Error recovery and timeout handling

## 6. Integration Patterns

### Input Integration

**From Content Processing Module**:
```typescript
// Processor provides article summaries
const summary = await processor.summarize(article);

// Ranker consumes processed content
const ranking = await ranker.scoreArticle({
  title: article.title,
  summary: summary.content,
  url: article.url,
  publishedAt: article.publishedAt
}, context);
```

**Context Sources**:
```typescript
// CLI provides user context
const context: RankingContext = {
  dayOfWeek: getCurrentDay(),
  timeOfDay: getCurrentTimeSlot(),
  userMood: config.get('user.defaultMood'),
  readingDuration: config.get('user.availableTime')
};
```

### Output Integration

**To CLI/User Interface**:
```typescript
// Decision logic for user presentation
const decision = ranker.categorizeRelevance(ranking.score);

switch (decision) {
  case 'high-interest':
    console.log(`🔥 Must Read: ${article.title} (Score: ${ranking.score})`);
    if (ranking.reasoning) console.log(`   ${ranking.reasoning}`);
    break;
  case 'maybe-interesting':
    console.log(`📖 Maybe: ${article.title} (Score: ${ranking.score})`);
    break;
  case 'skip':
    // Don't show to user, log for learning
    logger.debug(`Skipped: ${article.title} (Score: ${ranking.score})`);
    break;
}
```

**To Storage/Learning System**:
```typescript
// Store scoring results for Phase 2 training data
await storage.saveRanking({
  articleId: article.id,
  score: ranking.score,
  method: ranking.method,
  context: context,
  userFeedback: null, // To be filled when user provides feedback
  timestamp: new Date()
});
```

## 7. Performance & Success Criteria

### Phase 1 Performance Targets

**Speed Requirements**:
- Single article scoring: <30 seconds (LLM processing)
- Batch processing: 20-50 articles per session
- Lab tests: <1 second per article (mocked)

**Quality Metrics**:
- **Consistency**: Same article + context = same score (±0.5)
- **Reasoning Quality**: Every score includes meaningful explanation
- **Range Utilization**: Uses full 0-10 scale appropriately
- **Context Awareness**: Demonstrates different scores for different contexts

**Error Handling**:
- Graceful degradation when LLM fails
- Timeout handling (30-second limit)
- Invalid input validation and meaningful error messages

### Success Criteria for Lab Phase

**Functional Success**:
- [ ] All unit tests pass with >95% code coverage
- [ ] Integration tests demonstrate end-to-end workflow
- [ ] Mock data covers all content types and edge cases
- [ ] Context-aware scoring shows measurable differences

**Quality Success**:
- [ ] Scoring explanations are coherent and helpful
- [ ] Full 0-10 range utilized with appropriate distribution
- [ ] Different contexts produce meaningfully different scores
- [ ] Edge cases handled gracefully without crashes

**Performance Success**:
- [ ] Lab tests complete in <30 seconds total
- [ ] Memory usage remains stable during batch processing
- [ ] Error conditions don't cause memory leaks or hangs

### Progression to Production Criteria

**Ready for Real LLM Integration When**:
- All lab tests consistently pass
- Mock responses match expected real LLM output format
- Performance meets targets with realistic test loads
- Error handling covers all expected failure modes

## 8. Future Roadmap

### Phase 2: Embedding-Based Scoring

**Data Collection Requirements**:
- Minimum 50 user-rated articles across score ranges
- User feedback on LLM scoring accuracy
- Article embeddings for similarity comparison

**Implementation Approach**:
- Vector similarity scoring using collected preferences
- Fast preprocessing for bulk article processing
- Fallback to LLM for ambiguous cases

### Phase 3: Hybrid System Optimization

**Decision Logic**:
- Embedding confidence threshold for fast scoring
- LLM activation for low-confidence or edge cases
- Dynamic threshold adjustment based on accuracy metrics

**Advanced Features**:
- **Multi-Profile Support**: Separate work vs personal interest profiles
- **Temporal Learning**: Adapt scoring based on user behavior over time
- **Collaborative Filtering**: Learn from similar users (privacy-preserving)
- **Content Type Specialization**: Different scoring for news vs tutorials vs opinion

### Long-Term Vision

**Performance Target**: 
- Bulk scoring: <1 second per article (embeddings)
- Detailed analysis: <10 seconds (LLM for complex cases)
- Accuracy: Maintain or exceed Phase 1 quality

**Intelligence Target**:
- Predict user interest with >80% accuracy
- Adapt to changing interests automatically
- Provide actionable insights about reading patterns

---

## Appendix: Design Decisions

**Why LLM-First Instead of Simple Heuristics?**
- Headlines are often misleading; summaries provide actual content insight
- User interests are complex and contextual, not easily captured by keyword matching
- LLM reasoning provides transparency and learning opportunities

**Why Local Processing Instead of Cloud APIs?**
- Privacy: Content preferences reveal personal interests
- Cost: Bulk processing would be expensive with cloud APIs
- Reliability: Local processing eliminates network dependencies

**Why Mock-Driven Lab Development?**
- Enables rapid iteration without LLM setup requirements
- Provides predictable test results for CI/CD
- Allows comprehensive edge case testing
- Reduces development cycle time from minutes to seconds

**Why Context-Aware Scoring?**
- Reading context significantly affects content relevance
- Same article has different value at different times
- Personalization beyond content matching improves user experience