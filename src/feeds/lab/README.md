# RSS Client Lab

This is an experimental RSS feed client for the Lens project. It provides
functionality to fetch, parse, and save RSS feeds using functional programming
principles.

## Features

- Fetch RSS feeds from any URL
- Parse RSS feed content into structured data
- Save RSS feed content to local JSON files
- Command-line interface for easy usage

## Usage

### As a Command-Line Tool

```bash
# Fetch the default feed (austinkleon.com/feed) and save to ./data/{feed_title}.json
deno run --allow-net --allow-write src/feeds/lab/rss_client.ts

# Fetch a specific feed and save to ./data/{feed_title}.json
deno run --allow-net --allow-write src/feeds/lab/rss_client.ts https://example.com/feed
```

The script will:

1. Create a `data` directory in the project root if it doesn't exist
2. Fetch the RSS feed from the provided URL (or default to austinkleon.com/feed)
3. Extract the feed title and use it to create a sanitized filename
4. Save the feed content as JSON in the data directory

### As a Module

```typescript
import {
  fetchAndSaveRssFeed,
  fetchRssFeed,
  parseRssFeed,
  saveRssFeed,
} from "./rss_client.ts";

// Fetch and parse an RSS feed
const xml = await fetchRssFeed({ url: "https://austinkleon.com/feed" });
const feed = parseRssFeed(xml);
console.log(`Feed title: ${feed.title}`);
console.log(`Number of items: ${feed.items.length}`);

// Save the feed to a file
await saveRssFeed(feed, { path: "./feed.json" });

// Or do everything in one step
const feed = await fetchAndSaveRssFeed(
  { url: "https://austinkleon.com/feed" },
  { path: "./feed.json" },
);
```

## Running Tests

```bash
# Run the RSS client tests
deno test --allow-net src/feeds/lab/test/rss_client_test.ts
```

## API Reference

### Types

- `RssItem`: Represents an item in an RSS feed
- `RssFeed`: Represents an RSS feed with metadata and items
- `FetchOptions`: Options for fetching an RSS feed
- `SaveOptions`: Options for saving an RSS feed

### Functions

- `fetchRssFeed(options: FetchOptions): Promise<string>`: Fetches an RSS feed
  from a URL
- `parseRssFeed(xml: string): RssFeed`: Parses RSS XML into a structured object
- `saveRssFeed(feed: RssFeed, options: SaveOptions): Promise<void>`: Saves an
  RSS feed to a file
- `fetchAndSaveRssFeed(fetchOptions: FetchOptions, saveOptions: SaveOptions): Promise<RssFeed>`:
  Combines fetching, parsing, and saving in one operation
- `ensureDir(dir: string): Promise<void>`: Ensures a directory exists, creating
  it if necessary
- `sanitizeFilename(name: string): string`: Sanitizes a string for use as a
  filename
