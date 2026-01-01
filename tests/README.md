# ApertoDNS Protocol Conformance Tests

These tests validate that an API implementation conforms to the [IETF Draft](https://datatracker.ietf.org/doc/draft-ferro-dnsop-apertodns-protocol/).

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
export APERTODNS_TEST_URL="https://api.your-provider.com"
export APERTODNS_TEST_TOKEN="your_api_key"
```

## Run Tests

```bash
npm test
```

## Test Coverage

| Test File | Coverage |
|-----------|----------|
| auth.test.ts | Authentication (Bearer, API Key, Basic Auth) |
| update.test.ts | POST /update, POST /bulk-update, response format |
| endpoints.test.ts | GET /info, GET /health, GET /status, GET /domains |

## Expected Response Format (IETF Draft Section 5.1)

All responses MUST use boolean `success` field:

```json
{
  "success": true,
  "data": { ... }
}
```

NOT string status:

```json
{
  "status": "success"  // WRONG - not compliant
}
```

## Running Against ApertoDNS

```bash
export APERTODNS_TEST_URL="https://api.apertodns.com"
export APERTODNS_TEST_TOKEN="apertodns_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
npm test
```

## License

MIT
