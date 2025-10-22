#!/usr/bin/env bun

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { regexToMermaid } from '../src';
import type { Theme } from '../src/theme';
import { THEMES } from '../src/theme';
import {
  DIAGRAMS_DIR,
  generateToc,
  parseRegexFile,
  themeToMermaidTheme,
  titleCase,
  writeInjectedContent,
  writeMermaidImageFile,
} from './regex-utils';

const themeDescriptions: Record<Theme, string> = {
  default: 'Closely matches the default Mermaid theme with additional node and subgraph colors',
  neutral: 'A muted, professional color scheme',
  dark: 'A dark mode friendly color scheme',
  forest: 'A nature-inspired green and brown color scheme',
  none: 'No styling applied - uses default Mermaid colors',
};

interface ThemeWithMarkdown {
  theme: Theme;
  markdown: string;
}

/**
 * Generate theme previews for THEMES.md
 */
async function generateThemes() {
  const themesFilePath = join(import.meta.dir, '..', 'THEMES.md');

  const regexFilePath = join(import.meta.dir, '..', DIAGRAMS_DIR, 'url.regex');

  // Read the example regex file
  const regexFileContent = await readFile(regexFilePath, 'utf-8');
  const regexDescriptor = parseRegexFile(regexFileContent);

  const pattern = regexDescriptor.pattern;

  console.log(`Using pattern: ${pattern}`);

  // Generate content for each theme
  const themeMarkdowns: ThemeWithMarkdown[] = [];

  for (const theme of THEMES) {
    const diagram = regexToMermaid(regexDescriptor.pattern, {
      flavor: regexDescriptor.flavor === 'regexp' ? 'regexp' : 'auto',
      direction: 'LR',
      theme,
    });

    const imageFilePath =
      theme === 'default'
        ? regexFilePath.replace('.regex', `.mermaid-diagram.png`) // no suffix for simplicity
        : regexFilePath.replace('.regex', `.mermaid-diagram.${theme}-theme.png`);

    // default is already generated for examples
    if (theme !== 'default') {
      await writeMermaidImageFile(imageFilePath, diagram, themeToMermaidTheme(theme));
    }

    const themeMarkdown = generateThemeMarkdown(theme, diagram, imageFilePath);

    themeMarkdowns.push({ theme, markdown: themeMarkdown });
  }

  // Write THEMES.md
  await writeThemesMarkdown(themesFilePath, themeMarkdowns);

  console.log(`✅ Generated previews for ${THEMES.length} themes`);
}

function generateThemeMarkdown(theme: Theme, diagram: string, imageFilePath: string): string {
  const themeName = titleCase(theme);

  const description = themeDescriptions[theme];

  const command = `regex-to-mermaid 'foo|bar' --theme ${theme}`;

  const content = `
## ${themeName}

${description}

### Command

\`\`\`shell
${command}
\`\`\`

### Preview

<details>
<summary>Click to view as image</summary>
<img src="${imageFilePath}" alt="Mermaid diagram for theme ${theme}" />
</details>

\`\`\`mermaid
${diagram}
\`\`\`
  `.trim();

  return content;
}

async function writeThemesMarkdown(filePath: string, sections: ThemeWithMarkdown[]) {
  // Generate TOC
  const toc = generateToc(sections.map(e => titleCase(e.theme)));

  const content = `
## Table of Contents

${toc}

${sections.map(section => section.markdown).join('\n\n---\n\n')}
  `.trim();

  await writeInjectedContent(filePath, content);
}

// Run the script
generateThemes().catch(error => {
  console.error('Error generating themes:', error);
  process.exit(1);
});
