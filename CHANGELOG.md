# Changelog

## [Unreleased]

### Added
- Unit test suite for all tools
- Structured logging via ctx.logger in lifecycle hooks

### Changed
- Renamed manifest file from `cortex.json` to `manifest.json` for consistency with Cortex standard
- Standardized UI section structure to `ui.settings` format
- Normalized parameter naming: `defaultValue` → `default`, `options` → `enum`
- Added `homepage` field with repository URL
- Added `dependencies` field to manifest

## [1.0.1] — 2026-06-15

### Added
- Initial release
## [1.0.1] — 2026-06-17

### Fixed

- Replaced non-existent `cortex/plugins` import with local `types.ts` containing inline type definitions
- Removed broken `cortex/plugins` import map from `deno.json`
- Fixed test files with complete mock contexts (`state.delete`, `state.list`, `config.get/set/getAll`, `logger`, `host`)
- Rewrote scaffold test files to test actual plugin tools instead of template leftovers
- Added `defaultValue` and `default` fields to `ToolParam` type for compatibility

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-15

### Added

- Initial release of cortex-plugin-calendar
- `calendar_list_events` — List calendar events
- `calendar_create_event` — Create a calendar event
- `calendar_find_slots` — Find open meeting slots across attendees
- `calendar_update_event` — Update an existing event
- `calendar_delete_event` — Delete an event
- `calendar_prep_brief` — Prep a meeting brief
- Google Calendar API OAuth 2.0 configuration UI
