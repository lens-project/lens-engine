# LLM Template System

## 1. Introduction

This document outlines the design and implementation of the template system for LLM (Large Language Model) interactions in the Lens project. The template system uses external markdown files to define prompts and interactions with language models, separating prompt engineering from application logic.

## 2. System Overview

The LLM Template System provides a structured approach to managing, rendering, and using prompts for all AI model interactions in the Lens application. By externalizing prompts as markdown templates, the system enables better maintainability, version control, and specialization of prompt engineering separate from code development.

## 3. Design Goals

### 3.1 Primary Goals

1. **Separation of Concerns**: Separate prompt engineering from application logic
2. **Maintainability**: Allow prompt updates without code changes
3. **Reusability**: Enable sharing of prompt patterns across the application
4. **Testability**: Facilitate independent testing of prompts
5. **Documentation**: Self-document LLM interactions

### 3.2 Secondary Goals

1. **Version Control**: Track prompt evolution over time
2. **Experimentation**: Support A/B testing of different prompt strategies
3. **Specialization**: Allow prompt engineers to work independently from developers
4. **Transparency**: Make AI interactions visible and auditable

## 4. Template Structure

### 4.1 Directory Organization

Templates are organized in a hierarchical directory structure:

```
templates/
├── llm/
│   ├── content_analysis/
│   │   ├── topic_extraction.md
│   │   ├── relevance_scoring.md
│   │   └── content_summary.md
│   ├── query_processing/
│   │   ├── query_parsing.md
│   │   └── search_reformulation.md
│   └── user_preferences/
│       ├── preference_learning.md
│       └── recommendation_explanation.md
```

### 4.2 Template Format

Each template follows a standardized markdown format:

```markdown
# Template: [Template Name]

## Description
[Brief description of the template's purpose]

## Input Variables
- [variable_name]: [Description of the variable]
- [variable_name]: [Description of the variable]

## System Prompt
[System prompt that sets the context for the LLM]

## User Prompt
[Main prompt template with variable placeholders]

## Output Format
[Expected format of the LLM response]
```

### 4.3 Variable Placeholders

Templates use double curly braces for variable substitution:

```
{{variable_name}}
```

### 4.4 Conditional Logic

Templates support basic conditional logic:

```
{% if condition %}
  Content to include if condition is true
{% else %}
  Content to include if condition is false
{% endif %}
```

## 5. Template Engine

### 5.1 Core Components

The template engine consists of these functional components:

1. **Template Loader**: Loads template files from the filesystem
2. **Template Processor**: Processes conditional logic in templates
3. **Template Renderer**: Substitutes variables into templates
4. **LLM Caller**: Sends rendered templates to the LLM and processes responses

### 5.2 Functional Interface

```typescript
interface TemplateEngine {
  // Load a template by path
  loadTemplate(path: string): Promise<string>;
  
  // Process a template with variables
  processTemplate(template: string, variables: Record<string, unknown>): string;
  
  // Render a processed template by substituting variables
  renderTemplate(processed: string, variables: Record<string, unknown>): string;
  
  // Call LLM with a rendered template
  callLLM(rendered: string, options: LLMOptions): Promise<LLMResponse>;
  
  // Combined operation: load, process, render, and call
  callLLMWithTemplate(
    path: string, 
    variables: Record<string, unknown>, 
    options: LLMOptions
  ): Promise<LLMResponse>;
}
```

## 6. Template Categories

### 6.1 Content Analysis Templates

Templates for analyzing and processing content items:

- **Topic Extraction**: Extract main topics from content
- **Relevance Scoring**: Assess content relevance to user interests
- **Content Summarization**: Generate concise summaries
- **Content Classification**: Categorize content by type and subject

### 6.2 Query Processing Templates

Templates for handling user queries:

- **Query Parsing**: Extract intent and parameters from natural language
- **Query Reformulation**: Rewrite queries for better search results
- **Query Expansion**: Add related terms to improve recall

### 6.3 User Interaction Templates

Templates for user-facing interactions:

- **Recommendation Explanation**: Explain why content was recommended
- **Preference Learning**: Extract preferences from user feedback
- **Content Presentation**: Format content for display

## 7. Integration with System Components

### 7.1 Model Context Protocol Server

The template system integrates with the MCP Server to:

- Provide standardized prompts for all model operations
- Ensure consistent formatting of requests and responses
- Enable version control of model interactions

### 7.2 Content Processors

Content processors use templates for:

- Extracting metadata from content
- Generating embeddings with consistent context
- Scoring content relevance

### 7.3 Query Engine

The query engine uses templates for:

- Parsing natural language queries
- Reformulating queries for vector search
- Ranking and explaining search results

## 8. Template Development Workflow

### 8.1 Creation Process

1. **Identify Need**: Determine where an LLM interaction is required
2. **Draft Template**: Create initial template with variables
3. **Test**: Test with sample inputs and review outputs
4. **Refine**: Iterate on the template based on test results
5. **Document**: Add comprehensive documentation
6. **Review**: Have prompt engineering experts review
7. **Integrate**: Add to the template library

### 8.2 Testing Strategy

Templates are tested through:

1. **Unit Tests**: Verify template rendering with mock data
2. **Integration Tests**: Test LLM responses with rendered templates
3. **Regression Tests**: Ensure template changes don't break existing functionality
4. **Performance Tests**: Measure token usage and response times

### 8.3 Version Control

Templates follow a versioning strategy:

1. **Naming Convention**: Include version in filename (e.g., `topic_extraction_v2.md`)
2. **Change Documentation**: Document changes between versions
3. **Compatibility**: Maintain backward compatibility when possible

## 9. Implementation Plan

### 9.1 Phase 1: Core Infrastructure

1. Create template directory structure
2. Implement basic template loader and renderer
3. Develop integration with MCP Server
4. Create initial templates for core functions

### 9.2 Phase 2: Advanced Features

1. Add support for conditional logic
2. Implement template versioning
3. Create template testing framework
4. Develop template documentation generator

### 9.3 Phase 3: Optimization

1. Implement template caching
2. Add performance monitoring
3. Optimize token usage
4. Create template analytics

## 10. Conclusion

The LLM Template System provides a structured, maintainable approach to managing AI interactions in the Lens project. By externalizing prompts as markdown templates, the system enables better separation of concerns, improved maintainability, and specialized prompt engineering independent from code development.
