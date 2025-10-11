export const GROUP_TYPES = ['standard', 'named-capture', 'non-capturing'] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export const NODE_TYPES = [
  'Character',
  'CharacterClass',
  'CharacterClassRange',
  'Disjunction',
  'Group',
  'Repetition',
  'Assertion',
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export interface Group {
  id: string;
  type: GroupType;
  number: number;
  optional: boolean;
  label: string;
  nodes: string[];
}

export interface DiagramNode {
  id: string;
  type: NodeType;
  label: string;
}

export interface Edge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: Edge[];
  groups: Group[];
}
