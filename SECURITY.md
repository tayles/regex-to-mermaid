# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of regex-to-mermaid seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them by:

1. Opening a [GitHub Security Advisory](https://github.com/tayles/regex-to-mermaid/security/advisories/new)
2. Or by emailing the maintainers directly (if email is available in the GitHub profile)

Please include the following information:

- Type of issue (e.g. buffer overflow, injection, denial of service)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to expect

- You should receive a response within 48 hours
- We'll work with you to understand and resolve the issue
- We'll credit you for your discovery in the security advisory (unless you prefer to remain anonymous)
- We'll release a patch as soon as possible depending on complexity

## Security Considerations

While this is primarily a visualization tool, please be aware:

- **Regex Complexity**: Extremely complex regex patterns may cause performance issues or timeout
- **Dependency Security**: We regularly update dependencies to patch security vulnerabilities
- **Input Validation**: The tool validates regex syntax but always use caution with untrusted input

## Preferred Languages

We prefer all communications to be in English.
