# Contributing to regex-to-mermaid

First off, thank you for considering contributing to regex-to-mermaid! It's people like you that make this tool better for everyone.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior by opening an issue.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide the regex pattern that caused the issue**
- **Include the expected behavior and what actually happened**
- **Include screenshots of the generated diagram if applicable**
- **Specify your Bun version** (`bun --version`)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Include examples of regex patterns that would benefit from this feature**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Follow the development setup instructions below
3. Make your changes and add tests if applicable
4. Ensure the test suite passes (`bun test`)
5. Format your code (`bun run format`)
6. Add a changeset (`bun run changeset`) to describe your changes
7. Push to your fork and submit a pull request

## Development Setup

This project uses **Bun** (not Node.js). Make sure you have Bun installed:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then clone and install dependencies:

```bash
git clone https://github.com/tayles/regex-to-mermaid.git
cd regex-to-mermaid
bun install
```

### Running the CLI locally

```bash
bun run index.ts 'your-regex-here'
```

Or:

```bash
bun start 'your-regex-here'
```

### Running Tests

```bash
bun test
```

Tests use the built-in `bun:test` API (not Jest or Vitest).

### Code Formatting

We use Prettier for consistent code formatting:

```bash
bun run format
```

### Project Structure

- `src/` - Core library code
  - `parser.ts` - Regex parsing logic using regexp-tree
  - `renderer.ts` - Mermaid diagram generation
  - `theme.ts` - Theme definitions and styling
  - `cli.ts` - Command-line interface
  - `types.ts` - TypeScript type definitions
  - `*.test.ts` - Test files
- `index.ts` - CLI entry point
- `scripts/` - Utility scripts for generating examples and themes
- `diagrams/` - Example regex patterns and generated diagrams

### Adding New Features

When adding new features:

1. **Add tests** - Write tests in the appropriate `*.test.ts` file
2. **Update types** - Add TypeScript types in `types.ts` if needed
3. **Update documentation** - Add examples to the `diagrams/` directory
4. **Add a changeset** - Run `bun run changeset` to document your changes

### Generating Examples

To regenerate the examples documentation:

```bash
bun run generate-examples
```

To regenerate the themes documentation:

```bash
bun run generate-themes
```

## Version Management

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

- **Add a changeset**: `bun run changeset`
  - Select the type of change (patch, minor, major)
  - Describe your changes
- **Update versions**: `bun run version` (maintainers only)
- **Publish**: `bun run release` (maintainers only)

## Coding Guidelines

- **TypeScript**: Write type-safe code with strict mode enabled
- **Formatting**: Use Prettier for all code formatting
- **Testing**: Add tests for new features and bug fixes
- **Commits**: Write clear, descriptive commit messages
- **Documentation**: Update relevant documentation for significant changes

### TypeScript Style

- Use `const` over `let` when possible
- Avoid `any` type - use proper typing
- Use arrow functions for callbacks
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Enable all strict TypeScript compiler options

## Questions?

Feel free to open an issue with the "question" label if you have any questions about contributing!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
