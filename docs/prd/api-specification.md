# Lens API Specification

## 1. Introduction

This document provides the technical specification for the Lens API, which enables external applications to interact with the Lens content-aware feed aggregator. The API is designed to support all core functionalities of the Lens system, including feed source management, content retrieval, content discovery, and user preference management.

## 2. API Overview

The Lens API consists of two primary interfaces:

1. **REST API**: HTTP-based API for general system interaction
2. **Model Context Protocol (MCP) API**: Specialized API for AI model operations

### 2.1 Base URLs

- REST API: `http://localhost:8000/api`
- MCP API: `http://localhost:8000/mcp`

### 2.2 Authentication

The API uses API key authentication for all endpoints. The API key should be included in the `Authorization` header:

```
Authorization: Bearer <api_key>
```

### 2.3 Response Format

All API responses are returned in JSON format with the following structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

In case of an error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## 3. REST API Endpoints

### 3.1 Feed Source Management

#### 3.1.1 List Feed Sources

```
GET /api/sources
```

**Query Parameters:**
- `contentType` (optional): Filter by content type (`video`, `article`, `mixed`)

**Response:**
```json
{
  "success": true,
  "data": [
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
  ],
  "error": null
}
```

#### 3.1.2 Get Feed Source

```
GET /api/sources/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tech-blog",
    "url": "https://dev.to/feed/",
    "title": "DEV Community",
    "contentType": "article",
    "updateFrequency": 60,
    "lastFetched": 1620000000000,
    "reliability": 0.95,
    "userPreference": 0.8
  },
  "error": null
}
```

#### 3.1.3 Add Feed Source

```
POST /api/sources
```

**Request Body:**
```json
{
  "url": "https://dev.to/feed/",
  "contentType": "article",
  "updateFrequency": 60
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tech-blog",
    "url": "https://dev.to/feed/",
    "title": "DEV Community",
    "contentType": "article",
    "updateFrequency": 60,
    "lastFetched": null,
    "reliability": 1.0,
    "userPreference": 0.5
  },
  "error": null
}
```

#### 3.1.4 Update Feed Source

```
PUT /api/sources/{id}
```

**Request Body:**
```json
{
  "updateFrequency": 120,
  "userPreference": 0.8
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tech-blog",
    "url": "https://dev.to/feed/",
    "title": "DEV Community",
    "contentType": "article",
    "updateFrequency": 120,
    "lastFetched": 1620000000000,
    "reliability": 0.95,
    "userPreference": 0.8
  },
  "error": null
}
```

#### 3.1.5 Delete Feed Source

```
DELETE /api/sources/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Feed source deleted successfully"
  },
  "error": null
}
```

### 3.2 Content Retrieval

#### 3.2.1 Fetch All Feeds

```
POST /api/fetch
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedsUpdated": 5,
    "newItems": 27
  },
  "error": null
}
```

#### 3.2.2 Fetch Specific Feed

```
POST /api/fetch/{sourceId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedsUpdated": 1,
    "newItems": 8
  },
  "error": null
}
```

#### 3.2.3 Schedule Automatic Fetching

```
POST /api/fetch/schedule
```

**Request Body:**
```json
{
  "sourceId": "tech-blog",
  "frequency": 60
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Feed scheduled to update every 60 minutes"
  },
  "error": null
}
```

### 3.3 Content Discovery

#### 3.3.1 Query Content

```
POST /api/query
```

**Request Body:**
```json
{
  "query": "recent articles about TypeScript",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "article-123",
        "title": "TypeScript 5.0 Features",
        "description": "Exploring the new features in TypeScript 5.0",
        "contentType": "article",
        "url": "https://example.com/typescript-5-features",
        "publishDate": 1620000000000,
        "relevanceScore": 0.92,
        "topics": ["TypeScript", "JavaScript", "Programming"],
        "articleMetadata": {
          "wordCount": 1200,
          "readingTime": 6,
          "author": "Jane Developer"
        }
      },
      ...
    ],
    "query": {
      "parsed": {
        "timeFrame": "recent",
        "topics": ["TypeScript"],
        "contentType": "article"
      }
    }
  },
  "error": null
}
```

#### 3.3.2 List Recommended Content

```
GET /api/content/recommended
```

