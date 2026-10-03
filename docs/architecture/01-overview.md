# 1. Architecture Overview

## System design

The product is built as a monorepo with two primary execution domains:

- `frontend/` for the Angular 21 SaaS application
- `backend/` for NestJS API, worker runtime, and scheduler logic

This split keeps the UI, business logic, and background processing independent while still allowing a single repository to manage the system.

## Runtime layers

```text
Browser
  -> Angular 21 frontend
     -> REST API / WebSocket
          -> NestJS backend
               -> PostgreSQL
               -> Redis + BullMQ
               -> S3-compatible object storage
               -> WhatsApp provider adapter
```

## Tenancy model

Every tenant must be isolated using tenant-scoped queries, middleware authorization, repository filtering, and database constraints. The tenant context is derived from the authenticated user and validated against the request metadata.

## WhatsApp isolation

The WhatsApp provider layer is abstracted behind a provider interface. Each tenant stores its own connection state and encrypted session details. Controller code never accesses raw WhatsApp client objects.

## Scalability strategy

- API servers are stateless and horizontally scalable.
- Background jobs run in separate workers.
- Postgres supports OLTP workloads and large message datasets with indexes and pagination.
- Redis manages queue concurrency and rate-control state.
- Object storage is used for all large media, not PostgreSQL.

## Security strategy

- JWT access tokens and refresh tokens
- Argon2 or bcrypt password hashing
- RBAC enforced at the backend
- request validation and rate limiting
- secure headers, CORS, and tenant checks
- encrypted WhatsApp session storage
- no stack traces exposed to end users
