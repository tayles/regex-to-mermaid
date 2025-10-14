import { test, expect, describe } from 'bun:test';
import { buildRegexAst, generateDiagramData, buildFriendlyLabel, buildFriendlyId } from './parser';

describe('buildRegexAst', () => {
  test('parses a simple string pattern', () => {
    const ast = buildRegexAst(/hello/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
    expect(ast.body).toBeDefined();
  });

  test('parses a string pattern with special characters', () => {
    const ast = buildRegexAst(/^hello$/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
  });

  test('parses a pattern with character classes', () => {
    const ast = buildRegexAst(/[a-z]+/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
  });

  test('parses a pattern with groups', () => {
    const ast = buildRegexAst(/(hello)/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
  });

  test('parses a pattern with named capture groups', () => {
    const ast = buildRegexAst(/(?<name>hello)/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
  });

  test('parses a RegExp object', () => {
    const regex = /test/i;
    const ast = buildRegexAst(regex);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
    expect(ast.flags).toBe('i');
  });

  test('parses complex URL regex pattern', () => {
    const pattern =
      /^(?<protocol>https?:\/\/)?(?<domain>[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?<path>\/.*)?$/;
    const ast = buildRegexAst(pattern);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
    expect(ast.body).toBeDefined();
    if (ast.body) {
      expect(ast.body.type).toBe('Alternative');
    }
  });

  test('parses pattern with quantifiers', () => {
    const ast = buildRegexAst(/a*b+c?d{2,3}/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
  });

  test('parses pattern with alternation', () => {
    const ast = buildRegexAst(/cat|dog/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
  });

  test('parses pattern with escaped characters', () => {
    const ast = buildRegexAst(/\d+\.\d+/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
  });

  test('parses empty pattern', () => {
    const ast = buildRegexAst(/(?:)/);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('RegExp');
  });

  test('throws error for invalid pattern', () => {
    expect(() => buildRegexAst('(?<')).toThrow();
  });

  test('preserves flags from RegExp object', () => {
    const regex = /test/gim;
    const ast = buildRegexAst(regex);
    expect(ast.flags).toBe('gim');
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
    expect(data.groups[0]?.label).toBe('name');
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
    const ast = buildRegexAst(/[]/);
    const data = generateDiagramData(ast);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0]?.label).toBe('[]');
  });

  test('negated empty character class handled correctly', () => {
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
});

describe('buildFriendlyLabel', () => {
  test('returns literal text unchanged for literal type', () => {
    expect(buildFriendlyLabel('test', 'literal')).toBe('test');
  });

  test('handles empty string', () => {
    expect(buildFriendlyLabel('')).toBe('');
  });

  test('converts \\d to friendly text', () => {
    expect(buildFriendlyLabel('\\d')).toBe('Any digit');
  });

  test('converts \\D to friendly text', () => {
    expect(buildFriendlyLabel('\\D')).toBe('Not a digit');
  });

  test('converts \\w to friendly text', () => {
    expect(buildFriendlyLabel('\\w')).toBe('Any word character');
  });

  test('converts \\W to friendly text', () => {
    expect(buildFriendlyLabel('\\W')).toBe('Not a word character');
  });

  test('converts \\s to friendly text', () => {
    expect(buildFriendlyLabel('\\s')).toBe('Any whitespace');
  });

  test('converts \\S to friendly text', () => {
    expect(buildFriendlyLabel('\\S')).toBe('Not whitespace');
  });

  test('converts . to friendly text', () => {
    expect(buildFriendlyLabel('.')).toBe('Any character');
  });

  test('handles unknown escape sequences', () => {
    expect(buildFriendlyLabel('\\x')).toBe('\\x');
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
    expect(ast.type).toBe('RegExp');

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
    expect(ast.type).toBe('RegExp');
    expect(ast.flags).toBe('i');

    const data = generateDiagramData(ast);
    expect(data).toBeDefined();
    expect(data.nodes.length).toBeGreaterThan(0);
  });

  test('AST structure contains expected properties', () => {
    const ast = buildRegexAst(/abc/);
    expect(ast).toHaveProperty('type');
    expect(ast).toHaveProperty('body');
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
    literalNodes.forEach(literal => {
      const edgeToLiteral = data.edges.find(e => e.from === beginNode?.id && e.to === literal.id);
      expect(edgeToLiteral).toBeDefined();
    });

    // Should have edges from each literal to end
    literalNodes.forEach(literal => {
      const edgeFromLiteral = data.edges.find(e => e.from === literal.id && e.to === endNode?.id);
      expect(edgeFromLiteral).toBeDefined();
    });
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

    // Should contain multiple children (char class and literal with quantifiers)
    expect(lookaheadGroups[0]?.children.length).toBeGreaterThanOrEqual(2);

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
