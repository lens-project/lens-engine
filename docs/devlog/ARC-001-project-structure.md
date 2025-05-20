# Lens Project Structure Decisions

## Date: May 11, 2025

This devlog documents key architectural and structural decisions made for the Lens project. These decisions establish the foundation for the project's organization, naming conventions, and modularity principles.

## Directory Structure

We've established a standardized directory structure for the Lens project:

```
src/
├── core/               # Core system components and shared utilities
├── feed/               # RSS Feed Registry implementation
├── retrieval/          # Retrieval Engine implementation
├── processor/          # Content processing paths
│   ├── video/          # Video content processing
│   └── article/        # Article content processing
├── model/              # Model Context Protocol Server implementation
├── database/           # Vector Database implementation
├── query/              # Query Engine implementation
├── cli/                # Command-line interface
├── api/                # REST API server (CLI facade)
├── mcp/                # Model Context Protocol API server (CLI facade)
├── util/               # Utility functions
└── lab/                # Experimental features and prototypes
```

## Naming Conventions

### Directory Naming

- **Use singular form** for all directory names (e.g., `model/` not `models/`)
- This provides consistency and represents the "category" or "concept" rather than a collection

### File Naming

- **Use simple, single-word names** whenever possible (e.g., `vector.ts` not `vector_store.ts`)
- **Follow Deno conventions** with `mod.ts` as entry points
- **Use snake_case** (with underscores) only when absolutely necessary for clarity
- **Use explicit `.ts` extensions** in imports (Deno convention)

## Module Independence

A key architectural decision is to make each directory a self-contained module that could potentially be published as an independent JSR module. To support this:

1. **Module-specific type definitions**: Each module has its own `types.ts` file rather than a centralized type directory
2. **Well-defined interfaces**: Modules communicate through explicit interfaces
3. **Minimal dependencies**: Modules should minimize dependencies on other modules
4. **No circular dependencies**: Avoid circular dependencies between modules

### Rationale for Module-Specific Types

We considered two approaches for organizing type definitions:

1. **Centralized types directory** (`src/type/`)
2. **Module-specific types** (each module has its own `types.ts`)

We chose module-specific types for the following reasons:

- **True modularity**: Each component is fully self-contained
- **Future-proofing**: Modules can be easily extracted as JSR packages
- **Clear boundaries**: Explicit interfaces between modules
- **Reduced coupling**: Changes in one module don't cascade to others
- **Ownership clarity**: Each team/contributor knows where types belong

## Naming Decision: "feed" vs "source"

We initially considered using "source" for the RSS feed registry implementation but decided on "feed" instead:

- **Avoids ambiguity**: "source" could be confused with source code
- **More specific**: Directly relates to RSS feeds, which is the primary purpose
- **Maintains consistency**: Follows the singular naming convention
- **Clearer purpose**: Immediately communicates the module's function

## Implementation Guidelines

1. Follow Deno conventions (mod.ts as entry points, explicit .ts extensions in imports)
2. Use singular form for directory names
3. Use simple, single-word file names when possible
4. Each module should be self-contained with its own types.ts file
5. Modules should communicate through well-defined interfaces
6. Follow test-driven development approach
7. Create corresponding test files for each component
8. Implement minimal working versions first
9. Add proper documentation comments
10. Ensure proper error handling

## Structure Validation

To ensure consistency as the project grows and attracts contributors, we've decided to implement automated validation of the directory structure and naming conventions:

1. **Structure manifest**: Define expected directories, files, and naming conventions
2. **Validation tests**: Automatically verify the actual structure against the manifest
3. **CI integration**: Run validation tests on PRs to catch structural issues early
4. **Documentation**: Clear guidelines for contributors

This approach will help maintain the project's structural integrity as it evolves and new contributors join.

## References

- [GitHub Issue #1: Implement Initial Folder Structure and Core Components](https://github.com/mpazaryna/lens/issues/1)
- [GitHub Issue #2: Implement Directory Structure Validation and Testing](https://github.com/mpazaryna/lens/issues/2)
