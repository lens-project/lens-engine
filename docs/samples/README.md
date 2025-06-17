# Lens Sample Data

This directory contains a **replica of an actual working Lens Engine directory**. It provides authentic examples of the data structure and flow through the complete system, from OPML feed lists to processed and ranked content summaries.

**Purpose**: This replica allows developers to see the output without having to run the CLI, and enables UI developers to use the files in the `ranked/` folder to begin crafting UI solutions with real data structures.

## Directory Structure

```
samples/
├── opml/              # OPML feed subscription files
│   └── example.opml   # Sample OPML file with a few public feeds
├── feeds/             # RSS feed content in JSON format
│   └── austin_kleon.json  # Sample feed from Austin Kleon's blog
├── fetched/           # HTML content fetched from feed items
│   └── on-reading-novels.html  # Sample article HTML from Austin Kleon's blog
├── processed/         # Processed content (e.g., summaries)
│   └── on-reading-novels-summary.md  # AI-generated summary of the article
└── ranked/            # Final ranked content with scores and summaries
    ├── rankings.json  # JSON output with scored articles
    └── ranking-summary.md  # Markdown summary of ranked results
```

## Data Flow

The Lens system processes data through the following steps:

1. **OPML Parsing**: OPML files (like `example.opml`) are parsed to extract feed URLs.
2. **Feed Fetching**: RSS feeds are fetched and converted to JSON (like `austin_kleon.json`).
3. **Content Fetching**: HTML content from feed items is downloaded (like `on-reading-novels.html`).
4. **Content Processing**: HTML content is processed to create summaries (like `on-reading-novels-summary.md`).
5. **Content Ranking**: Processed content is scored and ranked using AI models (like `rankings.json` and `ranking-summary.md`).

## Using Sample Data

These samples can be used to:

1. **Understand the Data Structure**: See how data is organized and formatted at each stage of the complete pipeline.
2. **UI Development**: Use the pre-generated files (especially in `ranked/`) to build user interfaces without running the full CLI pipeline.
3. **Test Processing Components**: Use the samples to test individual components without setting up a full data environment.
4. **Develop New Features**: Build and test new features with consistent, authentic sample data.
5. **Reference Implementation**: See expected input/output formats for each component in the system.

**Note**: Since this is a replica of an actual working directory, all data structures and formats represent real-world usage of the Lens Engine system.