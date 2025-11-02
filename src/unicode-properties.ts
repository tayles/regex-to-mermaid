/**
 * Unicode General_Category property mappings
 * Based on Unicode Technical Standard #18 Section 1.2.5
 * https://www.unicode.org/reports/tr18/#General_Category_Property
 */

/**
 * Mapping of General_Category short abbreviations to long form names
 */
export const GENERAL_CATEGORY_MAP: Record<string, string> = {
  // Letter (L)
  L: 'Letter',
  Lu: 'Uppercase_Letter',
  Ll: 'Lowercase_Letter',
  Lt: 'Titlecase_Letter',
  Lm: 'Modifier_Letter',
  Lo: 'Other_Letter',

  // Mark (M)
  M: 'Mark',
  Mn: 'Nonspacing_Mark',
  Mc: 'Spacing_Mark',
  Me: 'Enclosing_Mark',

  // Number (N)
  N: 'Number',
  Nd: 'Decimal_Number',
  Nl: 'Letter_Number',
  No: 'Other_Number',

  // Symbol (S)
  S: 'Symbol',
  Sm: 'Math_Symbol',
  Sc: 'Currency_Symbol',
  Sk: 'Modifier_Symbol',
  So: 'Other_Symbol',

  // Punctuation (P)
  P: 'Punctuation',
  Pc: 'Connector_Punctuation',
  Pd: 'Dash_Punctuation',
  Ps: 'Open_Punctuation',
  Pe: 'Close_Punctuation',
  Pi: 'Initial_Punctuation',
  Pf: 'Final_Punctuation',
  Po: 'Other_Punctuation',

  // Separator (Z)
  Z: 'Separator',
  Zs: 'Space_Separator',
  Zl: 'Line_Separator',
  Zp: 'Paragraph_Separator',

  // Other (C)
  C: 'Other',
  Cc: 'Control',
  Cf: 'Format',
  Cs: 'Surrogate',
  Co: 'Private_Use',
  Cn: 'Unassigned',
} as const;

/**
 * Normalizes a General_Category property value for lenient matching.
 * According to Unicode TR18, property matching should be lenient as to spaces,
 * casing, hyphens, and underscores.
 *
 * This function:
 * - Converts to lowercase
 * - Removes spaces, hyphens, and underscores
 *
 * @param value - The value to normalize
 * @returns The normalized value
 *
 * @example
 * ```typescript
 * normalizePropertyValue('Lu')                 // => 'lu'
 * normalizePropertyValue('Uppercase Letter')   // => 'uppercaseletter'
 * normalizePropertyValue('Uppercase_Letter')   // => 'uppercaseletter'
 * normalizePropertyValue('uppercase-letter')   // => 'uppercaseletter'
 * ```
 */
export function normalizePropertyValue(value: string): string {
  return value.toLowerCase().replace(/[\s\-_]/g, '');
}

/**
 * Normalized lookup map for lenient property matching.
 * Maps normalized forms (both abbreviations and long forms) to their canonical forms.
 * Built lazily on first use for performance.
 */
let NORMALIZED_CATEGORY_MAP: Record<string, string> | null = null;

/**
 * Builds the normalized category map for lenient matching.
 * This is called lazily on first use of expandGeneralCategory.
 */
function buildNormalizedMap(): Record<string, string> {
  const map: Record<string, string> = {};

  // Add normalized abbreviations (keys)
  for (const [key, value] of Object.entries(GENERAL_CATEGORY_MAP)) {
    const normalizedKey = normalizePropertyValue(key);
    map[normalizedKey] = value;
  }

  // Also add normalized long forms (values) to support matching by full name
  for (const value of Object.values(GENERAL_CATEGORY_MAP)) {
    const normalizedValue = normalizePropertyValue(value);
    map[normalizedValue] = value;
  }

  return map;
}

/**
 * Expands a General_Category property abbreviation to its long form.
 * Supports lenient matching: case-insensitive, ignores spaces, hyphens, and underscores.
 *
 * @param abbreviation - The short form (e.g., "Lu", "lu", "Uppercase Letter", "uppercase_letter")
 * @returns The long form (e.g., "Uppercase_Letter", "Lowercase_Letter", "Letter"), or null if not found
 *
 * @example
 * ```typescript
 * expandGeneralCategory('Lu')                 // => 'Uppercase_Letter'
 * expandGeneralCategory('lu')                 // => 'Uppercase_Letter'
 * expandGeneralCategory('Uppercase Letter')   // => 'Uppercase_Letter'
 * expandGeneralCategory('uppercase_letter')   // => 'Uppercase_Letter'
 * expandGeneralCategory('L')                  // => 'Letter'
 * expandGeneralCategory('Nd')                 // => 'Decimal_Number'
 * expandGeneralCategory('Unknown')            // => null
 * ```
 */
export function expandGeneralCategory(abbreviation: string): string | null {
  // Try exact match first for performance
  const exactMatch = GENERAL_CATEGORY_MAP[abbreviation];
  if (exactMatch) {
    return exactMatch;
  }

  // Build normalized map on first use
  if (NORMALIZED_CATEGORY_MAP === null) {
    NORMALIZED_CATEGORY_MAP = buildNormalizedMap();
  }

  // Fall back to normalized (lenient) matching
  const normalized = normalizePropertyValue(abbreviation);
  return NORMALIZED_CATEGORY_MAP[normalized] ?? null;
}
