# Ranking Module Production Promotion Specification

## Document Purpose

This specification details the step-by-step process for promoting the ranking module from experimental lab code to production-ready integration within the Lens Engine architecture.

## Current State Assessment

### Lab Implementation Status
- ✅ **Complete Lab Implementation**: Full ranking system in `src/ranking/lab/`
- ✅ **Comprehensive Testing**: 35 tests covering unit, integration, and mock validation
- ✅ **Mock LLM Integration**: Functional with simulated responses
- ✅ **Context-Aware Scoring**: Day/time/mood adjustments implemented
- ✅ **Type Safety**: Complete TypeScript interfaces and error handling

### Architecture Research Completed
- ✅ **Processors Module Pattern**: Analyzed structure (src/, test/, mod.ts, types.ts)
- ✅ **Models Integration**: Understood `@src/models/mod.ts` usage patterns
- ✅ **Config System**: Reviewed configuration loading and environment variables
- ✅ **CLI Integration**: Studied pipeline patterns in `src/cli.ts`

## Production Module Structure Design

### Target Directory Layout
```
src/ranking/
├── mod.ts                    # Public API entry point
├── types.ts                  # Public type definitions
├── src/                      # Production implementation
│   ├── context-ranker.ts     # Context-aware scoring logic
│   ├── llm-ranker.ts         # Real Ollama LLM integration
│   ├── orchestrator.ts       # Main ContentRanker class
│   └── utils.ts              # Shared utilities
├── test/                     # Production tests
│   ├── context-ranker.test.ts
│   ├── llm-integration.test.ts
│   ├── orchestrator.test.ts
│   └── fixtures/
│       └── test-articles.ts
└── lab/                      # Experimental code (keep existing)
    ├── context-ranker.ts
    ├── llm-ranker.ts
    ├── mod.ts
    ├── types.ts
    ├── mock-data.ts
    └── test/ (35 existing tests)
```

## Implementation Steps

### Step 1: Create Production Public API

**Objective**: Establish public interface following processors module pattern

**Tasks**:
1. **Create `src/ranking/types.ts`**
   - Copy core interfaces from lab version
   - Add production-specific types for real LLM integration
   - Include configuration types for ranking settings

2. **Create `src/ranking/mod.ts`**
   - Export main `rankContent()` function (follows `processContent()` pattern)
   - Export `ContentRanker` class for advanced usage
   - Export all public types
   - Provide both functional and class-based APIs

**Key Interfaces**:
```typescript
// Main ranking function (follows processors pattern)
export function rankContent(
  articles: ArticleInput[],
  context: RankingContext,
  options?: RankingOptions
): Promise<RankingResult[]>;

// Advanced class-based API
export class ContentRanker {
  constructor(config?: RankingConfig);
  async rankArticle(article: ArticleInput, context: RankingContext): Promise<ScoringResult>;
  async rankBatch(articles: ArticleInput[], context: RankingContext): Promise<ScoringResult[]>;
}
```

### Step 2: Implement Production Source Code

**Objective**: Replace mock LLM with real Ollama integration

**Tasks**:
1. **Create `src/ranking/src/` directory structure**

2. **Implement `src/ranking/src/llm-ranker.ts`**
   - Replace MockLLMRanker with OllamaRanker
   - Use `chatWithOllamaConfig()` from `@src/models/mod.ts`
   - Implement proper error handling and retries
   - Add timeout and connection validation

3. **Copy `src/ranking/src/context-ranker.ts`**
   - Transfer context-aware scoring logic from lab
   - Optimize for production performance
   - Add configuration-driven adjustments

4. **Create `src/ranking/src/orchestrator.ts`**
   - Main ContentRanker class implementation
   - Coordinate LLM and context scoring
   - Handle batch processing efficiently
   - Integrate with config system

5. **Create `src/ranking/src/utils.ts`**
   - Shared helper functions
   - Validation utilities
   - Score normalization functions

### Step 3: Add Ranking Prompts to Models Module

**Objective**: Create production-quality prompts for article ranking

**Tasks**:
1. **Create `src/models/prompts/rank-article.txt`**
   - Engineer effective ranking prompt based on lab testing
   - Include context-aware instructions
   - Specify JSON response format
   - Add examples for consistency

2. **Update Models Module**
   - Add ranking-specific functions to models controller
   - Create `rankArticle()` function alongside `summarizeContent()`
   - Ensure prompt template loading works correctly

**Prompt Template Structure**:
```
You are an intelligent content curator. Rate this article's relevance on a scale of 0-10.

Context:
- Day: {dayOfWeek}
- Time: {timeOfDay}
- User mood: {userMood}
- Reading time: {readingDuration}

Article:
Title: {title}
Summary: {summary}

Consider:
1. Content quality and depth
2. Relevance to context (day/time/mood)
3. Actionability and practical value
4. Uniqueness vs repetitive news
5. Match to reading duration

Respond only in JSON format:
{
  "score": 0-10,
  "reasoning": "detailed explanation",
  "categories": ["category1", "category2"],
  "estimatedReadTime": minutes
}
```

### Step 4: Create Production Tests

**Objective**: Ensure production code works with real integrations

**Tasks**:
1. **Create `src/ranking/test/` directory**

2. **Implement `context-ranker.test.ts`**
   - Test context-aware scoring with real config
   - Verify score adjustments work correctly
   - Test edge cases and boundary conditions

3. **Implement `llm-integration.test.ts`**
   - Test real Ollama integration (requires running Ollama)
   - Mock Ollama responses for CI/CD
   - Test error handling and timeouts

4. **Implement `orchestrator.test.ts`**
   - Test main ContentRanker class
   - Test batch processing performance
   - Integration tests with config system

