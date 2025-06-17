# Ranker Enhancements Specification

**Document Version:** 1.0  
**Created:** 2025-06-16  
**Status:** Future Enhancement - Tabled  
**Dependencies:** Current ranking system (v1.0) must be stable

## Overview

This document outlines comprehensive enhancements to the Lens Engine ranking system that leverage the full article content alongside existing summary-based ranking. The current system successfully ranks content summaries using LLM-based evaluation with dynamic criteria. These enhancements propose multiple processing pipelines that work with the same source data to provide varied analysis depths and use cases.

## Current System Analysis

### Strengths
- ✅ **Fast summary-based ranking** using LLM evaluation
- ✅ **Dynamic criteria configuration** via JSON files in data directory
- ✅ **Modular architecture** with clear separation of concerns
- ✅ **Reliable timeout handling** and batch processing
- ✅ **Rich contextual awareness** (time, mood, reading duration)

### Architecture Foundation
```
Current Pipeline:
fetched/ (full HTML) → processed/ (summaries) → ranked/ (LLM scores)
```

The modular design with clear interfaces (`ArticleInput`, `RankingContext`, `RankingResult`) provides an excellent foundation for enhancement.

## Enhancement Categories

## 1. Multi-Pipeline Processing Architecture

### 1.1 Deep Analysis Pipeline

**Purpose:** Comprehensive analysis of full article content for high-value content identification.

**Pipeline Flow:**
```
fetched/ → deep-analysis/ → insights/ → deep-ranked/
(full)   → (detailed)     → (rich)   → (comprehensive scores)
```

**Implementation Details:**

#### Deep Analysis Components
- **Content Extraction**: Full text, metadata, images, links, embedded media
- **Semantic Analysis**: Theme extraction, entity recognition, sentiment analysis
- **Quality Metrics**: Reading level, source credibility, factual density
- **Engagement Indicators**: Comment potential, shareability, discussion value
- **Cross-Reference Analysis**: Connections to other articles in corpus

#### New Module Structure
```
src/ranking/deep/
├── types.ts              # DeepAnalysisInput, DeepRankingResult
├── mod.ts                # Public API
├── src/
│   ├── content-analyzer.ts   # Full text analysis
│   ├── entity-extractor.ts  # Named entities, topics
│   ├── quality-assessor.ts  # Content quality metrics
│   ├── semantic-scorer.ts   # Advanced semantic scoring
│   └── orchestrator.ts      # Deep analysis coordination
└── test/                 # Comprehensive test suite
```

#### Configuration Extensions
```json
{
  "deepAnalysis": {
    "enableEntityExtraction": true,
    "enableSentimentAnalysis": true,
    "enableQualityMetrics": true,
    "enableCrossReference": true,
    "processingTimeout": 300000,
    "batchSize": 1
  }
}
```

### 1.2 Semantic Search Pipeline

**Purpose:** Build searchable embeddings from full article content for semantic discovery.

**Pipeline Flow:**
```
fetched/ → embeddings/ → semantic-index/ → search-ready/
(full)   → (vectors)   → (indexed)      → (queryable)
```

**Implementation Details:**

#### Embedding Strategy
- **Chunking Strategy**: Sliding window with overlap for long articles
- **Embedding Model**: Leverage existing `nomic-embed-text:latest`
- **Vector Storage**: SQLite with vector extension or dedicated vector DB
- **Indexing**: Hierarchical Navigable Small World (HNSW) for fast similarity search

#### Search Capabilities
- **Semantic Similarity**: Find articles by meaning, not keywords
- **Cross-Article Discovery**: "More like this" functionality
- **Conceptual Clustering**: Group related articles automatically
- **Query Expansion**: Use embeddings to enhance search queries

#### Module Structure
```
src/ranking/semantic/
├── types.ts                 # SemanticIndex, SearchQuery, SearchResult
├── mod.ts                   # Public API
├── src/
│   ├── embedder.ts         # Text → vector conversion
│   ├── indexer.ts          # Vector storage and indexing
│   ├── searcher.ts         # Similarity search
│   ├── clusterer.ts        # Content clustering
│   └── query-expander.ts   # Query enhancement
└── test/
```

### 1.3 Multi-Signal Ranking Pipeline

**Purpose:** Combine multiple ranking signals for comprehensive content scoring.

**Signal Sources:**
1. **Summary-based ranking** (current system)
2. **Deep content analysis** (full article metrics)
3. **Semantic relevance** (embedding similarity)
4. **Temporal factors** (recency, trending topics)
5. **User interaction patterns** (future: click-through, time spent)
6. **Source credibility** (domain authority, author reputation)

