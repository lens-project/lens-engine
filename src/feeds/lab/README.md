# RSS/OPML Processing Lab

## Experiment Overview

This lab explores RSS feed processing and OPML subscription management as
foundational components for an AI-enhanced RSS reader engine. The experiment
investigates how to efficiently fetch, parse, organize, and process RSS feeds at
scale, with particular focus on supporting downstream AI analysis and user
personalization.

### Research Questions

- How can we efficiently process large collections of RSS feeds from OPML
  subscription files?
- What's the optimal data flow from OPML → RSS feeds → structured content for AI
  processing?
- How should we organize and store feed data to support AI-driven content
  analysis and user preferences?

## Lab Components

This experiment consists of three interconnected components that explore
different aspects of RSS/OPML processing:

### 1. RSS Client (`rss_client.ts`)

**Purpose**: Core RSS feed operations - fetching, parsing, and storage **Key
Exploration**: Functional programming approach to RSS processing with clean data
structures

### 2. OPML Parser/Client (`opml_parser.ts`, `opml_client.ts`)

**Purpose**: OPML subscription file processing and bulk feed operations **Key
Exploration**: Managing collections of RSS feeds with categorization and
filtering

### 3. OPML Feed Processor (`opml_feed_processor.ts`)

**Purpose**: Orchestration facade combining OPML and RSS processing **Key
Exploration**: Simplified workflow for processing complete feed collections

## Architecture Exploration

The experiment explores a layered architecture with clear separation of
concerns:

```
OPML File → Feed Sources → Individual Feeds → JSON Storage
     ↓            ↓              ↓              ↓
OPML Parser → RSS Client → Feed Content → AI Processing
```

### Data Flow

1. **OPML Processing**: Parse subscription files, extract feed metadata,
   organize by categories
2. **Feed Fetching**: Concurrent retrieval of RSS content with error handling
3. **Content Storage**: Structured JSON files for downstream AI processing
4. **User Organization**: User-specific directories supporting personalized
   processing

## Quick Start

### Basic RSS Feed Processing

```bash
# Fetch a single feed
deno run --allow-net --allow-write src/feeds/lab/rss_client.ts https://integralyogamagazine.org/feed

# Process all feeds from an OPML file
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts ./tmp/data/opml/subscriptions.opml

# Process specific category from OPML
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts ./tmp/data/opml/subscriptions.opml "Technology"
```

### Programmatic Usage

```typescript
import { fetchAndSaveRssFeed } from "./rss_client.ts";
import { processFeedsFromOpml } from "./opml_feed_processor.ts";

// Process a single feed
const feed = await fetchAndSaveRssFeed(
  { url: "https://austinkleon.com/feed" },
  { path: "./data/feed.json" },
);

// Process an entire OPML collection
const summary = await processFeedsFromOpml({
  opmlPath: "./tmp/data/opml/subscriptions.opml",
  outputDir: "./tmp/data/feeds/user1",
  categoryFilter: "Technology", // optional
  maxConcurrent: 3,
  timeout: 10000,
});

console.log(`Processed ${summary.successCount}/${summary.totalFeeds} feeds`);
```

## Core Concepts

### RSS Processing

RSS (Really Simple Syndication) feeds provide structured content from websites.
Our experiment focuses on:

- **Reliable Fetching**: Network resilience and error handling
- **Consistent Parsing**: Converting XML to structured JavaScript objects
- **Flexible Storage**: JSON format suitable for AI processing

### OPML Management

OPML (Outline Processor Markup Language) files store RSS subscription lists. Key
explorations:

- **Subscription Organization**: Category-based feed organization
- **Bulk Operations**: Efficient processing of large feed collections
- **Integration Patterns**: Connecting OPML metadata with RSS content

### Functional Design

The experiment emphasizes functional programming principles:

- **Pure Functions**: Predictable operations without side effects
- **Immutable Data**: Clear data transformations
- **Composable Operations**: Building complex workflows from simple functions

## Usage Examples

### Working with Individual Feeds

```typescript
import { fetchRssFeed, parseRssFeed, saveRssFeed } from "./rss_client.ts";

// Fetch and parse
const xml = await fetchRssFeed({ url: "https://example.com/feed" });
const feed = parseRssFeed(xml);

console.log(`Feed: ${feed.title}`);
console.log(`Items: ${feed.items.length}`);
console.log(`Latest: ${feed.items[0]?.title}`);

// Save for later processing
await saveRssFeed(feed, { path: "./data/example-feed.json" });
```

### Working with OPML Collections

