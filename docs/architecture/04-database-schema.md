# 4. Database Schema

## Core requirements

This database is designed for multi-tenancy, large message throughput, and operational auditability.

### Key design decisions

- Every tenant-owned table includes `tenant_id`.
- UUIDs are used for primary keys.
- Relational data stays normalized.
- Large or binary data stays in object storage.
- Soft delete is used for user-visible business records where needed.
- Indexes focus on tenant + created_at and tenant + status patterns.

## Example schema structure

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  plan VARCHAR(30) NOT NULL DEFAULT 'STARTER',
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(80) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  key VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, role_id, permission_id)
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id, role_id)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Other required tables

- whatsapp_connections
- whatsapp_events
- contacts
- contact_tags
- tags
- groups
- group_members
- campaigns
- campaign_recipients
- messages
- message_status_history
- media
- templates
- scheduled_jobs
- audit_logs
- system_logs
- api_keys
- webhooks
- notifications
- subscriptions
- usage_records

## Essential indexes

```sql
CREATE INDEX tenant_contacts_idx ON contacts(tenant_id, created_at DESC);
CREATE INDEX tenant_messages_idx ON messages(tenant_id, created_at DESC);
CREATE INDEX campaign_messages_idx ON messages(campaign_id, status);
CREATE INDEX contact_mobile_idx ON contacts(tenant_id, mobile_number);
CREATE INDEX tenant_groups_idx ON groups(tenant_id, created_at DESC);
CREATE INDEX tenant_campaigns_idx ON campaigns(tenant_id, status, created_at DESC);
CREATE INDEX tenant_audit_logs_idx ON audit_logs(tenant_id, created_at DESC);
```

## Migration strategy

Database evolution should be versioned using incremental migration files under `database/migrations/` with a clear sequence such as:

1. 001_create_tenants_and_users.sql
2. 002_create_roles_and_permissions.sql
3. 003_create_auth_sessions.sql
4. 004_create_whatsapp_and_contacts.sql
5. 005_create_groups_and_campaigns.sql
6. 006_create_messages_media.sql
7. 007_create_logs_and_audit.sql
8. 008_create_integrations_and_usage.sql
