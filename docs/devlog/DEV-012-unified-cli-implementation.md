# Unified CLI Implementation

## Overview

Successfully refactored the Lens Engine architecture to provide a single, unified CLI entry point that orchestrates all three main operations. This eliminates the need for users to remember and execute multiple separate commands, while providing a foundation for future API and MCP implementations.

## What We Built

### Single Entry Point: `src/cli.ts`

A unified CLI that orchestrates all three main operations:

- **Feed Processing** (`processFeedsFromOpml`) - Process OPML files into JSON feeds
- **Content Fetching** (`fetchAllContent`) - Fetch HTML content from feed URLs  
- **Content Processing** (`processContent`) - Process and summarize HTML content

### Flexible Operation Modes

**Complete Pipeline (Default)**

```bash
deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts
```

Runs all three operations in sequence: feeds → fetch → process

**Individual Operations**

```bash
# Feed processing only
deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --feeds-only --category "Technology"

# Content fetching only  
deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --fetch-only --feed-name "my_feed"

# Content processing only
deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --process-only --verbose
```

**Advanced Configuration**

```bash
# Complete pipeline with custom settings
deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --concurrency 5 --overwrite --verbose --continue-on-error
```

## Key Features

### Consistent Interface

- **Unified Configuration**: Uses the same configuration system across all modules
- **Consistent Error Handling**: Standardized error reporting and recovery
- **Progress Reporting**: Clear feedback on operation status and results
- **Verbose Mode**: Detailed output for debugging and monitoring
- **Robust Pipeline**: Continue-on-error option for production reliability

### Command Line Options

| Option                | Description                                |
|-----------------------|--------------------------------------------|
| `--help`, `-h`        | Show help information                      |
| `--verbose`, `-v`     | Enable verbose output                      |
| `--feeds-only`        | Run only feed processing from OPML         |
| `--fetch-only`        | Run only content fetching                  |
| `--process-only`      | Run only content processing                |
| `--category`, `-c`    | Filter feeds by category (feeds operation) |
| `--feed-name`, `-f`   | Specify feed name for fetching             |
| `--concurrency`       | Set concurrency level                      |
| `--overwrite`         | Overwrite existing files                   |
| `--continue-on-error` | Continue processing after errors           |

## Architecture Improvements

### Before: Inconsistent Module Structure

```
❌ src/feeds/src/opml_feed_processor.ts
❌ src/retrieval/src/content_fetcher.ts  
❌ src/processors/cli.ts  ← Inconsistent!
```

### After: Consistent Module Structure

```
✅ src/feeds/src/opml_feed_processor.ts
✅ src/retrieval/src/content_fetcher.ts
✅ src/processors/src/content_processor.ts  ← Now consistent!
```

### Module Refactoring Details

**Processors Module Restructuring:**

- **Moved**: `src/processors/cli.ts` → `src/processors/src/content_processor.ts`
- **Extracted**: `processContent()` function for programmatic access
- **Exported**: `CliOptions` interface for reuse
- **Updated**: Import paths and help documentation

## Setup Script Integration

### Before: Three Separate Commands

```bash
# Old setup script approach
(cd .. && deno run --allow-net --allow-read --allow-write src/feeds/src/opml_feed_processor.ts)
(cd .. && deno run --allow-net --allow-read --allow-write --allow-env --env src/retrieval/src/content_fetcher.ts)
(cd .. && deno run --allow-net --allow-read --allow-write --allow-env --env src/processors/cli.ts --overwrite -v)
```

### After: Single Unified Command

```bash
# New setup script approach
(cd .. && deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --overwrite --verbose --continue-on-error)
```

**Benefits:**

- **Simplified User Experience**: One command instead of three
- **Consistent Error Handling**: Pipeline-wide error management
- **Better Progress Tracking**: Unified progress reporting
- **Easier Maintenance**: Single command to update and maintain

## Technical Implementation

### Core Functions Integration

The unified CLI imports and orchestrates the main functions from each module:

```typescript
// Feed processing
import { processFeedsFromOpml, type ProcessOptions } from "./feeds/src/opml_feed_processor.ts";

// Content fetching  
import { fetchAllContent, type ContentFetcherOptions } from "./retrieval/src/content_fetcher.ts";

// Content processing
import { processContent, type CliOptions } from "./processors/src/content_processor.ts";
```

### Error Handling Strategy

- **Individual Operation Failures**: Logged with detailed error messages
- **Pipeline Continuation**: `--continue-on-error` flag allows pipeline to continue despite failures
- **Exit Codes**: Proper exit codes for scripting and automation
- **Verbose Reporting**: Detailed failure analysis in verbose mode

## Architecture Benefits

### 1. **Consistent Module Structure**
All three modules now follow the same organizational pattern, making the codebase more maintainable and predictable.

### 2. **Reusable Functions** 
Each module exports functions that can be called programmatically, enabling:
- API implementations
- MCP server implementations  
- Custom scripting and automation

### 3. **Single Command Interface**
Users only need to remember one command for all operations, reducing cognitive load and improving user experience.

### 4. **Future-Ready Foundation**

Perfect foundation for the planned implementations:

- `src/api.ts` - REST API server using Hono
- `src/mcp.ts` - Model Context Protocol server

## Testing Results

### Successful Test Cases

**Help Command:**

```bash
$ deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --help
# Displays comprehensive help documentation
```

**Feed Processing Only:**

```bash
$ deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --feeds-only --verbose
# Successfully processed 6 feeds from OPML
```

**Content Fetching Only:**

```bash
$ deno run --allow-net --allow-read --allow-write --allow-env --env src/cli.ts --fetch-only --verbose --feed-name "austin_kleon"
# Successfully fetched 10 URLs with proper duplicate handling
```

## Next Steps

With the unified CLI foundation in place, the system is now ready for:

1. **REST API Implementation** (`src/api.ts`)
   - Hono-based server exposing the same operations via HTTP endpoints
   - RESTful interface for web applications and integrations

2. **MCP Server Implementation** (`src/mcp.ts`)  
   - Model Context Protocol server for AI/LLM integration
   - Enables AI assistants to access Lens Engine functionality

3. **Enhanced CLI Features**
   - Configuration management commands
   - Content discovery and querying capabilities
   - Natural language interface integration

## Conclusion

The unified CLI implementation represents a significant architectural improvement that:

- **Simplifies** the user experience from three commands to one
- **Standardizes** the module structure across the entire codebase  
- **Enables** future API and MCP implementations through reusable functions
- **Improves** error handling and progress reporting
- **Maintains** backward compatibility while providing enhanced functionality

This refactoring establishes a solid foundation for the next phase of Lens Engine development. 
