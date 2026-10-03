# MsgFlow — Multi-Contact Messaging & Automation

Enterprise-grade WhatsApp SaaS platform for multi-contact & group broadcasting, dynamic template delivery, 50MB media support (Photos, Songs/Audio, Video, PDF), persistent 24/7 Baileys socket engine, and real-time delivery analytics.

## Repository layout

```text
whatsapp-saas-platform/
├─ backend/                 # NestJS API and business logic
├─ frontend/                # Angular 21 application
├─ database/                # migrations, seeds, schema
├─ docker/                  # Dockerfiles and nginx config
├─ docs/                    # architecture, API, security, queue documentation
├─ scripts/                 # operational scripts
├─ .env.example             # environment template
├─ docker-compose.yml       # local platform orchestration
├─ package.json             # workspace root metadata
└─ README.md
```

## Separation of concerns

- `frontend/` holds the Angular application, routes, dashboard, forms, shared UI components, and API clients.
- `backend/` holds the NestJS API, auth and RBAC modules, tenant services, WhatsApp abstraction layer, queue integrations, workers, and monitoring endpoints.
- `database/` defines PostgreSQL schema and migration strategy.
- `docker/` contains runtime containers and deployment settings.

## Phase 1: architecture

The project is intentionally organized before writing large amounts of code. This phase includes:

1. architecture overview
2. ER diagram description
3. folder structure
4. database schema design
5. API specification
6. Angular route structure
7. security architecture
8. queue architecture
9. Docker architecture

## Core product requirements

- 1000+ tenants
- strict tenant isolation at every layer
- independent WhatsApp connection per tenant
- asynchronous job processing via Redis and BullMQ
- S3-compatible object storage for media and documents
- PostgreSQL as the transactional source of truth
- JWT authentication with refresh tokens and RBAC
- professional Angular dashboard and responsive enterprise UX
- Docker-based local development and production deployment readiness

## Development order

1. Architecture + repository structure
2. PostgreSQL + migrations + tenant model
3. Authentication + RBAC
4. Angular layout + dashboard
5. Contacts
6. Groups
7. WhatsApp provider + connection
8. Message sending
9. Media
10. Redis + BullMQ
11. Bulk campaigns
12. Scheduler
13. Logs
14. Reports
15. Settings
16. API integration
17. Security hardening
18. Testing
19. Docker
20. CI/CD
21. Production deployment
