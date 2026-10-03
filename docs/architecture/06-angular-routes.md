# 6. Angular Route Structure

## Route map

```text
/login
/register
/forgot-password
/dashboard
/contacts
/contacts/new
/contacts/:id
/groups
/groups/:id
/messages/send
/messages/bulk
/campaigns
/campaigns/new
/campaigns/:id
/media
/reports/messages
/reports/campaigns
/reports/delivery
/reports/usage
/logs/messages
/logs/system
/logs/audit
/whatsapp
/whatsapp/connect
/settings/profile
/settings/users
/settings/roles
/settings/security
/settings/api
/settings/notifications
```

## Frontend architecture

The Angular app is structured around independent feature modules using standalone components and route-based lazy loading. Shared components are reused for forms, tables, pagination, cards, dialogs, toasts, and status badges.

## Route principles

- Public routes: login, register, forgot password
- Protected routes: dashboard, campaign, contacts, groups, reports, settings
- Route guards verify authentication and authorization status
- Interceptors attach auth headers and normalize API errors
- Signals are used for UI state management where lightweight reactive updates are required

## Shared UI components

- DataTable
- Pagination
- SearchBox
- FilterPanel
- ConfirmDialog
- Toast
- LoadingSpinner
- EmptyState
- ErrorState
- FileUploader
- MediaPreview
- StatusBadge
- StatsCard
- ChartCard
- Modal
- Drawer
