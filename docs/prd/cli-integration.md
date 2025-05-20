# Lens CLI Integration Specification

## 1. Introduction

This document provides the technical specification for the Lens CLI integration, which serves as the foundation for the Lens API. The CLI commands and their functionality are directly mapped to API endpoints, creating a consistent interface between the CLI and API layers. This design ensures that all features are first implemented and tested in the CLI, then exposed through the API with minimal additional work.

## 2. CLI to API Mapping Overview

The Lens system follows a "CLI-first" architecture where:

1. All core functionality is implemented as CLI commands
2. The API server acts as a facade that translates HTTP requests to CLI command invocations
3. CLI command outputs are transformed into standardized API responses
4. Error handling is consistent between CLI and API interfaces

This approach provides several benefits:
- Single source of truth for business logic
- Consistent behavior across interfaces
- Simplified testing (test the CLI, get API functionality for free)
- Reduced maintenance overhead

## 3. Command Mapping Structure

### 3.1 General Command Structure

CLI commands follow this general structure:

```
lens <command> <subcommand> [options] [arguments]
```

The API facade maps these to REST endpoints:

```
HTTP_METHOD /api/<command>/<subcommand>
```

### 3.2 Command to Endpoint Mapping

| CLI Command | API Endpoint | HTTP Method |
|-------------|--------------|-------------|
| `lens sources list` | `/api/sources` | GET |
| `lens sources get <id>` | `/api/sources/{id}` | GET |
| `lens sources add <url> [options]` | `/api/sources` | POST |
| `lens sources update <id> [options]` | `/api/sources/{id}` | PUT |
| `lens sources remove <id>` | `/api/sources/{id}` | DELETE |
| `lens fetch` | `/api/fetch` | POST |
| `lens fetch <sourceId>` | `/api/fetch/{sourceId}` | POST |
| `lens fetch schedule <sourceId> <frequency>` | `/api/fetch/schedule` | POST |
| `lens query "<query-text>"` | `/api/query` | POST |
| `lens list [options]` | `/api/content/recommended` | GET |
| `lens <contentType> [options]` | `/api/content/{contentType}` | GET |
| `lens preferences topics` | `/api/preferences/topics` | GET |
| `lens preferences topics set <topic> [options]` | `/api/preferences/topics` | POST |
| `lens feedback <id> <score>` | `/api/content/{id}/feedback` | POST |
| `lens mcp embeddings` | `/mcp/embeddings` | POST |
| `lens mcp analyze` | `/mcp/analyze` | POST |
| `lens mcp parse "<query-text>"` | `/mcp/parse` | POST |
| `lens mcp status` | `/mcp/status` | GET |

## 4. CLI Command Specifications

### 4.1 Feed Source Management

#### 4.1.1 List Feed Sources

```
lens sources list [--content-type=<type>]
```

**Options:**
- `--content-type=<type>`: Filter by content type (`video`, `article`, `mixed`)

**Output:**
```json
[
  {
    "id": "tech-blog",
    "url": "https://dev.to/feed/",
    "title": "DEV Community",
    "contentType": "article",
    "updateFrequency": 60,
    "lastFetched": 1620000000000,
    "reliability": 0.95,
    "userPreference": 0.8
  },
  ...
]
```

**API Mapping:**
- Endpoint: `GET /api/sources`
- Query Parameters: `contentType` maps to `--content-type`

#### 4.1.2 Get Feed Source

```
lens sources get <id>
```

**Arguments:**
- `id`: The ID of the feed source to retrieve

**Output:**
```json
{
  "id": "tech-blog",
  "url": "https://dev.to/feed/",
  "title": "DEV Community",
  "contentType": "article",
  "updateFrequency": 60,
  "lastFetched": 1620000000000,
  "reliability": 0.95,
  "userPreference": 0.8
}
```

**API Mapping:**
- Endpoint: `GET /api/sources/{id}`
- Path Parameters: `id` maps to CLI argument

