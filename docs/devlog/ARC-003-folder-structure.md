# Lens Project Folder Structure

## Overview

This document outlines the folder structure for the Lens project's `src` directory. The structure is designed to align with the system architecture described in the design document, organizing code into logical components that map to the system's core functionality.

## Folder Structure

```
src/
├── core/               # Core system components and shared utilities
├── sources/            # RSS Source Registry implementation
├── retrieval/          # Retrieval Engine implementation
├── processors/         # Content processing paths
├── models/             # Model Context Protocol Server implementation
├── database/           # Vector Database implementation
├── query/              # Query Engine implementation
├── cli/                # Command-line interface
├── api/                # REST API server (CLI facade)
├── mcp/                # Model Context Protocol API server (CLI facade)
└── utils/              # Utility functions
```

## Directory Purposes

### `core/`
- Base classes and interfaces
- Configuration management
- System initialization
- Error handling

### `feeds/`
- Feed source management
- Source metadata handling
- Source reliability tracking
- User preferences per source

### `retrieval/`
- Feed fetching operations
- Content type detection
- Update scheduling
- Fetch history management

### `processors/`
- Common processing utilities
- Content normalization

#### `processors/video/`
- Video metadata extraction
- Transcript retrieval
- Video-optimized embedding generation

#### `processors/article/`
- Article text extraction
- Readability analysis
- Text-optimized embedding generation

### `models/`
- Ollama integration
- Embedding generation
- Content relevance assessment
- Query understanding
- AI operations API

### `database/`
- Database schema and migrations
- Vector storage and retrieval
- User interaction history
- Temporal data management

### `query/`
- Natural language query parsing
- Ranking algorithms
- Semantic search implementation
- Content type filtering

### `cli/`
- Command definitions
- User interaction
- Output formatting
- Feedback collection

### `api/`
- REST API server implementation
- CLI command mapping
- Request/response handling
- Authentication and authorization
- Rate limiting

### `mcp/`
- Model Context Protocol API server
- AI model operation endpoints
- CLI facade for model operations
- Model request/response formatting

### `types/`
- Shared interfaces (FeedSource, ContentItem, etc.)
- Type declarations
- Schema definitions

### `utils/`
- Common helper functions
- Date/time utilities
- Logging
- Text processing utilities

## Development Guidelines

1. **Component Isolation**: Each directory should contain code that is specific to its domain, minimizing dependencies on other components.

2. **Interface-First Design**: Define clear interfaces in the `types.ts` file within each module.

3. **Shared Utilities**: Common functionality used across multiple components should be placed in `utils/` or `core/`.

4. **Experimental Code (Labs)**: Labs are not a separate subfolder but rather a part of the folder structure. Each module can contain experimental features, proof-of-concept implementations, and features in incubation. These experimental features should be properly labeled and documented before being integrated into the main codebase.

5. **Testing**: Each component should have corresponding tests in a `test` directory within its folder.

## Mapping to System Architecture

This folder structure directly maps to the core components described in section 3.2 of the design document:

- RSS Source Registry → `sources/`
- Retrieval Engine → `retrieval/`
- Content Type Paths → `processors/`
- Model Context Protocol Server → `models/`
- Vector Database → `database/`
- Query Engine → `query/`
- User Interface (CLI) → `cli/`
- REST API Server → `api/`
- Model Context Protocol API Server → `mcp/`

The structure supports the phased development approach outlined in section 6.2 of the design document.
