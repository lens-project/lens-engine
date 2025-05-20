# Lens Sample Data

This directory contains sample data for the Lens project. It provides examples of the data structure and flow through the system, from OPML feed lists to processed content summaries.

## Directory Structure

```
samples/
├── opml/              # OPML feed subscription files
│   └── example.opml   # Sample OPML file with a few public feeds
├── feeds/             # RSS feed content in JSON format
│   └── austin_kleon.json  # Sample feed from Austin Kleon's blog
├── fetched/           # HTML content fetched from feed items
│   └── on-reading-novels.html  # Sample article HTML from Austin Kleon's blog
└── processed/         # Processed content (e.g., summaries)
    └── on-reading-novels-summary.md  # AI-generated summary of the article
```

## Data Flow

The Lens system processes data through the following steps:

1. **OPML Parsing**: OPML files (like `example.opml`) are parsed to extract feed URLs.
2. **Feed Fetching**: RSS feeds are fetched and converted to JSON (like `austin_kleon.json`).
3. **Content Fetching**: HTML content from feed items is downloaded (like `on-reading-novels.html`).
4. **Content Processing**: HTML content is processed to create summaries (like `on-reading-novels-summary.md`).

## Using Sample Data

These samples can be used to:

1. **Understand the Data Structure**: See how data is organized and formatted at each stage.
2. **Test Processing Components**: Use the samples to test individual components without setting up a full data environment.
3. **Develop New Features**: Build and test new features with consistent sample data.

## Setting Up Your Own Data

To set up your own data directory:

1. Copy the `.env.example` file to `.env` and set `LENS_DATA_DIR` to your preferred location.
2. Create the following subdirectories in your data directory:
   - `opml/` - For OPML subscription files
   - `feeds/` - For RSS feed JSON files
   - `fetched/` - For downloaded HTML content
   - `processed/` - For processed content and summaries
3. Run the OPML processor to populate your feeds directory:
   ```bash
   deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts path/to/your/opml/file.opml
   ```
4. Run the content fetcher to download HTML content:
   ```bash
   deno run --allow-net --allow-read --allow-write src/retrieval/lab/content_fetcher.ts
   ```
5. Run the HTML summarizer to process the content:
   ```bash
   deno run --allow-net --allow-read --allow-write src/processors/lab/html_summarizer.ts
   ```

## Sample Data Sources

The sample data includes:

- **Austin Kleon's Blog**: A real-world example of a blog feed and article.
- **Other Public Feeds**: The OPML file includes references to other public feeds that can be used for testing.

All sample data is from publicly available sources and is included for educational and development purposes only.
