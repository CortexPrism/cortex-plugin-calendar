// deno-lint-ignore-file require-await
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { tools } from '../../mod.ts';
import type { PluginContext } from 'cortex/plugins';

const mockContext: PluginContext = {
  pluginId: 'cortex-plugin-calendar',
  pluginDir: '/tmp/plugins/cortex-plugin-calendar',
  state: {
    get: async () => null,
    set: async () => {},
  },
  config: {},
};

function findTool(name: string) {
  return tools.find((t) => t.definition.name === name);
}

Deno.test('calendar_list_events - rejects missing API config', async () => {
  const tool = findTool('calendar_list_events');
  if (!tool) throw new Error('calendar_list_events tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('calendar_list_events - accepts optional params', async () => {
  const tool = findTool('calendar_list_events');
  if (!tool) throw new Error('calendar_list_events tool not found');

  const result = await tool.execute({
    calendar_id: 'primary',
    max_results: 10,
    query: 'standup',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('calendar_create_event - rejects missing required params', async () => {
  const tool = findTool('calendar_create_event');
  if (!tool) throw new Error('calendar_create_event tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'summary');
});

Deno.test('calendar_create_event - rejects missing API config', async () => {
  const tool = findTool('calendar_create_event');
  if (!tool) throw new Error('calendar_create_event tool not found');

  const result = await tool.execute({
    summary: 'Test Meeting',
    start_time: '2025-01-01T09:00:00',
    end_time: '2025-01-01T10:00:00',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('calendar_find_slots - rejects missing required params', async () => {
  const tool = findTool('calendar_find_slots');
  if (!tool) throw new Error('calendar_find_slots tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'required');
});

Deno.test('calendar_find_slots - rejects missing API config', async () => {
  const tool = findTool('calendar_find_slots');
  if (!tool) throw new Error('calendar_find_slots tool not found');

  const result = await tool.execute({
    attendees: 'alice@example.com',
    date: '2025-01-01',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('calendar_update_event - rejects missing required params', async () => {
  const tool = findTool('calendar_update_event');
  if (!tool) throw new Error('calendar_update_event tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'required');
});

Deno.test('calendar_update_event - rejects invalid JSON updates', async () => {
  const tool = findTool('calendar_update_event');
  if (!tool) throw new Error('calendar_update_event tool not found');

  const result = await tool.execute({
    event_id: 'evt123',
    updates: 'not-valid-json',
  }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'valid JSON');
});

Deno.test('calendar_delete_event - rejects missing event_id', async () => {
  const tool = findTool('calendar_delete_event');
  if (!tool) throw new Error('calendar_delete_event tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'event_id');
});

Deno.test('calendar_delete_event - rejects missing API config', async () => {
  const tool = findTool('calendar_delete_event');
  if (!tool) throw new Error('calendar_delete_event tool not found');

  const result = await tool.execute({ event_id: 'evt123' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('calendar_prep_brief - rejects missing event_id', async () => {
  const tool = findTool('calendar_prep_brief');
  if (!tool) throw new Error('calendar_prep_brief tool not found');

  const result = await tool.execute({}, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'event_id');
});

Deno.test('calendar_prep_brief - rejects missing API config', async () => {
  const tool = findTool('calendar_prep_brief');
  if (!tool) throw new Error('calendar_prep_brief tool not found');

  const result = await tool.execute({ event_id: 'evt123' }, mockContext);
  assertEquals(result.success, false);
  assertStringIncludes(result.error, 'not configured');
});

Deno.test('tools array exported', () => {
  assertEquals(tools.length, 6);
  assertEquals(tools[0].definition.name, 'calendar_list_events');
  assertEquals(tools[1].definition.name, 'calendar_create_event');
  assertEquals(tools[2].definition.name, 'calendar_find_slots');
  assertEquals(tools[3].definition.name, 'calendar_update_event');
  assertEquals(tools[4].definition.name, 'calendar_delete_event');
  assertEquals(tools[5].definition.name, 'calendar_prep_brief');
});