5. **Create `fixtures/test-articles.ts`**
   - Production test data
   - Real-world article examples
   - Various content types and categories

### Step 5: Update CLI Integration

**Objective**: Add ranking step to main Lens Engine pipeline

**Tasks**:
1. **Update `src/cli.ts`**
   - Add ranking import: `import { rankContent } from "@src/ranking/mod.ts"`
   - Add ranking CLI options (--rank-only, --context-*, etc.)
   - Integrate ranking step after processing in pipeline
   - Add ranking results output formatting

2. **Add New CLI Options**:
   ```bash
   deno run src/cli.ts --rank-only                    # Rank existing processed content
   deno run src/cli.ts --context-mood=focused         # Set user mood context
   deno run src/cli.ts --context-time=morning         # Override time context
   deno run src/cli.ts --ranking-threshold=7          # Filter by minimum score
   ```

3. **Update Pipeline Flow**:
   ```
   OPML → Feeds → Retrieval → Processing → **Ranking** → Output
   ```

### Step 6: Update Configuration System

**Objective**: Add ranking-specific configuration options

**Tasks**:
1. **Update `src/config/types.ts`**
   - Add `RankingConfig` interface
   - Include in main `AppConfig` interface
   - Add environment variable mappings

2. **Update `.env` file**
   - Add LENS_RANKING_* environment variables
   - Set default confidence thresholds
   - Configure default context settings

3. **Configuration Structure**:
   ```typescript
   export interface RankingConfig {
     /** Minimum confidence threshold for scoring */
     confidenceThreshold: number;
     /** Default user mood when not specified */
     defaultMood: 'focused' | 'casual' | 'learning' | 'entertainment';
     /** Enable context-aware scoring adjustments */
     contextAware: boolean;
     /** Timeout for LLM requests (milliseconds) */
     llmTimeout: number;
     /** Maximum batch size for processing */
     maxBatchSize: number;
   }
   ```

4. **Environment Variables**:
   ```bash
   LENS_RANKING_CONFIDENCE_THRESHOLD=0.7
   LENS_RANKING_DEFAULT_MOOD=focused
   LENS_RANKING_CONTEXT_AWARE=true
   LENS_RANKING_LLM_TIMEOUT=30000
   LENS_RANKING_MAX_BATCH_SIZE=10
   ```

### Step 7: Documentation and Examples

**Objective**: Provide clear usage documentation

**Tasks**:
1. **Update `src/ranking/README.md`**
   - Document production API
   - Include usage examples
   - Add integration guidelines

2. **Create Usage Examples**
   - Standalone ranking usage
   - CLI pipeline integration
   - Programmatic API usage

3. **Add Performance Guidelines**
   - Batch processing recommendations
   - Configuration tuning advice
   - Ollama setup requirements

## Integration Points

### Models Module Integration
- **Function Pattern**: Follow `summarizeContent()` pattern for `rankContent()`
- **Configuration**: Use `getConfig()` for LLM settings
- **Error Handling**: Consistent error types and messages
- **Prompt Management**: Store prompts in models/prompts/ directory

### Config Module Integration
- **Loading Pattern**: Use `getConfig()` function
- **Type Safety**: Extend existing config interfaces
- **Environment Variables**: Follow LENS_* naming convention
- **Validation**: Use existing config validation patterns

### CLI Integration
- **Argument Parsing**: Follow existing CLI option patterns
- **Pipeline Integration**: Insert ranking after processing step
- **Output Formatting**: Consistent with other module outputs
- **Error Handling**: Graceful degradation and helpful error messages

## Success Criteria

### Functional Requirements
- ✅ **API Compatibility**: Public API follows established patterns
- ✅ **Real LLM Integration**: Works with actual Ollama instance
- ✅ **Configuration Integration**: Loads settings from config system
- ✅ **CLI Integration**: Ranking step works in full pipeline
- ✅ **Error Handling**: Graceful failure modes implemented

### Quality Requirements
- ✅ **Test Coverage**: All production code has corresponding tests
- ✅ **Performance**: Batch processing meets performance targets
- ✅ **Documentation**: Clear usage examples and integration guides
- ✅ **Consistency**: Follows established Lens Engine patterns

### Regression Requirements
- ✅ **Lab Tests**: All 35 existing lab tests continue passing
- ✅ **Module Tests**: All other module tests remain unaffected
- ✅ **Integration Tests**: Full CLI pipeline works end-to-end

## Risk Mitigation

### Technical Risks
1. **Ollama Connection Issues**
   - Mitigation: Comprehensive error handling and fallback modes
   - Validation: Connection testing in setup

2. **Performance Degradation**
   - Mitigation: Batch processing and timeout controls
   - Monitoring: Performance benchmarks in tests

3. **Configuration Conflicts**
   - Mitigation: Careful config interface design
   - Testing: Config integration tests

### Development Risks
1. **Breaking Changes**
   - Mitigation: Maintain lab code for fallback
   - Testing: Comprehensive regression test suite

2. **Integration Complexity**
   - Mitigation: Step-by-step implementation
   - Validation: Each step tested before proceeding

## Future Considerations

### Phase 2 Preparation
- **Data Collection**: Structure for collecting user feedback
- **Embedding Pipeline**: Interfaces ready for embedding integration
- **Training Data**: Storage format for model training

### Scalability
- **Caching Strategy**: Results caching for improved performance
- **Batch Optimization**: Larger batch processing capabilities
- **Monitoring**: Performance and accuracy metrics collection

---

This specification provides the detailed roadmap for promoting the ranking module from experimental lab code to production-ready integration within the Lens Engine ecosystem.