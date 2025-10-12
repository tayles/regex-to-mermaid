import { buildStyles, type Theme } from './theme';
import type { DiagramData, DiagramNode, Direction, Edge, Group } from './types';

export function buildMermaidDiagram(
  data: DiagramData,
  direction: Direction = 'LR',
  theme: Theme = 'default',
): string {
  // Placeholder implementation
  return `graph ${direction}
    %% Nodes
    start@{ shape: f-circ, label: "Start" };
    fin@{ shape: f-circ, label: "End" };

${buildNodes(data.nodes)}

    %% Subgraphs
${buildSubgraphs(data.groups)}

    %% Edges
${buildEdges(data.edges)}

${buildStyles(theme, data)}
`;
}

export function buildNodes(nodes: DiagramNode[]): string {
  return `    ${nodes.map(node => `${node.id}("${node.label}"):::${node.type};`).join('\n    ')}`;
}

export function buildSubgraphs(groups: Group[]): string {
  return `    ${groups
    .map(
      group => `subgraph ${group.id} ["<small>#${group.number}</small> ${group.label} ${
        group.optional ? '<small><i>Optional</i></small>' : ''
      }"];
        ${group.nodes.join('\n        ')}
    end`,
    )
    .join('\n\n    ')}`;
}

export function buildEdges(edges: Edge[]): string {
  return `    ${edges
    .map(edge => `${edge.from} --- ${edge.to}${edge.label ? `|${edge.label}|` : ''};`)
    .join('\n    ')}`;
}
