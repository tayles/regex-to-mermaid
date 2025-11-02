#!/usr/bin/env bun

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { regexToMermaid } from '../src';
import type { Theme, ThemeWithStyles } from '../src/theme';
import { THEME_GROUP_STYLES, THEME_NODE_STYLES, THEMES } from '../src/theme';
import {
  DIAGRAMS_DIR,
  generateMermaidLiveLink,
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

interface ThemeImageData {
  theme: Theme;
  diagram: string;
  imageFilePath: string;
}

/**
 * Generate theme previews for THEMES.md
 */
async function generateThemes(generateImages = true) {
  const themesFilePath = join(import.meta.dir, '..', 'THEMES.md');

  const regexFilePath = join(DIAGRAMS_DIR, 'url.regex');

  // Read the example regex file
  const regexFileContent = await readFile(regexFilePath, 'utf-8');
  const regexDescriptor = parseRegexFile(regexFileContent);

  const pattern = regexDescriptor.pattern;

  console.log(`Using pattern: ${pattern}`);

  // Generate content for each theme
  const themeMarkdowns: ThemeWithMarkdown[] = [];
  const imageData: ThemeImageData[] = [];

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

    const mermaidLiveUrl = await generateMermaidLiveLink(diagram);

    const themeMarkdown = generateThemeMarkdown(theme, diagram, imageFilePath, mermaidLiveUrl);

    themeMarkdowns.push({ theme, markdown: themeMarkdown });

    // Skip default theme in image generation as it's already generated for examples
    if (theme !== 'default') {
      imageData.push({ theme, diagram, imageFilePath });
    }
  }

  // Write THEMES.md
  await writeThemesMarkdown(themesFilePath, themeMarkdowns);

  console.log(`✅ Generated previews for ${THEMES.length} themes`);

  // Generate images in separate loop
  if (generateImages) {
    console.log('\nGenerating images...');
    for (const { theme, diagram, imageFilePath } of imageData) {
      console.log(`Generating image for theme: ${theme}...`);
      await writeMermaidImageFile(imageFilePath, diagram, themeToMermaidTheme(theme));
    }
    console.log(`✅ Generated ${imageData.length} images (default theme skipped)`);
  } else {
    console.log('\n⏭️  Skipping image generation (use --images to enable)');
  }
}

function generateThemeStylesMarkdownTable(theme: ThemeWithStyles): string {
  const nodeStyles = THEME_NODE_STYLES[theme];
  const groupStyles = THEME_GROUP_STYLES[theme];

  const parseStyle = (style: string): Record<string, string> => {
    const entries = style.split(',').map(part =>
      part
        .trim()
        .split(':')
        .map(s => s.trim()),
    );
    return Object.fromEntries(entries);
  };

  const printHex = (hex?: string): string => {
    return hex ? `\`${hex}\`` : '-';
  };

  const toRows = (styles: Record<string, string>): string => {
    return Object.entries(styles)
      .map(([type, style]) => {
        const styles = parseStyle(style);
        return `| ${type} | ${printHex(styles.fill)} | ${printHex(styles.stroke)} | ${printHex(
          styles.color,
        )} |`;
      })
      .join('\n');
  };

  return `
| Node/Group Type        | Fill       | Border     | Text       |
| ---------------------- | ---------- | ---------- | ---------- |
${toRows(nodeStyles)}
${toRows(groupStyles)}
`;
}

function generateThemeMarkdown(
  theme: Theme,
  diagram: string,
  imageFilePath: string,
  mermaidLiveUrl: string,
): string {
  const themeName = titleCase(theme);

  const description = themeDescriptions[theme];

  const command = `regex-to-mermaid 'foo|bar' --theme ${theme}`;

  const stylesTable =
    theme !== 'none' ? `### Styles\n\n${generateThemeStylesMarkdownTable(theme)}` : '';

  const content = `
## ${themeName}

${description}

### Command

\`\`\`shell
${command}
\`\`\`

### Preview

[View in Mermaid Live Editor](${mermaidLiveUrl})

<details>
  <summary>Click to view as image</summary>
  <p align="center">
    <img src="${imageFilePath}" alt="Mermaid diagram for theme ${theme}" />
  </p>
</details>

\`\`\`mermaid
${diagram}
\`\`\`

${stylesTable}
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
try {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const generateImages = !args.includes('--no-images');

  await generateThemes(generateImages);
} catch (error) {
  console.error('Error generating themes:', error);
  process.exit(1);
}