```typescript
import { fetchFeedsFromOpml, loadOpmlFile } from "./opml_client.ts";
import { extractFeeds, getFeedsByCategory } from "./opml_parser.ts";

// Load and explore OPML structure
const opml = await loadOpmlFile({ path: "./subscriptions.opml" });
console.log(`OPML: ${opml.title}`);

// Extract all feeds
const allFeeds = extractFeeds(opml);
console.log(`Total feeds: ${allFeeds.length}`);

// Filter by category
const techFeeds = getFeedsByCategory(opml, "Technology");
console.log(`Tech feeds: ${techFeeds.length}`);

// Fetch with options
const results = await fetchFeedsFromOpml(
  { path: "./subscriptions.opml" },
  {
    categoryFilter: "Technology",
    maxConcurrent: 5,
    timeout: 15000,
  },
);

// Process results
const successful = results.filter((r) => r.feed);
const failed = results.filter((r) => r.error);
console.log(`Success: ${successful.length}, Failed: ${failed.length}`);
```

### Complete Workflow Processing

```typescript
import { processFeedsFromOpml } from "./opml_feed_processor.ts";

// Process all feeds with comprehensive options
const summary = await processFeedsFromOpml({
  opmlPath: "./tmp/data/opml/my-subscriptions.opml",
  outputDir: "./tmp/data/feeds/processed",
  categoryFilter: undefined, // process all categories
  maxConcurrent: 3,
  timeout: 10000,
});

// Analyze results
console.log(`\nProcessing Summary:`);
console.log(`Total feeds attempted: ${summary.totalFeeds}`);
console.log(`Successfully processed: ${summary.successCount}`);
console.log(`Failed to process: ${summary.failureCount}`);

// Examine individual results
summary.results.forEach((result) => {
  if (result.success) {
    console.log(`✓ ${result.source.title} → ${result.outputPath}`);
  } else {
    console.log(`✗ ${result.source.title}: ${result.message}`);
  }
});
```

## API Reference

### RSS Client Module

#### Core Functions

**`fetchRssFeed(options: FetchOptions): Promise<string>`**

- Fetches RSS feed XML from a URL
- Options: `{ url: string }`
- Returns: Raw XML content

**`parseRssFeed(xml: string): RssFeed`**

- Parses RSS XML into structured data
- Input: Raw RSS XML string
- Returns: `RssFeed` object with metadata and items

**`saveRssFeed(feed: RssFeed, options: SaveOptions): Promise<void>`**

- Saves RSS feed to JSON file
- Options: `{ path: string }`
- Creates directories as needed

**`fetchAndSaveRssFeed(fetchOptions: FetchOptions, saveOptions: SaveOptions): Promise<RssFeed>`**

- Complete workflow: fetch → parse → save
- Returns the parsed feed for further processing

#### Types

```typescript
interface RssFeed {
  title: string;
  description: string;
  link: string;
  items: RssItem[];
  lastUpdated?: Date;
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate?: Date;
  author?: string;
  categories?: string[];
}

interface FetchOptions {
  url: string;
}

interface SaveOptions {
  path: string;
}
```

### OPML Parser Module

#### Core Functions

**`parseOpml(xml: string): OpmlDocument`**

- Parses OPML XML into structured document
- Handles nested outlines and feed metadata

**`extractFeeds(document: OpmlDocument): FeedSource[]`**

- Extracts all feed sources from OPML document
- Flattens nested structure into feed list

**`getFeedsByCategory(document: OpmlDocument, categoryName: string): FeedSource[]`**

- Filters feeds by category name
- Supports nested category structures

**`generateOpml(document: OpmlDocument): string`**

- Converts structured data back to OPML XML
- Useful for exporting or backup

#### Types

```typescript
interface OpmlDocument {
  title: string;
  dateCreated?: Date;
  dateModified?: Date;
  outlines: OpmlOutline[];
}

interface OpmlOutline {
  text: string;
  type?: string;
  xmlUrl?: string; // RSS feed URL
  htmlUrl?: string; // Website URL
  title?: string;
  description?: string;
  outlines?: OpmlOutline[]; // Nested outlines
}

interface FeedSource {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  description?: string;
  category?: string;
}
```

### OPML Client Module

#### Core Functions

**`loadOpmlFile(options: OpmlLoadOptions): Promise<OpmlDocument>`**

- Loads and parses OPML file from disk
- Options: `{ path: string }`

**`fetchFeedsFromOpml(opmlOptions: OpmlLoadOptions, fetchOptions?: OpmlFetchOptions): Promise<FeedFetchResult[]>`**

- Fetches all RSS feeds defined in OPML file
- Supports concurrent fetching with limits
- Returns detailed results for each feed

**`fetchAndSaveFeedsFromOpml(opmlOptions: OpmlLoadOptions, fetchOptions?: OpmlFetchOptions, saveDir: string): Promise<FeedFetchResult[]>`**

- Complete workflow: load OPML → fetch feeds → save to directory
- Creates user-specific directory structure

#### Types

```typescript
interface OpmlLoadOptions {
  path: string;
}

interface OpmlFetchOptions {
  categoryFilter?: string;
  maxConcurrent?: number;
  timeout?: number;
}

interface FeedFetchResult {
  source: FeedSource;
  feed?: RssFeed;
  error?: string;
  fetchTime?: number;
}
```

