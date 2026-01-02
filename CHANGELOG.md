# Changelog

All notable changes to the ApertoDNS Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2025-12-29

### Added

- `GET /.well-known/apertodns/v1/health` - Health check endpoint
- `GET /.well-known/apertodns/v1/domains` - List user domains

### Fixed

- Layer numbering 0-3 in documentation
- Webhook signature documentation with timestamp

---

## [1.2.0] - 2025-12-29

### Added

- **API Keys Management** - Modern scope-based credentials
  - `GET /.well-known/apertodns/v1/api-keys` - List API keys
  - `POST /.well-known/apertodns/v1/api-keys` - Create API key
  - `DELETE /.well-known/apertodns/v1/api-keys/{id}` - Delete API key
  - Granular scopes: domains, tokens, records, webhooks, dns, profile, custom-domains, credentials

- **Token Management** - Legacy domain-bound tokens
  - `GET /.well-known/apertodns/v1/tokens` - List tokens
  - `POST /.well-known/apertodns/v1/tokens` - Create token
  - `POST /.well-known/apertodns/v1/tokens/{id}/regenerate` - Regenerate token
  - `DELETE /.well-known/apertodns/v1/tokens/{id}` - Delete token

- **Webhook Management** - Full CRUD operations
  - `GET /.well-known/apertodns/v1/webhooks` - List webhooks
  - `POST /.well-known/apertodns/v1/webhooks` - Create webhook
  - `PATCH /.well-known/apertodns/v1/webhooks/{id}` - Update webhook
  - `DELETE /.well-known/apertodns/v1/webhooks/{id}` - Delete webhook

- **New Error Codes**
  - `invalid_json` (400) - Invalid JSON in request body
  - `method_not_allowed` (405) - HTTP method not allowed on endpoint
  - `invalid_token` (401) - Invalid or expired token

### Security

- Token/key values shown only once at creation time
- GET endpoints never expose full credentials (only prefix)
- Ownership verification on all DELETE operations
- JSON error responses (no stack traces exposed)

---

## [1.1.0] - 2025-12-28

### Added

- **Custom Domains Support**
  - AWS Route53 integration
  - Cloudflare DNS integration
  - Automatic provider detection and routing

- **Bulk Update Endpoint**
  - `POST /.well-known/apertodns/v1/bulk-update`
  - Up to 100 hostnames per request
  - Partial success handling (HTTP 207)

---

## [1.0.0] - 2025-01-01

### Added

- Initial stable release of ApertoDNS Protocol v1.0
- Layer 0: Transport Security (TLS 1.2+ required, TLS 1.3 recommended)
- Layer 1: Legacy Compatibility (DynDNS2 protocol support via /nic/update)
- Layer 2: Modern API (REST endpoints under /.well-known/apertodns/v1/)
- Layer 3: Extended Features (webhooks, bulk operations, token management)

#### Endpoints

- `GET /.well-known/apertodns/v1/info` - Discovery endpoint
- `POST /.well-known/apertodns/v1/update` - Single hostname update
- `POST /.well-known/apertodns/v1/bulk-update` - Bulk hostname update
- `GET /.well-known/apertodns/v1/status/{hostname}` - Hostname status
- `POST/GET/DELETE /.well-known/apertodns/v1/webhooks` - Webhook management
- `POST/GET/DELETE /.well-known/apertodns/v1/tokens` - Token management
- `GET /nic/update` - Legacy DynDNS2 compatibility

#### Authentication

- Bearer Token authentication (preferred)
- API Key header authentication (alternative)
- Basic Auth for legacy endpoint only
- Token format: `{provider}_{environment}_{random}`
- Token permissions: update, read, webhooks, tokens, admin
- Token constraints: allowed hostnames, allowed IPs, expiration

#### Security

- TLS 1.2 minimum, TLS 1.3 recommended
- HSTS with preload
- Comprehensive security headers
- Rate limiting on all endpoints
- SSRF protection for webhooks
- HMAC-SHA256 webhook signatures with replay protection
- IP validation (private range rejection)

#### GDPR Compliance (Provider-Specific)

> **Note**: GDPR endpoints are provider-specific and NOT part of the ApertoDNS Protocol standard.
> Each provider SHOULD implement GDPR compliance through their own API endpoints,
> outside the `/.well-known/apertodns/v1/` namespace.

- Data export functionality (Article 20)
- Account deletion functionality (Article 17)
- Minimal data collection
- 30-day log retention

### Security

- Full OWASP Top 10 coverage
- Constant-time token comparison
- No sensitive data in logs
- Secure token generation (192-bit entropy)

---

## [Unreleased]

### Planned for v1.1

- OAuth2 integration
- DNS-over-HTTPS (DoH) support
- Multi-region failover
- Audit log API
- Team/organization support

---

## Migration Guide

### From DynDNS2

No changes required. The `/nic/update` endpoint is 100% compatible with existing DynDNS2 clients including:

- ddclient
- OpenWRT ddns-scripts
- Most router firmware
- Home Assistant

### To Modern API

1. Generate an API token in your account dashboard
2. Replace Basic Auth with Bearer token
3. Use `POST /.well-known/apertodns/v1/update` instead of `GET /nic/update`
4. Parse JSON responses instead of text

Example:

```bash
# Old (DynDNS2)
curl -u "user:token" "https://api.apertodns.com/nic/update?hostname=home.example.com&myip=auto"

# New (Modern API)
curl -X POST "https://api.apertodns.com/.well-known/apertodns/v1/update" \
  -H "Authorization: Bearer apertodns_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"hostname": "home.example.com", "ipv4": "auto"}'
```

---

[1.0.0]: https://github.com/apertodns/protocol/releases/tag/v1.0.0
[Unreleased]: https://github.com/apertodns/protocol/compare/v1.0.0...HEAD
