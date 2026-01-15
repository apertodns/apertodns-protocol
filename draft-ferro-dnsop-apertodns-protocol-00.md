---
title: "ApertoDNS Protocol: A Modern Dynamic DNS Update Protocol"
abbrev: "ApertoDNS Protocol"
docname: draft-ferro-dnsop-apertodns-protocol-00
category: std
ipr: trust200902
submissiontype: IETF
area: Operations and Management
workgroup: DNS Operations
keyword:
  - dynamic dns
  - ddns
  - dns update
  - REST API

stand_alone: yes
pi:
  toc: yes
  sortrefs: yes
  symrefs: yes
  compact: yes

author:
  -
    ins: A. Ferro
    name: Andrea Ferro
    organization: ApertoDNS
    email: support@apertodns.com
    country: Italy

normative:
  RFC2119:
  RFC8174:
  RFC9110:
  RFC6750:
  RFC8615:
  RFC8259:
  RFC5891:

informative:
  RFC2136:
  RFC6973:

--- abstract

This document specifies the ApertoDNS Protocol, a modern RESTful
protocol for dynamic DNS (DDNS) updates. It provides a secure,
provider-agnostic alternative to legacy protocols, with native
support for IPv4, IPv6, bulk updates, automatic IP detection, and
standardized authentication mechanisms.

The protocol uses well-known URIs (RFC 8615), JSON payloads
(RFC 8259), and bearer token authentication (RFC 6750) to enable
interoperable dynamic DNS services across different providers.

--- middle

# Note to Readers

Discussion of this document takes place on the DNS Operations
Working Group mailing list (dnsop@ietf.org).

Source for this draft and an issue tracker can be found at
https://github.com/apertodns/apertodns-protocol.

# Introduction

Dynamic DNS (DDNS) services allow users with dynamically assigned
IP addresses to maintain a consistent hostname that automatically
updates when their IP address changes. This capability is essential
for home users, small businesses, and IoT devices that need to be
reachable despite lacking static IP addresses.

While RFC 2136 {{RFC2136}} defines DNS UPDATE for programmatic DNS
modifications, most consumer-facing DDNS services use simpler
HTTP-based protocols. The de facto standard for consumer DDNS
emerged organically without formal specification.

This lack of standardization has led to:

- Inconsistent implementations across providers
- Security vulnerabilities from ad-hoc designs
- Limited feature sets (e.g., no native IPv6 support)
- Vendor lock-in due to proprietary extensions
- No formal capability negotiation

This document specifies the ApertoDNS Protocol as a modern, secure,
and fully interoperable alternative designed for the current
Internet landscape.

## Protocol Versioning

The protocol version specified in discovery responses (e.g., "1.2.0")
refers to the semantic version of the protocol specification itself.
This document represents the first IETF standardization of a protocol
that has been in production use since 2024. The version number in
the discovery endpoint reflects the feature set available, while
the Internet-Draft version (e.g., "-00") tracks the IETF document
revision process separately.

## Requirements Language

{::boilerplate bcp14-tagged}

## Goals

The ApertoDNS Protocol is designed with the following goals:

- **Provider-agnostic**: Any DDNS provider can implement this
  protocol using their own domain and branding
- **Secure by default**: HTTPS required, bearer token authentication
- **Modern**: JSON responses, proper HTTP semantics, native IPv6
- **Discoverable**: Self-describing via discovery endpoint
- **Extensible**: Capability negotiation allows future enhancements
- **Backward compatible**: Optional legacy endpoint for existing clients

# Terminology

This document uses the following terms:

DDNS:
: Dynamic DNS. A service that automatically updates DNS records
  when a client's IP address changes.

Provider:
: An organization or service implementing this protocol to offer
  DDNS services to users.

Hostname:
: A fully qualified domain name (FQDN) managed by the provider
  and associated with a user account.

Token:
: An authentication credential issued by the provider, used to
  authorize API requests.

Auto-detection:
: Server-side determination of the client's IP address from the
  incoming HTTP request, used when the client specifies "auto"
  as the IP value.

Client:
: Software or device that makes requests to a DDNS provider to
  update DNS records.

A-label:
: The ASCII-Compatible Encoding (ACE) form of an Internationalized
  Domain Name label, as defined in {{RFC5891}}.

# Protocol Overview

