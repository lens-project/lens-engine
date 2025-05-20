# Testing Approach - Developer Log

## Overview

This document outlines the testing strategy for the Lens project, with a focus on our multi-layered approach to testing both production code and lab experiments. We've designed our testing structure to support thorough validation while maintaining clear separation between different types of tests.

## Testing Philosophy

Our approach is inspired by the Testing Pyramid concept, where we maintain a balance of:
- Many fast, isolated unit tests
- A moderate number of integration tests
- A smaller number of comprehensive end-to-end tests

For both production code and lab experiments, we follow this layered approach to ensure both reliability and maintainability.

## Test Structure

### Production Code Testing

For production code, tests are organized in a dedicated `test` directory within each module:

```
src/
  └── models/
      ├── mod.ts
      ├── ollama_client.ts
      └── test/
          ├── unit/
          │   └── ollama_client_test.ts    # Tests with mocks
          ├── integration/
          │   └── ollama_client_test.ts    # Tests with actual dependencies
          └── e2e/
              └── ollama_workflow_test.ts  # End-to-end workflow tests
```

### Lab Experiment Testing

For experimental code in labs, we use a similar structure:

```
src/
  └── models/
      └── lab/
          ├── ollama.ts
          └── test/
              ├── unit/
              │   └── ollama_test.ts       # Tests with mocks
              ├── integration/
              │   └── ollama_test.ts       # Tests with actual dependencies
              └── mocks/
                  └── ollama_api.ts        # Shared mock implementations
```

Note that for lab experiments, we typically don't include e2e tests as those are more appropriate for fully-integrated production code.

## Test Types

### Unit Tests

Unit tests focus on testing individual functions or components in isolation:
- Use mocks extensively to isolate the component being tested
- Should be fast and reliable
- Don't depend on external services or state
- Help validate core logic independently

### Integration Tests

Integration tests verify that components work together correctly:
- Connect to actual dependencies (databases, APIs, etc.)
- Validate proper interaction between components
- May require setup/teardown of test resources
- Catch issues that mocks might miss

### End-to-End Tests

E2E tests validate complete workflows across the system:
- Test the application as a user would experience it
- Verify that all components work together correctly
- Often run against a test environment similar to production
- Catch integration issues between subsystems

## Mocking Strategy

Mocks are essential to our testing approach, especially for early lab experiments. We use mocks to:

1. **Isolate components** - Test specific code paths without external dependencies
2. **Control test conditions** - Create specific scenarios that might be hard to reproduce with real services
3. **Speed up tests** - Remove network calls and external processing time
4. **Improve reliability** - Avoid flaky tests due to external service issues

### Mock Implementation

For our mocks, we typically:
- Create dedicated mock files in a `mocks` folder
- Implement interfaces that match the real dependencies
- Add methods to control behavior for specific test scenarios
- Document the expected behavior of the mocks

Example for Ollama API mock:

```typescript
// src/models/lab/test/mocks/ollama_api.ts

export class MockOllamaApi {
  // Control test behavior
  private _shouldFail = false;
  private _mockEmbeddings: number[] = [0.1, 0.2, 0.3, 0.4];
  
  // Set up mock behavior
  public setShouldFail(value: boolean): void {
    this._shouldFail = value;
  }
  
  public setMockEmbeddings(embeddings: number[]): void {
    this._mockEmbeddings = embeddings;
  }
  
  // Mock API methods
  public async generateEmbedding(text: string): Promise<number[]> {
    if (this._shouldFail) {
      throw new Error("Mock API failure");
    }
    return this._mockEmbeddings;
  }
  
  public async generateCompletion(prompt: string): Promise<string> {
    if (this._shouldFail) {
      throw new Error("Mock API failure");
    }
    return `Mock response for: ${prompt}`;
  }
}
```

### Benefits of Mocking in Lab Experiments

Mocking is particularly valuable during early lab testing because:

1. **Rapid iteration** - Test without waiting for external services to respond
2. **Controlled experimentation** - Precisely control the behavior of dependencies
3. **API exploration** - Define the ideal API for a service before implementation
4. **Resilience testing** - Easily simulate error conditions and edge cases
5. **Independent development** - Work on components before dependencies are fully available
6. **Consistent test environment** - Tests behave the same regardless of external factors

## Running Tests

We've configured Deno tasks to support running different test types:

```json
{
  "tasks": {
    "test": "deno test",
    "test:unit": "deno test src/**/test/unit/**/*_test.ts",
    "test:integration": "deno test src/**/test/integration/**/*_test.ts",
    "test:e2e": "deno test src/**/test/e2e/**/*_test.ts",
    "test:lab": "deno test src/**/lab/test/**/*_test.ts",
    "test:lab:unit": "deno test src/**/lab/test/unit/**/*_test.ts",
    "test:lab:integration": "deno test src/**/lab/test/integration/**/*_test.ts"
  }
}
```

This allows us to run specific test suites for different purposes:
- `deno task test:unit` - Run all unit tests for rapid feedback
- `deno task test:lab:unit` - Run only experimental lab unit tests
- `deno task test` - Run all tests for comprehensive validation

## Best Practices

1. **Test location** - Keep tests close to the code they're testing
2. **Test independence** - Each test should run independently without shared state
3. **Test clarity** - Tests should clearly indicate what they're testing and why
4. **Mock appropriately** - Use mocks for unit tests, real dependencies for integration
5. **Test coverage** - Aim for high coverage of core logic, especially for error cases
6. **Test maintenance** - Update tests when code changes to prevent test drift

## Progression from Lab to Production

As lab experiments mature into production code, the testing approach evolves:

1. **Lab Phase**:
   - Focus on unit tests with extensive mocking
   - Add integration tests to validate real-world behavior
   - Iterate rapidly based on test results

2. **Production Phase**:
   - Refine unit and integration tests for production code
   - Develop end-to-end tests for critical workflows
   - Add performance and load testing as needed

3. **Continuous Improvement**:
   - Use test results to guide optimizations
   - Expand test coverage for edge cases
   - Maintain tests alongside code changes

## Conclusion

Our testing approach provides a robust framework for validating both experimental and production code in the Lens project. By maintaining clear separation between test types and leveraging mocks appropriately, we can ensure both rapid iteration during experimentation and high reliability in production.

The structured folder organization makes it easy to find and run specific test types, while our mocking strategy enables thorough testing even of complex dependencies. This approach supports our lab-based development methodology and ensures a smooth progression from experimentation to production-ready code.