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

  test('returns empty arrays for placeholder implementation', () => {
    const ast = buildRegexAst(/test/);
    const data = generateDiagramData(ast);
    // Current placeholder implementation returns empty arrays
    expect(data.nodes.length).toBe(0);
    expect(data.edges.length).toBe(0);
    expect(data.groups.length).toBe(0);
  });
});

describe('buildFriendlyLabel', () => {
  test('returns the input label unchanged (placeholder)', () => {
    expect(buildFriendlyLabel('test')).toBe('test');
  });

  test('handles empty string', () => {
    expect(buildFriendlyLabel('')).toBe('');
  });

  test('handles special characters', () => {
    expect(buildFriendlyLabel('a-z')).toBe('a-z');
  });

  test('handles long strings', () => {
    const longLabel = 'a'.repeat(100);
    expect(buildFriendlyLabel(longLabel)).toBe(longLabel);
  });

  test('handles unicode characters', () => {
    expect(buildFriendlyLabel('hello 世界')).toBe('hello 世界');
  });

  test('handles regex special characters', () => {
    expect(buildFriendlyLabel('^$.*+?')).toBe('^$.*+?');
  });
});

describe('buildFriendlyId', () => {
  test('returns the input id unchanged', () => {
    expect(buildFriendlyId('test_id')).toBe('test_id');
  });

  test('handles empty string', () => {
    expect(buildFriendlyId('')).toBe('');
  });

  test('handles ids with special characters', () => {
    expect(buildFriendlyId('node-1')).toBe('node-1');
    expect(buildFriendlyId('node_1')).toBe('node_1');
  });

  test('handles numeric ids', () => {
    expect(buildFriendlyId('123')).toBe('123');
  });

  test('handles camelCase ids', () => {
    expect(buildFriendlyId('myNodeId')).toBe('myNodeId');
  });

  test('handles snake_case ids', () => {
    expect(buildFriendlyId('my_node_id')).toBe('my_node_id');
  });

  test('handles kebab-case ids', () => {
    expect(buildFriendlyId('my-node-id')).toBe('my-node-id');
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
  });

  test('handles various regex features together', () => {
    const pattern = /^[a-z]{2,5}(test)?(?:optional)$/i;
    const ast = buildRegexAst(pattern);
    expect(ast.type).toBe('RegExp');
    expect(ast.flags).toBe('i');

    const data = generateDiagramData(ast);
    expect(data).toBeDefined();
  });

  test('AST structure contains expected properties', () => {
    const ast = buildRegexAst(/abc/);
    expect(ast).toHaveProperty('type');
    expect(ast).toHaveProperty('body');
    expect(ast).toHaveProperty('flags');
  });
});
