export const GROUP_TYPES = [
  'standard',
  'named-capture',
  'non-capturing',
  'positive-lookahead',
  'negative-lookahead',
  'positive-lookbehind',
  'negative-lookbehind',
  'modifier',
] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export const NODE_TYPES = [
  'literal',
  'char-class',
  'negated-char-class',
  'char-set',
  'negated-char-set',
  'disjunction',
  'assertion',
  'back-reference',
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export interface DiagramGroup {
  id: string;
  type: GroupType;
  number: number;
  label: string;
  children: string[];
  quantifier?: string;
}

export interface DiagramNode {
  id: string;
  type: NodeType;
  label: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
}

export const DIRECTIONS = ['LR', 'TD'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const FLAVORS = ['regexp', 'auto'] as const;
export type Flavor = (typeof FLAVORS)[number];

export const THEMES = ['default', 'neutral', 'dark', 'forest', 'none'] as const;
export type Theme = (typeof THEMES)[number];

export interface Options {
  direction?: Direction;
  flavor?: Flavor;
  theme?: Theme;
}

export const DEFAULT_OPTIONS: Readonly<Required<Options>> = {
  direction: 'LR',
  flavor: 'auto',
  theme: 'default',
};
