# 7. Security Architecture

## Core principles

- tenant isolation at auth, service, repo, and DB layers
- no direct trust in frontend permissions
- no tenantId usage from body without validation
- no secrets in source code
- no plaintext WhatsApp session files or credentials in PostgreSQL

## JWT and session security

- short-lived access tokens
- secure refresh token strategy
- token rotation and revocation tracking
- session tracking by device and IP
- logout and logout-all functionality

## RBAC model

Roles include:

- SUPER_ADMIN
- TENANT_ADMIN
- MANAGER
- OPERATOR
- VIEWER

Permissions are enforced at the backend and validated in route guards only as a UX convenience.

## Security controls

- Helmet
- CORS configuration
- input validation and sanitization
- rate limiting for authentication, API, messaging, campaign, and upload endpoints
- secure cookie rules where applicable
- encrypted session state for WhatsApp data
- file upload allow-list and signature checks
- object storage credentials never exposed to the frontend
- audit logging for sensitive actions

## Threat mitigation

- SQL injection: parameterized queries and query builders
- XSS: output sanitization and safe rendering patterns
- CSRF: token-based protection where applicable
- IDOR: tenant checks and owner validation
- brute force: account lock and IP-based rate limiting
- SSRF: allow-list validation for outbound HTTP calls
- path traversal: safe file naming and object-key generation
