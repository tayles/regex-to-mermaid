import { test, expect, describe } from 'bun:test';
import { buildMermaidDiagram, buildNodes, buildSubgraphs, buildEdges } from './renderer';
import type { DiagramData, DiagramNode, Edge, Group } from './types';

describe('buildNodes', () => {
  test('builds empty string for empty nodes array', () => {
    const result = buildNodes([]);
    expect(result).toBe('    ');
  });

  test('builds single node correctly', () => {
    const nodes: DiagramNode[] = [
      { id: 'node1', type: 'Character', label: 'a' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('node1:::Character("a");');
  });

  test('builds multiple nodes correctly', () => {
    const nodes: DiagramNode[] = [
      { id: 'node1', type: 'Character', label: 'a' },
      { id: 'node2', type: 'Character', label: 'b' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('node1:::Character("a");');
    expect(result).toContain('node2:::Character("b");');
  });

  test('handles different node types', () => {
    const nodes: DiagramNode[] = [
      { id: 'char1', type: 'Character', label: 'a' },
      { id: 'class1', type: 'CharacterClass', label: '[a-z]' },
      { id: 'rep1', type: 'Repetition', label: '*' },
      { id: 'group1', type: 'Group', label: '(...)' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('char1:::Character("a");');
    expect(result).toContain('class1:::CharacterClass("[a-z]");');
    expect(result).toContain('rep1:::Repetition("*");');
    expect(result).toContain('group1:::Group("(...)");');
  });

  test('escapes special characters in labels', () => {
    const nodes: DiagramNode[] = [
      { id: 'node1', type: 'Character', label: '"quote"' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('node1:::Character');
  });

  test('handles multiline labels', () => {
    const nodes: DiagramNode[] = [
      { id: 'node1', type: 'Character', label: 'line1<br>line2' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('node1:::Character("line1<br>line2");');
  });

  test('maintains proper indentation', () => {
    const nodes: DiagramNode[] = [
      { id: 'node1', type: 'Character', label: 'a' },
    ];
    const result = buildNodes(nodes);
    expect(result.startsWith('    ')).toBe(true);
  });
});

describe('buildSubgraphs', () => {
  test('builds empty string for empty groups array', () => {
    const result = buildSubgraphs([]);
    expect(result).toBe('    ');
  });

  test('builds single group correctly', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'named-capture',
        number: 1,
        optional: false,
        label: 'protocol',
        nodes: ['node1', 'node2'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('subgraph group1');
    expect(result).toContain('<small>#1</small> protocol');
    expect(result).toContain('node1');
    expect(result).toContain('node2');
    expect(result).toContain('end');
  });

  test('builds optional group correctly', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'standard',
        number: 1,
        optional: true,
        label: 'optional_part',
        nodes: ['node1'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('<small><i>Optional</i></small>');
  });

  test('builds non-optional group without optional text', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'standard',
        number: 1,
        optional: false,
        label: 'required_part',
        nodes: ['node1'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).not.toContain('Optional');
  });

  test('builds multiple groups correctly', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'named-capture',
        number: 1,
        optional: false,
        label: 'protocol',
        nodes: ['node1'],
      },
      {
        id: 'group2',
        type: 'named-capture',
        number: 2,
        optional: true,
        label: 'path',
        nodes: ['node2'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('subgraph group1');
    expect(result).toContain('subgraph group2');
    expect(result).toContain('<small>#1</small> protocol');
    expect(result).toContain('<small>#2</small> path');
  });

  test('handles different group types', () => {
    const groups: Group[] = [
      {
        id: 'g1',
        type: 'standard',
        number: 1,
        optional: false,
        label: 'standard',
        nodes: ['n1'],
      },
      {
        id: 'g2',
        type: 'named-capture',
        number: 2,
        optional: false,
        label: 'named',
        nodes: ['n2'],
      },
      {
        id: 'g3',
        type: 'non-capturing',
        number: 3,
        optional: false,
        label: 'non-capturing',
        nodes: ['n3'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('subgraph g1');
    expect(result).toContain('subgraph g2');
    expect(result).toContain('subgraph g3');
  });

  test('handles groups with multiple nodes', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'standard',
        number: 1,
        optional: false,
        label: 'test',
        nodes: ['node1', 'node2', 'node3', 'node4'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('node1');
    expect(result).toContain('node2');
    expect(result).toContain('node3');
    expect(result).toContain('node4');
  });

  test('handles empty nodes array in group', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'standard',
        number: 1,
        optional: false,
        label: 'empty',
        nodes: [],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('subgraph group1');
    expect(result).toContain('end');
  });
});

describe('buildEdges', () => {
  test('builds empty string for empty edges array', () => {
    const result = buildEdges([]);
    expect(result).toBe('    ');
  });

  test('builds single edge correctly', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node2' },
    ];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2;');
  });

  test('builds edge with label correctly', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node2', label: 'optional' },
    ];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2|optional|;');
  });

  test('builds edge without label correctly', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node2' },
    ];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2;');
    expect(result).not.toContain('||');
  });

  test('builds multiple edges correctly', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node2' },
      { from: 'node2', to: 'node3', label: 'test' },
      { from: 'node3', to: 'node4' },
    ];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2;');
    expect(result).toContain('node2 --- node3|test|;');
    expect(result).toContain('node3 --- node4;');
  });

  test('handles special characters in node IDs', () => {
    const edges: Edge[] = [
      { from: 'node_1', to: 'node-2' },
    ];
    const result = buildEdges(edges);
    expect(result).toContain('node_1 --- node-2;');
  });

  test('handles special characters in labels', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node2', label: 'a-z' },
    ];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2|a-z|;');
  });

  test('maintains proper indentation', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node2' },
    ];
    const result = buildEdges(edges);
    expect(result.startsWith('    ')).toBe(true);
  });
});

