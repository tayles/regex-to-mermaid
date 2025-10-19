import { describe, expect, test } from 'bun:test';
import { buildEdges, buildMermaidDiagram, buildNodes, buildSubgraphs } from './renderer';
import type { DiagramData, DiagramNode, Edge, Group } from './types';

describe('buildNodes', () => {
  test('builds empty string for empty nodes array', () => {
    const result = buildNodes([]);
    expect(result).toBe('');
  });

  test('builds single node correctly', () => {
    const nodes: DiagramNode[] = [{ id: 'node1', type: 'literal', label: 'a' }];
    const result = buildNodes(nodes);
    expect(result).toContain('node1("a"):::literal');
  });

  test('builds multiple nodes correctly', () => {
    const nodes: DiagramNode[] = [
      { id: 'node1', type: 'literal', label: 'a' },
      { id: 'node2', type: 'literal', label: 'b' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('node1("a"):::literal');
    expect(result).toContain('node2("b"):::literal');
  });

  test('handles different node types', () => {
    const nodes: DiagramNode[] = [
      { id: 'char1', type: 'literal', label: 'a' },
      { id: 'class1', type: 'char-class', label: '[a-z]' },
      { id: 'rep1', type: 'modifier', label: '*' },
      { id: 'group1', type: 'literal', label: '(...)' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('char1("a"):::literal');
    expect(result).toContain('class1("[a-z]"):::char-class');
    expect(result).toContain('rep1("*"):::modifier');
    expect(result).toContain('group1("(...)"):::literal');
  });

  test('escapes special characters in labels', () => {
    const nodes: DiagramNode[] = [{ id: 'node1', type: 'literal', label: '"quote"' }];
    const result = buildNodes(nodes);
    expect(result).toContain('node1(""quote""):::literal');
  });

  test('handles multiline labels', () => {
    const nodes: DiagramNode[] = [{ id: 'node1', type: 'literal', label: 'line1<br>line2' }];
    const result = buildNodes(nodes);
    expect(result).toContain('node1("line1<br>line2"):::literal');
  });

  test('does not include indentation', () => {
    const nodes: DiagramNode[] = [{ id: 'node1', type: 'literal', label: 'a' }];
    const result = buildNodes(nodes);
    expect(result.startsWith('    ')).toBe(false);
  });
});

describe('buildSubgraphs', () => {
  test('builds empty string for empty groups array', () => {
    const result = buildSubgraphs([]);
    expect(result).toBe('');
  });

  test('builds single group correctly', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'named-capture',
        number: 1,
        label: 'protocol',
        children: ['node1', 'node2'],
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
        label: 'optional_part',
        children: ['node1'],
        quantifier: 'Optional',
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
        label: 'required_part',
        children: ['node1'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).not.toContain('Optional');
  });

  test('builds group with quantifier text', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'standard',
        number: 1,
        label: 'repeated',
        children: ['node1'],
        quantifier: 'One or more',
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('<small><i>One or more</i></small>');
  });

  test('builds multiple groups correctly', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'named-capture',
        number: 1,
        label: 'protocol',
        children: ['node1'],
      },
      {
        id: 'group2',
        type: 'named-capture',
        number: 2,
        label: 'path',
        children: ['node2'],
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
        label: 'standard',
        children: ['n1'],
      },
      {
        id: 'g2',
        type: 'named-capture',
        number: 2,
        label: 'named',
        children: ['n2'],
      },
      {
        id: 'g3',
        type: 'non-capturing',
        number: 3,
        label: 'non-capturing',
        children: ['n3'],
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
        label: 'test',
        children: ['node1', 'node2', 'node3', 'node4'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('node1');
    expect(result).toContain('node2');
    expect(result).toContain('node3');
    expect(result).toContain('node4');
  });

  test('handles empty children array in group', () => {
    const groups: Group[] = [
      {
        id: 'group1',
        type: 'standard',
        number: 1,
        label: 'empty',
        children: [],
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
    expect(result).toBe('');
  });

  test('builds single edge correctly', () => {
    const edges: Edge[] = [{ from: 'node1', to: 'node2' }];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2;');
  });

  test('builds edge with label correctly', () => {
    const edges: Edge[] = [{ from: 'node1', to: 'node2', label: 'optional' }];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2|optional|;');
  });

  test('builds edge without label correctly', () => {
    const edges: Edge[] = [{ from: 'node1', to: 'node2' }];
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
    const edges: Edge[] = [{ from: 'node_1', to: 'node-2' }];
    const result = buildEdges(edges);
    expect(result).toContain('node_1 --- node-2;');
  });

  test('handles special characters in labels', () => {
    const edges: Edge[] = [{ from: 'node1', to: 'node2', label: 'a-z' }];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node2|a-z|;');
  });

  test('does not include indentation', () => {
    const edges: Edge[] = [{ from: 'node1', to: 'node2' }];
    const result = buildEdges(edges);
    expect(result.startsWith('    ')).toBe(false);
  });
});

describe('buildMermaidDiagram', () => {
  test('builds basic diagram structure with default LR direction', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('graph LR');
    expect(result).toContain('start@{ shape: f-circ };');
    expect(result).toContain('fin@{ shape: f-circ };');
    expect(result).toContain('%% Nodes');
    // Empty data should not contain subgraphs, edges, or styles sections
    expect(result).not.toContain('%% Subgraphs');
    expect(result).not.toContain('%% Edges');
    expect(result).not.toContain('%% Styles');
  });

  test('builds diagram with TD direction', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [],
    };
    const result = buildMermaidDiagram(data, 'TD');
    expect(result).toContain('graph TD');
  });

  test('builds diagram with LR direction explicitly', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [],
    };
    const result = buildMermaidDiagram(data, 'LR');
    expect(result).toContain('graph LR');
  });

  test('includes all nodes in diagram', () => {
    const data: DiagramData = {
      nodes: [
        { id: 'node1', type: 'literal', label: 'a' },
        { id: 'node2', type: 'literal', label: 'b' },
      ],
      edges: [],
      groups: [],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('node1("a"):::literal');
    expect(result).toContain('node2("b"):::literal');
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
          label: 'protocol',
          children: ['node1'],
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
        { id: 'node1', type: 'literal', label: 'h' },
        { id: 'node2', type: 'literal', label: 't' },
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
          label: 'protocol',
          children: ['node1', 'node2'],
        },
      ],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('graph LR');
    expect(result).toContain('node1("h"):::literal');
    expect(result).toContain('node2("t"):::literal');
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
    expect(result).toContain('start@{ shape: f-circ };');
    expect(result).toContain('fin@{ shape: f-circ };');
  });

  test('includes styling comments', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', type: 'literal', label: 'a' }],
      edges: [],
      groups: [
        {
          id: 'group_1',
          type: 'standard',
          label: 'Test',
          number: 1,
          children: ['n1'],
        },
      ],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('%% Node Styling');
    expect(result).toContain('%% Group Styling');
    expect(result).toContain('%% Apply Group Classes');
  });

  test('maintains proper structure and formatting', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', type: 'literal', label: 'a' }],
      edges: [{ from: 'start', to: 'n1' }],
      groups: [
        {
          id: 'group_1',
          type: 'standard',
          label: 'Test',
          number: 1,
          children: ['n1'],
        },
      ],
    };
    const result = buildMermaidDiagram(data);
    // Check sections appear in correct order
    const graphIndex = result.indexOf('graph LR');
    const nodesIndex = result.indexOf('%% Nodes');
    const subgraphsIndex = result.indexOf('%% Subgraphs');
    const edgesIndex = result.indexOf('%% Edges');
    const stylingIndex = result.indexOf('%% Styles');

    expect(graphIndex).toBeLessThan(nodesIndex);
    expect(nodesIndex).toBeLessThan(subgraphsIndex);
    expect(subgraphsIndex).toBeLessThan(edgesIndex);
    expect(edgesIndex).toBeLessThan(stylingIndex);
  });
});

