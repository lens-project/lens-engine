# Lens: Content-Aware Feed Aggregator

## Overview

Lens is a next-generation feed aggregator that uses local AI models to intelligently filter, rank, and recommend content from RSS feeds based on user interests. The system distinguishes between different content types (particularly video vs. article content) and uses specialized processing paths for each, learning user preferences for topics and content formats over time.

## Key Features

- **Content-Type Awareness**: Specialized processing for videos and articles
- **Local AI Processing**: Uses Ollama for privacy-preserving content analysis
- **Natural Language Queries**: Ask for content in plain English
- **Personalized Recommendations**: Learns your preferences over time
- **Command-Line Interface**: Fast, efficient content discovery
- **Functional Programming**: Built with functional programming principles for clarity and maintainability

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) runtime
- [Ollama](https://ollama.ai/) for local AI models
- Recommended models:
  - An embedding model (e.g., nomic-embed-text)
  - A general-purpose LLM (e.g., llama2 or mistral)

### Installation

```bash
# Clone the repository
git clone https://github.com/mpazaryna/lens.git
cd lens

# Update environment variables in .env file
cp .env.example .env

# Optional: Use sample data for development
# Set LENS_DATA_DIR in .env to point to the samples directory:
# LENS_DATA_DIR=/path/to/lens/docs/samples

# Run the tests
deno task test
```

## Sample Data

The project includes sample data in the `docs/samples/` directory that demonstrates the complete data flow through the Lens system. This sample data serves multiple purposes:

- **Documentation**: Illustrates how data is structured and transformed at each stage of processing
- **Development**: Provides real-world examples for testing and developing new features
- **Onboarding**: Helps new developers understand the system without setting up their own data environment
- **Reference**: Shows expected input/output formats for each component

The sample data includes:

- **OPML Files**: Feed subscription lists in OPML format (`docs/samples/opml/`)
- **RSS Feeds**: Parsed feed content in JSON format (`docs/samples/feeds/`)
- **Fetched Content**: HTML content from feed items (`docs/samples/fetched/`)
- **Processed Content**: AI-generated summaries and metadata (`docs/samples/processed/`)

The samples feature real, accessible content from Austin Kleon's blog, allowing developers to see the complete journey from feed subscription to processed content with actual working endpoints.

For detailed information on the sample data structure and how to use it in development, see the [Sample Data Guide](docs/samples/README.md).

To run the sample script to initialize the sample data, run the following command from the scripts directory:

```bash
cd scripts
setup-example.sh
```

## Architecture

Lens uses a modular architecture with specialized processing paths for different content types:

```mermaid
flowchart TD
    A[RSS Source Registry] --> B[Retrieval Engine]
    B --> C[Video Content Path]
    B --> D[Article Content Path]
    C --> E[Video Processor]
    D --> F[Article Processor]
    E --> G[Video Embeddings]
    F --> H[Article Embeddings]
    G --> I[Vector Database]
    H --> I
    I --> J[Query Engine]
    J --> K[User Interface]
```

## Development Status

Lens is currently in active development. See the [project roadmap](docs/prd/roadmap.md) for more details on upcoming features and milestones.

## Contributing

Contributions are welcome! Please see our [contributing guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Deno](https://deno.land/)
- AI capabilities powered by [Ollama](https://ollama.ai/)
- Inspired by traditional RSS readers and modern AI assistants