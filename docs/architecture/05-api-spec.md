# 5. API Specification

## Base URL

```text
/api/v1
```

## Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/change-password`

## Contacts

- `GET /api/v1/contacts`
- `POST /api/v1/contacts`
- `GET /api/v1/contacts/:id`
- `PUT /api/v1/contacts/:id`
- `DELETE /api/v1/contacts/:id`
- `POST /api/v1/contacts/import`
- `GET /api/v1/contacts/export`

## Groups

- `GET /api/v1/groups`
- `POST /api/v1/groups/sync`
- `GET /api/v1/groups/:id`
- `POST /api/v1/groups/:id/sync`

## Messages

- `POST /api/v1/messages/send`
- `POST /api/v1/messages/bulk`
- `GET /api/v1/messages/:id`
- `GET /api/v1/messages/logs`

## Campaigns

- `GET /api/v1/campaigns`
- `POST /api/v1/campaigns`
- `GET /api/v1/campaigns/:id`
- `POST /api/v1/campaigns/:id/start`
- `POST /api/v1/campaigns/:id/pause`
- `POST /api/v1/campaigns/:id/resume`
- `POST /api/v1/campaigns/:id/cancel`

## WhatsApp

- `POST /api/v1/whatsapp/connect`
- `GET /api/v1/whatsapp/status`
- `GET /api/v1/whatsapp/qr`
- `POST /api/v1/whatsapp/disconnect`
- `POST /api/v1/whatsapp/reconnect`

## Logs and Reports

- `GET /api/v1/logs/messages`
- `GET /api/v1/logs/system`
- `GET /api/v1/logs/audit`
- `GET /api/v1/reports/messages`
- `GET /api/v1/reports/campaigns`
- `GET /api/v1/reports/delivery`
- `GET /api/v1/reports/usage`

## Settings

- `GET /api/v1/settings/profile`
- `PUT /api/v1/settings/profile`
- `GET /api/v1/settings/users`
- `GET /api/v1/settings/roles`
- `GET /api/v1/settings/whatsapp`
- `GET /api/v1/settings/security`
- `GET /api/v1/settings/api`

## Standard API response format

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed",
  "requestId": "uuid"
}
```

## Error format

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "requestId": "uuid",
  "errors": []
}
```

## API security

- API versioning under `/api/v1`
- RBAC enforced on every protected route
- tenant context from JWT claims only
- rate limiting and request validation
- input sanitization before persistence
- secure audit of sensitive operations
