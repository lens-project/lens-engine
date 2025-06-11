# Ranking Module

The ranking module scores articles by relevance to user interests, helping
determine which content is worth reading vs skipping.

## Purpose

Rather than relying on clickbait headlines, this module analyzes article
summaries to predict personal relevance. It's the core intelligence layer that
transforms an RSS reader from a fire hose of content into a curated feed.

## Architecture

### Hybrid Approach (3-Phase Strategy)

**Phase 1: LLM-Based Scoring** (Current)

- Prompt-based scoring using local Ollama models
- Returns score (0-10) with reasoning
- Collects training data for future phases
- ~25 seconds per article (development acceptable)

**Phase 2: Embedding-Based Scoring** (Planned)

- Fast similarity scoring using collected training data
- Sub-second scoring for bulk processing
- Cosine similarity between liked articles and new content

**Phase 3: Hybrid System** (Target)

- Embeddings for high-confidence scoring
- LLM for edge cases and detailed analysis
- Best of both worlds: speed + accuracy

## Module Structure

```
ranking/
├── hybrid-ranker.ts      # Main orchestrator
├── llm-ranker.ts         # LLM-based scoring
├── embedding-ranker.ts   # Embedding similarity scoring
├── context-ranker.ts     # Context-aware ranking
└── types.ts              # Shared interfaces
```

## Key Interfaces

```typescript
interface ScoringResult {
  score: number; // 0-10 relevance score
  confidence: number; // 0-1 confidence in score
  method: "llm" | "embedding" | "hybrid";
  reasoning?: string; // LLM explanation
  categories?: string[]; // Content categories
}

interface RankingContext {
  dayOfWeek: string; // Sunday = lighter content
  timeOfDay: string; // Morning = quick reads
  userMood?: string; // focused | casual | learning
}
```

## Context-Aware Ranking

The system supports different ranking criteria based on context:

- **Sunday**: Prioritize lifestyle, entertainment, lighter reads
- **Monday**: Focus on industry news, professional development
- **Friday PM**: Creative content vs deep technical analysis
- **Morning**: Quick, actionable content vs long-form pieces

## Development Phases

1. Implement LLM scorer, start collecting user feedback
2. Accumulate training data (50+ rated articles minimum)
3. Build embedding scorer with collected preferences
4. Optimize hybrid decision logic and context awareness

## Integration

```typescript
// Main workflow integration
const summary = await processor.summarize(article);
const ranking = await ranker.score({
  title: article.title,
  summary: summary.content,
  url: article.url,
}, context);

// Decision logic
if (ranking.score >= 7) return "high-interest";
if (ranking.score >= 4) return "maybe-interesting";
return "skip";
```

## Performance Goals

**Current (Phase 1)**

- LLM scoring: ~25 seconds per article
- Quality: High accuracy with reasoning

**Target (Phase 3)**

- Bulk scoring: <1 second per article (embeddings)
- Detailed analysis: <10 seconds (LLM for edge cases)
- Accuracy: Maintain or improve current quality

## Future Enhancements

- **Multi-Profile Support**: Work vs personal interest profiles
- **Temporal Learning**: Adapt to changing interests over time
- **Collaborative Filtering**: Learn from similar users (privacy-preserving)
- **Content Type Awareness**: Different scoring for news vs tutorials vs opinion
  pieces

---

_The name "ranker" chosen with intentional humor - because yes, having an AI
pre-screen all your content is a bit of digital wanking, and we're okay with
that._
