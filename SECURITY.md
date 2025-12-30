# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| v1.2.x  | ✅ Yes    |
| v1.1.x  | ✅ Yes    |
| < v1.1  | ❌ No     |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in the ApertoDNS Protocol specification or reference implementation, please report it responsibly.

### Contact

- **Email:** [security@apertodns.com](mailto:security@apertodns.com)
- **GitHub:** [Security Advisories](https://github.com/apertodns/apertodns-protocol/security/advisories)
- **Security.txt:** [https://www.apertodns.com/.well-known/security.txt](https://www.apertodns.com/.well-known/security.txt)

### PGP Encryption

For sensitive reports, please encrypt your message using our PGP key:

- **Key:** [https://www.apertodns.com/.well-known/pgp-key.txt](https://www.apertodns.com/.well-known/pgp-key.txt)
- **Keyserver:** [keys.openpgp.org](https://keys.openpgp.org/search?q=security%40apertodns.com)
- **Fingerprint:** `A65E 8CE4 5488 EEB9 5795 7B8E F7DB 6A1B 1CAA B9C0`

### What to Include

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Initial acknowledgment | Within 24 hours |
| Preliminary assessment | Within 72 hours |
| Fix development | Within 14 days (critical) / 30 days (other) |
| Public disclosure | After fix is deployed |

### Rewards

While we don't have a formal bug bounty program, we recognize security researchers:

- Credit in release notes and security advisories
- Hall of Fame listing on our website
- Swag and merchandise for significant findings

---

## Security Requirements

### Transport Layer

- **TLS 1.2** minimum required
- **TLS 1.3** recommended
- Valid, publicly-trusted certificates
- HSTS enabled with minimum 1-year max-age
- Certificate Transparency required

### Authentication

- Tokens must be cryptographically random (minimum 192 bits entropy)
- Token storage uses bcrypt (cost 12+) or Argon2id
- Basic Auth only for legacy DynDNS2 endpoint
- Bearer tokens for all modern endpoints

### Token Format

```
{provider}_{environment}_{random}

- provider: Provider identifier (lowercase, 3-20 chars, alphanumeric + hyphens)
- environment: "live" or "test"
- random: 32 chars base64url (192 bits)

Examples:
- apertodns_live_7Hqj3kL9mNpR2sT5vWxY8zA1bC4dE6fG (ApertoDNS)
- desec_live_xK9mNpR2sT5vWxY8zA1bC4dE6fG7Hqj3 (deSEC)
- duckdns_test_zA1bC4dE6fG7Hqj3kL9mNpR2sT5vWxY8 (DuckDNS)
```

### Rate Limiting

All endpoints implement rate limiting to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| /update | 60 | 1 min |
| /bulk-update | 10 | 1 min |
| /status | 120 | 1 min |
| /nic/update | 60 | 1 min |

### Input Validation

**Hostname:**
- Maximum 253 characters
- Each label 1-63 characters
- Alphanumeric and hyphens only
- No leading/trailing hyphens in labels

**IP Address:**
- Must be valid IPv4 or IPv6
- Must be public (not private/reserved ranges)
- CGNAT ranges (100.64.0.0/10) rejected

**TTL:**
- Integer between 60 and 86400

---

## Webhook Security

### Requirements

1. **HTTPS only** - Webhook URLs must use TLS
2. **SSRF protection** - URLs must not resolve to private IP ranges
3. **Signature verification** - HMAC-SHA256 with timestamp
4. **Replay protection** - 5-minute timestamp window
5. **Timeout** - Maximum 10 seconds per delivery

### Signature Verification

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret, timestamp) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Data Protection

### Collected Data

| Data | Purpose | Retention |
|------|---------|-----------|
| Email | Account, notifications | Until deletion |
| Hostname | DDNS service | Until deletion |
| Current IP | DNS record | Until next update |
| Previous IP | Debugging | 7 days |
| Access logs | Security | 30 days |
| Token (hashed) | Authentication | Until revoked |

### Never Collected

- Passwords in plaintext
- Full tokens in logs
- Geolocation data
- Browser fingerprints
- Tracking cookies
- Behavioral analytics

### Log Format

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "request_id": "req_xxx",
  "method": "POST",
  "path": "/.well-known/apertodns/v1/update",
  "token_id": "tok_xxx",
  "token_hint": "apertodns_live_xxxx...xxxx",
  "response_status": 200,
  "response_time_ms": 45
}
```

---

## Security Headers

All responses include:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
Referrer-Policy: no-referrer
Cache-Control: no-store, no-cache, must-revalidate, private
```

---

## Known Attack Vectors

### Mitigated

| Attack | Mitigation |
|--------|------------|
| Credential stuffing | Rate limiting, token format validation |
| Token enumeration | Constant-time comparison, no timing leaks |
| DNS rebinding | Strict hostname validation |
| SSRF via webhooks | Private IP range blocking |
| Replay attacks | Timestamp-bound signatures |
| Man-in-the-middle | TLS 1.2+ required |

### Defense in Depth

1. **Network**: TLS, HSTS, certificate pinning optional
2. **Application**: Input validation, rate limiting, auth checks
3. **Data**: Encryption at rest, minimal logging
4. **Monitoring**: Anomaly detection, alerting

---

## Compliance

### GDPR

- Data export (Article 20)
- Account deletion (Article 17)
- Minimal data collection
- Transparent privacy policy

### Security Standards

- OWASP Top 10 addressed
- CWE/SANS Top 25 considered
- Regular security audits

---

## Contact

**Security Team:** security@apertodns.com

**General Support:** support@apertodns.com

**Website:** https://apertodns.com

---

**Last Updated:** 2025-12-29

**Author:** Andrea Ferro <support@apertodns.com>
