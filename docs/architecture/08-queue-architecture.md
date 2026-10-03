# 8. Queue Architecture

## Queue layout

The application uses Redis + BullMQ for async work and separate worker processes.

### Required queues

- `message-send`
- `media-processing`
- `campaign-processing`
- `report-generation`
- `whatsapp-events`
- `notification`
- `cleanup`

## Worker separation

```text
API Server       Worker Server       Scheduler         WhatsApp Worker
   |                 |                    |                  |
   +--> enqueue      +--> process jobs   +--> cron jobs    +--> sessions
   |                 |                    |                  |
   +--> webhooks     +--> retry/backoff  +--> triggers     +--> send media
```

## Process flow

1. API receives a bulk message or campaign request.
2. It creates a job with metadata and tenant context.
3. Redis stores the queued job and deduplicates processing.
4. Worker processes retries, rate-limits, and status updates.
5. WhatsApp provider is invoked via a tenant-scoped abstraction.
6. Message results and logs are stored in PostgreSQL.
7. Real-time events are broadcast to the correct tenant only.

## Design rules

- No synchronous sending of thousands of messages from the HTTP request path.
- Retry logic with exponential backoff.
- Dead-letter queue pattern for persistent failures.
- Separate queues for media work, reports, and campaign progress.
- Tenant-aware deduplication and concurrency.
- Use requestId across all job events and logs.
