/**
 * Utilities for working with regexpp test fixture files
 *
 * @see https://github.com/eslint-community/regexpp/tree/main/test/fixtures/parser/literal
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// assumes the repo is checked out as a sibling directory
const FIXTURES_DIR = '../regexpp/test/fixtures/parser/literal';
const GITHUB_BASE_URL =
  'https://github.com/eslint-community/regexpp/tree/main/test/fixtures/parser/literal';

// ignore these files as they are mostly duplicated
const IGNORED_FILES = ['basic-valid-2015-u.json', 'basic-valid-2015.json'];

/**
 * Structure of a regexpp fixture JSON file
 */
export interface FixtureData {
  patterns: Record<string, unknown>;
}

/**
 * A fixture file with its patterns and metadata
 */
export interface FixtureFile {
  filename: string;
  patterns: string[];
  githubUrl: string;
  filePath: string;
}

/**
 * Options for collecting fixture files
 */
export interface CollectFixturesOptions {
  /**
   * Base directory containing fixture files
   * @default '../regexpp/test/fixtures/parser/literal'
   */
  fixturesDir?: string;

  /**
   * Files to ignore (in addition to default ignored files)
   * @default []
   */
  additionalIgnoredFiles?: string[];

  /**
   * Whether to include files with 'invalid' in the name
   * @default false
   */
  includeInvalid?: boolean;

  /**
   * GitHub base URL for generating source links
   * @default 'https://github.com/eslint-community/regexpp/tree/main/test/fixtures/parser/literal'
   */
  githubBaseUrl?: string;
}

/**
 * Collect all regexpp test fixture files and extract their patterns
 */
export async function collectRegexppFixtures(
  options: CollectFixturesOptions = {},
): Promise<FixtureFile[]> {
  const {
    fixturesDir = FIXTURES_DIR,
    additionalIgnoredFiles = [],
    includeInvalid = false,
    githubBaseUrl = GITHUB_BASE_URL,
  } = options;

  const ignoredFiles = [...IGNORED_FILES, ...additionalIgnoredFiles];

  // Read all JSON files in the fixtures directory
  let files: string[];
  try {
    files = await readdir(fixturesDir);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Fixtures directory not found: ${fixturesDir}\n\n` +
          `This directory is expected to be a sibling of the regex-to-mermaid project.\n` +
          `Please ensure the regexpp repository is cloned at the expected location:\n` +
          `  git clone https://github.com/eslint-community/regexpp.git ../regexpp\n\n` +
          `Or specify a custom path using the 'fixturesDir' option.`,
      );
    }
    throw new Error(
      `Failed to read fixtures directory: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const jsonFiles = files
    .filter((f: string) => {
      if (!f.endsWith('.json')) return false;
      if (ignoredFiles.includes(f)) return false;
      if (!includeInvalid && f.includes('invalid')) return false;
      return true;
    })
    .sort();

  // Build fixture data for each file
  const fixtures: FixtureFile[] = [];

  for (const filename of jsonFiles) {
    const filePath = join(fixturesDir, filename);
    const content = await readFile(filePath, 'utf-8');
    const data: FixtureData = JSON.parse(content);

    const patterns = Object.keys(data.patterns).filter(pattern => {
      const patternData = data.patterns[pattern] as Record<string, unknown>;
      return 'ast' in patternData;
    });

    const githubUrl = `${githubBaseUrl}/${filename}`;

    fixtures.push({
      filename,
      patterns,
      githubUrl,
      filePath,
    });
  }

  return fixtures;
}

/**
 * Get all patterns from all fixture files as a flat array
 */
export async function getAllPatterns(options: CollectFixturesOptions = {}): Promise<string[]> {
  const fixtures = await collectRegexppFixtures(options);
  return fixtures.flatMap(f => f.patterns);
}

/**
 * Get patterns grouped by fixture filename
 */
export async function getPatternsByFile(
  options: CollectFixturesOptions = {},
): Promise<Record<string, string[]>> {
  const fixtures = await collectRegexppFixtures(options);
  return Object.fromEntries(fixtures.map(f => [f.filename, f.patterns]));
}
