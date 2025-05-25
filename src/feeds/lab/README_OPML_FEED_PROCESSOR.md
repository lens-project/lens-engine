# OPML Feed Processor

This is a facade module that combines the OPML parser and RSS client to process
feeds from an OPML file. It reads an OPML file, fetches each feed using the RSS
client, and saves the feeds as individual JSON files in a user-specific
directory.

## Purpose

The OPML Feed Processor serves as a bridge between the OPML parser and RSS
client modules. It provides a simple way to:

1. Read an OPML file containing feed subscriptions
2. Process each feed in the file
3. Fetch the current content of each feed
4. Save each feed as a JSON file in a user-specific directory

This module is particularly useful for setting up a collection of feed data that
can be used by other modules, such as the retrieval lab, for further processing
and analysis.

## Usage

### As a Command-Line Tool

```bash
# Process all feeds from an OPML file and save to ./tmp/data/feeds/paz/
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts ./tmp/data/opml/paz.opml

# Process feeds from a specific category
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts ./tmp/data/opml/paz.opml "Technology"

# Process feeds and save to a different user directory
deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts ./tmp/data/opml/paz.opml "" "john"
```

The script will:

1. Read and parse the specified OPML file
2. Extract feed information, optionally filtering by category
3. Fetch the RSS content for each feed
4. Save each feed as a JSON file in the user-specific output directory

### As a Module

```typescript
import { processFeedsFromOpml } from "./opml_feed_processor.ts";

// Process all feeds from an OPML file
const summary = await processFeedsFromOpml({
  opmlPath: "./tmp/data/opml/paz.opml",
  outputDir: "./tmp/data/feeds/paz",
  maxConcurrent: 3,
  timeout: 10000,
});

console.log(`Total feeds: ${summary.totalFeeds}`);
console.log(`Successfully processed: ${summary.successCount}`);
console.log(`Failed: ${summary.failureCount}`);

// Process feeds from a specific category
const techSummary = await processFeedsFromOpml({
  opmlPath: "./tmp/data/opml/paz.opml",
  outputDir: "./tmp/data/feeds/paz",
  categoryFilter: "Technology",
  maxConcurrent: 3,
  timeout: 10000,
});

console.log(`Technology feeds: ${techSummary.totalFeeds}`);
```

## API Reference

### Types

- `ProcessOptions`: Options for processing feeds from an OPML file
  - `opmlPath`: Path to the OPML file
  - `outputDir`: Directory to save the feeds to
  - `categoryFilter?`: Optional category to filter feeds by
  - `maxConcurrent?`: Maximum number of concurrent feed fetches
  - `timeout?`: Timeout for each feed fetch in milliseconds

- `ProcessResult`: Result of processing a single feed
  - `source`: The feed source information
  - `success`: Whether the processing was successful
  - `message`: A message describing the result
  - `outputPath?`: Path to the saved feed file (if successful)

- `ProcessSummary`: Summary of the processing operation
  - `totalFeeds`: Total number of feeds processed
  - `successCount`: Number of feeds successfully processed
  - `failureCount`: Number of feeds that failed to process
  - `results`: Array of individual feed processing results

### Functions

- `processFeedsFromOpml(options: ProcessOptions): Promise<ProcessSummary>`:
  Processes feeds from an OPML file, fetching each feed and saving it as a JSON
  file

## Integration with Other Modules

The OPML Feed Processor integrates with:

1. **OPML Parser**: Used to parse the OPML file and extract feed information
2. **RSS Client**: Used to fetch and parse individual feeds

It serves as a facade that coordinates between these modules to provide a simple
interface for processing feeds from an OPML file.

## Output Format

Each feed is saved as a JSON file in the specified output directory. The
filename is derived from the feed title, sanitized to be safe for use as a
filename.

The JSON files contain the full feed content, including metadata and items, in
the format defined by the RSS client.

## Use Cases

1. **Initial Data Setup**: Quickly populate a data directory with feed content
   for testing and development
2. **Feed Synchronization**: Keep a local copy of feed content up to date
3. **Feed Collection**: Gather feeds from multiple sources into a single
   location
4. **Data Preparation**: Prepare feed data for use by other modules, such as the
   retrieval lab

## Future Enhancements

- Add support for incremental updates (only fetch feeds that have changed)
- Implement feed deduplication (avoid saving duplicate feeds)
- Add support for feed metadata enrichment (add additional metadata to feeds)
- Implement feed content normalization (standardize feed content format)
