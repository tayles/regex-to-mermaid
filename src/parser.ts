import type { AST } from '@eslint-community/regexpp';
import { parseRegExpLiteral } from '@eslint-community/regexpp';
import type {
  Alternative,
  Assertion,
  Backreference,
  CapturingGroup,
  Character,
  CharacterClass,
  CharacterSet,
  ClassIntersection,
  ClassSetOperand,
  ClassStringDisjunction,
  ClassSubtraction,
  Element,
  ExpressionCharacterClass,
  Group,
  LookaroundAssertion,
  Modifiers,
  Node,
  Quantifier,
} from '@eslint-community/regexpp/ast';
import type {
  DiagramData,
  DiagramEdge,
  DiagramGroup,
  DiagramNode,
  Flavor,
  GroupType,
} from './types';
import { expandGeneralCategory } from './unicode-properties';

export function parseJavaScriptRegex(regex: string): RegExp {
  // Try to parse as a regex literal first
  if (regex.startsWith('/')) {
    const lastSlash = regex.lastIndexOf('/');
    if (lastSlash > 0) {
      const patternStr = regex.slice(1, lastSlash);
      const flags = regex.slice(lastSlash + 1);
      return new RegExp(patternStr, flags);
    } else {
      return new RegExp(regex);
    }
  } else {
    // Treat as plain string pattern
    return new RegExp(regex);
  }
}

export function parseRegexByFlavor(regex: string, flavor: Flavor): RegExp {
  switch (flavor) {
    default:
      // JavaScript RegExp: Parse directly
      return parseJavaScriptRegex(regex);
  }
}

/**
 * Wrap a regex pattern with slashes if it's not already a regex literal
 */
export function wrapRegexIfNeeded(pattern: string): string {
  if (pattern.startsWith('/')) {
    return pattern;
  } else {
    return `/${pattern}/`;
  }
}

export function buildRegexAst(pattern: string | RegExp): AST.RegExpLiteral {
  // Convert RegExp to string literal format
  const literalString =
    typeof pattern === 'string' ? wrapRegexIfNeeded(pattern) : pattern.toString();

  const ast = parseRegExpLiteral(literalString);
  return ast;
}

/**
 * Print AST as JSON string, omitting parent references
 */
export function printAst(ast: AST.RegExpLiteral): string {
  return JSON.stringify(
    ast,
    (key, value) => {
      // Omit parent references to avoid circular structure
      if (['parent', 'resolved'].includes(key)) {
        return undefined;
      }
      return value;
    },
    2,
  );
}

const nodeCounters: Map<string, number> = new Map();
let capturingGroupNumber = 0;

function getNextNodeId(nodeType: string): string {
  const count = nodeCounters.get(nodeType) || 1;
  nodeCounters.set(nodeType, count + 1);
  return buildFriendlyId(`${nodeType}_${count}`);
}

function getNextGroupNumber(): number {
  capturingGroupNumber++;
  return capturingGroupNumber;
}

export function generateDiagramData(ast: AST.RegExpLiteral): DiagramData {
  nodeCounters.clear();
  capturingGroupNumber = 0;

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const groups: DiagramGroup[] = [];

  if (!ast.pattern?.alternatives || ast.pattern.alternatives.length === 0) {
    return { nodes, edges, groups };
  }

  // Process the regex pattern
  const startNodeId = 'start';
  const endNodeId = 'fin';

  // If there's only one alternative, process it directly
  // Otherwise, treat multiple alternatives as a disjunction
  let lastNodeId: string;
  const firstAlternative = ast.pattern.alternatives[0];
  if (ast.pattern.alternatives.length === 1 && firstAlternative) {
    lastNodeId = processNode(firstAlternative, startNodeId, nodes, edges, groups);
  } else {
    // Multiple alternatives at root level - create disjunction
    lastNodeId = processDisjunctionAlternatives(
      ast.pattern.alternatives,
      startNodeId,
      nodes,
      edges,
      groups,
    );
  }

  // Connect the last node to the end
  if (lastNodeId) {
    edges.push({ from: lastNodeId, to: endNodeId });
  }

  return { nodes, edges, groups };
}

