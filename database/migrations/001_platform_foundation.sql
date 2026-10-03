BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  IF to_regclass('public.tenants') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'tenant_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'id') THEN
      ALTER TABLE tenants RENAME COLUMN tenant_id TO id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'company_name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'name') THEN
      ALTER TABLE tenants RENAME COLUMN company_name TO name;
    END IF;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'uid')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') THEN
      ALTER TABLE users RENAME COLUMN uid TO id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_date')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at') THEN
      ALTER TABLE users RENAME COLUMN created_date TO created_at;
    END IF;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  plan VARCHAR(40) NOT NULL DEFAULT 'starter',
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email CITEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, email)
);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(120);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan VARCHAR(40) NOT NULL DEFAULT 'starter';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) NOT NULL DEFAULT 'UTC';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tenants ALTER COLUMN id SET DEFAULT gen_random_uuid();

UPDATE tenants
SET slug = left(coalesce(nullif(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), ''), 'workspace'), 100)
          || '-' || left(id::text, 8)
WHERE slug IS NULL OR slug = '';

ALTER TABLE tenants ALTER COLUMN name SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN slug SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN status SET DEFAULT 'active';
CREATE UNIQUE INDEX IF NOT EXISTS tenants_id_uq ON tenants (id);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_uq ON tenants (slug);

ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(40) NOT NULL DEFAULT 'VIEWER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

UPDATE users
SET first_name = coalesce(nullif(first_name, ''), nullif(split_part(btrim(name), ' ', 1), ''), 'Workspace'),
    last_name = coalesce(nullif(last_name, ''), nullif(btrim(regexp_replace(btrim(name), '^\\S+\\s*', '')), ''), 'Admin');

ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'TENANT_ADMIN';
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_id_id_uq ON users (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_uq ON users (tenant_id, lower(email));

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id, role_id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  refresh_token_id UUID,
  device_name VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON DELETE CASCADE
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_refresh_token_fk') THEN
    ALTER TABLE sessions ADD CONSTRAINT sessions_refresh_token_fk
      FOREIGN KEY (tenant_id, refresh_token_id)
      REFERENCES refresh_tokens(tenant_id, id) ON DELETE SET NULL (refresh_token_id);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  provider VARCHAR(40) NOT NULL,
  provider_account_id VARCHAR(255),
  status VARCHAR(24) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'failed', 'logged_out')),
  credentials_ciphertext BYTEA,
  credentials_key_version VARCHAR(80),
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  phone_e164 VARCHAR(20) NOT NULL,
  display_name VARCHAR(255),
  attributes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, phone_e164)
);

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  connection_id UUID NOT NULL,
  provider_group_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 0 CHECK (participant_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, connection_id, provider_group_id),
  FOREIGN KEY (tenant_id, connection_id) REFERENCES whatsapp_connections(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS group_members (
  tenant_id UUID NOT NULL,
  group_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, group_id, contact_id),
  FOREIGN KEY (tenant_id, group_id) REFERENCES whatsapp_groups(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, contact_id) REFERENCES contacts(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  object_key TEXT NOT NULL,
  content_type VARCHAR(255) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 CHAR(64),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, object_key),
  FOREIGN KEY (tenant_id, created_by) REFERENCES users(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  connection_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'queued', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, connection_id) REFERENCES whatsapp_connections(tenant_id, id),
  FOREIGN KEY (tenant_id, created_by) REFERENCES users(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  connection_id UUID NOT NULL,
  contact_id UUID,
  campaign_id UUID,
  media_id UUID,
  direction VARCHAR(12) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  recipient VARCHAR(255) NOT NULL,
  body TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'read', 'failed')),
  provider_message_id VARCHAR(255),
  error_code VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, connection_id) REFERENCES whatsapp_connections(tenant_id, id),
  FOREIGN KEY (tenant_id, contact_id) REFERENCES contacts(tenant_id, id),
  FOREIGN KEY (tenant_id, campaign_id) REFERENCES campaigns(tenant_id, id),
  FOREIGN KEY (tenant_id, media_id) REFERENCES media(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  tenant_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  message_id UUID,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, campaign_id, contact_id),
  FOREIGN KEY (tenant_id, campaign_id) REFERENCES campaigns(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, contact_id) REFERENCES contacts(tenant_id, id),
  FOREIGN KEY (tenant_id, message_id) REFERENCES messages(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  actor_user_id UUID,
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(120) NOT NULL,
  resource_id UUID,
  request_id VARCHAR(120),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, actor_user_id) REFERENCES users(tenant_id, id)
);

