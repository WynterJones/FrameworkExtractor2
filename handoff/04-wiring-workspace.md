<!-- send: editor chat · model: Claude Opus · thinking: Smart · wait for: Completed card -->
Wire both screens to the real entity and endpoints, replacing the placeholder data.

Context: src/pages/Index.tsx and src/pages/Workspace.tsx currently read PLACEHOLDER_PROJECTS from src/lib/placeholder.ts and every action shows a "Stubbed: …" toast (from 01). prd.md §2 has every action and §4 the endpoints.

Build:
- src/lib/framework/storage.ts: listProjects (overskill.entities.framework_project.list, sort -updated_at, archived false only), getProject, createProject (title "Untitled Framework", source "empty", setup copied from the most recently updated project when all three ids are set, state = initialFrameworkState(), archived false), updateProject(id, patch), archiveProject(id) (update archived: true).
- Index: load with listProjects; New Framework → createProject then navigate; Delete confirm → archiveProject; search filters by title on the client.
- Workspace: load with getProject; autosave title / setup / state with a 1 s debounce and a flush on unmount via updateProject; the save chip reflects Saving… / Saved / Save failed · Retry.
- FrameworkChat: replace the placeholder reply with fetch("/api/ai/framework-chat", { method: "POST", body: { project_id, messages, language: "English" } }) reading the NDJSON stream; strip <fe-state> from the visible text with stripFeState on every delta; on done, extractFeStatePatches + onStatePatch; detectGenerationFailure drives the two error messages in prd.md §2.2; Stop aborts the fetch and keeps the partial text; Try again re-sends the last turn without duplicating the user bubble.
- Regenerate → fetch("/api/ai/framework-regenerate") and replace phase/framework/teaching, then save.
- Download → Markdown uses buildFrameworkBriefMarkdown (src/lib/framework/brief.ts). PowerPoint stays a toast "PowerPoint export is coming" for v1.
- Delete src/lib/placeholder.ts and any remaining mock file (src/lib/mock/*).

Done when: creating a framework, pressing Start, and answering the Anchor question fills Stage 1 on the right from the real model, and a reload shows the same thread and framework.

Change only src/pages/Index.tsx, src/pages/Workspace.tsx, src/components/framework/FrameworkChat.tsx and src/lib/framework/storage.ts. Do not touch: /api/ai/framework-chat (03b), /api/ai/framework-regenerate (03c), src/lib/framework/prompts.ts (03a), the framework_project entity (02), src/index.css and src/components/ui/* (01).

Report: the diff per file and an explicit list of anything you did NOT do. If an endpoint returns an error, surface it in the UI exactly and stop; do not add fallback content.
