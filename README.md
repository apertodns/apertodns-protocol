# ApertoDNS Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Protocol Version](https://img.shields.io/badge/Protocol-v1.2-green.svg)](./APERTODNS-PROTOCOL-v1.0.md)

Open standard for Dynamic DNS services.

## Overview

The ApertoDNS Protocol is an open standard that provides:

- **Modern JSON API** with structured responses and error handling
- **Full DynDNS2 compatibility** for legacy clients (routers, ddclient, etc.)
- **Native IPv6 support** alongside IPv4
- **Webhook notifications** for IP change events
- **Health check** and **domain listing** endpoints
- **GDPR compliance** (provider-specific, not part of protocol)
- **Security first** design with TLS 1.2+ requirement

## Documentation

- [Protocol Specification v1.2](./APERTODNS-PROTOCOL-v1.0.md) - Complete protocol specification
- [OpenAPI Specification](./openapi.yaml) - OpenAPI 3.0.3 schema ([View in Swagger Editor](https://editor.swagger.io/?url=https://raw.githubusercontent.com/apertodns/apertodns-protocol/main/openapi.yaml))
- [Security Policy](./SECURITY.md) - Security requirements and vulnerability reporting
- [Changelog](./CHANGELOG.md) - Version history
- [Adopters](./ADOPTERS.md) - Providers implementing this protocol

## Quick Start

### For Client Developers

Use the official TypeScript client:

```bash
npm install apertodns-client
```

```typescript
import { ApertoDNSClient } from 'apertodns-client';

const client = new ApertoDNSClient({
  token: 'apertodns_live_xxxxxxxxxxxxxxxxxxxxxxxxxx'
});

const result = await client.update({
  hostname: 'home.example.com',
  ipv4: 'auto'
});
```

### For Provider Implementers

1. Read the [Protocol Specification](./APERTODNS-PROTOCOL-v1.0.md)
2. Implement the required endpoints (Layers 0, 1, 2)
3. Run the [conformance tests](./tests/)
4. Submit a PR to be listed in [ADOPTERS.md](./ADOPTERS.md)

## Protocol Layers

| Layer | Name | Required | Description |
|-------|------|----------|-------------|
| 0 | Transport Security | Yes | HTTPS, TLS 1.2+, HSTS |
| 1 | Legacy Compatibility | Yes | DynDNS2 `/nic/update` endpoint |
| 2 | Modern API | Yes | REST endpoints under `/.well-known/apertodns/v1/` |
| 3 | Extended Features | No | Webhooks, bulk operations, token management |

## Conformance Testing

Run the included test suite to verify your implementation:

```bash
cd tests
npm install
export APERTODNS_TEST_URL="https://api.your-provider.com"
export APERTODNS_TEST_TOKEN="your_api_key"
npm test
```

See [tests/README.md](./tests/README.md) for full documentation.

## Reference Implementation

- **Provider:** [ApertoDNS](https://apertodns.com)
- **Client:** [apertodns-client](https://github.com/apertodns/apertodns-client) (npm)

## Contributing

Contributions are welcome! Please read the protocol specification before proposing changes.

## Note on Terminology

This protocol maintains compatibility with the DynDNS2 protocol (`/nic/update`), which is a de facto industry standard used by routers, NAS devices, and DDNS clients worldwide. DynDNS® is a registered trademark of Oracle Corporation. ApertoDNS is not affiliated with Oracle or Dyn.

## License

MIT License - Copyright (c) 2025 Andrea Ferro

## Links

- [ApertoDNS Website](https://apertodns.com)
- [API Documentation](https://apertodns.com/docs)
- [TypeScript Client](https://github.com/apertodns/apertodns-client)