describe('Edge cases and error handling', () => {
  test('buildNodes handles nodes with empty labels', () => {
    const nodes: DiagramNode[] = [{ id: 'node1', type: 'literal', label: '' }];
    const result = buildNodes(nodes);
    expect(result).toContain('node1:::literal');
  });

  test('buildSubgraphs handles groups with very high numbers', () => {
    const groups: Group[] = [
      {
        id: 'group999',
        type: 'standard',
        number: 999,
        label: 'test',
        children: ['n1'],
      },
    ];
    const result = buildSubgraphs(groups);
    expect(result).toContain('<small>#999</small>');
  });

  test('buildEdges handles same node connected to itself', () => {
    const edges: Edge[] = [{ from: 'node1', to: 'node1' }];
    const result = buildEdges(edges);
    expect(result).toContain('node1 --- node1;');
  });

  test('buildMermaidDiagram handles large numbers of nodes', () => {
    const nodes: DiagramNode[] = Array.from({ length: 100 }, (_, i) => ({
      id: `node${i}`,
      type: 'literal' as const,
      label: `${i}`,
    }));
    const data: DiagramData = { nodes, edges: [], groups: [] };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('node0("0"):::literal');
    expect(result).toContain('node99("99"):::literal');
  });

  test('buildNodes handles all node types', () => {
    const nodes: DiagramNode[] = [
      { id: 'n1', type: 'literal', label: 'a' },
      { id: 'n2', type: 'char-class', label: '[a-z]' },
      { id: 'n3', type: 'negated-char-class', label: 'a-z' },
      { id: 'n4', type: 'disjunction', label: '|' },
      { id: 'n5', type: 'modifier', label: '(...)' },
      { id: 'n6', type: 'assertion', label: '^' },
      { id: 'n7', type: 'back-reference', label: '\\1' },
    ];
    const result = buildNodes(nodes);
    expect(result).toContain('n1("a"):::literal');
    expect(result).toContain('n2("[a-z]"):::char-class');
    expect(result).toContain('n3("a-z"):::negated-char-class');
    expect(result).toContain('n4("|"):::disjunction');
    expect(result).toContain('n5("(...)"):::modifier');
    expect(result).toContain('n6("^"):::assertion');
    expect(result).toContain('n7("\\1"):::back-reference');
  });

  test('buildSubgraphs handles all group types', () => {
    const groups: Group[] = [
      {
        id: 'g1',
        type: 'standard',
        number: 1,
        label: 'standard',
        children: ['n1'],
      },
      {
        id: 'g2',
        type: 'named-capture',
        number: 2,
        label: 'named',
        children: ['n2'],
      },
      {
        id: 'g3',
        type: 'non-capturing',
        number: 3,
        label: 'non-capturing',
        children: ['n3'],
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
          label: 'optional',
          children: ['n1'],
          quantifier: 'Optional',
        },
        {
          id: 'g2',
          type: 'standard',
          number: 2,
          label: 'required',
          children: ['n2'],
        },
      ],
    };
    const result = buildMermaidDiagram(data);
    expect(result).toContain('optional');
    expect(result).toContain('required');
    expect(result).toContain('Optional');
  });

  test('buildNodes handles labels with HTML entities', () => {
    const nodes: DiagramNode[] = [{ id: 'node1', type: 'literal', label: '&lt;test&gt;' }];
    const result = buildNodes(nodes);
    expect(result).toContain('node1("&lt;test&gt;"):::literal');
  });

  test('buildEdges handles edges with empty labels', () => {
    const edges: Edge[] = [{ from: 'node1', to: 'node2', label: '' }];
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
