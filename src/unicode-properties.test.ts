import { describe, expect, test } from 'bun:test';
import {
  expandGeneralCategory,
  GENERAL_CATEGORY_MAP,
  normalizePropertyValue,
} from './unicode-properties';

describe('expandGeneralCategory', () => {
  describe('Letter categories', () => {
    test('expands L to Letter', () => {
      expect(expandGeneralCategory('L')).toBe('Letter');
    });

    test('expands Lu to Uppercase_Letter', () => {
      expect(expandGeneralCategory('Lu')).toBe('Uppercase_Letter');
    });

    test('expands Ll to Lowercase_Letter', () => {
      expect(expandGeneralCategory('Ll')).toBe('Lowercase_Letter');
    });

    test('expands Lt to Titlecase_Letter', () => {
      expect(expandGeneralCategory('Lt')).toBe('Titlecase_Letter');
    });

    test('expands Lm to Modifier_Letter', () => {
      expect(expandGeneralCategory('Lm')).toBe('Modifier_Letter');
    });

    test('expands Lo to Other_Letter', () => {
      expect(expandGeneralCategory('Lo')).toBe('Other_Letter');
    });
  });

  describe('Mark categories', () => {
    test('expands M to Mark', () => {
      expect(expandGeneralCategory('M')).toBe('Mark');
    });

    test('expands Mn to Nonspacing_Mark', () => {
      expect(expandGeneralCategory('Mn')).toBe('Nonspacing_Mark');
    });

    test('expands Mc to Spacing_Mark', () => {
      expect(expandGeneralCategory('Mc')).toBe('Spacing_Mark');
    });

    test('expands Me to Enclosing_Mark', () => {
      expect(expandGeneralCategory('Me')).toBe('Enclosing_Mark');
    });
  });

  describe('Number categories', () => {
    test('expands N to Number', () => {
      expect(expandGeneralCategory('N')).toBe('Number');
    });

    test('expands Nd to Decimal_Number', () => {
      expect(expandGeneralCategory('Nd')).toBe('Decimal_Number');
    });

    test('expands Nl to Letter_Number', () => {
      expect(expandGeneralCategory('Nl')).toBe('Letter_Number');
    });

    test('expands No to Other_Number', () => {
      expect(expandGeneralCategory('No')).toBe('Other_Number');
    });
  });

  describe('Symbol categories', () => {
    test('expands S to Symbol', () => {
      expect(expandGeneralCategory('S')).toBe('Symbol');
    });

    test('expands Sm to Math_Symbol', () => {
      expect(expandGeneralCategory('Sm')).toBe('Math_Symbol');
    });

    test('expands Sc to Currency_Symbol', () => {
      expect(expandGeneralCategory('Sc')).toBe('Currency_Symbol');
    });

    test('expands Sk to Modifier_Symbol', () => {
      expect(expandGeneralCategory('Sk')).toBe('Modifier_Symbol');
    });

    test('expands So to Other_Symbol', () => {
      expect(expandGeneralCategory('So')).toBe('Other_Symbol');
    });
  });

  describe('Punctuation categories', () => {
    test('expands P to Punctuation', () => {
      expect(expandGeneralCategory('P')).toBe('Punctuation');
    });

    test('expands Pc to Connector_Punctuation', () => {
      expect(expandGeneralCategory('Pc')).toBe('Connector_Punctuation');
    });

    test('expands Pd to Dash_Punctuation', () => {
      expect(expandGeneralCategory('Pd')).toBe('Dash_Punctuation');
    });

    test('expands Ps to Open_Punctuation', () => {
      expect(expandGeneralCategory('Ps')).toBe('Open_Punctuation');
    });

    test('expands Pe to Close_Punctuation', () => {
      expect(expandGeneralCategory('Pe')).toBe('Close_Punctuation');
    });

    test('expands Pi to Initial_Punctuation', () => {
      expect(expandGeneralCategory('Pi')).toBe('Initial_Punctuation');
    });

    test('expands Pf to Final_Punctuation', () => {
      expect(expandGeneralCategory('Pf')).toBe('Final_Punctuation');
    });

    test('expands Po to Other_Punctuation', () => {
      expect(expandGeneralCategory('Po')).toBe('Other_Punctuation');
    });
  });

  describe('Separator categories', () => {
    test('expands Z to Separator', () => {
      expect(expandGeneralCategory('Z')).toBe('Separator');
    });

    test('expands Zs to Space_Separator', () => {
      expect(expandGeneralCategory('Zs')).toBe('Space_Separator');
    });

    test('expands Zl to Line_Separator', () => {
      expect(expandGeneralCategory('Zl')).toBe('Line_Separator');
    });

    test('expands Zp to Paragraph_Separator', () => {
      expect(expandGeneralCategory('Zp')).toBe('Paragraph_Separator');
    });
  });

  describe('Other categories', () => {
    test('expands C to Other', () => {
      expect(expandGeneralCategory('C')).toBe('Other');
    });

    test('expands Cc to Control', () => {
      expect(expandGeneralCategory('Cc')).toBe('Control');
    });

    test('expands Cf to Format', () => {
      expect(expandGeneralCategory('Cf')).toBe('Format');
    });

    test('expands Cs to Surrogate', () => {
      expect(expandGeneralCategory('Cs')).toBe('Surrogate');
    });

    test('expands Co to Private_Use', () => {
      expect(expandGeneralCategory('Co')).toBe('Private_Use');
    });

    test('expands Cn to Unassigned', () => {
      expect(expandGeneralCategory('Cn')).toBe('Unassigned');
    });
  });

  describe('Returns null for unknown values', () => {
    test('returns null for unknown abbreviation', () => {
      expect(expandGeneralCategory('Xyz')).toBe(null);
    });

    test('returns null for empty string', () => {
      expect(expandGeneralCategory('')).toBe(null);
    });

    test('returns null for completely invalid value', () => {
      expect(expandGeneralCategory('NotACategory123')).toBe(null);
    });

    test('returns null for partial matches that are not valid', () => {
      expect(expandGeneralCategory('Upper')).toBe(null);
      expect(expandGeneralCategory('Case')).toBe(null);
      expect(expandGeneralCategory('Numeric')).toBe(null);
    });
  });

  describe('Lenient matching (case-insensitive, ignores spaces/hyphens/underscores)', () => {
    test('handles lowercase abbreviations', () => {
      expect(expandGeneralCategory('lu')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('ll')).toBe('Lowercase_Letter');
      expect(expandGeneralCategory('nd')).toBe('Decimal_Number');
      expect(expandGeneralCategory('l')).toBe('Letter');
    });

    test('handles mixed case abbreviations', () => {
      expect(expandGeneralCategory('Lu')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('LU')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('lU')).toBe('Uppercase_Letter');
    });

    test('handles long form with spaces', () => {
      expect(expandGeneralCategory('Uppercase Letter')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('Lowercase Letter')).toBe('Lowercase_Letter');
      expect(expandGeneralCategory('Decimal Number')).toBe('Decimal_Number');
      expect(expandGeneralCategory('Math Symbol')).toBe('Math_Symbol');
    });

    test('handles long form with underscores', () => {
      expect(expandGeneralCategory('Uppercase_Letter')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('Lowercase_Letter')).toBe('Lowercase_Letter');
      expect(expandGeneralCategory('Decimal_Number')).toBe('Decimal_Number');
    });

    test('handles long form with hyphens', () => {
      expect(expandGeneralCategory('Uppercase-Letter')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('Lowercase-Letter')).toBe('Lowercase_Letter');
      expect(expandGeneralCategory('Decimal-Number')).toBe('Decimal_Number');
    });

    test('handles lowercase long form with spaces', () => {
      expect(expandGeneralCategory('uppercase letter')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('lowercase letter')).toBe('Lowercase_Letter');
      expect(expandGeneralCategory('decimal number')).toBe('Decimal_Number');
    });

    test('handles no spaces/hyphens/underscores (all run together)', () => {
      expect(expandGeneralCategory('uppercaseletter')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('lowercaseletter')).toBe('Lowercase_Letter');
      expect(expandGeneralCategory('decimalnumber')).toBe('Decimal_Number');
    });

    test('handles UPPERCASE long form', () => {
      expect(expandGeneralCategory('UPPERCASE LETTER')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('LOWERCASE_LETTER')).toBe('Lowercase_Letter');
      expect(expandGeneralCategory('DECIMAL-NUMBER')).toBe('Decimal_Number');
    });

    test('handles mixed variations', () => {
      expect(expandGeneralCategory('Upper Case Letter')).toBe('Uppercase_Letter');
      expect(expandGeneralCategory('lower_case-letter')).toBe('Lowercase_Letter');
      expect(expandGeneralCategory('UPPERCASELETTER')).toBe('Uppercase_Letter');
    });

    test('works with all category types', () => {
      // Letters
      expect(expandGeneralCategory('titlecase letter')).toBe('Titlecase_Letter');
      expect(expandGeneralCategory('modifier letter')).toBe('Modifier_Letter');

      // Marks
      expect(expandGeneralCategory('nonspacing mark')).toBe('Nonspacing_Mark');
      expect(expandGeneralCategory('spacing mark')).toBe('Spacing_Mark');

      // Numbers
      expect(expandGeneralCategory('letter number')).toBe('Letter_Number');
      expect(expandGeneralCategory('other number')).toBe('Other_Number');

      // Symbols
      expect(expandGeneralCategory('currency symbol')).toBe('Currency_Symbol');
      expect(expandGeneralCategory('modifier symbol')).toBe('Modifier_Symbol');

      // Punctuation
      expect(expandGeneralCategory('connector punctuation')).toBe('Connector_Punctuation');
      expect(expandGeneralCategory('dash punctuation')).toBe('Dash_Punctuation');
      expect(expandGeneralCategory('open punctuation')).toBe('Open_Punctuation');

      // Separators
      expect(expandGeneralCategory('space separator')).toBe('Space_Separator');
      expect(expandGeneralCategory('line separator')).toBe('Line_Separator');

      // Other
      expect(expandGeneralCategory('private use')).toBe('Private_Use');
    });
  });

  describe('Coverage of all mappings', () => {
    test('covers all general category abbreviations', () => {
      const allAbbreviations = Object.keys(GENERAL_CATEGORY_MAP);
      expect(allAbbreviations.length).toBe(37);

      for (const abbrev of allAbbreviations) {
        const result = expandGeneralCategory(abbrev);
        expect(result).not.toBe(null);
        expect(typeof result).toBe('string');
      }
    });
  });
});

