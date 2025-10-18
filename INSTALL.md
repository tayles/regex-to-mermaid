# Installation Guide

## Prerequisites

This tool requires [Bun](https://bun.sh) to be installed on your system.

### Install Bun

**macOS and Linux:**

```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**

```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

Alternatively, you can use npm/npx without installing Bun (see below).

## Installation Methods

### 1. Global Installation with Bun (Recommended)

Install globally to use the CLI from anywhere:

```bash
bun install -g regex-to-mermaid
```

Then use it:

```bash
regex-to-mermaid 'your-regex-here'
```

### 2. Global Installation with npm

If you prefer npm:

```bash
npm install -g regex-to-mermaid
```

### 3. Use with npx (No Installation Required)

Run without installing:

```bash
npx regex-to-mermaid 'your-regex-here'
```

### 4. Local Project Installation

Add to your project:

```bash
# Using Bun
bun add regex-to-mermaid

# Using npm
npm install regex-to-mermaid
```

Then use as a library:

```typescript
import { parseRegex, renderMermaid } from 'regex-to-mermaid';

const pattern = /^test$/;
const ast = parseRegex(pattern);
const diagram = renderMermaid(ast);

console.log(diagram);
```

## Verify Installation

Check the installed version:

```bash
regex-to-mermaid --version
```

Display help:

```bash
regex-to-mermaid --help
```

## Troubleshooting

### Command not found

If you get a "command not found" error after global installation:

1. **With Bun:** Make sure Bun's bin directory is in your PATH

   - Check with: `echo $PATH`
   - Add to your shell config if needed: `export PATH="$HOME/.bun/bin:$PATH"`

2. **With npm:** Ensure npm's global bin directory is in your PATH
   - Find it with: `npm config get prefix`
   - Add to PATH: `export PATH="$(npm config get prefix)/bin:$PATH"`

### Permission Errors

If you get permission errors:

- **Don't use `sudo`** with Bun or npm if possible
- Use [nvm](https://github.com/nvm-sh/nvm) or configure npm to install globally without sudo

### Windows Issues

- Make sure to use PowerShell or Windows Terminal
- You may need to restart your terminal after installation

## Next Steps

- Check out the [examples](EXAMPLES.md) to see what you can create
- Read the [full documentation](README.md) for all features
- View the [contributing guide](CONTRIBUTING.md) if you want to help improve the tool
