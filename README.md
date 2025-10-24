# regex-to-mermaid

[![regex-to-mermaid logo](https://raw.githubusercontent.com/tayles/regex-to-mermaid/main/docs/regex-to-mermaid-logo.png)](https://npmjs.com/package/regex-to-mermaid)

A TypeScript library and CLI tool to visualize regular expressions as Mermaid flowchart diagrams.

For example, visualise this:

```regex
^(?<protocol>https?:\/\/)?(?<domain>[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?<path>\/.*)?$
```

as this:

![regex-to-mermaid example](https://raw.githubusercontent.com/tayles/regex-to-mermaid/main/diagrams/url.mermaid-diagram.png)

**[View this in the Mermaid Live Editor](https://mermaid.live/edit#pako:eNqVVm1v2jAQ_iuW20rrlgRwICEpglFg_bIXqdunLh3yEgPRQhw5Rn1B_PfZjgtxaLc2H1DO53uex8fdOVsY04TAEC4ZLlbg83WUA4Dj-EfKMxKCCF6TJbkPwa93o0HBKKcxzYYrzotyFEbiaamf85FwJ3SN03z4E9uPY_umbQeOfftBuh29dLtF1u5cAmG-GqpA5_356DSCmnRKyphJ0iuSE4Y5ScBdyleASQ02p_aaMMGRfOw4bceVYTLw7Ax8FWco5XvJMeMft6Bc4ULIX9hxymKwu5C-RZq_4MFlSRhPaT7vvIvgr8FvNhykw0G5xlk2vCTLNC-VkEGrWhq00mEEz8Mw3EcqnCzlQnamUGSOqj161diBxI7S5PlWSBycHZM8B-AKgLDVOt4QrzCbx5kQpmSM8weQ0TvCYlwSSSgXNkVhLiTpMuXScIDdUJUTQBlYU0aOhUkuW3EZ2rqaV7pxLNb-qRK9SuVBEXqznp5gaL2cSq8p1-S7IYy-TFkHPJSRPNOpCTPLk9cUkS7o75vfqiGrotYGyPGaJPMYF3zDyLwDfkZQo590nmDBU5cC7RISDqUl5Oh9EbyV2LWiNU1kmq40SZ5UCl9QhOqK0F5RNRj2hPUKNUm6RxvQa2jdOq17SISYMm9NQs80PYNe_C-zZFkbNMC27frwaA4T5d_n1xwRhg-Zw8HwuWbfK189hUddb0R3zc5sRqOjbjSie2YfGT7PbKJGLlCzI5RfjOBajfOHrEqmnuBqJc2XSpJUMyWLA4QIzrLw5NKb-uO-VXJG_5DwJHAnXX9qiXqnLDxpq-fCANAKdfinYHIZTPbhMy_ouP1_hR9mypOA7tifenuE_syfTNwjBH2sK0Y3xbPnUiVs6xLW0NNgNp66_zubhh4XRfagCSYStcplJbUxKaxGn1rNBjLUXEBLfA6kCQw52xAL6ltXfCRsJUME-Yqsibh_xGtCFniTcXkX70RYgfMbStdPkULccgXDBc5KYW2KRNzp0xSLJl7vV5noL8ImdJNzGHo9hQHDLbwXluv02_3A77U7yO_5bc-CDzBEPnICNwi8ftfr9F0X7Sz4qEjbTt_vBuLx3QChAHVdC5Ik5ZR9qT5y1LfO7i-AWPEJ)**

**[View more examples](./EXAMPLES.md)**

## Features

- 🎓 **Visual Regex Understanding** - Convert complex regex patterns into intuitive flowcharts
- 🌐 **Wide Support** - Mermaid diagrams are embeddable in various tools like GitHub, GitLab, VS Code, Notion, Obsidian, Docusaurus and more
- 🔗 **Easy Sharing** - Share visual regex diagrams in documentation, presentations, or code reviews
- 📦 **CLI & Library** - Use as a command-line tool or integrate into your projects
- 🔍 **Comprehensive Support** - Handles capture groups, lookaheads, lookbehinds, and more
- 🥗 **Multiple Flavors** - Supports JavaScript (RegExp) and PCRE regex flavors _(see [supported flavors](#supported-flavors))_
- 🎨 **Multiple Themes** - Choose from default, neutral, dark, forest, or no styling
- ⚡ **Fast & Modern** - Built with TypeScript as an ESM library for optimal performance

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

Pipe to [@mermaid-js/mermaid-cli](https://npmjs.com/package/@mermaid-js/mermaid-cli) to output an SVG or PNG image:

```shell
regex-to-mermaid 'foo|bar' | \
  npx @mermaid-js/mermaid-cli \
    --input - \
    --output diagram.png
```

### Generate a mermaid.live Link

```shell
regex-to-mermaid 'foo|bar' | jq -Rscj '{code: .}' | gzip -n -c -9 | base64 -w0 | tr '/+' '_-' | awk '{printf "https://mermaid.live/edit#pako:%s\n", $0}'
```

- `jq -Rscj '{code: .}'` creates a minimal JSON state object with the Mermaid code
  - `-R` tells jq to treat the input as a raw string
  - `-s` reads the entire input stream into a single string
  - `-c` ensures the output JSON is on a single line
  - `-j` joins the output without a newline
- `gzip -n -c -9` compresses the JSON with maximum compression
  - `-n` omits the original filename and timestamp for consistent output
  - `-c` writes to standard output
  - `-9` uses the highest compression level
- `base64 -w0` encodes the compressed data in base64
  - `-w0` disables line wrapping
- `tr '/+' '_-'` makes the base64 URL-safe
- `awk '{printf "https://mermaid.live/edit#pako:%s\n", $0}'` constructs the final URL

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

## Supported Flavors

| Flavor                                       | Usage          | Support                                                                                   |
| -------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| RegExp                                       | JavaScript     | ✅ Fully supported                                                                        |
| PCRE2                                        | PHP >= 7.3     | 🚧 Limited support, using [pcre-to-regexp](https://npmjs.com/package/pcre-to-regexp) shim |
| PCRE _(Perl Compatible Regular Expressions)_ | PHP < 7.3, R   | 🚧 Limited support, using [pcre-to-regexp](https://npmjs.com/package/pcre-to-regexp) shim |
| BRE _(POSIX Basic)_                          | sed, grep, etc | 🚧 Limited support                                                                        |
| ERE _(POSIX Extended)_                       | egrep, etc     | 🚧 Limited support                                                                        |
| Python                                       | Python         | 🚧 Limited support                                                                        |
| RE2                                          | Go             | 🚧 Limited support                                                                        |
| Rust                                         | Rust           | 🚧 Limited support                                                                        |
| Java                                         | Java           | 🚧 Limited support                                                                        |
| .NET                                         | .NET / C#      | 🚧 Limited support                                                                        |
| Ruby                                         | Ruby           | 🚧 Limited support                                                                        |

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

| Project                                                                                                                                                               | Description               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| [![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)            | Typesafe JavaScript       |
| [![Bun](https://img.shields.io/badge/bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)                                                 | Fast JavaScript runtime   |
| [![Mermaid](https://img.shields.io/badge/mermaid-%23FF3670.svg?style=for-the-badge&logo=mermaid&logoColor=white)](https://mermaid.js.org)                             | Diagram generation        |
| [![Biome](https://img.shields.io/badge/Biome-25272f?style=for-the-badge&logo=biome)](https://biomejs.dev)                                                             | Code formatting & linting |
| [![regexp-tree](https://img.shields.io/badge/regexp--tree-%23000000.svg?style=for-the-badge&logo=regexp-tree&logoColor=white)](https://npmjs.com/package/regexp-tree) | Regex parsing to AST      |

## xkcd References

- [Regular Expressions](https://xkcd.com/208/)
- [Perl Problems](https://xkcd.com/1171/)
- [Regex Golf](https://xkcd.com/1313/)
- [Backslashes](https://xkcd.com/1638/)

## Maintainers

- [David Taylor](https://github.com/tayles)