**Scoring Formula:**
```
FinalScore = (
  SummaryScore * summaryWeight +
  DeepScore * deepWeight +
  SemanticScore * semanticWeight +
  TemporalScore * temporalWeight +
  CredibilityScore * credibilityWeight
) / totalWeight
```

## 2. Advanced Ranking Features

### 2.1 Adaptive Learning System

**Concept:** Learn from user preferences to improve ranking accuracy over time.

**Implementation Approach:**
- **Implicit Feedback**: Track which articles user reads, saves, shares
- **Explicit Feedback**: Simple thumbs up/down on rankings
- **Preference Modeling**: Build user preference vectors
- **Criteria Adaptation**: Automatically adjust ranking criteria weights

**Privacy Considerations:**
- All learning data stored locally
- No external data transmission
- User control over data collection
- Easy reset/deletion of learned preferences

### 2.2 Context-Aware Enhancement

**Enhanced Context Dimensions:**
- **Location Context**: Timezone, locale-specific interests
- **Work Context**: Professional vs. personal reading modes
- **Social Context**: Solo reading vs. discussion preparation
- **Device Context**: Mobile (quick reads) vs. desktop (deep dives)
- **Historical Context**: Previous reading patterns and topics

**Dynamic Context Detection:**
```typescript
interface EnhancedRankingContext extends RankingContext {
  location?: LocationContext;
  workMode?: 'professional' | 'personal' | 'research';
  socialContext?: 'solo' | 'discussion-prep' | 'sharing';
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  recentTopics?: string[];
  readingVelocity?: 'slow' | 'normal' | 'fast';
}
```

### 2.3 Topic Modeling and Trend Detection

**Purpose:** Identify emerging topics and trending themes across the content corpus.

**Features:**
- **Topic Evolution**: Track how topics change over time
- **Trend Scoring**: Boost articles on emerging topics
- **Topic Diversity**: Ensure diverse topic representation in rankings
- **Personal Topic Tracking**: Learn user's topic preferences

**Implementation:**
- **LDA/BERTopic**: For topic modeling
- **Trend Detection**: Statistical analysis of topic frequency
- **Topic Graphs**: Visualize topic relationships
- **Topic-Aware Ranking**: Adjust scores based on topic preferences

## 3. Enhanced User Interface and API

### 3.1 Advanced CLI Commands

```bash
# Multi-pipeline processing
deno run src/cli.ts --process-all-pipelines
deno run src/cli.ts --deep-rank-only --timeout 300
deno run src/cli.ts --build-semantic-index
deno run src/cli.ts --multi-signal-rank

# Advanced querying
deno run src/cli.ts --semantic-search "creativity and AI"
deno run src/cli.ts --rank-by-topic "machine learning"
deno run src/cli.ts --trending-topics --days 7

# Learning and adaptation
deno run src/cli.ts --learn-from-feedback feedback.json
deno run src/cli.ts --adapt-criteria --user-profile advanced
deno run src/cli.ts --reset-learning-data

# Analysis and insights
deno run src/cli.ts --analyze-corpus --output analysis.json
deno run src/cli.ts --topic-report --format markdown
deno run src/cli.ts --ranking-performance-report
```

### 3.2 Web API Enhancement

**RESTful Endpoints:**
```
GET /api/v2/rankings/summary        # Current summary-based rankings
GET /api/v2/rankings/deep          # Deep analysis rankings  
GET /api/v2/rankings/semantic      # Semantic similarity rankings
GET /api/v2/rankings/multi-signal  # Combined rankings

POST /api/v2/search/semantic        # Semantic search
POST /api/v2/feedback               # User feedback collection
GET /api/v2/topics/trending         # Trending topics
GET /api/v2/user/preferences        # User preference profile

PUT /api/v2/criteria/custom         # Update ranking criteria
GET /api/v2/corpus/analysis         # Corpus-wide analysis
```

### 3.3 MCP Server Integration

**Model Context Protocol Extensions:**

```typescript
// Enhanced ranking tools for AI assistants
export const mcpRankingTools = {
  "lens_rank_content": {
    "description": "Rank content using multiple signals",
    "parameters": {
      "content": "Article content or summary",
      "context": "User context and preferences", 
      "method": "summary|deep|semantic|multi-signal"
    }
  },
  "lens_semantic_search": {
    "description": "Find semantically similar content",
    "parameters": {
      "query": "Search query or concept",
      "limit": "Number of results to return"
    }
  },
  "lens_trend_analysis": {
    "description": "Analyze trending topics and themes",
    "parameters": {
      "timeframe": "Analysis time window",
      "format": "Output format preference"
    }
  }
};
```

