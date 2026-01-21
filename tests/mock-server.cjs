/**
 * ApertoDNS Protocol v1.3.2 - Reference Mock Server
 *
 * This is a minimal in-memory implementation demonstrating protocol conformance.
 * A provider can use this as a reference for implementing the protocol.
 *
 * Features:
 * - All endpoints from the protocol spec
 * - In-memory storage (no database required)
 * - Multi-TXT record accumulation
 * - Bearer token authentication
 * - DynDNS2 legacy compatibility
 */

const http = require('http');

// Debug mode
const DEBUG = process.env.MOCK_DEBUG === '1';

// In-memory storage
const domains = new Map();     // hostname -> { ipv4, ipv6, ttl, updated_at }
const txtRecords = new Map();  // hostname -> Set of values
const validTokens = new Set(['test_token_123', 'mockdns_live_testtoken123abc']);

// Debug logging
let requestCounter = 0;
function logRequest(method, path, body) {
  if (!DEBUG) return;
  requestCounter++;
  console.log(`[${requestCounter}] ${method} ${path}`);
  if (body && Object.keys(body).length > 0) {
    console.log(`    Body: ${JSON.stringify(body)}`);
  }
}

function logTxtState(hostname) {
  if (!DEBUG) return;
  const values = txtRecords.get(hostname);
  console.log(`    TXT state for ${hostname}: ${values ? Array.from(values).join(', ') : '(empty)'}`);
}

// Helper: Get client IP (normalize to IPv4 for localhost)
function getClientIp(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.socket.remoteAddress?.replace('::ffff:', '') ||
             '127.0.0.1';
  // Normalize IPv6 localhost to IPv4 for test compatibility
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  return ip;
}

// Helper: Check Bearer token
function checkAuth(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;

  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    return validTokens.has(token) ? token : null;
  }
  return null;
}

// Helper: Check Basic Auth (legacy)
function checkBasicAuth(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Basic ')) return null;

  const decoded = Buffer.from(auth.slice(6), 'base64').toString();
  const [, password] = decoded.split(':');
  return validTokens.has(password) ? password : null;
}

// Helper: Parse JSON body
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// Helper: Send JSON response
function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'",
    'X-RateLimit-Limit': '300',
    'X-RateLimit-Remaining': '299',
    'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60)
  });
  res.end(JSON.stringify(data));
}

// Helper: Validate hostname format
function isValidHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  if (hostname.includes('..')) return false;
  return /^[a-zA-Z0-9._-]+$/.test(hostname);
}

// Helper: Validate IPv4
function isValidIpv4(ip) {
  if (ip === 'auto') return true;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = parseInt(p, 10);
    return n >= 0 && n <= 255;
  });
}

// Helper: Check if IP is private
function isPrivateIp(ip) {
  if (ip === 'auto') return false;
  const parts = ip.split('.').map(Number);
  // 10.x.x.x
  if (parts[0] === 10) return true;
  // 172.16.x.x - 172.31.x.x
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.x.x
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.x.x.x
  if (parts[0] === 127) return true;
  return false;
}

