import { writeFileSync } from 'node:fs';
import { Command } from 'commander';
import packageJson from '../package.json';
import { regexToMermaid } from './lib';
import type { Direction, Flavor, Options, Theme } from './types';
import { DEFAULT_OPTIONS } from './types';

interface CLIOptions extends Options {
  output?: string;
}

function createCLI(): Command {
  const program = new Command();

  program
    .name('regex-to-mermaid')
    .description('Convert regular expressions to Mermaid flowchart diagrams')
    .version(packageJson.version)
    .argument('<regex>', 'Regular expression pattern to visualize')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option(
      '-d, --direction <direction>',
      'Diagram direction: TD (top-down) or LR (left-right)',
      DEFAULT_OPTIONS.direction,
    )
    .option(
      '-t, --theme <theme>',
      'Mermaid theme: default, neutral, dark, forest, or none',
      DEFAULT_OPTIONS.theme,
    )
    .option(
      '-f, --flavor <flavor>',
      'Regex flavor: regexp (ECMAScript), or auto (detect automatically)',
      DEFAULT_OPTIONS.flavor,
    )
    .action((regex: string, options: CLIOptions) => {
      const diagram = processRegex(regex, options);
      writeOutput(diagram, options.output);
    });

  return program;
}

function processRegex(regex: string, options: CLIOptions): string {
  // Normalize and validate options
  const direction = (options.direction?.toUpperCase() ?? DEFAULT_OPTIONS.direction) as Direction;
  const theme = (options.theme?.toLowerCase() ?? DEFAULT_OPTIONS.theme) as Theme;
  const flavor = (options.flavor?.toLowerCase() ?? DEFAULT_OPTIONS.flavor) as Flavor;

  // Generate diagram using the main function
  const diagram = regexToMermaid(regex, {
    direction,
    theme,
    flavor,
  });

  return diagram;
}

function writeOutput(content: string, outputPath?: string): void {
  if (outputPath) {
    // Write to file
    writeFileSync(outputPath, content, 'utf-8');
  } else {
    // Write to stdout
    console.log(content);
  }
}

export async function runCLI(args: string[]): Promise<void> {
  const program = createCLI();
  await program.parseAsync(args);
}