## 4. Performance and Scalability

### 4.1 Caching Strategy

**Multi-Level Caching:**
- **L1: In-Memory Cache**: Recent rankings and embeddings
- **L2: SQLite Cache**: Persistent storage for computed results  
- **L3: File System Cache**: Pre-computed analysis results
- **Cache Invalidation**: Smart invalidation based on content changes

**Cache Keys:**
```typescript
interface CacheKey {
  contentHash: string;        // SHA-256 of article content
  criteriaHash: string;       // Hash of ranking criteria
  contextHash: string;        // Hash of ranking context
  pipelineVersion: string;    // Version of ranking pipeline
}
```

### 4.2 Incremental Processing

**Change Detection:**
- **Content Fingerprinting**: Detect when articles change
- **Incremental Updates**: Only reprocess changed content
- **Dependency Tracking**: Understand which results need updating
- **Background Processing**: Non-blocking pipeline updates

### 4.3 Resource Management

**Memory Management:**
- **Streaming Processing**: Handle large corpora without memory overflow
- **Batch Size Optimization**: Dynamic batch sizing based on available resources
- **Model Loading**: Lazy loading of LLM and embedding models
- **Garbage Collection**: Proactive cleanup of temporary data

## 5. Data Architecture Evolution

### 5.1 Enhanced Data Directory Structure

```
data/
├── fetched/              # Original HTML articles (current)
├── processed/            # Summaries (current)
├── ranked/              # Summary-based rankings (current)
├── deep-analysis/       # Full article analysis
├── embeddings/          # Vector representations
├── semantic-index/      # Searchable vector index
├── multi-signal-ranks/  # Combined ranking results
├── topics/              # Topic modeling results
├── trends/              # Trend analysis data
├── user-feedback/       # Learning data
├── cache/               # Performance caching
└── config/
    ├── ranking-criteria.json    # Current criteria (existing)
    ├── deep-analysis.json       # Deep analysis configuration
    ├── semantic-search.json     # Search configuration
    ├── learning.json            # Adaptive learning settings
    └── performance.json         # Performance tuning
```

### 5.2 Database Schema Evolution

