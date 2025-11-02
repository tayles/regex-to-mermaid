import { describe, expect, test } from 'bun:test';
import {
  convertBreToRegexp,
  convertDotNetToRegexp,
  convertEreToRegexp,
  convertFlavor,
  convertJavaToRegexp,
  convertPcreToRegexp,
  convertPythonToRegexp,
  convertRe2ToRegexp,
  convertRubyToRegexp,
  convertRustToRegexp,
} from './convert-flavor';

describe('convertFlavor', () => {
  test('returns pattern as-is for regexp flavor', () => {
    const pattern = '^[a-z]+$';
    expect(convertFlavor(pattern, 'regexp')).toBe(pattern);
  });

  test('handles auto detection', () => {
    const pcrePattern = '(?P<name>\\w+)';
    expect(convertFlavor(pcrePattern, 'auto')).toBe('(?<name>\\w+)');
  });

  test('throws error for unsupported flavor', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Testing invalid type
    expect(() => convertFlavor('test', 'unsupported' as any)).toThrow(
      'Unsupported flavor: unsupported',
    );
  });
});

describe('convertPcreToRegexp', () => {
  test('converts named capture groups', () => {
    expect(convertPcreToRegexp('(?P<name>\\w+)')).toBe('(?<name>\\w+)');
    expect(convertPcreToRegexp('(?P<year>\\d{4})-(?P<month>\\d{2})')).toBe(
      '(?<year>\\d{4})-(?<month>\\d{2})',
    );
  });

  test('converts named backreferences', () => {
    expect(convertPcreToRegexp('(?P<name>\\w+)\\s+(?P=name)')).toBe('(?<name>\\w+)\\s+\\k<name>');
  });

  test('removes comments', () => {
    expect(convertPcreToRegexp('(?#this is a comment)\\w+')).toBe('\\w+');
    expect(convertPcreToRegexp('\\d+(?#number)\\s+(?#space)\\w+')).toBe('\\d+\\s+\\w+');
  });

  test('removes recursive patterns', () => {
    expect(convertPcreToRegexp('\\((?:[^()]|(*RECURSE))*\\)')).toBe('\\((?:[^()]|)*\\)');
    expect(convertPcreToRegexp('\\((?:[^()]|(*R))*\\)')).toBe('\\((?:[^()]|)*\\)');
  });

  test('removes control verbs', () => {
    expect(convertPcreToRegexp('\\w+(*SKIP)(*FAIL)')).toBe('\\w+');
    expect(convertPcreToRegexp('test(*ACCEPT)')).toBe('test');
    expect(convertPcreToRegexp('pattern(*COMMIT)')).toBe('pattern');
  });

  test('converts possessive quantifiers', () => {
    expect(convertPcreToRegexp('\\w++')).toBe('\\w+');
    expect(convertPcreToRegexp('\\d*+')).toBe('\\d*');
    expect(convertPcreToRegexp('[a-z]?+')).toBe('[a-z]?');
    expect(convertPcreToRegexp('\\w{2,5}+')).toBe('\\w{2,5}');
  });

  test('converts atomic groups', () => {
    expect(convertPcreToRegexp('(?>\\w+)')).toBe('(?:\\w+)');
  });
});

describe('convertBreToRegexp', () => {
  test('converts escaped metacharacters', () => {
    expect(convertBreToRegexp('\\+')).toBe('+');
    expect(convertBreToRegexp('\\?')).toBe('?');
    expect(convertBreToRegexp('\\{')).toBe('{');
    expect(convertBreToRegexp('\\}')).toBe('}');
    expect(convertBreToRegexp('\\|')).toBe('|');
    expect(convertBreToRegexp('\\(')).toBe('(');
    expect(convertBreToRegexp('\\)')).toBe(')');
  });

  test('handles complex BRE patterns', () => {
    expect(convertBreToRegexp('\\([a-z]\\)\\{2,3\\}')).toBe('([a-z]){2,3}');
    expect(convertBreToRegexp('word1\\|word2')).toBe('word1|word2');
  });
});