The ApertoDNS Protocol is a RESTful API using JSON over HTTPS.
All protocol endpoints are located under the well-known URI path
`/.well-known/apertodns/v1/`.

## Base URL

Conforming implementations MUST serve all endpoints under:

~~~
https://{provider-domain}/.well-known/apertodns/v1/
~~~

The use of well-known URIs {{RFC8615}} ensures consistent endpoint
discovery across providers.

## Content Type

All request and response bodies MUST use the `application/json`
media type {{RFC8259}} unless otherwise specified.

## Response Format

All responses MUST include a boolean `success` field at the top
level:

~~~json
{
  "success": true,
  "data": { ... }
}
~~~

Or for errors:

~~~json
{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "Human-readable description"
  }
}
~~~

# Conformance Requirements

This section defines the requirements for conforming implementations.

## Conformance Levels

This protocol defines two conformance levels:

Core Conformance:
: A conforming implementation MUST implement the following endpoints:
  /info, /health, and /update. A conforming implementation MUST
  support bearer token authentication. A conforming implementation
  MUST serve all endpoints over HTTPS.

Full Conformance:
: In addition to core conformance requirements, a fully conforming
  implementation MUST implement: /bulk-update, /status/{hostname},
  and /domains endpoints.

## Capability Advertisement

Implementations MUST accurately advertise their capabilities in
the /info endpoint response. Implementations MUST NOT advertise
capabilities they do not support.

## Interoperability

Implementations SHOULD accept requests from any conforming client.
Implementations MUST NOT require proprietary extensions for basic
DDNS functionality.

# Authentication

## Supported Methods

Protected endpoints require authentication via one of the following
methods:

1. **Bearer Token** (RECOMMENDED) {{RFC6750}}: `Authorization: Bearer {token}`
2. **API Key Header**: `X-API-Key: {token}`
3. **HTTP Basic** (legacy only): `Authorization: Basic {credentials}`

Implementations MUST support bearer token authentication.
Implementations MAY support additional methods.

## Token Format

Tokens SHOULD follow the format:

~~~
{provider}_{environment}_{random}
~~~

Where:

- `{provider}`: Provider identifier (e.g., "apertodns", "example")
- `{environment}`: Token environment ("live", "test", "sandbox")
- `{random}`: Cryptographically secure random string (minimum 32
  characters recommended)

Example: `example_live_Kj8mP2xL9nQ4wR7vY1zA3bC6dE0fG5hI`

This format enables:

- Easy identification of token source during debugging
- Environment separation (production vs. testing)
- Consistent token handling across providers

## Token Transmission

Tokens MUST be transmitted only in HTTP headers. Tokens MUST NOT
appear in URLs, query parameters, or request bodies where they
might be logged.

# Endpoints

## Discovery Endpoint (/info)

~~~
GET /.well-known/apertodns/v1/info
~~~

The discovery endpoint returns provider information, capabilities,
and configuration. This endpoint MUST NOT require authentication.

### Response Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| protocol | string | YES | MUST be "apertodns" |
| protocol_version | string | YES | Semantic version (e.g., "1.2.0") |
| provider | object | YES | Provider information |
| capabilities | object | YES | Supported features |
| authentication | object | YES | Supported auth methods |
| endpoints | object | YES | Available endpoint paths |
| rate_limits | object | NO | Rate limiting configuration |
| server_time | string | NO | Current server time (ISO 8601) |

### Capability Fields

The capabilities object MUST include the following fields:

| Field | Type | Description |
|-------|------|-------------|
| ipv4 | boolean | IPv4 address updates supported |
| ipv6 | boolean | IPv6 address updates supported |
| auto_ip_detection | boolean | Automatic IP detection supported |
| bulk_update | boolean | Bulk update endpoint available |
| max_bulk_size | integer | Maximum hostnames per bulk request |

The capabilities object MAY include the following OPTIONAL fields:

| Field | Type | Description |
|-------|------|-------------|
| webhooks | boolean | Provider-specific webhook support available |

When `webhooks` is true, the provider offers webhook notifications
for DNS update events such as IP address changes. The webhook API
is implementation-specific and not standardized by this protocol
version. Providers offering webhooks SHOULD document their webhook
API separately.

The capabilities object MAY include additional fields for future
extensions. Unknown capability fields SHOULD be ignored by clients.

