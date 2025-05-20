# Lens Project Devlogs

This directory contains development logs (devlogs) that document important decisions, architectural considerations, and design choices for the Lens project.

## Purpose

Devlogs serve as a historical record and reference for:
- Architectural decisions and their rationale
- Design patterns and conventions
- Technical trade-offs considered
- Implementation strategies
- Lessons learned during development

These documents help new contributors understand why certain decisions were made and provide context for the project's evolution.

## Naming Convention

Devlogs follow a standardized naming convention:

`XXX-NNN-description.md`

Where:
- `XXX` is a 3-letter category code
- `NNN` is a sequential number within that category (starting at 001)
- `description` is a brief, hyphenated description of the content

## Category Codes

| Code | Category | Description |
|------|----------|-------------|
| ARC  | Architecture | System architecture, component design, structural decisions |
| DEV  | Development | Development practices, coding standards, tooling |
| API  | API Design | API interfaces, protocols, endpoints |
| SEC  | Security | Security considerations, authentication, authorization |
| PER  | Performance | Performance optimizations, benchmarks |
| UI   | User Interface | UI/UX decisions, interface design |
| OPS  | Operations | Deployment, CI/CD, infrastructure |
| DAT  | Data | Data models, storage, retrieval strategies |

## Current Devlogs

| Devlog | Title | Date | Description |
|--------|-------|------|-------------|
| [ARC-001](./ARC-001-project-structure.md) | Project Structure Decisions | May 11, 2025 | Initial project structure, naming conventions, and modularity principles |
| [ARC-002](./ARC-002-cli-first-design.md) | CLI-First Architecture | May 11, 2025 | Command-line first architecture with API and MCP facades |
| [ARC-003](./ARC-003-folder-structure.md) | Folder Structure | May 11, 2025 | Lens project folder structure and component organization |
| [DEV-001](./DEV-001-import-mapping.md) | Import Mapping in Deno | Oct 31, 2024 | Managing external modules in Deno with import maps |
| [DEV-002](./DEV-002-semver.md) | Semantic Versioning | Nov 1, 2024 | Version management and changelog generation |
| [DAT-001](./DAT-001-rss-background.md) | RSS Background | May 11, 2025 | RSS: Past, present, and AI-enhanced future |

## Contributing

When adding a new devlog:

1. Identify the appropriate category
2. Use the next available sequential number for that category
3. Create a file with a descriptive name following the convention
4. Include the date at the top of the document
5. Reference any relevant GitHub issues or external resources
6. Update this README.md to include your new devlog in the table

## Format

Each devlog should include:

- A clear title
- The date it was written
- Context for the decision or discussion
- Options that were considered
- The decision that was made
- Rationale for the decision
- Any implications or follow-up actions
- References to related issues, PRs, or other resources