CREATE INDEX IF NOT EXISTS users_tenant_status_idx ON users (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS user_roles_tenant_user_idx ON user_roles (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS sessions_active_expiry_idx ON sessions (tenant_id, user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS refresh_tokens_active_expiry_idx ON refresh_tokens (tenant_id, user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS contacts_tenant_created_idx ON contacts (tenant_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS contacts_attributes_idx ON contacts USING gin (attributes);
CREATE INDEX IF NOT EXISTS groups_tenant_created_idx ON whatsapp_groups (tenant_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS campaigns_tenant_status_idx ON campaigns (tenant_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS messages_tenant_created_idx ON messages (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_campaign_status_idx ON messages (tenant_id, campaign_id, status) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_delivery_idx ON messages (tenant_id, status, created_at) WHERE status IN ('queued', 'sending');
CREATE INDEX IF NOT EXISTS audit_logs_tenant_created_idx ON audit_logs (tenant_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_set_updated_at ON tenants;
CREATE TRIGGER tenants_set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS whatsapp_connections_set_updated_at ON whatsapp_connections;
CREATE TRIGGER whatsapp_connections_set_updated_at BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS contacts_set_updated_at ON contacts;
CREATE TRIGGER contacts_set_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS whatsapp_groups_set_updated_at ON whatsapp_groups;
CREATE TRIGGER whatsapp_groups_set_updated_at BEFORE UPDATE ON whatsapp_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS message_templates_set_updated_at ON message_templates;
CREATE TRIGGER message_templates_set_updated_at BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS campaigns_set_updated_at ON campaigns;
CREATE TRIGGER campaigns_set_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS messages_set_updated_at ON messages;
CREATE TRIGGER messages_set_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'user_roles', 'sessions', 'refresh_tokens', 'whatsapp_connections', 'contacts', 'whatsapp_groups',
    'group_members', 'media', 'message_templates', 'campaigns', 'messages',
    'campaign_recipients', 'audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    FOR policy_name IN
      SELECT polname FROM pg_policy WHERE polrelid = to_regclass(format('public.%I', table_name))
    LOOP
      EXECUTE format('DROP POLICY %I ON %I', policy_name, table_name);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      table_name
    );
  END LOOP;
END;
$$;

INSERT INTO roles (role_key, description) VALUES
  ('SUPER_ADMIN', 'Platform administration'),
  ('TENANT_ADMIN', 'Tenant administration'),
  ('MANAGER', 'Campaign and team management'),
  ('OPERATOR', 'Messaging and contact operations'),
  ('VIEWER', 'Read-only tenant access')
ON CONFLICT (role_key) DO NOTHING;

INSERT INTO permissions (permission_key, description) VALUES
  ('dashboard.view', 'View dashboard'),
  ('contacts.view', 'View contacts'),
  ('contacts.create', 'Create contacts'),
  ('contacts.edit', 'Edit contacts'),
  ('contacts.delete', 'Delete contacts'),
  ('groups.view', 'View groups'),
  ('groups.sync', 'Synchronize groups'),
  ('messages.send', 'Send messages'),
  ('messages.send_bulk', 'Send bulk messages'),
  ('campaigns.create', 'Create campaigns'),
  ('campaigns.start', 'Start campaigns'),
  ('campaigns.stop', 'Pause or cancel campaigns'),
  ('media.upload', 'Upload media'),
  ('templates.manage', 'Manage templates'),
  ('logs.view', 'View logs'),
  ('reports.view', 'View reports'),
  ('settings.view', 'View settings'),
  ('whatsapp.connect', 'Connect WhatsApp'),
  ('whatsapp.disconnect', 'Disconnect WhatsApp'),
  ('users.manage', 'Manage tenant users'),
  ('billing.view', 'View billing')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.role_key IN ('SUPER_ADMIN', 'TENANT_ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.role_key = 'MANAGER'
  AND permissions.permission_key IN (
    'dashboard.view', 'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
    'groups.view', 'groups.sync', 'messages.send', 'messages.send_bulk', 'campaigns.create',
    'campaigns.start', 'campaigns.stop', 'media.upload', 'templates.manage', 'logs.view',
    'reports.view', 'settings.view', 'whatsapp.connect', 'whatsapp.disconnect', 'billing.view'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.role_key = 'OPERATOR'
  AND permissions.permission_key IN (
    'dashboard.view', 'contacts.view', 'contacts.create', 'contacts.edit', 'groups.view',
    'messages.send', 'media.upload', 'logs.view'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles CROSS JOIN permissions
WHERE roles.role_key = 'VIEWER'
  AND permissions.permission_key IN (
    'dashboard.view', 'contacts.view', 'groups.view', 'logs.view', 'reports.view', 'settings.view'
  )
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (tenant_id, user_id, role_id)
SELECT users.tenant_id, users.id, roles.id
FROM users
JOIN roles ON roles.role_key = CASE upper(coalesce(users.role, ''))
  WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
  WHEN 'TENANT_ADMIN' THEN 'TENANT_ADMIN'
  WHEN 'ADMIN' THEN 'TENANT_ADMIN'
  WHEN 'MANAGER' THEN 'MANAGER'
  WHEN 'OPERATOR' THEN 'OPERATOR'
  ELSE 'VIEWER'
END
ON CONFLICT DO NOTHING;

COMMIT;