#### 4.1.3 Add Feed Source

```
lens sources add <url> --type=<content-type> [--frequency=<minutes>]
```

**Arguments:**
- `url`: The URL of the RSS feed

**Options:**
- `--type=<content-type>`: Content type (`video`, `article`, `mixed`)
- `--frequency=<minutes>`: Update frequency in minutes (default: 60)

**Output:**
```json
{
  "id": "tech-blog",
  "url": "https://dev.to/feed/",
  "title": "DEV Community",
  "contentType": "article",
  "updateFrequency": 60,
  "lastFetched": null,
  "reliability": 1.0,
  "userPreference": 0.5
}
```

**API Mapping:**
- Endpoint: `POST /api/sources`
- Request Body:
  ```json
  {
    "url": "<url>",
    "contentType": "<content-type>",
    "updateFrequency": <frequency>
  }
  ```

#### 4.1.4 Update Feed Source

```
lens sources update <id> [--frequency=<minutes>] [--preference=<score>]
```

**Arguments:**
- `id`: The ID of the feed source to update

**Options:**
- `--frequency=<minutes>`: Update frequency in minutes
- `--preference=<score>`: User preference score (0-1)

**Output:**
```json
{
  "id": "tech-blog",
  "url": "https://dev.to/feed/",
  "title": "DEV Community",
  "contentType": "article",
  "updateFrequency": 120,
  "lastFetched": 1620000000000,
  "reliability": 0.95,
  "userPreference": 0.8
}
```

**API Mapping:**
- Endpoint: `PUT /api/sources/{id}`
- Request Body:
  ```json
  {
    "updateFrequency": <frequency>,
    "userPreference": <preference>
  }
  ```

#### 4.1.5 Remove Feed Source

```
lens sources remove <id>
```

**Arguments:**
- `id`: The ID of the feed source to remove

**Output:**
```
Feed source deleted successfully
```

**API Mapping:**
- Endpoint: `DELETE /api/sources/{id}`

### 4.2 Content Retrieval

#### 4.2.1 Fetch All Feeds

```
lens fetch
```

**Output:**
```
5 feeds updated, 27 new items
```

**API Mapping:**
- Endpoint: `POST /api/fetch`

#### 4.2.2 Fetch Specific Feed

```
lens fetch <sourceId>
```

**Arguments:**
- `sourceId`: The ID of the feed source to fetch

**Output:**
```
1 feed updated, 8 new items
```

**API Mapping:**
- Endpoint: `POST /api/fetch/{sourceId}`

#### 4.2.3 Schedule Automatic Fetching

```
lens fetch schedule <sourceId> <frequency>
```

**Arguments:**
- `sourceId`: The ID of the feed source to schedule
- `frequency`: Update frequency in minutes

**Output:**
```
Feed scheduled to update every 60 minutes
```

**API Mapping:**
- Endpoint: `POST /api/fetch/schedule`
- Request Body:
  ```json
  {
    "sourceId": "<sourceId>",
    "frequency": <frequency>
  }
  ```

### 4.3 Content Discovery

#### 4.3.1 Query Content

```
lens query "<query-text>" [--limit=<count>]
```

**Arguments:**
- `query-text`: Natural language query

**Options:**
- `--limit=<count>`: Maximum number of results to return (default: 10)

**Output:**
```
Query parsed as: recent articles about TypeScript

Results:
1. TypeScript 5.0 Features (92% relevant)
   Published: May 3, 2023
   https://example.com/typescript-5-features
   Topics: TypeScript, JavaScript, Programming
   
2. ...
```

**API Mapping:**
- Endpoint: `POST /api/query`
- Request Body:
  ```json
  {
    "query": "<query-text>",
    "limit": <limit>
  }
  ```

#### 4.3.2 List Recommended Content

```
lens list [--limit=<count>]
```

**Options:**
- `--limit=<count>`: Maximum number of results to return (default: 10)

