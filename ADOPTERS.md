# ApertoDNS Adopters

Projects and integrations implementing or using the ApertoDNS Protocol.

## Official Integrations

| Platform | Type | Repository | Package/Hub |
|----------|------|------------|-------------|
| **Home Assistant** | Add-on (5 packages) | [homeassistant-addon](https://github.com/apertodns/homeassistant-addon) | - |
| **Synology NAS** | DDNS Provider | [synology-ddns](https://github.com/apertodns/synology-ddns) | - |
| **Docker** | Container | [apertodns-docker](https://github.com/apertodns/apertodns-docker) | [Docker Hub](https://hub.docker.com/search?q=apertodns) |

## Official Libraries & Packages

| Platform | Type | Repository | Package |
|----------|------|------------|---------|
| **Node.js/TypeScript** | Client Library | [apertodns-client](https://github.com/apertodns/apertodns-client) | [npm](https://www.npmjs.com/package/apertodns-client) |
| **Node.js** | Core Package | - | [npm](https://www.npmjs.com/package/apertodns) |
| **acme.sh** | DNS Plugin | [acme-dns-apertodns](https://github.com/apertodns/acme-dns-apertodns) | dns_apertodns |

## Protocol Specification

| Resource | Description | Link |
|----------|-------------|------|
| **ApertoDNS Protocol** | Open standard specification v1.4.0 | [GitHub](https://github.com/apertodns/apertodns-protocol) |

## Reference Implementation

| Provider | Status | Website |
|----------|--------|---------|
| **ApertoDNS** | Production | [apertodns.com](https://apertodns.com) |

## Add Your Implementation

If you've implemented the ApertoDNS Protocol, submit a PR to be listed here!

Requirements:
1. Implement at least Layers 0-2 of the protocol
2. Pass the [compliance tests](./tests/)
3. Provide documentation link
