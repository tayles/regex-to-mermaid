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
    expect(data.nodes[0]?.label).toContain('Not');
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
