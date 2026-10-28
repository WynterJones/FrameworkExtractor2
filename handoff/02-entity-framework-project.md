<!-- send: editor chat · model: Claude Opus · thinking: Max · wait for: Completed card -->
Make the `framework_project` entity match prd.md §3 exactly.

Context: the import created `framework_project` from src/types.ts. The PRD section "3. Data model" has the full spec.

Build:
- Entity `framework_project`, user_scoped, columns: title (text), source (text, one of ai-interview | voice-note | brain-dump | recorded-session | empty, default "empty"), setup (json: { character_id, voice_id, customer_avatar_id }), state (json: the FrameworkProjectState shape from prd.md §3), archived (boolean, default false).
- id, created_at, updated_at are platform-managed; do not add them.
- Add or alter columns only; never drop data.

Done when: the Tables dashboard shows framework_project with exactly those five columns.

Change only the entity. Do not touch: any file under src/ (from 01).

Report: the schema as it exists now, and an explicit list of anything you did NOT do. If creation fails, report the exact error and stop.
