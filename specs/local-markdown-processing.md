# Plan: Extend Lens Engine for Local Markdown Processing

## Current State Analysis
- **Markdown processing already exists** in `processors/lab/markdown_summarizer.ts`
- **Batch processing framework** exists in `processors/src/batch.ts`  
- **Mixed content processing** already supported in batch processor
- **CLI integration** ready in `src/cli.ts`

## Proposed Architecture

### New Data Flow
```
Current: OPML → feeds/ → retrieval/ → fetched/ → processors/ → processed/ → ranking/
New:     Local MD files → clippings/ → processors/ → processed/ → ranking/
```

### Implementation Plan

#### Phase 1: Promote Markdown Lab to Production
1. **Move markdown processing from lab to production**
   - Promote `processors/lab/markdown_summarizer.ts` → `processors/src/markdown.ts`
   - Update `processors/src/batch.ts` to include native markdown support
   - Add markdown processing to `processors/mod.ts` exports

#### Phase 2: Extend CLI with Local Sources
1. **Add new CLI options** for local file processing:
   - `--clippings-only` - Process only local markdown files
   - `--clippings-dir` - Specify custom clippings directory
   - `--include-clippings` - Include clippings in full pipeline

2. **Add clippings directory support**:
   - Default: `{LENS_DATA_DIR}/clippings/` for saved markdown files
   - Auto-detect `.md` and `.markdown` files
   - Support same processing pipeline (summarize → rank)

#### Phase 3: Update Batch Processor
1. **Extend mixed batch processing** to handle:
   - HTML files from RSS feeds (`fetched/`)
   - Markdown files from local clippings (`clippings/`)
   - Unified output to `processed/` directory

#### Phase 4: Configuration Updates
1. **Add clippings config** to support:
   - Custom clippings directory path
   - File watching for auto-processing new files
   - Exclusion patterns for specific files

## Expected Workflow
1. **Manual Process**: Save Medium/Substack articles as `.md` files to `{LENS_DATA_DIR}/clippings/`
2. **CLI Usage**: 
   - `deno run ... src/cli.ts --clippings-only` (process only clippings)
   - `deno run ... src/cli.ts` (full pipeline including clippings)
3. **Output**: All content (RSS + clippings) ranked together in unified results

## Benefits
- **Leverages existing architecture** - minimal changes needed
- **Unified processing** - same summarization + ranking for all content  
- **Paywall content support** - you save authenticated content manually
- **Functional programming** - maintains your architectural principles
- **Extensible** - easy to add other local sources later (PDFs, etc.)

## Technical Implementation Details

### Files to Modify
- `src/processors/src/markdown.ts` (promote from lab)
- `src/processors/src/batch.ts` (add markdown support)
- `src/processors/mod.ts` (export markdown functions)
- `src/cli.ts` (add clippings options)
- `src/config/src/defaults.ts` (add clippings config)

### New CLI Options
```bash
# Process only local markdown files
deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts --clippings-only

# Process local files with custom directory
deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts --clippings-only --clippings-dir="/path/to/articles"

# Full pipeline including clippings (default behavior)
deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts --include-clippings
```

### Directory Structure
```
lens-data/
├── opml/           # OPML feed files
├── feeds/          # Processed RSS feeds
├── fetched/        # HTML from RSS feeds
├── clippings/      # Local markdown files (NEW)
├── processed/      # Summaries from all sources
└── ranked/         # Final ranked content
```

### Configuration Extension
```typescript
interface ClippingsConfig {
  /** Directory for local markdown files */
  clippingsDir: string;
  /** File patterns to include */
  includePatterns: string[];
  /** File patterns to exclude */
  excludePatterns: string[];
  /** Whether to watch for new files */
  watchForChanges: boolean;
}
```

## Success Criteria
- [ ] Local markdown files process through same pipeline as RSS content
- [ ] Unified ranking of all content sources
- [ ] CLI supports both isolated and integrated processing modes
- [ ] Maintains functional programming principles
- [ ] No disruption to existing RSS workflow
- [ ] Extensible for future content sources (PDFs, etc.)

## Future Enhancements
1. **File watching**: Auto-process new files added to clippings directory
2. **PDF support**: Extend to process PDF documents
3. **Browser extension**: Direct save from browser to clippings
4. **Metadata extraction**: Extract publish date, author, source URL from markdown frontmatter
5. **Duplicate detection**: Identify and handle duplicate content across sources