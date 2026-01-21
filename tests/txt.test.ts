/**
 * Protocol Compliance Tests - TXT Record Operations
 * ApertoDNS Protocol v1.3.2
 *
 * @author Andrea Ferro <support@apertodns.com>
 *
 * Provider-agnostic conformance tests for TXT record endpoints.
 * These tests verify compliance with the ApertoDNS Protocol specification.
 *
 * Environment variables:
 * - APERTODNS_TEST_URL: Base URL of the provider (default: https://api.apertodns.com)
 * - APERTODNS_TEST_TOKEN: API token for authenticated tests
 * - APERTODNS_TEST_HOSTNAME: Test hostname owned by the token (default: test.example.com)
 */

import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.APERTODNS_TEST_URL || 'https://api.apertodns.com'
const TOKEN = process.env.APERTODNS_TEST_TOKEN || ''
const TEST_HOSTNAME = process.env.APERTODNS_TEST_HOSTNAME || 'test.example.com'
const HAS_VALID_TOKEN = TOKEN.length > 0

describe('TXT Record Operations (v1.3.2)', () => {
  // Use counter + timestamp to ensure uniqueness even in same millisecond
  let counter = 0
  const uniqueValue = () => `test-txt-${Date.now()}-${++counter}`

  describe('POST /.well-known/apertodns/v1/txt', () => {
    it.skipIf(!HAS_VALID_TOKEN)('should create TXT record', async () => {
      const value = uniqueValue()
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({
          hostname: `_acme-challenge.${TEST_HOSTNAME}`,
          value: value,
          ttl: 60
        })
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.hostname).toBe(`_acme-challenge.${TEST_HOSTNAME}`)
      expect(json.data.value).toBe(value)
    })

    it.skipIf(!HAS_VALID_TOKEN)('should accumulate multiple TXT values', async () => {
      const value1 = uniqueValue()
      const value2 = uniqueValue()

      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: value1 })
      })

      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: value2 })
      })

      const getResponse = await fetch(
        `${BASE_URL}/.well-known/apertodns/v1/txt/_acme-challenge.${TEST_HOSTNAME}`,
        { headers: { 'Authorization': `Bearer ${TOKEN}` } }
      )
      const json = await getResponse.json()
      expect(json.data.values).toContain(value1)
      expect(json.data.values).toContain(value2)
    })

    it.skipIf(!HAS_VALID_TOKEN)('should reject TXT value exceeding 255 chars', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({
          hostname: `_acme-challenge.${TEST_HOSTNAME}`,
          value: 'x'.repeat(256)
        })
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('txt_value_too_long')
    })

    it.skipIf(!HAS_VALID_TOKEN)('should require hostname field', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ value: 'test-value' })
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(['validation_error', 'invalid_hostname', 'txt_invalid_name']).toContain(json.error.code)
    })

    it.skipIf(!HAS_VALID_TOKEN)('should require value field', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}` })
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(['validation_error', 'txt_value_required']).toContain(json.error.code)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: 'test' })
      })
      expect(response.status).toBe(401)
    })

    it('should return JSON content-type', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: 'test' })
      })
      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('GET /.well-known/apertodns/v1/txt/:hostname', () => {
    it.skipIf(!HAS_VALID_TOKEN)('should return TXT records array', async () => {
      const response = await fetch(
        `${BASE_URL}/.well-known/apertodns/v1/txt/_acme-challenge.${TEST_HOSTNAME}`,
        { headers: { 'Authorization': `Bearer ${TOKEN}` } }
      )

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data.values)).toBe(true)
      expect(typeof json.data.record_count).toBe('number')
    })

    it.skipIf(!HAS_VALID_TOKEN)('should include hostname in response', async () => {
      const response = await fetch(
        `${BASE_URL}/.well-known/apertodns/v1/txt/_acme-challenge.${TEST_HOSTNAME}`,
        { headers: { 'Authorization': `Bearer ${TOKEN}` } }
      )

      const json = await response.json()
      expect(json.data.hostname).toBe(`_acme-challenge.${TEST_HOSTNAME}`)
    })

    it('should require authentication', async () => {
      const response = await fetch(
        `${BASE_URL}/.well-known/apertodns/v1/txt/_acme-challenge.${TEST_HOSTNAME}`
      )
      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /.well-known/apertodns/v1/txt', () => {
    it.skipIf(!HAS_VALID_TOKEN)('should delete specific TXT value', async () => {
      const value = uniqueValue()

      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value })
      })

      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value })
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.deleted).toBe(true)
    })

    it.skipIf(!HAS_VALID_TOKEN)('should delete all TXT values when no value specified', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}` })
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
    })

    it.skipIf(!HAS_VALID_TOKEN)('should require hostname field', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ value: 'some-value' })
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
    })

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}` })
      })
      expect(response.status).toBe(401)
    })
  })

  describe('Multi-TXT Accumulation for ACME DNS-01', () => {
    it.skipIf(!HAS_VALID_TOKEN)('should support wildcard certificate validation', async () => {
      // Wildcard certificates require two TXT records:
      // 1. For the base domain validation
      // 2. For the wildcard validation
      // Both use the same _acme-challenge prefix

      const token1 = uniqueValue()
      const token2 = uniqueValue()

      // First validation token
      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: token1 })
      })

      // Second validation token (must accumulate, not replace)
      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: token2 })
      })

      // Verify both tokens exist
      const getResponse = await fetch(
        `${BASE_URL}/.well-known/apertodns/v1/txt/_acme-challenge.${TEST_HOSTNAME}`,
        { headers: { 'Authorization': `Bearer ${TOKEN}` } }
      )
      const json = await getResponse.json()

      expect(json.data.record_count).toBeGreaterThanOrEqual(2)
      expect(json.data.values).toContain(token1)
      expect(json.data.values).toContain(token2)

      // Cleanup
      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}` })
      })
    })

    it.skipIf(!HAS_VALID_TOKEN)('should support selective deletion preserving other values', async () => {
      const keepValue = uniqueValue()
      const deleteValue = uniqueValue()

      // Add both values
      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: keepValue })
      })

      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: deleteValue })
      })

      // Delete only one value
      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}`, value: deleteValue })
      })

      // Verify only keepValue remains
      const getResponse = await fetch(
        `${BASE_URL}/.well-known/apertodns/v1/txt/_acme-challenge.${TEST_HOSTNAME}`,
        { headers: { 'Authorization': `Bearer ${TOKEN}` } }
      )
      const json = await getResponse.json()

      expect(json.data.values).toContain(keepValue)
      expect(json.data.values).not.toContain(deleteValue)

      // Cleanup
      await fetch(`${BASE_URL}/.well-known/apertodns/v1/txt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ hostname: `_acme-challenge.${TEST_HOSTNAME}` })
      })
    })
  })
})
