# ApertoDNS Protocol Specification v1.2

**Version:** 1.2.0
**Status:** Stable
**Author:** Andrea Ferro <support@apertodns.com>
**Last Updated:** 2025-12-29
**License:** MIT

---

## Abstract

The ApertoDNS Protocol is an open standard for Dynamic DNS (DDNS) services that provides a modern, secure, and extensible API while maintaining full backward compatibility with the legacy DynDNS2 protocol. This specification defines the complete protocol including authentication, endpoints, error handling, and security requirements.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [Protocol Architecture](#3-protocol-architecture)
4. [Transport Security](#4-transport-security)
5. [Authentication](#5-authentication)
6. [Endpoints](#6-endpoints)
7. [Error Handling](#7-error-handling)
8. [Rate Limiting](#8-rate-limiting)
9. [IP Validation](#9-ip-validation)
10. [Webhooks](#10-webhooks)
11. [GDPR Compliance](#11-gdpr-compliance)
12. [Security Considerations](#12-security-considerations)
13. [Implementation Notes](#13-implementation-notes)
14. [References](#14-references)

---

## Quick Start

### 1. Get your API Key

1. Login su [apertodns.com](https://apertodns.com)
2. Vai su **Dashboard** → **API Keys**
3. Clicca **"Crea nuova API Key"**
4. Scegli nome e scopes (es. `dns:update`, `domains:read`)
5. **IMPORTANTE:** Copia e salva la key immediatamente - non sarà più visibile!

La key ha formato: `apertodns_live_XXXXXXXXXXXXXXXX`

### 2. Update your IP

```bash
curl -X POST https://api.apertodns.com/.well-known/apertodns/v1/update \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"hostname":"myhost.apertodns.com","ipv4":"auto"}'
```

**Response (success):**

```json
{
  "status": "success",
  "data": {
    "hostname": "myhost.apertodns.com",
    "ipv4": "203.0.113.50",
    "changed": true
  }
}
```

### 3. Check status

```bash
curl https://api.apertodns.com/.well-known/apertodns/v1/status/myhost.apertodns.com \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY"
```

### 4. Legacy DynDNS2 (for routers)

```bash
curl -u "username:YOUR_TOKEN" \
  "https://api.apertodns.com/nic/update?hostname=myhost.apertodns.com&myip=auto"
```

---

## 1. Introduction

### 1.1 Purpose

This document specifies the ApertoDNS Protocol, designed to:

- Provide a modern JSON-based API for dynamic DNS management
- Maintain 100% backward compatibility with DynDNS2 protocol
- Support IPv4 and IPv6 natively
- Enable secure webhook notifications
- Comply with GDPR requirements
- Allow adoption by other DDNS providers

### 1.2 Design Principles

1. **Backward Compatibility**: Legacy clients MUST continue to work
2. **Security First**: All connections MUST use TLS 1.2+
3. **Simplicity**: Common operations should require minimal configuration
4. **Extensibility**: Protocol can be extended without breaking changes
5. **Privacy by Design**: Collect only necessary data

### 1.3 Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

---

## 2. Terminology

| Term | Definition |
|------|------------|
| **Hostname** | A fully qualified domain name (FQDN) registered with the provider |
| **Provider** | A service implementing this protocol |
| **Client** | Software making requests to the provider |
| **Token** | An authentication credential for API access |
| **TTL** | Time To Live - DNS record cache duration in seconds |

---

## 3. Protocol Architecture

### 3.1 Layer Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    ApertoDNS Protocol v1.0                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   LAYER 0: Transport Security (REQUIRED)                        │
│   ├── HTTPS mandatory (TLS 1.2+, recommended 1.3)              │
│   ├── Certificate validation                                    │
│   ├── HSTS with preload                                         │
│   └── No mixed content                                          │
│                                                                 │
│   LAYER 1: Legacy Compatibility (REQUIRED)                      │
│   ├── GET /nic/update (DynDNS2-compatible)                     │
│   ├── Basic Auth support                                        │
│   ├── Text responses ("good", "nochg", etc.)                   │
│   └── Query string parameters                                   │
│                                                                 │
│   LAYER 2: Modern API (REQUIRED)                                │
│   ├── REST endpoints under /.well-known/apertodns/v1/          │
│   ├── Bearer Token authentication                               │
│   ├── JSON request/response                                     │
│   ├── Structured errors with codes                              │
│   └── Rate limiting headers                                     │
│                                                                 │
│   LAYER 3: Extended Features (OPTIONAL)                         │
│   ├── Webhooks for notifications                                │
│   ├── Bulk operations                                           │
│   ├── Token management API                                      │
│   └── Audit logging                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Base URL

```
https://api.{provider-domain}
```

Example: `https://api.apertodns.com`

### 3.3 URL Structure

```
MODERN ENDPOINTS:
/.well-known/apertodns/v1/
├── info                           # Discovery (public, no auth)
├── update                         # Single host update (POST)
├── bulk-update                    # Multiple hosts (POST)
├── status/{hostname}              # Check status (GET)
│
├── api-keys                       # API Keys management (v1.2)
│   ├── GET                        # List API keys
│   ├── POST                       # Create API key
│   └── DELETE /{id}               # Delete API key
│
├── tokens                         # Token management (v1.2)
│   ├── GET                        # List tokens
│   ├── POST                       # Create token
│   ├── POST /{id}/regenerate      # Regenerate token
│   └── DELETE /{id}               # Delete token
│
├── webhooks                       # Webhook management (v1.2)
│   ├── GET                        # List webhooks
│   ├── POST                       # Create webhook
│   ├── PATCH /{id}                # Update webhook
│   └── DELETE /{id}               # Delete webhook
│
└── account
    ├── export              # GDPR data export
    └── (DELETE)            # GDPR account deletion

LEGACY ENDPOINT:
/nic/update                 # DynDNS2 compatible (GET)
```

---

## 4. Transport Security

### 4.1 TLS Requirements

- **Minimum Version:** TLS 1.2
- **Recommended Version:** TLS 1.3
- **Certificate:** Valid, publicly trusted certificate
- **HSTS:** MUST be enabled with minimum 1 year max-age

### 4.2 Cipher Suites

**TLS 1.3 (Required support):**
- TLS_AES_256_GCM_SHA384
- TLS_CHACHA20_POLY1305_SHA256
- TLS_AES_128_GCM_SHA256

**TLS 1.2 (Required support):**
- ECDHE-RSA-AES256-GCM-SHA384
- ECDHE-RSA-AES128-GCM-SHA256
- ECDHE-RSA-CHACHA20-POLY1305

**Prohibited:**
- SSLv3, TLS 1.0, TLS 1.1
- RC4, 3DES, export ciphers
- NULL ciphers

### 4.3 Security Headers

All responses MUST include:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
Referrer-Policy: no-referrer
Cache-Control: no-store, no-cache, must-revalidate, private
```

---

## 5. Authentication

### 5.1 Token Format

```
Format: apt_{environment}_{random}

Components:
- apt: Fixed prefix (identifies ApertoDNS tokens)
- environment: "live" | "test"
- random: 32 characters, base64url encoded, cryptographically secure

Example: apertodns_live_7Hqj3kL9mNpR2sT5vWxY8zA1bC4dE6fG
```

### 5.2 Authentication Methods

| Method | Header | Use Case |
|--------|--------|----------|
| Bearer Token | `Authorization: Bearer apertodns_xxx` | Modern API (preferred) |
| API Key Header | `X-API-Key: apertodns_xxx` | Alternative for limited clients |
| Basic Auth | `Authorization: Basic base64(user:token)` | Legacy /nic/update ONLY |

### 5.3 Token Permissions

| Permission | Description |
|------------|-------------|
| `update` | Can update IP addresses |
| `read` | Can read hostname status |
| `webhooks` | Can manage webhooks |
| `tokens` | Can manage other tokens |
| `admin` | Full account access |

### 5.4 Token Constraints

Tokens MAY be constrained by:

- **Allowed Hostnames**: List of hostnames the token can manage
- **Allowed IPs**: CIDR ranges from which the token can be used
- **Expiration**: Automatic expiry date

---

## 6. Endpoints

### 6.1 Discovery Endpoint

```
GET /.well-known/apertodns/v1/info
```

**Authentication:** None (public)

**curl Example:**

```bash
curl https://api.apertodns.com/.well-known/apertodns/v1/info
```

**Response 200 OK:**

```json
{
  "protocol": "apertodns",
  "protocol_version": "1.0.0",
  "provider": {
    "name": "ApertoDNS",
    "website": "https://apertodns.com",
    "documentation": "https://apertodns.com/docs",
    "support_email": "support@apertodns.com",
    "privacy_policy": "https://apertodns.com/privacy",
    "terms_of_service": "https://apertodns.com/terms"
  },
  "endpoints": {
    "update": "/.well-known/apertodns/v1/update",
    "bulk_update": "/.well-known/apertodns/v1/bulk-update",
    "status": "/.well-known/apertodns/v1/status/{hostname}",
    "webhooks": "/.well-known/apertodns/v1/webhooks",
    "tokens": "/.well-known/apertodns/v1/tokens",
    "legacy_dyndns2": "/nic/update"
  },
  "capabilities": {
    "ipv4": true,
    "ipv6": true,
    "auto_ip_detection": true,
    "custom_ttl": true,
    "ttl_range": { "min": 60, "max": 86400, "default": 300 },
    "wildcards": true,
    "webhooks": true,
    "bulk_update": true,
    "max_bulk_size": 100,
    "max_hostnames_per_account": -1
  },
  "rate_limits": {
    "update": { "requests": 60, "window_seconds": 60 },
    "bulk_update": { "requests": 10, "window_seconds": 60 },
    "status": { "requests": 120, "window_seconds": 60 }
  },
  "authentication": {
    "methods": ["bearer_token", "api_key_header", "basic_auth_legacy"],
    "token_prefix": "apertodns_",
    "token_header": "Authorization: Bearer {token}",
    "api_key_header": "X-API-Key: {token}"
  },
  "server_time": "2025-01-01T12:00:00.000Z"
}
```

### 6.2 Update Endpoint (Modern)

```
POST /.well-known/apertodns/v1/update
```

**Request Headers:**

```http
POST /.well-known/apertodns/v1/update HTTP/1.1
Host: api.apertodns.com
Authorization: Bearer apertodns_live_xxxxxxxxxxxxxxxxxx
Content-Type: application/json
Accept: application/json
User-Agent: MyClient/1.0.0
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

**Request Body:**

```json
{
  "hostname": "myhost.apertodns.com",
  "ipv4": "auto",
  "ipv6": "auto",
  "ttl": 300
}
```

**Parameters:**

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `hostname` | string | Yes | - | Valid FQDN, max 253 chars | Hostname to update |
| `ipv4` | string/null | No | null | Valid public IP, "auto", or null | IPv4 address |
| `ipv6` | string/null | No | null | Valid public IP, "auto", or null | IPv6 address |
| `ttl` | integer | No | 300 | 60-86400 | Time To Live in seconds |

**Auto IP Detection:**

When `ipv4` or `ipv6` is set to `"auto"`:

1. Check `X-Real-IP` header
2. If not present, check `X-Forwarded-For` (first IP)
3. If not present, use connection remote address
4. Validate that IP is public (not private/reserved)
5. If private, return error `invalid_ip`

**Response 200 OK (IP changed):**

```json
{
  "status": "success",
  "data": {
    "hostname": "myhost.apertodns.com",
    "ipv4": "203.0.113.50",
    "ipv6": "2001:db8::1",
    "ipv4_previous": "203.0.113.49",
    "ipv6_previous": null,
    "ttl": 300,
    "changed": true,
    "propagation_estimate_seconds": 60,
    "updated_at": "2025-01-01T12:00:00.000Z"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "processing_time_ms": 45
  }
}
```

**Response 200 OK (no change):**

```json
{
  "status": "success",
  "data": {
    "hostname": "myhost.apertodns.com",
    "ipv4": "203.0.113.50",
    "ipv6": "2001:db8::1",
    "ipv4_previous": "203.0.113.50",
    "ipv6_previous": "2001:db8::1",
    "ttl": 300,
    "changed": false,
    "updated_at": "2024-12-28T15:25:00.000Z"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440001",
    "processing_time_ms": 12
  }
}
```

### 6.3 Legacy DynDNS2 Endpoint

```
GET /nic/update?hostname={hostname}&myip={ip}
```

**CRITICAL:** This endpoint MUST remain 100% compatible with DynDNS2.

**Request:**

```http
GET /nic/update?hostname=myhost.apertodns.com&myip=203.0.113.50 HTTP/1.1
Host: api.apertodns.com
Authorization: Basic dXNlcm5hbWU6dG9rZW4=
User-Agent: ddclient/3.9.1
```

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `hostname` | Yes | FQDN (comma-separated for multiple) |
| `myip` | No | IPv4 (default: client IP) |
| `myipv6` | No | IPv6 |
| `wildcard` | No | "ON" or "OFF" |
| `offline` | No | "YES" to mark offline |

**Authentication:**

```
Authorization: Basic base64(username:password)

Where:
- username = user email OR username
- password = API token (NOT account password)
```

**Response Format:** `text/plain; charset=utf-8`

**Response Codes:**

| Response | Meaning | When |
|----------|---------|------|
| `good {ip}` | Update successful | IP changed |
| `nochg {ip}` | No change | IP already same |
| `nohost` | Hostname not found | Does not exist or not owned |
| `badauth` | Auth failed | Invalid/expired token |
| `notfqdn` | Invalid hostname | Bad format |
| `abuse` | Rate limited | Too many requests |
| `dnserr` | DNS error | Propagation problem |
| `911` | Server error | Internal error |

**Note:** For DynDNS2 compatibility, ALL responses return HTTP 200. The error code is in the response body.

### 6.4 Bulk Update Endpoint

```
POST /.well-known/apertodns/v1/bulk-update
```

**Request:**

```json
{
  "updates": [
    { "hostname": "host1.apertodns.com", "ipv4": "auto", "ipv6": "auto" },
    { "hostname": "host2.apertodns.com", "ipv4": "203.0.113.100" },
    { "hostname": "host3.apertodns.com", "ipv4": "auto", "ttl": 600 }
  ],
  "defaults": {
    "ttl": 300,
    "ipv4": "auto"
  }
}
```

**Limits:**

- Maximum 100 hostnames per request
- Timeout: 30 seconds
- Rate limit: 10 requests/minute

**Response 200 (all successful):**

```json
{
  "status": "success",
  "data": {
    "summary": { "total": 3, "successful": 3, "failed": 0 },
    "results": [
      { "hostname": "host1.apertodns.com", "status": "success", "ipv4": "203.0.113.50", "changed": true },
      { "hostname": "host2.apertodns.com", "status": "success", "ipv4": "203.0.113.100", "changed": true },
      { "hostname": "host3.apertodns.com", "status": "success", "ipv4": "203.0.113.50", "changed": false }
    ]
  }
}
```

**Response 207 (partial success):**

```json
{
  "status": "partial_success",
  "data": {
    "summary": { "total": 3, "successful": 2, "failed": 1 },
    "results": [
      { "hostname": "host1.apertodns.com", "status": "success", "ipv4": "203.0.113.50", "changed": true },
      { "hostname": "invalid.example.com", "status": "error", "error": { "code": "hostname_not_found", "message": "Hostname not found" } },
      { "hostname": "host3.apertodns.com", "status": "success", "ipv4": "203.0.113.50", "changed": false }
    ]
  }
}
```

### 6.5 Status Endpoint

```
GET /.well-known/apertodns/v1/status/{hostname}
```

**Response 200 OK:**

```json
{
  "status": "success",
  "data": {
    "hostname": "myhost.apertodns.com",
    "ipv4": "203.0.113.50",
    "ipv6": "2001:db8::1",
    "ttl": 300,
    "is_active": true,
    "last_update": "2025-01-01T12:00:00.000Z",
    "update_count_24h": 5,
    "update_count_total": 1250,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

### 6.6 API Keys Management (v1.2)

API Keys are modern, scope-based credentials with granular permissions.

#### List API Keys

```
GET /.well-known/apertodns/v1/api-keys
```

**curl Example:**

```bash
curl https://api.apertodns.com/.well-known/apertodns/v1/api-keys \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY"
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "My Script",
      "keyPrefix": "apertodns_live_wP0V...",
      "scopes": ["domains:read", "dns:update"],
      "rateLimit": 1000,
      "expiresAt": null,
      "active": true,
      "createdAt": "2025-12-29T12:00:00.000Z",
      "lastUsedAt": "2025-12-29T14:30:00.000Z"
    }
  ]
}
```

**Security:** Full key is NEVER returned in list responses. Only `keyPrefix` (first 20 characters) is shown.

#### Create API Key

```
POST /.well-known/apertodns/v1/api-keys
```

**curl Example:**

```bash
curl -X POST https://api.apertodns.com/.well-known/apertodns/v1/api-keys \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Script","scopes":["domains:read","dns:update"],"expiresIn":"30d"}'
```

**Request:**

```json
{
  "name": "My Script",
  "scopes": ["domains:read", "dns:update"],
  "expiresIn": "30d"
}
```

**Available Scopes:**

| Scope | Description |
|-------|-------------|
| `domains:read` | Read domain information |
| `domains:write` | Create/update domains |
| `domains:delete` | Delete domains |
| `tokens:read` | List tokens |
| `tokens:write` | Create tokens |
| `tokens:delete` | Delete tokens |
| `records:read` | Read DNS records |
| `records:write` | Update DNS records |
| `webhooks:read` | List webhooks |
| `webhooks:write` | Create/update webhooks |
| `dns:update` | Update IP addresses |
| `profile:read` | Read user profile |
| `custom-domains:read` | Read custom domains |
| `custom-domains:write` | Manage custom domains |
| `custom-domains:delete` | Delete custom domains |
| `credentials:read` | Read provider credentials |
| `credentials:write` | Manage provider credentials |
| `credentials:delete` | Delete provider credentials |

**Response 201 Created:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "My Script",
    "key": "apertodns_live_wP0VqR8nK3mXyZ1234567890",
    "keyPrefix": "apertodns_live_wP0Vq",
    "scopes": ["domains:read", "dns:update"],
    "rateLimit": 1000,
    "expiresAt": "2026-01-28T12:00:00.000Z",
    "createdAt": "2025-12-29T12:00:00.000Z"
  },
  "warning": "Save this key now. It will not be shown again."
}
```

**Critical:** The complete `key` is shown ONLY in this response. Save it immediately.

#### Delete API Key

```
DELETE /.well-known/apertodns/v1/api-keys/{id}
```

**curl Example:**

```bash
curl -X DELETE https://api.apertodns.com/.well-known/apertodns/v1/api-keys/123 \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY"
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "deleted": true
  }
}
```

---

### 6.7 Token Management (v1.2)

Tokens are legacy, domain-bound credentials for DynDNS compatibility.

#### List Tokens

```
GET /.well-known/apertodns/v1/tokens
```

**curl Example:**

```bash
curl https://api.apertodns.com/.well-known/apertodns/v1/tokens \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY"
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": [
    {
      "id": 31,
      "label": "Home Router",
      "domainId": 48,
      "domainName": "myhost.apertodns.com",
      "expiresAt": null,
      "revoked": false,
      "active": true,
      "createdAt": "2025-12-28T20:16:37.503Z"
    }
  ]
}
```

**Security:** Token hash is NEVER returned. Tokens are domain-bound.

#### Create Token

```
POST /.well-known/apertodns/v1/tokens
```

**curl Example:**

```bash
curl -X POST https://api.apertodns.com/.well-known/apertodns/v1/tokens \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"domainId":48,"label":"Home Router","expiresIn":"365d"}'
```

**Request:**

```json
{
  "domainId": 48,
  "label": "Home Router",
  "expiresIn": "365d"
}
```

**Response 201 Created:**

```json
{
  "success": true,
  "data": {
    "id": 32,
    "token": "7c4d3f55c63e04d4d3681bb2f89bdc826e95954cc0c3cf2820ba5de95f4e157d",
    "label": "Home Router",
    "domainId": 48,
    "domainName": "myhost.apertodns.com",
    "expiresAt": null,
    "createdAt": "2025-12-29T12:00:00.000Z"
  },
  "warning": "Save this token now. It will not be shown again."
}
```

#### Regenerate Token

```
POST /.well-known/apertodns/v1/tokens/{id}/regenerate
```

Generates a new token value, invalidating the previous one.

**curl Example:**

```bash
curl -X POST https://api.apertodns.com/.well-known/apertodns/v1/tokens/32/regenerate \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY"
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": {
    "id": 32,
    "token": "444a9bbc2022cc7582bc1cd910c6e7304789f3b2232aff754f2be4ac2b10c4a8",
    "domainName": "myhost.apertodns.com"
  },
  "warning": "Save this token now. The old token is now invalid."
}
```

#### Delete Token

```
DELETE /.well-known/apertodns/v1/tokens/{id}
```

**curl Example:**

```bash
curl -X DELETE https://api.apertodns.com/.well-known/apertodns/v1/tokens/32 \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY"
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": {
    "id": 32,
    "deleted": true
  }
}
```

---

### 6.8 Webhook Management (v1.2)

#### List Webhooks

```
GET /.well-known/apertodns/v1/webhooks
```

**curl Example:**

```bash
curl https://api.apertodns.com/.well-known/apertodns/v1/webhooks \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY"
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": [
    {
      "id": 22,
      "url": "https://example.com/webhook",
      "events": ["ip_change", "domain_create"],
      "domainId": null,
      "domainName": null,
      "active": true,
      "lastCalled": "2025-12-29T10:00:00.000Z",
      "lastStatus": 200,
      "failCount": 0,
      "createdAt": "2025-12-28T17:42:11.816Z",
      "updatedAt": "2025-12-29T10:00:00.000Z"
    }
  ]
}
```

#### Create Webhook

```
POST /.well-known/apertodns/v1/webhooks
```

**curl Example:**

```bash
curl -X POST https://api.apertodns.com/.well-known/apertodns/v1/webhooks \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/webhook","events":["ip_change"],"secret":"my-32-char-minimum-secret-here!!"}'
```

**Request:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["ip_change", "domain_create"],
  "secret": "my-hmac-secret-minimum-32-chars",
  "domainId": null
}
```

**Available Events:**

| Event | Description |
|-------|-------------|
| `ip_change` | IP address was updated |
| `domain_create` | New domain created |
| `domain_delete` | Domain was deleted |
| `update_failed` | Update operation failed |

**Response 201 Created:**

```json
{
  "success": true,
  "data": {
    "id": 23,
    "url": "https://example.com/webhook",
    "events": ["ip_change", "domain_create"],
    "domainId": null,
    "domainName": null,
    "active": true,
    "createdAt": "2025-12-29T14:45:08.995Z"
  }
}
```

**Security:** The `secret` is never returned in responses.

#### Update Webhook

```
PATCH /.well-known/apertodns/v1/webhooks/{id}
```

**curl Example:**

```bash
curl -X PATCH https://api.apertodns.com/.well-known/apertodns/v1/webhooks/23 \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active":false}'
```

**Request:**

```json
{
  "active": false,
  "events": ["ip_change"]
}
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": {
    "id": 23,
    "url": "https://example.com/webhook",
    "events": ["ip_change"],
    "domainId": null,
    "domainName": null,
    "active": false,
    "updatedAt": "2025-12-29T14:50:00.000Z"
  }
}
```

#### Delete Webhook

```
DELETE /.well-known/apertodns/v1/webhooks/{id}
```

**curl Example:**

```bash
curl -X DELETE https://api.apertodns.com/.well-known/apertodns/v1/webhooks/23 \
  -H "Authorization: Bearer apertodns_live_YOUR_KEY"
```

**Response 200 OK:**

```json
{
  "success": true,
  "data": {
    "id": 23,
    "deleted": true
  }
}
```

---

## 7. Error Handling

### 7.1 Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "error_code",
    "message": "Human-readable message in English",
    "details": {
      "field": "value",
      "additional": "context"
    },
    "documentation_url": "https://apertodns.com/docs/errors#error_code",
    "support_id": "sup_xxxxxxxx"
  },
  "meta": {
    "request_id": "req_xxxxxxxx",
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

### 7.2 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `unauthorized` | 401 | Token missing or invalid |
| `token_expired` | 401 | Token has expired |
| `token_revoked` | 401 | Token was revoked |
| `invalid_token` | 401 | Invalid or expired token |
| `forbidden` | 403 | Insufficient permissions |
| `hostname_forbidden` | 403 | Token not authorized for hostname |
| `ip_forbidden` | 403 | IP not in allowlist |
| `invalid_request` | 400 | Malformed request |
| `invalid_json` | 400 | Invalid JSON in request body |
| `validation_error` | 400 | Validation failed |
| `invalid_hostname` | 400 | Invalid hostname format |
| `invalid_ip` | 400 | Invalid or private IP |
| `invalid_ttl` | 400 | TTL out of range |
| `not_found` | 404 | Resource not found |
| `hostname_not_found` | 404 | Hostname does not exist |
| `token_not_found` | 404 | Token does not exist |
| `webhook_not_found` | 404 | Webhook does not exist |
| `method_not_allowed` | 405 | HTTP method not allowed on endpoint |
| `hostname_exists` | 409 | Hostname already registered |
| `rate_limited` | 429 | Too many requests |
| `payload_too_large` | 413 | Request body exceeds limit |
| `bulk_limit_exceeded` | 400 | Too many hostnames in bulk |
| `server_error` | 500 | Internal server error |
| `dns_error` | 502 | DNS backend error |
| `maintenance` | 503 | Service maintenance |
| `timeout` | 504 | Request timeout |

### 7.3 Validation Error Details

```json
{
  "status": "error",
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": {
      "fields": [
        {
          "field": "hostname",
          "code": "invalid_format",
          "message": "Hostname must be a valid FQDN",
          "provided": "not a valid hostname!"
        },
        {
          "field": "ttl",
          "code": "out_of_range",
          "message": "TTL must be between 60 and 86400",
          "provided": 30,
          "constraints": { "min": 60, "max": 86400 }
        }
      ]
    }
  }
}
```

### 7.4 Common Errors Quick Reference

| Error | HTTP | Cause | Solution |
|-------|------|-------|----------|
| `unauthorized` | 401 | Token missing | Add header `Authorization: Bearer YOUR_KEY` |
| `invalid_token` | 401 | Token expired/invalid | Generate new API key from dashboard |
| `forbidden` | 403 | Insufficient permissions | Check token scopes match required operation |
| `hostname_not_found` | 404 | Hostname doesn't exist | Verify hostname in dashboard or create it first |
| `not_found` | 404 | Resource not found | Check resource ID exists and you own it |
| `invalid_ip` | 400 | Private IP (192.168.x, 10.x) | Use public IP or `"ipv4":"auto"` |
| `invalid_hostname` | 400 | Bad hostname format | Use valid FQDN (e.g., `host.apertodns.com`) |
| `invalid_ttl` | 400 | TTL out of range | Use TTL between 60 and 86400 seconds |
| `invalid_json` | 400 | Malformed JSON body | Check JSON syntax, quotes, brackets |
| `rate_limited` | 429 | Too many requests | Wait 60 seconds (max 60 req/min for updates) |
| `bulk_limit_exceeded` | 400 | Too many hosts in bulk | Max 10 hostnames per bulk request |
| `method_not_allowed` | 405 | Wrong HTTP method | Check endpoint docs for correct method |
| `server_error` | 500 | Internal error | Retry later, contact support if persists |

---

## 8. Rate Limiting

### 8.1 Response Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1703775600
Retry-After: 45
```

### 8.2 Default Limits

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `POST /update` | 60/min | Per token |
| `POST /bulk-update` | 10/min | Per token |
| `GET /status` | 120/min | Per token |
| `GET /info` | 120/min | Per IP |
| `/nic/update` | 60/min | Per IP |
| Token/Webhook management | 30/min | Per token |

### 8.3 Rate Limited Response

HTTP 429 with body:

```json
{
  "status": "error",
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Retry after 45 seconds.",
    "retry_after_seconds": 45
  }
}
```

---

## 9. IP Validation

### 9.1 IPv4 Private Ranges (MUST Reject)

| Range | Description |
|-------|-------------|
| 0.0.0.0/8 | "This" network |
| 10.0.0.0/8 | Private-Use |
| 100.64.0.0/10 | Shared Address Space (CGNAT) |
| 127.0.0.0/8 | Loopback |
| 169.254.0.0/16 | Link-Local |
| 172.16.0.0/12 | Private-Use |
| 192.0.0.0/24 | IETF Protocol Assignments |
| 192.0.2.0/24 | Documentation (TEST-NET-1) |
| 192.168.0.0/16 | Private-Use |
| 198.18.0.0/15 | Benchmarking |
| 198.51.100.0/24 | Documentation (TEST-NET-2) |
| 203.0.113.0/24 | Documentation (TEST-NET-3) |
| 224.0.0.0/4 | Multicast |
| 240.0.0.0/4 | Reserved |
| 255.255.255.255/32 | Limited Broadcast |

### 9.2 IPv6 Private Ranges (MUST Reject)

| Range | Description |
|-------|-------------|
| ::/128 | Unspecified |
| ::1/128 | Loopback |
| ::ffff:0:0/96 | IPv4-mapped |
| 64:ff9b::/96 | IPv4/IPv6 Translation |
| 100::/64 | Discard-Only |
| 2001:db8::/32 | Documentation |
| fc00::/7 | Unique Local (ULA) |
| fe80::/10 | Link-Local |
| ff00::/8 | Multicast |

---

## 10. Webhooks

### 10.1 Create Webhook

```
POST /.well-known/apertodns/v1/webhooks
```

**Request:**

```json
{
  "name": "IP Change Notification",
  "hostname": "myhost.apertodns.com",
  "url": "https://my-server.com/webhook/ip-changed",
  "events": ["ip_changed"],
  "secret": "my-webhook-secret-minimum-32-characters-long",
  "enabled": true,
  "retry_policy": {
    "max_retries": 3,
    "retry_delay_seconds": 60
  }
}
```

### 10.2 Webhook Events

| Event | Description |
|-------|-------------|
| `ip_changed` | IP address was updated |
| `hostname_created` | New hostname created |
| `hostname_deleted` | Hostname was deleted |
| `update_failed` | Update failed (e.g., rate limit) |

### 10.3 Webhook Payload

```http
POST /webhook/ip-changed HTTP/1.1
Host: my-server.com
Content-Type: application/json
User-Agent: ApertoDNS-Webhook/1.0
X-ApertoDNS-Event: ip_changed
X-ApertoDNS-Delivery-ID: del_xxxxxxxxxxxxxxxx
X-ApertoDNS-Timestamp: 1703775000
X-ApertoDNS-Signature: sha256=xxxxxxxxxxxxxxxxxxxxxx
```

```json
{
  "event": "ip_changed",
  "event_id": "evt_xxxxxxxxxxxxxxxx",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "webhook_id": "wh_xxxxxxxxxxxxxxxx",
  "data": {
    "hostname": "myhost.apertodns.com",
    "ipv4_previous": "203.0.113.49",
    "ipv4_current": "203.0.113.50",
    "ipv6_previous": null,
    "ipv6_current": "2001:db8::1",
    "ttl": 300
  }
}
```

### 10.4 Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret, timestamp) {
  // Verify timestamp (max 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return false; // Replay attack protection
  }

  // Verify signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 10.5 Webhook Security Requirements

- Webhook URLs MUST use HTTPS
- Provider MUST validate that webhook URL does not resolve to private IP ranges (SSRF protection)
- Secret MUST be minimum 32 characters
- Signature MUST use HMAC-SHA256 with timestamp binding
- Delivery timeout: 10 seconds
- Maximum 3 retries with exponential backoff

---

## 11. GDPR Compliance

### 11.1 Data Export (Article 20)

```
POST /.well-known/apertodns/v1/account/export
```

**Response 202 Accepted:**

```json
{
  "status": "accepted",
  "data": {
    "export_id": "exp_xxxxxxxx",
    "status": "processing",
    "estimated_completion": "2024-12-28T16:00:00.000Z",
    "notification_email": "user@example.com"
  }
}
```

### 11.2 Account Deletion (Article 17)

```
DELETE /.well-known/apertodns/v1/account
```

**Request:**

```json
{
  "confirm": "DELETE_MY_ACCOUNT",
  "reason": "optional feedback"
}
```

**Response 200 OK:**

```json
{
  "status": "success",
  "data": {
    "deleted_at": "2025-01-01T12:00:00.000Z",
    "data_retention_end": "2025-01-01T12:00:00.000Z",
    "items_deleted": {
      "hostnames": 5,
      "tokens": 3,
      "webhooks": 2
    }
  }
}
```

---

## 12. Security Considerations

### 12.1 Token Security

- Tokens MUST be generated using cryptographically secure random number generator
- Tokens MUST NOT be logged in plaintext
- Token storage MUST use secure hashing (bcrypt or Argon2)
- Token transmission MUST only occur over TLS

### 12.2 Input Validation

**Hostname Validation:**
- Maximum 253 characters total
- Each label 1-63 characters
- Only alphanumeric and hyphens
- Must not start or end with hyphen
- Minimum 2 labels (e.g., host.domain)

**TTL Validation:**
- Must be integer
- Range: 60 to 86400 seconds

### 12.3 Logging Security

**MUST log:**
- Request ID
- Timestamp
- HTTP method and path
- Response status
- Token ID (not full token)
- Rate limit status

**MUST NOT log:**
- Full tokens
- Passwords
- Complete request bodies
- Plain IP addresses beyond 30 days

### 12.4 Webhook Security

- SSRF protection: Validate webhook URL does not resolve to private IPs
- Timeout: Maximum 10 seconds
- Signature: HMAC-SHA256 with timestamp
- Replay protection: 5-minute timestamp window

---

## 13. Implementation Notes

### 13.1 Hostname Validation Implementation

```javascript
function validateHostname(hostname) {
  if (hostname.length > 253) return false;

  const labels = hostname.split('.');
  if (labels.length < 2) return false;

  for (const label of labels) {
    if (label.length < 1 || label.length > 63) return false;
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label)) return false;
  }

  if (hostname.includes('..')) return false;

  return true;
}
```

### 13.2 Token Generation

```javascript
const crypto = require('crypto');

function generateToken(environment = 'live') {
  const random = crypto.randomBytes(24).toString('base64url');
  return `apt_${environment}_${random}`;
}
```

### 13.3 Legacy Response Mapping

```javascript
function legacyResponse(result) {
  const mapping = {
    'success_changed': (ip) => `good ${ip}`,
    'success_unchanged': (ip) => `nochg ${ip}`,
    'error_not_found': () => 'nohost',
    'error_unauthorized': () => 'badauth',
    'error_invalid_hostname': () => 'notfqdn',
    'error_rate_limit': () => 'abuse',
    'error_dns': () => 'dnserr',
    'error_server': () => '911'
  };
  return mapping[result.type](result.ip);
}
```

---

## 14. References

- RFC 2119 - Key words for use in RFCs
- RFC 1035 - Domain Names - Implementation and Specification
- RFC 4033-4035 - DNS Security Extensions (DNSSEC)
- RFC 6749 - OAuth 2.0 Authorization Framework
- RFC 8446 - TLS 1.3
- DynDNS2 Protocol Specification

---

## Appendix A: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2025-12-29 | Added Management endpoints (API Keys, Tokens, Webhooks), new error codes |
| 1.1.0 | 2025-12-28 | Added Custom Domains support (Route53, Cloudflare), Bulk Update |
| 1.0.0 | 2025-01-01 | Initial stable release |

---

## Appendix B: Provider Adoption

Providers implementing this protocol should:

1. Pass the compliance test suite
2. Register at https://apertodns.com/protocol/adopters
3. Display the "ApertoDNS Protocol Compatible" badge

---

**Copyright (c) 2025 Andrea Ferro. Licensed under MIT License.**
