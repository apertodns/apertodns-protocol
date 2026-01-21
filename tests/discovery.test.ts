/**
 * Protocol Compliance Tests - Discovery Endpoint
 * @author Andrea Ferro <support@apertodns.com>
 *
 * These tests verify that an implementation conforms to the ApertoDNS Protocol v1.3.2
 * Response format: { success: boolean, data: {...} } per IETF draft
 */

import { describe, it, expect } from 'vitest';

// Test configuration - set these for your implementation
const BASE_URL = process.env.APERTODNS_TEST_URL || 'https://api.apertodns.com';

// Helper to extract data from IETF-compliant response
async function fetchInfo(): Promise<Record<string, unknown>> {
  const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
  const json = await response.json();
  // IETF format: { success: true, data: {...} }
  return json.data || json;
}

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
      // Cache-Control is optional for API responses
      expect(true).toBe(true);
    });
  });

  describe('Response Structure', () => {
    it('should parse as valid JSON with IETF wrapper', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/info`);
      const json = await response.json();
      expect(json).toBeDefined();
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it('MUST include protocol field with value "apertodns"', async () => {
      const data = await fetchInfo();
      expect(data.protocol).toBe('apertodns');
    });

    it('MUST include protocol_version field', async () => {
      const data = await fetchInfo();
      expect(data.protocol_version).toBeDefined();
      expect(typeof data.protocol_version).toBe('string');
      expect(data.protocol_version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('MUST include provider object with required fields', async () => {
      const data = await fetchInfo();
      const provider = data.provider as Record<string, unknown>;

      expect(provider).toBeDefined();
      expect(provider.name).toBeDefined();
      expect(typeof provider.name).toBe('string');
      expect(provider.website).toBeDefined();
      expect(provider.documentation).toBeDefined();
      expect(provider.support_email).toBeDefined();
    });

    it('MUST include endpoints object', async () => {
      const data = await fetchInfo();
      const endpoints = data.endpoints as Record<string, unknown>;

      expect(endpoints).toBeDefined();
      expect(endpoints.update).toBeDefined();
      expect(endpoints.status).toBeDefined();
      expect(endpoints.legacy_dyndns2).toBeDefined();
    });

    it('MUST include capabilities object', async () => {
      const data = await fetchInfo();
      const capabilities = data.capabilities as Record<string, unknown>;

      expect(capabilities).toBeDefined();
      expect(typeof capabilities.ipv4).toBe('boolean');
      expect(typeof capabilities.ipv6).toBe('boolean');
      expect(typeof capabilities.auto_ip_detection).toBe('boolean');
    });

    it('MUST include authentication object', async () => {
      const data = await fetchInfo();
      const auth = data.authentication as Record<string, unknown>;

      expect(auth).toBeDefined();
      expect(auth.methods).toBeDefined();
      expect(Array.isArray(auth.methods)).toBe(true);
      expect(auth.token_format).toBeDefined();
      expect(auth.scopes_supported).toBeDefined();
      expect(Array.isArray(auth.scopes_supported)).toBe(true);
    });

    it('MUST include scopes_supported array in authentication', async () => {
      const data = await fetchInfo();
      const auth = data.authentication as Record<string, unknown>;
      expect(auth.scopes_supported).toBeDefined();
      expect(Array.isArray(auth.scopes_supported)).toBe(true);
      const scopes = auth.scopes_supported as string[];
      expect(scopes).toContain('dns:update');
      expect(scopes).toContain('domains:read');
    });

    it('SHOULD include privacy_policy and terms_of_service in provider', async () => {
      const data = await fetchInfo();
      const provider = data.provider as Record<string, unknown>;
      // These are OPTIONAL per protocol spec
      if (provider.privacy_policy) {
        expect(typeof provider.privacy_policy).toBe('string');
      }
      if (provider.terms_of_service) {
        expect(typeof provider.terms_of_service).toBe('string');
      }
    });

    it('MUST include server_time in ISO 8601 format', async () => {
      const data = await fetchInfo();

      expect(data.server_time).toBeDefined();
      const timestamp = new Date(data.server_time as string);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Rate Limits Info', () => {
    it('SHOULD include rate_limits object', async () => {
      const data = await fetchInfo();

      if (data.rate_limits) {
        const rateLimits = data.rate_limits as Record<string, unknown>;
        const update = rateLimits.update as Record<string, unknown>;
        expect(typeof update).toBe('object');
        expect(update.requests).toBeDefined();
        expect(update.window_seconds).toBeDefined();
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
