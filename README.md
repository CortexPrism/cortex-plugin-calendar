# Calendar Orchestrator

Read/write Google Calendar, schedule meetings, and find open slots.

## Installation

```bash
cortex plugin install github:CortexPrism/cortex-plugin-calendar
```

## Tools

### calendar_list_events

List calendar events.

- `calendar_id` (string, default: "primary") — Calendar ID
- `time_min` (string, optional) — Start time (ISO 8601)
- `time_max` (string, optional) — End time (ISO 8601)
- `max_results` (number, default: 20) — Maximum results
- `query` (string, optional) — Free text search

### calendar_create_event

Create a calendar event.

- `summary` (string, required) — Event title
- `start_time` (string, required) — Start time (ISO 8601)
- `end_time` (string, required) — End time (ISO 8601)
- `description` (string, optional) — Event description
- `attendees` (string, optional) — Comma-separated emails
- `location` (string, optional) — Event location

### calendar_find_slots

Find open slots across attendees.

- `attendees` (string, required) — Comma-separated emails
- `date` (string, required) — Date (YYYY-MM-DD)
- `duration_minutes` (number, default: 30) — Meeting duration
- `start_hour` (number, default: 9) — Start of working hours
- `end_hour` (number, default: 17) — End of working hours

### calendar_update_event

Update an existing event.

- `event_id` (string, required) — Event ID
- `updates` (string, required) — JSON of fields to update

### calendar_delete_event

Delete an event.

- `event_id` (string, required) — Event ID
- `notify_attendees` (boolean, default: true) — Notify attendees

### calendar_prep_brief

Prep a meeting brief.

- `event_id` (string, required) — Event ID

## Configuration

| Field                | Type   | Required | Description                                   |
| -------------------- | ------ | -------- | --------------------------------------------- |
| calendarClientId     | text   | Yes      | Google Cloud OAuth 2.0 client ID              |
| calendarClientSecret | secret | Yes      | Google Cloud OAuth 2.0 client secret          |
| calendarRefreshToken | secret | Yes      | Calendar API refresh token                    |
| defaultDuration      | number | No       | Default event duration (minutes, default: 30) |

## License

MIT
