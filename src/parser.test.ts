import { describe, expect, test } from 'bun:test';
import {
  buildFriendlyId,
  buildFriendlyLabel,
  buildRegexAst,
  generateDiagramData,
  parseJavaScriptRegex,
  parseRegexByFlavor,
} from './parser';

describe('parseJavaScriptRegex', () => {
  test('parses pattern without slashes as plain string', () => {
    const result = parseJavaScriptRegex('test');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe('test');
    expect(result.flags).toBe('');
  });

  test('parses regex literal with slashes', () => {
    const result = parseJavaScriptRegex('/test/');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe('test');
    expect(result.flags).toBe('');
  });

  test('parses regex literal with flags', () => {
    const result = parseJavaScriptRegex('/test/gi');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe('test');
    expect(result.flags).toBe('gi');
  });

  test('parses regex literal with single flag', () => {
    const result = parseJavaScriptRegex('/test/i');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe('test');
    expect(result.flags).toBe('i');
  });

  test('parses complex pattern with special characters', () => {
    const result = parseJavaScriptRegex('/^[a-z]+$/i');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe('^[a-z]+$');
    expect(result.flags).toBe('i');
  });

  test('parses pattern with escaped characters', () => {
    const result = parseJavaScriptRegex(String.raw`/\d+\.\d+/`);
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe(String.raw`\d+\.\d+`);
  });

  test('parses pattern with named groups', () => {
    const result = parseJavaScriptRegex('/(?<name>[a-z]+)/');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe('(?<name>[a-z]+)');
  });

  test('handles pattern with only opening slash', () => {
    const result = parseJavaScriptRegex('/test');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe(String.raw`\/test`); // Slash gets escaped when treated as plain string
  });

  test('throws error for invalid regex pattern', () => {
    expect(() => {
      parseJavaScriptRegex('(?<');
    }).toThrow();
  });

  test('throws error for invalid flags', () => {
    expect(() => {
      parseJavaScriptRegex('/test/xyz');
    }).toThrow();
  });

  test('parses pattern with alternation', () => {
    const result = parseJavaScriptRegex('/foo|bar|baz/');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe('foo|bar|baz');
  });

  test('parses pattern with lookahead', () => {
    const result = parseJavaScriptRegex('/test(?=ing)/');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe('test(?=ing)');
  });

  test('parses pattern with lookbehind', () => {
    const result = parseJavaScriptRegex(String.raw`/(?<=\$)\d+/`);
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe(String.raw`(?<=\$)\d+`);
  });
});

describe('parseRegexByFlavor', () => {
  describe('regexp flavor', () => {
    test('parses JavaScript RegExp pattern', () => {
      const result = parseRegexByFlavor('/test/i', 'regexp');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('test');
      expect(result.flags).toBe('i');
    });

    test('parses pattern without slashes', () => {
      const result = parseRegexByFlavor('test', 'regexp');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('test');
    });

    test('parses named capture groups', () => {
      const result = parseRegexByFlavor('(?<name>[a-z]+)', 'regexp');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('(?<name>[a-z]+)');
    });

    test('throws error for invalid JavaScript RegExp', () => {
      expect(() => {
        parseRegexByFlavor('(?<', 'regexp');
      }).toThrow();
    });
  });

  describe('pcre flavor', () => {
    test('converts PCRE pattern to JavaScript RegExp', () => {
      const result = parseRegexByFlavor('/test/i', 'pcre');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('test');
      expect(result.flags).toBe('i');
    });

    test('converts PCRE named groups to JavaScript', () => {
      const result = parseRegexByFlavor(String.raw`/(?P<name>\w+)/`, 'pcre');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe(String.raw`(\w+)`);
    });

    test('handles PCRE pattern with delimiter', () => {
      const result = parseRegexByFlavor('/(foo|bar)/', 'pcre');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('(foo|bar)');
    });

    test('handles PCRE with flags', () => {
      const result = parseRegexByFlavor('/^start.*end$/i', 'pcre');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('^start.*end$');
      expect(result.flags).toBe('i');
    });

    test('handles PCRE character classes', () => {
      const result = parseRegexByFlavor('/[a-z]+/', 'pcre');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('[a-z]+');
    });
  });

  describe('auto flavor', () => {
    test('parses valid JavaScript RegExp first', () => {
      const result = parseRegexByFlavor('/test/i', 'auto');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('test');
      expect(result.flags).toBe('i');
    });

    test('handles JavaScript named groups', () => {
      const result = parseRegexByFlavor('(?<name>[a-z]+)', 'auto');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('(?<name>[a-z]+)');
    });

    test('falls back to PCRE for PCRE-specific syntax', () => {
      // PCRE named groups: (?P<name>...) should fallback and get converted
      const result = parseRegexByFlavor(String.raw`/(?P<name>\w+)/`, 'auto');
      expect(result).toBeInstanceOf(RegExp);
      // PCRE converts named groups, so source will be different
      expect(result.source).toBe(String.raw`(\w+)`);
    });

    test('handles simple patterns without slashes', () => {
      const result = parseRegexByFlavor('test', 'auto');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('test');
    });

    test('handles complex JavaScript patterns', () => {
      const result = parseRegexByFlavor(
        String.raw`/^[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/`,
        'auto',
      );
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe(String.raw`^[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$`);
    });

    test('throws error when both JavaScript and PCRE parsing fail', () => {
      // This pattern should fail in both parsers
      expect(() => {
        parseRegexByFlavor('(?<', 'auto');
      }).toThrow();
    });

    test('successfully parses patterns that work in both', () => {
      const result = parseRegexByFlavor('/foo|bar/', 'auto');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('foo|bar');
    });

    test('prefers JavaScript RegExp over PCRE when both work', () => {
      // Simple pattern should use JavaScript RegExp (faster path)
      const result = parseRegexByFlavor('/test/', 'auto');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe('test');
    });
  });
});