### Example Response

~~~json
{
  "success": true,
  "data": {
    "protocol": "apertodns",
    "protocol_version": "1.2.0",
    "provider": {
      "name": "Example DDNS",
      "website": "https://example.com",
      "documentation": "https://example.com/docs",
      "support_email": "support@example.com"
    },
    "capabilities": {
      "ipv4": true,
      "ipv6": true,
      "auto_ip_detection": true,
      "bulk_update": true,
      "webhooks": true,
      "max_bulk_size": 100
    },
    "authentication": {
      "methods": ["bearer_token", "api_key_header"],
      "token_format": "{provider}_{environment}_{random}"
    },
    "endpoints": {
      "info": "/.well-known/apertodns/v1/info",
      "health": "/.well-known/apertodns/v1/health",
      "update": "/.well-known/apertodns/v1/update",
      "bulk_update": "/.well-known/apertodns/v1/bulk-update",
      "status": "/.well-known/apertodns/v1/status/{hostname}",
      "domains": "/.well-known/apertodns/v1/domains"
    },
    "rate_limits": {
      "update": {"requests": 60, "window_seconds": 60},
      "bulk_update": {"requests": 10, "window_seconds": 60}
    },
    "server_time": "2025-01-01T12:00:00.000Z"
  }
}
~~~

## Health Endpoint (/health)

~~~
GET /.well-known/apertodns/v1/health
~~~

Returns service health status. This endpoint MUST NOT require
authentication and SHOULD be used for monitoring.

### Example Response

~~~json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
~~~

The `status` field MUST be one of: "healthy", "degraded", or
"unhealthy".

## Update Endpoint (/update)

~~~
POST /.well-known/apertodns/v1/update
Authorization: Bearer {token}
Content-Type: application/json
~~~

Updates DNS records for a single hostname. This endpoint MUST
require authentication.

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| hostname | string | YES | Fully qualified domain name |
| ipv4 | string | NO | IPv4 address or "auto" |
| ipv6 | string | NO | IPv6 address or "auto" |
| ttl | integer | NO | Time to live in seconds (60-86400) |

At least one of `ipv4` or `ipv6` SHOULD be provided. If neither
is provided, implementations SHOULD use auto-detection for IPv4.

The special value "auto" instructs the server to detect the
client's IP address from the incoming request.

### Example Request

~~~json
{
  "hostname": "home.example.com",
  "ipv4": "auto",
  "ttl": 300
}
~~~

### Example Response

~~~json
{
  "success": true,
  "data": {
    "hostname": "home.example.com",
    "ipv4": "203.0.113.50",
    "previous_ipv4": "203.0.113.49",
    "ttl": 300,
    "changed": true,
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
~~~

The `changed` field indicates whether the IP address was actually
modified (false if the new IP matches the existing record).

## Bulk Update Endpoint (/bulk-update)

~~~
POST /.well-known/apertodns/v1/bulk-update
Authorization: Bearer {token}
Content-Type: application/json
~~~

Updates multiple hostnames in a single request. Providers
advertising `bulk_update: true` in capabilities MUST implement
this endpoint.

### Example Request

~~~json
{
  "updates": [
    {"hostname": "home.example.com", "ipv4": "auto"},
    {"hostname": "office.example.com", "ipv4": "203.0.113.51"}
  ]
}
~~~

### Example Response

~~~json
{
  "success": true,
  "data": {
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    },
    "results": [
      {
        "hostname": "home.example.com",
        "success": true,
        "ipv4": "203.0.113.50",
        "changed": true
      },
      {
        "hostname": "office.example.com",
        "success": true,
        "ipv4": "203.0.113.51",
        "changed": true
      }
    ]
  }
}
~~~

## Status Endpoint (/status/{hostname})

~~~
GET /.well-known/apertodns/v1/status/{hostname}
Authorization: Bearer {token}
~~~

Returns current DNS record status for a hostname.

### Example Response

~~~json
{
  "success": true,
  "data": {
    "hostname": "home.example.com",
    "ipv4": "203.0.113.50",
    "ipv6": "2001:db8::1",
    "ttl": 300,
    "last_updated": "2025-01-01T12:00:00.000Z"
  }
}
~~~

## Domains Endpoint (/domains)

~~~
GET /.well-known/apertodns/v1/domains
Authorization: Bearer {token}
~~~

Returns list of domains and hostnames available to the
authenticated user.

### Example Response

~~~json
{
  "success": true,
  "data": {
    "domains": [
      {
        "domain": "example.com",
        "hostnames": ["home.example.com", "office.example.com"]
      }
    ]
  }
}
~~~

# Error Handling

## HTTP Status Codes

Implementations MUST use appropriate HTTP status codes as defined
in {{RFC9110}}:

| Status | Usage |
|--------|-------|
| 200 | Successful request |
| 400 | Invalid request (bad hostname, invalid IP) |
| 401 | Missing or invalid authentication |
| 403 | Not authorized for requested resource |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

## Error Response Format

~~~json
{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "Human-readable description"
  }
}
~~~

## Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| unauthorized | 401 | Missing or invalid authentication |
| invalid_token | 401 | Token is invalid or expired |
| token_revoked | 401 | Token has been revoked |
| forbidden | 403 | Not authorized for this resource |
| hostname_not_owned | 403 | User does not own this hostname |
| invalid_hostname | 400 | Invalid hostname format |
| invalid_ip | 400 | Invalid or private IP address |
| ipv4_auto_failed | 400 | Cannot auto-detect IPv4: client connected via IPv6 |
| ipv6_auto_failed | 400 | Cannot auto-detect IPv6: client connected via IPv4 |
| invalid_ttl | 400 | TTL out of valid range (60-86400 seconds) |
| validation_error | 400 | Request body validation failed |
| hostname_not_found | 404 | Hostname not registered |
| rate_limited | 429 | Too many requests |
| server_error | 500 | Internal server error |

## Rate Limiting Headers

When rate limiting is applied, responses SHOULD include:

- `Retry-After`: Seconds until rate limit resets
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when window resets

# Legacy Compatibility

For backward compatibility with existing DDNS clients,
providers MAY implement:

~~~
GET /nic/update?hostname={hostname}&myip={ip}
Authorization: Basic {credentials}
~~~

### Legacy Response Codes

Responses MUST be plain text (not JSON):

| Response | Meaning |
|----------|---------|
| good {ip} | Update successful |
| nochg {ip} | No change needed |
| badauth | Authentication failed |
| notfqdn | Invalid hostname |
| nohost | Hostname not found |
| abuse | Account blocked |

This endpoint is provided for compatibility only. New
implementations SHOULD use the modern JSON endpoints.

# Comparison with RFC 2136

RFC 2136 {{RFC2136}} defines DNS UPDATE, a protocol for dynamic
updates to DNS zones. The ApertoDNS Protocol differs in several
key aspects:

| Aspect | RFC 2136 | ApertoDNS Protocol |
|--------|----------|-------------------|
| Transport | DNS (UDP/TCP) | HTTPS |
| Format | DNS wire format | JSON |
| Auth | TSIG/SIG(0) | Bearer tokens |
| Discovery | None | /info endpoint |
| IPv6 | Supported | Native support |
| Bulk ops | Per-message | Dedicated endpoint |

The ApertoDNS Protocol is designed for consumer DDNS services
where simplicity and HTTP integration are priorities, while
RFC 2136 is suited for direct DNS zone manipulation.

# Security Considerations

## Transport Security

All endpoints MUST be served over HTTPS using TLS 1.2 or higher.
Implementations MUST NOT support plaintext HTTP for any protocol
endpoint.

Implementations SHOULD support TLS 1.3 and SHOULD disable older
cipher suites known to be weak.

## Token Security

- Tokens MUST be generated using cryptographically secure random
  number generators (CSPRNG)
- Tokens SHOULD have configurable expiration
- Providers SHOULD support token revocation
- Tokens MUST NOT be logged in server access logs
- Tokens MUST NOT appear in URLs or error messages

## Hostname Validation

Before processing any update request, implementations MUST verify
that the authenticated user owns or has permission to modify the
requested hostname. Failure to validate ownership could allow
unauthorized DNS modifications.

## Rate Limiting

Providers SHOULD implement rate limiting to prevent:

- Brute-force token guessing
- Denial of service attacks
- Excessive DNS propagation load

Rate limits SHOULD be advertised in the discovery endpoint and
communicated via response headers.

## DNS Rebinding Prevention

Implementations MUST validate that IP addresses in update requests
are not private, loopback, or link-local addresses unless
explicitly configured to allow such addresses.