**Query Parameters:**
- `limit` (optional): Number of items to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "video-456",
        "title": "Building with Deno",
        "description": "Learn how to build applications with Deno",
        "contentType": "video",
        "url": "https://example.com/deno-tutorial",
        "publishDate": 1620100000000,
        "relevanceScore": 0.89,
        "topics": ["Deno", "JavaScript", "TypeScript"],
        "videoMetadata": {
          "duration": 1800,
          "channel": "Tech Tutorials",
          "thumbnail": "https://example.com/thumbnail.jpg"
        }
      },
      ...
    ]
  },
  "error": null
}
```

#### 3.3.3 Filter by Content Type

```
GET /api/content/{contentType}
```

**Path Parameters:**
- `contentType`: Type of content to filter by (`video` or `article`)

**Query Parameters:**
- `topic` (optional): Filter by topic
- `limit` (optional): Number of items to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "video-456",
        "title": "Building with Deno",
        "description": "Learn how to build applications with Deno",
        "contentType": "video",
        "url": "https://example.com/deno-tutorial",
        "publishDate": 1620100000000,
        "relevanceScore": 0.89,
        "topics": ["Deno", "JavaScript", "TypeScript"],
        "videoMetadata": {
          "duration": 1800,
          "channel": "Tech Tutorials",
          "thumbnail": "https://example.com/thumbnail.jpg"
        }
      },
      ...
    ]
  },
  "error": null
}
```

### 3.4 User Preferences

#### 3.4.1 Get Topic Preferences

```
GET /api/preferences/topics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "topic": "TypeScript",
        "videoPreference": 0.7,
        "articlePreference": 0.9
      },
      {
        "topic": "Machine Learning",
        "videoPreference": 0.8,
        "articlePreference": 0.4
      },
      ...
    ]
  },
  "error": null
}
```

#### 3.4.2 Update Topic Preference

```
POST /api/preferences/topics
```

**Request Body:**
```json
{
  "topic": "machine learning",
  "videoPreference": 0.8,
  "articlePreference": 0.4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "machine learning",
    "videoPreference": 0.8,
    "articlePreference": 0.4
  },
  "error": null
}
```

#### 3.4.3 Record Content Feedback

```
POST /api/content/{id}/feedback
```

**Request Body:**
```json
{
  "score": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Feedback recorded, preferences updated"
  },
  "error": null
}
```

## 4. Model Context Protocol API

### 4.1 Generate Embeddings

```
POST /mcp/embeddings
```

**Request Body:**
```json
{
  "text": "This is the content to generate embeddings for",
  "model": "nomic-embed-text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "embedding": [0.1, 0.2, 0.3, ...],
    "dimensions": 768
  },
  "error": null
}
```

### 4.2 Analyze Content

```
POST /mcp/analyze
```

**Request Body:**
```json
{
  "title": "Introduction to TypeScript",
  "description": "Learn the basics of TypeScript and how it improves JavaScript development",
  "contentType": "article",
  "text": "TypeScript is a strongly typed programming language that builds on JavaScript...",
  "userInterests": ["JavaScript", "Programming", "Web Development"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topics": ["TypeScript", "JavaScript", "Programming", "Web Development"],
    "relevanceScore": 0.85,
    "rationale": "Directly addresses user's JavaScript interest with practical programming content",
    "confidence": 0.92
  },
  "error": null
}
```

### 4.3 Parse Natural Language Query

```
POST /mcp/parse
```

**Request Body:**
```json
{
  "query": "what tech videos came in this week"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timeFrame": "this week",
    "topics": ["tech"],
    "contentType": "videos",
    "sources": [],
    "qualifiers": []
  },
  "error": null
}
```

### 4.4 Check Model Status

```
GET /mcp/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "nomic-embed-text",
        "status": "available",
        "version": "1.0.0"
      },
      {
        "name": "llama2",
        "status": "available",
        "version": "7B"
      }
    ],
    "ollamaStatus": "connected"
  },
  "error": null
}
```

## 5. Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | The request was malformed or contained invalid parameters |
| `SOURCE_NOT_FOUND` | The specified feed source was not found |
| `CONTENT_NOT_FOUND` | The specified content item was not found |
| `FETCH_ERROR` | An error occurred while fetching feed content |
| `MODEL_ERROR` | An error occurred during model inference |
| `MODEL_NOT_AVAILABLE` | The requested model is not available |
| `UNAUTHORIZED` | Authentication failed or insufficient permissions |
| `SERVER_ERROR` | An unexpected server error occurred |

## 6. API Versioning

The API version is included in the URL path. The current version is v1:

```
http://localhost:8000/api/v1/sources
```

Future versions will be accessible at:

```
http://localhost:8000/api/v2/sources
```

## 7. Rate Limiting

The API implements rate limiting to prevent abuse. Limits are as follows:

- 100 requests per minute for standard endpoints
- 20 requests per minute for model inference endpoints

Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000060
```
