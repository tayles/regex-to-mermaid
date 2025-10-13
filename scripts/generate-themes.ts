#!/usr/bin/env bun
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { processRegex } from '../src/cli';
import { THEMES } from '../src/theme';
import type { Theme } from '../src/theme';

/**
 * Generate theme previews for THEMES.md
 */
async function generateThemes() {
  const themesFile = join(import.meta.dir, '..', 'THEMES.md');
  const exampleFile = join(import.meta.dir, '..', 'diagrams', 'example-1.regex');

  // Read the example regex file
  const exampleContent = await readFile(exampleFile, 'utf-8');
  const lines = exampleContent.trim().split('\n');

  // Extract the pattern (last non-empty line)
  let pattern = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]?.trim();
    if (line && !line.startsWith('---')) {
      pattern = line;
      break;
    }
  }

  if (!pattern) {
    throw new Error('Could not find pattern in example-1.regex');
  }

  console.log(`Using pattern: ${pattern}`);

  // Generate content for each theme
  let content = '';

  for (const theme of THEMES) {
    const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);
    content += `## ${themeName}\n\n`;

    if (theme === 'none') {
      content += 'No styling applied - uses default Mermaid colors.\n\n';
    } else {
      content += `The ${theme} theme provides a ${getThemeDescription(theme)} color scheme.\n\n`;
    }

    // Add command to recreate
    content += '**Command:**\n\n';
    content += '```bash\n';
    content += `regex-to-mermaid 'foo|bar' --theme ${theme}\n`;
    content += '```\n\n';

    // Generate the diagram
    try {
      const diagram = processRegex(pattern, {
        direction: 'LR',
        theme: theme as Theme,
        output: undefined,
      });

      content += '**Preview:**\n\n';
      content += '```mermaid\n';
      content += diagram + '\n';
      content += '```\n\n';
    } catch (error) {
      console.error(`Error generating theme ${theme}:`, error);
      content += '*Error generating diagram*\n\n';
    }

    content += '---\n\n';
  }

  // Read the current THEMES.md
  const themesContent = await readFile(themesFile, 'utf-8');

  // Replace content between markers
  const startMarker = '<!-- CONTENT:START -->';
  const endMarker = '<!-- CONTENT:END -->';

  const startIndex = themesContent.indexOf(startMarker);
  const endIndex = themesContent.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find content markers in THEMES.md');
  }

  const newContent =
    themesContent.substring(0, startIndex + startMarker.length) +
    '\n\n' +
    content +
    themesContent.substring(endIndex);

  // Write the updated file
  await writeFile(themesFile, newContent, 'utf-8');

  console.log(`✅ Generated previews for ${THEMES.length} themes`);
  console.log(`📄 Updated ${themesFile}`);
}

/**
 * Get a description for each theme
 */
function getThemeDescription(theme: string): string {
  switch (theme) {
    case 'default':
      return 'colorful and vibrant';
    case 'neutral':
      return 'muted and professional';
    case 'dark':
      return 'dark mode friendly';
    case 'forest':
      return 'nature-inspired green and brown';
    default:
      return 'custom';
  }
}

// Run the script
generateThemes().catch(error => {
  console.error('Error generating themes:', error);
  process.exit(1);
});
