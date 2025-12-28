/**
 * Protocol Compliance Tests - Discovery Endpoint
 * @author Andrea Ferro <support@apertodns.com>
 *
 * These tests verify that an implementation conforms to the ApertoDNS Protocol v1.0
 */

import { describe, it, expect } from 'vitest';

// Test configuration - set these for your implementation
const BASE_URL = process.env.APERTODNS_TEST_URL || 'https://api.apertodns.com';

describe('Discovery Endpoint (/.well-known/apertodns/v1/info)', () => {
  describe('Request', () => {
    it('MUST be accessible without authentication', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      expect(response.status).toBe(200);
    });

    it('MUST return Content-Type application/json', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('SHOULD include Cache-Control header', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeTruthy();
    });
  });

  describe('Response Structure', () => {
    let data: Record<string, unknown>;

    it('should parse as valid JSON', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      data = await response.json();
      expect(data).toBeDefined();
    });

    it('MUST include protocol field with value "apertodns"', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      data = await response.json();
      expect(data.protocol).toBe('apertodns');
    });

    it('MUST include protocol_version field', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      data = await response.json();
      expect(data.protocol_version).toBeDefined();
      expect(typeof data.protocol_version).toBe('string');
      expect(data.protocol_version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('MUST include provider object with required fields', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      data = await response.json();
      const provider = data.provider as Record<string, unknown>;

      expect(provider).toBeDefined();
      expect(provider.name).toBeDefined();
      expect(typeof provider.name).toBe('string');
      expect(provider.website).toBeDefined();
      expect(provider.documentation).toBeDefined();
      expect(provider.support_email).toBeDefined();
    });

    it('MUST include endpoints object', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      data = await response.json();
      const endpoints = data.endpoints as Record<string, unknown>;

      expect(endpoints).toBeDefined();
      expect(endpoints.update).toBeDefined();
      expect(endpoints.status).toBeDefined();
      expect(endpoints.legacy_dyndns2).toBeDefined();
    });

    it('MUST include capabilities object', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      data = await response.json();
      const capabilities = data.capabilities as Record<string, unknown>;

      expect(capabilities).toBeDefined();
      expect(typeof capabilities.ipv4).toBe('boolean');
      expect(typeof capabilities.ipv6).toBe('boolean');
      expect(typeof capabilities.auto_ip_detection).toBe('boolean');
    });

    it('MUST include authentication object', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      data = await response.json();
      const auth = data.authentication as Record<string, unknown>;

      expect(auth).toBeDefined();
      expect(auth.methods).toBeDefined();
      expect(Array.isArray(auth.methods)).toBe(true);
      expect(auth.token_prefix).toBe('apt_');
    });

    it('MUST include server_time in ISO 8601 format', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      data = await response.json();

      expect(data.server_time).toBeDefined();
      const timestamp = new Date(data.server_time as string);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Rate Limits Info', () => {
    it('SHOULD include rate_limits object', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      const data = await response.json();

      if (data.rate_limits) {
        expect(typeof data.rate_limits.update).toBe('object');
        expect(data.rate_limits.update.requests).toBeDefined();
        expect(data.rate_limits.update.window_seconds).toBeDefined();
      }
    });
  });

  describe('TTL Range', () => {
    it('SHOULD include ttl_range in capabilities', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      const data = await response.json();
      const capabilities = data.capabilities as Record<string, unknown>;

      if (capabilities.ttl_range) {
        const ttlRange = capabilities.ttl_range as Record<string, number>;
        expect(ttlRange.min).toBeGreaterThanOrEqual(60);
        expect(ttlRange.max).toBeLessThanOrEqual(86400);
        expect(ttlRange.default).toBeGreaterThanOrEqual(ttlRange.min);
        expect(ttlRange.default).toBeLessThanOrEqual(ttlRange.max);
      }
    });
  });
});

describe('Security Headers', () => {
  it('MUST include Strict-Transport-Security', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
    const hsts = response.headers.get('strict-transport-security');
    expect(hsts).toBeTruthy();
    expect(hsts).toContain('max-age=');
  });

  it('MUST include X-Content-Type-Options: nosniff', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('MUST include X-Frame-Options', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
    const xfo = response.headers.get('x-frame-options');
    expect(xfo).toBeTruthy();
    expect(['DENY', 'SAMEORIGIN']).toContain(xfo);
  });

  it('SHOULD include Content-Security-Policy', async () => {
    const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
    const csp = response.headers.get('content-security-policy');
    // CSP is recommended but not required for API endpoints
    if (csp) {
      expect(csp).toContain("default-src");
    }
  });
});
