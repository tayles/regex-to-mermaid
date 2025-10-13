# All Token Types Regex

This regex demonstrates all possible token types that can be visualized by regex-to-mermaid.

## Regex Pattern

```regex
^(?<protocol>https?):\/\/(?:www\.)?([a-z0-9\-]+)\.(?:com|org|net)(?:\/[^\s]*)?(?=query)\1\d{3,5}\w+\s*\S+[^abc](?!neg)(?<!back)$|alt\b\B.
```

## Token Types Included

### Node Types (7 types)

1. **literal** - Regular characters: `http`, `://`, `.`, `1`
2. **char-class** - Character classes: `[a-z0-9\-]`, `\d`, `\w`, `\s`, `\S`, `.`
3. **negated-char-class** - Negated character classes: `[^\s]`, `[^abc]`
4. **modifier** - Quantifiers on nodes: `?`, `*`, `+`, `{3,5}`
5. **disjunction** - Alternation: `|` (creates disjunction_begin and disjunction_end nodes)
6. **assertion** - Anchors and boundaries: `^`, `$`, `\b`, `\B` (Note: lookahead/lookbehind are group types, not assertions)
7. **back-reference** - Backreferences: `\1`

### Group Types (7 types)

1. **standard** - Capturing group: `([a-z0-9\-]+)` - Numbered group
2. **named-capture** - Named capturing group: `(?<protocol>https?)`
3. **non-capturing** - Non-capturing group: `(?:www\.)?`, `(?:com|org|net)`, `(?:\/[^\s]*)?`
4. **positive-lookahead** - Positive lookahead assertion: `(?=query)` - Displayed as subgraph
5. **negative-lookahead** - Negative lookahead assertion: `(?!neg)` - Displayed as subgraph
6. **positive-lookbehind** - Positive lookbehind assertion: `(?<=back)` - Displayed as subgraph
7. **negative-lookbehind** - Negative lookbehind assertion: `(?<!back)` - Displayed as subgraph

### Quantifiers

- `?` - Optional (zero or one)
- `*` - Zero or more
- `+` - One or more
- `{n}` - Exactly n times
- `{n,}` - n or more times
- `{n,m}` - Between n and m times (e.g., `{3,5}`)

### Features Demonstrated

- **Anchors**: `^` (start), `$` (end)
- **Character classes**: Ranges `[a-z]`, `[0-9]`, special chars `[-]`
- **Negated classes**: `[^\s]`, `[^abc]`
- **Escape sequences**: `\/`, `\.` (though `\d`, `\w`, `\s` appear as literals)
- **Word boundaries**: `\b` (word boundary), `\B` (non-word boundary)
- **Lookahead/Lookbehind**: All four types
- **Backreferences**: `\1` references the first capture group
- **Alternation**: `|` creates branching paths
- **Nested groups**: Groups within groups
- **Optional groups**: Groups with `?` quantifier

## Notes

This regex is intentionally complex and doesn't represent a real-world use case. It's designed specifically to demonstrate all token types supported by the parser.
