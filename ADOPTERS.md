# ApertoDNS Protocol Adopters

This page lists providers and projects that have adopted the ApertoDNS Protocol.

## How to Join

To be listed as an adopter:

1. Implement the protocol (at minimum Layer 0, 1, and 2)
2. Pass the compliance test suite
3. Submit a pull request adding your organization to this file

## Reference Implementation

| Provider | Website | Status | Notes |
|----------|---------|--------|-------|
| **ApertoDNS** | [apertodns.com](https://apertodns.com) | Production | Reference implementation, full protocol |

## Certified Adopters

*Coming soon - be the first to adopt!*

## Compatible Clients

| Client | Type | Protocol Support | Repository |
|--------|------|------------------|------------|
| apertodns-client | npm package | Full v1.0 | [npm](https://www.npmjs.com/package/apertodns-client) |
| ddclient | CLI | Legacy (DynDNS2) | [github](https://github.com/ddclient/ddclient) |
| OpenWRT ddns-scripts | Router firmware | Legacy (DynDNS2) | [openwrt.org](https://openwrt.org/docs/guide-user/services/ddns/client) |

## Integrations

| Platform | Type | Status | Documentation |
|----------|------|--------|---------------|
| Home Assistant | HACS Integration | Available | [HACS](https://hacs.xyz) |
| Docker | Container | Available | [Docker Hub](https://hub.docker.com/r/apertodns/updater) |
| OpenWRT | Packages | Approved | [OpenWRT Packages](https://github.com/openwrt/packages) |

## Compliance Badges

Adopters passing the compliance test suite may display:

```markdown
[![ApertoDNS Protocol v1.0](https://img.shields.io/badge/ApertoDNS_Protocol-v1.0-blue)](https://apertodns.com/protocol)
```

[![ApertoDNS Protocol v1.0](https://img.shields.io/badge/ApertoDNS_Protocol-v1.0-blue)](https://apertodns.com/protocol)

## Compliance Levels

| Level | Requirements |
|-------|--------------|
| **Basic** | Layer 0 + Layer 1 (Legacy DynDNS2) |
| **Standard** | Layer 0 + Layer 1 + Layer 2 (Modern API) |
| **Full** | All layers including Layer 3 (Extended Features) |

---

## Contact

For questions about adopting the protocol:

- **Email:** protocol@apertodns.com
- **Documentation:** https://apertodns.com/docs/protocol
- **GitHub:** https://github.com/apertodns/protocol

---

*Last updated: 2025-01-01*