describe('normalizePropertyValue', () => {
  test('converts to lowercase', () => {
    expect(normalizePropertyValue('Lu')).toBe('lu');
    expect(normalizePropertyValue('LU')).toBe('lu');
    expect(normalizePropertyValue('UPPERCASE')).toBe('uppercase');
  });

  test('removes spaces', () => {
    expect(normalizePropertyValue('Uppercase Letter')).toBe('uppercaseletter');
    expect(normalizePropertyValue('Decimal Number')).toBe('decimalnumber');
    expect(normalizePropertyValue('Math Symbol')).toBe('mathsymbol');
  });

  test('removes hyphens', () => {
    expect(normalizePropertyValue('Uppercase-Letter')).toBe('uppercaseletter');
    expect(normalizePropertyValue('Decimal-Number')).toBe('decimalnumber');
    expect(normalizePropertyValue('Math-Symbol')).toBe('mathsymbol');
  });

  test('removes underscores', () => {
    expect(normalizePropertyValue('Uppercase_Letter')).toBe('uppercaseletter');
    expect(normalizePropertyValue('Decimal_Number')).toBe('decimalnumber');
    expect(normalizePropertyValue('Math_Symbol')).toBe('mathsymbol');
  });

  test('handles mixed separators', () => {
    expect(normalizePropertyValue('Upper Case_Letter')).toBe('uppercaseletter');
    expect(normalizePropertyValue('Decimal-Number_Test')).toBe('decimalnumbertest');
    expect(normalizePropertyValue('Math Symbol-Test_Case')).toBe('mathsymboltestcase');
  });

  test('handles multiple consecutive separators', () => {
    expect(normalizePropertyValue('Upper  Case')).toBe('uppercase');
    expect(normalizePropertyValue('Decimal--Number')).toBe('decimalnumber');
    expect(normalizePropertyValue('Math__Symbol')).toBe('mathsymbol');
  });

  test('handles empty string', () => {
    expect(normalizePropertyValue('')).toBe('');
  });

  test('handles strings with only separators', () => {
    expect(normalizePropertyValue(' - _ ')).toBe('');
    expect(normalizePropertyValue('---')).toBe('');
    expect(normalizePropertyValue('   ')).toBe('');
  });

  test('handles already normalized values', () => {
    expect(normalizePropertyValue('lu')).toBe('lu');
    expect(normalizePropertyValue('uppercaseletter')).toBe('uppercaseletter');
    expect(normalizePropertyValue('decimalnumber')).toBe('decimalnumber');
  });
});
