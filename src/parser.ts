import regexpTree from 'regexp-tree';
import type { DiagramData } from './types';
import type { AstRegExp } from 'regexp-tree/ast';

export function buildRegexAst(pattern: string | RegExp) {
  const ast = regexpTree.parse(pattern, {
    // captureLocations: true,
  });
  return ast;
}

export function generateDiagramData(ast: AstRegExp): DiagramData {
  // Placeholder implementation
  return {
    nodes: [],
    edges: [],
    groups: [],
  };
}

export function buildFriendlyLabel(label: string): string {
  // Placeholder implementation
  return label;
}

export function buildFriendlyId(id: string): string {
  return id;
}