### OPML Feed Processor Module

#### Core Functions

**`processFeedsFromOpml(options: ProcessOptions): Promise<ProcessSummary>`**

- Complete feed processing workflow
- Combines OPML parsing, RSS fetching, and file saving
- Provides comprehensive error handling and reporting

#### Types

```typescript
interface ProcessOptions {
  opmlPath: string;
  outputDir: string;
  categoryFilter?: string;
  maxConcurrent?: number;
  timeout?: number;
}

interface ProcessResult {
  source: FeedSource;
  success: boolean;
  message: string;
  outputPath?: string;
}

interface ProcessSummary {
  totalFeeds: number;
  successCount: number;
  failureCount: number;
  results: ProcessResult[];
}
```

## Key Findings

### Performance Insights

- **Concurrent Processing**: Optimal concurrent feed fetching is 3-5
  simultaneous requests
- **Error Resilience**: Individual feed failures shouldn't stop entire OPML
  processing
- **Timeout Management**: 10-15 second timeouts balance reliability with
  performance

### Data Structure Decisions

- **JSON Storage**: More flexible for AI processing than keeping XML
- **Flat Feed Arrays**: Easier to process than nested OPML structures
- **User Directories**: Essential for supporting multiple users/preference sets

### Integration Patterns

- **Functional Composition**: Small, focused functions compose well for complex
  workflows
- **Options Objects**: Provide flexibility without parameter explosion
- **Promise-based APIs**: Work well with Deno's async model

### Error Handling Strategies

- **Graceful Degradation**: Continue processing when individual feeds fail
- **Detailed Reporting**: Provide specific error information for debugging
- **Validation**: Parse and validate data at module boundaries

## Testing Strategy

The lab includes comprehensive testing at multiple levels:

```bash
# Run all lab tests
deno test src/feeds/lab/test/**/*_test.ts

# Run specific component tests
deno test src/feeds/lab/test/rss_client_test.ts
deno test src/feeds/lab/test/opml_parser_test.ts
deno test src/feeds/lab/test/opml_client_test.ts
```

### Test Categories

- **Unit Tests**: Individual function testing with mocks
- **Integration Tests**: Real network requests and file operations
- **End-to-End Tests**: Complete workflow validation

## Future Directions

### AI Integration Opportunities

This experiment has identified several extension points for AI enhancement:

1. **Content Enrichment**: After RSS parsing, extract full article content
2. **Intelligent Summarization**: Use Ollama for local content summarization
3. **Preference Learning**: Analyze user reading patterns for personalization
4. **Content Scoring**: Rate content relevance based on user preferences
5. **Topic Clustering**: Group related content across feeds

### Production Migration Path

When ready for production deployment:

1. **Core Abstractions**: Move proven patterns to `src/feeds/` production code
2. **Error Handling**: Enhance error handling for production reliability
3. **Performance Optimization**: Add caching and incremental updates
4. **Configuration Management**: Add proper configuration system
5. **Monitoring**: Add logging and metrics for production operations

### Technical Improvements

- **Incremental Updates**: Only fetch changed content
- **Feed Deduplication**: Handle duplicate feeds across OPML files
- **Content Normalization**: Standardize feed content format
- **Metadata Enrichment**: Add additional feed metadata
- **Subscription Management**: Track user subscriptions and preferences

## Running the Lab

### Prerequisites

- Deno runtime
- Network access for RSS fetching
- File system write permissions

### Development Workflow

```bash
# Install Deno (if needed)
curl -fsSL https://deno.land/install.sh | sh

# Run individual experiments
deno run --allow-net --allow-write src/feeds/lab/rss_client.ts
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_client.ts ./sample.opml

# Run tests
deno test --allow-net --allow-read --allow-write src/feeds/lab/test/

# Process feeds for AI development
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts ./my-feeds.opml
```

### Data Organization

The lab creates organized data structures suitable for AI processing:

```
tmp/data/
├── opml/                 # OPML subscription files
│   └── user-feeds.opml
└── feeds/                # Processed RSS feeds
    └── username/         # User-specific feeds
        ├── tech-blog.json
        ├── news-site.json
        └── personal-blog.json
```

This organization supports the planned AI-enhanced RSS reader by providing:

- Clean, structured feed data for AI analysis
- User-specific organization for personalization
- Consistent format for downstream processing
- Historical data for preference learning

## Conclusion

This lab successfully explores the foundational components needed for an
AI-enhanced RSS reader. The modular architecture, functional design patterns,
and comprehensive data processing capabilities provide a solid foundation for
the next phase of development: integrating AI-driven content analysis and user
personalization.

The experiment demonstrates that RSS/OPML processing can be both efficient and
flexible, setting up the ideal data flow for AI enhancement while maintaining
clean separation of concerns and testable code architecture.
