import type { Flavor } from './types';

/**
 * POSIX character class mappings
 *
 * @see https://www.regular-expressions.info/posixbrackets.html
 */
export const POSIX_CHAR_CLASSES: { [key: string]: string } = {
  // Alphanumeric characters
  alnum: 'a-zA-Z0-9',
  // Alphabetic characters
  alpha: 'a-zA-Z',
  // ASCII characters
  ascii: '\\x00-\\x7F',
  // Space and tab
  blank: ' \\t',
  // Control characters
  cntrl: '\\x00-\\x1F\\x7F',
  // Digits
  digit: '0-9',
  // Visible characters (anything except spaces and control characters)
  graph: '\\x21-\\x7E',
  // Lowercase letters
  lower: 'a-z',
  // Visible characters and spaces (anything except control characters)
  print: '\\x20-\\x7E',
  // Punctuation (and symbols)
  punct: '\\x21-\\x2F\\x3A-\\x40\\x5B-\\x60\\x7B-\\x7E',
  // All whitespace characters, including line breaks
  space: '\\s',
  // Uppercase letters
  upper: 'A-Z',
  // Word characters (letters, numbers and underscores)
  word: 'A-Za-z0-9_',
  // Hexadecimal digits
  xdigit: '0-9A-Fa-f',
};

/**
 * Check if pattern contains POSIX character classes e.g. [:alnum:]
 *
 * @see POSIX_CHAR_CLASSES
 */
export function containsPosixCharClasses(pattern: string): boolean {
  const posixClassPattern =
    /\[:(alnum|alpha|ascii|blank|cntrl|digit|graph|lower|print|punct|space|upper|word|xdigit):\]/;
  return posixClassPattern.test(pattern);
}

/**
 * Replace POSIX character classes with equivalent patterns
 *
 * @see POSIX_CHAR_CLASSES
 */
export function replacePosixCharClasses(pattern: string): string {
  let converted = pattern;
  for (const [key, value] of Object.entries(POSIX_CHAR_CLASSES)) {
    const regex = new RegExp(`\\[:${key}:\\]`, 'g');
    converted = converted.replaceAll(regex, value);
  }
  return converted;
}

/**
 * Java character class mappings
 *
 * @see https://www.regular-expressions.info/posixbrackets.html
 */
export const JAVA_CHAR_CLASSES: { [key: string]: string } = {
  // Alphanumeric characters
  Alnum: '[a-zA-Z0-9]',
  // Alphabetic characters
  Alpha: '[a-zA-Z]',
  // ASCII characters
  ASCII: '[\\x00-\\x7F]',
  // Space and tab
  Blank: '[ \\t]',
  // Control characters
  Cntrl: '[\\x00-\\x1F\\x7F]',
  // Digits
  Digit: '[0-9]',
  // Visible characters (anything except spaces and control characters)
  Graph: '[\\x21-\\x7E]',
  // Lowercase letters
  Lower: '[a-z]',
  // Visible characters and spaces (anything except control characters)
  Print: '[\\x20-\\x7E]',
  // Punctuation (and symbols)
  Punct: '[\\x21-\\x2F\\x3A-\\x40\\x5B-\\x60\\x7B-\\x7E]',
  // All whitespace characters, including line breaks
  Space: '\\s',
  // Uppercase letters
  Upper: '[A-Z]',
  // Word characters (letters, numbers and underscores)
  IsWord: '[A-Za-z0-9_]',
  // Hexadecimal digits
  XDigit: '[0-9A-Fa-f]',
};

/**
 * Check if pattern contains Java character classes e.g. \p{Alpha}
 *
 * @see JAVA_CHAR_CLASSES
 */
export function containsJavaCharClasses(pattern: string): boolean {
  const javaClassPattern =
    /p\{(Alnum|Alpha|ASCII|Blank|Cntrl|Digit|Graph|Lower|Print|Punct|Space|Upper|IsWord|XDigit)\}/;
  return javaClassPattern.test(pattern);
}

/**
 * Replace Java character classes with equivalent patterns
 *
 * @see JAVA_CHAR_CLASSES
 */
export function replaceJavaCharClasses(pattern: string): string {
  let converted = pattern;
  for (const [key, value] of Object.entries(JAVA_CHAR_CLASSES)) {
    // Use raw string replacement instead of regex to avoid escaping issues
    const searchPattern = `\\p{${key}}`;
    if (converted.includes(searchPattern)) {
      converted = converted.replaceAll(searchPattern, value);
    }
  }
  return converted;
}

