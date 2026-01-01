# Why ApertoDNS Protocol?

A technical comparison with DynDNS2 and modern alternatives.

---

## The Problem with DynDNS2

The DynDNS2 protocol, introduced in the late 1990s, became the de facto standard for Dynamic DNS updates. While it served its purpose well for over two decades, its design reflects the constraints and practices of a different era.

### DynDNS2 Protocol Overview

**Request Format:**

```
GET /nic/update?hostname=example.dyndns.org&myip=1.2.3.4 HTTP/1.0
Host: members.dyndns.org
Authorization: Basic base64(username:password)
User-Agent: Company - Device - Version
```

**Response Format:** Plain text, single line

```
good 1.2.3.4
nochg 1.2.3.4
nohost
badauth
abuse
911
```

Source: [Dyn Developer Documentation](https://help.dyn.com/remote-access-api/)

---

## Technical Limitations of DynDNS2

### 1. Plain Text Responses

DynDNS2 responses are plain text with no structure:

```
good 1.2.3.4
```

**Problems:**
- No metadata (timestamp, TTL, request ID)
- No machine-parseable format
- Ambiguous error information
- No support for extended attributes

**ApertoDNS Solution:**

```json
{
  "success": true,
  "data": {
    "hostname": "example.apertodns.com",
    "ipv4": "1.2.3.4",
    "ipv4_previous": "1.2.3.3",
    "ttl": 300,
    "changed": true,
    "updated_at": "2025-01-01T12:00:00.000Z"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 2. No Native IPv6 Support

DynDNS2 was designed before IPv6 adoption. The `myip` parameter expects IPv4 format.

**Source:** The original DynDNS2 specification only mentions IPv4. IPv6 support was added later as `myipv6` parameter by individual providers, not as part of the standard.

**ApertoDNS Solution:**

```json
{
  "hostname": "example.apertodns.com",
  "ipv4": "auto",
  "ipv6": "auto"
}
```

Both address families are first-class citizens in the protocol.

### 3. No Bulk Operations

DynDNS2 supports multiple hostnames via comma separation:

```
GET /nic/update?hostname=host1.example.com,host2.example.com&myip=1.2.3.4
```

**Problems:**
- All hostnames get the same IP
- No per-hostname configuration
- Single response for all updates
- No partial success handling

**ApertoDNS Solution:**

```json
{
  "updates": [
    { "hostname": "host1.example.com", "ipv4": "1.2.3.4", "ttl": 300 },
    { "hostname": "host2.example.com", "ipv4": "5.6.7.8", "ttl": 600 },
    { "hostname": "host3.example.com", "ipv6": "2001:db8::1" }
  ]
}
```

Response includes per-hostname status:

```json
{
  "success": true,
  "data": {
    "summary": { "total": 3, "successful": 2, "failed": 1 },
    "results": [
      { "hostname": "host1.example.com", "success": true, "changed": true },
      { "hostname": "host2.example.com", "success": true, "changed": false },
      { "hostname": "host3.example.com", "success": false, "error": {"code": "hostname_not_found"} }
    ]
  }
}
```

### 4. No Webhook Notifications

DynDNS2 is request-response only. Clients must poll to detect changes.

**ApertoDNS Solution:**

Webhook support with HMAC-SHA256 signed payloads:

```json
{
  "event": "ip_changed",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "data": {
    "hostname": "example.apertodns.com",
    "ipv4_previous": "1.2.3.3",
    "ipv4_current": "1.2.3.4"
  }
}
```

### 5. Basic Authentication Only

DynDNS2 uses HTTP Basic Authentication:

```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

**Problems:**
- Password sent with every request (base64 encoded, not encrypted)
- No token scoping
- No token expiration
- No token revocation without password change

**ApertoDNS Solution:**

Bearer tokens with granular scopes:

```http
Authorization: Bearer apertodns_live_7Hqj3kL9mNpR2sT5vWxY8zA1bC4dE6fG
```

- Scoped permissions (dns:update, domains:read, etc.)
- Token expiration
- Individual token revocation
- Token usage tracking

### 6. No Service Discovery

DynDNS2 has no standard way to discover provider capabilities.

**ApertoDNS Solution:**

Discovery endpoint at `/.well-known/apertodns/v1/info`:

```json
{
  "protocol": "apertodns",
  "protocol_version": "1.2.0",
  "capabilities": {
    "ipv4": true,
    "ipv6": true,
    "webhooks": true,
    "bulk_update": true,
    "max_bulk_size": 100
  },
  "rate_limits": {
    "update": { "requests": 60, "window_seconds": 60 }
  }
}
```

---

## Feature Comparison

| Feature | DynDNS2 | ApertoDNS Protocol |
|---------|---------|-------------------|
| Response Format | Plain text | JSON |
| IPv6 Support | Extension | Native |
| Bulk Updates | Same IP only | Per-host config |
| Webhooks | No | Yes |
| Authentication | Basic Auth | Bearer tokens + scopes |
| Service Discovery | No | Yes |
| Rate Limit Headers | No | Yes |
| Error Details | Single word | Structured JSON |
| TTL Control | Provider-specific | Standard parameter |
| Token Revocation | No | Yes |
| Audit Trail | No | Yes |

---

## Backward Compatibility

ApertoDNS Protocol maintains full DynDNS2 compatibility:

```
GET /nic/update?hostname=example.apertodns.com&myip=1.2.3.4
Authorization: Basic dXNlcm5hbWU6dG9rZW4=
```

Response:

```
good 1.2.3.4
```

Existing DynDNS2 clients (ddclient, routers, etc.) work without modification.

---

## Security Improvements

### Token Format

DynDNS2: No standard token format. Passwords are often simple strings.

ApertoDNS: Provider-agnostic token format with built-in metadata:

```
{provider}_{environment}_{random}

Examples:
- apertodns_live_7Hqj3kL9mNpR2sT5vWxY8zA1bC4dE6fG (ApertoDNS)
- desec_live_xK9mNpR2sT5vWxY8zA1bC4dE6fG7Hqj3 (deSEC)
- duckdns_test_zA1bC4dE6fG7Hqj3kL9mNpR2sT5vWxY8 (DuckDNS)
```

### Webhook Security

HMAC-SHA256 signatures with timestamp binding:

```javascript
const signedPayload = `${timestamp}.${payload}`;
const signature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(signedPayload)
  .digest('hex');
```

5-minute replay protection window.

---

## Adoption

The ApertoDNS Protocol is designed for adoption by any DDNS provider:

1. Implement the required endpoints
2. Use your own provider prefix for tokens
3. Register at https://apertodns.com/protocol/adopters
4. Display the "ApertoDNS Protocol Compatible" badge

---

## References

1. Dyn Remote Access API - https://help.dyn.com/remote-access-api/
2. RFC 2617 - HTTP Authentication: Basic and Digest Access Authentication
3. RFC 8446 - The Transport Layer Security (TLS) Protocol Version 1.3
4. RFC 6749 - The OAuth 2.0 Authorization Framework

---

**Author:** Andrea Ferro <support@apertodns.com>

**Last Updated:** 2026-01-01

**License:** MIT
