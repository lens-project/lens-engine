# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lens Engine is a content-aware feed aggregator built with Deno and TypeScript that uses local AI models (via Ollama) to intelligently filter, rank, and recommend content from RSS feeds. The project follows strict functional programming principles and uses a modular, labs-based development approach.

## Development Commands

```bash
# Start development server with hot reload
deno task server

# Run all tests
deno task test

# Run tests in watch mode  
deno task test:watch

# Run only experimental lab tests
deno task test:lab

# Run complete CLI pipeline (feeds → fetch → process)
deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts

# Run individual pipeline steps
deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts --feeds-only
deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts --fetch-only
deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts --process-only
```

## Architecture Principles

### Functional Programming Paradigm
This codebase strictly follows functional programming principles:

- **Use pure functions** over classes with state
- **Prefer immutable data structures** 
- **Use function composition** for complex operations
- **Avoid classes, inheritance, and methods that modify object state**
- **Keep state management minimal and explicit**

### Modular Component Structure
Each module follows this consistent pattern:
```
module_name/
├── src/           # Private implementation details
├── types.ts       # Public type definitions
├── mod.ts         # Public API entry point
└── test/          # Production tests
```

### Labs-Based Development
Experimental features are developed in `lab/` subdirectories:
```
module_name/
└── lab/
    ├── experiment.ts
    └── test/
        ├── unit/
        ├── integration/
        └── mocks/
```

## Core Application Flow

1. **RSS/OPML Processing** (`feeds/`): Parse OPML files and RSS feeds
2. **Content Retrieval** (`retrieval/`): Fetch articles from feeds
3. **Content Processing** (`processors/`): AI-powered summarization via Ollama
4. **Ranking** (`ranking/`): Score content relevance to user interests
5. **Query Interface** (`cli.ts`): Unified command-line interface

## Key Technology Stack

- **Runtime**: Deno with TypeScript
- **Web Framework**: Hono
- **AI Integration**: Ollama (local AI models)
- **LLM Framework**: LangChain Community
- **Database**: SQLite with optional vector database support
- **Testing**: Deno's built-in test framework

## Testing Strategy

The project uses a multi-layer testing approach:
- **Unit Tests**: Fast, isolated tests with comprehensive mocking
- **Integration Tests**: Real dependency testing
- **Lab Tests**: Experimental code validation

## Current Development Focus

Working on the `feature-ranking` branch implementing content relevance scoring with a 3-phase approach:
1. **Phase 1**: LLM-based scoring using prompts (current)
2. **Phase 2**: Embedding-based similarity scoring (planned)
3. **Phase 3**: Hybrid system combining both approaches (target)

## Configuration

Environment configuration via `.env` files. Reference `.env.example` for required variables. The system is designed to work locally-first with AI processing running via Ollama for privacy.