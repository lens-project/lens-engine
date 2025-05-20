# Lens User Stories

This document outlines user stories in Gherkin syntax for the Lens content-aware feed aggregator, covering both the API server and Model Context Protocol server functionalities.

## RSS Source Management

### Adding New Feed Sources

```gherkin
Feature: Add RSS Feed Sources
  As a user
  I want to add new RSS feed sources to my aggregator
  So that I can discover content from various channels

  Scenario: Add a video feed source
    Given I am using the Lens CLI
    When I run the command "add https://www.youtube.com/feeds/videos.xml?channel_id=UC8butISFwT-Wl7EV0hUK0BQ --type=video"
    Then the system should add the feed to my source registry
    And tag it as a "video" content type
    And confirm with "Feed source added successfully"

  Scenario: Add an article feed source
    Given I am using the Lens CLI
    When I run the command "add https://css-tricks.com/feed/ --type=article"
    Then the system should add the feed to my source registry
    And tag it as an "article" content type
    And confirm with "Feed source added successfully"

  Scenario: Add a feed source via API
    Given I am using an external application
    When I send a POST request to "/api/sources" with:
      """
      {
        "url": "https://dev.to/feed/",
        "contentType": "article"
      }
      """
    Then the API should respond with status code 201
    And return the created source object with an ID
```

## Content Retrieval

### Fetching and Processing Content

```gherkin
Feature: Fetch Content from Sources
  As a user
  I want the system to retrieve and process content from my feeds
  So that I can discover new relevant content

  Scenario: Fetch all feeds
    Given I have 5 configured feed sources
    When I run the command "fetch"
    Then the system should retrieve content from all sources
    And process each item according to its content type
    And store the processed items in the database
    And display a summary of "5 feeds updated, 27 new items"

  Scenario: Fetch specific feed
    Given I have a feed with ID "tech-blog"
    When I run the command "fetch tech-blog"
    Then the system should retrieve content only from that source
    And process the items according to their content type
    And display a summary of "1 feed updated, 8 new items"

  Scenario: Schedule automatic fetching via API
    Given I am using an external application
    When I send a POST request to "/api/fetch/schedule" with:
      """
      {
        "sourceId": "tech-blog",
        "frequency": 60
      }
      """
    Then the API should respond with status code 200
    And the feed should be scheduled to update every 60 minutes
```

## Content Discovery

### Querying and Filtering Content

```gherkin
Feature: Discover Relevant Content
  As a user
  I want to query and filter my content
  So that I can find the most relevant items for my interests

  Scenario: List top recommended content
    Given I have content in my database
    When I run the command "list"
    Then the system should display the top 10 most relevant items
    And show a mix of video and article content based on my preferences
    And include relevance scores for each item

  Scenario: Filter by content type
    Given I have content in my database
    When I run the command "videos"
    Then the system should display only video content
    And rank items by relevance to my interests

  Scenario: Natural language query
    Given I have content in my database
    When I run the command "query 'what tech videos came in this week'"
    Then the system should parse my natural language query
    And identify the time frame as "this week"
    And identify the topic as "tech"
    And identify the content type as "videos"
    And display matching content ranked by relevance

  Scenario: Query via API
    Given I am using an external application
    When I send a POST request to "/api/query" with:
      """
      {
        "query": "recent articles about TypeScript",
        "limit": 5
      }
      """
    Then the API should respond with status code 200
    And return a JSON array of 5 relevant article items about TypeScript
```

## Model Context Protocol Server

### AI Model Operations

```gherkin
Feature: AI Model Integration
  As a system component
  I want to interact with local AI models via the Model Context Protocol
  So that I can process and analyze content intelligently

  Scenario: Generate embeddings for content
    Given I have a new article item
    When the system processes the item
    Then the Model Context Protocol server should:
      | Connect to Ollama with the embedding model
      | Generate vector embeddings for the article text
      | Return the embeddings to be stored with the content item

  Scenario: Analyze content topics
    Given I have a new video item with transcript
    When the system needs to identify topics
    Then the Model Context Protocol server should:
      | Send the transcript to the LLM with the content analysis prompt
      | Extract the main topics from the response
      | Return the topics to be associated with the content item

  Scenario: Parse natural language query
    Given a user submits a natural language query
    When the query engine processes the request
    Then the Model Context Protocol server should:
      | Send the query to the LLM with the query understanding prompt
      | Extract time frame, topics, content type preferences
      | Return the structured query parameters for database search

  Scenario: External AI service integration
    Given an external application needs AI processing
    When it sends a POST request to "/mcp/analyze" with content data
    Then the Model Context Protocol server should:
      | Process the content using the appropriate model
      | Return the analysis results in structured format
      | Include confidence scores for the analysis
```

## User Preference Learning

```gherkin
Feature: Learn from User Behavior
  As a user
  I want the system to learn from my interactions
  So that recommendations improve over time

  Scenario: Track content interaction
    Given I have viewed a content item with ID "article-123"
    When I run the command "feedback article-123 --score=1"
    Then the system should record my positive feedback
    And update my topic preferences based on the item's topics
    And confirm with "Feedback recorded, preferences updated"

  Scenario: Adjust content type preferences
    Given I consistently engage more with videos about "TypeScript"
    When the system analyzes my interaction patterns
    Then it should increase my video preference for the "TypeScript" topic
    And future recommendations should prioritize videos for this topic

  Scenario: Update preferences via API
    Given I am using an external application
    When I send a POST request to "/api/preferences/topics" with:
      """
      {
        "topic": "machine learning",
        "videoPreference": 0.8,
        "articlePreference": 0.4
      }
      """
    Then the API should respond with status code 200
    And my topic preferences should be updated accordingly
```

## System Administration

```gherkin
Feature: Manage System Configuration
  As a system administrator
  I want to configure and monitor the Lens system
  So that it operates efficiently and reliably

  Scenario: Configure Ollama models
    Given I have Ollama installed
    When I run the command "configure models"
    Then the system should check for required models
    And download any missing models
    And confirm with "All required models are configured"

  Scenario: Monitor system performance
    Given the system has been running for a week
    When I run the command "stats"
    Then the system should display:
      | Total content items processed
      | Average processing time per item
      | Database size and performance metrics
      | Model inference statistics

  Scenario: Backup user data
    Given I want to preserve my configuration
    When I run the command "backup user-data.json"
    Then the system should export:
      | My feed sources
      | Topic preferences
      | Interaction history
      | System configuration
    And save to the specified file
```