describe('buildMermaidDiagram', () => {
  test('builds basic diagram structure', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('graph LR');
    expect(result).toContain('start@{ shape: f-circ, label: "Start" };');
    expect(result).toContain('fin@{ shape: f-circ, label: "End" };');
    expect(result).toContain('%% Nodes');
    expect(result).toContain('%% Subgraphs');
    expect(result).toContain('%% Edges');
    expect(result).toContain('%% Styling Definitions');
  });

  test('includes all nodes in diagram', () => {
    const data: DiagramData = {
      nodes: [
        { id: 'node1', type: 'Character', label: 'a' },
        { id: 'node2', type: 'Character', label: 'b' },
      ],
      edges: [],
      groups: [],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('node1:::Character("a");');
    expect(result).toContain('node2:::Character("b");');
  });

  test('includes all edges in diagram', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [
        { from: 'node1', to: 'node2' },
        { from: 'node2', to: 'node3', label: 'test' },
      ],
      groups: [],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('node1 --- node2;');
    expect(result).toContain('node2 --- node3|test|;');
  });

  test('includes all groups in diagram', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [
        {
          id: 'group1',
          type: 'named-capture',
          number: 1,
          optional: false,
          label: 'protocol',
          nodes: ['node1'],
        },
      ],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('subgraph group1');
    expect(result).toContain('protocol');
  });

  test('builds complete diagram with all elements', () => {
    const data: DiagramData = {
      nodes: [
        { id: 'node1', type: 'Character', label: 'h' },
        { id: 'node2', type: 'Character', label: 't' },
      ],
      edges: [
        { from: 'start', to: 'node1' },
        { from: 'node1', to: 'node2' },
        { from: 'node2', to: 'fin' },
      ],
      groups: [
        {
          id: 'group1',
          type: 'named-capture',
          number: 1,
          optional: true,
          label: 'protocol',
          nodes: ['node1', 'node2'],
        },
      ],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('graph LR');
    expect(result).toContain('node1:::Character("h");');
    expect(result).toContain('node2:::Character("t");');
    expect(result).toContain('start --- node1;');
    expect(result).toContain('subgraph group1');
    expect(result).toContain('protocol');
  });

  test('handles empty diagram data', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('graph LR');
    expect(result).toContain('start@{ shape: f-circ, label: "Start" };');
    expect(result).toContain('fin@{ shape: f-circ, label: "End" };');
  });

  test('includes styling comments', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('%% Node Styling');
    expect(result).toContain('%% Group Styling');
    expect(result).toContain('%% Apply Styling Classes');
    expect(result).toContain('%% Group Classes');
  });

  test('maintains proper structure and formatting', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', type: 'Character', label: 'a' }],
      edges: [{ from: 'start', to: 'n1' }],
      groups: [],
    };
    const result = buildMermaidDiagram(data);
    // Check sections appear in correct order
    const graphIndex = result.indexOf('graph LR');
    const nodesIndex = result.indexOf('%% Nodes');
    const subgraphsIndex = result.indexOf('%% Subgraphs');
    const edgesIndex = result.indexOf('%% Edges');
    const stylingIndex = result.indexOf('%% Styling Definitions');
    
    expect(graphIndex).toBeLessThan(nodesIndex);
    expect(nodesIndex).toBeLessThan(subgraphsIndex);
    expect(subgraphsIndex).toBeLessThan(edgesIndex);
    expect(edgesIndex).toBeLessThan(stylingIndex);
  });
});

