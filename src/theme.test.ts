import { describe, expect, test } from 'bun:test';
import { buildStyles, THEME_GROUP_STYLES, THEME_NODE_STYLES, THEMES } from './theme';
import type { DiagramData, GroupType, NodeType } from './types';

describe('THEMES constant', () => {
  test('contains all expected theme names', () => {
    expect(THEMES).toEqual(['default', 'neutral', 'dark', 'forest', 'none']);
  });

  test('is readonly', () => {
    expect(Object.isFrozen(THEMES)).toBe(false); // as const makes it readonly in TS but not frozen
    expect(THEMES.length).toBe(5);
  });
});

describe('THEME_NODE_STYLES constant', () => {
  test('has styles for all themes except "none"', () => {
    const themesWithStyles = THEMES.filter(t => t !== 'none');
    expect(Object.keys(THEME_NODE_STYLES)).toEqual(themesWithStyles);
  });

  test('each theme has all node types defined', () => {
    const nodeTypes: NodeType[] = [
      'literal',
      'char-class',
      'negated-char-class',
      'disjunction',
      'assertion',
      'back-reference',
    ];

    for (const theme of Object.keys(THEME_NODE_STYLES)) {
      for (const nodeType of nodeTypes) {
        expect(THEME_NODE_STYLES[theme as keyof typeof THEME_NODE_STYLES][nodeType]).toBeDefined();
        expect(typeof THEME_NODE_STYLES[theme as keyof typeof THEME_NODE_STYLES][nodeType]).toBe(
          'string',
        );
      }
    }
  });

  test('each theme has all group types defined', () => {
    const groupTypes: GroupType[] = [
      'standard',
      'named-capture',
      'non-capturing',
      'positive-lookahead',
      'negative-lookahead',
      'positive-lookbehind',
      'negative-lookbehind',
    ];

    for (const theme of Object.keys(THEME_GROUP_STYLES)) {
      for (const groupType of groupTypes) {
        expect(
          THEME_GROUP_STYLES[theme as keyof typeof THEME_GROUP_STYLES][groupType],
        ).toBeDefined();
        expect(typeof THEME_GROUP_STYLES[theme as keyof typeof THEME_GROUP_STYLES][groupType]).toBe(
          'string',
        );
      }
    }
  });

  test('default theme has expected color scheme', () => {
    expect(THEME_NODE_STYLES.default.literal).toContain('fill:#F9CB9C');
    expect(THEME_NODE_STYLES.default['char-class']).toContain('fill:#B4A7D6');
    expect(THEME_GROUP_STYLES.default['named-capture']).toContain('fill:#D9EAD3');
  });

  test('dark theme has color property for text visibility', () => {
    expect(THEME_NODE_STYLES.dark.literal).toContain('color:#FFFFFF');
    expect(THEME_NODE_STYLES.dark['char-class']).toContain('color:#FFFFFF');
    expect(THEME_GROUP_STYLES.dark.modifier).toContain('color:#FFFFFF');
  });

  test('neutral theme uses muted colors', () => {
    expect(THEME_NODE_STYLES.neutral.literal).toContain('fill:#E8E8E8');
    expect(THEME_NODE_STYLES.neutral.literal).toContain('stroke:#999999');
  });

  test('forest theme uses nature-inspired colors', () => {
    expect(THEME_NODE_STYLES.forest.literal).toContain('fill:#C5E1A5');
    expect(THEME_NODE_STYLES.forest['char-class']).toContain('fill:#A5D6A7');
  });
});

