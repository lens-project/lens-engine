# Models Module - Implementation Plan

## Overview

Complete the content processing pipeline by implementing LLM integration with
Ollama as the primary provider. This connects HTML extraction to AI-powered
summarization.

## Current Pipeline Status

```
✅ HTML Input → ✅ Extract Text → 🔄 Summarize (LLM) → 🔲 Vectorize → 🔲 Store
```

## Implementation Tasks

### Phase 1: Core Ollama Provider

#### 1.1 Port Ollama Client (`src/models/providers/ollama/client.ts`)

- **Source**: Existing lab code with validation, simple chat, and config-based
  chat
- **Enhancements**:
  - Production error handling
  - Connection pooling/retry logic
  - Model availability validation
- **Functions**: `validateOllamaConnection()`, `chatWithOllama()`,
  `chatWithOllamaConfig()`

#### 1.2 Ollama Types (`src/models/providers/ollama/types.ts`)

```typescript
interface OllamaOptions {
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

interface OllamaResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}
```

#### 1.3 Ollama Module Exports (`src/models/providers/ollama/mod.ts`)

- Export client functions and types
- Provide clean public API

### Phase 2: Summarization Controller

#### 2.1 Summarizer Implementation (`src/models/controller/summarizer.ts`)

```typescript
// Core function to integrate with HTML controller
async function summarizeContent(
  text: string,
  options: SummarizationOptions,
): Promise<SummaryResult>;

// Options for different summarization strategies
interface SummarizationOptions {
  provider: "ollama";
  model: string;
  strategy: "brief" | "detailed" | "key-points";
  maxLength?: number;
  customPrompt?: string;
}
```

#### 2.2 Prompt Templates (`src/models/prompts/`)

- **`summarize-brief.txt`**: 1-2 sentence summaries
- **`summarize-detailed.txt`**: Paragraph-length summaries
- **`extract-key-points.txt`**: Bullet-point key information

### Phase 3: Integration & Testing

#### 3.1 Update HTML Controller

**Modify `src/controller/content/html.ts`**:

```typescript
// Add summarization step after extraction
const extracted = extractFromHtml(html, options);
const summary = await summarizeContent(extracted.text, {
  provider: "ollama",
  model: config.llm.llmModel,
  strategy: options.summaryStrategy || "brief",
});

return {
  success: true,
  input: identifier,
  metadata: {
    ...extracted.metadata,
    summary: summary.content,
  },
};
```

#### 3.2 Extend Processing Options

**Update `src/controller/types.ts`**:

```typescript
interface ProcessingOptions {
  // Existing options...

  // New LLM options
  summaryStrategy?: "brief" | "detailed" | "key-points";
  skipSummarization?: boolean;
  customPrompt?: string;
}

interface ProcessingResult {
  // Existing fields...

  metadata?: {
    // Existing metadata...
    summary?: string;
    llmModel?: string;
    processingTime?: number;
  };
}
```

#### 3.3 Unit Tests

**Create `test/models/`**:

- Test Ollama client connection and chat functions
- Test summarizer with different strategies
- Test integration with HTML controller
- Mock Ollama responses for reliable testing

## File Structure to Create

```
src/models/
├── providers/
│   ├── ollama/
│   │   ├── client.ts      # Port from lab code
│   │   ├── types.ts       # Ollama-specific interfaces
│   │   ├── mod.ts         # Ollama exports
│   └── mod.ts             # All providers
├── controller/
│   ├── summarizer.ts      # Summarization logic
│   └── mod.ts             # Controller exports
├── prompts/
│   ├── summarize-brief.txt
│   ├── summarize-detailed.txt
│   └── extract-key-points.txt
└── mod.ts                 # Models module exports

test/models/
├── ollama_test.ts         # Test Ollama client
├── summarizer_test.ts     # Test summarization
└── integration_test.ts    # Test full pipeline
```

## Configuration Requirements

**Extend existing config schema**:

```typescript
interface LLMConfig {
  ollamaBaseUrl: string; // Already exists
  llmModel: string; // Already exists

  // Add these:
  defaultSummaryStrategy: "brief" | "detailed" | "key-points";
  maxRetries: number;
  timeoutMs: number;
  fallbackModel?: string;
}
```

## Success Criteria

### Functional

- ✅ HTML controller can call summarization
- ✅ Multiple models work with Ollama provider
- ✅ Different summarization strategies produce appropriate outputs
- ✅ Graceful error handling when Ollama is unavailable

### Technical

- ✅ All existing tests continue to pass
- ✅ New unit tests for models module (>90% coverage)
- ✅ Integration test: HTML file → extraction → summarization
- ✅ Configuration-driven model selection

### Quality

- ✅ Clean separation between provider and controller logic
- ✅ Extensible architecture for future providers (OpenAI, etc.)
- ✅ Production-ready error handling and logging
- ✅ Type-safe interfaces throughout

## Next Steps After Completion

Once models module is complete, the processing pipeline will be:

```
✅ HTML Input → ✅ Extract Text → ✅ Summarize (LLM) → 🔲 Vectorize → 🔲 Store
```

The final two steps (vectorization and storage) will operate on the high-quality
summaries produced by this models module, creating a complete intelligent
document processing system.