## Input Validation

All user input MUST be validated:

- Hostnames MUST conform to DNS naming rules
- IP addresses MUST be valid IPv4 or IPv6 format
- TTL values MUST be within acceptable ranges

## Internationalized Domain Names

When handling Internationalized Domain Names (IDNs), the following
requirements apply as specified in {{RFC5891}}:

- Clients SHOULD convert IDN hostnames to their A-label (ASCII
  Compatible Encoding) form before sending requests
- Servers MUST accept hostnames in A-label form
- Servers MAY accept hostnames in U-label (Unicode) form and
  convert them to A-labels internally
- Servers MUST store and return hostnames in a consistent form

For example, a client wishing to update an IDN hostname (U-label form)
SHOULD send the request with the A-label form (e.g., "xn--r8jz45g.example.com").

Implementations that accept U-label input MUST perform IDNA2008
validation as specified in {{RFC5891}} before processing the request.

# Privacy Considerations

This section addresses privacy considerations as recommended by
{{RFC6973}}.

## Data Minimization

Providers SHOULD minimize the collection and retention of personal
data. Specifically:

- IP address history SHOULD have configurable retention periods
- Update timestamps MAY be retained for operational purposes
- Providers SHOULD document their data retention policies

## User Control

Users SHOULD have mechanisms to:

- View their stored data
- Delete their accounts and associated data
- Export their data in a portable format

## Traffic Analysis

DDNS updates inherently reveal:

- That a user's IP address has changed
- The timing of IP address changes
- The association between a hostname and IP address

Providers should be aware that this information could be used to
track user behavior or network changes.

## Encryption

All communications MUST be encrypted via HTTPS, preventing
passive observation of update requests and tokens.

# IANA Considerations

## Well-Known URI Registration

This document requests registration of the following well-known
URI suffix:

URI Suffix:
: apertodns

Change Controller:
: IETF

Specification Document:
: This document

Related Information:
: None

The well-known URI `/.well-known/apertodns/` is used as the base
path for all protocol endpoints.

--- back

# Acknowledgments

Thanks to the dynamic DNS community for decades of service
enabling home users and small businesses to maintain stable
hostnames with dynamic IP addresses.

# Implementation Status

Note to RFC Editor: Please remove this appendix before publication.

This section records the status of known implementations of the
protocol defined by this specification.

## ApertoDNS

Organization:
: ApertoDNS

Implementation:
: Reference implementation

Description:
: Full protocol support including all endpoints, bulk updates,
  webhooks, and legacy compatibility

Level of Maturity:
: Production

Coverage:
: Complete

Licensing:
: Proprietary service, open protocol

Contact:
: support@apertodns.com

URL:
: https://apertodns.com

# OpenAPI Specification

A complete OpenAPI 3.0.3 specification for this protocol is
available at:

https://github.com/apertodns/apertodns-protocol/blob/main/openapi.yaml

This specification can be used to:

- Generate client libraries in various programming languages
- Create interactive API documentation
- Validate implementations for conformance

# Example Update Flow

The following illustrates a typical update flow:

1. Client discovers provider capabilities:
   ~~~
   GET /.well-known/apertodns/v1/info
   ~~~

2. Client authenticates and requests update:
   ~~~
   POST /.well-known/apertodns/v1/update
   Authorization: Bearer example_live_abc123
   Content-Type: application/json

   {"hostname": "home.example.com", "ipv4": "auto"}
   ~~~

3. Provider validates token and hostname ownership

4. Provider updates DNS record

5. Provider returns result:
   ~~~json
   {
     "success": true,
     "data": {
       "hostname": "home.example.com",
       "ipv4": "203.0.113.50",
       "changed": true
     }
   }
   ~~~

6. DNS propagates the new record

# Changes from Legacy DDNS Protocols

For implementers familiar with legacy HTTP-based DDNS protocols
(commonly referred to as "dyndns2" in client implementations
such as ddclient), key differences include:

- JSON responses instead of plain text
- Bearer token authentication instead of HTTP Basic
- Explicit capability negotiation via /info endpoint
- Dedicated endpoints for different operations
- Standardized error codes and response formats
- Native IPv6 support with separate fields
- Bulk update support for multiple hostnames
- Well-known URI path for consistent discovery
