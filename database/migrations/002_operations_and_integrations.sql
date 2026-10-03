BEGIN;

CREATE TABLE IF NOT EXISTS whatsapp_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  connection_id UUID NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_id VARCHAR(120),
  details JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, connection_id) REFERENCES whatsapp_connections(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(80) NOT NULL,
  color CHAR(7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS contact_tags (
  tenant_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, contact_id, tag_id),
  FOREIGN KEY (tenant_id, contact_id) REFERENCES contacts(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, tag_id) REFERENCES tags(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  message_id UUID NOT NULL,
  status VARCHAR(24) NOT NULL,
  error_code VARCHAR(100),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, message_id) REFERENCES messages(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  campaign_id UUID NOT NULL,
  run_at TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'queued', 'running', 'completed', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error_code VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, campaign_id) REFERENCES campaigns(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  level VARCHAR(12) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  message VARCHAR(1000) NOT NULL,
  request_id VARCHAR(120),
  context JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(120) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  secret_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  target_url TEXT NOT NULL,
  secret_ciphertext BYTEA NOT NULL,
  event_types TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID,
  type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
  plan VARCHAR(40) NOT NULL CHECK (plan IN ('FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  provider_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  metric VARCHAR(80) NOT NULL,
  quantity BIGINT NOT NULL CHECK (quantity >= 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, metric, period_start, period_end)
);

DROP TRIGGER IF EXISTS scheduled_jobs_set_updated_at ON scheduled_jobs;
CREATE TRIGGER scheduled_jobs_set_updated_at BEFORE UPDATE ON scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS webhooks_set_updated_at ON webhooks;
CREATE TRIGGER webhooks_set_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS whatsapp_events_tenant_time_idx ON whatsapp_events (tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS contact_tags_tenant_tag_idx ON contact_tags (tenant_id, tag_id, contact_id);
CREATE INDEX IF NOT EXISTS message_status_timeline_idx ON message_status_history (tenant_id, message_id, occurred_at);
CREATE INDEX IF NOT EXISTS scheduled_jobs_due_idx ON scheduled_jobs (run_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS system_logs_tenant_time_idx ON system_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS api_keys_active_idx ON api_keys (tenant_id, key_prefix) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications (tenant_id, user_id, created_at DESC) WHERE read_at IS NULL;

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'whatsapp_events', 'tags', 'contact_tags', 'message_status_history', 'scheduled_jobs',
    'system_logs', 'api_keys', 'webhooks', 'notifications', 'subscriptions', 'usage_records'
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

COMMIT;