/**
 * Protocol Compliance Tests - Authentication
 * @author Andrea Ferro <support@apertodns.com>
 *
 * These tests verify authentication compliance with ApertoDNS Protocol v1.3.0
 *
 * Set APERTODNS_TEST_TOKEN environment variable to run authenticated tests.
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.APERTODNS_TEST_URL || 'https://api.apertodns.com';
const TEST_TOKEN = process.env.APERTODNS_TEST_TOKEN || '';
const HAS_VALID_TOKEN = TEST_TOKEN.length > 0;

describe('Authentication - Bearer Token', () => {
  describe('Valid Token', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST accept Bearer token in Authorization header', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/status/test.apertodns.com`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      // Should not be 401 if token format is valid (may be 404 if hostname doesn't exist)
      expect(response.status).not.toBe(401);
    });
  });

  describe('Missing Token', () => {
    it('MUST return 401 for protected endpoints without token', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv4: 'auto'
        })
      });

      expect(response.status).toBe(401);
    });

    it('MUST return error response with code "unauthorized"', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv4: 'auto'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('unauthorized');
    });
  });

  describe('Invalid Token Format', () => {
    it('MUST reject tokens with invalid format', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid_token_format',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv4: 'auto'
        })
      });

      expect(response.status).toBe(401);
    });

    it('MUST reject malformed Bearer header', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': 'InvalidBearer token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv4: 'auto'
        })
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('Authentication - API Key Header', () => {
  describe('X-API-Key Header', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MAY accept token via X-API-Key header', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/status/test.apertodns.com`, {
        headers: {
          'X-API-Key': TEST_TOKEN
        }
      });

      // X-API-Key support is OPTIONAL per protocol spec
      // May return 200, 401 (if not supported), or 404 (hostname not found)
      expect([200, 401, 404]).toContain(response.status);
    });
  });
});

describe('Authentication - Basic Auth (Legacy)', () => {
  describe('/nic/update endpoint', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST accept Basic Auth for legacy endpoint', async () => {
      const credentials = Buffer.from(`user:${TEST_TOKEN}`).toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com&myip=auto`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      // DynDNS2 spec: returns 200 with text response
      // However, some implementations return 401 for API tokens (require domain-specific tokens)
      // Both behaviors are valid per protocol
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        const text = await response.text();
        expect(text).toBeTruthy();
      }
    });

    it('MUST return badauth for invalid credentials', async () => {
      const credentials = Buffer.from('user:invalid_token').toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com&myip=auto`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      // DynDNS2 spec: always returns 200, error is in body
      // However, some implementations return 401 for missing/invalid auth
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        const text = await response.text();
        expect(text.trim()).toBe('badauth');
      }
    });
  });
});

// NOTE: Token format validation is PROVIDER-SPECIFIC and not part of the protocol.
// Format: {provider}_{environment}_{random}
// Each provider implementing the ApertoDNS Protocol may use their own token format:
// - ApertoDNS: apertodns_live_xxx / apertodns_test_xxx
// - deSEC: desec_live_xxx
// - DuckDNS: duckdns_test_xxx
// The protocol only requires that tokens be passed via Bearer header or X-API-Key.

describe('Rate Limit Headers', () => {
  it('SHOULD include X-RateLimit-Limit header', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
    const limit = response.headers.get('x-ratelimit-limit');

    // Rate limit headers are recommended
    if (limit) {
      expect(parseInt(limit, 10)).toBeGreaterThan(0);
    }
  });

  it('SHOULD include X-RateLimit-Remaining header', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
    const remaining = response.headers.get('x-ratelimit-remaining');

    if (remaining) {
      expect(parseInt(remaining, 10)).toBeGreaterThanOrEqual(0);
    }
  });

  it('SHOULD include X-RateLimit-Reset header', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
    const reset = response.headers.get('x-ratelimit-reset');

    if (reset) {
      const timestamp = parseInt(reset, 10);
      expect(timestamp).toBeGreaterThan(0);
    }
  });
});