/**
 * Replace PCRE named groups with ES2018 syntax
 *
 * @example (?P<name>)  -->  (?<name>)
 */
export function replacePcreNamedGroups(pattern: string): string {
  return pattern.replaceAll(/\(\?P<([^>]+)>/g, '(?<$1>');
}

/**
 * Replace PCRE named backreferences with ES2018 syntax
 *
 * @example (?P=name)  -->  \k<name>
 */
export function replacePcreNamedBackreferences(pattern: string): string {
  return pattern.replaceAll(/\(\?P=([^)]+)\)/g, '\\k<$1>');
}

/**
 * Remove comments
 *
 * @example (?#comment)
 */
export function removeComments(pattern: string): string {
  return pattern.replaceAll(/\(\?#[^)]*\)/g, '');
}

/**
 * Convert a regex pattern from one flavor to ES2025 flavor
 */
export function convertFlavor(pattern: string, flavor: Flavor): string {
  switch (flavor) {
    case 'regexp':
      return pattern;
    case 'pcre':
      return convertPcreToRegexp(pattern);
    case 'bre':
      return convertBreToRegexp(pattern);
    case 'ere':
      return convertEreToRegexp(pattern);
    case 'python':
      return convertPythonToRegexp(pattern);
    case 'rust':
      return convertRustToRegexp(pattern);
    case 're2':
      return convertRe2ToRegexp(pattern);
    case 'java':
      return convertJavaToRegexp(pattern);
    case 'dotnet':
      return convertDotNetToRegexp(pattern);
    case 'ruby':
      return convertRubyToRegexp(pattern);
    case 'auto':
      return convertToRegExpBestEffort(pattern);
    default:
      throw new TypeError(`Unsupported flavor: ${flavor}`);
  }
}

export function convertPcreToRegexp(pattern: string): string {
  let converted = pattern;

  // Convert PCRE named capture groups (?P<name>) to ES2018 (?<name>)
  converted = replacePcreNamedGroups(converted);
  converted = replacePcreNamedBackreferences(converted);

  // Remove PCRE comments (?#comment)
  converted = removeComments(converted);

  // Remove PCRE recursive patterns (*RECURSE) - not directly supported in JS
  converted = converted.replaceAll(/\(\*RECURSE\)/g, '');
  converted = converted.replaceAll(/\(\*R\)/g, '');

  // Remove PCRE control verbs - not directly supported in JS
  converted = converted.replaceAll(/\(\*SKIP\)/g, '');
  converted = converted.replaceAll(/\(\*FAIL\)/g, '');
  converted = converted.replaceAll(/\(\*ACCEPT\)/g, '');
  converted = converted.replaceAll(/\(\*COMMIT\)/g, '');

  // Convert PCRE possessive quantifiers to regular quantifiers (approximation)
  converted = converted.replaceAll(/\+\+/g, '+');
  converted = converted.replaceAll(/\*\+/g, '*');
  converted = converted.replaceAll(/\?\+/g, '?');
  converted = converted.replaceAll(/\{([^}]+)\}\+/g, '{$1}');

  // Convert PCRE atomic groups (?>...) to non-capturing groups (approximation)
  converted = converted.replaceAll(/\(\?>/g, '(?:');

  return converted;
}

export function convertBreToRegexp(pattern: string): string {
  let converted = pattern;

  // In BRE, these characters are literal unless escaped: + ? { } | ( )
  // In ERE/JS, they are metacharacters

  // Convert BRE escaped metacharacters to unescaped
  // Use word boundaries to avoid partial matches
  converted = converted.replaceAll(/\\\+/g, '+');
  converted = converted.replaceAll(/\\\?/g, '?');
  converted = converted.replaceAll(/\\\{/g, '{');
  converted = converted.replaceAll(/\\\}/g, '}');
  converted = converted.replaceAll(/\\\|/g, '|');
  converted = converted.replaceAll(/\\\(/g, '(');
  converted = converted.replaceAll(/\\\)/g, ')');

  // Convert BRE backreferences \n to JS backreferences \n (same format)
  // No change needed for backreferences

  return converted;
}

export function convertEreToRegexp(pattern: string): string {
  // ERE is very similar to JavaScript regex
  // Main differences are in character classes and some escape sequences
  let converted = pattern;

  // ERE doesn't support some JS-specific features like lookahead/lookbehind
  // These would be left as-is since they're not ERE features

  // ERE uses POSIX character classes like [:alnum:] inside character classes
  converted = replacePosixCharClasses(converted);

  return converted;
}

export function convertPythonToRegexp(pattern: string): string {
  let converted = pattern;

  // Remove comments
  converted = removeComments(converted);

  // Convert Python named capture groups (?P<name>) to ES2018 (?<name>)
  converted = replacePcreNamedGroups(converted);
  converted = replacePcreNamedBackreferences(converted);

  // Python conditional patterns (?($n)yes|no) - not supported in JS
  converted = converted.replaceAll(/\(\?\([^)]+\)[^|]*\|[^)]*\)/g, '');

  // Python recursive patterns (?R) - not supported in JS
  converted = converted.replace(/\(\?R\)/g, '');

  // Python word boundaries are similar to JS
  // \b and \B work the same way

  return converted;
}

