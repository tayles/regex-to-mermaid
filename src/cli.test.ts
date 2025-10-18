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

  test('has flavor option with default "auto"', () => {
    const program = createCLI();
    const option = program.options.find(opt => opt.long === '--flavor');
    expect(option).toBeDefined();
    expect(option?.short).toBe('-f');
    expect(option?.defaultValue).toBe('auto');
  });
});

describe('processRegex', () => {
  test('processes simple regex pattern', () => {
    const result = processRegex('test', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toContain('%% Regex: test');
  });

  test('processes regex with flags', () => {
    const result = processRegex('/test/i', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles TD direction', () => {
    const result = processRegex('test', {
      direction: 'TD',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph TD');
  });

  test('handles LR direction', () => {
    const result = processRegex('test', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
  });

  test('handles lowercase direction by converting to uppercase', () => {
    const result = processRegex('test', {
      direction: 'lr' as any,
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
  });

  test('throws error for invalid direction', () => {
    expect(() => {
      processRegex('test', {
        direction: 'INVALID' as any,
        theme: 'default',
        flavor: 'auto',
      });
    }).toThrow('Invalid direction');
  });

  test('throws error for invalid theme', () => {
    expect(() => {
      processRegex('test', {
        direction: 'LR',
        theme: 'invalid' as any,
        flavor: 'auto',
      });
    }).toThrow('Invalid theme');
  });

  test('includes regex pattern as comment', () => {
    const result = processRegex('hello.*world', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('%% Regex: hello.*world');
  });

  test('includes generated with comment', () => {
    const result = processRegex('test', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('%% Generated with regex-to-mermaid@');
    expect(result).toMatch(/%% Generated with regex-to-mermaid@\d+\.\d+\.\d+/);
  });

  test('processes complex regex pattern', () => {
    const result = processRegex('^[a-z]+@[a-z]+\\.[a-z]{2,}$', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles regex with character classes', () => {
    const result = processRegex('[a-zA-Z0-9]', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles regex with quantifiers', () => {
    const result = processRegex('a+b*c?', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles regex with groups', () => {
    const result = processRegex('(?<name>[a-z]+)', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('throws error for invalid regex', () => {
    expect(() => {
      processRegex('(?<', {
        direction: 'LR',
        theme: 'default',
        flavor: 'auto',
      });
    }).toThrow('Invalid regular expression');
  });

  test('processes regex literal with slashes', () => {
    const result = processRegex('/^test$/', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('processes regex literal with flags', () => {
    const result = processRegex('/test/gi', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('handles escaped characters', () => {
    const result = processRegex('\\d+\\.\\d+', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('result contains start and end nodes', () => {
    const result = processRegex('test', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toContain('start');
    expect(result).toContain('fin');
  });

  test('result contains mermaid diagram structure', () => {
    const result = processRegex('test', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
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
      flavor: 'auto',
    };

    const result = processRegex(regex, options);

    expect(result).toContain('graph TD');
    expect(result).toContain(`%% Regex: ${regex}`);
    expect(result).toContain('%% Generated with regex-to-mermaid@');
    expect(result).toContain('start');
    expect(result).toContain('fin');
  });

  test('handles email regex pattern', () => {
    const regex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
    const result = processRegex(regex, {
      direction: 'LR',
      theme: 'neutral',
      flavor: 'auto',
    });

    expect(result).toBeDefined();
    expect(result).toContain('graph LR');
  });

  test('handles URL regex pattern', () => {
    const regex = '/^https?:\\/\\/[\\w\\-.]+(:[0-9]+)?(\\/.*)?$/';
    const result = processRegex(regex, {
      direction: 'LR',
      theme: 'forest',
      flavor: 'auto',
    });

    expect(result).toBeDefined();
    expect(result).toContain('graph LR');
  });

  test('handles phone number pattern', () => {
    const regex = '^\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$';
    const result = processRegex(regex, {
      direction: 'TD',
      theme: 'default',
      flavor: 'auto',
    });

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
      const result = processRegex(regex, {
        direction: 'LR',
        theme,
        flavor: 'auto',
      });
      expect(result).toBeDefined();
      expect(result).toContain('graph LR');
      if (theme === 'none') {
        expect(result).not.toContain('%% Node Styling');
      } else {
        expect(result).toContain('%% Node Styling');
      }
    });
  });

  test('both directions work correctly', () => {
    const regex = 'test';
    const directions: Array<'TD' | 'LR'> = ['TD', 'LR'];

    directions.forEach(direction => {
      const result = processRegex(regex, {
        direction,
        theme: 'default',
        flavor: 'auto',
      });
      expect(result).toContain(`graph ${direction}`);
    });
  });
});

describe('Edge cases', () => {
  test('handles empty character class', () => {
    const result = processRegex('[]', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toBeDefined();
  });

  test('handles alternation', () => {
    const result = processRegex('cat|dog|bird', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toBeDefined();
    expect(result).toContain('graph LR');
  });

  test('handles backreferences', () => {
    const result = processRegex('(\\w+)\\s\\1', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toBeDefined();
  });

  test('handles lookahead', () => {
    const result = processRegex('test(?=ing)', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toBeDefined();
  });

  test('handles lookbehind', () => {
    const result = processRegex('(?<=\\$)\\d+', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toBeDefined();
  });

  test('handles word boundaries', () => {
    const result = processRegex('\\bword\\b', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toBeDefined();
  });

  test('handles anchors', () => {
    const result = processRegex('^start.*end$', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toBeDefined();
  });

  test('handles unicode characters', () => {
    const result = processRegex('[\\u0000-\\uFFFF]', {
      direction: 'LR',
      theme: 'none',
      flavor: 'auto',
    });
    expect(result).toBeDefined();
  });
});

describe('Flavor option', () => {
  describe('regexp flavor', () => {
    test('processes JavaScript RegExp pattern', () => {
      const result = processRegex('/test/i', {
        direction: 'LR',
        theme: 'default',
        flavor: 'regexp',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('processes named capture groups', () => {
      const result = processRegex('(?<name>[a-z]+)', {
        direction: 'LR',
        theme: 'default',
        flavor: 'regexp',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('handles simple pattern without slashes', () => {
      const result = processRegex('test', {
        direction: 'LR',
        theme: 'default',
        flavor: 'regexp',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('throws error for invalid JavaScript RegExp', () => {
      expect(() => {
        processRegex('(?<', {
          direction: 'LR',
          theme: 'default',
          flavor: 'regexp',
        });
      }).toThrow('Invalid regular expression');
    });
  });

  describe('pcre flavor', () => {
    test('converts PCRE pattern to JavaScript RegExp', () => {
      const result = processRegex('/test/i', {
        direction: 'LR',
        theme: 'default',
        flavor: 'pcre',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('converts PCRE named groups to JavaScript', () => {
      const result = processRegex('/(?P<name>\\w+)/', {
        direction: 'LR',
        theme: 'default',
        flavor: 'pcre',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('handles PCRE pattern with delimiter', () => {
      const result = processRegex('/(foo|bar)/', {
        direction: 'LR',
        theme: 'default',
        flavor: 'pcre',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('handles PCRE with flags', () => {
      const result = processRegex('/^start.*end$/i', {
        direction: 'LR',
        theme: 'default',
        flavor: 'pcre',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });
  });

  describe('auto flavor (default)', () => {
    test('parses valid JavaScript RegExp first', () => {
      const result = processRegex('/test/i', {
        direction: 'LR',
        theme: 'default',
        flavor: 'auto',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('handles JavaScript named groups', () => {
      const result = processRegex('(?<name>[a-z]+)', {
        direction: 'LR',
        theme: 'default',
        flavor: 'auto',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('falls back to PCRE for PCRE-specific syntax', () => {
      // This uses PCRE named group syntax which differs from JavaScript
      const result = processRegex('/(?P<name>\\w+)/', {
        direction: 'LR',
        theme: 'default',
        flavor: 'auto',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('handles simple patterns without slashes', () => {
      const result = processRegex('test', {
        direction: 'LR',
        theme: 'default',
        flavor: 'auto',
      });
      expect(result).toContain('graph LR');
      expect(result).toBeDefined();
    });

    test('throws error when both JavaScript and PCRE parsing fail', () => {
      // This pattern should fail in both parsers
      expect(() => {
        processRegex('(?<', {
          direction: 'LR',
          theme: 'default',
          flavor: 'auto',
        });
      }).toThrow('Invalid regular expression');
    });
  });

  test('throws error for invalid flavor', () => {
    expect(() => {
      processRegex('test', {
        direction: 'LR',
        theme: 'default',
        flavor: 'invalid' as any,
      });
    }).toThrow('Invalid flavor');
  });

  test('validates flavor is case-insensitive', () => {
    const result = processRegex('test', {
      direction: 'LR',
      theme: 'default',
      flavor: 'REGEXP' as any,
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });

  test('auto flavor successfully falls back to PCRE', () => {
    // PCRE pattern that would fail in JavaScript but works in PCRE
    const result = processRegex('/(?P<email>\\w+@\\w+\\.\\w+)/', {
      direction: 'LR',
      theme: 'default',
      flavor: 'auto',
    });
    expect(result).toContain('graph LR');
    expect(result).toBeDefined();
  });
});
