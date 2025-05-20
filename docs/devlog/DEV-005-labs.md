 # Labs Approach - Developer Log

## Overview

This document outlines our approach to experimental development in the Lens project using a "labs" pattern inspired by scientific laboratory work. This approach allows us to safely experiment with new technologies and concepts while maintaining rigorous software engineering practices.

## Concept: Code Laboratories

Similar to how scientists use laboratories to conduct experiments before adopting proven techniques into broader research, our development process uses "lab" folders within modules to:

1. Explore new technologies and integration approaches
2. Test concepts before committing to implementation details
3. Maintain a historical record of our problem-solving process
4. Provide reference implementations for future development

This approach was inspired by the practices of traditional scientists and inventors like Thomas Edison, who maintained extensive notebooks of his experiments. Our lab folders serve as digital equivalents of these notebooks.

## Structure

### Module-Internal Labs

Rather than maintaining a single top-level `labs` folder, we embed lab folders within each module:

```
src/
  ├── models/              # A module
  │   ├── mod.ts           # Production code
  │   ├── types.ts
  │   ├── test/            # Tests for production code
  │   │   ├── unit/
  │   │   └── integration/
  │   └── lab/             # Experimental code
  │       ├── ollama.ts    # An experiment
  │       └── test/        # Tests for the experiment
  │           ├── unit/
  │           ├── integration/
  │           └── mocks/
  └── ...
```

This structure:
- Keeps experiments close to the code they're exploring
- Maintains module independence and cohesion
- Creates a clear path from experiment to production implementation
- Makes it easier to maintain experiments alongside the code they relate to

### Testing Approach

Labs have their own test directories with a structure that supports both unit testing (with mocks) and integration testing:

```
lab/
  ├── experiment.ts
  └── test/
      ├── unit/              # Tests using mocks
      │   └── experiment_test.ts
      ├── integration/       # Tests with real dependencies
      │   └── experiment_test.ts
      └── mocks/             # Shared mock implementations
          └── dependency_mock.ts
```

This allows us to thoroughly test experimental concepts before migrating them to production code.

## Workflow

1. **Experimentation**: Create focused experiments in the appropriate module's `lab` folder
   - Example: `src/models/lab/ollama.ts` for exploring Ollama integration

2. **Validation**: Write tests that verify the experimental approach works
   - Unit tests with mocks to validate logic
   - Integration tests to verify real-world behavior

3. **Refinement**: Iterate on the experiment based on test results

4. **Graduation**: When an experiment proves successful, refactor into production code
   - Move core functionality from `lab/experiment.ts` to the module's production files
   - Adapt tests for the production implementation

5. **Documentation**: Keep lab experiments as a reference for future development
   - Document key findings and design decisions
   - Maintain as a historical record of the development process

## Example: Ollama Integration

Our first application of this approach is the Ollama integration:

1. Created `src/models/lab/ollama.ts` to explore connecting to Ollama
2. Developed unit tests with mocks to validate parsing and processing logic
3. Created integration tests to verify actual connectivity to an Ollama instance
4. Once proven successful, will graduate to `src/models/ollama_client.ts`

## Running Lab Tests

We've configured Deno tasks to support testing lab experiments:

```json
{
  "tasks": {
    "test:lab": "deno test src/**/lab/test/**/*_test.ts",
    "test:lab:unit": "deno test src/**/lab/test/unit/**/*_test.ts",
    "test:lab:integration": "deno test src/**/lab/test/integration/**/*_test.ts"
  }
}
```

This allows us to run specific test suites for our experiments.

## Benefits Over Traditional Approaches

1. **Historical Record**: Preserves the evolution of our solutions
2. **Knowledge Transfer**: Makes it easier for team members to understand design decisions
3. **Reference Implementation**: Provides examples for similar future challenges
4. **Isolated Experimentation**: Allows exploring alternatives without affecting production code
5. **Reduced Risk**: Tests experimental integrations thoroughly before committing to an approach

## Conclusion

The lab approach gives us the best of both worlds - the freedom to experiment like scientists while maintaining the rigor of software engineering best practices. As the Lens project evolves, our lab experiments will create a valuable record of our development process and serve as a foundation for future innovations.