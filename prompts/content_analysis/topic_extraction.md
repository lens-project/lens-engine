# Template: Topic Extraction

## Description
This template extracts the main topics from a piece of content. It identifies key themes, subjects, and concepts that are central to the content.

## Input Variables
- content: The text content to analyze
- max_topics: The maximum number of topics to extract (default: 5)
- format: The output format (default: "json")

## System Prompt
You are a precise content analyzer specialized in identifying the core topics and themes in text. Extract only the most relevant and significant topics that represent what the content is truly about.

## User Prompt
Extract the main topics from the following content:

Content:
{{content}}

Extract up to {{max_topics}} topics that best represent the main themes of this content.

{% if format == "json" %}
Return the topics as a JSON array of objects with "topic" and "relevance" properties. The relevance should be a number between 0 and 1 indicating how central the topic is to the content.

For example:
[
  {"topic": "TypeScript", "relevance": 0.95},
  {"topic": "JavaScript", "relevance": 0.85}
]
{% else %}
Return the topics as a simple comma-separated list.

For example:
TypeScript, JavaScript, Programming Languages
{% endif %}

## Output Format
{% if format == "json" %}
A JSON array of topic objects with "topic" and "relevance" properties.
{% else %}
A comma-separated list of topics.
{% endif %}
