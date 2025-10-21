# regex-to-mermaid

![regex-to-mermaid logo](https://raw.githubusercontent.com/tayles/regex-to-mermaid/main/docs/regex-to-mermaid-logo.png)

A TypeScript library and CLI tool to visualize regular expressions as Mermaid flowchart diagrams.

For example, visualise this:

```regex
^(?<protocol>https?:\/\/)?(?<domain>[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?<path>\/.*)?$
```

as this:

![regex-to-mermaid example](https://raw.githubusercontent.com/tayles/regex-to-mermaid/main/docs/regex-to-mermaid-example.png)

**[View this in the Mermaid Live Editor](https://mermaid.live/edit#pako:eNqVVm1v2jAQ_iuWu0nrlgTyAiEeoqPA9mUv0vatS1d5iYFowY4co65D_PfZjgtxaLsO8YG78z3P4-Pukh3MWE4ggi9fgq9kRX4j8OPVxbjiTLCMlZO1EFV9gdK0J7_nFzKUsw0u6OQ7dv9M3au-m3ju9Zs09Yzjehc4-3MFgcV6IpO81-cXL1Ka0hXH1Rp8_JpSACTbZ8lbq9-1wFy824F6jSuCwNLNCp6B_VsVWxb0kQiua8JFweiN_yqFP8Y_-WRcTMb1Bpfl5JKsClqD20Ksx73GNe4VkxSeI4QOmRqnLAThuNQo6rLNGeO1TgTyRG3zfKkUDi5PSR4CCCUA6vVOD2RrzG-yUgrTMqb0DpTslvAM10QRKse2qmxHXqwKoQwPuB1VlADGwYZxcipMcbmay9IWGV4Vxpn0PakyeJbKo6Lgv_UMJEPv8VIOu3JtvivC2eOUbcBjG6k7vbBhFjR_ThOZhv62_albvGlqYwCKNyS_yXAltpzc-OB7Cg36mX8PC-7HDZiQlHBsLSnHnEvhtcJuNa1tBrYZKpPQvFH4iKKgrSg4KGqm_EDY7lCbJDo5EDyHNmzThsdCyKXxv0UY2ObQopf_yyJftRYNcF23vTy6y0THD_W1V4QVC-zlYMVCe-51rF3Ck6m3siN7MrvZwck0WtkDe46s2NAeok4tgu5E6Lhcwa0eF3dlU0yzwbWnoCstSamZk-URQiaXJTq7HM7j6cipBWe_CDpLwlkUzx3Z74yjs77-vLUAjEKT_j6ZXSazQ_pimPjh6Kn04065FxBN4_nwgDBaxLNZeIJgrvWBs2314L10C7umhQ30PFlM5-G_7magp1VV3hmCmUJtatlI7WwKpzOnTneALDWaQ4knVFZOkFzvLcDVI90VzN0QLgc6f-d7fa8PHbjiRQ6R4FviQBOTLwE7pSaFYk02RD6r5M-cLPG2FClM6V6mVZheMba5z5QXWa0hWuKylta2yiXzvMBy4I9H5CgSPmNbKiDyAw0B0Q7-higOvCQMo9iPokGURLED7yCKksRTRtgfxQN_MBrGewf-0Zx9bxTLcJLESeQnie-HDiR5IRj_1LzD6FeZ_V8xeeYU)**

**[View more examples](./EXAMPLES.md)**

## Features

- 🎓 **Visual Regex Understanding** - Convert complex regex patterns into intuitive flowcharts
- 🌐 **Wide Support** - Mermaid diagrams are embeddable in various tools like GitHub, GitLab, VS Code, Notion, Obsidian, Docusaurus and more
- 🔗 **Easy Sharing** - Share visual regex diagrams in documentation, presentations, or code reviews
- 📦 **CLI & Library** - Use as a command-line tool or integrate into your projects
- 🔍 **Comprehensive Support** - Handles capture groups, lookaheads, lookbehinds, and more
- 🥗 **Multiple Flavors** - Supports JavaScript (RegExp) and PCRE regex flavors
- 🎨 **Multiple Themes** - Choose from default, neutral, dark, forest, or no styling
- ⚡ **Fast & Modern** - Built with Bun and TypeScript as an ESM library for optimal performance

## Installation

```shell
bun install -g regex-to-mermaid
```

```shell
pnpm install -g regex-to-mermaid
```

```shell
npm install -g regex-to-mermaid
```

```shell
yarn global add regex-to-mermaid
```

## CLI Usage

Basic:

```shell
regex-to-mermaid 'foo|bar'
```

All options:

```shell
regex-to-mermaid 'foo|bar' \
  --theme dark \
  --direction TD \
  --flavor pcre \
  --output diagram.mmd
```

### Options

| Short | Argument      | Description                                                                          | Default   |
| ----- | ------------- | ------------------------------------------------------------------------------------ | --------- |
| `-d`  | `--direction` | Diagram direction: `LR` (left-right) or `TD` (top-down)                              | `LR`      |
| `-f`  | `--flavor`    | Regex flavor: `regexp` (JavaScript), `pcre` (PCRE), or `auto` (detect automatically) | `auto`    |
| `-t`  | `--theme`     | Mermaid theme: `default`, `neutral`, `dark`, `forest`, or `none`                     | `default` |
| `-o`  | `--output`    | Output file (if not specified, outputs to stdout)                                    | `stdout`  |

### Image Generation

Pipe to [@mermaid-js/mermaid-cli](https://www.npmjs.com/package/@mermaid-js/mermaid-cli) to output an SVG or PNG image:

```shell
regex-to-mermaid 'foo|bar' | npx @mermaid-js/mermaid-cli --input - --output diagram.png
```

## Library Usage

```typescript
import { regexToMermaid } from 'regex-to-mermaid';

const diagram = regexToMermaid('foo|bar');

console.log(diagram);
```

### API

```typescript
function regexToMermaid(
  pattern: string | RegExp,
  options?: {
    direction?: 'LR' | 'TD'; // Default: 'LR'
    flavor?: 'regexp' | 'pcre' | 'auto'; // Default: 'auto'
    theme?: 'default' | 'neutral' | 'dark' | 'forest' | 'none'; // Default: 'default'
  },
): string;
```

## Themes

See available [THEMES.md](./THEMES.md).

## Local Development

This project uses [Bun](https://bun.sh).

### Setup

```bash
# Clone the repository
git clone https://github.com/tayles/regex-to-mermaid.git
cd regex-to-mermaid

# Install dependencies
bun install

# Run tests
bun test

# Check types
bun run type-check

# Format/lint code
bun run lint
```

## Tech Stack

| Project                                                                                                                                                                   | Description               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| [![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)                | Typesafe JavaScript       |
| [![Bun](https://img.shields.io/badge/bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)                                                     | Fast JavaScript runtime   |
| [![Mermaid](https://img.shields.io/badge/mermaid-%23FF3670.svg?style=for-the-badge&logo=mermaid&logoColor=white)](https://mermaid.js.org)                                 | Diagram generation        |
| [![Biome](https://img.shields.io/badge/biome-%2360A5FA.svg?style=for-the-badge&logo=biome&logoColor=white)](https://biomejs.dev)                                          | Code formatting & linting |
| [![regexp-tree](https://img.shields.io/badge/regexp--tree-%23000000.svg?style=for-the-badge&logo=regexp-tree&logoColor=white)](https://www.npmjs.com/package/regexp-tree) | Regex parsing to AST      |

## xkcd References

- [Regular Expressions](https://xkcd.com/208/)
- [Perl Problems](https://xkcd.com/1171/)
- [Regex Golf](https://xkcd.com/1313/)
- [Backslashes](https://xkcd.com/1638/)
