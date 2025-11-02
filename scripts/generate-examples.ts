#!/usr/bin/env bun

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Flavor, regexToMermaid } from '../src';
import { buildRegexAst, parseRegexByFlavor, printAst } from '../src/parser';
import {
  DIAGRAMS_DIR,
  generateMermaidLiveLink,
  generateToc,
  getAllRegexFilePaths,
  parseRegexFile,
  type RegexFile,
  writeInjectedContent,
  writeMermaidImageFile,
} from './regex-utils';

type RegexDescriptorWithMarkdown = {
  descriptor: RegexFile;
  markdown: string;
};

type ExampleData = {
  regexFilePath: string;
  diagram: string;
  imageFilePath: string;
};

/**
 * Generate AST, Mermaid diagram, and EXAMPLES.md for all regex files
 */
async function generateExamples(generateImages = true) {
  const examplesFilePath = join(import.meta.dir, '..', 'EXAMPLES.md');

  // Read all .regex files
  const regexFilePaths = await getAllRegexFilePaths(DIAGRAMS_DIR);

  // Parse all regex files and generate markdown
  const examples: RegexDescriptorWithMarkdown[] = [];
  const imageData: ExampleData[] = [];

  for (const regexFilePath of regexFilePaths) {
    console.log(`Processing ${regexFilePath}...`);
    const regexFileContent = await readFile(regexFilePath, 'utf-8');
    const regexDescriptor = parseRegexFile(regexFileContent);

    const normalizedRegex = parseRegexByFlavor(
      regexDescriptor.pattern,
      (regexDescriptor.flavor as Flavor) ?? 'auto',
    );

    const astFilePath = regexFilePath.replace('.regex', '.json');
    await writeAstFile(astFilePath, normalizedRegex);

    const diagram = regexToMermaid(regexDescriptor.pattern, {
      flavor: regexDescriptor.flavor === 'regexp' ? 'regexp' : 'auto',
      direction: 'LR',
      theme: 'default',
    });

    const mermaidFilePath = regexFilePath.replace('.regex', '.mermaid');
    await writeMermaidFile(mermaidFilePath, diagram);

    const imageFilePath = regexFilePath.replace('.regex', '.mermaid-diagram.png');
    const mermaidLiveUrl = await generateMermaidLiveLink(diagram);

    const exampleMarkdown = generateExampleMarkdown(
      regexDescriptor,
      diagram,
      imageFilePath,
      mermaidLiveUrl,
    );

    examples.push({
      descriptor: regexDescriptor,
      markdown: exampleMarkdown,
    });

    imageData.push({
      regexFilePath,
      diagram,
      imageFilePath,
    });
  }

  // Write EXAMPLES.md
  await writeExamplesMarkdown(examplesFilePath, examples);

  console.log(`✅ Generated examples for ${examples.length} regex patterns`);

  // Generate images in separate loop
  if (generateImages) {
    console.log('\nGenerating images...');
    for (const { regexFilePath, diagram, imageFilePath } of imageData) {
      console.log(`Generating image for ${regexFilePath}...`);
      await writeMermaidImageFile(imageFilePath, diagram, 'default');
    }
    console.log(`✅ Generated ${imageData.length} images`);
  } else {
    console.log('\n⏭️  Skipping image generation (use --images to enable)');
  }
}

async function writeAstFile(filePath: string, pattern: RegExp) {
  const ast = buildRegexAst(pattern);
  const str = printAst(ast);
  await writeFile(filePath, `${str}\n`, 'utf-8');
}

async function writeMermaidFile(filePath: string, diagram: string) {
  await writeFile(filePath, `${diagram}\n`, 'utf-8');
}

function generateExampleMarkdown(
  regexDescriptor: RegexFile,
  diagram: string,
  imageFilePath: string,
  mermaidLiveUrl: string,
): string {
  const source = regexDescriptor.source ? `\n\nSource: <${regexDescriptor.source}>` : '';

  const content = `
## ${regexDescriptor.name}

${regexDescriptor.description}${source}

### Pattern {#${regexDescriptor.name}}

\`\`\`regex
${regexDescriptor.pattern}
\`\`\`

### Diagram

[View in Mermaid Live Editor](${mermaidLiveUrl})

<details>
  <summary>Click to view as image</summary>
  <p align="center">
    <img src="${imageFilePath}" alt="Mermaid diagram for ${regexDescriptor.name}" />
  </p>
</details>

\`\`\`mermaid
${diagram}
\`\`\`
  `.trim();

  return content;
}

async function writeExamplesMarkdown(filePath: string, examples: RegexDescriptorWithMarkdown[]) {
  // Generate TOC
  const toc = generateToc(examples.map(e => e.descriptor.name));

  const content = `
## Table of Contents

${toc}

${examples.map(example => example.markdown).join('\n\n---\n\n')}
  `.trim();

  await writeInjectedContent(filePath, content);
}

// Run the script
try {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const generateImages = !args.includes('--no-images');

  await generateExamples(generateImages);
} catch (error) {
  console.error('Error generating examples:', error);
  process.exit(1);
}
