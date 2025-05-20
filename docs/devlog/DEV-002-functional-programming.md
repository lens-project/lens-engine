# DEV-002: Functional Programming Approach

## Overview

This document outlines the decision to use functional programming (FP) as the primary paradigm for the Lens project, rather than object-oriented programming (OOP). It explains the rationale, benefits, and provides practical guidelines for contributors.

## Decision

Lens will be implemented using functional programming principles. This architectural decision affects all code contributions and establishes a consistent approach across the codebase.

## Rationale

### Why Functional Programming?

1. **Data Pipeline Nature**: Lens is primarily a data processing application that fetches, transforms, and filters content. This aligns perfectly with functional programming's strength in data transformation pipelines.

2. **Simplicity and Clarity**: Functional code tends to be more declarative, focusing on "what" rather than "how," making it easier to understand at a glance.

3. **Testability**: Pure functions with no side effects are inherently easier to test since they always produce the same output for the same input.

4. **Reduced State Management Complexity**: Managing state is often simpler with functional approaches, especially for an application that processes data pipelines.

5. **Concurrency Safety**: As Lens may evolve to handle multiple feeds simultaneously, functional code with immutable data structures is safer in concurrent environments.

6. **JavaScript/TypeScript Ecosystem Alignment**: The JavaScript/TypeScript ecosystem has been moving toward more functional patterns, with features like array methods, destructuring, and spread operators.

7. **Modularity**: Functional code can be highly modular, supporting our goal of potentially publishing components as independent JSR modules.

### Advantages for an Open Source Project

1. **Lower Barrier to Entry**: Many JavaScript developers are already familiar with functional patterns, making it easier for new contributors to join.

2. **Reduced Cognitive Load**: With fewer moving parts and side effects, contributors can more easily understand isolated parts of the codebase.

3. **Composition Over Inheritance**: Functional composition creates more flexible code structures than inheritance hierarchies, making the code more adaptable to changing requirements.

4. **Smaller Surface Area**: Functional interfaces often have a smaller surface area than object-oriented ones, making them easier to document and understand.

## Core Principles

### 1. Pure Functions

Functions should be pure whenever possible:
- Same input always produces the same output
- No side effects (no mutation of external state)
- No I/O operations within the function

```typescript
// ❌ Impure function with side effects
let total = 0;
function addToTotal(value: number): void {
  total += value; // Modifies external state
}

// ✅ Pure function
function add(a: number, b: number): number {
  return a + b; // No side effects, same input always gives same output
}
```

### 2. Immutability

Treat data as immutable. Instead of modifying existing data structures, create new ones with the desired changes.

```typescript
// ❌ Mutating data
function addItem(items: string[], newItem: string): void {
  items.push(newItem); // Modifies the original array
}

// ✅ Immutable approach
function addItem(items: string[], newItem: string): string[] {
  return [...items, newItem]; // Returns a new array
}
```

### 3. Function Composition

Build complex operations by composing smaller, focused functions.

```typescript
// ✅ Small, focused functions that can be composed
function filterRecentItems(items: ContentItem[]): ContentItem[] {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return items.filter(item => item.publishDate > oneWeekAgo);
}

function sortByRelevance(items: ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Compose them together
function getRecentRelevantItems(items: ContentItem[]): ContentItem[] {
  return sortByRelevance(filterRecentItems(items));
}

// Or use a compose utility
const getRecentRelevantItems = compose(sortByRelevance, filterRecentItems);
```

### 4. Minimal State

Minimize state and make state changes explicit. When state is necessary, contain it within a small, well-defined scope.

```typescript
// ❌ Implicit state changes across multiple functions
let currentUser = null;
function login(username: string): void {
  currentUser = { username, loggedInAt: Date.now() };
}
function isLoggedIn(): boolean {
  return currentUser !== null;
}

// ✅ Explicit state management
type AppState = {
  currentUser: User | null;
  // other state properties
};

function loginReducer(state: AppState, username: string): AppState {
  return {
    ...state,
    currentUser: { username, loggedInAt: Date.now() }
  };
}
```

### 5. Type-Driven Development

Use TypeScript's type system to guide implementation and make illegal states unrepresentable.

```typescript
// ❌ Primitive types that don't enforce constraints
function updateFeedFrequency(feedId: string, minutes: number): void {
  // minutes could be negative or zero, which doesn't make sense
}

// ✅ Types that enforce constraints
type PositiveNumber = number & { readonly brand: unique symbol };
function createPositiveNumber(n: number): PositiveNumber | Error {
  return n > 0 ? n as PositiveNumber : new Error("Number must be positive");
}

function updateFeedFrequency(feedId: string, minutes: PositiveNumber): void {
  // minutes is guaranteed to be positive
}
```

