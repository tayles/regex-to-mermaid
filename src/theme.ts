import type { DiagramData, GroupType, NodeType } from './types';

export const THEMES = ['default', 'neutral', 'dark', 'forest', 'none'] as const;
export type Theme = (typeof THEMES)[number];

export type ThemeWithStyles = Exclude<Theme, 'none'>;

export const THEME_NODE_STYLES: Record<ThemeWithStyles, Record<NodeType, string>> = {
  default: {
    literal: 'fill:#F9CB9C,stroke:#E69138,color:#000000',
    'char-class': 'fill:#B4A7D6,stroke:#8E7CC3,color:#000000',
    'negated-char-class': 'fill:#EA9999,stroke:#CC0000,color:#000000,stroke-dasharray: 5 5',
    'char-set': 'fill:#9FA8DA,stroke:#5C6BC0,color:#000000',
    'negated-char-set': 'fill:#EF9A9A,stroke:#E53935,color:#000000,stroke-dasharray: 5 5',
    disjunction: 'fill:#FFD966,stroke:#F1C232,color:#000000',
    assertion: 'fill:#B6D7A8,stroke:#93C47D,color:#000000',
    'back-reference': 'fill:#F4CCCC,stroke:#E06666,color:#000000',
  },
  neutral: {
    // muted grays and subtle tones
    literal: 'fill:#E8E8E8,stroke:#999999',
    'char-class': 'fill:#D0D0D0,stroke:#808080',
    'negated-char-class': 'fill:#C8C8C8,stroke:#707070,stroke-dasharray: 5 5',
    'char-set': 'fill:#C0C0C0,stroke:#787878',
    'negated-char-set': 'fill:#B8B8B8,stroke:#686868,stroke-dasharray: 5 5',
    disjunction: 'fill:#F0F0F0,stroke:#A0A0A0',
    assertion: 'fill:#E0E0E0,stroke:#909090',
    'back-reference': 'fill:#D8D8D8,stroke:#888888',
  },
  dark: {
    // dark backgrounds with bright contrasting strokes
    literal: 'fill:#3D3D3D,stroke:#FFA726,color:#FFFFFF',
    'char-class': 'fill:#2E2E2E,stroke:#AB47BC,color:#FFFFFF',
    'negated-char-class': 'fill:#3A2828,stroke:#EF5350,color:#FFFFFF,stroke-dasharray: 5 5',
    'char-set': 'fill:#2E2E3A,stroke:#5C6BC0,color:#FFFFFF',
    'negated-char-set': 'fill:#3A2828,stroke:#F44336,color:#FFFFFF,stroke-dasharray: 5 5',
    disjunction: 'fill:#3E3A28,stroke:#FFEE58,color:#FFFFFF',
    assertion: 'fill:#2D3A2D,stroke:#66BB6A,color:#FFFFFF',
    'back-reference': 'fill:#3A2D2D,stroke:#EF5350,color:#FFFFFF',
  },
  forest: {
    // nature-inspired greens and earth tones
    literal: 'fill:#C5E1A5,stroke:#7CB342',
    'char-class': 'fill:#A5D6A7,stroke:#66BB6A',
    'negated-char-class': 'fill:#FFAB91,stroke:#FF7043,stroke-dasharray: 5 5',
    'char-set': 'fill:#90CAF9,stroke:#42A5F5',
    'negated-char-set': 'fill:#FFCC80,stroke:#FB8C00,stroke-dasharray: 5 5',
    disjunction: 'fill:#FFF59D,stroke:#FBC02D',
    assertion: 'fill:#AED581,stroke:#9CCC65',
    'back-reference': 'fill:#FFCCBC,stroke:#FF8A65',
  },
};

