# ApertoDNS Protocol Conformance Tests

> **Note:** "ApertoDNS Protocol" is the name of the open standard (like "HTTP" or "OAuth"). The `APERTODNS_*` environment variables refer to the protocol, not a specific provider. Any DDNS provider implementing this protocol can use these conformance tests.

These tests validate that an API implementation conforms to the [ApertoDNS Protocol IETF Draft](https://datatracker.ietf.org/doc/draft-ferro-dnsop-apertodns-protocol/).

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

```bash
cd tests
npm install
```

## Configuration

Set environment variables before running:

```bash
# URL of the API to test (default: https://api.apertodns.com)
export APERTODNS_TEST_URL="https://api.your-provider.com"

# Token for authenticated tests (optional)
export APERTODNS_TEST_TOKEN="your_api_key"

# Hostname owned by the token for TXT tests (default: test.example.com)
export APERTODNS_TEST_HOSTNAME="your-test-domain.example.com"
```

**Note:** Token format is **provider-specific** and not part of the protocol. Format: `{provider}_{environment}_{random}`. Examples:
- ApertoDNS: `apertodns_live_xxx` / `apertodns_test_xxx`
- deSEC: `desec_live_xxx`
- DuckDNS: `duckdns_test_xxx`

The protocol only requires tokens be passed via `Authorization: Bearer {token}` or `X-API-Key: {token}`.

## Run Tests

```bash
npm test
```

## Test Files

| File | Description |
|------|-------------|
| `discovery.test.ts` | `GET /info` endpoint - IETF response format, security headers |
| `auth.test.ts` | Authentication: Bearer token, X-API-Key, Basic Auth (legacy) |
| `update.test.ts` | `POST /update`, `POST /bulk-update`, `GET /nic/update` (DynDNS2) |
| `txt.test.ts` | TXT record operations for ACME DNS-01 (v1.3.0) |

## Skipped Tests

Tests requiring authentication are **automatically skipped** if `APERTODNS_TEST_TOKEN` is not set.

To run all tests including authenticated ones:

```bash
APERTODNS_TEST_TOKEN=your_token npm test
```

Example output with no token:
```
✓ discovery.test.ts (15 tests)
✓ auth.test.ts (8 tests, 6 skipped)
✓ update.test.ts (4 tests, 15 skipped)
```

## Expected Response Format (IETF Draft Section 5.1)

All responses MUST use the IETF wrapper with boolean `success` field:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "unauthorized",
    "message": "Invalid or missing authentication token"
  }
}
```

**NOT** string status (non-compliant):

```json
{
  "status": "success"
}
```

## Running Against Different Providers

### ApertoDNS (reference implementation)
```bash
export APERTODNS_TEST_URL="https://api.apertodns.com"
export APERTODNS_TEST_TOKEN="apertodns_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
npm test
```

### Your Provider
```bash
export APERTODNS_TEST_URL="https://api.your-ddns-provider.com"
export APERTODNS_TEST_TOKEN="your_provider_token_format"
npm test
```

## License

MIT
