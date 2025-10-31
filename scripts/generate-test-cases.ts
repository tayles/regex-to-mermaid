#!/usr/bin/env bun

/**
 * Generate TEST-CASES.md from regexpp fixture files
 *
 * @see https://github.com/eslint-community/regexpp/tree/main/test/fixtures/parser/literal
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { regexToMermaid } from '../src';
import { writeInjectedContent } from './regex-utils';

const FIXTURES_DIR = '../regexpp/test/fixtures/parser/literal';
const GITHUB_BASE_URL =
  'https://github.com/eslint-community/regexpp/tree/main/test/fixtures/parser/literal';

// ignore these files as they are mostly duplicated
const IGNORED_FILES = ['basic-valid-2015-u.json', 'basic-valid-2015.json'];

interface FixtureData {
  patterns: Record<string, unknown>;
}

interface TestCaseSection {
  filename: string;
  patterns: string[];
  githubUrl: string;
}

async function generateTestCases() {
  const testCasesFilePath = join(import.meta.dir, '..', 'TEST-CASES.md');

  // Read all JSON files in the fixtures directory
  const files = await readdir(FIXTURES_DIR);
  const jsonFiles = files
    .filter(f => f.endsWith('.json') && !f.includes('invalid') && !IGNORED_FILES.includes(f))
    .sort();

  console.log(`Found ${jsonFiles.length} valid fixture files`);

  // Build map of filename -> patterns
  const sections: TestCaseSection[] = [];

  for (const filename of jsonFiles) {
    console.log(`Processing ${filename}...`);
    const filePath = join(FIXTURES_DIR, filename);
    const content = await readFile(filePath, 'utf-8');
    const data: FixtureData = JSON.parse(content);

    const patterns = Object.keys(data.patterns).filter(pattern => {
      const patternData = data.patterns[pattern] as Record<string, unknown>;
      return 'ast' in patternData;
    });
    const githubUrl = `${GITHUB_BASE_URL}/${filename}`;

    sections.push({
      filename,
      patterns,
      githubUrl,
    });
  }

  // Generate markdown
  const markdown = generateTestCasesMarkdown(sections);

  // Write TEST-CASES.md
  await writeInjectedContent(testCasesFilePath, markdown);

  console.log(`✅ Generated test cases from ${sections.length} fixture files`);

  // Count total patterns
  const totalPatterns = sections.reduce((sum, s) => sum + s.patterns.length, 0);
  console.log(`📊 Total patterns: ${totalPatterns}`);
}

function generateTestCasesMarkdown(sections: TestCaseSection[]): string {
  const snapshotDate = new Date().toISOString();

  const toc = sections
    .map(section => {
      const name = section.filename.replace('.json', '');
      const anchor = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `- [${name}](#${anchor}) (${section.patterns.length} patterns)`;
    })
    .join('\n');

  const sectionMarkdowns = sections.map(section => generateSectionMarkdown(section));

  return `
> **Snapshot Date:** ${snapshotDate}

## Table of Contents

${toc}

---

${sectionMarkdowns.join('\n\n---\n\n')}
  `.trim();
}

function generateSectionMarkdown(section: TestCaseSection): string {
  const name = section.filename.replace('.json', '');

  const patternMarkdowns = section.patterns.map(pattern => {
    const prefix = `### \`${pattern}\`

\`\`\`regex
regex-to-mermaid '${pattern}'
\`\`\``;

    let markdown: string = '';

    try {
      const diagram = regexToMermaid(pattern, {
        flavor: 'regexp',
        direction: 'LR',
        theme: 'default',
      });

      markdown = `\`\`\`mermaid
${diagram}
\`\`\``;
    } catch (error) {
      console.error(`Error processing pattern ${pattern}:`, error);
      markdown = `> [!ERROR]  
> Error generating diagram: ${error instanceof Error ? error.message : String(error)}`;
    }

    return `${prefix}\n\n${markdown}`.trim();
  });

  return `
## ${name}

Source: [${section.filename}](${section.githubUrl})

${patternMarkdowns.join('\n\n')}
  `.trim();
}

// Run the script
try {
  await generateTestCases();
} catch (error) {
  console.error('Error generating test cases:', error);
  process.exit(1);
}
