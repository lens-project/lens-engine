# Content Fetcher Lab

This is an experimental content fetcher for the Lens project. It provides
functionality to fetch, save, and process web content from URLs found in JSON
files using functional programming principles.

## Features

- Load and parse JSON files containing URLs
- Fetch HTML content from URLs
- Save content to local files
- Process content in batches with configurable concurrency
- Handle errors gracefully with detailed logging

## Usage

### As a Command-Line Tool

```bash
# Fetch content from the default JSON file (./tmp/data/austin_kleon.json) and save to ./tmp/data/fetched
deno run --allow-net --allow-read --allow-write src/retrieval/lab/content_fetcher.ts

# Fetch content from a specific JSON file and save to a specific directory
deno run --allow-net --allow-read --allow-write src/retrieval/lab/content_fetcher.ts ./path/to/data.json ./path/to/output/dir

# Specify concurrency (number of simultaneous downloads)
deno run --allow-net --allow-read --allow-write src/retrieval/lab/content_fetcher.ts ./path/to/data.json ./path/to/output/dir 5
```

The script will:

1. Load and parse the JSON file
2. Extract URLs from the JSON data
3. Fetch content from each URL
4. Save the content to the output directory
5. Report on successful and failed fetches

### As a Module

```typescript
import {
  fetchAllContent,
  fetchAndSaveContent,
  fetchContent,
  saveContent,
} from "./content_fetcher.ts";

// Fetch content from a URL
const html = await fetchContent({ url: "https://example.com/article" });
console.log(`Fetched ${html.length} bytes of HTML`);

// Save content to a file
await saveContent(html, { path: "./article.html" });

// Fetch and save in one step
const result = await fetchAndSaveContent(
  "https://example.com/article",
  "./output",
);
console.log(`Saved to: ${result.path}`);

// Process a whole JSON file
const results = await fetchAllContent({
  jsonPath: "./data.json",
  outputDir: "./output",
  concurrency: 3,
});
console.log(`Successfully fetched: ${results.filter((r) => r.success).length}`);
```

## API Reference

### Main Functions

- `fetchAllContent(options)`: Fetch all content from a JSON file
- `fetchAndSaveContent(url, outputDir, options)`: Fetch content from a URL and
  save it
- `fetchContent(options)`: Fetch content from a URL
- `saveContent(content, options)`: Save content to a file

### Helper Functions

- `loadJsonFile(jsonPath)`: Load and parse a JSON file
- `extractUrls(data)`: Extract URLs from parsed JSON data
- `processBatch(urls, outputDir, options)`: Process a batch of URLs with limited
  concurrency
- `createFilenameFromUrl(url)`: Create a filename from a URL
- `sanitizeFilename(filename)`: Sanitize a filename by removing invalid
  characters

## Testing

Run the tests with:

```bash
deno test --allow-net src/retrieval/lab/test/content_fetcher_test.ts
```

## Future Improvements

- Add support for different content types (not just HTML)
- Implement content processing and transformation
- Add support for authentication and cookies
- Implement rate limiting and respect robots.txt
- Add support for resuming interrupted downloads
