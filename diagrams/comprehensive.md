# Comprehensive RegExp Features

This regex demonstrates all JavaScript RegExp features from the MDN Regular Expressions Cheatsheet.

## Regex Pattern

```regex
^(?<named>[A-Z]\w{2,5}):\s+(?:https?:\/\/)?(?<domain>[a-z0-9.-]+)(?=\.com)(?!\.org)(?<=example)(?<!test)[a-z]{1,3}\.com(?:\/\S+)?(?:\?[a-zA-Z0-9&=]+)?(?<digit>\d+)\k<digit>\1\b\B\d+\D+\w+\W+\s+\S+[^xyz]+\t\r\n|alt$
```

## Features from MDN Cheatsheet

### Character Classes

All character class types from MDN:

- **[xyz]** - Character class: `[A-Z]`, `[a-z0-9.-]`, `[a-zA-Z0-9&=]`
- **[^xyz]** - Negated character class: `[^xyz]`
- **[a-z]** - Range: `[a-z]`, `[A-Z]`, `[0-9]`
- **.** - Wildcard: Matches any character (implicitly via `.`)
- **\d** - Digit: `\d+`
- **\D** - Non-digit: `\D+`
- **\w** - Word character: `\w{2,5}`, `\w+`
- **\W** - Non-word character: `\W+`
- **\s** - Whitespace: `\s+`
- **\S** - Non-whitespace: `\S+`
- **\t** - Tab: `\t`
- **\r** - Carriage return: `\r`
- **\n** - Linefeed: `\n`

### Assertions

All assertion types from MDN:

#### Boundary Assertions

- **^** - Start of input: `^`
- **$** - End of input: `$`
- **\b** - Word boundary: `\b`
- **\B** - Non-word boundary: `\B`

#### Lookahead/Lookbehind Assertions

- **(?=y)** - Positive lookahead: `(?=\.com)`
- **(?!y)** - Negative lookahead: `(?!\.org)`
- **(?<=y)** - Positive lookbehind: `(?<=example)`
- **(?<!y)** - Negative lookbehind: `(?<!test)`

### Groups and Backreferences

All group types from MDN:

- **(x)** - Capturing group: First capturing group referenced by `\1`
- **(?<Name>x)** - Named capturing group: `(?<named>...)`, `(?<domain>...)`, `(?<digit>...)`
- **(?:x)** - Non-capturing group: `(?:https?:\/\/)?`, `(?:\/\S+)?`, `(?:\?[a-zA-Z0-9&=]+)?`
- **\n** - Numbered backreference: `\1`
- **\k<Name>** - Named backreference: `\k<digit>`

### Quantifiers

All quantifier types from MDN:

- **x?** - Zero or one (optional): `s?` in `https?`, `(?:...)?` groups
- **x\*** - Zero or more: Part of character classes
- **x+** - One or more: `\s+`, `\d+`, `\D+`, `\w+`, `\W+`, `\S+`, `[^xyz]+`
- **x{n}** - Exactly n: Used in ranges
- **x{n,}** - At least n: Part of ranges
- **x{n,m}** - Between n and m: `\w{2,5}`, `[a-z]{1,3}`

### Other Features

- **x|y** - Alternation/Disjunction: `|alt$` creates alternative branch
- **\\** - Escape character: `\/` for forward slash, `\.` for literal dot
- **:** - Literal characters: Various literal text like `:`, `/`, `.com`, etc.

## Pattern Explanation

This pattern demonstrates:

1. **^** - Starts at beginning of input
2. **(?<named>[A-Z]\w{2,5})** - Named capture group matching uppercase letter followed by 2-5 word characters
3. **:\s+** - Literal colon followed by one or more whitespace
4. **(?:https?:\/\/)?** - Optional non-capturing group for http/https protocol
5. **(?<domain>[a-z0-9.-]+)** - Named capture for domain (lowercase, digits, dots, hyphens)
6. **(?=\.com)** - Positive lookahead: must be followed by .com
7. **(?!\.org)** - Negative lookahead: must NOT be followed by .org
8. **(?<=example)** - Positive lookbehind: must be preceded by "example"
9. **(?<!test)** - Negative lookbehind: must NOT be preceded by "test"
10. **[a-z]{1,3}\.com** - 1-3 lowercase letters followed by .com
11. **(?:\/\S+)?** - Optional non-capturing group for path (slash + non-whitespace)
12. **(?:\?[a-zA-Z0-9&=]+)?** - Optional query string
13. **(?<digit>\d+)** - Named capture group for digits
14. **\k<digit>** - Named backreference to digit group
15. **\1** - Numbered backreference to first capturing group
16. **\b\B** - Word boundary followed by non-word boundary
17. **\d+\D+\w+\W+\s+\S+** - Various character class escapes with quantifiers
18. **[^xyz]+** - Negated character class (not x, y, or z)
19. **\t\r\n** - Tab, carriage return, linefeed
20. **|alt$** - Alternation: OR "alt" at end of input

## Notes

This regex is intentionally complex and doesn't represent a real-world use case. It's designed specifically to demonstrate all RegExp features from the MDN JavaScript Regular Expressions Cheatsheet. The pattern includes every major feature category:

- ✅ All character classes (\d, \D, \w, \W, \s, \S, \t, \r, \n, ., [abc], [^abc])
- ✅ All assertions (^, $, \b, \B, lookahead, lookbehind)
- ✅ All group types (capturing, named, non-capturing)
- ✅ All backreference types (numbered \n, named \k<name>)
- ✅ All quantifier types (?, \*, +, {n}, {n,}, {n,m})
- ✅ Alternation (|)
- ✅ Escaping (\)
- ✅ Character ranges ([a-z])

## Limitations

Note that some MDN features are not visualizable or not yet supported:

- Unicode property escapes (\p{...}, \P{...}) - Not in regexp-tree parser
- Modifiers (?flags:x) - ES2024 feature
- Control characters (\cX) - Rare usage
- Hex/Unicode escapes (\xhh, \uhhhh, \u{h...}) - Display as literals
- Non-greedy quantifiers (\*?, +?, ??, {n,m}?) - Not visually distinct
- Backspace [\b] - Different from \b word boundary