describe('convertEreToRegexp', () => {
  test('converts POSIX character classes', () => {
    expect(convertEreToRegexp('[[:alnum:]]')).toBe('[a-zA-Z0-9]');
    expect(convertEreToRegexp('[[:alpha:]]')).toBe('[a-zA-Z]');
    expect(convertEreToRegexp('[[:blank:]]')).toBe('[ \\t]');
    expect(convertEreToRegexp('[[:digit:]]')).toBe('[0-9]');
    expect(convertEreToRegexp('[[:lower:]]')).toBe('[a-z]');
    expect(convertEreToRegexp('[[:upper:]]')).toBe('[A-Z]');
    expect(convertEreToRegexp('[[:space:]]')).toBe('[\\s]');
    expect(convertEreToRegexp('[[:xdigit:]]')).toBe('[0-9A-Fa-f]');
  });

  test('handles mixed POSIX classes', () => {
    expect(convertEreToRegexp('[[:digit:][:alpha:]]')).toBe('[0-9a-zA-Z]');
  });
});

describe('convertPythonToRegexp', () => {
  test('converts named capture groups', () => {
    expect(convertPythonToRegexp('(?P<name>\\w+)')).toBe('(?<name>\\w+)');
  });

  test('converts named backreferences', () => {
    expect(convertPythonToRegexp('(?P<word>\\w+)\\s+(?P=word)')).toBe('(?<word>\\w+)\\s+\\k<word>');
  });

  test('removes conditional patterns', () => {
    expect(convertPythonToRegexp('(?($1)yes|no)')).toBe('');
  });

  test('removes recursive patterns', () => {
    expect(convertPythonToRegexp('(?R)')).toBe('');
  });
});

describe('convertRustToRegexp', () => {
  test('converts ASCII character class', () => {
    expect(convertRustToRegexp('[[:ascii:]]')).toBe('[\\x00-\\x7F]');
  });
});

describe('convertRe2ToRegexp', () => {
  test('removes backreferences', () => {
    expect(convertRe2ToRegexp('(\\w+)\\s+\\1')).toBe('(\\w+)\\s+');
    expect(convertRe2ToRegexp('(a)(b)\\1\\2')).toBe('(a)(b)');
  });

  test('removes lookahead/lookbehind', () => {
    expect(convertRe2ToRegexp('(?=positive-lookahead)')).toBe('(?:positive-lookahead)');
    expect(convertRe2ToRegexp('(?!negative-lookahead)')).toBe('(?:negative-lookahead)');
    expect(convertRe2ToRegexp('(?<=positive-lookbehind)')).toBe('(?:positive-lookbehind)');
    expect(convertRe2ToRegexp('(?<!negative-lookbehind)')).toBe('(?:negative-lookbehind)');
  });
});

describe('convertJavaToRegexp', () => {
  test('converts literal escapes', () => {
    expect(convertJavaToRegexp('\\Q.+*?^$\\{\\}()|[]\\\\E')).toBe(
      '\\.\\+\\*\\?\\^\\$\\\\\\{\\\\\\}\\(\\)\\|\\[\\]\\\\',
    );
    expect(convertJavaToRegexp('prefix\\Q[special]\\Esuffix')).toBe('prefix\\[special\\]suffix');
  });

  test('converts POSIX character classes', () => {
    expect(convertJavaToRegexp('\\p{Lower}')).toBe('[a-z]');
    expect(convertJavaToRegexp('\\p{Upper}')).toBe('[A-Z]');
    expect(convertJavaToRegexp('\\p{ASCII}')).toBe('[\\x00-\\x7F]');
    expect(convertJavaToRegexp('\\p{Alpha}')).toBe('[a-zA-Z]');
    expect(convertJavaToRegexp('\\p{Digit}')).toBe('[0-9]');
    expect(convertJavaToRegexp('\\p{Alnum}')).toBe('[a-zA-Z0-9]');
    expect(convertJavaToRegexp('\\p{Space}')).toBe('\\s');
    expect(convertJavaToRegexp('\\p{XDigit}')).toBe('[0-9A-Fa-f]');
  });

  test('handles complex patterns', () => {
    expect(convertJavaToRegexp('\\p{Alpha}+\\Q.txt\\E$')).toBe('[a-zA-Z]+\\.txt$');
  });
});

