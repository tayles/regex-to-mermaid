import pcreToRegexp from 'pcre-to-regexp';
import regexpTree from 'regexp-tree';
import type { AstRegExp } from 'regexp-tree/ast';
import type { DiagramData, DiagramNode, Edge, Flavor, Group } from './types';

// Type for AST nodes from regexp-tree
// biome-ignore lint/suspicious/noExplicitAny: regexp-tree doesn't export detailed node types
type AstNode = any;

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
  if (flavor === 'pcre') {
    // PCRE: Convert using pcre-to-regexp
    return pcreToRegexp(regex);
  } else if (flavor === 'regexp') {
    // JavaScript RegExp: Parse directly
    return parseJavaScriptRegex(regex);
  } else {
    // Auto: Try JavaScript RegExp first, fallback to PCRE
    try {
      return parseJavaScriptRegex(regex);
    } catch (regexpError) {
      try {
        return pcreToRegexp(regex);
      } catch {
        // If both fail, throw the original RegExp error
        throw regexpError;
      }
    }
  }
}

export function buildRegexAst(pattern: string | RegExp): AstRegExp {
  const ast = regexpTree.parse(pattern, {
    captureLocations: true,
  });
  return ast;
}

const nodeCounters: Map<string, number> = new Map();

function getNextNodeId(nodeType: string): string {
  const count = nodeCounters.get(nodeType) || 1;
  nodeCounters.set(nodeType, count + 1);
  return buildFriendlyId(`${nodeType}_${count}`);
}

export function generateDiagramData(ast: AstRegExp): DiagramData {
  nodeCounters.clear();

  const nodes: DiagramNode[] = [];
  const edges: Edge[] = [];
  const groups: Group[] = [];

  if (!ast.body) {
    return { nodes, edges, groups };
  }

  // Process the regex body
  const startNodeId = 'start';
  const endNodeId = 'fin';
  const lastNodeId = processNode(ast.body, startNodeId, nodes, edges, groups);

  // Connect the last node to the end
  if (lastNodeId) {
    edges.push({ from: lastNodeId, to: endNodeId });
  }

  return { nodes, edges, groups };
}

function processNode(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
  groups: Group[],
): string {
  switch (node.type) {
    case 'Alternative':
      return processAlternative(node, previousNodeId, nodes, edges, groups);
    case 'Char':
      return processChar(node, previousNodeId, nodes, edges);
    case 'CharacterClass':
      return processCharacterClass(node, previousNodeId, nodes, edges);
    case 'Repetition':
      return processRepetition(node, previousNodeId, nodes, edges, groups);
    case 'Group':
      return processGroup(node, previousNodeId, nodes, edges, groups);
    case 'Disjunction':
      return processDisjunction(node, previousNodeId, nodes, edges, groups);
    case 'Assertion':
      // Lookahead and lookbehind assertions should be treated as groups
      if (node.kind === 'Lookahead' || node.kind === 'Lookbehind') {
        return processGroup(node, previousNodeId, nodes, edges, groups);
      }
      return processAssertion(node, previousNodeId, nodes, edges);
    case 'Backreference':
      return processBackreference(node, previousNodeId, nodes, edges);
    default:
      return previousNodeId;
  }
}

