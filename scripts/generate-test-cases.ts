#!/usr/bin/env bun

/**
 * Generate TEST-CASES.md from regexpp test fixture files
 *
 * @see https://github.com/eslint-community/regexpp/tree/main/test/fixtures/parser/literal
 */

import { join } from 'node:path';
import { regexToMermaid } from '../src';
import { writeInjectedContent } from './regex-utils';
import { collectRegexppFixtures, type FixtureFile } from './regexpp-test-fixtures';

async function generateTestCases() {
  const testCasesFilePath = join(import.meta.dir, '..', 'TEST-CASES.md');

  // Collect fixture files using the extracted utility
  console.log('Collecting regexpp fixture files...');
  const fixtures = await collectRegexppFixtures();

  console.log(`Found ${fixtures.length} valid fixture files`);

  // Generate markdown
  const markdown = generateTestCasesMarkdown(fixtures);

  // Write TEST-CASES.md
  await writeInjectedContent(testCasesFilePath, markdown);

  console.log(`✅ Generated test cases from ${fixtures.length} fixture files`);

  // Count total patterns
  const totalPatterns = fixtures.reduce(
    (sum: number, f: FixtureFile) => sum + f.patterns.length,
    0,
  );
  console.log(`📊 Total patterns: ${totalPatterns}`);
}

function generateTestCasesMarkdown(fixtures: FixtureFile[]): string {
  const snapshotDate = new Date().toISOString();

  const toc = fixtures
    .map((fixture: FixtureFile) => {
      const name = fixture.filename.replace('.json', '');
      const anchor = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `- [${name}](#${anchor}) (${fixture.patterns.length} patterns)`;
    })
    .join('\n');

  const sectionMarkdowns = fixtures.map((fixture: FixtureFile) => generateSectionMarkdown(fixture));

  return `
> **Snapshot Date:** ${snapshotDate}

## Table of Contents

${toc}

---

${sectionMarkdowns.join('\n\n---\n\n')}
  `.trim();
}

function generateSectionMarkdown(fixture: FixtureFile): string {
  const name = fixture.filename.replace('.json', '');

  const patternMarkdowns = fixture.patterns.map((pattern: string) => {
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

Source: [${fixture.filename}](${fixture.githubUrl})

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