**Output:**
```
Top recommended content:
1. Building with Deno (89% relevant)
   Video - 30 min - Tech Tutorials
   Published: May 4, 2023
   https://example.com/deno-tutorial
   Topics: Deno, JavaScript, TypeScript
   
2. ...
```

**API Mapping:**
- Endpoint: `GET /api/content/recommended`
- Query Parameters: `limit` maps to `--limit`

#### 4.3.3 Filter by Content Type

```
lens <contentType> [--topic=<topic>] [--limit=<count>]
```

**Arguments:**
- `contentType`: Type of content to filter by (`videos` or `articles`)

**Options:**
- `--topic=<topic>`: Filter by topic
- `--limit=<count>`: Maximum number of results to return (default: 10)

**Output:**
```
Videos about Deno:
1. Building with Deno (89% relevant)
   Video - 30 min - Tech Tutorials
   Published: May 4, 2023
   https://example.com/deno-tutorial
   Topics: Deno, JavaScript, TypeScript
   
2. ...
```

**API Mapping:**
- Endpoint: `GET /api/content/{contentType}`
- Path Parameters: `contentType` maps to CLI argument
- Query Parameters: `topic` maps to `--topic`, `limit` maps to `--limit`

### 4.4 User Preferences

#### 4.4.1 Get Topic Preferences

```
lens preferences topics
```

**Output:**
```
Topic Preferences:
- TypeScript: 
  - Videos: 70%
  - Articles: 90%
- Machine Learning:
  - Videos: 80%
  - Articles: 40%
...
```

**API Mapping:**
- Endpoint: `GET /api/preferences/topics`

#### 4.4.2 Update Topic Preference

```
lens preferences topics set <topic> --video=<score> --article=<score>
```

**Arguments:**
- `topic`: The topic to update

**Options:**
- `--video=<score>`: Preference score for videos (0-1)
- `--article=<score>`: Preference score for articles (0-1)

**Output:**
```
Topic preference updated:
- machine learning:
  - Videos: 80%
  - Articles: 40%
```

**API Mapping:**
- Endpoint: `POST /api/preferences/topics`
- Request Body:
  ```json
  {
    "topic": "<topic>",
    "videoPreference": <video-score>,
    "articlePreference": <article-score>
  }
  ```

#### 4.4.3 Record Content Feedback

```
lens feedback <id> <score>
```

**Arguments:**
- `id`: The ID of the content item
- `score`: Feedback score (1 for positive, -1 for negative)

**Output:**
```
Feedback recorded, preferences updated
```

**API Mapping:**
- Endpoint: `POST /api/content/{id}/feedback`
- Request Body:
  ```json
  {
    "score": <score>
  }
  ```

## 5. Implementation Guidelines

### 5.1 CLI Command Structure

Each CLI command should be implemented as a separate module with:
- Command definition (name, arguments, options)
- Business logic implementation
- Output formatting
- Error handling

### 5.2 API Facade Implementation

The API facade should:
1. Parse incoming HTTP requests
2. Map request parameters to CLI command arguments and options
3. Execute the corresponding CLI command
4. Transform CLI output to standardized API response format
5. Handle errors consistently

### 5.3 Error Handling

Errors should be handled consistently across CLI and API:
- CLI commands should use standardized error codes
- Error messages should be user-friendly
- The API facade should map CLI errors to appropriate HTTP status codes

### 5.4 Testing Strategy

1. Unit test CLI commands independently
2. Integration test CLI commands with actual data
3. Test API endpoints to verify correct mapping to CLI commands
4. End-to-end test complete workflows across both interfaces

## 6. Future Considerations

- **Interactive CLI Mode**: Add an interactive shell mode for the CLI
- **Batch Operations**: Support batch operations in both CLI and API
- **Streaming Responses**: Implement streaming for large result sets
- **WebSocket API**: Add real-time updates via WebSocket
- **CLI Plugins**: Support extensibility through plugins
