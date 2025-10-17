import { Command } from 'commander';
import { buildRegexAst, generateDiagramData, parseRegexByFlavor } from './parser';
import { buildMermaidDiagram } from './renderer';
import { THEMES, type Theme } from './theme';
import { FLAVORS, type Direction, type Flavor } from './types';
import packageJson from '../package.json';

export interface CLIOptions {
  output?: string;
  direction: Direction;
  theme: Theme;
  flavor: Flavor;
}

export function createCLI(): Command {
  const program = new Command();

  program
    .name('regex-to-mermaid')
    .description('Convert regular expressions to Mermaid flowchart diagrams')
    .version('1.0.0')
    .argument('<regex>', 'Regular expression pattern to visualize')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option(
      '-d, --direction <direction>',
      'Diagram direction: TD (top-down) or LR (left-right)',
      'LR',
    )
    .option(
      '-t, --theme <theme>',
      'Mermaid theme: default, neutral, dark, forest, or none',
      'default',
    )
    .option(
      '-f, --flavor <flavor>',
      'Regex flavor: regexp (JavaScript), pcre (PCRE), or auto (detect automatically)',
      'auto',
    )
    .action((regex: string, options: CLIOptions) => {
      const diagram = processRegex(regex, options);
      writeOutput(diagram, options.output);
    });

  return program;
}

export function processRegex(regex: string, options: CLIOptions): string {
  // merge options with defaults
  options = {
    output: undefined,
    ...options,
    direction: options.direction ?? 'LR',
    theme: options.theme ?? 'default',
    flavor: options.flavor ?? 'auto',
  };

  // Validate direction
  const direction = options.direction.toUpperCase() as Direction;
  if (direction !== 'TD' && direction !== 'LR') {
    throw new Error(`Invalid direction: ${options.direction}. Must be TD or LR.`);
  }

  // Validate theme
  const theme = options.theme.toLowerCase() as Theme;
  if (!THEMES.includes(theme)) {
    throw new Error(`Invalid theme: ${options.theme}. Must be one of: ${THEMES.join(', ')}.`);
  }

  // Validate flavor
  const flavor = options.flavor.toLowerCase() as Flavor;
  if (!FLAVORS.includes(flavor)) {
    throw new Error(`Invalid flavor: ${options.flavor}. Must be one of: ${FLAVORS.join(', ')}.`);
  }

  // Parse the regex based on flavor
  let pattern: RegExp;
  try {
    pattern = parseRegexByFlavor(regex, flavor);
  } catch (error) {
    throw new Error(
      `Invalid regular expression: ${error instanceof Error ? error.message : error}`,
    );
  }

  // Generate diagram data
  const ast = buildRegexAst(pattern);
  const data = generateDiagramData(ast);

  // Build the Mermaid diagram
  let diagram = buildMermaidDiagram(data, direction, theme);

  // Add regex pattern as comment and suffix with package info
  diagram = `%% Regex: ${regex}\n\n${diagram}\n\n%% Generated with ${packageJson.name}@${packageJson.version}`;

  return diagram;
}

export function writeOutput(content: string, outputPath?: string): void {
  if (outputPath) {
    // Write to file
    Bun.write(outputPath, content);
  } else {
    // Write to stdout
    console.log(content);
  }
}

export async function runCLI(args: string[]): Promise<void> {
  const program = createCLI();
  await program.parseAsync(args);
}
