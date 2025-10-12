import { buildStyles, type Theme } from './theme';
import type { DiagramData, DiagramNode, Direction, Edge, Group } from './types';

export function buildMermaidDiagram(
  data: DiagramData,
  direction: Direction = 'LR',
  theme: Theme = 'default',
): string {
  const diagram = `
%% Nodes
start@{ shape: f-circ };
fin@{ shape: f-circ };

${buildNodes(data.nodes)}

%% Subgraphs
${buildSubgraphs(data.groups)}

%% Edges
${buildEdges(data.edges)}

${buildStyles(theme, data)}
`;

  return `graph ${direction}${diagram
    .split('\n')
    // Indent all lines by two spaces for better formatting
    .map(line => `  ${line}`)
    .join('\n')}`;
}

export function buildNodes(nodes: DiagramNode[]): string {
  return nodes.map(node => `${node.id}("${node.label}"):::${node.type};`).join('\n');
}

export function buildSubgraphs(groups: Group[]): string {
  return groups
    .map(group => {
      const label = [
        `<small>#${group.number}</small>`,
        group.label,
        group.optional && '<small><i>Optional</i></small>',
      ]
        .filter(Boolean)
        .join(' ');

      return `subgraph ${group.id} ["${label}"]
  ${group.nodes.join('\n  ')}
end`;
    })
    .join('\n\n');
}

export function buildEdges(edges: Edge[]): string {
  return edges
    .map(edge => `${edge.from} --- ${edge.to}${edge.label ? `|${edge.label}|` : ''};`)
    .join('\n');
}
