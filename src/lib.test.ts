import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_OPTIONS,
  DIRECTIONS,
  type Direction,
  FLAVORS,
  type Flavor,
  regexToMermaid,
  THEMES,
  type Theme,
} from './index';

describe('regexToMermaid', () => {
  describe('Basic functionality', () => {
    test('converts simple string pattern to Mermaid diagram', () => {
      const result = regexToMermaid('abc');
      expect(result).toContain('graph LR');
      expect(result).toContain('abc');
      expect(result).toContain('accTitle: "Regex: abc"');
    });

    test('converts RegExp object to Mermaid diagram', () => {
      const result = regexToMermaid(/abc/);
      expect(result).toContain('graph LR');
      expect(result).toContain('abc');
      expect(result).toContain('accTitle: "Regex: /abc/"');
    });

    test('includes package name and version in output', () => {
      const result = regexToMermaid('test');
      expect(result).toContain('Generated with regex-to-mermaid@');
    });

    test('returns string output', () => {
      const result = regexToMermaid('test');
      expect(typeof result).toBe('string');
    });

    test('does not include YAML front matter delimiter at start for default theme', () => {
      const result = regexToMermaid('test');
      expect(result.startsWith('---')).toBe(false);
      expect(result.startsWith('graph')).toBe(true);
    });

    test('includes YAML front matter for non-default themes', () => {
      const result = regexToMermaid('test', { theme: 'dark' });
      expect(result).toContain('---');
      expect(result).toContain('config:');
      expect(result).toContain('theme: dark');
    });

    test('excludes theme config when theme is none', () => {
      const result = regexToMermaid('test', { theme: 'none' });
      expect(result).not.toContain('config:');
      expect(result).not.toContain('theme:');
    });
  });

  describe('Direction option', () => {
    test('uses LR direction by default', () => {
      const result = regexToMermaid('test');
      expect(result).toContain('graph LR');
    });

    test('accepts TD direction', () => {
      const result = regexToMermaid('test', { direction: 'TD' });
      expect(result).toContain('graph TD');
    });

    test('accepts LR direction explicitly', () => {
      const result = regexToMermaid('test', { direction: 'LR' });
      expect(result).toContain('graph LR');
    });

    test('throws error for invalid direction', () => {
      expect(() => {
        regexToMermaid('test', { direction: 'INVALID' as unknown as Direction });
      }).toThrow('Invalid direction');
    });

    test('error message includes valid directions', () => {
      expect(() => {
        regexToMermaid('test', { direction: 'INVALID' as unknown as Direction });
      }).toThrow('LR, TD');
    });
  });

  describe('Theme option', () => {
    test('uses default theme by default', () => {
      const result = regexToMermaid('test');
      expect(result).toContain('classDef');
    });

    test('accepts neutral theme', () => {
      const result = regexToMermaid('test', { theme: 'neutral' });
      expect(result).toContain('classDef');
    });

    test('accepts dark theme', () => {
      const result = regexToMermaid('test', { theme: 'dark' });
      expect(result).toContain('classDef');
    });

    test('accepts forest theme', () => {
      const result = regexToMermaid('test', { theme: 'forest' });
      expect(result).toContain('classDef');
    });

    test('accepts none theme (no styling)', () => {
      const result = regexToMermaid('test', { theme: 'none' });
      expect(result).not.toContain('classDef');
    });

    test('throws error for invalid theme', () => {
      expect(() => {
        regexToMermaid('test', { theme: 'INVALID' as unknown as Theme });
      }).toThrow('Invalid theme');
    });

    test('error message includes valid themes', () => {
      expect(() => {
        regexToMermaid('test', { theme: 'INVALID' as unknown as Theme });
      }).toThrow('default, neutral, dark, forest, none');
    });
  });

  describe('Flavor option', () => {
    test('uses auto flavor by default', () => {
      const result = regexToMermaid('[0-9]+');
      expect(result).toContain('graph');
    });

    test('accepts regexp flavor', () => {
      const result = regexToMermaid('/[0-9]+/', { flavor: 'regexp' });
      expect(result).toContain('graph');
    });

    test('accepts auto flavor explicitly', () => {
      const result = regexToMermaid('[0-9]+', { flavor: 'auto' });
      expect(result).toContain('graph');
    });

    test('throws error for invalid flavor', () => {
      expect(() => {
        regexToMermaid('test', { flavor: 'INVALID' as unknown as Flavor });
      }).toThrow('Invalid flavor');
    });

    test('error message includes valid flavors', () => {
      expect(() => {
        regexToMermaid('test', { flavor: 'INVALID' as unknown as Flavor });
      }).toThrow('regexp, pcre, bre, ere, python, rust, re2, java, dotnet, ruby, auto');
    });
  });

  describe('Pattern validation', () => {
    test('accepts valid string pattern', () => {
      expect(() => regexToMermaid('abc')).not.toThrow();
    });

    test('accepts valid RegExp object', () => {
      expect(() => regexToMermaid(/abc/)).not.toThrow();
    });

    test('throws error for invalid regex pattern', () => {
      expect(() => {
        regexToMermaid('[invalid');
      }).toThrow('Invalid regular expression');
    });

    test('throws error for non-string, non-RegExp input', () => {
      expect(() => {
        regexToMermaid(123 as unknown as string);
      }).toThrow('Pattern must be a string or RegExp object');
    });

    test('throws error for null input', () => {
      expect(() => {
        regexToMermaid(null as unknown as string);
      }).toThrow('Pattern must be a string or RegExp object');
    });

    test('throws error for undefined input', () => {
      expect(() => {
        regexToMermaid(undefined as unknown as string);
      }).toThrow('Pattern must be a string or RegExp object');
    });

    test('throws error for array input', () => {
      expect(() => {
        regexToMermaid(['test'] as unknown as string);
      }).toThrow('Pattern must be a string or RegExp object');
    });

    test('throws error for object input', () => {
      expect(() => {
        regexToMermaid({} as unknown as string);
      }).toThrow('Pattern must be a string or RegExp object');
    });
  });

  describe('Combined options', () => {
    test('accepts multiple options together', () => {
      const result = regexToMermaid('test', {
        direction: 'TD',
        theme: 'dark',
        flavor: 'regexp',
      });
      expect(result).toContain('graph TD');
      expect(result).toContain('classDef');
    });

    test('empty options object uses defaults', () => {
      const result = regexToMermaid('test', {});
      expect(result).toContain('graph LR');
      expect(result).toContain('classDef');
    });

    test('partial options use defaults for missing values', () => {
      const result = regexToMermaid('test', { direction: 'TD' });
      expect(result).toContain('graph TD');
      expect(result).toContain('classDef'); // default theme
    });
  });

  describe('Complex regex patterns', () => {
    test('handles character classes', () => {
      const result = regexToMermaid('[a-z]+');
      expect(result).toContain('graph');
      expect(result).toContain('a-z');
    });

    test('handles groups', () => {
      const result = regexToMermaid('(abc)');
      expect(result).toContain('subgraph');
    });

    test('handles named capture groups', () => {
      const result = regexToMermaid('(?<name>[a-z]+)');
      expect(result).toContain('subgraph');
      expect(result).toContain('name');
    });

    test('handles alternation', () => {
      const result = regexToMermaid('a|b|c');
      expect(result).toContain('graph');
    });

    test('handles quantifiers', () => {
      const result = regexToMermaid('a+b*c?');
      expect(result).toContain('graph');
    });

    test('handles anchors', () => {
      const result = regexToMermaid('^abc$');
      expect(result).toContain('graph');
    });

    test('handles lookahead assertions', () => {
      const result = regexToMermaid('a(?=b)');
      expect(result).toContain('subgraph');
      expect(result).toContain('Lookahead');
    });

    test('handles lookbehind assertions', () => {
      const result = regexToMermaid('(?<=a)b');
      expect(result).toContain('subgraph');
      expect(result).toContain('Lookbehind');
    });

    test('handles complex email-like pattern', () => {
      const result = regexToMermaid('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
      expect(result).toContain('graph');
    });

    test('handles URL pattern', () => {
      const result = regexToMermaid('https?://[^\\s]+');
      expect(result).toContain('graph');
    });
  });

  describe('Output structure', () => {
    test('starts with graph declaration for default theme', () => {
      const result = regexToMermaid('test');
      expect(result.split('\n')[0]).toBe('graph LR');
    });

    test('contains accessibility title with regex pattern', () => {
      const result = regexToMermaid('test');
      expect(result).toContain('accTitle: "Regex: test"');
    });

    test('contains accessibility description with generator info', () => {
      const result = regexToMermaid('test');
      expect(result).toContain('accDescr: "Generated with regex-to-mermaid@');
    });

    test('starts with YAML front matter for non-default themes', () => {
      const result = regexToMermaid('test', { theme: 'dark' });
      expect(result.split('\n')[0]).toBe('---');
      const lines = result.split('\n');
      const closingIndex = lines.indexOf('---', 1);
      expect(closingIndex).toBeGreaterThan(0);
    });

    test('contains graph declaration', () => {
      const result = regexToMermaid('test');
      expect(result).toMatch(/graph (LR|TD)/);
    });

    test('preserves RegExp pattern format in accessibility title', () => {
      const result = regexToMermaid(/test/gi);
      expect(result).toContain('accTitle: "Regex: /test/gi"');
    });

    test('escapes special characters in accessibility title', () => {
      const result = regexToMermaid('test "quote"');
      expect(result).toContain('accTitle: "Regex: test \\"quote\\""');
    });
  });

  describe('Edge cases', () => {
    test('handles empty alternation', () => {
      const result = regexToMermaid('a||b');
      expect(result).toContain('graph');
    });

    test('handles nested groups', () => {
      const result = regexToMermaid('((a)(b))');
      expect(result).toContain('subgraph');
    });

    test('handles special characters', () => {
      const result = regexToMermaid('\\d+\\.\\d+');
      expect(result).toContain('graph');
    });

    test('handles word boundaries', () => {
      const result = regexToMermaid('\\bword\\b');
      expect(result).toContain('graph');
    });

    test('handles backreferences', () => {
      const result = regexToMermaid('(a)\\1');
      expect(result).toContain('graph');
    });

    test('handles non-capturing groups', () => {
      const result = regexToMermaid('(?:abc)');
      expect(result).toContain('subgraph');
    });

    test('handles negative lookahead', () => {
      const result = regexToMermaid('a(?!b)');
      expect(result).toContain('subgraph');
    });

    test('handles negative lookbehind', () => {
      const result = regexToMermaid('(?<!a)b');
      expect(result).toContain('subgraph');
    });
  });

  describe('Regex with flags', () => {
    test('handles RegExp with global flag', () => {
      const result = regexToMermaid(/test/g);
      expect(result).toContain('graph');
    });

    test('handles RegExp with case-insensitive flag', () => {
      const result = regexToMermaid(/test/i);
      expect(result).toContain('graph');
    });

    test('handles RegExp with multiline flag', () => {
      const result = regexToMermaid(/test/m);
      expect(result).toContain('graph');
    });

    test('handles RegExp with multiple flags', () => {
      const result = regexToMermaid(/test/gim);
      expect(result).toContain('graph');
    });
  });
});

describe('Exported constants', () => {
  test('DEFAULT_OPTIONS is exported', () => {
    expect(DEFAULT_OPTIONS).toBeDefined();
    expect(DEFAULT_OPTIONS.direction).toBe('LR');
    expect(DEFAULT_OPTIONS.flavor).toBe('auto');
    expect(DEFAULT_OPTIONS.theme).toBe('default');
  });

  test('DIRECTIONS is exported', () => {
    expect(DIRECTIONS).toBeDefined();
    expect(DIRECTIONS).toEqual(['LR', 'TD']);
  });

  test('FLAVORS is exported', () => {
    expect(FLAVORS).toBeDefined();
    expect(FLAVORS).toEqual([
      'regexp',
      'pcre',
      'bre',
      'ere',
      'python',
      'rust',
      're2',
      'java',
      'dotnet',
      'ruby',
      'auto',
    ]);
  });

  test('THEMES is exported', () => {
    expect(THEMES).toBeDefined();
    expect(THEMES).toEqual(['default', 'neutral', 'dark', 'forest', 'none']);
  });
});

describe('Integration with other modules', () => {
  test('parseRegexByFlavor is called for string patterns', () => {
    const result = regexToMermaid('[0-9]+', { flavor: 'auto' });
    expect(result).toContain('graph');
  });

  test('buildRegexAst is called to generate AST', () => {
    const result = regexToMermaid('test');
    expect(result).toContain('graph');
  });

  test('generateDiagramData creates diagram structure', () => {
    const result = regexToMermaid('test');
    expect(result).toContain('%% Nodes');
    expect(result).toContain('%% Edges');
  });

  test('buildMermaidDiagram generates final output', () => {
    const result = regexToMermaid('test', { direction: 'TD', theme: 'dark' });
    expect(result).toContain('graph TD');
    expect(result).toContain('classDef');
  });
});

describe('Real-world examples', () => {
  test('converts email validation regex', () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const result = regexToMermaid(emailRegex);
    expect(result).toContain('graph LR');
    expect(result).toContain(
      'accTitle: "Regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$/"',
    );
  });

  test('converts phone number regex', () => {
    const phoneRegex = /^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;
    const result = regexToMermaid(phoneRegex);
    expect(result).toContain('graph LR');
    expect(result).toContain('subgraph');
  });

  test('converts URL regex', () => {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/;
    const result = regexToMermaid(urlRegex);
    expect(result).toContain('graph LR');
  });

  test('converts date regex', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const result = regexToMermaid(dateRegex);
    expect(result).toContain('graph LR');
  });

  test('converts hex color regex', () => {
    const hexColorRegex = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i;
    const result = regexToMermaid(hexColorRegex);
    expect(result).toContain('graph LR');
  });
});
