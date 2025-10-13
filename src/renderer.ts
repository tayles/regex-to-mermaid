import { buildStyles, type Theme } from './theme';
import type { DiagramData, DiagramNode, Direction, Edge, Group } from './types';

export function buildMermaidDiagram(
  data: DiagramData,
  direction: Direction = 'LR',
  theme: Theme = 'default',
): string {
  const nodeStr = buildNodes(data.nodes);
  const subgraphStr = buildSubgraphs(data.groups);
  const edgeStr = buildEdges(data.edges);
  const styleStr = buildStyles(theme, data);

  const diagram = [
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
