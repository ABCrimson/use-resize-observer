# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |
| 0.9.x   | :white_check_mark: |
| < 0.9   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in `@crimson_dev/use-resize-observer`, please report it responsibly.

### How to Report

1. **Do NOT open a public issue.**
2. Email: security@crimsondev.io (placeholder)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix release**: Within 30 days for critical issues

### Scope

This library runs in browser environments and Node.js. Security concerns include:

- **XSS via DOM manipulation**: The library attaches `ResizeObserver` to DOM elements provided by the consumer. It does not inject HTML or execute arbitrary scripts.
- **Worker isolation**: The Worker subpath uses `SharedArrayBuffer`, which requires `crossOriginIsolated` context (COOP/COEP headers). This is a browser security feature, not a vulnerability.
- **Supply chain**: We use npm provenance attestation and pin all dependency versions.

### Out of Scope

- Vulnerabilities in React, browsers, or Node.js itself
- Issues requiring physical access to the user's machine
- Social engineering attacks

## Security Best Practices

When using this library:

- Always serve your application with appropriate COOP/COEP headers if using Worker mode
- Keep your React and Node.js versions up to date
- Use `npm audit` regularly