## Anti-Patterns to Avoid

### 1. Classes with Internal State

```typescript
// ❌ Class with internal state
class FeedProcessor {
  private processedItems: ContentItem[] = [];
  
  processItem(item: ContentItem): void {
    // Process the item
    this.processedItems.push(item);
  }
  
  getProcessedItems(): ContentItem[] {
    return this.processedItems;
  }
}

// ✅ Functional approach
function processItem(item: ContentItem): ProcessedItem {
  // Process the item and return a new processed item
  return { ...item, processed: true };
}

function processItems(items: ContentItem[]): ProcessedItem[] {
  return items.map(processItem);
}
```

### 2. Inheritance Hierarchies

```typescript
// ❌ Inheritance hierarchy
class BaseProcessor {
  process(item: any): any {
    // Base processing
    return item;
  }
}

class VideoProcessor extends BaseProcessor {
  process(item: VideoItem): ProcessedVideoItem {
    const baseProcessed = super.process(item);
    // Additional video processing
    return { ...baseProcessed, videoProcessed: true };
  }
}

// ✅ Functional composition
function baseProcess(item: any): any {
  // Base processing
  return item;
}

function processVideo(item: VideoItem): ProcessedVideoItem {
  const baseProcessed = baseProcess(item);
  // Additional video processing
  return { ...baseProcessed, videoProcessed: true };
}
```

### 3. Methods that Modify Object State

```typescript
// ❌ Methods that modify state
class UserPreferences {
  topics: TopicPreference[] = [];
  
  addTopic(topic: string): void {
    this.topics.push({ topic, preference: 0.5 });
  }
  
  updatePreference(topic: string, preference: number): void {
    const index = this.topics.findIndex(t => t.topic === topic);
    if (index >= 0) {
      this.topics[index].preference = preference;
    }
  }
}

// ✅ Functions that return new state
type UserPreferences = {
  topics: TopicPreference[];
};

function addTopic(prefs: UserPreferences, topic: string): UserPreferences {
  return {
    ...prefs,
    topics: [...prefs.topics, { topic, preference: 0.5 }]
  };
}

function updatePreference(
  prefs: UserPreferences, 
  topic: string, 
  preference: number
): UserPreferences {
  return {
    ...prefs,
    topics: prefs.topics.map(t => 
      t.topic === topic ? { ...t, preference } : t
    )
  };
}
```

## Practical Implementation

### Managing Side Effects

Pure functions are ideal, but real applications need side effects (file I/O, network requests, etc.). Contain these effects at the edges of your application:

```typescript
// Core business logic is pure
function processContent(content: RawContent): ProcessedContent {
  // Pure transformation
  return { ...content, processed: true };
}

// Side effects are isolated at the edges
async function fetchAndProcessContent(url: string): Promise<ProcessedContent> {
  // Side effect: Network request
  const content = await fetchContent(url);
  // Pure core logic
  const processed = processContent(content);
  // Side effect: Database storage
  await saveToDatabase(processed);
  return processed;
}
```

### State Management

For application state, consider using a reducer pattern:

```typescript
type AppState = {
  feeds: Feed[];
  content: ContentItem[];
  userPreferences: UserPreferences;
};

type Action = 
  | { type: "ADD_FEED"; payload: Feed }
  | { type: "REMOVE_FEED"; payload: string }
  | { type: "UPDATE_PREFERENCE"; payload: { topic: string; preference: number } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_FEED":
      return { ...state, feeds: [...state.feeds, action.payload] };
    case "REMOVE_FEED":
      return { 
        ...state, 
        feeds: state.feeds.filter(feed => feed.id !== action.payload) 
      };
    case "UPDATE_PREFERENCE":
      return {
        ...state,
        userPreferences: updatePreference(
          state.userPreferences,
          action.payload.topic,
          action.payload.preference
        )
      };
    default:
      return state;
  }
}
```

## Conclusion

By adopting functional programming principles, the Lens project aims to create a codebase that is easier to understand, test, and maintain. This approach aligns well with the project's data processing nature and should lower the barrier to entry for contributors.

While we strongly prefer functional approaches, we recognize that pragmatism sometimes requires compromise. When faced with a choice, prefer the solution that is:

1. Easiest to understand
2. Most testable
3. Least likely to introduce bugs
4. Most aligned with functional principles

Remember that the goal is to create high-quality, maintainable software, not to adhere dogmatically to a particular paradigm.