describe('buildRegexAst', () => {
  test('parses a simple string pattern', () => {
    const ast = buildRegexAst(/hello/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
    expect(ast.pattern).toBeDefined();
  });

  test('parses a string pattern with special characters', () => {
    const ast = buildRegexAst(/^hello$/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
  });

  test('parses a pattern with character classes', () => {
    const ast = buildRegexAst(/[a-z]+/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
  });

  test('parses a pattern with groups', () => {
    const ast = buildRegexAst(/(hello)/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
  });

  test('parses a pattern with named capture groups', () => {
    const ast = buildRegexAst(/(?<name>hello)/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
  });

  test('parses a RegExp object', () => {
    const regex = /test/i;
    const ast = buildRegexAst(regex);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
    expect(ast.flags.raw).toBe('i');
  });

  test('parses complex URL regex pattern', () => {
    const pattern =
      /^(?<protocol>https?:\/\/)?(?<domain>[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?<path>\/.*)?$/;
    const ast = buildRegexAst(pattern);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
    expect(ast.pattern).toBeDefined();
    if (ast.pattern?.alternatives && ast.pattern.alternatives.length > 0) {
      expect(ast.pattern.alternatives[0]?.type).toBe('Alternative');
    }
  });

  test('parses pattern with quantifiers', () => {
    const ast = buildRegexAst(/a*b+c?d{2,3}/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
  });

  test('parses pattern with alternation', () => {
    const ast = buildRegexAst(/cat|dog/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
  });

  test('parses pattern with escaped characters', () => {
    const ast = buildRegexAst(/\d+\.\d+/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
  });

  test('parses empty pattern', () => {
    const ast = buildRegexAst(/(?:)/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExpLiteral');
  });

  test('throws error for invalid pattern', () => {
    expect(() => buildRegexAst('(?<')).toThrow();
  });

  test('preserves flags from RegExp object', () => {
    const regex = /test/gim;
    const ast = buildRegexAst(regex);
    expect(ast.flags.raw).toBe('gim');
  });
});

describe('generateDiagramData', () => {
  test('returns DiagramData structure', () => {
    const ast = buildRegexAst(/hello/);
    const data = generateDiagramData(ast);
    expect(data).toBeDefined();
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('edges');
    expect(data).toHaveProperty('groups');
  });

  test('returns arrays for nodes, edges, and groups', () => {
    const ast = buildRegexAst(/test/);
    const data = generateDiagramData(ast);
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
    expect(Array.isArray(data.groups)).toBe(true);
  });

  test('handles complex regex pattern', () => {
    const ast = buildRegexAst(/^(?<name>[a-z]+)@(?<domain>[a-z.]+)$/);
    const data = generateDiagramData(ast);
    expect(data).toBeDefined();
    expect(data.nodes).toBeDefined();
    expect(data.edges).toBeDefined();
    expect(data.groups).toBeDefined();
  });

  test('generates nodes and edges for simple pattern', () => {
    const ast = buildRegexAst(/test/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.edges.length).toBeGreaterThan(0);
    expect(data.nodes[0]?.label).toBe('test');
  });

  test('combines consecutive characters into single node', () => {
    const ast = buildRegexAst(/hello/);
    const data = generateDiagramData(ast);
    // Should create one node with "hello" instead of 5 separate char nodes
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toBe('hello');
    expect(data.nodes[0]?.type).toBe('literal');
  });

  test('handles character classes with friendly labels', () => {
    const ast = buildRegexAst(/[a-z]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toBe('Any lowercase');
    expect(data.nodes[0]?.type).toBe('char-class');
  });

  test('handles multiple character ranges', () => {
    const ast = buildRegexAst(/[a-zA-Z0-9]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toContain('Any lowercase');
    expect(data.nodes[0]?.label).toContain('Any uppercase');
    expect(data.nodes[0]?.label).toContain('Any digit');
  });

  test('handles quantifiers with descriptive text', () => {
    const ast = buildRegexAst(/a+/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toContain('One or more');
  });

  test('handles optional quantifier', () => {
    const ast = buildRegexAst(/a?/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toContain('Optional');
  });

  test('handles zero or more quantifier', () => {
    const ast = buildRegexAst(/a*/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toContain('Zero or more');
  });

  test('handles named capture groups', () => {
    const ast = buildRegexAst(/(?<name>[a-z]+)/);
    const data = generateDiagramData(ast);
    expect(data.groups.length).toBe(1);
    expect(data.groups[0]?.type).toBe('named-capture');
    expect(data.groups[0]?.label).toBe('#1 name');
    expect(data.groups[0]?.id).toBe('named_capture_1');
    expect(data.groups[0]?.number).toBe(1);
  });

  test('groups are numbered starting from 1', () => {
    const ast = buildRegexAst(/(a+)(b*)(c?)/);
    const data = generateDiagramData(ast);
    expect(data.groups.length).toBe(3);
    expect(data.groups[0]?.id).toBe('standard_1');
    expect(data.groups[0]?.number).toBe(1);
    expect(data.groups[1]?.id).toBe('standard_2');
    expect(data.groups[1]?.number).toBe(2);
    expect(data.groups[2]?.id).toBe('standard_3');
    expect(data.groups[2]?.number).toBe(3);
  });

  test('handles assertions with friendly labels', () => {
    const ast = buildRegexAst(/^test$/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(3); // ^, test, $
    expect(data.nodes[0]?.type).toBe('assertion');
    expect(data.nodes[0]?.label).toContain('Begins with');
    expect(data.nodes[2]?.type).toBe('assertion');
    expect(data.nodes[2]?.label).toContain('Ends with');
  });
});

describe('Character class label formatting', () => {
  test('displays single characters on one line', () => {
    const ast = buildRegexAst(/[abc]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.type).toBe('char-class');
    expect(data.nodes[0]?.label).toBe('a b c');
    // Should not contain <br>
    expect(data.nodes[0]?.label).not.toContain('<br>');
  });

  test('displays single characters with special chars on one line', () => {
    const ast = buildRegexAst(/[abc123!@#]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toBe('a b c 1 2 3 ! @ #');
  });

  test('displays ranges on separate lines from single chars', () => {
    const ast = buildRegexAst(/[a-z-=_]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    const label = data.nodes[0]?.label || '';
    // Single chars should be on first line
    expect(label).toContain('- = _');
    // Range should be on separate line
    expect(label).toContain('Any lowercase');
    // Should have line break between them
    expect(label).toContain('<br>');
  });

  test('handles multiple ranges with single chars', () => {
    const ast = buildRegexAst(/[a-zA-Z0-9@#$%]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    const label = data.nodes[0]?.label || '';
    // Single chars on first line
    expect(label).toContain('@ # $ %');
    // All ranges on separate lines
    expect(label).toContain('Any lowercase');
    expect(label).toContain('Any uppercase');
    expect(label).toContain('Any digit');
    // Multiple line breaks for multiple ranges
    const brCount = (label.match(/<br>/g) || []).length;
    expect(brCount).toBe(3); // 3 ranges
  });

  test('handles only ranges without single chars', () => {
    const ast = buildRegexAst(/[a-zA-Z]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    const label = data.nodes[0]?.label || '';
    expect(label).toContain('Any lowercase');
    expect(label).toContain('Any uppercase');
    expect(label).toContain('<br>');
  });

  test('handles character class with spaces and special chars', () => {
    const ast = buildRegexAst(/[a-z-=_. ?]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    const label = data.nodes[0]?.label || '';
    // Ranges first, then single chars on one line
    expect(label).toMatch(/^Any lowercase<br>- = _ \. Space \?/);
    expect(label).toContain('Any lowercase');
  });

  test('negated character class displays single chars on one line', () => {
    const ast = buildRegexAst(/[^abc]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.type).toBe('negated-char-class');
    expect(data.nodes[0]?.label).toBe('a b c');
  });

  test('negated character class with ranges separates correctly', () => {
    const ast = buildRegexAst(/[^a-z123]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    const label = data.nodes[0]?.label || '';
    expect(label).toContain('1 2 3');
    expect(label).toContain('Any lowercase');
    expect(label).toContain('<br>');
  });

  test('empty character class handled correctly', () => {
    // biome-ignore lint/correctness/noEmptyCharacterClassInRegex: edge case testing
    const ast = buildRegexAst(/[]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toBe('[]');
  });

  test('negated empty character class handled correctly', () => {
    // biome-ignore lint/correctness/noEmptyCharacterClassInRegex: edge case testing
    const ast = buildRegexAst(/[^]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toBe('[]');
  });

  test('handles custom ranges without friendly names', () => {
    const ast = buildRegexAst(/[!-/]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    const label = data.nodes[0]?.label || '';
    // Should show the range as-is since no friendly name exists
    expect(label).toBe('!-/');
  });

  test('mixes custom ranges with friendly ranges and single chars', () => {
    const ast = buildRegexAst(/[a-z!-/xyz]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    const label = data.nodes[0]?.label || '';
    // Single chars on first line
    expect(label).toContain('x y z');
    // Ranges on separate lines
    expect(label).toContain('Any lowercase');
    expect(label).toContain('!-/');
  });

  describe('CharacterSet nodes', () => {
    test('handles dot (.) character set', () => {
      const ast = buildRegexAst(/./);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.label).toBe('Any character');
    });

    test(String.raw`handles \d character set`, () => {
      const ast = buildRegexAst(/\d/);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toBe('char-set');
      expect(data.nodes[0]?.label).toBe('Any digit');
    });

    test(String.raw`handles \D character set`, () => {
      const ast = buildRegexAst(/\D/);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toBe('negated-char-set');
      expect(data.nodes[0]?.label).toBe('Not a digit');
    });

    test(String.raw`handles \w character set`, () => {
      const ast = buildRegexAst(/\w/);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toBe('char-set');
      expect(data.nodes[0]?.label).toBe('Any word character');
    });

    test(String.raw`handles \W character set`, () => {
      const ast = buildRegexAst(/\W/);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toBe('negated-char-set');
      expect(data.nodes[0]?.label).toBe('Not a word character');
    });

    test(String.raw`handles \s character set`, () => {
      const ast = buildRegexAst(/\s/);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toBe('char-set');
      expect(data.nodes[0]?.label).toBe('Any whitespace');
    });

    test(String.raw`handles \S character set`, () => {
      const ast = buildRegexAst(/\S/);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toBe('negated-char-set');
      expect(data.nodes[0]?.label).toBe('Not whitespace');
    });

    test('handles Unicode property escape', () => {
      const ast = buildRegexAst(/\p{Letter}/u);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toBe('char-set');
      expect(data.nodes[0]?.label).toBe('Letter');
    });

    test('handles negated Unicode property escape', () => {
      const ast = buildRegexAst(/\P{Letter}/u);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toBe('negated-char-set');
      expect(data.nodes[0]?.label).toBe('Not Letter');
    });

    test('handles Unicode property with value', () => {
      const ast = buildRegexAst(/\p{Script=Greek}/u);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.label).toBe('Script=Greek');
    });

    test('handles character sets in character class', () => {
      const ast = buildRegexAst(/[\d\w]/);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      const label = data.nodes[0]?.label || '';
      expect(label).toContain(String.raw`\d`);
      expect(label).toContain(String.raw`\w`);
    });
  });

  describe('Unicode sets mode (v flag)', () => {
    test('handles character class subtraction', () => {
      const ast = buildRegexAst(/[\w--[0-9]]/v);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      // Should have a node for the expression character class
      expect(data.nodes[0]?.type).toMatch(/char-class/);
    });

    test('handles character class intersection', () => {
      const ast = buildRegexAst(/[\w&&[a-z]]/v);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.type).toMatch(/char-class/);
    });

    test('handles string disjunction', () => {
      const ast = buildRegexAst(/[\q{abc|def}]/v);
      const data = generateDiagramData(ast);
      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.label).toContain('abc');
    });
  });
});

describe('buildFriendlyLabel', () => {
  test('returns literal text unchanged', () => {
    expect(buildFriendlyLabel('test')).toBe('test');
  });

  test('handles empty string', () => {
    expect(buildFriendlyLabel('')).toBe('');
  });

  test(String.raw`converts \d to friendly text`, () => {
    expect(buildFriendlyLabel(String.raw`\d`)).toBe('Any digit');
  });

  test(String.raw`converts \D to friendly text`, () => {
    expect(buildFriendlyLabel(String.raw`\D`)).toBe('Not a digit');
  });

  test(String.raw`converts \w to friendly text`, () => {
    expect(buildFriendlyLabel(String.raw`\w`)).toBe('Any word character');
  });

  test(String.raw`converts \W to friendly text`, () => {
    expect(buildFriendlyLabel(String.raw`\W`)).toBe('Not a word character');
  });

  test(String.raw`converts \s to friendly text`, () => {
    expect(buildFriendlyLabel(String.raw`\s`)).toBe('Any whitespace');
  });

  test(String.raw`converts \S to friendly text`, () => {
    expect(buildFriendlyLabel(String.raw`\S`)).toBe('Not whitespace');
  });

  test('converts . to friendly text', () => {
    expect(buildFriendlyLabel('.')).toBe('Any character');
  });

  test('handles unknown escape sequences', () => {
    expect(buildFriendlyLabel(String.raw`\x`)).toBe(String.raw`\x`);
  });

  test('handles literal text without type', () => {
    expect(buildFriendlyLabel('hello')).toBe('hello');
  });
});

describe('buildFriendlyId', () => {
  test('returns alphanumeric and underscore unchanged', () => {
    expect(buildFriendlyId('test_id')).toBe('test_id');
    expect(buildFriendlyId('test123')).toBe('test123');
  });

  test('handles empty string', () => {
    expect(buildFriendlyId('')).toBe('');
  });

  test('replaces hyphens with underscores', () => {
    expect(buildFriendlyId('node-1')).toBe('node_1');
    expect(buildFriendlyId('my-node-id')).toBe('my_node_id');
  });

  test('replaces special characters with underscores', () => {
    expect(buildFriendlyId('node#1')).toBe('node_1');
    expect(buildFriendlyId('test@node')).toBe('test_node');
    expect(buildFriendlyId('a.b.c')).toBe('a_b_c');
  });

  test('handles camelCase ids', () => {
    expect(buildFriendlyId('myNodeId')).toBe('myNodeId');
  });

  test('handles snake_case ids', () => {
    expect(buildFriendlyId('my_node_id')).toBe('my_node_id');
  });

  test('handles numeric ids', () => {
    expect(buildFriendlyId('123')).toBe('123');
  });
});

describe('Integration tests', () => {
  test('buildRegexAst output can be passed to generateDiagramData', () => {
    const ast = buildRegexAst(/^test$/);
    const data = generateDiagramData(ast);
    expect(data).toBeDefined();
    expect(data.nodes).toBeDefined();
    expect(data.edges).toBeDefined();
    expect(data.groups).toBeDefined();
  });

  test('handles complete workflow from regex to diagram data', () => {
    const pattern = /^(?<protocol>https?):\/\/(?<domain>[a-z]+)$/;
    const ast = buildRegexAst(pattern);
    expect(ast.type).toBe('RegExpLiteral');

    const data = generateDiagramData(ast);
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
    expect(Array.isArray(data.groups)).toBe(true);
    expect(data.groups.length).toBe(2);
    expect(data.groups[0]?.type).toBe('named-capture');
    expect(data.groups[0]?.id).toBe('named_capture_1');
    expect(data.groups[0]?.number).toBe(1);
    expect(data.groups[1]?.type).toBe('named-capture');
    expect(data.groups[1]?.id).toBe('named_capture_2');
    expect(data.groups[1]?.number).toBe(2);
  });

  test('handles various regex features together', () => {
    const pattern = /^[a-z]{2,5}(test)?(?:optional)$/i;
    const ast = buildRegexAst(pattern);
    expect(ast.type).toBe('RegExpLiteral');
    expect(ast.flags.raw).toBe('i');

    const data = generateDiagramData(ast);
    expect(data).toBeDefined();
    expect(data.nodes.length).toBeGreaterThan(0);
  });

  test('AST structure contains expected properties', () => {
    const ast = buildRegexAst(/abc/);
    expect(ast).toHaveProperty('type');
    expect(ast).toHaveProperty('pattern');
    expect(ast).toHaveProperty('flags');
  });

  test('handles email-like pattern', () => {
    const pattern = /^[a-z]+@[a-z]+\.[a-z]{2,}$/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.edges.length).toBeGreaterThan(0);

    // Check for character class nodes
    const charClassNodes = data.nodes.filter(n => n.type === 'char-class');
    expect(charClassNodes.length).toBeGreaterThan(0);
  });

  test('handles disjunction (alternation)', () => {
    const pattern = /cat|dog/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    expect(data.nodes.length).toBeGreaterThan(0);
    // Should have disjunction nodes
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBeGreaterThan(0);
  });

  test('combines multiple literal characters', () => {
    const pattern = /hello world/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should combine "hello" and " world" into nodes
    expect(data.nodes.length).toBeGreaterThanOrEqual(1);
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBeGreaterThan(0);
  });

  test('handles range quantifiers', () => {
    const pattern = /a{2,5}/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toContain('2 to 5');
  });

  test('handles exact quantifiers', () => {
    const pattern = /a{3}/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toContain('Exactly 3');
  });

  test('handles open-ended quantifiers', () => {
    const pattern = /a{2,}/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toContain('2 or more');
  });

  describe('Greedy quantifiers', () => {
    test('handles greedy quantifier (default)', () => {
      const pattern = /a+/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.label).toContain('One or more');
      // Greedy is default, so no special notation needed
    });

    test('handles non-greedy (lazy) quantifier', () => {
      const pattern = /a+?/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      expect(data.nodes.length).toBe(1);
      // Should still show quantifier text
      expect(data.nodes[0]?.label).toContain('One or more');
    });

    test('handles non-greedy star quantifier', () => {
      const pattern = /a*?/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.label).toContain('Zero or more');
    });

    test('handles non-greedy optional quantifier', () => {
      const pattern = /a??/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.label).toContain('Optional');
    });

    test('handles non-greedy range quantifier', () => {
      const pattern = /a{2,5}?/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      expect(data.nodes.length).toBe(1);
      expect(data.nodes[0]?.label).toContain('2 to 5');
    });
  });

  describe('Modifiers', () => {
    test('handles modifier flags in non-capturing group', () => {
      const pattern = /(?i:test)/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      // Should have a non-capturing group with modifier
      const group = data.groups.find(g => g.type === 'modifier');
      expect(group).toBeDefined();
      expect(group?.label).toContain('Modifiers:');
      expect(group?.label).toContain('+i');
    });

    test('handles multiple add modifiers', () => {
      const pattern = /(?ims:test)/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      const group = data.groups.find(g => g.type === 'modifier');
      expect(group).toBeDefined();
      expect(group?.label).toContain('+ims');
    });

    test('handles remove modifiers', () => {
      const pattern = /(?-i:test)/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      const group = data.groups.find(g => g.type === 'modifier');
      expect(group).toBeDefined();
      expect(group?.label).toContain('-i');
    });

    test('handles add and remove modifiers', () => {
      const pattern = /(?i-m:test)/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      const group = data.groups.find(g => g.type === 'modifier');
      expect(group).toBeDefined();
      expect(group?.label).toContain('+i');
      expect(group?.label).toContain('-m');
    });

    test('handles modifiers with complex content', () => {
      const pattern = /(?i:foo|bar)/;
      const ast = buildRegexAst(pattern);
      const data = generateDiagramData(ast);

      const group = data.groups.find(g => g.type === 'modifier');
      expect(group).toBeDefined();
      expect(group?.label).toContain('+i');
      // Should also have disjunction nodes for the alternatives
      expect(data.nodes.some(n => n.type === 'disjunction')).toBe(true);
    });
  });

  test('handles negated character classes', () => {
    const pattern = /[^a-z]/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.type).toBe('negated-char-class');
    expect(data.nodes[0]?.label).toBe('Any lowercase');
  });
});

describe('Flattening behavior', () => {
  test('flattens simple alternation with 3 branches', () => {
    const pattern = /foo|bar|baz/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have exactly 2 disjunction nodes (begin and end)
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Should have 3 literal nodes (foo, bar, baz)
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(3);
    expect(literalNodes[0]?.label).toBe('foo');
    expect(literalNodes[1]?.label).toBe('bar');
    expect(literalNodes[2]?.label).toBe('baz');

    // Each literal should connect from begin to end
    const beginNode = disjunctionNodes.find(n => n.id.includes('begin'));
    const endNode = disjunctionNodes.find(n => n.id.includes('end'));
    expect(beginNode).toBeDefined();
    expect(endNode).toBeDefined();

    // Should have edges from begin to each literal
    for (const literal of literalNodes) {
      const edgeToLiteral = data.edges.find(e => e.from === beginNode?.id && e.to === literal.id);
      expect(edgeToLiteral).toBeDefined();
    }

    // Should have edges from each literal to end
    for (const literal of literalNodes) {
      const edgeFromLiteral = data.edges.find(e => e.from === literal.id && e.to === endNode?.id);
      expect(edgeFromLiteral).toBeDefined();
    }
  });

  test('flattens alternation with many branches', () => {
    const pattern = /a|b|c|d|e|f|g/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have exactly 2 disjunction nodes (begin and end) - flat structure
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Should have 7 literal nodes
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(7);

    // Verify all literals are present
    const labels = literalNodes.map(n => n.label).sort();
    expect(labels).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  test('flattens single-character alternations', () => {
    const pattern = /x|y/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(2);
    expect(literalNodes[0]?.label).toBe('x');
    expect(literalNodes[1]?.label).toBe('y');
  });

  test('flattens alternation with complex branches', () => {
    const pattern = /hello|world|test/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have exactly 2 disjunction nodes
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Should have 3 literal nodes (combined chars)
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(3);
    expect(literalNodes[0]?.label).toBe('hello');
    expect(literalNodes[1]?.label).toBe('world');
    expect(literalNodes[2]?.label).toBe('test');
  });

  test('flattens alternation within groups', () => {
    const pattern = /(a|b|c)/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should still flatten the alternation inside the group
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Should have 1 group
    expect(data.groups.length).toBe(1);
    expect(data.groups[0]?.type).toBe('standard');

    // Should have 3 literal nodes
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(3);
  });

  test('flattens mixed alternation with quantifiers', () => {
    const pattern = /a+|b*|c?/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have exactly 2 disjunction nodes
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Should have 3 literal nodes with quantifiers
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(3);
    expect(literalNodes[0]?.label).toContain('One or more');
    expect(literalNodes[1]?.label).toContain('Zero or more');
    expect(literalNodes[2]?.label).toContain('Optional');
  });

  test('flattens alternation with character classes', () => {
    const pattern = /[a-z]|[0-9]|[A-Z]/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have exactly 2 disjunction nodes
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Should have 3 character class nodes
    const charClassNodes = data.nodes.filter(n => n.type === 'char-class');
    expect(charClassNodes.length).toBe(3);
    expect(charClassNodes[0]?.label).toContain('Any lowercase');
    expect(charClassNodes[1]?.label).toContain('Any digit');
    expect(charClassNodes[2]?.label).toContain('Any uppercase');
  });

  test('handles nested alternatives in complex patterns', () => {
    const pattern = /^(foo|bar|baz)$/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have assertions
    const assertionNodes = data.nodes.filter(n => n.type === 'assertion');
    expect(assertionNodes.length).toBe(2);

    // Should have flattened disjunction
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Should have 3 literals
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(3);
  });

  test('flattens empty alternatives correctly', () => {
    const pattern = /a||b/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should handle empty alternative branch
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Should have at least 2 literal nodes (a and b)
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Lookahead and lookbehind assertions', () => {
  test('positive lookahead creates subgraph with correct type and label', () => {
    const pattern = /test(?=ahead)/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have a positive lookahead group
    const lookaheadGroups = data.groups.filter(g => g.type === 'positive-lookahead');
    expect(lookaheadGroups.length).toBe(1);
    expect(lookaheadGroups[0]?.label).toBe('Positive Lookahead');

    // Should contain the lookahead content as a node
    expect(lookaheadGroups[0]?.children.length).toBeGreaterThan(0);

    // Should have literal nodes for both 'test' and 'ahead'
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(2);
  });

  test('negative lookahead creates subgraph with correct type and label', () => {
    const pattern = /test(?!negative)/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have a negative lookahead group
    const lookaheadGroups = data.groups.filter(g => g.type === 'negative-lookahead');
    expect(lookaheadGroups.length).toBe(1);
    expect(lookaheadGroups[0]?.label).toBe('Negative Lookahead');

    // Should contain the lookahead content
    expect(lookaheadGroups[0]?.children.length).toBeGreaterThan(0);

    // Should have literal nodes
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(2);
  });

  test('positive lookbehind creates subgraph with correct type and label', () => {
    const pattern = /(?<=before)test/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have a positive lookbehind group
    const lookbehindGroups = data.groups.filter(g => g.type === 'positive-lookbehind');
    expect(lookbehindGroups.length).toBe(1);
    expect(lookbehindGroups[0]?.label).toBe('Positive Lookbehind');

    // Should contain the lookbehind content
    expect(lookbehindGroups[0]?.children.length).toBeGreaterThan(0);

    // Should have literal nodes
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(2);
  });

  test('negative lookbehind creates subgraph with correct type and label', () => {
    const pattern = /(?<!notbefore)test/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have a negative lookbehind group
    const lookbehindGroups = data.groups.filter(g => g.type === 'negative-lookbehind');
    expect(lookbehindGroups.length).toBe(1);
    expect(lookbehindGroups[0]?.label).toBe('Negative Lookbehind');

    // Should contain the lookbehind content
    expect(lookbehindGroups[0]?.children.length).toBeGreaterThan(0);

    // Should have literal nodes
    const literalNodes = data.nodes.filter(n => n.type === 'literal');
    expect(literalNodes.length).toBe(2);
  });

  test('multiple lookahead/lookbehind assertions create separate subgraphs', () => {
    const pattern = /test(?=pos)(?!neg)(?<=back)(?<!notback)/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have all four types of groups
    expect(data.groups.filter(g => g.type === 'positive-lookahead').length).toBe(1);
    expect(data.groups.filter(g => g.type === 'negative-lookahead').length).toBe(1);
    expect(data.groups.filter(g => g.type === 'positive-lookbehind').length).toBe(1);
    expect(data.groups.filter(g => g.type === 'negative-lookbehind').length).toBe(1);

    // Total of 4 assertion groups
    expect(data.groups.length).toBe(4);
  });

  test('lookahead with complex content creates proper structure', () => {
    const pattern = /test(?=[a-z]+\d{2,4})/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have a positive lookahead group
    const lookaheadGroups = data.groups.filter(g => g.type === 'positive-lookahead');
    expect(lookaheadGroups.length).toBe(1);

    // Should contain at least one child
    expect(lookaheadGroups[0]?.children.length).toBeGreaterThanOrEqual(1);

    // Should have char-class nodes
    const charClassNodes = data.nodes.filter(n => n.type === 'char-class');
    expect(charClassNodes.length).toBeGreaterThan(0);
  });

  test('lookahead with alternation creates nested structure', () => {
    const pattern = /test(?=foo|bar|baz)/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have a positive lookahead group
    const lookaheadGroups = data.groups.filter(g => g.type === 'positive-lookahead');
    expect(lookaheadGroups.length).toBe(1);

    // Should have disjunction nodes inside the lookahead
    const disjunctionNodes = data.nodes.filter(n => n.type === 'disjunction');
    expect(disjunctionNodes.length).toBe(2);

    // Disjunction nodes should be children of the lookahead group
    const lookaheadChildren = lookaheadGroups[0]?.children || [];
    const disjunctionIds = disjunctionNodes.map(n => n.id);
    expect(disjunctionIds.some(id => lookaheadChildren.includes(id))).toBe(true);
  });

  test('lookbehind with group creates nested group structure', () => {
    const pattern = /(?<=(foo|bar))test/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have a positive lookbehind group
    const lookbehindGroups = data.groups.filter(g => g.type === 'positive-lookbehind');
    expect(lookbehindGroups.length).toBe(1);

    // Should also have a standard capturing group inside
    const standardGroups = data.groups.filter(g => g.type === 'standard');
    expect(standardGroups.length).toBe(1);

    // Total of 2 groups
    expect(data.groups.length).toBe(2);
  });

  test('lookahead assertions do not increment group numbers', () => {
    const pattern = /(before)(?=lookahead)(after)/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have 2 standard capture groups
    const standardGroups = data.groups.filter(g => g.type === 'standard');
    expect(standardGroups.length).toBe(2);

    // Groups should be numbered 1 and 2
    expect(standardGroups[0]?.number).toBe(1);
    expect(standardGroups[1]?.number).toBe(2);

    // Should have 1 lookahead group (not numbered)
    const lookaheadGroups = data.groups.filter(g => g.type === 'positive-lookahead');
    expect(lookaheadGroups.length).toBe(1);
    expect(lookaheadGroups[0]?.number).toBe(0);
  });

  test('empty lookahead creates group with no children', () => {
    const pattern = /test(?=)/;
    const ast = buildRegexAst(pattern);
    const data = generateDiagramData(ast);

    // Should have a positive lookahead group
    const lookaheadGroups = data.groups.filter(g => g.type === 'positive-lookahead');
    expect(lookaheadGroups.length).toBe(1);

    // Should have empty or minimal children
    expect(lookaheadGroups[0]?.children.length).toBeGreaterThanOrEqual(0);
  });
});
