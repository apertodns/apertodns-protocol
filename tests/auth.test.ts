/**
 * Protocol Compliance Tests - Authentication
 * @author Andrea Ferro <support@apertodns.com>
 *
 * These tests verify authentication compliance with ApertoDNS Protocol v1.0
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.APERTODNS_TEST_URL || 'https://api.apertodns.com';
const TEST_TOKEN = process.env.APERTODNS_TEST_TOKEN || 'apt_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

describe('Authentication - Bearer Token', () => {
  describe('Valid Token', () => {
    it('MUST accept Bearer token in Authorization header', async () => {
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
      expect(data.status).toBe('error');
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('unauthorized');
    });
  });

  describe('Invalid Token Format', () => {
    it('MUST reject tokens without apt_ prefix', async () => {
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
    it('SHOULD accept token via X-API-Key header', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/status/test.apertodns.com`, {
        headers: {
          'X-API-Key': TEST_TOKEN
        }
      });

      // Should not be 401 if this auth method is supported
      // May be 404 if hostname doesn't exist, which is expected
      expect([200, 404]).toContain(response.status);
    });
  });
});

describe('Authentication - Basic Auth (Legacy)', () => {
  describe('/nic/update endpoint', () => {
    it('MUST accept Basic Auth for legacy endpoint', async () => {
      const credentials = Buffer.from(`user:${TEST_TOKEN}`).toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com&myip=auto`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      // Should return 200 with text response (even for errors per DynDNS2 spec)
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBeTruthy();
    });

    it('MUST return badauth for invalid credentials', async () => {
      const credentials = Buffer.from('user:invalid_token').toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com&myip=auto`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      // DynDNS2 always returns 200, error is in body
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text.trim()).toBe('badauth');
    });
  });
});

describe('Token Format Validation', () => {
  const validTokenPatterns = [
    'apt_live_7Hqj3kL9mNpR2sT5vWxY8zA1bC4dE6fG',
    'apt_test_7Hqj3kL9mNpR2sT5vWxY8zA1bC4dE6fG',
  ];

  const invalidTokenPatterns = [
    'apt_prod_7Hqj3kL9mNpR2sT5vWxY8zA1bC4dE6fG', // Invalid environment
    'apt_live_short', // Too short
    'apt_live_', // Missing random part
    'wrong_prefix_7Hqj3kL9mNpR2sT5vWxY8zA1bC4dE6fG', // Wrong prefix
    '', // Empty
  ];

  describe('Valid Token Patterns', () => {
    validTokenPatterns.forEach((token) => {
      it(`should match pattern: ${token.substring(0, 15)}...`, () => {
        const pattern = /^apt_(live|test)_[A-Za-z0-9_-]{32}$/;
        expect(pattern.test(token)).toBe(true);
      });
    });
  });

  describe('Invalid Token Patterns', () => {
    invalidTokenPatterns.forEach((token) => {
      it(`should NOT match pattern: ${token || '(empty)'}`, () => {
        const pattern = /^apt_(live|test)_[A-Za-z0-9_-]{32}$/;
        expect(pattern.test(token)).toBe(false);
      });
    });
  });
});

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
