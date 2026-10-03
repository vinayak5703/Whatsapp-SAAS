# 2. ER Diagram Description

## High-level relationships

```text
TENANTS
  |--< USERS
  |--< WHATSAPP_CONNECTIONS
  |--< CONTACTS
  |--< TAGS
  |--< GROUPS
  |--< CAMPAIGNS
  |--< MESSAGES
  |--< MEDIA
  |--< TEMPLATES
  |--< AUDIT_LOGS
  |--< SYSTEM_LOGS
  |--< API_KEYS
  |--< WEBHOOKS
  |--< NOTIFICATIONS
  |--< SUBSCRIPTIONS
  |--< USAGE_RECORDS

USERS
  |--< REFRESH_TOKENS
  |--< SESSIONS
  |--< USER_ROLES

ROLES
  |--< USER_ROLES
  |--< ROLE_PERMISSIONS

PERMISSIONS
  |--< ROLE_PERMISSIONS

CONTACTS
  |--< CONTACT_TAGS
  |--< CAMPAIGN_RECIPIENTS
  |--< MESSAGES

GROUPS
  |--< GROUP_MEMBERS
  |--< CAMPAIGN_RECIPIENTS
  |--< MESSAGES

CAMPAIGNS
  |--< CAMPAIGN_RECIPIENTS
  |--< MESSAGES
  |--< SCHEDULED_JOBS

MESSAGES
  |--< MESSAGE_STATUS_HISTORY

WHATSAPP_CONNECTIONS
  |--< WHATSAPP_EVENTS
```

## Required key tables

- tenants
- users
- roles
- permissions
- role_permissions
- user_roles
- refresh_tokens
- sessions
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

## Important constraints

- All tenant-owned tables must contain `tenant_id`.
- Use `UUID` identities.
- Store metadata outside PostgreSQL whenever it is large or binary.
- Use audit tables for sensitive actions.
- Use soft-delete fields where business data should remain recoverable.
