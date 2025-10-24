import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { $ } from 'bun';
import type { Theme } from '../src';

export interface RegexFile {
  name: string;
  description?: string;
  flavor?: string;
  pattern: string;
}

export const DIAGRAMS_DIR = 'diagrams';

/**
 * Parse a regex file with YAML frontmatter
 */
export function parseRegexFile(content: string): RegexFile {
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
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function generateToc(headings: string[]): string {
  return headings.map(heading => `- [${heading}](#${slugify(heading)})`).join('\n');
}

export async function writeInjectedContent(
  filePath: string,
  contentToInject: string,
): Promise<void> {
  // Read the current file
  const currentFileContent = await readFile(filePath, 'utf-8');

  const newFileContent = injectContent(currentFileContent, contentToInject);

  // Write the updated file
  await writeFile(filePath, newFileContent, 'utf-8');
}

/**
 * Find all *.regex files in a directory
 */
export async function getAllRegexFilePaths(path: string): Promise<string[]> {
  const files = await readdir(path);
  return files
    .filter(f => f.endsWith('.regex'))
    .map(f => join(path, f))
    .toSorted();
}

/**
 * Inject content between markers
 */
export function injectContent(
  text: string,
  contentToInject: string,
  startMarker: string = '<!-- CONTENT:START -->',
  endMarker: string = '<!-- CONTENT:END -->',
): string {
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find content markers in text');
  }

  return (
    text.substring(0, startIndex + startMarker.length) +
    '\n\n' +
    contentToInject +
    '\n\n' +
    text.substring(endIndex)
  );
}

/**
 * Generate an image file from a mermaid diagram using mmdc
 *
 * @see https://www.npmjs.com/package/@mermaid-js/mermaid-cli
 */
export async function writeMermaidImageFile(
  filePath: string,
  diagram: string,
  theme: string,
  background?: string,
): Promise<void> {
  const input = new Response(diagram);

  if (!background) {
    // derive from theme
    background = theme === 'dark' ? 'transparent' : 'white';
  }

  await $`cat < ${input} | mmdc -i - -o ${filePath} -t ${theme} -b ${background} -w 2048`;

  return;
}

/**
 * Maps between our themes and mermaid themes
 *
 * @see https://mermaid.js.org/config/theming.html
 */
export function themeToMermaidTheme(theme: Theme): string {
  if (theme === 'none') {
    return 'default';
  }

  return theme;
}

/**
 * Construct a mermaid.live URL for a diagram
 * @see https://mermaid.live
 */
export async function generateMermaidLiveLink(diagram: string): Promise<string> {
  const input = new Response(diagram);

  return await $`cat < ${input} | jq -Rscj '{code: .}' | gzip -n -c -9 | base64 -w0 | tr '/+' '_-' | awk '{printf "https://mermaid.live/edit#pako:%s", $0}'`.text();
}
