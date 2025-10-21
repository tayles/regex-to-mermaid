import { buildStyles, type Theme } from './theme';
import type { DiagramData, DiagramNode, Direction, Edge, Group } from './types';

export function buildMermaidDiagram(
  data: DiagramData,
  direction: Direction = 'LR',
  theme: Theme = 'default',
  description?: string,
): string {
  const nodeStr = buildNodes(data.nodes);
  const subgraphStr = buildSubgraphs(data.groups);
  const edgeStr = buildEdges(data.edges);
  const styleStr = buildStyles(theme, data);

  const accessibleDescription = buildAccessibility(description);

  const diagram = [
    accessibleDescription,
    `%% Nodes
start@{ shape: f-circ };
fin@{ shape: f-circ };`,
    nodeStr && `${nodeStr}`,
    subgraphStr && `\n%% Subgraphs\n${subgraphStr}`,
    edgeStr && `\n%% Edges\n${edgeStr}`,
    styleStr && `\n%% Styles\n${styleStr}`,
  ]
    .filter(Boolean)
    .join('\n');

  const indentedDiagram = diagram
    .split('\n')
    // .filter(Boolean)
    // Indent all lines by two spaces for better formatting
    .map(line => (line ? `  ${line}` : ''))
    .join('\n');

  return `graph ${direction}\n${indentedDiagram}`;
}

/**
 * Add accessible description, if provided
 * @see https://docs.mermaidchart.com/mermaid-oss/config/accessibility.html
 */
export function buildAccessibility(description?: string): string {
  return description ? `accDescr: "${escapeString(description)}"\n` : '';
}

export function buildNodes(nodes: DiagramNode[]): string {
  return nodes
    .map(node => {
      const label = node.label ? `("${node.label}")` : '';
      const shape = node.type === 'disjunction' ? '@{ shape: f-circ }' : '';

      return `${node.id}${label}:::${node.type}${shape};`;
    })
    .join('\n');
}

export function buildSubgraphs(groups: Group[]): string {
  return groups
    .map(group => {
      const label = [
        group.number > 0 && `<small>#${group.number}</small>`,
        group.label,
        group.quantifier && `<small><i>${group.quantifier}</i></small>`,
      ]
        .filter(Boolean)
        .join(' ');

      return `subgraph ${group.id} ["${label}"]
  ${group.children.join('\n  ')}
end`;
    })
    .join('\n\n');
}

export function buildEdges(edges: Edge[]): string {
  return edges
    .map(edge => `${edge.from} --- ${edge.to}${edge.label ? `|${edge.label}|` : ''};`)
    .join('\n');
}

/**
 * Add YAML front matter to the Mermaid diagram
 * @see https://mermaid.js.org/config/configuration.html#frontmatter-config
 */
export function addFrontMatter(diagram: string, pattern: string | RegExp, theme: Theme): string {
  const escapedPattern = escapeString(pattern.toString());

  const configText = theme === 'none' ? '' : `config:\n  theme: "${theme}"`;

  const wrappedDiagram = `
---
title: "Regex: ${escapedPattern}"
${configText}
---

${diagram}
`.trim();

  return wrappedDiagram;
}

/**
 * Escape special characters, such as double quotes, newlines, and carriage returns
 */
export function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // Must escape backslashes first!
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