// Initialize test domain
domains.set('test.example.com', {
  ipv4: '93.184.216.34',
  ipv6: null,
  ttl: 300,
  updated_at: new Date().toISOString()
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ===== DISCOVERY =====
  if (path === '/.well-known/apertodns/v1/info' && method === 'GET') {
    return json(res, 200, {
      success: true,
      data: {
        protocol: 'apertodns',
        protocol_version: '1.3.2',
        provider: {
          name: 'MockDNS Provider',
          website: 'https://mockdns.example.com',
          documentation: 'https://docs.mockdns.example.com',
          support_email: 'support@mockdns.example.com',
          privacy_policy: 'https://mockdns.example.com/privacy',
          terms_of_service: 'https://mockdns.example.com/terms'
        },
        endpoints: {
          update: '/.well-known/apertodns/v1/update',
          status: '/.well-known/apertodns/v1/status',
          domains: '/.well-known/apertodns/v1/domains',
          txt: '/.well-known/apertodns/v1/txt',
          legacy_dyndns2: '/nic/update'
        },
        capabilities: {
          ipv4: true,
          ipv6: true,
          auto_ip_detection: true,
          txt_records: true,
          bulk_update: true
        },
        authentication: {
          methods: ['bearer', 'basic'],
          token_format: '{provider}_{environment}_{random}',
          scopes_supported: ['dns:update', 'dns:read', 'domains:read', 'domains:write', 'txt:write', 'txt:read']
        },
        rate_limits: {
          update: { requests: 300, window_seconds: 60 }
        },
        server_time: new Date().toISOString()
      }
    });
  }

  // ===== HEALTH =====
  if (path === '/.well-known/apertodns/v1/health' && method === 'GET') {
    return json(res, 200, {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  }

  // ===== UPDATE (Modern) =====
  if (path === '/.well-known/apertodns/v1/update' && method === 'POST') {
    const token = checkAuth(req);
    if (!token) {
      return json(res, 401, {
        success: false,
        error: { code: 'unauthorized', message: 'Authentication required' }
      });
    }

    const body = await parseBody(req);

    // Validation
    if (!body.hostname) {
      return json(res, 400, {
        success: false,
        error: { code: 'validation_error', message: 'hostname is required' }
      });
    }

    if (!isValidHostname(body.hostname)) {
      return json(res, 400, {
        success: false,
        error: { code: 'invalid_hostname', message: 'Invalid hostname format' }
      });
    }

    // Check IP
    const ipv4 = body.ipv4 || body.ip;
    if (ipv4 && ipv4 !== 'auto') {
      if (!isValidIpv4(ipv4)) {
        return json(res, 400, {
          success: false,
          error: { code: 'invalid_ip', message: 'Invalid IPv4 address' }
        });
      }
      if (isPrivateIp(ipv4)) {
        return json(res, 400, {
          success: false,
          error: { code: 'invalid_ip', message: 'Private IP addresses not allowed' }
        });
      }
    }

    // Check TTL
    const ttl = body.ttl || 300;
    if (ttl < 60 || ttl > 86400) {
      return json(res, 400, {
        success: false,
        error: { code: 'invalid_ttl', message: 'TTL must be between 60 and 86400' }
      });
    }

    // Resolve auto IP
    const resolvedIpv4 = ipv4 === 'auto' ? getClientIp(req) : ipv4;
    const resolvedIpv6 = body.ipv6 === 'auto' ? null : body.ipv6; // Mock: no IPv6 auto-detect

    // Update domain
    domains.set(body.hostname, {
      ipv4: resolvedIpv4 || domains.get(body.hostname)?.ipv4,
      ipv6: resolvedIpv6 || domains.get(body.hostname)?.ipv6,
      ttl,
      updated_at: new Date().toISOString()
    });

    return json(res, 200, {
      success: true,
      data: {
        hostname: body.hostname,
        ipv4: resolvedIpv4,
        ipv6: resolvedIpv6,
        ttl,
        updated_at: new Date().toISOString()
      }
    });
  }

  // ===== BULK UPDATE =====
  if (path === '/.well-known/apertodns/v1/bulk-update' && method === 'POST') {
    const token = checkAuth(req);
    if (!token) {
      return json(res, 401, {
        success: false,
        error: { code: 'unauthorized', message: 'Authentication required' }
      });
    }

    const body = await parseBody(req);

    if (!body.updates || !Array.isArray(body.updates)) {
      return json(res, 400, {
        success: false,
        error: { code: 'validation_error', message: 'updates array required' }
      });
    }

    if (body.updates.length > 100) {
      return json(res, 400, {
        success: false,
        error: { code: 'bulk_limit_exceeded', message: 'Maximum 100 updates per request' }
      });
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const update of body.updates) {
      if (!update.hostname || !isValidHostname(update.hostname)) {
        results.push({ hostname: update.hostname, success: false, error: 'invalid_hostname' });
        failed++;
        continue;
      }

      const ipv4 = update.ipv4 === 'auto' ? getClientIp(req) : update.ipv4;
      domains.set(update.hostname, {
        ipv4,
        ipv6: update.ipv6,
        ttl: update.ttl || 300,
        updated_at: new Date().toISOString()
      });

      results.push({ hostname: update.hostname, success: true, ipv4 });
      successful++;
    }

    const status = failed > 0 && successful > 0 ? 207 : (failed > 0 ? 400 : 200);
    return json(res, status, {
      success: failed === 0,
      data: {
        summary: { total: body.updates.length, successful, failed },
        results
      }
    });
  }

  // ===== STATUS =====
  if (path.startsWith('/.well-known/apertodns/v1/status/') && method === 'GET') {
    const token = checkAuth(req);
    if (!token) {
      return json(res, 401, {
        success: false,
        error: { code: 'unauthorized', message: 'Authentication required' }
      });
    }

    const hostname = path.replace('/.well-known/apertodns/v1/status/', '');
    const domain = domains.get(hostname);

    if (!domain) {
      return json(res, 404, {
        success: false,
        error: { code: 'not_found', message: 'Hostname not found' }
      });
    }

    return json(res, 200, {
      success: true,
      data: {
        hostname,
        ...domain
      }
    });
  }

  // ===== DOMAINS =====
  if (path === '/.well-known/apertodns/v1/domains' && method === 'GET') {
    const token = checkAuth(req);
    if (!token) {
      return json(res, 401, {
        success: false,
        error: { code: 'unauthorized', message: 'Authentication required' }
      });
    }

    const domainList = Array.from(domains.entries()).map(([hostname, data]) => ({
      hostname,
      ...data
    }));

    return json(res, 200, {
      success: true,
      data: {
        domains: domainList,
        total: domainList.length
      }
    });
  }

  // ===== TXT POST (Create) =====
  if (path === '/.well-known/apertodns/v1/txt' && method === 'POST') {
    const token = checkAuth(req);
    if (!token) {
      return json(res, 401, {
        success: false,
        error: { code: 'unauthorized', message: 'Authentication required' }
      });
    }

    const body = await parseBody(req);

    if (!body.hostname) {
      return json(res, 400, {
        success: false,
        error: { code: 'txt_invalid_name', message: 'hostname is required' }
      });
    }

    if (!body.value) {
      return json(res, 400, {
        success: false,
        error: { code: 'txt_value_required', message: 'value is required' }
      });
    }

    if (body.value.length > 255) {
      return json(res, 400, {
        success: false,
        error: { code: 'txt_value_too_long', message: 'TXT value exceeds 255 characters' }
      });
    }

    // Accumulate TXT values (key feature for ACME DNS-01)
    if (!txtRecords.has(body.hostname)) {
      txtRecords.set(body.hostname, new Set());
    }
    txtRecords.get(body.hostname).add(body.value);

    logRequest('POST', '/txt', body);
    logTxtState(body.hostname);

    return json(res, 200, {
      success: true,
      data: {
        hostname: body.hostname,
        value: body.value,
        ttl: body.ttl || 60,
        record_count: txtRecords.get(body.hostname).size,
        timestamp: new Date().toISOString()
      }
    });
  }

  // ===== TXT GET =====
  if (path.startsWith('/.well-known/apertodns/v1/txt/') && method === 'GET') {
    const token = checkAuth(req);
    if (!token) {
      return json(res, 401, {
        success: false,
        error: { code: 'unauthorized', message: 'Authentication required' }
      });
    }

    const hostname = path.replace('/.well-known/apertodns/v1/txt/', '');
    const values = txtRecords.get(hostname) || new Set();

    logRequest('GET', '/txt/' + hostname, {});
    logTxtState(hostname);

    return json(res, 200, {
      success: true,
      data: {
        hostname,
        values: Array.from(values),
        record_count: values.size
      }
    });
  }

  // ===== TXT DELETE =====
  if (path === '/.well-known/apertodns/v1/txt' && method === 'DELETE') {
    const token = checkAuth(req);
    if (!token) {
      return json(res, 401, {
        success: false,
        error: { code: 'unauthorized', message: 'Authentication required' }
      });
    }

    const body = await parseBody(req);

    if (!body.hostname) {
      return json(res, 400, {
        success: false,
        error: { code: 'validation_error', message: 'hostname is required' }
      });
    }

    const records = txtRecords.get(body.hostname);

    logRequest('DELETE', '/txt', body);

    if (body.value && records) {
      // Delete specific value
      records.delete(body.value);
    } else if (records) {
      // Delete all values for hostname
      txtRecords.delete(body.hostname);
    }

    logTxtState(body.hostname);

    return json(res, 200, {
      success: true,
      data: {
        hostname: body.hostname,
        deleted: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  // ===== LEGACY DynDNS2 =====
  if (path === '/nic/update' && method === 'GET') {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    const token = checkBasicAuth(req);
    if (!token) {
      res.writeHead(200);
      return res.end('badauth');
    }

    const hostname = url.searchParams.get('hostname');
    if (!hostname) {
      res.writeHead(200);
      return res.end('notfqdn');
    }

    let myip = url.searchParams.get('myip');
    if (!myip || myip === 'auto') {
      myip = getClientIp(req);
    }

    // Update domain
    const existing = domains.get(hostname);
    const isChange = !existing || existing.ipv4 !== myip;

    domains.set(hostname, {
      ipv4: myip,
      ipv6: null,
      ttl: 300,
      updated_at: new Date().toISOString()
    });

    res.writeHead(200);
    return res.end(isChange ? `good ${myip}` : `nochg ${myip}`);
  }

  // 404 for unknown paths
  return json(res, 404, {
    success: false,
    error: { code: 'not_found', message: 'Endpoint not found' }
  });
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`ApertoDNS Protocol Mock Server v1.3.2 running on port ${PORT}`);
  console.log(`Test with: APERTODNS_TEST_URL="http://localhost:${PORT}" APERTODNS_TEST_TOKEN="test_token_123" npm test`);
});
