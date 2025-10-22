import { buildStyles, type Theme } from './theme';
import type { DiagramData, DiagramNode, Direction, Edge, Group } from './types';

export function buildMermaidDiagram(
  data: DiagramData,
  direction: Direction = 'LR',
  theme: Theme = 'default',
  accessibleTitle?: string,
  accessibleDescription?: string,
): string {
  const nodeStr = buildNodes(data.nodes);
  const subgraphStr = buildSubgraphs(data.groups);
  const edgeStr = buildEdges(data.edges);
  const styleStr = buildStyles(theme, data);

  const accessibilityStr = buildAccessibility(accessibleTitle, accessibleDescription);

  const diagram = [
    accessibilityStr,
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
 * Add accessible title + description, if provided
 * @see https://docs.mermaidchart.com/mermaid-oss/config/accessibility.html
 */
export function buildAccessibility(title?: string, description?: string): string {
  const str = [
    title && `accTitle: "Regex: ${escapeString(title)}"`,
    description && `accDescr: "${escapeString(description)}"`,
  ]
    .filter(Boolean)
    .join('\n');

  return str ? `${str}\n` : '';
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
        group.number > 0 && `#${group.number}`,
        group.label,
        group.quantifier && `<i>${group.quantifier}</i>`,
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
export function addFrontMatter(diagram: string, theme: Theme): string {
  const frontmatter = ['none', 'default'].includes(theme)
    ? ''
    : `---
config:
  theme: ${theme}
---

`;

  const wrappedDiagram = `${frontmatter}${diagram}`;

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