describe('buildStyles', () => {
  test('returns empty string for "none" theme', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', label: 'test', type: 'literal' }],
      edges: [],
      groups: [],
    };
    expect(buildStyles('none', data)).toBe('');
  });

  test('returns empty string for empty diagram data', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [],
    };
    expect(buildStyles('default', data)).toBe('');
  });

  test('generates node class definitions for used node types', () => {
    const data: DiagramData = {
      nodes: [
        { id: 'n1', label: 'a', type: 'literal' },
        { id: 'n2', label: '[0-9]', type: 'char-class' },
      ],
      edges: [],
      groups: [],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('%% Node Styling');
    expect(result).toContain('classDef literal fill:#F9CB9C,stroke:#E69138,color:#000000;');
    expect(result).toContain('classDef char-class fill:#B4A7D6,stroke:#8E7CC3,color:#000000;');
  });

  test('does not generate class definitions for unused node types', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', label: 'test', type: 'literal' }],
      edges: [],
      groups: [],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('classDef literal');
    expect(result).not.toContain('classDef char-class');
    expect(result).not.toContain('classDef modifier');
  });

  test('generates group class definitions for used group types', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [
        { id: 'g1', label: 'Group 1', type: 'named-capture', children: [], number: 1 },
        { id: 'g2', label: 'Group 2', type: 'standard', children: [], number: 2 },
      ],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('%% Group Styling');
    expect(result).toContain('classDef named-capture fill:#D9EAD3,stroke:#93C47D,color:#000000;');
    expect(result).toContain('classDef standard fill:#FFF2CC,stroke:#F1C232,color:#000000;');
  });

  test('applies group classes to group IDs', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [
        { id: 'group_1', label: 'Group 1', type: 'named-capture', children: [], number: 1 },
        { id: 'group_2', label: 'Group 2', type: 'named-capture', children: [], number: 2 },
        { id: 'group_3', label: 'Group 3', type: 'standard', children: [], number: 3 },
      ],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('%% Apply Group Classes');
    expect(result).toContain('class group_1,group_2 named-capture;');
    expect(result).toContain('class group_3 standard;');
  });

  test('handles multiple groups of the same type', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [
        { id: 'g1', label: 'G1', type: 'standard', children: [], number: 1 },
        { id: 'g2', label: 'G2', type: 'standard', children: [], number: 2 },
        { id: 'g3', label: 'G3', type: 'standard', children: [], number: 3 },
      ],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('class g1,g2,g3 standard;');
  });

  test('generates both node and group styles together', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', label: 'a', type: 'literal' }],
      edges: [],
      groups: [{ id: 'g1', label: 'G1', type: 'standard', children: [], number: 1 }],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('%% Node Styling');
    expect(result).toContain('classDef literal');
    expect(result).toContain('%% Group Styling');
    expect(result).toContain('classDef standard');
    expect(result).toContain('%% Apply Group Classes');
  });

  test('uses correct theme styles for neutral theme', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', label: 'test', type: 'literal' }],
      edges: [],
      groups: [],
    };
    const result = buildStyles('neutral', data);
    expect(result).toContain('classDef literal fill:#E8E8E8,stroke:#999999;');
  });

  test('uses correct theme styles for dark theme', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', label: 'test', type: 'literal' }],
      edges: [],
      groups: [],
    };
    const result = buildStyles('dark', data);
    expect(result).toContain('classDef literal fill:#3D3D3D,stroke:#FFA726,color:#FFFFFF;');
  });

  test('uses correct theme styles for forest theme', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', label: 'test', type: 'literal' }],
      edges: [],
      groups: [],
    };
    const result = buildStyles('forest', data);
    expect(result).toContain('classDef literal fill:#C5E1A5,stroke:#7CB342;');
  });

  test('handles all node types', () => {
    const data: DiagramData = {
      nodes: [
        { id: 'n1', label: 'a', type: 'literal' },
        { id: 'n2', label: '[0-9]', type: 'char-class' },
        { id: 'n3', label: '[^a-z]', type: 'negated-char-class' },
        { id: 'n4', label: '|', type: 'disjunction' },
        { id: 'n5', label: '^', type: 'assertion' },
        { id: 'n6', label: '\\1', type: 'back-reference' },
      ],
      edges: [],
      groups: [],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('classDef literal');
    expect(result).toContain('classDef char-class');
    expect(result).toContain('classDef negated-char-class');
    expect(result).toContain('classDef disjunction');
    expect(result).toContain('classDef assertion');
    expect(result).toContain('classDef back-reference');
  });

  test('handles all group types', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [
        { id: 'g1', label: 'G1', type: 'standard', children: [], number: 1 },
        { id: 'g2', label: 'G2', type: 'named-capture', children: [], number: 2 },
        { id: 'g3', label: 'G3', type: 'non-capturing', children: [], number: 3 },
        { id: 'g4', label: 'G4', type: 'positive-lookahead', children: [], number: 4 },
        { id: 'g5', label: 'G5', type: 'negative-lookahead', children: [], number: 5 },
        { id: 'g6', label: 'G6', type: 'positive-lookbehind', children: [], number: 6 },
        { id: 'g7', label: 'G7', type: 'negative-lookbehind', children: [], number: 7 },
      ],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('classDef standard');
    expect(result).toContain('classDef named-capture');
    expect(result).toContain('classDef non-capturing');
    expect(result).toContain('classDef positive-lookahead');
    expect(result).toContain('classDef negative-lookahead');
    expect(result).toContain('classDef positive-lookbehind');
    expect(result).toContain('classDef negative-lookbehind');
    expect(result).toContain('class g1 standard;');
    expect(result).toContain('class g2 named-capture;');
  });

  test('only includes node styling section when nodes exist', () => {
    const data: DiagramData = {
      nodes: [],
      edges: [],
      groups: [{ id: 'g1', label: 'G1', type: 'standard', children: [], number: 1 }],
    };
    const result = buildStyles('default', data);
    expect(result).not.toContain('%% Node Styling');
    expect(result).toContain('%% Group Styling');
  });

  test('only includes group styling section when groups exist', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', label: 'test', type: 'literal' }],
      edges: [],
      groups: [],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('%% Node Styling');
    expect(result).not.toContain('%% Group Styling');
  });

  test('handles edge case with single node and single group', () => {
    const data: DiagramData = {
      nodes: [{ id: 'n1', label: 'a', type: 'literal' }],
      edges: [],
      groups: [{ id: 'g1', label: 'G1', type: 'standard', children: [], number: 1 }],
    };
    const result = buildStyles('default', data);
    expect(result).toContain('classDef literal');
    expect(result).toContain('classDef standard');
    expect(result).toContain('class g1 standard;');
  });
});
