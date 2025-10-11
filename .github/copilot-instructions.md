# regex-to-mermaid

## Project Overview

A TypeScript CLI tool and library to convert regular expressions into Mermaid flowchart diagrams.

## Runtime: Bun (Not Node.js)

This project uses **Bun**, not Node.js. Always use Bun commands:

- Run: `bun run index.ts` or `bun start`
- Install deps: `bun install` (never `npm install`)
- Test: `bun test` (uses `bun:test` API, not Jest/Vitest)
- Execute TypeScript directly: `bun index.ts` (no need for ts-node)
- No test framework dependency needed (use built-in `bun:test`)

## TypeScript Configuration

- Target: ESNext with module preservation
- Strict mode enabled with `noUncheckedIndexedAccess`
- No emit - Bun runs TypeScript directly
- Verbatim module syntax for clarity

## Formatting

- Uses Prettier for consistent code style
- Run `bun run format` to format code

## Testing Strategy

Use `bun:test` API (example pattern):

```typescript
import { test, expect } from 'bun:test';

test('parses simple regex', () => {
  // Test regex parsing logic
});
```
