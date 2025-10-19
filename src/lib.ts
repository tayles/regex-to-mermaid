import packageJson from '../package.json';
import { buildRegexAst, generateDiagramData, parseRegexByFlavor } from './parser';
import { buildMermaidDiagram } from './renderer';
import type { Direction, Flavor, Options, Theme } from './types';
import { DEFAULT_OPTIONS, DIRECTIONS, FLAVORS, THEMES } from './types';

/**
 * Convert a regular expression to a Mermaid flowchart diagram
 *
 * @param pattern - Regular expression pattern (string or RegExp object)
 * @param options - Configuration options
 * @param options.direction - Diagram direction: 'LR' (left-right) or 'TD' (top-down). Default: 'LR'
 * @param options.flavor - Regex flavor: 'regexp' (JavaScript), 'pcre' (PCRE), or 'auto' (detect automatically). Default: 'auto'
 * @param options.theme - Mermaid theme: 'default', 'neutral', 'dark', 'forest', or 'none'. Default: 'default'
 * @returns Mermaid diagram as a string
 *
 * @example
 * ```typescript
 * import { regexToMermaid } from 'regex-to-mermaid';
 *
 * const diagram = regexToMermaid(/^foo|bar$/);
 *
 * console.log(diagram);
 * ```
 */
export function regexToMermaid(pattern: string | RegExp, options: Options = {}): string {
  // Apply defaults
  const direction: Direction = options.direction ?? DEFAULT_OPTIONS.direction;
  const theme: Theme = options.theme ?? DEFAULT_OPTIONS.theme;
  const flavor: Flavor = options.flavor ?? DEFAULT_OPTIONS.flavor;

  // Validate direction
  if (!DIRECTIONS.includes(direction)) {
    throw new Error(`Invalid direction: ${direction}. Must be one of: ${DIRECTIONS.join(', ')}`);
  }

  // Validate theme
  if (!THEMES.includes(theme)) {
    throw new Error(`Invalid theme: ${theme}. Must be one of: ${THEMES.join(', ')}`);
  }

  // Validate flavor
  if (!FLAVORS.includes(flavor)) {
    throw new Error(`Invalid flavor: ${flavor}. Must be one of: ${FLAVORS.join(', ')}`);
  }

  // Convert pattern to RegExp if it's a string
  let regexPattern: RegExp;
  if (typeof pattern === 'string') {
    try {
      regexPattern = parseRegexByFlavor(pattern, flavor);
    } catch (error) {
      throw new Error(
        `Invalid regular expression: ${error instanceof Error ? error.message : error}`,
      );
    }
  } else if (pattern instanceof RegExp) {
    regexPattern = pattern;
  } else {
    throw new Error('Pattern must be a string or RegExp object');
  }

  // Generate diagram data
  const ast = buildRegexAst(regexPattern);
  const data = generateDiagramData(ast);

  // Build the Mermaid diagram
  let diagram = buildMermaidDiagram(data, direction, theme);

  // Add regex pattern as comment and suffix with package info
  diagram = `%% Regex: ${pattern}\n\n${diagram}\n\n%% Generated with ${packageJson.name}@${packageJson.version}`;

  return diagram;
}
