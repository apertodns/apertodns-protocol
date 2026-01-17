/**
 * Protocol Compliance Tests - TXT Record Endpoint
 * @author Andrea Ferro <support@apertodns.com>
 *
 * These tests verify TXT record endpoint compliance with ApertoDNS Protocol v1.3.0
 *
 * Set APERTODNS_TEST_TOKEN environment variable to run authenticated tests.
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.APERTODNS_TEST_URL || 'https://api.apertodns.com';
const TEST_TOKEN = process.env.APERTODNS_TEST_TOKEN || '';
const HAS_VALID_TOKEN = TEST_TOKEN.length > 0;

describe('TXT Record Endpoint (POST /.well-known/apertodns/v1/txt)', () => {
  describe('Request Validation', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST require hostname field', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: 'test-value-123'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(['validation_error', 'invalid_hostname', 'txt_invalid_name']).toContain(data.error.code);
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST require value field', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.test.apertodns.com'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(['validation_error', 'txt_value_required']).toContain(data.error.code);
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST reject TXT values exceeding 255 characters', async () => {
      const longValue = 'x'.repeat(256);
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.test.apertodns.com',
          value: longValue
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(['validation_error', 'txt_value_too_long']).toContain(data.error.code);
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST reject TTL below minimum (60)', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.test.apertodns.com',
          value: 'test-value-123',
          ttl: 30
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(['validation_error', 'invalid_ttl']).toContain(data.error.code);
    });
  });

  describe('Response Format', () => {
    it('MUST return JSON response', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.test.apertodns.com',
          value: 'test-value-123'
        })
      });

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('MUST include success field in response', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.test.apertodns.com',
          value: 'test-value-123'
        })
      });

      const data = await response.json();
      expect(data.success).toBeDefined();
      expect(typeof data.success).toBe('boolean');
    });
  });

  describe('Authentication', () => {
    it('MUST require authentication', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.test.apertodns.com',
          value: 'test-value-123'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(['unauthorized', 'invalid_token']).toContain(data.error.code);
    });
  });
});

describe('TXT Record Delete Endpoint (DELETE /.well-known/apertodns/v1/txt)', () => {
  describe('Request Validation', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST require hostname field', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: 'test-value-123'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(['validation_error', 'invalid_hostname', 'txt_invalid_name']).toContain(data.error.code);
    });
  });

  describe('Selective Deletion', () => {
    it.skipIf(!HAS_VALID_TOKEN)('SHOULD support optional value field for selective deletion', async () => {
      // This test verifies the endpoint accepts requests with value field
      // The actual deletion behavior depends on ownership
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.nonexistent.example.com',
          value: 'specific-value-to-delete'
        })
      });

      // Should not fail with validation error for having value field
      const data = await response.json();
      if (data.error) {
        expect(data.error.code).not.toBe('validation_error');
      }
    });

    it.skipIf(!HAS_VALID_TOKEN)('SHOULD support deletion without value (delete all)', async () => {
      // This test verifies the endpoint accepts requests without value field
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.nonexistent.example.com'
        })
      });

      // Should not fail with validation error for missing value field
      const data = await response.json();
      if (data.error) {
        expect(['not_found', 'forbidden', 'hostname_not_found']).toContain(data.error.code);
      }
    });
  });

  describe('Authentication', () => {
    it('MUST require authentication', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: '_acme-challenge.test.apertodns.com'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(['unauthorized', 'invalid_token']).toContain(data.error.code);
    });
  });
});

describe('TXT Record Get Endpoint (GET /.well-known/apertodns/v1/txt/{hostname})', () => {
  describe('Response Format', () => {
    it.skipIf(!HAS_VALID_TOKEN)('MUST return JSON response', async () => {
      const hostname = '_acme-challenge.test.apertodns.com';
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt/${encodeURIComponent(hostname)}`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it.skipIf(!HAS_VALID_TOKEN)('MUST include success field in response', async () => {
      const hostname = '_acme-challenge.test.apertodns.com';
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt/${encodeURIComponent(hostname)}`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      const data = await response.json();
      expect(data.success).toBeDefined();
      expect(typeof data.success).toBe('boolean');
    });

    it.skipIf(!HAS_VALID_TOKEN)('SHOULD return values array for existing records', async () => {
      const hostname = '_acme-challenge.test.apertodns.com';
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt/${encodeURIComponent(hostname)}`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        expect(Array.isArray(data.data.values)).toBe(true);
      }
    });
  });

  describe('Authentication', () => {
    it('MUST require authentication', async () => {
      const hostname = '_acme-challenge.test.apertodns.com';
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt/${encodeURIComponent(hostname)}`);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(['unauthorized', 'invalid_token']).toContain(data.error.code);
    });
  });
});

describe('TXT Record Multi-Value Accumulation', () => {
  describe('ACME DNS-01 Wildcard Support', () => {
    it.skipIf(!HAS_VALID_TOKEN)('SHOULD allow multiple TXT values for same hostname', async () => {
      // This is a documentation test - actual behavior requires owned hostname
      // The protocol REQUIRES support for multiple TXT values (wildcard certs)
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      const data = await response.json();

      if (data.data?.capabilities?.txt_records) {
        // If TXT is supported, max_records should be defined
        expect(data.data.capabilities.txt_max_records).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
