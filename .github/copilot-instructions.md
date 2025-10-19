# regex-to-mermaid

## Project Overview

A TypeScript CLI tool and library to convert regular expressions into Mermaid flowchart diagrams.

## Runtime: Bun (Not Node.js)

This project uses **Bun**, not Node.js. Always use Bun commands:

- Run: `bun dev`
- Install deps: `bun install` (never `npm install`)
- Test: `bun test` (uses `bun:test` API, not Jest/Vitest)
- Execute TypeScript directly: `bun run src/index.ts` (no need for ts-node)
- No test framework dependency needed (use built-in `bun:test`)

## Formatting & Linting

- Uses Biome for consistent code style (not prettier or eslint)
- Run `bun run lint:fix` to format code
- Run `bun run type-check` to check types

## Testing Strategy

Use `bun:test` API (example pattern):

```typescript
import { test, expect } from 'bun:test';

test('parses simple regex', () => {
  // Test regex parsing logic
});
```
