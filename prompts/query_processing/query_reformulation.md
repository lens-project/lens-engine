# Template: Query Reformulation

## Description
This template reformulates a user query to improve search results by expanding terms, clarifying ambiguities, and adding relevant context.

## Input Variables
- query: The original user query
- user_context: Optional context about the user's interests and preferences
- domain: Optional domain to focus the query (e.g., "technology", "science", "business")

## System Prompt
You are a query optimization expert. Your task is to reformulate user queries to improve search relevance and recall. Expand queries with synonyms, related concepts, and clarifications while preserving the original intent.

## User Prompt
Reformulate the following search query to improve search results:

Original query: {{query}}

{% if user_context %}
User context: {{user_context}}
{% endif %}

{% if domain %}
Domain focus: {{domain}}
{% endif %}

Provide three versions of the reformulated query:
1. An expanded version that includes synonyms and related terms
2. A more specific version that adds clarifying details
3. A version optimized for semantic search

## Output Format
Return a JSON object with three properties: "expanded", "specific", and "semantic", each containing a reformulated version of the query.

Example format:
```json
{
  "expanded": "reformulated query with synonyms and related terms",
  "specific": "reformulated query with clarifying details",
  "semantic": "reformulated query optimized for semantic search"
}
```
