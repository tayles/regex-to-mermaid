import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { runCLI } from './cli-utils';

describe('CLI', () => {
  let consoleLogSpy: ReturnType<typeof mock>;
  let consoleErrorSpy: ReturnType<typeof mock>;
  const testOutputFile = join(process.cwd(), 'test-output.mmd');

  beforeEach(() => {
    consoleLogSpy = mock(() => {});
    consoleErrorSpy = mock(() => {});
    console.log = consoleLogSpy;
    console.error = consoleErrorSpy;
  });

  afterEach(() => {
    // Clean up test output file if it exists
    if (existsSync(testOutputFile)) {
      unlinkSync(testOutputFile);
    }
  });

  describe('Basic regex conversion', () => {
    test('converts simple regex to Mermaid diagram', async () => {
      await runCLI(['node', 'cli.ts', 'abc']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph LR');
      expect(output).toContain('abc');
    });

    test('handles regex with character class', async () => {
      await runCLI(['node', 'cli.ts', '[0-9]+']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph LR');
      expect(output).toContain('0-9');
    });

    test('handles regex with groups', async () => {
      await runCLI(['node', 'cli.ts', '(abc)']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph LR');
      expect(output).toContain('subgraph');
    });

    test('handles complex regex pattern', async () => {
      await runCLI(['node', 'cli.ts', '^[a-z]+@[a-z]+\\.[a-z]+$']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph LR');
    });
  });

  describe('Direction option', () => {
    test('uses LR direction by default', async () => {
      await runCLI(['node', 'cli.ts', 'abc']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph LR');
    });

    test('respects TD direction option', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--direction', 'TD']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph TD');
    });

    test('respects LR direction option explicitly', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--direction', 'LR']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph LR');
    });

    test('accepts short form -d for direction', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '-d', 'TD']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph TD');
    });

    test('handles lowercase direction values', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--direction', 'td']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph TD');
    });
  });

  describe('Theme option', () => {
    test('uses default theme by default', async () => {
      await runCLI(['node', 'cli.ts', 'abc']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      // Default theme includes styling
      expect(output).toContain('classDef');
    });

    test('respects neutral theme option', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--theme', 'neutral']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('classDef');
    });

    test('respects dark theme option', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--theme', 'dark']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('classDef');
    });

    test('respects forest theme option', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--theme', 'forest']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('classDef');
    });

    test('respects none theme option (no styling)', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--theme', 'none']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).not.toContain('classDef');
    });

    test('accepts short form -t for theme', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '-t', 'dark']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('classDef');
    });

    test('handles uppercase theme values', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--theme', 'DARK']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('classDef');
    });
  });

  describe('Flavor option', () => {
    test('uses auto flavor by default', async () => {
      await runCLI(['node', 'cli.ts', '[0-9]+']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('respects regexp flavor option', async () => {
      await runCLI(['node', 'cli.ts', '/[0-9]+/', '--flavor', 'regexp']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('respects pcre flavor option', async () => {
      await runCLI(['node', 'cli.ts', '/[0-9]+/', '--flavor', 'pcre']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('accepts short form -f for flavor', async () => {
      await runCLI(['node', 'cli.ts', '[0-9]+', '-f', 'regexp']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles uppercase flavor values', async () => {
      await runCLI(['node', 'cli.ts', '[0-9]+', '--flavor', 'REGEXP']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });
  });

  describe('Output option', () => {
    test('writes to stdout by default', async () => {
      await runCLI(['node', 'cli.ts', 'abc']);
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
    });

    test('writes to file when output option is provided', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '--output', testOutputFile]);
      expect(existsSync(testOutputFile)).toBe(true);
      const content = readFileSync(testOutputFile, 'utf-8');
      expect(content).toContain('graph LR');
      expect(content).toContain('abc');
    });

    test('accepts short form -o for output', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '-o', testOutputFile]);
      expect(existsSync(testOutputFile)).toBe(true);
      const content = readFileSync(testOutputFile, 'utf-8');
      expect(content).toContain('graph LR');
    });

    test('output file contains valid Mermaid syntax', async () => {
      await runCLI(['node', 'cli.ts', '[a-z]+', '-o', testOutputFile]);
      expect(existsSync(testOutputFile)).toBe(true);
      const content = readFileSync(testOutputFile, 'utf-8');
      expect(content).toContain('graph LR');
      expect(content).toContain('a-z');
    });
  });

  describe('Combined options', () => {
    test('handles multiple options together', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '-d', 'TD', '-t', 'dark', '-f', 'regexp']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph TD');
      expect(output).toContain('classDef');
    });

    test('handles all options with output file', async () => {
      await runCLI([
        'node',
        'cli.ts',
        '[0-9]+',
        '--direction',
        'TD',
        '--theme',
        'forest',
        '--flavor',
        'regexp',
        '--output',
        testOutputFile,
      ]);
      expect(existsSync(testOutputFile)).toBe(true);
      const content = readFileSync(testOutputFile, 'utf-8');
      expect(content).toContain('graph TD');
      expect(content).toContain('classDef');
    });

    test('short form and long form options can be mixed', async () => {
      await runCLI(['node', 'cli.ts', 'abc', '-d', 'TD', '--theme', 'dark', '-o', testOutputFile]);
      expect(existsSync(testOutputFile)).toBe(true);
      const content = readFileSync(testOutputFile, 'utf-8');
      expect(content).toContain('graph TD');
    });
  });

  describe('Edge cases', () => {
    test('handles empty alternation', async () => {
      await runCLI(['node', 'cli.ts', 'a|b|c']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles nested groups', async () => {
      await runCLI(['node', 'cli.ts', '((a)(b))']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('subgraph');
    });

    test('handles quantifiers', async () => {
      await runCLI(['node', 'cli.ts', 'a+b*c?']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles anchors', async () => {
      await runCLI(['node', 'cli.ts', '^abc$']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles special characters', async () => {
      await runCLI(['node', 'cli.ts', '\\d+\\.\\d+']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles lookahead assertions', async () => {
      await runCLI(['node', 'cli.ts', 'a(?=b)']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles lookbehind assertions', async () => {
      await runCLI(['node', 'cli.ts', '(?<=a)b']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles named capture groups', async () => {
      await runCLI(['node', 'cli.ts', '(?<name>[a-z]+)']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });
  });

  describe('Real-world patterns', () => {
    test('handles email-like pattern', async () => {
      await runCLI(['node', 'cli.ts', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles URL-like pattern', async () => {
      await runCLI(['node', 'cli.ts', 'https?://[^\\s/$.?#].[^\\s]*']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles phone number pattern', async () => {
      await runCLI(['node', 'cli.ts', '^\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}$']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });

    test('handles date pattern', async () => {
      await runCLI(['node', 'cli.ts', '\\d{4}-\\d{2}-\\d{2}']);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0]?.[0];
      expect(output).toBeDefined();
      expect(output).toContain('graph');
    });
  });
});