**SQLite Schema Extensions:**
```sql
-- Enhanced articles table
CREATE TABLE articles_enhanced (
    id INTEGER PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    fetched_at TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- Summary data (existing)
    summary TEXT,
    summary_score REAL,
    summary_categories TEXT, -- JSON array
    
    -- Deep analysis data
    deep_analysis_json TEXT, -- Full analysis results
    deep_score REAL,
    quality_metrics TEXT,    -- JSON object
    entities TEXT,           -- JSON array
    topics TEXT,             -- JSON array
    
    -- Semantic data
    embedding BLOB,          -- Vector representation
    embedding_model TEXT,    -- Model used for embedding
    
    -- Multi-signal scoring
    final_score REAL,
    score_components TEXT,   -- JSON object with component scores
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topic modeling
CREATE TABLE topics (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    keywords TEXT,           -- JSON array
    coherence_score REAL,
    article_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User feedback and learning
CREATE TABLE user_feedback (
    id INTEGER PRIMARY KEY,
    article_id INTEGER REFERENCES articles_enhanced(id),
    feedback_type TEXT NOT NULL, -- 'thumbs_up', 'thumbs_down', 'save', 'share'
    context_json TEXT,           -- Context when feedback given
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Implementation Phases

### Phase 1: Foundation Enhancement (Immediate)
- ✅ **Complete current summary ranking system**
- ✅ **Stabilize timeout and performance issues**
- ✅ **Comprehensive testing and documentation**
- ⏳ **Performance optimization and caching**

### Phase 2: Deep Analysis Pipeline (2-4 weeks)
- 📋 **Design and implement deep analysis module**
- 📋 **Full article content processing**
- 📋 **Quality metrics and entity extraction**
- 📋 **Integration with existing CLI**

### Phase 3: Semantic Infrastructure (4-6 weeks)
- 📋 **Embedding generation pipeline**
- 📋 **Vector storage and indexing**
- 📋 **Semantic search capabilities**
- 📋 **Topic modeling and clustering**

### Phase 4: Multi-Signal Integration (6-8 weeks)
- 📋 **Combine ranking signals**
- 📋 **Adaptive learning system**
- 📋 **Advanced context awareness**
- 📋 **Performance optimization**

### Phase 5: Advanced Features (8-12 weeks)
- 📋 **Web API development**
- 📋 **MCP server integration**
- 📋 **Advanced analytics and reporting**
- 📋 **User interface enhancements**

## 7. Technical Considerations

### 7.1 Model Selection and Performance

**LLM Selection Criteria:**
- **Speed vs. Quality**: Balance for each pipeline
- **JSON Output Reliability**: Critical for structured data
- **Context Window**: Support for full articles in deep analysis
- **Resource Requirements**: Memory and compute constraints

**Recommended Models by Pipeline:**
- **Summary Ranking**: `gemma2:2b` (fast, reliable)
- **Deep Analysis**: `llama3.1:8b` (high quality reasoning)
- **Semantic Processing**: `nomic-embed-text:latest` (optimized embeddings)

### 7.2 Error Handling and Resilience

**Failure Modes:**
- **Model Unavailability**: Graceful degradation to simpler models
- **Timeout Handling**: Progressive timeout strategies
- **Partial Results**: Handle incomplete processing gracefully
- **Data Corruption**: Validation and recovery mechanisms

**Circuit Breaker Pattern:**
```typescript
interface CircuitBreaker {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime: Date;
  timeout: number;
}
```

### 7.3 Testing Strategy

**Test Categories:**
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Pipeline end-to-end testing
- **Performance Tests**: Throughput and latency benchmarks
- **Regression Tests**: Ensure consistent ranking quality
- **Load Tests**: Handle large content corpora

**Quality Metrics:**
- **Ranking Consistency**: Same content should rank similarly
- **Processing Speed**: Throughput per minute
- **Memory Usage**: Peak and sustained memory consumption
- **Error Rates**: Failure percentage per pipeline

## 8. Success Metrics and Evaluation

### 8.1 Quantitative Metrics

**Performance Metrics:**
- **Processing Speed**: Articles per minute per pipeline
- **Accuracy**: Ranking quality assessment via human evaluation
- **Coverage**: Percentage of content successfully processed
- **Latency**: End-to-end processing time per article

**Resource Metrics:**
- **Memory Usage**: Peak memory consumption per pipeline
- **CPU Utilization**: Processing efficiency
- **Storage Requirements**: Data growth patterns
- **Model Loading Time**: Cold start performance

### 8.2 Qualitative Assessment

**User Experience:**
- **Ranking Relevance**: How well rankings match user preferences
- **Discovery Value**: Quality of semantically similar content
- **Trend Detection**: Accuracy of trending topic identification
- **Learning Effectiveness**: Improvement in personalized rankings

## 9. Future Considerations

### 9.1 Scalability Horizons

**Multi-User Support:**
- User-specific ranking models
- Collaborative filtering
- Social ranking signals
- Privacy-preserving personalization

**Distributed Processing:**
- Multi-machine processing
- Cloud deployment options
- Microservice architecture
- Message queue integration

### 9.2 Advanced AI Integration

**Latest Model Integration:**
- Support for newer LLM architectures
- Multimodal content analysis (text + images)
- Real-time model fine-tuning
- Federated learning approaches

**AI Safety and Ethics:**
- Bias detection in rankings
- Fairness across content types
- Explainable ranking decisions
- User control over AI influence

## 10. Conclusion

This specification outlines a comprehensive enhancement path for the Lens Engine ranking system. The proposed multi-pipeline architecture leverages the existing solid foundation while enabling sophisticated content analysis capabilities.

The phased implementation approach ensures that enhancements can be added incrementally without disrupting the current stable system. Each phase builds upon previous work and adds meaningful value to the content curation experience.

Key benefits of this enhancement roadmap:
- **Maintains current system stability** while adding advanced features
- **Leverages full article content** for richer analysis
- **Provides multiple analysis depths** for different use cases  
- **Enables semantic discovery** and trend detection
- **Supports personalization** and adaptive learning
- **Ensures scalability** for growing content volumes

The modular design ensures that individual enhancements can be implemented independently and that the system remains maintainable and testable throughout the evolution process.

---

**Next Steps:**
1. Complete Phase 1 stabilization of current ranking system
2. Validate technical approach with prototype deep analysis pipeline
3. Establish performance benchmarks for enhancement comparison
4. Begin detailed design of deep analysis module (Phase 2)

**Document Maintenance:**
This specification should be updated as implementation progresses and requirements evolve. Regular review cycles should assess feasibility and priority of proposed enhancements based on user needs and technical constraints.