describe('convertDotnetToRegexp', () => {
  test('converts balancing groups to non-capturing', () => {
    expect(convertDotNetToRegexp('(?<open-close>\\()')).toBe('(?:\\()');
    expect(convertDotNetToRegexp('(?<name1-name2>pattern)')).toBe('(?:pattern)');
  });

  test('removes conditional patterns', () => {
    expect(convertDotNetToRegexp('(?($name)yes|no)')).toBe('');
  });

  test('removes comments', () => {
    expect(convertDotNetToRegexp('(?#this is a comment)\\w+')).toBe('\\w+');
  });

  test('converts single-quoted named groups', () => {
    expect(convertDotNetToRegexp("(?'name'\\w+)")).toBe('(?<name>\\w+)');
    expect(convertDotNetToRegexp("(?'year'\\d{4})-(?'month'\\d{2})")).toBe(
      '(?<year>\\d{4})-(?<month>\\d{2})',
    );
  });
});

describe('convertRubyToRegexp', () => {
  test('converts named backreferences', () => {
    expect(convertRubyToRegexp('(?<name>\\w+)\\s+\\g<name>')).toBe('(?<name>\\w+)\\s+\\k<name>');
  });

  test('converts numbered backreferences', () => {
    expect(convertRubyToRegexp('(\\w+)\\s+\\g<1>')).toBe('(\\w+)\\s+\\1');
  });

  test('removes relative backreferences', () => {
    expect(convertRubyToRegexp('(\\w+)(\\w+)\\g<-1>')).toBe('(\\w+)(\\w+)');
    expect(convertRubyToRegexp('(\\w+)\\g<-1>')).toBe('(\\w+)');
  });

  test('removes comments', () => {
    expect(convertRubyToRegexp('(?#ruby comment)\\w+')).toBe('\\w+');
  });

  test('converts possessive quantifiers', () => {
    expect(convertRubyToRegexp('\\w++')).toBe('\\w+');
    expect(convertRubyToRegexp('\\d*+')).toBe('\\d*');
    expect(convertRubyToRegexp('[a-z]?+')).toBe('[a-z]?');
    expect(convertRubyToRegexp('\\w{2,5}+')).toBe('\\w{2,5}');
  });
});

describe('Integration tests', () => {
  test('converts complex PCRE pattern', () => {
    const pcrePattern = '(?P<protocol>https?)://(?P<domain>[^/]+)(?P<path>/.*)?(?#URL pattern)';
    const result = convertPcreToRegexp(pcrePattern);
    expect(result).toBe('(?<protocol>https?)://(?<domain>[^/]+)(?<path>/.*)?');
  });

  test('converts complex Python pattern', () => {
    const pythonPattern = '(?P<name>\\w+)\\s+(?P=name)';
    const result = convertPythonToRegexp(pythonPattern);
    expect(result).toBe('(?<name>\\w+)\\s+\\k<name>');
  });

  test('converts complex Java pattern', () => {
    const javaPattern = '\\p{Alpha}+\\Q.txt\\E$';
    const result = convertJavaToRegexp(javaPattern);
    expect(result).toBe('[a-zA-Z]+\\.txt$');
  });

  test('handles patterns with multiple conversions', () => {
    const pattern = '(?P<word>\\w++)\\s+(?P=word)(?#duplicate words)';
    const result = convertPcreToRegexp(pattern);
    expect(result).toBe('(?<word>\\w+)\\s+\\k<word>');
  });
});
