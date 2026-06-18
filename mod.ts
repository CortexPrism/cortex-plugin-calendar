import type { PluginContext, Tool, ToolCallResult, ToolContext } from './types.ts';

let pluginConfig: Record<string, unknown> = {};

export async function onLoad(ctx: PluginContext): Promise<void> {
  ctx.logger.info(`[cortex-plugin-calendar] Loaded`);
  pluginConfig = await ctx.config.get() as Record<string, unknown>;
}

export async function onUnload(_ctx: PluginContext): Promise<void> {}

const calendarListEventsTool: Tool = {
  definition: {
    name: 'calendar_list_events',
    description: 'List calendar events',
    params: [
      {
        name: 'calendar_id',
        type: 'string',
        description: 'Calendar ID',
        required: false,
        default: 'primary',
      },
      {
        name: 'time_min',
        type: 'string',
        description: 'Start time in ISO 8601 format',
        required: false,
      },
      {
        name: 'time_max',
        type: 'string',
        description: 'End time in ISO 8601 format',
        required: false,
      },
      {
        name: 'max_results',
        type: 'number',
        description: 'Maximum number of events to return',
        required: false,
        default: 20,
      },
      { name: 'query', type: 'string', description: 'Free text search query', required: false },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const calendarId = (args.calendar_id as string) ?? 'primary';
      const maxResults = (args.max_results as number) ?? 20;

      const refreshToken = pluginConfig.calendarRefreshToken as string;
      if (!refreshToken) {
        return {
          toolName: 'calendar_list_events',
          success: false,
          output: '',
          error: 'Google Calendar API not configured. Set calendarRefreshToken.',
          durationMs: Date.now() - start,
        };
      }

      const params = new URLSearchParams();
      params.set('maxResults', String(maxResults));
      if (args.time_min) params.set('timeMin', args.time_min as string);
      if (args.time_max) params.set('timeMax', args.time_max as string);
      if (args.query) params.set('q', args.query as string);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${
          encodeURIComponent(calendarId)
        }/events?${params.toString()}`,
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      if (!response.ok) {
        return {
          toolName: 'calendar_list_events',
          success: false,
          output: '',
          error: `Calendar API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const data = await response.json();
      return {
        toolName: 'calendar_list_events',
        success: true,
        output: JSON.stringify(data),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'calendar_list_events',
        success: false,
        output: '',
        error: `Failed to list events: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const calendarCreateEventTool: Tool = {
  definition: {
    name: 'calendar_create_event',
    description: 'Create a calendar event',
    params: [
      { name: 'summary', type: 'string', description: 'Event title', required: true },
      {
        name: 'start_time',
        type: 'string',
        description: 'Start time in ISO 8601 format',
        required: true,
      },
      {
        name: 'end_time',
        type: 'string',
        description: 'End time in ISO 8601 format',
        required: true,
      },
      { name: 'description', type: 'string', description: 'Event description', required: false },
      {
        name: 'attendees',
        type: 'string',
        description: 'Comma-separated email addresses of attendees',
        required: false,
      },
      { name: 'location', type: 'string', description: 'Event location', required: false },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const summary = args.summary as string;
      const startTime = args.start_time as string;
      const endTime = args.end_time as string;

      if (!summary || !startTime || !endTime) {
        return {
          toolName: 'calendar_create_event',
          success: false,
          output: '',
          error: 'summary, start_time, and end_time are required',
          durationMs: Date.now() - start,
        };
      }

      const refreshToken = pluginConfig.calendarRefreshToken as string;
      if (!refreshToken) {
        return {
          toolName: 'calendar_create_event',
          success: false,
          output: '',
          error: 'Google Calendar API not configured',
          durationMs: Date.now() - start,
        };
      }

      const calendarId = 'primary';
      const eventBody: Record<string, unknown> = {
        summary,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
      };

      if (args.description) eventBody.description = args.description;
      if (args.location) eventBody.location = args.location;
      if (args.attendees) {
        eventBody.attendees = (args.attendees as string).split(',').map((e) => ({
          email: e.trim(),
        }));
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${refreshToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        },
      );

      if (!response.ok) {
        return {
          toolName: 'calendar_create_event',
          success: false,
          output: '',
          error: `Calendar API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const data = await response.json();
      return {
        toolName: 'calendar_create_event',
        success: true,
        output: JSON.stringify(data),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'calendar_create_event',
        success: false,
        output: '',
        error: `Failed to create event: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const calendarFindSlotsTool: Tool = {
  definition: {
    name: 'calendar_find_slots',
    description: 'Find open slots across attendees',
    params: [
      {
        name: 'attendees',
        type: 'string',
        description: 'Comma-separated email addresses of attendees',
        required: true,
      },
      { name: 'date', type: 'string', description: 'Date in YYYY-MM-DD format', required: true },
      {
        name: 'duration_minutes',
        type: 'number',
        description: 'Meeting duration in minutes',
        required: false,
        default: 30,
      },
      {
        name: 'start_hour',
        type: 'number',
        description: 'Start of working hours',
        required: false,
        default: 9,
      },
      {
        name: 'end_hour',
        type: 'number',
        description: 'End of working hours',
        required: false,
        default: 17,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const attendees = args.attendees as string;
      const date = args.date as string;

      if (!attendees || !date) {
        return {
          toolName: 'calendar_find_slots',
          success: false,
          output: '',
          error: 'attendees and date are required',
          durationMs: Date.now() - start,
        };
      }

      const refreshToken = pluginConfig.calendarRefreshToken as string;
      if (!refreshToken) {
        return {
          toolName: 'calendar_find_slots',
          success: false,
          output: '',
          error: 'Google Calendar API not configured',
          durationMs: Date.now() - start,
        };
      }

      const durationMinutes = (args.duration_minutes as number) ?? 30;
      const startHour = (args.start_hour as number) ?? 9;
      const endHour = (args.end_hour as number) ?? 17;

      const timeMin = `${date}T${String(startHour).padStart(2, '0')}:00:00`;
      const timeMax = `${date}T${String(endHour).padStart(2, '0')}:00:00`;

      const slots: Array<{ start: string; end: string }> = [];
      const slotCount = ((endHour - startHour) * 60) / durationMinutes;

      for (let i = 0; i < slotCount; i++) {
        const slotStartMin = (startHour * 60) + (i * durationMinutes);
        const slotEndMin = slotStartMin + durationMinutes;
        const slotStartH = Math.floor(slotStartMin / 60);
        const slotStartM = slotStartMin % 60;
        const slotEndH = Math.floor(slotEndMin / 60);
        const slotEndM = slotEndMin % 60;
        slots.push({
          start: `${date}T${String(slotStartH).padStart(2, '0')}:${
            String(slotStartM).padStart(2, '0')
          }:00`,
          end: `${date}T${String(slotEndH).padStart(2, '0')}:${
            String(slotEndM).padStart(2, '0')
          }:00`,
        });
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}`,
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      if (!response.ok) {
        return {
          toolName: 'calendar_find_slots',
          success: false,
          output: '',
          error: `Calendar API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const data = await response.json();
      const bookedEvents = (data.items || []) as Array<Record<string, unknown>>;

      const busySlots = bookedEvents
        .filter((e) => e.start && e.end)
        .map((e) => ({
          start: (e.start as Record<string, string>).dateTime ||
            (e.start as Record<string, string>).date,
          end: (e.end as Record<string, string>).dateTime || (e.end as Record<string, string>).date,
        }));

      const openSlots = slots.filter((slot) =>
        !busySlots.some((busy) =>
          (slot.start >= busy.start && slot.start < busy.end) ||
          (slot.end > busy.start && slot.end <= busy.end) ||
          (slot.start <= busy.start && slot.end >= busy.end)
        )
      );

      return {
        toolName: 'calendar_find_slots',
        success: true,
        output: JSON.stringify({
          date,
          duration_minutes: durationMinutes,
          open_slots: openSlots,
          total_slots_checked: slots.length,
        }),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'calendar_find_slots',
        success: false,
        output: '',
        error: `Failed to find slots: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const calendarUpdateEventTool: Tool = {
  definition: {
    name: 'calendar_update_event',
    description: 'Update an existing calendar event',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID to update', required: true },
      {
        name: 'updates',
        type: 'string',
        description: 'JSON string of fields to update',
        required: true,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const eventId = args.event_id as string;
      const updates = args.updates as string;

      if (!eventId || !updates) {
        return {
          toolName: 'calendar_update_event',
          success: false,
          output: '',
          error: 'event_id and updates are required',
          durationMs: Date.now() - start,
        };
      }

      const refreshToken = pluginConfig.calendarRefreshToken as string;
      if (!refreshToken) {
        return {
          toolName: 'calendar_update_event',
          success: false,
          output: '',
          error: 'Google Calendar API not configured',
          durationMs: Date.now() - start,
        };
      }

      let updateBody: Record<string, unknown>;
      try {
        updateBody = JSON.parse(updates);
      } catch {
        return {
          toolName: 'calendar_update_event',
          success: false,
          output: '',
          error: 'updates must be valid JSON',
          durationMs: Date.now() - start,
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${
          encodeURIComponent(eventId)
        }`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${refreshToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(updateBody),
        },
      );

      if (!response.ok) {
        return {
          toolName: 'calendar_update_event',
          success: false,
          output: '',
          error: `Calendar API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const data = await response.json();
      return {
        toolName: 'calendar_update_event',
        success: true,
        output: JSON.stringify(data),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'calendar_update_event',
        success: false,
        output: '',
        error: `Failed to update event: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const calendarDeleteEventTool: Tool = {
  definition: {
    name: 'calendar_delete_event',
    description: 'Delete a calendar event',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID to delete', required: true },
      {
        name: 'notify_attendees',
        type: 'boolean',
        description: 'Whether to notify attendees',
        required: false,
        default: true,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const eventId = args.event_id as string;
      if (!eventId) {
        return {
          toolName: 'calendar_delete_event',
          success: false,
          output: '',
          error: 'event_id is required',
          durationMs: Date.now() - start,
        };
      }

      const refreshToken = pluginConfig.calendarRefreshToken as string;
      if (!refreshToken) {
        return {
          toolName: 'calendar_delete_event',
          success: false,
          output: '',
          error: 'Google Calendar API not configured',
          durationMs: Date.now() - start,
        };
      }

      const notifyAttendees = (args.notify_attendees as boolean) ?? true;
      const params = new URLSearchParams();
      params.set('sendUpdates', notifyAttendees ? 'all' : 'none');

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${
          encodeURIComponent(eventId)
        }?${params.toString()}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
      );

      if (!response.ok && response.status !== 204) {
        return {
          toolName: 'calendar_delete_event',
          success: false,
          output: '',
          error: `Calendar API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      return {
        toolName: 'calendar_delete_event',
        success: true,
        output: `Event ${eventId} deleted successfully.`,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'calendar_delete_event',
        success: false,
        output: '',
        error: `Failed to delete event: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

const calendarPrepBriefTool: Tool = {
  definition: {
    name: 'calendar_prep_brief',
    description: 'Prep a meeting brief from memory',
    params: [
      {
        name: 'event_id',
        type: 'string',
        description: 'Event ID to prepare brief for',
        required: true,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolCallResult> => {
    const start = Date.now();
    try {
      const eventId = args.event_id as string;
      if (!eventId) {
        return {
          toolName: 'calendar_prep_brief',
          success: false,
          output: '',
          error: 'event_id is required',
          durationMs: Date.now() - start,
        };
      }

      const refreshToken = pluginConfig.calendarRefreshToken as string;
      if (!refreshToken) {
        return {
          toolName: 'calendar_prep_brief',
          success: false,
          output: '',
          error: 'Google Calendar API not configured',
          durationMs: Date.now() - start,
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${
          encodeURIComponent(eventId)
        }`,
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      if (!response.ok) {
        return {
          toolName: 'calendar_prep_brief',
          success: false,
          output: '',
          error: `Calendar API error: ${response.status}`,
          durationMs: Date.now() - start,
        };
      }

      const event = await response.json();
      const brief = {
        title: event.summary || 'Untitled Meeting',
        description: event.description || '',
        location: event.location || '',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        attendees: (event.attendees || []).map((a: Record<string, string>) => a.email),
      };

      return {
        toolName: 'calendar_prep_brief',
        success: true,
        output: JSON.stringify(brief),
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        toolName: 'calendar_prep_brief',
        success: false,
        output: '',
        error: `Failed to prep brief: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: Date.now() - start,
      };
    }
  },
};

export const tools: Tool[] = [
  calendarListEventsTool,
  calendarCreateEventTool,
  calendarFindSlotsTool,
  calendarUpdateEventTool,
  calendarDeleteEventTool,
  calendarPrepBriefTool,
];
