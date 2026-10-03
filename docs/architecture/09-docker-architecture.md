# 9. Docker Architecture

## Docker and Compose

The platform runs in a containerized environment for local development and future production deployment.

### Services

- frontend
- backend
- worker
- scheduler
- postgres
- redis
- nginx

## Directory layout

```text
docker/
├─ backend.Dockerfile
├─ frontend.Dockerfile
├─ worker.Dockerfile
├─ nginx/
│  └─ nginx.conf
└─ compose/
   └─ docker-compose.yml
```

## Service responsibilities

- `frontend`: Angular static or SSR app served behind Nginx or Node runtime
- `backend`: NestJS API that handles auth, messaging endpoints, and business logic
- `worker`: BullMQ consumer for campaigns, media, reporting, and queue jobs
- `scheduler`: cron-like background tasks for reports and scheduled campaigns
- `postgres`: main relational database
- `redis`: queueing and fast cache layer
- `nginx`: reverse proxy and TLS termination in production

## Health checks

- Postgres readiness probe
- Redis ping check
- backend /health endpoint
- worker readiness check
- Nginx health endpoint

## Deployment direction

This setup supports local development and can be extended for:

- staging with separate environment variables
- production with managed Postgres and Redis
- multiple backend replicas behind a load balancer
- S3-compatible object storage for media
- monitoring and centralized logs