export const THEME_GROUP_STYLES: Record<ThemeWithStyles, Record<GroupType, string>> = {
  default: {
    standard: 'fill:#FFF2CC,stroke:#F1C232,color:#000000',
    'named-capture': 'fill:#D9EAD3,stroke:#93C47D,color:#000000',
    'non-capturing': 'fill:#CFE2F3,stroke:#6D9EEB,color:#000000',
    'positive-lookahead': 'fill:#D9D2E9,stroke:#8E7CC3,color:#000000',
    'negative-lookahead': 'fill:#F4CCCC,stroke:#E06666,color:#000000,stroke-dasharray: 5 5',
    'positive-lookbehind': 'fill:#EAD1DC,stroke:#C27BA0,color:#000000',
    'negative-lookbehind': 'fill:#FCE5CD,stroke:#E69138,color:#000000,stroke-dasharray: 5 5',
    modifier: 'fill:#A2C4C9,stroke:#6D9EEB,color:#000000',
  },
  neutral: {
    standard: 'fill:#F5F5F5,stroke:#B0B0B0',
    'named-capture': 'fill:#ECECEC,stroke:#A8A8A8',
    'non-capturing': 'fill:#E4E4E4,stroke:#9C9C9C',
    'positive-lookahead': 'fill:#DADADA,stroke:#949494',
    'negative-lookahead': 'fill:#D2D2D2,stroke:#8C8C8C,stroke-dasharray: 5 5',
    'positive-lookbehind': 'fill:#CECECE,stroke:#848484',
    'negative-lookbehind': 'fill:#C6C6C6,stroke:#7C7C7C,stroke-dasharray: 5 5',
    modifier: 'fill:#DCDCDC,stroke:#8C8C8C',
  },
  dark: {
    standard: 'fill:#4A4A2E,stroke:#FFEB3B,color:#FFFFFF',
    'named-capture': 'fill:#2E4A2E,stroke:#8BC34A,color:#FFFFFF',
    'non-capturing': 'fill:#2E3A4A,stroke:#2196F3,color:#FFFFFF',
    'positive-lookahead': 'fill:#3A2E4A,stroke:#9C27B0,color:#FFFFFF',
    'negative-lookahead': 'fill:#4A2E2E,stroke:#F44336,color:#FFFFFF,stroke-dasharray: 5 5',
    'positive-lookbehind': 'fill:#4A2E3A,stroke:#E91E63,color:#FFFFFF',
    'negative-lookbehind': 'fill:#4A3A2E,stroke:#FF9800,color:#FFFFFF,stroke-dasharray: 5 5',
    modifier: 'fill:#2A3A3E,stroke:#42A5F5,color:#FFFFFF',
  },
  forest: {
    standard: 'fill:#E8F5E9,stroke:#66BB6A',
    'named-capture': 'fill:#C8E6C9,stroke:#4CAF50',
    'non-capturing': 'fill:#DCEDC8,stroke:#8BC34A',
    'positive-lookahead': 'fill:#F0F4C3,stroke:#CDDC39',
    'negative-lookahead': 'fill:#FFECB3,stroke:#FFC107,stroke-dasharray: 5 5',
    'positive-lookbehind': 'fill:#FFE0B2,stroke:#FF9800',
    'negative-lookbehind': 'fill:#FFCCBC,stroke:#FF5722,stroke-dasharray: 5 5',
    modifier: 'fill:#81C784,stroke:#4CAF50',
  },
};

/**
 * Generate Mermaid class definitions and styling based on the selected theme and diagram data.
 * @example
 *   %% Styling Definitions
 *   %% Node Styling
 *   classDef literal fill:#F9CB9C,stroke:#333;
 *   ...
 *
 *   %% Group Styling
 *   classDef named-capture fill:#FFF2CC,stroke:#333;
 *   ...
 *
 *   %% Apply Group Classes
 *   class group_x,group_y,group_z named-capture;
 *   ...
 */
export function buildStyles(theme: Theme, data: DiagramData): string {
  if (theme === 'none' || (data.nodes.length === 0 && data.groups.length === 0)) {
    return '';
  }

  // Determine used node and group types
  const usedNodeTypes = new Set<NodeType>();
  for (const node of data.nodes) {
    usedNodeTypes.add(node.type);
  }

  // map of group types to group ids
  const groupMap = new Map<GroupType, string[]>();
  for (const group of data.groups) {
    let arr = groupMap.get(group.type);
    if (!arr) {
      arr = [];
      groupMap.set(group.type, arr);
    }
    arr.push(group.id);
  }

  const nodeStyles = THEME_NODE_STYLES[theme];
  const groupStyles = THEME_GROUP_STYLES[theme];

  const nodeClassDefs =
    usedNodeTypes.size > 0
      ? `%% Node Styling
${[...usedNodeTypes].map(type => `classDef ${type} ${nodeStyles[type]};`).join('\n')}`
      : '';

  const groupClassDefs =
    groupMap.size > 0
      ? `%% Group Styling
${[...groupMap.keys()].map(type => `classDef ${type} ${groupStyles[type]};`).join('\n')}

%% Apply Group Classes
${[...groupMap.entries()].map(([type, ids]) => `class ${ids.join(',')} ${type};`).join('\n')}`
      : '';

  return [nodeClassDefs, groupClassDefs].filter(Boolean).join('\n\n');
}
