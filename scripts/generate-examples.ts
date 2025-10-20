#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Flavor, regexToMermaid } from '../src';
import { buildRegexAst, parseRegexByFlavor } from '../src/parser';

interface RegexFile {
  filename: string;
  name: string;
  description?: string;
  flavor?: string;
  pattern: string;
}

/**
 * Parse a regex file with YAML frontmatter
 */
function parseRegexFile(content: string): {
  name: string;
  description?: string;
  flavor?: string;
  pattern: string;
} {
  const lines = content.trim().split('\n');

  let name = '';
  let description: string | undefined;
  let flavor: string | undefined;
  let pattern = '';
  let inFrontmatter = false;
  let frontmatterEnded = false;

  for (const line of lines) {
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        inFrontmatter = false;
        frontmatterEnded = true;
      }
      continue;
    }

    if (inFrontmatter) {
      if (line.startsWith('name:')) {
        name = line.substring(5).trim();
      } else if (line.startsWith('description:')) {
        description = line.substring(12).trim();
      } else if (line.startsWith('flavor:')) {
        flavor = line.substring(7).trim();
      }
    } else if (frontmatterEnded && line.trim()) {
      pattern = line.trim();
      break;
    }
  }

  return { name, description, flavor, pattern };
}

/**
 * Generate a slug from a name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Main function to generate examples
 */
async function generateExamples() {
  const diagramsDir = join(import.meta.dir, '..', 'diagrams');
  const examplesFile = join(import.meta.dir, '..', 'EXAMPLES.md');

  // Read all .regex files
  const files = await readdir(diagramsDir);
  const regexFiles = files.filter(f => f.endsWith('.regex')).sort();

  // Parse all regex files
  const examples: RegexFile[] = [];
  for (const filename of regexFiles) {
    const content = await readFile(join(diagramsDir, filename), 'utf-8');
    const parsed = parseRegexFile(content);

    if (parsed.name && parsed.pattern) {
      examples.push({
        filename,
        name: parsed.name,
        description: parsed.description,
        flavor: parsed.flavor,
        pattern: parsed.pattern,
      });
    }
  }

  // Generate TOC
  let toc = '## Table of Contents\n\n';
  for (const example of examples) {
    const slug = slugify(example.name);
    toc += `- [${example.name}](#${slug})\n`;
  }
  toc += '\n';

  // Generate examples sections
  let content = '';
  for (const example of examples) {
    content += `## ${example.name}\n\n`;

    if (example.description) {
      content += `${example.description}\n\n`;
    }

    content += '**Pattern:**\n\n';
    content += '```regex\n';
    content += `${example.pattern}\n`;
    content += '```\n\n';

    // Generate the mermaid diagram
    try {
      const diagram = regexToMermaid(example.pattern, {
        direction: 'LR',
        theme: 'default',
      });
      content += '**Diagram:**\n\n';
      content += '```mermaid\n';
      content += `${diagram}\n`;
      content += '```\n\n';

      // Write the mermaid diagram to a separate file
      const mermaidFilename = example.filename.replace('.regex', '.mermaid');
      const mermaidPath = join(diagramsDir, mermaidFilename);
      await writeFile(mermaidPath, diagram, 'utf-8');

      // Write AST JSON file
      const regex = parseRegexByFlavor(example.pattern, (example.flavor as Flavor) ?? 'auto');
      const ast = buildRegexAst(regex);
      const astFilename = example.filename.replace('.regex', '.json');
      const astPath = join(diagramsDir, astFilename);
      await writeFile(astPath, JSON.stringify(ast, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error processing ${example.filename}:`, error);
      content += '*Error generating diagram*\n\n';
    }

    content += '---\n\n';
  }

  // Read the current EXAMPLES.md
  const examplesContent = await readFile(examplesFile, 'utf-8');

  // Replace content between markers
  const startMarker = '<!-- CONTENT:START -->';
  const endMarker = '<!-- CONTENT:END -->';

  const startIndex = examplesContent.indexOf(startMarker);
  const endIndex = examplesContent.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find content markers in EXAMPLES.md');
  }

  const newContent =
    examplesContent.substring(0, startIndex + startMarker.length) +
    '\n\n' +
    toc +
    content +
    examplesContent.substring(endIndex);

  // Write the updated file
  await writeFile(examplesFile, newContent, 'utf-8');

  console.log(`✅ Generated examples for ${examples.length} regex patterns`);
  console.log(`📄 Updated ${examplesFile}`);
}

// Run the script
generateExamples().catch(error => {
  console.error('Error generating examples:', error);
  process.exit(1);
});