function processNode(
  node: Node,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  groups: DiagramGroup[],
): string {
  switch (node.type) {
    case 'Alternative':
      return processAlternative(node, previousNodeId, nodes, edges, groups);
    case 'Character':
      return processCharacter(node, previousNodeId, nodes, edges);
    case 'CharacterClass':
      return processCharacterClass(node, previousNodeId, nodes, edges);
    case 'CharacterSet':
      return processCharacterSet(node, previousNodeId, nodes, edges);
    case 'ExpressionCharacterClass':
      return processExpressionCharacterClass(node, previousNodeId, nodes, edges);
    case 'Quantifier':
      return processQuantifier(node, previousNodeId, nodes, edges, groups);
    case 'CapturingGroup':
    case 'Group':
      return processGroup(node, previousNodeId, nodes, edges, groups);
    case 'Assertion':
      return processAssertion(node, previousNodeId, nodes, edges, groups);
    case 'Backreference':
      return processBackreference(node, previousNodeId, nodes, edges);
    default:
      return previousNodeId;
  }
}

function processAlternative(
  node: Alternative,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  groups: DiagramGroup[],
): string {
  let currentNodeId = previousNodeId;

  // Combine consecutive Character nodes into a single literal node
  const elements = node.elements || [];
  const combined: (Element | { type: 'CombinedChars'; chars: Character[] })[] = [];

  let i = 0;
  while (i < elements.length) {
    const element = elements[i];
    if (element?.type === 'Character') {
      // Collect consecutive Character nodes
      const chars: Character[] = [];
      while (i < elements.length) {
        const currentElement = elements[i];
        if (currentElement?.type === 'Character') {
          chars.push(currentElement);
          i++;
        } else {
          break;
        }
      }
      // Create a combined node
      combined.push({ type: 'CombinedChars', chars });
    } else if (element) {
      combined.push(element);
      i++;
    } else {
      i++;
    }
  }

  for (const expr of combined) {
    if (expr.type === 'CombinedChars') {
      currentNodeId = processCombinedChars(expr.chars, currentNodeId, nodes, edges);
    } else {
      currentNodeId = processNode(expr, currentNodeId, nodes, edges, groups);
    }
  }

  return currentNodeId;
}

