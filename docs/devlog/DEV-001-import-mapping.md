# Import Mapping in Deno

**Date:** 2024-10-31  
**Author:** Lens Team  
**Topic:** Managing External Modules in Deno

## Introduction

This devlog explains how Deno handles external modules and why we've chosen to use import maps in our `deno.json` file. Whether you're new to Deno or an experienced developer, understanding import maps will help you contribute to the Lens project more effectively.

## What are Import Maps?

Import maps are a feature that allows you to control how JavaScript module specifiers are resolved. In simpler terms, they let you use short, convenient names in your import statements instead of long URLs or file paths.

For example, instead of writing:

```typescript
import { assertEquals } from "jsr:@std/assert@^1.0.0";
```

You can write:

```typescript
import { assertEquals } from "@std/assert";
```

## Why We Use Import Maps in deno.json

We've chosen to centralize our import maps in the `deno.json` file for several important reasons:

1. **Consistency**: All developers work with the same module versions
2. **Maintainability**: Module versions can be updated in one place
3. **Readability**: Code is cleaner with shorter import paths
4. **Flexibility**: Easy to switch implementations or versions
5. **Onboarding**: New contributors don't need to learn all the module URLs

## Benefits for Developers of All Levels

### For Beginners
- Simpler import statements that are easier to understand
- No need to memorize complex URLs or version numbers
- Clear organization of project dependencies
- Easier to get started contributing

### For Intermediate Developers
- Faster development with shorter import paths
- Reduced errors from mistyped URLs
- Better IDE support and autocompletion
- Consistent module usage across the project

### For Advanced Developers
- Centralized dependency management
- Easy version upgrades and migrations
- Ability to override or mock modules for testing
- Path aliasing for better code organization

## Different Ways to Include External Modules in Deno

Deno supports several methods for including external modules:

### 1. Direct URL Imports

```typescript
import { something } from "https://deno.land/x/module@v1.0.0/mod.ts";
```

**Pros**: Simple, works without configuration  
**Cons**: Verbose, harder to maintain, potential version conflicts

### 2. JSR (JavaScript Registry)

```typescript
import { something } from "jsr:@scope/module-name@1.0.0";
```

**Pros**: Modern, supports semantic versioning, well-documented  
**Cons**: Requires explicit version numbers without import maps

### 3. npm Packages

```typescript
import something from "npm:package-name@1.0.0";
```

**Pros**: Access to the vast npm ecosystem  
**Cons**: Some packages may not be fully compatible with Deno

### 4. Import Maps (Our Approach)

In `deno.json`:
```json
{
  "imports": {
    "@std/assert": "jsr:@std/assert@^1.0.0",
    "module-name": "jsr:@scope/module-name@^1.0.0"
  }
}
```

In your code:
```typescript
import { something } from "module-name";
```

**Pros**: Clean imports, centralized version management, better developer experience  
**Cons**: Requires initial setup

## Our Project's Import Map Structure

In the Lens project, we use import maps for:

1. **Standard Library Modules**:
   ```json
   "std/": "jsr:/@std/",
   "@std/assert": "jsr:@std/assert@^1.0.0"
   ```

2. **Internal Module Aliases**:
   ```json
   "@core/": "./src/core/",
   "@labs/": "./src/labs/"
   ```

This approach helps organize our codebase into logical components while keeping imports clean and maintainable.

## Best Practices We Follow

1. **Use JSR for Standard Library**: The Deno standard library has moved to JSR, which we now use
2. **Semantic Versioning**: We use `^` to allow compatible updates (e.g., `^1.0.0` allows 1.x.y but not 2.0.0)
3. **Consistent Naming**: Our internal modules use the `@name/` pattern
4. **Minimal External Dependencies**: We carefully evaluate external dependencies before adding them
5. **Regular Updates**: We periodically check for updates to external modules

## Common Pitfalls to Avoid

1. **Direct URL Imports**: Avoid using direct URL imports in your code; use the import map instead
2. **Inconsistent Versioning**: Don't mix different versions of the same module
3. **Deeply Nested Imports**: Import from the main module entry point when possible
4. **Missing File Extensions**: Always include file extensions in local imports (e.g., `./utils.ts` not `./utils`)
5. **Circular Dependencies**: Be careful not to create circular import dependencies

## Recent Migration to JSR

We recently migrated from using the Deno standard library via HTTPS URLs to using JSR:

Before:
```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
```

After:
```typescript
import { assertEquals } from "@std/assert";
```

This change follows Deno's recommendation as they've moved the standard library to JSR.

## Adding New Dependencies

When adding new dependencies to the project:

1. Use `deno add` to automatically update the import map:
   ```bash
   deno add jsr:@scope/module-name
   ```

2. Or manually add to the `imports` section in `deno.json`

3. Use the import map in your code:
   ```typescript
   import { something } from "module-name";
   ```

## Resources for Further Learning

- [Deno Modules Documentation](https://docs.deno.com/runtime/fundamentals/modules/)
- [Import Maps Specification](https://github.com/WICG/import-maps)
- [JSR (JavaScript Registry)](https://jsr.io)
- [Deno Standard Library on JSR](https://jsr.io/@std)

## Conclusion

Import maps are a powerful feature in Deno that help us maintain a clean, organized, and maintainable codebase. By centralizing our module management in `deno.json`, we make it easier for developers of all experience levels to contribute to the Lens project.

If you have questions or suggestions about our import mapping approach, please open an issue or discussion on our GitHub repository.
