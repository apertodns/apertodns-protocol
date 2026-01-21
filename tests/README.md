# ApertoDNS Protocol Conformance Tests

> **Note:** "ApertoDNS Protocol" is the name of the open standard (like "HTTP" or "OAuth"). The `APERTODNS_*` environment variables refer to the protocol, not a specific provider. Any DDNS provider implementing this protocol can use these conformance tests.

These tests validate that an API implementation conforms to the [ApertoDNS Protocol IETF Draft](https://datatracker.ietf.org/doc/draft-ferro-dnsop-apertodns-protocol/).

## Quick Start for New Providers

```bash
# 1. Clone and setup
git clone https://github.com/apertodns/apertodns-protocol.git
cd apertodns-protocol/tests
npm install

# 2. Start the reference mock server
node mock-server.cjs &

# 3. Verify tests pass against mock (should be 46/46)
APERTODNS_TEST_URL="http://localhost:3333" \
APERTODNS_TEST_TOKEN="mock_live_testtoken123" \
npm test

# 4. Now test YOUR implementation
APERTODNS_TEST_URL="https://api.your-provider.com" \
APERTODNS_TEST_TOKEN="yourprovider_live_xxx" \
npm test
```

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

## Reference Mock Server

A complete in-memory reference implementation is included (`mock-server.cjs`). Use it to:

1. **Verify the test suite works** before testing your own server
2. **Study a working implementation** of every endpoint
3. **Debug differences** between expected and actual behavior

### Starting the Mock Server

```bash
# Start on default port 3333
node mock-server.cjs &

# Or specify a custom port
PORT=4000 node mock-server.cjs &
```

### Testing Against the Mock Server

```bash
# Run full test suite (should pass 46/46)
APERTODNS_TEST_URL="http://localhost:3333" \
APERTODNS_TEST_TOKEN="mock_live_testtoken123" \
npm test
```

### Mock Server Features

| Feature | Supported |
|---------|-----------|
| Protocol version | v1.3.2 |
| Bearer authentication | ✅ |
| X-API-Key authentication | ✅ |
| Basic Auth (legacy) | ✅ |
| IPv4/IPv6 updates | ✅ |
| Bulk updates | ✅ |
| TXT records (multi-value) | ✅ |
| Security headers | ✅ |
| Rate limit headers | ✅ |

### Stopping the Mock Server

```bash
pkill -f "node mock-server.cjs"
```

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

## Troubleshooting

### Tests fail on mock but your implementation seems correct

1. **Check the mock server is running:**
   ```bash
   curl -s http://localhost:3333/.well-known/apertodns/v1/health | jq
   ```

2. **Verify token format:**
   ```bash
   # Mock accepts tokens starting with "mock_"
   curl -s -H "Authorization: Bearer mock_live_test123" \
     http://localhost:3333/.well-known/apertodns/v1/status/test.example.com | jq
   ```

### Common failures and fixes

| Test Failure | Likely Cause | Fix |
|--------------|--------------|-----|
| Security headers missing | HSTS, X-Content-Type-Options not set | Add required security headers |
| Response format invalid | Using `"status": "success"` | Use `"success": true` (boolean) |
| Authentication fails | Wrong header format | Use `Authorization: Bearer {token}` |
| TXT tests fail | Hostname not owned by token | Set `APERTODNS_TEST_HOSTNAME` to a hostname your token controls |

### Comparing mock vs your implementation

```bash
# Test mock
APERTODNS_TEST_URL="http://localhost:3333" \
APERTODNS_TEST_TOKEN="mock_live_test123" \
npm test 2>&1 | tee mock-results.txt

# Test your server
APERTODNS_TEST_URL="https://your-api.com" \
APERTODNS_TEST_TOKEN="your_token" \
npm test 2>&1 | tee your-results.txt

# Compare
diff mock-results.txt your-results.txt
```

### Getting verbose output

```bash
npm test -- --reporter=verbose
```

## License

MIT
