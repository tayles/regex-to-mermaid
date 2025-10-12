import { Command } from 'commander';
import { buildRegexAst, generateDiagramData } from './parser';
import { buildMermaidDiagram } from './renderer';
import { THEMES, type Theme } from './theme';
import type { Direction } from './types';

export interface CLIOptions {
  output?: string;
  direction: Direction;
  theme: Theme;
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
    .action((regex: string, options: CLIOptions) => {
      const diagram = processRegex(regex, options);
      writeOutput(diagram, options.output);
    });

  return program;
}

export function processRegex(regex: string, options: CLIOptions): string {
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

  // Parse the regex
  let pattern: RegExp;
  try {
    // Try to parse as a regex literal first
    if (regex.startsWith('/')) {
      const lastSlash = regex.lastIndexOf('/');
      if (lastSlash > 0) {
        const patternStr = regex.slice(1, lastSlash);
        const flags = regex.slice(lastSlash + 1);
        pattern = new RegExp(patternStr, flags);
      } else {
        pattern = new RegExp(regex);
      }
    } else {
      // Treat as plain string pattern
      pattern = new RegExp(regex);
    }
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

  // Add regex pattern as comment
  diagram = `%% ${regex}\n\n${diagram}`;

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
