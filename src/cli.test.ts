import { test, expect, describe, beforeEach, mock } from 'bun:test';
import { createCLI, processRegex, writeOutput, type CLIOptions } from './cli';

describe('createCLI', () => {
  test('creates a Commander program', () => {
    const program = createCLI();
    expect(program).toBeDefined();
    expect(program.name()).toBe('regex-to-mermaid');
  });

  test('has correct version', () => {
    const program = createCLI();
    expect(program.version()).toBe('1.0.0');
  });

  test('has description', () => {
    const program = createCLI();
    expect(program.description()).toContain('Convert regular expressions');
  });

  test('accepts regex argument', () => {
    const program = createCLI();
    const args = program.registeredArguments;
    expect(args.length).toBeGreaterThan(0);
    expect(args[0]?.name()).toBe('regex');
  });

  test('has output option', () => {
    const program = createCLI();
    const option = program.options.find(opt => opt.long === '--output');
    expect(option).toBeDefined();
    expect(option?.short).toBe('-o');
  });

  test('has direction option with default LR', () => {
    const program = createCLI();
    const option = program.options.find(opt => opt.long === '--direction');
    expect(option).toBeDefined();
    expect(option?.short).toBe('-d');
    expect(option?.defaultValue).toBe('LR');
  });

  test('has theme option with default "default"', () => {
    const program = createCLI();
    const option = program.options.find(opt => opt.long === '--theme');
    expect(option).toBeDefined();
    expect(option?.short).toBe('-t');
    expect(option?.defaultValue).toBe('default');
  });
});