function processAlternative(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
  groups: Group[],
): string {
  let currentNodeId = previousNodeId;

  // Combine consecutive Char nodes into a single literal node
  const expressions = node.expressions || [];
  const combined: AstNode[] = [];

  let i = 0;
  while (i < expressions.length) {
    if (expressions[i].type === 'Char') {
      // Collect consecutive Char nodes
      const chars: AstNode[] = [];
      while (i < expressions.length && expressions[i].type === 'Char') {
        chars.push(expressions[i]);
        i++;
      }
      // Create a combined node
      combined.push({ type: 'CombinedChars', chars });
    } else {
      combined.push(expressions[i]);
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
  chars: AstNode[],
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
): string {
  const text = chars.map(c => c.value).join('');
  const nodeId = getNextNodeId('literal');
  const label = buildFriendlyLabel(text, 'literal');

  nodes.push({
    id: nodeId,
    type: 'literal',
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function processChar(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
): string {
  const nodeId = getNextNodeId('literal');
  const label = buildFriendlyLabel(node.value, 'literal');

  nodes.push({
    id: nodeId,
    type: 'literal',
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function processCharacterClass(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
): string {
  const nodeType = node.negative ? 'negated-char-class' : 'char-class';
  const nodeId = getNextNodeId(nodeType);
  const label = buildCharacterClassLabel(node);

  nodes.push({
    id: nodeId,
    type: nodeType,
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function buildCharacterClassLabel(node: AstNode): string {
  if (!node.expressions || node.expressions.length === 0) {
    return '[]';
  }

  const singleChars: string[] = [];
  const ranges: string[] = [];

  for (const expr of node.expressions) {
    if (expr.type === 'Char') {
      singleChars.push(escapeSingleChar(expr.value));
    } else if (expr.type === 'ClassRange') {
      const from = expr.from.value;
      const to = expr.to.value;
      const rangeName = getFriendlyRangeName(from, to);
      ranges.push(rangeName ?? `${from}-${to}`);
    } else if (expr.type === 'CharacterClass') {
      // Nested character class (shouldn't normally happen)
      ranges.push(buildCharacterClassLabel(expr));
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

function processRepetition(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
  groups: Group[],
): string {
  const quantifier = node.quantifier;
  const groupsLengthBefore = groups.length;
  const innerNodeId = processNode(node.expression, previousNodeId, nodes, edges, groups);

  const quantifierText = getQuantifierText(quantifier);

  // Check if a group was created during processing
  if (groups.length > groupsLengthBefore) {
    // A group was added, update its quantifier
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && quantifierText) {
      lastGroup.quantifier = quantifierText;
    }
  } else {
    // Update the last node's label to include the quantifier
    const lastNode = nodes[nodes.length - 1];
    if (lastNode && lastNode.id === innerNodeId && quantifierText) {
      lastNode.label += `<br><i>${quantifierText}</i>`;
    }
  }

  return innerNodeId;
}

function getQuantifierText(quantifier: AstNode): string {
  if (!quantifier) return '';

  switch (quantifier.kind) {
    case '*':
      return 'Zero or more';
    case '+':
      return 'One or more';
    case '?':
      return 'Optional';
    case 'Range':
      if (quantifier.from === quantifier.to) {
        return `Exactly ${quantifier.from}`;
      } else if (quantifier.to === undefined || quantifier.to === null) {
        return `${quantifier.from} or more`;
      } else {
        return `${quantifier.from} to ${quantifier.to}`;
      }
    default:
      return '';
  }
}

function processGroup(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
  groups: Group[],
): string {
  const groupNumber = node.number || 0;

  let groupName: string;
  let groupType: Group['type'] = 'standard';

  if (node.kind === 'Lookahead') {
    groupType = node.negative ? 'negative-lookahead' : 'positive-lookahead';
    groupName = node.negative ? 'Negative Lookahead' : 'Positive Lookahead';
  } else if (node.kind === 'Lookbehind') {
    groupType = node.negative ? 'negative-lookbehind' : 'positive-lookbehind';
    groupName = node.negative ? 'Negative Lookbehind' : 'Positive Lookbehind';
  } else if (node.name) {
    groupType = 'named-capture';
    groupName = node.name;
  } else if (!node.capturing) {
    groupType = 'non-capturing';
    groupName = 'Non-capturing';
  } else {
    groupName = `Group ${groupNumber}`;
  }

  const groupId = getNextNodeId(groupType);

  // Track the indices before processing to identify direct children
  const startNodeIndex = nodes.length;
  const startGroupIndex = groups.length;

  // Process the group's content
  // Lookahead/lookbehind use 'assertion' field, groups use 'expression' field
  const content = node.assertion || node.expression;
  let innerEndNode = previousNodeId;

  // Only process content if it exists (handles empty groups/assertions)
  if (content) {
    innerEndNode = processNode(content, previousNodeId, nodes, edges, groups);
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
      childGroup.children.forEach(childId => {
        childGroupIds.add(childId);
      });
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

function processDisjunction(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
  groups: Group[],
): string {
  // Flatten nested disjunctions to create a single level of branching
  const branches = flattenDisjunction(node);

  const disjunctionNodeId = getNextNodeId('disjunction-begin');
  const mergeNodeId = getNextNodeId('disjunction-end');

  nodes.push({
    id: disjunctionNodeId,
    type: 'disjunction',
    label: '',
  });

  nodes.push({
    id: mergeNodeId,
    type: 'disjunction',
    label: '',
  });

  edges.push({ from: previousNodeId, to: disjunctionNodeId });

  // Process each branch
  for (const branch of branches) {
    const branchEndNode = processNode(branch, disjunctionNodeId, nodes, edges, groups);
    edges.push({ from: branchEndNode, to: mergeNodeId });
  }

  return mergeNodeId;
}

function flattenDisjunction(node: AstNode): AstNode[] {
  const branches: AstNode[] = [];

  // Recursively collect all branches from nested disjunctions
  function collectBranches(n: AstNode): void {
    // Handle null or undefined nodes (empty alternatives)
    if (!n) {
      return;
    }

    if (n.type === 'Disjunction') {
      collectBranches(n.left);
      collectBranches(n.right);
    } else {
      branches.push(n);
    }
  }

  collectBranches(node);
  return branches;
}

function processAssertion(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
): string {
  const nodeId = getNextNodeId('assertion');
  let label = '';

  switch (node.kind) {
    case '^':
      label = '^<br><i>Begins with</i>';
      break;
    case '$':
      label = '$<br><i>Ends with</i>';
      break;
    case '\\b':
      label = '\\b<br><i>Word boundary</i>';
      break;
    case '\\B':
      label = '\\B<br><i>Non-word boundary</i>';
      break;
    default:
      label = node.kind;
  }

  nodes.push({
    id: nodeId,
    type: 'assertion',
    label,
  });

  edges.push({ from: previousNodeId, to: nodeId });
  return nodeId;
}

function processBackreference(
  node: AstNode,
  previousNodeId: string,
  nodes: DiagramNode[],
  edges: Edge[],
): string {
  const nodeId = getNextNodeId('back-reference');
  const label = `\\${node.reference}<br><i>Back-reference</i>`;

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

export function buildFriendlyLabel(text: string, _type?: string): string {
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
    '.': 'Any character',
  };

  if (escapeMap[text]) {
    return escapeMap[text];
  }

  return text;
}

export function buildFriendlyId(id: string): string {
  // Replace any characters that might cause issues in Mermaid
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}