export function convertRustToRegexp(pattern: string): string {
  let converted = pattern;

  // Rust regex is very similar to RE2 and JavaScript

  // Rust doesn't support lookahead/lookbehind by default
  // These would be errors in Rust but we'll leave them for JS

  // Convert ASCII character classes
  converted = replacePosixCharClasses(converted);

  return converted;
}

export function convertRe2ToRegexp(pattern: string): string {
  let converted = pattern;

  // RE2 is similar to JavaScript but lacks some features
  // Most RE2 patterns should work in JavaScript

  // RE2 doesn't support backreferences - remove them
  converted = converted.replaceAll(/\\[1-9]/g, '');

  // RE2 doesn't support lookahead/lookbehind - remove them
  converted = converted.replaceAll(/\(\?[=!]/g, '(?:');
  converted = converted.replaceAll(/\(\?<[=!]/g, '(?:');

  return converted;
}

export function convertJavaToRegexp(pattern: string): string {
  let converted = pattern;

  // Replace Java POSIX character classes with equivalent patterns first
  converted = replaceJavaCharClasses(converted);

  // Convert Java literal escapes \Q...\E to escaped literals
  converted = converted.replaceAll(/\\Q([\s\S]*?)\\E/g, (_match, content) => {
    // Escape all regex metacharacters in the content
    return content.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  return converted;
}

export function convertDotNetToRegexp(pattern: string): string {
  let converted = pattern;

  // Remove comments
  converted = removeComments(converted);

  // Convert .NET balancing groups (?<name1-name2>) - not supported in JS
  converted = converted.replaceAll(/\(\?<[^>]*-[^>]*>/g, '(?:');

  // Convert .NET conditional patterns (?($name)yes|no) - not supported in JS
  converted = converted.replaceAll(/\(\?\([^)]+\)[^|]*\|[^)]*\)/g, '');

  // Convert .NET single-quoted named groups (?'name') to (?<name>)
  converted = converted.replaceAll(/\(\?'([^']+)'/g, '(?<$1>');

  return converted;
}

export function convertRubyToRegexp(pattern: string): string {
  let converted = pattern;

  // Remove comments
  converted = removeComments(converted);

  // Convert Ruby relative backreferences first (most specific)
  converted = converted.replaceAll(/\\g<-\d+>/g, '');

  // Convert Ruby numbered backreferences \g<1> to \1 (before named references)
  converted = converted.replaceAll(/\\g<(\d+)>/g, '\\$1');

  // Convert Ruby named backreferences \g<name> to \k<name>
  converted = converted.replaceAll(/\\g<([^>]+)>/g, '\\k<$1>');

  // Ruby possessive quantifiers - convert to regular quantifiers (approximation)
  converted = converted.replaceAll(/\+\+/g, '+');
  converted = converted.replaceAll(/\*\+/g, '*');
  converted = converted.replaceAll(/\?\+/g, '?');
  converted = converted.replaceAll(/\{([^}]+)\}\+/g, '{$1}');

  return converted;
}

/**
 * Perform a best-effort conversion of a regex pattern to ES2025 RegExp flavor
 */
export function convertToRegExpBestEffort(pattern: string): string {
  // TODO: First check if it is already ES2025 compatible, if so, return as is

  let converted = pattern;

  // Remove comments
  converted = removeComments(converted);

  // First, try to detect if there are POSIX character classes
  if (containsPosixCharClasses(converted)) {
    converted = replacePosixCharClasses(converted);
  }

  // Next, check for Java character classes
  if (containsJavaCharClasses(converted)) {
    converted = replaceJavaCharClasses(converted);
  }

  // Attempt to replace common named group syntaxes
  converted = replacePcreNamedGroups(converted);

  // Attempt to replace common backreference syntaxes
  converted = replacePcreNamedBackreferences(converted);

  return converted;
}