function processCombinedChars(
  chars: Character[],
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string {
  // Convert code points to characters
  const text = chars.map(c => c.raw).join('');
  const nodeId = getNextNodeId('literal');
  const label = buildFriendlyLabel(text);

  nodes.push({
    id: nodeId,
    type: 'literal',
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function processCharacter(
  node: Character,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string {
  const nodeId = getNextNodeId('literal');
  const char = node.raw;
  const label = buildFriendlyLabel(char);

  nodes.push({
    id: nodeId,
    type: 'literal',
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function processCharacterClass(
  node: CharacterClass,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string {
  const nodeId = getNextNodeId('char-class');
  const nodeType = node.negate ? 'negated-char-class' : 'char-class';
  const label = buildCharacterClassLabel(node);

  nodes.push({
    id: nodeId,
    type: nodeType,
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function buildCharacterClassLabel(node: CharacterClass): string {
  if (!node.elements || node.elements.length === 0) {
    return '[]';
  }

  const singleChars: string[] = [];
  const ranges: string[] = [];

  for (const elem of node.elements) {
    switch (elem.type) {
      case 'Character':
        singleChars.push(escapeSingleChar(elem.raw));
        break;
      case 'CharacterClassRange': {
        const from = elem.min.raw;
        const to = elem.max.raw;
        const rangeName = getFriendlyRangeName(from, to);
        ranges.push(rangeName ?? `${from}-${to}`);
        break;
      }
      case 'CharacterClass':
        // Nested character class
        ranges.push(buildCharacterClassLabel(elem));
        break;
      case 'CharacterSet':
        // Character set escape (\d, \w, \s, etc.)
        ranges.push(getClassOperandLabel(elem));
        break;
      default:
        // Other element types (ExpressionCharacterClass, ClassStringDisjunction, etc.)
        ranges.push(getClassOperandLabel(elem));
        break;
    }
  }

  // Build the label: ranges first, then single chars on one line
  const parts: string[] = [];
  if (ranges.length > 0) {
    parts.push(...ranges);
  }
  if (singleChars.length > 0) {
    parts.push(singleChars.join(' '));
  }

  const label = parts.join('<br>');
  return label;
}

function getFriendlyRangeName(from: string, to: string): string | null {
  if (from === 'a' && to === 'z') return 'Any lowercase';
  if (from === 'A' && to === 'Z') return 'Any uppercase';
  if (from === '0' && to === '9') return 'Any digit';
  return null;
}

function processCharacterSet(
  node: CharacterSet,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string {
  const nodeId = getNextNodeId('char-set');
  // Determine if this is a negated character set
  const isNegated = 'negate' in node && node.negate;
  const nodeType = isNegated ? 'negated-char-set' : 'char-set';
  const label = buildCharacterSetLabel(node);

  nodes.push({
    id: nodeId,
    type: nodeType,
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function processExpressionCharacterClass(
  node: ExpressionCharacterClass,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string {
  const nodeId = getNextNodeId('char-class');

  // Build label from the expression (intersection or subtraction)
  const label = buildExpressionCharacterClassLabel(node);

  nodes.push({
    id: nodeId,
    type: node.negate ? 'negated-char-class' : 'char-class',
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function buildExpressionCharacterClassLabel(node: ExpressionCharacterClass): string {
  const expr = node.expression;

  if (expr.type === 'ClassIntersection') {
    return buildClassIntersectionLabel(expr);
  } else if (expr.type === 'ClassSubtraction') {
    return buildClassSubtractionLabel(expr);
  }

  return node.raw || '[]';
}

function buildClassIntersectionLabel(node: ClassIntersection): string {
  const left = getClassOperandLabel(node.left);
  const right = getClassOperandLabel(node.right);
  return `${left}<br><i>AND</i><br>${right}`;
}

function buildClassSubtractionLabel(node: ClassSubtraction): string {
  const left = getClassOperandLabel(node.left);
  const right = getClassOperandLabel(node.right);
  return `${left}<br><i>EXCEPT</i><br>${right}`;
}

function getClassOperandLabel(
  node: ClassIntersection | ClassSetOperand | ClassSubtraction,
): string {
  switch (node.type) {
    case 'Character':
      return node.raw;
    case 'CharacterClass':
      return buildCharacterClassLabel(node);
    case 'CharacterSet':
      return buildCharacterSetLabel(node);
    case 'ClassIntersection':
      return buildClassIntersectionLabel(node);
    case 'ClassSubtraction':
      return buildClassSubtractionLabel(node);
    case 'ExpressionCharacterClass':
      return buildExpressionCharacterClassLabel(node);
    case 'ClassStringDisjunction':
      return buildClassStringDisjunctionLabel(node);
  }
}

function buildCharacterSetLabel(node: CharacterSet): string {
  switch (node.kind) {
    case 'any':
      // Dot (.)
      return 'Any character';
    case 'digit':
      // Character class escapes: \d, \D
      return node.negate ? 'Not a digit' : 'Any digit';
    case 'space':
      // Character class escapes: \s, \S
      return node.negate ? 'Not whitespace' : 'Any whitespace';
    case 'word':
      // Character class escapes: \w, \W
      return node.negate ? 'Not a word character' : 'Any word character';
    case 'property': {
      // Unicode property escapes: \p{...}, \P{...}
      // If key is General_Category, expand the abbreviation to long form
      let prop: string;
      if (node.key === 'General_Category' && node.value) {
        prop = expandGeneralCategory(node.value) ?? node.value;
      } else {
        prop = node.value ? `${node.key}=${node.value}` : node.key;
      }
      return node.negate ? `Not ${prop}` : prop;
    }
  }
}

function buildClassStringDisjunctionLabel(node: ClassStringDisjunction): string {
  if (!node.alternatives || node.alternatives.length === 0) {
    return String.raw`\q{}`;
  }

  const alternatives = node.alternatives.map(alt => {
    if (alt.elements && alt.elements.length > 0) {
      return alt.elements.map(e => e.raw).join('');
    }
    return '';
  });

  return String.raw`\q{${alternatives.join('|')}}`;
}

function buildModifierText(mods: Modifiers): string {
  const parts: string[] = [];

  if (mods.add) {
    const addFlags: string[] = [];
    if (mods.add.ignoreCase) addFlags.push('i');
    if (mods.add.multiline) addFlags.push('m');
    if (mods.add.dotAll) addFlags.push('s');
    if (addFlags.length > 0) {
      parts.push(`+${addFlags.join('')}`);
    }
  }

  if (mods.remove) {
    const removeFlags: string[] = [];
    if (mods.remove.ignoreCase) removeFlags.push('i');
    if (mods.remove.multiline) removeFlags.push('m');
    if (mods.remove.dotAll) removeFlags.push('s');
    if (removeFlags.length > 0) {
      parts.push(`-${removeFlags.join('')}`);
    }
  }

  return parts.join(' ');
}

function processQuantifier(
  node: Quantifier,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  groups: DiagramGroup[],
): string {
  const groupsLengthBefore = groups.length;
  // In regexpp, Quantifier wraps the element
  const innerNodeId = processNode(node.element, previousNodeId, nodes, edges, groups);

  const quantifierText = getQuantifierText(node);

  const greedyText = node.greedy ? '' : ' (non-greedy)';

  // Check if a group was created during processing
  if (groups.length > groupsLengthBefore) {
    // A group was added, update its quantifier
    const lastGroup = groups.at(-1);
    if (lastGroup && quantifierText) {
      lastGroup.quantifier = `${quantifierText}${greedyText}`;
    }
  } else {
    // Update the last node's label to include the quantifier
    const lastNode = nodes.at(-1);
    if (lastNode?.id === innerNodeId && quantifierText) {
      lastNode.label += `<br><i>${quantifierText}${greedyText}</i>`;
    }
  }

  return innerNodeId;
}

function getQuantifierText(quantifier: Quantifier): string {
  if (!quantifier) return '';

  // In regexpp, quantifiers have min/max properties
  // max can be Infinity or null for unbounded
  const min = quantifier.min;
  const max = quantifier.max;

  if (min === 0 && (max === null || max === Number.POSITIVE_INFINITY)) {
    return 'Zero or more';
  } else if (min === 1 && (max === null || max === Number.POSITIVE_INFINITY)) {
    return 'One or more';
  } else if (min === 0 && max === 1) {
    return 'Optional';
  } else if (min === max) {
    return `Exactly ${min}`;
  } else if (max === null || max === Number.POSITIVE_INFINITY) {
    return `${min} or more`;
  } else {
    return `${min} to ${max}`;
  }
}

function processGroup(
  node: CapturingGroup | Group,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  groups: DiagramGroup[],
): string {
  let groupName: string;
  let groupType: GroupType = 'standard';
  let groupNumber = 0;

  // In regexpp, CapturingGroup is for capturing groups
  if (node.type === 'CapturingGroup') {
    groupNumber = getNextGroupNumber();
    if (node.name) {
      groupType = 'named-capture';
      groupName = `${node.name} #${groupNumber}`;
    } else {
      groupName = `Group #${groupNumber}`;
    }
  } else if (node.type === 'Group') {
    // Handle modifiers if present
    if (node.modifiers) {
      groupType = 'modifier';
      groupName = 'Modifier';

      const modifierText = buildModifierText(node.modifiers);
      if (modifierText) {
        groupName = `Modifiers: ${modifierText}`;
      }
    } else {
      groupType = 'non-capturing';
      groupName = 'Non-capturing';
    }
  } else {
    // Must be Assertion type (for lookahead/lookbehind)
    groupName = 'Assertion';
  }

  const groupId = getNextNodeId(groupType);

  // Track the indices before processing to identify direct children
  const startNodeIndex = nodes.length;
  const startGroupIndex = groups.length;

  let innerEndNode = previousNodeId;

  // In regexpp, groups and assertions have 'alternatives' array
  if (node.alternatives && node.alternatives.length > 0) {
    const firstAlternative = node.alternatives[0];
    if (node.alternatives.length === 1 && firstAlternative) {
      // Single alternative, process directly
      innerEndNode = processNode(firstAlternative, previousNodeId, nodes, edges, groups);
    } else {
      // Multiple alternatives, treat as disjunction
      innerEndNode = processDisjunctionAlternatives(
        node.alternatives,
        previousNodeId,
        nodes,
        edges,
        groups,
      );
    }
  }

  // Collect direct children (nodes and groups created at this level)
  const children: string[] = [];

  // Add nodes that were created at this level (not nested in child groups)
  const childGroupIds = new Set<string>();
  for (let i = startGroupIndex; i < groups.length; i++) {
    const childGroup = groups[i];
    if (childGroup) {
      children.push(childGroup.id);
      // Track all nodes that belong to child groups
      for (const childNodeId of childGroup.children) {
        childGroupIds.add(childNodeId);
      }
    }
  }

  // Add only nodes that don't belong to any child group
  for (let i = startNodeIndex; i < nodes.length; i++) {
    const nodeItem = nodes[i];
    if (nodeItem && !childGroupIds.has(nodeItem.id)) {
      children.push(nodeItem.id);
    }
  }

  groups.push({
    id: groupId,
    type: groupType,
    number: groupNumber,
    label: groupName,
    children,
  });

  return innerEndNode;
}

// Process multiple alternatives as a disjunction (|)
function processDisjunctionAlternatives(
  alternatives: Alternative[],
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  groups: DiagramGroup[],
): string {
  const disjunctionNodeId = getNextNodeId('disjunction-begin');
  const mergeNodeId = getNextNodeId('disjunction-end');

  nodes.push(
    {
      id: disjunctionNodeId,
      type: 'disjunction',
      label: '',
    },
    {
      id: mergeNodeId,
      type: 'disjunction',
      label: '',
    },
  );

  edges.push({ from: previousNodeId, to: disjunctionNodeId });

  // Process each alternative as a branch
  for (const alternative of alternatives) {
    const branchEndNode = processNode(alternative, disjunctionNodeId, nodes, edges, groups);
    edges.push({ from: branchEndNode, to: mergeNodeId });
  }

  return mergeNodeId;
}

function processAssertion(
  node: Assertion,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  groups: DiagramGroup[],
): string {
  // In regexpp, lookahead and lookbehind assertions have 'alternatives' property
  // and should be treated as groups
  if (node.kind === 'lookahead' || node.kind === 'lookbehind') {
    return processAssertionAsGroup(node, previousNodeId, nodes, edges, groups);
  }

  // Simple assertions (^, $, \b, \B)
  const nodeId = getNextNodeId('assertion');
  let label = '';

  switch (node.kind) {
    case 'start':
      label = '^<br><i>Begins with</i>';
      break;
    case 'end':
      label = '$<br><i>Ends with</i>';
      break;
    case 'word':
      label = node.negate
        ? String.raw`\b<br><i>Word boundary</i>`
        : String.raw`\B<br><i>Not a word boundary</i>`;
      break;
  }

  nodes.push({
    id: nodeId,
    type: 'assertion',
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function processAssertionAsGroup(
  node: LookaroundAssertion,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  groups: DiagramGroup[],
): string {
  let groupName: string;
  let groupType: GroupType;

  if (node.kind === 'lookahead') {
    groupType = node.negate ? 'negative-lookahead' : 'positive-lookahead';
    groupName = node.negate ? 'Negative Lookahead' : 'Positive Lookahead';
  } else {
    // lookbehind
    groupType = node.negate ? 'negative-lookbehind' : 'positive-lookbehind';
    groupName = node.negate ? 'Negative Lookbehind' : 'Positive Lookbehind';
  }

  const groupId = getNextNodeId(groupType);

  // Track the indices before processing to identify direct children
  const startNodeIndex = nodes.length;
  const startGroupIndex = groups.length;

  let innerEndNode = previousNodeId;

  // Process alternatives
  if (node.alternatives.length > 0) {
    const firstAlternative = node.alternatives[0];
    if (node.alternatives.length === 1 && firstAlternative) {
      innerEndNode = processNode(firstAlternative, previousNodeId, nodes, edges, groups);
    } else {
      innerEndNode = processDisjunctionAlternatives(
        node.alternatives,
        previousNodeId,
        nodes,
        edges,
        groups,
      );
    }
  }

  // Collect direct children
  const children: string[] = [];
  const childGroupIds = new Set<string>();

  for (let i = startGroupIndex; i < groups.length; i++) {
    const childGroup = groups[i];
    if (childGroup) {
      children.push(childGroup.id);
      for (const childId of childGroup.children) {
        childGroupIds.add(childId);
      }
    }
  }

  for (let i = startNodeIndex; i < nodes.length; i++) {
    const nodeItem = nodes[i];
    if (nodeItem && !childGroupIds.has(nodeItem.id)) {
      children.push(nodeItem.id);
    }
  }

  groups.push({
    id: groupId,
    type: groupType,
    number: 0,
    label: groupName,
    children,
  });

  return innerEndNode;
}

function processBackreference(
  node: Backreference,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): string {
  const nodeId = getNextNodeId('back-reference');
  const label = `\\${node.raw}<br><i>Back-reference</i>`;

  nodes.push({
    id: nodeId,
    type: 'back-reference',
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

export function escapeSingleChar(text: string): string {
  // Handle character class escapes
  const escapeMap: Record<string, string> = {
    ' ': 'Space',
    '"': '#quot;',
  };

  if (escapeMap[text]) {
    return escapeMap[text];
  }

  return text;
}

export function buildFriendlyLabel(text: string): string {
  // Handle character class escapes
  const escapeMap: Record<string, string> = {
    '\\d': 'Any digit',
    '\\D': 'Not a digit',
    '\\w': 'Any word character',
    '\\W': 'Not a word character',
    '\\s': 'Any whitespace',
    '\\S': 'Not whitespace',
    '\\t': 'Tab',
    '\\r': 'Return',
    '\\n': 'Newline',
    '\\f': 'Form feed',
    '\\v': 'Vertical tab',
    '\\.': 'Any character',
    '.': 'Any character',
  };

  if (escapeMap[text]) {
    return escapeMap[text];
  }

  return text;
}

export function buildFriendlyId(id: string): string {
  // Replace any characters that might cause issues in Mermaid
  return id.replaceAll(/\W/g, '_');
}
