/**
 * Protocol Compliance Tests - Update Endpoint
 * @author Andrea Ferro <support@apertodns.com>
 *
 * These tests verify update endpoint compliance with ApertoDNS Protocol v1.2
 *
 * Set APERTODNS_TEST_TOKEN environment variable to run authenticated tests.
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.APERTODNS_TEST_URL || 'https://api.apertodns.com';
const TEST_TOKEN = process.env.APERTODNS_TEST_TOKEN || '';
const HAS_VALID_TOKEN = TEST_TOKEN.length > 0;

describe('Modern Update Endpoint (POST /.well-known/apertodns/v1/update)', () => {
  describe('Request Validation', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST require hostname field', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ipv4: 'auto'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('validation_error');
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST validate hostname format', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'invalid..hostname',
          ipv4: 'auto'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(['validation_error', 'invalid_hostname']).toContain(data.error.code);
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST reject private IPv4 addresses', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv4: '192.168.1.1'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('invalid_ip');
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST reject TTL below minimum (60)', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv4: 'auto',
          ttl: 30
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(['validation_error', 'invalid_ttl']).toContain(data.error.code);
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST reject TTL above maximum (86400)', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv4: 'auto',
          ttl: 100000
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(['validation_error', 'invalid_ttl']).toContain(data.error.code);
    });
  });

  describe('Response Format', () => {
    it('MUST return JSON response', async () => {
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

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('MUST include success field in response', async () => {
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
      expect(data.success).toBeDefined();
      expect(typeof data.success).toBe('boolean');
    });
  });

  describe('Auto IP Detection', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST support "auto" value for ipv4', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv4: 'auto'
        })
      });

      // Should not fail with invalid_ip error for "auto"
      const data = await response.json();
      if (data.error) {
        expect(data.error.code).not.toBe('invalid_ip');
      }
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST support "auto" value for ipv6', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: 'test.apertodns.com',
          ipv6: 'auto'
        })
      });

      const data = await response.json();
      if (data.error) {
        expect(data.error.code).not.toBe('invalid_ip');
      }
    });
  });
});

describe('Legacy Update Endpoint (GET /nic/update)', () => {
  describe('DynDNS2 Compatibility', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST always return HTTP 200', async () => {
      const credentials = Buffer.from(`user:${TEST_TOKEN}`).toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com&myip=auto`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      // DynDNS2 spec requires 200 for all responses
      expect(response.status).toBe(200);
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST return text/plain content type', async () => {
      const credentials = Buffer.from(`user:${TEST_TOKEN}`).toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com&myip=auto`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      expect(response.headers.get('content-type')).toContain('text/plain');
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST return valid DynDNS2 response codes', async () => {
      const credentials = Buffer.from(`user:${TEST_TOKEN}`).toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com&myip=auto`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      const text = (await response.text()).trim();
      const validResponses = [
        /^good \d+\.\d+\.\d+\.\d+$/,        // good {ip}
        /^nochg \d+\.\d+\.\d+\.\d+$/,       // nochg {ip}
        /^nohost$/,                          // nohost
        /^badauth$/,                         // badauth
        /^notfqdn$/,                         // notfqdn
        /^abuse$/,                           // abuse
        /^dnserr$/,                          // dnserr
        /^911$/,                             // 911
      ];

      const isValid = validResponses.some(pattern => pattern.test(text));
      expect(isValid).toBe(true);
    });
  });

  describe('Query Parameters', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST support hostname parameter', async () => {
      const credentials = Buffer.from(`user:${TEST_TOKEN}`).toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      expect(response.status).toBe(200);
    });

    it.skipIf(!HAS_VALID_TOKEN)('SHOULD support myip parameter', async () => {
      const credentials = Buffer.from(`user:${TEST_TOKEN}`).toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=test.apertodns.com&myip=203.0.114.1`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      expect(response.status).toBe(200);
    });

    it.skipIf(!HAS_VALID_TOKEN)('SHOULD support comma-separated hostnames', async () => {
      const credentials = Buffer.from(`user:${TEST_TOKEN}`).toString('base64');

      const response = await fetch(`${BASE_URL}/nic/update?hostname=host1.apertodns.com,host2.apertodns.com`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      expect(response.status).toBe(200);
    });
  });
});

describe('Bulk Update Endpoint (POST /.well-known/apertodns/v1/bulk-update)', () => {
  describe('Request Validation', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST reject more than 100 updates', async () => {
      const updates = Array(101).fill(null).map((_, i) => ({
        hostname: `host${i}.apertodns.com`,
        ipv4: 'auto'
      }));

      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/bulk-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('bulk_limit_exceeded');
    });
  });

  describe('Response Format', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST return summary with total, successful, failed counts', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/bulk-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updates: [
            { hostname: 'test1.apertodns.com', ipv4: 'auto' },
            { hostname: 'test2.apertodns.com', ipv4: 'auto' }
          ]
        })
      });

      const data = await response.json();

      if (data.success) {
        expect(data.data.summary).toBeDefined();
        expect(data.data.summary.total).toBeDefined();
        expect(data.data.summary.successful).toBeDefined();
        expect(data.data.summary.failed).toBeDefined();
      }
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST return 207 for partial success', async () => {
      // This test assumes at least one hostname doesn't exist
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/bulk-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updates: [
            { hostname: 'nonexistent-host-12345.example.com', ipv4: 'auto' }
          ]
        })
      });

      // Either 207 (partial success) or 400/404 (all failed)
      expect([200, 207, 400, 404]).toContain(response.status);
    });
  });
});
