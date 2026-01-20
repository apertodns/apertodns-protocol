# Changelog

All notable changes to the ApertoDNS Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2026-01-20 (IETF draft-02)

### Changed

- **Field Name Standardization** - Align with IETF draft-02 naming conventions
  - `/update` response: `previous_ipv4`, `previous_ipv6` (deprecated: `ipv4_previous`, `ipv6_previous`)
  - `/status` response: `updated_at` (deprecated: `last_updated`)
  - `/domains` response: `is_custom_domain` (deprecated: `is_custom`)

### Backward Compatibility

- Server returns BOTH old and new field names for 6 months (until 2025-07-01)
- Clients should migrate to new field names gradually
- Legacy field names will be removed in v1.4.0

### Documentation

- Added IETF Internet-Draft version -02: `draft-ferro-dnsop-apertodns-protocol-02`

---

## [1.3.0] - 2026-01-17

### Added

- **TXT Record Support** for ACME DNS-01 challenges (RFC 8555)
  - `POST /.well-known/apertodns/v1/txt` - Set TXT record
  - `DELETE /.well-known/apertodns/v1/txt` - Delete TXT record (selective or all)
  - `GET /.well-known/apertodns/v1/txt/{hostname}` - Get TXT records
  - Multi-value accumulation for wildcard certificate validation
  - Selective deletion by `value` parameter for proper cleanup

- **New Capabilities**
  - `txt_records` - Boolean indicating TXT record support
  - `txt_max_records` - Maximum TXT records per hostname (default: 5)

- **New Error Codes**
  - `txt_not_supported` (400) - Provider does not support TXT records
  - `txt_limit_exceeded` (400) - Maximum TXT records per hostname exceeded
  - `txt_invalid_name` (400) - Invalid TXT record hostname format
  - `txt_value_too_long` (400) - TXT value exceeds 255 characters

### Security

- TXT record value length limit (255 characters) to prevent DNS tunneling abuse
- Rate limiting on TXT endpoints to prevent abuse

---

## [1.2.3] - 2026-01-15

### Added

- New error code `ipv4_auto_failed` for clearer dual-stack error handling
- Documentation for auto-detection limitations in dual-stack scenarios

### Clarified

- Auto-detection only works for the IP family matching the client connection
- Recommendations for dual-stack updates using explicit addresses

---

## [1.2.2] - 2026-01-02

### Changed

- **Moved to Provider Extensions**: API Keys, Token Management, and Webhook Management
  endpoints have been moved out of the protocol standard namespace. These features are
  now documented as provider-specific extensions under `/api/*` namespace.
  - The protocol standard defines only 7 endpoints under `/.well-known/apertodns/v1/`
  - Management APIs (webhooks, tokens, api-keys) are provider-specific implementations
  - Webhook **delivery format** remains standardized in the protocol

### Clarified

- Added Section 14 "Provider Extensions" to document non-standard functionality
- Clarified that GDPR endpoints are provider-specific (already correctly documented)
- Updated /info response to show only standard endpoints

---

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
  > **Note (v1.2.2)**: Moved to provider extensions. Use `/api/api-keys` instead.
  - ~~`GET /.well-known/apertodns/v1/api-keys`~~ → `/api/api-keys`
  - ~~`POST /.well-known/apertodns/v1/api-keys`~~ → `/api/api-keys`
  - ~~`DELETE /.well-known/apertodns/v1/api-keys/{id}`~~ → `/api/api-keys/{id}`
  - Granular scopes: domains, tokens, records, webhooks, dns, profile, custom-domains, credentials

- **Token Management** - Legacy domain-bound tokens
  > **Note (v1.2.2)**: Moved to provider extensions. Use `/api/tokens` instead.
  - ~~`GET /.well-known/apertodns/v1/tokens`~~ → `/api/tokens`
  - ~~`POST /.well-known/apertodns/v1/tokens`~~ → `/api/tokens`
  - ~~`POST /.well-known/apertodns/v1/tokens/{id}/regenerate`~~ → `/api/tokens/{id}/regenerate`
  - ~~`DELETE /.well-known/apertodns/v1/tokens/{id}`~~ → `/api/tokens/{id}`

- **Webhook Management** - Full CRUD operations
  > **Note (v1.2.2)**: Moved to provider extensions. Use `/api/webhooks` instead.
  > Webhook **delivery format** (payload, signatures) remains part of the protocol standard.
  - ~~`GET /.well-known/apertodns/v1/webhooks`~~ → `/api/webhooks`
  - ~~`POST /.well-known/apertodns/v1/webhooks`~~ → `/api/webhooks`
  - ~~`PATCH /.well-known/apertodns/v1/webhooks/{id}`~~ → `/api/webhooks/{id}`
  - ~~`DELETE /.well-known/apertodns/v1/webhooks/{id}`~~ → `/api/webhooks/{id}`

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

#### Standard Protocol Endpoints

- `GET /.well-known/apertodns/v1/info` - Discovery endpoint
- `GET /.well-known/apertodns/v1/health` - Health check (added v1.2.1)
- `POST /.well-known/apertodns/v1/update` - Single hostname update
- `POST /.well-known/apertodns/v1/bulk-update` - Bulk hostname update
- `GET /.well-known/apertodns/v1/status/{hostname}` - Hostname status
- `GET /.well-known/apertodns/v1/domains` - List user domains (added v1.2.1)
- `GET /nic/update` - Legacy DynDNS2 compatibility

#### Provider Extensions (moved v1.2.2)

> **Note**: The following endpoints were originally documented as protocol endpoints
> but have been moved to provider extensions as of v1.2.2.

- ~~`POST/GET/DELETE /.well-known/apertodns/v1/webhooks`~~ → `/api/webhooks`
- ~~`POST/GET/DELETE /.well-known/apertodns/v1/tokens`~~ → `/api/tokens`

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
