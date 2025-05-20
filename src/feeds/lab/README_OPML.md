# OPML Lab

This is an experimental OPML (Outline Processor Markup Language) processor for the Lens project. It provides functionality to parse OPML files, extract feed information, and integrate with the RSS client to fetch and process feeds defined in OPML files.

## Features

- Parse OPML files into structured data
- Extract feed information from OPML files
- Filter feeds by category
- Generate OPML from structured data
- Fetch RSS feeds defined in an OPML file
- Save fetched feeds to local JSON files
- Command-line interface for easy usage

## What is OPML?

OPML (Outline Processor Markup Language) is an XML format for outlines. In the context of RSS feeds, it's commonly used to exchange lists of feed subscriptions between feed readers. OPML files can organize feeds into categories and store metadata about each feed.

## Usage

### As a Command-Line Tool

```bash
# Fetch all feeds from an OPML file and save to ./tmp/data/feeds/
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_client.ts ./tmp/data/opml/paz.opml

# Fetch feeds from a specific category
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_client.ts ./tmp/data/opml/paz.opml "Technology"
```

The script will:

1. Load and parse the specified OPML file
2. Extract feed information, optionally filtering by category
3. Fetch the RSS content for each feed
4. Save each feed as a JSON file in the output directory

### As a Module

```typescript
import { 
  loadOpmlFile, 
  fetchFeedsFromOpml, 
  fetchAndSaveFeedsFromOpml 
} from "./opml_client.ts";

import {
  parseOpml,
  extractFeeds,
  getFeedsByCategory,
  generateOpml
} from "./opml_parser.ts";

// Load and parse an OPML file
const opmlDocument = await loadOpmlFile({ path: "./tmp/data/opml/paz.opml" });
console.log(`OPML title: ${opmlDocument.title}`);
console.log(`Number of top-level outlines: ${opmlDocument.outlines.length}`);

// Extract all feeds
const allFeeds = extractFeeds(opmlDocument);
console.log(`Total feeds: ${allFeeds.length}`);

// Get feeds from a specific category
const techFeeds = getFeedsByCategory(opmlDocument, "Technology");
console.log(`Technology feeds: ${techFeeds.length}`);

// Fetch feeds from the OPML file
const results = await fetchFeedsFromOpml(
  { path: "./tmp/data/opml/paz.opml" },
  { categoryFilter: "Technology", maxConcurrent: 3 }
);
console.log(`Successfully fetched: ${results.filter(r => r.feed).length}`);
console.log(`Failed: ${results.filter(r => r.error).length}`);

// Fetch and save feeds
await fetchAndSaveFeedsFromOpml(
  { path: "./tmp/data/opml/paz.opml" },
  { categoryFilter: "Technology" },
  "./tmp/data/feeds"
);

// Generate OPML from structured data
const newOpml = generateOpml(opmlDocument);
await Deno.writeTextFile("./tmp/data/opml/exported.opml", newOpml);
```

## API Reference

### OPML Parser Module

#### Types

- `OpmlDocument`: Represents an OPML document
- `OpmlOutline`: Represents an outline element in an OPML document
- `FeedSource`: Represents a feed source extracted from an OPML document

#### Functions

- `parseOpml(xml: string): OpmlDocument`: Parses an OPML XML string into an OpmlDocument object
- `extractFeeds(document: OpmlDocument): FeedSource[]`: Extracts feed sources from an OPML document
- `getFeedsByCategory(document: OpmlDocument, categoryName: string): FeedSource[]`: Gets feeds from a specific category
- `generateOpml(document: OpmlDocument): string`: Generates OPML XML from an OpmlDocument object

### OPML Client Module

#### Types

- `OpmlLoadOptions`: Options for loading an OPML file
- `OpmlFetchOptions`: Options for fetching feeds from an OPML file
- `FeedFetchResult`: Result of a feed fetch operation

#### Functions

- `loadOpmlFile(options: OpmlLoadOptions): Promise<OpmlDocument>`: Loads and parses an OPML file
- `fetchFeedsFromOpml(opmlOptions: OpmlLoadOptions, fetchOptions?: OpmlFetchOptions): Promise<FeedFetchResult[]>`: Fetches RSS feeds defined in an OPML file
- `fetchAndSaveFeedsFromOpml(opmlOptions: OpmlLoadOptions, fetchOptions?: OpmlFetchOptions, saveDir: string): Promise<FeedFetchResult[]>`: Fetches and saves RSS feeds defined in an OPML file

## Running Tests

```bash
# Run the OPML parser tests
deno test --allow-net --allow-read src/feeds/lab/test/opml_parser_test.ts

# Run the OPML client tests
deno test --allow-net --allow-read --allow-write src/feeds/lab/test/opml_client_test.ts
```

## Integration with RSS Client

The OPML client integrates with the existing RSS client to fetch and process feeds. It uses the RSS client's functions for fetching, parsing, and saving RSS feeds, while adding the ability to work with collections of feeds organized in OPML files.

## Future Enhancements

- Add support for OPML discovery (finding OPML files on websites)
- Implement subscription management (tracking which feeds the user is subscribed to)
- Add differential updates (updating only changed feeds when importing a new OPML file)
- Develop feed recommendations based on existing subscriptions
- Implement category-based content analysis