describe('processRegex', () => {
  test('processes simple regex pattern', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
    expect(result).toContain('%% test');
  });

  test('processes regex with flags', () => {
    const result = processRegex('/test/i', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles TD direction', () => {
    const result = processRegex('test', { direction: 'TD', theme: 'default' });
    expect(result).toContain('graph TD');
  });

  test('handles LR direction', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
  });

  test('handles lowercase direction by converting to uppercase', () => {
    const result = processRegex('test', { direction: 'lr' as any, theme: 'default' });
    expect(result).toContain('graph LR');
  });

  test('throws error for invalid direction', () => {
    expect(() => {
      processRegex('test', { direction: 'INVALID' as any, theme: 'default' });
    }).toThrow('Invalid direction');
  });

  test('includes theme directive for default theme', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'default' });
    expect(result).toContain("%%{init: {'theme':'default'}}%%");
  });

  test('includes theme directive for neutral theme', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'neutral' });
    expect(result).toContain("%%{init: {'theme':'neutral'}}%%");
  });

  test('includes theme directive for dark theme', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'dark' });
    expect(result).toContain("%%{init: {'theme':'dark'}}%%");
  });

  test('includes theme directive for forest theme', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'forest' });
    expect(result).toContain("%%{init: {'theme':'forest'}}%%");
  });

  test('omits theme directive when theme is none', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'none' });
    expect(result).not.toContain("%%{init: {'theme':");
  });

  test('throws error for invalid theme', () => {
    expect(() => {
      processRegex('test', { direction: 'LR', theme: 'invalid' as any });
    }).toThrow('Invalid theme');
  });

  test('includes regex pattern as comment', () => {
    const result = processRegex('hello.*world', { direction: 'LR', theme: 'default' });
    expect(result).toContain('%% hello.*world');
  });

  test('processes complex regex pattern', () => {
    const result = processRegex('^[a-z]+@[a-z]+\\.[a-z]{2,}$', {
      direction: 'LR',
      theme: 'default',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles regex with character classes', () => {
    const result = processRegex('[a-zA-Z0-9]', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles regex with quantifiers', () => {
    const result = processRegex('a+b*c?', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles regex with groups', () => {
    const result = processRegex('(?<name>[a-z]+)', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('throws error for invalid regex', () => {
    expect(() => {
      processRegex('(?<', { direction: 'LR', theme: 'default' });
    }).toThrow('Invalid regular expression');
  });

  test('processes regex literal with slashes', () => {
    const result = processRegex('/^test$/', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('processes regex literal with flags', () => {
    const result = processRegex('/test/gi', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles escaped characters', () => {
    const result = processRegex('\\d+\\.\\d+', { direction: 'LR', theme: 'default' });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('result contains start and end nodes', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'none' });
    expect(result).toContain('start');
    expect(result).toContain('fin');
  });

  test('result contains mermaid diagram structure', () => {
    const result = processRegex('test', { direction: 'LR', theme: 'none' });
    expect(result).toContain('%% Nodes');
    expect(result).toContain('%% Edges');
  });
});

describe('writeOutput', () => {
  test('writes to stdout when no output path provided', () => {
    const content = 'test content';
    const consoleSpy = mock(() => {});
    const originalLog = console.log;
    console.log = consoleSpy;

    writeOutput(content);

    expect(consoleSpy).toHaveBeenCalledWith(content);
    console.log = originalLog;
  });

  test('writes to stdout with undefined output path', () => {
    const content = 'test content';
    const consoleSpy = mock(() => {});
    const originalLog = console.log;
    console.log = consoleSpy;

    writeOutput(content, undefined);

    expect(consoleSpy).toHaveBeenCalledWith(content);
    console.log = originalLog;
  });
});

describe('Integration tests', () => {
  test('processes complete workflow with all options', () => {
    const regex = '^(?<protocol>https?)://(?<domain>[a-z.]+)$';
    const options: CLIOptions = {
      output: undefined,
      direction: 'TD',
      theme: 'dark',
    };

    const result = processRegex(regex, options);

    expect(result).toContain('graph TD');
    expect(result).toContain("%%{init: {'theme':'dark'}}%%");
    expect(result).toContain(`%% ${regex}`);
    expect(result).toContain('start');
    expect(result).toContain('fin');
  });

  test('handles email regex pattern', () => {
    const regex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
    const result = processRegex(regex, { direction: 'LR', theme: 'neutral' });

    expect(result).toBeDefined();
    expect(result).toContain('graph LR');
    expect(result).toContain('neutral');
  });

  test('handles URL regex pattern', () => {
    const regex = '/^https?:\\/\\/[\\w\\-.]+(:[0-9]+)?(\\/.*)?$/';
    const result = processRegex(regex, { direction: 'LR', theme: 'forest' });

    expect(result).toBeDefined();
    expect(result).toContain('graph LR');
    expect(result).toContain('forest');
  });

  test('handles phone number pattern', () => {
    const regex = '^\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$';
    const result = processRegex(regex, { direction: 'TD', theme: 'default' });

    expect(result).toBeDefined();
    expect(result).toContain('graph TD');
  });

  test('all themes work correctly', () => {
    const regex = 'test';
    const themes: Array<'default' | 'neutral' | 'dark' | 'forest' | 'none'> = [
      'default',
      'neutral',
      'dark',
      'forest',
      'none',
    ];

    themes.forEach(theme => {
      const result = processRegex(regex, { direction: 'LR', theme });
      expect(result).toBeDefined();
      if (theme !== 'none') {
        expect(result).toContain(theme);
      }
    });
  });

  test('both directions work correctly', () => {
    const regex = 'test';
    const directions: Array<'TD' | 'LR'> = ['TD', 'LR'];

    directions.forEach(direction => {
      const result = processRegex(regex, { direction, theme: 'default' });
      expect(result).toContain(`graph ${direction}`);
    });
  });
});

describe('Edge cases', () => {
  test('handles empty character class', () => {
    const result = processRegex('[]', { direction: 'LR', theme: 'none' });
    expect(result).toBeDefined();
  });

  test('handles alternation', () => {
    const result = processRegex('cat|dog|bird', { direction: 'LR', theme: 'none' });
    expect(result).toBeDefined();
    expect(result).toContain('graph LR');
  });

  test('handles backreferences', () => {
    const result = processRegex('(\\w+)\\s\\1', { direction: 'LR', theme: 'none' });
    expect(result).toBeDefined();
  });

  test('handles lookahead', () => {
    const result = processRegex('test(?=ing)', { direction: 'LR', theme: 'none' });
    expect(result).toBeDefined();
  });

  test('handles lookbehind', () => {
    const result = processRegex('(?<=\\$)\\d+', { direction: 'LR', theme: 'none' });
    expect(result).toBeDefined();
  });

  test('handles word boundaries', () => {
    const result = processRegex('\\bword\\b', { direction: 'LR', theme: 'none' });
    expect(result).toBeDefined();
  });

  test('handles anchors', () => {
    const result = processRegex('^start.*end$', { direction: 'LR', theme: 'none' });
    expect(result).toBeDefined();
  });

  test('handles unicode characters', () => {
    const result = processRegex('[\\u0000-\\uFFFF]', { direction: 'LR', theme: 'none' });
    expect(result).toBeDefined();
  });
});