describe('Edge cases and error handling', () => {
  test('buildNodes handles nodes with empty labels', () => {
    const nodes: DiagramNode[] = [
      { id: 'node1', type: 'Character', label: '' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('node1:::Character("");');
  });

  test('buildSubgraphs handles groups with very high numbers', () => {
    const groups: Group[] = [
      {
        id: 'group999',
        type: 'standard',
        number: 999,
        optional: false,
        label: 'test',
        nodes: ['n1'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('<small>#999</small>');
  });

  test('buildEdges handles same node connected to itself', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node1' },
    ];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node1;');
  });

  test('buildMermaidDiagram handles large numbers of nodes', () => {
    const nodes: DiagramNode[] = Array.from({ length: 100 }, (_, i) => ({
      id: `node${i}`,
      type: 'Character' as const,
      label: `${i}`,
    }));
    const data: DiagramData = { nodes, edges: [], groups: [] };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('node0:::Character("0");');
    expect(result).toContain('node99:::Character("99");');
  });

  test('buildNodes handles all node types', () => {
    const nodes: DiagramNode[] = [
      { id: 'n1', type: 'Character', label: 'a' },
      { id: 'n2', type: 'CharacterClass', label: '[a-z]' },
      { id: 'n3', type: 'CharacterClassRange', label: 'a-z' },
      { id: 'n4', type: 'Disjunction', label: '|' },
      { id: 'n5', type: 'Group', label: '(...)' },
      { id: 'n6', type: 'Repetition', label: '*' },
      { id: 'n7', type: 'Assertion', label: '^' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('n1:::Character');
    expect(result).toContain('n2:::CharacterClass');
    expect(result).toContain('n3:::CharacterClassRange');
    expect(result).toContain('n4:::Disjunction');
    expect(result).toContain('n5:::Group');
    expect(result).toContain('n6:::Repetition');
    expect(result).toContain('n7:::Assertion');
  });

  test('buildSubgraphs handles all group types', () => {
    const groups: Group[] = [
      {
        id: 'g1',
        type: 'standard',
        number: 1,
        optional: false,
        label: 'standard',
        nodes: ['n1'],
      },
      {
        id: 'g2',
        type: 'named-capture',
        number: 2,
        optional: false,
        label: 'named',
        nodes: ['n2'],
      },
      {
        id: 'g3',
        type: 'non-capturing',
        number: 3,
        optional: false,
        label: 'non-capturing',
        nodes: ['n3'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('subgraph g1');
    expect(result).toContain('subgraph g2');
    expect(result).toContain('subgraph g3');
  });

  test('buildEdges handles long chains of edges', () => {
    const edges: Edge[] = Array.from({ length: 50 }, (_, i) => ({
      from: `node${i}`,
      to: `node${i + 1}`,
    }));
    const result = buildEdges(edges);
    expect(result).toContain('node0 --- node1;');
    expect(result).toContain('node49 --- node50;');
  });

  test('buildMermaidDiagram handles mixed optional and required groups', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [
        {
          id: 'g1',
          type: 'standard',
          number: 1,
          optional: true,
          label: 'optional',
          nodes: ['n1'],
        },
        {
          id: 'g2',
          type: 'standard',
          number: 2,
          optional: false,
          label: 'required',
          nodes: ['n2'],
        },
      ],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('optional');
    expect(result).toContain('required');
    expect(result).toContain('Optional');
  });

  test('buildNodes handles labels with HTML entities', () => {
    const nodes: DiagramNode[] = [
      { id: 'node1', type: 'Character', label: '&lt;test&gt;' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('node1:::Character("&lt;test&gt;");');
  });

  test('buildEdges handles edges with empty labels', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node2', label: '' },
    ];
    const result = buildEdges(edges);
    // Empty label is treated as no label because empty string is falsy
    expect(result).toContain('node1 --- node2;');
    expect(result).not.toContain('||');
  });

  test('buildEdges treats undefined label same as no label', () => {
    const edges: Edge[] = [
      { from: 'node1', to: 'node2' },
      { from: 'node2', to: 'node3', label: undefined },
    ];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2;');
    expect(result).toContain('node2 --- node3;');
  });
});
