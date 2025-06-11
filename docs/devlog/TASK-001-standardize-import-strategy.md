# TASK-001: Standardize Import Strategy

## Overview

**Status**: Pending  
**Priority**: Medium  
**Estimated Effort**: 2-3 hours  
**Type**: Code Quality / Technical Debt  

## Problem Statement

The codebase currently has inconsistent import strategies that mix relative imports with import map aliases within the same modules. This creates a code smell that impacts maintainability, readability, and refactoring safety.

### Current Issues

1. **Mixed import styles** - Files use both relative imports (`../../extract/mod.ts`) and import map aliases (`@src/models/mod.ts`)
2. **Refactoring brittleness** - Relative imports break when files are moved
3. **Inconsistent mental model** - Developers need to think about both relative paths and import maps
4. **Maintenance overhead** - Two different systems to manage

### Example of Current Problem

In `src/processors/src/controller/content/html.ts`:

```typescript
// Mixed import styles (code smell):
import { extractFromHtml, type HtmlExtractResult } from "../../extract/mod.ts";
import type { ProcessingOptions, ProcessingResult } from "../types.ts";
import { summarizeContent, type SummaryOptions } from "@src/models/mod.ts";
import { getConfig } from "@src/config/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
```

## Proposed Solution

### Strategy: Deno-Idiomatic Module Structure

1. **Create top-level `mod.ts` files** for major modules to serve as public APIs
2. **Use import map aliases consistently** for all internal module references
3. **Standardize on existing import map patterns** already defined in `deno.json`

### Implementation Plan

#### Phase 1: Create Module Boundaries

1. **Create `src/processors/mod.ts`** as the public API for the processors module:
   ```typescript
   /**
    * Content Processors Module
    * 
    * Public API for all content processing functionality.
    */
   
   // Re-export controller functionality
   export {
     // HTML Processing
     type HtmlProcessingOptions,
     processHtmlContent,
     processHtmlFile,
     
     // Batch Processing  
     type BatchProcessingOptions,
     processHtmlBatch,
     processMixedBatch,
     
     // Types
     type BatchResult,
     type ProcessingOptions,
     type ProcessingResult,
     type ProgressCallback,
   } from "./src/controller/mod.ts";
   
   // Re-export extraction functionality if needed externally
   export {
     extractFromHtml,
     type HtmlExtractResult,
     type HtmlExtractOptions,
   } from "./src/extract/mod.ts";
   ```

2. **Audit other major modules** (`src/models`, `src/config`, etc.) to ensure they have proper `mod.ts` files

#### Phase 2: Standardize Import Patterns

1. **External consumers** use import map aliases:
   ```typescript
   import { processHtmlContent } from "@src/processors";
   import { getConfig } from "@src/config";
   ```

2. **Internal module imports** use clean relative paths or import maps:
   ```typescript
   // Within processors module - use relative to mod.ts
   import { extractFromHtml } from "../extract/mod.ts";
   import type { ProcessingOptions } from "./types.ts";
   
   // Cross-module - use import maps
   import { summarizeContent } from "@src/models";
   import { getConfig } from "@src/config";
   ```

3. **Standard library** uses existing import map aliases:
   ```typescript
   // Instead of full URLs:
   import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
   
   // Use import map:
   import { join } from "@std/path";
   ```

#### Phase 3: Update Existing Files

1. **Identify all files with mixed import patterns**
2. **Update imports following the standardized strategy**
3. **Test that all imports resolve correctly**
4. **Update any broken references**

### Current Import Map Configuration

From `deno.json`:
```json
{
  "imports": {
    "std/": "jsr:/@std/",
    "@std/assert": "jsr:@std/assert@^1.0.0",
    "@std/dotenv": "https://deno.land/std@0.208.0/dotenv/mod.ts",
    "@std/path": "https://deno.land/std@0.208.0/path/mod.ts",
    "@src/": "./src/",
    "@prompts/": "./prompts/"
  }
}
```

## Benefits

1. **Consistency** - Single import style for internal modules
2. **Refactor-safe** - Moving files won't break import map references
3. **Cleaner code** - Shorter, more readable import paths
4. **IDE-friendly** - Better autocomplete and navigation
5. **Deno idiomatic** - Follows established Deno conventions
6. **Controlled APIs** - `mod.ts` files create clear module boundaries

## Files to Update

### High Priority
- `src/processors/src/controller/content/html.ts` (example case)
- Any other files in `src/processors/` with relative imports
- Files that import from processors module

### Medium Priority
- Audit all modules for similar patterns
- Update import map if needed for better coverage

## Acceptance Criteria

- [ ] `src/processors/mod.ts` created with clean public API
- [ ] All imports within processors module use consistent strategy
- [ ] External consumers use `@src/processors` import
- [ ] Standard library imports use `@std/` aliases
- [ ] No mixed import patterns remain in any single file
- [ ] All tests pass after refactoring
- [ ] IDE navigation and autocomplete work correctly

## Notes

- This task aligns with existing project preference for consistent code patterns
- Follows Deno best practices for module organization
- Should be done as a focused refactoring session to avoid merge conflicts
- Consider running formatter after changes to ensure consistent style

## Related Documents

- `DEV-001-import-mapping.md` - Background on import mapping strategy
- `ARC-003-folder-structure.md` - Overall project structure decisions
