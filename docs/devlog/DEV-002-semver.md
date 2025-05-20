# Semantic Versioning (SemVer)

**Date:** 2024-11-01  
**Author:** Lens Team  
**Topic:** Version Management and Changelog Generation

## Introduction

This devlog explains semantic versioning (SemVer) and why it's crucial for the Lens project. Understanding SemVer will help you contribute effectively to our project and understand our release process, regardless of your experience level.

## What is Semantic Versioning?

Semantic Versioning is a versioning scheme that uses a three-part version number: MAJOR.MINOR.PATCH (e.g., 1.2.3). Each part has a specific meaning:

- **MAJOR**: Incremented for incompatible API changes
- **MINOR**: Incremented for backward-compatible functionality additions
- **PATCH**: Incremented for backward-compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

## Why SemVer is Important

Semantic Versioning provides several critical benefits:

1. **Clear Communication**: Developers instantly understand the impact of an update
2. **Dependency Management**: Tools can automatically update dependencies safely
3. **Stability**: Users can update with confidence, knowing what to expect
4. **Compatibility**: Clear rules for maintaining backward compatibility
5. **Automation**: Enables automated release and changelog generation

## Benefits for Developers of All Levels

### For Beginners
- Simple, consistent rules for understanding version numbers
- Clear indication of breaking changes
- Easier to understand project evolution
- Framework for making responsible changes

### For Intermediate Developers
- Guidance for properly categorizing your changes
- Better collaboration through shared versioning expectations
- Clearer communication with users and other developers
- Foundation for release planning

### For Advanced Developers
- Enables automated release workflows
- Supports complex dependency management
- Facilitates long-term API stability
- Provides structure for managing breaking changes

## SemVer in Practice

### Version Increments

When making changes to the codebase:

1. **MAJOR (1.0.0 → 2.0.0)**
   - Changing a public API in a backward-incompatible way
   - Removing deprecated functionality
   - Changing behavior that users may depend on

2. **MINOR (1.0.0 → 1.1.0)**
   - Adding new functionality in a backward-compatible manner
   - Marking functionality as deprecated
   - Adding new optional parameters to functions

3. **PATCH (1.0.0 → 1.0.1)**
   - Bug fixes that don't change the API
   - Performance improvements
   - Documentation updates

### Pre-release Versions

For versions still in development:
```
1.0.0-alpha.1
1.0.0-beta.2
1.0.0-rc.1
```

### Build Metadata

Additional build information can be appended:
```
1.0.0+20240501
1.0.0+git.5114f85
```

## Automated Changelog Generation

Semantic versioning pairs naturally with automated changelog generation. Here's how they work together:

### Conventional Commits

We use the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages, which follows this pattern:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types include:
- `feat`: A new feature (MINOR version)
- `fix`: A bug fix (PATCH version)
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify src or test files

Breaking changes are indicated with an exclamation mark or `BREAKING CHANGE:` in the footer:
```
feat!: remove deprecated API
```
or
```
feat: new API design

BREAKING CHANGE: completely redesigns the API
```

### Tools for Automated Changelog Generation

Several tools can automatically generate changelogs from conventional commits:

1. **[standard-version](https://github.com/conventional-changelog/standard-version)**: Automates versioning and changelog generation
2. **[semantic-release](https://github.com/semantic-release/semantic-release)**: Fully automated version management and package publishing
3. **[commitizen](https://github.com/commitizen/cz-cli)**: Command-line tool for creating properly formatted commit messages
4. **[commitlint](https://github.com/conventional-changelog/commitlint)**: Lints commit messages to ensure they follow conventions

## SemVer in the Lens Project

In the Lens project, we follow these practices:

1. **Strict SemVer Compliance**: We adhere to semantic versioning rules for all releases
2. **Conventional Commits**: All commit messages follow the conventional commits format
3. **Automated Releases**: Version bumps and changelog generation are automated
4. **Pre-release Phases**: We use alpha, beta, and release candidate phases for major changes
5. **Clear Documentation**: All breaking changes are clearly documented

## Best Practices We Follow

1. **Think Before Committing**: Consider the impact of your changes on versioning
2. **Descriptive Commit Messages**: Write clear, detailed commit messages
3. **Breaking Changes**: Clearly mark and document all breaking changes
4. **Deprecation Notices**: Deprecate features before removing them
5. **Release Notes**: Provide comprehensive release notes for each version

## Common Pitfalls to Avoid

1. **Inconsistent Versioning**: Don't increment versions inconsistently with the changes made
2. **Unmarked Breaking Changes**: Always mark breaking changes appropriately
3. **Premature Major Versions**: Don't bump the major version unnecessarily
4. **Forgetting Pre-1.0.0**: Remember that pre-1.0.0 versions have different stability expectations
5. **Ignoring Build Metadata**: Use build metadata when appropriate for deployments

## Resources for Further Learning

- [Semantic Versioning 2.0.0 Specification](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Semantic Version Calculator](https://semver.npmjs.com/)
- [Deno Versioning](https://docs.deno.com/runtime/manual/getting_started/version_management)

## Conclusion

Semantic Versioning is essential for maintaining a stable, predictable, and professional software project. By following SemVer principles in the Lens project, we ensure that our users can confidently adopt new versions and that our developers have clear guidelines for making and communicating changes.

If you have questions about our versioning approach or need help determining the appropriate version for your changes, please open an issue or discussion on our GitHub repository.
